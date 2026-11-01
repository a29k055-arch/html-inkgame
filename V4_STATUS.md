# V4 阶段记录（2026-11-02）

当前分支codex/reveal-scroll-rework从1faf41f继续；工作区初始干净。冻结v2-scroll=d882581、v3-reveal=1faf41f，checkpoint/v4-before-1faf41f保留。尚不把未验证的URL填写为已上线。

已实现：短时Hero Ink；引用冻结2d00e16参考的求解器/材质，不改归档；去掉正式游戏额外圆形裁切与碰撞虚线。HeroInkFluid共享配置将尾部耗散改1.7，放大时连续注墨半径/强度适度收窄，避免浓度饱和成圆盘。正式游戏和visual-effects/v4.html共用同一createRevealRenderer、MaterialInk/Fluid和CometTrail；历史参考保持原样。

三层严格独立：CometTrail约1.8～2秒、900世界路程/160点；TemporaryReveal按实际coreRadius扫掠胶囊，512列网格，单格30秒保持+5秒淡出、重走刷新；Permanent Reveal只接玩家吞敌事件，max并集、敌人可侵蚀。合成max(permanent,temporary)，进度只计当前permanent。移动不再产生永久初始大补丁。

吞敌半径=min(680,190+4.2×目标逻辑核心半径)，2.2秒多簇软边扩散；普通食物只有小型池化Drops。敌人不论是否移动均按实际核心半径侵蚀两层，永久alpha按exp(-.018×dt×soft)衰减，临时层同时侵蚀基值以免下一帧恢复。

地图：V4可选boundarySliding，投影到圆形核心合法范围、去除朝墙速度、保留沿边分量，成长后再限位。AI丢弃无法吞到的角落目标，投影追击点，受阻0.65秒后重新规划并短时脱困；旧版默认规则不变。NPC成长封顶130、食物成长×.65，玩家速度衰减由38%改22%，避免全图NPC都顶到与玩家相同尺寸而不可吞。

8分钟、62%永久显画触发完成；22AI/650食物；三组正常规则路线模拟150/162.5/261秒完成，吞敌25～29，AI互吞15～27。非人工难度认证。模型已过：三层独立计时/半径/永久保持、大小/四角/多NPC脱困、旧吞噬/AI；全套和真实桌面/手机完整验证仍在收尾。

护盾/加速使用原创SVG，地图与HUD共用；恢复历史createFood四种shape与旋转，通过四种缓存自然墨滴/飞溅/笔触渲染。未引入新抽卡或技能树。

版本打包tools/package-versions.cjs：v2固定tag、v3固定tag、v4当前HEAD，资源全量自含，无共享可变路径；旧/previews/reveal-scroll仍固定V3。预览分支根页取main，main正式发布根页取HEAD。deploy-pages与预览都用同一打包器，避免下次main部署误删版本目录。

下一步：检查全套tests、真实PC完整局和手机结果，推送tags/安全阶段提交；验证Pages三路径后填写README实际链接，并把已验证版本发布至main。B站本次直接访问受限；沿用此前实际14～16秒观察与截图，未取得作者源码，不声称本次重新观看成功。
