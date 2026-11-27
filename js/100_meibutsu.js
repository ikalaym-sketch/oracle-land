/* ==========================================================================
 * 神諭之地 重製版 — 100_meibutsu.js
 * Version : r3.199.0  (2026-11-28)　r3.199.0：蜻蛉切（水平長槍）、三日月、稻富、赤糸、與一改播手繪素材
 * 舊版    : r3.197.0  (2026-11-28)　r3.197.0：名物演出改播手繪素材（鬼切、雷切、岩融、雪女、村正／酒吞／鬼丸、天狗、河童、九尾）
 * 舊版    : r3.196.0  (2026-11-28)　r3.196.0：15 件名物各自的演出（鬼切鬼面、雷切電弧、蜻蛉細槍光、三日月金新月、岩融地裂、扇靶、稻富連爆、村正妖氣、赤糸紅絲、天狗黑羽、河童水滴、雪女雪花、九尾狐火、酒吞酒氣、鬼丸吸魂）
 * 舊版    : r3.96.0  (2026-11-26)　r3.96.0：名物掉落等級吃目前難度（原本讀不到難度）
 * 舊版    : r3.94.0  (2026-11-26)　r3.94.0：名物增傷改增傷區相加；村正改攻擊% 相加；觸發改每次出手 1 次＋內部冷卻
 * 舊版    : r3.61.0  (2026-11-24)
 * 變更    : r3.61.0 新增。名物（獨特裝備）15 件：
 *           ・神話底材＋固定名稱＋固定 5 條強化詞條（數值為同等級神話的 1.6 倍）＋2 條 Lv3 靈紋＋專屬特效。
 *           ・隨等級與難度變強：掉落等級＝主角等級＋難度加成（困難 +5、修羅 +12、無間 +20）；詞條與特效強度都跟著物品等級成長（特效 ×(1＋等級/100)）。
 *           ・來源：章節頭目 5%、副本頭目 8%、隱藏王試煉首勝必得（之後 10%）、珍品屋偶爾上架（101_shop2）。
 *           ・特效只在主角裝備時生效（每件一種，可同時穿多件不同部位）。
 * 存檔    : 物品欄位 it.uq＝名物代號（其他欄位同一般裝備）。
 * 依賴    : 07_rpg（make／name／recalc／onKill）、69_items（武器種類 wk）、88_rune（lines、frost、RN）、26_boss（onEnd）、03_actors（damageOni／hurtHero）、76_vfx。
 * ========================================================================== */
