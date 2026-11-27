/* ==========================================================================
 * 神諭之地 重製版 — 67_cast.js
 * Version : r3.159.0  (2026-11-27)　r3.159.0：兩岸城攻防篇講話者圖（冬馬、孫六、甚藏、真穗、鬼女、被綁住的小妖、玄符）
 * 舊版    : r3.151.3  (2026-11-27)　r3.151.3：借用同名路人當任務 NPC 時也開啟原地小走動（阿德這類後續對話 NPC 原本聊完就站著）
 * 舊版    : r3.141.0  (2026-11-27)　r3.141.0：補劇情角色指定圖（新劇情 14 人＋小河童／人魚）；任務加人時同圖已有劇情專用人物（鐵心、小雪…）→ 不另生，任務記號移到他身上（原 156_castfix 併入）
 * 舊版    : r3.127.4  (2026-11-27)　r3.127.4：戰鬥類事件（入侵、據點、伏擊…）在章節地圖的村莊也讓村民退場
 * 舊版    : r3.127.2  (2026-11-27)　r3.127.2：同名合併跳過 noMerge（救援事件的 4 名士兵）
 * 舊版    : r3.52.0  (2026-11-23)　r3.52.0：世界／隨機事件期間，任務要找的人不退場（原本整村的人藏起來，任務只剩地上的框）
 * 舊版    : r3.51.1  (2026-11-18)　r3.51.1：清理借用 NPC 時跳過傳送役時雨（原本會把時雨的「渡船／任務地點／副本合戰」選單清掉）
 * 舊版    : r3.41.0  (2026-11-18)　r3.41.0：劇情角色指定圖改成完全同名；世界事件時店家、時雨不退場
 * 舊版    : r3.30.2  (2026-11-16)　r3.30.2：世界事件進行中，城鎮的人與動物暫時退場
 * 舊版    : r3.30.1  (2026-11-16)　r3.30.1：章中頭目等該圖的劇情對話說完才開打
 * 舊版    : r3.30.0  (2026-11-16)
 * 變更    : r3.30.0 新增。一人一實體＋委託選單。
 *           ・別名：名字一邊是另一邊的結尾／開頭（兩字以上），或「・」後半相同 → 視為同一人（五平＝東村・五平、景綱＝綾小路景綱、茨木＝茨木童子）。
 *           ・任務／劇情要加一個人到地圖時（G.AMB.add），同圖已有同名的人 → 直接借用他（不另生）；同時加兩次也只生一個。
 *             借用的路人不會被任務收掉；任務結束後恢復平常走動。
 *           ・地圖上若仍出現兩個同名的人（路人比任務晚生成）→ 每 20 幀檢查一次，合併成一個，任務標記改指向留下的那位。
 *           ・同一人身上有兩件以上委託，或他本身是店家 → 點他先出選單：各件委託（主線／支線）、商店、閒聊、離開。只有一件委託就直接進委託對話。
 * 依賴    : 20_npc（G.AMB、G.NPCD）、53_quest（Q.marks）、59_stage（ST.on）、21_shop（G.SHOP）。
 * ========================================================================== */
