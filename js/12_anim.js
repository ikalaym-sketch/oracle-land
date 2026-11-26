/* ==========================================================================
 * 神諭之地 重製版 — 12_anim.js
 * Version : r3.9.1  (2026-11-13)
 * 變更    : r3.9.1 A.draw 支援幀第 9 欄比例校正（逐動作量測後寫入圖集，修正同角色動作忽大忽小）。
 *           素材包 G.PACK：地圖／妖怪／NPC／職業外觀／物件 314 張小圖合併成 22 個 pk/*.wasm（二進位素材包；副檔名用 .wasm 只為了能被網站提供下載，內容不是程式）（a/packs.json 索引），
 *           第一次用到才下載該包、之後瀏覽器快取（包名含內容雜湊，沒改的包改版也不重抓）；圖片以 blob 切片解碼，用到哪張才解哪張。
 * 變更    : r3.9.0 頭目圖集索引（b_*）合併成 a/p/bosses.json，第一次進頭目戰才下載（之後快取）。
 * 變更    : r3.8.9 小單位（NPC／動物 n_*、物件 pr_*、fx_*）索引合併成 a/p/units.json，一次載入；發佈檔案數減少 69 個。
 * 變更    : r3.0.1 圖集網址加版本參數（避免快取舊錨點圖）。
 * 變更    : r3.0.0 新增。逐幀圖集播放器：每格獨立錨點(ax,ay)與毫秒(ms)；分頁圖集依需要載入。
 * 說明    : 圖集索引 a/p/*.json：{pages:[webp…], act:{名:{loop,hit,f:[[sx,sy,w,h,ax,ay,ms,page]],c:合約}}, fx:{…}, refH}
 *           ‧ 單位（unit）＝一把武器／一種敵人／共用特效；每張圖只抓 1 次，記憶體快取。
 *           ‧ 武器最多同時保留 2 把（目前＋上一把），其餘釋放圖片記憶體，避免手機吃滿 RAM。
 *           ‧ 播放：frameAt(rec, ms, durMs) 依原始不等時幀；durMs 可把整段時間縮放到合約長度。
 * ========================================================================== */
