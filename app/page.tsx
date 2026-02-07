// app/page.tsx
"use client";

import { useEffect, useState } from "react";
import { db, ThoughtSession } from "@/lib/db";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Home() {
  const [sessions, setSessions] = useState<ThoughtSession[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    // useEffect内で直接非同期処理を実行
    const fetchSessions = async () => {
      const allSessions = await db.sessions.toArray();
      setSessions(
        allSessions.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
      );
    };

    fetchSessions();
  }, []); // 空の依存配列で初回のみ実行

  const createNewSession = async () => {
    const newSession = {
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.sessions.add(newSession);

    // セッション再読み込み
    const allSessions = await db.sessions.toArray();
    setSessions(
      allSessions.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    );
  };

  // シンプルなカレンダー表示
  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-10"></div>);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const hasSession = sessions.some(
        (s) => new Date(s.createdAt).toDateString() === date.toDateString(),
      );

      days.push(
        <div
          key={day}
          className={`h-10 flex items-center justify-center rounded-lg ${
            hasSession ? "bg-blue-500 text-white" : "bg-gray-100"
          }`}
        >
          {day}
        </div>,
      );
    }

    return days;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 to-black text-white">
      {/* 上部: セッション（星）の横スクロール */}
      <div className="h-1/2 p-6">
        <h1 className="text-3xl font-bold mb-6">星空ノート</h1>

        {/* 星の横スクロール */}
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-6 min-w-max">
            {sessions.map((session) => (
              <Link key={session.id} href={`/detail/${session.id}`}>
                <motion.div
                  whileHover={{ scale: 1.2 }}
                  className="relative cursor-pointer"
                >
                  {/* グロー効果 */}
                  <div className="absolute w-16 h-16 rounded-full bg-yellow-300 opacity-50 blur-xl"></div>

                  {/* 星本体 */}
                  <div className="relative w-8 h-8 bg-yellow-300 rounded-full shadow-lg">
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-black">
                      ★
                    </div>
                  </div>

                  {/* 日時表示 */}
                  <div className="text-xs mt-2 text-center">
                    {new Date(session.createdAt).toLocaleDateString("ja-JP", {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>

        {/* 新規入力ボタン */}
        <Link href="/input">
          <button className="mt-6 px-8 py-4 bg-blue-500 hover:bg-blue-600 rounded-full text-lg font-bold transition-colors">
            新しい思考を記録
          </button>
        </Link>
      </div>

      {/* 下部: カレンダー */}
      <div className="h-1/2 bg-white text-black p-6 rounded-t-3xl">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() =>
              setCurrentDate(
                new Date(currentDate.getFullYear(), currentDate.getMonth() - 1),
              )
            }
            className="px-4 py-2 bg-gray-200 rounded-lg"
          >
            ←
          </button>
          <h2 className="text-xl font-bold">
            {currentDate.getFullYear()}年 {currentDate.getMonth() + 1}月
          </h2>
          <button
            onClick={() =>
              setCurrentDate(
                new Date(currentDate.getFullYear(), currentDate.getMonth() + 1),
              )
            }
            className="px-4 py-2 bg-gray-200 rounded-lg"
          >
            →
          </button>
        </div>

        {/* 曜日ヘッダー */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {["日", "月", "火", "水", "木", "金", "土"].map((day) => (
            <div key={day} className="text-center font-bold text-sm">
              {day}
            </div>
          ))}
        </div>

        {/* カレンダー */}
        <div className="grid grid-cols-7 gap-2">{renderCalendar()}</div>
      </div>
    </div>
  );
}
