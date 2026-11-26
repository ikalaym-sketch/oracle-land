/* ==========================================================================
 * 神諭之地 重製版 — 122_bal.js
 * Version : r3.104.0  (2026-11-26)　r3.104.0：破韌倒地（e._ccRaw）不受控制縮短
 * 舊版    : r3.96.0  (2026-11-26)　r3.96.0：無間吸血上限每秒 2.5%
 * 舊版    : r3.95.0  (2026-11-26)　r3.95.0：修羅以上頭目 10 秒沒被攻擊，每秒回 3% 生命（綠字顯示）
 * 舊版    : r3.94.0  (2026-11-26)　r3.94.0：破綻追擊改增傷區；最外層清 G.DZ 登記；控制縮短與遞減（頭目／精英 e.stun 依難度縮短，10 秒內第 2 次減半、第 3 次免疫 3 秒）
 * 舊版    : r3.93.0  (2026-11-26)
 * 變更    : r3.93.0 新增。平衡第 1 步＋進階修煉補完。
 *           ・倒下規則（03_actors 呼叫 G.heroDown）：
 *             修練「復甦」Lv1 以上＝每場戰鬥原地站起 1 次（生命 20%＋10%×等級；Lv5 另有 3 秒無敵＋震退）。
 *             沒有可用的站起＝小雪把你救回神社（生命全滿、沒有損失），頭目戰中斷，抵達後小雪關心對話。
 *             戰鬥計算：場上沒有活著的敵人、也沒有頭目戰，持續 5 秒＝離開戰鬥，站起次數重算；換地圖也重算。
 *             合戰、單挑照舊（由各自模組判輸）。
 *           ・吸血上限：每秒最多回復最大生命 4%；打頭目的吸血減半。
 *           ・閃避反擊（counter）：閃身／瞬步無敵中被攻擊＝完美閃避，自動反擊 100%＋25%×等級（冷卻 0.5 秒）；
 *             Lv5 反擊附帶暈眩 1 秒（頭目 0.5 秒）。
 *           ・破綻追擊（breach，取代切換斬）：對暈眩、破綻、昏眩中的敵人傷害 +6%×等級；Lv5 必定會心。
 *             舊存檔的切換斬點數自動轉到破綻追擊。
 * 依賴    : 03_actors（G.heroDown 掛點、oniStep、damageOni）、16_growth（GR.st、修練表）、26_boss（G.BOSS）、
 *           93_kassen（G.KASSEN.on）、94_gojo（G.DUEL.on）、05_dialog（G.DLG）。
 * ========================================================================== */
