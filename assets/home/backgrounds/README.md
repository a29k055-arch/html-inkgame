# 首页背景素材

将新素材放在本目录，再在 `src/data/backgrounds.js` 的 `HOME_BACKGROUNDS` 添加一条记录。

```js
{id:'bamboo',src:new URL('../../assets/home/backgrounds/bamboo.png',import.meta.url).href,label:'竹影',public:true}
```

用于 Gallery 解锁的背景附加 `artworkId`，并设 `public:false`。`artworkId` 必须对应 `src/data/artworks.js` 的稳定 ID。设置中支持固定、随机、35 秒轮换、仅已解锁作品。Gallery 已解锁作品可直接选作固定背景。图片加载完成后才替换，失效素材不会清空当前背景。

UI 只读背景管理器；画作位于菜单下层。背景由独立HomeArtwork读取原图，鼠标/手指移动或点击产生最多1.1px的局部波纹重采样；不读取NPC、游戏流场或绘制蒙版，中央淡纸层为标题与菜单保留安静空间。横竖屏等比 cover 裁切；长卷可能被裁切，不拉伸。

当前使用已有荷花原画与山水素材。两张菜单参考图没有作为整页背景使用；图 A 原样复制的素材仅通过 CSS 视窗显示标题。
