# Changelog

## 2026-10-27 — 历史水墨参考隔离 / 折返轨迹 / 连续卷轴 [CURRENT]

基线 main/origin/main=ccddc4b，开始工作区干净；检查点 checkpoint/visual-reference-before-ccddc4b。只修改视觉/布局/测试，没有变更吞噬、成长、AI、阵营、Boss数值、选牌、道具、碎片或saveVersion2。

- **历史调查**：2d00e16 的旧交接明确恢复 f8d3e2c 的材质与流体表现。正式 MaterialInk 本来已与该版本一致，差异主要是7cc245d改过的material力场和271ad54改成窄范围×18衰减的contain。恢复原material力场（carry5.5、spring12、swirl1.8），contain改柔和×6局部限制，主体增加由2.15→1.35倍逻辑半径的平滑显示限制，避免大体型旁侧黑晕；不改真实碰撞体。此为有来源的恢复候选，**不能凭Git记录声称已确认用户最满意的唯一版本**。
- **可信参考**：visual-effects/ 默认恢复到 reference-2d00e16/ 原始七JS+CSS；另外保留紧接轨迹重构前的reference-bde0c40/，以及reference-ccddc4b/ 修改前八JS+CSS。manifest记录逐字节SHA256，模型测试校验。三归档和默认入口不再被update-release-imports重写。旧player/paper/fish仍可查看；prototypes/ink为可变开发页。lab.html可对比早期原版/重构前/修改前/修复候选，小中大、直线/直角/返回/停止；实验参数lab-config.js独立，游戏参数hero-visual-config.js独立。详见visual-effects/REFERENCE.md。
- **真实拖尾**：HeroWorldTrail按累计路程等距采样，急转提交拐点，逐段圆帽/软边绘制，不使用跨折返的整体法线或首尾线性渐变。旧点世界位置与出生半径固定；折返不外推新尾。8秒/1250路程/256点上限，400内不增加长度淡出，之外逐渐淡出；最短显示偏好不外推实际路径。宽度min(29,18×.58×(出生半径/18)^.38)，收细1.45、时间淡出1.4、扩散.7。世界纹理+两条细墨丝，总透明度.48限制反复重叠黑带。最多768²复用缓冲；普通墨弹仍用原共享轻量历史模块，不复制每弹求解器。
- **卷轴根因**：加载scroll-cover与首页伪元素轴杆是两套系统，旧加载隐藏时直接交替。右轴杆还复用原B O K U的#home:after，继承margin-top:22px导致右上缺块。现仅homeScroll一套持久DOM，展开中的同一对轴杆最后停在两边，不卸载换层；删除原伪轴杆和旧scroll-cover。七项实际准备节点仍驱动展开，失败可重试。四角在四视口与DPR1/1.5/2/3检查覆盖。
- **加载/标题**：去掉重复墨字和加载卡片，文字/细进度放设置按钮下18px（视口底部安全clamp），低于卷面。唯一标题图等图片实际解码后平滑显影，0→浓黑单调递增，节点不重新创建；加载说明330ms淡出，轴杆保留。慢图像网络门控、节点身份/透明度采样、失败重试通过。
- **界面**：原生细宣纸灰轨道/墨色滑块统一，hover/active克制，保留触控与键盘。Gallery/详情改header+独立滚动content+不参与滚动的footer，去左上重复返回；底部唯一主页主按钮常驻，详情另有小型作品列表导航。底栏占实际布局空间，含手机安全区，不遮末行。
- **阶段验证**：14套模型通过，新增归档哈希、三体型折返/拐角/停止/有限路程与单卷轴检查。四视口首页/画廊底栏与三语，四手机横竖双触控/瞄准/暂停，实际WASD/鼠标/Shift均通过。PC与390触控三Boss真实弹杀、扣墨、3唯一碎片、5次全遮盖、鼠标/触摸修复和刷新解锁通过（加速门槛+保护+自动采墨夹具，非无保护人工难度认证）。本机1440×900实际移动高画质32/80NPC约60FPS；移动中的80NPC+约100Boss弹极端场景53–60FPS，12FBO，24帧共享弹体图集/零逐弹求解器，JS heap短测峰值约19MB（非GPU内存或真机认证）。PC三Boss49.6/97.9/73.5秒，触控41.9/61.8/80.6秒。
- **测试工具收尾**：实验室重复定位复用同一GPU上下文并清空流体/历史状态，不再每次重建造成上下文额度压力；版本/尺寸变化才释放并创建。最终小大四路线、冻结player/paper、单卷轴/单标题单调显影、加载位置/失败重试再次通过。
- **停止后再移动边界**：发现历史点完全过期后空缓冲未重新起笔，已修复为从新位置开始；亚像素静止抖动不再累计虚假路程。新增模型和实际游戏停10秒后WASD再移动通过，不连回过期墨迹。该收尾仅改轨迹缓冲逻辑，不再改美术参数。
- **候选补全**：另存紧接271ad54世界轨迹重构前的bde0c40，避免只拿较早2d00e16作唯一参照；实验室增加对应选项，正式游戏材质和参数未再调整。停止重起笔补丁462e971的Pages与线上停10秒/WASD实测已通过。
- **下一步/TODO**：阶段检查点349e491已保存；本地性能与完整回归完成，代码提交dc88676已正常推送main，Pages工作流40456669451成功。线上桌面/390触控游戏、Gallery底栏、阶段/碎片/刷新保存通过；player/paper冻结参考的公开JS与CSS实测SHA256与清单完全一致，原有三版本切换与大体型折返通过，无pageerror。线上Boss降至1血验证结算，本地完整循环保留正式血量；最终文档收尾SHA以Git为准。实体手机/Safari和用户对历史候选的美术接受度仍不能由自动化代替。不继续无依据改动冻结参考。work证据不提交。


## 2026-10-27 — 世界轨迹拖尾 / 研磨与激战 / 全屏卷轴 [PREVIOUS]

基线已发布 main bde0c40；可恢复分支 checkpoint/world-trails-before-bde0c40。上轮必做功能已核对完成，继续保留真机与无保护人工调平 TODO；本轮没有重建工程或变更 saveVersion2。维护副本 D:/ink_game_codex/html-inkgame-main，正式 Git C:/Users/Nine/Documents/GitHub/html-inkgame。

- **真实轨迹**：新增共享 WorldInkTrail。玩家固定世界坐标采样，最长4.8秒/192点/1300世界单位；旧点位置及出生半径不随转向、体型或摄像机重写。连续可变宽带、渐细/淡出、程序墨色纹理，单张复用512²上限离屏软化；Hero原流体仅负责局部主体，移除假后向补墨/旋转长尾。18/90/170半径实际直角转弯与镜头变化通过。停止自然消散，切图/重生清空，不跨地图串线。正式游戏和两处visual-effects/prototypes共享同一源码。
- **墨弹**：共享Hero密度图集只画动态墨头，ProjectileTrails记录实际世界轨迹，.52秒/26点/380长度上限；最多240条记录。池对象trailId区分新弹，反弹变色分段、旧迹淡出；命中仍走Drops。玩家黑墨，Boss及敌方普通墨弹朱砂红。刺弹不走轨迹，改5.2r长/.42r半宽的细针锥刺，缓存12×2，不逐弹模拟流体。
- **阶段/阵营**：phases.js统一判定。研磨阶段完全关闭远程更新及发射入口，保留七AI争食追逃互吞、核心/尖刺。激战阶段NPC与Boss同为enemy，只锁player；敌方之间不能互吞或受友方尖刺/墨弹伤害。玩家与敌人实体吞噬/尖刺保留。AI感知范围外搜索，范围内追近/侧移、进入射程才发射。普通NPC射程460能力微调、感知按600与能力配置；NPC弹伤害clamp(3+.20×发射圆核半径,5,38)，尺寸平方根放大且封顶16。Boss射程980，墨弹伤害min(90,(14+.20×核心半径)×阶段倍率)。刺弹仍按接触覆盖扣墨，玩家既有攻击/耗墨不变。attackDebug记录目标、范围、状态、归属和伤害。
- **状态边界**：新局主动两槽均空、待选0、无赠卡；正常奖励取得道具。进入/返回、Boss胜败和结束清弹/锁敌/冷却，胜利时不再冻结活弹在结算背后。返回原normal对象、AI/食物/普通计时保持，带回实际墨量、卡牌和道具；第三次完成后拒绝无效返场。
- **结算/暂停**：Boss结算只有继续/结算本局两操作，最终继续变完成本局。仅显示本次新获碎片，原图比例+真实fragmentPath裁切、透明无框无序号，简洁n/3。所有对局结算移除Gallery快捷入口。暂停为居中大继续、等宽设定/教学、间距后的次要结束；结束二次确认，横屏也可用辅助瞄准开关。
- **教学/UI**：统一研磨阶段/激战阶段（研磨フェーズ/決戦フェーズ；Grinding Phase/Clash Phase），墨量与等级、敌人、主动道具、属性强化、画卷与碎片七个单栏折叠段，阈值/时间/1200选牌取配置，删除AI技术说明。设置移除重复教学，保留首页问号/暂停/F1。小地图右上108/手机76并避开HUD/安全区，缩圈正方形裁切不变。磁力速度270→480、加速度5→10、阻尼5→2.2，仍平滑弧线且走原拾取链。
- **全屏卷轴/加载**：原创CSS/SVG宣纸流云与轴杆铺满窗口两侧，无新外部素材。LoadingScroll用七项实际资源准备节点加权(mattes2/painting2/skins1/shots2/gallery1/background2/title1)，进度驱动两半卷面展开；资源未完成不报100%，最短850ms完整演出。30秒超时与失败重试；入口模块下载失败也有三语重试，不会卡死。问号Arial非衬线。原动态画作设置保留。
- **已验证**：13套模型与阶段专项；三种子600秒研磨生态105/79/73次互吞，重生106/79/73。激战20秒重叠友军模型无互吞/友伤且实际锁人射击。四视口首页/教学/暂停/右上小地图；四手机横竖屏双指移动+独立瞄准、暂停、设定三语通过。真实资源延迟/图像失败/模块失败与重试，两处视觉测试8模块加载成功。1440×900高画质短测32/80NPC约60FPS，80NPC+100Boss弹压力初测约58–60FPS；尾迹细化后极端压力曾出现43–44FPS，复用渐变并在桌面>120/手机>80条残迹时将软边8层降为4层（路径/寿命不变），最终相同80NPC+约100Boss弹压力四次采样均60.0FPS；无逐弹求解器，仍12FBO。桌面与390触控完整三Boss均由真实墨弹击败：PC42.0/47.7/86.1秒，触控39.7/108.2/94.8秒；全12名敌人保留，选牌、真实扣墨、3唯一碎片、5次全遮盖（进入3/返回2）、鼠标/触摸修复、刷新解锁均通过。使用门槛加速、保护与自动采墨夹具，不是无保护人工难度认证。一次只采最近墨点的触控测试曾在第三Boss超时，改为贴近Boss的采墨测试路线后通过；未降低正式血量或增加时限。
- **边界修补**：回收反弹锥刺后重置kind/team/owner/tint/echo等字段，普通新弹不会继承刺形/敌方颜色；新增池复用断言。墨弹历史按trailId与反弹颜色分段。视觉测试切换鱼/墨或改变测试画布尺寸清理像素轨迹；正式游戏窗口变化仍保留世界轨迹。桌面实际WASD/鼠标手动瞄准/Shift空槽及依次消耗均通过。
- **后续第一步/TODO**：功能检查点271ad54已保存；完整流程已通过，发布键world-trails-20261027-final覆盖52主模块/8测试模块。代码发布提交4cd50f0已正常推送main；Pages工作流40403436346成功。公开桌面/390触控回归各观测12次NPC实际射击、仅锁human、朱砂归属正确；真实弹击败低血量Boss后仅两按钮、透明不规则碎片、返回研磨/暂停确认结算/刷新碎片保存通过，两入口8模块同源实际加载通过，无pageerror。线上Boss仅将血量降至1验证结算，不冒充线上完整难度测试；本地三Boss保留正式血量。文档收尾SHA以Git为准。实体手机/Safari与无保护人类整局难度仍不能用模拟器代替；当前不得声称真机或人工平衡验收完成。work截图/性能证据均不提交。


