/* ==========================================================================
 * 神諭之地 重製版 — 106_play.js
 * Version : r3.145.0  (2026-11-27)　r3.145.0：合併傷害數字時記下時間（03 畫彈跳）
 * 舊版    : r3.143.0  (2026-11-27)　r3.143.0：戰鬥中淡化路人時，跳過援軍、支援角色、鎌鼬三兄弟
 * 舊版    : r3.127.4  (2026-11-27)　r3.127.4：救援士兵、小雪不套「靠近敵人變半透明」
 * 舊版    : r3.105.0  (2026-11-26)　r3.105.0：合併傷害數字也用「萬」
 * 舊版    : r3.64.0  (2026-11-24)
 * 變更    : r3.64.0 新增。試玩回饋第一批：
 *           1. 劇情跳過：對話框右上「跳過」（按兩下才生效）。對話瞬間跑完（每句照樣寫進「記錄」、旗標與後續流程照常觸發），
 *              遇到選項會停下讓玩家選；過場走位 ×6 速。劇情結束後提示可在「記錄」回看。
 *           2. 第一次能操作時提示操作方式（只出現一次）。
 *           3. 敵人互斥：只推開互相重疊的敵人（每幀最多 1.2 像素，推過去不能走就不推），頭目不會被推。
 *           4. 傷害數字：同一隻敵人 0.33 秒內的連擊合併成一個數字（標 ×N），出現位置左右錯開。
 *           5. 受傷時畫面邊緣閃紅；生命低於 30% 邊緣持續脈動。
 *           6. 附近有敵人時村民變半透明（純顯示，不改位置）。
 *           ・效能：互斥每幀 O(n²)（n＝場上活著的敵人）；村民判斷每 10 幀一次。
 * 存檔    : flags.ctlHint（操作提示已出現）。
 * 依賴    : 05_dialog（G.DLG）、06_story_ch1（G.STORY.cut）、03_actors（damageOni／hurtHero／drawNpc／drawWorld／NUMS）、02_scene（walkable）。
 * ========================================================================== */
