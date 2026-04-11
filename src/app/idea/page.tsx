"use client";
import React, { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { nodeTypes, type NodeData } from '@/components/flow/IdeaNodes';
import { EvidenceDrawer } from '@/components/flow/EvidenceDrawer';
import { ScoutDrawer } from '@/components/flow/ScoutDrawer';
import { getLayoutedElements } from '@/lib/flow/layout';

interface IdeaResult {
  summary: string;
  segments: Array<{
    name: string;
    why_it_fits: string;
    hooks: string[];
    kpis: string[];
    platform_fit: string[];
  }>;
  features: string[];
  risks: Array<{
    risk: string;
    mitigation: string;
  }>;
  social_fit: Array<{
    platform: string;
    why: string;
  }>;
  improvements_by_segment: Array<{
    segment: string;
    ideas: string[];
  }>;
  followups: string[];
}

type ChatMessage =
  | { role: 'user'; text: string }
  | { role: 'assistant'; result: IdeaResult; savedId?: string };

const IdeaPage = () => {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Map tab state
  const [activeTab, setActiveTab] = useState<'chat' | 'map'>('chat');
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isScoutDrawerOpen, setIsScoutDrawerOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput("");
    setError(null);
    setMessages((prev) => [...prev, { role: 'user', text: userText }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/ideate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea: userText })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to generate concept');
      }

      const data: { id: string; result: IdeaResult } = await response.json();
      setMessages((prev) => [...prev, { role: 'assistant', result: data.result, savedId: data.id }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const latestResult = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.role === 'assistant') return m.result;
    }
    return null;
  }, [messages]);

  // Map helpers
  const toggleNodeExpansion = (nodeId: string) => {
    setNodes((nds) => nds.map((n: any) => n.id === nodeId ? { ...n, data: { ...n.data, isExpanded: !n.data?.isExpanded } } : n));
  };

  const handleNodeClick = (nodeData: NodeData) => {
    setSelectedNode(nodeData);
    setIsDrawerOpen(true);
  };

  const generateNodesAndEdges = useCallback((data: IdeaResult) => {
    const newNodes: Node<NodeData>[] = [];
    const newEdges: Edge[] = [];

    newNodes.push({
      id: 'summary',
      type: 'summary',
      position: { x: 0, y: 0 },
      data: {
        label: 'Summary',
        type: 'summary',
        content: data.summary,
        nodeId: 'summary',
        isExpanded: false,
        onToggleExpand: () => toggleNodeExpansion('summary'),
        onClick: () => handleNodeClick({ label: 'Summary', type: 'summary', content: data.summary, nodeId: 'summary' })
      }
    });

    const childNodeTypes = [
      { id: 'segments', type: 'segments', label: 'Target Segments', content: data.segments },
      { id: 'features', type: 'features', label: 'Core Features', content: data.features },
      { id: 'risks', type: 'risks', label: 'Risks & Mitigations', content: data.risks },
      { id: 'social_fit', type: 'social_fit', label: 'Social Platform Fit', content: data.social_fit },
      { id: 'improvements', type: 'improvements', label: 'Improvements', content: data.improvements_by_segment },
      { id: 'followups', type: 'followups', label: 'Follow-up Questions', content: data.followups }
    ] as const;

    childNodeTypes.forEach((nodeType) => {
      newNodes.push({
        id: nodeType.id,
        type: nodeType.type as NodeData['type'],
        position: { x: 0, y: 0 },
        data: {
          label: nodeType.label,
          type: nodeType.type as NodeData['type'],
          content: nodeType.content as any,
          nodeId: nodeType.id,
          isExpanded: false,
          onToggleExpand: () => toggleNodeExpansion(nodeType.id),
          onClick: () => handleNodeClick({ label: nodeType.label, type: nodeType.type as NodeData['type'], content: nodeType.content as any, nodeId: nodeType.id })
        }
      });

      newEdges.push({ id: `summary-${nodeType.id}`, source: 'summary', target: nodeType.id, type: 'smoothstep' });
    });

    return { nodes: newNodes, edges: newEdges };
  }, []);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const layoutFromLatest = useCallback(() => {
    if (!latestResult) return;
    const { nodes: newNodes, edges: newEdges } = generateNodesAndEdges(latestResult);
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(newNodes, newEdges, { direction: 'TB', nodeWidth: 320, nodeHeight: 200, rankSep: 120, nodeSep: 100 });
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [latestResult, generateNodesAndEdges, setNodes, setEdges]);

  React.useEffect(() => {
    if (activeTab === 'map') layoutFromLatest();
  }, [activeTab, layoutFromLatest]);

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">

      <nav className="relative z-10 flex items-center py-6 px-8 w-full max-w-7xl mx-auto bg-black">
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="ml-1 text-sm text-white font-mono">MarketLens™️</span>
        </div>
        <div className="hidden font-mono bg-white/5 md:flex gap-6 px-4 py-2 text-xs absolute left-1/2 text-white -translate-x-1/2">
          <a href="/" className="px-3 py-2 hover:bg-white/10 transition">
            Home
          </a>
          <a href="/digest" className="px-3 py-2 hover:bg-white/10 transition">
            About
          </a>
          <a href="/waitlist" className="px-3 py-2 hover:bg-white/10 transition">
            Pricing
          </a>
          <a href="/waitlist" className="px-3 py-2 hover:bg-white/10 transition">
            Discovery ↗
          </a>
          <a href="/idea" className="px-3 py-2 hover:bg-white/10 transition bg-white/10">
            Ideas
          </a>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
          <button
            onClick={() => router.push("/login")}
            className="px-4 py-2 hover:bg-white/20 bg-white/5 text-xs text-white font-mono transition cursor-pointer"
          >
            Login ↗
          </button>
        </div>
      </nav>

      <div style={{ height: "1px", backgroundColor: 'white', opacity: 1 }} className="w-full mb-4"></div>

      <main className="relative z-10 max-w-5xl mx-auto px-8 py-10">
        <div className="border border-white/10 bg-white/5 p-4 md:p-6">
          <div className="text-white font-mono text-sm mb-4 flex items-center justify-between">
            <span>Idea Assistant</span>
            {latestResult && (
              <div className="flex gap-2 text-xs">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`px-3 py-1 border ${activeTab==='chat' ? 'border-white/60 text-white' : 'border-white/20 text-white/60'}`}
                >Chat</button>
                <button
                  onClick={() => setActiveTab('map')}
                  className={`px-3 py-1 border ${activeTab==='map' ? 'border-white/60 text-white' : 'border-white/20 text-white/60'}`}
                >Map</button>
              </div>
            )}
          </div>
          {activeTab === 'map' && latestResult && (
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-white text-sm">🗺️ Idea Map</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsScoutDrawerOpen(true)}
                    className="px-3 py-1 text-xs bg-emerald-700 text-white"
                  >Scout Market</button>
                  <button
                    onClick={layoutFromLatest}
                    className="px-3 py-1 text-xs bg-indigo-700 text-white"
                  >Auto Layout</button>
                </div>
              </div>
              <div style={{ height: 560 }} className="border border-white/10 bg-black/40 rounded">
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  nodeTypes={nodeTypes}
                  fitView
                  attributionPosition="bottom-left"
                >
                  <Controls />
                  <MiniMap />
                  <Background />
                </ReactFlow>
              </div>
            </div>
          )}
          {activeTab === 'chat' && (
          <div className="h-[55vh] overflow-y-auto pr-2 space-y-4">
            {messages.length === 0 && (
              <div className="text-white/50 text-xs font-mono">
                Start by describing your product concept. I’ll expand it into target segments, features, risks, and KPIs.
              </div>
            )}

            {messages.map((m, idx) => (
              <div key={idx} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                {m.role === 'user' ? (
                  <div className="max-w-[80%] bg-white text-black px-3 py-2 text-xs font-mono">
                    {m.text}
                  </div>
                ) : (
                  <div className="max-w-[90%] w-full border border-white/10 bg-black/40 p-3 md:p-4 text-xs text-white/90 font-mono space-y-3">
                    <div>
                      <div className="text-white text-sm mb-1">Summary</div>
                      <div className="text-white/80">{m.result.summary}</div>
                    </div>

                    {m.result.segments?.length > 0 && (
                      <div>
                        <div className="text-white text-sm mb-1">Segments</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {m.result.segments.map((s, i) => (
                            <div key={i} className="border border-white/10 p-2">
                              <div className="text-white/90">{s.name}</div>
                              <div className="text-white/60">{s.why_it_fits}</div>
                              <div className="mt-1 flex flex-wrap gap-1">
                                {s.hooks.map((h, hi) => (
                                  <span key={hi} className="px-1.5 py-0.5 text-[10px] bg-white/10 text-white/80">{h}</span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {m.result.features?.length > 0 && (
                      <div>
                        <div className="text-white text-sm mb-1">Features</div>
                        <ul className="list-disc list-inside text-white/80 space-y-0.5">
                          {m.result.features.map((f, fi) => (
                            <li key={fi}>{f}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {m.result.risks?.length > 0 && (
                      <div>
                        <div className="text-white text-sm mb-1">Risks & Mitigations</div>
                        <ul className="space-y-1">
                          {m.result.risks.map((r, ri) => (
                            <li key={ri} className="border border-white/10 p-2">
                              <div className="text-white/90">{r.risk}</div>
                              <div className="text-white/60">{r.mitigation}</div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {m.result.social_fit?.length > 0 && (
                      <div>
                        <div className="text-white text-sm mb-1">Social Platform Fit</div>
                        <div className="flex flex-wrap gap-2">
                          {m.result.social_fit.map((sf, sfi) => (
                            <div key={sfi} className="border border-white/10 p-2">
                              <div className="text-white/90">{sf.platform}</div>
                              <div className="text-white/60 max-w-[32rem]">{sf.why}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {m.result.improvements_by_segment?.length > 0 && (
                      <div>
                        <div className="text-white text-sm mb-1">Improvements by Segment</div>
                        <div className="space-y-2">
                          {m.result.improvements_by_segment.map((imp, ii) => (
                            <div key={ii} className="border border-white/10 p-2">
                              <div className="text-white/90">{imp.segment}</div>
                              <ul className="list-disc list-inside text-white/80 space-y-0.5">
                                {imp.ideas.map((idea, idI) => (
                                  <li key={idI}>{idea}</li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {m.result.followups?.length > 0 && (
                      <div>
                        <div className="text-white text-sm mb-1">Follow-up Questions</div>
                        <ul className="list-disc list-inside text-white/80 space-y-0.5">
                          {m.result.followups.map((q, qi) => (
                            <li key={qi}>{q}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {m.savedId && (
                      <div className="pt-2">
                        <a
                          href={`/marketlens/phase-2?ideaId=${m.savedId}`}
                          className="inline-flex items-center px-3 py-1.5 bg-white text-black text-xs"
                        >
                          Proceed to Phase 2 →
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          )}

          {error && (
            <div className="mt-3 text-xs text-red-300 font-mono">{error}</div>
          )}

          {activeTab === 'chat' && (
          <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g., A smart recipe app that orders missing ingredients"
              className="flex-1 h-20 bg-black/40 border border-white/10 text-white text-xs p-2 font-mono outline-none"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="h-10 px-4 bg-white text-black text-xs font-mono disabled:opacity-50"
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <span
                    className="inline-block"
                    style={{
                      width: '1rem',
                      height: '1rem',
                      border: '2px solid rgba(0,0,0,0.3)',
                      borderTop: '2px solid black',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}
                  />
                  Generating
                </span>
              ) : (
                <span>Send</span>
              )}
            </button>
          </form>
          )}
        </div>
      </main>

      {/* Drawers */}
      <EvidenceDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        selectedNode={selectedNode}
      />
      <ScoutDrawer
        isOpen={isScoutDrawerOpen}
        onClose={() => setIsScoutDrawerOpen(false)}
      />
    </div>
  );
};

export default IdeaPage;
