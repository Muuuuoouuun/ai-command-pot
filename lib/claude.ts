import Anthropic from '@anthropic-ai/sdk';
import { McpHttpClient, McpTool } from './mcp-client';

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export type ClaudeRunnerConfig = {
  system_prompt?: string;
  model?: string;
  max_tokens?: number;
};

export type CommandAnalysis = {
  intent: 'run_agent' | 'create_memo' | 'toggle_automation' | 'check_status' | 'analyze_data' | 'general_query';
  summary: string;
  action_plan: string[];
  suggested_response: string;
  requires_confirmation: boolean;
  extracted_params?: Record<string, unknown>;
};

export async function processCommandWithClaude(
  userInput: string,
  context: {
    agents?: Array<{ id: string; name: string; description?: string; runner_type: string }>;
    automations?: Array<{ id: string; name: string; is_active: boolean; platform: string }>;
    recentRuns?: Array<{ id: string; status: string; started_at: string }>;
  }
): Promise<CommandAnalysis> {
  const contextBlock = buildContextBlock(context);

  const response = await anthropic.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 2048,
    thinking: { type: 'adaptive' },
    system: `You are an intelligent AI orchestration assistant for a personal AI control center.
You help users manage AI agents, automations, subscriptions, and workflows.

Your role is to analyze user commands and determine:
1. The user's intent
2. What action should be taken
3. What parameters are needed
4. Whether confirmation is required

Always respond in JSON format matching the CommandAnalysis schema.
Be concise, practical, and action-oriented. Support both Korean and English input.`,
    messages: [
      {
        role: 'user',
        content: `User command: "${userInput}"

Current system context:
${contextBlock}

Analyze this command and respond with a JSON object matching this schema:
{
  "intent": "run_agent" | "create_memo" | "toggle_automation" | "check_status" | "analyze_data" | "general_query",
  "summary": "One-line summary of what the user wants",
  "action_plan": ["Step 1", "Step 2", "..."],
  "suggested_response": "Friendly response to show the user",
  "requires_confirmation": boolean,
  "extracted_params": { optional parameters extracted from the command }
}`
      }
    ]
  });

  const textBlock = response.content.find(b => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  try {
    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in response');
    return JSON.parse(jsonMatch[0]) as CommandAnalysis;
  } catch {
    return {
      intent: 'general_query',
      summary: userInput,
      action_plan: ['Process the request'],
      suggested_response: textBlock.text,
      requires_confirmation: false
    };
  }
}

function buildContextBlock(context: {
  agents?: Array<{ id: string; name: string; description?: string; runner_type: string }>;
  automations?: Array<{ id: string; name: string; is_active: boolean; platform: string }>;
  recentRuns?: Array<{ id: string; status: string; started_at: string }>;
}): string {
  const parts: string[] = [];

  if (context.agents?.length) {
    parts.push(`Available agents (${context.agents.length}):`);
    context.agents.slice(0, 10).forEach(a => {
      parts.push(`  - ${a.name} [${a.runner_type}]${a.description ? ': ' + a.description : ''}`);
    });
  }

  if (context.automations?.length) {
    parts.push(`Automations (${context.automations.length}):`);
    context.automations.slice(0, 10).forEach(a => {
      parts.push(`  - ${a.name} [${a.platform}] ${a.is_active ? '(active)' : '(inactive)'}`);
    });
  }

  if (context.recentRuns?.length) {
    parts.push(`Recent runs (${context.recentRuns.length}):`);
    context.recentRuns.slice(0, 5).forEach(r => {
      parts.push(`  - ${r.id.slice(0, 8)} [${r.status}] at ${r.started_at}`);
    });
  }

  return parts.length > 0 ? parts.join('\n') : 'No context available';
}

export async function runClaudeAgent(
  agentName: string,
  systemPrompt: string,
  userInput: unknown,
  model = 'claude-opus-4-6',
  maxTokens = 4096
): Promise<{ output: string; inputTokens: number; outputTokens: number }> {
  const inputStr = typeof userInput === 'string' ? userInput : JSON.stringify(userInput, null, 2);

  const stream = anthropic.messages.stream({
    model,
    max_tokens: maxTokens,
    thinking: { type: 'adaptive' },
    system: systemPrompt || `You are ${agentName}, a specialized AI agent. Execute the given task thoroughly and return structured results.`,
    messages: [{ role: 'user', content: inputStr }]
  });

  const message = await stream.finalMessage();
  const textContent = message.content
    .filter(b => b.type === 'text')
    .map(b => (b as Anthropic.TextBlock).text)
    .join('\n');

  return {
    output: textContent,
    inputTokens: message.usage.input_tokens,
    outputTokens: message.usage.output_tokens
  };
}

