/* ==========================================================================
 * 神諭之地 重製版 — 123_btempo.js
 * Version : r3.96.0  (2026-11-26)　r3.96.0：前搖補償含狂暴加速（G.GDIFF.spOf）
 * 舊版    : r3.94.0  (2026-11-26)
 * 變更    : r3.94.0 新增。頭目出招節奏（平衡第 3 步）。
 *           ・逐招計時：出招開始（B.onBegun）算出前搖 W（出手到第一次命中的格數；mini 招＝m.at，其他招＝實測表 TAB）。
 *             目標預警秒數 T＝max（舊手感秒數，下限）× 難度係數，再不低於保底：
 *               下限：小招 0.8 秒、大招 1.4 秒；難度係數：輕鬆 1.3／普通 1／困難 0.9／修羅 0.8／無間 0.7；保底：小招 0.5、大招 0.9 秒。
 *             前搖期間招式與危險區以 m._k＝W／（T×60）／難度動作倍率 推進（26_boss tkOf）→ 預警與命中同一計時，難度加速不壓縮前搖。
 *           ・大招（傷害倍率 ≥ 1.6，或 ult／storm／mugen）：固定瞄準主角（26 begin／stepUnit），沒有危險區的大招前搖時頭上顯示紅色「！」。
 *           ・G.BT.log：最近出招的 W／T 紀錄（量測表用）。
 * 依賴    : 26_boss（B.onBegin／B.onBegun、tkOf）、73_diff（G.GDIFF.i／cur）、32_boss_orochi（G.BT.dk）。
 * ========================================================================== */
