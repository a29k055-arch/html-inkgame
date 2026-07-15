# Changelog

## 2026-07-16 - Mobile HUD and Joystick Refinement

### Changed

- Replaced the pause label with a CSS-drawn pause icon to avoid font fallback issues.
- Reduced the height and text size of the top HUD on desktop and mobile.
- Changed mobile joystick behavior so it defaults to the lower-left but appears at the player's touch point during play.
- Moved the minimap away from the boost button on mobile portrait screens.
- Increased mobile camera zoom-out by roughly 20% and synced canvas sizing with the visual viewport to reduce mobile stretching.
- Changed the player label from `墨` to `ボク`.
- Softened edge reveal compensation with scattered brush-like reveal marks instead of visible stepped bands.

## 2026-07-15 - Control Mode, Pause UI, and Performance Tuning

### Added

- Added an in-game pause button and pause menu with resume, home, and PC/mobile control mode switching.
- Added a functional mobile joystick that appears only in mobile control mode.

### Changed

- Keyboard direction input now overrides mouse steering while WASD or arrow keys are pressed.
- Changed the action button label from `墨噴射` to `加速`.
- Adjusted mobile HUD layout for landscape and portrait screens, with a wider portrait camera view.
- Softened edge-reveal compensation with feathered ink edges instead of hard rectangular bands.
- Reduced late-game ink particle load by lowering brush mark caps, mote caps, and per-mark grain density.

## 2026-07-15 - Reveal Loop and Artwork Ending Tuning

### Changed

- Restored NPC-to-NPC swallowing while adding NPC avoidance steering so they are less likely to collide directly.
- Changed repeated swallow reveals in already-painted areas to reveal from the map edges inward, creating a shrinking-frame style compensation.
- Lowered the victory reveal requirement from 80% to 75%.
- Changed the ending screen to show the original reference painting by default, preserving image aspect ratio with cropping instead of stretching.
- Repurposed the ending `画像変換` button into `筆跡`, toggling between the clean artwork and the painted trail version.

## 2026-07-15 - Growth Balance and Ending Detail Tuning

### Added

- Added a placeholder ending button for future artwork details (`作品詳細`).

### Changed

- Disabled NPC-to-NPC swallowing so NPC count stays stable during solo play.
- Doubled the player's growth from floating ink particles.
- Increased the player's painting reveal trail width by roughly one third across all sizes.
- Reduced heavy brush-particle spawning and per-mark grain density to improve runtime smoothness while keeping the wider ink trail.
- Confirmed the ending screen still displays the completed background painting.

## 2026-07-15 - HUD Progress and NPC Density Tuning

### Changed

- Reworked the HUD so the painting progress (`作画`) uses the center progress bar.
- Moved elapsed time to the far right and absorption count (`吸収`) to its left.
- Removed the ink amount bar from the main HUD.
- Increased NPC count from 15 to 23.
- Adjusted NPC spawn distribution so more NPCs appear across the whole map, including edges and corners.
- Increased reveal trail width scaling for larger player size, making painting completion faster as the player grows.

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
