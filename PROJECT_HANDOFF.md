# 墨—BOKU— Project Handoff

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