## 2026-10-26 — 卷轴首页 / 一次性道具 / 教学与远程攻击 [CURRENT]

基线为已发布main 3607fd9，检查点分支 checkpoint/items-tutorial-before-3607fd9。审计上轮必做项均已完成：奖励队列、Boss冻结选牌、三语、磁力与完整循环不是半成品；真机/无保护人工调平仍属验收TODO，可选新怪物未加入。本轮不重建项目，原世界、七性格AI、圆核吞噬、墨库、三阶段、碎片和saveVersion2保留。

- **主动道具改制**：从TALENTS永久升级表移除dash/veil。itemsHeld为容量2的前后队列，开局急墨+墨化各一件；选择卡可以获得急墨/墨化/集墨/反弹，类别为一次性道具，不显示LV也不写talents。库存满时不提供新道具卡；稳定offer/serial防重领，意外满库存拒领不扣机会。Shift或右下大栏使用前件即消耗、备用顶上，效果期间禁用下一件，没有冷却自动再生。死亡中断持续效果，剩余道具和属性/待选跨死亡及Boss切图保留；不保存未结算局断点。
- **道具值**：急墨3秒移速+30%；墨化3秒免攻击/吞噬/尖刺/清水，同时不能射击吞噬、回收在途玩家弹；集墨5秒体外额外220范围平滑牵引；反弹3秒将敌墨弹/锥刺反射，Boss反弹转为玩家墨阶伤害的80%，有96玩家弹/64NPC弹/100Boss弹上限。即时补给clarity改100墨+至少1盾，已无冷却重置。
- **永久值**：移速/射速/伤害3/6/9%，磁力范围5/10/15%，减耗3/6/9%，Boss拾取5/10/15%，墨障仍1/2/3。普通实际累计1200墨或黄色点给一次三选一；Boss收益/胜利奖励不算选牌，保留待选回普通地后恢复。ACTIVE_CONFIG/ITEM_CONFIG/TALENT_CONFIG集中管理。
- **UI导航**：首页云纹加深，原创CSS宣纸卷面+左右轴头/卷边，保留三入口和动态画作设置。问号在右上；Gallery列表/详情返回在左上，回主页在底部大按钮，设封面挪详情右上次级。结算回主页在下方更大。暂停继续最大，设置增大、另有教学。磁铁/鞋与速度线/反弹盾等SVG原创重绘。
- **教学/参数**：首页/暂停/设置/F1键均可进七个折叠教学卡（普通地、墨库、奖励、道具、眼球刺球、Boss、画卷）。三语字典集中、规则引用配置值；打开/关闭重置摇杆防粘连。hudDensity=simple/detailed本机保存，简洁显示墨库/墨阶条/阶段状态；详细显示阈值、选牌累计、Boss数值/弹体参数和排名/结算倍率。修复旧!important隐藏样式覆盖详细模式，手机让开小地图。
- **普通敌人远程**：仅当前reserveGrowth模式接RangedCombat，旧独立HTML机制不改。眼球墨弹、刺球锥刺，射程460按AI能力微调、最小65；已有追击/威胁目标优先，再选邻近对象，玩家与AI均可被选，不全图乱射。蓄力.65秒、间隔4.4秒加性格/随机差异。伤害 min(35,2+目标墨资源×.007)×接触覆盖；人类最低保10、NPC最低64质量，非致命，真正吞噬仍走圆核。统一盾/墨化/反弹；不生成任何Hero流场。RANGED_CONFIG集中，64弹池+3.4秒寿命，AABB与扫掠过滤控制开销。
- **Boss**：HP2700/4300/6200；原扇射/旋转缺口环射与回波保留，第三式锥刺2/3/4路，基速245/270/295再乘阶段1/1.06/1.12，半宽1.1r、长3.6r。三角-圆接触用21点覆盖估计并扫掠防穿透：damage=min(190,18+当前墨×.028)×coverage，擦边至少.08，单弹命中移除，.45秒受击保护，非逐帧重复瞬伤。外圈接触尖刺与圆核吞噬仍独立旧规则。短冲为.8秒蓄势→.65秒锁向冲刺→.85秒调整，速度195/225/250、周期6/5.5/5秒；蓄势/冲刺冻结新射击蓄力，避免同时不可读叠招。目光与收束瞳孔提示危险，不恢复科技直线。SPIKE_SHOT_CONFIG/BOSS_MOTION_CONFIG集中。
- **水墨**：共享MaterialInk/InkFluid减弱身后密度回拉，尾迹渐收细、稀疏三点补墨，大体型仍有后向墨丝，静止回浓墨球；未引入NPC物理。正式游戏与visual-effects/prototypes同源且发布importmap同步。双方墨弹延长渐细尾，锥刺用浓淡锥面/湿边/共享Hero纹理；首次性能检查发现逐弹柔边开销，已改12帧×敌我共享锥刺缓存预热，不逐弹跑流体。
- **本轮自检**：12套模型逐套通过（新增scroll-items-ranged，旧ui-ecosystem按新道具规则调整）。涵盖库存/晋位/满格/消耗/跨图、反弹、面积擦边/中心/扫掠/上限、有限射程实际发射、Boss蓄势/短冲/调整、老三Boss/旧存档/Gallery/三语/镜头/死亡。四视口1440/390/320/844教学/导航/道具/详细信息通过，四手机横竖屏双指/瞄准/暂停通过。修正首页容器pointer-events及界面切换RAF旧时间戳的负dt，不让空道具被误判使用中。
- **完整循环/视觉**：Edge桌面和390触控模拟普通实际入账/选牌、三次真实弹杀、扣墨、唯一三片、6次全遮盖、鼠标/触摸修复、刷新解锁通过。PC约26.3/39.0/50.8秒、触控25.6/37.7/50.6秒；使用加速门槛、保护和自动采集夹具，不是无保护人类平均。18/90/170半径移动/静止与弹体放大样本已查看；0/80NPC玩家GPU像素hash同为2172241024、55 material调用、12FBO。新远程加入后三个种子600秒仍53–66次NPC互吞，最小8–10.9、中位26.5–36.7、最大169–170，生态未被射击替代。
- **线上集成修补**：部署回归抓到Boss发射选择仍残留旧两招分支（此前直接锥刺几何/发射单元测试未覆盖自动排程）；已统一为fan/ring/spike三招，新增36秒真实Campaign时钟断言三种实际发射，旧速度上限测试按锥刺新速度分别校验。
- **状态边界收尾**：墨化同时回收Boss玩家弹和普通地图自己反弹出的在途弹，不能靠旧弹在免疫中攻击；敌人死亡清除远程蓄力WeakMap，重生不继承旧锁敌蓄力。新增边界模型通过。线上桌面/触控均观察到实际ink/spike发射、四个追击阶段、NPC实际25–26次发射、真实弹杀与碎片刷新保存。
- **性能/入口收尾**：共享锥刺缓存后1440×900高画质32NPC约59–60FPS，80NPC样本51–60（一次波动），80NPC+95–100Boss弹+玩家弹压力样本约60FPS；普通NPC独立弹池实际采到5–43枚，三池有界，JS heap约4–8MiB短测，不等于GPU内存或长时认证。无逐弹流体，玩家12FBO；visual-effects与prototypes两入口7模块同一发布键并实际加载成功；F1教学不消耗道具，详细模式刷新保留通过。
- **发布/下一步**：功能检查点7cc245d已保存；最终通过main→Pages工作流发布，最终SHA/部署状态以Git/Actions及本轮答复为准。work证据不入库。没有补做实体手机或无保护人工整局：当前无真机执行条件，这两项明确保留TODO，后续第一步优先Safari/Android真机与人工Boss难度，不重做已完成机制。可选新怪物仍未加入，非本轮必要功能。


## 2026-10-26 — 云纹 UI / 奖励队列 / 主动道具 [PREVIOUS]

基线 main 84ce474；可恢复分支 checkpoint/ui-ecosystem-before-84ce474。维护副本 D:/ink_game_codex/html-inkgame-main，正式 Git C:/Users/Nine/Documents/GitHub/html-inkgame。没有改引擎、没有重写 AI/世界/存档。本节覆盖历史与本节冲突的旧技能和 Boss 选牌说明。

