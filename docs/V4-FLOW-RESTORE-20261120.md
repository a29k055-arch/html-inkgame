# V4 原生水墨恢复记录

## 2026-11-20 — V4 恢复连续原生水墨 [CURRENT]

发布键 `v4-native-flow-r15`。用户确认r14灰纹黑圆片仍错误，尾部节状感也不可接受；本轮以用户两图重新审视，之前灰阶/黑像素测量不能等价于美术通过。

- 正式预设改N restored：原始流体display，主体/拖尾共用真实密度场。M的solid display只留作明确标识的旧对照，不进入正式路径。H/I历史参数与归档保持不变。
- 实际连续墨源直接取投影coreRadius×.88（Gaussian核宽度），不再随速度/体型缩窄；大体型只降低最多25%灌墨强度。逻辑碰撞、成长公式、NPC红圈未改。不是在显示层补画一个圆。
- 正式GPU不再叠CPU轨迹尾；关闭旋转位置每.13秒补墨、周期侧向与旋流驱动力，仅保留求解器涡度/真实运动惯性。大体型远侧浓墨加速稀释，停止时保留原有消散。CPU降级保留必要的历史尾，不能因GPU的opacity=0使降级拖尾消失。
- 验证：44组跟随摄像机PC/手机×四体型×速度/转弯/停止，实体内.9r区域alpha≥.7覆盖率最低约81%，这是流体覆盖下限检查，不是逐像素圆或用户美术签收。8组实际游戏core投影/显画同步、8组画框GPU/降级裁切通过；实际观察小体型转弯、大体型运动与停止截图。
- 玩法提案修订：A是可独立完成的纯吞噬方向，不是必然通往B；共通反馈打磨之后，B须另行确认。A不加黑洞。黑洞仅在弹幕生态分工获认可时引入。优先一时一个读招对象、原型12弹上限、不友伤、不显画/侵蚀；没有实施任何玩法机制。
- 详见docs/V4-FLOW-RESTORE-20261120.md、已修订docs/V4-GAMEPLAY-PROPOSAL-20261119.md。最终审美与真机、自然5–7分钟节奏仍待验证。

## 两张截图的判断

图1灰纹圆片与r14显示包络一致，但截图本身不包含运行SHA，不能仅凭截图证明浏览器缓存版本。图2属于主体、尾部共享浓度场的旧风格，无法唯一定位到某个提交。已同轨迹比较H/I/L/M，恢复该渲染方式，不宣称整仓回滚即可逐图复刻。

## 根因与范围

r13增加的solidBody display解析圆包络将主体与流体割裂，r14在圆内加噪声仍没有撤掉圆周。原实际灌墨半径还会按体型/速度缩窄，导致看见的核与逻辑核不符。节状纹不能全部归因于大体型分支：小体型也存在旧周期补墨/侧向力与额外CPU尾叠加。新N仅对正式路径消除这些驱动；没有声称流体所有自然涡卷都应被抹平。

变更文件：hero-presets.js、hero-ink.js、hero-cloud-shaders.js、reveal/renderer.js（CPU降级尾可见性），发布importmap；没有改玩法和碰撞。

## 可复跑检查

- node tools/check-v4-restored-flow.cjs [base]：36组PC＋8组触控，四半径18/90/170/280、相对速度.35/1/1.5、直行/转向/停止，摄像机逐帧跟随并重投影。验证无displayDisk、无GPU叠加CPU尾、12FBO、实际密度覆盖。
- node tools/check-v4-solid-live.cjs [base]：8组实际游戏验证正式restored、core投影一致与mask提交同步。
- node tools/check-v4-world-clip.cjs [base]：8组PC/手机横竖画GPU/降级裁切。
- tests/v4-restored-flow.mjs：验证正式走原生display、Gaussian源按真实半径成长，而非显示层圆片。
- 其他目标脚本：v4-player-solid、v4-npc-solid、v4-swing-tail（M对照轨迹契约仍保留）、v4-render-system、deep-presets、collision-camera、v4-permanent-reveal。

{
  "cases": 44,
  "minCoverage": 0.8131059337089488,
  "errors": []
}

原r14的check-v4-body-wash以及M圆片的黑像素半径测试是历史对照，不能作为N正式美术验收。正式测试需要实际观察主体尾部连接、转弯和停止，不通过噪声方差代替艺术判断。截图/JSON在本地work/restore-flow和work/solid-live，不提交大幅二进制。
