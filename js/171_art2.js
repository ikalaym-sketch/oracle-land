/* ==========================================================================
 * 神諭之地 重製版 — 171_art2.js
 * Version : r3.231.0  (2026-11-28)　r3.231.0：新增。接上夥伴補圖（動作 16 組、專長特效 15 張、心事物件與信物 12 張）
 * 內容    : ・圖集 x2_pt（a/p/x2_pt.json＋兩頁圖）：夥伴動作放在 act、特效放在 fx。
 *           ・夥伴動作：只接在第一階外型（p_<id>_1）——補圖是照第一階外型畫的，Lv25、Lv50 換裝後沿用原本動作。
 *             把動作格複製進夥伴自己的圖集（另開圖片物件，避免圖集被回收時互相影響），依招式的判定時點重排每格時間：
 *             命中格對齊第一個判定；判定拖得久的招式（治療、護衛）中段兩格來回停留，不會提早收招。
 *             白丸：普攻＝撲咬／前爪輪流、留門護側與迎矢護肩＝架盾、仁王留門＝長嚎；汐音：普攻＝撥弦、治療類＝祈唱、連攜＝甩尾；
 *             茨木：普攻第三段＝鬼臂橫掃（由 167 呼叫）、有界共擔＝躍起砸地；葛葉：普攻＝揮扇、祓除與印位＝展扇結印。
 *           ・小雷獸：跟隨寵物與心事關卡改用小雷獸自己的圖（原本用雷獸王縮小）。
 *           ・心事調查點：木屐、石塔、舊灶、井（a/p/objs），用 G.OBJX 依標籤擺上。
 *           ・信物：心事完成後，夥伴頁「心事」顯示信物圖與名稱。
 *           ・G.ART2.fx(名稱, 參數)：播 x2_pt 的特效；圖集還沒載好時回傳 false，呼叫端用原本的特效頂著。
 * 依賴    : 12_anim、49_party（PY.cast／DEF）、88_rune（G.AFX）、89_obj（G.OBJX）、163_heart（G.HEART.page）。
 * ========================================================================== */
