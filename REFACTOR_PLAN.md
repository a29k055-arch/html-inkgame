# 当前进展补充：2026-10-06 第五轮

第四轮密度场方案已获得用户风格认可；当前主体使用material.js，body.js为历史对照。第五轮强化墨芯、统一尺寸、柔化互动，并采用中日同时显示。用户明确授权本轮GitHub发布，独立路径为/visual-effects/，旧首页保留。

远程已通过GitHub连接核实main=1bb02502f68b6fd99e28338ef183825711054443，与用户ZIP基线43个文件一致；实际本地文件夹仍无.git。此前“仅本地”和“main未核实”为历史，不再代表本轮授权和核实状态。

以下保留初始重构计划。

# 《墨》新版重构计划

核实日期：2026-10-06（Asia/Tokyo）。用户本轮确认：先在本地完成三个视觉原型，不同步 GitHub。

## Repository Audit

实际项目：`D:/ink_game_codex/html-inkgame-main/`。上级保留用户 ZIP。当前目录为解压副本，没有 `.git`；status / remote / log / HEAD 均无法获得，不初始化新仓库，不冒充 main 检查点。GitHub 网页读取失败，git ls-remote 网络连接失败，因此远程 main 尚未核实。

已阅读交接、日志、README、入口、主游戏、Gallery/QR 和 workflow；盘点 assets。旧游戏是原生 Canvas2D 单文件，当前入口仍为 outputs/ink_demo_v2.html；相册和展览 QR 独立。复用输入设计、画作资源、相册 ID/存储及 Pages；暂不迁移框架。

主要债务：主文件全局状态耦合、重复 drawWorld、暂停计时、帧率相关笔触、圆形主体、多点触控归属及画面存储容量。以上不等于本轮已修复。

## 本轮范围

独立入口 `prototypes/ink/index.html`：A 墨体；B 互动水墨；C 原画显影。旧首页与旧游戏原样保留作为 Legacy。此轮为 Phase 0/1，待用户视觉验收后推进 Phase 2，不实现完整游戏或多人服务器。

## 视频参考

参考：`D:/ink_game/VideoDemo1.1.mp4`，1920×1080，约5.04秒。通过浏览器解码并抽取六个时点查看。视觉特征：厚墨中心、透明薄膜、深色卷边、连贯长尾、波浪分叉、急转甩墨。它包含类似立体液膜的表现，二维流体无法直接等价复现。

## 架构

- src/fluid.js：WebGL2 浮点双缓冲，速度/墨密度平流、散度/压力投影、涡量约束、输入注入、扩散和消散。
- src/body.js：可变轮廓和连续分叉墨带；逻辑位置与渲染分离。
- src/paper.js：原画、目标墨区、累计 Reveal Mask、目标区域完成度。
- src/app.js：三种原型、输入、性能显示、质量切换和生命周期。
- src/config.js：统一视觉参数；未来 gameplay balance 在正式阶段单独建立。

高/均衡/省电调整模拟网格和压力迭代，保留相同流体机制。WebGL2 或浮点 framebuffer 不支持时明确显示不可用，不伪装为已成功运行。

## 后续阶段

2 新首页与 Loading → 3 砚（5分钟、统一实体+Controller、AI、微小重生、墨量独立、可配置惩罚、时间结算/排名奖励、清水缩圈、随机技能两槽）→ 4 宣纸（3分钟、基础墨保障、作品mask）→ 5 Gallery（沿用作品ID，Original/Best/History，IndexedDB Blob）→ 6 设备优化与音效 → 7 在单机验收后评估多人。

旧75%+最大体型通关属于 [LEGACY]，新版阶段循环为 [REPLACED] 设计方向，尚未在旧游戏实施。新规则优先于旧规则，但不回写旧玩法来伪装阶段完成。

## 验证与交付

使用同源本地 HTTP。检查鼠标/键盘/触摸、重置、切换、横竖屏和 resize、错误与 framebuffer 释放。性能记录必须区分本机浏览器与手机模拟视口，模拟不等于真机 GPU 性能。视觉差距保留给用户验收，不仅凭代码可运行判定完成。

本轮无 commit/push；用户后续授权同步时先定位 GitHub Desktop 的真实 clone、核实差异及远程，再仅提交相关文件。
