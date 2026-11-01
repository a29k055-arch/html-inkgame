# 卷轴显画重构：当前状态

2026-11-02算法检查点已接成完整一局。先读PROJECT_HANDOFF.md最新章节；11-01尚未接入结论已过期。

- 分支codex/reveal-scroll-rework；稳定基线d882581，main不合并。
- index为新显画，classic保留旧玩法，三份视觉参考不改。
- 18套模型、桌面/手机视口整局结算和刷新Gallery通过。
- 本机 http://127.0.0.1:4190/ 。公开预览 /previews/reveal-scroll/ 以Handoff发布补记为准。
- B站已观看14/15/16秒，评论/源码受限；根首页故障未复现，artistic404与无WebGL加载失败路径已确认。
- 待办：实体手机/Safari、长尾美术反馈、低端GPU/长时间内存。不要重新启用Boss/抽卡。
