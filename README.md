# 墨 — BOKU —

2026-10-06：基于用户认可的第四轮流动形态，新增清晰墨芯、主体/尾迹同比例缩放、柔和互动与中日对照界面。旧可玩游戏仍为默认入口；本页是独立视觉试作，尚未实现完整砚/宣纸循环。

**视觉效果 / 水墨表現：[打开独立视觉预览](https://a29k055-arch.github.io/html-inkgame/visual-effects/)**

- 新版试作： [Ink Studies](prototypes/ink/README.md)（墨体、互动水墨、原画显影）。
- 本地启动：双击 prototypes/ink/START_PREVIEW.cmd，打开 http://127.0.0.1:8765/prototypes/ink/ 。
- 重构路线：[REFACTOR_PLAN.md](REFACTOR_PLAN.md)；验证：[VALIDATION.md](prototypes/ink/VALIDATION.md)。
- 当前本地文件夹为解压副本，没有 Git 元数据；从第五轮起，用户已授权同步到 GitHub。通过现有GitHub Desktop仓库提交与同步，原main历史及素材保留。正式仓库位于 C:/Users/Nine/Documents/GitHub/html-inkgame/。

以下为保留的旧版说明。

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
