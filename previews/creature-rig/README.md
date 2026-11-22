本轮见 [R6 修订说明](MOTION_REPAIR_R6.md)：0.25～6倍缩放、拖动查看、工作/4K切换，鱼01头部、虾04朝向及龟08颈部修复。

最新版本 **R6 · 放大检查与关节修复**：新增 fish_01、fish_02、fish_04_special、shrimp_04、shrimp_05、turtle_08。原有四角色保留。详见 [第二批交付说明](BATCH2_DELIVERY.md) 与 [全部分辨率表](RESOLUTIONS.md)。

# 水墨生物 · 分层与可控动画

选定素材：**鱼 fish_04、龙 dragon_04、虾 shrimp_07、乌龟 turtle_02**。

上一轮修正版：**rig-r2-art-motion-20261120**。四类已增加限定补图与隐藏根部，鱼转向柔化、龙持续 S 形、虾左向镜像、乌龟慢速间歇划腿。详见 [本轮修正说明](MOTION_REPAIR_R2.md)。

**[在线演示（GitHub Pages）](https://a29k055-arch.github.io/html-inkgame/previews/creature-rig/?rev=rig-r6-zoom-and-joints-20261122)**。2026-11-20 已上传到原 html-inkgame 仓库，并在其 README 的测试链接区增加入口；在线查看无需启动本机服务。

运行 **StartDemo.ps1**，打开输出的本地网页地址。默认演示：[http://127.0.0.1:8912/demo/](http://127.0.0.1:8912/demo/)。方向键 / WASD / 右下角摇杆控制；下拉框可选自动游动、静止、原图和拉直姿态。

- [交付说明](DELIVERY.md)：文件、动作、演示和正式接入边界。
- [分层说明](LAYERS.md)：104 层工作 PNG、104 张裁切贴图及全部4K母版、支点和中心线。
- [网页接入示例](runtime/README.md)：实时输入、更新、绘制和资源释放。
- [测试记录](evidence/)：透明覆盖、方向控制、转向跟随、拉直及桌面/手机视口证据。

原图副本保留，运行用分层已定向补齐关节与身体裂口。现有游戏机制和 Unity 场景未改动。四个对象通过独立网页接口驱动；正式接入时将角色输入和渲染接口接入游戏。扩大到当前测试以外的极端关节动作仍需按实际画面继续检查。
