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

## Previous rendering baseline (retained history)

Original map visual extents: turtle60, shrimp72, koi64, leaf70, flower64 world units. Gameplay pickup/collision radii are owned by RevealRun and independent of image padding. Shared images decode once and cache; loading is explicit through preloadPondPickups().

## Top-down lotus revision and canopy layering

The old user leaf/flower PNGs remain unchanged for reference. The current map uses lotus-leaf-v2.png and lotus-flower-v2.png, made by two independent built-in imagegen calls (no CLI):

- Leaf generation exec-9df7c337-acd9-49db-a0a2-e95baa2fad20: redraw the user lotus leaf from directly above as a single natural flat lotus leaf, matching the existing turtle/shrimp black-gray shuimo washes; uneven silhouette, radial brush veins, restrained tonal layers, real transparent outside; no paper rectangle, frame, coin disc, water ring or extra objects.
- Flower generation exec-ddcfa755-2314-4e31-b1a2-35c254b309b9: redraw the user lotus flower in true top-down plan view, matching existing turtle/koi ink painting; layered black-gray petals with only a little pale dusty pink, one complete flower, real alpha transparency, no leaf/stalk/side-view cone, paper, frame or backing.

Each selected result was visually inspected, copied to the project, resized only for delivery to a maximum512px dimension and PNG compression9 with alpha preserved. Leaf is512×446 /316711bytes; flower512×464 /334697bytes. Actual alpha range0–255 was verified for both. This packaging made no art/color/background edits. The original generated files remain intact.

All physical radii and visual sizes now come from the shared src/reveal/pond-rules.js rather than duplicated renderer constants. Shrimp is small, fish medium-large, turtle large, lotus leaf/flower large. A view-size-aware margin prevents large leaves disappearing prematurely at viewport edges.

V4 opts into lower/upper object passes around the Hero layer. Inedible objects cover the player as it passes underneath. A leaf is never edible, but a player core at least as large as the leaf radius can cover the leaf. Flowers attached to an upper leaf stay in the upper pass and sort after the leaf, avoiding an edible flower disappearing beneath its mother's image. Classic rendering does not opt into these passes and retains its original order.


Layer validation: work/pond-layer-report.json covers Canvas fallback rendering on PC and mobile; work/pond-layer-gpu-report.json covers actual WebGL rendering with DPR2 on PC1440×900 and mobile390×844. Fixtures compare image pixels and actual lower/Hero/upper draw order, never game completion. Small-player leaf center luminance128.6 versus large-player cover13.0 in WebGL; leaf remains inedible in both states; attached flower sorts above its leaf; classic opt-out order is unchanged. Both contexts report no page errors.
