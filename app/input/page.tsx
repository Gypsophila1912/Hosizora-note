// app/input/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { db, Thought, Branch } from "@/lib/db";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, PanInfo } from "framer-motion";

export default function InputPage() {
  const [messages, setMessages] = useState<Thought[]>([]);
  const [input, setInput] = useState("");
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [currentBranchId, setCurrentBranchId] = useState<number | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null); // 自動スクロール用
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionInitialized = useRef(false);

  // 自動スクロール関数
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // メッセージが更新されたら自動スクロール
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 関数を useEffect より前に定義
  const loadBranchMessages = async (branchId: number) => {
    const branchThoughts = await db.thoughts
      .where("branchId")
      .equals(branchId)
      .toArray();
    setMessages(
      branchThoughts.sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      ),
    );
  };

  useEffect(() => {
    if (sessionInitialized.current) return;

    const initSession = async () => {
      const sessionIdParam = searchParams.get("sessionId");

      if (sessionIdParam) {
        const sessionId = Number(sessionIdParam);
        setCurrentSessionId(sessionId);

        // 既存のブランチを読み込む
        const existingBranches = await db.branches
          .where("sessionId")
          .equals(sessionId)
          .toArray();
        setBranches(existingBranches);

        // メインブランチ（最初のブランチ）を選択
        if (existingBranches.length > 0) {
          setCurrentBranchId(existingBranches[0].id!);
          await loadBranchMessages(existingBranches[0].id!);
        }
      } else {
        // 新しいセッションを作成
        const sessionId = await db.sessions.add({
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        setCurrentSessionId(sessionId as number);

        // メインブランチを作成
        const branchId = await db.branches.add({
          sessionId: sessionId as number,
          name: "メインの思考",
          parentBranchId: null,
          rootThoughtId: 0, // 仮の値
          createdAt: new Date(),
        });
        setCurrentBranchId(branchId as number);
        setBranches([
          {
            id: branchId as number,
            sessionId: sessionId as number,
            name: "メインの思考",
            parentBranchId: null,
            rootThoughtId: 0,
            createdAt: new Date(),
          },
        ]);
      }

      sessionInitialized.current = true;
    };

    initSession();
    inputRef.current?.focus();
  }, [searchParams, loadBranchMessages]);

  const handleSend = async () => {
    if (!input.trim() || currentSessionId === null || currentBranchId === null)
      return;

    const newThought: Thought = {
      content: input,
      timestamp: new Date(),
      parentId: messages.length > 0 ? messages[messages.length - 1].id! : null,
      sessionId: currentSessionId,
      branchId: currentBranchId,
    };

    const id = await db.thoughts.add(newThought);

    setMessages([...messages, { ...newThought, id: id as number }]);
    setInput("");

    await db.sessions.update(currentSessionId, {
      updatedAt: new Date(),
    });
  };

  const handleCreateBranch = async (fromThoughtId: number) => {
    if (!currentSessionId) return;

    // 分岐元のメッセージを取得
    const branchFromMessage = messages.find((m) => m.id === fromThoughtId);

    // 分岐名を分岐元メッセージの内容にする（最大30文字）
    const branchName = branchFromMessage
      ? branchFromMessage.content.substring(0, 30) +
        (branchFromMessage.content.length > 30 ? "..." : "")
      : `分岐 ${branches.length}`;

    const branchId = await db.branches.add({
      sessionId: currentSessionId,
      name: branchName,
      parentBranchId: currentBranchId,
      rootThoughtId: fromThoughtId,
      createdAt: new Date(),
    });

    const newBranch: Branch = {
      id: branchId as number,
      sessionId: currentSessionId,
      name: branchName,
      parentBranchId: currentBranchId,
      rootThoughtId: fromThoughtId,
      createdAt: new Date(),
    };

    setBranches([...branches, newBranch]);

    if (branchFromMessage) {
      // 分岐元のメッセージを新しいブランチにコピー（参照用として）
      const copiedThought: Thought = {
        content: `[分岐元] ${branchFromMessage.content}`,
        timestamp: new Date(),
        parentId: null, // 新しいブランチのルート
        sessionId: currentSessionId,
        branchId: branchId as number,
      };

      const copiedId = await db.thoughts.add(copiedThought);

      // 新しい分岐に切り替え（分岐元メッセージが表示される）
      setCurrentBranchId(branchId as number);
      setMessages([{ ...copiedThought, id: copiedId as number }]);
    } else {
      // フォールバック：分岐元が見つからない場合は空で開始
      setCurrentBranchId(branchId as number);
      setMessages([]);
    }

    setSidebarOpen(false);
  };

  const handleSwitchBranch = async (branchId: number) => {
    setCurrentBranchId(branchId);
    await loadBranchMessages(branchId);
    setSidebarOpen(false);
  };

  const handleSwipe = (messageId: number, info: PanInfo) => {
    // 左スワイプ（offsetX が負の値）で分岐作成
    if (info.offset.x < -100) {
      handleCreateBranch(messageId);
    }
  };

  const handleComplete = () => {
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 to-black text-white p-6 relative">
      {/* サイドバー */}
      <motion.div
        initial={{ x: "-100%" }}
        animate={{ x: sidebarOpen ? 0 : "-100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed top-0 left-0 h-full w-80 bg-gray-900 z-50 p-6 overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">分岐一覧</h2>
          <button onClick={() => setSidebarOpen(false)} className="text-2xl">
            ✕
          </button>
        </div>

        <div className="space-y-3">
          {branches.map((branch) => (
            <button
              key={branch.id}
              onClick={() => handleSwitchBranch(branch.id!)}
              className={`w-full text-left p-4 rounded-lg transition-colors ${
                branch.id === currentBranchId
                  ? "bg-blue-500"
                  : "bg-gray-800 hover:bg-gray-700"
              }`}
            >
              <p className="font-bold">{branch.name}</p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(branch.createdAt).toLocaleString("ja-JP")}
              </p>
            </button>
          ))}
        </div>
      </motion.div>

      {/* オーバーレイ */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      <div className="max-w-2xl mx-auto">
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-2xl hover:bg-white/10 p-2 rounded-lg"
            >
              ≡
            </button>
            <h1 className="text-2xl font-bold">思考を記録</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push("/")}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 rounded-lg"
            >
              キャンセル
            </button>
            <button
              onClick={handleComplete}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg"
            >
              完了
            </button>
          </div>
        </div>

        {/* 現在の分岐名 */}
        <div className="mb-3 text-sm text-gray-400">
          現在: {branches.find((b) => b.id === currentBranchId)?.name || ""}
        </div>

        {/* チャットエリア */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 mb-6 min-h-[60vh] max-h-[60vh] overflow-y-auto">
          {messages.map((msg, index) => (
            <motion.div
              key={msg.id || index}
              className="mb-4"
              drag="x"
              dragConstraints={{ left: -150, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => msg.id && handleSwipe(msg.id, info)}
            >
              <div
                className={`rounded-2xl p-4 cursor-grab active:cursor-grabbing ${
                  msg.content.startsWith("[分岐元]")
                    ? "bg-purple-500/30 border-2 border-purple-400"
                    : "bg-white/20"
                }`}
              >
                <p className="text-white">{msg.content}</p>
                <p className="text-xs text-gray-300 mt-2">
                  {new Date(msg.timestamp).toLocaleTimeString("ja-JP")}
                </p>
                {!msg.content.startsWith("[分岐元]") && (
                  <p className="text-xs text-blue-300 mt-1">
                    ← 左にスワイプで分岐
                  </p>
                )}
              </div>
            </motion.div>
          ))}
          {/* 自動スクロール用の要素 */}
          <div ref={messagesEndRef} />
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
