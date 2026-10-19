# 墨—BOKU— New Version

## New Version

- [New Version — 墨—BOKU—](https://a29k055-arch.github.io/html-inkgame/)
- [旧版 HTML 游戏（保留）](https://a29k055-arch.github.io/html-inkgame/outputs/ink_demo_v2.html)
- [水墨视觉效果测试](https://a29k055-arch.github.io/html-inkgame/visual-effects/?mode=player&form=ink)
- [水墨视觉效果 README](prototypes/ink/README.md)

原项目的纯 HTML / Canvas / WebGL 浏览器版，无 Unity、无新增运行时依赖。通过 HTTP 或上述网页地址游玩。

### 首页与画廊

首页只有「磨墨 / 墨を磨く / Grind Ink」「画廊 / ギャラリー / Gallery」「设定 / 設定 / Settings」。作品修复全部归入 Gallery，不再提供独立宣纸或自由绘画入口。

- Gallery 按 0/3、1/3、2/3、3/3、已解锁展示。锁定预览为灰色模糊图；部分碎片在详情显示对应位置；只有三片齐全才显示「修复画卷」。已经解锁的作品直接看完整原画。
- 第一幅是 Painting_01（水畔），稳定存档 ID 仍为 ink-04，复用原始 2774×1275 图片，不裁剪。三片拼合 → 灰白模糊遮罩 → 鼠标/手指涂抹变清晰 → 达到内部显影阈值自动补全 → 柔光 → 返回作品详情。无评分、墨量消耗或修复百分比 UI。
- 新版不显示或写入 Best / History / Original 对比、绘画榜或最佳还原成绩。已有收藏、碎片及旧 IndexedDB 图片记录保留；底层 PaperReveal / PaperWorld 和独立旧版源码仍在。其他尚未开放碎片来源的作品会明确提示后续开放，不伪装为当前可收集。

### 核心循环与平衡

**3400×3400 普通地图 → 吃墨 / 吞噬成长 → 能量与时间达标 → 蒙版转场 → Boss → 新碎片 → 返回普通地图 → 集齐三片 → Gallery 修复解锁。**

- 保留 32 AI、760 墨点持续补充、七类性格、追逃互吞、清水缩圈、墨技和极小重生。普通地图不射击、不擦背景，原 AI 决策和吞噬规则不改。
- 普通累计最长 360 秒；能量 100 / 250 / 450 与最早 60 / 180 / 300 秒同时达标进入。Boss 和转场暂停普通时间；最多三次，并受缺片数量限制。360 秒从未参加 Boss 且仍缺片时保底一次。
- 特殊地图资源收益 ×2。Boss 三档 HP 2000 / 3000 / 4200，移动、绕行、扇射 / 环射、接触伤害、0.65 秒攻击预警；单次 140 秒上限。成功立即保存一个尚未获得的碎片，重复回调不重复发奖。可以继续普通地图或提前结算。
- 进入 Boss 时明确记录 entryMass / entryRadius。PROJECTILE_BALANCE 根据进入半径的归一化 0.7 次幂计算伤害和半径；战斗中质量相对进入质量的 0.18 次幂只作 0.65–1.18 的有界修正，不重复叠加。每颗弹丸快照自己的 damage / r。C.maxRadius 限制普通成长；异常超大输入也不会无限放大。
- 同一第一档 Boss 的受控模型测试：半径 18 / 65 / 145 的实际弹丸击杀约 28.8 / 17.1 / 11.5 秒。它们不是实际人工局平均值。全部关键参数集中在 src/game/config.js。

### 视觉、操作与存档

- 玩家 MaterialInk / 流体主算法不变，与 visual-effects 共用源码。敌人使用不等长、弯曲的程序化墨刺 / 浓淡噪声纹理和有层次的墨眼；刺球、Boss 均只有自身轮廓，没有额外黑色底座。88 张共享 256px 动态轮廓在加载阶段分帧缓存，NPC 不运行流体、不写玩家场。
- 眼睛平滑观察感知范围内明显更大的最大单位；没有明显大单位时看最近单位，无目标时巡视。攻击型 / 高手正在追猎时优先当前实际目标。短目标锁定与指数平滑只保存在渲染 WeakMap，不改变 AI。Boss 注视玩家。
- Drops 按被吞噬对象半径增大尺寸、寿命、浓度，有上限和 80 实例池；继续使用约 126KB 的原 Drops / Transitions WebP 图集。Boss 血条加厚、显示数值与延迟伤害层；手机镜头留出 HUD 空间。
- 首页只采样原画 RGB；局部流体 Flow / Noise 位移按墨色浓度衰减，宣纸留白扰动更弱，最大位移受限并在静止后收束。不会自动让单图中的鱼或植物独立运动。
- PC：鼠标 / WASD / 箭头移动，Boss 自动连射；关闭辅助瞄准时朝鼠标，开启则锁 Boss。Shift 使用墨技，Esc 暂停。手机左移动、右瞄准，指针独立；辅助瞄准在设置和暂停中可切换。
- 三语言字典统一在 src/ui/i18n.js：日本語、简体中文、English，首页 / Gallery / Settings / 暂停 / HUD / Boss / 结果 / 修复 / 错误与提示即时更新。语言、画质、控制、背景、音量持久化；音量控制轻微拾取 / 碎片音，不引入音乐库或自动播放。
- 继续沿用 saveVersion 2、localStorage boku.save.v1。余额、碎片、解锁、语言和设置保存；历史 IndexedDB boku.paintings.v1 不因新 Gallery 清空。重置二次确认后才清进度及旧图片，保留纯设置。碎片即时保存；未结算实时局和未完成涂抹蒙版不续玩，无账号或云存档。

### 运行与验证

运行 `node prototypes/ink/preview.cjs`，打开 http://127.0.0.1:8765/ 。不能用 file:// 加载 ES Modules。

模型：tests/game-rules.mjs、combat-ai.mjs、combat-ecology.mjs、paper-save.mjs、campaign-rules.mjs、ui-boss-upgrade.mjs。新增验证体型实际击杀时长、进入 / 返回质量传递、有界伤害、注视优先级、平滑锁定、Drops 比例、字典覆盖与存档保护。

浏览器：Edge 桌面实际三 Boss / 六次全遮盖切图 / Gallery 涂抹解锁 / 刷新；阶段时间与能量加速、玩家保护固定，Boss HP 由真实弹丸消耗。四种手机尺寸 390×844、844×390、320×568、568×320 检查双指、独立释放、辅助瞄准、暂停、语言、Gallery 排版；390×844 实际打一场 Boss 并触控修复，修复专项补入另外两片测试数据，不宣称手机完整三战。旧 Best / History 哨兵记录逐字节保留。玩家历史 GPU 哈希与 0/80 NPC 流体隔离通过。

提前生成缓存后，本机高画质 1440×900、32 / 80 NPC 各十秒短测约 57–60fps，主角仍 12 FBO；不是实机 Safari / Android 或长时性能认证。下一步是实机、完整人工局的难度和耗电验收。仅第一幅画开放收片、一个 Boss 三档；保留旧正式入口和以下历史介绍。

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
