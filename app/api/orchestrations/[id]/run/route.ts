import { NextResponse } from 'next/server';
import { getOwner } from '@/lib/data';
import { supabaseServer } from '@/lib/supabase';
import { runOrchestrationStep } from '@/lib/claude';
import type { OrchestrationStep } from '@/lib/types';

type StepState = {
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
  output?: unknown;
  error?: string;
  started_at?: string;
  ended_at?: string;
  duration_ms?: number;
};

async function executeStep(
  step: OrchestrationStep,
  input: unknown,
  previousOutput: unknown
): Promise<{ output: unknown; error: string | null }> {
  try {
    if (step.runner_type === 'webhook') {
      const url = step.config?.webhook_url;
      if (!url) throw new Error('Missing webhook_url');

      let body = input;
      if (step.config?.input_template && previousOutput) {
        const template = step.config.input_template
          .replace('{{previous_output}}', JSON.stringify(previousOutput))
          .replace('{{input}}', JSON.stringify(input));
        try {
          body = JSON.parse(template);
        } catch {
          body = { template_result: template };
        }
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text);
      return { output: { raw: text }, error: null };
    }

    if (step.runner_type === 'claude' || step.runner_type === 'agent') {
      if (!process.env.ANTHROPIC_API_KEY) {
        return {
          output: { mock: `[Demo] Step "${step.name}" would run with Claude`, input },
          error: null
        };
      }

      const taskDescription = step.config?.task_description ||
        `Execute task: ${step.name}. ${step.description || ''}`;

      const output = await runOrchestrationStep(
        step.name,
        taskDescription,
        input,
        previousOutput
      );

      return { output: { text: output }, error: null };
    }

    if (step.runner_type === 'condition') {
      const condition = step.config?.condition || 'true';
      // Simple condition evaluation: check if previous output contains a keyword
      const prevStr = JSON.stringify(previousOutput).toLowerCase();
      const condLower = condition.toLowerCase();
      const result = prevStr.includes(condLower) || condition === 'true';
      return { output: { condition_result: result, condition, evaluated_against: prevStr.slice(0, 100) }, error: null };
    }

    throw new Error(`Unsupported step runner type: ${step.runner_type}`);
  } catch (err) {
    return { output: null, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  let sb;
  try {
    sb = supabaseServer();
  } catch {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const ownerId = getOwner();

  // Fetch orchestration
  const { data: orch } = await sb
    .from('orchestrations')
    .select('*')
    .eq('owner_id', ownerId)
    .eq('id', params.id)
    .single();

  if (!orch) return NextResponse.json({ error: 'Orchestration not found' }, { status: 404 });

  const body = await req.json() as { input?: unknown };
  const input = body.input ?? {};
  const steps: OrchestrationStep[] = orch.steps ?? [];

  const started_at = new Date();

  // Create run record
  const { data: run, error: runErr } = await sb
    .from('orchestration_runs')
    .insert({
      owner_id: ownerId,
      orchestration_id: orch.id,
      status: 'running',
      steps_state: {},
      input,
      started_at: started_at.toISOString()
    })
    .select('*')
    .single();

  if (runErr || !run) {
    return NextResponse.json({ error: runErr?.message ?? 'Run create failed' }, { status: 400 });
  }

  // Execute steps
  const stepsState: Record<string, StepState> = {};
  let lastOutput: unknown = input;
  let overallStatus: 'success' | 'failed' = 'success';
  let overallError: string | null = null;

  const sortedSteps = [...steps].sort((a, b) => a.order_index - b.order_index);

  for (const step of sortedSteps) {
    const stepStart = new Date();
    stepsState[step.id] = { status: 'running', started_at: stepStart.toISOString() };

    // Update run state in DB mid-execution
    await sb.from('orchestration_runs').update({ steps_state: stepsState }).eq('id', run.id);

    const { output, error } = await executeStep(step, input, lastOutput);
    const stepEnd = new Date();
    const stepDuration = stepEnd.getTime() - stepStart.getTime();

    if (error) {
      stepsState[step.id] = {
        status: 'failed',
        error,
        started_at: stepStart.toISOString(),
        ended_at: stepEnd.toISOString(),
        duration_ms: stepDuration
      };
      overallStatus = 'failed';
      overallError = `Step "${step.name}" failed: ${error}`;

      if (orch.execution_mode === 'sequential') break;
    } else {
      stepsState[step.id] = {
        status: 'success',
        output,
        started_at: stepStart.toISOString(),
        ended_at: stepEnd.toISOString(),
        duration_ms: stepDuration
      };
      lastOutput = output;
    }
  }

  const ended_at = new Date();
  const totalDuration = ended_at.getTime() - started_at.getTime();

  // Finalize run
  await sb.from('orchestration_runs').update({
    status: overallStatus,
    steps_state: stepsState,
    final_output: lastOutput,
    ended_at: ended_at.toISOString(),
    duration_ms: totalDuration,
    error: overallError
  }).eq('id', run.id);

  // Update orchestration stats
  await sb.from('orchestrations').update({
    last_run_at: ended_at.toISOString(),
    last_run_status: overallStatus,
    total_runs: (orch.total_runs ?? 0) + 1,
    updated_at: ended_at.toISOString()
  }).eq('id', orch.id);

  const { data: finalRun } = await sb.from('orchestration_runs').select('*').eq('id', run.id).single();

  return NextResponse.json(finalRun);
}