'use strict';
(function () {
  const D = G.DLG, ctx = G.ctx, F = () => G.SAVE.data.flags;
  const SK = G.SKIP = { on: false, arm: 0, idle: 0, hurt: 0 };
  /* ---------- 1. 劇情跳過 ---------- */
  const dd0 = D.draw; D.draw = function () { dd0.apply(this, arguments); const L = this.list && this.list[this.i]; if (!L || this.log || this.choice) return;
    const k = this.B.log; if (!k) return; const b = this.B.skipAll = { x: k.x - 72, y: k.y, w: 64, h: k.h }, armed = SK.arm && G.t - SK.arm < 150;
    G.UI.pill(b, SK.on ? '跳過中' : armed ? '再按跳過' : '跳過', SK.on || armed); };
  const tp0 = D.tap; D.tap = function (p) { const b = this.B.skipAll;
    if (b && !this.log && !this.choice && G.UI.hit(p, b)) { if (SK.on) return; if (SK.arm && G.t - SK.arm < 150) { SK.on = true; SK.idle = 0; SK.arm = 0; } else SK.arm = G.t; return; }
    return tp0.apply(this, arguments); };
  const ds0 = D.step; D.step = function () { if (SK.on) { let k = 0; while (this.list && !this.choice && k++ < 400) { const L = this.list[this.i]; if (!L || !L.text) break; this.shown = L.text.length; this.advance(); } }
    return ds0.apply(this, arguments); };
  /* ---------- 2～6. 主迴圈外掛 ---------- */
  let st0 = null; const bt0 = G.ASSET.boot.bind(G.ASSET); G.ASSET.boot = () => bt0().then(r => { st0 = G.step; G.step = step; return r; });   /* G.step 由 09_main 定義，開機後才包 */
  function step() { st0();
    if (G.mode !== 'play') return;
    if (SK.on) { const S = G.STORY;
      if (!D.active() && S && S.cut) { for (let i = 0; i < 5 && S.cut && !D.active(); i++) st0(); SK.idle = 0; }
      else if (!D.active() && !G.SC.trans) { if (++SK.idle > 90) { SK.on = false; G.UI.toast('已跳過劇情（選單「記錄」可回看對話）'); } } else SK.idle = 0; }
    if (D.active() || G.MENU.open || G.SC.trans || (G.STORY && G.STORY.cut)) return;
    if (!F().ctlHint && F().prologue) { F().ctlHint = 1; G.SAVE.markDirty(); G.UI.banner('操作', '左半螢幕拖曳移動　斬＝攻擊　閃＝閃避　技能鍵在右下'); }
    separate(); if (SK.hurt > 0) SK.hurt--;
    if (G.t % 10 === 0) fadeNpc(); }
  function separate() { const E = G.E, A = []; for (const e of E) if (e.st !== 'dead' && e.delay <= 0 && !e.hidden) A.push(e); const n = A.length; if (n < 2 || n > 60) return;
    const SC = G.SC; for (let i = 0; i < n; i++) { const a = A[i]; for (let j = i + 1; j < n; j++) { const b = A[j], dx = b.x - a.x, dy = (b.y - a.y) * 1.6, d = Math.hypot(dx, dy), r = 15 * ((a.ratio || 1) + (b.ratio || 1));
        if (d >= r) continue; const vy = Math.abs(dy) < 6 ? ((i + j) % 2 ? 1 : -1) * (Math.abs(dx) * 0.9 + 6) : dy, vx = d > 0.01 ? dx : (i % 2 ? 1 : -1), vl = Math.hypot(vx, vy), ux = vx / vl, uy = vy / vl / 1.6,   /* 同一橫列時往上下錯開，避免排成一列 */ push = Math.min(1.2, (r - d) / 2), ab = !!a.boss, bb = !!b.boss; if (ab && bb) continue;
        const pa = bb ? push * 2 : ab ? 0 : push, pb = ab ? push * 2 : bb ? 0 : push;
        if (pa) { const x = a.x - ux * pa, y = a.y - uy * pa; if (SC.walkable(x, y)) { a.x = x; a.y = y; } }
        if (pb) { const x = b.x + ux * pb, y = b.y + uy * pb; if (SC.walkable(x, y)) { b.x = x; b.y = y; } } } } }
  function fadeNpc() { const A = G.E.filter(e => e.st !== 'dead' && e.delay <= 0);
    for (const nn of G.NPC) { if (nn.noMerge || nn.npc === 'xue' || nn.ally || nn.kamaF) { nn._fa = 1; continue; }   /* r3.143.0：援軍／支援角色／鎌鼬三兄弟不淡化（原本靠近敵人就變 40%） */ const near = A.some(e => Math.abs(e.x - nn.x) < 180 && Math.abs(e.y - nn.y) < 90); nn._fa = near ? 0.4 : 1; } }
  const dn0 = G.drawNpc; G.drawNpc = function (n) { if (!n || !(n._fa < 1)) return dn0.apply(this, arguments); ctx.save(); ctx.globalAlpha *= n._fa; try { return dn0.apply(this, arguments); } finally { ctx.restore(); } };
  /* 傷害數字合併 */
  const do0 = G.damageOni; G.damageOni = function (e) { const n0 = G.NUMS.length, r = do0.apply(this, arguments); if (G.NUMS.length !== n0 + 1) return r;
    const n = G.NUMS[n0]; if (typeof n.v !== 'number' || n.hurt || n.gold) return r;
    const p = G.NUMS.find(m => m !== n && m.e === e && m.t < 20 && m.sum != null);
    if (p) { p.sum += n.v; p.k++; p.v = G.fmtN(p.sum) + ' ×' + p.k; p.t = Math.min(p.t, 6); p.pop = G.t; if (n.crit) p.crit = true; G.NUMS.pop(); }
    else { n.e = e; n.sum = n.v; n.k = 1; n.x += (Math.random() - 0.5) * 28; for (let k = 0; k < 4 && G.NUMS.some(m => m !== n && m.t < 12 && Math.abs(m.x - n.x) < 34 && Math.abs(m.y - n.y) < 13); k++) n.y -= 14; } return r; };   /* 與附近新數字重疊就往上錯開 */
  /* 受傷邊緣紅 */
  const hh0 = G.hurtHero; G.hurtHero = function () { const r = hh0.apply(this, arguments); if (r) SK.hurt = 24; return r; };
  const dw0 = G.drawWorld; G.drawWorld = function () { dw0.apply(this, arguments); const H = G.H; if (!H || G.mode !== 'play') return;
    const low = H.hp > 0 && H.hp < H.hpMax * 0.3, a = Math.max(SK.hurt / 24 * 0.55, low ? 0.3 + 0.18 * Math.sin(G.t * 0.12) : 0); if (a <= 0.01) return;
    const g = ctx.createRadialGradient(G.LW / 2, G.LH / 2, G.LH * 0.42, G.LW / 2, G.LH / 2, G.LW * 0.62); g.addColorStop(0, 'rgba(170,20,20,0)'); g.addColorStop(1, 'rgba(170,20,20,' + a.toFixed(3) + ')');
    ctx.fillStyle = g; ctx.fillRect(0, 0, G.LW, G.LH); };
})();