- 首页默认浅宣纸原创 SVG 流云；三个入口不变。设置 homeVisual=paper/painting 保留动态原画互动和画作池。Gallery 设置为封面时显式切到 painting；启动恢复已选原画不会强制切回动态。
- 奖励分 attribute(轻行/连墨/墨弹精进/聚墨/惜墨)、passive(墨障/墨涌)、active(急墨/墨化)。左下原创 SVG 图标+局部详情浮层，右下主动道具含 LV、冷却/持续时间，Shift急墨、E墨化，手机可触控且避让双摇杆。两主动初始LV1，卡牌强化到LV3。
- TALENT_CONFIG：移速/射速/伤害每级5%，LV3为15%；吸附基准140体型外距离，范围+10/20/30%，平滑牵引速度270/加速5；耗墨减免4/8/12%；墨障1/2/3层；Boss拾取增益10/20/30%。ACTIVE_CONFIG：急墨2.5/3/3.5秒、速度25/30/35%、冷却14/13/12秒；墨化2/2.5/3秒、冷却24/22/20秒。冷却从施放开始计，暂停冻结，死亡清除持续效果但保留冷却和本局构筑。
- 墨化免受攻击与吞噬、清水/尖刺流失；同时禁止吞噬、射击、旧泼墨攻击，并回收已发出的玩家墨弹，不能用旧弹偷伤。期间允许拾取公共墨点，不改变圆核判定和 AI。
- growth.collected 仍统计所有实际入账；growth.choiceInk 只统计普通地图可选牌收益。每1200发一令牌；黄色墨点只 grantChoice，不再直接送技能。choices.pending/earnedMilestones/bonus/claimed/offer/serial 独立收据。暂缓不扣次数，成功选牌才扣一次；连续奖励排队，稳定offer防换语言重抽/连点重复领取。Boss补墨、吞噬和胜利奖励均不计选牌进度；Boss不生成黄色点、不允许打开选牌；已存次数跨切图/死亡保留，返回普通地图恢复。
- 磁力改为 food 在感应内平滑朝玩家运动，原对象/原拾取链处理 AI 争夺、Drops和移除，世界边界clamp，非瞬时远程入账。
- 全局宣纸/细墨边/流云统一；减少重复体型、墨阶说明和常驻提示，设置折叠帮助，新手提示仅初次。卡牌准确分属性/被动/主动、新能力/升级，统一三语/精确数值与前后比较。旧玩家一次性技能槽退出当前模式，NPC旧道具保留成熟逻辑。
- 墨弹改为直接复用当前 Hero Ink MaterialInk + InkFluid 实际密度/速度，启动预热一次24帧×敌我2色。小型专用光学shader按真实密度对数显影，保留柔边/流动尾迹，单弹只画共享缓存和插值，不建求解器；原玩家与visual-effects源码不改。旧NPC fluid atlas保留归档但不再为已不用它的NPC启动烘焙。
- Boss不再画跨地图直线/虚线预警，以眼睛锁角和局部墨色蓄力。保留半径/移速自适应反应时间；扇射3/4/5路，环射12/16/20，后两阶段错位回波延迟.48秒、速度.86；阶段弹速×1/1.06/1.12，攻击间隔2.3/2.1/1.95秒，100敌弹池上限，环形缺口保留。
- 生态审计：原追逃互吞已存在，镜头内NPC吞噬新增Drops可见反馈，不复制AI。2401/6127/9913固定种子各600秒、32AI、玩家保护不参与吞噬，分别85/83/80次NPC互吞、85/83/78次重生；最终最小半径8–8.2、中位40.3/45.6/56、最大170，七性格未变。无必要用随机击杀伪造生态。新怪物暂不加入，优先完成已知两种剪影和核心体验。
- 验证：原9套模型+ui-ecosystem+ecosystem-long共11套；实际黄色点/待选收据/Boss不记进度、主动冷却与墨化禁止攻击、磁力渐进移动/AI只拾一次/死亡保留令牌均通过。四视口1440/390/320/844×三语布局、局部浮层、Shift/E和触控、Boss冻结8.5秒且返回恢复、背景切换刷新通过。修复手机“稍后选择”被粘性标题遮挡；摇杆中心改按实际CSS尺寸计算。普通地图、Gallery各0–3片状态、旧存档、30%逻辑重生、阶段触发与双指/瞄准/暂停回归保留。
- 完整浏览器循环：Edge桌面1440×900与390×844触控模拟，普通地图实际入账并真实选一张卡，三次墨弹击杀、真实扣墨、三片唯一碎片、6次全遮盖转场、鼠标/手指修复、刷新后解锁均通过。PC战斗23.4/34.5/45.6秒、触控22.8/32.2/43.7秒。夹具加速阶段门槛、初始普通收益、固定保护并自动采集，不能当人工无保护实战平均；另有真实敌弹致死、护盾与重生测试。
- 性能：1440×900高画质独立短测32/80NPC、80NPC+94–100敌弹+20–24玩家弹约56–57FPS；各场景玩家FBO12，24帧图集单次烘焙后liveSimulations=0，敌弹池≤100、玩家池≤96。压力夹具减慢玩家弹、加快敌方攻击以维持负载，非正式平衡。JS heap短测约4–8MiB有GC起伏，不含GPU总内存；非真机、非长时泄漏认证。纸色封面不分配首页流体；动态画作按需建立，切纸色或进游戏释放。0/80NPC渲染的玩家GPU像素hash同为1529098201，55次material调用、12FBO。原Hero源码/visual-effects同源不变。
- 发布与后续：阶段检查点5b9a9c3已保存；最终使用既有main→GitHub Pages工作流、原生importmap统一发布键。最终SHA/部署成功状态以Git、Actions及本轮答复为准，work证据不入库。下一步优先真机Safari/Android和无保护人工Boss弹幕可读性/资源节奏，不再重建核心。可选新怪物未加入正式版本；若继续，先做1个原创剪影实验，普通吞噬核心必须为圆形。首页动态鱼/植物独立运动仍需分层素材；更高阶墨弹可用共享实例化Shader，不能逐弹求解。


## 2026-10-26 — 阶段二收尾：可躲预警 / 选卡时钟 / 视觉与发布验收 [PREVIOUS]

本节与下方阶段一共同构成当前设计；阶段一的“尚待阶段二”现由本节验证结果替代。阶段一checkpoint提交 ae9ee1b6586f622811d81d95e6141392052f087e 已保存；本轮原点 a4cfa5b 的 checkpoint/ink-life-cards-before-a4cfa5b 保留。仍是原HTML项目，无新引擎、无新增运行时依赖。

- **水幕边界补查**：处于水幕的刺球不构成核心吞噬威胁，其尖刺也不扣墨，已加回归。
- **累计资源一致**：gainReserve只按实际入账增加growth.collected；吃墨/吞噬事件也只向阶段能量报告真实入账，封顶不虚增奖励。重生保底、卡牌即时补给不计选卡累计；消费/降级/死亡不重置累计或已选talents。每1200真实墨一机会，serial与稳定offer防连点/换语重复抽；最高LV3后3种即时补给不再加永久等级、也不循环产选卡。
- **补齐单位换算**：玩家清水损耗改按实际墨库每秒10%，不再用显示mass扣墨造成约4倍误扣；AI质量损耗仍原10%。玩家被旧泼墨稀释按mass/4换算墨量，清水/泼墨/尖刺保留最低10（若原来更低不凭空回墨），射击保留20，Boss攻击可真正耗尽墨库触发死亡。核心吞噬规则/30%逻辑体型重生保留。
- **两种可读Boss攻击**：锁角3/4/5路墨矛，215速度；12/14/16枚裂环墨潮，150速度，缺口按玩家半径留空。boss-attacks.js根据半径、实际移速、扇区宽和飞行时间算预警：clamp(避让所需时间−弹体接近时间+.30, .95, 3.6)。预警时Boss减速并锁方向，描画与发射使用相同角度/缺口。实际物理测试含惯性/移动Boss，半径18/80/170无护盾或保护均可侧移躲开五路扇射。不是只用公式断言。Boss仍2400/3800/5400HP；玩家无health/HP条。
- **墨弹再打磨**：放大检查发现第一稿仍太圆，已改私有流体密度多团融合、二维边缘扰动、柔化/细墨丝和反向分层尾迹；敌弹炭灰+少量暗朱砂锐边，与玩家浓墨区分。12源帧生成24个主要云墨缓存，加载阶段preloadInkShots预热；每颗弹无独立流体/FBO。主角MaterialInk源码未改，GPU基准2061883632相同；0/80NPC玩家像素一致（本轮1529098201）、55调用/12FBO。眼下仅一团更深软墨，无壳无尾；凝视规则不改。
- **UI第二轮修复**：手机受击吐司遮Boss→墨库旁损失数值；小屏卡牌纵向滚动、顶部稍后与提示；小地图标签改明确“地图”，缩圈clip到方形；暂停继续最大/设置次级/结算最底；旧Shift拾取道具与长期墨技分名，旧一次性墨障叫护符。PC卡牌支持1/2/3，默认聚焦首卡；触摸选卡前释放左右摇杆pointer capture，不留粘连。首页/设置/结算/Gallery/修复使用统一宣纸、细边、圆角与留白。
- **修复跨场景延迟**：稍后选择从各arena.elapsed改用Campaign.activeTime，切图不回绕、暂停不走时，新run.id重置延迟。实际浏览器：普通地图暂缓→Boss约8秒重新弹卡；键盘1选择；提前退出再新开局不继承旧延迟；双指按住时弹卡会释放捕获且可手指选择。所有机会仍排队、不互叠其他modal/转场/结算。
- **资源/节奏样本**：固定种子2401普通950点/32AI、自动避威胁采集（不选长期技能）30/60/120/180秒约1400/2394/4697/7114墨，对应LV3/4/5/6，而不是短时LV10。受控首Boss无强化样本65/600/2400墨约30/28/25秒；自动选卡/躲弹的无固定保护样本约24–31秒。随机构筑可改变时长，不把这些数字当人工平均。Boss地图2倍、1660点/64补充仍保留；单发最多55/区间2.5%修正了旧10%消耗跳跃。
- **本地完整验收**：九套模型全部通过；Edge桌面+390×844触控模拟均真实三次Boss弹杀、真实卡牌选择与升级/满级补给、扣墨、三块不同碎片、六次alpha255蒙版切图、Gallery鼠标/触摸修复和刷新解锁。该完整流用加速阶段门槛、固定玩家保护、自动移动/实际点击选卡，不是人工完整六分钟。独立真实敌弹耗尽墨库死亡/重生、长期墨技保留、护盾、地图边缘clip、四视口三语UI、双指/独立释放/辅助瞄准/暂停/提前结算通过。历史Gallery锁定预览和旧存档模型保持。
- **性能**：高画质1440×900，32/80NPC正常各10秒约60FPS；压力夹具80NPC+98–100敌弹+约22–26玩家弹亦约60FPS、池有界。压力夹具加快攻击、慢弹并摆放NPC避开发射线以维持在场数，只用于负载，不是正式平衡。短测JS heap约5–8MiB有GC起伏，不等于总GPU内存或长时无泄漏认证。实体手机/耗电/长时未测。
- **发布一致性**：index增加原生importmap与CSS release key inklife-20261026d，41模块统一查询版本，避免旧HP脚本与新页面混缓存。下一轮发布新增模块/改源码后运行 node tools/update-release-imports.cjs <新版本键>；无打包器依赖。版本2存档、画作、旧版正式入口与README历史后缀保留。发布SHA/Actions结果及线上回归以Git与work/life-publication.json为准；最终报告仅在确认后给出。
- **待后续验证/精进**：实体Safari/Android与长时内存、电池；无保护人工六分钟/不同构筑/晚期补给卡触发频率；墨弹目前为缓存流体密度动画而非每弹实时GPU求解，如需更细局部漩涡可做统一实例化shader，不能给每弹一套求解器。没有用技术建议替代已实现内容。下轮先读本节和git状态，优先实机/人工难度，不重新开发。


