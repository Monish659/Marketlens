'use client';

import React, { useState, useCallback } from 'react';
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
import { type IdeationResponseT, type CritiqueResponseT, type RefinedResponseT } from '@/lib/schema';
import { getLayoutedElements } from '@/lib/flow/layout';
import { nodeTypes, NodeData } from '@/components/flow/IdeaNodes';
import { EvidenceDrawer } from '@/components/flow/EvidenceDrawer';
import { ScoutDrawer } from '@/components/flow/ScoutDrawer';

interface ApiResponse {
  id: string;
  result: IdeationResponseT;
}


export default function Phase1Page() {
  const [idea, setIdea] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<IdeationResponseT | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [critic, setCritic] = useState<CritiqueResponseT | null>(null);
  const [isCriticLoading, setIsCriticLoading] = useState(false);
  const [refiner, setRefiner] = useState<RefinedResponseT | null>(null);
  const [isRefinerLoading, setIsRefinerLoading] = useState(false);
  const [showAnswersDialog, setShowAnswersDialog] = useState(false);
  const [followupAnswers, setFollowupAnswers] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'plan' | 'critic' | 'final' | 'map'>('plan');
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isScoutDrawerOpen, setIsScoutDrawerOpen] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idea.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ideate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idea: idea.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate concept');
      }

      const data: ApiResponse = await response.json();
      setResult(data.result);
      setSavedId(data.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleSubmit(e as React.FormEvent);
    }
  };

  const handleCriticSubmit = async () => {
    if (!savedId || isCriticLoading) return;

    setIsCriticLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ideate/critic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: savedId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate critic review');
      }

      setCritic(data.critic);
      setActiveTab('critic');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsCriticLoading(false);
    }
  };

  const handleRefinerSubmit = async (answers?: string[]) => {
    if (!savedId || isRefinerLoading) return;

    setIsRefinerLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ideate/refine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          id: savedId,
          answers: answers || followupAnswers.filter(a => a.trim())
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate refined plan');
      }

      setRefiner(data.refiner);
      setActiveTab('final');
      setShowAnswersDialog(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsRefinerLoading(false);
    }
  };

  const handleApplyFixes = () => {
    if (result?.followups && result.followups.length > 0) {
      setFollowupAnswers(new Array(result.followups.length).fill(''));
      setShowAnswersDialog(true);
    } else {
      handleRefinerSubmit();
    }
  };

  // React Flow helper functions
  const generateNodesAndEdges = useCallback((data: IdeationResponseT) => {
    const newNodes: Node<NodeData>[] = [];
    const newEdges: Edge[] = [];

    // Summary node (root)
    newNodes.push({
      id: 'summary',
      type: 'summary',
      position: { x: 0, y: 0 },
      data: {
        label: 'Summary',
        type: 'summary',
        content: data.summary,
        nodeId: 'summary',
        isExpanded: expandedNodes.has('summary'),
        onToggleExpand: () => toggleNodeExpansion('summary'),
        onClick: () => handleNodeClick({
          label: 'Summary',
          type: 'summary',
          content: data.summary,
          nodeId: 'summary'
        })
      }
    });

    // Child nodes
    const childNodeTypes = [
      { id: 'segments', type: 'segments', label: 'Target Segments', content: data.segments },
      { id: 'features', type: 'features', label: 'Core Features', content: data.features },
      { id: 'risks', type: 'risks', label: 'Risks & Mitigations', content: data.risks },
      { id: 'social_fit', type: 'social_fit', label: 'Social Platform Fit', content: data.social_fit },
      { id: 'improvements', type: 'improvements', label: 'Improvements', content: data.improvements_by_segment },
      { id: 'followups', type: 'followups', label: 'Follow-up Questions', content: data.followups }
    ];

    childNodeTypes.forEach((nodeType) => {
      newNodes.push({
        id: nodeType.id,
        type: nodeType.type,
        position: { x: 0, y: 0 },
        data: {
          label: nodeType.label,
          type: nodeType.type as NodeData['type'],
          content: nodeType.content,
          nodeId: nodeType.id,
          isExpanded: expandedNodes.has(nodeType.id),
          onToggleExpand: () => toggleNodeExpansion(nodeType.id),
          onClick: () => handleNodeClick({
            label: nodeType.label,
            type: nodeType.type as NodeData['type'],
            content: nodeType.content,
            nodeId: nodeType.id
          })
        }
      });

      // Create edge from summary to child
      newEdges.push({
        id: `summary-${nodeType.id}`,
        source: 'summary',
        target: nodeType.id,
        type: 'smoothstep'
      });
    });

    return { nodes: newNodes, edges: newEdges };
  }, [expandedNodes]);

  const toggleNodeExpansion = (nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const handleNodeClick = (nodeData: NodeData) => {
    setSelectedNode(nodeData);
    setIsDrawerOpen(true);
  };

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onLayout = useCallback(() => {
    if (result) {
      const { nodes: newNodes, edges: newEdges } = generateNodesAndEdges(result);
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        newNodes,
        newEdges,
        { direction: 'TB', nodeWidth: 320, nodeHeight: 200, rankSep: 120, nodeSep: 100 }
      );
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    }
  }, [result, generateNodesAndEdges, setNodes, setEdges]);

  // Generate nodes when result changes or when switching to map tab
  const initializeMap = useCallback(() => {
    if (result && activeTab === 'map') {
      const { nodes: newNodes, edges: newEdges } = generateNodesAndEdges(result);
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        newNodes,
        newEdges,
        { direction: 'TB', nodeWidth: 320, nodeHeight: 200, rankSep: 120, nodeSep: 100 }
      );
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    }
  }, [result, activeTab, generateNodesAndEdges, setNodes, setEdges]);

  // Initialize map when switching to map tab
  React.useEffect(() => {
    initializeMap();
  }, [initializeMap]);


  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a, #581c87, #0f172a)', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: '64rem', margin: '0 auto' }}>
        {/* Persistent Idea Input Area */}
        <div style={{ 
          backgroundColor: 'rgba(0,0,0,0.2)', 
          backdropFilter: 'blur(24px)', 
          border: '1px solid rgba(255,255,255,0.1)', 
          borderRadius: '1rem', 
          padding: result ? '1.5rem' : '2rem',
          marginBottom: result ? '1.5rem' : '0',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: result ? '1.5rem' : '2rem' }}>
            <h1 style={{ fontSize: result ? '1.5rem' : '2.25rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>
              Write your project idea
            </h1>
            {!result && (
              <p style={{ fontSize: '1.125rem', color: '#d1d5db', maxWidth: '42rem', margin: '0 auto' }}>
                Describe your product concept. We&apos;ll expand it into audiences, features, risks & KPIs.
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label htmlFor="idea-input" style={{ position: 'absolute', width: '1px', height: '1px', padding: '0', margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: '0' }}>
                Product idea
              </label>
              <textarea
                id="idea-input"
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g., A smart recipe app that orders missing ingredients"
                style={{
                  width: '100%',
                  height: result ? '4rem' : '8rem',
                  padding: '0.75rem 1rem',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '0.75rem',
                  color: 'white',
                  fontSize: '1rem',
                  resize: 'none',
                  outline: 'none'
                }}
                disabled={isLoading}
              />
            </div>

            {error && (
              <div style={{ color: '#f87171', fontSize: '0.875rem', textAlign: 'center', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '0.5rem', padding: '0.75rem' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <button
                type="submit"
                disabled={!idea.trim() || isLoading}
                style={{
                  flex: result ? 'none' : '1',
                  padding: '0.75rem 1.5rem',
                  background: isLoading || !idea.trim() ? 'linear-gradient(to right, #4b5563, #6b7280)' : 'linear-gradient(to right, #9333ea, #2563eb)',
                  color: 'white',
                  fontWeight: '600',
                  borderRadius: '0.75rem',
                  border: 'none',
                  cursor: isLoading || !idea.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                {isLoading ? (
                  <>
                    <div style={{ 
                      width: '1rem', 
                      height: '1rem', 
                      border: '2px solid rgba(255,255,255,0.3)', 
                      borderTop: '2px solid white', 
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} className="spinner"></div>
                    <span>Generating...</span>
                  </>
                ) : (
                  <span>{result ? 'Update' : 'Generate concept'}</span>
                )}
              </button>
              
              {result && (
                <button
                  type="button"
                  onClick={() => {
                    setResult(null);
                    setCritic(null);
                    setRefiner(null);
                    setSavedId(null);
                    setActiveTab('plan');
                    setIdea('');
                  }}
                  style={{
                    padding: '0.75rem 1rem',
                    background: 'rgba(107, 114, 128, 0.5)',
                    color: 'white',
                    fontWeight: '500',
                    borderRadius: '0.75rem',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Clear
                </button>
              )}
            </div>

            {!result && (
              <p style={{ fontSize: '0.875rem', color: '#9ca3af', textAlign: 'center' }}>
                Press Cmd + Enter to submit
              </p>
            )}
          </form>
        </div>

        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Tab Navigation */}
              <div style={{ 
                backgroundColor: 'rgba(0,0,0,0.2)', 
                backdropFilter: 'blur(24px)', 
                border: '1px solid rgba(255,255,255,0.1)', 
                borderRadius: '1rem', 
                padding: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <button
                    onClick={() => setActiveTab('plan')}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: 'none',
                      border: 'none',
                      color: activeTab === 'plan' ? '#60a5fa' : '#9ca3af',
                      borderBottom: activeTab === 'plan' ? '2px solid #60a5fa' : '2px solid transparent',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      fontWeight: '500'
                    }}
                  >
                    Plan
                  </button>
                  <button
                    onClick={() => setActiveTab('critic')}
                    disabled={!critic}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: 'none',
                      border: 'none',
                      color: activeTab === 'critic' ? '#60a5fa' : '#9ca3af',
                      borderBottom: activeTab === 'critic' ? '2px solid #60a5fa' : '2px solid transparent',
                      cursor: critic ? 'pointer' : 'not-allowed',
                      fontSize: '1rem',
                      fontWeight: '500',
                      opacity: critic ? 1 : 0.5
                    }}
                  >
                    Critic Notes
                  </button>
                  <button
                    onClick={() => setActiveTab('final')}
                    disabled={!refiner}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: 'none',
                      border: 'none',
                      color: activeTab === 'final' ? '#60a5fa' : '#9ca3af',
                      borderBottom: activeTab === 'final' ? '2px solid #60a5fa' : '2px solid transparent',
                      cursor: refiner ? 'pointer' : 'not-allowed',
                      fontSize: '1rem',
                      fontWeight: '500',
                      opacity: refiner ? 1 : 0.5
                    }}
                  >
                    Final Plan
                  </button>
                  <button
                    onClick={() => setActiveTab('map')}
                    disabled={!result}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: 'none',
                      border: 'none',
                      color: activeTab === 'map' ? '#60a5fa' : '#9ca3af',
                      borderBottom: activeTab === 'map' ? '2px solid #60a5fa' : '2px solid transparent',
                      cursor: result ? 'pointer' : 'not-allowed',
                      fontSize: '1rem',
                      fontWeight: '500',
                      opacity: result ? 1 : 0.5
                    }}
                  >
                    Map
                  </button>
                </div>
                
                {savedId && !critic && (
                  <button
                    onClick={handleCriticSubmit}
                    disabled={isCriticLoading}
                    style={{
                      padding: '0.5rem 1rem',
                      background: isCriticLoading ? 'linear-gradient(to right, #4b5563, #6b7280)' : 'linear-gradient(to right, #dc2626, #b91c1c)',
                      color: 'white',
                      fontWeight: '500',
                      borderRadius: '0.5rem',
                      border: 'none',
                      cursor: isCriticLoading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    {isCriticLoading ? (
                      <>
                        <div style={{ 
                          width: '1rem', 
                          height: '1rem', 
                          border: '2px solid rgba(255,255,255,0.3)', 
                          borderTop: '2px solid white', 
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }} className="spinner"></div>
                        <span>Reviewing...</span>
                      </>
                    ) : (
                      <span>Generate Critic Review</span>
                    )}
                  </button>
                )}
              </div>

              {activeTab === 'plan' && (
                <>
                  {/* Summary */}
                  <div style={{ 
                    backgroundColor: 'rgba(0,0,0,0.2)', 
                    backdropFilter: 'blur(24px)', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    borderRadius: '1rem', 
                    padding: '1.5rem'
                  }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white', marginBottom: '1rem' }}>Summary</h2>
                    <p style={{ color: '#d1d5db', lineHeight: '1.625' }}>{result.summary}</p>
                  </div>

              {/* Target Segments */}
              <div style={{ 
                backgroundColor: 'rgba(0,0,0,0.2)', 
                backdropFilter: 'blur(24px)', 
                border: '1px solid rgba(255,255,255,0.1)', 
                borderRadius: '1rem', 
                padding: '1.5rem'
              }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white', marginBottom: '1rem' }}>Target Segments</h2>
                <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                  {result.segments.map((segment, index) => (
                    <div key={index} style={{ 
                      backgroundColor: 'rgba(255,255,255,0.05)', 
                      border: '1px solid rgba(255,255,255,0.1)', 
                      borderRadius: '0.75rem', 
                      padding: '1rem'
                    }}>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'white', marginBottom: '0.5rem' }}>
                        {segment.name}
                      </h3>
                      <p style={{ color: '#d1d5db', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                        {segment.why_it_fits}
                      </p>
                      
                      <div style={{ marginBottom: '0.75rem' }}>
                        <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#a78bfa', marginBottom: '0.25rem' }}>Hooks</h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                          {segment.hooks.map((hook, i) => (
                            <span key={i} style={{ 
                              padding: '0.125rem 0.5rem', 
                              backgroundColor: 'rgba(167, 139, 250, 0.2)', 
                              color: '#c4b5fd', 
                              fontSize: '0.75rem', 
                              borderRadius: '9999px',
                              border: '1px solid rgba(167, 139, 250, 0.3)'
                            }}>
                              {hook}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div style={{ marginBottom: '0.75rem' }}>
                        <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#34d399', marginBottom: '0.25rem' }}>KPIs</h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                          {segment.kpis.map((kpi, i) => (
                            <span key={i} style={{ 
                              padding: '0.125rem 0.5rem', 
                              backgroundColor: 'rgba(52, 211, 153, 0.2)', 
                              color: '#6ee7b7', 
                              fontSize: '0.75rem', 
                              borderRadius: '9999px',
                              border: '1px solid rgba(52, 211, 153, 0.3)'
                            }}>
                              {kpi}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#60a5fa', marginBottom: '0.25rem' }}>Platform Fit</h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                          {segment.platform_fit.map((platform, i) => (
                            <span key={i} style={{ 
                              padding: '0.125rem 0.5rem', 
                              backgroundColor: 'rgba(96, 165, 250, 0.2)', 
                              color: '#93c5fd', 
                              fontSize: '0.75rem', 
                              borderRadius: '9999px',
                              border: '1px solid rgba(96, 165, 250, 0.3)'
                            }}>
                              {platform}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Core Features */}
              <div style={{ 
                backgroundColor: 'rgba(0,0,0,0.2)', 
                backdropFilter: 'blur(24px)', 
                border: '1px solid rgba(255,255,255,0.1)', 
                borderRadius: '1rem', 
                padding: '1.5rem'
              }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white', marginBottom: '1rem' }}>Core Features</h2>
                <ul style={{ color: '#d1d5db', paddingLeft: '1.25rem' }}>
                  {result.features.map((feature, index) => (
                    <li key={index} style={{ marginBottom: '0.5rem' }}>{feature}</li>
                  ))}
                </ul>
              </div>

              {/* Risks & Mitigations */}
              <div style={{ 
                backgroundColor: 'rgba(0,0,0,0.2)', 
                backdropFilter: 'blur(24px)', 
                border: '1px solid rgba(255,255,255,0.1)', 
                borderRadius: '1rem', 
                padding: '1.5rem'
              }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white', marginBottom: '1rem' }}>Risks & Mitigations</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {result.risks.map((risk, index) => (
                    <div key={index} style={{ 
                      backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                      border: '1px solid rgba(239, 68, 68, 0.2)', 
                      borderRadius: '0.5rem', 
                      padding: '1rem'
                    }}>
                      <p style={{ color: '#fca5a5', marginBottom: '0.5rem' }}>
                        <strong>Risk:</strong> {risk.risk}
                      </p>
                      <p style={{ color: '#86efac' }}>
                        <strong>Mitigation:</strong> {risk.mitigation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Social Platform Fit */}
              <div style={{ 
                backgroundColor: 'rgba(0,0,0,0.2)', 
                backdropFilter: 'blur(24px)', 
                border: '1px solid rgba(255,255,255,0.1)', 
                borderRadius: '1rem', 
                padding: '1.5rem'
              }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white', marginBottom: '1rem' }}>Social Platform Fit</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {result.social_fit.map((social, index) => (
                    <div key={index} style={{ color: '#d1d5db' }}>
                      <strong style={{ color: '#60a5fa' }}>{social.platform}</strong> — {social.why}
                    </div>
                  ))}
                </div>
              </div>

              {/* Improvements by Segment */}
              <div style={{ 
                backgroundColor: 'rgba(0,0,0,0.2)', 
                backdropFilter: 'blur(24px)', 
                border: '1px solid rgba(255,255,255,0.1)', 
                borderRadius: '1rem', 
                padding: '1.5rem'
              }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white', marginBottom: '1rem' }}>Improvements by Segment</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {result.improvements_by_segment.map((improvement, index) => (
                    <div key={index}>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#a78bfa', marginBottom: '0.5rem' }}>
                        {improvement.segment}
                      </h3>
                      <ul style={{ color: '#d1d5db', paddingLeft: '1.25rem' }}>
                        {improvement.ideas.map((idea, i) => (
                          <li key={i} style={{ marginBottom: '0.25rem' }}>{idea}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* Follow-up Questions */}
              <div style={{ 
                backgroundColor: 'rgba(0,0,0,0.2)', 
                backdropFilter: 'blur(24px)', 
                border: '1px solid rgba(255,255,255,0.1)', 
                borderRadius: '1rem', 
                padding: '1.5rem'
              }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white', marginBottom: '1rem' }}>Follow-up Questions</h2>
                <ul style={{ color: '#d1d5db', paddingLeft: '1.25rem' }}>
                  {result.followups.map((question, index) => (
                    <li key={index} style={{ marginBottom: '0.5rem', cursor: 'pointer' }} onClick={() => console.log('Question clicked:', question)}>
                      {question}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Proceed Button */}
              <div style={{ 
                backgroundColor: 'rgba(0,0,0,0.2)', 
                backdropFilter: 'blur(24px)', 
                border: '1px solid rgba(255,255,255,0.1)', 
                borderRadius: '1rem', 
                padding: '1.5rem',
                textAlign: 'center'
              }}>
                {savedId && (
                  <div style={{ marginBottom: '1rem' }}>
                    <span style={{ 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      padding: '0.25rem 0.75rem', 
                      backgroundColor: 'rgba(34, 197, 94, 0.2)', 
                      color: '#86efac', 
                      fontSize: '0.875rem', 
                      borderRadius: '9999px', 
                      border: '1px solid rgba(34, 197, 94, 0.3)' 
                    }}>
                      ✓ Saved • ID: {savedId}
                    </span>
                  </div>
                )}
                
                <a
                  href={`/marketlens/phase-2?ideaId=${savedId}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '0.75rem 2rem',
                    background: 'linear-gradient(to right, #9333ea, #2563eb)',
                    color: 'white',
                    fontWeight: '600',
                    borderRadius: '0.75rem',
                    textDecoration: 'none'
                  }}
                >
                  Proceed to Phase 2 →
                </a>
              </div>
                </>
              )}

              {activeTab === 'critic' && critic && (
                <>
                  {/* Verdict */}
                  <div style={{ 
                    backgroundColor: 'rgba(0,0,0,0.2)', 
                    backdropFilter: 'blur(24px)', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    borderRadius: '1rem', 
                    padding: '1.5rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                      <span style={{ 
                        padding: '0.25rem 0.75rem', 
                        backgroundColor: critic.score >= 0.7 ? 'rgba(34, 197, 94, 0.2)' : critic.score >= 0.4 ? 'rgba(251, 191, 36, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: critic.score >= 0.7 ? '#86efac' : critic.score >= 0.4 ? '#fbbf24' : '#fca5a5',
                        fontSize: '0.875rem', 
                        borderRadius: '9999px', 
                        border: `1px solid ${critic.score >= 0.7 ? 'rgba(34, 197, 94, 0.3)' : critic.score >= 0.4 ? 'rgba(251, 191, 36, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                      }}>
                        Viability {critic.score.toFixed(2)}
                      </span>
                    </div>
                    <p style={{ color: '#d1d5db', lineHeight: '1.625' }}>{critic.summary}</p>
                  </div>

                  {/* Issues */}
                  <div style={{ 
                    backgroundColor: 'rgba(0,0,0,0.2)', 
                    backdropFilter: 'blur(24px)', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    borderRadius: '1rem', 
                    padding: '1.5rem'
                  }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white', marginBottom: '1rem' }}>Issues</h2>
                    {['high', 'medium', 'low'].map(severity => {
                      const severityIssues = critic.issues.filter(issue => issue.severity === severity);
                      if (severityIssues.length === 0) return null;
                      
                      return (
                        <div key={severity} style={{ marginBottom: '1.5rem' }}>
                          <h3 style={{ 
                            fontSize: '1.125rem', 
                            fontWeight: '600', 
                            color: severity === 'high' ? '#fca5a5' : severity === 'medium' ? '#fbbf24' : '#a3a3a3',
                            marginBottom: '0.75rem',
                            textTransform: 'capitalize'
                          }}>
                            {severity} Priority
                          </h3>
                          {severityIssues.map((issue, index) => (
                            <div key={index} style={{ 
                              backgroundColor: severity === 'high' ? 'rgba(239, 68, 68, 0.1)' : severity === 'medium' ? 'rgba(251, 191, 36, 0.1)' : 'rgba(156, 163, 175, 0.1)',
                              border: `1px solid ${severity === 'high' ? 'rgba(239, 68, 68, 0.2)' : severity === 'medium' ? 'rgba(251, 191, 36, 0.2)' : 'rgba(156, 163, 175, 0.2)'}`,
                              borderRadius: '0.5rem', 
                              padding: '1rem',
                              marginBottom: '0.75rem'
                            }}>
                              {issue.section && (
                                <div style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '0.25rem' }}>
                                  Section: {issue.section}
                                </div>
                              )}
                              <p style={{ color: '#d1d5db', marginBottom: '0.5rem', fontWeight: '500' }}>
                                {issue.reason}
                              </p>
                              <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                                Impact: {issue.impact}
                              </p>
                              {issue.evidence && (
                                <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.5rem', fontStyle: 'italic' }}>
                                  Evidence: {issue.evidence}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>

                  {/* Fixes */}
                  <div style={{ 
                    backgroundColor: 'rgba(0,0,0,0.2)', 
                    backdropFilter: 'blur(24px)', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    borderRadius: '1rem', 
                    padding: '1.5rem'
                  }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white', marginBottom: '1rem' }}>Suggested Fixes</h2>
                    {critic.fixes.map((fix, index) => (
                      <div key={index} style={{ 
                        backgroundColor: 'rgba(34, 197, 94, 0.1)', 
                        border: '1px solid rgba(34, 197, 94, 0.2)', 
                        borderRadius: '0.5rem', 
                        padding: '1rem',
                        marginBottom: '1rem'
                      }}>
                        <div style={{ fontSize: '0.875rem', color: '#86efac', marginBottom: '0.25rem', fontWeight: '500' }}>
                          {fix.section}
                        </div>
                        <p style={{ color: '#d1d5db', marginBottom: '0.5rem' }}>
                          <strong>Change:</strong> {fix.change}
                        </p>
                        <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                          <strong>Rationale:</strong> {fix.rationale}
                        </p>
                        {fix.example && (
                          <div style={{ 
                            backgroundColor: 'rgba(0,0,0,0.2)', 
                            padding: '0.75rem', 
                            borderRadius: '0.375rem', 
                            marginTop: '0.5rem',
                            fontSize: '0.875rem',
                            color: '#9ca3af',
                            fontFamily: 'monospace'
                          }}>
                            Example: {fix.example}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Meta Information */}
                  <div style={{ 
                    backgroundColor: 'rgba(0,0,0,0.2)', 
                    backdropFilter: 'blur(24px)', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    borderRadius: '1rem', 
                    padding: '1.5rem'
                  }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white', marginBottom: '1rem' }}>Research & Validation</h2>
                    
                    <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
                      {critic.meta.assumptions_to_validate.length > 0 && (
                        <div>
                          <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#a78bfa', marginBottom: '0.5rem' }}>
                            Assumptions to Validate
                          </h3>
                          {critic.meta.assumptions_to_validate.map((assumption, index) => (
                            <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.25rem' }}>
                              <input type="checkbox" disabled style={{ marginTop: '0.125rem' }} />
                              <span style={{ color: '#d1d5db', fontSize: '0.875rem' }}>{assumption}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {critic.meta.missing_data.length > 0 && (
                        <div>
                          <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#60a5fa', marginBottom: '0.5rem' }}>
                            Missing Data
                          </h3>
                          {critic.meta.missing_data.map((data, index) => (
                            <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.25rem' }}>
                              <input type="checkbox" disabled style={{ marginTop: '0.125rem' }} />
                              <span style={{ color: '#d1d5db', fontSize: '0.875rem' }}>{data}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {critic.meta.suggested_experiments.length > 0 && (
                        <div>
                          <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#34d399', marginBottom: '0.5rem' }}>
                            Suggested Experiments
                          </h3>
                          {critic.meta.suggested_experiments.map((experiment, index) => (
                            <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.25rem' }}>
                              <input type="checkbox" disabled style={{ marginTop: '0.125rem' }} />
                              <span style={{ color: '#d1d5db', fontSize: '0.875rem' }}>{experiment}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'critic' && critic && !refiner && (
                <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                  <button
                    onClick={handleApplyFixes}
                    disabled={isRefinerLoading}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: isRefinerLoading ? 'linear-gradient(to right, #4b5563, #6b7280)' : 'linear-gradient(to right, #059669, #047857)',
                      color: 'white',
                      fontWeight: '600',
                      borderRadius: '0.5rem',
                      border: 'none',
                      cursor: isRefinerLoading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      margin: '0 auto'
                    }}
                  >
                    {isRefinerLoading ? (
                      <>
                        <div style={{ 
                          width: '1rem', 
                          height: '1rem', 
                          border: '2px solid rgba(255,255,255,0.3)', 
                          borderTop: '2px solid white', 
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }} className="spinner"></div>
                        <span>Applying Fixes...</span>
                      </>
                    ) : (
                      <span>Apply Fixes & Generate Final Plan</span>
                    )}
                  </button>
                </div>
              )}

              {activeTab === 'map' && result && (
                <>
                  {/* Map Controls */}
                  <div style={{ 
                    backgroundColor: 'rgba(0,0,0,0.2)', 
                    backdropFilter: 'blur(24px)', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    borderRadius: '1rem', 
                    padding: '1rem',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white', margin: 0 }}>
                        🗺️ Idea Map
                      </h2>
                      <span style={{ 
                        fontSize: '0.875rem', 
                        color: '#9ca3af',
                        padding: '0.25rem 0.75rem',
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        borderRadius: '9999px'
                      }}>
                        {nodes.length} nodes
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => setIsScoutDrawerOpen(true)}
                        style={{
                          padding: '0.5rem 1rem',
                          background: 'linear-gradient(to right, #059669, #047857)',
                          color: 'white',
                          fontWeight: '500',
                          borderRadius: '0.5rem',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        🕵️ Scout Market
                      </button>
                      <button
                        onClick={onLayout}
                        style={{
                          padding: '0.5rem 1rem',
                          background: 'linear-gradient(to right, #9333ea, #2563eb)',
                          color: 'white',
                          fontWeight: '500',
                          borderRadius: '0.5rem',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.875rem'
                        }}
                      >
                        Auto Layout
                      </button>
                    </div>
                  </div>

                  {/* React Flow Canvas */}
                  <div style={{ 
                    backgroundColor: 'rgba(0,0,0,0.2)', 
                    backdropFilter: 'blur(24px)', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    borderRadius: '1rem', 
                    height: '600px',
                    overflow: 'hidden'
                  }}>
                    <ReactFlow
                      nodes={nodes}
                      edges={edges}
                      onNodesChange={onNodesChange}
                      onEdgesChange={onEdgesChange}
                      onConnect={onConnect}
                      nodeTypes={nodeTypes}
                      fitView
                      attributionPosition="bottom-left"
                      style={{
                        background: 'transparent'
                      }}
                    >
                      <Controls 
                        style={{
                          background: 'rgba(0,0,0,0.8)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '0.5rem'
                        }}
                      />
                      <MiniMap 
                        style={{
                          background: 'rgba(0,0,0,0.8)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '0.5rem'
                        }}
                        nodeColor="#9333ea"
                        maskColor="rgba(0,0,0,0.5)"
                      />
                      <Background 
                        gap={20} 
                        size={1} 
                        color="rgba(255,255,255,0.1)"
                      />
                    </ReactFlow>
                  </div>

                  {/* Instructions */}
                  <div style={{ 
                    backgroundColor: 'rgba(0,0,0,0.2)', 
                    backdropFilter: 'blur(24px)', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    borderRadius: '1rem', 
                    padding: '1rem',
                    marginTop: '1rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '1rem' }}>💡</span>
                      <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'white', margin: 0 }}>How to use the Map</h3>
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#d1d5db', lineHeight: '1.5' }}>
                      • <strong>Click nodes</strong> to expand/collapse content and view details in the Evidence Drawer<br/>
                      • <strong>Drag nodes</strong> to rearrange the layout manually<br/>
                      • <strong>Use Auto Layout</strong> to automatically organize nodes in a tree structure<br/>
                      • <strong>Zoom and pan</strong> to navigate around the canvas<br/>
                      • <strong>Use the minimap</strong> to see the full overview and navigate quickly
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'final' && refiner && (
                <>
                  {/* Uncertainty Score */}
                  <div style={{ 
                    backgroundColor: 'rgba(0,0,0,0.2)', 
                    backdropFilter: 'blur(24px)', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    borderRadius: '1rem', 
                    padding: '1.5rem',
                    marginBottom: '1.5rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                      <span style={{ 
                        padding: '0.25rem 0.75rem', 
                        backgroundColor: refiner.uncertainty_score <= 0.3 ? 'rgba(34, 197, 94, 0.2)' : refiner.uncertainty_score <= 0.6 ? 'rgba(251, 191, 36, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: refiner.uncertainty_score <= 0.3 ? '#86efac' : refiner.uncertainty_score <= 0.6 ? '#fbbf24' : '#fca5a5',
                        fontSize: '0.875rem', 
                        borderRadius: '9999px', 
                        border: `1px solid ${refiner.uncertainty_score <= 0.3 ? 'rgba(34, 197, 94, 0.3)' : refiner.uncertainty_score <= 0.6 ? 'rgba(251, 191, 36, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                      }}>
                        Uncertainty {(refiner.uncertainty_score * 100).toFixed(0)}%
                      </span>
                      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white', margin: 0 }}>Final Plan</h2>
                    </div>
                    
                    {refiner.assumptions && refiner.assumptions.length > 0 && (
                      <div style={{ marginTop: '1rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#fbbf24', marginBottom: '0.5rem' }}>Key Assumptions</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          {refiner.assumptions.map((assumption, index) => (
                            <span key={index} style={{ 
                              padding: '0.25rem 0.5rem', 
                              backgroundColor: 'rgba(251, 191, 36, 0.1)',
                              color: '#fbbf24',
                              fontSize: '0.75rem', 
                              borderRadius: '0.375rem',
                              border: '1px solid rgba(251, 191, 36, 0.2)'
                            }}>
                              {assumption}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Changes Made */}
                  <div style={{ 
                    backgroundColor: 'rgba(0,0,0,0.2)', 
                    backdropFilter: 'blur(24px)', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    borderRadius: '1rem', 
                    padding: '1.5rem',
                    marginBottom: '1.5rem'
                  }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white', marginBottom: '1rem' }}>Changes Made</h2>
                    {refiner.deltas.map((delta, index) => (
                      <div key={index} style={{ 
                        marginBottom: '1rem',
                        padding: '1rem',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        borderRadius: '0.5rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <span style={{ 
                            padding: '0.125rem 0.5rem', 
                            backgroundColor: 'rgba(59, 130, 246, 0.2)',
                            color: '#60a5fa',
                            fontSize: '0.75rem', 
                            borderRadius: '0.25rem',
                            fontWeight: '500'
                          }}>
                            {delta.section}
                          </span>
                          <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>{delta.path}</span>
                        </div>
                        <p style={{ color: '#d1d5db', fontSize: '0.875rem', lineHeight: '1.5', margin: 0 }}>{delta.rationale}</p>
                        {delta.before && delta.after && (
                          <div style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>
                            <div style={{ color: '#fca5a5', marginBottom: '0.25rem' }}>
                              <span style={{ fontWeight: '500' }}>Before:</span> {typeof delta.before === 'string' ? delta.before : JSON.stringify(delta.before)}
                            </div>
                            <div style={{ color: '#86efac' }}>
                              <span style={{ fontWeight: '500' }}>After:</span> {typeof delta.after === 'string' ? delta.after : JSON.stringify(delta.after)}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Final Plan Content - Same structure as original plan but using refiner.final */}
                  <div style={{ 
                    backgroundColor: 'rgba(0,0,0,0.2)', 
                    backdropFilter: 'blur(24px)', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    borderRadius: '1rem', 
                    padding: '1.5rem'
                  }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white', marginBottom: '1rem' }}>Refined Summary</h2>
                    <p style={{ color: '#d1d5db', lineHeight: '1.625' }}>{refiner.final.summary}</p>
                  </div>

                  {/* Refined Target Segments */}
                  <div style={{ 
                    backgroundColor: 'rgba(0,0,0,0.2)', 
                    backdropFilter: 'blur(24px)', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    borderRadius: '1rem', 
                    padding: '1.5rem'
                  }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white', marginBottom: '1rem' }}>Refined Target Segments</h2>
                    <div style={{ display: 'grid', gap: '1rem' }}>
                      {refiner.final.segments.map((segment, index) => (
                        <div key={index} style={{ 
                          padding: '1rem', 
                          backgroundColor: 'rgba(255,255,255,0.05)', 
                          borderRadius: '0.5rem',
                          border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'white', marginBottom: '0.5rem' }}>
                            {segment.name}
                          </h3>
                          <p style={{ color: '#d1d5db', fontSize: '0.875rem', marginBottom: '0.75rem' }}>{segment.why_it_fits}</p>
                          
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                            {segment.kpis.map((kpi, kpiIndex) => (
                              <span key={kpiIndex} style={{ 
                                padding: '0.25rem 0.5rem', 
                                backgroundColor: 'rgba(34, 197, 94, 0.2)',
                                color: '#86efac',
                                fontSize: '0.75rem', 
                                borderRadius: '0.375rem',
                                border: '1px solid rgba(34, 197, 94, 0.3)'
                              }}>
                                {kpi}
                              </span>
                            ))}
                          </div>
                          
                          <div style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
                            <strong>Platform Fit:</strong> {segment.platform_fit.join(', ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Follow-up Answers Dialog */}
              {showAnswersDialog && result?.followups && (
                <div style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1000
                }}>
                  <div style={{
                    backgroundColor: 'rgba(0,0,0,0.9)',
                    backdropFilter: 'blur(24px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '1rem',
                    padding: '2rem',
                    maxWidth: '32rem',
                    width: '90%',
                    maxHeight: '80vh',
                    overflow: 'auto'
                  }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white', marginBottom: '1rem' }}>
                      Answer Follow-up Questions (Optional)
                    </h3>
                    <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                      Provide answers to help refine the plan, or skip to apply fixes without additional context.
                    </p>
                    
                    {result.followups.map((question, index) => (
                      <div key={index} style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', color: '#d1d5db', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                          {question}
                        </label>
                        <textarea
                          value={followupAnswers[index] || ''}
                          onChange={(e) => {
                            const newAnswers = [...followupAnswers];
                            newAnswers[index] = e.target.value;
                            setFollowupAnswers(newAnswers);
                          }}
                          style={{
                            width: '100%',
                            minHeight: '4rem',
                            padding: '0.75rem',
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '0.5rem',
                            color: 'white',
                            fontSize: '0.875rem',
                            resize: 'vertical'
                          }}
                          placeholder="Optional answer..."
                        />
                      </div>
                    ))}
                    
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                      <button
                        onClick={() => handleRefinerSubmit()}
                        disabled={isRefinerLoading}
                        style={{
                          flex: 1,
                          padding: '0.75rem',
                          background: 'linear-gradient(to right, #059669, #047857)',
                          color: 'white',
                          fontWeight: '500',
                          borderRadius: '0.5rem',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        Apply Fixes
                      </button>
                      <button
                        onClick={() => setShowAnswersDialog(false)}
                        style={{
                          flex: 1,
                          padding: '0.75rem',
                          background: 'rgba(107, 114, 128, 0.5)',
                          color: 'white',
                          fontWeight: '500',
                          borderRadius: '0.5rem',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
          </div>
        )}
      </div>
      
      {/* Evidence Drawer */}
      <EvidenceDrawer 
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        selectedNode={selectedNode}
      />
      
      {/* Scout Drawer */}
      <ScoutDrawer 
        isOpen={isScoutDrawerOpen}
        onClose={() => setIsScoutDrawerOpen(false)}
      />
    </div>
  );
}
