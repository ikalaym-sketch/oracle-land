/* ==========================================================================
 * 神諭之地 重製版 — 102_fstory.js
 * Version : r3.125.0  (2026-11-26)　r3.125.0：潮汐也套用第 10 章新插入的 B 段地圖（W_R10_03B／06B）
 * 舊版    : r3.62.0  (2026-11-24)
 * 變更    : r3.62.0 新增。F 項目第一批：
 *           1. 寶珠碎片：每章一片。章節頭目打倒時結算——壞抉擇（頭目變強的那一邊）＝被道摩奪走；第 10 章獻給海神＝獻；其他＝守住。
 *              道摩軍世界事件沒打完就離開＝道摩多奪 1 片（最多 3 片）。角色頁顯示進度；被奪 4 片以上＝魔化路線。
 *           2. 魔化道摩條件：非魔化路線——立約殿道摩打到一半就收手（不會魔化，戰鬥較短）；
 *              魔化路線——第 11 章進黃泉時道摩吸收黃泉之力（劇情），立約殿道摩血量 +30%、照原本魔化；結局：真結局門檻變高（羈絆 −2 計算），羈絆不足直接走暴雨。
 *           3. 第 10 章潮汐：三潮珊庭各地圖 90 秒一輪（早潮→滿潮→退潮）。滿潮時低處淹水：移動變慢、每秒扣 1% 生命，站上「避潮台」反而回血；
 *              退潮時低處露出一處寶物（每輪一次）。畫面上方顯示目前潮位與剩餘秒數。
 *           4. 第 12 章天空：大禍津日甦醒後（擊敗立約殿道摩）R12 各圖轉為赤空＋落灰；結局後依結局換天色：真＝晴空、暴雨＝暴雨、無名＝黎明。
 *           ・效能：碎片結算只在頭目擊敗／進場時算一次；潮汐、天空每格只畫一層半透明色塊與少量粒子。
 * 存檔    : flags.domaLost（道摩事件放棄次數）、flags.majinSeen、flags.shard_<c>（已提示）、flags.yomiAbsorb。
 * 依賴    : 53_quest（choice、bossMod、by）、52_hub（bossOf、marks）、26_boss（onEnd、DEF.doma）、22_event（EV.cur）、15_skill（BUFF mspd）、100_meibutsu（mspd）。
 * ========================================================================== */
