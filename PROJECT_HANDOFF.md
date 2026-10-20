# 墨—BOKU— Project Handoff

## 2026-10-20 — 额度中断接续收尾 / 线上手机完整循环 / 预览解锁保护 [CURRENT]

从正式仓库与origin/main的011a690080ac73b414989f4aa63874c1bdb0abfa接续，开始工作区干净。上轮功能提交d151969与首帧HUD修复011a690均已push且Pages成功；中断点是最后的线上浏览器调用被额度审批失败挡住，并非功能开发丢失。本节更新下面历史“手机只测一场”的验证范围。

- **已完成的原任务**：首页仅磨墨/Gallery/Settings；五种收藏状态；三片才可修复、短时灰白模糊→清晰演出并回详情；新版无Best/History/评分或新绘画历史；保留旧数据；曲线墨刺/墨眼/无底座Boss；最大单位/攻击目标优先的平滑视觉注视；按体型放大Drops；厚血条/更强Boss/体型弹径伤害；集中三语言与设置持久化；受限局部首页Flow；原大地图、七AI、吞噬/重生/三Boss/碎片循环保留。无需重做这些系统。
- **接续发现并修复**：旧Gallery详情把已获片段以72%清晰原图覆盖到模糊底图，三片齐全但未修复时会接近完整清晰画。现在paintPaintingPreview只用淡色蒙版表示片段位置，0/1/2/3片且未解锁始终灰色模糊；仅save.unlockedArtworks允许清晰原图。tests/ui-boss-upgrade.mjs增加Canvas绘制操作回归，防止任何锁定片段直接绘制未过滤原画。未改存档格式、碎片、修复阈值或玩法。
- **补齐线上验收**：桌面发布页三入口、中文切换、真实Boss击杀、Gallery修复、语言/解锁刷新持久化均通过。单场专项曾补两片fixture，已明确与下述完整流程分开。
- **手机完整循环现已完成**：真实Edge的390×844/CDP触控模拟，线上三次Boss均由墨弹正常耗尽HP，六次alpha255蒙版切图，三次实际唯一碎片奖励→回普通地图→360秒结算→Gallery详情→触摸修复→自动回详情→刷新保留3片/解锁/语言。此测试没有补片，阶段时间/能量加速并固定玩家保护，不能称人工完整六分钟或真实手机测试。原四尺寸双指/释放、辅助瞄准、暂停和布局检查仍有效。
- **修复后复验**：本地Gallery0/1/2/3/已解锁、鼠标显影/自动回详情、三语言即时更新、旧IndexedDB Best/History哨兵不改已通过。原完整大地图/七AI/资源/吞噬、体型输出、重生、主角GPU隔离未改；仅gallery-records.js、i18n.js的三片就绪提示、其回归测试和README/CHANGELOG/本交接有增量。
- **证据**：work/ui-boss-mobile-full-cycle.json（3次真实奖励，无fixture）、ui-boss-published-smoke.json、ui-boss-gallery-final.json；本地测试脚本/截图不入Git。当前README已更新手机完整流程范围。最终SHA和Pages结果以git log和work/ui-boss-publication.json为准。
- **仍未完成的验证**：实体iPhone/Android与长时间GPU/电池、无保护人工难度验收。运行环境没有连接实体手机，不把触控模拟称真机。单图鱼/植物独立运动需要作者分层素材，不在本轮强行扭曲原图；这属于后续美术素材工作。原任务功能层面无新增待开发项。

**下一步第一条操作**：先读本节与最新git status/log；如用户仅要求接续，不重做已完成架构。发布核对完成后，后续优先做实际设备/人工难度验收，除用户另提要求不扩展新玩法。保持旧入口、原画、旧收藏/碎片和主角算法。


## 2026-10-20 — 三入口 / Gallery短修复 / 异墨注视 / 体型弹丸 / 三语言 [CURRENT]

本节优先于下面历史说明。用户本轮授权完整迭代、测试、commit/push，仍是原 HTML 项目，不是 Unity。首页自由绘画/独立修复入口和新绘画成绩已明确退役；保留底层算法、原 AI / 普通生态 / Boss碎片循环和历史存档。

- **Audit/checkpoint**：开始 main 与 origin/main 均5c12cc08f2322021af2aa99c14eb0ed3de79d265，正式工作区干净。正式仓库 C:/Users/Nine/Documents/GitHub/html-inkgame；D:/ink_game_codex/html-inkgame-main 为维护副本。Git本地checkpoint/ui-boss-before-20261020，D盘work/ui-boss-checkpoint包含开始及阶段快照。未重写历史或建立新项目。
- **Current UI**：index只保留三主入口。app不再导入/进入PaperWorld、不写saveRecord；旧模块和独立旧版仍在。src/ui/gallery-records.js为当前独立Gallery，不再导入旧Gallery脚本；稳定ARTWORKS IDs不变。0/1/2片为灰色模糊，详情显示已得区域；3片只显示可修复，unlocked优先显示原图；保留老收藏。其他画尚未有新碎片来源，明确提示futurePainting。
- **Restoration**：仅Gallery详情、三片且未解锁才能open。源图blur灰白缓存，三块共享边界拼合，继承PaperReveal mask揭示原彩原图，内部72%自动补全/柔光1.8秒自动关回详情；不展示成绩/百分比、不消费墨、不保存新PNG。旧IndexedDB Best/History无读写覆盖，reset仍需确认。Painting_01=id ink-04，不要改稳定存档ID。
- **Visual**：alien-ink.js统一完整轮廓：非均匀曲线尖刺/内部墨色渐变与颗粒，外缘细晕，不再在其下面画NpcPainter墨球。眼/刺/Boss共享最多88张256px缓存，加载阶段分帧warm，约22MiB原始像素上限；NPC无活跃流体/额外玩家FBO。NpcPainter旧浓墨atlas仍供小弹滴纹理，归档实现保留。眼视线用renderer WeakMap短锁与指数平滑，最大明显大单位→最近→巡视；aggressive/expert且intent hunt时当前goal.id优先；Boss强制玩家；不修改ai.js/controller目标。小眼省略虹膜细纹。Boss移动/普通AI不由gaze驱动。
- **Boss balance**：config.js的CAMPAIGN_CONFIG HP2000/3000/4200、移速82/98/116、140秒、弹速235随阶段增长、伤害22/接触32；standoff/orbit使其不会钻入大玩家导致弹丸从Boss背后生成，0.65s锁角/锁fan-ring预警与真实弹道匹配。PROJECTILE_BALANCE entryRadius归一化^.7确定基础damage/radius，currentMass/entryMass^.18仅0.65..1.18修正，不算dense临时视觉倍数；弹丸保存r/damage，NPC弹伤同倍率。每次进入从普通当前mass明确复制，再记录entryMass/r；若转场时正处dead延迟，先规范为8半径/64质量，防死亡前大体型复活；战斗死亡保持该场entry基线但相对体型系数会降低，下次场重新采样。普通不射击、不加速。Boss HUD17px条/HP数/延迟伤害/命中反馈；手机paired镜头中心下移留HUD空间，普通镜头不改。
- **Drops/home**：dropStyle按被吞半径计算大小、寿命、浓度，上下限/80池/原WebP预加载保持。homeArtwork shader唯一改动：RGB原画的噪声调制/墨色权重、纸面弱化、.006归一化位移上限与activity收束至原图；无图层独立鱼/植物运动。主角MaterialInk、其material/contain/vorticity主shader未变，与visual-effects同源。
- **Localization**：src/ui/i18n.js集中三语字典、t、artTitle、data-i18n、aria和语言事件。getSave.settings.language持久化、默认ja，非法key回退友好错误而非裸key。app动态结果/奖励/HUD、Gallery和修复状态即时更新，暂停时也能刷新；音量轻提示合成音，音频节点结束断开，无音乐依赖。saveVersion仍2，新增纯设置，无全存档迁移清空。
- **Verification**：六个模型套件；体型18/65/145实际第一Boss弹杀约28.8/17.1/11.5s，不同弹径/伤害/时长与进入/返回mass测试；NPC互吞、重生、盾、去重、超时/保底/3次仍测。桌面Edge完整三Boss、6次alpha255换图、Gallery鼠标修复/自动回详情/刷新；五种状态、语言/暂停即时刷新、旧Best/History哨兵无覆盖。四手机视口独立双指/释放、辅助瞄准、暂停、语言、布局；390真CDP触摸修复，先打一场Boss，再补两片fixture作修复专项。不能称本轮手机完整三Boss或真机测试。浏览器阶段时间/能量加速并固定玩家保护，Boss真实射击击败；伤害重生有模型/前轮专项。历史主角GPU哈希2061883632一致、0/80NPC玩家hash164962785一致；封面流动原色不透明、reset保设置与旧版Gallery正常。
- **Performance**：初测懒加载轮廓出现卡顿，已改加载阶段按5ms预算分帧缓存、细小眼LOD、HUD10Hz，切换地图与开局即时刷新HUD避免首帧空白。复测高画质1440×900，32NPC约59–60、80NPC约57–60fps，各10秒，12玩家FBO。非手机真机/长时/电池认证。证据work/ui-boss-*.json和ui-*.png，不提交测试产物。
- **Preserved**：ai.js、inkstone.js、legacy-foundation.js、玩家material.js、存档save.js/records.js、旧outputs代码/画作/视觉README不改。README历史视觉/旧版后缀原样保留，New Version入口继续英文。
- **Known TODO**：实机Safari/Android双指与长期内存/电池；完整人工6分钟难度与三阶段收益；仅第一幅收片/一个Boss三档；其他画片源未开放；未结束局/刮画mask不续存。88张缓存近景仍是纹理而非真实墨丝流体；下一次如升级用实例化SDF+噪声距离场替代轮廓，不给每NPC流体。单图不能自动分离鱼/植物，需作者分层PNG/alpha mask/flowmap，勿过度扭曲原画。

**下一步第一条操作**：读取本节与git log/status确认最终发布SHA；直接做真实手机与完整人工普通→三Boss→Gallery难度验收，保留新三入口/短修复/i18n架构，不恢复自由绘画成绩或独立入口。最终提交与Pages部署结果以Git历史及本地work/ui-boss-publication.json为准。


## 2026-10-20 — HTML普通地图/Boss/三片修复新循环 [CURRENT]

用户本轮明确：原GitHub HTML浏览器版，不是Unity；复用大地图、AI、吞噬、资源、控制和视觉，尽量完成全部任务，测试后commit/push。此节替代历史“砚→三分钟大画布”为主要循环的说明；旧自由绘制只作可选练习，不能提前解锁画卷。主角视觉仍以8f92488/f8d3e2c已认可版本为基础，不恢复被拒绝的浓稠主角拖尾。

