// app/detail/[id]/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { db, Thought } from "@/lib/db";
import { useParams, useRouter } from "next/navigation";
import * as d3 from "d3";

interface ThoughtNode extends Thought {
  children: ThoughtNode[];
}

export default function DetailPage() {
  const params = useParams();
  const router = useRouter();
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);
  const sessionId = Number(params.id);

  // buildHierarchyを先に定義
  const buildHierarchy = (thoughts: Thought[]): ThoughtNode | null => {
    // ルートノード（parentId が null のもの）を探す
    const root = thoughts.find((t) => t.parentId === null);
    if (!root) return null;

    const buildNode = (thought: Thought): ThoughtNode => {
      const children = thoughts.filter((t) => t.parentId === thought.id);
      return {
        ...thought,
        children: children.map(buildNode),
      };
    };

    return buildNode(root);
  };

  useEffect(() => {
    const fetchThoughts = async () => {
      const sessionThoughts = await db.thoughts
        .where("sessionId")
        .equals(sessionId)
        .toArray();
      setThoughts(sessionThoughts);
    };

    fetchThoughts();
  }, [sessionId]);

  useEffect(() => {
    if (thoughts.length > 0 && svgRef.current) {
      const hierarchyData = buildHierarchy(thoughts);
      if (!hierarchyData) return;

      // SVGクリア
      d3.select(svgRef.current).selectAll("*").remove();

      const width = 800;
      const height = 600;
      const margin = { top: 20, right: 120, bottom: 20, left: 120 };

      const svg = d3
        .select(svgRef.current)
        .attr("width", width)
        .attr("height", height);

      const g = svg
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      // ツリーレイアウト
      const treeLayout = d3
        .tree<ThoughtNode>()
        .size([
          height - margin.top - margin.bottom,
          width - margin.left - margin.right,
        ]);

      const root = d3.hierarchy(hierarchyData);
      const treeData = treeLayout(root);

      // リンク（線）を描画
      const linkGenerator = d3
        .linkHorizontal<
          d3.HierarchyPointLink<ThoughtNode>,
          d3.HierarchyPointNode<ThoughtNode>
        >()
        .x((d) => d.y)
        .y((d) => d.x);

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
        .attr("transform", (d) => `translate(${d.y},${d.x})`);

      nodes
        .append("circle")
        .attr("r", 8)
        .attr("fill", "#3b82f6")
        .attr("stroke", "#1e40af")
        .attr("stroke-width", 2);

      // テキストを描画
      nodes
        .append("text")
        .attr("dy", -15)
        .attr("x", 0)
        .attr("text-anchor", "middle")
        .attr("fill", "white")
        .attr("font-size", "12px")
        .text(
          (d) =>
            d.data.content.substring(0, 20) +
            (d.data.content.length > 20 ? "..." : ""),
        );
    }
  }, [thoughts, buildHierarchy]);

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

        {/* D3.js SVG */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 overflow-auto">
          <svg ref={svgRef}></svg>
        </div>

        {/* 思考リスト */}
        <div className="mt-6 bg-white/10 backdrop-blur-lg rounded-3xl p-6">
          <h2 className="text-xl font-bold mb-4">思考一覧</h2>
          {thoughts.map((thought, index) => (
            <div key={thought.id} className="mb-3 p-4 bg-white/20 rounded-lg">
              <p className="font-bold">#{index + 1}</p>
              <p>{thought.content}</p>
              <p className="text-xs text-gray-300 mt-1">
                {new Date(thought.timestamp).toLocaleString("ja-JP")}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
