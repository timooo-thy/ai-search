import dagre from "dagre";
import { Node } from "reactflow";
import { CodeGraphNode, CodeGraphEdge } from "@/types/widget-types";

export function getLayoutedElements(
  nodes: CodeGraphNode[],
  edges: CodeGraphEdge[],
  direction: "TB" | "LR" = "LR"
): Node[] {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 100, // Horizontal spacing between nodes
    ranksep: 200, // Vertical spacing between ranks
    marginx: 50,
    marginy: 50,
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 180, height: 80 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes: Node[] = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      id: node.id,
      type: "custom",
      position: {
        x: nodeWithPosition.x - 90,
        y: nodeWithPosition.y - 40,
      },
      data: node,
    };
  });

  return layoutedNodes;
}

export function getEdgeColor(type?: string): string {
  switch (type) {
    case "imports":
      return "#3b82f6";
    case "calls":
      return "#22c55e";
    case "extends":
      return "#a855f7";
    case "uses":
      return "#f59e0b";
    default:
      return "#6b7280";
  }
}

export function getNodeColor(type?: string): string {
  switch (type) {
    case "file":
      return "bg-blue-500 dark:bg-blue-600";
    case "function":
      return "bg-green-500 dark:bg-green-600";
    case "class":
      return "bg-purple-500 dark:bg-purple-600";
    case "component":
      return "bg-orange-500 dark:bg-orange-600";
    default:
      return "bg-gray-500 dark:bg-gray-600";
  }
}

export function getNodeIcon(type?: string): string {
  switch (type) {
    case "file":
      return "📄";
    case "function":
      return "ƒ";
    case "class":
      return "C";
    case "component":
      return "⚛️";
    default:
      return "•";
  }
}

export function getLanguageFromFilePath(filePath?: string): string {
  if (!filePath) return "typescript";

  const lowerPath = filePath.toLowerCase();

  if (lowerPath.endsWith(".ts") || lowerPath.endsWith(".tsx"))
    return "typescript";
  if (lowerPath.endsWith(".js") || lowerPath.endsWith(".jsx"))
    return "javascript";
  if (lowerPath.endsWith(".py")) return "python";
  if (lowerPath.endsWith(".java")) return "java";
  if (lowerPath.endsWith(".go")) return "go";
  if (lowerPath.endsWith(".rs")) return "rust";

  return "typescript";
}

export function getMinimapNodeColor(type?: string): string {
  switch (type) {
    case "file":
      return "#3b82f6";
    case "function":
      return "#22c55e";
    case "class":
      return "#a855f7";
    case "component":
      return "#f97316";
    default:
      return "#6b7280";
  }
}