- **Audit / checkpoint**：正式main开始干净，HEAD/origin/main=2d00e1661db6c8d6d18ca662a034fbc6ff9ac4aa；根index.html为当前入口，outputs/ink_demo_v2.html为保留旧入口。D盘维护副本与Git对比，改前快照work/boss-upgrade-checkpoint，原Git提交保留。无AGENTS额外指令。旧7个profile已确认，未宣称有8类。
- **Architecture**：src/game/campaign.js包裹原Inkstone，后者只增加duration/autoFinish/rewardMultiplier/aiCount选项（默认不改）、appearance数据和consume事件，持续复用ai.js/legacy-foundation的运动、碰撞、生成、追逃/互吞、缩圈、技能与微小重生。Campaign正常场仍3400×3400/32AI/760墨点；异界同尺寸、12AI、收益×2。普通场实例一直保留，返回不重建其生态。
- **Timing**：CAMPAIGN_CONFIG集中360秒普通活跃时间、100/250/450能量、60/180/300最早时刻、最多3次；Boss/转场暂停普通计时。360秒无Boss且缺片才强制一次。scene normal/travel/boss/reward和finished标志防重复；单局机会不超过尚缺碎片数，三片齐全不再产生同画空奖励Boss。Boss单场100秒超时不发片；最后一次后仍可回普通地图到360秒，或提前结算/直接修复。初始能量按消费收益×.12累计，不因死亡回退；未结算墨继续可配置死亡保留65%。
- **Boss / input**：一套水墨刺眼Boss，HP420/620/840、移速68/82/96、攻速/弹数递增；追近/摆动、扇射与环射、接触伤害、受击/瓦解。玩家仅boss场自动连射，PC鼠标自由瞄准/辅助Boss锁定，手机独立左右指针；设置/暂停开关即时保存。弹丸和敌弹有池/生命期/上限；Boss不走普通吞噬判定，必须弹丸打掉HP。角色HP归零调用原kill→极小重生，盾挡致命后保留有效HP。Shift继续原墨技，不恢复加速。Boss近处镜头平均焦点并自适应缩放；正常场仍原镜头。
- **Art / FX**：NpcPainter复用原12帧浓墨缓存主体，alien-ink.js纯Canvas加动态不规则刺球/眼球、眨眼和短尾，与profile无依赖；Boss组合两者。campaign-painter.js管Boss/弹滴/瓦解，完全不写主角流体。玩家MaterialInk源码不改，历史GPU哈希2061883632，0/80异形NPC同轨迹玩家像素一致。DropPool80实体上限、轻小拾取与大吞噬不同大小/寿命；原成长反馈保留。
- **Assets**：实际本地Transitions结构为Elements/Version1/Version2，无额外Versions层。选Drop(1)5.01s/V1(1)2s，并检查V2(1)2s；都是2048×1080/59.94fps H264/yuv420p黑白不透明，并非alpha视频。tools/build-ink-mattes.py离线提取luma反转alpha，32帧160Drop和36帧320×169转场为lossless WebP，总125546bytes。预加载后使用，不依赖MOV浏览器支持；转场末尾强制全遮盖、下一帧换图、反向揭示。来源sha/尺寸见assets/effects/manifest.json。用户水墨画4.png与既有outputs/assets/gallery/ink-04.png逐字节相同，2774×1275，直接复用，没改原图。
- **Save / repair**：仍集中src/data/save.js，key boku.save.v1但saveVersion升2，迁移旧元数据不丢余额/设置/收藏。progress新增fragments、bossReceipts、restoredArtworks；击败Boss立即发第一个缺片并刷盘，与纳墨独立，重复receipt/满3片不再发。src/ui/restoration.js复用PaperReveal source/mask/灰度目标权重，3块共享锯齿边界、1.4秒归位、淡纸遮罩、鼠标/手指显影72%触发一次正式解锁和Best PNG；不在原图上涂黑。重置包含碎片/修复/图片、保留纯设置。Gallery将目标画卷前置，稳定ID和旧收藏、Original/Best/History保留；自由绘画不触发ink-04解锁。尚未修复的蒙版不续存，但已得碎片刷新/退出保留。
- **Home**：独立HomeArtwork创建专用InkFluid，复用测试页速度/压力/advection/deform，只homeArtwork shader采样原图RGB（不只采黑度），不接触实体/画作mask/玩家场。鼠标/触摸/点击扰动，无黑粒子叠加，空闲不求解/重画；背景池策略保留。隐藏状态画质/resize暂测量尺寸再恢复，避免2px背景；BFCache返回重载已释放资源。Bilibili网页工具失败，但Edge实际播放前段5.15秒/readyState4并看截图；没完整复刻视频分层山体与鸟船。
- **Validation**：原game-rules/combat-ai/combat-ecology/paper-save加campaign-rules通过（含完整360秒模型、Boss保底/超时、真实子弹击杀、2x、受伤/重生/盾、去重/迁移/reset）。桌面完整三Boss→真实鼠标刮画→Gallery→刷新；390×844三Boss→CDP真实触摸修复；另844×390、320×568、568×320双指/单指释放/辅助瞄准/双时钟暂停/早退碎片刷新。浏览器加快普通时间/能量并固定玩家保护排除随机AI干扰，Boss正常射击击败，不将其称六分钟人工局。全遮盖换图、GPU封面变形与原色不透明、80Drop池、自由绘制/重置/旧入口兼容检查。32/80 NPC各10秒本机高质约60fps；玩家12FBO+首页独立12FBO，NPC缓存生成后无常驻模拟。证据work/campaign-*.json/png，测试产物不提交。
- **Known / pending**：第一幅/一个Boss三档已完整可玩，后续画卷/新Boss未制作。真实iOS/Android、长期GPU/电池、人工难度/能量收益/伤害与小体型手感仍需验收。二维原画位移不能自动分离/驱动鱼、山和鸟；NPC/Boss近看部分细刺偏几何/贴图边缘偏软，后续可用实例化SDF/noise shader与分层美术升级，无需切换引擎。单机本机存档无云/多标签事务锁，实时局和未完成涂抹不续存。
- **Git / preserved**：仅白名单运行代码、两张WebP/来源说明/生成工具、测试与文档提交；保留旧版源码与所有原画/旧README视觉介绍/链接、独立visual-effects（主角共用原算法）、NPC保留浓墨历史实现；不提交work/builddeps/截图/浏览器配置，不force push或改remote。最终SHA/部署见Git log与work/campaign-publication.json。

**Next**：以真实手机和完整人工六分钟局调整生存/Boss难度、能量积累和触屏视野；随后精修实例化水墨刺/眼shader与作者分层flowmap、增加下一幅画，不恢复普通地图射击或背景擦画。



## 2026-10-13 — 仅主角视觉回退，当前浓墨转NPC [CURRENT]

本轮用户拒绝3e63bd4的主角浓稠拖尾，明确要求只恢复上一版主角视觉，同时将当前算法留给NPC，测试后commit/push；禁止整体Git revert。

- **Source audit**：当前3e63bd4870aea94fac0ff4a556334c36e0476ebc；上一版基础8f92488ad1ef36b51289dd8f15b363701eafaafd，主体与流体最后实际修改提交均为f8d3e2c。只取上一版MaterialInk及fluid.js的material/contain shader、material vorticity，保留新版reproject、cover与零速度注入优化等兼容/非视觉部分。主角与visual-effects同一imports，不分叉。固定轨迹历史fluid基准与当前主角GPU哈希均2061883632，逐像素一致。
- **NPC reuse**：3e63bd4的完整fluid/material视觉源码保存在src/ink/npc-material（文件头注明来源），atlas.js运行一次私有96网格/4次压力求解，采样12张128×128动态墨体贴图并裁掉远尾；所有NPC共享、按运动朝向旋转，静止取稳定帧。生成后dispose targets/lose_context/remove canvas，运行阶段零NPC流体模拟，不能推主角或写其密度/速度。cached Promise跨renderer生命周期只生成一次。旧轻量图只在生成前或GPU不支持时回退，不把它冒充复用算法成功。
- **Preserved**：游戏地图、AI、道具/绘制Shift分流、大画布、wallet/localStorage/IndexedDB、作品解锁/重置、首页纯原画、HUD未回退。游戏Renderer仍唯一接受player。README新版标题/入口为New Version，旧版正文及水墨介绍/README/链接保留。
- **Tests / limitations**：历史GPU像素对照、NPC atlas实际12帧/one build/zero live simulation；0/80动画NPC的玩家像素和运算次数一致；原规则和五视口功能回归、短性能测量。见本地work/visual-rollback-validation.json与相关回归结果，未发布测试产物。真机/长局/人眼动态接受度仍需用户判断。
- **Git**：开始正式main干净、HEAD和origin/main=3e63bd4。仅白名单视觉源码、README、CHANGELOG和交接文档提交，正常push；最终SHA以git log为准，不修改旧提交。

**Next**：以上一版主角水墨作为后续优化基线；先观察动画NPC的浓淡/轮廓，再按用户反馈微调，不恢复本轮已拒绝的主角拖尾。



## 2026-10-13 — 原画首页 / 正后方拖尾 / 大画地图与集中存档 [CURRENT]

**本轮最新用户明确授权测试、更新文档、commit并push当前分支。下面旧节“不push”仅是历史。此节覆盖旧的鼠标直接涂画、每局基础墨与携墨倍率、圆形小地图、共用NPC流体等实现说明。**