'use strict';
(function () {
  const AM = G.AMB, Q = G.QST, SC = G.SC, D = G.NPCD; if (!AM || !Q) return;
  const core = n => String(n || '').split('・').pop();
  function same(a, b) { if (!a || !b) return false; if (a === b) return true; const x = core(a), y = core(b); if (x === y) return true;
    const [s, l] = x.length <= y.length ? [x, y] : [y, x]; return s.length >= 2 && (l.endsWith(s) || l.startsWith(s)); }
  const human = n => n && !n.an && n.x > -999;
  const findHere = name => AM.list.find(n => human(n) && same(n.name, name));
  /* ---------- 1. 加人時借用同名者 ---------- */
  const add0 = AM.add.bind(AM), rm0 = AM.remove.bind(AM), pend = {};
  const story = name => G.NPC.find(o => o.npc && !o.stg && o.x > -999 && same(o.name, name));   // r3.141.0：劇情專用人物（小雪、阿松、權爺、小太、鐵心）
  AM.add = function (u, x, y, o) { const name = o && o.name; if (!name || (o && o.follow)) return add0(u, x, y, o).then(n => { if (n) n.qnew = 1; return n; });
    if (o && o.onTalk && story(name)) return Promise.resolve(null);   /* 同圖已有這位劇情人物 → 不另生（任務記號由 sync 移到他身上） */
    const k = SC.id + '|' + core(name), prev = pend[k] || Promise.resolve();
    const p = prev.then(() => { const ex = findHere(name); if (ex) { attach(ex, o); return ex; } return add0(u, x, y, o).then(n => { if (n) { n.qnew = 1; if (o.onTalk) n.onTalk = () => talk(n); } return n; }); });
    pend[k] = p.catch(() => 0); return p; };
  function attach(n, o) { n.hold = true; if (o.pace && !n.pace) { n.pace = 1; n.px = n.x; n.py = n.y; }   /* r3.151.3：借用的路人也在原地附近小走動 */ if (n.st === 'walk' && !o.onArrive) n.st = 'idle'; if (o.onTalk) n.onTalk = () => talk(n); if (o.onArrive) n.onArrive = o.onArrive; n.borrowed = (n.borrowed || 0) + 1; }
  AM.remove = function (n) { if (n && n.keep) return; if (n && !n.qnew && n.amb) { n.borrowed = Math.max(0, (n.borrowed || 1) - 1); return; } return rm0(n); };   // 借來的路人不收掉
  /* ---------- 2. 委託選單 ---------- */
  const marksOf = n => { const out = []; for (const m of Q.marks) { if (!m.q || !(m.x > -999) || !m.run) continue; if (m.n === n || (same(m.label, n.name) && Math.hypot(m.x - n.x, m.y - n.y) < 140)) if (!out.some(o => o.q === m.q)) out.push(m); } return out; };
  function chat(n) { const P = G.AMB && G.STORY && G.HUB ? Math.min(13, G.HUB.cur()) : 1, pool = ((D && D.ROLE[n.role]) || []).filter(l => P >= l[0] && P <= l[1]).map(l => l[2]);
    if (!pool.length) return [{ who: n.name, text: '……（點點頭）' }]; const t = pool[(n.li = (n.li || Math.floor(Math.random() * pool.length)) + 1) % pool.length];
    return t.split('｜').map(s => s[0] === '>' ? { who: '蒼真', text: s.slice(1) } : { who: n.name, text: s }); }
  function talk(n) { const ms = marksOf(n), later = f => [{ do: () => G.STORY.later(2, f) }];
    if (ms.length === 1 && !n.shop) { G.UI.near = null; ms[0].run(); return; }
    if (!ms.length && !n.shop) { G.DLG.start(chat(n)); return; }
    const C = ms.map(m => ({ label: (m.main || m.q.main ? '【主線】' : '【支線】') + m.q.title + (m.qmark === '!' ? '（委託）' : ''), then: later(() => { G.UI.near = null; m.run(); }) }));
    if (n.shop && G.SHOP) { const ty = G.SHOP.type(n.shop); C.push({ label: ty === 'warp' ? '前往副本／合戰' : '看看商品', then: later(() => ty === 'warp' && G.WARP ? G.WARP.open(n) : G.SHOP.open(n.shop, n)) }); }
    C.push({ label: '閒聊', then: later(() => G.DLG.start(chat(n))) }, { label: '離開', then: [] });
    const g = (D && D.GREET[n.role]) || ['有什麼事？']; G.DLG.start([{ who: n.name, text: g[Math.floor(Math.random() * g.length)] }, { choice: C }]); }
  /* ---------- 3. 每 20 幀：合併同名、歸還借用 ---------- */
  function sync() { if (!SC.id || SC.trans) return;
    for (const m of Q.marks) { if (m.n || m.st || !m.q || !(m.x > -999) || !m.run) continue; const s = story(m.label); if (s && Math.hypot(m.x - s.x, m.y - s.y) > 8) { m.x = s.x; m.y = s.y; } }   // r3.141.0：記號移到劇情人物身上
    if (new Set(G.NPC).size !== G.NPC.length) G.NPC = [...new Set(G.NPC)];   // 同一物件放兩次
    const H = G.NPC.filter(o => o.amb && human(o) && !o.noMerge), seen = [];   /* r3.127.2：noMerge＝事件裡的同名群眾（救援士兵）不合併 */
    for (const n of H) { const k = seen.find(o => same(o.name, n.name)); if (!k) { seen.push(n); continue; }
      const keep = k.qnew && !n.qnew ? n : k, dup = keep === k ? n : k; if (dup.qnew && !keep.qnew) { keep.x = dup.x; keep.y = dup.y; }   // 留下原本的路人，站到任務位置
      for (const m of Q.marks) if (m.n === dup) m.n = keep; if (G.STAGE) for (const o of G.STAGE.on) if (o.a === dup) o.a = keep;
      if (dup.onTalk) { keep.onTalk = () => talk(keep); keep.hold = true; } if (dup.pace && !keep.pace) { keep.pace = 1; keep.px = keep.x; keep.py = keep.y; }   /* r3.151.3：合併後保留原地小走動 */ if (dup.onArrive && !keep.onArrive) keep.onArrive = dup.onArrive;
      rm0(dup); if (keep !== k) seen[seen.indexOf(k)] = keep; }
    // 立繪／劇情演員（不在路人名單裡的）同名重複
    const S = G.NPC.filter(o => o.anim && !o.amb && o.x > -999 && !(G.PARTY && G.PARTY.list.includes(o))), ss = [];
    for (const o of S) { const k = ss.find(x => same(x.name, o.name)); if (!k) { ss.push(o); continue; } for (const m of Q.marks) if (m.st === o) { m.st = k; m.x = k.x; m.y = k.y; }   /* r3.141.0：記號跟著留下的那位（原本留在原地沒人） */ if (G.STAGE) for (const s of G.STAGE.on) if (s.a === o) s.a = k; G.NPC = G.NPC.filter(x => x !== o); }
    // 任務已不需要的借用路人：恢復走動
    for (const n of H) if (n.fer && n.ferTalk && n.onTalk !== n.ferTalk && !marksOf(n).length) n.onTalk = n.ferTalk;   /* 時雨：任務借用結束後恢復原本選單 */
    for (const n of H) if (!n.qnew && !n.fer && n.onTalk && !marksOf(n).length && !(G.STAGE && G.STAGE.on.some(o => o.a === n))) { n.onTalk = null; n.hold = false; n.borrowed = 0; } }
  let tk = 0; const ls0 = G.NPCLIFE.step; G.NPCLIFE.step = function () { ls0(); if (++tk % 20 === 0) try { sync(); } catch (e) { console.warn('cast', e); } };
  /* ---------- 4. 沒有專屬圖的劇情角色：指定用哪張圖 ---------- */
  const UA = { '鬼族守爐人': 'n_t_oni_veteran', '鬼族使者': 'n_t_oni_veteran', '鬼族': 'n_t_oni_veteran',   // 路人圖
    /* r3.141.0：新劇情（r3.130～r3.137）沒有專屬圖的角色 */
    '半兵衛': 'n_t_human_carrier', '村長': 'n_t_human_elder', '老爺爺': 'n_p_gohei', '阿菊': 'n_p_kinu', '阿吉': 'n_jinzo', '鈴緒': 'n_suzuo', '宿場的老闆': 'n_sakubei',
    '放牛的孩子': 'n_renta', '鬼族的孩子': 'n_yuzukichi', '鬼族的攤販': 'n_t_oni_veteran', '鬼族的大叔': 'n_t_oni_veteran', '鬼灘': 'n_t_oni_veteran', '人類的攤販': 'n_stall_vendor',
    '劍士的亡魂': 'n_toma', '時雨': 'n_t_human_clerk',
    '冬馬': 'n_toma', '孫六': 'n_t_human_guard', '甚藏': 'n_jinzo', '真穗': 'n_maho' };   /* r3.159.0：兩岸城攻防篇 */
  const UX = { '小河童': { k: 'an', key: () => 'n_t_kappa_mentor', hk: 0.6 }, '受傷的人魚': { k: 'an', key: () => 'e_kijo', hk: 0.9, en: 'kijo' } };   // r3.141.0：縮小的長者圖（原本被比對成河童頭目）／人魚借鬼女圖
  const UE = { '鬼女': 'kijo', '被綁住的小妖': 'amanojaku', '玄符': 'kuroonmyo', '黑符陰陽師': 'doma_ritualist', '道摩的使者': 'doma_ritualist', '無名武士': 'kengo', '傘妖': 'karakasa' };   // 敵人圖（站著不打）
  // r3.41.0：完全同名才套（原本「道摩」會被別名比對成「道摩的使者」→ 用了黑衣兵的圖）
  function unit(n) { for (const k in UA) if (k === n) return { k: 'amb', u: UA[k] }; if (UX[n]) { pre(UX[n].en); return UX[n]; } for (const k in UE) if (k === n) { const t = UE[k]; if (G.ANIM.get && G.ANIM.get('e_' + t)) return { k: 'an', key: () => 'e_' + t, hk: 1 }; pre(t); return null; } return null; }
  const pre = t => { if (G.ENEMY_IDX && G.ENEMY_IDX[t] && G.ASSET.enemies) G.ASSET.enemies([t]); };
  const en0 = G.STORY.onEnter.bind(G.STORY); G.STORY.onEnter = function (id) { en0(id); try {   // 這張圖目前的劇情會用到 → 先載圖
    const T = G.TEXT && G.TEXT.slots, qs = G.SAVE.data.qs || {}; for (const q of Q.L) { const s = qs[q.id]; let k = null, st = null;
      if (!s) { if (q.giver && q.giver.map === id) { k = 'giver'; st = q.giver; } } else if (!s.done && q.steps[s.s] && q.steps[s.s].map === id) { k = 's' + s.s; st = q.steps[s.s]; }
      if (!k) continue; const L = (T && T[q.id + ':' + k] && T[q.id + ':' + k].lines) || []; const who = L.map(l => l.who).concat(st.name || []);
      for (const w of who) for (const n in UE) if (same(n, w)) pre(UE[n]); } } catch (e) {} };
  /* ---------- 5. r3.30.1：頭目等劇情說完才開打（茨木、道摩這類章中頭目原本一進圖就開打，跟對話重疊） ---------- */
  const talkHere = id => { const qs = G.SAVE.data.qs || {}; return Q.L.some(q => { const s = qs[q.id], st = s && !s.done && q.steps[s.s]; return st && st.map === id && /goto|cut/.test(st.t) && st.lines; }); };
  if (G.BOSS && G.BOSS.mapStart) { const ms0 = G.BOSS.mapStart; G.BOSS.mapStart = function (id, d, o) { if (o && o.wait) return ms0.call(this, id, d, o);
    if (!(G.DLG.active() || talkHere(id))) return ms0.call(this, id, d, o);
    let n = 0; const tryGo = () => { if (SC.id !== id || ++n > 400) return; if (G.DLG.active() || talkHere(id)) { G.STORY.later(20, tryGo); return; } ms0.call(G.BOSS, id, d, Object.assign({}, o, { wait: 1 })); };
    G.STORY.later(20, tryGo); return true; }; }
  /* ---------- 6. r3.30.2：世界事件（妖怪入侵等）進行中，城裡的人與動物暫時退場，事件結束再回來 ---------- */
  const FIGHT = /入侵|據點|浪人團|道摩軍|討伐|奪還|捕|伏擊|攔路|斥候|精英/;   /* r3.127.4：戰鬥類事件在任何有村民的地圖（村莊在章節地圖裡）也退場 */
  const evOn = () => !!(G.EV && G.EV.cur && !G.EV.cur.done && !G.EV.cur.skip && SC.def && (SC.def.town || SC.def.safe || D.CAST[SC.id] || FIGHT.test(G.EV.cur.n || '')));
  function evSync() { const on = evOn(); for (const n of AM.list) { if (n.shop || n.fer || n.qnew || n.qp || marksOf(n).length) { if (n.evOff) { n.evOff = 0; n.hold = n.hold0 || n.hold; } continue; }   // r3.41.0：店家與傳送役時雨不退場；r3.52.0：任務要找的人（任務生成、調查點站位、身上有任務標記）也不退場
    if (on && !n.evOff) { n.evOff = 1; n.hold0 = n.hold; n.hold = true; n.st = 'idle'; } else if (!on && n.evOff) { n.evOff = 0; n.hold = n.hold0; n.alpha = 0; } }
    for (const m of Q.marks) if (m.n && m.n.evOff && m.x > -999) { m.evX = 1; m.x = -9999; } else if (m.evX && m.n && !m.n.evOff) { m.evX = 0; m.x = m.n.x; m.y = m.n.y; } }   // 退場者的任務標記也先收起
  const dn0 = G.drawNpc; G.drawNpc = function (n) { if (n.evOff) return; return dn0(n); };
  const sy1 = G.STORY.step.bind(G.STORY); G.STORY.step = function () { sy1(); const k = G.UI.near; if (k && k.amb && k.amb.evOff) G.UI.near = null; };
  let tk2 = 0; const ls1 = G.NPCLIFE.step; G.NPCLIFE.step = function () { if (++tk2 % 15 === 0) try { evSync(); } catch (e) {} ls1(); };
  G.CAST = { same, core, talk, marksOf, sync, unit, evOn };
})();
