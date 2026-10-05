(() => {
  "use strict";
  const hud = document.getElementById("hud");
  const pause = document.getElementById("pauseScreen");
  const control = document.getElementById("pauseBtn");
  const makeQR = (id, caption) => {
    const figure = document.createElement("figure");
    figure.id = id; figure.className = "boku-qr";
    const img = new Image();
    img.src = "assets/exhibition/qr-code.jpg";
    img.alt = "用手机扫描即可游玩";
    img.width = 256; img.height = 256;
    figure.append(img);
    if (caption) {
      const text = document.createElement("figcaption");
      text.textContent = "扫码游玩";
      figure.append(text);
    }
    return figure;
  };
  const small = makeQR("boku-game-qr", false);
  hud.append(small);
  const stack = document.createElement("div");
  stack.className = "boku-pause-stack";
  stack.append(pause.querySelector(".pause-panel"), makeQR("boku-pause-qr", true));
  pause.append(stack);
  pause.classList.add("boku-exhibition-pause");
  const sync = () => {
    small.hidden = getComputedStyle(pause).display !== "none" || getComputedStyle(document.getElementById("interlude")).display !== "none";
    const rect = control.getBoundingClientRect();
    small.style.left = `${rect.left}px`;
    small.style.top = `${rect.bottom + 12}px`;
  };
  const observer = new MutationObserver(sync);
  for (const el of [hud, pause, document.getElementById("interlude")]) observer.observe(el, { attributes: true, attributeFilter: ["style"] });
  new ResizeObserver(sync).observe(control);
  addEventListener("resize", sync);
  sync();
})();
