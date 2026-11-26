/* ==========================================================================
 * 神諭之地 重製版 — 66_lines.js
 * Version : r3.111.0  (2026-11-26)　r3.111.0：妖怪委託精英：困難以上等級改由 139_foeai 換算（避免主角等級加兩次）
 * 舊版    : r3.29.0  (2026-11-16)
 * 變更    : r3.29.0 新增。匯入三份補充台詞（a/text/npc_daily.json、party_banter.json、battle_yokai.json）。
 *           ・路人：ROLE／GREET／CONV／SHOPHI 整份換新（CONV 的炭里改到「炭里長屋」W_R05_05）；FIELD／CAST／PLACE 不動。
 *           ・夥伴閒聊：8 位的 idle／enter／home／stage／lvup／loot 換新，夥伴對話（含三人）換新；舊的 place 區域台詞停用。
 *           ・戰鬥喊話：開戰、大招、主角低血、自己低血、扶起同伴、擊倒、清場（險勝／輕鬆）、換武器、背包滿、各頭目開戰。
 *             只有出戰位上的夥伴會喊；戰鬥喊話冷卻 8 秒，不擋閒聊太久。
 *           ・妖怪村：善良頭目可以「交談」（第一次閒聊→第二次提示隱藏頭目→之後兩段閒聊輪流），頭上泡泡換新台詞。
 *             可接「妖怪委託」：到已開放章節的一張野外地圖清掉 3～5 隻精英，回村回報拿錢與經驗；同一位頭目完成後 30 分鐘才有新委託，同時只能接一件。
 * 依賴    : 10_banter（G.BANTER）、63_text（G.TEXT.ok／slots）、20_npcdata（G.NPCD）、49_party（G.PARTY）、58_forge（妖怪村頭目）、52_hub（HUB.ids）。
 * ========================================================================== */
