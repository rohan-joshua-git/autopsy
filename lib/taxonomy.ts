export const TAXONOMY = [
  // 1. Core Understanding Errors
  'Conceptual Error',
  'Misunderstanding Core Principle',
  'Formula Misapplication',

  // 2. Execution & Math Flaws
  'Calculation Flaw',
  'Algebraic Slip',
  'Arithmetic Error',

  // 3. Problem Solving & Analysis Errors
  'Edge Case Neglect',
  'Misreading the Question',
  'Overlooking Constraints',
  'Incorrect Assumption',

  // 4. Code & Implementation Specifics
  'Syntax / Off-by-One',
  'Logic Branching Error',
  'Type Mismatch',

  // 5. Test-Taking & Operational Limitations
  'Time Pressure',
  'Incomplete Answer',
  'Rushed Execution',
  'Sloppy Handwriting / Notation',
  'Panic / Brain Fade'
] as const;

// Helper type definition for your TypeScript components if needed downstream
export type TaxonomyCategory = typeof TAXONOMY[number];