# 墨—BOKU—

- [New Version](https://a29k055-arch.github.io/html-inkgame/)
- [旧版游戏](https://a29k055-arch.github.io/html-inkgame/outputs/ink_demo_v2.html)
- [水墨视觉效果 README](prototypes/ink/README.md)
- [水墨视觉测试](https://a29k055-arch.github.io/html-inkgame/visual-effects/)

首页：开始 / プレイ / Play、Gallery、Settings。普通大地图吃墨、追逃互吞 → 三阶段 Boss → 三块唯一画卷碎片 → Gallery 短时修复与解锁。保留七类 AI、移动端双摇杆、Drops/Transitions、三语言与旧存档。

### 墨库与战斗

本局 player.ink 是统一资源。等级阈值 0 / 100 / 315 / 715 / 1370 / 2350…；第 n 个区间从 0 开始，容量为 100+80n+35n²，最低墨量为这些区间容量的累计和。Lv.10 需要10920墨。墨库 HUD 显示等级、区间进度、下一阶和墨技奖励。

体型目标半径 min(170,√(64+4×墨量))，按 1−exp(−3.4dt) 平滑变化。u=clamp((等级−1+进度)/19,0,1)，墨弹伤害 13+36u^0.65，半径 4.5+9u^0.7。Boss 每0.32秒发射一弹，扣当前等级区间容量的10%（至少2），不足时停射，不扣成负数；吃墨恢复等级与火力。进入时体型只留诊断快照，不再重复乘输出。普通地图不射击。

首次超过本局 PeakLevel 才逐级排队授予既有墨技；回升至旧等级不重复，降级不删除技能。初始65墨；死亡按逻辑半径30%重生，最低半径18，墨量由半径反算，排除浓墨/动画膨胀；Peak跨本局死亡保留，技能死亡生命周期沿用旧规则。新局重置。本局资源与结算持久化余额用途不同，不重复增加。

普通地图950墨点、每秒补32；Boss1660、每秒补64。低墨时附近补给有上限保障。Boss玩家生命100，独立于墨库，受到攻击扣血/闪烁/死亡重生。关键数值集中于 src/game/config.js；公式模块 src/game/ink-reserve.js。

镜头按世界焦点缩放，PC/手机最低缩放0.78/0.66，并保证视野不超过3400地图；支持DPR与横竖屏重新定位。Drops按目标、玩家体型和相机缩放放大，保留80实例池。清水圈最终半径1050，36%时间后开始、后段减速；七类AI具有不同的短时清水风险预算。

每局保留三次Boss机会，与已存画卷碎片数解耦，重复挑战不重复发片。HUD显示距离下次Boss的能量和时间条件；素材失败有程序化转场兜底，stageDebug可查询状态。

### 视觉、存档与测试

刺球中心0.73r圆核参与吞噬，25根尖刺使用独立锥形接触区，按清水基准1.4倍持续扣墨；Boss为31根尖刺，生命伤害与墨库流失分开。眼球简化为一层柔软无尾墨团加眼睛，保留最大单位/攻击目标优先平滑注视；刺球与Boss无额外底座。玩家高级流体与 visual-effects 同源且未改，NPC不写玩家流场。中文翻译、NPC名字与Canvas中文字体统一校正。

localStorage 存档版本2保持兼容；碎片即时保存，Gallery解锁与设置刷新保留。旧 Best/History 不写新记录也不粗暴清空。设置重置仍二次确认。未结算局不提供断点续玩。

本地启动：node prototypes/ink/preview.cjs。八套模型通过（含 tests/collision-camera.mjs）；桌面和390×844触控模拟实际三Boss、唯一碎片、Gallery修复与刷新验证通过（阶段门槛加速、保护固定、实际移动拾取资源与墨弹击杀）。另测扣墨、降阶/回升、Peak防重复、HP致死重生和四种手机视口双指/瞄准/暂停/语言。高画质1440×900各10秒，32/80NPC约60FPS。主角GPU基准和0/80NPC流体隔离一致。

尚需实体手机、长时性能及无保护人工难度测试；自动触控模拟不等于真机。首页单图局部流动保留，鱼/植物独立运动需分层素材。维护入口与阶段细节见 PROJECT_HANDOFF.md。

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
