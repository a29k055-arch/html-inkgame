# 虾与乌龟精修 · R3

本轮只处理 shrimp_07 与 turtle_02。fish_04、dragon_04 的素材与动作参数保留。

- 虾转身：水平方向改变时连续收窄至侧面，再展开为相反朝向；完整身体、触须、足使用同一投影，避免瞬间跳到另一面。连续反向输入从当前姿态回转。
- 虾触须：三根长须独立提取，交叉处分别延续原须线，单根运动不会从另一根须上撕走一段。细短吻须保留在头胸层。
- 乌龟：完整独立龟壳覆盖四肢根部；重补前肢两侧及下缘，壳纹不再随脚旋转。肢根向壳内延伸，保持原来的慢速间歇划肢。

分层 PNG 均保留透明通道。原始选图 source.png 保留，修正图为 assembled-restored.png；网页使用 rig.json 指向的 textures/。没有更改游戏机制。

龟壳补图使用内置绘图工具，以原 turtle_02 为编辑目标，生成透明 shell-only 修复底稿。提示词：

> Edit this exact top-down Chinese ink wash turtle. Output only its complete shell, no head, legs or tail. Keep original canvas registration, shell pattern, pigment and texture. Remove leg/scaly traces at all four roots; complete a continuous natural rounded oval rim, especially upper-left, upper-right and lower corners. No triangular gouges or missing wedges. No redesign or icon simplification. Truly transparent background. The result is masked locally to repair only the rim of the approved source.

修复底稿：repair-plates/turtle_02_shell-r3.png；对齐稿：turtle_02_shell-r3-aligned.png。仅壳沿及关节区域融合新笔墨，壳中央图案保持选图。重建工具：tools/turtle-shell.cjs；逐根虾须：tools/shrimp-antennae.cjs。

视觉检查与转身记录放在 evidence/r3/；自动检查证明结构与连续性，不替代美术审阅。
