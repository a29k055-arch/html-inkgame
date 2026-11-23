# 《墨》竹简 UI 素材包

独立素材，未接入现有游戏菜单或加载流程。参考用户提供的两张竹简照片绘制全新无字竹简，保留木纹和穿绳孔；PNG 透明背景。

| 文件 | 分辨率 | 用途 |
| --- | --- | --- |
| bamboo-slip.png | 183 × 1436 | 每关一片，文字由游戏独立渲染 |
| bamboo-scroll-open-24.png | 4438 × 1436 | 24 片全展开的透明全图，用于静态展示或整体横移 |
| bamboo-roll-cross-section.png | 1122 × 1153 | 卷起竹简的轴向端面，不含铺开的尾部 |
| bamboo-scroll.css / bamboo-scroll.js | 自适应 | 无依赖的选关与加载演示组件 |

## 使用

网页中引入 `bamboo-scroll.css`，然后从 `bamboo-scroll.js` 导入：

```js
import { createLevelScroll, createBambooLoader } from './bamboo-scroll.js';
const levels = createLevelScroll(menuElement, [
  { name: '第一关', id: 1 },
  { name: '第二关', id: 2, locked: true }
], (level) => loadLevel(level.id));

const loader = await createBambooLoader(canvasElement);
// 绑定真实的加载进度，范围 0..1：
loader.setProgress(0.65);
loader.setProgress(1); // 100% 完全展开，没有剩余竹卷
```

选关组件根据关数生成竹片，支持鼠标拖动、触摸横滑、滚轮和键盘方向键。文字和选中状态不烘焙在 PNG 内。加载组件按照剩余卷面积的平方根计算半径；端面转动、外圈逐渐消失、展开段逐渐延长。其进度由调用方控制，未硬编码游戏加载时长。演示页中的播放按钮仅模拟 5.5 秒加载，用于预览。

Unity 可直接导入三个透明 PNG；拆分显示时建议 Preserve Alpha、Sprite 2D/UI、Clamp，避免过度有损压缩。全展开图最大纹理尺寸应设为 8192（防止 4438 像素宽自动缩小）。实际关数不受限制，运行时建议按关卡数据重复单片纹理。

演示链接：[`previews/bamboo-scroll/index.html`](../../../previews/bamboo-scroll/index.html)（通过 HTTP 打开）。