'use strict';
(function () {
  /* 實測表：頭目 id → { 'actor:招式': [前搖格數 W, 傷害倍率, 有無危險區 1/0] }（r3.94.0 量測，普通難度、tk 前） */
  const TAB = {"omagatsuhi":{"omagatsuhi:mirror":[66,1.2,1],"omagatsuhi:rain":[54,0.9,1],"omagatsuhi:volley":[54,1,1],"omagatsuhi:shard":[69,0.8,1],"omagatsuhi:combo":[27,1.3,1],"omagatsuhi:ult":[75,1,1]},"ezo":{"bear:bite":[42,1.2,1],"bear:shove":[45,1.1,1],"hearth:bolt":[60,0.9,0],"bear:claw":[36,1.1,1],"bear:roar":[42,0.8,1],"hearth:pillar":[54,1.2,1],"bear:charge":[74,1.5,1]},"raiju":{"raijuo:rain":[63,1.2,1],"raijuo:dash":[53,1.5,1],"raijuo:cloud":[48,1.2,1]},"watatsumi":{"watatsumi:pillars":[66,1.1,1],"watatsumi:sweep":[36,1.1,1],"watatsumi:thrust":[48,1.2,1],"watatsumi:ult":[221,2.2,0]},"susanoo":{"susanoo:thrust":[35,1.2,1],"susanoo:slash1":[33,1,1],"susanoo:overhead":[48,1.4,1],"susanoo:tornado":[48,0.7,1],"susanoo:bolt":[60,1,1]},"kappa":{"kappataisho:push":[42,1.3,1],"kappataisho:roll":[61,1.5,1],"kappataisho:falls":[72,1.2,1],"kappataisho:ult":[175,2,1]},"shuten":{"shuten:combo":[31,1.4,1],"shuten:drunk":[53,1.2,1],"shuten:toss":[48,1,1],"shuten:ult":[126,1.6,0]},"doma":{"doma:stamp":[55,0.9,1],"doma:edict":[56,1,1]},"ezo_shadow2":{"hearth:sweep":[36,1,0],"hearth:bolt":[51,0.9,0],"hearth:pillar":[54,1.2,1]},"kyubi":{"kyubi:beam":[62,1.6,1],"kyubi:fire":[71,0.9,1],"kyubi:charm":[2,0.7,1],"kyubi:ult":[135,2.2,0]},"tsuchigumo":{"tsuchigumo:stab":[36,1.1,1],"tsuchigumo:spit":[42,0.8,1],"tsuchigumo:drop":[179,1.4,1]},"yoshitsune":{"yoshitsune:combo":[27,0.9,1],"yoshitsune:iai":[42,1.3,1],"yoshitsune:praying":[86,1.1,0]},"oni":{"oniking:chain":[44,0.8,1],"oniking:sweep":[44,1.4,1],"oniking:slam":[48,1.5,1]},"izanami":{"izanami:thunder":[48,1,1],"izanami:wisps":[60,0.8,0],"izanami:ult":[210,2.2,0]},"seimei":{"seimei:fan":[36,1,0],"seimei:talisman":[50,0.7,0],"seimei:crane":[84,1,1]},"kama":{"kama2:boom":[97,1,1],"kama1:spin":[48,1.6,1],"kama1:trio":[34,0.4,1],"kama3:trio":[20,0.25,0],"kama2:bamboo":[50,1.2,1],"kama3:heal":[25,0.25,0]},"osakabe":{"osakabe:fan":[60,0.8,1],"osakabe:needle":[51,1,1],"osakabe:shadow":[120,0.8,1],"osakabe:ult":[132,2.2,0]},"ibaraki":{"ibaraki:jump":[99,1.3,1],"ibaraki:throw":[59,1.1,1],"ibaraki:slam":[42,1,1],"ibaraki:claw":[31,1,1],"ibaraki:ult":[171,0.6,0]},"ezo_shadow":{"bear:bite":[42,1.2,1],"bear:shove":[45,1.1,1],"bear:claw":[36,1.1,1],"bear:slam":[37,1.2,1],"bear:roar":[42,0.8,1]}};
  const DK = [1.3, 1, 0.9, 0.8, 0.7];
  const di = () => Math.max(0, Math.min(4, (G.GDIFF && G.GDIFF.i && G.GDIFF.i()) || 0));
  const BT = G.BT = { TAB, DK, log: [], dk: () => DK[di()],
    sp: e => { if (G.GDIFF && G.GDIFF.spOf) return G.GDIFF.spOf(e) || 1; const c = G.GDIFF && G.GDIFF.cur && G.GDIFF.cur(); return c && c.sp > 0 ? c.sp : 1; },   // r3.96.0：含狂暴加速
    key: (e, m) => e.actor + ':' + m.k + (m.s && m.s.c ? ':' + m.s.c : ''),
    row(e, m) { const t = e.enc && TAB[e.enc.id]; return t ? t[BT.key(e, m)] : null; },
    big(e, m) { if (/ult|storm|mugen/.test(m.k)) return true; if (m.s) return (m.s.m || 0) >= 1.6 || !!m.s.ult; const r = BT.row(e, m); return !!(r && r[1] >= 1.6); },
    /* 目標預警秒數 */
    target(rawSec, big) { const fl = big ? 1.4 : 0.8, hard = big ? 0.9 : 0.5; return Math.max(Math.max(rawSec, fl) * BT.dk(), hard); } };

  (function hook() { const B = G.BOSS; if (!B || !B.api) return setTimeout(hook, 50);
    B.onBegin = function (e, m) { m._big = BT.big(e, m); };
    B.onBegun = function (e, m) { if (!e.mv || e.mv !== m) return;
      let W = 0, legacy = 1; const r = BT.row(e, m);
      if (m.k === 'mini' && m.at > 0) W = m.at;
      else if (r && r[0] > 0) { W = r[0]; if (r[2] && e.enc && e.enc.tk0 < 1) legacy = 1 / e.enc.tk0; }
      if (!W) return;
      const T = BT.target(W / 60 * legacy, m._big), k = Math.min(1, W / (T * 60) / BT.sp(e));
      m._W = W; m._k = k; m._T = T; m._warn = m._big && !(r && r[2]) && m.k !== 'mini';
      BT.log.push([e.enc && e.enc.id, BT.key(e, m), W, +(W / 60 * legacy).toFixed(2), +T.toFixed(2), +k.toFixed(2), m._big ? 1 : 0]); if (BT.log.length > 200) BT.log.shift(); };
    /* 表上沒有的招（狂暴、第二型態新招）：第一次出手時記下前搖，之後就套用 */
    const hh0 = G.hurtHero; G.hurtHero = function (atk, sx) { const enc = B.enc;
      if (enc && !enc.done) { const u = enc.units.find(q => Math.abs(q.x - sx) < 0.01), m = u && u.mv;
        if (m && !m._lw && m.k !== 'mini' && m.t > 0) { m._lw = 1; const t = TAB[enc.id] || (TAB[enc.id] = {}), k = BT.key(u, m);
          if (!t[k]) t[k] = [m.t, +(atk / Math.max(1, u.atk)).toFixed(2), B.tg.some(q => q.e === u) ? 1 : 0]; } }
      return hh0.apply(this, arguments); };
    /* 沒有危險區的大招：前搖時頭上紅色「！」 */
    const d0 = G.drawOni; G.drawOni = function (e) { const r = d0.apply(this, arguments); const m = e && e.bb && e.mv;
      if (m && m._warn && m.t < m._W && e.st !== 'dead') { const s = G.SC.depth(e.y), y = e.y - G.HERO_H * (e.size || 1) * s - 14, a = 0.6 + 0.4 * Math.sin(G.t * 0.4);
        G.ctx.save(); G.ctx.globalAlpha = a; G.txt('！', e.x, y, 26 * s + 6, '#ff5a46', 'center', G.FONT_S, 900); G.ctx.restore(); }
      return r; };
  })();
})();