'use strict';
(function () {
  const ctx = G.ctx, BASE = 'a/p/';
  /* ---------- 素材包：小圖合併成 pk/*.wasm，第一次用到才下載整包（瀏覽器快取），圖片從包內切片解碼 ---------- */
  const PK = G.PACK = { idx: {}, blobs: {},
    ready: fetch('a/packs.json?v=' + G.VER).then(r => r.ok ? r.json() : {}).catch(() => ({})).then(j => { PK.idx = j; }),
    blob(f) { return PK.blobs[f] || (PK.blobs[f] = fetch(f).then(r => { if (!r.ok) throw new Error(f + ' ' + r.status); return r.blob(); })
      .catch(e => { delete PK.blobs[f]; throw e; })); },
    /* 圖片網址：在包內 → 切片 blob 網址；不在包內 → 原路徑＋版本參數 */
    src(path) { return PK.ready.then(() => { const e = PK.idx[path]; if (!e) return path + '?v=' + G.VER;
      return PK.blob(e[0]).catch(() => PK.blob(e[0])).then(b => URL.createObjectURL(b.slice(e[1], e[1] + e[2], 'image/webp'))); }); },
    /* 背景預先下載（不解碼）：之後要用的圖所在的包 */
    warm(path) { PK.ready.then(() => { const e = PK.idx[path]; if (e && !PK.blobs[e[0]]) PK.blob(e[0]).catch(() => {}); }); },
    /* 釋放 blob 網址（圖片丟棄時） */
    drop(im) { if (im && im.src && im.src.startsWith('blob:')) URL.revokeObjectURL(im.src); }
  };
  const A = G.ANIM = { U: {}, wait: {}, wpnLRU: [], IDX: null,
    /* 載入一個單位：json＋全部分頁（首頁先，其他背景） */
    load(key, json) {
      if (A.U[key] && A.U[key].ready) return Promise.resolve(A.U[key]);
      if (!json && !A.IDX) return A.idxP.then(() => A.load(key));
      if (!json && !A.IDX[key] && key.startsWith('b_') && !A.bossOK) return (A.bossP || (A.bossP = fetch(BASE + 'bosses.json?v=' + G.VER).then(r => r.ok ? r.json() : {}).catch(() => ({})).then(j => { Object.assign(A.IDX, j); A.bossOK = 1; }))).then(() => A.load(key));
      if (!json && !A.IDX[key] && key.startsWith('p_') && !A.ptOK) return (A.ptP || (A.ptP = fetch(BASE + 'partners.json?v=' + G.VER).then(r => r.ok ? r.json() : {}).catch(() => ({})).then(j => { Object.assign(A.IDX, j); A.ptOK = 1; }))).then(() => A.load(key));   // 夥伴圖集索引：第一次帶夥伴出戰才下載
      if (!json && A.IDX[key]) json = JSON.parse(JSON.stringify(A.IDX[key]));
      if (A.wait[key]) return A.wait[key];
      const p = (json ? Promise.resolve(json) : fetch(BASE + key + '.json?v=' + G.VER).then(r => { if (!r.ok) throw new Error(key + '.json ' + r.status); return r.json(); }))
        .then(j => { const u = A.U[key] = Object.assign({ key, imgs: [], ready: false }, j);
          return Promise.all(u.pages.map((src, i) => new Promise((ok, ng) => { const im = new Image(); im.decoding = 'async';
            im.onload = () => { u.imgs[i] = im; ok(); }; im.onerror = () => ng(new Error('載入失敗：' + src)); PK.src(BASE + src).then(s => { im.src = s; }, ng); })))
            .then(() => { u.ready = true; delete A.wait[key]; return u; }); })
        .catch(e => { delete A.wait[key]; throw e; });
      return (A.wait[key] = p);
    },
    idxP: null,
    free(key) { const u = A.U[key]; if (!u) return; for (const im of u.imgs) if (im) { PK.drop(im); im.src = ''; } delete A.U[key]; WHITE.clear(); },
    /* 武器：最多保留 2 把 */
    useWeapon(id) { const key = 'w_' + id; A.wpnLRU = A.wpnLRU.filter(k => k !== key); A.wpnLRU.unshift(key);
      while (A.wpnLRU.length > 2) A.free(A.wpnLRU.pop()); return A.load(key); },
    get(key) { const u = A.U[key]; return u && u.ready ? u : null; },
    /* 依時間取格：durMs 有值時整段縮放 */
    frameAt(rec, ms, durMs) { const f = rec.f, n = f.length; if (n === 1) return f[0];
      let tot = rec.tot; if (!tot) { tot = 0; for (const x of f) tot += x[6] || 66.7; rec.tot = tot; }
      const k = durMs ? tot / durMs : 1; let t = ms * k;
      if (rec.loop) t %= tot; else if (t >= tot) return f[n - 1];
      for (let i = 0; i < n; i++) { t -= f[i][6] || 66.7; if (t < 0) return f[i]; } return f[n - 1]; },
    dur(rec) { if (!rec.tot) A.frameAt(rec, 0); return rec.tot; },
    /* 繪製一格：(x,y)＝腳底；sc＝縮放；flip＝面左 */
    draw(u, fr, x, y, sc, flip, alpha) { const im = u.imgs[fr[7] || 0]; if (!im) return; if (fr[8]) sc *= fr[8];   // 第 9 欄＝逐動作比例校正（同角色各動作大小一致）
      ctx.save(); if (alpha !== undefined && alpha < 1) ctx.globalAlpha = alpha;
      if (flip) { ctx.translate(x * 2, 0); ctx.scale(-1, 1); }
      ctx.drawImage(im, fr[0], fr[1], fr[2], fr[3], x - fr[4] * sc, y - fr[5] * sc, fr[2] * sc, fr[3] * sc); ctx.restore(); },
    /* 受擊白閃剪影：每格做一次，上限 240 格（LRU） */
    white(u, fr) { const k = u.key + ':' + fr[7] + ':' + fr[0] + ',' + fr[1]; let c = WHITE.get(k);
      if (c) { WHITE.delete(k); WHITE.set(k, c); return c; }
      c = document.createElement('canvas'); c.width = fr[2]; c.height = fr[3]; const x = c.getContext('2d');
      x.drawImage(u.imgs[fr[7] || 0], fr[0], fr[1], fr[2], fr[3], 0, 0, fr[2], fr[3]); x.globalCompositeOperation = 'source-atop'; x.fillStyle = '#fff6e8'; x.fillRect(0, 0, fr[2], fr[3]);
      WHITE.set(k, c); if (WHITE.size > 240) WHITE.delete(WHITE.keys().next().value); return c; },
    /* 舊圖集（data.json 的赤鬼）轉成同格式單位 */
    legacy(key, img, clips, refH) { const act = {};
      for (const n in clips) act[n] = { loop: n === 'walk', f: clips[n].f.map(f => [f[0], f[1], f[2], f[3], f[4], f[5], f[6] || 80, 0]) };
      A.U[key] = { key, imgs: [img], pages: [], act, refH, ready: true }; }
  };
  const WHITE = new Map();
  A.idxP = fetch(BASE + 'units.json?v=' + G.VER).then(r => r.ok ? r.json() : {}).catch(() => ({})).then(j => { A.IDX = j; });
})();
