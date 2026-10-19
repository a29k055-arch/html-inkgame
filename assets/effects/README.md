# Ink Matte browser atlases

The supplied source pack was inspected at `Ink Matte (HD Set 1)`: `Drops`, and `Transitions/Version 1`, `Version 2`, `Elements` (no additional `Versions` parent).

Selected Drop(1), V1(1), and inspected V2(1) are 2048×1080 H.264 High / yuv420p /59.94fps **opaque black-on-white**, not transparent video. Drop(1) lasts5.01s; transitions2s. Browsers do not need to decode these MOV files: white is converted to alpha0 and black to alpha255 in lossless WebP atlases.

- `drops.webp`:32 frames,160×160,8 columns,44,520 bytes; original first3.2s compressed into short pickup animation with final opacity fade.
- `transition.webp`:36 frames,320×169,6 columns,81,026 bytes; forward cover and reverse reveal. Runtime guarantees a fully opaque frame BEFORE changing the world; the source alone is99.2% coverage.
- `manifest.json`: filenames, source hashes and frame geometry. Original files remain unmodified.

Regenerate with `python tools/build-ink-mattes.py "D:/ink_game/Ink Matte (HD Set 1)"`. Requires Pillow and ffmpeg or imageio-ffmpeg **only for asset preparation**. The published game has no Python/FFmpeg or new npm dependency. Runtime decodes both images before entering play and shares an80-entry pickup pool.
