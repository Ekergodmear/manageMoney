# Current Task

**Sprint:** 2.7C.4 — Release Candidate  
**Status:** Awaiting push (commit A) — version bump after push

---

## Release discipline (locked)

1. Commit A → push `main`
2. Fresh-clone verify + `pnpm verify` on pushed commit
3. Commit B → `1.0.0-rc.1` + CHANGELOG
4. Tags on commit B → push tags

**Do not bump version before push.**

---

## Next (maintainer)

```bash
git add .
git commit -m "Core SDK v1 — release candidate ready"
git branch -M main
git remote add origin https://github.com/Ekergodmear/manageMoney.git
git push -u origin main
```

Then follow `RELEASE_MANIFEST.md` § Release discipline.

---

## After RC

1. Tags on `main` (`core-sdk-v1-freeze`, `v1.0.0-rc.1`)
2. `git checkout -b optimization-v1` → Sprint 3
3. Gate: `docs/design/sprint-3-gate.md` — SDK client, four review questions
