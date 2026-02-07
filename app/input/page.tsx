// app/input/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { db, Thought } from "@/lib/db";
import { useRouter, useSearchParams } from "next/navigation";

export default function InputPage() {
  const [messages, setMessages] = useState<Thought[]>([]);
  const [input, setInput] = useState("");
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionInitialized = useRef(false); // 重複防止フラグ

  useEffect(() => {
    // 既にセッション初期化済みならスキップ
    if (sessionInitialized.current) return;

    const initSession = async () => {
      // URLパラメータからセッションIDを取得（編集モード）
      const sessionIdParam = searchParams.get("sessionId");

      if (sessionIdParam) {
        // 既存セッションの編集
        const sessionId = Number(sessionIdParam);
        setCurrentSessionId(sessionId);

        // 既存の思考を読み込む
        const existingThoughts = await db.thoughts
          .where("sessionId")
          .equals(sessionId)
          .toArray();
        setMessages(existingThoughts);
      } else {
        // 新しいセッションを作成
        const sessionId = await db.sessions.add({
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        setCurrentSessionId(sessionId as number);
      }

      sessionInitialized.current = true; // 初期化完了フラグ
    };

    initSession();
    inputRef.current?.focus();
  }, [searchParams]);

  const handleSend = async () => {
    if (!input.trim() || currentSessionId === null) return;

    const newThought: Thought = {
      content: input,
      timestamp: new Date(),
      parentId: messages.length > 0 ? messages[messages.length - 1].id! : null,
      sessionId: currentSessionId,
    };

    const id = await db.thoughts.add(newThought);

    setMessages([...messages, { ...newThought, id: id as number }]);
    setInput("");

    // セッションの更新日時を更新
    await db.sessions.update(currentSessionId, {
      updatedAt: new Date(),
    });
  };

  const handleComplete = () => {
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 to-black text-white p-6">
      <div className="max-w-2xl mx-auto">
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">思考を記録</h1>
          <button
            onClick={handleComplete}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg"
          >
            完了
          </button>
        </div>

        {/* チャットエリア */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 mb-6 min-h-[60vh] max-h-[60vh] overflow-y-auto">
          {messages.map((msg, index) => (
            <div key={msg.id || index} className="mb-4">
              <div className="bg-white/20 rounded-2xl p-4">
                <p className="text-white">{msg.content}</p>
                <p className="text-xs text-gray-300 mt-2">
                  {new Date(msg.timestamp).toLocaleTimeString("ja-JP")}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* 入力欄 */}
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder="思考を入力..."
            className="flex-1 px-4 py-3 rounded-full bg-white/20 backdrop-blur-lg text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={handleSend}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-full font-bold transition-colors"
          >
            送信
          </button>
        </div>
      </div>
    </div>
  );
}