- **Current state / Architecture**：首页 `HomeArtwork` 只读取一幅原画，局部1.1px以内波纹重采样；游戏画布在首页CSS隐藏且返回时清空。清单/解锁策略独立，首页没有游戏对象、绘画层或GPU流体引用；静态时不反复重画。保留前轮墨迹DOM菜单与标题。
- **Player / NPC**：共用 `prototypes/ink/src/material.js` 和 `fluid.js`，正式游戏与visual-effects自动同步。后方两段补墨合并进contain密度pass，降低横向涡量，主体附近携带、后尾轻缓反向输运，横向阻尼/中心线回收、窄横向包络、后方渐淡。静止维持稳定墨球。跳过零速度inject的无用velocity复制；鱼模块原涡量保留。NPC仍8张缓存Canvas，增加静态浓淡/颗粒/微小边缘羽化，不引入流体或拖尾；玩家模拟唯一实体接口不变。
- **Drawing [IMPLEMENTED]**：`PaperWorld` 世界坐标、统一移动与朝向、墨消费和弹丸；`PaperMap extends PaperReveal` 复用source/mask/原画灰度权重/原图destination-in技术，镜头绘制，不画画框。作品按比例放大，第一幅4240×1800；竖幅长边可达约6700。source/mask长边上限1536/768，避免竖画分配巨大全图密度场。移动扫过与真实玩家流体一起显影；Shift/触屏吐墨4墨，冷却.35秒、初速620、衰减、寿命1.8秒，弹丸显影不写玩家物理。研墨Shift仍墨技，无加速。
- **Wallet / Persistence [IMPLEMENTED]**：`src/data/save.js` 管 `boku.save.v1`；saveVersion、inkAmount、unlockedArtworks、settings、progress（结算次数/收入/支出/每作品最高完成度/40条结算收据）。首次迁移旧settings/album，不删除旧版记录。新存档一次110基础墨；后续绘制只用钱包，研墨结算入账一次；不再乘.03或开画补基础墨。移动按距离消费，Shift单独消费，禁止透支，最后不足一段消费也按比例用完。每200ms合并写，pagehide flush，设置/结算/吐墨即写；正常刷新/退出保留，异常终止最多200ms窗口。高于当前版本存档不覆盖、提示会话回退。图片继续IndexedDB Best/History5。
- **Unlock / Reset [IMPLEMENTED]**：根游戏给旧Gallery注入persistence适配器，旧页继续旧逻辑。完成75%解锁下一幅，Gallery/绘制选择/背景池读同一个Set；没有额外解锁则默认作品。设置Reset确认对话框后清墨/额外解锁/进度/图片，保留纯设置，背景固定作品回默认。epoch防旧结果异步回写，IndexedDB generation防复活。第一幅作为默认起点保留。跨标签storage事件同步元数据；同源多标签同时消费不提供事务锁，推荐单标签游玩。
- **UI**：战斗/绘制HUD都统一半透明圆角矩形；小地图为一个圆角容器，无重复内框，绘制可看整个画作/视口/玩家。操作提示及选画可用墨量同步；首页水墨菜单保持原样。
- **Validation**：四组模型测试通过；五视口流程、原画前后像素、轻波纹、战斗结算、世界移动/镜头、Shift弹丸/扣墨、刷新/完成度/解锁/PNG、Reset取消/确认/清图片；真实CDP双指纸面摇杆+吐墨；实际mask达到75%触发收画解锁；关闭持久浏览器并重开余额/解锁/图片相同；竖幅画作及旋转、最后.001墨消费检查。方向GPU测试主后方墨迹超过两侧合计，静止中心有墨；0/80 NPC玩家像素和material调用相同。最终独立高画质32/80 NPC各10秒约60fps、12 FBO；20次进入/退出无WebGL上下文警告。后方/两侧合计墨迹积分约64/29倍（向右/向下固定轨迹）。详见本地work验证JSON和截图（不发布）。
- **Pending / Known limits**：未收画的实时蒙版/位置与未结算战斗不支持断点续玩，钱包和已收画进度/Best/History持久化；灰度mask需后续专用mask；大图三分钟覆盖范围、吐墨成本、AI难度与收益需人工完整局调优。真机Safari/Android与长局/电池未验证，无账号/多人后端。拖尾数值测试是方向证据，不代替用户最终视觉验收。
- **Preserved / Cancelled**：旧 `outputs/ink_demo_v2.html` 与素材SHA256一致；未恢复旧战斗擦画、自由加速、三选一升级、鱼主体。正式README原视觉介绍与旧版内容完整保留，新版说明前置，增加独立旧版/视觉测试/视觉README/技术入口。
- **Git checkpoint**：正式仓库 `C:/Users/Nine/Documents/GitHub/html-inkgame`，开始main干净，origin/main和HEAD为8f92488ad1ef36b51289dd8f15b363701eafaafd；D盘为包含前两轮开发的维护副本。测试后白名单同步正式仓库，正常commit/push；最终SHA见Git log及本地work/publication-receipt.json，不自引用SHA。无force push/remote变更，不提交work及用户资料。

**Next**：完整人工试玩研墨→画中移动→完成收藏，优先调大图视野/显影成本/覆盖速度与尾迹手感；再做真机性能、专用作品mask与中途画作续玩。



## 2026-10-13 — 战斗大地图与主角/NPC彻底分离 [CURRENT]

本轮用户重点修正战斗模式：完整高级水墨只给主角；NPC用轻量旧墨球，绝不向主角流体写入；恢复大型方形地图；取消加速，Shift只用道具；深化AI与HUD。**本轮仅本地，不commit/push**。此节优先于下面上一轮“共用多实体密度场”“Shift疾走”等历史实现记录。

- **Audit / Provenance**：重读交接、CHANGELOG、新版源码；通过GitHub连接读取当前main的 `outputs/ink_demo_v2.html` 和 `prototypes/ink/src/material.js`，并在Edge实际打开用户提供的 `visual-effects/?mode=player&form=ink`。MaterialInk与远端只差文件末尾空行，算法未改。旧版代码与本地旧版同样仅末尾空行差异。原始审计副本见 `work/combat-baseline/`；不覆盖前轮本地修改。
- **Player Visual [IMPLEMENTED]**：`src/ink/game-renderer.js` 仅创建一个主角 InkFluid + MaterialInk，沿用已发布的主体、输运、形变、墨迹、散墨和画质。改为视口范围模拟，避免3400全图稀释主角分辨率；镜头移动/缩放只通过新增可选 `InkFluid.reproject()` 搬运已有场，不加入力。原视觉页不调用此方法，其默认效果保持不变。主角重生时立即定位镜头。碰撞仍以稳定世界半径判定，不拿远尾或镜头比例判吞噬。
- **NPC Visual / Isolation [IMPLEMENTED]**：`src/ink/npc-painter.js` 从旧版 `drawInkBall` 的径向渐变生成8张小Canvas缓存，加静态细粒纸墨纹理；普通圆形主体、不形变、不拖尾、不持续流体。NPC绘制器没有流体引用，`GameRenderer.step(dt,player,started)` 接口不再接受NPC。原上一轮NPC inject/material/contain全部移除；模型不导入视觉模块，也不会用流场给玩家加速度。NPC道具短波只是Canvas视觉，玩法洗墨只改质量，不写速度/推力/流体。测试同一主角轨迹，0与80 NPC下画面哈希都为164962785、主角material调用均55次；像素级一致，不仅代码审查声称独立。
- **Map / Legacy Reuse [IMPLEMENTED]**：恢复3400×3400、初始半径18、资源目标760、每秒25补充。`src/game/legacy-foundation.js` 复用旧 randomPoint、42%边缘 randomNpcPoint、3–7墨点半径/四种形状/质量r²、235→约146移速曲线和PC/Mobile平滑镜头；保留覆盖吞噬阈值及AI互吞机制。NPC默认32，初始体型按旧14–38 / 42–72 / 78–118分布，全图分布不绕玩家。初始清水圆覆盖整张方图，后期缩至650；出生/补资源适配安全范围。战斗无原画、Reveal Mask、擦画或完成度，Paper模块只在描く路径创建。
- **Shift / Items [IMPLEMENTED]**：新版战斗移除boost方法、boost/cooldown字段、加速质量损失、加速按钮与E替代键。Shift只调用 `useSkill`，触屏按当前大槽同一个接口；按住不自动连耗，备用自动补位。空手Shift不改速度/质量。为满足“Shift不提高速度”，退役速度型疾墨，五种技能为溌墨/濃墨/水遁/墨障/吸墨：前方洗墨、临时增体减速、双向吞噬免疫、抵挡一次致命吞噬、扩资源吸附。配置集中；无加速隐藏在道具中。历史旧版与独立视觉实验的旧Shift动作未改，不把它们当新版战斗入口。
- **AI [IMPLEMENTED]**：`src/game/ai.js` 七种内部profile：aggressive/conservative/flee/opportunist/expert/balanced/novice；角色各自反应间隔、风险、感知、追击/资源/道具权重和熟练度有所不同。同时评估主角与其他AI的体积、威胁、追击速度差/时间收益、前方截击、目标逃离、资源风险、道具空位、地图边缘和清水；追不上的目标会放弃；逃跑比较多条路线；复用旧避让的风险权重。AI按局势用墨障/水遁/濃墨等，不随机每帧乱用。UI仅显示名字，不显示性格标签。五分钟无玩家参与的模型模拟一轮33次NPC互吞，性格行为分布不同（随机局证据，不保证每局次数）。
- **HUD [IMPLEMENTED]**：`src/ui/battle-hud.js` 独立更新墨量/体积、排名、圆形小地图/视窗/道具亮点、当前大槽＋备用小槽、有效技能剩余秒数、清水/死亡状态。HUD改为分散的半透明纸片、柔和不规则圆角、细线暂停图形、淡纸与阴影；倒计时中置，手机竖屏分层，横屏压缩。暂停和结算对话框圆角/纸感同步。墨技与摇杆双指归属明确。
- **Validation**：`node tests/game-rules.mjs`、`node tests/combat-ai.mjs`、`node tests/combat-ecology.mjs`；完整300秒模型、微小重生、死亡墨量、时间/排名结算、AI互吞/路线/资源/道具、不加速与队列通过。Edge1440×900、390×844、844×390、320×568、568×320：首页→战斗→结算→描く→记录、暂停、resize、画质/背景，无脚本/资源错误；触摸事件摇杆＋第二指道具通过。0/80 NPC流体像素一致。默认32和80 NPC高画质各10秒本机短测約60fps、12 FBO，不能冒充手机或长局性能认证。连续20次进入/退出无WebGL上下文数量警告，资源释放检查通过。记录 `work/combat-validation.json`、`work/combat-isolation.json`、`work/combat-performance.json` 与 `work/combat-*.png`。
- **Extra / Preserved**：继续完善原五分钟争墨→时间/排名纳墨→三分钟宣纸→Gallery闭环；新增溌墨、NPC情境用道具、有效技能UI、长局生态测试、主角重生镜头即时定位、资源碰撞平方距离优化。纸面Shift不会误启动绘画。首页、背景清单、IndexedDB Best/History、旧版、相册原收藏、视觉实验与原素材保留。
- **Known / Pending**：AI性格明显区别已有模型证据，仍需人工完整对战评估难度与追逐手感；NPC不做主角视觉是明确决定。镜头重投影属二维采样，快速缩放/长拖尾仍需用户视觉验收；真机Safari/Android、长时GPU、电池、作品专用Mask与竖屏作画视野待下一轮。没有音效/多人服务。
- **Git**：当前D盘工作副本仍无.git，status/remote/log/HEAD均失败；未初始化仓库、未改正式clone。只读远端main仍为8f92488ad1ef36b51289dd8f15b363701eafaafd。上一轮未提交代码原样作为本轮基线保护；只在当前工作区编辑，无commit/push。