/**
 * Runs a Claude agent with MCP tool support.
 * Fetches available tools from provided MCP clients, then drives an agentic
 * loop: Claude → tool_use → MCP call → tool_result → Claude → … until
 * stop_reason is 'end_turn' (or max 10 rounds).
 */
export async function runClaudeAgentWithMcp(
  agentName: string,
  systemPrompt: string,
  userInput: unknown,
  mcpClients: McpHttpClient[],
  model = 'claude-opus-4-6',
  maxTokens = 4096
): Promise<{ output: string; inputTokens: number; outputTokens: number }> {
  const inputStr = typeof userInput === 'string' ? userInput : JSON.stringify(userInput, null, 2);

  // Collect tools from all MCP clients, mapping tool name → client
  const allTools: McpTool[] = [];
  const clientByTool = new Map<string, McpHttpClient>();
  for (const client of mcpClients) {
    try {
      const tools = await client.listTools();
      for (const tool of tools) {
        allTools.push(tool);
        clientByTool.set(tool.name, client);
      }
    } catch { /* skip unreachable servers */ }
  }

  const anthropicTools = McpHttpClient.toAnthropicTools(allTools);

  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: inputStr },
  ];

  let totalInput = 0;
  let totalOutput = 0;
  let finalText = '';

  for (let round = 0; round < 10; round++) {
    const response = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      system: systemPrompt || `You are ${agentName}, a specialized AI agent. Execute the given task thoroughly.`,
      ...(anthropicTools.length > 0 ? { tools: anthropicTools } : {}),
      messages,
    });

    totalInput += response.usage.input_tokens;
    totalOutput += response.usage.output_tokens;

    if (response.stop_reason !== 'tool_use') {
      finalText = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map(b => b.text)
        .join('\n');
      break;
    }

    // Append assistant turn and process tool calls
    messages.push({ role: 'assistant', content: response.content });

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of response.content) {
      if (block.type !== 'tool_use') continue;
      const client = clientByTool.get(block.name);
      let resultText: string;
      if (!client) {
        resultText = `Error: tool "${block.name}" not found in any connected MCP server`;
      } else {
        try {
          const res = await client.callTool(block.name, block.input as Record<string, unknown>);
          const texts = res.content
            .filter((c): c is { type: 'text'; text: string } => c.type === 'text')
            .map(c => c.text)
            .join('\n');
          resultText = res.isError ? `Error: ${texts}` : texts;
        } catch (err) {
          resultText = `Error: ${err instanceof Error ? err.message : String(err)}`;
        }
      }
      toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: resultText });
    }
    messages.push({ role: 'user', content: toolResults });
  }

  return { output: finalText, inputTokens: totalInput, outputTokens: totalOutput };
}

export async function runOrchestrationStep(
  stepName: string,
  taskDescription: string,
  inputData: unknown,
  previousOutput?: unknown
): Promise<string> {
  const context = previousOutput
    ? `Previous step output:\n${JSON.stringify(previousOutput, null, 2)}\n\nCurrent task: `
    : 'Task: ';

  const stream = anthropic.messages.stream({
    model: 'claude-opus-4-6',
    max_tokens: 4096,
    thinking: { type: 'adaptive' },
    system: `You are executing orchestration step: "${stepName}".
Complete the assigned task and return clear, structured output that can be passed to the next step.
Always provide output in a format that's easy to parse and use downstream.`,
    messages: [
      {
        role: 'user',
        content: `${context}${taskDescription}\n\nInput data:\n${JSON.stringify(inputData, null, 2)}`
      }
    ]
  });

  const message = await stream.finalMessage();
  return message.content
    .filter(b => b.type === 'text')
    .map(b => (b as Anthropic.TextBlock).text)
    .join('\n');
}
