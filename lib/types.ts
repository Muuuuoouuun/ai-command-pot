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
