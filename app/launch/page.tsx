import { getAgents, getSubscriptions, getVaultKeys } from '@/lib/data';
import LaunchClientPage from './client-page';

export const dynamic = 'force-dynamic';

export default async function LaunchPage() {
  let agents: unknown[] = [], subscriptions: unknown[] = [], keys: unknown[] = [];
  try { agents = await getAgents(); } catch {}
  try { subscriptions = await getSubscriptions(); } catch {}
  try { keys = await getVaultKeys(); } catch {}

  return (
    <LaunchClientPage
      agents={agents as Parameters<typeof LaunchClientPage>[0]['agents']}
      subscriptions={subscriptions}
      keys={keys}
    />
  );
}
