# 交接文档 · 2026-11-17 · 音频系统与测试修复

> 交接范围：从 `4ee8533`（上一份交接的基线）之后的全部改动，重点说明**本轮**（音频与测试修复）。
> 交付物：提交 `ce87e44`，发布键 `v4-audio-r10`，线上 <https://a29k055-arch.github.io/html-inkgame/v4/>。
> 本文档给 Codex 用于排查与后续开发。**请先读「当前状态」和「遗留问题」两节。**

---

## 一、当前状态速览

| 项 | 状态 |
|---|---|
| 线上可访问 | ✅ 正常（`v4-audio-r10`，首页可进，已验证截图） |
| 单元测试 | **33 通过 / 12 失败**（失败全部为历史遗留，见第五节） |
| 音频 | ✅ 程序化 BGM（3 首）+ 五声音阶音效，无外部音频文件 |
| 移动端 | ⚠️ 仅无头浏览器验证过布局，**未上真机** |

---

## 二、本轮改动（2026-11-17）

### 1. 修复被破坏的测试 `tests/v4-nov7-mechanics.mjs`

**原因**：上一轮我用脚本批量替换符号（`temp.cells` → `m.cells`）时，把该文件里的变量名改没了，导致 `ReferenceError: m is not defined`。这是我的 bug。

**修复内容**：
- 补回遮罩别名 `const m=mask`。
- 删除对已存在但已无此方法/概念的调用（`temp.update`、`temp.erode`、`fading.cells`、`C.temporaryHold`）。
- 把「临时显画停留窗口」的断言替换为永久显画契约：**时间流逝不得改变任何像素**，只有「离开 + 重新进入」才可重绘。
- 胜利阈值断言从硬编码 65% 改为读取 `config.completionThreshold`（现值 75%）。
- 生态半径断言从 `[5.5, 80]` 改为 `[3, 280]`，并对漂浮体的 `mass = r²×10` 做了兼容。

**同时修复了一个真实缺陷**：`TemporaryReveal` 的「防回填」逻辑此前是**半迁移状态**——`erasedContact` 永远不会被赋值（没有人通知它某格被侵蚀了），所以站在被 NPC 擦掉的区域上会立刻涂回去。现在：
- `RevealMask` 新增 `erasedAmount[]`，`brush(..., erase=true)` 时记录侵蚀后的值，非侵蚀写入抬高该格时清空。
- `TemporaryReveal.applyContact` 读取 `mask.erasedAmount`：刚被侵蚀的格子不接受同一帧的残留 alpha。

涉及文件：`src/reveal/mask.js`、`src/reveal/temporary.js`、`tests/v4-nov7-mechanics.mjs`

### 2. BGM（程序化合成，无音频文件）

新增 `src/reveal/bgm-audio.js`，用 Web Audio 实时合成古筝风格背景乐：

- **3 首曲子**（`TRACKS`）：`山`（D 宫、52bpm、偏疏散）、`水`（G 羽、44bpm、更空）、`松`（A 宫、60bpm、偏密）。
- 音高来自**五声音阶**（宫商角徵羽 = 0/2/4/7/9 或 0/3/5/7/10 半音），每首有固定根音与低音持续音（drone）。
- 发声是**拨弦合成**：三角波主体 + 高八度正弦泛音 + 低通从亮到暗的快速扫频 + 三段指数衰减，模拟古筝「起音亮、余音长」。
- 调度：`setInterval(140ms)` + 0.9s 前瞻排程，随机休止让句子有呼吸；`density` 控制音符密度。
- **不循环固定片段**，所以长时间听不会明显重复。
- 生命周期：首次用户手势（`pointerdown`）或进入对局时 `unlock()`，符合浏览器自动播放策略。

### 3. 音效改为五声音阶拨弦

改写 `src/reveal/pickup-audio.js` 的发音体：

- 删除原来的「水滴」合成（正弦扫频 + 噪声水花）。
- 新增 `pluckNote()` 与 `PENTATONIC`，音效改为**古筝拨弦**，音高在五声音阶内行走：
  - 吃食物 → 宫/商
  - 吃敌人 → 角/徵
  - 拾取道具 → 羽
  - 连续发声会沿音阶上行，避免机械重复。
