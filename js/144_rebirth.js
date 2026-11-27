/* ==========================================================================
 * 神諭之地 重製版 — 144_rebirth.js
 * Version : r3.205.0  (2026-11-28)　r3.205.0：內殿伊邪那美恢復待機動畫、面向主角；對話時不再多走出一個
 * 舊版    : r3.204.0  (2026-11-28)　r3.204.0：伊邪那美的名字標籤移到頭上
 * 舊版    : r3.202.0  (2026-11-28)　r3.202.0：內殿拿掉祈願石；伊邪那美縮小、固定站姿不再抖
 * 舊版    : r3.201.0  (2026-11-28)　r3.201.0：內殿人物放大約 2 倍、鏡頭拉近
 * 舊版    : r3.169.0  (2026-11-27)　r3.169.0：內殿換 ChatGPT 新圖，可走範圍／伊邪那美／出口位置重定，人物比例同野外
 * 舊版    : r3.121.0  (2026-11-26)　r3.121.0：轉生保留里歐外觀（等級、招式、按鍵）
 * 舊版    : r3.119.1  (2026-11-26)　r3.119.1：內殿鏡頭往上偏（祭壇入鏡）
 * 舊版    : r3.119.0  (2026-11-26)
 * 變更    : r3.119.0 新增。平衡第 11 步：轉生（神社內殿・伊邪那美）。
 *           ・開放：任一難度通關後，神社出現「內殿」入口（hub_shrine_inner，Gemini 內殿圖 N_EXSH）；伊邪那美立於祭壇前（頭目圖待機動作）。
 *           ・轉生＝從序章重頭開始，可選同級或更高難度（只列已開放的）。
 *           ・一定保留：通關紀錄、轉生次數、設定；名物裝備（it.uq，放進背包）；隱藏夥伴（源賴光／建御雷／役小角，直接加入、資料保留）；
 *             頭目好感與禮物（入住頭目不保留，需照劇情重新入住）；故事夥伴的技能點全數變成下一輪的額外點數（PARTY.earned＋rb.pb）。
 *           ・可選繼承（第 1 次 2 項、第 2 次 3 項、第 3 次起全部）：等級與巔峰／技能與修練（技能點、武器熟練與招式、修練、天命、職業）／勾玉／錢與素材（含難度素材、妖玉、藥）。
 *           ・敵人等級：第二輪 +20、第三輪 +50、第四輪 +75、第五輪以後 +100（加在地圖等級），且不低於主角（139_foeai.lvOf）。
 *           ・流程：說明 → 勾選繼承 → 選難度 → 列出保留／失去 → 兩次確認 → 存檔後重新載入，回到標題「繼續旅程」即從序章開始。
 * 存檔    : save.rb = { n: 已轉生次數, pb: {夥伴: 額外技能點}, hist: [[時間, 難度, 繼承]] }。
 * 依賴    : 07_rpg（fresh／d）、49_party／51_party_grow（comp、earned）、73_diff（GDIFF.open／cleared）、26_boss（b_izanami 圖）、52_hub（marks／travel）、18_world（WORLD.meta）。
 * ========================================================================== */
