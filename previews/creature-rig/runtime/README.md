# 网页水墨生物运行时

此模块是独立的实时 2D 木偶/网格变形实现：WebGL 绘制连续身体网格，Canvas 2D 合成附属层；不需要 Live2D SDK、Flash、打包器或外部引擎。分层 PNG 和 `rig.json` 可单独替换，原始游戏逻辑没有修改。演示入口是 `../demo/index.html`，需要通过本地 HTTP 服务访问。

## 接入已有网页游戏

```js
import { InkCreature } from './runtime/ink-creature.mjs';

const creature = await InkCreature.load('./dragon_04/rig.json', {
  x: 600, y: 180, length: 420, speed: 110
});

// 游戏循环：dt 是秒；坐标与 draw 使用同一个 Canvas 坐标系。
function update(dt, joystickX, joystickY) {
  creature.setInput(joystickX, joystickY); // -1..1，斜向自动限幅
  creature.update(dt);
}
function render(ctx) {
  creature.draw(ctx); // 只画透明主体，不清画布、不画背景
}

// 调试与换装/工具面板
creature.setMode('straight'); // 精确拉直，用于检查龙身中性姿态
creature.setMode('idle');     // 停止平移，保留轻微自然动作
creature.setMode('manual');   // 恢复输入驱动
creature.setMode('rest');     // 直接查看原始候选图
creature.setLayerOffset('dragon_04_whisker_l', { rotation: .04, opacity: 1 });
console.log(creature.snapshot());
console.log(creature.visualBounds()); // 当前身体、触须、四肢的保守边界，可用于摄像机取景
creature.dispose();          // 角色卸载时释放独占资源/共享资源引用
```

`length` 是从源脊线头端到尾端的实际显示弧长，单位与画布坐标一致。`speed` 是每秒显示坐标单位。输入 `(0, 0)` 通过阻尼减速，不瞬间停住。方向输入驱动速度与朝向，持续转向会沿身体向尾部延迟传播。实际游戏可在 `draw()` 前设置摄像机变换，也可直接使用已有碰撞和角色管理系统提供的方向输入。

运行时的 `auto` 模式沿用调用方提供的方向输入；演示中的巡游轨迹由 `demo.mjs` 提供。嵌入游戏时不需要加载演示页面或演示 UI。

## 可动画化结构

- 原图的曲线脊线先转成弧长参数；源像素投影到“沿脊线距离 + 法线距离”，再映射到当前目标骨架。因此龙的 S 形身体可以展开为直线，也可以重新弯向相反方向。
- 鱼、龙、虾的头、身体各段与尾部 PNG 在载入时合成一张连续透明贴图，用共享骨架网格变形，避免相邻硬切分层在弯曲时裂开。头前部约 15% 的目标骨架保持接近刚性，主要弯曲从躯干开始。交付的各层仍是独立文件，便于后续重绘和换装。
- 鳍、足、须、角等附属层按各自枢轴附着到身体骨架。它们具有不同的幅度、相位和跟随参数。乌龟壳保持刚性，头、四肢和尾巴独立活动。
- 鱼的运动摆幅高于虾，龙有更长的转向传播延迟和多段波动，虾只做很轻的腹节与须臂动作，乌龟主要用交替四肢划动表现移动。静止也有轻微动态。
- `setLayerOffset()` 控制独立附属层的额外旋转和透明度。合并进连续网格的头/身体/尾段使用共享骨架控制，不能通过此方法单独旋转。若要增加独立表情或复杂头部运动，应在下一轮额外补画/扩展局部骨架。

## 格式与数据约定

`rig.json` 至少包含：

```json
{
  "id": "dragon_04",
  "source": "source.png",
  "sourceSize": [1024, 1536],
  "spine": [[517, 95], [522, 189], [528, 285]],
  "layers": [{
    "name": "dragon_04_whisker_l",
    "file": "dragon_04_whisker_l.png",
    "kind": "antenna",
    "pivot": [476, 111],
    "side": -1,
    "phase": 0,
    "order": 2
  }]
}
```

脊线从头到尾，坐标均基于未裁切源画布。`file` 指向与源画布对齐的完整透明 PNG；可选 `croppedFile` + `bbox: [x,y,width,height]` 指向对应的小纹理，运行时优先加载后者。身体多段均使用同一连续网格；独立附属层使用 `pivot` 定义源画布中的关节。

## 性能和边界

- 默认用 WebGL 一次索引三角网格绘制身体，再合成到调用方的 Canvas 2D 画布；附属层用 Canvas 2D 刚性变换。没有外部运行时依赖。网格按有效 Alpha 区域裁减，空白三角形不绘制。
- 网格共享顶点和边，按预乘 Alpha 正确合成，避免 Canvas 三角裁剪在淡墨中留下深浅网格线。WebGL 绘制表面共享，纹理/缓冲按源图片引用计数复用。
- WebGL 不可用或上下文丢失时，自动降级到 Canvas 网格，仍能操控；此回退模式可能有轻微三角边线，推荐正常支持 WebGL 的现代浏览器。`snapshot().renderer` 可检查实际采用的路径。
- 附属层载入后裁切为小画布，避免长期保留每层完整源画布。相同 rig URL 的同时存活实例共用源图、身体贴图和网格资源；最后一个实例 `dispose()` 时释放缓存。每个实例有自己的姿态、输入和临时渲染画布。
- 同时展示大量龙等长身体角色时，应在实际设备上测量网格变形和画布合成成本；当前共用 WebGL 表面但按角色逐个合成，未来可以保留相同 PNG/rig 数据做场景级批量绘制。WebGL 回退下的多三角 Canvas 绘制尤其应限制角色数量。
- 此包保留所选原图的笔墨。关节是原像素切分后的动画准备版本，尚未人工补画所有被遮挡的身体结构；附属层转幅刻意受限。若未来要求大幅翻转、肢体完全伸出或离开当前俯视平面，仍需补画遮挡区域。
- `update()` 的大步长限制为 0.1 秒，避免浏览器后台恢复时突然跳跃。主机游戏仍应使用稳定的时间步长或切后台暂停。

## 验证

`math.test.mjs` 覆盖脊线采样/外推、投影逆映射、角度回绕、60/120 Hz 响应一致性、四类姿态有限值和龙身精确拉直。浏览器方向输入、移动摇杆与画面证据由包内 `tools/validate*.cjs` 与 `evidence/` 提供。
