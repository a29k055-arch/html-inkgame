# 《墨》竹简 UI 素材包

# 交付版本：选关 R3 / 加载 R2

独立、可复用的美术素材和网页组件。参考用户提供的两张竹简照片绘制全新无字竹简，保留木纹和穿绳孔；PNG 透明背景。两套功能共享木纹和风格，不依赖演示关数或游戏流程。

索引：[`manifest.json`](manifest.json)（素材尺寸、模块、版本及接口）。两套功能保持同一资产路径，方便后续迁移。

| 文件 | 分辨率 | 用途 |
| --- | --- | --- |
| bamboo-slip.png | 183 × 1436 | 每关一片，文字由游戏独立渲染 |
| bamboo-scroll-open-24.png | 4438 × 1436 | 24 片全展开的透明全图，用于静态展示或整体横移 |
| bamboo-roll-cross-section.png | 1122 × 1153 | 静态卷竹简端面美术参考；新版动画无需独立滚筒贴图 |
| bamboo-scroll.css / bamboo-scroll.js | 自适应 | 无依赖的选关 R3 与加载 R2 正式素材组件 |

## 使用

网页中引入 `bamboo-scroll.css`，然后从 `bamboo-scroll.js` 导入：

```js
import { createLevelScroll, createBambooLoader } from './bamboo-scroll.js';
const levels = createLevelScroll(menuElement, [
  { name: '第一关', id: 1 },
  { name: '第二关', id: 2, locked: true }
], (level) => loadLevel(level.id));

const loader = await createBambooLoader(canvasElement);
levels.select(0, true); // 程序选中并滚动到关卡位置
// 绑定真实的加载进度，范围 0..1：
loader.setProgress(0.65);
loader.setProgress(1); // 100% 完全展开，没有剩余竹卷
// 离开界面时：
levels.destroy();
loader.destroy();
```

### 选关竹简 R3

- 根据关数动态生成竹片，每片对应一个关卡。文字、关卡数据、锁定和选中状态与美术分离。
- 鼠标、触摸及触控笔横向拖动，松手后按速度逐渐减速；滚动到边缘立即停下。纵向触摸仍可正常滚动外层页面；触控板原生横向滚动不会被重复叠加惯性。
- 选中的竹片在约 215ms 内平滑抬起（桌面默认 10px、手机 8px），带温和增亮、投影及朱砂选中标记。两根束绳根据实际穿绳孔一起发生连续弯曲；切换时旧竹片自然复位。
- 拖动与点击区分，避免滑动结束误选关卡；支持键盘方向键和减少动态效果设置。

可选第四个参数：`createLevelScroll(viewport, levels, onSelect, {decayMs:155, maxSpeed:2.2, liftPx:10, inertia:true})`。速度单位为 CSS 像素/毫秒、衰减时间单位为毫秒。默认配置为轻微惯性，非弹簧回弹。其他方法：

| 接口 | 用途 |
| --- | --- |
| `select(index, reveal = false)` | 设置当前关卡；可选居中显示 |
| `scrollBy(direction)` | 左右平滑移动（-1 / +1） |
| `stopMotion()` | 中止正在进行的滚动 |
| `buttons` | 访问现有关卡按钮（名称、锁定或附加数据） |
| `destroy()` | 清除监听、动画和组件 DOM |

旧版本的前三个参数与返回的 `select`、`scrollBy`、`buttons` 保持兼容；外部更新 `aria-pressed` 时，选中位移与绳索也会同步更新。接入后可以用真实关卡数量替换演示的 24 关。

### 连续竹简加载动画 R2

加载动画使用由同一组竹片构成的连续竹简链，不再分别绘制圆卷和展开段。每一片竹片在固定的材质坐标上，随进度沿螺旋路径转过切点、逐渐压平；相邻竹片共享两侧接点，前后段相切。所有竹片使用相同风格的木纹，背面连续填充避免透明缝隙。卷径由未展开的实际材质长度决定，最后一片逐渐放平，100% 时全部竹片共线、等高、首尾严密连接。

进度由调用方控制，未硬编码游戏加载时长。演示页中的播放按钮仅模拟 5.5 秒加载，用于预览。几何函数 `buildBambooGeometry(width, height, progress)` 也是公开的，可用于移植到 Unity 等引擎。它返回固定数量的竹片共享接点、厚度及展开长度，可直接用来构造一张连续的网格。

### Unity 及后续接入

Unity 可直接导入三个透明 PNG；拆分显示时建议 Preserve Alpha、Sprite 2D/UI、Clamp，避免过度有损压缩。全展开图最大纹理尺寸应设为 8192（防止 4438 像素宽自动缩小）。运行时建议用 ScrollRect + 每关独立竹片；选中竹片向上移动约自身高度的 2%，重新计算连接到每片两处穿绳孔的绳索曲线。加载动画请移植几何函数并用单片纹理对连续四边形网格贴图，不要用独立圆卷和越来越长的进度条拼接。当前包提供 Unity 可导入美术和移植所需的参数、算法，不含 Unity 场景或已绑定的 C# 脚本。

### 验收

- `node previews/bamboo-scroll/test-menu-motion.mjs`：惯性正反向、帧率无关性、衰减与停止。
- `node previews/bamboo-scroll/test-geometry.mjs`：5 种尺寸、1001 个进度状态，检查连接和 100% 完整摊平。
- 桌面鼠标和移动触摸实际浏览器检查：拖动后继续滑行、最终停止、不误选关卡、选中抬起与束绳同步，R2 加载动画正常播放。

演示链接：[`previews/bamboo-scroll/index.html`](../../../previews/bamboo-scroll/index.html)（通过 HTTP 打开）。
