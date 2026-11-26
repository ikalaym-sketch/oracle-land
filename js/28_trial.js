/* ==========================================================================
 * 神諭之地 重製版 — 28_trial.js
 * Version : r3.109.0  (2026-11-26)　r3.109.0：試煉石的外框橢圓線改成地面柔光（石碑本體由 137_props 畫）
 * 舊版    : r3.59.0  (2026-11-24)　r3.59.0：試煉清單可捲動（9 個都看得到）、4 位隱藏王有專屬試煉場　r3.54.0：r3.54.0：三神器守門／形代／道反改在專屬試煉場開打；三神器試煉需先集齊 3 張藏寶圖碎片（散落在第 3／4／6 章地圖）
 * 舊版    : r3.9.0  (2026-11-13)
 * 變更    : r3.8.2 新增。神社後山（hub_mountain）試煉石：列出全部小頭目試煉與隱藏王試煉、解鎖條件；
 *           頭目逐隻接入前一律灰階「未開放」，接好的頭目在 OPEN 加上即可開放。
 * 說明    : ・後山由神社東側過橋抵達；磐座前方 70 範圍內出現「試煉石」互動。
 *           ・頁面借用選單框架（M.trial 有值時改畫試煉頁）。
 * 變更    : r3.9.0 九場試煉全部開放（46_boss_hidden）：依進度解鎖、在後山開打、首勝紀錄；隱藏王擊敗後可在此看信物進度並「邀請入隊」（47_partner）。
 * 依賴    : 08_menu／17_menu2（M.ui）、04_ui（G.UI.near）、06_story（G.STORY.step）、26_boss、46_boss_hidden、47_partner。
 * ========================================================================== */
