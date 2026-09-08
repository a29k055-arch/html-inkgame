(() => {
  "use strict";
  // User-supplied artwork. IDs are stable across future reordering; no invented attribution.
  const artworks = [
  {
    "id": "ink-13",
    "label": "作品 01",
    "src": "assets/gallery/ink-13.png",
    "width": 1175,
    "height": 499
  },
  {
    "id": "ink-01",
    "label": "作品 02",
    "src": "assets/gallery/ink-01.jpg",
    "width": 690,
    "height": 1056
  },
  {
    "id": "ink-06",
    "label": "作品 03",
    "src": "assets/gallery/ink-06.png",
    "width": 952,
    "height": 1464
  },
  {
    "id": "ink-07",
    "label": "作品 04",
    "src": "assets/gallery/ink-07.png",
    "width": 741,
    "height": 1586
  },
  {
    "id": "ink-08",
    "label": "作品 05",
    "src": "assets/gallery/ink-08.png",
    "width": 821,
    "height": 1618
  },
  {
    "id": "ink-10",
    "label": "作品 06",
    "src": "assets/gallery/ink-10.png",
    "width": 813,
    "height": 1596
  },
  {
    "id": "ink-09",
    "label": "作品 07",
    "src": "assets/gallery/ink-09.png",
    "width": 548,
    "height": 1512
  },
  {
    "id": "ink-11",
    "label": "作品 08",
    "src": "assets/gallery/ink-11.png",
    "width": 439,
    "height": 1640
  },
  {
    "id": "ink-12",
    "label": "作品 09",
    "src": "assets/gallery/ink-12.png",
    "width": 965,
    "height": 499
  },
  {
    "id": "ink-04",
    "label": "作品 10",
    "src": "assets/gallery/ink-04.png",
    "width": 2774,
    "height": 1275
  },
  {
    "id": "ink-05",
    "label": "作品 11",
    "src": "assets/gallery/ink-05.png",
    "width": 2622,
    "height": 1269
  }
];
  const storageKey = "boku.album.unlocked.v1";
  let unlocked = new Set([artworks[0].id]);
  let storageAvailable = true;
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
    if (Array.isArray(saved)) for (const id of saved) if (artworks.some(a => a.id === id)) unlocked.add(id);
  } catch { storageAvailable = false; }

  const gallery = document.createElement("dialog");
  gallery.className = "boku-gallery"; gallery.id = "boku-gallery";
  gallery.setAttribute("aria-labelledby", "boku-gallery-title");
  gallery.innerHTML = `<div class="boku-gallery-inner"><header class="boku-gallery-header"><h1 id="boku-gallery-title">アルバム</h1><button class="ink-button secondary" id="boku-gallery-back" type="button">ホーム</button></header><p class="boku-gallery-note" id="boku-gallery-note"></p><div class="boku-gallery-grid"></div></div>`;
  const lightbox = document.createElement("dialog");
  lightbox.className = "boku-lightbox"; lightbox.id = "boku-lightbox";
  lightbox.setAttribute("aria-labelledby", "boku-preview-title");
  lightbox.innerHTML = `<header class="boku-preview-header"><span class="boku-preview-title" id="boku-preview-title"></span><button type="button" class="boku-preview-close" aria-label="閉じる">× 閉じる</button></header><div class="boku-preview-layout"><img class="boku-preview-image" alt=""><aside class="boku-art-description" aria-label="作品紹介"></aside></div>`;
  document.body.append(gallery, lightbox);
  const grid = gallery.querySelector(".boku-gallery-grid");
  let lastColumns = 0;
  let opener = null;
  const openArtwork = (art, button) => {
    if (!unlocked.has(art.id)) return;
    opener = button;
    lightbox.querySelector(".boku-preview-title").textContent = art.label;
    const img = lightbox.querySelector("img");
    img.src = art.src; img.alt = art.label;
    lightbox.showModal();
  };
  const render = () => {
    const count = innerWidth <= 440 ? 1 : innerWidth <= 820 ? 2 : innerWidth <= 1100 ? 3 : 4;
    lastColumns = count;
    grid.replaceChildren();
    const columns = Array.from({ length: count }, () => {
      const column = document.createElement("div"); column.className = "boku-gallery-column"; grid.append(column); return column;
    });
    const heights = Array(count).fill(0);
    for (const art of artworks) {
      const isUnlocked = unlocked.has(art.id);
      const button = document.createElement("button");
      button.type = "button"; button.className = "boku-art"; button.dataset.artwork = art.id;
      button.setAttribute("aria-label", `${art.label}${isUnlocked ? "を開く" : "：未解放"}`);
      button.setAttribute("aria-disabled", String(!isUnlocked));
      const frame = document.createElement("span"); frame.className = "boku-art-image";
      const img = new Image(); img.src = art.src; img.alt = ""; img.loading = "lazy"; img.decoding = "async";
      img.width = art.width; img.height = art.height; frame.append(img);
      if (!isUnlocked) {
        const lock = document.createElement("span"); lock.className = "boku-art-lock"; lock.textContent = "未解放"; frame.append(lock);
      }
      const label = document.createElement("span"); label.className = "boku-art-label";
      label.textContent = `${art.label}${isUnlocked ? "" : " · 未解放"}`;
      button.append(frame, label);
      button.addEventListener("click", () => openArtwork(art, button));
      const col = heights.indexOf(Math.min(...heights));
      columns[col].append(button);
      heights[col] += art.height / art.width + .22;
    }
    gallery.querySelector("#boku-gallery-note").textContent = `収集 ${unlocked.size} / ${artworks.length} · クリアするたびに作品を1枚解放します。${storageAvailable ? "" : " この環境では収集記録を保存できません。"}`;
  };
  document.getElementById("albumBtn").onclick = () => { render(); gallery.showModal(); };
  gallery.querySelector("#boku-gallery-back").onclick = () => gallery.close();
  lightbox.querySelector("button").onclick = () => lightbox.close();
  lightbox.addEventListener("click", e => {
    const r = lightbox.getBoundingClientRect();
    if (e.target === lightbox && (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)) lightbox.close();
  });
  lightbox.addEventListener("close", () => { lightbox.querySelector("img").removeAttribute("src"); opener?.focus(); });
  // Keep album keys/touches out of the game's global input listeners; native dialogs handle Escape/focus.
  for (const dialog of [gallery, lightbox]) {
    for (const event of ["keydown", "keyup", "touchstart", "touchmove"]) dialog.addEventListener(event, e => e.stopPropagation());
  }
  addEventListener("resize", () => {
    const count = innerWidth <= 440 ? 1 : innerWidth <= 820 ? 2 : innerWidth <= 1100 ? 3 : 4;
    if (gallery.open && !lightbox.open && count !== lastColumns) render();
  });
  lightbox.addEventListener("close", () => {
    const count = innerWidth <= 440 ? 1 : innerWidth <= 820 ? 2 : innerWidth <= 1100 ? 3 : 4;
    if (gallery.open && count !== lastColumns) render();
  });
  // One event per successful round; no changes to movement, balance, backgrounds or victory conditions.
  document.addEventListener("boku:round-complete", () => {
    const next = artworks.find(art => !unlocked.has(art.id));
    if (!next) return;
    unlocked.add(next.id);
    try { localStorage.setItem(storageKey, JSON.stringify([...unlocked])); }
    catch { storageAvailable = false; }
  });
})();
