# Changelog

## 2026-07-14 - UI Language and Matte Behavior Tuning

### Changed

- Simplified the title screen by removing the subtitle and gameplay description text.
- Changed the title menu, HUD, action button, result buttons, and status text to Japanese UI wording.
- Changed the start transition so the title screen stays as a static layer while the ink matte reveals the gameplay layer underneath.
- Adjusted ink drop reveal mattes to keep a horizontal aspect ratio instead of stretching into a vertical oval.
- Adjusted the painting trail width so slower movement creates a thicker brush trace and faster movement creates a thinner trace.
- Changed the failure title to `Game Over`.

## 2026-07-14 - Ink Matte Overlay Assets

This update connects the external ink matte overlay assets to the current v2 demo.

### Added

- Added five ink drop matte videos from the `Drops` asset folder.
- Added five ink transition matte videos from `Transitions/Version 1` and `Transitions/Version 2`.
- Added random drop matte reveal animation when the player swallows an NPC ink body.
- Added random transition matte animation after pressing `START`.

### Changed

- The start sequence now fades the title UI and uses an ink matte overlay before entering gameplay.
- NPC swallow reveal is no longer only a circular reveal; it now uses animated ink matte masks when supported by the browser.
- Added fallback behavior so gameplay still works if a `.mov` matte video cannot be decoded.

## 2026-07-08 - v2 Objective Reveal Mode

This update keeps the original demo and adds a new playable version at `outputs/ink_demo_v2.html`.

### Added

- Added a 3-second black interlude after pressing `START` (temporary placeholder for a future intro animation).
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

- GitHub Pages entry now points to the v2 demo.
- Added a GitHub Pages deployment workflow.
