// app/detail/[id]/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { db, Thought, Branch } from "@/lib/db";
import { useParams, useRouter } from "next/navigation";
import * as d3 from "d3";

interface ThoughtNode extends Thought {
  children: ThoughtNode[];
}

export default function DetailPage() {
  const params = useParams();
  const router = useRouter();
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);
  const sessionId = Number(params.id);

  // buildHierarchyを先に定義（分岐対応版）
  const buildHierarchy = (
    thoughts: Thought[],
    branches: Branch[],
  ): ThoughtNode | null => {
    if (thoughts.length === 0) return null;

    // メインブランチ（最初のブランチ）のルートを探す
    const mainBranch = branches.find((b) => b.parentBranchId === null);
    if (!mainBranch) return null;

    const mainBranchThoughts = thoughts.filter(
      (t) => t.branchId === mainBranch.id,
    );
    const root = mainBranchThoughts.find((t) => t.parentId === null);
    if (!root) return null;

    const buildNode = (thought: Thought): ThoughtNode => {
      const children: ThoughtNode[] = [];

      // 同じブランチ内の子を追加
      const samebranchChildren = thoughts.filter(
        (t) => t.parentId === thought.id && t.branchId === thought.branchId,
      );
      children.push(...samebranchChildren.map(buildNode));

      // このメッセージから分岐した別ブランチを追加
      const childBranches = branches.filter(
        (b) => b.rootThoughtId === thought.id,
      );
      childBranches.forEach((childBranch) => {
        const branchThoughts = thoughts.filter(
          (t) => t.branchId === childBranch.id,
        );
        // 分岐の最初のメッセージ（[分岐元]メッセージの次）
        const branchStart = branchThoughts.find(
          (t) => !t.content.startsWith("[分岐元]"),
        );
        if (branchStart) {
          children.push(buildNode(branchStart));
        } else if (branchThoughts.length > 0) {
          // [分岐元]メッセージしかない場合
          children.push(buildNode(branchThoughts[0]));
        }
      });

      return {
        ...thought,
        children,
      };
    };

    return buildNode(root);
  };

  useEffect(() => {
    const fetchData = async () => {
      const sessionThoughts = await db.thoughts
        .where("sessionId")
        .equals(sessionId)
        .toArray();
      setThoughts(sessionThoughts);

      const sessionBranches = await db.branches
        .where("sessionId")
        .equals(sessionId)
        .toArray();
      setBranches(sessionBranches);
    };

    fetchData();
  }, [sessionId]);

  useEffect(() => {
    if (thoughts.length > 0 && branches.length > 0 && svgRef.current) {
      const hierarchyData = buildHierarchy(thoughts, branches);
      if (!hierarchyData) return;

      // SVGクリア
      d3.select(svgRef.current).selectAll("*").remove();

      const width = 1000;
      const height = 800;
      const margin = { top: 50, right: 50, bottom: 50, left: 50 };

      const svg = d3
        .select(svgRef.current)
        .attr("width", width)
        .attr("height", height);

      const g = svg
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      // 縦向きツリーレイアウト（幅と高さを入れ替え）
      const treeLayout = d3
        .tree<ThoughtNode>()
        .size([
          width - margin.left - margin.right,
          height - margin.top - margin.bottom,
        ]);

      const root = d3.hierarchy(hierarchyData);
      const treeData = treeLayout(root);

      // リンク（線）を描画 - 縦向きなのでxとyを入れ替え
      const linkGenerator = d3
        .linkVertical<
          d3.HierarchyPointLink<ThoughtNode>,
          d3.HierarchyPointNode<ThoughtNode>
        >()
        .x((d) => d.x)
        .y((d) => d.y);

      g.selectAll(".link")
        .data(treeData.links())
        .enter()
        .append("path")
        .attr("class", "link")
        .attr("d", linkGenerator)
        .attr("fill", "none")
        .attr("stroke", "#cbd5e1")
        .attr("stroke-width", 2);

      // ノード（円）を描画
      const nodes = g
        .selectAll(".node")
        .data(treeData.descendants())
        .enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", (d) => `translate(${d.x},${d.y})`);

      nodes
        .append("circle")
        .attr("r", 10)
        .attr("fill", (d) =>
          d.data.content.startsWith("[分岐元]") ? "#a855f7" : "#3b82f6",
        )
        .attr("stroke", (d) =>
          d.data.content.startsWith("[分岐元]") ? "#7c3aed" : "#1e40af",
        )
        .attr("stroke-width", 2);

      // テキストを描画（円の下に表示）
      nodes
        .append("text")
        .attr("dy", 25)
        .attr("x", 0)
        .attr("text-anchor", "middle")
        .attr("fill", "white")
        .attr("font-size", "12px")
        .each(function (d) {
          const text = d3.select(this);
          const content = d.data.content.replace("[分岐元] ", "");
          const words = content.split("");
          const maxLength = 15;

          if (words.length > maxLength) {
            text.text(content.substring(0, maxLength) + "...");
          } else {
            text.text(content);
          }
        });
    }
  }, [thoughts, branches, buildHierarchy]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 to-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">思考ツリー</h1>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 rounded-lg"
          >
            戻る
          </button>
        </div>

        {/* D3.js SVG - 縦向きツリー */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 overflow-auto mb-6">
          <svg ref={svgRef}></svg>
        </div>

        {/* 分岐一覧 */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">分岐一覧</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {branches.map((branch) => (
              <div key={branch.id} className="p-4 bg-white/20 rounded-lg">
                <p className="font-bold">{branch.name}</p>
                <p className="text-xs text-gray-300 mt-1">
                  {new Date(branch.createdAt).toLocaleString("ja-JP")}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 思考リスト（ブランチ別） */}
        {branches.map((branch) => {
          const branchThoughts = thoughts.filter(
            (t) => t.branchId === branch.id,
          );
          if (branchThoughts.length === 0) return null;

          return (
            <div
              key={branch.id}
              className="mb-6 bg-white/10 backdrop-blur-lg rounded-3xl p-6"
            >
              <h2 className="text-xl font-bold mb-4">{branch.name}</h2>
              {branchThoughts.map((thought, index) => (
                <div
                  key={thought.id}
                  className={`mb-3 p-4 rounded-lg ${
                    thought.content.startsWith("[分岐元]")
                      ? "bg-purple-500/30 border-2 border-purple-400"
                      : "bg-white/20"
                  }`}
                >
                  <p className="font-bold">#{index + 1}</p>
                  <p>{thought.content}</p>
                  <p className="text-xs text-gray-300 mt-1">
                    {new Date(thought.timestamp).toLocaleString("ja-JP")}
                  </p>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
