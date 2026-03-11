import { getOrchestrations } from '@/lib/data';
import { OrchestrationClientPage } from './client-page';

export default async function OrchestrationPage() {
  const orchestrations = await getOrchestrations();
  return <OrchestrationClientPage initialOrchestrations={orchestrations} />;
}
