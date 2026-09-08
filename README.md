# Ink Game Demo

Single-player ink-style agar game prototype.

## Play

Open `index.html` in a browser, or open `outputs/ink_demo_v2.html` directly.

GitHub Pages:

https://a29k055-arch.github.io/html-inkgame/

## Current Prototype

- Ink-themed single-player swallowing gameplay.
- NPC ink dots and floating ink fragments.
- Lotus leaf / lotus flower interaction.
- Ink trail and spurt movement.
- Painting reveal mechanic: movement and swallowing gradually reveal an ink painting.
- Ending screen with original artwork preview and save / trail controls.
- Album with 11 supplied artworks; the first is unlocked initially, then one per successful round, stored in this browser.
- Temporary exhibition QR: desktop active play and all-device pause screen, using the supplied local image.

## Project Structure

- `index.html` - entry page for local preview and GitHub Pages.
- `outputs/ink_demo_v2.html` - current playable demo.
- `outputs/assets/` - image assets used by the demo.
- `CHANGELOG.md` - update notes for each version.

## Album and Exhibition UI

- `outputs/ui/boku-gallery.js` / `.css` contain the gallery, stable artwork IDs, and local collection storage (`boku.album.unlocked.v1`).
- `outputs/assets/gallery/` contains the 11 supplied images, copied without changing their proportions or image data. Numbered labels are catalog identifiers, not attributed titles. Descriptions remain empty.
- `outputs/ui/boku-exhibition.js` / `.css` contain temporary QR placement. Remove their two HTML includes and `outputs/assets/exhibition/qr-code.jpg` to remove the feature.
- Album rewards do not change the active game painting or introduce new levels. Storage is local to the browser/origin, with in-memory fallback if storage is unavailable.
- On very short screens, the pause view scrolls vertically to keep both controls and the QR accessible.
