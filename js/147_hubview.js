/* =====================================================================
 * 147_hubview.js
 * 版本    : r3.129.0  (2026-11-27)
 * 說明    : 兩岸城外觀切換（白天／夜間／戰火／重建，四張圖同配置、共用可走遮罩）。
 *           ‧ 規則：結局後＝重建；第 11 章起（黃泉漫進城）＝戰火；祭典或第 8 章夜市旗標＝夜間；其他＝白天。
 *           ‧ G.HUBV.force 可由劇情暫時指定（祭典、夜市演出），設 null 回到自動。
 *           ‧ 戰火：下方木橋已斷，橋面設為不可走（只能走上方橋過河）。
 *           ‧ 只在進入兩岸城時判斷一次（包裝 G.ASSET.img），不做每幀檢查。
 * 依賴    : 01_assets（G.ASSET.img）、25_walk（G.WALK）、18_world（進場載圖）
 * ===================================================================== */
(function () {
  const ID = 'hub_city', F = () => (G.SAVE.data && G.SAVE.data.flags) || {};
  const V = G.HUBV = { force: null, cur: null,
    opts: [['自動', null], ['白天', ''], ['夜間', 'night'], ['戰火', 'ruin'], ['重建', 'rebuild']],
    state() { if (V.force != null) return V.force; const f = F();
      if (f.end || f.ending) return 'rebuild';
      if (f.ch11) return 'ruin';
      if (f.fest_night || f.ch8_market_night) return 'night';
      return ''; },
    /* 劇情或測試指定外觀；在城裡就重新進場套用 */
    set(s) { V.force = s; if (G.SC.id === ID) G.SC.trans = { t: 0, to: ID, at: [G.H.x, G.H.y] }; } };
  /* 戰火時斷掉的下方木橋（橋面） */
  const BROKEN = [[1100, 598], [1372, 598], [1372, 682], [1100, 682]];
  function mask(s) { const W = G.WALK, k = W && W.M[ID]; if (!k) return;
    if (!k.m0) k.m0 = k.m.slice();
    const want = s === 'ruin' ? 'ruin' : ''; if (k._st === want) return; k._st = want;
    k.m.set(k.m0);
    if (want) for (let j = 0; j < k.h; j++) for (let i = 0; i < k.w; i++) if (G.inPoly((i + 0.5) * k.s, (j + 0.5) * k.s, BROKEN)) k.m[j * k.w + i] = 0;
    k.d = W.dist(k.m, k.w, k.h); }
  const img0 = G.ASSET.img.bind(G.ASSET);
  G.ASSET.img = function (k, src) { if (k !== ID) return img0(k, src);
    const s = V.state(); mask(s);
    const im = G.IMG[ID]; if (im && im._st !== s) { G.PACK.drop(im); delete G.IMG[ID]; }
    V.cur = s;
    return img0(k, s ? 'a/m/' + ID + '_' + s + '.webp' : src).then(i => { i._st = s; return i; }); };
  /* 已載過的城再進來：外觀不同就重新載圖（18_world 只在 _ready 為假時載） */
  const en0 = G.SC.enter;
  G.SC.enter = function (id, at) { if (id === ID) { const d = G.D.scenes[ID], im = G.IMG[ID]; if (d && d._ready && (!im || im._st !== V.state())) d._ready = false; }
    return en0.call(this, id, at); };
})();
