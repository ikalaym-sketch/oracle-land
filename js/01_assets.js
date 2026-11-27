/* ==========================================================================
 * 神諭之地 重製版 — 01_assets.js
 * Version : r3.138.0  (2026-11-27)　r3.138.0：開機多載首頁背景 title_bg（富士山頂上半部）
 * 舊版    : r3.9.1  (2026-11-13)
 * 變更    : r3.9.1 圖片網址改經 G.PACK.src（在素材包內就從包切片）。
 * 變更    : r3.0.1 主角頭像換新版（武士・平常），舊頭像停用；素材網址加版本參數避免快取舊圖。
 * 變更    : r3.0.0 主角改用武器圖集（12_anim）：開機只載入目前武器＋共用特效＋本章妖怪；舊 hero.webp 不再載入。
 * 變更    : r2.0.0 加鐵心頭像。
 * 變更    : r1.1.0 加載神社背景、NPC 圖集（小雪／阿松／勘婆／權爺／小太）與其頭像。
 * 說明    : 素材載入器——data.json＋圖集一次載入（每張只抓 1 次，之後全用記憶體快取），顯示進度。
 *           之後各章素材包以 G.ASSET.pack(list) 分批載入，不重複抓已載入的圖。
 * ========================================================================== */
'use strict';
G.ASSET = {
  done: 0, total: 0,
  img(k, src) {
    if (G.IMG[k]) return Promise.resolve(G.IMG[k]);
    this.total++;
    return new Promise((ok, ng) => { const i = new Image(); i.decoding = 'async';
      i.onload = () => { G.IMG[k] = i; this.done++; ok(i); }; i.onerror = () => ng(new Error('載入失敗：' + src)); G.PACK.src(src).then(s => { i.src = s; }, ng); });
  },
  pack(list) { return Promise.all(list.map(([k, s]) => this.img(k, s))); },
  /* 妖怪圖集：依名單載入（索引已在 enemies.json，一次讀取） */
  enemies(list) { return Promise.all(list.filter(t => G.ENEMY_IDX && G.ENEMY_IDX[t]).map(t => { this.total++;
    return G.ANIM.load('e_' + t, G.ENEMY_IDX[t]).then(u => { u.refE = 140; this.done++; }).catch(e => { this.done++; console.warn(e); }); })); },
  legacy() { if (G.D && G.D.akaoni && G.IMG.akaoni && !G.ANIM.get('e_akaoni')) { G.ANIM.legacy('e_akaoni', G.IMG.akaoni, { walk: G.D.akaoni.walk, attack: G.D.akaoni.atk }, 168); G.ANIM.U.e_akaoni.refE = 168; } },
  boot() {
    this.total++;
    const data = fetch('a/data.json?v=' + G.VER).then(r => { if (!r.ok) throw new Error('data.json ' + r.status); return r.json(); }).then(j => { G.D = j; this.done++; });
    const fonts = document.fonts ? Promise.race([Promise.all([document.fonts.load('900 20px "Noto Serif TC"'), document.fonts.load('700 16px "Noto Sans TC"')]), new Promise(r => setTimeout(r, 2500))]) : 0;
    const S = G.SAVE.data, wid = (S && S.rpg && S.rpg.weapon) || 'katana';
    const step = p => { this.total++; return p.then(x => { this.done++; return x; }); };
    const anim = Promise.all([step(G.ANIM.useWeapon(wid)), step(G.ANIM.load('fx_common')),
      step(fetch('a/p/enemies.json?v=' + G.VER).then(r => r.json())).then(j => { G.ENEMY_IDX = j; return this.enemies(G.FOES_BOOT || []); })]);
    return Promise.all([data, fonts, anim, this.pack([
      ['akaoni', 'a/akaoni.webp'], ['shiro', 'a/shiro.webp'],
      ['face_soma', 'a/face_soma.webp'], ['face_shiro', 'a/face_shiro.webp'], ['npc', 'a/npc.webp'],
      ['face_xue', 'a/face_xue.webp'], ['face_matsu', 'a/face_matsu.webp'], ['face_okan', 'a/face_okan.webp'], ['face_gen', 'a/face_gen.webp'], ['face_kota', 'a/face_kota.webp'], ['face_smith', 'a/face_smith.webp'],
      ['hub_shrine', 'a/hub_shrine.webp'],
      ['W_R01_01', 'a/W_R01_01.webp'], ['W_R01_03', 'a/W_R01_03.webp'], ['W_R01_04', 'a/W_R01_04.webp'], ['W_R01_07', 'a/W_R01_07.webp'], ['title_bg', 'a/title_bg.webp']
    ])]).then(r => { this.legacy(); return r; });
  }
};
