export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Gemini API 초기화
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
    try {
        const { prompt } = await req.json();

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ error: '환경 변수에 GEMINI_API_KEY가 설정되지 않았습니다.' }, { status: 500 });
        }

        // 1. Supabase 연결 (서비스 롤)
        const supabase = supabaseServer();
        const userId = process.env.DEMO_OWNER_ID || 'TEST_USER_ID';

        // 2. 남은 토큰 할당량(구독 상태) 확인
        const { data: subscription } = await supabase
            .from('user_subscriptions')
            .select('tokens_remaining, plan_type')
            .eq('user_id', userId)
            .single();

        // 초기 구축 테스트를 위해, 테이블이 없거나 데이터가 없을 때도 일단 통과하도록 임시 기본값 설정
        let currentTokens = 100000; // 기본 제공 10만 토큰으로 가정
        let hasTable = true;

        if (!subscription) {
            console.warn('⚠️ user_subscriptions 테이블 데이터가 없거나 로그인 미상태입니다.');
            hasTable = false;
        } else {
            currentTokens = subscription.tokens_remaining;
        }

        if (currentTokens <= 0) {
            return NextResponse.json({ error: '토큰을 모두 소진했습니다. 구독을 업그레이드 해주세요.' }, { status: 403 });
        }

        // 3. Gemini API 호출
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        const response = await result.response;

        const text = response.text();
        const usage = response.usageMetadata;
        const usedTokens = usage?.totalTokenCount || 0;

        // 4. 사용한 토큰 차감 로직
        const newRemainingTokens = currentTokens - usedTokens;

        // 테이블이 생성되어 있다면 실제 차감을 적용
        if (hasTable && userId !== 'TEST_USER_ID') {
            await supabase
                .from('user_subscriptions')
                .update({ tokens_remaining: Math.max(0, newRemainingTokens) })
                .eq('user_id', userId);
        }

        // 5. 프론트엔드로 결과 반환
        return NextResponse.json({
            text,
            usage: {
                usedTokens,
                remainingTokens: hasTable ? newRemainingTokens : 'DB 연결 전 임시모드 (차감안됨)'
            }
        });

    } catch (error: unknown) {
        console.error('Gemini API Error:', error);
        const message = error instanceof Error ? error.message : '서버 오류가 발생했습니다.';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