## 2026-10-26 — 墨库生命 / 累计选卡 / 活墨弹（阶段一 checkpoint） [CURRENT]

基于 a4cfa5b，正式工作区开始干净、origin/main及线上Pages一致，已建 checkpoint/ink-life-cards-before-a4cfa5b。此节优先于历史独立生命值、每级自动奖励和10%单发消耗。

- Boss不再有玩家health字段或玩家生命条。hurt直接扣player.ink：普通弹 min(180,10+当前墨×.025)，核心接触 min(240,16+当前墨×.035)，0墨执行原死亡/30%体型重生。Boss自己的HP保留。水幕/出生保护/墨障阻挡一致，受击显示墨库旁损失数值与主角闪烁，不盖住Boss HUD。
- 八墨阶阈值 [0,180,600,1500,3200,6200,11000,18000]，封顶LV8；Peak只诊断、不再发技能。每.38秒一弹，原区间10%改2.5%，单发最多55，射击保留20墨底线；始终不足则停射。体型原sqrt(64+4ink)/170上限及平滑不改。
- 玩家小墨点收益×.65；吞噬NPC的玩家墨库收益×.55、每次最多900；NPC成熟mass成长不变。普通950/32秒、Boss1660/64秒与2倍场景收益保留。调整来自第一次模型中过快的墨量/选卡节奏，不是改Boss门槛。Boss HP为2400/3800/5400。
- 尖刺仅source核心>target核心×1.06有伤害。每秒=min(40,目标资源×.012×clamp(source核心/80,.65,1.65))，按dt、单步最多.1秒；同一帧重复调用和多个源只取最高速率，不叠加，最低10墨不致死；玩家/AI共用核心/三角判定。主要致命来源仍核心吞噬，Boss攻击另可耗尽墨库。去掉旧mass×.14的过快损耗。
- talents.js独立本局强化：累计实际gainReserve入账每1200墨一次三选一，初试1000过频后调1200；扣墨/降阶/死亡不重置累计或已选择技能。开始/重生保底和卡牌补给不计累计。跨多阈值按claimed队列，稳定offer+serial防重入；暂缓8秒也可HUD手动打开。弹窗暂停世界/普通钟/Boss钟，不互叠转场/结算。新局清本局卡牌，存档格式仍2，不保存未结算局。
- 五技能LV1/2/3：墨障2/3/4次（选中和每Boss开始补满）、急墨移速15/25/35%、墨弹精进伤害20/35/50%、墨涌Boss墨点25/40/55%、惜墨耗墨减少12/20/28%。三卡同时支持新/升级，描述/前后值来自配置；满级后只出现补给/补盾/5秒水幕吸墨三种即时卡，不产出循环选卡。旧Shift拾取道具/AI技能保留并与长期墨技明确命名，旧一次性盾称护符。
- 卡牌采用三列/手机纵向滚动，原创云纹SVG、宣纸、墨边、朱砂等级、数值比较；三语即时更新。暂停继续最大/设置次级/结算最底；HUD一资源面板、累计进度/已选徽记、受击数字、Boss信息。小地图缩圈clip正方形；首页、Gallery、修复/结算表面统一细化，保留三入口。
- 双方墨弹复用私有流体bake的12帧纹理，动画脉动与逆速度方向浓淡尾迹，敌弹少量暗朱砂/锐边；无逐弹模拟，无写玩家流场。Boss两模式交替：.95秒锁角预警定向墨矛(215速度)，裂环墨潮(150速度)留按玩家半径适配缺口。预警与真实方向/间隙共配置，敌人屏外有方向标。眼下墨团更浓、仍一层无尾，保留凝视。
- 已验证：九套模型及4视口×3语选卡/新升阶/墨障/暂停/Boss扣墨；第二轮修复手机提示遮Boss与小屏选卡引导。受控自动吃墨/躲弹模型65/600/2400入场约31/26/23秒获胜（随机样本，不是人工难度）；实际扣墨/死亡/体型/技能效果单测通过。代码和浏览器证据在work/life-*不提交。
- **尚待阶段二**：桌面及触控完整3Boss→碎片→Gallery修复/刷新；双摇杆/暂停/提前退出；批量视觉检查墨弹与各HUD；高密场景FPS/内存/主角流体隔离；最终README/CHANGELOG/Handoff、main发布与线上回归。真机/长时/人工无保护始终须明确未验证。不要把本checkpoint当最终完成。
- 公开参考只提炼结构：Riot官方三选一机制文章 https://teamfighttactics.leagueoflegends.com/en-us/news/game-updates/gizmos-gadgets-set-mechanic-overview-hextech-augments/；Fitzwilliam云纹曲线术语 https://data.fitzmuseum.cam.ac.uk/id/terminology/term-4946。未复制UI/外部素材。

下一步第一条操作：检查git status并读本节，运行work/test-life-ui.cjs，继续阶段二完整循环与性能；勿恢复玩家独立HP或Peak奖励。


## 2026-10-24 — 核心/刺尖分离、焦点镜头、成长与重生 [CURRENT]

基于 main/origin/main c8d0ad0；正式仓库开始干净，本地 checkpoint/collision-camera-before-c8d0ad0 可恢复。维护副本 D:/ink_game_codex/html-inkgame-main，正式 Git C:/Users/Nine/Documents/GitHub/html-inkgame。以下优先于历史小重生/旧等级/禁重复Boss说明。

