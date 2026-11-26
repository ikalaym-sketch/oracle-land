/* ==========================================================================
 * 神諭之地 重製版 — 138_feather.js
 * Version : r3.127.2  (2026-11-27)　r3.127.2：修正圖集被釋放後叫不出三兄弟（每次都顯示「風還在聚集」）
 * 舊版    : r3.122.0  (2026-11-26)　r3.122.0：三兄弟留場 12 秒（餵過小鼬 15 秒）：長兄每 3 秒旋風斬、次兄每 2.5 秒風刃三連、三弟先補 15% 之後每 4 秒補 5%；沒敵人時跟在主角身邊；換地圖消失
 * 舊版    : r3.110.0  (2026-11-26)
 * 變更    : r3.110.0 新增。鎌鼬之羽：召喚鎌鼬三兄弟助戰（重要道具，不消耗）。
 *           ・取得：完成第 1 章「鎌鼬的巡山」（c1_b_patrol）時給（舊存檔已完成者進遊戲自動補發），flags.kamaFeather。
 *           ・使用：藥鍵左邊的羽毛鍵。冷卻 60 秒；第 1 章選「餵小鼬」者 30 秒。
 *           ・三兄弟依傳說分工依序出手：
 *             長兄　衝到敵群旋風斬：範圍內敵人受 0.8 倍傷害＋暈眩 1 秒（頭目／精英 0.4 秒）
 *             次兄　風刃連斬 3 下：每下 1.0 倍傷害
 *             三弟　回到隊伍塗藥：主角與所有夥伴（含倒地者以外）回復 15% 生命
 *             傷害以主角攻擊計算，對頭目減半。附近沒有敵人時只塗藥；沒敵人且全員滿血則不發動、不進冷卻。
 *           ・按鍵圖示用 x3 翠羽；美術：用頭目圖集 b_kama 的跑、旋、風、藥動作與特效（kama_spin_wake／kama_storm_cuts／kama_medicine_fog），消失時噴翠羽零件。
 *           ・效能：b_kama 第一次用時才載入；同時只會有一組召喚。
 * 依賴    : 26_boss（b_kama 圖集）、49_party（PARTY.list）、53_quest（QST.isDone／choice）、76_vfx（VX.custom）、130_icons（burst）、04_ui（B.feather）。
 * ========================================================================== */