**Next**：先人工完整试玩32 AI争墨局，按体验调分布、收益、追击放弃和技能；再做实际手机双指/帧率与长时间循环，随后专用画作Mask/镜头。不恢复自由加速或NPC主角流体。

## 2026-10-13 — 新首页与单机新版闭环 [CURRENT]

本轮最新用户授权：推进新首页与后续正式玩法，在当前工作区开发和测试，**不 commit/push**。此前发布授权不适用于本轮。以下旧节中的路径、语言与阶段状态均为历史；当前实现以本节和源码为准。

- **Current State / Implemented**：根 `index.html` 已改为真实新版游戏入口。居中书法「墨」＋「墨を磨る」「描く」「ギャラリー」「設定」四个 DOM 按钮；指针/焦点/上下键选择加深墨迹。Loading、三档画质、操作方式、背景策略和本地设置已接入。新入口采用日语，与2026-10-12实际视觉页一致；旧版文案未重写。
- **References**：图 A 原样复制至 `assets/home/menu-reference.png`，仅由 CSS 裁切视窗显示书法标题；菜单字样、交互及 SVG 墨迹按钮独立实现。图 B 参考整体位置、比例、纸色、边缘浓墨和中央留白，不作为带菜单的整张背景。当前画作使用现有荷花和山水素材，不宣称已提取竹影背景。
- **Architecture**：`src/data/` 管作品/背景/记录；`src/game/` 管统一实体、AI、规则和配置；`src/ink/game-renderer.js` 适配既有 InkFluid/MaterialInk/PaperReveal；`src/ui/` 管输入、样式、相册记录。无框架迁移或新增运行时依赖。成熟 `material.js` 主体、输运、拖尾、散墨及碰撞半径继续复用；不接入鱼。AI以同一密度场降低成本，`localEntities` 将力与消散局限于附近，避免远处墨被玩家带走。原视觉页默认关闭此选项，保持原路径。
- **Homepage Backgrounds**：`src/data/backgrounds.js` 的独立清单关联稳定 artworkId，UI 无背景素材路径。素材放 `assets/home/backgrounds/` 后加一条配置即可；固定/随机/35秒轮换/仅解锁作品已可用。Gallery 已解锁作品可设固定背景，设置刷新持久化。图片 decode 后替换，异步代次防止旧加载覆盖新选择；失败保留当前背景。GPU 变形场提供鼠标/手指互动，等比 cover；纵向作品可能裁切。
- **墨を磨る**：5分钟、公共墨点、15个AI与五种内部性格、统一Entity/Controller、吞噬、微小重生（半径8）、短时保护、独立累计墨量、可配置死亡墨量保留65%、提前结束按时间比例结算、完整局排名倍率、清水缩圈衰减、小地图与墨技亮点、随机五种墨技和两槽队列、疾走、暂停。所有关键平衡集中在 `src/game/config.js`。鼠标/WASD/箭头，Shift疾走、E墨技，触屏摇杆＋第二指动作。相反按键抵消不回落鼠标，pointerId明确归属，失焦/隐藏自动暂停。计时以前台有效时间推进，低帧率不延长局长，暂停不累计。
- **描く**：可直接从首页进入，不要求先争墨；选择已解锁作品，基础墨110＋携入墨×.03，3分钟上限，流体经过处显露原画，停留晕染，墨量消耗与完成度，辅助下图、提前收画、结果PNG下载。原画比例保留，操作前完成度为0；resize/画质切换保留累计显影。当前mask仍由原画灰度推导，未伪称已有作品专用 Ink Mask。
- **Gallery**：沿用 `outputs/ui/boku-gallery.js/.css`、11幅原素材、稳定ID和 `boku.album.unlocked.v1`，不迁移/清空旧收藏。新版适配器添加 Original / Best / History；原画可查看，未解锁图不能作画或设背景。默认展示 Best，最近5次结果和最高完成度PNG Blob存 IndexedDB `boku.paintings.v1`，不用localStorage存图片。每次达到配置完成阈值75%解锁下一作品（是新版收藏阈值，**无旧版最大体型通关条件**）；低完成结果也保存。存储不可用时退回会话并明确提示。
- **Validation**：Edge本机1440×900、390×844、844×390、320×568、568×320：菜单与两入口、暂停计时、显影/收画/相册Best、旋转、背景与画质，无脚本/资源错误。CDP真实触摸事件验证摇杆＋第二指疾走、触屏显影；不是手机真机测试。规则单测和完整300秒模型模拟通过；未宣称完整5分钟人工试玩。IndexedDB刷新、最佳值不被低分覆盖、History上限5、存储被禁回退通过。三画质/resize FBO计数12；连续20次进入/退出释放GPU上下文，无上下文数量警告；独立视觉页与旧版入口冒烟通过。短时本机约60fps；不代表Android/iOS或长时GPU表现。证据见 `work/new-game-validation.json`、`work/home-*.png`、`work/stone-*.png`、`work/paper-new-*.png`；脚本在本地work，不纳入发布。
- **Known Issues / Pending**：作品专用mask/纸色和手机竖屏画作视野；多实体合并的密度尚非独立自由表面液体，靠近时视觉墨可交融但吞噬只认稳定半径；AI竞争/技能/收益数值需人工长局调优；新首页未使用参考B的竹林原画；音效、真机Safari/WebGL兼容、长时负载待后续。IndexedDB与收藏本机本源，无云同步；尚无多人服务器。
- **Cancelled / Preserved**：旧版“最大体型＋75%通关”、三选一技能、鱼虾装饰不恢复。`outputs/ink_demo_v2.html`、旧相册/二维码、鱼视觉页和所有原画保留；二维码目前只在旧版中，不将展览临时二维码强塞新版。原视觉模块只有可选局部实体/cover背景与可传作品地址的兼容扩展，默认路径保留。
- **Git Checkpoint**：工作目录 `D:/ink_game_codex/html-inkgame-main/` 仍无 `.git`，四项Git审计命令无法获得本地branch/remote/log/HEAD；没有初始化新仓库。2026-10-13只读GitHub连接确认远端main=`8f92488ad1ef36b51289dd8f15b363701eafaafd`。未同步远端、未写正式clone、未commit/push；正式clone受当前读取权限限制。本轮前主要替换文件快照在 `work/home-baseline/`，未删除用户资料。未来推送必须重新授权并核对正式仓库差异。

**Next**：先实际试玩五分钟争墨→三分钟宣纸，调玩家主体可读性、AI密度与收益，再制作作品专用mask和竖屏画作镜头；随后真机双指/Safari/长时性能，再扩展内容。新首页布局以本轮参考图优先于最早总提示词的不对称建议。

## 2026-10-06 — 第五轮：认可流体风格并授权发布 [CURRENT]

用户认可第四轮墨体风格，要求保留；强化主体小墨球的可见度，所有尾迹/扩散随主体尺寸变动；互动水墨降低灵敏度/力量/作用范围。宣纸只做必要微调。界面最新要求为**中文和日文同时显示**，替代此前仅中文偏好。从本轮起用户明确授权更新GitHub并提供独立“视觉效果”链接。

- **Implemented**：material.js浓墨中心以流体补墨维持，统一entity.radius控制种子、中心、补墨、输运影响、contain淡出范围及泼墨尺寸。新增主体大小滑杆，尺寸改变时清除旧尺寸流体残留。
- **Interaction**：输入推动为旧值约1/4，最大85，影响半径.035；自动推动25降8，半径.08降.045；互动模式涡量降为.55倍，保留第四轮主体风格。宣纸修复隐藏canvas读取零尺寸后不能显影的问题。
- **UI**：独立视觉页同时显示中文/日文；旧版游戏入口仍为root index，玩法和素材保留。
- **Public route**：https://a29k055-arch.github.io/html-inkgame/visual-effects/；visual-effects/index.html通过base引用同一套prototypes/ink源码，路径保持为独立链接。
- **Validation**：Edge 1440×900、390×844、844×390和320×568的输入/显影/清零/旋转验证。尺寸测试r=.028/.084：墨迹采样面积73/525，中心alpha均251/255。模拟不是手机真机性能认证。
- **Git Checkpoint**：当前目录仍为解压副本，无.git。已连接GitHub服务确认main基线1bb02502f68b6fd99e28338ef183825711054443，树503710a2bcda5146b6f3b1da05528b0260e23099；提供ZIP的43个已跟踪文件与远端blob完全一致。GitHub连接写入返回403后，获准读取到GitHub Desktop现有仓库C:/Users/Nine/Documents/GitHub/html-inkgame/，该仓库main干净且HEAD与基线一致。已将白名单22个文件同步到现有仓库，通过GitHub Desktop提交/推送，不初始化新的仓库。后续Git操作优先使用此正式仓库；D盘为本轮维护副本。提交消息为feat: publish bilingual ink visual preview with scaled core and calm interaction；实际提交SHA和部署结果以GitHub提交/Actions及本地work/publication-receipt.json为准。
- **Pending**：保持认可风格，按后续反馈细调墨芯/尾迹；真实设备、长期性能、完整新首页与砚/宣纸玩法仍待后续阶段。


## 2026-10-06 — 第四轮：更换主体实现方式 [CURRENT]

用户再次明确拒绝第三版，要求考虑其他实现。第三版的方向拉伸测试通过不等于视觉验收通过，应标记 [REJECTED VISUALLY]，不继续仅调轮廓参数。

当前候选：material.js直接驱动GPU速度与墨密度；移除活动主体的Canvas曲线/固定渐变墨芯。墨密度经过平流、投影和涡量约束形成主体，加入跟随输入的输运、密度相关局部吸引及少量补墨。原body.js未删除，legacy-v3/body.js保留本轮前快照；均不参与当前主体渲染。

fluid.js新增material pass和仅用于主体/宣纸的光学密度显示分支；互动水墨仍使用原显示路径，seed构图不变。PaperReveal继续使用真实流体画面驱动mask。移动点击不再自动泼墨，按钮及Shift仍有对应动作。

验证：Edge 1440×900、390×844、844×390移动/转向/宣纸显影/操作前空白/重置清零/切换画质/旋转无脚本或资源错误。宣纸短时采样约55.9、54.3、58.8帧/秒；内嵌浏览器实测截图约22帧/秒，不能宣称稳定60或真机达标。最终补墨浓度微调经语法检查，不是重新全矩阵采样。

