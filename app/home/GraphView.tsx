'use client';

import { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';

const DEMO_DATA = [
  { id: 'e1', title: 'Math Paper 1', tags: ['Calculation Flaw', 'Algebraic Slip'] },
  { id: 'e2', title: 'Physics Mock', tags: ['Calculation Flaw', 'Formula Misapplication'] },
  { id: 'e3', title: 'CS Assignment', tags: ['Logic Branching Error', 'Edge Case Neglect'] },
  { id: 'e4', title: 'Math Paper 2', tags: ['Algebraic Slip', 'Misreading the Question'] },
  { id: 'e5', title: 'Chemistry Test', tags: ['Formula Misapplication', 'Incomplete Answer'] },
  { id: 'e6', title: 'Project Sprint', tags: ['Time Pressure', 'Edge Case Neglect'] },
];

const TAG_COLORS: Record<string, string> = {
  'Calculation Flaw': '#378ADD',
  'Algebraic Slip': '#378ADD',
  'Arithmetic Error': '#378ADD',
  'Formula Misapplication': '#D85A30',
  'Conceptual Error': '#D85A30',
  'Misunderstanding Core Principle': '#D85A30',
  'Logic Branching Error': '#7F77DD',
  'Edge Case Neglect': '#7F77DD',
  'Syntax / Off-by-One': '#7F77DD',
  'Time Pressure': '#EF9F27',
  'Incomplete Answer': '#EF9F27',
  'Rushed Execution': '#EF9F27',
  'Misreading the Question': '#1D9E75',
  'Overlooking Constraints': '#1D9E75',
};

export default function GraphView() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const elements: cytoscape.ElementDefinition[] = [];

    DEMO_DATA.forEach((entry) => {
      elements.push({
        data: { id: entry.id, label: entry.title, type: 'failure' },
      });
    });

    const tagSet = new Set(DEMO_DATA.flatMap((e) => e.tags));
    tagSet.forEach((tag) => {
      elements.push({
        data: { id: `tag-${tag}`, label: tag, type: 'tag', color: TAG_COLORS[tag] || '#888780' },
      });
    });

    DEMO_DATA.forEach((entry) => {
      entry.tags.forEach((tag) => {
        elements.push({
          data: {
            id: `${entry.id}-${tag}`,
            source: entry.id,
            target: `tag-${tag}`,
          },
        });
      });
    });

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: [
        {
          selector: 'node[type = "failure"]',
          style: {
            'background-color': '#2C2C2A',
            'label': 'data(label)',
            'color': '#D3D1C7',
            'font-size': '11px',
            'text-valign': 'center',
            'text-halign': 'center',
            'width': 90,
            'height': 36,
            'shape': 'roundrectangle',
            'text-wrap': 'wrap',
            'text-max-width': '80px',
          },
        },
        {
          selector: 'node[type = "tag"]',
          style: {
            'background-color': 'data(color)',
            'label': 'data(label)',
            'color': '#fff',
            'font-size': '10px',
            'text-valign': 'center',
            'text-halign': 'center',
            'width': 110,
            'height': 32,
            'shape': 'roundrectangle',
            'text-wrap': 'wrap',
            'text-max-width': '100px',
          },
        },
        {
          selector: 'edge',
          style: {
            'width': 1,
            'line-color': '#444441',
            'curve-style': 'bezier',
          },
        },
        {
          selector: 'node:selected',
          style: {
            'border-width': 2,
            'border-color': '#fff',
          },
        },
      ],
      layout: {
        name: 'cose',
        animate: false,
        padding: 30,
        nodeRepulsion: () => 8000,
        idealEdgeLength: () => 80,
      },
    });

    cy.on('tap', 'node[type = "failure"]', (evt) => {
      const node = evt.target;
      node.neighborhood('node[type = "tag"]').flashClass('highlighted', 600);
    });

    return () => cy.destroy();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-300">Failure Relationship Map</h2>
        <span className="text-xs text-gray-600 bg-gray-900 border border-gray-800 px-2 py-0.5 rounded-full">Demo Data</span>
      </div>
      <div
        ref={containerRef}
        className="w-full rounded-2xl border border-gray-800 bg-gray-900"
        style={{ height: '380px' }}
      />
      <p className="text-xs text-gray-600 mt-2">Nodes = exam entries · Coloured clusters = shared error tags · Click a node to highlight connections</p>
    </div>
  );
}