'use strict';
(function () {
  const R = G.RPG, H = G.H, SC = G.SC; if (!R) return;
  const ctx = G.ctx, HH = () => G.HERO_H, S = y => SC.depth(y), alive = e => e && e.st !== 'dead' && e.hp > 0, VX = () => G.VX || {};
  const SLOTI = { weapon: 0, head: 1, body: 2, hands: 3, feet: 4, charm: 5 };
  /* [代號, 名稱, 部位, 武器種類, 詞條, 靈紋, 特效說明] */
  const UQ = {
    dojigiri: ['童子切安綱', 'weapon', 'katana', ['atk', 'critD', 'crit', 'cdr', 'hp'], [['zan', 3], ['shin', 3]], '對鬼族傷害 +40%；重擊時 25% 斬出「鬼切」（目標周圍 200%）'],
    onimaru: ['鬼丸國綱', 'weapon', 'katana', ['atk', 'ls', 'crit', 'hp', 'def'], [['kon', 3], ['ha', 3]], '擊殺時回血 5%，攻擊 +12%（8 秒，最多 3 層）'],
    raikiri: ['雷切', 'weapon', 'katana', ['atk', 'crit', 'critD', 'spd', 'cdr'], [['rai', 3], ['den', 3]], '會心時落雷 180%（每秒最多一次）'],
    tonbo: ['蜻蛉切', 'weapon', 'yari', ['atk', 'critD', 'hp', 'def', 'crit'], [['kaze', 3], ['ha', 3]], '每次命中，目標後方一名敵人受 60% 貫穿傷害'],
    mikazuki: ['三日月宗近', 'weapon', 'nodachi', ['crit', 'critD', 'atk', 'cdr', 'spd'], [['zan', 3], ['toki', 3]], '會心時 20% 再斬一次 100%'],
    iwatoshi: ['岩融', 'weapon', 'naginata', ['atk', 'hp', 'def', 'critD', 'ls'], [['shin', 3], ['ikari', 3]], '重擊震地 220%（範圍 1.4 身高，4 秒一次）'],
    yoichi: ['與一之弓', 'weapon', 'yumi', ['atk', 'crit', 'critD', 'spd', 'mf'], [['un', 3], ['kaze', 3]], '每隻敵人的第一擊必定會心，傷害 +50%'],
    inatomi: ['種子島・稻富', 'weapon', 'teppo', ['atk', 'cdr', 'critD', 'crit', 'gf'], [['un', 3], ['en', 3]], '每第 5 次命中引爆火藥 300%（範圍）'],
    muramasa: ['村正', 'weapon', 'katana', ['atk', 'atk', 'critD', 'ls', 'crit'], [['ikari', 3], ['en', 3]], '攻擊 +35%、吸血 +6%；但受到的傷害 +15%'],
    akaito: ['赤糸威大鎧', 'body', null, ['def', 'hp', 'hp', 'def', 'ls'], [['goho', 3], ['mi', 3]], '受擊時把 60% 傷害反彈給最近的敵人；防禦大幅提升'],
    tengu: ['天狗下駄', 'feet', null, ['spd', 'crit', 'hp', 'def', 'cdr'], [['kaze', 3], ['toki', 3]], '閃避後 3 秒移速 +30%，下一擊必定會心'],
    kappa: ['河童之皿', 'head', null, ['hp', 'def', 'hp', 'ls', 'cdr'], [['kon', 3], ['goho', 3]], '每 5 秒回復 3% 生命'],
    yukionna: ['雪女之手甲', 'hands', null, ['atk', 'crit', 'critD', 'def', 'hp'], [['hyo', 3], ['den', 3]], '命中 20% 附上冰霜；對冰凍中的敵人傷害 +30%'],
    kyubi: ['九尾之玉', 'charm', null, ['atk', 'crit', 'cdr', 'mf', 'gf'], [['kitsu', 3], ['tsuru', 3]], '每 8 秒放出 3 顆狐火追擊敵人，各 120%'],
    shuten: ['酒吞之瓢', 'charm', null, ['hp', 'atk', 'ls', 'def', 'critD'], [['ikari', 3], ['kon', 3]], '血量低於 40% 時攻擊 +40%、受傷 −25%'] };
  const UK = Object.keys(UQ);
  const AFFB = () => R.AFF || { atk: ['', 1.6], def: ['', 1.4], hp: ['', 9], crit: ['', 0.45], critD: ['', 2.2], spd: ['', 0.5], cdr: ['', 0.5], ls: ['', 0.18], mf: ['', 2.5], gf: ['', 3] };
  /* ---------- 產生 ---------- */
  const diffOff = () => { const m = G.EV && G.EV.mul; const i = m && m.i !== undefined ? m.i : (G.GDIFF && G.GDIFF.i ? G.GDIFF.i() : 1); return [-3, 0, 5, 12, 20][i] || 0; };
  function make(id, lv) { const U = UQ[id]; if (!U) return null; lv = Math.max(1, Math.round(lv || R.d().lv)); const tier = Math.max(0, Math.min(7, Math.floor((lv - 1) / 5))), tid = SLOTI[U[1]] * 16 + tier * 2 + 1, A = AFFB();
    const aff = U[3].map(k => [k, Math.round(((A[k] || ['', 1])[1]) * (1 + lv * 0.18) * 1.6 * 10) / 10]);
    const it = R.make(tid, 5, lv, aff, null); it.uq = id; if (U[2]) it.wk = U[2]; it.rn = U[4].map(r => r.slice()); return it; }
  function drop(lv, x, y, why) { const id = UK[Math.floor(Math.random() * UK.length)], it = make(id, lv + diffOff()); if (!it) return null;
    G.LOOT.push({ x: x === undefined ? H.x + 30 : x, y: y === undefined ? H.y + 6 : y, t: 0, kind: 'item', it }); G.UI.banner('名物出現！', UQ[id][0] + (why ? '・' + why : '')); return it; }
  /* ---------- 名稱、說明 ---------- */
  const nm0 = R.name.bind(R); R.name = function (it) { return it && it.uq && UQ[it.uq] ? '【名物】' + UQ[it.uq][0] : nm0(it); };
  const k = it => 1 + (it.lv || 1) / 100;   // 特效隨物品等級變強
  (function hookLines() { if (!G.RUNE || !G.RUNE.lines) return setTimeout(hookLines, 50); const l0 = G.RUNE.lines; G.RUNE.lines = function (it) { const L = l0.apply(this, arguments) || [];
      if (it && it.uq && UQ[it.uq]) L.unshift(['◆ 名物特效（強度 ×' + k(it).toFixed(2) + '）：' + UQ[it.uq][5], '#ff8a5a']); return L; }; })();
  /* ---------- 生效中的名物（裝備變動時重算，非每格） ---------- */
  let ON = {}; const rc0 = R.recalc.bind(R); R.recalc = function () { const r = rc0.apply(this, arguments); ON = {}; const d = R.d(); for (const s in d.eq) { const it = d.eq[s]; if (it && it.uq) ON[it.uq] = it; }
    if (ON.muramasa) { R.addAtkP(35 * k(ON.muramasa)); R.S.ls = Math.min(15, (R.S.ls || 0) + 6); }
    if (ON.akaito) R.S.def = Math.round(R.S.def * (1 + 0.3 * k(ON.akaito)));
    return r; };
  const on = id => ON[id];
  /* ---------- 主角命中 ---------- */
  const ONI = /oni|kijo|shuten|ibaraki|hannya|onryo|yomi|kasha/;
  const cd = {}; const ready = (key, s) => { if ((cd[key] || 0) > G.t) return false; cd[key] = G.t + Math.round(s * 60); return true; };
  const rdmg = (e, m, big) => { if (alive(e)) G.damageOni(e, m, !!big, false, { rune: 1 }); };
  const area = (x, y, r, m, skip) => { for (const q of G.E) if (alive(q) && q !== skip && Math.hypot(q.x - x, (q.y - y) * 1.6) < r) rdmg(q, m, true); };
  /* ====================== r3.196.0 名物演出（每件一個辨識用的小演出；觸發時才出現） ====================== */
  const FXR = () => G.RFX || {}, KU = (pal, fn) => { const f = FXR().KU; if (f) f(pal, fn); }, KFa = (l, ly, d, st) => { const f = FXR().KFa; return f && f(l, ly, d, st); }, rgb = (c, a) => 'rgba(' + c + ',' + Math.max(0, Math.min(1, a)).toFixed(3) + ')', TAU = 6.2832, rnd = (a, b) => a + Math.random() * (b - a), kk = y => HH() * S(y);
  const AFX = () => (G.AFX || { play: (a, b, o) => { if (o && o.fb) o.fb(); return false; }, fr: () => false, ok: () => false, pre: () => {} });   /* r3.197.0：手繪素材播放器（88_rune 提供） */
  const fxT = {}; const every = (id, n) => { if ((fxT[id] || 0) > G.t) return false; fxT[id] = G.t + n; return true; };
  /* 童子切「鬼切」：一道血紅斬痕劃過，鬼面浮現後左右裂開 */
  function oniCut(x, y) { /* r3.197.0：鬼切＝前鬼的手繪劈斬（原本程式畫的扁平鬼面） */ if (AFX().play('b_mb_zenki', 'zenki_cleave_slash', { x, y: y - kk(y) * 0.6, size: kk(y) * 3.4, by: 'w', flip: H.face < 0, tpf: 4, hold: 2 })) { KU('ember', () => { G.KF.scar && G.KF.scar(x, y, 1, 2); G.KF.embers && G.KF.embers(x, y, 0.4, 8, { sp: 1.2, life: 26 }); }); return; }
    KU('ember', () => { const K2 = G.KF; K2.qi({ x, y, z: 0.6, ang: -0.5, len: 3.2, w: 0.06, dur: 2, life: 16, motes: 6 }); K2.scar && K2.scar(x, y, 1, 2); });
    KFa(18, 'o', (c2, u) => { const k = kk(y) * 0.3, q = u / 18, sp = u < 5 ? 0 : (u - 5) / 13, a = 0.8 * Math.min(1, u / 3) * (1 - Math.max(0, q - 0.5) / 0.5); c2.translate(x, y - kk(y) * 0.75);
      for (const sd of [-1, 1]) { c2.save(); c2.translate(sd * k * 0.3 * sp, sd * k * 0.14 * sp); c2.rotate(sd * 0.14 * sp); c2.beginPath(); c2.rect(sd > 0 ? 0 : -k * 1.4, -k * 1.6, k * 1.4, k * 3.2); c2.clip(); c2.globalAlpha = a;
        const face = (sc, col, al) => { c2.fillStyle = rgb(col, al); c2.beginPath(); c2.moveTo(0, -k * 0.75 * sc); c2.bezierCurveTo(k * 0.85 * sc, -k * 0.8 * sc, k * 0.9 * sc, k * 0.2 * sc, k * 0.5 * sc, k * 0.7 * sc); c2.lineTo(0, k * 0.95 * sc); c2.lineTo(-k * 0.5 * sc, k * 0.7 * sc); c2.bezierCurveTo(-k * 0.9 * sc, k * 0.2 * sc, -k * 0.85 * sc, -k * 0.8 * sc, 0, -k * 0.75 * sc); c2.fill(); };
        for (const hd of [-1, 1]) { c2.fillStyle = rgb('40,6,6', 0.8); c2.beginPath(); c2.moveTo(hd * k * 0.34, -k * 0.62); c2.quadraticCurveTo(hd * k * 0.72, -k * 1.1, hd * k * 0.62, -k * 1.5); c2.quadraticCurveTo(hd * k * 0.42, -k * 1.1, hd * k * 0.14, -k * 0.7); c2.fill(); c2.fillStyle = rgb('255,226,190', 1); c2.beginPath(); c2.moveTo(hd * k * 0.36, -k * 0.68); c2.quadraticCurveTo(hd * k * 0.64, -k * 1.08, hd * k * 0.6, -k * 1.4); c2.quadraticCurveTo(hd * k * 0.44, -k * 1.06, hd * k * 0.2, -k * 0.72); c2.fill(); }
        face(1.1, '40,6,6', 0.8); face(1, '196,36,30', 1); face(0.78, '236,80,60', 0.9);
        c2.fillStyle = rgb('255,236,150', 1); for (const hd of [-1, 1]) { c2.beginPath(); c2.moveTo(hd * k * 0.14, -k * 0.2); c2.lineTo(hd * k * 0.52, -k * 0.38); c2.lineTo(hd * k * 0.46, -k * 0.12); c2.fill(); }
        c2.fillStyle = rgb('40,6,6', 0.95); c2.beginPath(); c2.moveTo(-k * 0.38, k * 0.34); c2.quadraticCurveTo(0, k * 0.2, k * 0.38, k * 0.34); c2.quadraticCurveTo(0, k * 0.78, -k * 0.38, k * 0.34); c2.fill(); c2.fillStyle = rgb('255,250,235', 1); for (const hd of [-1, 1]) { c2.beginPath(); c2.moveTo(hd * k * 0.26, k * 0.32); c2.lineTo(hd * k * 0.18, k * 0.6); c2.lineTo(hd * k * 0.1, k * 0.3); c2.fill(); } c2.restore(); } }); }
  /* 與一之弓：目標身上一面扇靶（紅日金扇）一閃後被射穿 */
  function fanMark(e) { /* r3.199.0：與一＝夥伴疾風的手繪「看破」印記在目標身上合攏 */ if (AFX().play('p_hayate_fx', 'read_mark', { tpf: 3, size: kk(e.y) * (e.ratio || 1) * 1.15, at: () => e.st === 'dead' ? null : [e.x, e.y - kk(e.y) * (e.ratio || 1) * 0.55] })) { KU('holy', () => G.KF.glint(e.x, e.y, (e.ratio || 1) * 0.62, 0.5, 12)); return; } KFa(20, 'o', (c2, u) => { if (e.st === 'dead') return; const k = kk(e.y) * 0.34, a = Math.min(1, u / 3) * (1 - Math.max(0, u - 12) / 8), op = Math.min(1, u / 5); c2.translate(e.x, e.y - kk(e.y) * (e.ratio || 1) * 0.62); c2.globalAlpha = a; const a0 = -Math.PI / 2 - 1.05 * op, a1 = -Math.PI / 2 + 1.05 * op;
      const fan = (r, col, al) => { c2.fillStyle = rgb(col, al); c2.beginPath(); c2.moveTo(0, k * 0.5); c2.arc(0, k * 0.5, r, a0, a1); c2.closePath(); c2.fill(); }; fan(k * 1.5, '50,26,6', 0.7); fan(k * 1.4, '236,196,96', 1); fan(k * 1.25, '255,236,170', 1);
      c2.strokeStyle = rgb('150,100,30', 0.8); c2.lineWidth = Math.max(0.6, k * 0.04); for (let i = 0; i <= 6; i++) { const an = a0 + (a1 - a0) * i / 6; c2.beginPath(); c2.moveTo(0, k * 0.5); c2.lineTo(Math.cos(an) * k * 1.4, k * 0.5 + Math.sin(an) * k * 1.4); c2.stroke(); }
      c2.fillStyle = rgb('120,10,10', 0.8); c2.beginPath(); c2.arc(0, -k * 0.34, k * 0.36, 0, TAU); c2.fill(); c2.fillStyle = rgb('226,40,34', 1); c2.beginPath(); c2.arc(0, -k * 0.34, k * 0.31, 0, TAU); c2.fill(); c2.fillStyle = rgb('50,26,6', 1); c2.beginPath(); c2.arc(0, k * 0.5, k * 0.1, 0, TAU); c2.fill(); });
    KU('holy', () => G.KF.glint(e.x, e.y, (e.ratio || 1) * 0.62, 0.5, 12)); }
  /* 往上飄的氣（酒氣、妖氣）：幾縷有尾焰的火形 */
  function vapor(pal, n, life, sz) { /* r3.197.0：妖氣／酒氣＝手繪的火苗圍在腳邊（原本程式畫的火形） */ if (AFX().play('b_ezo', 'fx_heat_embers', { size: kk(H.y) * (0.9 + n * 0.08), by: 'w', anc: 'b', tpf: Math.max(3, Math.round(life / 4)), fin: 3, at: () => [H.x, H.y + kk(H.y) * 0.06] })) return; const W8 = []; for (let i = 0; i < n; i++) W8.push([rnd(-1, 1), rnd(0.6, 1.2), rnd(0, 6), rnd(0, 0.5)]); KFa(life, 'o', (c2, u) => { const k = kk(H.y), w = FXR().wisp; if (!w) return; for (const v of W8) w(c2, H.x + v[0] * k * 0.3 + Math.sin(u * 0.18 + v[2]) * k * 0.08, H.y - k * (0.25 + v[3] + u * 0.03 * v[1]), -Math.PI / 2, k * (sz || 0.09), pal, Math.min(1, u / 4) * (1 - u / life), 0, v[2]); }); }
  let shots = 0; const fox = [];
  const do0 = G.damageOni; G.damageOni = function (e, mult, big, fc, opt) {
    const hero = e && e.st !== 'dead' && !(opt && (opt.party || opt.rune)) && !G._bleedTick && !e.kz;
    if (!hero || !Object.keys(ON).length) return do0.apply(this, arguments);
    let m = mult, up = 0; const lo = H.hp < H.hpMax * 0.4;   // r3.94.0：名物增傷改相加（增傷區）
    if (on('dojigiri') && ONI.test(e.type || '')) up += 0.4 * k(ON.dojigiri);
    if (on('shuten') && lo) up += 0.4 * k(ON.shuten);
    if (on('yukionna') && e.st2 && e.st2.frz > 0) up += 0.3 * k(ON.yukionna);
    if (on('yoichi') && !e._yoichi) { e._yoichi = 1; fc = true; up += 0.5 * k(ON.yoichi); try { fanMark(e); } catch (x) {} }
    G.DZ.add(up);
    const n0 = G.NUMS.length, h0 = e.hp, r = do0.call(this, e, m, big, fc, opt); if (!(e.hp < h0)) return r;
    const nm = G.NUMS[G.NUMS.length - 1], crit = G.NUMS.length > n0 && nm && nm.crit, V = VX();
    try {
      if (on('dojigiri') && big && G.PROC('m_doji', 30) && Math.random() < 0.25) { oniCut(e.x, e.y); area(e.x, e.y, HH() * 1.3, 2.0 * k(ON.dojigiri)); }
      if (on('raikiri') && crit && G.PROC('m_rai', 0) && ready('rai', 1)) { KU('moon', () => { const K2 = G.KF, kq = kk(e.y), hq = kk(H.y); const ex = e.x, ey = e.y; AFX().play('b_izanami', 'izanami_thunder', { x: ex, y: ey + kq * 0.08, size: kq * 5, by: 'h', anc: 'b', tpf: 3, hold: 2, fb: () => KU('moon', () => G.KF.bolt(ex + rnd(-0.4, 0.4) * kq, ey - 6 * kq, ex, ey - 0.2 * kq, 16, 3, 3)) }); K2.light(e.x, e.y, 1.4, 16, 0.7, 0.5); K2.puff(e.x, e.y, 0.9); K2.scar && K2.scar(e.x, e.y, 1, 1.5); AFX().play('b_raiju', 'raijuo_electric_burst', { size: hq * 1.1, tpf: 3, at: () => [H.x + H.face * hq * 0.55, H.y - hq * 0.65] }); });   /* r3.197.0：雷切＝手繪落雷＋刀上手繪電光 */ rdmg(e, 1.8 * k(ON.raikiri), true); }   /* 雷切：粗雷落下＋刀上殘留電弧 */
      if (on('tonbo') && G.PROC('m_tonbo', 15)) { const f = Math.sign(e.x - H.x) || H.face; let b = null, bd = 99; for (const q of G.E) if (alive(q) && q !== e && (q.x - e.x) * f > 0 && Math.abs(q.x - e.x) < bd && Math.abs(q.y - e.y) < 30) { bd = Math.abs(q.x - e.x); b = q; } if (b) { rdmg(b, 0.6 * k(ON.tonbo)); if (every('tonbo', 6)) { const x0 = e.x, x1 = b.x, y0 = e.y, z = 0.55; const kq = kk(y0), sx = x0 - f * kq * 0.9, ex = x1 + f * kq * 0.2; /* r3.199.0：蜻蛉切＝里歐「惡魔之槍」的手繪長槍，轉成水平、順著出槍方向從目標穿到後面那隻 */ AFX().play('lv_demonslance', null, { fr: [4, 9], tpf: 2, hold: 2, size: kq * 3.4, by: 'w', ang: -0.7, flip: f < 0, at: u => { const q = Math.min(1, u / 7); return [sx + (ex - sx) * (1 - (1 - q) * (1 - q)), y0 - z * kq]; }, fb: () => KU('lance', () => G.KF.qi({ x: (x0 + x1) / 2, y: y0, z, ang: 0, len: Math.abs(x1 - x0) / kq + 0.8, w: 0.045, dur: 2, life: 10, motes: 2 })) }); KU('lance', () => { const K2 = G.KF; K2.pierce && K2.pierce(x1 + f * 0.25 * kk(y0), y0 - z * kk(y0), f, 0, 0.7); }); } } }   /* 蜻蛉切：一道細槍光穿過目標刺進後面那隻 */
      if (on('mikazuki') && crit && G.PROC('m_mika', 30) && Math.random() < 0.2) G.STORY.later(6, () => { if (!alive(e)) return; { const f = Math.sign(e.x - H.x) || 1, ex = e.x, ey = e.y, kq = kk(ey); /* r3.199.0：三日月＝里歐「月閃光」的手繪新月 */ AFX().play('lv_gessenkou', null, { x: ex - f * kq * 0.25, y: ey - kq * 0.6, fr: [3, 12], tpf: 2, size: kq * 3.6, by: 'w', flip: f < 0, fb: () => KU('lance', () => G.KF.smear({ x: ex - f * 0.9 * kq, y: ey, f, cy: 0.6, r: 1.2, sq: 0.9, a0: -1.2, a1: 1.2, w: 0.42, dur: 3, life: 18, tier: 2, trail: 2.4 })) }); KU('holy', () => { G.KF.glint(ex, ey, 0.6, 0.45, 12); G.KF.light(ex, ey, 1.2, 14, 0.5, 0.5); }); } rdmg(e, 1.0 * k(ON.mikazuki), true); });   /* 三日月：追加的一斬是金色新月 */
      if (on('iwatoshi') && big && G.PROC('m_iwa', 0) && ready('iwa', 4)) { KU('lance', () => { const K2 = G.KF, kq = kk(e.y); const ex = e.x, ey = e.y; AFX().play('lv_granddasher', null, { x: ex, y: ey, size: kq * 5.4, by: 'w', anc: [0.5, 0.79], tpf: 3, fb: () => KU('lance', () => { const K3 = G.KF; K3.crack(ex, ey, 2.0, 90, true); K3.rocks(ex, ey, 22, 2.0); for (let i = 0; i < 8; i++) { const an = i / 8 * TAU; K3.puff(ex + Math.cos(an) * 1.4 * kq, ey + Math.sin(an) * 0.55 * kq, 1.4); } }) }); K2.light(e.x, e.y, 2, 18, 0.5, 0.2); });   /* r3.197.0：岩融＝里歐「地裂」的手繪岩柱 */ SC.shake = Math.max(SC.shake || 0, 9); area(e.x, e.y, HH() * 1.4, 2.2 * k(ON.iwatoshi)); }   /* 岩融：比震地更大的地裂、岩塊、塵柱 */
      if (on('inatomi') && G.PROC('m_ina', 0) && ++shots % 5 === 0) { const bx = e.x, by = e.y, B = G.KF && G.KF.boom; /* r3.199.0：稻富＝手繪爆炸一大三小連環引爆 */ if (AFX().play('x2_core', 'fx_blast', { x: bx, y: by + kk(by) * 0.1, size: kk(by) * 2.6, by: 'h', anc: 'b', tpf: 3 })) { for (let i = 0; i < 3; i++) AFX().play('x2_core', 'fx_blast', { x: bx + rnd(-1, 1) * kk(by), y: by + rnd(-0.25, 0.3) * kk(by), size: kk(by) * rnd(1.3, 1.8), by: 'h', anc: 'b', tpf: 3, delay: 4 + i * 4 }); SC.shake = Math.max(SC.shake || 0, 6); } else if (B) { B(null, bx, by, 1.5); for (let i = 0; i < 3; i++) G.STORY.later(3 + i * 3, () => B(null, bx + rnd(-1, 1) * kk(by), by + rnd(-0.3, 0.3) * kk(by), 0.9)); } else G.VX && G.VX.s2 && G.VX.s2('fx_blast', { x: bx, y: by, k: 1.2, life: 26 }); area(e.x, e.y, HH() * 1.2, 3.0 * k(ON.inatomi)); }   /* 稻富：火藥連環引爆 */
      if (on('yukionna') && G.PROC('m_yuki', 30, e) && Math.random() < 0.2 && G.RUNE && G.RUNE.frost) { G.RUNE.frost(e); if (every('yuki', 12)) { const hx = H.x + H.face * kk(H.y) * 0.4, hy = H.y - kk(H.y) * 0.6, Fl = []; for (let i = 0; i < 6; i++) Fl.push([rnd(-0.3, 0.3), rnd(-0.3, 0.3), rnd(0, 6)]); if (!AFX().play('p_shion_fx', 'freeze_snap', { size: kk(H.y) * 0.8, by: 'h', tpf: 3, at: () => [H.x + H.face * kk(H.y) * 0.45, H.y - kk(H.y) * 0.55] })) KFa(26, 'o', (c2, u) => { const kq = kk(H.y), sn = FXR().snow; if (!sn) return; for (const fl of Fl) sn(c2, hx + fl[0] * kq + H.face * u * kq * 0.012, hy + fl[1] * kq + u * kq * 0.008, kq * 0.06, u * 0.08 + fl[2], Math.min(1, u / 4) * (1 - u / 26)); }); KU('moon', () => G.KF.puff(hx, H.y, 0.5, 22)); } }   /* 雪女：手邊飄出雪花與白息 */
    } catch (x) { console.warn('meibutsu', x); }
    try {
      if (on('muramasa') && every('mura', 40)) vapor('mura', 4, 26, 0.08);   /* 村正：出手時刀身帶暗紅妖氣 */
    } catch (x) { console.warn('meibutsu fx', x); }
    return r; };
  /* ---------- 受傷 ---------- */
  const hh0 = G.hurtHero; G.hurtHero = function (atk, srcX) { if (on('muramasa')) atk *= 1.15; if (on('shuten') && H.hp < H.hpMax * 0.4) atk *= 0.75;
    const h0 = H.hp, r = hh0.call(this, atk, srcX);
    if (on('akaito') && H.hp < h0) { let b = null, bd = 200; for (const q of G.E) if (alive(q)) { const d = Math.abs(q.x - (srcX === undefined ? H.x : srcX)) + Math.abs(q.y - H.y); if (d < bd) { bd = d; b = q; } }
      if (b) { rdmg(b, 0.6 * k(ON.akaito) * (h0 - H.hp) / Math.max(1, R.S.atk)); { const tx = b.x, ty = b.y; /* r3.199.0：赤糸＝手繪的紅繩（帶符紙）從鎧上甩向攻擊者 */ if (!AFX().play('b_katashiro', 'katashiro_tether_trace', { tpf: 4, by: 'w', anc: [0.04, 0.5], size: () => Math.max(kk(H.y) * 1.4, Math.hypot(tx - H.x, ty - H.y) * 1.05), at: () => { const kq = kk(H.y), dx = tx - H.x, dy = (ty - kq * 0.5) - (H.y - kq * 0.6), lf = dx < 0, an = Math.atan2(dy, dx); return [H.x, H.y - kq * 0.6, lf ? Math.PI - an : an]; }, flip: tx < H.x })) KFa(14, 'o', (c2, u) => { const kq = kk(H.y), x0 = H.x, y0 = H.y - kq * 0.6, x1 = tx, y1 = ty - kq * 0.5, q = Math.min(1, u / 5), a = 1 - Math.max(0, u - 6) / 8, ex = x0 + (x1 - x0) * q, ey = y0 + (y1 - y0) * q; c2.lineCap = 'round'; for (const [w, col, al] of [[0.07, '50,6,6', 0.6], [0.04, '226,40,40', 1], [0.014, '255,220,200', 1]]) { c2.strokeStyle = rgb(col, al * a); c2.lineWidth = Math.max(0.8, w * kq); c2.beginPath(); c2.moveTo(x0, y0); c2.quadraticCurveTo((x0 + ex) / 2, Math.min(y0, ey) - kq * 0.35 * Math.sin(u * 0.5), ex, ey); c2.stroke(); } c2.fillStyle = rgb('226,40,40', a); for (let i = 1; i < 4; i++) { const v = i / 4; c2.beginPath(); c2.arc(x0 + (ex - x0) * v, y0 + (ey - y0) * v - kq * 0.17 * Math.sin(v * Math.PI), Math.max(1, kq * 0.03), 0, TAU); c2.fill(); } }); KU('ember', () => G.KF.glint(H.x, H.y, 0.6, 0.5, 10)); } } }   /* 赤糸威：鎧上的紅絲射向攻擊者 */
    if (on('muramasa') && H.hp < h0 && every('mura2', 20)) vapor('mura', 6, 22, 0.1);   /* 村正：受傷時妖氣反噬 */
    return r; };
  /* ---------- 擊殺 ---------- */
  let oniSt = 0; const ok0 = R.onKill; R.onKill = function (e) { ok0.apply(this, arguments); if (!on('onimaru') || (e && e.kz)) return; H.hp = Math.min(H.hpMax, H.hp + H.hpMax * 0.05); try { if (e && AFX().ok('b_ezo', 'fx_heat_embers')) { G.STORY.later(18, () => { vapor('sake', 4, 24); KU('ember', () => G.KF.glint(H.x + H.face * kk(H.y) * 0.4, H.y, 0.6, 0.4 + 0.12 * oniSt, 12)); }); } else if (e) { const sx = e.x, sy = e.y - kk(e.y) * 0.5; KFa(18, 'o', (c2, u) => { const w = FXR().wisp; if (!w) return; const q = u / 18, e2 = q * q, tx = H.x + H.face * kk(H.y) * 0.4, ty = H.y - kk(H.y) * 0.6, x = sx + (tx - sx) * e2, y = sy + (ty - sy) * e2 - Math.sin(q * Math.PI) * kk(H.y) * 0.5; w(c2, x, y, Math.atan2(ty - sy, tx - sx), kk(H.y) * 0.1, 'sake', 1 - Math.max(0, q - 0.8) / 0.2, 0, sx); }); G.STORY.later(18, () => KU('ember', () => { G.KF.glint(H.x + H.face * kk(H.y) * 0.4, H.y, 0.6, 0.4 + 0.12 * oniSt, 12); G.KF.light(H.x, H.y, 0.9, 14, 0.5, 0.6); })); } } catch (x) {}   /* 鬼丸：魂被吸進刀身，刀上一閃（層數越多越亮） */
    oniSt = (G.BUFF.get('atk') > 0 && oniSt < 3) ? oniSt + 1 : 1; G.BUFF.v.atk = 0; G.BUFF.add('atk', Math.round(12 * oniSt * k(ON.onimaru)), 480); };
  /* ---------- 每格：天狗、河童、九尾 ---------- */
  let wasDodge = false, tk = 0;
  const ls0 = G.NPCLIFE.step; G.NPCLIFE.step = function () { ls0(); tk++; if (G.mode !== 'play' || !Object.keys(ON).length) return;
    if (tk % 30 === 1) { const L = []; if (on('dojigiri')) L.push('b_mb_zenki'); if (on('raikiri')) L.push('b_izanami', 'b_raiju'); if (on('iwatoshi')) L.push('lv_granddasher'); if (on('yukionna') || on('kappa')) L.push('p_shion_fx'); if (on('muramasa') || on('shuten') || on('onimaru')) L.push('b_ezo'); if (on('kyubi')) L.push('b_kyubi'); if (on('tonbo')) L.push('lv_demonslance'); if (on('mikazuki')) L.push('lv_gessenkou'); if (on('akaito')) L.push('b_katashiro'); if (on('yoichi')) L.push('p_hayate_fx'); AFX().pre(L); }   /* r3.197.0：身上名物用到的手繪素材先備好 */
    const dg = !!(H.act && /dodge|dash/.test(H.act.kind || '')); if (dg && !wasDodge && on('tengu')) { G.BUFF.add('mspd', Math.round(30 * k(ON.tengu)), 180); G.BUFF.add('nextCrit', 100, 180); try { const x0 = H.x, y0 = H.y, Ft = []; for (let i = 0; i < 7; i++) Ft.push([rnd(0, TAU), rnd(0.3, 0.9), rnd(0, 6)]); KU('gale', () => { G.KF.puff(x0, y0, 1.0, 20); G.KF.leaves(x0, y0, 0.3, 6, { sp: 2, life: 26 }); }); if (!AFX().play('fx_common', 'skill_wind_vortex_a', { x: x0, y: y0 + kk(y0) * 0.05, size: kk(y0) * 1.5, by: 'h', anc: 'b', tpf: 4, loop: 2, fin: 3 })) KFa(30, 'o', (c2, u) => { const kq = kk(y0), ft = FXR().feather; if (!ft) return; for (const v of Ft) { const an = v[0] + u * 0.14, r = kq * v[1] * (0.4 + u * 0.03); ft(c2, x0 + Math.cos(an) * r, y0 - kq * (0.2 + u * 0.022) + Math.sin(an) * r * 0.35, an + v[2], kq * 0.09, Math.min(1, u / 3) * (1 - u / 30)); } }); } catch (x) {} }   /* 天狗：閃避後腳下旋風捲起黑羽 */ wasDodge = dg;
    if (on('kappa') && tk % 300 === 0 && H.hp > 0 && H.hp < H.hpMax) { const v = Math.round(H.hpMax * 0.03 * k(ON.kappa)); H.hp = Math.min(H.hpMax, H.hp + v); G.NUMS.push({ x: H.x, y: H.y - HH() - 10, v: '+' + v, heal: true, t: 0 }); try { if (AFX().play('p_shion_fx', 'heal_main', { size: kk(H.y) * 1.7, by: 'w', anc: [0.5, 0.82], tpf: 4, at: () => [H.x, H.y] })) throw 0; const Dp = []; for (let i = 0; i < 5; i++) Dp.push([rnd(-0.25, 0.25), i * 3]); KFa(30, 'o', (c2, u) => { const kq = kk(H.y), dr = FXR().droplet; if (!dr) return; for (const d of Dp) { const t = u - d[1]; if (t < 0 || t > 14) continue; dr(c2, H.x + d[0] * kq, H.y - kq * (1.5 - t * 0.04), kq * 0.05, 1 - Math.max(0, t - 10) / 4); } }); G.VX && G.VX.ring && G.VX.ring({ x: H.x, y: H.y, r0: 0.1, r1: 0.9, life: 26, col: '150,225,240', lw: 0.08 }); } catch (x) {} }   /* 河童：頭上水滴落下，腳邊一圈水紋 */
    if (on('shuten') && H.hp > 0 && H.hp < H.hpMax * 0.4 && tk % 24 === 0) vapor('sake', 3, 30, 0.085);   /* 酒吞：低血時身上酒氣蒸騰 */
    if (on('kyubi') && tk % 480 === 0 && G.E.some(alive)) for (let i = 0; i < 3; i++) fox.push({ x: H.x, y: H.y - HH() * 0.8, t: 0, i, e: null });
    for (let i = fox.length - 1; i >= 0; i--) { const f = fox[i]; f.t++; if (!alive(f.e)) { let b = null, bd = 600; for (const q of G.E) if (alive(q)) { const d = Math.hypot(q.x - f.x, q.y - f.y); if (d < bd) { bd = d; b = q; } } f.e = b; }
      if (!f.e || f.t > 120) { fox.splice(i, 1); continue; } const tx = f.e.x, ty = f.e.y - HH() * 0.5 * S(f.e.y), a = Math.min(1, 0.05 + f.t * 0.01); if (f.t < 14) { f.x += Math.cos(f.i * 2.1) * 3; f.y -= 2; } else { f.x += (tx - f.x) * a; f.y += (ty - f.y) * a; }
      if (Math.hypot(tx - f.x, ty - f.y) < 14) { rdmg(f.e, 1.2 * k(ON.kyubi)); fox.splice(i, 1); } } };
  const df0 = G.drawFx; G.drawFx = function (Z) { const r = df0.apply(this, arguments); if (fox.length) { ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.globalCompositeOperation = 'source-over'; for (const f of fox) { const w = FXR().wisp, an = f.e ? Math.atan2((f.e.y - HH() * 0.5 * S(f.e.y)) - f.y, f.e.x - f.x) : -Math.PI / 2; const a2 = f.t < 14 ? -Math.PI / 2 : an, lf = Math.cos(a2) < -0.01; if (!AFX().fr('b_kyubi', 'kyubi_fox_fire', 1 + Math.floor(f.t / 4) % 2, f.x, f.y, { size: kk(f.y) * 1.25, by: 'w', ang: lf ? Math.PI - a2 : a2, flip: lf }) && w) w(ctx, f.x, f.y, a2, kk(f.y) * 0.1, 'kyubi', 1, 1, f.i * 2); }   /* r3.196.0：九尾狐火＝青白、有狐耳狐眼、拖尾焰（原本一顆光點） */
      ctx.restore(); }
    return r; };
  if (G.GROW && G.GROW.spdBonus) { const sb0 = G.GROW.spdBonus; G.GROW.spdBonus = function () { return sb0.apply(this, arguments) + (G.BUFF ? G.BUFF.get('mspd') : 0); }; }
  /* ---------- 來源 ---------- */
  if (G.BOSS) { const oe0 = G.BOSS.onEnd; G.BOSS.onEnd = function (enc) { oe0 && oe0(enc); try { if (!enc || (G.KASSEN && G.KASSEN.c)) return; const id = enc.id || '', lv = Math.max(R.d().lv, enc.lv || 1);
      if (/^h_/.test(id)) { const f = G.SAVE.data.flags, key = 'uq_' + id; if (!f[key]) { f[key] = 1; G.SAVE.markDirty(); drop(lv, undefined, undefined, '隱藏王首勝'); } else if (Math.random() < 0.1) drop(lv); return; }
      const dun = SC.def && SC.def.dungeon; if (Math.random() < (dun ? 0.08 : 0.05)) drop(lv, undefined, undefined, dun ? '副本頭目' : '頭目'); } catch (x) { console.warn('uq drop', x); } }; }
  G.MEIBUTSU = { UQ, UK, make, drop, ON: () => ON };
})();
