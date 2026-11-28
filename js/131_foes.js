/* ==========================================================================
 * 神諭之地 重製版 — 131_foes.js
 * Version : r3.214.0  (2026-11-28)　r3.214.0：遠程單發出手放慢
 * 舊版    : r3.200.0  (2026-11-28)　r3.200.0：遠程敵人的箭放大並拖手繪光痕
 * 舊版    : r3.199.0  (2026-11-28)　r3.199.0：遠程敵人的箭改手繪箭矢
 * 舊版    : r3.168.0  (2026-11-27)　r3.168.0：畫面下方詞綴列停用（改畫在上方精英血條旁）
 * 舊版    : r3.146.0  (2026-11-27)　r3.146.0：韌性條、等級屬性標籤跟著頭目血條移到上方
 * 舊版    : r3.108.0  (2026-11-26)　r3.108.0：initAff 可加額外詞綴並對外公開（136 封印精英用）
 * 舊版    : r3.105.0  (2026-11-26)　r3.105.0：第 9 步剩餘——遠程妖怪保持距離射箭（太近後退）；困難以上自然出怪提高遠程／突擊比例（10／20／30％）；
 *           普攻每秒傷害依武器實測校正（WF）；修正一般妖怪近戰不經 hurtHero，詛咒／吸血詞綴沒作用
 * 舊版    : r3.104.2  (2026-11-26)　r3.104.2：護盾改用 132 護罩（半透明柔邊罩體＋氣流＋受擊漣漪，破盾碎裂飛散），不再換氣焰顏色
 * 舊版    : r3.104.1  (2026-11-26)　r3.104.1：詞綴改畫在畫面下方精英血條上面（圖示＋名稱，護盾顯示剩餘值與血條上緣藍線）；護盾改用氣焰藍色（素材），拿掉程式橢圓；
 *           修正護盾破掉後立刻再生（改成破盾後 10 秒）、致命一擊不先扣盾；破盾時碎冰片＋格擋素材
 * 舊版    : r3.104.0  (2026-11-26)
 * 變更    : r3.104.0 新增。平衡第 9 步：武器類型、傷害相剋、妖怪類型與屬性、精英詞綴、頭目分級與韌性條。
 *           ・武器：傷害類型（斬／突／打／射）＋破甲（防禦無視%）。打刀 0、野太刀 20、金棒 25、斧 15、薙刀 10、槍 15、鎖鎌 5、錫杖 0、和弓 0、鐵砲 40。
 *           ・妖怪 7 類（群聚／雜兵／突擊／重甲／遠程／術士靈體／巨體）：血、防、速度、擊退抗性不同；傷害類型相剋 ±25%（表 TY）。
 *             突擊類：距離 1.5～4 個身高時會衝刺（4 秒一次）。
 *           ・屬性：妖怪與頭目各有主屬性（火冰雷風聖冥或無）。元素勾玉的屬性傷害依相剋：火↔冰、雷↔風、聖↔冥 對立＝×1.5；同屬性＝×0.5（天命抗魔 10 級 ×0.6）。
 *           ・精英詞綴 9 種（迅捷／鐵壁／狂暴／護盾／分裂／吸血／詛咒／元素／召喚），數量依難度 0／0／1／2／3；天命破陣 10 級：詞綴效果 −30%。
 *             精英頭上顯示詞綴圖示（130_icons）。
 *           ・頭目 4 級：中頭目（mb_）、章節（血量總和 10→18 倍基準，第 1～12 章遞增）、副本（D_ 地圖）、隱藏（h_／t_）。
 *           ・韌性條（頭目血條下方金色細條）：命中扣韌性（打擊、鐵砲、野太刀較多；大招 ×1.5；天命斬妖 10 級 ×1.2）；歸零＝破韌倒地 2 秒＋破綻 2.5 秒，
 *             之後韌性上限 ×1.25；5 秒沒被打開始回復。破韌倒地不受控制縮短影響（122_bal e._ccRaw）。
 *           ・效能：類型／詞綴只在生成時決定一次；每格只處理有詞綴的精英（清單 AF）；韌性只在命中時計算。
 * 依賴    : 03_actors（spawnOni／oniStep／damageOni／hurtHero／DZ）、13_weapons（W.curId）、26_boss（start／enc）、73_diff（GDIFF）、
 *           122_bal（ccWrap e._ccRaw）、126_peak（PEAK.fl）、129_magatama（elK 呼叫端）、130_icons（ICO）。
 * ========================================================================== */
