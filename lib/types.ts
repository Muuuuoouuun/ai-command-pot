export type OrchestrationStepStatus = 'pending' | 'running' | 'success' | 'failed' | 'skipped';

export type OrchestrationStep = {
  id: string;
  name: string;
  description?: string;
  agent_id?: string;
  agent_name?: string;
  runner_type: 'agent' | 'claude' | 'webhook' | 'condition';
  config: {
    system_prompt?: string;
    task_description?: string;
    webhook_url?: string;
    input_template?: string; // supports {{previous_output}} placeholder
    condition?: string;
    model?: string;
  };
  order_index: number;
  depends_on?: string[]; // step IDs this step waits for (for parallel)
  status?: OrchestrationStepStatus;
  output?: unknown;
  error?: string;
  started_at?: string;
  ended_at?: string;
  duration_ms?: number;
};

export type Orchestration = {
  id: string;
  owner_id: string;
  name: string;
  description?: string;
  steps: OrchestrationStep[];
  execution_mode: 'sequential' | 'parallel' | 'mixed';
  is_active: boolean;
  last_run_at?: string;
  last_run_status?: 'success' | 'failed' | 'running';
  total_runs: number;
  created_at: string;
};

export type OrchestrationRun = {
  id: string;
  orchestration_id: string;
  owner_id: string;
  status: 'running' | 'success' | 'failed' | 'cancelled';
  steps_state: Record<string, {
    status: OrchestrationStepStatus;
    output?: unknown;
    error?: string;
    started_at?: string;
    ended_at?: string;
    duration_ms?: number;
  }>;
  input?: unknown;
  final_output?: unknown;
  started_at: string;
  ended_at?: string;
  duration_ms?: number;
  error?: string;
};

export type Subscription = {
  id: string;
  service_name: string;
  plan: string;
  monthly_cost: number;
  currency: string;
  renewal_date: string;
  billing_cycle: string;
  account_email?: string;
  tags?: string[];
  notes?: string;
  links?: string;
  status: 'active' | 'paused';
  tokens_used_month?: number;
  cost_this_month?: number;
  last_updated_at?: string;
};
