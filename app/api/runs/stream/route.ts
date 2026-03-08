import { getOwner } from '@/lib/data';
import { supabaseServer } from '@/lib/supabase';

// SSE endpoint: GET /api/runs/stream?runId=xxx&type=agent|orchestration
// Polls the DB every second and streams status updates to the client
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const runId = searchParams.get('runId');
  const type = searchParams.get('type') ?? 'agent';

  if (!runId) {
    return new Response('runId is required', { status: 400 });
  }

  let sb;
  try {
    sb = supabaseServer();
  } catch {
    return new Response('Supabase not configured', { status: 503 });
  }

  const ownerId = getOwner();
  const table = type === 'orchestration' ? 'orchestration_runs' : 'runs';

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        const chunk = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(chunk));
      };

      send({ type: 'connected', runId });

      let lastStatus: string | null = null;
      let pollCount = 0;
      const maxPolls = 120; // 2 minute max

      const poll = async () => {
        try {
          const { data: run } = await sb
            .from(table)
            .select('*')
            .eq('owner_id', ownerId)
            .eq('id', runId)
            .single();

          if (!run) {
            send({ type: 'error', message: 'Run not found' });
            controller.close();
            return;
          }

          // Always send an update if status changed or first poll
          if (run.status !== lastStatus || pollCount === 0) {
            lastStatus = run.status;
            send({ type: 'update', run });
          }

          // For orchestrations, also send step state changes
          if (type === 'orchestration' && run.steps_state) {
            send({ type: 'steps_update', steps_state: run.steps_state });
          }

          pollCount++;

          const isDone = run.status === 'success' || run.status === 'failed' || run.status === 'cancelled';

          if (isDone || pollCount >= maxPolls) {
            send({ type: 'done', run });
            controller.close();
          } else {
            setTimeout(poll, 1000);
          }
        } catch (err) {
          send({ type: 'error', message: err instanceof Error ? err.message : 'Poll failed' });
          controller.close();
        }
      };

      poll();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    }
  });
}