- 保留原有对外 API（`play(kind, volume)` / `unlock` / `setVolume` / `dispose`），调用方无需改动。
- 新增 `setMuted(bool)`。

### 4. 设置页：BGM / 音效两条独立音量

**结构变更**（`index.html` 设置对话框）：

- 原来的单条 `#volume` 拆成两条：
  - `#bgmVolume`（BGM 音量）
  - `#sfxVolume`（音效音量）
- 每条右侧是「喇叭按钮 + 百分比」，喇叭在百分比**前面**：
  - `#bgmMute` / `#sfxMute`，内联 SVG 喇叭，两态（有声 / 静音划线）。
- 文案新增三语键：`bgmVolume`、`sfxVolume`、`muteAudio`。

**静音逻辑（关键，容易改错）**：

- 喇叭按钮**只切换布尔标志**（`settings.bgmMuted` / `settings.sfxMuted`），**不改动音量数值**。
- 因此再次点击是**恢复之前的音量**，而不是回到默认值——因为数值从未被清零。
- 拖动滑块时若数值 > 0，会自动解除对应静音。
- 实际增益：`gain = muted ? 0 : volume`。

**持久化**：`settings` 新增 `bgmVolume`（默认 .28）、`bgmMuted`、`sfxMuted`，随 `saveSettings()` 写入存档。
旧的 `settings.volume` 语义保留为**音效音量**（默认 .3），所有旧引用已改为 `#sfxVolume`。

涉及文件：`index.html`、`src/reveal/app.js`、`src/ui/i18n.js`、`src/ui/game.css`

---

## 三、涉及文件清单（本轮）

| 文件 | 变更 |
|---|---|
| `src/reveal/bgm-audio.js` | **新增**：程序化 BGM 合成与调度 |
| `src/reveal/pickup-audio.js` | 音效改为五声音阶拨弦；新增 `pluckNote`、`PENTATONIC`、`setMuted` |
| `src/reveal/mask.js` | 新增 `erasedAmount[]`（防回填所需） |
| `src/reveal/temporary.js` | 读取 `erasedAmount`，恢复防回填契约 |
| `src/reveal/app.js` | BGM 实例与解锁、双音量接线、静音开关、设置默认值 |
| `index.html` | 设置页两条音量行 + 喇叭按钮 |
| `src/ui/i18n.js` | 新增 `bgmVolume` / `sfxVolume` / `muteAudio` 三语 |
| `src/ui/game.css` | `.vol-row` / `.mute-btn` 样式与静音态 |
| `tests/v4-nov7-mechanics.mjs` | 修复语法破坏 + 迁移到永久显画契约 |

---

## 四、BGM 与音效资源说明

- **没有任何音频文件**。`assets/` 下不存在 `.mp3/.ogg/.wav`，全部为运行时 Web Audio 合成。
- 因此：无版权风险、无额外下载体积、无 404 可能。
- 调参入口集中在两处：
  - BGM：`src/reveal/bgm-audio.js` 顶部 `TRACKS`（根音、音阶、bpm、密度、音量）。
  - 音效：`src/reveal/pickup-audio.js` 的 `pluckNote()` 与 `play()` 内的映射表。
- 若日后要换成真实录音：把文件放进 `assets/audio/`，用 `Audio()` 或 `decodeAudioData` 替换 `BgmAudio.pump()` 的调度即可，设置逻辑无需改动。

---

## 五、测试现状（12 个失败，均为历史遗留）

**我没有修改这些文件**（按用户要求，等确认后再动）：

