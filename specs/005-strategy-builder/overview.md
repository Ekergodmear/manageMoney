# Spec 005 — Strategy Builder

**Sprint:** 2.4

Transform solver output → domain **`Strategy`**.

**Prerequisite:** ConstraintSolver FROZEN (Sprint 2.3)

**Does NOT compute statistics** — see Spec 006 StatisticsBuilder (ADR-028).

**Does NOT validate input** — receives validated context + `Strategy` from solver.
