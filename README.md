# 墨—BOKU— New Version

## New Version

- [New Version — 墨—BOKU—](https://a29k055-arch.github.io/html-inkgame/)
- [旧版游戏（保留）](https://a29k055-arch.github.io/html-inkgame/outputs/ink_demo_v2.html)
- [水墨视觉效果测试](https://a29k055-arch.github.io/html-inkgame/visual-effects/?mode=player&form=ink)
- [水墨视觉效果 README](prototypes/ink/README.md)

新版循环为「墨を磨る → 保存墨 → 描く → 完成 / 收藏」。无需账号，使用当前浏览器的本机存档。

- **墨を磨る**：五分钟争墨，3400×3400大地图、32个有不同性格的AI、760墨点、吞噬成长、极小重生、墨技与清水缩圈。提前纳墨按时间比例结算，完整局有排名奖励；结算所得加到总墨量。
- **描く**：进入按原画比例放大的地图（荷花作品为4240×1800），控制玩家在画内移动，墨迹与吐墨逐渐显露原画。三分钟或墨用尽后收画。Shift向朝向吐墨，消耗4墨；移动按距离消耗保存墨。首次存档获110基础墨一次，重复开画不会补回；数据重置后墨量为0，可继续研墨。
- PC：鼠标 / WASD / 箭头移动，Esc暂停。研墨 Shift用当前墨技，描く Shift吐墨。触屏：摇杆移动，另一根手指按右侧功能按钮；无自由加速。
- 主角与visual-effects共享8f92488版本的高级水墨算法。3e63bd4的浓稠水墨算法保留在 `src/ink/npc-material/`，只用于一次性生成12帧紧凑NPC动画贴图：96网格、4次压力迭代、裁去长尾，随后释放GPU；所有NPC共享Canvas贴图，不影响主角流体。
- 首页只渲染独立清单中的一幅原画。鼠标 / 点击 / 触摸产生局部轻微扰动，不接入游戏数据。菜单与背景独立；支持固定、随机、轮换、解锁作品和Gallery选背景。
- HUD使用半透明宣纸色圆角矩形；战斗和绘制都有圆角矩形小地图。完成度达到75%解锁下一幅作品；Gallery保留Original、Best与最近5次History。
- 设置中的「データをリセット」需要再次确认。清除总墨量、额外解锁、完成记录与绘制图片；保留画质/操作等纯设置，以及第一幅基础作品。旧版独立存档不删除。

## 本地运行与开发

运行 `node prototypes/ink/preview.cjs`，打开 http://127.0.0.1:8765/ 。新版需要同源HTTP；无构建步骤或新增运行时依赖。

- `src/data/backgrounds.js`：素材池与解锁关联；新素材放 `assets/home/backgrounds/` 后配置，见该目录README。
- `src/data/save.js`：集中式localStorage元数据 `boku.save.v1`，包含saveVersion、inkAmount、unlockedArtworks、settings、progress；首次迁移旧收藏与设置。结算防重复，消费防透支；移动消费每200ms合并写入，pagehide立即刷盘。异常关闭最多可能丢失200ms内消费，普通刷新/正常关闭会保存。
- `src/data/records.js`：IndexedDB `boku.paintings.v1` 保存结果PNG Blob。存储不可用时明确提示会话回退。已收画进度与图片持久化；未收画的实时位置/蒙版、未结算战斗不提供断点续玩。
- `src/game/config.js` / `paper-world.js` / `inkstone.js` / `ai.js`：平衡、绘制世界、战斗与决策。
- `src/ink/home-artwork.js` / `paper-map.js` / `game-renderer.js` / `npc-painter.js`：独立原画首页、世界显影、单玩家流体适配与轻量NPC。
- `prototypes/ink/src/material.js` / `fluid.js`：游戏与视觉测试共享的玩家效果；旧版地图、生成与移速基础见 `src/game/legacy-foundation.js`。

规则检查：`node tests/game-rules.mjs`、`node tests/combat-ai.mjs`、`node tests/combat-ecology.mjs`、`node tests/paper-save.mjs`。

本轮Edge检查涵盖五种桌面/手机尺寸、双指控制、关闭重开存档、重置、原画首页、方向拖尾与NPC像素隔离。短时本机GPU测量不等于真实手机或长时性能认证。作品专用mask、AI/收益与显影范围平衡、真机Safari/Android仍待继续优化。

---

以下保留原视觉介绍与旧版README。历史旧版段落的根地址现指向新版；旧版正式地址见上方保留入口。

# 墨水視覚効果制作

墨の流れ、滲み、紙に浮かぶ絵を、ブラウザーで体験する視覚表現の試作です。

- [視覚効果・水墨表現](https://a29k055-arch.github.io/html-inkgame/visual-effects/)
- [表現技術・操作方法・実装](https://github.com/a29k055-arch/html-inkgame/blob/main/prototypes/ink/EXPRESSION.md)

WebGL2の流体計算で墨の密度と速度を運び、柔らかな縁と尾を描きます。操作方法・画質設定・実装の説明は技術文書をご覧ください。

---

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
