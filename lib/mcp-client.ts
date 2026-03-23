/**
 * Lightweight MCP (Model Context Protocol) HTTP client.
 * Implements JSON-RPC 2.0 over HTTP for MCP servers with http/sse transport.
 * Stdio servers cannot be called from a Next.js server — use claude_desktop_config.json export instead.
 */

export type McpTool = {
  name: string;
  description?: string;
  inputSchema: { type: string; properties?: Record<string, unknown>; required?: string[] };
};

export type McpCallResult = {
  content: Array<{ type: 'text'; text: string } | Record<string, unknown>>;
  isError?: boolean;
};

type RpcResponse = {
  result?: unknown;
  error?: { code: number; message: string };
};

export class McpHttpClient {
  private endpoint: string;
  private reqId = 0;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  private async rpc(method: string, params?: unknown, timeoutMs = 10_000): Promise<unknown> {
    const id = ++this.reqId;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', method, params, id }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status}${text ? `: ${text}` : ''}`);
      }

      const data = (await res.json()) as RpcResponse;
      if (data.error) throw new Error(`MCP error (${data.error.code}): ${data.error.message}`);
      return data.result;
    } finally {
      clearTimeout(timer);
    }
  }

  async listTools(): Promise<McpTool[]> {
    const result = (await this.rpc('tools/list')) as { tools?: McpTool[] };
    return result.tools ?? [];
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<McpCallResult> {
    return (await this.rpc('tools/call', { name, arguments: args })) as McpCallResult;
  }

  /** Convert MCP tool list to Anthropic API tool format. */
  static toAnthropicTools(tools: McpTool[]): AnthropicToolParam[] {
    return tools.map(t => ({
      name: t.name,
      description: t.description ?? '',
      input_schema: {
        type: 'object' as const,
        properties: t.inputSchema.properties ?? {},
        required: t.inputSchema.required ?? [],
      },
    }));
  }
}

export type AnthropicToolParam = {
  name: string;
  description: string;
  input_schema: { type: 'object'; properties: Record<string, unknown>; required: string[] };
};
