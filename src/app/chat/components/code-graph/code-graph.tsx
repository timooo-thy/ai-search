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
import { CodeEditorPanel } from "./code-editor-panel";
import { AgentTodos } from "./agent-todos";

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
  const { nodes, edges, loading, queries, analysing, todos } = graph;

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
    // Show completed todos with error state if available, otherwise minimal message
    if (todos && todos.length > 0) {
      return (
        <div className="w-full py-4">
          <AgentTodos todos={todos} defaultOpen={false} />
          <p className="text-sm text-muted-foreground text-center mt-3">
            No code graph could be generated from the search results.
          </p>
        </div>
      );
    }
    return (
      <div className="w-full py-4 text-center">
        <p className="text-sm text-muted-foreground">No graph data available</p>
      </div>
    );
  }

  return (
    <Card className={cn("w-full h-[800px] py-0 overflow-hidden", className)}>
      <div className="flex flex-col h-full">
        {/* Todos panel always at the top when available */}
        {todos && todos.length > 0 && (
          <div className="p-3 border-b shrink-0">
            <AgentTodos todos={todos} defaultOpen={loading} />
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground px-6">
            {analysing ? (
              <p className="text-lg">Visualising your code...</p>
            ) : queries && queries.length > 0 ? (
              <>
                <p className="text-lg font-medium mb-6">
                  Searching codebase...
                </p>
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
                      <div className="shrink-0 w-2 h-2 bg-primary rounded-full animate-ping" />
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
          <CodeEditorPanel sources={graph.sources ?? []}>
            <div className="flex-1 relative h-full">
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
            </div>
          </CodeEditorPanel>
        )}
      </div>
    </Card>
  );
}
