export const TAXONOMY = [
  // Dimension 1: Technical
  'Logic Flaw',                    // Fundamental algorithmic error
  'Edge Case Neglect',             // Failed to handle boundary conditions (e.g., empty lists, nulls)
  'Complexity Miscalculation',     // Used an inefficient approach (O(N^2) instead of O(N log N))
  'Syntax/Language Nuance',        // Misunderstanding language-specific behaviors
  'Initialization Error',          // Garbage values or incorrect starting states
  'Concurrency/State Issue',       // Race conditions or shared state corruption

  // Dimension 2: Process & Methodology
  'Requirements Misinterpretation', // Solved the wrong problem entirely
  'Under-tested Logic',             // Lack of adequate unit/integration testing
  'Poor Modularization',            // Code spaghetti; logic spread too thin
  'Documentation/Naming',           // Unclear variable names leading to self-confusion
  'Tooling/Library Misuse',         // Using the wrong library or API for the job
  'Debugging Overhead',             // Wasted time chasing red herrings due to poor logging

  // Dimension 3: Behavioral/Metacognitive
  'Time Pressure',                 // Rushed decisions under a looming deadline
  'Lack of Preparation',           // Insufficient study/practice for the domain
  'Cognitive Fatigue',             // Errors made late at night or after long sessions
  'Overconfidence Bias',           // Assuming the solution was "easy" and skipping checks
  'Scope Creep',                   // Adding complexity where simplicity was needed
  'Planning Deficit',              // Lack of design phase; "coding before thinking"
] as const;

export type TaxonomyCategory = typeof TAXONOMY[number];

export const TAXONOMY_DIMENSIONS: Record<TaxonomyCategory, 'Technical' | 'Process' | 'Behavioral'> = {
  'Logic Flaw': 'Technical',
  'Edge Case Neglect': 'Technical',
  'Complexity Miscalculation': 'Technical',
  'Syntax/Language Nuance': 'Technical',
  'Initialization Error': 'Technical',
  'Concurrency/State Issue': 'Technical',

  'Requirements Misinterpretation': 'Process',
  'Under-tested Logic': 'Process',
  'Poor Modularization': 'Process',
  'Documentation/Naming': 'Process',
  'Tooling/Library Misuse': 'Process',
  'Debugging Overhead': 'Process',

  'Time Pressure': 'Behavioral',
  'Lack of Preparation': 'Behavioral',
  'Cognitive Fatigue': 'Behavioral',
  'Overconfidence Bias': 'Behavioral',
  'Scope Creep': 'Behavioral',
  'Planning Deficit': 'Behavioral',
};
