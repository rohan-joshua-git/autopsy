export const TAXONOMY = [
  // 1. Core Understanding (Conceptual Void)
  'Conceptual Void',             // Fundamental misunderstanding of the topic
  'Calibration Gap',             // Overconfidence; thought I knew it, but didn't
  'Heuristic Failure',           // Applied a rule that didn't fit the context

  // 2. Technical Execution (Structural Blindness)
  'Logic/Algorithmic Flaw',      // Fundamental flaw in the logic sequence
  'Boundary/Edge Case Neglect',  // Failed to handle inputs/constraints (e.g., off-by-one)
  'Syntax/Implementation Error', // Language-specific or notation slip-ups

  // 3. Process & Methodology (Workflow Deficit)
  'Requirement Misalignment',    // Solved the wrong problem/ignored constraints
  'Incomplete Verification',     // Lacked sufficient testing/checking
  'Debugging Inefficiency',      // Wasted time due to poor visibility/logging

  // 4. Behavioral & Metacognitive (Execution Latency)
  'Execution Latency',           // Knew the solution, but too slow to implement
  'Cognitive Fatigue',           // Errors driven by exhaustion/late-night work
  'Planning Deficit',            // Failed to map out the structure before coding
] as const;

export type TaxonomyCategory = typeof TAXONOMY[number];

export const TAXONOMY_DIMENSIONS: Record<TaxonomyCategory, 'Understanding' | 'Technical' | 'Process' | 'Behavioral'> = {
  'Conceptual Void': 'Understanding',
  'Calibration Gap': 'Understanding',
  'Heuristic Failure': 'Understanding',
  'Logic/Algorithmic Flaw': 'Technical',
  'Boundary/Edge Case Neglect': 'Technical',
  'Syntax/Implementation Error': 'Technical',
  'Requirement Misalignment': 'Process',
  'Incomplete Verification': 'Process',
  'Debugging Inefficiency': 'Process',
  'Execution Latency': 'Behavioral',
  'Cognitive Fatigue': 'Behavioral',
  'Planning Deficit': 'Behavioral',
};