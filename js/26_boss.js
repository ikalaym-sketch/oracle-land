/* ==========================================================================
 * 神諭之地 重製版 — 26_boss.js
 * Version : r3.146.0  (2026-11-27)　r3.146.0：頭目血條移到畫面上方中央
 * 舊版    : r3.145.0  (2026-11-27)　r3.145.0：預警調淡（底色約減半、圖示平常 30%，出手前才亮）
 * 舊版    : r3.117.0  (2026-11-26)　r3.117.0：友軍頭目模式：B.allyStart／allyEnd，用原本招式打敵人（目標＝最近敵人、傷害依主角攻擊、對頭目減半），友軍不畫預警、不推主角、召喚招式不生怪；敵方頭目範圍招也會打到友軍；九尾分身類招式友軍不用
 * 舊版    : r3.96.0  (2026-11-26)　r3.96.0：出招間隔倍率 enc.ck 小於 1 也生效（狂暴、第二型態）
 * 舊版    : r3.94.0  (2026-11-26)　r3.94.0：預兆改逐招計時（B.onBegin 設 m._k／m._W；預兆與命中同一計時，危險區同步放慢）；大招固定瞄準主角；破綻 ×1.5 改易傷區
 * 舊版    : r3.52.1  (2026-11-23)　r3.52.1：頭目戰開打清掉路人時，任務標記一起收起（打完自動重建）
 * 舊版    : r3.51.0  (2026-11-18)　r3.51.0：章節頭目／小頭目血量 ×3
 * 舊版    : r3.39.0  (2026-11-17)  r3.39.0：頭目陰影隨透明度淡出；戰鬥結束清掉頭目單位
 * 舊版    : r3.38.0  (2026-11-17)  r3.38.0：預警換第二代素材（圓／直線／鎖定準星，依顏色上色）；章節頭目節奏放慢
 *           ・預兆期間（該頭目自己放的危險區還沒結束）出招與動畫以 tk 倍速進行：普通～困難 1/1.35、修羅／無間 1/1.15
 *           ・收招後多 0.2 秒破綻；出招間隔（enc.cd）×1.2（修羅以上 ×1.1）。小頭目（mb_）、隱藏頭目（h_／t_）已另外調過，不套用
 * 舊版    : r3.19.2  （r3.19.2：頭目也會改打誘敵分身）
 * 舊版    : r3.10.0  (2026-11-13)
 * 變更    : r3.10.0 頭目依仇恨選目標（G.BTGT 代理：頭目讀 H.x/H.y＝目前目標）；範圍招判定主角與夥伴，打到誰扣誰。
 * 變更    : r3.9.0 擊敗時呼叫 G.BOSS.onEnd(enc)（夥伴信物掉落用）。
 * 變更    : r3.9.0 actor 可各自指定 unit（不同圖集的雙小頭目）；頭目可宣告 extra（額外圖集，如源義經的四天王），進場時一併載入。
 * 變更    : r3.8.9 頭目可宣告 foes（召喚用小怪），進場時一併載入圖集。
 * 變更    : r3.8.7 掛勾：drawSelf（整隻自繪，如八岐蛇頭）。
 * 變更    : r3.8.4 掛勾：underBody（本體下層，如九尾尾巴）、preDamage（命中前攔截，如分身）、idle（自訂待機）、nobar（隱藏頭頂血條）。
 * 變更    : r3.8.1 框架通用化：各頭目以 G.BOSS.reg(id, def) 註冊（原圖朝向 nat、片段後綴 dir／brk、自有招式 mv、指揮 director、
 *           受傷 onDamage、額外繪製 drawUnder／drawOver、地圖對應 map）；章節頭目地圖改由 18_world 呼叫 G.BOSS.mapStart。
 * 變更    : r3.8.0 新增。P3 頭目框架＋鎌鼬三兄弟（第一章・風口護巢灘）。
 *           ‧ 圖集 a/p/b_<id>.json（P3 game_size 逐幀、原毫秒、逐格錨點）；原圖面向左 → 面右時鏡像。
 *           ‧ 招式三段：預兆（地面紅色危險區）→ 出手（判定只成立一次）→ 收招（破綻）。
 *           ‧ 階段：三人分工（一次只一人進攻，補藥不佔名額）→ 兩人接力 → 最後一人用必殺 → 無間＋血量<15% 鎌鼬嵐。
 *           ‧ 長兄大鎌可破壞（暈眩中累積傷害）；三弟補藥 3 瓶、受擊即中斷；次兄投鎌時尾端無刃、回收後復位。
 * 依賴    : 00_core、12_anim、02_scene、03_actors（oniStep／drawOni／damageOni／hurtHero／drawLoot）、04_ui。
 * 介面    : G.BOSS.start(id, {x,y,lv,diff,onWin})、G.BOSS.force(actor, move)（測試用）、G.BOSS.load(id)。
 * ========================================================================== */
