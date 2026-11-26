/* ==========================================================================
 * 神諭之地 重製版 — 145_leon.js
 * Version : r3.128.2  (2026-11-27)　r3.128.2：落下系晶術改成從約 2.6 身高處加速落下、落地才判定＋震動；擊飛的敵人在招式期間維持浮空、收招後暈 0.75 秒
 * 舊版    : r3.128.0  (2026-11-27)　r3.128.0：逐招修正（跳躍 ×1.6、飛燕連腳前進 ×1.8、雙牙劍氣 ×1.6、追刺地槍翻轉、落下系晶術加高縮小、投槍跳起、粉塵爆發、魔人闇加大停留、剎牙交叉、千裂虛光閃／翔破裂光閃擊飛、魔人千裂衝／魔神煉獄殺頂著打、義憐聖靈斬上移、英文秘奧義放大／以目標為中心／全畫面）；秘奧義加名稱與畫面壓暗
 * 舊版    : r3.127.4  (2026-11-27)　r3.127.4：身體上下位移照原版（正＝往下、負＝往上），飛連斬／飛連雙閃等也有跳起
 * 舊版    : r3.127.3  (2026-11-27)　r3.127.3：跳躍招式真的跳起（H.hop 在繪製時套用）；魔神煉獄殺闇氣圈以身體為中心；負向之門／邪惡領域／黑洞持續吸怪（約 3 身高，極意 4）
 * 舊版    : r3.127.2  (2026-11-27)　r3.127.2：身法改用目前武器（不借打刀），各武器專屬身法照常；分身殘影畫成里歐
 * 舊版    : r3.126.1  (2026-11-27)　r3.126.1：刀光只放大圖不移位置、倍率 1.6→1.3；出招被擋住時特效跟著實際身體位置
 * 舊版    : r3.126.0  (2026-11-27)　r3.126.0：武器 › 技能／按鍵 改成與武器相同的版面（按鍵頁：左邊戰鬥按鍵配置、右邊分段選招；技能頁：分類清單＋說明＋升級／設鍵）；職業頁面板拿掉底部按鍵列
 * 舊版    : r3.125.1  (2026-11-26)　r3.125.1：修正：招式清單不能捲動（被職業頁捲動區搶走）；修正：施放資料「目標高度／招式類型」同名互蓋（沒敵人時晶術特效不出現、有敵人時晶術極意失效）；
 *           晶術：特效與判定 ×1.6、動畫 ×1.25 倍速、放完第一段 0.35 秒後在目標附近再放一次（傷害加倍）；
 *           黑火殘留（淨破滅燒闇／魔人滅殺闇／真神煉獄剎／魔神煉獄殺）：收招後黑火留 3 秒，每 0.5 秒燒總傷害 8%；開里歐外觀時 武器 › 技能／按鍵 改顯示里歐面板
 * 舊版    : r3.124.0  (2026-11-26)　r3.124.0：招式表照原版更正（名稱／類型／說明／段數）；冷卻改 TP（上限 100，特技 6・晶術 10・奧義 14，秘奧義用「氣」100）；
 *           按鍵比照主角（招 1～3＝特技／奧義、技 A／B＝晶術、奧義鍵＝秘奧義、身法沿用主角）；連招：最後一下打中後到收招前再按同鍵＝切下一招；
 *           普攻改用打刀判定與刀光（動作仍是里歐）；身體逐格平滑縮放、左右鏡像；雙牙補兩道劍氣；待機切換加遲滯；入口移到 角色 › 職業 清單最下面。
 * 舊版    : r3.123.0  (2026-11-26)　r3.123.0：里歐完整版：晶術 26、奧義 12、秘奧義 9 開放（共 60 招）；晶術＝詠唱後在目標位置施放，治癒／聖光改為全隊回復；極意：特技多 1 段、晶術範圍 +50%＋暈眩、奧義結束追加爆發 200%、秘奧義演出中無敵＋傷害 ×1.5；命中不再畫圓圈
 * 舊版    : r3.122.1  (2026-11-26)　r3.122.1：里歐頁面移到 角色 › 職業 旁邊（不放武器）
 * 舊版    : r3.122.0  (2026-11-26)　r3.122.0：測試選單用：flags.leonOpen 也算解鎖；G.LEON.open(代號)
 * 舊版    : r3.121.1  (2026-11-26)　r3.121.1：身高對齊主角：依目前武器待機圖的顯示高度換算（原本約大 15%，招式特效與判定範圍一起縮）
 * 舊版    : r3.121.0  (2026-11-26)
 * 變更    : r3.121.0 新增。里歐外觀（第一版：特技 13 招）。
 *           ・解鎖：任一難度通關一次（第二輪起一直開放）。選單 › 角色 › 里歐：切換外觀、升級、裝鍵。
 *           ・大小統一：素材每組動作的縮放（render_target_factor）還原成同一個世界單位，以待機身高為基準（refH），
 *             每組固定倍率、腳底錨點對齊；不逐格縮放。
 *           ・招式：照素材時間軸（source_timeline）逐格播放身體與特效；位置三種：
 *             0＝出手點相對座標（跟著角色位移），1＝角色腳下，2＝目標位置（晶術型），3＝前進劍氣（魔神劍）。
 *             判定：每個特效第一格出現時對範圍內敵人造成一次傷害；總倍率＝（倍率＋每級加成×(Lv−1)）×DMGK，平均分給每段。
 *           ・外觀等級 1～100（打怪經驗同步累積），每級 2 點；招式依外觀等級解鎖，學會 1 點、升級 Lv→Lv+1 花 Lv 點，Lv5＝極意（多 1 段）。
 *           ・招式鍵 1～3：每鍵最多 3 招，連按依序出（同武器招式鍵）；按鍵列固定在頁面底部。
 * 依賴    : 03_actors（heroStep／drawHero／tryMove）、12_anim（ANIM.load／draw）、13_weapons（chain／chainCd）、04_ui（招式鍵）、
 *           08_menu／17_menu2（M.PAGE／GROUPS）、19_ui8（drawIcon）、07_rpg（gainExp）。
 * 素材    : a/p/lv_all.json＝各單位資料（lv_base 基本動作＋招式表 meta、lv_ui 60 個招式圖示、lv_<代號> 招式：b 身體格、x 特效格、tl 時間軸）＋分頁包索引；
 *           分頁圖合併在 pk/lv_base_*.wasm、pk/lv_tk_*.wasm（特技），第一次用到才下載。
 * ========================================================================== */
