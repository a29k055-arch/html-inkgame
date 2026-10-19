# 墨—BOKU— New Version

## New Version

- [New Version — 墨—BOKU—](https://a29k055-arch.github.io/html-inkgame/)
- [旧版 HTML 游戏（保留）](https://a29k055-arch.github.io/html-inkgame/outputs/ink_demo_v2.html)
- [水墨视觉效果测试](https://a29k055-arch.github.io/html-inkgame/visual-effects/?mode=player&form=ink)
- [水墨视觉效果 README](prototypes/ink/README.md)

这是原项目的纯HTML/Canvas/WebGL浏览器版，不是Unity项目；PC和手机通过网页地址游玩，无新增运行时依赖。

### 当前核心循环

**3400×3400普通大地图 → 吃墨/吞噬积累气配 → 水墨蒙版转场 → 异界Boss战 → 获得新碎片 → 返回普通地图 → 三片齐全 → 拼片归位/涂抹修复 → Gallery解锁。**

- 普通地图保留32个AI、760个持续补充墨点、七种既有性格、追逃/互吞、成长、清水缩圈、微小重生、随机墨技和当前/备用槽。普通地图不射击，也没有背景擦画。
- 普通地图累计最长6分钟；Boss时间和转场不消耗这个计时。能量100/250/450，并分别达到普通地图60/180/300秒后进入；每局最多3次。到360秒仍未参加Boss且还缺碎片时保底一次。已收齐碎片后不再为同一幅画生成空奖励Boss；剩余机会同时受缺片数量限制。
- 每次进入异界必有Boss，资源/吞噬收益×2。Boss会追近、扇射/环射、接触攻击、眨眼、受击和瓦解；三次复用同一形态，血量/移动/攻击节奏递增。Boss有100秒单场上限，超时不掉碎片，可以返回普通地图或结算。胜利必得尚缺的一片，立即写存档；收齐三片可选择修复，也能继续普通地图剩余时间。
- 主角保留已认可的正常MaterialInk。NPC为水墨刺球/眼球，动态尖刺、眨眼、浓淡和短墨尾；造型与AI独立。NPC仅缓存贴图/Canvas装饰，不向玩家流体写入。Boss使用黑白水墨刺球与眼睛组合。
- 第一幅收集画为用户的水墨画4：既有 `outputs/assets/gallery/ink-04.png` 与原图逐字节一致，2774×1275，无裁剪或改画。三个不规则区域共享边界；齐片后归位，鼠标/手指刮去淡宣纸遮罩，按原画墨迹权重达到72%后完整显现、边缘短暂发亮，并正式解锁。Gallery优先展示当前画卷，保留全部旧藏品、Original/Best/最近5次History。
- 首页独立流体使用既有测试模块的速度平流、压力与位移场，采样原图RGB，不叠黑圆、不读取游戏或绘画图层；鼠标/触摸扰动画作，空闲停止求解。背景清单和固定/随机/轮换/解锁策略保留。参考视频前段已在浏览器实际播放，未声称复制视频中所有分层山体、鸟船动画。

### 操作与存档

- PC：鼠标或WASD/箭头移动；仅Boss战自动持续射击。辅助瞄准开启时锁定Boss，关闭时朝鼠标；Esc暂停，Shift仍用墨技。
- 手机：左摇杆移动；Boss战右摇杆瞄准，自动连续射击；左右指针独立。辅助瞄准可在设置或暂停中开关。Boss近距离镜头兼顾玩家与Boss；普通地图使用原镜头。
- 总墨量、设置、碎片和解锁在本机浏览器保存，关闭/刷新后保留已获得碎片。 `src/data/save.js` 的schema2沿用 `boku.save.v1` 键并迁移旧schema1收藏/设置/余额；图片在IndexedDB `boku.paintings.v1`。无账号、IP绑定或服务器数据库。
- 纳墨沿用本局收入/死亡处罚/普通时间比例/完整时排名奖励；每次结算和Boss碎片都有去重标识。碎片即时保存，不必等本局结束；未结算墨量和未完成的实时局/刮画蒙版不做断点续玩。
- 「データをリセット」仍需二次确认，清除新游戏墨量、碎片、修复/解锁及图片记录，保留纯设置和第一幅基础旧藏品，不清除独立旧版存档。存储不可用时提示仅本次会话。
- 旧自由绘制作为可选练习从修复页进入，仍用累计墨量并保留移动/Shift吐墨；它不能绕过碎片解锁画卷。

### 本地运行与维护

运行 `node prototypes/ink/preview.cjs`，访问 http://127.0.0.1:8765/ 。使用HTTP，不能用file://加载ES Modules。

- `src/game/campaign.js` 调度原 `Inkstone`，没有另写吞噬/AI/移动系统；关键参数在 `CAMPAIGN_CONFIG`，基础平衡保留 `GAME_CONFIG`。
- `src/ink/alien-ink.js`、`campaign-painter.js`：敌人和Boss/墨弹；`matte-effects.js`：80实例Drops池与全遮盖后切图；`src/ui/restoration.js`：复用PaperReveal原画/蒙版/加权完成度的三片修复。
- `assets/effects/`：实测不透明黑白H.264 MOV转换的透明WebP序列。32帧Drop和36帧Transition合计约126KB，预加载后使用；原素材不动。来源与重建方法见该目录README及 `tools/build-ink-mattes.py`，FFmpeg/Pillow仅用于素材准备。
- `src/data/backgrounds.js`：首页素材池与解锁关联；`src/data/save.js`：统一持久化；`src/data/records.js`：作品PNG。

模型检查：`node tests/game-rules.mjs`、`node tests/combat-ai.mjs`、`node tests/combat-ecology.mjs`、`node tests/paper-save.mjs`、`node tests/campaign-rules.mjs`。

验收：桌面完整三Boss→鼠标修复→Gallery；手机390×844三Boss→真实触摸修复，另测844×390、320×568、568×320双摇杆、辅助瞄准、暂停、提前结算、碎片刷新。浏览器流程加快普通地图计时/能量，并固定玩家保护以排除随机AI干扰；Boss均由真实弹丸击败，伤害/重生另行专项检查；另有完整360秒模型模拟、保底/超时/去重/死亡重生测试。不是六分钟人工完整试玩或手机真机认证。32/80 NPC本机10秒短测约60fps，真机Safari/Android、长时GPU/电池与难度收益平衡仍待验证。

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