限制：目前更像墨在水中卷动，仍缺视频中的真实表面张力、薄膜厚度和立体翻卷。此为替代实现候选，绝不把测试通过当作用户视觉满意。用户已拒绝前三轮；下一轮以反馈和动态效果为准。

中文UI、当前本地路径及仅本地保存不变，未commit/push。


## 2026-10-06 — 第三轮：主体随方向变形 [CURRENT]

用户指出第二版尾部尚可，但主体动态太差、不能明显随移动方向变形；互动水墨可以，优先完善墨体和宣纸。

- 墨体外缘及墨芯共用速度驱动拉伸、横向加速度弯曲、转向滞后和停留回收。移除固定圆形墨芯和径向肋纹；不再只让外圈/尾部变化。
- 宣纸接入同一墨体。按下或触摸后通过目标点驱动惯性移动与形变，显影由主体留下的流体驱动；操作前和重置后不自行绘制。移动时墨芯随形态变动，停留保留缓慢晕染。
- Interactive Painting当前流体模块与初始构图保留，中文偏好与仅本地保存继续有效。
- 测试：独立主体向右/向下/停下形态尺寸分别约199×73、70×187、94×105，确认主体而非拖尾随方向变化；停下拉伸量回到近零。Edge桌面无脚本错误，宣纸轨迹显影约13.6%。触屏模拟拖动、实体可见、显影、重置清零和旋转通过。均非真机性能认证。
- 动态测试证据：work/v3-body-motion.gif（同一主体模拟器按向右→向下→停止运行，非完整游戏录像）；当前预览已刷新第三版。
- 仍待用户视觉判断；二维几何辅助薄膜不是完整液体表面张力求解，不能宣称已复现参考视频。无Git提交或推送。


## 2026-10-06 — 第二轮视觉完善与语言更新 [CURRENT]

用户反馈：第一版视觉不够好，继续完善；界面仅使用中文。此语言偏好取代后文历史日语UI要求，未来不要恢复日语文案。

- **Current State / Implemented**：沿用独立三个原型，增加弹簧阻尼软轮廓、受加速度影响的边缘、不对称薄膜长尾、急转甩墨及不规则散墨。流体密度加入有界MacCormack校正，保留更细墨丝；修复未按鼠标时的连续推动输入。
- **Architecture**：原模块结构不变；高画质448基准网格、20次压力迭代，新增两个校正FBO（现共10个）。模拟与显示分频，显示阶段按速度预测中间流动；缓存shader uniform绑定。
- **Language**：原型、当前旧版v2、相册、二维码和根入口可见文案/无障碍文本已改中文。旧版仅文案调整，不改玩法或素材。最早的独立旧备份outputs/ink_demo.html仍保留历史内容。
- **Known Issues / Pending**：与参考的立体液膜、真实表面张力和自然破碎仍有差距；当前为二维流体＋几何辅助薄膜。高画质帧率波动需继续优化；等待用户对第二版动态效果的反馈。
- **Validation**：Edge 1440×900、390×844、844×390操作/显影/重置/画质切换/旋转，无脚本或资源错误；可见UI无日文假名。详见prototypes/ink/VALIDATION.md第二轮条目。旧版随机游戏中的暂停冒烟曾超时，改用受控play/pause状态验证文案与返回首页通过；不是完整手玩或随机行为认证。
- **Git Checkpoint**：仍为用户提供的解压副本，无Git元数据；本轮继续仅本地保存，未commit/push。


## 2026-10-06 — Current State / New Refactor Checkpoint

此节是当前状态入口；后文2026-09-09的玩法和机器路径保留为 [LEGACY] 历史。旧代码未改变，新企划也没有在旧入口实施。

- **Current State**：用户确认“先在本地完成三个原型”。完成仓库审计和独立 Phase 1 试作，等待动态视觉验收，不继续大规模游戏开发。
- **Current Architecture**：`prototypes/ink/src/` 内 fluid、body、paper、app、config 分离；入口 `prototypes/ink/index.html`。旧 `index.html` 仍跳转旧 v2。
- **Implemented**：WebGL2 float 流体、可变形墨体/分叉薄膜、互动推动/注墨、原画 Reveal Mask、目标暗部加权完成度、三档质量、触摸/键盘和重置、本地启动器。见 `prototypes/ink/README.md`。
- **Pending**：用户对三个原型的视觉反馈；完善参考薄膜边缘及碰撞效果，然后才进入新版首页、正式砚/宣纸与Gallery记录。真机、Chrome/Safari及长时性能未验证。
- **Cancelled / Replaced**：[REPLACED] 新产品方向为“争墨→用墨→成画→收藏”，旧“最大体型+75%通关”为旧版规则；新版死亡微小重生、随机技能两槽等仍为待实施设计，不冒充已实现。
- **Known Issues**：参考具有更丰富的立体薄膜和破碎效果；当前二维薄膜分叉有程序化重复。浮点WebGL2不支持时显示不可用。完成度使用从原画灰度推导的目标墨权重，后续应引入作品专用mask及阈值校准。
- **Git Checkpoint**：实际目录 `D:/ink_game_codex/html-inkgame-main/` 是解压副本，无 `.git`，不能获得branch/remote/log/HEAD。GitHub页面读取及ls-remote网络失败，main尚未核实。本轮无commit/push；未来先定位用户GitHub Desktop的真实clone，不依据历史路径创建平行仓库。
- **Validation**：本机Edge桌面及4种触屏模拟视口，无脚本/资源错误；墨体/互动约60fps，宣纸约47–59fps；实际纹理/FBO存活计数resize后均保持8。真机表现未知。详细边界及参考差距见 `prototypes/ink/VALIDATION.md`。


核实日期：2026-09-09（Asia/Shanghai）。这是持续维护的项目交接入口，不是自动执行的开发清单。

本文依据：当前对话中的游戏需求、实际本地源码及 Git 历史、GitHub 公开 API 返回的 main 提交、现有 CHANGELOG、修改11/12说明，以及用户提供的 `CODEX_PROJECT_HANDOFF_INSTRUCTIONS.md`。附件中的设计要求不等于已经实施的事实。首次交接轮只制作文档；随后用户明确授权实现二维码与相册，2026-09-09已完成相应代码（见第11/12节）。PPT未改动。

## 0. Instructions for Future Codex Sessions

1. 完整阅读本文，再读取用户本轮最新指令，确认实际任务范围。
2. 进入真实项目目录，检查 `git status --short --branch`、`git remote -v`、`git log -12 --oneline` 和 `git rev-parse HEAD`。
3. 读取 `CHANGELOG.md`、`index.html`、当前游戏入口及任务相关函数；只把本文当作导航，不替代读代码。
4. 只读核对 GitHub 当前分支；本地 `origin/main` 是缓存引用，不能仅凭它断言远端没有新提交。
5. 当前实现以代码为准；历史目的、审美偏好和暂缓事项以对话与本文为依据。冲突应记录，不擅自恢复历史功能。
6. 保留用户未提交修改、未跟踪文件、旧版本、素材和视频，不覆盖、不清理未知工作。
7. 正式开发完成后执行适当测试、检查 diff、更新 CHANGELOG，再按用户已授权的项目流程提交并推送当前分支。只暂存本次相关文件，禁止随手 `git add .`。
8. 不 force push、不重写历史、不删除 commits、不擅自修改 remote 或创建无关分支。
9. 较大更新后同步维护本文的 Current State、Recently Completed、Pending / Next、Important Decisions、Git Checkpoint。
10. 修改前说明改动范围；完成后用中文说明结果、测试范围及没有验证的部分。游戏内 UI 延续日语。
11. 只有用户明确要求才录 MP4；新录像使用新文件名，保留旧录像。
12. Windows 中文/日文文件使用 UTF-8 读写。PowerShell 读取用 `-Encoding UTF8`，避免误解码后覆盖文件。

状态标签：

| 标签 | 含义 |
| --- | --- |
| `[CURRENT]` | 当前采用的方向或核实的状态 |
| `[IMPLEMENTED]` | 代码中确有实现，不代表全设备测试通过 |
| `[TODO]` | 待开发方向，不自动授权新对话实施 |
| `[TEMP]` | 展示阶段临时方案 |
| `[PAUSED]` | 暂缓，不主动恢复 |
| `[CANCELLED]` | 已被后续要求取消或替代 |
| `[HISTORICAL]` | 历史构想，不是现行规则 |
| `[NEEDS_ASSET]` | 需要补充或确认素材 |
| `[VERIFY_IN_REPO]` | 下次必须重新核实 |

## 1. Project Overview

项目名称：《墨—BOKU—》。单机 Web 水墨吞噬成长游戏，玩家是墨点，与 NPC 共处一幅画中，通过移动和吞噬逐渐揭示背景中国水墨画。

目标受众包括日本学生、平时较少接触中国水墨画的人群。修改11的 Target 已取消年龄限制，不恢复“16–25岁”。项目需要 PC、平板和手机可访问，展示时希望观众可通过 URL 或二维码试玩。

- `[CURRENT]` 工作目录：`C:/Users/玖别/Documents/Codex/2026-06-24/html-md-demo`。
- `[CURRENT]` 游戏主文件：`outputs/ink_demo_v2.html`。
- `[CURRENT]` 根目录 `index.html` 跳转到 v2；`outputs/ink_demo.html` 保留为旧版。
- `[CURRENT]` 仓库：<https://github.com/a29k055-arch/html-inkgame>。
- `[CURRENT]` 配置的游戏 URL：<https://a29k055-arch.github.io/html-inkgame/>。
- `[VERIFY_IN_REPO]` 本轮核实远端代码提交，未重新验证 Pages 的当前在线运行和所有资源响应。

## 2. Creative Intent and Experience Goal

玩家像一滴墨进入画中，在移动、吸收、成长过程中感受墨色浓淡、晕染、留白和流动，最终看到一幅中国水墨画。文化传播是目的，游戏体验是媒介；不把游戏改成知识介绍页，也不把它当作普通扁平风吞噬小游戏。

单机不能仅依靠 PvP 排名驱动。当前目标设计把“变大”与“完成画卷”连接：玩家越大，揭示范围越宽；比玩家大的 NPC 设计上能抹回画面，促使玩家成长并重新经过受影响区域。

`[CURRENT]` 目前实际采用“预置整幅画 + 擦雾显影”，不是每次吞噬都调用 AI 生成新画。它给整个地图统一构图，避免围绕玩家堆放孤立装饰。

## 3. Core Gameplay

以下数值均来自 v2 源码，而非参考游戏的规则：