'use strict';
(function () {
  const SC = G.SC, H = G.H, S = () => G.SAVE.data, F = () => G.SAVE.data.flags, say = (who, text) => ({ who, text }), act = fn => ({ do: fn });
  const ID = 'hub_shrine_inner', HIDDEN = ['yorimitsu', 'takemikazuchi', 'enno'], RBB = [0, 20, 50, 75, 100];
  const rbN = () => (S().rb && S().rb.n) || 0;
  G.REBIRTH = { bonus: () => RBB[Math.min(4, rbN())], n: rbN };
  const cleared = () => !!F().gameClear || [0, 1, 2, 3, 4].some(i => G.GDIFF && G.GDIFF.cleared && G.GDIFF.cleared(i));
  /* ---------- 夥伴額外技能點 ---------- */
  (function hkP() { const PY = G.PARTY; if (!PY || !PY.earned) return setTimeout(hkP, 80); const e0 = PY.earned; PY.earned = id => e0(id) + (((S().rb || {}).pb || {})[id] || 0); })();
  /* ---------- 內殿場景 ---------- */
  const OUT = [[0, 499], [1672, 499], [1672, 743], [0, 743]];   // r3.169.0：ChatGPT 新內殿圖（地板 50% 起；只取上半段）
  function reg() { if (!G.D || !G.D.scenes || G.D.scenes[ID]) return; G.D.scenes[ID] = { name: '神社・內殿', w: 1672, h: 941, outer: OUT, obstacles: [], start: [120, 580], nodes: { west_arrival: [120, 580], center: [836, 600], altar: [836, 520] }, portals: [], safe: true, region: 'wind', lv: 1, foes: [], depth: [2.0, 2.4], noSave: true };   /* r3.201.0：內殿的圖畫得比野外大（祭壇、燭台都是近景比例），人物放大約 2 倍才對得上 */   /* r3.169.0：新圖比例同野外圖 */
    if (G.WORLD && G.WORLD.meta) G.WORLD.meta[ID] = { safe: true, town: true, lv: 1, spawn: [0, 0], foes: [], mats: [] }; }
  const img0 = G.ASSET.img.bind(G.ASSET); G.ASSET.img = (k, src) => img0(k, k === ID ? 'a/m/N_EXSH.webp' : src);
  const boot0 = G.ASSET.boot.bind(G.ASSET); G.ASSET.boot = () => boot0().then(r => { try { reg(); } catch (e) { console.warn('rebirth reg', e); } return r; });
  /* ---------- 伊邪那美（祭壇前，頭目圖待機） ---------- */
  let IZ = null;
  function placeIz() { G.NPC = G.NPC.filter(n => !n._iz); IZ = null; if (SC.id !== ID) return; const n = { _iz: 1, name: '', label: '伊邪那美', x: 836, y: 530, t: 0 };   /* r3.205.0：label＝讓對話登場系統知道她已經在場，不要再走出第二個 */ IZ = n; G.NPC.push(n);
    Promise.resolve(G.BOSS && G.BOSS.load && G.BOSS.load('izanami')).catch(() => 0); }
  (function hkD() { if (!G.drawNpc) return setTimeout(hkD, 60); const d0 = G.drawNpc; G.drawNpc = function (n) { if (!n || !n._iz) return d0.apply(this, arguments);
      const u = G.ANIM.get('b_izanami'), r = u && u.act.izanami_idle_right3q; if (!r) return; n.t++; const f = r.f[Math.floor(n.t / 10) % r.f.length], L = r.f.map(q => q[5]).sort((a, b) => a - b), vh = L[L.length >> 1] || 200, s = SC.depth(n.y), sc = G.HERO_H * 1.05 * s / vh, c = G.ctx;   /* r3.205.0：對位修好後恢復待機動畫（衣袖、頭髮會動，不再左右抖）；面向主角 */   /* r3.202.0：伊邪那美固定站姿（原本各格對位不齊，看起來一直抖）、縮到跟主角差不多高 */
      c.save(); c.fillStyle = 'rgba(20,14,8,.25)'; c.beginPath(); c.ellipse(n.x, n.y, G.HERO_H * s * 0.35, G.HERO_H * s * 0.08, 0, 0, 6.283); c.fill(); c.restore();
      G.ANIM.draw(u, f, n.x, n.y, sc, G.H.x < n.x, Math.min(1, n.t / 30)); }; })();
  /* ---------- 入口／出口／伊邪那美互動點 ---------- */
  function marks() { if (!G.HUB || !G.HUB.marks) return; const M = G.HUB.marks;
    if (SC.id === 'hub_shrine' && cleared() && !M.some(m => m.id === 'rb_in')) { const d = SC.def, c = (d.nodes || {}).center || d.start || [800, 575], p = (SC.snap && SC.snap(c[0] + 140, c[1] - 30, 'open', 200)) || c;
      M.push({ id: 'rb_in', q: 1, x: p[0], y: p[1], label: '內殿', kind: 'look', main: false, run: () => G.HUB.travel(0, '你們推開內殿的門，空氣忽然冷了下來……', [], ID) }); }
    if (SC.id === ID) { if (!M.some(m => m.id === 'rb_out')) M.push({ id: 'rb_out', q: 1, x: 150, y: 580, label: '離開內殿', kind: 'look', main: false, run: () => G.HUB.travel(0, '', [], 'hub_shrine') });
      if (!M.some(m => m.id === 'rb_iz')) M.push({ id: 'rb_iz', q: 1, x: 836, y: 560, label: '伊邪那美', kind: 'talk', main: false, lh: 1.3, run: ritual }); } }
  (function hkE() { if (!G.STORY || !G.STORY.onEnter) return setTimeout(hkE, 60); const en0 = G.STORY.onEnter.bind(G.STORY); G.STORY.onEnter = function (id) { const r = en0(id); try { reg(); placeIz(); } catch (e) {} G.STORY.later(10, marks); return r; };
    const st0 = G.STORY.step.bind(G.STORY); let tk = 0; G.STORY.step = function () { st0(); if (++tk % 30 === 0) try { marks(); } catch (e) {} }; })();
  /* ======================= 轉生儀式 ======================= */
  const CAT = [['lv', '等級與巔峰'], ['skill', '技能與修練'], ['gem', '勾玉'], ['money', '錢與素材']];
  const quota = () => Math.min(CAT.length, 2 + rbN());
  const DN = () => (G.GDIFF || []).map ? G.GDIFF.map(x => x.n) : ['輕鬆', '普通', '困難', '修羅', '無間'];
  let SEL = null, DIF = 1;
  function ritual() {
    if (!cleared()) return G.DLG.start([say('伊邪那美', '……你的這一輪，還沒有走到盡頭。'), say('伊邪那美', '等你立下最後的約定，再來找我。')]);
    const n = rbN(); SEL = new Set(); DIF = S().gdiff === undefined ? 1 : S().gdiff;
    G.DLG.start([say('伊邪那美', n ? '你又來了。第 ' + (n + 1) + ' 次的輪迴……還不夠嗎？' : '生與死的界線，我守了很久。你想再走一次這條路？'),
      say('伊邪那美', '轉生之後，一切從頭開始。你結下的緣、走過的路，都會歸於塵土。'),
      say('伊邪那美', '但你可以帶走一些東西——名物、隱藏夥伴、妖怪們的心意，還有夥伴們磨練出的技藝。'),
      say('伊邪那美', '其餘的，你最多能選 ' + quota() + ' 項帶走。下一輪，敵人會更強（等級 +' + RBB[Math.min(4, n + 1)] + '，且不低於你）。')], pick); }
  function pick() { const q = quota(), left = q - SEL.size;
    G.DLG.start([say('伊邪那美', '要帶走什麼？（還能選 ' + left + ' 項）'), { choice: CAT.map(([k, nm]) => ({ label: (SEL.has(k) ? '☑ ' : '☐ ') + nm, then: [act(() => { if (SEL.has(k)) SEL.delete(k); else if (SEL.size < q) SEL.add(k); else G.UI.toast('最多選 ' + q + ' 項'); G.STORY.later(1, pick); })] }))
      .concat([{ label: '下一步：選難度', then: [act(() => G.STORY.later(1, diff))] }, { label: '先不轉生', then: [] }]) }]); }
  function diff() { const dn = DN(), cur = S().gdiff === undefined ? 1 : S().gdiff, L = []; for (let i = cur; i <= 4; i++) if (i === cur || (G.GDIFF.open && G.GDIFF.open(i))) L.push(i);
    G.DLG.start([say('伊邪那美', '下一輪的難度？（只能同級或更高）'), { choice: L.map(i => ({ label: dn[i] + (i === cur ? '（目前）' : ''), then: [act(() => { DIF = i; G.STORY.later(1, sum); })] })).concat([{ label: '返回', then: [act(() => G.STORY.later(1, pick))] }]) }]); }
  function sum() { const dn = DN(), keep = CAT.filter(([k]) => SEL.has(k)).map(c => c[1]), lose = CAT.filter(([k]) => !SEL.has(k)).map(c => c[1]);
    G.DLG.start([say('', '【保留】名物裝備、隱藏夥伴、頭目好感與禮物、夥伴技能點（轉成額外點數）' + (keep.length ? '、' + keep.join('、') : '')),
      say('', '【失去】主線與支線進度、章節、頭目紀錄、一般裝備、入住頭目' + (lose.length ? '、' + lose.join('、') : '') + '。'),
      say('', '難度：' + dn[DIF] + '　敵人等級 +' + RBB[Math.min(4, rbN() + 1)]),
      { choice: [{ label: '轉生', then: [act(() => G.STORY.later(1, confirm2))] }, { label: '重新選擇', then: [act(() => G.STORY.later(1, pick))] }, { label: '先不轉生', then: [] }] }]); }
  function confirm2() { G.DLG.start([say('伊邪那美', '……最後一次。踏進黃泉之門，就回不了頭了。'), { choice: [{ label: '我確定', then: [act(doRebirth)] }, { label: '再想想', then: [] }] }]); }
  /* ---------- 執行 ---------- */
  function doRebirth() { const old = JSON.parse(JSON.stringify(S())), od = old.rpg || {}, PY = G.PARTY, pb = {};
    for (const id in (od.comp || {})) { if (HIDDEN.includes(id)) continue; try { pb[id] = PY && PY.earned ? PY.earned(id) : 0; } catch (e) {} }
    G.SAVE.newGame(); const s = S(); s.rpg = G.RPG.fresh(); const d = s.rpg, f = s.flags;
    s.rb = { n: ((old.rb && old.rb.n) || 0) + 1, pb, hist: ((old.rb && old.rb.hist) || []).concat([[Date.now(), DIF, [...SEL]]]) };
    s.gdiff = DIF; f.runMin = DIF; for (const k in (old.flags || {})) if (/^clear_/.test(k) || k === 'gameClear') f[k] = old.flags[k];
    for (const id of HIDDEN) if (old.flags && old.flags['join_' + id]) { f['join_' + id] = 1; if (od.comp && od.comp[id]) d.comp[id] = od.comp[id]; }
    if (old.yaff) s.yaff = old.yaff; if (old.leon) s.leon = old.leon; if (old.ygift) s.ygift = old.ygift;
    const uq = (od.bag || []).concat(Object.values(od.eq || {})).filter(it => it && it.uq); d.bag = uq.slice(0, d.bagMax || 60);
    if (SEL.has('lv')) { d.lv = od.lv || 1; d.exp = od.exp || 0; d.pk = od.pk || 0; d.pp = od.pp || 0; }
    if (SEL.has('skill')) for (const k of ['sp', 'wp', 'wsk', 'wslot', 'train', 'fate', 'job']) if (od[k] !== undefined) d[k] = od[k];
    if (SEL.has('gem')) { if (od.mg) d.mg = od.mg; }
    if (SEL.has('money')) for (const k of ['gold', 'mats', 'dm', 'yg', 'cons']) if (od[k] !== undefined) d[k] = od[k];
    /* 第二輪起勾玉直接開放：129 canOpen 讀 flags.gameClear（已保留） */
    d.uid = Math.max(d.uid || 2, od.uid || 2); G.SAVE.dirty = true; G.SAVE.flush();
    G.UI.banner('轉生', '第 ' + (s.rb.n + 1) + ' 輪・' + DN()[DIF]); setTimeout(() => { try { location.reload(); } catch (e) { G.toTitle && G.toTitle(); } }, 1600); }
  /* r3.119.1：內殿鏡頭拉遠（可視高度至少 75% 房間）並往上偏，祭壇與伊邪那美入鏡 */
  (function hkC() { if (!SC.camTarget || !SC.view || !SC.zoom) return setTimeout(hkC, 60); const z0 = SC.zoom; SC.zoom = function () { const z = z0.apply(this, arguments); return SC.id === ID && SC.def ? Math.min(z, G.LH / (SC.def.h * 0.62)) : z; }; const ct0 = SC.camTarget.bind(SC); SC.camTarget = function () { const t = ct0(); if (SC.id !== ID || !SC.def) return t; const { vh } = SC.view();
      return { x: t.x, y: Math.max(vh / 2, Math.min(SC.def.h - vh / 2, t.y - vh * 0.28)) }; }; })();
  G.REBIRTH.ritual = ritual; G.REBIRTH.cleared = cleared; G.REBIRTH.ID = ID;
  G.REBIRTH._do = (sel, dif) => { SEL = new Set(sel); DIF = dif; doRebirth(); };
})();
