# Seer · six interfaces on the Electric Foundation identity

A design concept for the six Seer interfaces: homepage, app, Deep, Futarchy, Opportunity Markets and Risk Pricing.
Static HTML, CSS and JavaScript, no build step, no dependencies. All figures, names, prices and ranks are illustrative and every order is simulated.

| Interface | Page |
| --- | --- |
| Seer homepage | `index.html` |
| Seer app | `app.html` |
| Deep | `deep.html` |
| Futarchy | `futarchy.html` |
| Opportunity Markets | `opportunity.html` |
| Risk Pricing | `risk.html` |

Run locally: `python3 -m http.server` in this folder, then open http://localhost:8000.

## Design system

Tokens marked kit were read from the Seer Branding Figma board (colour palette frame and the dark / light market grids).

| Token | Dark | Light |
| --- | --- | --- |
| Page background (kit) | `#101013` | `#F7F7F9` |
| Card (kit) | `#1A1A1E` | `#FFFFFF` |
| Nested surface (kit) | `#1F1F24` | `#F1F1F4` |
| Text primary / secondary / muted (kit) | `#EDEDF2` / `#A8A8B3` / `#67676F` | `#17171C` / `#5C5C66` / `#8E8E99` |
| Primary (kit) | `#7D33FF` | `#7D33FF` |
| Selected tab (kit) | `#8B4EF7` | `#8B4EF7` |
| Secondary button, "No" / "Down" (kit) | `#241E33` on `#A57BFF` | `#EFE9FC` on `#6C2BD9` |

Type is Inter (400 to 800, self-hosted). Radii follow the kit: 24 for cards, 16 for nested rows, pill for search.
Patterns reused from the kit: pill search, category tabs, market cards with Yes / No, outcome buttons, Up / Down, the bet slip (Amount, +$1 / +$5 / +$20 / +$100, Confirm).

## Departures from the kit, and why

1. Semantic green, red and amber are added for moves and for risk severity only. The kit has no semantic colours and risk needs more than one violet.
2. A categorical chart palette is added for Deep's many lines, because one accent cannot separate 48 outcomes.
3. In light mode, small purple text is deepened to `#6C2BD9` for contrast. Buttons keep the kit's `#7D33FF`.
4. Deep, Opportunity Markets and Risk Pricing use dense rows and a heat matrix instead of the market card, because the kit's card hides the comparison those pages exist for.
5. The mark and wordmark are redrawn as vectors from the kit thumbnail (wordmark set in Outfit). Replace `assets/logo.svg` and `assets/mark.svg` with the official files when available.
6. One shared ecosystem bar (all six interfaces, theme switch, wallet button) is added to every page so the products read as one protocol.

## Files

`assets/ef.css` tokens and components, `assets/ef.js` shell, trade slip and charts, `assets/fonts/` Inter and Outfit (SIL Open Font License).
`preview.png` is a grid of the six interfaces. `rename/` holds square images for the Risk Pricing naming entries.
