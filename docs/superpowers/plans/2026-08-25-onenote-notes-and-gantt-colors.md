# OneNote-style Notes and Gantt Colors Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Notes faster to write and let Gantt bars use an optional saved color.

**Architecture:** Preserve the existing three-pane Notes workspace and task provider. Add one nullable task color column, a pure color resolver, and compose the resolver into the shared task editor and Gantt bar.

**Tech Stack:** Next.js, React, TypeScript, Supabase, Vitest.

**Spec:** `docs/superpowers/specs/2026-08-25-onenote-notes-and-gantt-colors-design.md`

## Global Constraints

- Existing notes and tasks remain valid and readable.
- Notes never require hierarchy metadata to be created.
- Null Gantt color preserves current status-color behavior.
- Tests are written and observed failing before feature code.

### Task 1: Add Gantt color persistence

- [ ] Write a failing resolver test.
- [ ] Add migration, Supabase types, task draft support, and resolver.
- [ ] Re-run the focused test.

### Task 2: Add the color picker and Gantt rendering

- [ ] Extend the resolver test for explicit palette colors.
- [ ] Add task editor palette and Gantt bar resolver use.
- [ ] Re-run focused tests.

### Task 3: Convert Notes to a one-surface page canvas

- [ ] Write a failing title-fallback test for a body-only page.
- [ ] Remove the separate new-page title input and move organising metadata behind disclosure.
- [ ] Re-run focused tests.

### Task 4: Verify, commit, and deploy

- [ ] Run tests, typecheck, lint, and build.
- [ ] Inspect diff, commit, push, and deploy the committed source with Vercel.
