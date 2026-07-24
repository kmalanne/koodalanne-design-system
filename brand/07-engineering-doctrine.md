# koodalanne — Engineering Doctrine

> Part 7 of the Brand Bible. Where Parts 1–6 describe *what* koodalanne is, this
> describes *how it decides*. The shift is deliberate: a mature system doesn't say
> "buttons are pink," it says **"primary actions take the highest available visual
> emphasis — which currently maps to `--color-accent`."** Redesign the visuals in
> five years and the reasoning still holds.
>
> The measurable rules below are enforced by the **Brand Linter**
> ([`tools/brandos/brandos.mjs`](../tools/brandos/brandos.mjs) · `npm run lint:brand`).

---

## Laws (immutable)

1. Every element consumes attention — spend it deliberately.
2. If something needs explaining, the design already failed.
3. Visual weight equals responsibility: the more attention it demands, the more value it must return.
4. People remember structure, not decoration.
5. Every new component, color, animation and sentence must justify its existence.
6. Clarity compounds. Confusion compounds faster.
7. A page has one conversation, not ten.
8. Trust is built from evidence over time, not persuasion.

---

## Invariants (never change — checked by `brandos`)

- **One primary message** per page · **one primary CTA** per view.
- **One accent** carries attention; keep accent usage ≲ 5% of the surface.
- **Dark first.** Light is the exception (documents, print).
- **One** spacing scale, **one** type scale, **one** visual language — all from tokens.
- **Evidence over claims.** No adjective without proof.
- Motion is functional and always respects `prefers-reduced-motion`.
- Headlines stay short (≤ 8 words); reading width stays bounded.

---

## Intent over appearance

Design with meaning, then map to a token — never design with raw values.

| Intent | Current mapping |
| --- | --- |
| Primary attention | `--color-accent` (pink) |
| Secondary attention | `--color-accent-secondary` (cyan) |
| Supporting text | `--color-text-muted` |
| Metadata / low priority | `--color-text-subtle` |
| Surface / background | `--color-surface` / `--color-bg` |

If the visual language changes, only this mapping changes — the doctrine doesn't.

---

## Design smells

More than one primary CTA · more than one accent · three card styles · centered
paragraphs · four heading sizes on a page · cards inside cards · nested shadows ·
decorative gradients · large empty containers · "Learn More / Click Here" buttons ·
inconsistent radii, spacing or hover styles.

## Copy smells

Marketing buzzwords · passive voice · long paragraphs · adjectives without
evidence · corporate terminology · generic promises · artificial urgency ·
talking about yourself before the client · "we" where it should be "I".

---

## Philosophy tests

Before shipping anything, it must pass all of:

- Can anything be removed without losing meaning? (less, but better)
- Could I explain this to a client without apology?
- Will it still make sense in ten years?
- Would another developer understand it without a doc?
