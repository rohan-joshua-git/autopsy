# Autopsy
## Diagnose your failures. Prescribe your growth.
Autopsy is a metacognitive dashboard for students who want to learn from their mistakes systematically. Instead of reviewing a graded exam once and moving on, Autopsy lets you upload exam scripts and log personal post-mortems through guided prompts, building a structured, searchable record of your setbacks over time. The goal is to surface the behavioral and conceptual patterns behind recurring errors, so you can address root causes rather than symptoms.

Built by rSquared (Rohan Varatharajan & Reine Tan) for NUS Orbital 2026.

## Motivation
Most students revisit their mistakes in isolation, a quick glance at a marked script, maybe a note or two. There's no system that connects exam errors to the behavioral triggers behind them, and no way to know if the same underlying habit is causing failures across different subjects or projects. Autopsy is an attempt to close that gap.

## Planned Features
Core

- PDF ingestion — upload graded exam scripts for automated error extraction and analysis
- Pattern tagging — root causes mapped to an 18-category taxonomy (e.g. Time Pressure, Edge Case Neglect, Logic Flaw, Conceptual Error)
- Quick-Reflect — guided post-mortem prompts to log behavioral failures after exams or projects
- Failure library — a chronological record of all entries with tags and notes
- Demo Mode — explore the app with sample data without needing an account

Extensions

- Relationship map — visual graph where nodes are failures and edges are shared root causes
- Semantic search — find past failures by meaning, not just keywords
- Red Flag system — alerts when a new entry repeats a pattern from a past failure
- Failure Fingerprint Report — periodic summary of your most common root cause patterns

Tech Stack
LayerTechnologyFrontendNext.js, Tailwind CSS, Cytoscape.jsBackend / DBSupabase (Auth, PostgreSQL, pgvector)AIOpenAI GPT-4o Vision, text-embedding-3-smallTestingJest (unit), Cypress (E2E)DevOpsGitHub Actions (CI/CD), Vercel

## Status
Currently in ideation. Development begins May 2026.

 - Milestone 1 — Ideation & proof of concept (due 1 Jun)
 - Milestone 2 — Core features (due 29 Jun)
 - Milestone 3 — Extensions & user testing (due 27 Jul)
 - Splashdown (26 Aug)

# Authors

Rohan Varatharajan
Reine Tan Si Jie

NUS School of Computing · Orbital 2026
