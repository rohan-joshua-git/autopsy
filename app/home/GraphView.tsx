'use client';

import { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';

interface RealFailureEntry {
  id: string;
  module_code: string;
  assessment_name: string;
  question_number: string;
  error_category: string;
  marks_deducted: number;
}

interface GraphViewProps {
  entries: RealFailureEntry[];
}

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

export default function GraphView({ entries }: GraphViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || entries.length === 0) return;

    const elements: cytoscape.ElementDefinition[] = [];

    entries.forEach((entry) => {
      elements.push({
        data: { 
          id: entry.id, 
          label: `${entry.module_code}\n${entry.assessment_name} (${entry.question_number})`, 
          type: 'failure' 
        },
      });
    });

    const uniqueCategories = new Set(entries.map((e) => e.error_category).filter(Boolean));
    uniqueCategories.forEach((category) => {
      elements.push({
        data: { 
          id: `tag-${category}`, 
          label: category, 
          type: 'tag', 
          color: TAG_COLORS[category] || '#888780' 
        },
      });
    });

    entries.forEach((entry) => {
      if (entry.error_category) {
        elements.push({
          data: {
            id: `edge-${entry.id}-${entry.error_category}`,
            source: entry.id,
            target: `tag-${entry.error_category}`,
          },
        });
      }
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
            'font-size': '10px',
            'text-valign': 'center',
            'text-halign': 'center',
            'width': 100,
            'height': 40,
            'shape': 'roundrectangle',
            'text-wrap': 'wrap',
            'text-max-width': '90px',
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
            'width': 120,
            'height': 32,
            'shape': 'roundrectangle',
            'text-wrap': 'wrap',
            'text-max-width': '110px',
          },
        },
        {
          selector: 'edge',
          style: {
            'width': 1.5,
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
        padding: 40,
        nodeRepulsion: () => 10000,
        idealEdgeLength: () => 90,
      },
    });

    cy.on('tap', 'node[type = "failure"]', (evt) => {
      const node = evt.target;
      node.neighborhood('node[type = "tag"]').flashClass('highlighted', 600);
    });

    return () => cy.destroy();
  }, [entries]);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-300">Failure Relationship Map</h2>
        {entries.length === 0 && (
          <span className="text-xs text-yellow-600 bg-yellow-950/30 border border-yellow-900/50 px-2 py-0.5 rounded-full">
            No entries logged yet
          </span>
        )}
      </div>
      <div
        ref={containerRef}
        className="w-full rounded-2xl border border-gray-800 bg-gray-900"
        style={{ height: '400px' }}
      />
      <p className="text-xs text-gray-600 mt-2">
        Nodes = questions · Coloured labels = behavioral taxonomy matrix targets · Clusters isolate common recurring blind spots
      </p>
    </div>
  );
}