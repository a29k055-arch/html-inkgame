# 素材分辨率与4K母版

工作贴图用于网页实时动画；母版用于大尺寸贴图和后续加工。全部游戏贴图保留透明通道。

| 素材 | 原生像素 | 工作画布 | 4K母版画布 | 2倍屏幕原生细节建议长边 |
| --- | --- | --- | --- | --- |
| fish_04 | 1218 × 1292 | 1218 × 1292 | [3861 × 4096](masters/fish_04/assembled-restored.png) | 约 646 CSS px |
| dragon_04 | 1024 × 1536 | 1024 × 1536 | [2731 × 4096](masters/dragon_04/assembled-restored.png) | 约 768 CSS px |
| shrimp_07 | 1536 × 1024 | 1536 × 1024 | [4096 × 2731](masters/shrimp_07/assembled-restored.png) | 约 768 CSS px |
| turtle_02 | 1218 × 1292 | 1218 × 1292 | [3861 × 4096](masters/turtle_02/assembled-restored.png) | 约 646 CSS px |
| fish_01 | 1536 × 1024 | 1536 × 1024 | [4096 × 2731](masters/fish_01/assembled-restored.png) | 约 768 CSS px |
| fish_02 | 2172 × 724 | 2172 × 724 | [4096 × 1365](masters/fish_02/assembled-restored.png) | 约 1086 CSS px |
| fish_04_special | 1218 × 1292 | 1218 × 1292 | [3861 × 4096](masters/fish_04_special/assembled-restored.png) | 约 646 CSS px |
| turtle_08 | 1086 × 1448 | 1086 × 1448 | [3072 × 4096](masters/turtle_08/assembled-restored.png) | 约 724 CSS px |
| shrimp_04 | 1536 × 1024 | 1536 × 1024 | [4096 × 2731](masters/shrimp_04/assembled-restored.png) | 约 768 CSS px |
| shrimp_05 | 1536 × 1024 | 1536 × 1024 | [4096 × 2731](masters/shrimp_05/assembled-restored.png) | 约 768 CSS px |

4K是带透明度的高质量超采样导出，能平滑边缘、提高加工采样精度；原始笔墨纹理的细节上限仍由原生尺寸决定。它属于透明PNG位图，不是无限缩放矢量。

完整对齐4K图层保存在本地 masters/{id}/aligned/。网页/GitHub提供同像素内容的4K裁片和带bbox坐标的rig.json，可使用 tools/unpack-master.cjs 无损重建对齐画布。

网页默认工作贴图，减少手机解码内存；runtime也能直接加载 masters/{id}/rig.json。建议按敌人在屏幕中的像素尺寸选择贴图，使用双线性平滑采样，避免nearest像素采样。
