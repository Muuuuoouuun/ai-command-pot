'use server';

import { supabaseServer } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

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
    // In a real app, this would call an LLM (OpenAI/Anthropic)
    // For now, we mock the response or just log it

    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate latency

    return {
        success: true,
        response: `Command received: "${input}".\nAnalyzed intent: Execute mock task.\nStatus: Queued.`
    };
}