'use strict';
(function () {
  const ctx = G.ctx, C = G.C, M = G.MENU, fs = () => G.FS();
  /* [代號, 名稱, 類別, 解鎖條件, 說明, 頭目代號, 解鎖旗標, 建議等級] */
  const LIST = [
    ['komakin', '金狛犬・鏡守', '小頭目', '擊敗第三章頭目（白九尾）', '守護八咫鏡的金色狛犬。兩面神鏡會折射光束，打碎神鏡就能讓牠露出破綻。', 't_komakin', 'boss_W_R03_07', 30],
    ['kinhannya', '金般若・玉守', '小頭目', '擊敗第四章頭目（雷獸王）', '守護八尺瓊勾玉的般若。百鬼咒時要在 5 秒內打碎三顆勾玉。', 't_kinhannya', 'boss_W_R04_07', 36],
    ['akaorochi', '赤大蛇・劍守', '小頭目', '擊敗第六章頭目（八岐大蛇）', '守護草薙劍的赤色大蛇。三階插下的草薙劍打斷後，牠的力量會減弱。', 't_akaorochi', 'boss_W_R06_07', 52],
    ['yorimitsu', '源賴光', '隱藏王', '擊敗富士山副本頭目（源義經）', '斬鬼的名將。架勢中出手會被反擊。擊敗後可招募。', 'h_yorimitsu', 'boss_D_FUJI_04', 66],
    ['owl', '梟神', '隱藏王', '擊敗北海蝦夷副本頭目（熊靈・爐火女神）', '雪原之夜的守望者。低空掠獵、羽矢壓線，單一階段。', 'h_owl', 'boss_D_EZO_04', 56],
    ['takemikazuchi', '建御雷', '隱藏王', '擊敗天空浮島副本頭目（素戔嗚尊）', '雷與劍之神。神影隨招顯現。擊敗後可招募。', 'h_takemikazuchi', 'boss_D_SKY_04', 86],
    ['enno', '役小角', '隱藏王', '擊敗出雲大社副本頭目（安倍晴明）', '驅使役靈的少女修驗者。光路依序掠過，看清預告。擊敗後可招募。', 'h_enno', 'boss_D_IZUMO_04', 76],
    ['katashiro', '形代御前', '隱藏王', '主線通關（擊敗大禍津日神）', '以紙人為身的御前。展袖時只能斬外露的結破解護身。', 'h_katashiro', 'boss_W_R12_06', 105],
    ['chigaeshi', '道反之大神・荒魂', '隱藏王', '主線通關（擊敗大禍津日神）', '鎮守千引石的荒魂。落掌後外露的臂是弱點。', 'h_chigaeshi', 'boss_W_R12_06', 108]
  ];
  const F = () => G.SAVE.data.flags, OPEN = {};
  /* r3.54.0：專屬試煉場、藏寶圖碎片 */
  const ARENA = { komakin: 'A_TRIAL_YATA', kinhannya: 'A_TRIAL_YASAKANI', akaorochi: 'A_TRIAL_KUSANAGI', katashiro: 'A_HID_KATASHIRO', chigaeshi: 'A_HID_CHIGAESHI',
    yorimitsu: 'A_HID_YORIMITSU', owl: 'A_HID_OWL', takemikazuchi: 'A_HID_TAKEMI', enno: 'A_HID_ENNO' };   // r3.59.0：4 位隱藏王借副本最深處當試煉場（場景由 98_explore 複製）
  const JG = { komakin: ['yata', 3, '八咫鏡'], kinhannya: ['yasakani', 4, '八尺瓊勾玉'], akaorochi: ['kusanagi', 6, '草薙劍'] };
  const frags = k => [1, 2, 3].filter(i => F()['tmap_' + k + '_' + i]).length;
  const fragOk = r => !JG[r[0]] || !!F()['trial_' + r[0]] || frags(JG[r[0]][0]) >= 3;
  const isOpen0 = r => !!(G.BOSS && G.BOSS.DEF[r[5]]) && (!!F()[r[6]] || !!OPEN[r[0]]);   // OPEN：測試用強制開放
  const isOpen = r => isOpen0(r) && fragOk(r);
  /* 開打：在後山磐座前 */
  function fight(r) { const B = G.BOSS, D = B.DEF[r[5]], p0 = stand() || [G.H.x, G.H.y]; M.close();
    const ar = ARENA[r[0]]; if (ar && G.D.scenes[ar] && G.SC.id !== ar) { T.pend = r; G.SAVE.data.qret = G.SC.id; G.HUB.travel(0, '試煉石亮起，光把你們帶往「' + G.D.scenes[ar].name + '」……', [], ar); return; }
    const lv = Math.max(r[7], G.RPG.d().lv || 1) + 2, want = G.SC.id; G.UI.toast('試煉開始……');
    Promise.all([B.load(r[5]), G.ASSET.enemies(D.foes || [])]).then(() => { if (G.SC.id !== want) return; const p = G.SC.snap(p0[0] + 220, p0[1], 'open', 300) || [p0[0] + 220, p0[1]];
      B.start(r[5], { x: p[0], y: p[1], lv, sub: '試煉・' + r[2], onWin: () => { const first = !F()['trial_' + r[0]]; F()['trial_' + r[0]] = 1; G.SAVE.markDirty(); G.UI.banner(first ? '試煉達成' : '再次達成', r[1]); if (r[2] === '隱藏王' && G.PARTNER) setTimeout(() => G.PARTNER.after(r[0]), 900); } }); }, e => { console.warn(e); G.UI.toast('試煉載入失敗'); }); }
  const T = G.TRIAL = { sel: 0, LIST, OPEN, ARENA, JG, frags, fight: k => fight(LIST.find(r => r[0] === k)), open() { T.sel = 0; M.trial = 1; M.show(); } };
  const close0 = M.close.bind(M); M.close = function () { M.trial = 0; close0(); };

  const draw0 = M.draw;
  M.draw = function () { if (!M.trial) return draw0(); const { box, button, hit, clip } = M.ui; M.hits = []; M.area = [];
    ctx.fillStyle = 'rgba(10,7,9,.92)'; ctx.fillRect(0, 0, G.LW, G.LH);
    const L = 12 + G.SAFE.l, Tp = 12 + G.SAFE.t, B = G.LH - 12 - G.SAFE.b, R = G.LW - 12 - G.SAFE.r, SH = 34 * fs();
    button(R - 84, Tp, 84, SH, '✕ 離開', () => M.close());
    G.txt('試煉石', L + 6, Tp + SH / 2 + 1, 17, C.gold, 'left', G.FONT_S, 900);
    G.txt('磐座裡封著各地守護者的記憶。', L + 90 * fs(), Tp + SH / 2 + 1, 11, C.sub, 'left', G.FONT, 500);
    const top = Tp + SH + 12, h = B - top, lw = Math.min(330, (R - L) * 0.45), cx = L + lw + 10, cw = R - cx, RH = 50 * fs();
    box(L, top, lw, h); clip(L, top + 4, lw, h - 8);
    const off = M.ui.scrollArea('trial', L, top + 4, lw, h - 8, LIST.length * (RH + 6) + 10);   // r3.59.0：清單可捲動（原本只看得到前 5 個）
    LIST.forEach((rr, i) => { const [k, n, ty] = rr, yy = top + 6 + i * (RH + 6) + off, on = i === T.sel, ok = isOpen(rr), done = F()['trial_' + k]; if (yy + RH < top || yy > top + h) return;
      ctx.fillStyle = on ? 'rgba(120,80,30,.45)' : 'rgba(255,255,255,.04)'; G.rr(L + 6, yy, lw - 12, RH, 6); ctx.fill();
      G.txt(n, L + 16, yy + RH * 0.36, 14, ok ? C.ink : '#8a7f78', 'left', G.FONT_S, 900);
      G.txt(ty + '・' + (ok ? (done ? '已達成' : '可挑戰') : '未開放') + (G.PARTNER && G.PARTNER.REC[k] && G.PARTNER.joined(k) ? '・已入隊' : ''), L + 16, yy + RH * 0.74, 10, ok ? (done ? '#e3c27a' : '#86cf8f') : '#7a6f68', 'left', G.FONT, 700);
      hit(L + 6, Math.max(yy, top + 4), lw - 12, Math.min(yy + RH, top + h - 4) - Math.max(yy, top + 4), () => { T.sel = i; }); }); ctx.restore();
    { const tot = LIST.length * (RH + 6) + 10; if (tot > h) { const bh = h * h / tot, by = top + (h - bh) * (-off) / (tot - h); ctx.fillStyle = 'rgba(227,194,122,.45)'; G.rr(L + lw - 5, by, 3, bh, 2); ctx.fill(); } }
    box(cx, top, cw, h); const r = LIST[T.sel], ok = isOpen(r);
    G.txt(r[1], cx + 16, top + 26, 17, ok ? C.gold : '#a89a8f', 'left', G.FONT_S, 900);
    let yy = top + 54; G.wrap(r[4], cw - 32).forEach(l => { G.txt(l, cx + 16, yy, 12, C.ink, 'left', G.FONT, 500); yy += 20 * fs(); });
    yy += 8; G.txt('類別：' + r[2], cx + 16, yy, 11, C.sub, 'left', G.FONT, 500); yy += 20 * fs();
    G.txt('解鎖條件：' + r[3], cx + 16, yy, 11, C.sub, 'left', G.FONT, 500); yy += 20 * fs();
    G.txt('建議等級：Lv ' + r[7] + ' 以上', cx + 16, yy, 11, C.sub, 'left', G.FONT, 500); yy += 22 * fs();
    const jg = JG[r[0]]; if (jg && isOpen0(r) && !F()['trial_' + r[0]]) { const k = jg[0], n = frags(k); G.txt(jg[2] + '藏寶圖碎片　' + n + '／3' + (n < 3 ? '（第 ' + jg[1] + ' 章地圖上發光處）' : ''), cx + 16, yy, 11, n >= 3 ? '#86cf8f' : C.gold, 'left', G.FONT_S, 900);
      for (let i = 1; i <= 3; i++) if (G.drawIcon) G.drawIcon('item_key_' + k + '_map_' + i, cx + 16 + (i - 1) * 40 * fs(), yy + 8, 34 * fs(), F()['tmap_' + k + '_' + i] ? 1 : 0.22); yy += 48 * fs(); }
    if (!ok) G.txt(isOpen0(r) ? '集齊 3 張藏寶圖碎片後開放' : '尚未符合解鎖條件', cx + 16, yy + 8, 12, '#e07a6a', 'left', G.FONT, 700);
    if (ARENA[r[0]] && ok) G.txt('試煉場：' + ((G.D.scenes[ARENA[r[0]]] || {}).name || ''), cx + 16, yy + 30, 11, C.sub, 'left', G.FONT, 500);
    const P = G.PARTNER, rec = P && P.REC[r[0]];
    if (rec && ok) { if (P.joined(r[0])) G.txt(rec.n + ' 已經是你的夥伴', cx + 16, yy + 8, 12, '#86cf8f', 'left', G.FONT, 700);
      else { G.txt('招募信物（擊敗後集齊即可邀請）', cx + 16, yy + 8, 11, C.gold, 'left', G.FONT_S, 900); yy += 26 * fs();
        for (const it of rec.items) { const [nm, need] = P.ITEM[it], n = P.n(it); G.txt('・' + nm + '　' + n + '／' + need, cx + 22, yy, 11, n >= need ? '#86cf8f' : C.ink, 'left', G.FONT, 500); yy += 19 * fs(); } } }
    const bw = Math.min(200, (cw - 48) / 2), canJoin = rec && ok && F()['trial_' + r[0]] && !P.joined(r[0]) && P.ready(r[0]);
    button(cx + 16, top + h - 50, bw, 36, ok ? '進入試煉' : '未開放', ok ? () => fight(r) : null, ok ? null : 'off');
    if (rec && ok && !P.joined(r[0])) button(cx + 32 + bw, top + h - 50, bw, 36, '邀請入隊', canJoin ? () => { M.close(); P.join(r[0]); } : null, canJoin ? null : 'off');
  };

  /* 磐座互動與光點 */
  const stand = () => { const n = G.SC.def && G.SC.def.nodes; return n && n.stone_stand; };
  const st0 = G.STORY.step.bind(G.STORY);
  G.STORY.step = function () { st0(); if (G.SC.id !== 'hub_mountain') return; const p = stand(); if (!p) return;
    if (Math.hypot(G.H.x - p[0], (G.H.y - p[1]) * 1.6) < 70 && !(G.UI.near && G.UI.near.label === '試煉石')) G.UI.near = { label: '試煉石', kind: 'look', run: () => T.open() }; };
  const loot0 = G.drawLoot; G.drawLoot = function (Z) { loot0(Z); if (G.SC.id !== 'hub_mountain') return; const p = stand(); if (!p) return;
    const a = 0.3 + 0.15 * Math.sin(G.t * 0.05); ctx.save(); ctx.translate(p[0], p[1]); ctx.scale(1, 0.3); const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 70); g.addColorStop(0, `rgba(190,160,255,${a})`); g.addColorStop(1, 'rgba(190,160,255,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 70, 0, 6.283); ctx.fill(); ctx.restore(); };   /* r3.109.0：外框橢圓線改柔光，石碑圖由 137_props 畫 */
  /* r3.54.0：進試煉場開打；藏寶圖碎片放在章節地圖 */
  const en0 = G.STORY.onEnter.bind(G.STORY); G.STORY.onEnter = function (id) { en0(id);
    if (T.pend && ARENA[T.pend[0]] === id) { const r = T.pend; T.pend = null; G.STORY.later(70, () => { if (G.SC.id === id) fight(r); }); }
    G.STORY.later(30, () => placeFrags(id)); };
  function placeFrags(id) { if (G.SC.id !== id || !G.HUB || !G.HUB.marks || !G.WORLD) return;
    for (const r of LIST) { const jg = JG[r[0]]; if (!jg || !isOpen0(r) || F()['trial_' + r[0]]) continue; const L = (G.WORLD.chapters[jg[1]] || []), i = L.indexOf(id); if (i < 1 || i > 3) continue;
      const key = 'tmap_' + jg[0] + '_' + i; if (F()[key] || G.HUB.marks.some(m => m.id === key)) continue;
      const c = (G.SC.def.nodes && G.SC.def.nodes.center) || [G.SC.def.w / 2, G.SC.def.h * 0.6], p = (G.SC.snap && G.SC.snap(c[0] + [0, -320, 300, 120][i], c[1] + [0, 20, -10, 30][i], 'open', 260)) || c;
      G.HUB.marks.push({ id: key, tmap: 1, x: p[0], y: p[1], label: '發光的紙片', kind: 'look', main: false, run: () => { F()[key] = 1; G.SAVE.markDirty(); G.HUB.marks = G.HUB.marks.filter(m => m.id !== key);
        const n = frags(jg[0]); G.UI.banner(jg[2] + '藏寶圖碎片　' + n + '／3', n >= 3 ? '集齊了！回後山試煉石挑戰「' + r[1] + '」' : '還有 ' + (3 - n) + ' 張散落在第 ' + jg[1] + ' 章'); } }); } }
  const lt0 = G.drawLoot; G.drawLoot = function (Z) { lt0(Z); if (!G.HUB || !G.HUB.marks) return; for (const m of G.HUB.marks) { if (!m.tmap) continue; const a = 0.45 + 0.3 * Math.sin(G.t * 0.09), s = G.SC.depth(m.y);
      ctx.save(); ctx.fillStyle = `rgba(255,225,140,${a * 0.5})`; ctx.beginPath(); ctx.ellipse(m.x, m.y, 26 * s, 8 * s, 0, 0, 6.283); ctx.fill(); ctx.fillStyle = `rgba(255,240,200,${a})`; ctx.beginPath(); ctx.arc(m.x, m.y - 14 * s - Math.sin(G.t * 0.07) * 4, 4 * s, 0, 6.283); ctx.fill(); ctx.restore(); } };
})();
