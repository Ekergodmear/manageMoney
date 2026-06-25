# Compatibility Policy — SemVer

**Package:** `constraint-engine` (future npm)  
**Status:** Active — Sprint 2.7  
**Authority:** ADR-037

This project uses [Semantic Versioning](https://semver.org/). Version numbers must reflect **consumer impact**, not commit count.

---

## Version bumps

### MAJOR (x.0.0)

Increment when a consumer **must change code or expectations**:

- Public API contract change (removed export, renamed function, changed signature)
- **Behavior change** on valid input (solver output, statistics formula, simulation semantics)
- **Intentional golden output change** (algorithm or spec change via design gate)
- Breaking type change on public models

Process: design gate (ADR-032) + ADR if architectural + migration notes in CHANGELOG.

### MINOR (0.x.0)

Increment when consumers **can stay on existing code**:

- New public function or export
- New **optional** field on public type
- New module behind new export (no change to existing exports)

### PATCH (0.0.x)

Increment when behavior on valid input is **unchanged** from consumer perspective:

- Performance optimization (same output)
- Bug fix restoring spec-aligned behavior
- Documentation, tests, internal refactor
- Dependency updates (non-breaking)

---

## Golden files and semver

| Change                                   | Typical bump           |
| ---------------------------------------- | ---------------------- |
| Golden JSON changes intentionally (spec) | **MAJOR**              |
| Golden fix (implementation matched spec) | **PATCH**              |
| New golden fixture only                  | **MINOR** or **PATCH** |

See `docs/RELEASE-RULES.md` — goldens are never auto-regenerated.

---

## Pre-1.0.0

While `0.x.y`, MINOR may include breaking changes with clear CHANGELOG notes.  
Target **1.0.0** = Core SDK v1 public API frozen per `docs/CORE-STABILITY.md`.

---

## Deprecation

1. Mark `@deprecated` in JSDoc + CHANGELOG
2. Keep for at least one **MINOR** release
3. Remove in next **MAJOR**

---

## References

- `docs/design/sdk-hardening-spec.md`
- `docs/CORE-STABILITY.md`
- ADR-037
