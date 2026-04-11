import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { IdeationResponseT } from '@/lib/schema';

export interface NodeData {
  label: string;
  type: 'summary' | 'segments' | 'features' | 'risks' | 'social_fit' | 'improvements' | 'followups';
  content: string | IdeationResponseT['segments'] | IdeationResponseT['features'] | IdeationResponseT['risks'] | IdeationResponseT['social_fit'] | IdeationResponseT['improvements_by_segment'] | IdeationResponseT['followups'];
  nodeId?: string;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onClick?: () => void;
}

const nodeStyles = {
  base: {
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(0,0,0,0.3)',
    backdropFilter: 'blur(12px)',
    color: 'white',
    fontSize: '14px',
    minWidth: '280px',
    maxWidth: '320px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  summary: {
    background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.3), rgba(37, 99, 235, 0.3))',
    borderColor: 'rgba(147, 51, 234, 0.5)',
  },
  segments: {
    background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.3), rgba(196, 181, 253, 0.3))',
    borderColor: 'rgba(167, 139, 250, 0.5)',
  },
  features: {
    background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.3), rgba(110, 231, 183, 0.3))',
    borderColor: 'rgba(52, 211, 153, 0.5)',
  },
  risks: {
    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.3), rgba(252, 165, 165, 0.3))',
    borderColor: 'rgba(239, 68, 68, 0.5)',
  },
  social_fit: {
    background: 'linear-gradient(135deg, rgba(96, 165, 250, 0.3), rgba(147, 197, 253, 0.3))',
    borderColor: 'rgba(96, 165, 250, 0.5)',
  },
  improvements: {
    background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.3), rgba(252, 211, 77, 0.3))',
    borderColor: 'rgba(251, 191, 36, 0.5)',
  },
  followups: {
    background: 'linear-gradient(135deg, rgba(156, 163, 175, 0.3), rgba(209, 213, 219, 0.3))',
    borderColor: 'rgba(156, 163, 175, 0.5)',
  },
};

export function SummaryNode({ data, selected }: NodeProps<NodeData>) {
  const style = {
    ...nodeStyles.base,
    ...nodeStyles.summary,
    boxShadow: selected ? '0 0 0 2px rgba(147, 51, 234, 0.8)' : 'none',
  };

  return (
    <div style={style} onClick={data.onClick}>
      <Handle type="source" position={Position.Bottom} />
      <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '16px' }}>
        📋 Summary
      </div>
      <div style={{ 
        overflow: 'hidden', 
        textOverflow: 'ellipsis', 
        display: '-webkit-box',
        WebkitLineClamp: data.isExpanded ? 'none' : 3,
        WebkitBoxOrient: 'vertical',
        lineHeight: '1.4'
      }}>
        {typeof data.content === 'string' ? data.content : 'Content preview'}
      </div>
      {data.onToggleExpand && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            data.onToggleExpand?.();
          }}
          style={{
            marginTop: '8px',
            padding: '4px 8px',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '4px',
            color: 'white',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          {data.isExpanded ? 'Collapse' : 'Expand'}
        </button>
      )}
    </div>
  );
}

export function SegmentsNode({ data, selected }: NodeProps<NodeData>) {
  const style = {
    ...nodeStyles.base,
    ...nodeStyles.segments,
    boxShadow: selected ? '0 0 0 2px rgba(167, 139, 250, 0.8)' : 'none',
  };

  const segments = data.content as IdeationResponseT['segments'];

  return (
    <div style={style} onClick={data.onClick}>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '16px' }}>
        👥 Target Segments ({segments.length})
      </div>
      <div style={{ maxHeight: data.isExpanded ? 'none' : '100px', overflow: 'hidden' }}>
        {segments.slice(0, data.isExpanded ? segments.length : 2).map((segment, i) => (
          <div key={i} style={{ 
            marginBottom: '6px', 
            padding: '6px', 
            background: 'rgba(255,255,255,0.1)', 
            borderRadius: '4px',
            fontSize: '12px'
          }}>
            <div style={{ fontWeight: '500', color: '#c4b5fd' }}>{segment.name}</div>
            <div style={{ color: '#d1d5db', fontSize: '11px' }}>
              {segment.hooks.length} hooks • {segment.kpis.length} KPIs
            </div>
          </div>
        ))}
      </div>
      {data.onToggleExpand && segments.length > 2 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            data.onToggleExpand?.();
          }}
          style={{
            marginTop: '8px',
            padding: '4px 8px',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '4px',
            color: 'white',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          {data.isExpanded ? 'Collapse' : `Show all ${segments.length}`}
        </button>
      )}
    </div>
  );
}

