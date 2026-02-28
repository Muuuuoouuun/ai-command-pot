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
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
        await new Promise(resolve => setTimeout(resolve, 600));
        return {
            success: true,
            response: `[Mock Mode] 명령어 수신: "${input}"\n\n실제 AI 응답을 받으려면 .env.local에 ANTHROPIC_API_KEY를 설정하세요.`
        };
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: 'claude-3-5-haiku-20241022',
            max_tokens: 1024,
            system: `You are an AI assistant embedded in a personal AI/automation control panel called "AI Control Notebook".
Help the user manage their AI agents, subscriptions, API keys, and automations.
Be concise, helpful, and practical. Respond in the same language as the user's input.`,
            messages: [{ role: 'user', content: input }]
        })
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Anthropic API error: ${err}`);
    }

    const json = await response.json();
    return {
        success: true,
        response: json.content[0]?.text ?? 'No response received.'
    };
}

export async function createAgent(data: {
    name: string;
    description: string;
    category: string;
    runner_type: string;
    config: string;
}) {
    const sb = supabaseServer();

    let parsedConfig = {};
    try {
        parsedConfig = JSON.parse(data.config || '{}');
    } catch {
        throw new Error('Config must be valid JSON');
    }

    const { error } = await sb.from('agents').insert({
        owner_id: owner,
        name: data.name,
        description: data.description || null,
        category: data.category || null,
        runner_type: data.runner_type,
        config: parsedConfig,
        favorite: false
    });

    if (error) throw new Error(error.message);

    revalidatePath('/launch');
    return { success: true };
}
