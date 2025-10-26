"use client";

import { useMemo, useEffect } from "react";
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  MarkerType,
} from "reactflow";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { MyDataPart } from "@/types/ui-message-type";
import { CustomCodeNode } from "./custom-code-node";
import { getEdgeColor, getLayoutedElements } from "./graph-utils";

type CodeGraphProps = {
  graph: MyDataPart["codeGraph"];
  className?: string;
};

const nodeTypes = {
  custom: CustomCodeNode,
};

/**
 * Interactive code graph visualisation component
 *
 * This component renders an interactive graph showing code relationships,
 * with hover tooltips displaying code snippets and file information.
 *
 * @param graph - Object containing nodes and edges of the code graph
 */
export function CodeGraph({ graph, className }: CodeGraphProps) {
  const { nodes, edges, loading, queries, analysing } = graph;

  const layoutedNodes: Node[] = useMemo(
    () => getLayoutedElements(nodes, edges, "TB"),
    [nodes, edges]
  );

  // Convert CodeEdge to ReactFlow Edge format
  const formattedEdges: Edge[] = useMemo(
    () =>
      edges.map((edge, index) => ({
        id: `e${edge.source}-${edge.target}-${index}`,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        type: "smoothstep",
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: getEdgeColor(edge.type),
        },
        style: {
          stroke: getEdgeColor(edge.type),
          strokeWidth: 2,
        },
        labelStyle: {
          fontSize: 12,
          fontWeight: 500,
          fill: "#4a2e2d",
          fontFamily: "inherit",
        },
        labelBgStyle: {
          fill: "#f3e9dc",
        },
        labelBgPadding: [6, 4] as [number, number],
        labelBgBorderRadius: 4,
      })),
    [edges]
  );

  const [reactFlowNodes, setNodes, onNodesChange] =
    useNodesState(layoutedNodes);
  const [reactFlowEdges, setEdges, onEdgesChange] =
    useEdgesState(formattedEdges);

  useEffect(() => {
    setNodes(layoutedNodes);
  }, [layoutedNodes, setNodes]);

  useEffect(() => {
    setEdges(formattedEdges);
  }, [formattedEdges, setEdges]);

  if (nodes.length === 0 && edges.length === 0 && !loading) {
    return (
      <Card className={cn("w-full h-[800px] py-0", className)}>
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <p>No graph data available</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full h-[800px] py-0", className)}>
      {loading ? (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground px-6">
          {analysing ? (
            <p className="text-lg">Visualising your code...</p>
          ) : queries && queries.length > 0 ? (
            <>
              <p className="text-lg font-medium mb-6">Searching codebase...</p>
              <div className="space-y-3 w-full max-w-2xl">
                {queries.map((query, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg animate-pulse"
                    style={{
                      animationDelay: `${index * 150}ms`,
                      animationDuration: "1.5s",
                    }}
                  >
                    <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full animate-ping" />
                    <span className="text-sm font-mono text-foreground/80">
                      {query}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-lg">Generating search queries...</p>
          )}
        </div>
      ) : (
        <ReactFlow
          nodes={reactFlowNodes}
          edges={reactFlowEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{
            padding: 0.3,
            includeHiddenNodes: false,
          }}
          minZoom={0.5}
          maxZoom={2}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={true}
          className="bg-muted/30"
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={16} size={1} />
          <Controls />
        </ReactFlow>
      )}
    </Card>
  );
}