'use strict';
(function () {
  const Q = G.QST, HUB = G.HUB, SC = G.SC, H = G.H, F = () => G.SAVE.data.flags, ctx = G.ctx; if (!Q || !HUB) return;
  const TH = 4, C = k => Q.choice ? Q.choice(k) : null, CK = { 2: 'c2_stone', 3: 'c3_bride', 4: 'c4_well', 5: 'c5_truth', 6: 'c6_confess', 8: 'c8_feast', 10: 'c10_tide' };
  /* ---------- 1. 寶珠碎片 ---------- */
  function shardOf(c) { const map = HUB.bossOf ? HUB.bossOf(c) : 'W_R' + String(c).padStart(2, '0') + '_07'; if (!F()['boss_' + map]) return null;
    if (c === 10 && C('c10_tide') === 'offer') return 'given';
    const ck = CK[c]; if (!ck || !C(ck)) return 'safe';   // 沒做抉擇的章節不算被奪
    const f = Q.bossMod[map]; let m = null; try { m = f && f(); } catch (e) {} if (m && ((m.hp || 1) > 1 || (m.atk || 1) > 1)) return 'stolen'; return 'safe'; }
  function count() { const z = { safe: 0, given: 0, stolen: 0 }; for (let c = 1; c <= 12; c++) { const s = shardOf(c); if (s) z[s]++; } z.stolen += Math.min(3, F().domaLost || 0); z.majin = z.stolen >= TH; return z; }
  const majin = () => count().majin;
  G.SHARD = { TH, count, shardOf, majin, show: () => !!(F().ch6 || count().stolen) };
  if (G.BOSS) { const oe0 = G.BOSS.onEnd; G.BOSS.onEnd = function (enc) { oe0 && oe0(enc); try { const id = SC.id; for (let c = 1; c <= 12; c++) { if ((HUB.bossOf ? HUB.bossOf(c) : '') !== id) continue;
      G.STORY.later(240, () => { const s = shardOf(c); if (!s || F()['shard_' + c]) return; F()['shard_' + c] = 1; G.SAVE.markDirty(); const z = count();
        G.UI.banner('寶珠碎片（第 ' + c + ' 章）', s === 'safe' ? '守住了。小雪把它收進了護符裡' : s === 'given' ? '獻給了海神，道摩拿不走' : '被道摩的式神奪走了……（被奪 ' + z.stolen + '／' + TH + '）');
        if (z.majin && !F().majinSeen) { F().majinSeen = 1; G.STORY.later(300, () => G.UI.banner('道摩的魔化開始了', '被奪走的碎片太多了……他正在變成別的東西')); } }); } } catch (e) { console.warn('shard', e); } }; }
  /* 道摩軍世界事件沒打完就離開 → 多被奪一片 */
  let lastEv = null; const en0 = G.STORY.onEnter.bind(G.STORY); G.STORY.onEnter = function (id) { const ev = G.EV && G.EV.cur;
    if (ev && !ev.done && (ev.k === 'doma' || ev.wk === 'doma' || /道摩/.test(ev.n || '')) && !ev.war) { F().domaLost = Math.min(3, (F().domaLost || 0) + 1); G.SAVE.markDirty(); G.STORY.later(60, () => G.UI.toast('道摩軍帶著一片寶珠碎片離開了（被奪 ' + count().stolen + '／' + TH + '）')); }
    en0(id); try { onEnter(id); } catch (e) { console.warn('fstory', e); } };
  /* ---------- 2. 魔化道摩 ---------- */
  function doma() { const D = G.BOSS && G.BOSS.DEF && G.BOSS.DEF.doma; if (!D) return setTimeout(doma, 100); if (D._f) return; D._f = 1;
    const in0 = D.init; D.init = function (enc) { in0.apply(this, arguments); enc.majin = majin(); if (enc.majin) { for (const u of enc.units || []) { u.hp = u.hpMax = Math.round(u.hpMax * 1.3); } G.STORY.later(80, () => G.UI.banner('道摩', '寶珠的碎片……在我體內燒著')); } };
    const dir0 = D.director; D.director = function (enc) { const v = enc.v, e = (enc.units || [])[0];
      if (!enc.majin && e && e.st !== 'dead' && v && !v.cor) { if (v.yield) { if (G.t - v.yield >= 150) { v.cor = 1; e.inv = 0; e.hp = 0; e.st = 'dead'; e.t = 0; } return; }
        if (e.hp < e.hpMax * 0.5) { v.yield = G.t; v.corT = 1; e.inv = 999; e.mv = null; for (const k of v.kids || []) if (k.st !== 'dead') { k.st = 'dead'; k.t = 0; } if (G.BOSS.tg) G.BOSS.tg.length = 0;
          G.UI.banner('道摩', '……夠了。碎片在你們手上，我成不了神。'); return; } }
      return dir0.apply(this, arguments); }; }
  doma();
  /* 結局：魔化路線讓真結局更難（羈絆 −2 計算） */
  (function endHook() { const q = Q.by && Q.by.c12_end; if (!q) return setTimeout(endHook, 100); if (q._f) return; q._f = 1; const st = q.steps[0], l0 = st.lines;
    st.lines = function () { const b0 = Q.bond, mj = majin(); if (mj) Q.bond = () => b0.call(Q) - 2; let L; try { L = typeof l0 === 'function' ? l0.apply(this, arguments) : l0; } finally { Q.bond = b0; }
      if (mj) L = [{ who: '道摩', text: '（倒下的道摩身上，黑色的碎片一片片剝落。）……我奪走的，你們替我還回去吧。' }].concat(L); return L; }; })();
  /* ---------- 進場：第 11 章吸收黃泉、第 10 章潮汐 ---------- */
  const TIDE = { on: false, t: 0, seat: [], gift: null, ph: -1 };
  function onEnter(id) { TIDE.on = /^W_R10_0[1-6]B?$/.test(id); TIDE.seat = []; TIDE.gift = null; TIDE.ph = -1;
    if (/^W_R11_/.test(id) && majin() && !F().yomiAbsorb) { F().yomiAbsorb = 1; G.SAVE.markDirty(); G.STORY.later(90, () => G.DLG.start([{ who: '', text: '（黃泉的風倒灌上來。遠方的崖上，有個身影張開了雙手。）' },
      { who: '道摩', text: '黃泉之力……加上被你們弄丟的碎片。夠了，夠我站上立約殿了。' }, { who: '小雪', text: '……他身上的氣，已經不是人了。' }])); }
    if (TIDE.on) { const d = SC.def, n = d.nodes || {}, c = n.center || [d.w / 2, (SC.y0 + SC.y1) / 2];
      for (const dx of [-320, 300]) { const p = (SC.snap && SC.snap(c[0] + dx, SC.y0 + (SC.y1 - SC.y0) * 0.3, 'open', 240)) || [c[0] + dx, SC.y0 + 60]; TIDE.seat.push(p); } } }
  const LOW = () => SC.y1 - (SC.y1 - SC.y0) * 0.28, CYC = 5400;
  const tidePh = () => { const t = (G.t % CYC); return t < 1800 ? 0 : t < 3600 ? 1 : 2; };   // 0 早潮 1 滿潮 2 退潮
  const PHN = ['早潮', '滿潮', '退潮'];
  function tideStep() { if (!TIDE.on || SC.trans || G.DLG.active()) return; const ph = tidePh(), low = LOW();
    if (ph !== TIDE.ph) { TIDE.ph = ph; G.UI.toast(ph === 1 ? '滿潮了！低處會淹水，快上避潮台' : ph === 2 ? '退潮了。低處好像露出了什麼' : '早潮。海水慢慢漲上來');
      if (ph === 2) { let p = null; for (let k = 0; k < 40 && !p; k++) { const x = 160 + Math.random() * (SC.def.w - 320), y = low + 20 + Math.random() * (SC.y1 - low - 30); if (SC.walkable(x, y)) p = [x, y]; } TIDE.gift = p ? { x: p[0], y: p[1] } : null; } else TIDE.gift = null; }
    const onSeat = TIDE.seat.some(p => Math.hypot(H.x - p[0], (H.y - p[1]) * 1.5) < 70), wet = H.y > low;
    if (ph === 1 && wet && !onSeat) { TIDE.slow = 10; if (G.t % 60 === 0 && H.hp > 1) H.hp = Math.max(1, H.hp - H.hpMax * 0.01); }
    if (ph === 1 && onSeat && G.t % 60 === 0 && H.hp < H.hpMax) H.hp = Math.min(H.hpMax, H.hp + H.hpMax * 0.01);
    const g = TIDE.gift; if (g && Math.hypot(H.x - g.x, (H.y - g.y) * 1.5) < 40) { TIDE.gift = null; const lv = G.RPG.d().lv; G.LOOT.push({ x: g.x, y: g.y, t: 0, kind: 'gold', v: 40 + lv * 9 });
      const mk = Object.keys(G.RPG.MATS); G.LOOT.push({ x: g.x + 12, y: g.y, t: 0, kind: 'mat', id: mk[Math.floor(Math.random() * mk.length)], n: 3 }); if (Math.random() < 0.35) G.LOOT.push({ x: g.x - 12, y: g.y, t: 0, kind: 'item', it: G.RPG.roll(lv, 'water') }); G.UI.toast('退潮後的寶物！'); } }
  function tideDraw() { if (!TIDE.on) return; const ph = tidePh(), q = (G.t % 1800) / 1800, low = LOW(), W = SC.def.w;
    const lvl = ph === 0 ? q : ph === 1 ? 1 : 1 - q, top = SC.y1 + 40 - (SC.y1 + 40 - low) * lvl;   // 水面高度
    ctx.save(); const g = ctx.createLinearGradient(0, top, 0, SC.y1 + 60); g.addColorStop(0, 'rgba(70,160,230,' + (0.14 + 0.1 * lvl) + ')'); g.addColorStop(1, 'rgba(30,100,170,' + (0.24 + 0.12 * lvl) + ')');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, SC.y1 + 200); for (let x = 0; x <= W; x += 40) ctx.lineTo(x, top + Math.sin(x * 0.02 + G.t * 0.05) * 4); ctx.lineTo(W, SC.y1 + 200); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(230,250,255,.35)'; ctx.lineWidth = 2; ctx.beginPath(); for (let x = 0; x <= W; x += 40) ctx[x ? 'lineTo' : 'moveTo'](x, top + Math.sin(x * 0.02 + G.t * 0.05) * 4); ctx.stroke();
    for (const p of TIDE.seat) { const a = ph === 1 ? 0.7 : 0.35; ctx.fillStyle = 'rgba(240,220,150,' + a * 0.35 + ')'; ctx.strokeStyle = 'rgba(240,220,150,' + a + ')'; ctx.beginPath(); ctx.ellipse(p[0], p[1], 64, 20, 0, 0, 6.283); ctx.fill(); ctx.stroke(); }
    const gf = TIDE.gift; if (gf) { const a = 0.5 + 0.3 * Math.sin(G.t * 0.1); ctx.fillStyle = 'rgba(255,230,140,' + a + ')'; ctx.beginPath(); ctx.arc(gf.x, gf.y - 10, 6, 0, 6.283); ctx.fill(); ctx.strokeStyle = 'rgba(255,230,140,' + a * 0.6 + ')'; ctx.beginPath(); ctx.ellipse(gf.x, gf.y, 22, 7, 0, 0, 6.283); ctx.stroke(); }
    ctx.restore();
    for (const p of TIDE.seat) if (G.SC.toScreen) { /* 名牌畫在 UI 層 */ } }
  const dl0 = G.drawLoot; G.drawLoot = function (Z) { try { tideDraw(); } catch (e) {} return dl0.apply(this, arguments); };
  /* ---------- 第 12 章天空 ---------- */
  const SKY = { crimson: ['rgba(120,20,20,.28)', 'ash'], true: ['rgba(255,236,190,.12)', null], storm: ['rgba(20,30,50,.38)', 'rain'], nameless: ['rgba(255,170,140,.16)', null] };
  const P = []; for (let i = 0; i < 70; i++) P.push({ x: Math.random(), y: Math.random(), v: 0.4 + Math.random() * 0.8 });
  function sky() { if (!/^W_R12_/.test(SC.id || '') || G.mode !== 'play') return null; const e = F().ending; return e && SKY[e] ? e : F().boss_W_R12_04 ? 'crimson' : null; }
  const ud0 = G.UI.draw; G.UI.draw = function () { const k = sky();
    if (k) { const [col, fx] = SKY[k]; ctx.save(); ctx.fillStyle = col; ctx.fillRect(0, 0, G.LW, G.LH);
      if (k === 'true') { const g = ctx.createRadialGradient(G.LW * 0.8, 0, 10, G.LW * 0.8, 0, G.LW * 0.7); g.addColorStop(0, 'rgba(255,240,200,.25)'); g.addColorStop(1, 'rgba(255,240,200,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, G.LW, G.LH); }
      if (fx) for (const p of P) { p.y += (fx === 'rain' ? 0.03 : 0.004) * p.v; p.x += fx === 'rain' ? 0.004 : Math.sin(G.t * 0.01 + p.v * 9) * 0.0008; if (p.y > 1) { p.y = 0; p.x = Math.random(); }
        const x = p.x * G.LW, y = p.y * G.LH; if (fx === 'rain') { ctx.strokeStyle = 'rgba(190,210,240,.45)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 4, y + 14); ctx.stroke(); }
        else { ctx.fillStyle = 'rgba(60,40,40,.6)'; ctx.fillRect(x, y, 2, 2); } }
      ctx.restore(); }
    if (TIDE.on && G.mode === 'play') { const ph = tidePh(), left = Math.ceil((1800 - G.t % 1800) / 60); ctx.save(); ctx.fillStyle = 'rgba(10,20,30,.6)'; G.rr(G.LW / 2 - 70, 54 + G.SAFE.t, 140, 20, 10); ctx.fill(); ctx.restore();
      G.txt('潮汐：' + PHN[ph] + '（' + left + ' 秒）', G.LW / 2, 64 + G.SAFE.t, 11, ph === 1 ? '#7fd0ff' : '#cfe6f5', 'center', G.FONT, 800);
      for (const p of TIDE.seat) { const s = SC.toScreen(p[0], p[1] - 30); if (s.x > 0 && s.x < G.LW) G.txt('避潮台', s.x, s.y, 10, '#f3d98a', 'center', G.FONT, 800); } }
    return ud0.apply(this, arguments); };
  if (G.GROW && G.GROW.spdBonus) { const sb0 = G.GROW.spdBonus; G.GROW.spdBonus = function () { return sb0.apply(this, arguments) - (TIDE.slow > 0 ? 30 : 0); }; }   // 滿潮淹水：移速 −30
  let tk = 0; const ls0 = G.NPCLIFE.step; G.NPCLIFE.step = function () { ls0(); tk++; if (TIDE.slow > 0) TIDE.slow--; try { tideStep(); } catch (e) { console.warn('tide', e); } };
  G.FSTORY = { TIDE, tidePh, sky };
})();
