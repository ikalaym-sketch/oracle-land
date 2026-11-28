/* ==========================================================================
 * 神諭之地 重製版 — 163_heart.js
 * Version : r3.215.0  (2026-11-28)　r3.215.0：新增。夥伴心事的提示與入口
 * 內容    : 1. 八位夥伴的心事改由「夥伴本人開口」起頭：條件到了，回到神社／城鎮時夥伴會主動說話（每件心事只主動問一次）。
 *              選「晚點再說」之後，夥伴頭上留著「…」，可到 選單›夥伴›心事 再聽。
 *           2. 原本的委託人（澄岳／冬乃／天狗長者／汀江）改成心事的第一站。
 *           3. 標題統一成「〔夥伴〕的心事：標題」；颯、汐音解開後也有傷害 +10%（結局的「心」照舊）。
 *           4. 給夥伴頁（51）與任務頁（107）用的資料：G.HEART.of／state／page／openRows。
 * 依賴    : 53_quest、49_party、05_dialog、52_hub、08_menu。
 * 存檔    : flags.hq_<任務> 已答應聽；flags.ha_<任務> 已主動問過；flags.heartTip 已提示過；qs[id].h 步驟已對齊新版。
 * ========================================================================== */
'use strict';
(function () {
  const Q = G.QST, PY = G.PARTY, SC = G.SC; if (!Q || !PY) return;
  const F = () => G.SAVE.data.flags, say = Q.say, HUB = G.HUB, ctx = G.ctx;
  const L = [
    { pid: 'shiro', who: '白丸', qid: 'c6_s_shiro', sub: '守門的理由', eff: '白丸傷害 +10%',
      open: ['蒼真。……試煉場的那扇門，我想再去看一次。', '不會太久。陪我走一趟。'], later: '……嗯。我等你。' },
    { pid: 'kuzuha', who: '葛葉', qid: 'c5_s_kuzuha', sub: '狐火與爐火', eff: '葛葉傷害 +10%',
      open: ['……蒼真。共灶的火，我點不起來。', '狐火明明也是火。……你陪我回去看看，好不好？'], later: '……沒關係。我再自己想一下。' },
    { pid: 'hayate', who: '颯', qid: 'c9_s_hayate', sub: '天狗族的叛徒', eff: '颯傷害 +10%',
      open: ['喂，蒼真。高原的長者託人帶話，說有師父的事要講。', '……我一個人去，怕會直接掀了他的屋頂。你也來。'], later: '哼。反正那老頭也跑不掉。' },
    { pid: 'shion', who: '汐音', qid: 'c10_s_shion', sub: '汐音的母親', eff: '汐音傷害 +10%',
      open: ['蒼真……澪都有位汀江婆婆，說她記得我娘。', '我想去問。可是……一個人，不太敢聽。'], later: '嗯……等你有空的時候。' },
    { pid: 'ibaraki', who: '茨木', qid: 'c11_s_ibaraki', sub: '霧裡的野菊', eff: '茨木傷害 +10%',
      open: ['蒼真。黃泉的霧裡……我好像看到一個人。', '一個不該在那裡的人。陪我去確認。'], later: '……隨你。我不急。' },
    { pid: 'yorimitsu', who: '源賴光', qid: 'pt_yorimitsu', sub: '童子切的重量', eff: '依你的選擇：酒吞的葫蘆／對鬼族與頭目傷害 +25%',
      open: ['蒼真殿。有一筆舊帳，我想親自去算。', '是我這把童子切欠下的。可否陪我走一趟？'], later: '無妨。帳放了這麼多年，不差這幾天。' },
    { pid: 'takemikazuchi', who: '建御雷', qid: 'pt_takemi', sub: '雷神的誓', eff: '小雷獸跟隨，建御雷傷害 +30%',
      open: ['蒼真。雷原上有一隻小雷獸，一見到我就發抖。', '……神，也會怕被害怕。說來可笑。陪我去一趟。'], later: '好。牠大概也還沒準備好。' },
    { pid: 'enno', who: '役小角', qid: 'pt_enno', sub: '前鬼與後鬼', eff: '役小角傷害 +15%',
      open: ['蒼真——前鬼和後鬼吵架，離家出走了。', '我叫不回來。他們只聽打贏他們的人……幫我。'], later: '唔……那我先去把他們的碗洗了。' }];
  const HT = G.HEART = { L, by: {} };
  for (const h of L) { const q = Q.by[h.qid]; if (!q) continue; HT.by[h.pid] = h; h.q = q; h.name = h.who + '的心事'; q.heart = h.pid; q.title = h.name + '：' + h.sub;
    const g = q.giver, n0 = g ? g.need : q.need; h.cond = () => !n0 || !!n0();
    if (g) { q.steps.unshift({ t: 'talk', map: g.map, at: g.at, dx: g.dx, u: g.u, name: g.name, text: '找' + g.name + '問清楚', lines: g.lines }); delete q.giver; h.shift = 1; }
    q.need = () => !!F()['hq_' + h.qid]; }
  { const add = (id, t, d) => { const q = Q.by[id]; if (q && !q.done) q.done = () => G.UI.banner(t, d); };   // 颯、汐音：解開後也有加成
    add('c9_s_hayate', '颯的心事', '颯傷害 +10%'); add('c10_s_shion', '汐音的心事', '汐音傷害 +10%');
    const dm0 = G.damageOni; G.damageOni = function (e, mult, big, fc, opt) { const P = opt && opt.party;
      if (P && typeof P === 'object' && ((P.id === 'hayate' && Q.isDone('c9_s_hayate')) || (P.id === 'shion' && Q.isDone('c10_s_shion')))) mult *= 1.1; return dm0.call(this, e, mult, big, fc, opt); }; }
  const chOk = q => !q.ch || (HUB && (HUB.open(q.ch) || q.ch <= HUB.cur()));
  /* 狀態：0 還沒到時候｜1 想跟你說｜2 進行中｜3 已解開；-1＝尚未加入 */
  HT.state = function (pid) { const h = HT.by[pid]; if (!h || !PY.joined(pid)) return -1; const s = Q.state(h.qid); if (s) return s.done ? 3 : 2; return chOk(h.q) && h.cond() ? 1 : 0; };
  HT.of = pid => HT.by[pid];
  const safe = () => { const id = SC.id || ''; return id === 'hub_shrine' || id === 'hub_city' || id.indexOf('T_') === 0; };
  HT.safe = safe;
  function mig() { const qs = G.SAVE.data.qs || {}; for (const h of L) { const s = qs[h.qid]; if (s && !s.h) { if (h.shift && !s.done) s.s = (s.s || 0) + 1; s.h = 1; } } }   // 舊存檔：進行中的步驟往後一格（多了第一站）
  function accept(h) { F()['hq_' + h.qid] = true; F()['ha_' + h.qid] = true; Q.start(h.qid); const s = Q.state(h.qid); if (s) s.h = 1; G.RPG.d().track = h.qid; G.SAVE.markDirty(); }
  /* 夥伴開口：兩句話＋選項。ask＝主動問（可晚點再說） */
  HT.talk = function (pid) { const h = HT.by[pid]; if (!h || HT.state(pid) !== 1 || G.DLG.active()) return false; F()['ha_' + h.qid] = true; let yes = 0;
    G.DLG.start([say(h.who, h.open[0]), say(h.who, h.open[1]),
      { choice: [{ label: '聽' + h.who + '說', then: [{ do: () => { yes = 1; } }, say('蒼真', '好。我陪你去。')] }, { label: '晚點再說', then: [say(h.who, h.later)] }] }],
      () => { if (yes) accept(h); else if (!F().heartTip) { F().heartTip = true; G.UI.toast('夥伴頭上有「…」＝有心事想說。到 選單›夥伴›心事 可以再聽他說'); } G.SAVE.markDirty(); }); return true; };
  let enT = 0; const en0 = G.STORY.onEnter.bind(G.STORY); G.STORY.onEnter = function (id) { try { mig(); } catch (e) { } enT = G.t; return en0(id); };
  const st0 = G.STORY.step.bind(G.STORY); G.STORY.step = function () { st0();
    if (G.t % 30 || G.t - enT < 100 || G.mode !== 'play' || !safe() || G.DLG.active() || SC.trans || (G.MENU && G.MENU.open)) return;
    for (const h of L) { if (F()['ha_' + h.qid] || HT.state(h.pid) !== 1) continue; HT.talk(h.pid); break; } };
  /* 頭上的「…」：有心事還沒聽的夥伴（跟任務記號同一種字樣） */
  const dr0 = PY.draw; PY.draw = function (P) { dr0.call(this, P); if (!P || !P.r || HT.state(P.id) !== 1) return; const def = PY.DEF[P.id], s = SC.depth(P.y), top = P.y - G.HERO_H * def.ratio * s * 1.12 + Math.sin(G.t / 18) * 2;
    ctx.save(); ctx.translate(P.x, top); const fs = 8.5 * s; ctx.fillStyle = 'rgba(250,240,220,.95)'; ctx.strokeStyle = '#5a3a1c'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-fs * 1.1, -fs * 1.5); ctx.quadraticCurveTo(0, -fs * 1.9, fs * 1.1, -fs * 1.5); ctx.quadraticCurveTo(fs * 1.5, -fs * 0.9, fs * 1.0, -fs * 0.4); ctx.lineTo(fs * 0.25, -fs * 0.35); ctx.lineTo(0, 0); ctx.lineTo(-fs * 0.2, -fs * 0.35); ctx.lineTo(-fs * 1.0, -fs * 0.4); ctx.quadraticCurveTo(-fs * 1.5, -fs * 0.9, -fs * 1.1, -fs * 1.5); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#b0452c'; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.arc(i * fs * 0.5, -fs * 0.95 + Math.sin(G.t / 9 + i) * fs * 0.08, fs * 0.14, 0, 6.283); ctx.fill(); } ctx.restore(); };
  /* 夥伴頁「心事」分頁 */
  const SN = ['還沒到時候', '想跟你說', '進行中', '已解開'], SCOL = ['#9a9488', '#ffd65a', '#6fb0f0', '#86cf8f'];
  HT.mark = pid => HT.state(pid) === 1;
  HT.page = function (pid, x, y, w, h) { const C = G.C, M = G.MENU, U = M.ui, fs = G.FS(), hh = HT.by[pid], def = PY.DEF[pid];
    if (!hh) { G.txt('這位夥伴目前沒有心事。', x + w / 2, y + 40, 13, C.sub, 'center', G.FONT_S, 700); return; }
    const st = HT.state(pid), q = hh.q, fim = G.IMG[def.face], PW = 64; if (fim) { ctx.save(); G.rr(x + w - PW - 14, y + 2, PW, PW, 8); ctx.clip(); ctx.drawImage(fim, x + w - PW - 14, y + 2, PW, PW); ctx.restore(); ctx.strokeStyle = 'rgba(227,194,122,.5)'; ctx.lineWidth = 1; G.rr(x + w - PW - 13.5, y + 2.5, PW - 1, PW - 1, 8); ctx.stroke(); }
    G.txt(st >= 2 ? q.title : hh.name, x + 14, y + 12, 16, '#fff3d6', 'left', G.FONT_S, 900);
    { ctx.font = `800 ${10 * fs}px ${G.FONT}`; const t = SN[st], tw = ctx.measureText(t).width + 14, bh = 17 * fs; ctx.fillStyle = SCOL[st]; G.rr(x + 14, y + 26, tw, bh, 4); ctx.fill(); G.txt(t, x + 14 + tw / 2, y + 26 + bh / 2 + 1, 10, '#1c1410', 'center', G.FONT, 800); }
    const bx = x + 14, bw = w - 28, by = y + PW + 14, bh = Math.min(h - PW - 60, 150 * fs); ctx.fillStyle = 'rgba(0,0,0,.32)'; G.rr(bx, by, bw, bh, 8); ctx.fill(); ctx.strokeStyle = 'rgba(227,194,122,.25)'; G.rr(bx + .5, by + .5, bw - 1, bh - 1, 8); ctx.stroke();
    const lines = []; const put = (t, col, sz, wt) => { ctx.font = `${wt || 500} ${(sz || 12) * fs}px ${G.FONT}`; for (const l of G.wrap(t, bw - 28)) lines.push([l, col || C.ink, sz || 12, wt || 500]); };
    if (st === 0) { put(hh.who + '好像有話放在心裡，只是還沒到開口的時候。', C.ink); put('大約在第 ' + q.ch + ' 章的旅程走到一半之後，他會自己找你說。', C.sub, 11); }
    else if (st === 1) { put('「' + hh.open[0] + '」', '#fff3d6', 13, 700); put(safe() ? '現在就可以聽他說。' : '回到神社或城鎮，就可以聽他說。', C.sub, 11); }
    else if (st === 2) { const s = Q.state(hh.qid), step = q.steps[s.s] || {}; put(q.desc || '', C.ink); put('▶ ' + (step.text || step.label || '繼續前進') + (step.map && G.D.scenes[step.map] ? '　｜' + G.D.scenes[step.map].name : ''), '#ffd65a', 12, 700); }
    else { put(q.desc || '', C.sub, 11); put('這件事，你陪他走完了。', C.ink); put('效果：' + hh.eff, '#86cf8f', 12, 700); }
    let ly = by + 14 + 6 * fs; for (const [l, col, sz, wt] of lines) { if (ly > by + bh - 8) break; G.txt(l, bx + 14, ly, sz, col, 'left', G.FONT, wt); ly += (sz + 7) * fs; }
    const byb = by + bh + 8, bwid = Math.max(110, 96 * fs);
    if (st === 1 && safe()) U.button(bx, byb, bwid, 30, '聽' + hh.who + '說', () => { M.close(); HT.talk(pid); }, 'main');
    if (st === 2) { const d = G.RPG.d(), tr = d.track === hh.qid; U.button(bx, byb, bwid, 30, tr ? '追蹤中 ✓' : '追蹤這件事', () => { d.track = tr ? null : hh.qid; G.SAVE.markDirty(); }, tr ? 'main' : ''); } };
  /* 任務頁「可接」：心事排最前，其餘是地圖上有人在等的委託 */
  HT.openRows = function () { const R = [];
    for (const h of L) if (HT.state(h.pid) === 1) R.push({ k: '心事', t: h.name, d: h.who + '有話想跟你說　｜回神社或城鎮時他會開口，或到 夥伴›心事', heart: h.pid });
    for (const q of Q.L) { const g = q.giver; if (!g || Q.state(q.id) || !Q.avail || !Q.avail(q) || (g.need && !g.need())) continue;
      R.push({ k: q.boss ? '委託' : '支線', t: q.title, d: '委託人：' + (g.name || '？') + '　｜' + ((G.D.scenes[g.map] || {}).name || ''), ch: q.ch || 0 }); }
    return R; };
  HT.openPage = function (x, top, w, hgt) { const C = G.C, U = G.MENU.ui, fs = G.FS(), RH = 22 * fs, R = HT.openRows(), off = U.scrollArea('qopen', x, top, w, hgt, R.length * RH * 2.2 + 20); U.clip(x, top, w, hgt); let yy = top + 14 + off;
    if (!R.length) G.txt('目前沒有等著你的委託。', x + w / 2, top + 40, 13, C.sub, 'center', G.FONT_S, 700);
    for (const r of R) { const hot = !!r.heart; if (hot) { ctx.fillStyle = 'rgba(150,92,36,.28)'; G.rr(x + 10, yy - RH * 0.6, w - 20, RH * 2.0, 6); ctx.fill(); }
      G.txt(r.k + '　' + r.t, x + 22, yy, 13, hot ? '#ffd65a' : C.ink, 'left', G.FONT_S, 900); G.txt(r.d, x + 36, yy + RH, 11, C.sub, 'left', G.FONT_S, 700);
      if (hot) { const bx = x + w - 96; U.button(bx, yy - 8, 82, 26, '去夥伴頁', () => { const ids = Object.keys(PY.DEF); G.MENU.sel.pt = ids.indexOf(r.heart); G.MENU.sel.ptab = 4; const i = G.MENU.TABS.indexOf('夥伴'); if (i >= 0) G.MENU.show(i); }, ''); }
      yy += RH * 2.2; }
    ctx.restore(); };
  HT.openCount = () => HT.openRows().length;
})();
