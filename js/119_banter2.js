/* ==========================================================================
 * 神諭之地 重製版 — 119_banter2.js
 * Version : r3.84.0  (2026-11-25)
 * 變更    : r3.84.0 新增。第 2 批：夥伴對話＋D5。
 *           夥伴雙人對話：原本只在「18 秒完全不操作」且 30% 才觸發，實際遊玩幾乎看不到 → 改成：
 *             進入地圖（安全區或場上沒有敵人）約 6 秒後 55%、清場後約 2 秒 45%、安全區走動每 60～90 秒一次；戰鬥中不插話、對話／選單／過場時不插話。
 *             同一組不會連續出現（輪完一輪才重抽）；兩組雙人對話之間至少 40 秒。
 *           三人對話：出戰位只有 2 個，原本永遠不會出現 → 隊上有其中兩人就成立，缺席那位的台詞改由主角（蒼真）說，泡泡畫在主角頭上。
 *           D5 斷岳之後第一次按招式鍵沒反應：原因是斷岳最後一段連續 8～10 下重擊，每下都把命中停頓重設 10 格，招式被拖長到按鍵時還沒結束。
 *             → 命中停頓改成「14 格內連續命中只延長 2 格」，單發重擊不變（全武器共用）。
 * 依賴    : 10_banter（G.BANTER：say／queue／PAIR／L／draw）、49_party（PARTY.slots／list）、111_katana_fx（VX.impact 停頓表）。
 * ========================================================================== */
'use strict';
(function () {
  const B = G.BANTER, VX = G.VX, H = G.H; if (!B) return;
  /* ---------- D5：命中停頓不連續疊加 ---------- */
  let hsT = -1e9;
  const im0 = VX.impact; VX.impact = function () { const h0 = G.hitstop || 0, chain = G.t - hsT < 14; const r = im0.apply(this, arguments);
    if ((G.hitstop || 0) > h0) { if (chain) G.hitstop = Math.max(h0, Math.min(G.hitstop, h0 + 2)); else hsT = G.t; } return r; };
  /* ---------- 夥伴雙人對話 ---------- */
  const HERO = 'soma'; B.L[HERO] = B.L[HERO] || { face: 'face_soma', name: '蒼真' };
  const F = () => G.SAVE.data.flags, joined = id => id === 'shiro' ? !!F().shiroJoin : !!F()['join_' + id];
  const party = () => (G.PARTY && G.PARTY.slots ? G.PARTY.slots() : []).filter(id => id && joined(id) && B.L[id]);
  const busy = () => G.mode !== 'play' || B.cur || (B.queue && B.queue.length) || G.DLG.active() || (G.MENU && G.MENU.open) || (G.STORY && G.STORY.cut) || G.SC.trans;
  const fighting = () => G.E.some(e => e.st !== 'dead' && !(e.delay > 0) && !e.npc && !e.train);
  let bag = [], lastPair = -1e9, nextWalk = 0, pendT = 0, wasFight = false, lastScene = null;
  function usable(c, p) { const sp = [...new Set(c.map(l => l[0]))], have = sp.filter(id => p.includes(id)); return have.length >= 2 || (sp.length === 2 && have.length === 2); }
  function pair() { if (busy() || fighting() || G.t - lastPair < 40 * 60) return false; const p = party(); if (p.length < 2) return false;
    if (!bag.length) bag = B.PAIR.map((_, i) => i).sort(() => Math.random() - 0.5);
    for (let n = bag.length; n > 0; n--) { const i = bag.shift(), c = B.PAIR[i]; if (!c || !usable(c, p)) { bag.push(i); continue; }
      const lines = c.map(([id, t]) => [p.includes(id) ? id : HERO, t]); B.queue = lines.slice(1); B.say(lines[0][0], lines[0][1], true); lastPair = G.t; return true; }
    return false; }
  B.pairNow = pair;
  const st0 = B.step; B.step = function () { st0.apply(this, arguments); if (G.mode !== 'play') return;
    const f = fighting(), safe = G.SC.def && G.SC.def.safe;
    if (G.SC.id !== lastScene) { lastScene = G.SC.id; pendT = (safe || !f) && Math.random() < 0.55 ? G.t + 360 : 0; nextWalk = G.t + (60 + Math.random() * 30) * 60; }
    if (wasFight && !f && Math.random() < 0.45) pendT = Math.max(pendT, G.t + 120); wasFight = f;
    if (pendT && G.t >= pendT) { if (pair() || G.t - pendT > 600) pendT = 0; }
    if ((safe || !f) && G.t >= nextWalk) { const moving = H.st === 'walk' || G.t - (G.IN.lastAct || 0) < 120; if (moving && pair()) nextWalk = G.t + (60 + Math.random() * 30) * 60; else if (!moving) nextWalk = G.t + 600; } };
  /* 主角說的那句：泡泡畫在主角頭上 */
  const dr0 = B.draw; B.draw = function () { const c = B.cur; if (!c || c.id !== HERO) return dr0.apply(this, arguments); if (G.DLG.active()) return;
    const ctx = G.ctx, d = B.L[HERO], a = Math.max(0, Math.min(1, c.t / 10, (c.life - c.t) / 15)), sc = G.SC.depth(H.y), p = G.SC.toScreen(H.x, H.y - G.HERO_H * sc * 1.25);
    ctx.save(); ctx.globalAlpha = a; ctx.font = `700 ${12 * G.FS()}px ${G.FONT}`;
    const lines = G.wrap(c.text, Math.min(240, G.LW * 0.32)), lh = 16 * G.FS(), w = Math.max(...lines.map(l => ctx.measureText(l).width), ctx.measureText(d.name).width) + 22, h = 20 + lines.length * lh;
    const x = Math.max(8 + G.SAFE.l, Math.min(G.LW - w - 8 - G.SAFE.r, p.x - w / 2)), y = Math.max(8 + G.SAFE.t, p.y - h - 10);
    ctx.fillStyle = 'rgba(14,9,12,.86)'; G.rr(x, y, w, h, 9); ctx.fill(); ctx.strokeStyle = 'rgba(227,194,122,.55)'; ctx.lineWidth = 1; G.rr(x + .5, y + .5, w - 1, h - 1, 9); ctx.stroke();
    const tx = Math.max(x + 12, Math.min(x + w - 12, p.x)); ctx.fillStyle = 'rgba(14,9,12,.86)'; ctx.beginPath(); ctx.moveTo(tx - 6, y + h - 1); ctx.lineTo(tx + 6, y + h - 1); ctx.lineTo(tx, y + h + 8); ctx.closePath(); ctx.fill();
    G.txt(d.name, x + 11, y + 11, 10, G.C.gold, 'left', G.FONT_S, 900); lines.forEach((l, i) => G.txt(l, x + 11, y + 11 + (i + 1) * lh, 12, G.C.ink, 'left', G.FONT, 700)); ctx.restore(); };
})();
