# Spec 003 — Requirements

- [x] `validateCalculationRequest(): Result<ValidatedCalculationRequest, ValidationResult>`
- [x] Three-phase pipeline: structural → business → mathematical (early stop)
- [x] No input mutation
- [x] Rules registry arrays — no classes
- [x] Error codes: S###, B###, M###
- [x] User approved — ValidationEngine frozen (ADR-026)
- [x] Architecture isolation test (no solver/strategy/simulation/optimization imports)
- [x] No throw in core

See `docs/MATHEMATICAL-SPECIFICATION.md` §12, `docs/CONTRACTS.md` Contract 2.
