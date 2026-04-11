import dagre from 'dagre';
import { Node, Edge, Position } from 'reactflow';

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

export interface LayoutOptions {
  direction: 'TB' | 'BT' | 'LR' | 'RL';
  nodeWidth: number;
  nodeHeight: number;
  rankSep: number;
  nodeSep: number;
}

const defaultOptions: LayoutOptions = {
  direction: 'TB',
  nodeWidth: 300,
  nodeHeight: 200,
  rankSep: 100,
  nodeSep: 80,
};

export const getLayoutedElements = (
  nodes: Node[],
  edges: Edge[],
  options: Partial<LayoutOptions> = {}
) => {
  const opts = { ...defaultOptions, ...options };
  
  dagreGraph.setGraph({ 
    rankdir: opts.direction,
    ranksep: opts.rankSep,
    nodesep: opts.nodeSep,
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { 
      width: opts.nodeWidth, 
      height: opts.nodeHeight 
    });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const newNode = {
      ...node,
      targetPosition: Position.Top,
      sourcePosition: Position.Bottom,
      position: {
        x: nodeWithPosition.x - opts.nodeWidth / 2,
        y: nodeWithPosition.y - opts.nodeHeight / 2,
      },
    };

    return newNode;
  });

  return { nodes: layoutedNodes, edges };
};

export const createTreeLayout = (
  rootNode: Node,
  childNodes: Node[],
  edges: Edge[],
  options: Partial<LayoutOptions> = {}
) => {
  const allNodes = [rootNode, ...childNodes];
  return getLayoutedElements(allNodes, edges, options);
};