'use strict';
(function () {
  const SC = G.SC, H = G.H, HH = () => G.HERO_H, S = y => SC.depth(y), A = G.ANIM, F = () => G.SAVE.data.flags, ctx = G.ctx;
  const fed = () => !!(G.QST && G.QST.choice && G.QST.choice('c1_weasel') === 'feed');
  const has = () => !!F().kamaFeather;
  const CDF = () => (fed() ? 30 : 60) * 60;
  let cd = 0, run = null, ld = 0, tk = 0;
  const U = () => { const u = A.get('b_kama'); if (!u && !(A.wait && A.wait.b_kama)) {   /* r3.127.2：圖集被記憶體管理釋放後要能重新載入（原本 ld 卡在 1 → 永遠「風還在聚集」） */ ld = 1; try { const q = A.load('b_kama'); if (q && q.catch) q.catch(() => { ld = 0; }); } catch (e) { ld = 0; } } return u; };
  /* ---------- 圖示：翠羽（x3 圖集 fxp_feather_jade_1） ---------- */
  /* ---------- 敵人 ---------- */
  const alive = e => e && e.st !== 'dead' && e.hp > 0 && !e.train;
  function target() { let best = null, bd = 620; for (const e of G.E) { if (!alive(e)) continue; const d = Math.hypot(e.x - H.x, (e.y - H.y) * 1.6); if (d < bd) { bd = d; best = e; } } return best; }
  const inR = (x, y, r) => G.E.filter(e => alive(e) && Math.hypot(e.x - x, (e.y - y) * 1.6) < r * S(y));
  const big = e => !!(e.bb || e.boss || e.elite);
  function hitAll(x, y, r, m, stun) { for (const e of inR(x, y, r)) { const k = (e.bb || e.boss) ? 0.5 : 1; G.damageOni(e, m * k, true); if (stun) { e.stun = Math.max(e.stun || 0, big(e) ? 24 : 60); } } }
  const team = () => [H].concat((G.PARTY && G.PARTY.list || []).filter(P => P.st !== 'down' && P.hp > 0));
  const hurt = () => team().some(q => q.hp < q.hpMax);
  /* ---------- 召喚 ---------- */
  function use() { if (!has()) return; if (cd > 0) { G.UI.toast('鎌鼬之羽還在積風（' + Math.ceil(cd / 60) + ' 秒）'); return; } if (run) return;
    const u = U(); if (!u) { G.UI.toast('風還在聚集……'); return; }
    const tg = target(); if (!tg && !hurt()) { G.UI.toast('附近沒有敵人，大家也都沒受傷'); return; }
    cd = CDF(); const side = H.face || 1, tx = tg ? tg.x : H.x + side * 90, ty = tg ? tg.y : H.y;
    const mkA = (id, sz, dl, sx, sy) => ({ id, sz, dl, x: sx, y: sy, clip: 'run', ft: 0, face: -side, a: 0 });
    run = { t: 0, tg, tx, ty, sc: SC.id, dur: DUR(), A: [mkA('kama1', 1.0, 0, H.x - side * 60, H.y - 10), mkA('kama2', 0.95, 14, H.x - side * 80, H.y + 12), mkA('kama3', 0.85, 28, H.x - side * 50, H.y + 24)] };
    if (G.ICO && G.ICO.burst) G.ICO.burst({ x: H.x, y: H.y }, 'fxp_feather_jade', 5, { z: 0.8 });
    G.AU && G.AU.sfx && G.AU.sfx('magic'); G.UI.toast('鎌鼬三兄弟，借風而來！（' + DUR() / 60 + ' 秒）'); }
  const fxL = [];
  function fx(n, x, y, s, life) { const u = U(), r = u && u.act[n]; if (!r) return; fxL.push({ r, x, y, s, t: 0, life: life || r.f.length * 4 }); }
  function moveTo(a, x, y, sp) { const dx = x - a.x, dy = y - a.y, d = Math.hypot(dx, dy); if (d < sp) { a.x = x; a.y = y; return true; } a.x += dx / d * sp; a.y += dy / d * sp; if (Math.abs(dx) > 2) a.face = dx > 0 ? 1 : -1; return false; }
  /* r3.122.0：三兄弟留場 12 秒（餵過小鼬 15 秒），各自循環出手；沒敵人時跟在主角身邊；換地圖消失 */
  const DUR = () => (fed() ? 15 : 12) * 60;
  function heal(p) { for (const q of team()) { if (q.hp >= q.hpMax) continue; const v = Math.round(q.hpMax * p); q.hp = Math.min(q.hpMax, q.hp + v); G.NUMS && G.NUMS.push({ x: q.x, y: q.y - HH() * S(q.y), v: '+' + v, t: 0, col: '#8fe0a0' }); } }
  function step() { if (cd > 0) cd--; if (++tk % 60 === 0) { grant(); if (has()) U(); }   /* 擁有後預先載入圖集 */ if (!run) return; const R = run, t = ++R.t, k = HH() * S(H.y), sp = k * 0.09;
    if (R.sc !== SC.id) { run = null; return; }
    if (!R.tg || !alive(R.tg)) { R.tg = target(); } if (R.tg) { R.tx = R.tg.x; R.ty = R.tg.y; }
    const [a1, a2, a3] = R.A, live = t < R.dur;
    for (const a of R.A) { if (t > a.dl) a.a = live ? Math.min(1, a.a + 0.12) : Math.max(0, a.a - 0.08); a.ft++; if (a.busy > 0 && --a.busy === 0) { a.clip = 'run'; a.ft = 0; } if (a.cd > 0) a.cd--; }
    const follow = (a, ox, oy) => { if (a.busy > 0) return; if (moveTo(a, H.x - (H.face || 1) * k * ox, H.y + oy, sp)) { if (a.clip !== 'idle') { a.clip = 'idle'; a.ft = 0; } a.face = H.face || 1; } else a.clip = 'run'; };
    if (live && R.tg) {
      /* 長兄：追上目標 → 旋風斬（擊暈），每 3 秒 */
      if (t > a1.dl && !(a1.busy > 0)) { if (moveTo(a1, R.tx - a1.face * k * 0.25, R.ty, sp) && !(a1.cd > 0)) { a1.cd = 180; a1.busy = 30; a1.clip = 'spin'; a1.ft = 0; fx('kama_spin_wake', R.tx, R.ty, 1, 30); hitAll(R.tx, R.ty, k * 1.1, 0.8, 1); SC.shake = Math.max(SC.shake || 0, 4); } else if (!(a1.busy > 0)) a1.clip = 'run'; }
      /* 次兄：繞到另一側 → 風刃三連，每 2.5 秒 */
      if (t > a2.dl && !(a2.busy > 0)) { if (moveTo(a2, R.tx + a1.face * k * 0.4, R.ty + 10, sp) && !(a2.cd > 0)) { a2.cd = 150; a2.busy = 34; a2.go = t; a2.gx = R.tx; a2.gy = R.ty; a2.clip = 'storm'; a2.ft = 0; fx('kama_storm_cuts', R.tx, R.ty, 1.1, 34); } else if (!(a2.busy > 0)) a2.clip = 'run'; }
    } else if (live) { if (t > a1.dl) follow(a1, 0.6, -10); if (t > a2.dl) follow(a2, 0.85, 12); }
    if (a2.go && [4, 13, 22].includes(t - a2.go)) { hitAll(a2.gx, a2.gy, k * 1.2, 1.0, 0); G.AU && G.AU.sfx && G.AU.sfx('hit'); }
    /* 三弟：跟在主角身邊；第一次 15%，之後每 4 秒 5%（有人受傷才塗） */
    if (live && t > a3.dl) { if (!(a3.busy > 0)) follow(a3, -0.35, 6);
      if (!(a3.cd > 0) && (!a3.heal || hurt()) && Math.hypot(a3.x - H.x, a3.y - H.y) < k * 0.8) { a3.cd = 240; a3.busy = 40; a3.clip = 'heal'; a3.ft = 0; a3.face = -(H.face || 1); fx('kama_medicine_fog', H.x, H.y, 1, 40); heal(a3.heal ? 0.05 : 0.15); a3.heal = t; } }
    if (t === R.dur + 2 && G.ICO && G.ICO.burst) G.ICO.burst({ x: (a1.x + a2.x + a3.x) / 3, y: H.y }, 'fxp_feather_jade', 6, { z: 0.6 });
    if (t > R.dur + 16) run = null; }
  /* ---------- 繪製（特效層） ---------- */
  function clipOf(u, a) { return u.act[a.id + '_' + a.clip + '_left3q'] || u.act[a.id + '_run_left3q'] || u.act[a.id + '_idle_left3q']; }
  const VH = {};
  function vh(u, id) { if (VH[id]) return VH[id]; const r = u.act[id + '_idle_left3q']; if (!r) return 200; const L = r.f.map(f => f[5]).sort((p, q) => p - q); return (VH[id] = L[L.length >> 1]); }
  function draw() { const u = A.get('b_kama'); if (!u) return;
    for (let i = fxL.length - 1; i >= 0; i--) { const q = fxL[i]; q.t++; if (q.t > q.life) { fxL.splice(i, 1); continue; } const f = q.r.f[Math.min(q.r.f.length - 1, Math.floor(q.t / q.life * q.r.f.length))], s = S(q.y);
      A.draw(u, f, q.x, q.y, HH() * s * q.s / vh(u, 'kama1'), false, Math.min(1, (q.life - q.t) / 8)); }
    if (!run) return;
    for (const a of run.A.slice().sort((p, q) => p.y - q.y)) { if (a.a <= 0) continue; const r = clipOf(u, a); if (!r) continue; const f = r.f[Math.floor(a.ft / 4) % r.f.length], s = S(a.y), sc = HH() * s * a.sz / vh(u, a.id);
      ctx.save(); ctx.globalAlpha = 0.3 * a.a; ctx.fillStyle = 'rgba(20,14,8,1)'; ctx.beginPath(); ctx.ellipse(a.x, a.y, HH() * s * 0.22, HH() * s * 0.06, 0, 0, 6.283); ctx.fill(); ctx.restore();
      A.draw(u, f, a.x, a.y, sc, a.face > 0, a.a); } }
  /* ---------- 取得 ---------- */
  function grant() { if (has() || !G.QST || !G.QST.isDone || !G.QST.isDone('c1_b_patrol')) return; F().kamaFeather = 1; G.SAVE.markDirty && G.SAVE.markDirty();
    G.UI.banner('獲得　鎌鼬之羽', '按藥鍵左邊的羽毛，召喚鎌鼬三兄弟助戰（冷卻 ' + (fed() ? 30 : 60) + ' 秒）'); }
  /* ---------- 按鍵 ---------- */
  function hud(b) { if (!b || !has() || G.mode !== 'play') return;
    ctx.save(); ctx.fillStyle = 'rgba(18,12,14,.55)'; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 6.283); ctx.fill();
    const g = ctx.createRadialGradient(b.x, b.y, b.r * 0.4, b.x, b.y, b.r); g.addColorStop(0, 'rgba(120,220,190,0)'); g.addColorStop(1, cd > 0 ? 'rgba(120,220,190,.12)' : `rgba(120,220,190,${0.35 + 0.15 * Math.sin(G.t * 0.08)})`); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 6.283); ctx.fill();
    if (!(G.ICO && G.ICO.drawC('fxp_feather_jade_1', b.x, b.y, b.r * 1.7, cd > 0 ? 0.5 : 1))) G.txt('羽', b.x, b.y, 14, G.C.ink, 'center', G.FONT_S, 900);
    ctx.restore();
    if (cd > 0) { ctx.save(); ctx.fillStyle = 'rgba(8,5,8,.6)'; ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.arc(b.x, b.y, b.r - 2, -1.5708, -1.5708 + 6.283 * cd / CDF()); ctx.fill(); ctx.restore(); G.txt(String(Math.ceil(cd / 60)), b.x, b.y + 1, 11, G.C.ink, 'center', G.FONT, 900); } }
  (function hk() { if (!G.STORY || !G.STORY.step || !G.VX || !G.VX.custom) return setTimeout(hk, 60); const st0 = G.STORY.step.bind(G.STORY); G.STORY.step = function () { st0(); try { step(); } catch (e) { console.warn('feather', e); run = null; } }; })();
  (function hkD() { if (!G.drawLoot) return setTimeout(hkD, 60); const d0 = G.drawLoot; G.drawLoot = function () { d0.apply(this, arguments); try { draw(); } catch (e) { console.warn('featherD', e); } }; })();
  G.FEATHER = { has, use, hud, cd: () => cd, CDF, state: () => run };
})();