| 项目 | 当前实现 |
| --- | --- |
| 世界尺寸 | `WORLD_W = WORLD_H = 3400` |
| 初始玩家 | `START_RADIUS = 18`，质量按半径平方计算 |
| 悬浮物 | `FOOD_TARGET = 760`，圆、方、三角、五边形；数量不足时补充 |
| NPC | `NPC_COUNT = 23`；全地图随机生成，含边缘分布策略 |
| 玩家吃 NPC | 玩家半径 > NPC 半径 × 1.04，距离 < 玩家半径 − NPC 半径 × 0.32 |
| 玩家被吃 | 上述条件反向应用，接触不立即死亡 |
| NPC 互吞 | 大者半径 > 小者 × 1.06，距离满足同样 0.32 覆盖阈值 |
| 玩家悬浮物收益 | `f.r * f.r * .84` 质量，不是半径直接翻倍 |
| 玩家 NPC 收益 | NPC 质量 × 0.62，并使 `score` 加一 |
| NPC 吞噬收益 | 小 NPC 质量 × 0.45 |
| 玩家吞噬后的 NPC 补足 | 9–18秒后重新生成；NPC 互吞为10–20秒 |
| 基础速度 | `moveSpeed(r)` 从235渐降至约145.7；NPC 再乘0.74 |
| 加速 | 冷却5秒，`spurtBoost = 1`，质量损失10%，短暂强化墨迹并产生后方残墨 |
| 通关 | `score > 0`、`isLargestInk()`、作画覆盖率 ≥ 75% 同时满足 |

`isLargestInk()` 实际要求不存在活 NPC 半径大于玩家的98%，比单纯“同大即可”略严格。`MAX_RADIUS = 170` 用于速度归一化等计算，不是玩家质量的硬上限。

计时为正向累计时间。`ROUND_MS` 旧常量仍存在，但当前 `update()` 没有倒计时失败逻辑。没有吞噬 NPC 时不能通关；不能描述成“到时间就失败”。失败目前来自被大 NPC 吃掉。

成长与目标的闭环：移动吃悬浮物 → 吃较小 NPC → 更大范围显影 → 应对大 NPC → 最大且75%完成 → 作品展示。

## 4. Historical Gameplay Ideas

### Adopted

- `[CURRENT]` Agar.io、球球大作战、Osmos、大鱼吃小鱼是机制参照，不是联网 PvP，也不是复制美术。
- `[CURRENT]` 去掉等级门槛，改成体型与覆盖判定；体型大移速慢，但速度差不要失控。
- `[CURRENT]` 荷叶提供视觉上下层关系，荷花提供成长奖励。
- `[CURRENT]` 明确的作画进度替代单纯越吃越大。

### Paused

- `[PAUSED]` Roguelite 能力选择：体积强化、拖尾伤害、吸附范围、伪装等。此历史来自本次要求附件；当前可见对话未给出完整原设计，代码也没有能力选择系统。
- `[HISTORICAL]` “墨魂”、小鱼、荷蕾、偏即时策略构建等概念，同样作为附件补充历史保留，不冒充已实现机制。
- `[PAUSED]` 鱼、虾、泥鳅图片作为吞噬后生成的背景内容。素材仍保留，当前不生成这些装饰。
- `[PAUSED]` Stable Diffusion 图生图后端。曾考虑将结算画面精修，目前没有接入。

### Cancelled / Replaced

- `[CANCELLED]` NPC 特殊角色素材、等级制度、严格完全覆盖、接触即死。
- `[CANCELLED]` 大 NPC 接触时的警告闪光、玩家/NPC 周围固定装饰圈的方向。
- `[CANCELLED]` 以路径图上的吞噬黑点作为最终作品的旧方案。
- `[CANCELLED]` 以玩家附近独立生成荷花、鱼、山水装饰作为当前主背景的旧方案；改为整图擦雾。
- `[CANCELLED]` 倒计时胜负及80%通关阈值；当前正计时与75%。
- `[CANCELLED]` 开始时先淡出文字再播放蒙版；现在要求标题内容由墨蒙版直接替换。
- `[HISTORICAL]` NPC 曾临时禁互吞，后恢复互吞并加入避让。不能依据较旧 changelog 再禁用。
- `[HISTORICAL]` Feeding Frenzy、涂色、领地扩张由本次附件作为参考方向补充，无独立现行实现要求。

## 5. Visual Direction

保持宣纸背景、水墨深浅和细密扩散，避免大圆/椭圆泡泡一团团喷出。用户反复强调：粒子小而多、开始浓、连贯、随后扩散变淡；慢速或大体型时仍应有可见拖尾距离，但不能堆成永久全黑。

当前 `addBrushTrail`、`addInkAura`、`drawSplashLayer` 等组织墨迹；`brushMarks.distLife` 用累计玩家移动距离控制衰减，主拖尾范围380–560世界单位，周边墨迹260–430。不是单纯延长秒数。

`[CURRENT]` Canvas 使用渐变、离屏 Canvas 与细粒子绘制；代码仍有 `arc()`、拉伸参数及历史辅助函数。用户早先要求“禁止 arc / 固定提示词”，后明确撤回该次提示词，应保留审美目的而非重新强制那套实现。

原画不拉伸，可以等比裁切。当前背景为 `#f5f0e6`，UI 黑色为 `#111` 等多种墨色，不是所有渲染都严格固定成 `#1a1a1a`。

## 6. Controls and Responsive Design

- `[IMPLEMENTED]` PC：鼠标方向；WASD/方向键优先；Shift 加速；Escape 暂停/继续。
- `[IMPLEMENTED]` Mobile：虚拟摇杆，默认左下；触点可重新定位摇杆，松手恢复；右下 `加速`。
- `[IMPLEMENTED]` 默认模式取 `matchMedia('(pointer: coarse)')`，暂停面板可手动切 PC/モバイル。
- `[IMPLEMENTED]` 加速按钮单独监听 `pointerdown` 并停止传播，目的是摇杆与第二根手指加速同时工作。
- `[CURRENT]` 两端共用一份 DOM/CSS/Canvas 和逻辑，没有独立移动端组件或构建。
- 响应式 CSS 在 HTML 的 `<style>` 中，关键断点 `max-width: 820px` 与竖屏条件。
- `resize()` 读取 visualViewport，DPR 上限2；`updateCamera()` 移动模式缩放因子0.8，竖屏最低0.4。
- 手机竖屏 HUD 隐藏大きさ，作画进度占上行，吸收/时间置下；右下加速缩小。

`[VERIFY_IN_REPO]` 已有适配代码不代表全部真机通过。需验证 iOS Safari/Android、横竖旋转、多点触摸、缩放比例、极矮横屏与平板。0.8缩放约等于可视世界宽高扩大25%，不是严格“扩大20%”。

## 7. Current Repository / Tech Stack

原生 HTML5、CSS、JavaScript、Canvas 2D、HTMLVideoElement，静态资源相对引用；无 React/Vue、无包管理清单、无 bundler、无服务器应用、无数据库。

```text
html-md-demo/
  index.html                         # Pages / 本地跳转入口
  outputs/ink_demo_v2.html            # 当前游戏，内联样式和脚本
  outputs/ink_demo.html               # 保留旧版
  outputs/assets/                     # 游戏图片、蒙版视频
  outputs/ink_demo_test.mp4            # 旧测试录像，已跟踪，保留
  outputs/墨_BOKU_修改11/             # 本地未跟踪的 PPT/口播资料
  outputs/墨_BOKU_修改12/             # 最新本地 PPT/口播资料，未跟踪
  CHANGELOG.md
  README.md                          # 部分描述过时
  PROJECT_HANDOFF.md                 # 本次新建
  .github/workflows/deploy-pages.yml
  .gitignore
  .nojekyll
  work/                              # 忽略的本地脚本/测试产物
```

直接浏览器打开 `index.html` 可启动。没有 `npm run dev`、`npm run build` 或统一 npm test；不要编造命令。蒙版涉及视频逐帧读像素，验证时优先同源 HTTP，避免 file:// 的浏览器限制。

本地已有 `work/check_demo_v2.js`：启动临时 HTTP 服务并用 Playwright/Edge 检查启动，完成后关闭；该文件未跟踪，新电脑不保证存在。当前脚本使用的运行方式：

```powershell
& 'C:/Users/玖别/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe' work/check_demo_v2.js
```

这是机器相关工具路径，不是项目依赖安装规范。`README.md` 仍称旧版为当前入口，并提及 convert controls；以 `index.html` 与 v2 为准。

## 8. Current Game Architecture

没有组件框架，主要是顶层变量与函数：

| 范围 | 入口/数据 | 职责 |
| --- | --- | --- |
| 主循环 | `loop`, `update`, `render` | requestAnimationFrame，dt封顶0.05秒 |
| 状态 | `state` | title / interlude / play / pause / dead / ending |
| 世界重置 | `resetWorld`, `createPlayer`, `createNpc` | 初始化对象、画布和进度 |
| 对象 | `player`, `foods`, `npcs`, `leaves`, `flowers` | 单局内存数据 |
| 输入 | `directionalKeyVector`, `currentInputVector`, `startJoystick` | 键盘/鼠标/触点统一方向 |
| 移动/AI | `updatePlayer`, `updateNpc`, `moveSpeed` | 移速、追逃、NPC避让 |
| 吞噬 | `handleCollisions`, `handleNpcCollisions`, `eatNpc` | 质量增长、死亡、显影 |
| 图像 | `paintingCanvas`, `revealCanvas`, `matteCanvas`, `sedimentCanvas` | 原画、显影蒙版、视频蒙版、离屏绘图设施 |
| 显影 | `addPathLandscape`, `revealAt`, `updateDropMattes` | 路径与吞噬揭示 |
| 擦回 | `obscureNpcTrail`, `obscureAt` | 大 NPC 擦回雾层 |
| 补偿 | `isAreaMostlyRevealed`, `revealFromEdgesByArea`, `revealEdgeBand` | 重复吞噬区域补偿地图边缘 |
| 结算 | `finish`, `drawEndingArt`, `drawEndingOriginalArt`, `drawEndingTraceArt` | 原画/笔迹切换和保存 |

`PAINT_SCALE = .45`，整图离屏画布为1530×1530。`drawPaintingSource()` 优先真实素材，缺图时 `drawGeneratedLandscape()` 程序化兜底。`spawnArtElements()` 名字保留，但当前只调用显影，不再生成鱼虾对象。

没有正式关卡配置文件；数值在脚本常量、生成函数中。`次へ` 再次调用 `startGame()`，不是下一张不同关卡。

