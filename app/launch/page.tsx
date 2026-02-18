import { getAgents, getSubscriptions, getVaultKeys } from '@/lib/data';
import LaunchClientPage from './client-page';

export default async function LaunchPage() {
  const agents = (await getAgents()) as any[];
  const subscriptions = await getSubscriptions();
  const keys = await getVaultKeys();

  return (
    <LaunchClientPage
      agents={agents}
      subscriptions={subscriptions}
      keys={keys}
    />
  );
}
