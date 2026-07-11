'use client';

import { useEffect, useMemo, useRef } from 'react';
import cytoscape from 'cytoscape';
import fcose from 'cytoscape-fcose';
import { getTagStyle, getTagDimension, getCaseShade, TagDimension } from '@/app/lib/tagColors';

cytoscape.use(fcose);

type FcoseLayoutOptions = cytoscape.BaseLayoutOptions & cytoscape.AnimatedLayoutOptions & {
  name: 'fcose';
  quality?: 'draft' | 'default' | 'proof';
  randomize?: boolean;
  fit?: boolean;
  padding?: number;
  nodeSeparation?: number;
  idealEdgeLength?: number;
  nodeRepulsion?: number;
  fixedNodeConstraint?: { nodeId: string; position: { x: number; y: number } }[];
};

const DIMENSION_ANCHORS: Record<TagDimension, { x: number; y: number }> = {
  Process: { x: 0, y: 0 },
  Behavioral: { x: 600, y: 0 },
  Technical: { x: 300, y: 500 },
  Other: { x: 300, y: 250 },
};

// Spread tags within a dimension into a small grid around that dimension's
// anchor point, so pinning individual tags (not the compound parent, which
// must stay auto-sized from its children) still clusters them spatially.
function getTagAnchorPosition(dimension: TagDimension, indexInDimension: number) {
  const base = DIMENSION_ANCHORS[dimension];
  const cols = 3;
  const spacing = 90;
  const row = Math.floor(indexInDimension / cols);
  const col = indexInDimension % cols;
  return {
    x: base.x + (col - (cols - 1) / 2) * spacing,
    y: base.y + row * spacing,
  };
}

interface GraphFailureEntry {
  id: string;
  title: string;
  tags: string[];
  marksLost: number;
}