## 9. Current Implemented Features

- `[IMPLEMENTED]` 单机移动、吞噬成长、NPC避让/互吞/重生、随机悬浮物。
- `[IMPLEMENTED]` 路径显影、吞噬蒙版显影、重复区域边缘补偿、最大体型+75%目标。
- `[IMPLEMENTED]` 荷叶穿行上下层、比荷叶大才能吃花；荷花始终最后绘制。
- 荷叶初始8、最多16，每叶最多3花；花生长间隔16–36秒，被吃后38秒恢复。较大叶或长时间未吃的花可消耗一朵花生成附近小叶。
- `[IMPLEMENTED]` 一秒加速变量与浓墨反馈、稍后生成后方悬浮墨点。
- `[IMPLEMENTED]` 暂停菜单、控制模式切换、结算保存PNG、原画/筆跡切换。
- `[IMPLEMENTED]` Album、逐次通关解锁与浏览器本地收集记录。
- `[TODO]` 作品介绍、游戏进度存档、完整设置页面、多画作关卡。
- `[CURRENT]` 没有音乐/音效系统；蒙版视频静音。
- `[CURRENT]` localStorage仅保存相册解锁记录；没有游戏进度存档、IndexedDB、登录或语言切换。
- `[CURRENT]` 用户可下载当前结算 Canvas，但这不是相册存档或解锁记录。

## 10. Start / Pause / HUD / Minimap

Start：`startGame()` 重置世界，随机选五个转场之一，进入 interlude。`drawTitleSnapshot()` 手工在 Canvas 重绘标题/菜单，黑色蒙版区域透明以露出下层游戏。不是 DOM 的真实截图；布局有机会跳变。视频结束或3秒计时到进入 play。未解码时整层淡出兜底。

标题仅墨字与スタート、アルバム、設定，保留 hover 下划线。原小字与玩法长说明已去除。

Pause：左上CSS双竖条按钮；一時停止面板含 PC、モバイル、ゲームに戻る、ホーム。`update()` 暂停，渲染继续。当前没有暂停时长补偿，恢复后计时会把暂停时间算进去。

HUD：大きさ、作画百分比与进度条、吸収、时间。墨量进度条已替换；死亡统计里仍有 `墨量` 字样。玩家墨点文字为 `ボク`。

小地图：`drawMinimap()` 仅 play 绘制，显示玩家/NPC点；PC92px，mobile68px。x靠右，y为PC66、mobile横屏48、竖屏72。设计目标是始终在右上HUD下方、不遮挡加速，但代码为固定坐标，没有测量HUD实际高度，不可宣称所有尺寸绝无重叠。

结算：成功为完成+画作及五按钮：保存、筆跡、作品詳細、次へ、ホーム。失败为Game Over+统计+もう一度/ホーム，**失败页面当前没有作品画布**。用户此前泛称“游戏结束展示画”，此处存在成功/失败差异，未来修改应明确处理。

## 11. QR Code Demo Logic

`[IMPLEMENTED][TEMP]` 2026-09-09 接入用户提供的 `二维码.jpg`，原样复制至 `outputs/assets/exhibition/qr-code.jpg`，不使用外部服务或占位图。

- 宽度大于820px且精细指针/支持hover：正常游戏在暂停按钮下方显示112px二维码，位置按按钮实际边界计算。
- 窄屏或触屏：正常游戏隐藏二维码；与手动PC/モバイル控制模式切换独立。
- 两端暂停：面板下居中显示180px二维码，矮屏148px，间距20px/14px；隐藏游戏小二维码。
- 极矮视口暂停容器允许纵向滚动。开始蒙版阶段不显示小二维码。
- 独立实现：`outputs/ui/boku-exhibition.js` / `.css`，通过DOM观察同步。删除HTML中这两个引用即可移除UI，随后可删除这两个文件与二维码资源。
- 用户原图已接入，现场物理扫码距离和二维码目标页面尚需真机确认。

## 12. Album / Gallery

`[IMPLEMENTED]` 2026-09-09 将Album提示替换为原生dialog相册，独立文件为 `outputs/ui/boku-gallery.js` / `.css`。

- 用户提供11张水墨画，原样保存在 `outputs/assets/gallery/`；图片自然比例、宽松间距、CSS Grid多列图片墙。Desktop四列，较窄桌面/平板三列，820px以下两列，440px以下一列。
- 第一张（水墨画13）默认解锁，每次成功通关按清单顺序再解锁一张；失败不解锁。稳定ID以来源编号命名。收集记录保存于 `localStorage` 的 `boku.album.unlocked.v1`，不可用时回退本次会话内存并提示。
- 已解锁图可打开原生dialog大图，完整等比显示；右侧预留空介绍容器，移动端在图下。支持关闭按钮、Escape与点击外部遮罩，原生焦点约束。
- 未解锁保留比例，明显模糊且降低透明度；桌面hover轻微放大并显示深色渐变毛玻璃与`未解放`，触屏常显状态。点击不打开大图。
- 作品名称暂用`作品 01`等目录编号，不编写归属或介绍。11张作品只加入相册，不替换游戏背景、不创建新关卡。
- 结算`detailBtn`仍为原有提示，不等同相册大图；未来作品介绍未填。

## 13. Assets and Content

已跟踪游戏素材：

- `outputs/assets/ink_reference_painting.png`：当前唯一接入的背景原画。
- `outputs/assets/lotus_leaf_opaque.png`、`lotus_flower_opaque.png`：当前荷叶/花图。
- `outputs/assets/lotus_leaf_cut.png`、`lotus_flower_cut.png`：保留抠图版本。
- `outputs/assets/shrimp_cut.png`、`loach_cut.png`：保留，目前虽然加载Image，当前游戏不生成其背景装饰。
- `outputs/assets/ink-mattes/drops/drop-01.mov` 到 `drop-05.mov`。
- `outputs/assets/ink-mattes/transitions/transition-v1-01.mov` 到03及 `transition-v2-01.mov` 到02，共五个转场。

源素材历史位置：`G:/（玖别的百宝箱/（叠加素材/Ink Matte (HD Set 1)/Drops/`、同级 `Transitions/Version 1/` 和 `Version 2/`。用户明确先各用途选五份，不遍历导入全库。本轮未重新读取G盘素材。

荷叶/花源图曾位于 `C:/Users/玖别/Desktop/ゼミ_game/`，需透明外围、保留花瓣白色、图像内容不半透明。使用现有成品前仍应按实际视觉检查，不以文件名证明alpha正确。历史 `VideoDemo1.1.mp4` 是笔触参照，不是网站素材依赖。

`[VERIFY_IN_REPO]` 原画作者、作品名、原始出处和素材授权清单尚未在已跟踪游戏文件中建立；未来作品详情不要臆造归属。PPT资料属于本地未跟踪内容，不能当作已经在GitHub可下载。

## 14. AI Usage Philosophy

作者负责主题、企划、规则、审美、实际试玩和最终修改判断；Codex辅助实现、调试、文档等。曾讨论外接 Stable Diffusion 将结算图精修，但当前没有服务地址、API、模型、后端或转换能力。

当前背景原画是静态素材，程序处理显影，不能向观众称作“实时AI生成整幅山水”。不要因为有 `drawGeneratedLandscape` 兜底函数就宣称有生成模型。

修改11说明明确删除第8页底部“AIに作品を任せるのではなく……”总结句；理念可解释为作者主导，但不要将该删除句重新当成当前PPT文案。修改12又把第8页上半部作者决策文字替换为截图，下半流程继续保留。

## 15. Current PPT Status

本节只保留最近两轮。证据是实际存在的修改说明及文件名；**本轮没有重渲染PPT/DOCX或逐页读取OOXML验证**，以下检查结论若来自原说明，应理解为历史检查记录。

### Recent Change 1：修改11

- 10页顺序、低饱和灰色风格；删除标题下解释性副标题。
- 第2页为`Demoの遊び方`，第3页取消年龄限制。
- 第8页原先上半为作者决定的主题/规则/视觉/测试，下半为`企画・設計 → Codexに指示 → 試作・検証 → 修正・反復`。
- 删除底部AI总结句，口播强化作者企划、判断、试玩与修改决策。
- 新增30组逐页问答及7项重点速查；该轮旧六项问答结构被下一轮替换。

### Recent Change 2：修改12

- 第8页上半替换为3张实际制作截图，同高横排、前两张宽，GitHub辅助图窄；据修改说明等比例完整显示。
- 上半原`自分で考え、決めること`及四项删除；下半流程不变，其他页据历史哈希检查保持不变。
- 口播独立“墨”读作`ぼく / Boku`，不要改坏`水墨画（すいぼくが）`的正常读音。
- 修改说明记录：问答实际保留四项——中文问题、注音日语问题、中文回答、注音日语回答；30题和7项速查保留。
- `[TODO][VERIFY_IN_REPO]` 本次要求附件希望“回答只留注音日语”，与修改12说明仍保留中文回答不一致。本轮只记录差异，不修改口播稿，也不宣称已按附件精简。
- 历史说明称正文增至12pt、问答11.5pt；DOCX未完成逐页渲染，需要Word人工检查分页。

### Current Version

- `outputs/墨_BOKU_修改12/墨_BOKU_毕业制作中期发表_灰调高级版_修改12.pptx`
- `outputs/墨_BOKU_修改12/墨_BOKU_口播稿_QA精简版_注音中日对照_修改12.docx`
- `outputs/墨_BOKU_修改12/墨_BOKU_修改说明12.md`
- `outputs/墨_BOKU_修改12/media/Demo映像8.mp4`
- 修改12目录中保留修改11的PPT/DOCX备份；修改11自身目录也存在。

以上目前均未跟踪。保留相对媒体目录，不能仅搬走PPT而忽略链接视频。不要在没有新的文件证据时称存在修改13。

## 16. GitHub Workflow

origin为 `https://github.com/a29k055-arch/html-inkgame.git`，开发分支main。GitHub Education是资格/权益，不是另一个保存版本的位置；代码保存到仓库。

通常流程：读当前代码及未提交内容 → 聚焦修改 → 验证 → CHANGELOG → diff → 仅暂存本轮文件 → commit → push origin main。保留各版本和用户资料。凭证由现有认证设施管理，不在本文保存密码、token、cookie或密钥。

`.github/workflows/deploy-pages.yml` 在main push或手动触发时部署仓库根目录；使用checkout@v6、configure-pages@v5、upload-pages-artifact@v4、deploy-pages@v4。配置了pages/id-token写权限和github-pages环境。