'use strict';
(function () {
  const B = G.BANTER, T = G.TEXT, PY = G.PARTY, R = G.RPG, HUB = G.HUB, F = () => G.SAVE.data.flags; if (!B || !T) return;
  const PN = { shiro: '白丸', hayate: '颯', kuzuha: '葛葉', ibaraki: '茨木童子', shion: '汐音', yorimitsu: '源賴光', takemikazuchi: '建御雷', enno: '役小角' };
  const ok = l => !l.cond || T.ok(l.cond), nm = id => (G.D.scenes[id] || {}).name || id, rnd = a => a[Math.floor(Math.random() * a.length)];
  const LN = G.LINES = { npc: 0, banter: 0, battle: 0, yokai: 0 };
  /* ---------- 1. 路人 ---------- */
  function npc(d) { const D = G.NPCD; if (!D || !d) return; for (const k of ['ROLE', 'GREET', 'CONV', 'SHOPHI']) if (d[k]) D[k] = d[k]; D.CONV._ = D.CONV._ || []; LN.npc = 1; }
  /* ---------- 2. 夥伴閒聊 ---------- */
  function banter(d) { if (!d || !d.lines) return;
    for (const id in d.lines) { const s = d.lines[id], o = B.L[id] || (B.L[id] = { face: null, name: PN[id] || id }); for (const k of ['idle', 'enter', 'home', 'stage', 'lvup', 'loot']) if (s[k]) o[k] = s[k]; delete o.place; }
    if (Array.isArray(d.pairs) && d.pairs.length) { B.PAIR.length = 0; for (const p of d.pairs) B.PAIR.push(p); } LN.banter = 1; }
  /* ---------- 3. 戰鬥喊話 ---------- */
  const BT = {}, last = {}; let bcd = 0, bagCd = 0, wpnPend = 0;
  function battle() { for (const id in PN) { const s = T.slots['battle:' + id]; if (!s) continue; const m = BT[id] = {}; for (const l of s.lines) (m[l.tag] = m[l.tag] || []).push(l); } LN.battle = Object.keys(BT).length; }
  const joined = id => id === 'shiro' ? !!F().shiroJoin : !!F()['join_' + id];
  const party = () => (PY && PY.slots ? PY.slots() : []).filter(id => id && BT[id] && joined(id));
  function bark(tag, who, force, ex) { if (G.mode !== 'play' || B.cur || G.DLG.active()) return false; if (bcd > 0 && !force) return false;
    const c = (who ? [who] : party()).filter(id => id !== ex && party().includes(id) && (BT[id][tag] || []).some(ok)); if (!c.length) return false;
    const id = rnd(c), L = BT[id][tag].filter(ok); let l; for (let i = 0; i < 4; i++) { l = rnd(L); if (l.text !== last[id]) break; } last[id] = l.text;
    const cd0 = B.cd; if (!B.say(id, l.text, true)) return false; B.cd = Math.max(cd0, 6 * 60); bcd = 8 * 60; return true; }
  G.LINES.bark = bark;
  const BN = { '白九尾': '九尾', '雷獸王': '雷獸', '綿津見大神': '綿津見', '大禍津日神': '大禍津日' };   // 頭目註冊名 → 台詞 tag 名
  const tr0 = B.trigger.bind(B);
  B.trigger = function (kind, force) { if (!LN.battle) return tr0(kind, force);
    if (kind === 'fight') return void bark('start');
    if (kind === 'low') return void bark('heroLow', null, true);
    if (kind === 'clear') { const H = G.H, r = H.hp / H.hpMax; return void bark(r < 0.35 ? 'close' : r > 0.85 ? 'easy' : 'clear', null, true); }
    if (kind === 'boss') { const e = G.BOSS && G.BOSS.enc; if (e && bark('boss:' + (BN[e.name] || e.name), null, true)) return; return void bark('start', null, true); }
    return tr0(kind, force); };
  const k0 = R.onKill.bind(R); R.onKill = function (e) { k0(e); try { yKill(e); if (!e || e.bb || !LN.battle || Math.random() > 0.3) return; if (G.E.some(o => o !== e && o.st !== 'dead' && o.delay <= 0)) bark('kill'); } catch (x) {} };
  if (PY && PY.cast) { const c0 = PY.cast; PY.cast = function (P, mv) { const r = c0.apply(this, arguments); if (r && mv === 'grandCombo' && P) bark('ult', P.id, true); return r; }; }
  if (G.WPN && G.WPN.equip) { const w0 = G.WPN.equip.bind(G.WPN); G.WPN.equip = function (id) { const a = G.WPN.curId && G.WPN.curId(), r = w0(id); if (id !== a && G.mode === 'play') wpnPend = 30; return r; }; }
  const eq0 = R.equip.bind(R); R.equip = function (i) { const it = R.d().bag[i], r = eq0(i); if (r && it && R.TPL[it.t] && R.TPL[it.t].slot === 'weapon') wpnPend = 30; return r; };
  const to0 = G.UI.toast.bind(G.UI); G.UI.toast = function (m) { to0.apply(G.UI, arguments); if (typeof m === 'string' && /背包已滿/.test(m) && bagCd <= 0) { if (bark('bagFull', null, true)) bagCd = 40 * 60; } };
  const bn0 = G.UI.banner.bind(G.UI); G.UI.banner = function (t) { bn0.apply(G.UI, arguments); if (t === '暴走的蛟幼體') setTimeout(() => { B.cur = null; bark('boss:暴走的蛟幼體', null, true); }, 1200); };   // 第二章交給河童的路線不經過頭目開場
  const st0 = B.step.bind(B); B.step = function () { st0(); if (bcd > 0) bcd--; if (bagCd > 0) bagCd--;
    if (wpnPend > 0 && !G.MENU.open && --wpnPend === 0) bark('weapon', null, true);
    if (!LN.battle || !PY || !PY.list) return;
    for (const P of PY.list) { const dn = P.st === 'down';
      if (P.wasDown && !dn) bark('revive', null, true, P.id); P.wasDown = dn;
      if (!dn && P.hpMax && P.hp < P.hpMax * 0.3 && !P.lowSaid) { P.lowSaid = 1; bark('selfLow', P.id, true); } if (P.hpMax && P.hp > P.hpMax * 0.6) P.lowSaid = 0; } };
  /* ---------- 4. 妖怪村：交談、提示、委託 ---------- */
  const YV = { '鎌鼬長兄': 'c1_b_patrol', '河童大將': 'c2_b_mud', '九尾': 'c3_b_gift', '雷獸': 'c4_b_guard', '須佐之男': 'c6_b_sword', '長壁姬': 'c7_b_pages', '酒吞童子': 'c8_b_sake', '綿津見': 'c10_b_fest' };
  const yl = (q, k, tag) => { const s = T.slots['yokai:' + q + ':' + k]; return s ? s.lines.filter(l => (!tag || l.tag === tag) && ok(l)).map(l => ({ who: l.who || '', text: l.text })) : []; };
  const CD = 30 * 60 * 1000, RQ = () => G.SAVE.data.yreq || null, live = () => G.NPC.filter(n => n.anim && n.hx !== undefined && YV[n.name]);
  function pickMap() { const S = G.D.scenes, M = (G.WORLD && G.WORLD.meta) || {}, out = [];
    for (let c = 1; c <= Math.min(12, HUB.cur()); c++) for (const id of HUB.ids(c)) { const d = S[id], m = M[id] || {}; if (d && !d.boss && !d.town && !d.safe && !m.safe && !d.quest && (m.foes || []).length) out.push(id); }
    return out.length ? rnd(out) : null; }
  function accept(q, map, title) { const n = 3 + Math.floor(Math.random() * 3); G.SAVE.data.yreq = { q, map, n, k: 0, title }; G.SAVE.markDirty(); G.UI.banner('妖怪委託・' + title, '到「' + nm(map) + '」清掉 ' + n + ' 隻精英妖怪'); }
  function finish(q, who) { const d = R.d(), lv = d.lv || 1, g = 80 + lv * 12, x = 60 + lv * 10; d.gold += g; R.gainExp(x);
    (G.SAVE.data.yreqT = G.SAVE.data.yreqT || {})[q] = Date.now(); G.SAVE.data.yreq = null; G.SAVE.markDirty(); G.UI.toast(who + '的委託完成　錢 +' + g + '　經驗 +' + x); }
  function reqMenu(o, q) { const r = RQ(), t0 = (G.SAVE.data.yreqT || {})[q] || 0;
    if (r && r.q === q) { if (r.k >= r.n) return { choice: [{ label: '回報委託', then: yl(q, 'req', 'done').concat([{ do: () => finish(q, o.name) }]) }, { label: '之後再說', then: [] }] };
      return { choice: [{ label: '委託進度', then: [{ who: '', text: '（「' + r.title + '」：到「' + nm(r.map) + '」清掉精英妖怪　' + r.k + '／' + r.n + '）' }] },
        { label: '放棄委託', then: [{ do: () => { G.SAVE.data.yreq = null; G.SAVE.markDirty(); G.UI.toast('已放棄委託'); } }] }, { label: '離開', then: [] }] }; }
    if (r || Date.now() - t0 < CD) return null;
    const map = pickMap(), T3 = yl(q, 'req', 'title'); if (!map || !T3.length) return null; const title = rnd(T3).text;
    return { choice: [{ label: '接委託・' + title, then: yl(q, 'req', 'ask').concat([{ do: () => accept(q, map, title) }]) }, { label: '不了', then: [] }] }; }
  function ytalk(o) { const q = YV[o.name], f = F(), k = 'yt_' + q, v = f[k] || 0; f[k] = v + 1; G.SAVE.markDirty(); o.tx = null; o.say = null;
    let seg = v === 0 ? 'talk1' : v === 1 && !f['yh_' + q] ? 'hint' : v % 2 ? 'talk1' : 'talk2'; let L = yl(q, seg);
    if (seg === 'hint') { if (L.length) f['yh_' + q] = 1; else L = yl(q, 'talk2'); }
    if (!L.length) L = [{ who: o.name, text: (o.lines || ['……'])[0] }];
    const m = reqMenu(o, q); G.DLG.start(L.concat(m ? [m] : [])); }
  const sy0 = G.STORY.step.bind(G.STORY); G.STORY.step = function () { sy0(); if (G.SC.id !== 'T_yokai' || (G.UI.near && !G.UI.near.amb) || G.DLG.active()) return; let best = 70, p = null;
    for (const o of live()) { const d = Math.hypot(G.H.x - o.x, (G.H.y - o.y) * 1.6); if (d < best) { best = d; p = o; } }
    if (p) { const r = RQ(), tag = r && r.q === YV[p.name] ? (r.k >= r.n ? '（回報委託）' : '（委託中）') : ''; G.UI.near = { label: p.name + tag, kind: 'talk', run: () => ytalk(p) }; } };
  /* 委託目標地圖：進場生精英；擊倒計數 */
  function spawnReq() { const r = RQ(); if (!r || G.SC.id !== r.map || r.k >= r.n) return; const m = (G.WORLD.meta[r.map] || {}), foes = (m.foes || []).slice(); if (!foes.length) return;
    G.UI.banner('妖怪委託・' + r.title, '精英妖怪　' + r.k + '／' + r.n);
    Promise.resolve(G.ASSET.enemies(foes)).then(() => { const r2 = RQ(); if (!r2 || G.SC.id !== r2.map) return; const H = G.H, lv = (G.FOEAI && G.FOEAI.on() ? (G.SC.def.lv || 1) : Math.max(G.SC.def.lv || 1, R.d().lv || 1)) + 1;   /* r3.111.0：困難以上交給 139 換算 */
      for (let i = r2.k; i < r2.n; i++) for (let t = 0; t < 30; t++) { const a = Math.random() * 6.283, d = 280 + Math.random() * 280, x = H.x + Math.cos(a) * d, y = H.y + Math.sin(a) * d * 0.5;
        if (!G.SC.walkable(x, y)) continue; const e = G.spawnOni(x, y, 40 + i * 20, lv, rnd(foes)); if (!e) break; e.elite = 1; e.yq = 1; e.hp = e.hpMax = Math.round(e.hpMax * 4); e.atk = Math.round(e.atk * 1.3); e.ratio = (e.ratio || 1) * 1.15; break; } }, () => 0); }
  function yKill(e) { const r = RQ(); if (!e || !e.yq || !r || G.SC.id !== r.map || r.k >= r.n) return; r.k++; G.SAVE.markDirty();
    if (r.k >= r.n) { const who = Object.keys(YV).find(k => YV[k] === r.q); G.UI.banner('委託完成', '回妖怪村向' + who + '回報'); } else G.UI.toast('精英妖怪　' + r.k + '／' + r.n); }
  const en0 = G.STORY.onEnter.bind(G.STORY); G.STORY.onEnter = function (id) { en0(id); try {
    if (id === 'T_yokai') for (const o of live()) { const b = yl(YV[o.name], 'bubble').map(l => l.text); if (b.length) o.lines = b; }
    if (RQ() && RQ().map === id) G.STORY.later ? G.STORY.later(60, spawnReq) : spawnReq(); } catch (x) { console.warn('lines', x); } };
  const ud0 = G.UI.draw; G.UI.draw = function () { ud0(); const r = RQ(); if (!r || G.SC.id !== r.map || G.mode !== 'play') return;
    G.txt('妖怪委託・' + r.title + '　精英 ' + r.k + '／' + r.n + (r.k >= r.n ? '　回妖怪村回報' : ''), G.LW / 2, 64 + G.SAFE.t, 12, '#e3c27a', 'center', G.FONT_S, 900); };
  /* ---------- 5. 開機載入 ---------- */
  const get = f => fetch('a/text/' + f + '?v=' + G.VER).then(x => x.ok ? x.json() : null).catch(() => null);
  const boot0 = G.ASSET.boot.bind(G.ASSET);
  G.ASSET.boot = () => boot0().then(r => Promise.all([get('npc_daily.json'), get('party_banter.json')]).then(([a, b]) => { try { npc(a); banter(b); battle(); } catch (x) { console.warn('lines', x); } LN.yokai = Object.keys(T.slots).filter(k => /^yokai:/.test(k)).length; return r; }));
})();
