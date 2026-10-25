# 墨—BOKU—

- [New Version](https://a29k055-arch.github.io/html-inkgame/)
- [旧版游戏](https://a29k055-arch.github.io/html-inkgame/outputs/ink_demo_v2.html)
- [水墨视觉效果 README](prototypes/ink/README.md)
- [水墨视觉测试](https://a29k055-arch.github.io/html-inkgame/visual-effects/)

首页：开始 / プレイ / Play、Gallery、Settings。普通大地图吃墨、追逃互吞 → 三阶段 Boss → 三块唯一画卷碎片 → Gallery 短时修复与解锁。保留七类 AI、移动端双摇杆、Drops/Transitions、三语言与旧存档。

### 墨库与战斗

本局 player.ink 同时是生命、体型与射击资源，Boss攻击直接扣墨，玩家没有独立生命值。八个墨阶阈值为0/180/600/1500/3200/6200/11000/18000。体型仍按 min(170,√(64+4墨)) 平滑变化。Boss每0.38秒一弹，消耗当前区间2.5%，最多55，射击保留20墨；拾取墨点恢复火力。玩家墨弹伤害随当前墨阶/区间进度增长，永久墨技另乘强化。

本局累计实际获得每1200墨触发三选一，扣墨或死亡不重置累计；墨阶不再自动赠技。五种长期墨技均LV1–LV3，新技能/升级可同轮出现，提供准确数值与前后比较，弹窗暂停游戏。墨障2/3/4命中，急墨15/25/35%移速，墨弹精进20/35/50%伤害，墨涌25/40/55%Boss墨点，惜墨12/20/28%减耗。旧Shift地图拾取物仍在，与卡牌强化分开显示。死亡至少保留逻辑半径30%，最低18并反算墨库。

玩家墨点收益乘0.65，NPC吞噬墨库奖励乘0.55且每次最多900，控制快速连锁成长；NPC成熟质量/AI成长不改。Boss血量2400/3800/5400，交替锁角墨矛与留缺口的裂环墨潮。双方墨弹由缓存流体帧、活墨边缘和逆向尾迹绘制，敌弹仅少量暗朱砂，不为每弹建立流体模拟。

普通地图950墨点、每秒补32；Boss1660、每秒补64。低墨时附近补给有上限保障。Boss攻击直接扣墨，命中闪烁，耗尽后重生；Boss自身血条独立。关键数值集中于 src/game/config.js；公式模块 src/game/ink-reserve.js。

镜头按世界焦点缩放，PC/手机最低缩放0.78/0.66，并保证视野不超过3400地图；支持DPR与横竖屏重新定位。Drops按目标、玩家体型和相机缩放放大，保留80实例池。清水圈最终半径1050，36%时间后开始、后段减速；七类AI具有不同的短时清水风险预算。

每局保留三次Boss机会，与已存画卷碎片数解耦，重复挑战不重复发片。HUD显示距离下次Boss的能量和时间条件；素材失败有程序化转场兜底，stageDebug可查询状态。

### 视觉、存档与测试

刺球中心0.73r圆核参与吞噬，25根尖刺使用独立锥形接触区，仅对核心更小的目标缓慢、非致命持续扣墨（.012×资源×体型系数/秒，上限40）；Boss为31根尖刺，生命伤害与墨库流失分开。眼球简化为一层柔软无尾墨团加眼睛，保留最大单位/攻击目标优先平滑注视；刺球与Boss无额外底座。玩家高级流体与 visual-effects 同源且未改，NPC不写玩家流场。中文翻译、NPC名字与Canvas中文字体统一校正。

localStorage 存档版本2保持兼容；碎片即时保存，Gallery解锁与设置刷新保留。旧 Best/History 不写新记录也不粗暴清空。设置重置仍二次确认。未结算局不提供断点续玩。

本地启动：node prototypes/ink/preview.cjs。九套模型通过；桌面和390×844触控模拟均完成三次真实Boss弹杀、实际三选一、三块唯一碎片、六次全遮盖转场、Gallery修复和刷新保存（阶段门槛加速、固定保护、自动采集/实际点击选卡）。另测无保护不同体型实际侧移躲开五路扇射、真实耗墨致死重生、跨地图暂缓/新局重置、双指选卡释放、四手机视口双摇杆与三语言。高画质1440×900短测32/80NPC及约100敌弹压力场景约60FPS，12玩家FBO。主角历史GPU基准与0/80NPC流体隔离通过。

原生importmap统一模块版本 inklife-20261026c；发布时运行 node tools/update-release-imports.cjs <新版本键>，防旧脚本混载。技能/攻击/平衡配置在 src/game/config.js。清水按真实墨库10%/秒扣减，避免显示质量误作资源；Boss扇射根据玩家大小与移速适配0.95–3.6秒预警。

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