历史上出现Pages未启用导致configure-pages找不到站点，之后用户截图显示成功。Actions成功与网站所有功能正确是两件事，发布后还应检查实际URL、相对资源与游戏操作。不要因旧失败截图反复改当前配置。

首次交接轮只新增本文件，未提交。后续2026-09-09功能轮已获用户授权提交并推送当前main；仅纳入相关代码、指定素材及文档，保留所有本地PPT资料。

## 17. CHANGELOG Workflow

实际路径：根目录 `CHANGELOG.md`。格式为倒序日期+英文主题，下面`Added`/`Changed`等分组。文件名v2是可玩版本命名；没有规范的SemVer发布/tag制度。

最新条目：`2026-09-09 - Exhibition QR Access and Artwork Album`；此前最新为小地图与移动加速修复。

二维码、相册改版、大图预览、介绍预留区、locked blur/hover及响应式改进已于2026-09-09实现并写入CHANGELOG。

旧条目是历史而不是现行规格，例如80%通关、禁NPC互吞和标题淡出均已被后续条目替代。

## 18. Important Design Decisions

- 整张地图是一幅画，而不是随玩家半径不断生成互不关联的装饰。
- 成长服务作画目标，避免单机缺少目的性；目前最大体型+75%为可调试验平衡。
- 原画保持比例，允许裁切；干净原画默认展示，筆跡作为可切换过程展示。
- 荷花奖励与背景装饰要可区分，当前不额外生成装饰荷花。
- 拖尾以可见距离与变淡共同设计，不靠慢速时无限延长黑墨寿命。
- 移动端不只缩放桌面，须验证方向+加速并行、HUD留白与原比例。
- UI日语用常用游戏表达；标题墨字与玩家ボク的区别保留。
- Gallery未来介绍不能编造，展示QR保持可移除。

## 19. Cancelled / Do-Not-Reintroduce Items

不主动恢复：等级/Roguelite选项、NPC特殊角色素材、接触即死/严格完全覆盖、旧倒计时、80%目标、移动端固定中间摇杆、先淡出菜单文字、鱼虾装饰作为当前背景、吞噬黑点结算图、AI图生图按钮的旧含义。

不主动恢复PPT：年龄限制、已删除副标题、旧第8页上半四项文字、底部AI总结句、问答重复纯日语与独立注音双份结构。保留历史记录不等于恢复内容。

## 20. Recently Completed Work

2026-09-09：接入用户二维码与11张水墨画，新增独立相册和展示UI、收集记录、响应式布局；见CHANGELOG同日条目。以下为此前游戏核心提交。

| Commit | 内容 |
| --- | --- |
| `dd4661c` | Fix minimap placement and mobile boost touch |
| `5b5938a` | Refine mobile HUD and joystick controls |
| `46da416` | Add pause controls and mobile joystick tuning |
| `937e80b` | Tune reveal compensation and ending artwork view |
| `eddabe6` | Tune growth balance and ending details |
| `8bb5283` | Tune HUD progress and NPC density |
| `29a3f44` | Tune Japanese UI and matte behavior |
| `d72d85b` | Add ink matte transition and drop reveals |
| `609a46c` | Add GitHub Pages deployment workflow |

这些是已核对的历史提交。首次交接轮没有运行游戏回归测试，因为当时交付仅为文档；没有录制视频。既有本地冒烟脚本只检查启动、Shift加速与基础计数，不能作为手机双指、完整通关、MOV逐帧成功或性能达标的证据。

## 21. Current TODO / Next Steps

这些是供下一轮按用户指令选择的工作，不是本轮待执行任务：

1. `[IMPLEMENTED][TEMP]` 展示二维码已接入用户图片；后续可按展览需要移除。
2. `[IMPLEMENTED]` Gallery、逐次通关解锁、放大预览、介绍空区、锁定态和响应式布局；正式介绍内容待用户提供。
3. `[VERIFY_IN_REPO]` 真机双指摇杆+加速、小地图布局、Canvas比例与旋转。
4. `[VERIFY_IN_REPO]` 长局/大体型性能、NPC擦回和暂停计时。
5. `[TODO]` 核实实际MOV解码/蒙版比例和过渡终止时机。
6. `[TODO]` 作品清单、来源/介绍、多关卡、音乐音效与存档按后续范围逐步完成。
7. `[VERIFY_IN_REPO]` PPT口播问答与新附件要求的差异、Word分页；等待明确PPT任务再修改。
8. `[IMPLEMENTED]` README入口、结算按钮及本轮相册/二维码文件说明已更新。

## 22. Known Bugs / Risks / Technical Debt

本节为源码阅读发现/推断，不冒充本轮运行复现：

| 项目 | 证据与影响 |
| --- | --- |
| 暂停计时 | `roundStart`未补偿，恢复后显示包含暂停时长 |
| 大NPC擦回 | `obscureNpcTrail`要求单帧移动≥4；常见60fps NPC步长低于4，可能大部分帧不擦回 |
| 小地图布局 | y固定值，CSS按屏宽而地图按controlMode分支，某些组合可能相互遮挡 |
| 多指归属 | `startJoystick`没有已激活pointer保护，第二个非按钮触点可能抢摇杆 |
| 加速双入口 | pointerdown和onclick都存在，冷却通常拦住重复，但应验证长按与释放 |
| 输入边缘 | 相反方向键抵消时key.active为false，PC会回落鼠标；与“按键期间屏蔽鼠标”不完全一致 |
| 玩家停留时墨迹 | `b.life`主要按移动距离衰减；停止后距离不变，墨迹可能停留且继续增长 |
| 高帧率差异 | 多处固定lerp、逐帧显影和随机生成并未全部dt归一化 |
| 性能 | 多粒子绘制、全画布getImageData、视频逐帧读取仍有开销，未建立性能基准 |
| 覆盖率 | 每0.8秒抽样10px且alpha>.08即计入；不等于75%区域完全清晰 |
| 边缘面积 | 九点判断与周长近似，厚度clamp8–72，再加模糊；非严格像素守恒；局部drop仍照常显示 |
| 蒙版可靠性 | MOV解码依赖设备；file://读像素可能失败；有fallback不表示原蒙版实际播放 |
| 转场 | 手绘标题快照；3秒强制进入可能截断视频，不是等全黑才结束 |
| Drop比例 | aspect被clamp到1.18–1.58，再等比cover裁切，不是任意源视频完整原幅 |
| 结算筆跡比例 | `drawEndingTraceArt`把方形paintingCanvas绘到16:9区域，存在非等比拉伸；原画视图走cover |
| 失败展示 | dead没有画作；只有成功ending展示作品 |
| 作品详情 | 当前可点击toast，与“暂不可点”的原意有差异 |
| 历史残留 | 两个同名`drawWorld`，后声明覆盖前者；旧艺术函数/变量仍在，清理须单独评估 |
| 文案/元信息 | 隐藏interlude文字存在乱码；html lang仍zh-CN，浏览器title仍旧Demo名 |

未来改动应针对用户当轮范围，先建立可复现检查再修复，不因本次交接擅自全面重构。

## 23. Git Checkpoint

本次功能更新基于下列dd4661c检查点，功能提交消息为 `feat: improve gallery and add demo QR access`；提交范围仅为v2入口改动、新UI、指定素材、README、CHANGELOG与本交接文件。具体功能提交SHA以最新Git log为准（避免自引用）。既有未跟踪PPT/DOCX等不纳入。下面是功能更新前的历史检查点。

- 核实时间：2026-09-09。
- Repository：`a29k055-arch/html-inkgame`。
- Remote：`origin https://github.com/a29k055-arch/html-inkgame.git`。
- Branch：`main`，跟踪`origin/main`。
- 本轮开始HEAD：`dd4661c28d087cc45c529eed0636c04a9a3b370e`。
- GitHub公开API `repos/a29k055-arch/html-inkgame/commits/main` 返回同一SHA，远端main与本地HEAD一致。
- 已跟踪文件本轮开始无改动；**工作区整体不干净**：有大量未跟踪PPT、DOCX、说明、inspect输出及`outputs/assets/ppt02/`等。
- 本次新增 `PROJECT_HANDOFF.md`，未提交/未推送；HEAD不变。没有修改游戏、既有CHANGELOG或用户资料。
- 本轮普通Git的HTTPS helper不可用；改用公开GitHub REST只读核对成功。此为当前工具环境问题，不擅自改remote。
- 下次以 `git -c core.quotepath=false status --short --branch` 查看中文文件名；不要将所有未跟踪资料加入一次提交。

## 24. Files New Codex Should Read First

1. `PROJECT_HANDOFF.md`。
2. `CHANGELOG.md`。
3. `index.html`。
4. `outputs/ink_demo_v2.html`，按本文函数索引读取任务相关部分。
5. `.github/workflows/deploy-pages.yml` 和 `.gitignore`。
6. `README.md`，注意已记录的陈旧说明。
7. PPT任务再读 `outputs/墨_BOKU_修改12/墨_BOKU_修改说明12.md`、修改11说明及实际PPT/DOCX，不只靠本文。
8. 测试任务可检查 `work/check_demo_v2.js` 是否仍在；它不在GitHub仓库中。

## 25. Update Log for This Handoff File

### 2026-09-09 — Exhibition and Album implementation

按用户本轮明确授权实现二维码与相册，并接入后续提供的11张图和二维码原件。同步更新当前功能、TODO、QR/Gallery章节、README和CHANGELOG。已用本地HTTP + Playwright/Edge检查1440×900、1024×768、768×1024、390×844、844×390、320×568、568×320：Start、Pause/Resume、小二维码显示策略、暂停二维码可访问、Album返回、锁定点击、预览关闭/Escape、无横向溢出、成功解锁和刷新持久化。补查触摸滑动、旋转、失败不解锁、重复finish不重复奖励、遮罩关闭、存储被禁时内存回退；无pageerror或资源HTTP错误。胜利/失败分支使用受控状态触发，未完整手玩通关，未做iOS/Android真机验证、现场扫码或录像。另做矮屏结算页局部滚动修复，确保返回按钮可访问。

### 2026-09-09

首次建立交接文件。核实本地目录、源码、分支、remote、HEAD、最近提交、CHANGELOG及GitHub远端SHA；保留设计演变和取消方向；将QR/Gallery明确标为待实现；记录最新两轮PPT说明及问答要求差异；登记未跟踪资料与源码风险。仅新增本文件。

后续每轮较大改动请更新对应章节及Git checkpoint，不只在此堆叠历史。新对话可直接说：“请完整阅读PROJECT_HANDOFF.md，按第0节核对当前仓库，然后处理我本轮的需求。”