'use strict';
(function () {
  /* 頭目目標代理：頭目讀 H.x／H.y 時取「本隻頭目依仇恨選定的目標」（主角或夥伴），其餘欄位仍是主角 */
  const HR = G.H; let BCUR = null, TCUR = null, ALLY = false;   /* r3.117.0：ALLY＝目前在處理友軍頭目（目標＝敵人、傷害打敵人、不畫預警、不動主角） */
  G.BTGT = new Proxy(HR, { get(t, k) { if ((k === 'x' || k === 'y') && BCUR && BCUR !== HR && BCUR.st !== 'down') return BCUR[k]; const v = t[k]; return typeof v === 'function' ? v.bind(t) : v; }, set(t, k, v) { if (ALLY) return true; t[k] = v; return true; } });
  const ctx = G.ctx, H = G.BTGT, SC = G.SC, A = G.ANIM, TK = 1000 / 60, HH = () => G.HERO_H;
  const foes = () => G.E.filter(o => o.st !== 'dead' && o.hp > 0 && !o.train && !o.ally && !o.doll && o.alpha !== 0);
  const allyTgt = e => { let b = null, bd = 1e9; for (const o of foes()) { const d = Math.hypot(o.x - e.x, (o.y - e.y) * 1.6); if (d < bd) { bd = d; b = o; } } return b; };
  const tgtOf = e => e && e.ally ? (allyTgt(e) || HR) : (G.PARTY && (G.PARTY.list.length || (G.DECOY && G.DECOY())) ? G.PARTY.targetOf(e) : HR);   // r3.19.2：誘敵分身
  let IN = [], INT = -1;   // 本格範圍判定命中的對象（主角／夥伴）
  const rnd = (a, b) => a + Math.random() * (b - a), sgn = v => (v < 0 ? -1 : 1);
  const B = G.BOSS = { enc: null, fx: [], tg: [], zones: [], proj: [], props: [], allies: [], ALLYBAN: { kyubi: ['clone', 'tamamo'] } };

  /* ---------------- 頭目定義 ---------------- */
  const DEF = {
    kama: { name: '鎌鼬三兄弟', sub: '守護風路的三兄弟', unit: 'b_kama', hpK: 4, atkK: 1, nat: -1, dir: 'left3q', brk: 'sickle_broken',
      actors: [
        { id: 'kama1', name: '長兄', size: 1.35, moves: ['spin'] },
        { id: 'kama2', name: '次兄', size: 1.25, moves: ['boom', 'bamboo'], p2: ['boom3'] },
        { id: 'kama3', name: '三弟', size: 1.1, moves: ['fog'] }] }
  };

  B.DEF = DEF; B.MAP = {};
  B.reg = (id, d) => { DEF[id] = d; for (const m of d.map || []) B.MAP[m] = id; };
  B.load = id => Promise.all([DEF[id].unit].concat(DEF[id].actors.map(a => a.unit).filter(Boolean)).map(k => A.load(k)));
  const U = e => A.get(e.unit);
  // 片段名稱：部位破壞狀態有專屬版本就用專屬版本（後綴依頭目：left3q／right3q、sickle_broken／dish_broken）
  function clip(e, n) { const u = U(e); if (!u) return null; const D = e.D, b = e.broken && D.brk && u.act[e.actor + '_' + n + '_' + D.brk + '_' + D.dir];
    return b || u.act[e.actor + '_' + n + '_' + D.dir] || u.act[e.actor + '_' + n] || u.act[n] || null; }
  const flip = (face, nat) => face * (nat || -1) < 0;   // 原圖朝向與目前朝向不同 → 鏡像
  function play(e, n, loop) { e.an = n; e.at = 0; e.aloop = !!loop; e.adur = 0; }
  const sc = e => HH() * e.size * SC.depth(e.y) / e.vh;
  const chestY = e => e.y - HH() * e.size * SC.depth(e.y) * 0.45;

  /* ---------------- 共用：特效、危險區、命中 ---------------- */
  function fx(e, n, x, y, o) { const r = clip(e, n); if (!r) return null; const f = Object.assign({ u: e.unit, r, x, y, s: sc(e), face: e.face, nat: e.D.nat, t: 0, life: Math.round(A.dur(r) / TK) }, o || {});
    B.fx.push(f); return f; }
  function lane(x0, y0, x1, y1, w, life, col) { const t = { k: 'lane', x0, y0, x1, y1, w, t: 0, life, col: col || '230,60,40', e: TCUR, ally: ALLY || !!(TCUR && TCUR.ally) }; B.tg.push(t); return t; }
  function circle(x, y, r, life, col) { const t = { k: 'circle', x, y, r, t: 0, life, col: col || '230,60,40', e: TCUR, ally: ALLY || !!(TCUR && TCUR.ally) }; B.tg.push(t); return t; }
  // 主角是否在線段帶內（y 方向壓扁，模擬斜俯視）
  const who = () => { if (ALLY) return foes(); const L = [HR]; if (G.PARTY) for (const P of G.PARTY.list) if (P.st !== 'down') L.push(P); for (const a of B.allies) for (const u of a.units) if (u.st !== 'dead') L.push(u); return L; };
  const mark = L => { IN = L; INT = G.playT; return L.length > 0; };
  function inLane(x0, y0, x1, y1, w) { const dx = x1 - x0, dy = (y1 - y0) * 1.6, L2 = dx * dx + dy * dy || 1;
    return mark(who().filter(o => { const t = Math.max(0, Math.min(1, ((o.x - x0) * dx + (o.y - y0) * 1.6 * dy) / L2)); const px = x0 + dx * t, py = y0 * 1.6 + dy * t;
      return Math.hypot(o.x - px, o.y * 1.6 - py) < w; })); }
  const inCircle = (x, y, r) => mark(who().filter(o => Math.hypot(o.x - x, (o.y - y) * 1.6) < r));
  /* 傷害：本格有範圍判定 → 打範圍內所有人；否則打目前目標 */
  const hit = (e, m) => { const L = INT === G.playT && IN.length ? IN : [BCUR || HR]; let r = false;
    for (const o of L) { if (!o) continue; if (ALLY || (e && e.ally)) { if (o === HR || o.ally || (G.PARTY && G.PARTY.list.includes(o))) continue; G.damageOni(o, m * 1.2 * (o.bb || o.boss ? 0.5 : 1), true, false, { party: e, atk: G.RPG.S.atk, crit: 10, critD: 150 }); r = true; continue; }
      if (o.ally) { o.hp = Math.max(0, o.hp - e.atk * m * 0.6); o.flash = 8; r = true; continue; }
      r = (o === HR ? G.hurtHero(e.atk * m, e.x) : G.PARTY.hurt(o, e.atk * m, e.x, e)) || r; } IN = []; return r; };
  function walkTo(e, tx, ty, sp) { const dx = tx - e.x, dy = ty - e.y, d = Math.hypot(dx, dy); if (d < sp) return true;
    const nx = e.x + dx / d * sp, ny = e.y + dy / d * sp * 0.7; if (SC.walkable(nx, ny)) { e.x = nx; e.y = ny; } else if (SC.walkable(nx, e.y)) e.x = nx; else return true;
    if (Math.abs(dx) > 3) e.face = sgn(dx); return false; }
  // 直線衝刺終點：沿路遇不可走就停
  function dashEnd(x, y, dx, dy, dist) { let ex = x, ey = y; const n = Math.ceil(dist / 8);
    for (let i = 1; i <= n; i++) { const px = x + dx * dist * i / n, py = y + dy * dist * i / n; if (!SC.walkable(px, py)) break; ex = px; ey = py; } return [ex, ey]; }
  function dirTo(e, maxDy) { let dx = H.x - e.x, dy = (H.y - e.y); const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d; dy = Math.max(-maxDy, Math.min(maxDy, dy)); const n = Math.hypot(dx, dy); return [dx / n, dy / n]; }

  /* ---------------- 招式 ----------------
   * 每招：{ go(e,m) 開始, step(e,m) 每格，回傳 true＝結束 }；m.t＝本招經過格數 */
  const S = s => Math.round(s * 60), BAMBOO = 1.6;   // 竹子道具相對本體放大（竹高約 2.4 個主角）
  const MV = {
    /* 長兄・旋風衝：伏低 0.6s → 尾鎌帶身直線旋進 0.65s → 止步暈眩 0.85s（破綻；破鎌距離減半） */
    spin: { go(e, m) { const [dx, dy] = dirTo(e, 0.35); m.dx = dx; m.dy = dy; e.face = sgn(dx); const dist = HH() * (e.broken ? 2.6 : 5.2);
        [m.ex, m.ey] = dashEnd(e.x, e.y, dx, dy, dist); m.sx = e.x; m.sy = e.y; m.tg = lane(e.x, e.y, m.ex, m.ey, HH() * 0.55, S(0.6)); play(e, 'spin'); m.hold = 1; },
      step(e, m) {
        if (m.t < S(0.6)) { e.at = Math.min(e.at, 190); return false; }                         // 預兆：停在伏低格
        if (m.t < S(0.6) + 39) { const k = (m.t - S(0.6)) / 39; e.x = m.sx + (m.ex - m.sx) * k; e.y = m.sy + (m.ey - m.sy) * k;   // 旋進 39 格
          if (m.t === S(0.6)) { play(e, 'spin', true); e.at = 200; m.w = fx(e, 'kama_spin_wake', e.x, e.y, { follow: e, loop: 1, life: 39 }); }
          if (e.at > 500) e.at = 200;                                                            // 旋轉格循環
          if (!m.hit && inCircle(e.x, e.y - 4, HH() * 0.75)) m.hit = hit(e, 1.6); return false; }
        if (m.t === S(0.6) + 39) { play(e, 'dizzy', true); e.dizzy = 1; }
        if (m.t < S(0.6) + 39 + S(0.85)) return false;
        e.dizzy = 0; return true; } },

    /* 次兄・迴旋鎌：抬尾 0.6s → 飛鎌弧線出去再返回（1.5s，去回各判定一次）→ 收招 0.25s */
    boom: { go(e, m) { m.n = 1; MV.boom._go(e, m); }, _go(e, m) { e.face = sgn(H.x - e.x); play(e, 'throw'); m.rel = []; for (let i = 0; i < m.n; i++) m.rel.push(S(0.6) + S(0.18) * i);
        const tx = H.x, ty = H.y; m.tg = lane(e.x, e.y, tx + sgn(tx - e.x) * HH(), ty, HH() * 0.4, S(0.6) + S(0.18) * (m.n - 1), '230,120,40'); },
      step(e, m) {
        m.rel.forEach((r, i) => { if (m.t === r) { const off = (i - (m.n - 1) / 2) * HH() * 0.9, tx = H.x + sgn(H.x - e.x) * HH() * 1.2, ty = H.y + off;
          B.proj.push({ k: 'sickle', e, x: e.x, y: e.y, sx: e.x, sy: e.y, tx, ty, t: 0, life: S(1.5), hit: [0, 0] }); e.noBlade = (e.noBlade || 0) + 1; } });
        if (e.noBlade > 0) e.at = Math.min(Math.max(e.at, 600), 1600);                           // 尾端無刃格：等飛鎌回收
        if (m.t > m.rel[m.rel.length - 1] && !e.noBlade && !m.back) { m.back = m.t; e.at = 2100; }  // 回收 → 播最後落位格
        return m.back && m.t > m.back + S(0.25); } },
    boom3: { go(e, m) { m.n = 3; MV.boom._go(e, m); }, step: (e, m) => MV.boom.step(e, m) },

    /* 次兄・竹斬：逼近（最多 1.6s）→ 一次尾鎌揮切（判定一次＋竹屑）→ 倒竹預兆 0.6s → 竹倒地判定 → 收招 0.4s */
    bamboo: { go(e, m) { play(e, 'run', true); m.ph = 0; },
      step(e, m) {
        if (m.ph === 0) { const near = Math.abs(H.x - e.x) < HH() * 1.4 && Math.abs(H.y - e.y) < 26;
          if (near || m.t > S(1.6) || walkTo(e, H.x - sgn(H.x - e.x) * HH(), H.y, 3.4)) { m.ph = 1; m.t0 = m.t; e.face = sgn(H.x - e.x); play(e, 'bamboo'); } return false; }
        const k = m.t - m.t0;
        if (m.ph === 1) {
          if (k === 15 && !m.cut) { m.cut = 1; fx(e, 'kama_bamboo_impact', e.x + e.face * HH() * 0.9, e.y); if (Math.abs(H.x - (e.x + e.face * HH() * 0.8)) < HH() * 1.0 && Math.abs(H.y - e.y) < 26) hit(e, 1.2); }
          if (k === 30) { const u = U(e), r = u.act.kama_bamboo_fall, lf = r.f[r.f.length - 1], ps = sc(e) * BAMBOO, ox = e.x + e.face * HH() * 0.9, oy = e.y - 4;
            const a = ox + e.face * (-lf[4] * ps), b = ox + e.face * ((lf[2] - lf[4]) * ps); m.bx = ox; m.by = oy; m.bf = e.face; m.l0 = a; m.l1 = b; lane(a, oy, b, oy, HH() * 0.5, S(0.6)); }
          if (k === 30 + S(0.6)) { B.props.push({ e, n: 'kama_bamboo_fall', x: m.bx, y: m.by, face: -m.bf, t: 0, hold: S(3), s: sc(e) * BAMBOO, dmg: { x0: m.l0, y0: m.by, x1: m.l1, y1: m.by, at: 30 } }); m.ph = 2; m.t1 = m.t; }
          return false; }
        return m.t > m.t1 + S(0.4); } },

    /* 三弟・藥霧：抬掌 0.35s 擲藥壺 → 落點預兆 0.8s → 藥霧 4s（每 0.5s 判定） */
    fog: { go(e, m) { e.face = sgn(H.x - e.x); play(e, 'fog'); },
      step(e, m) {
        if (m.t === S(0.35)) B.proj.push({ k: 'amp', e, x: e.x + e.face * 20, y: e.y, sx: e.x + e.face * 20, sy: e.y, tx: H.x, ty: H.y, t: 0, life: S(0.5) });
        return m.t > S(0.35) + S(0.6); } },

    /* 三弟・止血藥：引導 1.2s，金線連到目標，受擊即中斷；完成回復 25%（藥 3 瓶） */
    heal: { go(e, m) { e.face = sgn(m.to.x - e.x) || e.face; play(e, 'heal'); m.tf = { k: 'tether', e, to: m.to, t: 0 }; B.fx.push(m.tf); },
      step(e, m) { if (m.to.st === 'dead') { m.tf.life = 0; return true; }
        if (m.t === S(1.2)) { m.tf.life = 0; const v = Math.round(m.to.hpMax * 0.25); m.to.hp = Math.min(m.to.hpMax, m.to.hp + v); e.enc.stock--;
          G.NUMS.push({ x: m.to.x, y: chestY(m.to) - 20, v: '+' + v, gold: true, t: 0 }); }
        return m.t > S(1.5); },
      stop(e, m) { if (m.tf) m.tf.life = 0; } },

    /* 合作・三位一體：存活者繞場奔跑 5s；旋風預兆 0.8s → 旋風 4.2s 緩慢追人（每 0.4s 判定） */
    trio: { go(e, m) { play(e, 'run', true); m.a0 = e.idx * 2.094;   // 三人各佔 120° 繞場
        if (e.lead) { const x = H.x, y = H.y; circle(x, y, HH() * 0.95, S(0.8)); B.zones.push({ k: 'vortex', e, x, y, t: -S(0.8), life: S(4.2), r: HH() * 0.95, every: 24 }); } },
      step(e, m) { const a = m.a0 + m.t * 0.022, R = HH() * 3, tx = H.x + Math.cos(a) * R, ty = H.y + Math.sin(a) * R * 0.45; walkTo(e, tx, ty, 3.2);
        if (m.t >= S(5)) { play(e, 'idle', true); } return m.t > S(5.3); } },

    /* 最後存者・必殺 風神一閃：橫貫全場風路預兆 1.0s → 15 格疾斬 → 收招 0.6s */
    ult: { go(e, m) { const W = SC.def.w; m.y = H.y; m.from = e.x < H.x ? -1 : 1; m.sx = e.x; m.sy = e.y;
        m.x0 = Math.max(40, H.x - HH() * 7); m.x1 = Math.min(W - 40, H.x + HH() * 7); if (m.from > 0) [m.x0, m.x1] = [m.x1, m.x0];
        lane(m.x0, m.y, m.x1, m.y, HH() * 0.5, S(1.0), '200,220,255'); m.wl = { k: 'lanefx', e, n: 'kama_wind_lane', x0: m.x0, x1: m.x1, y: m.y, t: 0, life: S(1.0) }; B.fx.push(m.wl);
        play(e, 'run', true); },
      step(e, m) {
        if (m.t < S(1.0)) { walkTo(e, m.x0, m.y, 5); return false; }
        if (m.t === S(1.0)) { e.x = m.x0; e.y = m.y; e.face = sgn(m.x1 - m.x0); play(e, 'ult'); }
        if (m.t <= S(1.0) + 15) { const k = (m.t - S(1.0)) / 15; const ox = e.x; e.x = m.x0 + (m.x1 - m.x0) * k;
          if (m.t === S(1.0) + 8) B.fx.push({ k: 'lanefx', e, n: 'kama_ult_cut', x0: m.x0, x1: m.x1, y: m.y, t: 0, life: 36 });
          if (!m.hit && Math.abs(H.y - m.y) < 22 && (H.x - ox) * (H.x - e.x) <= 0) m.hit = hit(e, 2.5); return false; }
        return m.t > S(1.0) + 15 + S(0.6); } },

    /* 無間・鎌鼬嵐：三條交叉風路，三兄弟本尊（倒下者以殘影）各衝一次：預兆 0.7s → 10 格衝刺 → 間隔 0.2s，收招 0.4s */
    storm: { go(e, m) { m.i = 0; m.t0 = 0; play(e, 'idle', true); MV.storm.lane(e, m); },
      lane(e, m) { const ang = [-0.5, 0.5, 0][m.i] + rnd(-0.15, 0.15), R = HH() * 4; m.x0 = H.x - Math.cos(ang) * R; m.y0 = H.y - Math.sin(ang) * R * 0.5; m.x1 = H.x + Math.cos(ang) * R; m.y1 = H.y + Math.sin(ang) * R * 0.5;
        if (m.i % 2) { [m.x0, m.x1] = [m.x1, m.x0]; [m.y0, m.y1] = [m.y1, m.y0]; } lane(m.x0, m.y0, m.x1, m.y1, HH() * 0.45, S(0.7)); m.hit = 0;
        const who = e.enc.units[m.i]; m.g = { k: 'ghost', e: who === e ? null : who, src: e, x: m.x0, y: m.y0, face: sgn(m.x1 - m.x0), t: 0, life: S(0.7) + 10 + 8 }; if (m.g.e) B.fx.push(m.g); },
      step(e, m) { const k = m.t - m.t0, body = m.g.e ? m.g : e;
        if (k < S(0.7)) { if (!m.g.e) { e.x = m.x0; e.y = m.y0; e.face = m.g.face; } return false; }
        if (k === S(0.7)) { if (m.g.e) m.g.an = 'storm'; else play(e, 'storm'); fx(e, 'kama_storm_cuts', (m.x0 + m.x1) / 2, (m.y0 + m.y1) / 2, { face: m.g.face }); }
        if (k <= S(0.7) + 10) { const q = (k - S(0.7)) / 10; body.x = m.x0 + (m.x1 - m.x0) * q; body.y = m.y0 + (m.y1 - m.y0) * q; if (!m.g.e) { e.x = body.x; e.y = body.y; }
          if (!m.hit && inLane(m.x0, m.y0, body.x, body.y, HH() * 0.45)) m.hit = hit(e, 1.8); return false; }
        if (k < S(0.7) + 10 + S(0.2)) return false;
        if (++m.i < 3) { m.t0 = m.t; MV.storm.lane(e, m); return false; }
        if (k < S(0.7) + 10 + S(0.6)) return false; return true; } }
  };

  /* ---------------- 遭遇：生成、階段、輪替 ---------------- */
  B.start = function (id, o) {
    o = o || {}; const D = DEF[id], u = A.get(D.unit); if (!u) { console.warn('boss not loaded', id); return null; } if (G.VX && G.VX.x2) G.VX.x2('x2_boss');
    const lv = o.lv || (SC.def.lv || 1) + 2, base = (70 + 30 * (lv - 1)) * 3, atk = Math.round((10 + 4 * (lv - 1)) * D.atkK), n = D.actors.length;
    const enc = B.enc = { id, D, units: [], stock: 3, diff: o.diff || 0, cd: S(1.5), trioCd: S(14), ultCd: S(4), stormCd: 0, onWin: o.onWin, done: false, t: 0, name: D.name, v: {} };
    D.actors.forEach((a, i) => { const ua = A.get(a.unit || D.unit) || u, idle = ua.act[a.id + '_idle_' + D.dir]; const vh = idle.f.map(f => f[5]).sort((p, q) => p - q)[idle.f.length >> 1];
      let x = (o.x || H.x + HH() * 4) + (n > 1 ? (i - 1) * HH() * 1.6 : 0), y = (o.y || H.y) + (n > 1 ? [0, -26, 26][i] : 0);
      const sp = SC.snap(x, y, 'open', 400) || SC.snap(x, y, 'walk', 600); if (sp) [x, y] = sp;   // 生成點校正到寬敞可走處
      const e = { type: 'b_' + id, bb: 1, enc, D, actor: a.id, name: a.name, def0: a, unit: a.unit || D.unit, size: a.size, vh, ratio: a.size, x, y, lv, atk, def: 2 * lv,
        hp: base * D.hpK, hpMax: base * D.hpK, face: -1, st: 'walk', t: 0, at: 0, an: 'idle', aloop: true, delay: 0, flash: 0, kb: 0, alpha: 1, boss: true, re: !!o.re, mv: null, poise: 0, idx: i, ph: Math.random() * 1000, brk: 0 };
      enc.units.push(e); G.E.push(e); });
    if (D.init) D.init(enc);
    if (G.AMB && G.AMB.list) { const L = G.AMB.list, L0 = L.slice(); G.NPC = G.NPC.filter(n => !L.includes(n)); L.length = 0;
      if (G.QST) for (const m of G.QST.marks) if (m.n && L0.includes(m.n)) { m.n = null; m.x = -9999; } }   // 交戰中不讓路人走進場；r3.52.1：任務人物一起退場，標記也收起（不留地上的空框），打完重建
    G.UI.banner(D.name, o.sub || D.sub || ''); return enc;
  };
  const alive = enc => enc.units.filter(e => e.st !== 'dead');
  function phase(enc) { const L = alive(enc); if (L.length >= 3) return 1; if (L.length === 2) return 2; const e = L[0]; return e && enc.diff >= 3 && e.hp < e.hpMax * 0.15 ? 4 : 3; }
  const mvOf = (e, k) => (e.D.mv && e.D.mv[k]) || MV[k];
  function begin(e, k, extra) { if (e.ally && (B.ALLYBAN[e.enc.id] || []).includes(k)) return; e.mv = Object.assign({ k, t: 0 }, extra || {}); if (B.onBegin) B.onBegin(e, e.mv); BCUR = e.mv._big && !e.ally ? HR : tgtOf(e); e.st = 'atk'; TCUR = e; try { mvOf(e, k).go(e, e.mv); } finally { TCUR = null; } if (B.onBegun) B.onBegun(e, e.mv); }   // r3.94.0：大招固定瞄準主角
  function end(e) { const m = e.mv; if (m && mvOf(e, m.k).stop) mvOf(e, m.k).stop(e, m); e.mv = null; e.dizzy = 0; e.st = 'walk'; play(e, 'idle', true); }
  B.force = function (actor, k) { const e = B.enc && B.enc.units.find(u => u.actor === actor); if (!e || e.st === 'dead') return false;
    if (e.mv) end(e); if (k === 'heal') { const to = B.enc.units.find(u => u !== e && u.st !== 'dead') || e; begin(e, 'heal', { to }); }
    else if (k === 'trio') { const L = alive(B.enc); L.forEach((u, i) => { if (u.mv) end(u); u.lead = i === 0; begin(u, 'trio'); }); } else begin(e, k); B.enc.cd = S(99); return true; };

  function director(enc) {   // 一次只派一人進攻；補藥另計
    enc.t++; if (enc.cd > 0) enc.cd--; if (enc.trioCd > 0) enc.trioCd--; if (enc.ultCd > 0) enc.ultCd--; if (enc.stormCd > 0) enc.stormCd--;
    const L = alive(enc), ph = phase(enc), busy = L.some(e => e.mv && e.mv.k !== 'heal');
    const k3 = L.find(e => e.actor === 'kama3');
    if (k3 && !k3.mv && enc.stock > 0 && !(k3.healCd > 0)) { const to = L.filter(e => e !== k3 && e.hp < e.hpMax * 0.55).sort((p, q) => p.hp / p.hpMax - q.hp / q.hpMax)[0];
      if (to) { begin(k3, 'heal', { to }); k3.healCd = S(8); } }
    for (const e of L) if (e.healCd > 0) e.healCd--;
    if (busy || enc.cd > 0) return;
    if (ph === 4 && enc.stormCd <= 0) { begin(L[0], 'storm'); enc.stormCd = S(12); enc.cd = S(1.4); return; }
    if (ph <= 2 && L.length >= 2 && enc.trioCd <= 0 && !L.some(e => e.mv)) { L.forEach((e, i) => { e.lead = i === 0; begin(e, 'trio'); }); enc.trioCd = S(22); enc.cd = S(6.5); return; }
    if (ph >= 3 && enc.ultCd <= 0) { begin(L[0], 'ult'); enc.ultCd = S(9); enc.cd = S(1.2); return; }
    const free = L.filter(e => !e.mv); if (!free.length) return;
    enc.turn = ((enc.turn || 0) + 1) % 64; const e = free[enc.turn % free.length];
    const list = e.def0.moves.concat(ph >= 2 ? (e.def0.p2 || []) : []); const k = list[Math.floor(Math.random() * list.length)];
    begin(e, k); enc.cd = S(ph === 1 ? rnd(1.2, 1.8) : ph === 2 ? rnd(0.9, 1.4) : rnd(0.8, 1.2));
  }

  /* r3.38.0：節奏。enc.tk＝預兆倍速、enc.ck＝出招間隔倍率；預兆期間＝自己放的危險區還沒結束 */
  function tempo(enc) { if (enc.tk !== undefined) return; const ex = /^(mb_|h_|t_)/.test(enc.id), hi = G.GDIFF && G.GDIFF.i && G.GDIFF.i() >= 3;
    enc.tk0 = ex ? 1 : hi ? 1 / 1.15 : 1 / 1.35; enc.tk = 1; enc.ck = ex ? 1 : hi ? 1.1 : 1.2; }   // r3.94.0：預兆改逐招（m._k／m._W，123_btempo），tk0 只當舊手感基準
  const tkOf = e => { const m = e.mv; return m && m._k < 1 && m.t < m._W ? m._k : 1; };
  B.tempo = e => tkOf(e);
  function idleStep(e) {   // 沒在出招：與主角保持 2.5–4 身距，散開站位
    const enc = e.enc, L = alive(enc), i = L.indexOf(e), side = e.x >= H.x ? 1 : -1;
    const tx = H.x + side * HH() * (2.4 + 0.9 * i), ty = H.y + [0, -34, 34][i % 3];   // 各自站位，不疊在一起
    const d = Math.hypot(tx - e.x, (ty - e.y) * 1.4);
    if (d > 24) { if (e.an !== 'run') play(e, 'run', true); walkTo(e, tx, ty, 2.2); } else if (e.an !== 'idle') play(e, 'idle', true);
    if (e.an === 'idle' && Math.abs(H.x - e.x) > 4) e.face = sgn(H.x - e.x);
  }

  function stepUnit(e) { const a0 = ALLY; ALLY = !!e.ally; try { stepUnit0(e); } finally { ALLY = a0; } }
  function stepUnit0(e) { BCUR = e.mv && e.mv._big && !e.ally ? HR : tgtOf(e); IN = [];
    e.t++; e.at += TK; if (e.flash > 0) e.flash--;
    if (e.kb) { const nx = e.x + e.kb * 0.15; if (SC.walkable(nx, e.y)) e.x = nx; e.kb = 0; }
    if (e.st === 'dead') { if (e.an !== 'down' && e.an !== 'loss') play(e, 'down'); return; }
    if (e.st === 'hurt') { if (e.t > 20) { e.st = 'walk'; play(e, 'idle', true); } return; }
    G.enemyDebStep && G.enemyDebStep(e);
    if (e.mv) { const m = e.mv, k = tkOf(e);   // r3.38.0：預兆期間放慢
      if (k < 1) { e.at -= TK * (1 - k); e.tacc = (e.tacc || 0) + k; if (e.tacc < 1) return; e.tacc -= 1; }
      TCUR = e; m.t++; const done = mvOf(e, m.k).step(e, m); TCUR = null; if (done) { end(e); if (e.enc && e.enc.tk0 < 1) e.rec = S(0.2); } return; }
    if (e.rec > 0) { e.rec--; return; }
    if (e.stun > 0) { e.stun--; return; }
    if (e.D.idle && e.D.idle(e)) return;
    idleStep(e);
  }

  /* ---------------- 投射物／區域／道具 ---------------- */
  function projStep() {
    for (const p of B.proj) { p.t++; ALLY = !!(p.e && p.e.ally); if (ALLY) BCUR = tgtOf(p.e);
      if (p.k === 'sickle') { const h = p.life / 2, back = p.t > h, q = back ? (p.t - h) / h : p.t / h, e = p.e;
        if (!back) { const s = Math.sin(q * Math.PI / 2); p.x = p.sx + (p.tx - p.sx) * s; p.y = p.sy + (p.ty - p.sy) * s - Math.sin(q * Math.PI) * 30; }
        else { if (!p.bx) { p.bx = p.x; p.by = p.y; } const s = 1 - Math.cos(q * Math.PI / 2); p.x = p.bx + (e.x - p.bx) * s; p.y = p.by + (e.y - p.by) * s + Math.sin(q * Math.PI) * 30; }
        const leg = back ? 1 : 0; if (!p.hit[leg] && Math.abs(H.x - p.x) < HH() * 0.45 && Math.abs(H.y - p.y) < 24 && e.st !== 'dead') p.hit[leg] = hit(e, 1.0) ? 1 : 0;
        if (p.t >= p.life) { p.dead = 1; e.noBlade = Math.max(0, (e.noBlade || 1) - 1); } }
      else if (p.k === 'amp') { const q = p.t / p.life; p.x = p.sx + (p.tx - p.sx) * q; p.y = p.sy + (p.ty - p.sy) * q;
        if (p.t >= p.life) { p.dead = 1; circle(p.tx, p.ty, HH() * 1.3, S(0.8), '160,110,220'); B.zones.push({ k: 'fog', e: p.e, x: p.tx, y: p.ty, t: -S(0.8), life: S(4), r: HH() * 1.3, every: 30 }); } } }
    B.proj = B.proj.filter(p => !p.dead);
    ALLY = false; for (const z of B.zones) { z.t++; ALLY = !!(z.e && z.e.ally); if (z.t < 0) continue;
      if (z.k === 'vortex') { z.x += Math.sign(H.x - z.x) * 0.8; z.y += Math.sign(H.y - z.y) * 0.4; }
      if (z.t % z.every === 0 && inCircle(z.x, z.y, z.r) && z.e) hit(z.e, z.k === 'fog' ? 0.25 : 0.4); }
    B.zones = B.zones.filter(z => z.t < z.life);
    ALLY = false; for (const p of B.props) { p.t++; ALLY = !!(p.e && p.e.ally); if (p.dmg && p.t === p.dmg.at && inLane(p.dmg.x0, p.dmg.y0, p.dmg.x1, p.dmg.y1, HH() * 0.5)) hit(p.e, 1.5);
      if (p.n === 'kama_bamboo_fall' && p.t === p.hold + 20) B.props.push({ n: 'kama_bamboo_regrow', x: p.x, y: p.y, face: p.face, t: 0, hold: S(0.8), s: p.s, e: p.e }); }
    B.props = B.props.filter(p => p.t < p.hold + 20);
    ALLY = false; for (const t of B.tg) t.t += t.e ? tkOf(t.e) : 1; B.tg = B.tg.filter(t => t.t < t.life);
    for (const f of B.fx) f.t++; B.fx = B.fx.filter(f => f.life === undefined || f.t < f.life);
  }

  /* ---------------- 勝負 ---------------- */
  function encStep() { const enc = B.enc; if (!enc) return;
    if (enc.done) { const k = ++enc.winT; if (k === 42) enc.units.forEach(e => { if (clip(e, 'loss')) play(e, 'loss'); });
      if (k === 156) { enc.units.forEach(e => e.alpha = 0); G.E = G.E.filter(x => !enc.units.includes(x));   /* r3.39.0：戰後清掉頭目單位（陰影殘留） */ B.enc = null; B.fx.length = 0; B.props.length = 0; enc.onWin && enc.onWin(); } return; }
    if (G.mode !== 'play' || G.DLG.active()) return;
    tempo(enc); const c0 = enc.cd; if (enc.D.director) enc.D.director(enc); else director(enc);
    if (enc.ck !== 1 && enc.cd > c0 + 1 && enc.cd < S(60)) enc.cd = Math.round(enc.cd * enc.ck);   // r3.38.0：出招間隔放慢
    // 長兄破鎌：暈眩中累積傷害達最大血量 18%
    for (const e of enc.units) if (e.actor === 'kama1' && !e.broken && e.brk >= e.hpMax * 0.18) { e.broken = 1; fx(e, 'kama_sickle_break', e.x - e.face * 30, chestY(e) + 30); G.UI.toast('長兄的大鎌碎了！'); G.SC.shake = 6; }
    if (!alive(enc).length) { enc.done = true; if (enc.D.finish) enc.D.finish(enc); if (B.onEnd) B.onEnd(enc); enc.winT = 0; B.tg.length = 0; B.zones.length = 0; B.proj.length = 0; G.UI.banner('擊敗　' + enc.name); }
  }

  /* ---------------- 其他頭目檔案用的共用工具 ---------------- */
  B.api = { U, clip, play, sc, chestY, fx, lane, circle, inLane, inCircle, hit, walkTo, dashEnd, dirTo, S, rnd, sgn, begin, end, alive, flip, frameOf: (e, n, ms, l) => frameOf(e, n, ms, l), TK, HH };
  /* 章節頭目地圖：由 18_world 呼叫；回傳 true＝已由 P3 頭目接手 */
  B.mapStart = function (id, d, o) { const k = B.MAP[id]; if (!k) return false; const want = G.SC.id;
    Promise.all([B.load(k), G.ASSET.enemies(DEF[k].foes || [])].concat((DEF[k].extra || []).map(u => A.load(u)))).then(() => { if (G.SC.id !== want) return; const n = d.nodes.center; B.start(k, Object.assign({ x: n[0] + 160, y: n[1], lv: d.lv + 3 }, o)); }, e => console.warn(e)); return true; };

  /* ---------------- 掛勾 ---------------- */
  const step0 = G.oniStep; G.oniStep = e => (e.bb ? stepUnit(e) : step0(e));
  const fx0 = G.fxStep; G.fxStep = function () { fx0(); if (B.enc || B.fx.length || B.proj.length || B.allies.length) { encStep(); allyStep(); projStep(); } };
  /* ---------------- r3.117.0：友軍頭目（用原本招式打敵人） ---------------- */
  B.allyStart = function (id, o) { o = o || {}; const D = DEF[id], u = D && A.get(D.unit); if (!u) return null; if (G.VX && G.VX.x2) G.VX.x2('x2_boss');
    const n = D.actors.length, hpT = Math.round(HR.hpMax * 3 * (o.hpk || 1)), enc = { id, D, units: [], stock: 3, diff: 0, cd: S(1.5), trioCd: S(14), ultCd: S(4), stormCd: 0, done: false, t: 0, name: o.name || D.name, v: {}, ally: 1, life: o.life || 0 };
    D.actors.forEach((a, i) => { const ua = A.get(a.unit || D.unit) || u, idle = ua.act[a.id + '_idle_' + D.dir]; if (!idle) return; const vh = idle.f.map(f => f[5]).sort((p, q) => p - q)[idle.f.length >> 1];
      let x = (o.x || HR.x - HH() * 1.5) + (n > 1 ? (i - 1) * HH() * 1.2 : 0), y = (o.y || HR.y) + (n > 1 ? [0, -26, 26][i] : 0); const sp = SC.snap(x, y, 'open', 300) || SC.snap(x, y, 'walk', 500); if (sp) [x, y] = sp;
      const e = { type: 'b_' + id, bb: 1, ally: 1, allyU: 1, nobar: 1, enc, D, actor: a.id, name: a.name, def0: a, unit: a.unit || D.unit, size: a.size, vh, ratio: a.size, x, y, lv: HR.lv || 1, atk: 1, def: 1,
        hp: Math.round(hpT / n), hpMax: Math.round(hpT / n), face: 1, st: 'walk', t: 0, at: 0, an: 'idle', aloop: true, delay: 0, flash: 0, kb: 0, alpha: 1, mv: null, poise: 0, idx: i, ph: Math.random() * 1000, brk: 0 };
      enc.units.push(e); G.NPC.push(e); });
    const a0 = ALLY; ALLY = true; try { if (D.init) D.init(enc); } finally { ALLY = a0; } B.allies.push(enc); return enc; };
  B.allyEnd = function (enc) { B.allies = B.allies.filter(q => q !== enc); G.NPC = G.NPC.filter(n => !enc.units.includes(n)); try { const a0 = ALLY; ALLY = true; if (enc.D.finish) enc.D.finish(enc); ALLY = a0; } catch (e) {} ALLY = false;
    B.tg = B.tg.filter(t => !enc.units.includes(t.e)); B.proj = B.proj.filter(p => !enc.units.includes(p.e)); B.zones = B.zones.filter(z => !enc.units.includes(z.e)); };
  function allyStep() { if (G.mode !== 'play' || G.DLG.active() || !B.allies.length) return;
    for (const enc of B.allies.slice()) { for (const u of enc.units) if (u.hp <= 0 && u.st !== 'dead') { u.st = 'dead'; u.t = 0; if (u.mv) end(u); play(u, 'down'); }
      if (!alive(enc).length || (enc.life && --enc.life <= 0)) { B.allyEnd(enc); continue; }
      ALLY = true; try { tempo(enc); if (enc.D.director) enc.D.director(enc); else director(enc); } catch (x) { console.warn('ally director', x); } finally { ALLY = false; }
      for (const u of enc.units) { try { stepUnit(u); } catch (x) { console.warn('ally unit', x); } } } }
  const so0 = G.spawnOni; G.spawnOni = function () { if (ALLY) return null; return so0.apply(this, arguments); };   /* 友軍頭目的召喚招式＝不召喚 */
  const hh0 = G.hurtHero; G.hurtHero = function () { if (ALLY) return false; return hh0.apply(this, arguments); };
  const dn0 = G.drawNpc; G.drawNpc = function (n) { if (n && n.allyU) return drawUnit(n); return dn0.apply(this, arguments); };
  const dmg0 = G.damageOni; G.damageOni = function (e, mult, big, fc, opt) {
    if (!e.bb) return dmg0(e, mult, big, fc, opt); if (e.st === 'dead' || !B.enc || e.inv > 0) return;
    if (e.D.preDamage && e.D.preDamage(e, big)) return;                                  // 命中前攔截（分身等）
    if (e.shield) mult *= 1 - e.shield;                                                  // 護盾減傷
    if (e.open > 0) G.DZ.vuln(0.5);                                                         // 破綻中傷害 +50%
    const st = e.st, hp = e.hp; dmg0(e, mult, big, fc, opt); const d = hp - Math.max(0, e.hp);
    if (e.D.onDamage && e.st !== 'dead' && e.D.onDamage(e, d, big)) return;
    if (e.dizzy) { e.brk += d; }
    if (e.st === 'dead') { if (e.mv) end(e); e.st = 'dead'; e.t = 0; play(e, 'down'); return; }
    if (e.mv && e.mv.k === 'heal') { end(e); e.st = 'hurt'; e.t = 0; play(e, 'hurt'); G.UI.toast('止血藥被打斷了'); return; }
    if (e.mv) { e.st = 'atk'; return; }                                                // 出招中霸體
    if (++e.poise >= 4 || big) { e.poise = 0; e.st = 'hurt'; e.t = 0; play(e, 'hurt'); } else e.st = st === 'hurt' ? 'hurt' : 'walk';
  };
  // 22_event 的單隻頭目血條改由本模組畫群組血條
  const loot0 = G.drawLoot; G.drawLoot = function (Z) { if (B.enc && B.enc.D.drawUnder) B.enc.D.drawUnder(B.enc); drawGround(); loot0(Z); };
  const draw0 = G.drawOni; G.drawOni = e => (e.bb ? drawUnit(e) : draw0(e));
  const dfx0 = G.drawFx; G.drawFx = function (Z) { drawProps(); dfx0(Z); drawBfx(); if (B.enc && B.enc.D.drawOver) B.enc.D.drawOver(B.enc); };
  const ui0 = G.UI.draw.bind(G.UI); G.UI.draw = function () { ui0(); if (B.enc && !B.enc.done && G.mode === 'play') drawBar(B.enc); };
  const enter0 = G.SC.enter.bind(G.SC); G.SC.enter = function (id, at) { for (const a of B.allies.slice()) B.allyEnd(a); B.allies = []; B.enc = null; B.fx = []; B.tg = []; B.zones = []; B.proj = []; B.props = []; return enter0(id, at); };

  /* ---------------- 繪製 ---------------- */
  function frameOf(e, n, ms, loop, dur) { const r = clip(e, n); if (!r) return null; const R = loop && !r.loop ? Object.assign({}, r, { loop: true }) : r; return A.frameAt(R, ms, dur); }
  function drawUnit(e) {
    if (e.D.drawSelf && e.D.drawSelf(e)) return;
    const u = U(e); if (!u) return; const s = sc(e), sd = SC.depth(e.y);
    let n = e.an; if (e.actor === 'kama2' && n === 'throw' && e.noBlade) n = 'throw';
    const fr = frameOf(e, n, e.at, e.aloop, e.adur) || frameOf(e, 'idle', G.t * TK + e.ph, true); if (!fr) return;
    const a = e.st === 'dead' && B.enc ? 0.85 : e.alpha;
    if (a < 0.02) return; ctx.fillStyle = `rgba(30,20,10,${0.32 * Math.min(1, a)})`; ctx.beginPath(); ctx.ellipse(e.x, e.y, HH() * e.size * 0.5 * sd, HH() * e.size * 0.13 * sd, 0, 0, 6.283); ctx.fill();
    const fl = flip(e.face, e.D.nat); if (e.D.underBody) e.D.underBody(e, fr, s, fl, a); A.draw(u, fr, e.x, e.y - (e.lift || 0), s, fl, a);
    if (e.flash > 0) { const w = A.white(u, fr); ctx.save(); ctx.globalAlpha = e.flash / 10 * a; if (fl) { ctx.translate(e.x * 2, 0); ctx.scale(-1, 1); }
      ctx.drawImage(w, e.x - fr[4] * s, e.y - (e.lift || 0) - fr[5] * s, fr[2] * s, fr[3] * s); ctx.restore(); }
    if (e.st !== 'dead' && !e.nobar) { const w = 46 * sd, y = e.y - fr[5] * s - 6; ctx.fillStyle = 'rgba(10,6,6,.75)'; ctx.fillRect(e.x - w / 2 - 1, y - 1, w + 2, 5);
      ctx.fillStyle = G.C.red; ctx.fillRect(e.x - w / 2, y, w * Math.max(0, e.hp) / e.hpMax, 3); }
  }
  /* r3.38.0：第二代預警素材（x2_boss）。依 t.col 上色（保留亮度、換色相），每種顏色快取一張 */
  const TINT = {};
  function tinted(u, n, fi, col) { const key = n + fi + col; if (TINT[key]) return TINT[key]; const fr = u.fx[n].f[fi], c = document.createElement('canvas'); c.width = fr[2]; c.height = fr[3];
    const g = c.getContext('2d'); g.drawImage(u.imgs[fr[7] || 0], fr[0], fr[1], fr[2], fr[3], 0, 0, fr[2], fr[3]);
    if (col !== '230,60,40') { g.globalCompositeOperation = 'color'; g.fillStyle = `rgb(${col})`; g.fillRect(0, 0, fr[2], fr[3]); g.globalCompositeOperation = 'destination-in'; g.drawImage(u.imgs[fr[7] || 0], fr[0], fr[1], fr[2], fr[3], 0, 0, fr[2], fr[3]); }
    return (TINT[key] = [c, fr]); }
  B.tinted = tinted;
  function art(u, n, fi, col, x, y, sx, sy, rot, a) { const [c, fr] = tinted(u, n, fi, col); ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); if (rot) ctx.rotate(rot); ctx.scale(sx, sy); ctx.drawImage(c, -fr[4], -fr[5]); ctx.restore(); }
  function drawWarn(t, u) { const q = t.t / t.life, pul = (0.3 + 0.5 * Math.max(0, (q - 0.65) / 0.35)) * (0.85 + 0.15 * Math.sin(t.t * 0.35));   /* r3.145.0：預警調淡，出手前 35% 才變亮 */
    if (t.k === 'lane') { const ang = Math.atan2(t.y1 - t.y0, t.x1 - t.x0), L = Math.hypot(t.x1 - t.x0, t.y1 - t.y0), bh = t.w * 0.6;
      ctx.save(); ctx.translate(t.x0, t.y0); ctx.rotate(ang); ctx.fillStyle = `rgba(${t.col},${0.07 + 0.17 * q})`; ctx.fillRect(0, -bh / 2, L * q, bh); ctx.restore();
      art(u, 'fx_warn_line', 0, t.col, (t.x0 + t.x1) / 2, (t.y0 + t.y1) / 2, L / 610, bh / 88, ang, pul); return; }
    ctx.save(); ctx.fillStyle = `rgba(${t.col},${0.05 + 0.15 * q})`; ctx.beginPath(); ctx.ellipse(t.x, t.y, t.r * q, t.r * 0.42 * q, 0, 0, 6.283); ctx.fill(); ctx.restore();
    if (t.r <= HH() * 0.8) { const fi = Math.min(3, Math.floor(q / 0.35 * 4)), k = 2 * t.r / 80; art(u, 'fx_warn_target', fi, t.col, t.x, t.y, k, k * 0.42, 0, pul); }
    else { const k = 2 * t.r / 300; art(u, 'fx_warn_circle', 0, t.col, t.x, t.y, k, k * 0.42, 0, pul); } }
  function drawGround() {   // 危險區（在角色之下）
    const u2 = A.get('x2_boss'), ok2 = u2 && u2.fx && u2.fx.fx_warn_circle;
    for (const t of B.tg) { if (t.ally) continue; if (ok2) { drawWarn(t, u2); continue; } const q = t.t / t.life, al = 0.18 + 0.22 * q + 0.12 * Math.sin(t.t * 0.4);
      ctx.save(); ctx.fillStyle = `rgba(${t.col},${al})`; ctx.strokeStyle = `rgba(${t.col},${0.55 + 0.35 * q})`; ctx.lineWidth = 1.5;
      if (t.k === 'lane') { const ang = Math.atan2(t.y1 - t.y0, t.x1 - t.x0), L = Math.hypot(t.x1 - t.x0, t.y1 - t.y0), hw = t.w * 0.5;
        ctx.translate(t.x0, t.y0); ctx.rotate(ang); ctx.fillRect(0, -hw * 0.6, L, hw * 1.2); ctx.strokeRect(0, -hw * 0.6, L, hw * 1.2);
        ctx.fillStyle = `rgba(${t.col},${0.35 + 0.4 * q})`; ctx.fillRect(0, -hw * 0.6, L * q, hw * 1.2); }
      else { ctx.beginPath(); ctx.ellipse(t.x, t.y, t.r, t.r * 0.42, 0, 0, 6.283); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(t.x, t.y, t.r * q, t.r * 0.42 * q, 0, 0, 6.283); ctx.stroke(); }
      ctx.restore(); }
    for (const z of B.zones) if (z.t >= 0 && z.k === 'fog') { const u = A.get('b_kama'); const r = u && u.act.kama_medicine_fog; if (!r) continue;
      const ms = 200 + (z.t * TK) % 300, fr = A.frameAt(r, ms), s = z.r * 2.2 / fr[2], a = Math.min(1, (z.life - z.t) / 30);
      A.draw(u, fr, z.x, z.y + fr[5] * s * 0.1, s * 1.15, false, a); }
  }
  function drawProps() {
    for (const p of B.props) { const u = A.get(p.e ? p.e.unit : 'b_kama'), r = u && u.act[p.n]; if (!r) continue; const fr = A.frameAt(r, p.t * TK), a = p.t > p.hold ? 1 - (p.t - p.hold) / 20 : 1;
      A.draw(u, fr, p.x, p.y, p.s, flip(p.face, p.e ? p.e.D.nat : -1), a); }
  }
  function drawBfx() {
    const u = A.get('b_kama');
    for (const p of B.proj) { if (!u) break; const n = p.k === 'sickle' ? 'kama_flying_sickle' : 'kama_medicine_ampoule', r = u.act[n]; if (!r) continue;
      const fr = A.frameAt(Object.assign({}, r, { loop: true }), p.t * TK * 1.6), s = sc(p.e) * (p.k === 'sickle' ? 0.75 : 1), arc = p.k === 'amp' ? Math.sin(p.t / p.life * Math.PI) * 60 : 0;
      ctx.fillStyle = 'rgba(30,20,10,.25)'; ctx.beginPath(); ctx.ellipse(p.x, p.y, 10, 3, 0, 0, 6.283); ctx.fill();
      A.draw(u, fr, p.x, p.y - HH() * 0.45 - arc + (p.k === 'sickle' ? fr[5] * s * 0.5 : 0), s, p.e.face > 0); }
    for (const z of B.zones) if (z.t >= 0 && z.k === 'vortex' && u) { const r = u.act.kama_trio_vortex, fr = A.frameAt(Object.assign({}, r, { loop: true }), z.t * TK), a = Math.min(1, (z.life - z.t) / 30);
      A.draw(u, fr, z.x, z.y, z.r * 2.4 / fr[2], false, a); }
    for (const f of B.fx) {
      if (f.k === 'tether') { if (!u || f.life === 0) continue; const e = f.e, to = f.to, r = u.act.kama_heal_tether, fr = A.frameAt(Object.assign({}, r, { loop: true }), f.t * TK);
        const x0 = e.x + e.face * 14, y0 = chestY(e), x1 = to.x, y1 = chestY(to), L = Math.hypot(x1 - x0, y1 - y0);
        ctx.save(); ctx.translate(x0, y0); ctx.rotate(Math.atan2(y1 - y0, x1 - x0)); ctx.globalAlpha = 0.95;
        ctx.strokeStyle = `rgba(255,222,140,${0.55 + 0.3 * Math.sin(f.t * 0.3)})`; ctx.lineWidth = 2.5; ctx.setLineDash([7, 5]); ctx.lineDashOffset = -f.t; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(L, 0); ctx.stroke(); ctx.setLineDash([]);
        ctx.drawImage(u.imgs[fr[7]], fr[0], fr[1], fr[2], fr[3], 0, -fr[3] * 0.65, L, fr[3] * 1.3); ctx.restore(); continue; }
      if (f.k === 'lanefx') { if (!u) continue; const r = u.act[f.n], fr = A.frameAt(Object.assign({}, r, { loop: true }), f.t * TK), L = Math.abs(f.x1 - f.x0), a = Math.min(1, (f.life - f.t) / 12);
        ctx.save(); ctx.globalAlpha = a; const x = Math.min(f.x0, f.x1); ctx.drawImage(u.imgs[fr[7]], fr[0], fr[1], fr[2], fr[3], x, f.y - fr[3] * (L / fr[2]) * 0.35, L, fr[3] * (L / fr[2]) * 0.6); ctx.restore(); continue; }
      if (f.k === 'ghost') { const e = f.e, an = f.an || 'idle', fr = frameOf(e, an, f.an ? (f.t - (f.life - 18)) * TK : G.t * TK, !f.an); if (!fr) continue;
        A.draw(U(e), fr, f.x, f.y, sc(f.src), flip(f.face, e.D.nat), 0.7); continue; }
      const uu = A.get(f.u); if (!uu) continue; const x = f.follow ? f.follow.x : f.x, y = f.follow ? f.follow.y : f.y;
      const fr = A.frameAt(f.loop ? Object.assign({}, f.r, { loop: true }) : f.r, f.t * TK); A.draw(uu, fr, x, y, f.s, flip(f.face, f.nat), Math.min(1, (f.life - f.t) / 8) * (f.alpha || 1)); }
  }
  function drawBar(enc) {
    const w = Math.min(380, G.LW * 0.42), x = (G.LW - w) / 2, y = G.SAFE.t + 58 * G.FS(); G.txt(enc.name, G.LW / 2, y - 10 * G.FS(), 13, '#f3d98a', 'center');   // r3.146.0：移到上方中央（任務列下方），不擋右下按鈕
    const n = enc.units.length, gap = 6, sw = (w - gap * (n - 1)) / n;
    enc.units.forEach((e, i) => { const sx = x + i * (sw + gap); ctx.fillStyle = 'rgba(10,6,6,.8)'; ctx.fillRect(sx - 1, y - 1, sw + 2, 8);
      ctx.fillStyle = e.st === 'dead' ? '#555' : G.C.red; ctx.fillRect(sx, y, sw * Math.max(0, e.hp) / e.hpMax, 6);
      G.txt(e.name + (e.broken ? '（破鎌）' : ''), sx + sw / 2, y + 8 + 9 * G.FS(), 10, e.st === 'dead' ? '#888' : '#eadfc8', 'center'); });
    if (enc.stock < 3) G.txt('藥 ×' + enc.stock, x + w + 26, y + 3, 10, '#c9e7a8', 'center');
  }
})();
