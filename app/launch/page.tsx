import { getAgents, getSubscriptions, getVaultKeys } from '@/lib/data';
import LaunchClientPage from './client-page';

type Agent = {
  id: string;
  name: string;
  description?: string;
  category?: string;
  runner_type: string;
  favorite?: boolean;
};

type Subscription = {
  id: string;
  service_name: string;
  renewal_date: string;
  monthly_cost: number;
  billing_cycle: string;
};

type VaultKey = {
  id: string;
  is_active: boolean;
  provider: string;
  last4: string;
  label?: string;
};

export default async function LaunchPage() {
  const agents = (await getAgents()) as unknown as Agent[];
  const subscriptions = (await getSubscriptions()) as unknown as Subscription[];
  const keys = (await getVaultKeys()) as unknown as VaultKey[];

  return (
    <LaunchClientPage
      agents={agents}
      subscriptions={subscriptions}
      keys={keys}
    />
  );
}
