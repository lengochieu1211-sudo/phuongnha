# AUDIT V5.22 – COMPANION CARD VISUAL UPGRADE

## Scope
Visual redesign of the **Companion Selector / character cards** after feedback that the current mascot card graphics look too plain and low-end.

## Files changed
- `src/components/CompanionSelectorModal.tsx`
- `package.json` → version `5.22.0`

## What changed
- Rebuilt the modal into a more premium **storybook / magical character selection** layout.
- Added a stronger header with:
  - title and supporting text,
  - star count,
  - unlocked count,
  - currently selected companion.
- Redesigned each character card with:
  - gradient shell and soft magical halo,
  - stronger framed avatar stage,
  - better spacing and typography,
  - clearer species chip,
  - better unlock badge,
  - separate “special ability” panel,
  - stronger selected / locked states,
  - improved buttons.
- Kept all existing game logic intact:
  - unlock by stars,
  - select companion,
  - selected character state,
  - equipped wardrobe preview,
  - audio feedback.

## Important notes
- This upgrade improves the **UI presentation** significantly.
- It does **not** replace the underlying procedural SVG mascot drawings themselves.
- If you later want even better visuals, the next step would be to redesign the mascot SVG art or replace it with more polished art assets while keeping the same unlock/select logic.