'use strict';
(function () {
  const H = G.H, SC = G.SC, HH = () => G.HERO_H, S = y => SC.depth(y), W = G.WPN, B = G.BOSS, rnd = (a, b) => a + Math.random() * (b - a), pick = a => a[Math.floor(Math.random() * a.length)];
  const fate = id => (G.PEAK && G.PEAK.fl ? G.PEAK.fl(id) : 0), gi = () => (G.GDIFF && G.GDIFF.i ? G.GDIFF.i() : 1);
  /* ---------- 武器 ---------- */
  const WP = { katana: ['斬', 0], nodachi: ['斬', 20], kanabo: ['打', 25], ono: ['斬', 15], naginata: ['斬', 10], yari: ['突', 15], kusarigama: ['斬', 5], staff: ['打', 0], yumi: ['突', 0], teppo: ['射', 40] };
  /* r3.105.0：普攻每秒傷害校正（實測：打刀 90、野太刀 47、薙刀 76、槍 82、和弓 57、鐵砲 36；目標比例 100／108／96／99／95／108；校正後實測約 100／106／96／98／94／104） */
  const WF = { nodachi: 2.15, naginata: 1.15, yari: 1.1, yumi: 1.55, teppo: 2.75 };
  const BRK = { '打': 1.5, '射': 1.3, '斬': 1, '突': 1 }, wid = () => (W && W.curId ? W.curId() : 'katana'), wp = () => WP[wid()] || WP.katana;
  /* ---------- 妖怪類型 ---------- */
  /* [名, 血, 防, 速, 擊退倍率] */
  const CLS = { swarm: ['群聚', 0.6, 0.5, 1.1, 1.3], grunt: ['雜兵', 1, 1, 1, 1], assault: ['突擊', 0.9, 0.9, 1.15, 1], armor: ['重甲', 1.3, 2, 0.9, 0.5],
    ranged: ['遠程', 0.8, 0.8, 1, 1.1], spirit: ['術士靈體', 0.9, 0.6, 1, 0.9], giant: ['巨體', 1.6, 1.4, 0.85, 0.15] };
  /* 傷害類型相剋（+＝對該類多 25%，−＝少 25%） */
  const TY = { swarm: { '斬': 1.25, '突': 0.75 }, grunt: {}, assault: { '突': 1.25, '打': 0.75 }, armor: { '打': 1.25, '射': 1.25, '斬': 0.75 },
    ranged: { '突': 1.25, '射': 1.25 }, spirit: { '斬': 0.75, '打': 0.75, '射': 0.75 }, giant: { '突': 1.25, '射': 1.25, '斬': 0.75 } };
  const LST = {
    swarm: 'chochin akachochin onichochin kitsunebi kogumo kodama gaki itsumade enemy_karasu karasugun shirokarasu skel ittan karakasa kinkasa bamboo',
    assault: 'ninja kunoichi akashinobi kageshinobi kagemusha enemy_raiju muraiju inugami hihi kasha nue wani tengu aotengu kintengu kengo bushi nekomata',
    armor: 'doma_shield_soldier doma_spear_soldier sohei taisho murataisho yaribushi yariron akazonae tetsuzo komaishi ushioni bandit_leader skelred kurooni aooni kioni midorioni shirooni yoioni',
    ranged: 'bandit_archer ashiyumi ashigun doma_archer kageyumi skelgun yomigun',
    spirit: 'onryo aoonryo chionryo doma_ritualist kuroonmyo onimiko kagemiko shikigami yukionna jorogumo hannya akahannya kijo amanojaku gensaku yokyubi fushiikazuchi hoikazuchi kuroikazuchi naruikazuchi oikazuchi sakuikazuchi tsuchiikazuchi wakaikazuchi yamauba',
    giant: 'umibozu oumibozu nurikabe wanyudo mizuchi kanakuma hoshikuma torakuma kumadoji' };
  const ELS = { fire: 'akachochin onichochin kitsunebi yokyubi kasha akaoni akahannya akazonae wanyudo kijo', ice: 'aokappa akakappa isoonna umibozu oumibozu mizuchi wani enemy_ningyo yukionna aooni',
    thunder: 'enemy_raiju muraiju nue kioni fushiikazuchi hoikazuchi kuroikazuchi naruikazuchi oikazuchi sakuikazuchi tsuchiikazuchi wakaikazuchi', wind: 'tengu aotengu kintengu karasugun enemy_karasu shirokarasu itsumade ittan midorioni',
    holy: 'shirooni komaishi shikigami onimiko kodama', dark: 'onryo aoonryo chionryo gaki skel skelred skelgun yomigun shikome fuhai kurooni jorogumo kogumo kumohei kuroonmyo doma_ritualist kagemiko hannya yamauba rokuro amanojaku' };
  const CL = {}, EL = {}; for (const c in LST) for (const t of LST[c].split(' ')) CL[t] = c; for (const k in ELS) for (const t of ELS[k].split(' ')) EL[t] = k;
  const BEL = { kama: 'wind', kappa: 'ice', kyubi: 'fire', raiju: 'thunder', oni: 'fire', orochi: 'dark', osakabe: 'dark', shuten: 'fire', tsuchigumo: 'dark', watatsumi: 'ice', izanami: 'dark', omagatsuhi: 'dark',
    ibaraki: 'fire', doma: 'dark', yoshitsune: 'wind', susanoo: 'thunder', seimei: 'holy', ezo: 'ice', gojo_benkei: '', takemikazuchi: 'thunder', owl: 'wind', yorimitsu: 'holy', enno: 'wind', katashiro: 'dark', chigaeshi: 'dark', komakin: 'holy', kinhannya: 'dark', akaorochi: 'fire' };
  const ELN = { fire: '火', ice: '冰', thunder: '雷', wind: '風', holy: '聖', dark: '冥' }, OPP = { fire: 'ice', ice: 'fire', thunder: 'wind', wind: 'thunder', holy: 'dark', dark: 'holy' };
  const aff = (k, el) => !el ? 1 : OPP[k] === el ? 1.5 : k === el ? (fate('antimagic') >= 10 ? 0.6 : 0.5) : 1;
  /* 元素勾玉：依身上各屬性勾玉顆數分配屬性傷害，再乘相剋（129 呼叫） */
  function elK(e, cnt) { let n = 0, s = 0; for (const k in ELN) { const c = (cnt && cnt[k]) || 0; n += c; s += c * aff(k, e && e.fel); } return n ? s / n : 1; }
  function initFoe(e) { if (!e || e._fc || e.bb || e.boss) return; const c = CLS[CL[e.type]] ? CL[e.type] : 'grunt', C = CLS[c]; e._fc = c; e.fel = EL[e.type] || '';
    if (C[1] !== 1) { e.hpMax = Math.max(1, Math.round(e.hpMax * C[1])); e.hp = Math.min(e.hpMax, Math.round(e.hp * C[1])); } e.def = (e.def || 0) * C[2]; e._csp = C[3]; e._kbk = C[4]; }
  /* r3.105.0：困難以上，自然出怪時提高遠程／突擊比例（只從本圖已載入的妖怪挑）：困難 10％、修羅 20％、無間 30％ */
  const MORE = [0, 0, 0.1, 0.2, 0.3];
  const sp0 = G.spawnOni; G.spawnOni = function (x, y, delay, lv, type) { if (!type && SC.def && Math.random() < (MORE[gi()] || 0)) { const L = (SC.def.foes || []).filter(t => (CL[t] === 'ranged' || CL[t] === 'assault') && G.enemyUnit(t)); if (L.length) arguments[4] = pick(L); }
    const e = sp0.apply(this, arguments); try { if (e && !e.train && !e.kz) initFoe(e); } catch (x) { console.warn('foe', x); } return e; };
  if (G.GDIFF && G.GDIFF.spOf) { const so0 = G.GDIFF.spOf; G.GDIFF.spOf = e => so0(e) * ((e && e._csp) || 1) * (e && e._dash > G.t ? 2.2 : 1); }
  /* ---------- 精英詞綴 ---------- */
  const AFX = { swift: '迅捷', iron: '鐵壁', berserk: '狂暴', shield: '護盾', split: '分裂', leech: '吸血', curse: '詛咒', element: '元素', summon: '召喚' }, AK = Object.keys(AFX);
  const NAF = [0, 0, 1, 2, 3], AF = [], FXE = { fire: 'fxp_ember_leaf', ice: 'fxp_ice_shard', thunder: 'fxp_rock_chip', wind: 'fxp_feather_jade', holy: 'fxp_talisman', dark: 'fxp_petal_spider' };
  const fk = () => (fate('breaker') >= 10 ? 0.7 : 1);
  function initAff(e, extra) { e._afi = 1; if (e._summ || e.bb || e.boss || e.kz) return; const n = Math.min(4, (NAF[gi()] || 0) + (extra || 0)); if (!n) return; /* r3.108.0：extra＝額外詞綴（封印精英） */ const L = AK.slice(), a = [];
    for (let i = 0; i < n && L.length; i++) a.push(L.splice(Math.floor(Math.random() * L.length), 1)[0]); e._af = a; const k = fk();
    if (a.includes('swift')) e._csp = (e._csp || 1) * (1 + 0.35 * k);
    if (a.includes('iron')) { e._dr = 0.25 * k; e._kbk = (e._kbk || 1) * 0.2; }
    if (a.includes('element') && !e.fel) e.fel = pick(Object.keys(ELN));
    e._nx = G.t + 240; e._shT = G.t + 60; AF.push(e); }   // 護盾等難度血量套完（1 秒後）再產生
  const has = (e, k) => e._af && e._af.includes(k);
  function near(e, r) { return Math.hypot(H.x - e.x, (H.y - e.y) * 1.6) < HH() * S(e.y) * r; }
  function affStep(e) { const k = fk(), t = G.t;
    if (has(e, 'berserk') && !e._bz && e.hp < e.hpMax * 0.5) { e._bz = 1; e.atk = Math.round(e.atk * (1 + 0.4 * k)); e._csp = (e._csp || 1) * (1 + 0.2 * k); pop(e, '狂暴', '#ff6a50'); }
    if (has(e, 'shield') && !(e._sh > 0) && t >= (e._shT || 0)) { e._sh = e._shM = Math.round(e.hpMax * 0.15 * k); e._shT = 1e12; e._shA = G.t; pop(e, '護盾', '#9fd8ff'); }   // r3.104.1：破盾後才開始算 10 秒
    if (has(e, 'leech') && e.hp < e.hpMax && t % 60 === 0) e.hp = Math.min(e.hpMax, e.hp + e.hpMax * 0.006 * k);
    if (t < e._nx) return; e._nx = t + 60;
    if (has(e, 'element') && (e._elT || 0) <= t && near(e, 2.2)) { e._elT = t + 420; G.hurtHero(e.atk * 0.9 * k, e.x); if (G.ICO) G.ICO.burst({ x: e.x, y: e.y }, FXE[e.fel] || 'fxp_rock_chip', 6, { z: 0.3 }); pop(e, ELN[e.fel] + '爆', '#ffd08a'); }
    if (has(e, 'summon') && (e._smT || 0) <= t) { e._smT = t + 720; const mine = G.E.filter(o => o._own === e && o.st !== 'dead' && o.hp > 0).length, n = Math.min(Math.round(2 * k), 4 - mine);
      const L = (SC.def.foes || []).filter(q => (CL[q] === 'swarm' || CL[q] === 'grunt') && G.enemyUnit(q)); const ty = L.length ? pick(L) : e.type;
      for (let i = 0; i < n; i++) { const x = e.x + rnd(-1, 1) * HH(), y = e.y + rnd(-0.4, 0.4) * HH(), p = SC.walkable(x, y) ? [x, y] : [e.x, e.y]; const o = G.spawnOni(p[0], p[1], 10, Math.max(1, (e.lv || 1) - 1), ty); if (o) { o._summ = 1; o._own = e; } }
      if (n > 0) pop(e, '召喚', '#d0a0ff'); } }
  const pop = (e, v, col) => G.NUMS.push({ x: e.x, y: e.y - HH() * S(e.y) * (e.ratio || 1) - 18, v, t: 0, col });
  /* 突擊類衝刺 */
  function dash(e) { if (e._fc !== 'assault' || e.st === 'atk' || (e._dashT || 0) > G.t) return; const d = Math.hypot(H.x - e.x, (H.y - e.y) * 1.6) / (HH() * S(e.y));
    if (d > 1.5 && d < 4) { e._dash = G.t + 30; e._dashT = G.t + 240; } }
  const os0 = G.oniStep; G.oniStep = function (e) { if (e && !e.bb && !e.boss) { if (!e._fc && !e.kz && !e.train) initFoe(e); if (e.elite && !e._afi) initAff(e); if (e._fc === 'assault' && G.t % 15 === 0) dash(e);
      if (e._fc === 'ranged' && !e.kz && ranged(e)) return; }
    const hp0 = H.hp, r = os0.apply(this, arguments); if (e && H.hp < hp0 && (e._af || G.t < curseT)) heroHit(e, hp0 - H.hp, true); return r; };
  /* ---------- r3.105.0：遠程妖怪——保持距離、射箭（6 個身高內接手，太近會後退） ---------- */
  const TK = 1000 / 60;
  function ranged(e) { if (e.st === 'dead' || e.st === 'hurt' || e.delay > 0 || e.stun > 0 || H.hp <= 0) return false; const s = S(e.y), k = HH() * s, dx = H.x - e.x, dy = H.y - e.y, d = Math.hypot(dx, dy * 1.6) / k;
    if (d > 6 && e.st !== 'atk') return false;
    e.t++; if (e.flash > 0) e.flash--; if (e.kb) { const nx = e.x + e.kb; if (SC.walkable(nx, e.y)) e.x = nx; e.kb *= 0.8; if (Math.abs(e.kb) < 0.2) e.kb = 0; } if (G.enemyDebStep) G.enemyDebStep(e);
    if (e.st === 'atk') { if (e.t * TK >= e.atkMs) { e.st = 'walk'; e.t = 0; } return true; }
    if (Math.abs(dx) > 4) e.face = Math.sign(dx); const sp = (e._csp || 1) * (e.db && e.db.slow ? 0.5 : 1);
    if (d < 2.4) { const nx = e.x - Math.sign(dx || 1) * 1.0 * sp; if (SC.walkable(nx, e.y)) e.x = nx; } else if (Math.abs(dy) > 10) { const ny = e.y + Math.sign(dy) * 0.5 * sp; if (SC.walkable(e.x, ny)) e.y = ny; }
    if (G.t >= (e._fireT || 0) && d > 1.2) { e._fireT = G.t + 150 + Math.random() * 90; e.st = 'atk'; e.t = 0; e.atkHit = true; e.atkMs = 900; e.atkMs = 1200; const tx = H.x, ty = H.y; G.STORY.later(38, () => {   /* r3.214.0：遠程單發從舉弓到放箭 0.43 → 0.63 秒 */ if (e.st !== 'dead' && e.hp > 0) shoot(e, tx, ty); }); }
    return true; }
  function shoot(e, tx, ty) { const VX = G.VX; if (!VX || !VX.custom) return; const s = S(e.y), k = HH() * s, gun = /gun/.test(e.type), z = 0.55 * k, ang = Math.atan2(ty - e.y, tx - e.x), sp = (gun ? 9 : 6) * Math.max(0.6, s), atk = e.atk * (gun ? 1 : 0.8);
    let x = e.x + e.face * 0.3 * k, y = e.y, dist = 0;
    VX.custom((q, c) => { if (!gun && G.AFX) { const lf = Math.cos(ang) < 0; const ag = lf ? Math.PI - ang : ang; G.AFX.fr('b_mb_ise', 'ise_yoshimori_arrow_trail', 1 + Math.floor(G.t / 4) % 2, x - Math.cos(ang) * k * 0.95, y - z - Math.sin(ang) * k * 0.95, { size: k * 1.9, by: 'w', ang: ag, flip: lf, a: 0.9 });   /* r3.200.0：箭後面拖一道手繪的光痕、箭放大，飛行中看得清楚 */ if (G.AFX.fr('fx_common', 'projectile_arrow_a', Math.floor(G.t / 4) % 4, x, y - z, { size: k * 1.2, by: 'w', ang: ag, flip: lf })) return; }   /* r3.199.0：遠程敵人的箭＝手繪箭矢 */ c.save(); c.translate(x, y - z); c.rotate(ang); if (VX.arrow2) VX.arrow2(c, k * (gun ? 0.3 : 0.62), '', false); c.restore(); }, 200, 'o',
      { step: q => { x += Math.cos(ang) * sp; y += Math.sin(ang) * sp * 0.6; dist += sp; if (Math.abs(H.x - x) < 0.25 * k && Math.abs(H.y - y) < 18) { const hp0 = H.hp; G.hurtHero(atk, e.x); if (e._af && H.hp < hp0) heroHit(e, hp0 - H.hp, true); q.t = q.life; } else if (dist > 9 * k) q.t = q.life; } }); }
  /* 每格：只跑有詞綴的精英 */
  (function hk() { if (!G.heroStep) return setTimeout(hk, 50); const hs0 = G.heroStep; G.heroStep = function () { const r = hs0.apply(this, arguments);
      for (let i = AF.length - 1; i >= 0; i--) { const e = AF[i]; if (e.st === 'dead' || !(e.hp > 0) || !G.E.includes(e)) { AF.splice(i, 1); continue; } try { affStep(e); } catch (x) { AF.splice(i, 1); } } return r; }; })();
  /* 分裂 */
  const R = G.RPG; const k0 = R.onKill; R.onKill = function (e) { const r = k0.apply(this, arguments); try { if (e && has(e, 'split') && !e._sp2) { e._sp2 = 1; for (let i = 0; i < 2; i++) { const o = G.spawnOni(e.x + (i ? 1 : -1) * HH() * 0.5, e.y, 6, e.lv || 1, e.type);
        if (o) { o._summ = 1; o.hpMax = o.hp = Math.max(1, Math.round(o.hpMax * 0.35 * fk())); o.ratio = (o.ratio || 1) * 0.8; } } pop(e, '分裂', '#ffd08a'); } } catch (x) {} return r; };
  /* 吸血／詛咒：受擊時找最近、正在出手的詞綴精英 */
  /* 吸血／詛咒：一般妖怪的近戰直接扣血（不經 hurtHero），所以在 oniStep 量血量差；頭目／其他經 hurtHero 的找最近、正在出手的詞綴精英 */
  let curseT = 0;
  function heroHit(src, dealt, direct) { if (!(dealt > 0)) return;
    if (direct && G.t < curseT) H.hp = Math.max(1, H.hp - Math.round(dealt * 0.15 * fk()));
    if (has(src, 'leech')) src.hp = Math.min(src.hpMax, src.hp + Math.max(dealt, src.hpMax * 0.02) * fk());
    if (has(src, 'curse')) { if (G.t >= curseT) G.UI.toast('受到詛咒：5 秒內受到的傷害提高'); curseT = G.t + 300; } }
  const hh0 = G.hurtHero; G.hurtHero = function (atk, srcX) { let src = null, bd = 1e9;
    if (AF.length) for (const e of AF) { if (e.st !== 'atk') continue; const d = Math.hypot(H.x - e.x, (H.y - e.y) * 1.6); if (d < bd && d < HH() * S(e.y) * 2.6) { bd = d; src = e; } }
    if (G.t < curseT) atk *= 1 + 0.15 * fk(); const hp0 = H.hp, r = hh0.call(this, atk, srcX), dealt = Math.max(0, hp0 - H.hp);
    if (src && dealt > 0 && src._fc !== 'ranged') heroHit(src, dealt, false); return r; };
  /* ---------- 頭目分級、韌性 ---------- */
  const TIER = ['中頭目', '章節頭目', '副本頭目', '隱藏頭目'];
  const bid = id => String(id || '').replace(/^(h_|t_|mb_)/, '');
  function tierOf(id, D) { if (/^mb_/.test(id)) return 0; if (/^(h_|t_)/.test(id)) return 3; if (D && D.map && /^D_/.test(D.map[0] || '')) return 2; return 1; }
  function chOf(id, D) { if (id === 'kama') return 1; if (id === 'gojo_benkei') return 7; const m = D && D.map && /R(\d\d)/.exec(D.map[0] || ''); return m ? Math.max(1, Math.min(12, +m[1])) : 0; }
  if (B && B.start) { const bs0 = B.start; B.start = function (id, o) { const enc = bs0.apply(this, arguments); try { if (!enc || !enc.units) return enc; const D = enc.D || {}, t = tierOf(id, D), c = chOf(id, D), n = enc.units.length;
        enc.tier = t; enc.ch = c; enc.fel = BEL[bid(id)] !== undefined ? BEL[bid(id)] : '';
        if (t === 1 && c && D.hpK) { const f = Math.max(0.75, Math.min(1.5, (10 + (c - 1) * 8 / 11) / (n * D.hpK))); for (const e of enc.units) { e.hpMax = Math.round(e.hpMax * f); e.hp = Math.round(e.hp * f); } }
        const tg = [80, 100 + 10 * c, 200, 260][t]; for (const e of enc.units) { e.fel = enc.fel; e._tgm = Math.round(tg / Math.sqrt(n)); e._tg = e._tgm; e._tgHit = 0; } } catch (x) { console.warn('boss tier', x); } return enc; }; }
  function tough(e, mult, big, pa) { if (!(e._tgm > 0) || e.st === 'dead' || G.t < (e._brkT || 0)) return; const d = 6 * Math.min(4, Math.max(0.3, mult || 1)) * (pa ? 0.5 : (BRK[wp()[0]] || 1) * (wid() === 'nodachi' ? 1.3 : 1)) * (big ? 1.5 : 1) * (fate('slayer') >= 10 ? 1.2 : 1);
    e._tg -= d; e._tgHit = G.t; if (e._tg > 0) return; e._tgm = Math.round(e._tgm * 1.25); e._tg = e._tgm; e._brkT = G.t + 120; e._ccRaw = 1; e.stun = Math.max(e.stun || 0, 120); e.open = Math.max(e.open || 0, 150);
    G.UI.banner('破韌！', (e.name || '頭目') + ' 倒地'); SC.shake = Math.max(SC.shake || 0, 8); if (G.ICO) G.ICO.burst({ x: e.x, y: e.y }, 'fxp_rock_chip', 8, { z: 0.2, k: 1.3 }); }
  /* 韌性回復：5 秒沒被打，每秒回 4% */
  (function hk2() { if (!G.heroStep) return setTimeout(hk2, 50); const hs0 = G.heroStep; G.heroStep = function () { const r = hs0.apply(this, arguments);
      if (G.t % 30 === 0 && B && B.enc && !B.enc.done) for (const e of B.enc.units) if (e._tgm > 0 && e._tg < e._tgm && G.t - (e._tgHit || 0) > 300) e._tg = Math.min(e._tgm, e._tg + e._tgm * 0.02); return r; }; })();
  /* ---------- 傷害：相剋、破甲、鐵壁、護盾、韌性、擊退抗性 ---------- */
  const dm0 = G.damageOni; G.damageOni = function (e, mult, big, fc, opt) { if (!e || e.st === 'dead' || (opt && (opt.party || opt.mg)) || G._bleedTick) { const r = dm0.apply(this, arguments); if (e && opt && opt.party && (e.bb || e.boss)) tough(e, mult, big, 1); return r; }
    /* r3.105.0：普攻（H.act.kind＝atk）乘 WF 每秒傷害校正 */
    const [ty, pen] = wp(); let m = mult * (H.act && H.act.kind === 'atk' ? (WF[wid()] || 1) : 1); const c = e._fc || (e.bb || e.boss ? (e.size >= 1.4 ? 'giant' : '') : ''); const tm = (c && TY[c] && TY[c][ty]) || 1; m *= tm; if (e._dr) m *= 1 - e._dr;
    if (pen) opt = Object.assign({}, opt || {}, { ign: Math.min(60, ((opt && opt.ign) || 0) + pen) });
    /* r3.104.1：護盾先吃傷害（暫時把護盾加到血量上再算，致命一擊也會先被盾擋） */
    const sh = e._sh > 0 ? e._sh : 0, hp0 = e.hp; if (sh) e.hp += sh; const r = dm0.call(this, e, m, big, fc, opt);
    if (sh) { e._shHit = { t: G.t, side: Math.sign(H.x - e.x) || 1 }; if (e.hp > hp0) { e._sh = e.hp - hp0; e.hp = hp0; } else shBreak(e); }
    if (e._kbk !== undefined && e.kb) e.kb *= e._kbk;
    if (e.bb || e.boss) tough(e, mult, big);
    return r; };
  /* 破盾：恢復原本氣焰顏色、碎冰片＋格擋素材、10 秒後再生 */
  /* 護罩尺寸：包住整個身體 */
  const dim = e => { const h = HH() * (e.ratio || 1) * S(e.y) * 1.05; return [h * 0.5, h * 0.62, e.y - (e.lift || 0) - h * 0.5]; };
  function shBreak(e) { e._sh = 0; e._shT = G.t + 600; pop(e, '破盾', '#9fd8ff'); const [rx, ry, cy] = dim(e); if (G.SHFX) G.SHFX.shatter(e.x, cy, rx, ry, '120,190,255'); SC.shake = Math.max(SC.shake || 0, 3); }
  /* 精英護罩（132_shieldfx）：畫在身體上面 */
  const dO = G.drawOni; G.drawOni = function (e) { const r = dO.apply(this, arguments); if (e && e._sh > 0 && e.st !== 'dead' && G.SHFX) { const [rx, ry, cy] = dim(e), a = Math.min(1, (G.t - (e._shA || 0)) / 14), h = e._shHit;
      G.SHFX.dome(G.ctx, e.x, cy, rx, ry, '110,185,255', '200,235,255', G.t + (e._pid || 0) * 37, a, h ? { age: G.t - h.t, side: h.side } : null); } return r; };
  /* ---------- 繪製：精英詞綴（下方血條上面）；頭目韌性條 ---------- */
  /* 精英血條（22_event 畫在畫面下方）上面：詞綴圖示＋名稱；護盾值畫在血條上緣 */
  const eui0 = G.UI.draw.bind(G.UI); G.UI.draw = function () { eui0(); if (G.HUD2 || G.mode !== 'play' || (B && B.enc && !B.enc.done)) return; const b = G.E.find(e => (e.boss || e.elite) && !e.bb && e.st !== 'dead' && e.delay <= 0); if (!b || !b._af) return;
    const c = G.ctx, w = Math.min(360, G.LW * 0.42), x = (G.LW - w) / 2, y = G.LH - 34 - G.SAFE.b, cy = y - 18 - 15; let cx = x - 8;
    c.font = `700 ${10 * G.FS()}px ${G.FONT}`;
    for (const k of b._af) { const t = AFX[k] + (k === 'shield' && b._sh > 0 ? ' ' + Math.round(b._sh) : ''), tw = c.measureText(t).width, cw = 24 + tw + 8;
      c.fillStyle = 'rgba(12,8,10,.72)'; G.rr(cx, cy - 12, cw, 24, 12); c.fill(); if (G.ICO) G.ICO.drawC('ico_elite_' + k, cx + 12, cy, 20);
      G.txt(t, cx + 24, cy + 1, 10, k === 'shield' && b._sh > 0 ? '#9fd8ff' : '#e3c27a', 'left', G.FONT, 700); cx += cw + 4; }
    if (b._sh > 0) { c.fillStyle = 'rgba(150,210,255,.95)'; c.fillRect(x, y - 2, w * Math.min(1, b._sh / b.hpMax), 3); } };
  const ui0 = G.UI.draw.bind(G.UI); G.UI.draw = function () { ui0(); const enc = B && B.enc; if (!enc || enc.done || G.mode !== 'play' || !enc.units) return; const c = G.ctx;
    const w = Math.min(380, G.LW * 0.42), x = (G.LW - w) / 2, y = G.SAFE.t + 58 * G.FS(), n = enc.units.length,   /* r3.146.0：跟著頭目血條移到上方 */ gap = 6, sw = (w - gap * (n - 1)) / n;
    enc.units.forEach((e, i) => { if (!(e._tgm > 0) || e.st === 'dead') return; const sx = x + i * (sw + gap); c.fillStyle = 'rgba(10,6,6,.8)'; c.fillRect(sx - 1, y + 6, sw + 2, 4); c.fillStyle = G.t < (e._brkT || 0) ? '#fff2b0' : '#e3b84a'; c.fillRect(sx, y + 7, sw * Math.max(0, e._tg) / e._tgm, 2); });
    const tl = TIER[enc.tier] || '', ic = enc.fel && G.ICO && G.ICO.drawC('ico_el_' + enc.fel, x + 7, y - 10 * G.FS(), 15) ? 17 : 0; if (tl) G.txt(tl + (enc.fel ? '・' + ELN[enc.fel] : ''), x + ic, y - 10 * G.FS(), 10, '#cdbfa6', 'left'); };
  G.FOES = { WP, CLS, TY, CL, EL, AFX, AF, TIER, ELN, aff, elK, initFoe, initAff, tierOf, classOf: t => CL[t] || 'grunt' };
})();
