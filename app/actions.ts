'use server';

import { supabaseServer } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { processCommandWithClaude } from '@/lib/claude';
import { getAgents, getAutomations, getRuns } from '@/lib/data';

const owner = process.env.DEMO_OWNER_ID || '00000000-0000-0000-0000-000000000001';

export async function createMemo(content: string) {
    const sb = supabaseServer();
    const { error } = await sb.from('memos').insert({
        owner_id: owner,
        content,
        is_processed: false
    });

    if (error) {
        console.error('Create memo error:', error);
        throw new Error('Failed to create memo');
    }

    revalidatePath('/notifications');
    return { success: true };
}

export async function toggleAutomation(id: string, isActive: boolean) {
    const sb = supabaseServer();
    const { error } = await sb.from('automations').update({ is_active: isActive }).eq('id', id).eq('owner_id', owner);

    if (error) {
        console.error('Toggle automation error:', error);
        throw new Error('Failed to update automation status');
    }

    revalidatePath('/automations');
    return { success: true };
}

export async function processAiCommand(input: string) {
    if (!process.env.ANTHROPIC_API_KEY) {
        return {
            success: true,
            response: `[Demo Mode] Command received: "${input}"\nSet ANTHROPIC_API_KEY to enable real AI processing.`,
            analysis: null
        };
    }

    try {
        const [agents, automations, recentRuns] = await Promise.all([
            getAgents().catch(() => []),
            getAutomations().catch(() => []),
            getRuns(5).catch(() => [])
        ]);

        const analysis = await processCommandWithClaude(input, {
            agents: agents.map(a => ({
                id: a.id,
                name: a.name,
                description: a.description,
                runner_type: a.runner_type
            })),
            automations: automations.map(a => ({
                id: a.id,
                name: a.name,
                is_active: a.is_active,
                platform: a.platform
            })),
            recentRuns: recentRuns.map(r => ({
                id: r.id,
                status: r.status,
                started_at: r.started_at
            }))
        });

        // Auto-execute low-risk actions
        let actionResult: string | null = null;

        if (analysis.intent === 'create_memo' && !analysis.requires_confirmation) {
            try {
                const sb = supabaseServer();
                await sb.from('memos').insert({
                    owner_id: owner,
                    content: `[AI] ${analysis.summary}`,
                    is_processed: false
                });
                revalidatePath('/notifications');
                actionResult = 'Memo saved automatically.';
            } catch {
                actionResult = 'Note: Auto-save memo failed.';
            }
        }

        const responseText = [
            analysis.suggested_response,
            '',
            `Intent: ${analysis.intent}`,
            `Plan: ${analysis.action_plan.join(' → ')}`,
            actionResult ? `\n${actionResult}` : ''
        ].filter(Boolean).join('\n');

        return {
            success: true,
            response: responseText,
            analysis
        };
    } catch (err) {
        console.error('Claude command processing error:', err);
        return {
            success: false,
            response: `Error processing command: ${err instanceof Error ? err.message : 'Unknown error'}`,
            analysis: null
        };
    }
}