export function FeaturesNode({ data, selected }: NodeProps<NodeData>) {
  const style = {
    ...nodeStyles.base,
    ...nodeStyles.features,
    boxShadow: selected ? '0 0 0 2px rgba(52, 211, 153, 0.8)' : 'none',
  };

  const features = data.content as IdeationResponseT['features'];

  return (
    <div style={style} onClick={data.onClick}>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '16px' }}>
        ⚡ Core Features ({features.length})
      </div>
      <div style={{ maxHeight: data.isExpanded ? 'none' : '100px', overflow: 'hidden' }}>
        {features.slice(0, data.isExpanded ? features.length : 3).map((feature, i) => (
          <div key={i} style={{ 
            marginBottom: '4px', 
            padding: '4px 8px', 
            background: 'rgba(255,255,255,0.1)', 
            borderRadius: '4px',
            fontSize: '12px',
            color: '#6ee7b7'
          }}>
            • {feature}
          </div>
        ))}
      </div>
      {data.onToggleExpand && features.length > 3 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            data.onToggleExpand?.();
          }}
          style={{
            marginTop: '8px',
            padding: '4px 8px',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '4px',
            color: 'white',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          {data.isExpanded ? 'Collapse' : `Show all ${features.length}`}
        </button>
      )}
    </div>
  );
}

export function RisksNode({ data, selected }: NodeProps<NodeData>) {
  const style = {
    ...nodeStyles.base,
    ...nodeStyles.risks,
    boxShadow: selected ? '0 0 0 2px rgba(239, 68, 68, 0.8)' : 'none',
  };

  const risks = data.content as IdeationResponseT['risks'];

  return (
    <div style={style} onClick={data.onClick}>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '16px' }}>
        ⚠️ Risks & Mitigations ({risks.length})
      </div>
      <div style={{ maxHeight: data.isExpanded ? 'none' : '100px', overflow: 'hidden' }}>
        {risks.slice(0, data.isExpanded ? risks.length : 2).map((risk, i) => (
          <div key={i} style={{ 
            marginBottom: '6px', 
            padding: '6px', 
            background: 'rgba(255,255,255,0.1)', 
            borderRadius: '4px',
            fontSize: '12px'
          }}>
            <div style={{ fontWeight: '500', color: '#fca5a5', marginBottom: '2px' }}>
              {risk.risk}
            </div>
            <div style={{ color: '#86efac', fontSize: '11px' }}>
              → {risk.mitigation}
            </div>
          </div>
        ))}
      </div>
      {data.onToggleExpand && risks.length > 2 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            data.onToggleExpand?.();
          }}
          style={{
            marginTop: '8px',
            padding: '4px 8px',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '4px',
            color: 'white',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          {data.isExpanded ? 'Collapse' : `Show all ${risks.length}`}
        </button>
      )}
    </div>
  );
}

