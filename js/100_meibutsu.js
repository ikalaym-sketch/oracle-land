/* ==========================================================================
 * 神諭之地 重製版 — 100_meibutsu.js
 * Version : r3.96.0  (2026-11-26)　r3.96.0：名物掉落等級吃目前難度（原本讀不到難度）
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
  let shots = 0; const fox = [];
  const do0 = G.damageOni; G.damageOni = function (e, mult, big, fc, opt) {
    const hero = e && e.st !== 'dead' && !(opt && (opt.party || opt.rune)) && !G._bleedTick && !e.kz;
    if (!hero || !Object.keys(ON).length) return do0.apply(this, arguments);
    let m = mult, up = 0; const lo = H.hp < H.hpMax * 0.4;   // r3.94.0：名物增傷改相加（增傷區）
    if (on('dojigiri') && ONI.test(e.type || '')) up += 0.4 * k(ON.dojigiri);
    if (on('shuten') && lo) up += 0.4 * k(ON.shuten);
    if (on('yukionna') && e.st2 && e.st2.frz > 0) up += 0.3 * k(ON.yukionna);
    if (on('yoichi') && !e._yoichi) { e._yoichi = 1; fc = true; up += 0.5 * k(ON.yoichi); }
    G.DZ.add(up);
    const n0 = G.NUMS.length, h0 = e.hp, r = do0.call(this, e, m, big, fc, opt); if (!(e.hp < h0)) return r;
    const nm = G.NUMS[G.NUMS.length - 1], crit = G.NUMS.length > n0 && nm && nm.crit, V = VX();
    try {
      if (on('dojigiri') && big && G.PROC('m_doji', 30) && Math.random() < 0.25) { V.ring && V.ring({ x: e.x, y: e.y, r1: 1.6, life: 16, col: '255,90,70', lw: 0.12 }); area(e.x, e.y, HH() * 1.3, 2.0 * k(ON.dojigiri)); }
      if (on('raikiri') && crit && G.PROC('m_rai', 0) && ready('rai', 1)) { V.bolt && V.bolt({ x0: e.x, y0: e.y - HH() * 3, x1: e.x, y1: e.y - HH() * 0.5, col: '200,220,255', life: 12 }); rdmg(e, 1.8 * k(ON.raikiri), true); }
      if (on('tonbo') && G.PROC('m_tonbo', 15)) { const f = Math.sign(e.x - H.x) || H.face; let b = null, bd = 99; for (const q of G.E) if (alive(q) && q !== e && (q.x - e.x) * f > 0 && Math.abs(q.x - e.x) < bd && Math.abs(q.y - e.y) < 30) { bd = Math.abs(q.x - e.x); b = q; } if (b) rdmg(b, 0.6 * k(ON.tonbo)); }
      if (on('mikazuki') && crit && G.PROC('m_mika', 30) && Math.random() < 0.2) G.STORY.later(6, () => rdmg(e, 1.0 * k(ON.mikazuki), true));
      if (on('iwatoshi') && big && G.PROC('m_iwa', 0) && ready('iwa', 4)) { V.crack && V.crack({ x: e.x, y: e.y, r: 1.3 }); area(e.x, e.y, HH() * 1.4, 2.2 * k(ON.iwatoshi)); }
      if (on('inatomi') && G.PROC('m_ina', 0) && ++shots % 5 === 0) { G.VX && G.VX.s2 && G.VX.s2('fx_blast', { x: e.x, y: e.y, k: 1.2, life: 26 }); area(e.x, e.y, HH() * 1.2, 3.0 * k(ON.inatomi)); }
      if (on('yukionna') && G.PROC('m_yuki', 30, e) && Math.random() < 0.2 && G.RUNE && G.RUNE.frost) G.RUNE.frost(e);
    } catch (x) { console.warn('meibutsu', x); }
    return r; };
  /* ---------- 受傷 ---------- */
  const hh0 = G.hurtHero; G.hurtHero = function (atk, srcX) { if (on('muramasa')) atk *= 1.15; if (on('shuten') && H.hp < H.hpMax * 0.4) atk *= 0.75;
    const h0 = H.hp, r = hh0.call(this, atk, srcX);
    if (on('akaito') && H.hp < h0) { let b = null, bd = 200; for (const q of G.E) if (alive(q)) { const d = Math.abs(q.x - (srcX === undefined ? H.x : srcX)) + Math.abs(q.y - H.y); if (d < bd) { bd = d; b = q; } }
      if (b) { rdmg(b, 0.6 * k(ON.akaito) * (h0 - H.hp) / Math.max(1, R.S.atk)); VX().ring && VX().ring({ x: H.x, y: H.y, r1: 1.0, life: 14, col: '255,120,90', lw: 0.1 }); } }
    return r; };
  /* ---------- 擊殺 ---------- */
  let oniSt = 0; const ok0 = R.onKill; R.onKill = function (e) { ok0.apply(this, arguments); if (!on('onimaru') || (e && e.kz)) return; H.hp = Math.min(H.hpMax, H.hp + H.hpMax * 0.05);
    oniSt = (G.BUFF.get('atk') > 0 && oniSt < 3) ? oniSt + 1 : 1; G.BUFF.v.atk = 0; G.BUFF.add('atk', Math.round(12 * oniSt * k(ON.onimaru)), 480); };
  /* ---------- 每格：天狗、河童、九尾 ---------- */
  let wasDodge = false, tk = 0;
  const ls0 = G.NPCLIFE.step; G.NPCLIFE.step = function () { ls0(); tk++; if (G.mode !== 'play' || !Object.keys(ON).length) return;
    const dg = !!(H.act && /dodge|dash/.test(H.act.kind || '')); if (dg && !wasDodge && on('tengu')) { G.BUFF.add('mspd', Math.round(30 * k(ON.tengu)), 180); G.BUFF.add('nextCrit', 100, 180); } wasDodge = dg;
    if (on('kappa') && tk % 300 === 0 && H.hp > 0 && H.hp < H.hpMax) { const v = Math.round(H.hpMax * 0.03 * k(ON.kappa)); H.hp = Math.min(H.hpMax, H.hp + v); G.NUMS.push({ x: H.x, y: H.y - HH() - 10, v: '+' + v, heal: true, t: 0 }); }
    if (on('kyubi') && tk % 480 === 0 && G.E.some(alive)) for (let i = 0; i < 3; i++) fox.push({ x: H.x, y: H.y - HH() * 0.8, t: 0, i, e: null });
    for (let i = fox.length - 1; i >= 0; i--) { const f = fox[i]; f.t++; if (!alive(f.e)) { let b = null, bd = 600; for (const q of G.E) if (alive(q)) { const d = Math.hypot(q.x - f.x, q.y - f.y); if (d < bd) { bd = d; b = q; } } f.e = b; }
      if (!f.e || f.t > 120) { fox.splice(i, 1); continue; } const tx = f.e.x, ty = f.e.y - HH() * 0.5 * S(f.e.y), a = Math.min(1, 0.05 + f.t * 0.01); if (f.t < 14) { f.x += Math.cos(f.i * 2.1) * 3; f.y -= 2; } else { f.x += (tx - f.x) * a; f.y += (ty - f.y) * a; }
      if (Math.hypot(tx - f.x, ty - f.y) < 14) { rdmg(f.e, 1.2 * k(ON.kyubi)); fox.splice(i, 1); } } };
  const df0 = G.drawFx; G.drawFx = function (Z) { const r = df0.apply(this, arguments); if (fox.length) { ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const f of fox) { const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, 10); g.addColorStop(0, 'rgba(255,240,200,.95)'); g.addColorStop(0.5, 'rgba(120,180,255,.7)'); g.addColorStop(1, 'rgba(80,120,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(f.x, f.y, 10, 0, 6.283); ctx.fill(); } ctx.restore(); }
    return r; };
  if (G.GROW && G.GROW.spdBonus) { const sb0 = G.GROW.spdBonus; G.GROW.spdBonus = function () { return sb0.apply(this, arguments) + (G.BUFF ? G.BUFF.get('mspd') : 0); }; }
  /* ---------- 來源 ---------- */
  if (G.BOSS) { const oe0 = G.BOSS.onEnd; G.BOSS.onEnd = function (enc) { oe0 && oe0(enc); try { if (!enc || (G.KASSEN && G.KASSEN.c)) return; const id = enc.id || '', lv = Math.max(R.d().lv, enc.lv || 1);
      if (/^h_/.test(id)) { const f = G.SAVE.data.flags, key = 'uq_' + id; if (!f[key]) { f[key] = 1; G.SAVE.markDirty(); drop(lv, undefined, undefined, '隱藏王首勝'); } else if (Math.random() < 0.1) drop(lv); return; }
      const dun = SC.def && SC.def.dungeon; if (Math.random() < (dun ? 0.08 : 0.05)) drop(lv, undefined, undefined, dun ? '副本頭目' : '頭目'); } catch (x) { console.warn('uq drop', x); } }; }
  G.MEIBUTSU = { UQ, UK, make, drop, ON: () => ON };
})();