'use strict';
(function () {
  const A = G.ANIM, PY = G.PARTY, SC = G.SC; if (!A || !PY || !PY.DEF) return;
  const UNIT = 'x2_pt'; let X = null, asked = 0;
  const need = () => { if (X && A.get(UNIT) === X) return X; const u = A.get(UNIT); if (u) return (X = u); X = null; if (!asked && A.IDX) { asked = 1; const q = A.load(UNIT); if (q && q.then) q.then(() => { asked = 0; }, () => { asked = 0; }); } return null; };
  /* 動作：[命中格, 可停留的格] */
  const MOT = { bite: [3, []], paw: [3, []], guard: [2, [3, 4]], howl: [3, [4, 5]], strum: [3, []], heal: [3, [4, 5]], tailslap: [3, []], sweep: [3, []], slam: [5, [6, 7]], roar: [3, [4]], fanthrow: [3, []], seal: [4, [5, 6]] };
  const SID = { shiro: { ordinary: ['bite', 'paw'], command: 'guard', A2: 'guard', A3: 'howl' }, shion: { ordinary: 'strum', B2: 'strum', autonomous: 'heal', command: 'heal', A2: 'heal', A3: 'heal', smallCombo: 'tailslap', B4: 'tailslap' },
    ibaraki: { grandCombo: 'slam' }, kuzuha: { ordinary: 'fanthrow', B2: 'fanthrow', autonomous: 'seal', command: 'seal', A2: 'seal', A3: 'seal', B3: 'seal' } };
  function inject(id) { const u = A.get('p_' + id + '_1'), x = need(); if (!u || !x || !x.act) return null; if (u._pt === 2) return u; if (u._pt === 1) return null; u._pt = 1;
    const base = u.imgs.length, ims = x.imgs.map(im => { const n = new Image(); n.decoding = 'async'; return n; }); let left = ims.length;
    const ok = () => { if (--left > 0 || A.get('p_' + id + '_1') !== u) return; for (const im of ims) u.imgs.push(im); for (const c in x.act) if (c.indexOf(id + '_') === 0) u.act['pt_' + c.slice(id.length + 1)] = { loop: false, f: x.act[c].f.map(f => { const g = f.slice(); g[7] = base + (f[7] || 0); return g; }) }; u._pt = 2; };
    ims.forEach((n, i) => { n.onload = ok; n.onerror = () => { u._pt = 0; }; n.src = x.imgs[i].src; }); return null; }
  /* 依判定時點重排每格時間 */
  function fit(u, m, sid, evs) { const key = 'pt_' + m + '@' + sid; if (u.act[key]) return key; const src = u.act['pt_' + m], d = MOT[m]; if (!src || !d) return null; const F = src.f, I = d[0], hold = d[1], first = Math.max(60, evs[0] || 240), last = evs[evs.length - 1] || first, out = [];
    const put = (i, ms) => { const g = F[i].slice(); g[6] = Math.round(ms); out.push(g); }; let t = 0;
    for (let i = 0; i < I; i++) { put(i, Math.max(45, first / I)); t += Math.max(45, first / I); } put(I, 110); t += 110;
    if (hold.length) { let j = 0; do { put(hold[j % hold.length], 130); t += 130; j++; } while (t < last + 160 && j < 60); }
    for (let i = Math.max(I, hold.length ? hold[hold.length - 1] : I) + 1; i < F.length; i++) put(i, 80);
    u.act[key] = { loop: false, f: out }; return key; }
  const stage1 = P => { try { return PY.DEF[P.id].unit(P) === 'p_' + P.id + '_1'; } catch (e) { return false; } };
  const clip = (P, m, sid, evs) => { if (!stage1(P)) return null; const u = inject(P.id); return u ? fit(u, m, sid, evs) : null; };
  let alt = 0; const c0 = PY.cast; PY.cast = function (P, ch, why) { let back = null;
    try { const map = SID[P.id], kit = G.PKIT && G.PKIT[P.id]; if (map && kit) { const sid = PY.variant ? PY.variant(P.id, ch) : ch, sk = kit[sid] || kit[ch]; let m = map[kit[sid] ? sid : ch];
        if (m && sk && sk.ev && sk.ev.length) { if (Array.isArray(m)) m = m[alt++ % m.length]; const nm = clip(P, m, sid, sk.ev.filter(e => !e.after).map(e => e.t)); if (nm) { back = [sk, sk.clip]; sk.clip = nm; } } } } catch (x) { }
    const r = c0.apply(this, arguments); if (back) back[0].clip = back[1]; return r; };
  /* 特效 */
  const fx = (n, o) => { const x = need(), AF = G.AFX; if (!x || !AF || !x.fx[n]) return false; return AF.play(UNIT, n, o || {}); };
  const fr = (n, i, x, y, o) => { const q = need(), AF = G.AFX; return !!(q && AF && q.fx[n] && AF.fr(UNIT, n, i, x, y, o)); };
  G.ART2 = { fx, fr, clip, need, UNIT, ok: n => { const x = need(); return !!(x && (x.fx[n] || x.act[n])); } };
  /* 心事調查點的物件 */
  const OB = [[/折斷的木屐/, 'img:obj_broken_geta'], [/路邊的石塔/, 'img:obj_five_stupas'], [/塌了一半的舊屋/, 'img:obj_old_hearth']], ox0 = G.OBJX;
  G.OBJX = function (l) { for (const [re, n] of OB) if (re.test(l)) return n; if (SC.id === 'W_R11_03' && /^井邊$|井蓋上的野菊/.test(l)) return 'img:obj_well_kiku'; return ox0 ? ox0(l) : null; };
  /* 信物：心事完成後顯示在夥伴頁 */
  const KEEP = { shiro: ['item_old_gate_bell', '舊門的鈴'], shion: ['item_crooked_robe', '歪袖的巫女服'], ibaraki: ['item_wild_chrysanthemum', '野菊'], kuzuha: ['item_borrowed_charcoal', '借來的炭'], hayate: ['item_arashi_feather', '嵐丸的白羽'], yorimitsu: ['item_blank_stupa', '沒刻字的石塔'], enno: ['item_three_onigiri', '三個飯糰'] }, KIM = {};
  (function hk() { const HT = G.HEART; if (!HT || !HT.page) return setTimeout(hk, 100); const p0 = HT.page; HT.page = function (pid, x, y, w, h) { p0.apply(this, arguments);
      try { const k = KEEP[pid]; if (!k || HT.state(pid) !== 3) return; let im = KIM[k[0]]; if (!im) { im = KIM[k[0]] = new Image(); im.src = 'a/p/objs/' + k[0] + '.webp?v=' + G.VER; } const fs = G.FS(), S2 = 52 * fs, bx = x + w - 14 - S2 - 10, by = y + 64 + 14 + Math.min(h - 64 - 60, 150 * fs) - S2 - 10, c = G.ctx;
        if (im.complete && im.naturalWidth) { const s = Math.min(S2 / im.naturalWidth, S2 / im.naturalHeight); c.drawImage(im, bx + (S2 - im.naturalWidth * s) / 2, by + (S2 - im.naturalHeight * s) / 2, im.naturalWidth * s, im.naturalHeight * s); }
        G.txt('信物　' + k[1], bx - 8, by + S2 - 8 * fs, 11, '#e3c27a', 'right', G.FONT, 700); } catch (e) { } }; })();
  /* 拿到夥伴就先載圖集 */
  setInterval(() => { try { if (G.mode !== 'play') return; const L = PY.list || []; if (L.length || (G.SAVE.data.flags || {}).raiPet) need(); for (const P of L) if (P && SID[P.id] && stage1(P)) inject(P.id); const x = A.get(UNIT); if (x) x.lu = performance.now(); } catch (e) { } }, 1500);
})();