'use strict';
(function () {
  const ctx = G.ctx, H = G.H, SC = G.SC, A = G.ANIM, TK = 1000 / 60, M = G.MENU, W = G.WPN;
  if (!M || !M.PAGE || !W) return;
  const CATS = ['特技', '晶術', '奧義', '秘奧義'], OPEN = { '特技': 1, '晶術': 1, '奧義': 1, '秘奧義': 1 }, DMGK = 2, CAP = 100, TPMAX = 100; let SLK = 1.3;   /* SLK：近戰刀光（模式 0 特效）只放大圖本身、位置照原版（r3.126.1：1.6 倍連位置一起放大會讓刀氣飄到頭頂、闇氣跑到前面） */
  const F = () => G.SAVE.data.flags || {};
  let clT = -1e9, clV = false;   /* 通關判定每 2 秒才重算一次（避免每幀掃旗標） */
  const cleared = () => { if (Math.abs(G.t - clT) < 120) return clV; clT = G.t; const f = F(); return (clV = !!f.gameClear || Object.keys(f).some(k => /^clear_/.test(k) && f[k])); };
  const unlocked = () => cleared() || !!F().leonOpen || !!(G.CHEAT && G.CHEAT.on.unlock);
  const SAV = () => { const s = G.SAVE.data; if (!s.leon) s.leon = { on: 0, lv: 1, exp: 0, pt: 2, sk: { majinken: 1 }, keys: [['majinken', null, null], [null, null, null], [null, null, null]] }; const d = s.leon;
    if (!d.sp) d.sp = [null, null]; if (d.ult === undefined) d.ult = null; if (!(d.tp >= 0)) d.tp = TPMAX; return d; };
  /* 舊存檔：招式鍵只留特技／奧義；晶術移到技 A／B，秘奧義移到奧義鍵 */
  function fixKeys() { const d = SAV(); for (const ch of d.keys) for (let j = 0; j < 3; j++) { const c = ch[j]; if (!c) continue; const t = META[c] ? META[c][2] : null;
      if (t === '特技' || t === '奧義') continue; ch[j] = null; if (t === '晶術' && !d.sp.includes(c)) { const k = d.sp.indexOf(null); if (k >= 0) d.sp[k] = c; } else if (t === '秘奧義' && !d.ult) d.ult = c; }
    for (const ch of d.keys) { const v = ch.filter(Boolean); ch.length = 0; ch.push(...v, null, null, null); ch.length = 3; } }
  let META = null, REFH = 156, UIU = null, CUR = null, BUF = null, CASTS = [], KAT = 0;
  /* 普攻改用打刀：KAT>0 期間 W.curId() 回傳 katana（只在主角步進／繪製時套用，選單與裝備不受影響） */
  const asKat = f => { KAT++; try { return f(); } finally { KAT--; } };
  const ci0 = W.curId; W.curId = function () { return KAT > 0 && A.get('w_katana') ? 'katana' : ci0.apply(this, arguments); };
  const need = lv => Math.round(40 * Math.pow(lv, 1.5) + 60);
  /* 素材：lv_all.json 一次取回全部單位資料＋分頁包索引（分頁圖在 pk/lv_*.wasm，第一次用到才下載該包） */
  let UNITS = null; const LD = k => UNITS && UNITS[k] ? A.load(k, UNITS[k]) : Promise.reject(new Error('lv ' + k));
  function boot() { if (boot.p) return boot.p;
    return (boot.p = fetch('a/p/lv_all.json?v=' + G.VER).then(r => { if (!r.ok) throw new Error('lv_all ' + r.status); return r.json(); })
      .then(j => G.PACK.ready.then(() => { Object.assign(G.PACK.idx, j.idx); UNITS = j.units; }))
      .then(() => Promise.all([LD('lv_base'), LD('lv_ui')])).then(([b, u]) => { META = b.meta; REFH = b.refH || 156; UIU = u; fixKeys(); preload(); })
      .catch(e => { boot.p = null; console.warn('leon', e); })); }
  const on = () => { const d = G.SAVE.data.leon; return !!(d && d.on && unlocked() && META && A.get('lv_base')); };
  const used = () => { const d = SAV(); return [].concat(...d.keys, d.sp, [d.ult]).filter(c => c && META[c]); };
  function preload() { for (const c of used()) { LD('lv_' + c).catch(() => {}); if (c === 'majinken_souga') LD('lv_majinken').catch(() => {}); } if (!A.get('w_katana')) A.useWeapon('katana').catch(() => {}); }
  /* ---------- TP：取代冷卻。上限 100；普攻命中 +3、被打 +1、沒出招每秒 +2（×「氣力獲得」）；消耗 ×（1－冷卻縮減）。秘奧義改用「氣」100 ---------- */
  const qiMul = () => 1 + ((G.GROW && G.GROW.A || {}).qiP || 0) / 100;
  const tpCost = c => Math.max(1, Math.round(META[c][7] * (1 - Math.min(40, (G.RPG.S && G.RPG.S.cdr) || 0) / 100)));
  const tpGain = v => { const d = SAV(); d.tp = Math.min(TPMAX, d.tp + v * qiMul()); };
  const freeTp = () => !!(G.CHEAT && G.CHEAT.on.nocd), fullQi = () => G.RPG.d().qi >= 100 || !!(G.CHEAT && G.CHEAT.on.qi);
  const tpOk = c => META[c][2] === '秘奧義' ? fullQi() : freeTp() || SAV().tp >= tpCost(c);
  function pay(c) { if (META[c][2] === '秘奧義') { if (!fullQi()) { G.UI.toast('「氣」尚未集滿'); return false; } G.RPG.d().qi = 0; return true; }
    if (freeTp()) return true; const d = SAV(), n = tpCost(c); if (d.tp < n) { G.UI.toast('TP 不足（' + META[c][1] + ' 需要 ' + n + '）'); return false; } d.tp -= n; return true; }
  /* r3.121.1：身高對齊主角（約 170 cm）——以目前武器待機圖「腳底到頭頂」的顯示高度為準，里歐待機同高（頭頂到腳底）。每把武器算一次 */
  /* r3.124.0：普攻改用打刀，身高一律以打刀待機圖為準（避免出招中／外切換武器基準時忽大忽小） */
  const HT = {}; function kOf(s) { const id = 'katana'; let r = HT[id];
    if (r === undefined) { const u = A.get('w_katana'), b = A.get('lv_base'); r = 0;
      if (u && b && u.act.idle) { const f = u.act.idle.f[0], lf = b.act.idle.f[0]; r = f[5] * (f[8] || 1) / (u.refH || 130) * (W.actK ? asKat(() => W.actK('idle')) : 1) / (lf[5] * lf[8]); }
      if (!(r > 0)) r = 0.85 / REFH; else HT[id] = r; }
    return G.HERO_H * s * r; }
  const typ = c => META[c][2], open = c => !!OPEN[typ(c)];

  /* ---------- 圖示 ---------- */
  function drawIc(c, x, y, s, al) { if (!UIU || !META || !META[c]) return false; const fr = UIU.ic[META[c][9]], im = fr && UIU.imgs[fr[7]]; if (!im) return false;
    ctx.save(); if (al !== undefined) ctx.globalAlpha = al; ctx.drawImage(im, fr[0], fr[1], fr[2], fr[3], x, y, s, s); ctx.restore(); return true; }
  const di0 = G.drawIcon; G.drawIcon = function (key, x, y, s, al) { if (typeof key === 'string' && key.startsWith('mv:lv:')) return drawIc(key.slice(6), x, y, s, al); return di0.apply(this, arguments); };

  /* ---------- 招式鍵：外觀開啟時，招式鍵 1～3 改成里歐招式（HUD 用同一套 chain／chainCd） ---------- */
  /* HUD 用：MV／SK 表補上 'lv:代號'（冷卻 0）；TP 不足＝按鍵變暗 */
  function ensureMV() { const wp = W.cur(); if (!wp || !wp.MV || !wp.SK) return; for (const c of used()) { const id = 'lv:' + c, t = META[c][2];
      if (t === '特技' || t === '奧義') { if (!wp.MV[id]) wp.MV[id] = { id, n: META[c][1], cd: 0, u: 0, k: 'skill' }; } else if (!wp.SK[id]) wp.SK[id] = { id, n: META[c][1], t: t === '秘奧義' ? '奧義' : '技', cd: 0 }; } }
  let HUD = 0; const ch0 = W.chain, cc0 = W.chainCd, sl0 = W.slots, ul0 = W.ult, lv0 = W.lv, mo0 = W.mvOk;
  W.chain = function (i) { if (!on()) return ch0.apply(this, arguments); ensureMV(); return SAV().keys[i].map(c => c ? 'lv:' + c : null); };
  W.chainCd = function (i) { return on() ? 0 : cc0.apply(this, arguments); };
  W.mvOk = function (m) { if (m && typeof m.id === 'string' && m.id.startsWith('lv:')) { const c = m.id.slice(3); return !!(META && META[c] && SAV().sk[c] && tpOk(c)); } return mo0.apply(this, arguments); };
  W.lv = function (sid) { if (typeof sid === 'string' && sid.startsWith('lv:')) { const c = sid.slice(3); if (!META || !META[c]) return 0; const l = SAV().sk[c] || 0; return META[c][2] === '秘奧義' || tpOk(c) ? l : 0; } return lv0.apply(this, arguments); };
  W.slots = function () { const s = sl0.apply(this, arguments); if (!HUD || !on()) return s; ensureMV(); const d = SAV(); return Object.assign({}, s, { A: d.sp[0] ? 'lv:' + d.sp[0] : null, B: d.sp[1] ? 'lv:' + d.sp[1] : null }); };
  W.ult = function () { if (!HUD || !on()) return ul0.apply(this, arguments); ensureMV(); const c = SAV().ult; return c ? W.cur().SK['lv:' + c] || null : null; };
  const ud0 = G.UI.draw; G.UI.draw = function () { HUD = 1; try { ud0.apply(this, arguments); } finally { HUD = 0; } if (on()) drawTP(); };
  function drawTP() { const x0 = 10 + Math.min(G.SAFE.l, 6), y0 = 12 + G.SAFE.t, bw = 150, x = x0 + 52, y = y0 + 43, v = SAV().tp / TPMAX;   /* 氣量表下方、區域標籤上方 */
    ctx.fillStyle = 'rgba(12,8,10,.75)'; ctx.fillRect(x - 1, y - 1, bw + 2, 5); ctx.fillStyle = '#3f8fd8'; ctx.fillRect(x, y, bw * v, 3);
    G.txt('TP ' + Math.floor(SAV().tp), x + bw + 6, y + 1.5, 9, '#a8d8ff', 'left', G.FONT, 900); }
  /* 普攻命中 +3（同一下對同一敵人只算一次） */
  const dmo0 = G.damageOni; G.damageOni = function (e) { const r = dmo0.apply(this, arguments);
    if (H.act && H.act.kind === 'atk' && on()) { const a = H.act, s = a._tp || (a._tp = new Set()); if (!s.has(e)) { s.add(e); tpGain(3); } } return r; };

  /* ---------- 出招 ---------- */
  /* 判定（r3.124.0）：段數＝原版 Hit 數（META[10]），平均分佈在「有特效的時段」內；每段取當下最大的特效、每個敵人每段只中一次。
   * 劍氣（模式 3）另算一下：前進中掃到的敵人各中一次。雙牙＝下斬 1 下＋兩道魔神劍劍氣。 */
  const PULL = { evilsphere: 1, negativegate: 1, blackhole: 1 };
  /* r3.127.3：闇氣圈（深色、圍住角色的特效）原始位置在身體前方約 AURA 單位，改成圍在身體中心；圖是否為闇氣依顏色在載入時判定一次 */
  const AURA = { majinrengokusatsu: 50 }, AUC = {};
  function auraSet(code, u) { if (AUC[code]) return AUC[code]; const S = new Set(), cv = document.createElement('canvas'), cx = cv.getContext('2d', { willReadFrequently: true });
    const ids = new Set(); for (const e of u.tl) for (const f of e[4]) if (f[6] === 0) ids.add(f[0]);   /* r3.128.0：所有深色圈都算（原本只抓固定位置，漏掉移動中的幾格） */
    for (const id of ids) { const fr = u.x[id], im = u.imgs[fr[7]]; if (!im) continue; const w = Math.max(1, fr[2] >> 2), h = Math.max(1, fr[3] >> 2); cv.width = w; cv.height = h;
      try { cx.clearRect(0, 0, w, h); cx.drawImage(im, fr[0], fr[1], fr[2], fr[3], 0, 0, w, h); const D = cx.getImageData(0, 0, w, h).data; let a = 0, l = 0;
        for (let i = 0; i < D.length; i += 4) { const al = D[i + 3]; if (al < 40) continue; a += al; l += al * (D[i] + D[i + 1] + D[i + 2]) / 3; } if (a > 0 && l / a < 70) S.add(id); } catch (e) {} }
    return (AUC[code] = S); }
  const SPF = 1.6, SPS = 1.25;   /* 晶術：特效／判定放大、動畫倍速 */
  /* r3.128.0：逐招調整（使用者逐招檢查後的修正）
     j＝跳躍倍率（預設 JUMP）；dx＝前進距離倍率；wz＝雙牙劍氣大小；ff＝特效左右翻轉；fall／fz＝落下物起點高度倍率／大小；arc＝詠唱跳起高度（身高倍）；
     burst＝交叉點粉塵爆發；sz／hold＝特效大小／最後一格停留毫秒；x2＝剎牙第二刀時間（交叉在前方）；launch＝擊飛高度（身高倍）；carry＝頂著敵人往前打；n＝段數；
     dy／dxs＝低位特效往上／往前（原始單位）；tgt＝特效以目標為中心；screen＝全畫面判定 */
  const JUMP = 1.6, FALLD = 420, TUNE = { kogahazan: { j: 1.8 }, hienrenkyaku: { dx: 1.8 }, majinken_souga: { wz: 1.6 }, stingrave: { ff: 1 },
    pikohan: { fall: 2.6, fz: 1.2 }, pikopikohammer: { fall: 2.6, fz: 1.2 }, press: { fall: 2.6, fz: 1.2 }, ceilingfall: { fall: 2.6, fz: 1.2 }, stonewall: { fall: 2.6, fz: 1.2 },
    devilspear: { up: 1 }, demonslance: { up: 1 }, earthbit: { up: 1 }, demonslancezero: { up: 1, sz: 1.2 }, funjinreppashou: { burst: 1 }, marian: { sz: 1.5, hold: 400 }, majinkensetsuga: { x2: [470, 770] },
    senretsukokousen: { launch: 0.5 }, shouharekkousen: { launch: 0.7 }, majinsenretsushou: { carry: 1 }, majinrengokusatsu: { carry: 1, n: 13 },
    girenshoureizan: { dy: -85, dxs: 45 }, surviving_hollin: { sz: 2.4, screen: 1, flat: 1 }, raintive_orion: { sz: 1.8, tgt: 1, flat: 1 }, celestial_earth: { sz: 1.8, tgt: 1, flat: 1 } };
  const LING = { jouhamesshouen: 1, majinmessatsuen: 1, shinjinrengokusatsu: 1, majinrengokusatsu: 1 };   /* 黑火殘留 */
  let LGS = [];
  /* 晶術連放：第一段命中 0.35 秒後，在目標附近（前方偏移）再放一次；不畫身體、傷害同第一發 */
  function echo(p) { const u = p.u, i0 = u.tl.findIndex(e => e[4].some(f => f[6] !== 3)); if (i0 < 0) return; const t0 = u.tl[i0][0] - TK;
    CASTS.push(Object.assign({}, p, { sub: 2, echo: 0, lg: false, fs: undefined, landed: 0, air: null, t: t0, pi: i0, hi: p.HS.findIndex(h => h >= t0), tg: null, rel: 1, t3: -1, got: null, pw: null, bs: null,
      tx: p.tx + 70 * p.K * p.face, ty: p.ty + 12, k: -1 })); if (CASTS[CASTS.length - 1].hi < 0) CASTS[CASTS.length - 1].hi = p.HS.length; }
  /* 黑火殘留：取最後 8 格有特效的畫面循環播放 3 秒，每 0.5 秒對範圍內敵人造成總傷害 8% */
  function linger(c) { const F = c.u.tl.filter(e => e[4].some(f => f[6] !== 3)).slice(-8); if (!F.length) return; LGS.push({ c: Object.assign({}, c, { got: null }), F, t: 0, n: 0 }); }
  function stepLg(L) { L.t += TK; const k = Math.floor(L.t / 500); if (k > L.n && L.t < 3000) { L.n = k; const f = big(L.F[L.F.length - 1]) || big(L.F[0]); if (f) { const c = L.c, b0 = c.big; c.big = (b0 || 1) * 1.2; hitAt(c, f, 0.08 * c.tot / Math.max(0.01, c.per), false, new Set()); c.big = b0; } }
    return L.t < 3000; }
  function drawLg(L, back) { const i = Math.floor(L.t / 70) % L.F.length, al = Math.min(1, (3000 - L.t) / 500); drawE(L.c, L.F[i], back, al); }
  const hasWave = u => u._w !== undefined ? u._w : (u._w = u.tl.some(e => e[4].some(f => f[6] === 3)) ? 1 : 0);
  function sched(u, N) { const key = '_hs' + N; if (u[key]) return u[key]; const tl = u.tl, seg = []; let D = 0;
    for (let i = 0; i < tl.length; i++) { if (!tl[i][4].some(f => f[6] !== 3)) continue; const a = tl[i][0], b = i + 1 < tl.length ? tl[i + 1][0] : u.dur; if (b > a) { seg.push([a, b]); D += b - a; } }
    const out = [];
    for (let k = 0; k < N; k++) { if (!D) { out.push(u.lock * (0.3 + 0.4 * (k + 0.5) / N)); continue; } let p = D * (k + 0.3) / N;
      for (const [a, b] of seg) { if (p <= b - a) { out.push(a + p); break; } p -= b - a; } }
    return (u[key] = out); }
  const big = e => { let b = null, s = -1; for (const f of e[4]) { if (f[6] === 3) continue; if (f[3] > s) { s = f[3]; b = f; } } return b; };
  function fxAt(u, t) { let b = null; for (let i = 0; i < u.tl.length && u.tl[i][0] <= t + 1; i++) { const f = big(u.tl[i]); if (f) b = f; } return b; }
  function start(code, k, seg) { const u = A.get('lv_' + code); if (!u) { LD('lv_' + code).catch(() => {}); G.UI.toast('招式載入中…'); return false; }
    const m = META[code], lv = SAV().sk[code] || 0; if (!lv) return false;
    if (code === 'majinken_souga' && !A.get('lv_majinken')) { LD('lv_majinken').catch(() => {}); G.UI.toast('招式載入中…'); return false; }
    if (!pay(code)) return false;
    H.act = null; const s = SC.depth(H.y), K = kOf(s), R = 640 * K;
    let tg = null, bd = 1e9; for (const e of G.E) { if (e.st === 'dead' || e.delay > 0) continue; const dx = (e.x - H.x) * H.face; if (dx < -20 || dx > R || Math.abs(e.y - H.y) > 150) continue; const d = dx + Math.abs(e.y - H.y) * 2; if (d < bd) { bd = d; tg = e; } }
    const ty = m[2], gk = lv >= 5, tot = (m[5] + m[6] * (lv - 1)) * DMGK * (ty === '秘奧義' && gk ? 1.5 : 1), wv = hasWave(u), sg = code === 'majinken_souga';
    const T = TUNE[code] || {}; let N = code === 'heal' ? 1 : Math.max(1, T.n || m[10] || 1) + (gk && ty === '特技' ? 1 : 0); if (sg) N = 1; const Ns = sg ? 1 : Math.max(wv ? 0 : 1, N - wv), HS = sched(u, Ns);
    const nAll = sg ? 3 : Ns + wv, hitT = HS.length ? HS[HS.length - 1] : u.lock * 0.55;
    CUR = { code, u, lv, k, seg, t: 0, pi: 0, hi: 0, HS, x0: H.x, y0: H.y, face: H.face, K, tg, tx: tg ? tg.x : H.x + 585 * K * H.face, ty: tg ? tg.y : H.y, rel: 0, t3: -1,
      per: code === 'heal' ? 0 : tot / nAll, lock: u.lock, dur: u.dur, hitT: Math.min(hitT + 60, u.lock * 0.9), tk: ty, gk, T, sk: ty === '晶術' ? 1 : SLK * (T.sz || 1), big: ty === '晶術' && gk ? 1.5 : 1,
      aura: AURA[code] ? auraSet(code, u) : null, pull: !!PULL[code], waves: sg ? [300, 450] : null, tot, fz: ty === '晶術' ? (T.fz || SPF) : 1, spd: ty === '晶術' ? SPS : 1, echo: ty === '晶術' && code !== 'heal' ? 1 : 0, lg: !!LING[code] };
    if (ty === '秘奧義' && gk) H.inv = Math.max(H.inv, Math.round(u.lock / TK) + 6);   /* 秘奧義極意：演出中無敵 */
    if (ty === '秘奧義') { G.UI.banner('秘奧義・' + m[1], ''); if (G.VX && G.VX.dim) G.VX.dim(Math.round(u.lock / TK), 0.55); }   /* r3.128.0：跟秘傳一樣：名稱＋畫面壓暗 */
    CASTS.push(CUR); H.st = 'skill'; H.t = 0; H.hop = 0; H.inv = Math.max(H.inv, 6); if (G.AU) G.AU.sfx('swing'); return true; }
  /* 雙牙的劍氣：用魔神劍的劍氣格，從劍氣出現那一刻開始播（不畫身體、不打身體判定） */
  function wave(p) { const u = A.get('lv_majinken'); if (!u) return; const i0 = u.tl.findIndex(e => e[4].some(f => f[6] === 3)); if (i0 < 0) return;
    CASTS.push({ code: 'majinken', u, sub: 1, lv: p.lv, t: u.tl[i0][0] - TK, pi: i0, hi: 0, HS: [], x0: H.x, y0: H.y, face: p.face, K: p.K, tx: p.tx, ty: p.ty, rel: 1, t3: -1, per: p.per, lock: 0, dur: u.dur, sk: 1, big: (p.T && p.T.wz) || 1, wz: (p.T && p.T.wz) || 1 }); }
  function healTeam(p) { const T = [H].concat((G.PARTY && G.PARTY.list || []).filter(P => P.st !== 'down' && P.hp > 0)); for (const q of T) healOne(q, p); }
  function healOne(q, p) { const v = Math.round(q.hpMax * p); q.hp = Math.min(q.hpMax, q.hp + v); G.NUMS && G.NUMS.push({ x: q.x, y: q.y - G.HERO_H * SC.depth(q.y), v: '+' + v, t: 0, col: '#8fe0a0' }); }
  function end() { if (CUR) { CUR = null; H.st = 'idle'; H.hop = 0; H.t = 0; } }
  /* 連招鍵：最後一下打中後～收招結束前再按同鍵＝直接切下一招（省掉收招）；太早按先緩衝；收招後 45 格內再按也接下一招 */
  function press(i) { const d = SAV(), ch = d.keys[i], cs = H.chainSt; const seg = cs && cs.k === i && cs.win > 0 && cs.i < 2 && ch[cs.i + 1] ? cs.i + 1 : 0, code = ch[seg];
    if (!code) { G.UI.toast('此鍵尚未設定里歐招式（選單 › 角色 › 職業 › 里歐）'); return false; }
    if (!fire(code, i, seg)) return false; H.chainSt = { k: i, i: seg, win: Math.round(CUR.lock / TK) + 45 }; return true; }
  function fire(code, k, seg) { const d = SAV(); if (!META[code] || !open(code)) return false;
    if (!(d.sk[code] > 0)) { G.UI.toast(META[code][1] + '：尚未學會'); return false; }
    if (Math.abs(G.IN.mx) > 0.2) H.face = Math.sign(G.IN.mx); return start(code, k, seg); }
  /* 特效位置（世界座標）：回傳 [x, y, 地面深度] */
  const zOf = (c, f) => f[6] === 0 ? c.sk : f[6] === 3 ? (c.wz || 1) : (c.fz || 1);
  function fxPos(c, f) { const k = c.K, fc = c.face, z = zOf(c, f);
    if (f[6] === 1) return [H.x + f[1] * k * fc * z, H.y + f[2] * k * z, H.y];
    if (f[6] === 2) { let dy = 0; if (c.T && c.T.fall && c.fs !== undefined) { const q = Math.min(1, (c.t - c.fs) / FALLD); dy = (1 - q * q) * c.T.fall * G.HERO_H * SC.depth(c.ty); }   /* r3.128.2 fall：從高處加速落下（原素材位置固定，落下感改用程式位移） */
      return [c.tx + f[1] * k * fc * z, c.ty + f[2] * k * z - dy, c.ty]; }
    if (f[6] === 3) { if (c.t3 < 0) c.t3 = c.t; return [c.x0 + (180 + 0.75 * (c.t - c.t3)) * k * fc, c.y0 - 85 * k, c.y0]; }
    if (c.aura && c.aura.has(f[0])) return [H.x, H.y - (c.hop || 0) - 72 * k, H.y];   /* r3.128.0：闇氣圈直接以身體（含跳起）為中心 */
    const T = c.T || {};
    if (T.x2 && c.t >= T.x2[0] && c.t <= T.x2[1] && c.s1) { const q = (c.t - T.x2[0]) / (T.x2[1] - T.x2[0]); return [c.s1[0] + 28 * k * fc, c.s1[1] + (-25 + 95 * q) * k, c.y0]; }   /* 剎牙：第二刀從第一刀上方往下劈，在前方交叉 */
    let x = c.x0 + (c.bx || 0) + (f[1] + (c.xs || 0)) * k * fc, y = c.y0 + f[2] * k - (c.lift || 0);   /* xs／lift：前進距離與跳躍加高的追加量（身體與特效一起） */
    if (T.dy && f[2] > -35) { x += T.dxs * k * fc; y += T.dy * k; }   /* 義憐聖靈斬：低位特效移到身前 */
    if (T.tgt) { if (c.tg0 === undefined) c.tg0 = f[1]; x += (c.tx - c.x0) - c.tg0 * k * fc; y += c.ty - c.y0; }   /* 第一個特效對準目標，其餘保持相對位置 */
    return [x, y, T.tgt ? c.ty : c.y0]; }   /* 模式 0：位置不放大；bx＝身體被擋住時的實際位置偏差 */
  function hitAt(c, f, mul, last, once) { const u = c.u, fr = u.x[f[0]], [x0, , gy] = fxPos(c, f), z = zOf(c, f), fl = f[8] ? -1 : 1, wW = fr[2] * fr[8] * f[3] * z,
      x = x0 + (fr[2] / 2 - fr[4]) * fr[8] * f[3] * z * c.K * c.face * fl, rx = Math.max(55, wW * 0.42) * c.K * (c.big || 1), ry = Math.max(34, rx * 0.32); let n = 0;
    if (G.LEON.dbg) G.LEON.dbg.push([Math.round(c.t), Math.round((x - c.x0) * c.face), Math.round(rx), Math.round(gy - c.y0), G.E.filter(e => e.st !== 'dead').map(e => Math.round((e.x - c.x0) * c.face) + '/' + Math.round(e.y - gy)).join(' ')]);
    for (const e of G.E) { if (e.st === 'dead' || e.delay > 0 || once.has(e)) continue;
      if (Math.abs(e.x - x) > rx + (G.bodyX ? G.bodyX(e) : 0) || Math.abs(e.y - gy) > ry) continue;
      once.add(e); n++; (c.got || (c.got = new Set())).add(e); G.damageOni(e, c.per * mul, last); e.stun = Math.max(e.stun || 0, c.tk === '晶術' && c.gk ? (e.bb || e.boss ? 15 : 45) : 8); G.hitstop = Math.max(G.hitstop || 0, 1); }
    return n; }
  function stick(c, last) { const T = new Set(c.got || []); if (c.tg) T.add(c.tg); let n = 0; const R = 230 * c.K;
    for (const e of T) { if (e.st === 'dead' || e.delay > 0) continue; const near = ((Math.abs(e.x - H.x) < R || (c.tk !== '晶術' && c.got && c.got.has(e) && Math.abs(e.x - c.x0) < R * 2)) && Math.abs(e.y - H.y) < 70) || (c.tk === '晶術' && Math.abs(e.x - c.tx) < R && Math.abs(e.y - c.ty) < 70); if (!near) continue;
      n++; (c.got || (c.got = new Set())).add(e); G.damageOni(e, c.per, last); e.stun = Math.max(e.stun || 0, 8); }
    return n; }
  function stepCast(c) { const tl = c.u.tl; c.t += TK * (c.spd || 1);
    if (c.echo === 1 && c.HS.length && c.t >= c.HS[0] + 350) { c.echo = 2; echo(c); }
    if (c.tg && c.tg.st !== 'dead' && !c.rel) { c.tx = c.tg.x; c.ty = c.tg.y; }
    while (c.pi < tl.length && tl[c.pi][0] <= c.t) { const e = tl[c.pi]; if (e[4].some(f => f[6] === 2)) { c.rel = 1; if (c.fs === undefined) c.fs = c.t; } if (e[4].length) { c.lastE = e; c.lastT = c.t; const T = c.T || {}; if (T.x2 && c.t < T.x2[0] && e[4][0][6] === 0) { c.s1 = fxPos(c, e[4][0]); (c.s1L || (c.s1L = [])).push(e); } } for (const f of e[4]) if (f[6] === 3) hitAt(c, f, 1, false, c.pw || (c.pw = new Set())); c.pi++; }
    if (c.T && c.T.fall && c.fs !== undefined && !c.landed && c.t >= c.fs + FALLD) { c.landed = 1; SC.shake = Math.max(SC.shake || 0, 7); for (let i = 0; i < 6; i++) G.FX.push({ k: 'dust', x: c.tx + (Math.random() - 0.5) * 80, y: c.ty, t: 0, life: 22 }); }   /* 落地衝擊 */
    while (c.hi < c.HS.length && c.HS[c.hi] <= c.t && !(c.T && c.T.fall && !c.landed)) {   /* 落下中先不判定，落地才打 */ const f = fxAt(c.u, c.HS[c.hi]), lastH = c.hi === c.HS.length - 1; c.hi++; if (!f) continue;
      if (c.code === 'heal') { healTeam(0.15 + 0.02 * (c.lv - 1) + (c.gk ? 0.05 : 0)); continue; }
      let n = hitAt(c, f, 1, lastH, new Set());
      const T = c.T || {}, hh = G.HERO_H * SC.depth(c.y0);
      if (T.launch && c.got && G.KT && G.KT.lift) for (const e of c.got) if (e.st !== 'dead' && (c.hi === 1 || (c.air && c.air.has(e)))) { G.KT.lift(e, c.hi === 1 ? T.launch : T.launch * 0.75); (c.air || (c.air = new Set())).add(e); }   /* 第一下擊飛，之後追打空中的敵人 */
      if (T.burst && lastH) { const [bx2, by2] = fxPos(c, f); if (G.VX && G.VX.s2) G.VX.s2('fx_dust', { x: bx2, y: c.y0, k: 2.2, sy: 0.7, life: 34, a: 0.95 }); for (let i = 0; i < 10; i++) G.FX.push({ k: 'dust', x: bx2 + (Math.random() - 0.5) * hh * 1.6, y: c.y0 + (Math.random() - 0.5) * 30, t: 0, life: 26 + i * 2 });
        SC.shake = Math.max(SC.shake || 0, 8); for (const e of G.E) { if (e.st === 'dead' || e.delay > 0 || Math.hypot(e.x - bx2, (e.y - c.y0) * 1.5) > hh * 1.7) continue; G.damageOni(e, c.per * 1.5, true); if (!e.boss && !e.bb) { const nx = e.x + c.face * hh * 0.5; if (SC.walkable(nx, e.y)) e.x = nx; } } }   /* 粉塵裂破衝：交叉點粉塵爆發＋範圍傷害＋擊退 */
      if (T.screen && lastH) { const hw = SC.view().vw / 2 + 40; SC.shake = Math.max(SC.shake || 0, 14); G.flash = Math.max(G.flash || 0, 10); for (const e of G.E) if (e.st !== 'dead' && e.delay <= 0 && Math.abs(e.x - H.x) < hw) G.damageOni(e, c.per * 2, true); }   /* Surviving Hollin：全畫面衝擊 */
      if (!n) n = stick(c, lastH);   /* 這一段特效沒掃到人：補打已交戰的目標（角色位移後特效偏掉時，段數仍照原版） */
      if (n && c.code === 'jushourai' && !c.healed) { c.healed = 1; healOne(H, 0.08 + 0.01 * (c.lv - 1)); }   /* 柔招來：打中時回復自身 */
      if (lastH && c.gk && c.tk === '奧義') { c.big = 1.6; hitAt(c, f, 2 * DMGK / Math.max(0.01, c.per), true, new Set()); c.big = 1; } }   /* 奧義極意：最後一下追加爆發 200% */
    if (c.waves && c.waves.length && c.t >= c.waves[0]) { c.waves.shift(); wave(c); }
    if (c.pull && c.t >= 200 && c.t <= c.dur) { const hh = G.HERO_H * SC.depth(c.ty), RX = hh * (c.gk ? 4 : 3.2), RY = hh * 1.1, v = hh * (c.gk ? 0.07 : 0.055);   /* r3.127.3 闇系（負向之門／邪惡領域／黑洞）：出現後到結束持續往中心吸（範圍約 3 個身高；頭目不吸） */
      for (const e of G.E) { if (e.st === 'dead' || e.delay > 0 || e.boss || e.bb) continue; const dx = c.tx - e.x, dy = c.ty - e.y; if (Math.abs(dx) > RX || Math.abs(dy) > RY) continue;
        const d = Math.hypot(dx, dy) || 1, st = Math.min(d, v), nx = e.x + dx / d * st, ny = e.y + dy / d * st * 0.6; if (!SC.walkable || SC.walkable(nx, ny)) { e.x = nx; e.y = ny; } e.stun = Math.max(e.stun || 0, 4); } }
    if (c === CUR) { const e = tl[Math.max(0, c.pi - 1)], T = c.T || {}; c.xs = (e[2] || 0) * ((T.dx || 1) - 1); const tx = c.x0 + (e[2] + c.xs) * c.K * c.face, dx = tx - H.x;
      if (Math.abs(dx) > 0.5) { const nx = H.x + Math.sign(dx) * Math.min(Math.abs(dx), 14); if (SC.walkable(nx, H.y)) H.x = nx; }   /* 只沿 x 位移（不繞障礙、不改深度） */
      c.bx = H.x - tx;   /* 被敵人／障礙擋住沒走到原版位置：特效跟著實際身體 */
      const up = Math.max(0, -(e[3] || 0)) * c.K; c.lift = up * ((T.j || JUMP) - 1);   /* r3.128.0：跳躍加高（特效同步加高） */
      const hh = G.HERO_H * SC.depth(H.y), aT = c.lock * 0.7, arc = T.arc && c.t < aT ? Math.sin(Math.PI * c.t / aT) * T.arc * hh : 0;   /* 惡魔投槍／之槍：詠唱時跳起 */
      const e3 = e[3] || 0; c.hop = H.hop = (T.up ? Math.max(0, e3) : T.flat || c.tk === '晶術' ? -Math.min(0, e3) : -e3) * c.K + c.lift + arc;   /* up：原始 y 為正＝往上（投槍類跳起）；晶術／flat：正值（施法姿勢偏移）不往下沉 */
      if (c.air) for (const q of c.air) { if (q.st === 'dead') continue; q.stun = Math.max(q.stun || 0, c.t < c.lock ? 20 : 0); if (c.t < c.lock && (q.lz || 0) < hh * (T.launch || 0.5) * 0.45 && (q.lzv || 0) <= 0 && G.KT) G.KT.lift(q, (T.launch || 0.5) * 0.55); }   /* r3.128.2：招式期間浮空的敵人維持在空中（落下就再托起），不能動 */
      if (T.carry && c.got && c.t < c.lock) for (const q of c.got) { if (q.st === 'dead' || q.boss || q.bb) continue; const px = H.x + c.face * hh * 0.75, nx = q.x + (px - q.x) * 0.35, ny = q.y + (H.y - q.y) * 0.2; if (SC.walkable(nx, ny)) { q.x = nx; q.y = ny; } q.stun = Math.max(q.stun || 0, 10); }   /* 頂著敵人往前打 */
      if (c.t >= c.lock) { if (c.air) for (const q of c.air) if (q.st !== 'dead') q.stun = Math.max(q.stun || 0, 45); end(); } }   /* 收招：浮空的敵人落地後再暈 0.75 秒 */   /* r3.127.4：照原版 y 位移（正＝往下、負＝往上），跳躍高度＝相對變化，與特效位置一致 */
    return c.t < c.dur + 40 + ((c.T && c.T.hold) || 0); }
  const canLink = c => c && c.k >= 0 && c.t >= c.hitT && c.t < c.lock;
  let lastHp = -1;
  const hs0 = G.heroStep;
  G.heroStep = function () { const IN = G.IN;
    if (!on()) { if (CUR) end(); CASTS = []; LGS = []; BUF = null; return hs0.apply(this, arguments); }
    if (!A.get('w_katana')) A.useWeapon('katana').catch(() => {});
    const d = SAV(); if (lastHp >= 0 && H.hp < lastHp) tpGain(1); lastHp = H.hp; if (!CUR && !H.act) tpGain(2 / 60);   /* 被打 +1、沒出招每秒 +2 */
    if (CASTS.length) { const cs = CASTS; CASTS = []; const keep = cs.filter(c => { const a = stepCast(c); if (!a && c.lg) linger(c); return a; }); CASTS = keep.concat(CASTS); }
    if (LGS.length) LGS = LGS.filter(stepLg);   /* 步進中新增的施放（雙牙劍氣）先放新陣列，不會被 filter 漏掉 */
    if (CUR) { if ((H.act && H.act.kind === 'hurt') || H._stn > 0 || H.hp <= 0) { end(); BUF = null; return asKat(() => hs0.apply(this, arguments)); }
      H.t++; if (H.chainSt && H.chainSt.win > 0) H.chainSt.win--; if (H.inv > 0) H.inv--; if (H.recov > 0) H.recov--; for (const k in H.cd) if (H.cd[k] > 0) H.cd[k]--;
      for (const k of ['c1', 'c2', 'c3', 'skA', 'skB', 'ult']) if (IN[k]) { IN[k] = false; BUF = k; }
      for (const k of ['atk', 'm1', 'm2']) IN[k] = false;
      if (BUF && BUF[0] === 'c' && +BUF[1] - 1 === CUR.k && canLink(CUR)) { const i = CUR.k; BUF = null; CUR = null; if (!press(i)) end(); }   /* 同鍵接技：截掉收招 */
      { const r = asKat(() => hs0.apply(this, arguments)); if (CUR) H.hop = CUR.hop || 0; return r; } }   /* r3.127.3：15_skill 每格把 H.hop 歸零，跳躍高度要在外層模組跑完後再套回；r3.126.0：外層模組（預警計時、回復、增益…）照常每格執行；本體步進在 03 略過 */
    if (BUF) { if (!H.act) IN[BUF] = true; BUF = null; }
    for (let i = 0; i < 3; i++) { const k = 'c' + (i + 1); if (!IN[k]) continue; IN[k] = false; const a = H.act;
      if (a && !(a.kind === 'atk' && H.t >= a.T * 0.45)) { if (a.kind !== 'hurt') BUF = k; continue; }
      press(i); }
    for (const [k, gt] of [['skA', () => d.sp[0]], ['skB', () => d.sp[1]], ['ult', () => d.ult]]) { if (!IN[k]) continue; IN[k] = false; if (CUR) continue; const a = H.act;
      if (a && !(a.kind === 'atk' && H.t >= a.T * 0.45)) { if (a.kind !== 'hurt') BUF = k; continue; }
      const c = gt(); if (!c) { G.UI.toast((k === 'ult' ? '奧義鍵尚未設定秘奧義' : '技鍵尚未設定晶術') + '（選單 › 角色 › 職業 › 里歐）'); continue; } fire(c, -1, 0); }
    /* r3.127.2：身法（按下身法鍵或身法動作中）用目前武器跑，專屬身法與分身照常；其餘借打刀 */
    if (IN.m1 || IN.m2 || (H.act && (H.act.kind === 'dodge' || H.act.kind === 'dash'))) return hs0.apply(this, arguments);
    return asKat(() => hs0.apply(this, arguments)); };
  const en0 = G.STORY.onEnter; G.STORY.onEnter = function () { CASTS = []; LGS = []; if (CUR) end(); return en0.apply(this, arguments); };

  /* ---------- 繪製：沿用原本 drawHero（保留各模組疊加），只把主角那一格換成里歐 ---------- */
  function baseFrame() { const u = A.get('lv_base'), a = H.act, R = n => u.act[n];
    if (H.hp <= 0) { const r = R('death'); return r.f[r.f.length - 1]; }
    if (a) { const k = a.kind, r = k === 'atk' ? R('attack_' + ((H.combo || 0) % 3 + 1)) : k === 'skill' || k === 'ult' ? R(a.seg === 1 ? 'attack_2' : 'attack_3') : k === 'dodge' || k === 'dash' ? R('dodge') : k === 'guard' ? R('guard') : k === 'hurt' ? R('hurt') : R('attack_1');
      return A.frameAt(r, H.t * TK, Math.max(1, a.T) * TK); }
    if (H.st === 'walk') return A.frameAt(R(H.run ? 'run' : 'walk'), H.ms);
    return A.frameAt(R(nearNow() ? 'combat_idle' : 'idle'), H.ms || G.t * TK); }
  /* 待機／戰鬥待機切換加遲滯（進 420、出 560 且持續 1.5 秒），每 10 格才掃一次敵人（避免來回切換抖動） */
  let NEAR = 0, nT = -99; function nearNow() { if (G.t - nT >= 10 || G.t < nT) { nT = G.t; const r = NEAR ? 560 : 420; NEAR = G.E.some(e => e.st !== 'dead' && e.delay <= 0 && Math.abs(e.x - H.x) < r) ? 90 : Math.max(0, NEAR - 10); } return NEAR > 0; }
  let SWAP = 0; const ad0 = A.draw;
  A.draw = function (u, fr, x, y, sc, flip, al) { if (!SWAP) return ad0.apply(this, arguments); SWAP = 0;
    const b = A.get('lv_base'), k = kOf(SC.depth(H.y));
    if (CUR) { const e = CUR.u.tl[Math.max(0, CUR.pi - 1)]; return ad0.call(this, CUR.u, CUR.u.b[e[1]], x, y, k * (e[5] || 1), (CUR.face < 0) !== !!e[6], al); }
    return ad0.call(this, b, baseFrame(), x, y, k, flip, al); };
  function drawFx(c, back) { const u = c.u, tl = u.tl, e = tl[Math.max(0, c.pi - 1)]; if (!e || c.pi === 0) return;
    if (c.T && c.T.x2 && c.s1L && c.t >= c.T.x2[0] && c.t <= c.T.x2[1]) { const q = (c.t - c.T.x2[0]) / (c.T.x2[1] - c.T.x2[0]); return drawE(c, c.s1L[Math.min(c.s1L.length - 1, Math.floor(q * c.s1L.length))], back, 1); }   /* 剎牙第二刀：重播第一刀的刀光（翻轉、往下劈） */
    const hd = c.T && c.T.hold; if (hd && !e[4].length && c.lastE && c.t - c.lastT < hd) return drawE(c, c.lastE, back, 1 - (c.t - c.lastT) / hd);   /* 魔人闇：暗波停留後淡出 */
    drawE(c, e, back, 1); }
  function drawE(c, e, back, al) { const u = c.u;
    for (const f of e[4]) { if (f[5] !== back || (c.sub === 1 && f[6] !== 3)) continue; const fr = u.x[f[0]], im = u.imgs[fr[7]]; if (!im) continue; const [x, y] = fxPos(c, f), S = c.K * f[3] * fr[8] * zOf(c, f);
      ctx.save(); if (al < 1) ctx.globalAlpha = al; ctx.translate(x, y); const X2 = c.T && c.T.x2 && c.t >= c.T.x2[0] && c.t <= c.T.x2[1]; if ((c.face < 0) !== (!!(c.T && c.T.ff) !== !!X2)) ctx.scale(-1, 1);   /* 剎牙第二刀左右翻轉，跟第一刀交叉成 X */ if (f[4]) ctx.rotate(f[4] * Math.PI / 180); if (f[8]) ctx.scale(-1, 1);
      ctx.drawImage(im, fr[0], fr[1], fr[2], fr[3], -fr[4] * S, -fr[5] * S, fr[2] * S, fr[3] * S); ctx.restore(); } }
  /* r3.127.2：分身殘影改畫里歐（閃身姿勢，半透明淡出） */
  const dn0 = G.drawNpc; G.drawNpc = function (n) { if (!n || !n.bunshin || !on()) return dn0.apply(this, arguments);
    const b = A.get('lv_base'), r = b && b.act.dodge; if (!r) return dn0.apply(this, arguments);
    const k = Math.min(1, n.t / 8) * (n.life - n.t < 30 ? (n.life - n.t) / 30 : 1);
    ad0.call(A, b, r.f[r.f.length - 1], n.x, n.y, kOf(SC.depth(n.y)), n.face < 0, 0.55 * k); };
  const dh0 = G.drawHero;
  G.drawHero = function () { if (!on()) return dh0.apply(this, arguments); if (CUR) H.hop = CUR.hop || 0;   /* r3.127.3：跳躍高度在繪製時套用（其他模組會在步進後把 H.hop 歸零） */
    for (const L of LGS) drawLg(L, 1); for (const c of CASTS) drawFx(c, 1); SWAP = 1; KAT++; try { dh0.apply(this, arguments); } finally { SWAP = 0; KAT--; } for (const c of CASTS) drawFx(c, 0); for (const L of LGS) drawLg(L, 0); };

  /* ---------- 外觀經驗 ---------- */
  const ge0 = G.RPG.gainExp; G.RPG.gainExp = function (n) { const r = ge0.apply(this, arguments); if (on() && n > 0) { const d = SAV(); if (d.lv < CAP) { d.exp += n;
      while (d.lv < CAP && d.exp >= need(d.lv)) { d.exp -= need(d.lv); d.lv++; d.pt += 2; const nw = Object.keys(META).filter(c => META[c][3] === d.lv && open(c)).map(c => META[c][1]);
        G.UI.banner('里歐外觀 Lv ' + d.lv, nw.length ? '可學會：' + nw.join('、') : '技能點 +2'); } G.SAVE.markDirty(); } } return r; };

  /* ---------- 選單：角色 › 職業 清單最下面一格（未解鎖「？？？」）；右側＝換此外觀＋招式管理 ---------- */
  const ST = { cat: 0, sel: null };
  const T = (s, x, y, sz, c, al, w) => G.txt(s, x, y, sz, c || G.C.ink, al || 'left', G.FONT, w || 600);
  const fs = () => G.FS();
  const KN = ['招1', '招2', '招3', '技A', '技B', '奧義'];
  function learn(c) { const d = SAV(), lv = d.sk[c] || 0, cost = Math.max(1, lv); if (lv >= 5) return; if (d.lv < META[c][3]) { G.UI.toast('外觀 Lv ' + META[c][3] + ' 解鎖'); return; }
    if (d.pt < cost) { G.UI.toast('技能點不足（需要 ' + cost + '）'); return; } d.pt -= cost; d.sk[c] = lv + 1; G.SAVE.markDirty(); LD('lv_' + c).catch(() => {}); }
  /* 裝鍵：特技／奧義→招 1～3（每鍵 3 招）；晶術→技 A／B；秘奧義→奧義鍵 */
  function equip(c, i) { const d = SAV();
    if (i < 3) { const ch = d.keys[i]; if (ch.includes(c)) { G.UI.toast(KN[i] + ' 已經有這招'); return; } const j = ch.indexOf(null); if (j < 0) { G.UI.toast(KN[i] + ' 已滿 3 招，先移除一招'); return; } ch[j] = c; }
    else if (i < 5) { const k = i - 3; if (d.sp[1 - k] === c) d.sp[1 - k] = null; d.sp[k] = c; } else d.ult = c;
    G.SAVE.markDirty(); LD('lv_' + c).catch(() => {}); if (c === 'majinken_souga') LD('lv_majinken').catch(() => {}); }
  function unequip(i, j) { const d = SAV(); if (i < 3) { const ch = d.keys[i]; ch.splice(j, 1); ch.push(null); } else if (i < 5) d.sp[i - 3] = null; else d.ult = null; G.SAVE.markDirty(); }
  function setOn(v) { const d = SAV(); d.on = v ? 1 : 0; G.SAVE.markDirty(); if (v) { preload(); G.UI.toast('外觀：里歐'); } }
  function panel(x, y, w, h) { const U = M.ui, C = G.C; boot(); ctx.fillStyle = '#16100f'; ctx.fillRect(x, y, w, h); U.box(x, y, w, h); U.hit(x, y, w, h, () => {});   /* 先蓋住下層職業面板的按鈕 */
    if (!unlocked()) { T('？？？', x + w / 2, y + h * 0.35, 18, C.gold, 'center', 900); T('任一難度通關一次後解鎖（第二輪起一直開放）', x + w / 2, y + h * 0.35 + 34, 12, C.sub, 'center'); return; }
    if (!META || !UIU) { T('載入中…', x + w / 2, y + h / 2, 13, C.sub, 'center'); return; }
    const d = SAV();
    T('里歐 Lv ' + d.lv + (d.lv < CAP ? '　經驗 ' + d.exp + '／' + need(d.lv) : '（滿級）') + '　點數 ' + d.pt, x + 12, y + 16, 12, C.gold, 'left', 800);
    T('TP ' + Math.floor(d.tp) + '：特技 6／晶術 10／奧義 14・秘奧義用氣', x + 12, y + 34, 9, C.sub);
    U.button(x + w - 104, y + 4, 94, 24, d.on ? '外觀使用中' : '換此外觀', () => setOn(!d.on), d.on ? 'main' : '');
    const cw = Math.min(84, (w - 24 - 18) / 4); CATS.forEach((t, i) => U.button(x + 12 + i * (cw + 6), y + 46, cw, 24, t, () => { ST.cat = i; ST.sel = null; }, i === ST.cat ? 'main' : ''));
    const cw3 = (w - 24) / 3, KS = Math.round(Math.min(28 * fs(), (cw3 - 36) / 3 - 5)), keyH = 16, top = y + 76, bodyH = h - (top - y) - keyH - 6, lw = Math.floor(w * 0.44), cat = CATS[ST.cat];
    const list = Object.keys(META).filter(c => typ(c) === cat).sort((a, b) => META[a][0] - META[b][0]); if (!ST.sel || typ(ST.sel) !== cat) ST.sel = list[0];
    const RH = Math.round(38 * fs()), off = U.scrollArea('lvList', x + 6, top, lw, bodyH, list.length * RH + 4); U.clip(x + 6, top, lw, bodyH);
    list.forEach((c, i) => { const yy = top + off + i * RH; if (yy + RH < top || yy > top + bodyH) return; const lv = d.sk[c] || 0, lock = d.lv < META[c][3], sel = c === ST.sel;
      ctx.fillStyle = sel ? 'rgba(150,92,36,.55)' : 'rgba(30,22,26,.7)'; G.rr(x + 8, yy + 2, lw - 10, RH - 4, 6); ctx.fill();
      drawIc(c, x + 12, yy + 5, RH - 10, lock ? 0.35 : 1);
      T(META[c][1], x + 18 + RH, yy + RH * 0.38, 12, lock ? C.dim : C.ink, 'left', 800);
      T(lock ? '外觀 Lv ' + META[c][3] + ' 解鎖' : lv ? 'Lv ' + lv + (lv >= 5 ? '・極意' : '') : '未學會', x + 18 + RH, yy + RH * 0.72, 9, lock ? C.dim : lv ? C.gold : C.sub);
      const kk = keyOf(c); if (kk >= 0) T(KN[kk], x + lw - 6, yy + RH / 2, 10, '#9ec8ff', 'right', 800);
      U.hit(x + 8, Math.max(top, yy + 2), lw - 10, RH - 4, () => { ST.sel = c; }); });
    ctx.restore();
    /* 右：資訊卡 */
    const rx = x + lw + 12, rw = w - lw - 20, c = ST.sel; if (c) { const m = META[c], lv = d.sk[c] || 0, lock = d.lv < m[3]; U.box(rx, top, rw, bodyH, 'rgba(30,22,26,.9)');
      const S = Math.round(40 * fs()), LL = Math.round(16 * fs()); drawIc(c, rx + 8, top + 8, S, lock ? 0.4 : 1);
      T(m[1], rx + 14 + S, top + 8 + S * 0.32, 14, C.gold, 'left', 900); T(m[2] + '・Lv ' + m[3] + ' 解鎖', rx + 14 + S, top + 8 + S * 0.78, 9, C.sub);
      let yy = top + S + 14 + LL / 2; ctx.font = `600 ${10 * fs()}px ${G.FONT}`;
      const line = (s, col) => { for (const l of G.wrap(s, rw - 20)) { if (yy > top + bodyH - 34 * fs()) return; T(l, rx + 10, yy, 10, col); yy += LL; } };
      line('效果：' + m[4]);
      line((lv ? 'Lv ' + lv + '/5' : '未學會') + '・' + (m[2] === '秘奧義' ? '需要「氣」100' : 'TP ' + tpCost(c)) + '・' + (c === 'heal' ? '全隊回復' : (c === 'majinken_souga' ? '1 斬＋2 道劍氣' : Math.max(1, m[10]) + ' 段')) + '・倍率 ' + (m[5] + m[6] * Math.max(0, lv - 1)).toFixed(2));
      line('Lv5 極意：' + m[8], lv >= 5 ? C.gold : C.sub);
      const bh = Math.round(24 * fs()), by2 = top + bodyH - bh - 8, ks = m[2] === '晶術' ? [3, 4] : m[2] === '秘奧義' ? [5] : [0, 1, 2], lb = lv ? Math.round((rw - 20) * 0.34) : rw - 20, by1 = by2;
      U.button(rx + 10, by1, lb, bh, lv >= 5 ? '滿級' : (lv ? '升級 ' + lv + '點' : '學會 1點'), () => learn(c), lv >= 5 || lock ? 'off' : 'main');
      if (lv) { const kx = rx + 16 + lb, kw = (rx + rw - 10 - kx - 5 * (ks.length - 1)) / ks.length;
        ks.forEach((i, n) => U.button(kx + n * (kw + 5), by2, kw, bh, '裝' + KN[i], () => equip(c, i))); } }
    T('按鍵設定：武器 › 按鍵（開里歐外觀時顯示里歐招式）', x + 12, y + h - 12, 9, C.dim, 'left'); }
  const keyOf = c => { const d = SAV(), i = d.keys.findIndex(ch => ch.includes(c)); return i >= 0 ? i : d.sp[0] === c ? 3 : d.sp[1] === c ? 4 : d.ult === c ? 5 : -1; };
  /* ---------- r3.126.0：開里歐外觀時，武器 › 技能／按鍵 用與武器相同的版面 ---------- */
  const KD = { atk: ['斬', '普攻'], c1: ['招1', '招式鍵 1'], c2: ['招2', '招式鍵 2'], c3: ['招3', '招式鍵 3'], m1: ['身1', '身法 1'], m2: ['身2', '身法 2'], skA: ['技A', '技能 A（晶術）'], skB: ['技B', '技能 B（晶術）'], ult: ['奧', '奧義鍵（秘奧義）'] };
  const KP = { atk: [0, 0, 40], c1: [180, 76, 22], c2: [135, 76, 22], c3: [90, 76, 22], m1: [196, 146, 23], m2: [168, 150, 23], skA: [132, 150, 24], skB: [104, 146, 24], ult: [72, 140, 24] };
  const KT = { c1: ['特技', '奧義'], c2: ['特技', '奧義'], c3: ['特技', '奧義'], skA: ['晶術'], skB: ['晶術'], ult: ['秘奧義'] };
  const learned = ts => Object.keys(META).filter(c => ts.includes(META[c][2]) && SAV().sk[c] > 0).sort((a, b) => META[a][0] - META[b][0]);
  const sub = c => { const m = META[c], lv = SAV().sk[c] || 0; return m[2] + '・Lv ' + lv + '・' + (m[2] === '秘奧義' ? '氣 100' : 'TP ' + tpCost(c)); };
  function keyOfName(k) { const d = SAV(), wp = W.cur(), sl = sl0.call(W);
    if (k[0] === 'c') { const c = d.keys[+k[1] - 1][0]; return c ? META[c][1] : null; }
    if (k === 'skA' || k === 'skB') { const c = d.sp[k === 'skA' ? 0 : 1]; return c ? META[c][1] : null; }
    if (k === 'ult') return d.ult ? META[d.ult][1] : null;
    if (k === 'm1' || k === 'm2') { const b = wp.BD[sl.M[k === 'm1' ? 0 : 1]]; return b ? b.n : null; } return '普攻連段'; }
  function rowList(rx, rw, top, bot, items, isOn, pick, empty, key) { const U = M.ui, C = G.C, RH = Math.round(44 * fs()), off = U.scrollArea(key, rx, top, rw, bot - top, Math.max(1, items.length) * RH); U.clip(rx, top, rw, bot - top);
    if (!items.length) G.txt(empty, rx + 14, top + 20, 11, C.dim, 'left', G.FONT, 500);
    items.forEach((it, i) => { const yy = top + i * RH + off, on = isOn(it); if (yy + RH < top || yy > bot) return; ctx.fillStyle = on ? 'rgba(120,80,30,.45)' : 'rgba(255,255,255,.03)'; G.rr(rx + 8, yy + 3, rw - 16, RH - 6, 6); ctx.fill();
      if (it.c) drawIc(it.c, rx + 14, yy + 8, RH - 16, on ? 1 : 0.85); G.txt(it.n, rx + 22 + RH - 16, yy + RH * 0.36, 13, C.ink, 'left', G.FONT_S, 900); G.txt(it.s, rx + 22 + RH - 16, yy + RH * 0.7, 10, C.sub, 'left', G.FONT, 500);
      U.hit(rx + 8, Math.max(top, yy + 3), rw - 16, RH - 6, () => pick(it)); });
    ctx.restore(); }
  function keyPage(x, y, w, h) { const U = M.ui, C = G.C, d = SAV(), wp = W.cur(), sel = M.sel.lvk || 'c1'; boot(); if (!META || !UIU) { U.box(x, y, w, h); G.txt('載入中…', x + w / 2, y + h / 2, 13, C.sub, 'center'); return; }
    const lw = Math.min(330, w * 0.44); U.box(x, y, lw, h);
    G.txt('里歐　按鍵配置', x + 14, y + 18, 13, C.gold, 'left', G.FONT_S, 900); G.txt('點一顆鍵，右邊選要放的招', x + 14, y + 38, 10, C.dim, 'left', G.FONT, 500);
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const k in KP) { const [an, dd, r] = KP[k], px = Math.cos(an * Math.PI / 180) * dd, py = -Math.sin(an * Math.PI / 180) * dd;
      x0 = Math.min(x0, px - r * 1.15); x1 = Math.max(x1, px + r * 1.15 + (k === 'atk' ? 16 : 0)); y0 = Math.min(y0, py - r * 1.15); y1 = Math.max(y1, py + r * 1.15 + 8 + (k === 'atk' ? 16 : 0)); }
    const aw = lw - 24, ah = h - 62, sc = Math.min(aw / (x1 - x0), ah / (y1 - y0)), cx = x + 12 + (aw - (x1 - x0) * sc) / 2 - x0 * sc, cy = y + 52 + (ah - (y1 - y0) * sc) / 2 - y0 * sc;
    for (const k in KP) { const [an, dd, r] = KP[k], bx = cx + Math.cos(an * Math.PI / 180) * dd * sc + (k === 'atk' ? 16 * sc : 0), by = cy - Math.sin(an * Math.PI / 180) * dd * sc + (k === 'atk' ? 16 * sc : 0), rr = r * sc * 1.15, on = k === sel, nm = keyOfName(k);
      ctx.fillStyle = on ? 'rgba(150,92,36,.95)' : 'rgba(30,22,26,.95)'; ctx.beginPath(); ctx.arc(bx, by, rr, 0, 6.283); ctx.fill();
      ctx.strokeStyle = on ? '#fff3cf' : nm ? 'rgba(227,194,122,.7)' : 'rgba(227,194,122,.25)'; ctx.lineWidth = on ? 2.2 : 1; ctx.beginPath(); ctx.arc(bx, by, rr, 0, 6.283); ctx.stroke();
      G.txt(KD[k][0], bx, by - (k === 'atk' ? 0 : 5 * sc), k === 'atk' ? 16 : 11, on ? C.ink : C.gold, 'center', G.FONT_S, 900);
      if (k !== 'atk') G.txt(nm ? (nm.length > 4 ? nm.slice(0, 4) : nm) : '未設', bx, by + 8 * sc, 9, nm ? C.ink : C.dim, 'center', G.FONT, 700);
      if (k[0] === 'c') { const ch = d.keys[+k[1] - 1]; for (let j = 0; j < 3; j++) { ctx.fillStyle = ch[j] ? '#f3d98a' : 'rgba(255,255,255,.18)'; ctx.beginPath(); ctx.arc(bx - 7 + j * 7, by + rr + 6, 2.3, 0, 6.283); ctx.fill(); } }
      U.hit(bx - rr, by - rr, rr * 2, rr * 2, () => { M.sel.lvk = k; M.sel.lvseg = 0; }); }
    const rx = x + lw + 10, rw = w - lw - 10; U.box(rx, y, rw, h); G.txt(KD[sel][1], rx + 14, y + 20, 16, C.gold, 'left', G.FONT_S, 900);
    if (sel[0] === 'c') { const ci = +sel[1] - 1, ch = d.keys[ci], seg = M.sel.lvseg || 0;
      G.txt('連按依序出 3 段；最後一下打中後再按＝接下一招（省收招）', rx + 14, y + 42, 10, C.sub, 'left', G.FONT, 500);
      const sw = (rw - 28 - 16) / 3, sh = 46 * fs(); for (let j = 0; j < 3; j++) { const c = ch[j], on = j === seg, sx = rx + 14 + j * (sw + 8), sy = y + 54;
        ctx.fillStyle = on ? 'rgba(150,92,36,.9)' : 'rgba(30,22,26,.95)'; G.rr(sx, sy, sw, sh, 8); ctx.fill(); ctx.strokeStyle = on ? '#fff3cf' : 'rgba(227,194,122,.4)'; G.rr(sx + .5, sy + .5, sw - 1, sh - 1, 8); ctx.stroke();
        G.txt('第 ' + (j + 1) + ' 段', sx + sw / 2, sy + sh * 0.32, 10, on ? C.ink : C.gold, 'center', G.FONT, 700); G.txt(c ? META[c][1] : '（空）', sx + sw / 2, sy + sh * 0.7, 12, c ? C.ink : C.dim, 'center', G.FONT_S, 900);
        U.hit(sx, sy, sw, sh, () => { M.sel.lvseg = j; }); }
      const ty = y + 54 + sh + 10; U.button(rx + rw - 96, ty, 82, 28, '清除此段', ch[seg] ? () => { ch[seg] = null; G.SAVE.markDirty(); } : null, ch[seg] ? '' : 'off');
      G.txt('選擇第 ' + (seg + 1) + ' 段的招式（特技／奧義）', rx + 14, ty + 14, 11, C.gold, 'left', G.FONT, 700);
      rowList(rx, rw, ty + 36, y + h - 6, learned(KT[sel]).map(c => ({ c, n: META[c][1], s: sub(c) })), it => ch[seg] === it.c,
        it => { ch[seg] = it.c; G.SAVE.markDirty(); LD('lv_' + it.c).catch(() => {}); if (it.c === 'majinken_souga') LD('lv_majinken').catch(() => {}); if (seg < 2 && !ch[seg + 1]) M.sel.lvseg = seg + 1; }, '還沒有學會的特技／奧義（武器 › 技能）', 'lk:' + sel); }
    else if (KT[sel]) { const isU = sel === 'ult', k = sel === 'skB' ? 1 : 0, curC = isU ? d.ult : d.sp[k];
      G.txt(isU ? '秘奧義：「氣」集滿 100 時可用' : '晶術：詠唱後在目標位置施放（TP 10）', rx + 14, y + 42, 10, C.sub, 'left', G.FONT, 500);
      rowList(rx, rw, y + 56, y + h - 6, learned(KT[sel]).map(c => ({ c, n: META[c][1], s: sub(c) + (d.sp[0] === c ? '・在技A' : d.sp[1] === c ? '・在技B' : '') })), it => curC === it.c,
        it => { if (isU) d.ult = it.c; else { if (d.sp[1 - k] === it.c) d.sp[1 - k] = null; d.sp[k] = it.c; } G.SAVE.markDirty(); LD('lv_' + it.c).catch(() => {}); }, isU ? '還沒有學會的秘奧義' : '還沒有學會的晶術', 'lk:' + sel); }
    else if (sel === 'm1' || sel === 'm2') { const i = sel === 'm1' ? 0 : 1, sl = sl0.call(W);
      G.txt('身法沿用目前武器；閃身：推搖桿＝往該方向，不推＝後跳', rx + 14, y + 42, 10, C.sub, 'left', G.FONT, 500);
      rowList(rx, rw, y + 56, y + h - 6, wp.body.map(b => ({ id: b.id, n: b.n, s: '冷卻 ' + Math.round(b.cd / 6) / 10 + ' 秒' + (sl.M[0] === b.id ? '・在身1' : sl.M[1] === b.id ? '・在身2' : '') })), it => sl.M[i] === it.id, it => W.setM(i, it.id), '', 'lk:' + sel); }
    else { G.txt('普攻：用打刀的判定與刀光，動作是里歐的', rx + 14, y + 52, 12, C.ink, 'left', G.FONT, 700); G.txt('傷害照目前武器計算', rx + 14, y + 76, 10, C.sub, 'left', G.FONT, 500); } }
  function skillPage(x, y, w, h) { const U = M.ui, C = G.C, d = SAV(); boot(); if (!META || !UIU) { U.box(x, y, w, h); G.txt('載入中…', x + w / 2, y + h / 2, 13, C.sub, 'center'); return; }
    const lw = Math.min(320, w * 0.5), RH = Math.round(40 * fs()); U.box(x, y, lw, h);
    G.txt('里歐 Lv ' + d.lv + '　技能點 ' + d.pt, x + 14, y + 18, 11, d.pt ? '#8fd38f' : C.sub, 'left', G.FONT, 700);
    const tw = (lw - 24 - 18) / 4; CATS.forEach((t, i) => U.button(x + 12 + i * (tw + 6), y + 30, tw, 24, t, () => { ST.cat = i; ST.sel = null; }, i === ST.cat ? 'main' : ''));
    const cat = CATS[ST.cat], list = Object.keys(META).filter(c => typ(c) === cat).sort((a, b) => META[a][0] - META[b][0]); if (!ST.sel || typ(ST.sel) !== cat) ST.sel = list[0];
    const top = y + 60, off = U.scrollArea('lvSk', x, top, lw, h - (top - y) - 4, list.length * RH); U.clip(x, top, lw, h - (top - y) - 4);
    list.forEach((c, i) => { const yy = top + i * RH + off; if (yy + RH < top || yy > y + h) return; const lv = d.sk[c] || 0, lock = d.lv < META[c][3], on = c === ST.sel;
      ctx.fillStyle = on ? 'rgba(120,80,30,.45)' : 'rgba(255,255,255,.03)'; ctx.fillRect(x + 6, yy + 2, lw - 12, RH - 4); drawIc(c, x + 10, yy + 5, RH - 10, lock ? 0.35 : 1);
      G.txt(META[c][1], x + 16 + RH, yy + RH * 0.36, 13, lock ? C.dim : C.ink, 'left', G.FONT_S, 900);
      G.txt(lock ? '外觀 Lv ' + META[c][3] + ' 解鎖' : lv ? 'Lv ' + lv + (lv >= 5 ? '・極意' : '') : '未學會', x + 16 + RH, yy + RH * 0.72, 10, lock ? C.dim : lv ? C.gold : C.sub, 'left', G.FONT, 500);
      const kk = keyOf(c); if (kk >= 0) G.txt(KN[kk], x + lw - 16, yy + RH / 2, 11, C.gold, 'right', G.FONT, 900);
      U.hit(x + 6, Math.max(yy + 2, top), lw - 12, RH - 4, () => { ST.sel = c; }); });
    ctx.restore();
    const c = ST.sel, m = META[c], lv = d.sk[c] || 0, lock = d.lv < m[3], cx = x + lw + 10, cw = w - lw - 10; U.box(cx, y, cw, h);
    drawIc(c, cx + 14, y + 10, 40, lock ? 0.4 : 1); G.txt(m[1], cx + 62, y + 26, 20, C.ink, 'left', G.FONT_S, 900);
    G.txt(m[2] + '　' + (m[2] === '秘奧義' ? '需滿格「氣」' : 'TP ' + tpCost(c)) + '　' + (c === 'heal' ? '全隊回復' : c === 'majinken_souga' ? '1 斬＋2 道劍氣' : Math.max(1, m[10]) + ' 段') + '　倍率 ×' + (m[5] + m[6] * Math.max(0, lv - 1)).toFixed(2), cx + 62, y + 48, 11, C.gold, 'left', G.FONT, 700);
    ctx.font = `500 ${12 * fs()}px ${G.FONT}`; let yy = y + 78; const para = (t, col) => { G.wrap(t, cw - 32).forEach(l => { G.txt(l, cx + 16, yy, 12, col, 'left', G.FONT, 500); yy += 19 * fs(); }); yy += 4; };
    para(m[4], C.ink); para(lock ? '外觀 Lv ' + m[3] + ' 解鎖' : lv ? '目前 Lv ' + lv + '／5' : '尚未學會', lock ? C.dim : C.sub); para('Lv5 極意：' + m[8], lv >= 5 ? '#f3d98a' : C.sub);
    if (m[2] === '晶術') para('晶術：特效與範圍 ×1.6、施放加快，第一段命中後在目標附近再放一次', C.sub); if (LING[c]) para('黑火：收招後留在原地 3 秒，每 0.5 秒燒 8%', C.sub);
    const by = y + h - 42, ks = m[2] === '晶術' ? [3, 4] : m[2] === '秘奧義' ? [5] : [0, 1, 2], bw = (cw - 28 - 8 * ks.length) / (ks.length + 1);
    U.button(cx + 14, by, bw, 30, lv >= 5 ? '已滿級' : lv ? '升級 ' + lv + '點' : '學會 1點', () => learn(c), lv >= 5 || lock ? 'off' : 'main');
    ks.forEach((i, n) => U.button(cx + 14 + (n + 1) * (bw + 8), by, bw, 30, '設為' + KN[i], () => equip(c, i), lv ? (keyOf(c) === i ? 'main' : '') : 'off')); }
  /* 職業頁：暫時把「里歐」當成清單最後一列畫出（右側面板由 panel 蓋掉） */
  const GR = G.GROW, pj0 = M.PAGE['職業'];
  if (GR && pj0) { const rq0 = GR.reqText;
    M.PAGE['職業'] = function (x, y, w, h) { const ul = unlocked(), d = SAV(), j = GR.jd(), sel = M.sel.job === 'leon';
      const fake = { id: 'leon', n: ul ? '里歐（外觀）' + (d.on ? '　◇' : '') : '？？？', fac: '外觀', max: CAP, req: ul ? null : ['leon', 1, 1], ab: [], trait: ['—', ''] };
      GR.JOBS.push(fake); GR.JB.leon = fake; const lv0 = j.lv.leon; j.lv.leon = ul ? d.lv : 0; GR.reqText = function (job) { return job && job.id === 'leon' ? '任一難度通關' : rq0.call(GR, job); };
      try { pj0.apply(this, arguments); } finally { GR.JOBS.pop(); delete GR.JB.leon; if (lv0 === undefined) delete j.lv.leon; else j.lv.leon = lv0; GR.reqText = rq0; }
      if (sel) { const lw = Math.min(280, w * 0.44); if (M.area) M.area = M.area.filter(a => a.key !== 'job'); panel(x + lw + 10, y, w - lw - 10, h); } };   /* 拿掉底下職業頁的捲動區（不然拖曳會捲到它） */
    const ss0 = GR.setSkin; GR.setSkin = function (id) { if (id !== 'leon' && G.SAVE.data.leon && G.SAVE.data.leon.on) setOn(0); return ss0.apply(this, arguments); };   /* 換回其他職業外觀＝關掉里歐 */
    /* 開里歐外觀時：武器 › 技能／按鍵 改顯示里歐面板（同一份資料） */
    for (const pg of ['技能', '按鍵']) { const p0 = M.PAGE[pg]; if (p0) M.PAGE[pg] = function (x, y, w, h) { if (!on()) return p0.apply(this, arguments); (pg === '技能' ? skillPage : keyPage)(x, y, w, h); }; }
    if (M.GROUPS) { const g = M.GROUPS.find(q => q[0] === '角色'); if (g) { const i = g[1].findIndex(q => q[1] === '里歐'); if (i >= 0) g[1].splice(i, 1); } }   /* 拿掉舊的「角色 › 里歐」分頁 */
  }
  const boot2 = () => { if (unlocked()) boot(); }; setTimeout(boot2, 2000); setInterval(boot2, 15000);
  G.LEON = { on, boot, start, SAV, need, LD, open: c => !!(META && META[c] && OPEN[META[c][2]]), get META() { return META; }, get CUR() { return CUR; }, get CASTS() { return CASTS; }, REFH: () => REFH, press, fire, equip, setOn, tpGain, tpCost, kOf, set SLK(v) { SLK = v; }, get SLK() { return SLK; } };
})();