export function SocialFitNode({ data, selected }: NodeProps<NodeData>) {
  const style = {
    ...nodeStyles.base,
    ...nodeStyles.social_fit,
    boxShadow: selected ? '0 0 0 2px rgba(96, 165, 250, 0.8)' : 'none',
  };

  const socialFit = data.content as IdeationResponseT['social_fit'];

  return (
    <div style={style} onClick={data.onClick}>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '16px' }}>
        📱 Social Platform Fit ({socialFit.length})
      </div>
      <div style={{ maxHeight: data.isExpanded ? 'none' : '100px', overflow: 'hidden' }}>
        {socialFit.slice(0, data.isExpanded ? socialFit.length : 3).map((social, i) => (
          <div key={i} style={{ 
            marginBottom: '4px', 
            padding: '4px 8px', 
            background: 'rgba(255,255,255,0.1)', 
            borderRadius: '4px',
            fontSize: '12px'
          }}>
            <span style={{ fontWeight: '500', color: '#93c5fd' }}>{social.platform}</span>
            <div style={{ color: '#d1d5db', fontSize: '11px' }}>{social.why}</div>
          </div>
        ))}
      </div>
      {data.onToggleExpand && socialFit.length > 3 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            data.onToggleExpand?.();
          }}
          style={{
            marginTop: '8px',
            padding: '4px 8px',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '4px',
            color: 'white',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          {data.isExpanded ? 'Collapse' : `Show all ${socialFit.length}`}
        </button>
      )}
    </div>
  );
}

export function ImprovementsNode({ data, selected }: NodeProps<NodeData>) {
  const style = {
    ...nodeStyles.base,
    ...nodeStyles.improvements,
    boxShadow: selected ? '0 0 0 2px rgba(251, 191, 36, 0.8)' : 'none',
  };

  const improvements = data.content as IdeationResponseT['improvements_by_segment'];

  return (
    <div style={style} onClick={data.onClick}>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '16px' }}>
        💡 Improvements ({improvements.length})
      </div>
      <div style={{ maxHeight: data.isExpanded ? 'none' : '100px', overflow: 'hidden' }}>
        {improvements.slice(0, data.isExpanded ? improvements.length : 2).map((improvement, i) => (
          <div key={i} style={{ 
            marginBottom: '6px', 
            padding: '6px', 
            background: 'rgba(255,255,255,0.1)', 
            borderRadius: '4px',
            fontSize: '12px'
          }}>
            <div style={{ fontWeight: '500', color: '#fbbf24', marginBottom: '2px' }}>
              {improvement.segment}
            </div>
            <div style={{ color: '#d1d5db', fontSize: '11px' }}>
              {improvement.ideas.length} improvement ideas
            </div>
          </div>
        ))}
      </div>
      {data.onToggleExpand && improvements.length > 2 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            data.onToggleExpand?.();
          }}
          style={{
            marginTop: '8px',
            padding: '4px 8px',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '4px',
            color: 'white',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          {data.isExpanded ? 'Collapse' : `Show all ${improvements.length}`}
        </button>
      )}
    </div>
  );
}

export function FollowupsNode({ data, selected }: NodeProps<NodeData>) {
  const style = {
    ...nodeStyles.base,
    ...nodeStyles.followups,
    boxShadow: selected ? '0 0 0 2px rgba(156, 163, 175, 0.8)' : 'none',
  };

  const followups = data.content as IdeationResponseT['followups'];

  return (
    <div style={style} onClick={data.onClick}>
      <Handle type="target" position={Position.Top} />
      <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '16px' }}>
        ❓ Follow-up Questions ({followups.length})
      </div>
      <div style={{ maxHeight: data.isExpanded ? 'none' : '100px', overflow: 'hidden' }}>
        {followups.slice(0, data.isExpanded ? followups.length : 2).map((question, i) => (
          <div key={i} style={{ 
            marginBottom: '4px', 
            padding: '4px 8px', 
            background: 'rgba(255,255,255,0.1)', 
            borderRadius: '4px',
            fontSize: '12px',
            color: '#d1d5db'
          }}>
            • {question}
          </div>
        ))}
      </div>
      {data.onToggleExpand && followups.length > 2 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            data.onToggleExpand?.();
          }}
          style={{
            marginTop: '8px',
            padding: '4px 8px',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '4px',
            color: 'white',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          {data.isExpanded ? 'Collapse' : `Show all ${followups.length}`}
        </button>
      )}
    </div>
  );
}

// Node type mapping
export const nodeTypes = {
  summary: SummaryNode,
  segments: SegmentsNode,
  features: FeaturesNode,
  risks: RisksNode,
  social_fit: SocialFitNode,
  improvements: ImprovementsNode,
  followups: FollowupsNode,
};
