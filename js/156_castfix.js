/* =====================================================================
 * 156_castfix.js
 * 版本    : r3.139.0  (2026-11-27)
 * 說明    : 劇情演員補完——新劇情（r3.130～r3.137）講話的人都要「先到位、再說話」。
 *           1. 沒有專屬圖的角色：指定路人圖（含小孩 n_renta／n_yuzukichi）；劍士的亡魂半透明。
 *           2. 小河童：用河童長者的圖縮成 0.6（原本被比對成河童頭目 → 變大）。
 *           3. 頭目角色在「不是自己頭目戰的地圖」講話：大小改回 1.0（原本 1.2～1.3）。
 *           4. 任務點站人：受傷的人魚＝鬼女圖（白衣女子，雪女在白沙上看不清）；最後一隻式神＝紙鶴（x2_ling 的 shiki_crane）。
 *           5. 等人到位：對話開始時，登場演員還在載入／走位 → 對話框先不出現、點擊無效、字不跑；最多等 2 秒。
 *           ‧ 只有聲音的（回聲、雷之聲、雪的聲音、道摩的聲音）與道摩回憶裡的過去人物不站人（刻意）。
 * 依賴    : 59_stage（G.STAGE.on）、67_cast（G.CAST.unit）、53_quest（Q.STAT／marks）、05_dialog、86_fx2（VX.draw2）
 * ===================================================================== */
(function () {
  const ST = G.STAGE, CA = G.CAST, Q = G.QST, A = G.ANIM, SC = G.SC, VX = G.VX, ctx = G.ctx; if (!ST || !Q) return;
  /* ---------- 1・2：名字 → 圖 ---------- */
  const AMB = { '半兵衛': 'n_t_human_carrier', '村長': 'n_t_human_elder', '老爺爺': 'n_p_gohei', '阿菊': 'n_p_kinu', '阿吉': 'n_jinzo', '鈴緒': 'n_suzuo',
    '宿場的老闆': 'n_sakubei', '放牛的孩子': 'n_renta', '鬼族的孩子': 'n_yuzukichi', '鬼族的攤販': 'n_t_oni_veteran', '鬼族的大叔': 'n_t_oni_veteran',
    '鬼灘': 'n_t_oni_veteran', '人類的攤販': 'n_stall_vendor', '劍士的亡魂': 'n_toma', '時雨': 'n_t_human_clerk' };
  const ANI = { '小河童': { k: 'an', key: () => 'n_t_kappa_mentor', hk: 0.6 }, '受傷的人魚': { k: 'an', key: () => 'e_kijo', hk: 0.9, en: 'kijo' } };
  const GHOST = { '劍士的亡魂': 0.55 };
  const pre = t => { if (t && G.ASSET && G.ASSET.enemies && G.ENEMY_IDX && G.ENEMY_IDX[t]) G.ASSET.enemies([t]); };
  if (CA && CA.unit) { const u0 = CA.unit; CA.unit = function (n) { if (AMB[n]) return { k: 'amb', u: AMB[n] }; const f = ANI[n]; if (f) { pre(f.en); return f; } return u0.apply(this, arguments); }; }
  /* 任務點站人：人魚用立繪（Q.STAT），進圖先載鬼女圖 */
  if (Q.STAT) Q.STAT['受傷的人魚'] = ['e_kijo', 0.9];
  const en0 = SC.enter; SC.enter = function (id) { if (id === 'W_R10_05') pre('kijo'); return en0.apply(this, arguments); };
  /* 最後一隻式神：文字改成紙鶴 */
  { const q = Q.by && Q.by.dg_izumo, s = q && q.steps.find(x => x.key === 'dg_shiki');
    const fix = L => { for (const l of L || []) { if (l && typeof l.text === 'string') l.text = l.text.replace('一隻紙做的小狐狸', '一隻白色的紙鶴').replace(/紙狐狸/g, '紙鶴').replace('繞著你轉了一圈，往夜空飛去', '繞著你飛了一圈，往夜空飛去'); if (l && l.choice) for (const c of l.choice) fix(c.then); } };
    if (s) { fix(s.lines); for (const o of s.opts || []) fix(o.lines); } }
  /* ---------- 3・5：登場後修正大小、等到位 ---------- */
  let wait = 0, last = new Map();
  const ready = () => { for (const o of ST.on) { const a = o.a; if (!a) return false; if (a.npc) { if (a.walking) return false; continue; } if (a.amb) continue;
      if (!a.u) return false; const p = last.get(a), moved = !p || Math.abs(p[0] - a.x) > 0.5 || Math.abs(p[1] - a.y) > 0.5; last.set(a, [a.x, a.y]); if (moved) return false; } return true; };
  const fixSize = () => { for (const o of ST.on) { const a = o.a; if (!a) continue; if (GHOST[o.name] != null) a.alpha = GHOST[o.name];
      if (a.anim && !o.boss && a.hk > 1.05 && !(G.PARTY && G.PARTY.DEF && Object.values(G.PARTY.DEF).some(D => D.name === o.name))) a.hk = 1; } };
  const D = G.DLG, st0 = D.start; D.start = function () { const r = st0.apply(this, arguments); last = new Map(); wait = ST.on.length ? 120 : 0; fixSize(); return r; };
  const busy = () => { if (!wait) return false; fixSize(); if (--wait <= 0 || ready()) { wait = 0; return false; } return true; };
  const s0 = D.step, t0 = D.tap, d0 = D.draw;
  D.step = function () { if (busy()) return; return s0.apply(this, arguments); };
  D.tap = function () { if (wait) return; return t0.apply(this, arguments); };
  D.draw = function () { if (wait) return; return d0.apply(this, arguments); };
  /* ---------- 4：紙鶴 ---------- */
  const df0 = G.drawFx; G.drawFx = function () { const r = df0.apply(this, arguments);
    try { if (VX && VX.draw2 && SC.id === 'Q_kyoto_night') for (const m of Q.marks) if (m.label === '最後一隻式神' && !m.dead) VX.draw2(ctx, 'shiki_crane', Math.floor(G.t / 6) % 4, m.x, m.y - 70 + Math.sin(G.t / 20) * 6, 1.1, { flip: G.H.x < m.x }); } catch (e) {}
    return r; };
})();