interface GraphViewProps {
  entries: GraphFailureEntry[];
  activeTag?: string | null;
  onSelectCase?: (id: string) => void;
  onSelectTag?: (tag: string) => void;
  onSelectDimension?: (dimension: TagDimension) => void;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

const DIMENSION_LABELS: Record<TagDimension, string> = {
  Technical: 'TECHNICAL',
  Process: 'PROCESS',
  Behavioral: 'BEHAVIORAL',
  Other: 'OTHER',
};

export default function GraphView({ entries, activeTag, onSelectCase, onSelectTag, onSelectDimension }: GraphViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);

  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    entries.forEach(e => e.tags.forEach(t => { counts[t] = (counts[t] || 0) + 1; }));
    return counts;
  }, [entries]);

  const dimensionsPresent = useMemo(
    () => Array.from(new Set(Object.keys(tagCounts).map(getTagDimension))),
    [tagCounts]
  );

  const canvasHeight = useMemo(() => {
    const totalNodes = entries.length + Object.keys(tagCounts).length + dimensionsPresent.length;
    return clamp(220 + totalNodes * 10, 360, 680);
  }, [entries.length, tagCounts, dimensionsPresent.length]);

  useEffect(() => {
    if (!containerRef.current || entries.length === 0) return;

    const elements: cytoscape.ElementDefinition[] = [];
    const maxMarks = Math.max(1, ...entries.map(e => e.marksLost));
    const maxTagCount = Math.max(1, ...Object.values(tagCounts));

    dimensionsPresent.forEach(dimension => {
      elements.push({
        data: { id: `dim-${dimension}`, label: DIMENSION_LABELS[dimension], isDimension: true },
      });
    });

    const primaryTagGroups: Record<string, string[]> = {};
    entries.forEach(entry => {
      const key = entry.tags[0] || '__none__';
      (primaryTagGroups[key] ||= []).push(entry.id);
    });

    entries.forEach(entry => {
      const primaryTag = entry.tags[0];
      const group = primaryTagGroups[primaryTag || '__none__'];
      const shade = getCaseShade(primaryTag, group.indexOf(entry.id), group.length);
      elements.push({
        data: {
          id: entry.id,
          label: entry.title,
          type: 'failure',
          width: clamp(80 + (entry.marksLost / maxMarks) * 70, 80, 150),
          bg: shade.bg,
          border: shade.border,
        },
      });
    });

    const tagsByDimension: Record<string, string[]> = {};
    Object.keys(tagCounts).forEach(tag => {
      const dimension = getTagDimension(tag);
      (tagsByDimension[dimension] ||= []).push(tag);
    });

    const tagFixedPositions: { nodeId: string; position: { x: number; y: number } }[] = [];

    Object.entries(tagCounts).forEach(([tag, count]) => {
      const style = getTagStyle(tag);
      const dimension = getTagDimension(tag);
      const indexInDimension = tagsByDimension[dimension].indexOf(tag);
      tagFixedPositions.push({ nodeId: `tag-${tag}`, position: getTagAnchorPosition(dimension, indexInDimension) });
      elements.push({
        data: {
          id: `tag-${tag}`,
          parent: `dim-${dimension}`,
          label: `${tag} (${count})`,
          type: 'tag',
          color: style.color,
          border: style.border,
          width: clamp(90 + (count / maxTagCount) * 80, 90, 170),
          active: activeTag === tag,
        },
      });
    });

    entries.forEach(entry => {
      entry.tags.forEach(tag => {
        elements.push({
          data: {
            id: `edge-${entry.id}-${tag}`,
            source: entry.id,
            target: `tag-${tag}`,
            edgeColor: getTagStyle(tag).color,
          },
        });
      });
    });

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: [
        {
          selector: 'node[isDimension]',
          style: {
            'background-opacity': 0.15,
            'background-color': '#1a1a16',
            'border-width': 1,
            'border-style': 'dashed',
            'border-color': '#3a3a30',
            'shape': 'roundrectangle',
            'label': 'data(label)',
            'color': '#5a5a52',
            'font-size': '9px',
            'font-weight': 600,
            'text-valign': 'top',
            'text-halign': 'center',
            'text-margin-y': -6,
          },
        },
        {
          selector: 'node[type = "failure"]',
          style: {
            'background-color': 'data(bg)',
            'border-width': 1.5,
            'border-color': 'data(border)',
            'label': 'data(label)',
            'color': '#c8c8c0',
            'font-size': '10px',
            'text-valign': 'center',
            'text-halign': 'center',
            'width': 'data(width)',
            'height': 36,
            'shape': 'roundrectangle',
            'text-wrap': 'wrap',
            'text-max-width': '120px',
          },
        },
        {
          selector: 'node[type = "tag"]',
          style: {
            'background-color': 'data(color)',
            'background-opacity': 0.9,
            'border-width': 2,
            'border-color': 'data(color)',
            'border-opacity': 1,
            'label': 'data(label)',
            'color': '#f4f4f0',
            'font-size': '10px',
            'font-weight': 600,
            'text-valign': 'center',
            'text-halign': 'center',
            'text-outline-width': 1,
            'text-outline-color': 'data(border)',
            'width': 'data(width)',
            'height': 34,
            'shape': 'roundrectangle',
            'text-wrap': 'wrap',
            'text-max-width': '140px',
            'overlay-opacity': 0,
          },
        },
        {
          selector: 'node[type = "tag"][?active]',
          style: { 'border-width': 3.5, 'border-color': '#f4f4f0' },
        },
        {
          selector: 'edge',
          style: {
            'width': 1.5,
            'line-color': 'data(edgeColor)',
            'line-opacity': 0.45,
            'target-arrow-shape': 'none',
            'curve-style': 'bezier',
          },
        },
        {
          selector: '.hovered',
          style: { 'border-width': 3, 'border-color': '#f4f4f0' },
        },
      ],
      layout: {
        name: 'fcose',
        quality: 'default',
        randomize: true,
        animate: true,
        animationDuration: 400,
        fit: true,
        padding: 30,
        nodeSeparation: 75,
        idealEdgeLength: 80,
        nodeRepulsion: 4500,
        ...(tagFixedPositions.length > 0 ? { fixedNodeConstraint: tagFixedPositions } : {}),
      } as FcoseLayoutOptions,
      minZoom: 0.4,
      maxZoom: 2,
    });

    cyRef.current = cy;

    cy.on('mouseover', 'node[type = "failure"]', evt => {
      evt.target.neighborhood('node[type = "tag"]').addClass('hovered');
    });
    cy.on('mouseout', 'node[type = "failure"]', evt => {
      evt.target.neighborhood('node[type = "tag"]').removeClass('hovered');
    });
    cy.on('tap', 'node[type = "failure"]', evt => {
      onSelectCase?.(evt.target.id());
    });
    cy.on('tap', 'node[type = "tag"]', evt => {
      const tag = (evt.target.id() as string).replace(/^tag-/, '');
      onSelectTag?.(tag);
    });
    cy.on('tap', 'node[isDimension]', evt => {
      const dimension = (evt.target.id() as string).replace(/^dim-/, '') as TagDimension;
      onSelectDimension?.(dimension);
    });

    return () => cy.destroy();
  }, [entries, activeTag, tagCounts, dimensionsPresent, onSelectCase, onSelectTag, onSelectDimension]);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: '#a8a8a0' }}>Failure Relationship Map</div>
        <button
          onClick={() => cyRef.current?.fit(undefined, 30)}
          style={{ background: 'transparent', border: '0.5px solid #2e2e28', color: '#5a5a52', padding: '4px 10px', borderRadius: 4, fontSize: 11, cursor: 'pointer', letterSpacing: '0.04em' }}
        >
          Fit view
        </button>
      </div>

      {entries.length === 0 ? (
        <div style={{ border: '0.5px dashed #1e1e1a', borderRadius: 6, padding: '50px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#2e2e28', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>No relationship data yet</div>
          <div style={{ fontSize: 12, color: '#3a3a30' }}>Upload a case or log a reflection to see how your failures connect.</div>
        </div>
      ) : (
        <>
          <div
            ref={containerRef}
            style={{
              width: '100%', height: canvasHeight, borderRadius: 6, border: '0.5px solid #1e1e1a',
              background: 'radial-gradient(circle at 50% 35%, #101008 0%, #060605 75%)',
            }}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            {Object.entries(tagCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([tag, count]) => {
                const s = getTagStyle(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => onSelectTag?.(tag)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '3px 10px', borderRadius: 3, fontSize: 10, letterSpacing: '0.04em', cursor: 'pointer',
                      background: s.bg, color: s.color, border: `0.5px solid ${activeTag === tag ? s.color : s.border}`,
                    }}
                  >
                    {tag} <span style={{ opacity: 0.7 }}>{count}</span>
                  </button>
                );
              })}
          </div>
          <p style={{ fontSize: 11, color: '#3a3a30', marginTop: 10 }}>
            Node size = marks lost or pattern frequency. Cases group under Technical/Process/Behavioral. Click a case to reflect on it, click a tag or dimension header to filter by it.
          </p>
        </>
      )}
    </div>
  );
}