| 测试 | 失败原因 | 性质 |
|---|---|---|
| `deep-presets` | 断言默认预设是 `drift`，现为 `longcloud` | 过期常量 |
| `deep-reveal` | 调用已删除的 `temporary.update` | 机制已移除 |
| `reveal-balance` | 断言「诊断不落墨」，但 Drop 现在会落墨 | 前提失效 |
| `reveal-run` | 旧 boost 语义（一次性+冷却） | 契约变更 |
| `v4-four-growth` | 旧阈值与停留表 | 过期常量 |
| `v4-growth-ecology` | 旧的绝对半径分带 | 过期常量 |
| `v4-growth-stages` | 旧阈值/镜头公式 | 过期常量 |
| `v4-nov6` | 依赖旧半径映射 | 过期常量 |
| `v4-nov9-mechanics` | `holdUntil` 已删 | 机制已移除 |
| `v4-nov10-mechanics` | 同上 | 机制已移除 |
| `v4-pace` | `TemporaryReveal` 已无计时 | 机制已移除 |
| `v4-reveal-layers` | 双层显画契约已变 | 机制已移除 |

`v4-nov7-mechanics` 本轮已修复并通过。

---

## 六、本轮之前的改动摘要（Codex 需要知道的上下文）

以下改动发生在上一份交接之后，会显著影响排查：

1. **永久显画**：删除临时层计时（`holdUntil/coverage/deadline`），显画只写 `RevealMask`，只有 NPC 侵蚀能擦除。
2. **线性体型**：`reserveRadius` 支持 `rules.sizeLinear`；V4 为 `r = 12 + 0.0175×ink`，上限 280。
3. **四阶段**：阈值 `846 / 4200 / 9000`；阶段内 zoom 恒定，第四阶段才允许镜头越界看边框。
4. **晕染**：按住加速 + 按体型扣墨；按住 ≥1 秒释放墨斑并进入冷却（1–3 秒）；不足 1 秒无冷却。
5. **吞噬判定**：V4 比较**可见半径**（刺球视觉 1.0r、碰撞核 0.73r），经典模式仍用碰撞核。
6. **生态**：分带相对玩家半径（50% 小 / 30% 同级 / 15% 大 / 5% 特大），特大只在开局预置。
7. **软失败**：首次被吞只掉 35% 墨。
8. **完成条件 75%**，完成后有过场动画 + 可缩放画作查看层。
9. **加载器**：权重表与 `track()` 必须一一对应；`track` 超时降级而不是中断启动（曾因权重多一项导致整页打不开）。

---

## 七、遗留问题与建议排查顺序

**优先级 1（功能性风险）**

1. **移动端未上真机**：只在无头 Edge（390×844、360×640）验证过布局。需要确认：
   - iOS Safari 的 `env(safe-area-inset-*)` 与 `backdrop-filter`；
   - 低端 Android 上 1250 个食物实体的磁吸循环性能；
   - 两个音量滑块的触摸区域是否够大（当前 26px 喇叭按钮偏小，建议 ≥40px）。
2. **BGM 在移动端可能被系统静音**：iOS 的 Web Audio 需要用户手势解锁，当前已用 `pointerdown` 一次性唤醒；但**切后台再回来**时上下文可能被挂起，尚未处理 `visibilitychange` 恢复。
3. **BGM 音量默认 .28 未经听感校准**：合成音色偏亮，长时间可能疲劳，建议实测后下调。

**优先级 2（体验）**

4. **12 个遗留测试**：建议按「过期常量 → 机制已移除」两批处理。
5. **画作预热**：当前只预热前 4 幅，弱网下首屏仍可能偏慢。

**优先级 3（设计）**

6. 晕染的消耗爬升曲线（1 秒 28%）与释放范围系数是估算值，需要真人手感校准。
7. 第四阶段镜头越界比例（17%）与第三阶段取景的关系可用实机截图再确认。

---

## 八、给 Codex 的排查提示

- 线上版本与 `versions.json` 的 `root` 必须一致；不一致说明 Pages 构建失败，去 Actions 看 `Deploy to GitHub Pages` 这一步（近期出现过一次该步骤失败，重跑即可）。
- **改动 `index.html` 的加载权重表时，务必同步 `loading.track()` 调用**，否则 `finish()` 会因「有项未完成」而拒绝，整页显示加载失败。
- 音频相关改动请在**真实浏览器**验证，无头环境的音频与自动播放策略不可靠。
- 本地跑测试：`for f in tests/*.mjs; do node "$f"; done`（无测试框架，逐文件执行）。
