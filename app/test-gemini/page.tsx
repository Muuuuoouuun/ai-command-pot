"use client";

import { useState } from 'react';

export default function GeminiTestPage() {
    const [prompt, setPrompt] = useState("");
    const [result, setResult] = useState("");
    const [stats, setStats] = useState<{ used: number; remain: number | string } | null>(null);
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;

        setLoading(true);
        setResult("");
        setStats(null);

        try {
            const response = await fetch('/api/gemini', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt }),
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.error); // 토큰 부족 등의 에러 메시지
                return;
            }

            setResult(data.text);
            setStats({ used: data.usage.usedTokens, remain: data.usage.remainingTokens });
        } catch (err) {
            console.error(err);
            alert('요청 중 오류 발생');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-950 p-8 flex flex-col items-center justify-center text-white">
            <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-xl p-8 shadow-2xl">
                <h1 className="text-2xl font-bold mb-2">Gemini & Subscription 연동 데모</h1>
                <p className="text-neutral-400 mb-6 text-sm">
                    질문을 입력하고 실제 Gemini API 텍스트 생성과 사용 토큰을 확인해 보세요.
                </p>

                <textarea
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[120px] mb-4"
                    placeholder="어떤 것이 궁금하신가요?"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                />

                <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-white py-3 rounded-lg font-semibold mb-8"
                >
                    {loading ? '생성 중...' : '토큰 사용해보기'}
                </button>

                {stats && (
                    <div className="mb-6 p-4 bg-indigo-950/30 border border-indigo-500/30 rounded-lg flex items-center justify-between text-sm">
                        <span className="text-indigo-200">🔍 소모된 토큰: <strong className="text-white">{stats.used}</strong></span>
                        <span className="text-indigo-200">💰 남은 토큰: <strong className="text-white">{stats.remain}</strong></span>
                    </div>
                )}

                {result && (
                    <div className="bg-neutral-800 p-6 rounded-lg border border-neutral-700">
                        <h3 className="text-sm text-neutral-400 mb-2 font-medium">Gemini 답변:</h3>
                        <div className="whitespace-pre-wrap leading-relaxed text-neutral-200">{result}</div>
                    </div>
                )}
            </div>
        </div>
    );
}