'use strict';
(function () {
  const H = G.H, SC = G.SC;
  const tr = () => { const d = G.RPG && G.RPG.d && G.RPG.d(); if (!d) return {}; d.train = d.train || {}; return d.train; };
  const lv = id => tr()[id] || 0;
  const st = { revUsed: false, calmT: 0, scene: null, rescue: 0, lsBud: 0, ctrCd: 0 };
  G.BAL = st;

  /* ---------- 舊存檔：切換斬 → 破綻追擊 ---------- */
  function migrate() { const t = tr(); if (t.switch) { t.breach = Math.min(5, (t.breach || 0) + t.switch); delete t.switch; G.SAVE.markDirty(); if (G.RPG.recalc) G.RPG.recalc(); } }

  /* ---------- 倒下 ---------- */
  const XUE = [
    [{ who: '小雪', text: '……醒了？你倒在路上，我和狐火把你背回來的。' }, { who: '小雪', text: '傷口都處理好了。下次撐不住就先退，別逞強。' }],
    [{ who: '小雪', text: '別急著起來，再躺一下。' }, { who: '小雪', text: '妖氣還纏在你身上……我替你淨過了。準備好再出發吧。' }],
    [{ who: '小雪', text: '你回來了──雖然是被抬回來的。' }, { who: '小雪', text: '藥和護符都備齊了嗎？我在神社等你。' }]];
  const BOSS_XUE = { who: '小雪', text: '那個對手還在原地等著。整理好裝備、想好對策，再去一次吧。' };
  function abortBoss() { const B = G.BOSS; if (!B || !B.enc) return false; const enc = B.enc; enc.done = true;
    G.E = G.E.filter(e => !enc.units.includes(e)); B.enc = null; ['fx', 'tg', 'zones', 'proj'].forEach(k => { if (B[k]) B[k].length = 0; }); return true; }
  G.heroDown = function () {
    if ((G.KASSEN && G.KASSEN.on) || (G.DUEL && G.DUEL.on)) return false;           // 合戰、單挑：照舊判輸
    if (st.rescue) { H.hp = H.hpMax; return true; }
    const L = lv('revive');
    st.calmT = 0;
    if (L > 0 && !st.revUsed) { st.revUsed = true; H.hp = Math.round(H.hpMax * (0.1 + 0.1 * L)); H.inv = Math.max(H.inv, L >= 5 ? 180 : 90);
      if (L >= 5) for (const e of G.E) if (e.st !== 'dead' && Math.hypot(e.x - H.x, e.y - H.y) < 200) e.kb = Math.sign(e.x - H.x || 1) * 12;
      G.UI.banner('復甦', '本場戰鬥的站起已用掉'); return true; }
    const boss = abortBoss(); H.hp = H.hpMax; H.inv = 240; H.act = null; H.st = 'idle';
    st.rescue = boss ? 2 : 1; G.UI.banner('倒下了……', '小雪趕來把你帶回神社');
    G.SC.trans = { t: 0, to: 'hub_shrine', at: null }; return true; };

  /* ---------- 每格：戰鬥判定、抵達對話、吸血額度、反擊冷卻 ---------- */
  const hs0 = G.heroStep; G.heroStep = function () {
    if (st.scene !== SC.id) { st.scene = SC.id; st.revUsed = false; st.calmT = 0; try { migrate(); } catch (x) { console.warn('bal migrate', x); } }   // 先判換圖，再跑本格（倒下在 hs0 內處理）
    hs0.apply(this, arguments);
    const fight = (G.BOSS && G.BOSS.enc && !G.BOSS.enc.done) || G.E.some(e => e.st !== 'dead' && e.hp > 0 && !(e.delay > 0));
    if (fight) st.calmT = 0; else if (++st.calmT === 300) st.revUsed = false;   // 離開戰鬥那一刻才重算
    const cap = H.hpMax * (di() >= 4 ? 0.025 : 0.04); st.lsBud = Math.min(cap, st.lsBud + cap / 60);
    if (st.ctrCd > 0) st.ctrCd--;
    bossRegen();
    if (st.rescue && SC.id === 'hub_shrine' && !SC.trans && G.mode === 'play' && !G.DLG.active()) {
      const list = XUE[Math.floor(Math.random() * XUE.length)].slice(); if (st.rescue === 2) list.push(BOSS_XUE); st.rescue = 0; H.hp = H.hpMax; G.DLG.start(list); } };

  /* ---------- 傷害：破綻追擊＋吸血上限 ---------- */
  const weak = e => e.stun > 0 || e.open > 0 || !!e.dizzy;
  let depth = 0;
  const dm0 = G.damageOni; G.damageOni = function (e, mult, big, fc, opt) {
    if (!e || e.st === 'dead') { if (!depth) G.DZ.reset(); return dm0.apply(this, arguments); }
    const party = opt && opt.party, B = lv('breach');
    if (!party && B && weak(e)) { G.DZ.add(0.06 * B); if (B >= 5) fc = true; }   // r3.94.0：增傷區
    const h0 = H.hp, eh0 = e.hp; depth++; let r; try { r = dm0.call(this, e, mult, big, fc, opt); } finally { if (--depth === 0) G.DZ.reset(); }   // 最外層結束：清掉沒被用到的登記
    if (e.hp < eh0) e._hitT = G.t;   // 頭目回血計時
    const gain = H.hp - h0;
    if (gain > 0 && h0 > 0) { const want = gain * (e.boss || e.bb ? 0.5 : 1), ok = Math.min(want, st.lsBud); st.lsBud -= ok; H.hp = Math.min(H.hpMax, h0 + ok); }
    return r; };

  /* ---------- 修羅以上：頭目回血（r3.95.0） ----------
     頭目（bb／boss）10 秒沒受到傷害 → 每秒回 3% 最大生命；被打就重新計時。 */
  function bossRegen() { if (di() < 3 || !(G.t % 60 === 0)) return; const t = G.t;
    for (const e of G.E) { if (!(e.bb || e.boss) || e.doll || e.st === 'dead' || !(e.hp > 0) || e.hp >= e.hpMax) continue;
      if (e._hitT === undefined) { e._hitT = t; continue; } if (t - e._hitT < 600) continue;
      const v = Math.min(e.hpMax - e.hp, Math.round(e.hpMax * 0.03)); e.hp += v;
      G.NUMS.push({ x: e.x, y: e.y - G.HERO_H * (e.size || e.ratio || 1) * SC.depth(e.y) - 6, v: '+' + v, heal: true, t: 0 }); } }
  /* ---------- 控制縮短與遞減（r3.94.0） ----------
     頭目／精英被暈眩、冰凍、定身（都寫在 e.stun）：時間依難度縮短；10 秒內同一隻第 2 次減半、第 3 次起免疫 3 秒。 */
  const CC_B = [0.15, 0.3, 0.45, 0.6, 0.75], CC_E = [0, 0.15, 0.25, 0.35, 0.45];
  const di = () => Math.max(0, Math.min(4, (G.GDIFF && G.GDIFF.i && G.GDIFF.i()) || 0));
  function ccWrap(e) { if (!e || e._ccw) return e; let v = e.stun || 0; e._ccw = 1;
    Object.defineProperty(e, 'stun', { configurable: true, enumerable: true, get: () => v,
      set(n) { n = +n || 0; if (e._ccRaw) { e._ccRaw = 0; v = n; return; }   // r3.104.0：破韌倒地不縮短（131_foes）
        if (n <= v + 1) { v = n; return; }   // 遞減／不變：照常
        const boss = e.bb || e.boss, elite = e.elite; if (!boss && !elite) { v = n; return; }
        const t = G.t || 0; if ((e._ccImm || 0) > t) return;
        const c = e._cc && t - e._cc.t < 600 ? e._cc : (e._cc = { n: 0, t }); c.n++; c.t = t;
        if (c.n >= 3) { e._ccImm = t + 180; e._cc = null; return; }
        let k = 1 - (boss ? CC_B : CC_E)[di()]; if (c.n === 2) k *= 0.5;
        v = Math.max(v, Math.round(v + (n - v) * k)); } });
    return e; }
  const sp0 = G.spawnOni; G.spawnOni = function () { return ccWrap(sp0.apply(this, arguments)); };
  (function hookBoss() { const B = G.BOSS; if (!B || !B.start) return setTimeout(hookBoss, 50); if (B.start._cc) return;
    const s0 = B.start; B.start = function () { const enc = s0.apply(this, arguments); if (enc && enc.units) enc.units.forEach(ccWrap); return enc; }; B.start._cc = 1; })();
  G.BAL.ccWrap = ccWrap;

  /* ---------- 閃避反擊 ---------- */
  const dodging = () => H.inv > 0 && H.act && /dodge|dash/.test(H.act.kind);
  function counter(e) { const L = lv('counter'); if (!L || !e || e.st === 'dead' || st.ctrCd > 0) return; st.ctrCd = 30;
    G.damageOni(e, 1 + 0.25 * L, true); if (L >= 5 && e.st !== 'dead') e.stun = Math.max(e.stun || 0, e.bb || e.boss ? 30 : 60);
    G.NUMS && G.NUMS.push({ x: H.x, y: H.y - G.HERO_H * SC.depth(H.y) - 18, v: '反擊', gold: true, t: 0 }); G.hitstop = Math.max(G.hitstop || 0, 4); }
  const os0 = G.oniStep; G.oniStep = function (e) { const was = e.st === 'atk' && !e.atkHit; os0(e);
    if (!was || e.bb || !e.atkHit || !dodging()) return;
    const rr = e.ratio / 1.38, reach = Math.max(54, 104 * Math.min(rr, 1.05)) + (G.bodyX ? G.bodyX(e) : 0), rx = (H.x - e.x) * e.face;
    if (rx > -10 && rx < reach && Math.abs(H.y - e.y) < 30) counter(e); };
  if (G.hurtHero) { const hh0 = G.hurtHero; G.hurtHero = function (atk, srcX) { if (dodging()) { let b = null, bd = 1e9;
      for (const e of G.E) { if (e.st === 'dead' || e.hp <= 0) continue; const dd = Math.abs(e.x - (srcX !== undefined ? srcX : H.x)) + Math.abs(e.y - H.y); if (dd < bd) { bd = dd; b = e; } }
      if (b && Math.hypot(b.x - H.x, b.y - H.y) < G.HERO_H * 4) counter(b); }
    return hh0.apply(this, arguments); }; }

  (function wait() { if (!G.SAVE || !G.SAVE.data || !G.RPG || !G.RPG.d) return setTimeout(wait, 50); try { migrate(); } catch (x) { console.warn('bal migrate', x); } })();
})();
