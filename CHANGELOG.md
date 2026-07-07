# Changelog

## 2026-07-08 - v2 Objective Reveal Mode

This update keeps the original demo and adds a new playable version at `outputs/ink_demo_v2.html`.

### Added

- Added a 3-second black interlude after pressing `START`.
- Added Japanese interlude text: `幕間映像`.
- Added `outputs/ink_demo_v2.html` as a new version while keeping `outputs/ink_demo.html`.
- Updated `index.html` so GitHub Pages opens the new v2 demo by default.
- Added a painting reveal objective: the player must reveal the painting instead of only surviving a timer.
- Added reveal progress display in the HUD.
- Added a victory condition: become the largest ink body and reveal 80% of the painting.

### Changed

- Changed the round timer from countdown mode to elapsed-time mode.
- Slightly widened the player's reveal trail compared with the previous narrow brush trail.
- Strengthened the fogged-painting contrast: unrevealed areas are blurrier and revealed areas appear clearer.

### Gameplay

- Larger NPC ink bodies now erase the player's revealed painting trail when they pass over it.
- The player needs to grow large enough to control the map and restore erased painting areas.
- This creates a clearer goal: collect ink, grow, protect the revealed painting, and complete the image.

### GitHub

- Version pushed to GitHub commit `8ec4f9c`.
- GitHub Pages entry now points to the v2 demo.