- **刺球判定**：src/game/alien-geometry.js 为渲染与碰撞共用固定种子尖刺、动画帧、旋转和核心几何。普通刺球和Boss核心=.73×逻辑r×浓墨倍率；正常吞噬仍旧大小比1.06/覆盖.32，仅核心参与。外围25/31个锥形三角与目标核心圆做接触检测，不把最长刺作为实心圆。先处理吞噬，再对存活单位按dt流失；玩家/AI相同，出生保护/水幕豁免，盾仍按原吞噬/HP逻辑。刺尖 loss=min(mass−64,mass×.10×1.4×dt)，是清水基准1.4倍；多个刺球接触可叠加，同一源每帧一次，不是帧率相关瞬伤。视觉反馈限每实体.2秒。NPC不生成流场。Boss刺尖只扣墨，核心仍独立HP接触伤32、弹幕22，不替换其HP攻击；玩家墨弹命中Boss核心。
- **镜头根因**：旧最低.52/.40使宽屏可视世界宽超过3400，origin clamp=0导致中心向左；缩放同时插值左上角造成额外焦点漂移。camera.js现在插值世界焦点后换算origin、缩放上下界独立，最低PC .78/手机 .66且至少max(窗口宽/3400,高/3400)，最后clamp不露地图外空白。成长斜率从1/220减到1/900；Boss以玩家为焦点，手机保留.68纵向位置，取消两单位中点横移。resize重置镜头，DPR仅影响画布分辨率，CSS世界单位不乘DPR。
- **Drops**：W=(敌人35+1.35×min(170,targetR)，墨点14+2.2×targetR)+8.1×sqrt(playerR/18)；效果参数r=clamp(W×zoom,敌人55或墨点20,270)/zoom，最后图集显示边长r×(3.4+1.2t)。世界位置用吞噬发生点；按当前缩放再限制最大屏幕尺度。按玩家/目标/zoom综合放大，短播放、快速淡出、80池/预加载缓存保留。
- **Boss入口根因**：app原remaining=3−已存碎片数，使已集三片的新局limit=0（部分收集也少阶段），并非墨阶阈值问题。现在每局3次机会，碎片仍只发未拥有的一片，集齐后可重复挑战/得墨但不重复发片。100/250/450能量、60/180/300普通时间、360秒至少一次保底原值不降。stageStatus集中输出条件/差额/原因/phase至bokuMetrics.stageDebug，HUD同时显示能量和时间差额。转场贴图加载失败改程序化遮盖兜底，不会因Promise拒绝把busy永久卡住；强制素材失败的浏览器用例已通过。
- **成长曲线**：区间容量 C(n)=100+80n+35n²；阈值 T(n)=100n+40n(n−1)+35n(n−1)(2n−1)/6，n=等级−1。前阈值0/100/315/715/1370/2350，Lv10=10920（旧1620）。二分精确计算等级，下降/Peak排队/技能保留不变，阶段能量仍仅累计获取×.12，与等级和射击消耗独立。单发扣当前区间容量10%规则保留，体型/威力实时重算。
- **采样**：固定随机种子2401、普通950墨点/32AI、自动就近吃墨并避大型威胁、无保护，30/60/90/120/150/180秒分别约2600/5154/4026/6164/7013/8916墨，Lv6/7/7/8/8/9；180秒累计获取12623、0死亡，损耗含水/尖刺。该模型不是人工试玩平均或完整Campaign。受控Boss65/600/2400墨可持续拾取射击胜利约28/27/25秒，实际浏览器三阶段约25/37/51秒（保护、阶段门槛加速，不注入Boss伤害）。
- **30%重生**：用死亡前墨库派生的逻辑半径（排除显示动画/浓墨临时倍率）计算 r'=max(18,.30×r)，再反算 ink'=max(65,(r'²−64)/4)。半径100→30/209墨，170→51/634.25墨。不能先套旧.65墨惩罚。r/mass/ink立即一致；Peak/奖励队列跨本局死亡不重置，技能仍沿用死亡清空规则。60次候选选取安全出生点，间距提高到保留半径+180，保护2.5秒；NPC旧重生生命周期保留。
- **缩圈/AI**：最终半径650→1050，开始普通时间30%→36%，收缩使用1−(1−t)^1.45缓和后段速度。清水.10mass/s惩罚保留。七类Personality新增waterTolerance/waterSeconds：攻击220/2.5秒、机会180/2、高手150/1.8、均衡90/1.2、新手70/1；保守/逃跑0。短时可为猎物或高收益资源承担损耗，超过深度/暴露预算回圈，仍躲威胁。
- **眼球**：仅一层静态柔软墨团+眼睛，不画alienBody眼壳/噪声外圈，保留凝视/眨眼。eyeTail默认false；可开关的小尾只在有速度时反向、平滑/收束。刺球/Boss无底座。只预热64张刺球/Boss缓存，不再预热不用的眼壳24张。玩家流体/visual-effects、存档结构与旧Gallery不改。
- **测试**：八套模型（新增collision-camera）涵盖三角尖/间隙、dt一致、退出/AI同规则、吞噬优先、30%逻辑重生、90镜头组合含四角/变大、精确/跨阈值/最早时间/三Boss/保底、屏幕Drops、人格风险。真实Edge PC及390触控模拟三Boss/六次全遮盖/唯一三片/Gallery修复/刷新通过，门槛加速且固定保护/自动采集，不能称人工六分钟。四手机视口双指/释放/瞄准/暂停/语言、1440/2560/390/844的DPR1/2/3与窗口横竖切换、三片老存档进入Boss、失败贴图兜底均通过。32/80NPC各10秒高画质1440×900约60FPS，12FBO；非手机真机/长时测试。
- **证据/后续**：work/collision-*.json与截图只留本地不入Git。实体Safari/Android、长局GPU/电池、无保护人工难度仍待验收。下一步先核对最新Git与本节，优先实际设备和人工资源/刺尖损耗节奏，不重建核心系统；发布SHA和状态以Git/Actions及work记录为准。


## 2026-10-20 — 墨库 / 墨阶与 Boss 资源循环

本节优先于历史体型伤害说明。基于 main 1b97c4d，本地 checkpoint/ink-reserve-before-1b97c4d 可恢复；不是整体回退或新建项目。

- Campaign 玩家以 player.ink 为本局唯一墨库；NPC 和旧版默认 Inkstone 保持旧 mass 成长。持久化余额只接收结算剩余有效墨量，不与实时墨库重复叠加。存档版本仍为 2，原碎片、Gallery、语言、旧历史数据保留。
- 阈值 T(n)=100n+10n(n-1)，n 从 0 开始；等级为最大满足 T(n)≤墨量的 n+1。区间容量 100+20n，阈值 0/100/220/360/520。进度=(墨量-T)/容量。半径目标=min(170,sqrt(64+4墨量))，指数平滑系数 1-exp(-3.4dt)，碰撞 mass=r²。不以旧 entryMass 重复乘输出。
- u=clamp((等级-1+区间进度)/19,0,1)；弹伤=13+36u^0.65，弹半径=4.5+9u^0.7。每 .32 秒最多一发，消耗 max(2,当前区间容量×10%)，不足则停射，不允许负数。每颗弹快照尺寸/伤害，后续降级实时影响新弹。全部参数集中 src/game/config.js INK_RESERVE_CONFIG。
- 初始墨库65；死亡归0/半径8，沿用死亡清除技能的旧生命周期；PeakLevel 和已获待处理队列跨本局死亡保留，防重复奖励。本局新最高等级逐级入队，既有两技能槽空出后依次领取；降级不删除技能，回到旧峰值不再领奖。新局重置 Peak。
- 普通墨点950/补充32每秒，原760/25；Boss1660/64，单位面积约1.75倍（同大地图尺寸）。低于120墨时，每秒检查220范围不足6点，补2点至55–150附近；达到总上限时替换远点，不扩池。
- Boss 玩家生命值独立100，弹伤22/接触32，真实受击闪烁与死亡重生，HUD仅Boss显示。墨库 HUD 显示等级、区间进度、下一阶、近期/排队墨技，不使用遮挡血条的升级弹窗。
- 首页按钮 zh开始/jaプレイ/enPlay；中文翻译、世界NPC名字、Canvas字体均集中语言化。中文 Noto Serif SC 等完整中文字体优先；浏览器实际字体检查确认为 Noto Serif SC。
- 刺球改固定种子直锥形海胆刺，仅微呼吸/慢转；只恢复眼球 NPC 的柔软旧墨团底层，保留凝视/眨眼。刺球与Boss没有底座。主角流体源码保持不变，NPC仍零活跃流体。
- 已验证七套模型、桌面及390触控模拟三Boss真实弹丸击杀/三片实际奖励/六次全遮盖转场/修复/刷新存档；测试加速阶段门槛、固定保护、以移动控制器拾取真实地图资源，不代表无保护人工六分钟。独立真实扣墨、降阶/回升、不重复奖励、受击/致死/重生均通过。四尺寸双指独立释放、瞄准、暂停、即时语言通过。低/中/高墨65/600/2400受控模型输出约17/27/39，弹半径5.35/7.76/10.88，首Boss约20/18/15秒；非人工平均时长。
- 本机1440×900高画质短测，32NPC约53–59、80NPC约58–60FPS；仍12玩家FBO。历史主角GPU哈希2061883632保持一致，0/80NPC隔离哈希164962785一致。证据 work/reserve-*.json 不入Git。
- 尚需：实体Safari/Android、长时间内存/耗电及无保护人工难度平衡；本环境只有浏览器触控模拟。旧七AI、普通大地图、3Boss、Drops/Transitions/Gallery基础机制不重写。

下一步：读取最新 Git 状态和本节，优先真机与人工资源节奏验证；不要恢复历史 entryMass 输出公式或已退役自由绘画入口。发布SHA/Pages结果以 Git 历史与发布记录为准。


## 2026-10-20 - Resumed Publication Checks and Locked Painting Preview Guard

### Fixed

- Gallery details previously overlaid clear owned fragments on the blurred preview;3/3 could therefore expose an almost complete painting before restoration. Collected pieces now mark their positions with a translucent tint only. Every0/1/2/3 un-restored preview stays grayscale/blurred; only the persistent unlock enables a clear original. Added rendering-operation regression coverage and a translated ready-to-restore hint instead of asking3/3 players to collect more fragments.

### Verified

- Resumed from clean local/origin main011a690 after the usage-limit interruption; did not rebuild completed systems. Confirmed successful Pages deployment and ran published desktop smoke through a real Boss kill, Gallery repair and persisted language/unlock.
- Completed the previously partial mobile full-cycle check on published390x844:three actual shooting Boss wins,six alpha255 map switches,three real saved fragment rewards,touch restoration,automatic detail return and refresh persistence. Ordinary gates accelerated and player protected; Boss HP is not directly cleared and no fragment fixtures are inserted in this complete-cycle test.
- Rechecked all five Gallery states, mouse repair, three languages and old Best/History sentinel preservation after the preview fix. Existing four-viewport controls, six model suites, size balance and player-fluid isolation evidence remain valid.
- Remaining validation limits:physical iOS/Android, prolonged GPU/battery and unaided human difficulty tuning. No original gameplay feature was removed; only Gallery preview clarity and verification documentation change in this continuation.


## 2026-10-20 - Gallery Simplification, Living Ink Enemies and Size-Based Boss Combat

### Changed

- Scene entry now refreshes HUD immediately before revealing the map; normal10Hz updates do not leave an empty Boss label during the first frame.
- Home now has exactly Grind Ink / Gallery / Settings. Removed free-painting, picker, export and score/history UI from the current route while retaining algorithms and legacy pages.
- Replaced current Gallery with five verified collection states, blurred locked thumbnails, visible owned-piece positions, 3/3 restoration gate and direct original viewing after unlock. Existing unlocks/fragments/IndexedDB Best/History remain intact; no new painting-history writes.
- Gallery restoration is a short grayscale/blur-to-clear assembly and scratch performance, auto-completes at its internal threshold, glows and returns to the painting detail. No score, balance consumption, history or percentage UI.
- Curved, irregular, grain-textured animated thorn/eye silhouettes replace mechanical triangles and separate underlying ink bodies. Both NPC thorns and Boss have no extra base. Shared 88-frame256px cache preloads in bounded frame slices; small eyes use reduced detail and HUD updates at10Hz.
- Renderer-only gaze selects largest visibly stronger nearby unit, otherwise nearest; attacking aggressive/expert controllers prioritize their actual hunted target. WeakMap lock/smoothing/blink never changes AI. Boss follows player.
- Drops scale radius/lifetime/opacity from consumed size, capped and pooled80. Thicker17px Boss health with numeric HP, hit and delayed-loss feedback.
- Death immediately before a stage gate now enters with tiny respawn mass, preventing revival of the pre-death large body.
- Boss HP2000/3000/4200,140s timeout, faster/more threatening shots, standoff/orbit movement and locked fan/ring telegraphs. PROJECTILE_BALANCE uses one entry-size sample plus bounded relative combat growth; each shot carries its own size/damage. PC/mobile controls and normal/Boss/fragment cycle retained.
- Central Japanese/Simplified Chinese/English localization across current UI, dynamic HUD/dialogs/notices/errors; immediate refresh and persistent language. Settings includes working quiet sound volume. Save version2 and progress remain compatible.
- Home artwork shader adds bounded ink-weighted/noise-modulated local flow, weaker paper displacement and smooth return to an unwarped original after interaction. Player simulation shaders unchanged.

### Validation / Limits

- Six model suites pass, including real projectile small/medium/large first-Boss TTK28.8/17.1/11.5s, no unbounded multipliers, exact entry/return transfer, largest/prey/nearest gaze, smoothing, size-scaled Drops and complete dictionaries.
- Desktop browser three actual Boss kills, six opaque switches, Gallery-only repair, all collection states, three languages, pause, refresh and preserved old image-record sentinel. Stage gates accelerated and player protected; no Boss HP shortcut.
- Four phone viewports pass independent double touch/release, manual/assisted aim, pause, immediate language and layout.390x844 additionally one real Boss win and touch repair; two extra repair-fixture fragments are explicit. Not physical-phone/full mobile three-Boss certification.
- Home GPU flow/opaque color,80Drop cap, reset cancel/confirm preserving settings, legacy Gallery, unchanged historical player GPU hash and0/80NPC field isolation pass. After cache warm-up changes, high-quality32/80NPC10s short samples around57–60fps. Long-run GPU/battery, real devices, human difficulty and author-supplied art layers remain pending.


## 2026-10-20 - HTML Ink Journey, Alien Enemies, Boss Fragments and Restoration

### Added

- Campaign coordinator around existing Inkstone:3400-square normal world,360s NORMAL active time, configurable100/250/450 energy and60/180/300s earliest gates, maximum3 encounters, no-encounter fallback at360s, remaining-fragment cap, protected transition/reward states and idempotent settlement.
- Guaranteed moving/attacking spiked-eye Boss per special map, three HP/speed/rhythm tiers, pooled automatic ink projectiles, manual/assisted mouse aim, independent mobile movement/aim sticks, hit/health/death feedback,100s Boss timeout and configurable2x resource/swallow rewards. Normal map never fires. Normal arena identity, NPC ecology and resources survive map returns.
- Actual user Drop(1)/V1 Transition(1) black-white MOV mattes converted to transparent WebP atlases (126KB total), preload/cache,80-entry pickup pool, large swallow emphasis and guaranteed opaque switch frame before reverse reveal. Build script and provenance included; original MOVs untouched.
- Three unique persistent fragments for existing byte-identical ink-04 artwork, repeated-receipt protection, irregular shared-boundary pieces, assembly, pale scratch/reveal mask, weighted72% completion, one-time unlock/glow and Gallery Best PNG. Save schema2 migrates schema1 without removing balances/settings/collections; reset includes fragments/repair.
- Victory offers normal-map return or settlement, plus restoration when ready. Existing free painting remains optional and cannot unlock the fragment artwork early.

### Changed

- Campaign settlement uses effective remaining player ink, preserving water dilution and attack losses instead of paying the pre-loss acquisition counter.

- NPC appearance becomes animated thorn/eye ink independent of the seven existing AI profiles. Reuses cached dense ink bodies, adds rotating/pulsing spines, blink/iris, soft short tails. Player approved MaterialInk source unchanged; NPCs never write player fields.
- Special map parchment wash and Boss HUD/minimap distinguish encounters. Boss-only camera pairing keeps near Boss/player visible on phones; normal movement/camera/consumption remains legacy-based.
- Home now reuses private study fluid advection/deformation with ORIGINAL RGB artwork sampling. No actor/reveal layer or black-circle overlay; paused/idle fields save work. Hidden-home resize/quality and back-forward cache re-entry handled.
- Root Gallery features the quest artwork while preserving stable IDs, old collection, Original/Best/History and separate legacy route. README keeps New Version and all old/visual links and text.

### Validation / Scope

- Existing model suites plus new campaign rules: full360s normal-time ecology, gates/fallback/attempt cap, real projectile kills/attacks,2x gain, tiny respawn, aim, unique fragments, migration/reset and one-time repair.
- Edge desktop full3Boss loop with actual mouse scratch;390×844 full3Boss with real CDP touch scratch; four phone dimensions with two-pointer ownership, independent release, aim toggle, pause clocks, early settle/refresh fragments. Normal gates are accelerated and player protection fixed for controlled-loop tests; Boss HP is not directly cleared. Damage/respawn have separate checks.
- Fully opaque transition checks, GPU home image disturbance/color opacity, bounded80 Drops, preserved free drawing/reset/legacy Gallery, unchanged historical player GPU hash and0/80 NPC pixel isolation.32/80 NPC high-quality local ten-second runs around60fps; not physical-phone/long-session certification.
- Bilibili search fetch failed, but real Edge loaded/played the first portion (readyState4,time5.15s) and was visually inspected. Only style guidance, not claimed full Processing-video reproduction.
- First quest uses one Boss design with3 tiers and one supplied artwork. Partial live rounds/scratch mask do not resume; already-earned fragments do. Further authored layers, touch hardware and extended balance/performance remain future work.



## 2026-10-13 - Scoped Player Visual Rollback and Reused NPC Ink Atlas

- Identified current dense/rear-wake player visual as3e63bd4 and previous visual baseline as8f92488 (last visual-code commit f8d3e2c). Restored exact previous MaterialInk, material/contain GLSL and material vorticity; retained camera reprojection, drawing, wallet, persistence, HUD and home isolation. No whole-commit revert.
- Game and visual-effects still import the same restored player modules. Fixed-motion GPU comparison with historical baseline is pixel-identical (hash2061883632).
- Preserved3e63bd4 fluid/material source under src/ink/npc-material. One private96-grid,4-pressure-iteration bake generates12 shared128px compact animation frames, crops long tails, then disposes all temporary GPU targets/context. Runtime NPCs only rotate/play cached ink textures; no per-NPC fluid or player-field writes. Existing light sprite is a loading/unsupported-bake fallback.
- README new-version title, section and game link now use **New Version**. Old game and visual README/links/text preserved.
- Validation: restored-player baseline GPU comparison, actual generated NPC atlas (one build,12 frames,zero remaining simulations), player0/80 animated-NPC pixel isolation, existing combat and paper-save checks; five-view home/drawing/Shift/wallet/reset regression and32/80 NPC short performance. Physical phones/long sessions remain unverified.



## 2026-10-13 - Pure Artwork Home, Rear Wake and Persistent Painting World

### Added

- Independent original-art home renderer with bounded 1.1px local ripple distortion, pointer/touch/click interaction, and idle rendering suspension. Home never imports actor/reveal/fluid fields.
- Artwork-sized painting maps, shared mouse/WASD/mobile joystick movement, following camera, weighted original-image reveal, painting minimap, and forward Shift/touch ink projectiles.
- Versioned centralized browser save: shared total ink, settlement receipts, earned/spent totals, artwork completion, unlocks and settings. Migrates legacy metadata, preserves legacy page saves, flushes on normal exit and rejects overspending.
- Two-stage settings reset clears new-game ink/progress/unlocks and IndexedDB Best/History, retaining pure settings and the initial catalog artwork. Reset generation guards block stale asynchronous image writes.
- Paper-save rule tests for migration, duplicate settlement, budgets, projectiles, cooldown, unlocks and reset.

### Changed

- Hidden and cleared gameplay canvas on home return; home background displays one original image independently of previous NPCs or painting frames.
- Upgraded eight cached NPC sprites with static pigment variation, subtle irregular feathered edges and grain; still no fluid, trailing or physics coupling.
- Shared MaterialInk/InkFluid use rear-spine emission, backward wake transport, cross-axis damping, reduced moving swirl/vorticity, narrow lateral envelope and rear density fade. Emission shares an existing density pass; zero-velocity splats skip an unnecessary velocity copy. Stationary core and separate fish vorticity preserved.
- Rounded paper-glass HUD, item/action controls and rectangular minimaps. Home brush menu retained.
- Replaced viewport pointer painting and disposable carried-ink scaling with world movement/reveal and real shared-wallet spending. First-save starter ink is granted once, not per painting.
- README adds newest game access and retains original visual introduction, visual README, technical documentation and legacy game text/links.

### Validation / Limits

- Five Edge sizes (1440×900,390×844,844×390,320×568,568×320), real touch-event two-finger paper movement/projectile, stone settlement, drawing reveal and PNG history, refresh and closed/reopened persistent browser, cancel/confirmed reset passed.
- Home-original comparison after battle has no large pixel differences; sub-one-color-level mean differences from browser sampling are tolerated. No script/resource errors in route tests.
- Player field remains pixel-identical with 0/80 NPCs and constant material pass count. Directional GPU sampling verifies rear pigment exceeds both lateral regions combined for right/down movement; still core remains nonzero.
- Reused existing combat rule/profile/full300-second ecological checks; completed-art unlock uses the real reveal mask, while deterministic completion/settlement branches are accelerated by test-only instrumentation.
- Final standalone high-quality local32/80 NPC ten-second runs stayed around60fps,12 FBOs;20 consecutive renderer lifecycles had no WebGL-context warnings. Rear/lateral pigment ratios about64(right)/29(down) in controlled directional samples.
- No phone hardware or prolonged GPU certification. Unfinished rounds do not resume after reload; wallet and completed records do persist. Artwork masks remain grayscale-derived, not authored per-work masks.
- Publication uses existing clean formal main repository, explicit runtime/docs/test whitelist and normal push; no work files, profiles or screenshots staged. Existing old game source/assets remain byte-identical.



## 2026-10-13 - Player-Only Fluid, Legacy World and Ink-Technique Combat

### Changed

- Separated approved player MaterialInk from lightweight NPC spheres. NPCs use eight cached legacy-style Canvas gradients; no NPC density, velocity, force, material pass or trail enters the player's simulation.
- Restored legacy 3400×3400 square world, 760 four-shape ink resources, full-map/edge NPC spawn distribution and mature movement/camera foundations. Battle contains no artwork reveal/erasure.
- Replaced whole-world fluid with full-quality player viewport simulation and camera coordinate reprojection; the reference MaterialInk algorithm remains unchanged.
- Removed free acceleration, mass cost, boost API/button and E shortcut from the new game. Shift exclusively uses equipped ink techniques; retired speed-changing dash and added forward pigment-wash splash.
- Expanded to32 NPCs with seven personalities, individual reaction/awareness/skill, threat-aware escape routes, prey profitability/interception/abandonment, resource/item competition, edge/water steering and situational item use.
- Redesigned combat HUD with translucent paper islands, circular minimap, seal-like pause/item controls, current/reserve slots and effect/state feedback.

### Validation

- Five desktop/mobile viewports, battle-to-paper/record flow, pause, resize and quality controls passed without script/resource errors.
- 0 vs80 NPCs produce pixel-identical player fluid and identical material pass counts; NPC visual code owns no fluid reference.
- Shift no-speed/no-mass-cost, current/reserve item use and two-finger joystick/item passed.
- Full300-second rule/ecology simulations: NPC mutual swallowing and distinct behavior distributions. High-quality local32/80 NPC short tests around60fps,12 FBOs; not physical-phone or long-duration certification.
- Local-only; previous changes, legacy game, supplied assets and public visual study preserved. No commit/push.

## 2026-10-13 - New Home and Playable Inkstone-to-Paper Loop

### Added

- Added interactive Japanese home UI with supplied calligraphy title, independent textured brush buttons, loading and keyboard/touch navigation.
- Added replaceable background catalog, random/rotation/unlocked policies, saved background selection and fluid artwork interaction.
- Added modular five-minute inkstone with unified entities/controllers, five AI personalities, public ink, tiny respawns, configurable death penalty, proportional early settlement, full-round rank reward and clear-water shrink.
- Added five random ink skills, current/reserve queue, minimap item lights, pause and simultaneous mobile joystick/action input.
- Added three-minute paper sessions using existing fluid-driven artwork reveal, guaranteed basic ink, carried ink, completion, collection and PNG download.
- Extended existing Gallery with Original/Best/last-five History, stable legacy unlock records and IndexedDB image blobs with explicit session fallback.
- Added centralized game balance and executable rule tests, including full 300-second model simulation.

### Changed

- Root entry now starts the new game. Existing v2 and visual studies remain independently accessible.
- Reused approved MaterialInk without replacing its design; added opt-in local multi-entity forces/containment and cover backgrounds to the fluid module. Default study rendering remains unchanged.
- PaperReveal accepts a supplied artwork URL; default source resolves relative to its module.
- Local preview server serves SVG with the correct content type.

### Validation

- Edge desktop plus four mobile-size viewports: both entries, reveal, pause, results, gallery, rotate/quality/resize, no script or resource errors.
- Touch-event joystick + second finger boost, touch reveal, Escape/cancel flow, IndexedDB persistence/best/history limits, storage-denied fallback, legacy and study smoke checks passed.
- FBO count remains12; short local measurements near60fps, not physical-phone or long-session certification.
- Local-only. No commit/push; extracted workspace has no Git metadata.

## 2026-10-12 - トップページに二つの紹介を掲載

- トップページのREADMEに水墨視覚効果の紹介と展示・技術説明の二つの入口を追加。Ink Game Demoの説明は全文をそのまま保持し、独立した水墨READMEも維持。

## 2026-10-12 - READMEの役割分離と旧版ゲーム説明の復元

- Git履歴の585c6c9から旧版ゲームのREADME本文をそのまま復元。ルートにゲーム説明・公開URL・構成・アルバムの案内を保持。
- 水墨視覚効果のREADMEは prototypes/ink/README.md に分離し、展示と技術・操作説明の二つの入口だけに整理。既存の詳細説明は EXPRESSION.md へ移動。
- READMEと説明文書・更新履歴のみ変更。ゲームコード・視覚描画・素材は変更なし。

## 2026-10-12 - 薄墨の扇尾・安定した衝突半径・公開案内の整理

- 魚の薄墨の扇尾、透明な主体内部、安定した衝突用半径と墨の中だけに見える破線を公開。視覚形状と衝突半径を分離し、高速時も基準半径の88%以上を維持。
- READMEを展示と技術・操作説明の二つの入口に整理。魚の専用リンク、代替リンク、旧版ゲームの案内をトップページから削除。技術説明を現在の描画に合わせて更新。
- 半径の下限・復元・中心位置、墨のない領域の画素不変、破線の不透明度低下、ページの動作を確認。既存ゲーム・素材・一時ファイルは変更せず。

## 2026-10-12 - ローカル試作：墨の中だけに見える衝突の破線

- 旧来の視覚半径の薄い輪と赤いデバッグ円を廃止。安定した衝突半径を使う細い破線へ統合。
- 破線は墨の不透明度を控えめに引く方式で表示。留白には線を加えず、墨がない部分は見えない。通常の墨モードで表示し、魚は変更なし。

## 2026-10-12 - ローカル試作：視覚半径と衝突半径の分離

- 衝突用の円を視覚の縮小率から分離。静止時の芯の半径を基準に、速度で最大12%だけ滑らかに圧縮し、最低88%を維持。中心は操作主体の位置に固定し、遠い尾を含めない。
- 流体描画と薄い内側の縁は維持。URLの debugCollision=1 でのみ衝突円を点線表示し、通常画面には表示しない。計測に基準半径・衝突半径・中心を追加。
- 視覚実験ページの衝突用データを調整。対戦相手や吞噬処理は未実装。未コミット・未公開。

## 2026-10-12 - ローカル試作：透明な内側と速度に応じた半径

- 固定の黒い実心円を廃止し、内部の色・不透明度を元の流体密度に戻した。既存の墨の内側にだけ、細い減透明度の縁を表示。
- 交互作用用半径を速度に応じて滑らかに縮小。静止時は散墨用半径の48%、高速時は16%へ近づき、減速後はゆっくり通常の大きさに戻る。
- 縁の描画と計測は同じ可変半径を使用。魚の表示と流体計算は変更なし。ローカル確認用、未公開。

## 2026-10-12 - ローカル試作：安定した墨芯と内側の縁

- 墨の中心に、散墨用半径の48%を使う安定した実心の円を追加。移動・加速・散墨によって芯が縮まず、尾の流体表現は維持。
- 留白に出ていた大きな円を廃止。芯の半径91〜97.5%の内側だけで不透明度を控えめに下げ、大きさを示す細い縁へ変更。
- 静止・加速中の芯の半径一致、内側の縁のアルファ低下、芯の外側に輪を描かないことを画素で検証。三画質の動作と切替も確認。
- 交互作用用の芯の半径を描画と計測で共有。視覚実験ページには対戦相手や衝突処理がないため、既存ゲームの衝突ルールは変更しない。魚・宣紙・背景インタラクションは変更なし。

## 2026-10-12 - ローカル試作：薄墨の扇尾と大きさの目安

- 魚を濃い頭・柔らかな胴・幅広い薄墨の扇尾へ調整。従来の墨の補給・速度誘導・渦を再利用し、泳ぎの波と柔らかな密度の範囲だけを追加。
- 墨モードの実際の半径に、淡い灰白色の半透明な縁を追加。速度や墨の広がりに左右されず、大きさの設定に追従。
- 墨 / 魚の切替と既存ページを維持。公開前のローカル確認用。

## 2026-10-12 - 細長い魚身と密度場だけで描く墨の魚

- 魚身の長さを約55%伸ばし、胴の幅と尾の広がりを調整。連続波の振幅を増やし、胴全体の曲がりを強化。
- 不透明な魚形の重ね描きを廃止。魚も従来の墨と同じ平流密度・濃度・縁の描画式だけで表示。
- 円形中心への速度誘導を、魚身の移動と波の速度に沿う誘導へ変更。見えない魚形の範囲で補墨し、範囲外を柔らかく散逸させ、輪郭と流動感を両立。
- 尾鰭と胸鰭の補墨を胴より控えめにし、魚身付近の散墨を収束。従来の墨モードとUIは維持。
- 三画質・縦横画面・操作・収束を検証。元の墨の画素差分0、空の密度場では魚のアルファも0であることを確認。

## 2026-10-12 - 参考図に沿った魚形と連動する泳ぎ

- 魚を参考図の厚い頭・細い尾柄・湾曲した長い尾鰭に合わせて調整。硬い三角形の尾を、長さの異なる二枚の薄い墨の葉へ変更。
- 頭から尾へ進む波と、転向の角速度に追従する胴の曲がりを追加。速さで振幅・周期・伸びを調整し、減速時は滑らかに収束。
- 魚形の描画と密度の補給・収束を同じ輪郭で制御。魚では円形の墨芯への補給を廃止し、従来の流体計算と尾の輸送は再利用。
- 腹の淡墨、白い筆の隙間、流れる濃淡、乾いた尾鰭を追加。流体による小さな歪みは制限し、魚形の判別を維持。
- 静止・加速・転向・減速、三画質、デスクトップとモバイル縦横画面を確認。身体と尾の非剛体変形、減速時の収束、墨モードの画素一致を検証。
- 参照画像・テスト画像・動作記録は公開ファイルに含めず、UIと既存の墨モードは維持。

## 2026-10-12 - 墨・魚の比較と展示ビュー

- 「墨 / 魚」の切替を追加。既存の墨の描画と入力を保ち、同じ位置・大きさで比較可能。
- 水墨の魚を追加。頭・胴・鰭・二股の尾を柔らかな墨で描き、速度に応じた向きと尾の揺れを追加。既存の流体・補墨・尾を再利用し、依存ライブラリーの追加なし。
- 設定欄を閉じる展示ビューを追加。主体の切替を残し、ボタンまたはEscapeで戻れるようにした。表示・主体・展示状態をURLへ保存し、再表示や共有を可能にした。
- READMEに魚の展示リンクと操作・技術の説明を追加。既存の代替リンクとInk Game Demoの説明を維持。
- デスクトップ・縦横のモバイル画面で切替、入力、画質、表示、再読込を検証。既存墨の描画を比較し、追加モード以外を変更しないことを確認。

## 2026-10-06 - 日本語展示・高精細描画・背景インタラクション

- READMEの見出しを「墨水視覚効果制作」に変更し、公開リンクと表現の紹介に整理。既存のInk Game Demo以下の説明は維持。
- 視覚効果と新版試作の表示・操作・アクセシビリティ文言を日本語に統一。
- 高画質の流体格子を448から640へ拡張（画素数約2.04倍）。出力上限を1920 × 1080、バランスを1280 × 720、省電力を960 × 540に設定。格子・計算頻度・倍率も段階的に調整。
- 移動速度に応じ、墨の中心の縁へ控えめな紙色を追加。密度で描く主体と尾の表現を維持。
- インタラクティブ墨に「白い画布」「宣紙の水墨画」を追加。同じ原画を再利用し、速度場で運ばれる変形場から画像を再サンプリング。
- 二尺度の値ノイズ、変形の減衰と上限で規則的な揺れを軽減。tanhによる入力飽和、ベクトル上限42、55 msの平滑化、狭い作用範囲で急な引き伸ばしを抑制。
- 原画表示を1536幅へ拡張し、復元マスクは768幅を維持。復元率・リセット・補助表示の仕組みは維持。
- Edgeの1920 × 1080および390 × 844で全画質・全表現を確認。高画質は約57.5–60 fps、他の画質は約60 fps（短時間測定・同一PC）。変形、高速移動、入力上限、復元、リセット、日本語UIを検証。実機スマートフォンと長時間負荷は未測定。

## 2026-10-06 - Visible Core, Scaled Wake and Bilingual Visual Preview

### Added

- Added a dedicated /visual-effects/ page for GitHub Pages, reusing the independent study modules while preserving the existing game entry.
- Added simultaneous Chinese/Japanese labels, instructions, controls and accessibility text, plus a size slider for direct comparison.

### Changed

- Strengthened the advected primary ink reservoir to keep the controlled location readable.
- Unified seed, feed, core, flow-envelope, containment and splash dimensions under the same entity radius; smaller entities now have smaller wakes and diffusion extents.
- Reduced interactive painting input force to one quarter, clamped force to 85, narrowed its influence radius to .035, reduced automatic stir and vorticity; retained the approved density-body style.
- Fixed paper mode resizing after a hidden canvas had zero bounds, including compact touch viewports.
- User authorized GitHub publication from this round. Base main commit: 1bb02502f68b6fd99e28338ef183825711054443. Only project sources/docs and the new visual route are included; no user video or local test outputs.

### Validation

- Edge desktop, mobile portrait/landscape and 320x568 touch emulation: input, bilingual text, size, paper reveal/reset, quality and rotation checked.
- Core alpha 251/255 at both tested sizes. Tripling radius increased visible ink area from 73 to 525 sampled pixels.
- Remote tracked baseline matches all 43 files in the supplied ZIP; original history/assets are preserved.


## 2026-10-06 - Simulated Density Body (Alternative Study)

### Changed

- Replaced the active geometric silhouette and radial core with an advected GPU density body. New material.js drives existing velocity-field transport, density-aware movement and localized cohesion forces before pressure projection.
- Added mode-specific optical-density/edge rendering; Interactive Painting retains its previous display path and starting composition.
- Paper Reveal uses the same simulated ink. Kept idle/reset safeguards; movement click no longer automatically triggers an explosion.
- Previous contour implementation remains available in source/history for comparison. The candidate is a 2D ink-in-water study, not a free-surface liquid or surface-tension solver.
- Desktop and mobile-size regressions passed; actual embedded-browser frame rate still varies. Local-only, pending visual acceptance.


## 2026-10-06 - Direction-Driven Ink Core (Third Study)

### Changed

- Coupled the main ink reservoir and skin to speed-dependent stretch, lateral acceleration, turn lag and damped recovery; removed the round stationary core and fixed radial spokes.
- Added the same moving, deformable ink body to Paper Reveal. The pointer now steers ink rather than depositing an independent circular brush at every input point.
- Increased paper ink deposition to make the existing original-art reveal visible behind the moving body. No deposition occurs before the first input or after reset.
- Preserved the current Interactive Painting solver and composition, following the user's positive feedback on that study.
- Kept Chinese UI and local-only delivery.


## 2026-10-06 - Elastic Membranes and Chinese UI (Second Study)

### Changed

- Replaced repeated sine ribbons with an elastic, damped contour and three asymmetric, advected translucent membranes; added turn-driven shedding and irregular splash fragments.
- Added bounded MacCormack density correction to retain thin fluid details and increased the high-quality grid to 448; cached shader bindings and decoupled simulation from display with intermediate advection prediction.
- Fixed hover interaction so movement without a pressed pointer really pushes existing ink.
- Converted the active prototype, default legacy entry, Gallery, QR captions, pause controls and accessibility text to Chinese following the user's updated preference. Legacy gameplay mechanics and supplied assets are preserved.
- Local-only iteration. Visual similarity remains under review; high-quality performance varies, especially during concurrent browser use.


## 2026-10-06 - Independent Ink Visual Studies

### Added

- Added modular Player Ink, Interactive Painting, and Paper Reveal studies under prototypes/ink/.
- Added WebGL2 float fluid advection, pressure projection, vorticity confinement, deformable membranes and branching ribbons.
- Added artwork-driven reveal masks, weighted completion, mouse/keyboard/multi-pointer input, quality settings, and local preview launcher.
- Added repository audit, phase plan and measured validation with explicit video-reference gaps.

### Preserved

- Kept the legacy game entry, Gallery, QR UI and all supplied assets unchanged.
- Local-only delivery as requested; no Git initialization, commit or push. This extracted folder has no .git metadata.


## 2026-09-09 - Exhibition QR Access and Artwork Album

### Added

- Added QR code access for exhibition / demo use using the user-supplied local QR image, with no external QR service.
- Desktop gameplay now displays a QR code below the pause control; mobile gameplay keeps it hidden during active play.
- The pause screen now displays a larger, centered QR code below the panel on both desktop and mobile, hiding the gameplay QR.
- Added 11 user-supplied artworks, enlarged image previews for unlocked artwork, and an empty artwork-description area for future content.
- Added browser-local collection records: the first artwork is available initially and each successful round unlocks one more; failed rounds do not unlock artwork.

### Changed

- Replaced the Album placeholder with a Galgame-inspired gallery and a responsive CSS Grid masonry/Pinterest-like presentation preserving artwork proportions.
- Added strongly blurred locked artwork, a subtle hover zoom with a dark gradient glass overlay, and Japanese `未解放` status; locked artwork cannot open in the preview.
- Improved responsive behavior for Album and QR-code UI, including touch scrolling, portrait/landscape layouts, native-dialog focus handling, and Escape / close controls.
- Made the existing ending and failure screens scrollable on short viewports so their navigation remains reachable.
- Kept exhibition QR code UI in independent files and preserved existing game balance, backgrounds, and victory conditions.

## 2026-07-16 - Minimap and Mobile Boost Touch Fix

### Changed

- Moved the minimap to the upper-right area below the HUD on both PC and mobile layouts.
- Added direct pointer handling for the boost button so mobile players can boost while holding the joystick.

## 2026-07-16 - Mobile HUD and Joystick Refinement

### Changed

- Replaced the pause label with a CSS-drawn pause icon to avoid font fallback issues.
- Reduced the height and text size of the top HUD on desktop and mobile.
- Changed mobile joystick behavior so it defaults to the lower-left but appears at the player's touch point during play.
- Moved the minimap away from the boost button on mobile portrait screens.
- Increased mobile camera zoom-out by roughly 20% and synced canvas sizing with the visual viewport to reduce mobile stretching.
- Changed the player label from `墨` to `ボク`.
- Softened edge reveal compensation with scattered brush-like reveal marks instead of visible stepped bands.

## 2026-07-15 - Control Mode, Pause UI, and Performance Tuning

### Added

- Added an in-game pause button and pause menu with resume, home, and PC/mobile control mode switching.
- Added a functional mobile joystick that appears only in mobile control mode.

### Changed

- Keyboard direction input now overrides mouse steering while WASD or arrow keys are pressed.
- Changed the action button label from `墨噴射` to `加速`.
- Adjusted mobile HUD layout for landscape and portrait screens, with a wider portrait camera view.
- Softened edge-reveal compensation with feathered ink edges instead of hard rectangular bands.
- Reduced late-game ink particle load by lowering brush mark caps, mote caps, and per-mark grain density.

## 2026-07-15 - Reveal Loop and Artwork Ending Tuning

### Changed

- Restored NPC-to-NPC swallowing while adding NPC avoidance steering so they are less likely to collide directly.
- Changed repeated swallow reveals in already-painted areas to reveal from the map edges inward, creating a shrinking-frame style compensation.
- Lowered the victory reveal requirement from 80% to 75%.
- Changed the ending screen to show the original reference painting by default, preserving image aspect ratio with cropping instead of stretching.
- Repurposed the ending `画像変換` button into `筆跡`, toggling between the clean artwork and the painted trail version.

## 2026-07-15 - Growth Balance and Ending Detail Tuning

### Added

- Added a placeholder ending button for future artwork details (`作品詳細`).

### Changed

- Disabled NPC-to-NPC swallowing so NPC count stays stable during solo play.
- Doubled the player's growth from floating ink particles.
- Increased the player's painting reveal trail width by roughly one third across all sizes.
- Reduced heavy brush-particle spawning and per-mark grain density to improve runtime smoothness while keeping the wider ink trail.
- Confirmed the ending screen still displays the completed background painting.

## 2026-07-15 - HUD Progress and NPC Density Tuning

### Changed

- Reworked the HUD so the painting progress (`作画`) uses the center progress bar.
- Moved elapsed time to the far right and absorption count (`吸収`) to its left.
- Removed the ink amount bar from the main HUD.
- Increased NPC count from 15 to 23.
- Adjusted NPC spawn distribution so more NPCs appear across the whole map, including edges and corners.
- Increased reveal trail width scaling for larger player size, making painting completion faster as the player grows.

## 2026-07-14 - UI Language and Matte Behavior Tuning

### Changed

- Simplified the title screen by removing the subtitle and gameplay description text.
- Changed the title menu, HUD, action button, result buttons, and status text to Japanese UI wording.
- Changed the start transition so the title screen stays as a static layer while the ink matte reveals the gameplay layer underneath.
- Adjusted ink drop reveal mattes to keep a horizontal aspect ratio instead of stretching into a vertical oval.
- Adjusted the painting trail width so slower movement creates a thicker brush trace and faster movement creates a thinner trace.
- Changed the failure title to `Game Over`.

## 2026-07-14 - Ink Matte Overlay Assets

This update connects the external ink matte overlay assets to the current v2 demo.

### Added

- Added five ink drop matte videos from the `Drops` asset folder.
- Added five ink transition matte videos from `Transitions/Version 1` and `Transitions/Version 2`.
- Added random drop matte reveal animation when the player swallows an NPC ink body.
- Added random transition matte animation after pressing `START`.

### Changed

- The start sequence now fades the title UI and uses an ink matte overlay before entering gameplay.
- NPC swallow reveal is no longer only a circular reveal; it now uses animated ink matte masks when supported by the browser.
- Added fallback behavior so gameplay still works if a `.mov` matte video cannot be decoded.

## 2026-07-08 - v2 Objective Reveal Mode

This update keeps the original demo and adds a new playable version at `outputs/ink_demo_v2.html`.

### Added

- Added a 3-second black interlude after pressing `START` (temporary placeholder for a future intro animation).
- Added `outputs/ink_demo_v2.html` as a new version while keeping `outputs/ink_demo.html`.
- Updated `index.html` so GitHub Pages opens the new v2 demo by default.
- Added a painting reveal objective: the player must reveal the painting instead of only surviving a timer.
- Added reveal progress display in the HUD.
- Added a victory condition: become the largest ink body and reveal 80% of the painting.

### Changed

- Changed the round timer from countdown mode to elapsed-time mode.
- Slightly widened the player's reveal trail compared with the previous narrow brush trail.
- Strengthened the fogged-painting contrast: unrevealed areas are blurrier and revealed areas appear clearer.

### Gameplay

- Larger NPC ink bodies now erase the player's revealed painting trail when they pass over it.
- The player needs to grow large enough to control the map and restore erased painting areas.
- This creates a clearer goal: collect ink, grow, protect the revealed painting, and complete the image.

### GitHub

- GitHub Pages entry now points to the v2 demo.
- Added a GitHub Pages deployment workflow.
