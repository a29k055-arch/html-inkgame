# V4 pond pickup sources

Map objects and HUD share the src/reveal/pickups.js URLs. Objects are drawn with their natural aspect ratio directly on the painting: no disc, border, coin, frame or glow backing.

## User-supplied, copied unchanged

- lotus-leaf.png ← D:/ink_game/参考图片/lotus_leaf_cut.png, 720×628 RGBA. Actual alpha0–255; 28.6% fully transparent, 4.8% partly transparent.
- lotus-flower.png ← D:/ink_game/参考图片/lotus_flower_cut.png, 720×653 RGBA. Actual alpha0–255; 39.2% fully transparent, 3.1% partly transparent.

These are game assets supplied by the user for this project, not newly sourced third-party art. Original files have not been edited or overwritten; copied SHA256 hashes are byte-identical.

## Animal assets generated with supplied references

Built-in imagegen tool, one independent generation/edit call per asset, not the API CLI. Supplied opaque checkerboard images were inspected first. 虾1.png has alpha255 everywhere: its checkerboard is real RGB, not transparency. Supplied turtle/fish references were likewise opaque. None was copied directly into a transparent sprite.

- turtle.png: top-down shuimo turtle, actual transparent background, supplied turtle reference. Generation ID exec-89e2d631-5f5b-4373-aded-9eba3dd4f29d. Prompt intent: "top-down shuimo turtle transparent".
- koi.png: redraw of supplied koi reference, single watercolor/ink koi with transparent background. Generation ID exec-d5f1fc08-81f6-4fd0-a225-cbf1071271fd. Prompt intent: "supplied koi reference redraw transparent".
- shrimp.png: background extraction and a single central shrimp from supplied shrimp reference, actual transparent background, no baked checkerboard. Generation ID exec-7c469d16-139a-4712-ba79-90a33cb58bf4. Prompt intent: "supplied shrimp background-extraction single central subject transparent".

Selected outputs were copied into this project and only resized for delivery to maximum512px dimension with PNG compression9. Alpha was preserved; this packaging step made no art/color/background edits. No runtime references point to generated-image folders or to external unlicensed artwork.

## Rendering

Map visual extents: turtle60, shrimp72, koi64, leaf70, flower64 world units. Gameplay pickup/collision radii are owned by RevealRun and independent of image padding. Shared images decode once and cache; loading is explicit through preloadPondPickups().
