# 墨—BOKU—

## 游戏版本

| 版本 | 直接游玩 | 冻结引用与来源 |
|---|---|---|
| **V4｜最新版水墨涂色游戏** | **[打开 V4](https://a29k055-arch.github.io/html-inkgame/v4/)** | main 持续维护；本轮标签 v4-pond-20261110 |
| V3｜Roguelike／Boss／抽卡版 | [打开 V3](https://a29k055-arch.github.io/html-inkgame/v3/) | v3-roguelike → d882581（复杂玩法冻结版） |
| V2｜更早期原版游戏 | [打开 V2](https://a29k055-arch.github.io/html-inkgame/v2/) | v2-original → 1bb0250（原版入口重定向至 outputs/ink_demo_v2.html） |

按本轮定义纠正编号：V2原版、V3复杂玩法、V4涂色。本机打包与GitHub Pages三个公开地址均已实测可启动（2026-11-09，发布42523329507，公开运行版本fd9ea21）；最终验证见PROJECT_HANDOFF发布补记。每版独立归档全部资源，更新V4不会改写V2/V3。标签本身不产生网页；两个Pages工作流统一调用 tools/package-versions.cjs 创建上述目录，并生成 versions.json 记录源码SHA。根首页发布V4最新版；旧涂色快照保留于 /previews/reveal-scroll/ 和 /archive/reveal-v3/（旧误标V3，来源1faf41f）；原误标V2的复杂快照另保留 /archive/scroll-v2/。历史Git标签不移动。V4使用独立本机存档 boku.save.v4，首次兼容读取旧记录但不改写旧键；V2/V3保留原存档方式。

- [New Version](https://a29k055-arch.github.io/html-inkgame/)（根首页，V4）
- [旧版游戏](https://a29k055-arch.github.io/html-inkgame/outputs/ink_demo_v2.html)
- [水墨视觉效果 README](prototypes/ink/README.md)
- [水墨视觉测试 · 冻结历史候选](https://a29k055-arch.github.io/html-inkgame/visual-effects/)
- [V4共享水墨测试](https://a29k055-arch.github.io/html-inkgame/v4/visual-effects/v4.html)
- [水墨效果对比实验室](https://a29k055-arch.github.io/html-inkgame/visual-effects/lab.html)
- [视觉来源与参数](visual-effects/REFERENCE.md)

V4已发布至main，十一幅原画可选关，一局显现一幅画：移动显画、吞敌大落墨、敌人柔和侵蚀，完成后进入Gallery。V4将短时美术墨尾、随体型与墨量28–60秒临时显画和吞敌永久落墨分开；Boss/碎片/抽卡停用，旧流程在V3固定入口保留；卷轴首页、三语言、Settings与冻结视觉参考继续保留。

- [Reveal Painting Preview](https://a29k055-arch.github.io/html-inkgame/previews/reveal-scroll/)（上一版涂色快照兼容地址，不是本轮定义的V3）
- [Preserved Campaign](https://a29k055-arch.github.io/html-inkgame/previews/reveal-scroll/classic.html)（保留旧流程）

本地运行：node tools/serve-preview.cjs 4190，打开脚本输出的根首页。平衡与架构见 [PROJECT_HANDOFF.md](PROJECT_HANDOFF.md)。

本轮参数与测试见PROJECT_HANDOFF的11月10日记录；上一轮对照说明保留于 [11月9日说明](docs/V4-2026-11-09.md)。五种拾取物均持续3秒；V2/V3冻结引用不变。

## 当前显画玩法

14分钟内总绘画进度达到50%，或原画有墨区域显现达到90%，即完成并在Gallery解锁。十一幅原画可手动选择/重玩，未手动选择时优先下一幅未解锁作品，地图保持各图比例。临时与持续显画取Alpha最大值并集，敌人涂白或临时过期会使进度下降。临时显画由真实墨体接触产生，按体型28–48秒，加每500墨1秒（最多加12秒），再5秒淡出；吞敌Drops无自动到期。正式I轻澜墨云，A/B/C/D/E/G/H/I在共享测试页对照。Play使用十种随机水墨转场；龟、虾、鲤、荷叶、荷花直接拾取并立即生效3秒，来源见 [拾取物说明](assets/pond/README.md)。


## 历史复杂玩法说明（V3／classic.html）

以下保留旧版规则与文档，数值不用于当前V4。

F1 / 首页问号 / 暂停可进入分区折叠教学。永久属性与两格一次性道具完全分开，道具没有LV或自动冷却再生。

本局 player.ink 同时是生命、体型与射击资源，Boss攻击直接扣墨，玩家没有独立生命值。八个等级阈值为0/180/600/1500/3200/6200/11000/18000。体型仍按 min(170,√(64+4墨)) 平滑变化。Boss每0.38秒一弹，消耗当前区间2.5%，最多55，射击保留20墨；拾取墨点恢复火力。玩家墨弹伤害随当前墨阶/区间进度增长，永久墨技另乘强化。

普通地图累计实际获得每1200墨或黄色点给一次三选一；Boss收益不计选牌，待选保留并在返场恢复。永久移速/射速/伤害3/6/9%，磁力范围5/10/15%，减耗3/6/9%，墨障1/2/3。主动道具不升级：右下大栏当前、小栏备用，Shift/触控使用即消耗并晋位。急墨3秒+30%移速、墨化3秒免伤且不能攻击吞噬、集墨5秒、反弹3秒；效果期间不能再用下一件，无自动再生。死亡保留未用道具/属性/待选，逻辑体型仍至少30%并反算墨库。

玩家墨点收益乘0.65，NPC吞噬墨库奖励乘0.55且每次最多900，控制快速连锁成长；NPC成熟质量/AI成长不改。Boss血量2700/4300/6200，轮换扇射、留缺口的环射和细锥刺，带短冲追击。双方墨弹直接复用当前Hero流体密度烘焙的24帧共享图集、专用密度显影和世界轨迹渐细尾迹，敌方普通墨弹朱砂红，不为每弹建立流体模拟。Boss以锁角凝视、瞳孔收束和墨色蓄力取代直线预警；后两阶段环射错位回波，保留可通行缺口。

普通地图950墨点、每秒补32；Boss1660、每秒补64。低墨时附近补给有上限保障。Boss攻击直接扣墨，命中闪烁，耗尽后重生；Boss自身血条独立。关键数值集中于 src/game/config.js；公式模块 src/game/ink-reserve.js。

镜头按世界焦点缩放，PC/手机最低缩放0.78/0.66，并保证视野不超过3400地图；支持DPR与横竖屏重新定位。Drops按目标、玩家体型和相机缩放放大，保留80实例池。清水圈最终半径1050，36%时间后开始、后段减速；七类AI具有不同的短时清水风险预算。

每局保留三次Boss机会，与已存画卷碎片数解耦，重复挑战不重复发片。HUD显示距离下次Boss的能量和时间条件；素材失败有程序化转场兜底，stageDebug可查询状态。

### 视觉、存档与测试

刺球中心0.73r圆核参与吞噬，25根尖刺使用独立锥形接触区，仅对核心更小的目标缓慢、非致命持续扣墨（.012×资源×体型系数/秒，上限40）；Boss为31根尖刺，生命伤害与墨库流失分开。眼球简化为一层柔软无尾墨团加眼睛，保留最大单位/攻击目标优先平滑注视；刺球与Boss无额外底座。玩家高级流体与 visual-effects 同源且未改，NPC不写玩家流场。中文翻译、NPC名字与Canvas中文字体统一校正。

localStorage 存档版本2保持兼容；碎片即时保存，Gallery解锁与设置刷新保留。旧 Best/History 不写新记录也不粗暴清空。设置重置仍二次确认。未结算局不提供断点续玩。

本地启动：node prototypes/ink/preview.cjs。12套模型涵盖资源/碰撞/阶段/Boss/Gallery/i18n、奖励队列、主动道具、磁吸争夺及3×600秒生态模拟。桌面与390×844触控模拟通过真实三次Boss弹杀、选牌、碎片、全遮盖转场、修复与刷新解锁（加速门槛、保护/自动采集夹具，非人工整局）。四视口三语、手机双指、待选跨场景与死亡保留通过；1440×900高画质32NPC短测59–60FPS、80NPC样本51–60FPS及满Boss弹幕压力约60FPS，玩家12FBO、墨弹预热后零独立求解器。

原生importmap统一模块版本 scroll-items-20261026release3；发布时运行 node tools/update-release-imports.cjs <新版本键>，防旧脚本混载。技能/攻击/平衡配置在 src/game/config.js。清水按真实墨库10%/秒扣减，避免显示质量误作资源；Boss扇射根据玩家大小与移速适配0.95–3.6秒预警。

尚需实体手机、长时性能及无保护人工难度测试；自动触控模拟不等于真机。眼球/刺球现有圆核吞噬之外新增有限射程墨弹/锥刺，非致命墨量消耗；Boss增加覆盖面积伤害锥刺与锁向短冲。双方长细墨尾共享Hero密度与缓存，不引入逐弹流体。首页单图局部流动保留，鱼/植物独立运动需分层素材。维护入口与阶段细节见 PROJECT_HANDOFF.md。

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
