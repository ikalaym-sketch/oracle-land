/* ==========================================================================
 * 神諭之地 重製版 — 24_nav.js
 * Version : r3.169.0  (2026-11-27)　r3.169.0：兩岸城不畫舊像素立牌
 * 舊版    : r3.168.0  (2026-11-27)　r3.168.0：畫面邊緣出口箭頭改由右上面板的出口列顯示
 * 舊版    : r3.108.0  (2026-11-26)　r3.108.0：雜物打破時呼叫 G.BRKFX（特殊效果）；探索區最多 3 個
 * 舊版    : r3.107.1  (2026-11-26)　r3.107.1：城鎮不放可打破雜物；野外每張圖最多 2 個、分開擺放
 * 舊版    : r3.100.0  (2026-11-26)　r3.100.0：雜物打破後 1 秒消失，本次遊玩中同一地點不再出現
 * 舊版    : r3.43.2  （r3.43.2：出口底下的平塗黃橢圓改成柔光暈＋上升光點）
 * 舊版    : r3.30.2  （r3.30.2：拿掉出口旁的黑底名牌，只留地面光圈與箭頭；被封住的出口靠近時仍顯示「封・」）
 * 舊版    : r3.27.0  （r3.27.0：名牌縮小淡化；鎖住的出口靠近才顯示；名牌看得到就不畫邊緣箭頭）
 * 舊版    : r3.21.0  （r3.21.0：出口名牌避開頭像區與按鍵區）
 * 舊版    : r3.18.0  （r3.18.0：神社祈願石可奉納升級神社）
 * 舊版    : r3.11.1  (2026-11-14)
 * 變更    : r3.11.1 祈願石兼歸城點：章節第一站（與頭目已擊敗的頭目圖）一律放祈願石，互動多「回兩岸城」；
 *           位置改為固定（依地圖 id 決定，不再每次隨機）、靠路邊但底座完全在可走範圍內、從入口走得到、避開出口／NPC 站位。
 * 變更    : r3.7.0 重寫物件擺放：
 *           ・傳送陣位置改用可走遮罩修正後的出口線，放在離出口最近的寬敞點；陰影用素材附的陰影層。
 *           ・P7 物件依地區成套（村莊／神社／出雲／雪原／火山／天空）：可破壞物、祈願石、告示牌、寶箱、門；城鎮擺設（供桌、藥材架、布匹…）。
 *           ・城鎮與神社依 a/place.json 手工定點；野外自動放在「路邊」（可走且離邊 ≤2 格），2～3 個一組，避開出口與主角。
 *           ・尺寸依素材規格（人物站立約 200px＝主角高度），不再自己估。
 *           ・祈願石：去掉原本的淡藍光暈（看起來像白底），改素材陰影＋頂端微光。
 *           r3.6.0 出口名牌、畫面外出口箭頭、無劇情地圖自動目標（往東）。
 * 依賴    : 12_anim、02_scene、25_walk（SC.snap／room／randSpot）、04_ui、06_story、18_world。
 * ========================================================================== */
'use strict';
(function () {
  const ctx = G.ctx, SC = G.SC;
  const U = {}, need = u => U[u] || (U[u] = G.ANIM.load(u).then(x => (U[u] = x)).catch(() => null)), unit = u => (U[u] && U[u].act ? U[u] : null);
  const K = 64 / 200 / 0.5;   // 素材 200px＝主角 64；圖集縮 0.5
  const nm = id => id === 'END' ? '盡頭' : (G.D.scenes[id] || {}).name || id;
  const REG = (d, id) => { d = d || SC.def; id = id || SC.id; if (d.dungeon) return { EZO: 'snow', FUJI: 'volcano', IZUMO: 'izumo', SKY: 'sky' }[d.dungeon] || 'village'; if (id === 'hub_shrine') return 'shrine';
    const c = d.ch || 1; return c === 4 || c === 5 ? 'volcano' : c === 6 || c === 11 ? 'izumo' : c === 3 ? 'shrine' : 'village'; };
  const showable = p => p.to && (G.D.scenes[p.to] || p.to === 'END');
  /* 出口標記點：出口線中點往內 60px，吸附到最近寬敞點（快取） */
  const exitPt = p => { if (p._pt && p._pt.id === SC.id) return p._pt;
    let x, y, dir; if (p.rect) { x = (p.rect[0] + p.rect[2]) / 2; y = p.rect[1] - 16; dir = 0; } else { x = p.line[0][0] + (p.id === 'west' ? 60 : -60); y = (p.line[0][1] + p.line[1][1]) / 2; dir = p.id === 'west' ? -1 : 1; }
    const q = SC.snap ? SC.snap(x, y, 'open', 140) : null; if (q) { x = q[0]; y = q[1]; } return (p._pt = { x, y, dir, id: SC.id }); };
  function tag(x, y, text, col, bg, Z) { ctx.save(); ctx.translate(x, y); ctx.scale(1 / Z, 1 / Z); const f = 10 * G.FS(); ctx.font = `800 ${f}px ${G.FONT}`;
    const w = ctx.measureText(text).width + 16, p = SC.toScreen(x, y), sl = G.SAFE.l || 0, ox = p.y < 260 + G.SAFE.t && p.x - w / 2 < 158 + sl ? 158 + sl - (p.x - w / 2) : p.y > G.LH - 225 && p.x + w / 2 > G.LW - 280 ? (G.LW - 280) - (p.x + w / 2) : 0; ctx.translate(ox, 0); ctx.fillStyle = bg;   /* r3.21.0：避開左上頭像區與右下按鍵區 */ G.rr(-w / 2, -f - 10, w, f + 10, 8); ctx.fill(); G.txt(text, 0, -f / 2 - 4, 10, col, 'center', G.FONT, 800); ctx.restore(); }
  /* 畫一個 P7 物件：k＝動作名，h＝指定高度（0＝依素材規格），陰影層自動找 */
  function drawProp(u, k, x, y, h, alpha) { const rec = u.act[k]; if (!rec) return; const f = rec.f[0], s = SC.depth(y), sc = h ? h * s / f[3] : K * s;
    const sk = k.replace(/_(idle|intact|broken|closed|open|locked|disabled|static)$/, '_shadow'), sh = u.act[sk];
    if (sh && sk !== k) { const g = sh.f[0]; G.ANIM.draw(u, g, x, y + 2 * s, sc, false, 0.85); } else { ctx.fillStyle = 'rgba(30,20,10,.28)'; ctx.beginPath(); ctx.ellipse(x, y, f[2] * sc * 0.42, f[2] * sc * 0.12, 0, 0, 6.283); ctx.fill(); }
    G.ANIM.draw(u, f, x, y, sc, false, alpha === undefined ? 1 : alpha); return f[3] * sc; }
  /* ---------- 出入口 ---------- */
  SC.drawExits = function () { const Z = this.view().Z, rg = REG(), u = unit(rg === 'village' ? 'pr_shrine' : 'pr_' + rg), wk = 'warp_' + (rg === 'village' ? 'shrine' : rg) + '_disabled';   // 村莊款傳送陣像車輪 → 用神社款
    for (const p of this.def.portals) { if (!showable(p)) continue; const L = this.lock[p.id], pt = exitPt(p), s = this.depth(pt.y), a = 0.35 + 0.25 * Math.sin(G.t * 0.08), nearL = Math.hypot(G.H.x - pt.x, (G.H.y - pt.y) * 1.4) < 220;
      { const c = L ? '230,90,70' : '255,214,140', br = 0.75 + 0.25 * Math.sin(G.t * 0.06), R = 30 * s;   /* r3.43.2：平塗黃橢圓 → 柔光暈＋上升光點 */
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(pt.x, pt.y + 4 * s); ctx.scale(1, 0.32);
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, R); g.addColorStop(0, `rgba(${c},${0.5 * br})`); g.addColorStop(0.55, `rgba(${c},${0.2 * br})`); g.addColorStop(1, `rgba(${c},0)`);
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, R, 0, 6.283); ctx.fill(); ctx.restore();
        if (!L) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 4; i++) { const q = ((G.t + i * 17) % 68) / 68, x = pt.x + Math.sin(i * 2.1 + G.t * 0.02) * 16 * s, y = pt.y - q * 34 * s;
          ctx.fillStyle = `rgba(255,236,190,${0.55 * Math.sin(q * Math.PI)})`; ctx.beginPath(); ctx.arc(x, y, 1.6 * s, 0, 6.283); ctx.fill(); } ctx.restore(); } }
      if (u && u.act[wk]) drawProp(u, wk, pt.x, pt.y + 6 * s, 26, 0.95);
      if (pt.dir) { const y = pt.y - 30 * s, x = pt.x + pt.dir * (18 + Math.sin(G.t * 0.1) * 4) * s; ctx.fillStyle = L ? 'rgba(230,110,100,.85)' : 'rgba(255,236,190,.9)';
        ctx.beginPath(); ctx.moveTo(x + pt.dir * 10 * s, y); ctx.lineTo(x - pt.dir * 4 * s, y - 8 * s); ctx.lineTo(x - pt.dir * 4 * s, y + 8 * s); ctx.fill(); }
      else { const y = pt.y - 26 + Math.sin(G.t * 0.1) * 4; ctx.fillStyle = 'rgba(255,236,190,.9)'; ctx.beginPath(); ctx.moveTo(pt.x, y + 9); ctx.lineTo(pt.x - 8, y - 5); ctx.lineTo(pt.x + 8, y - 5); ctx.fill(); }
      if (L && nearL) tag(pt.x, pt.y - 46 * s, (L ? '封・' : pt.dir < 0 ? '← ' : pt.dir > 0 ? '' : '↓ ') + nm(p.to) + (pt.dir > 0 && !L ? ' →' : ''), L ? '#ffd0c8' : '#fff3cf', L ? 'rgba(120,30,24,.85)' : 'rgba(20,14,16,.78)', Z); }
  };
  /* ---------- 畫面外的出口：邊緣小箭頭 ---------- */
  function edges() { const d = SC.def; if (!d || G.HUD2 || G.MENU.open || G.DLG.active()) return; const tg = G.STORY.target(), m = 26, top = 70 + G.SAFE.t;
    for (const p of d.portals) { if (!showable(p) || SC.lock[p.id]) continue; const pt = exitPt(p); if (tg && Math.hypot(tg.x - pt.x, tg.y - pt.y) < 90) continue;
      const q = SC.toScreen(pt.x, pt.y - 30); if (q.x > -140 && q.x < G.LW + 140 && q.y > -40 && q.y < G.LH + 20) continue;   // r3.27.0：名牌還看得到就不畫邊緣箭頭（避免重複）   // 標記在畫面內就不畫邊緣箭頭
      const right = q.x > G.LW / 2, bot = right ? G.LH * 0.28 : G.LH * 0.6, x = Math.max(m, Math.min(G.LW - m, q.x)), y = Math.max(top, Math.min(bot, q.y));
      ctx.save(); ctx.globalAlpha = 0.8; ctx.fillStyle = 'rgba(227,194,122,.9)'; ctx.beginPath();
      if (right) { ctx.moveTo(x + 9, y); ctx.lineTo(x - 3, y - 8); ctx.lineTo(x - 3, y + 8); } else { ctx.moveTo(x - 9, y); ctx.lineTo(x + 3, y - 8); ctx.lineTo(x + 3, y + 8); } ctx.fill();
      ctx.font = `700 ${10 * G.FS()}px ${G.FONT}`; const t = nm(p.to), w = ctx.measureText(t).width + 12, tx = right ? x - 14 - w : x + 14;
      ctx.fillStyle = 'rgba(12,8,10,.65)'; G.rr(tx, y - 9, w, 18, 9); ctx.fill(); G.txt(t, tx + w / 2, y + 0.5, 10, '#f3d98a', 'center', G.FONT, 700); ctx.restore(); } }
  const ud0 = G.UI.draw.bind(G.UI); G.UI.draw = function () { ud0(); edges(); };
  /* ---------- 沒有劇情的地圖：自動目標＝往東 ---------- */
  const fwd = () => { const d = SC.def; if (!d || d.safe || !G.WORLD.is(SC.id)) return null; const p = d.portals.find(q => q.id === 'east' && showable(q) && q.to !== 'END'); return p && !SC.lock.east ? p : null; };
  const tg0 = G.STORY.target.bind(G.STORY);
  G.STORY.target = function () { const t = tg0(); if (t) return t; const p = fwd(); if (!p) return null; const pt = exitPt(p); return { x: pt.x, y: pt.y, label: nm(p.to) }; };
  const ob0 = G.STORY.objective.bind(G.STORY);
  G.STORY.objective = function () { const o = ob0(); if (o) return o; const p = fwd(); if (p) return '往東前進：' + nm(p.to); if (SC.lock.east && G.WORLD.is(SC.id)) return SC.lock.east; return ''; };
  /* ---------- 物件 ---------- */
  const N = G.NAV = { list: [] };
  const BRK = { village: ['break_village_crate', 'break_village_barrel', 'break_village_jar', 'break_village_bamboo_fence'], shrine: ['break_shrine_crate', 'break_shrine_barrel', 'break_shrine_jar', 'break_shrine_bamboo_fence'],
    izumo: ['break_izumo_stone_lantern', 'break_izumo_shimenawa_post'], snow: ['break_snow_ice_pillar', 'break_snow_snow_pile'], volcano: ['break_volcano_dead_wood', 'break_volcano_lava_rock'], sky: ['break_sky_cloud_stone', 'break_sky_damaged_statue'] };
  const BNAME = { crate: '木箱', barrel: '木桶', jar: '陶甕', bamboo_fence: '竹籬', stone_lantern: '石燈籠', shimenawa_post: '注連繩柱', ice_pillar: '冰柱', snow_pile: '雪堆', dead_wood: '枯木', lava_rock: '熔岩石', cloud_stone: '雲石', damaged_statue: '破損石像' };
  const add = o => { N.list.push(o); G.NPC.push(o); };
  N.gone = {};   // r3.100.0：本次遊玩中已打破的定點雜物（換圖回來不再出現）
  function breakable(u, b, x, y) { const key = SC.id + '|' + Math.round(x / 8) + '|' + Math.round(y / 8); if (N.gone[key]) return;
    const o = { nav: 1, u, k: b + '_intact', base: b, x, y, label: BNAME[b.replace(/^break_[a-z]+_/, '')] || '雜物' };
    o.run = () => { if (o.broken) return; o.broken = 1; N.gone[key] = 1; o.k = o.base + '_broken'; SC.shake = 4; G.AU && G.AU.sfx && G.AU.sfx('hit');
      G.STORY.later(60, () => { N.list = N.list.filter(q => q !== o); G.NPC = G.NPC.filter(q => q !== o); G.FX.push({ k: 'dust', x: o.x, y: o.y, t: 0, life: 18 }); });   // r3.100.0：打破、掉落後 1 秒消失
      const d = SC.def, lv = d.lv || 1, R = G.RPG, sp = () => ({ x: o.x + (Math.random() - 0.5) * 30, y: o.y + 6, t: 0 });
      G.LOOT.push(Object.assign(sp(), { kind: 'gold', v: Math.round(3 + lv * 1.5 + Math.random() * 6) }));
      if (Math.random() < 0.35) { const ks = Object.keys(R.MATS); G.LOOT.push(Object.assign(sp(), { kind: 'mat', id: ks[Math.floor(Math.random() * ks.length)], n: 1 })); }
      if (Math.random() < 0.03) G.LOOT.push(Object.assign(sp(), { kind: 'item', it: R.roll(lv, d.region || 'wind') }));
      if (G.BRKFX) G.BRKFX(o); };   // r3.108.0：各種雜物的特殊效果（136_fort）
    add(o); }
  const pray = () => { G.H.hp = G.H.hpMax; const S = G.SAVE.data; S.scene = SC.id; S.x = G.H.x; S.y = G.H.y; S.hp = G.H.hp; G.SAVE.markDirty();
    G.UI.toast(G.SAVE.flush() ? '祈願：生命全滿，已存檔' : '生命全滿（瀏覽器不允許存檔）'); };
  const homeHere = () => !!(G.HUB && G.HUB.stoneHere && G.HUB.stoneHere(SC.id));
  function saveStone(u, k, x, y) { add({ nav: 1, u, k, x, y, save: 1, get label() { return homeHere() ? '祈願石・歸城' : '祈願石（回復＋存檔）'; },
    run: () => { if (!homeHere()) return pray();
      G.DLG.start([{ choice: [{ label: '祈願（回復＋存檔）', then: [{ do: pray }] }, { label: '回兩岸城', then: [{ do: () => G.HUB.goCity() }] }].concat(G.FORGE ? G.FORGE.stoneCh() : [], [{ label: '離開', then: [] }]) }]); } }); }
  // 固定位置：依地圖 id 取種子；從入口附近往內找「路邊」點，避開出口、NPC 站位與主角
  // 路邊點：有遮罩用 snap('edge')；舊版多邊形地圖（第一章）沿垂直方向找到可走區邊界，再往內退 14px
  // 必須整個底座都在可走範圍內（不是只出現在畫面上）：遮罩地圖取離邊 3～6 格（12～24px），多邊形地圖往內退 24px；
  // 並要求底座四周與正前方都可走、且從入口走得到（reach）
  function edgeAt(d, x, y, dir) { let q = null;
    if (d.mask) { const ok = (xx, yy) => { const r = SC.room(xx, yy); return r >= 3 && r <= 6; };
      if (ok(x, y)) q = [x, y]; else for (let r = 6; r <= 60 && !q; r += 6) for (let a = 0; a < 6.283; a += 6 / r) { const xx = x + Math.cos(a) * r, yy = y + Math.sin(a) * r * 0.7; if (ok(xx, yy)) { q = [xx, yy]; break; } } }
    else { if (!SC.walkable(x, y)) return null; let yy = y; while (yy > 4 && yy < d.h - 4 && SC.walkable(x, yy + dir * 4)) yy += dir * 4; q = [x, yy - dir * 24]; }
    if (!q) return null; const [qx, qy] = q;
    for (const [ox, oy] of [[0, 0], [-16, 0], [16, 0], [0, -6], [0, 8], [0, 34], [-30, 30], [30, 30]]) if (!SC.walkable(qx + ox, qy + oy)) return null;
    return q; }
  // 從入口做一次 8px 格點洪水填充，回傳可到達判斷（每張圖只算一次）
  function reachFrom(d, s) { const S = 8, W = Math.ceil(d.w / S), H = Math.ceil(d.h / S), seen = new Uint8Array(W * H), Q = [];
    const at = (x, y) => [Math.min(W - 1, Math.max(0, (x / S) | 0)), Math.min(H - 1, Math.max(0, (y / S) | 0))];
    const [sx, sy] = at(s[0], s[1]); seen[sy * W + sx] = 1; Q.push(sx, sy);
    for (let i = 0; i < Q.length; i += 2) { const cx = Q[i], cy = Q[i + 1];
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = cx + dx, ny = cy + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const k = ny * W + nx;
        if (seen[k] || !SC.walkable(nx * S + S / 2, ny * S + S / 2)) continue; seen[k] = 1; Q.push(nx, ny); } }
    return (x, y) => { const [cx, cy] = at(x, y); return !!seen[cy * W + cx]; }; }
  function stoneSpot(d, id, avoid) { let h = 7; for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0; const rnd = () => ((h = (h * 1103515245 + 12345) >>> 0) / 4294967296);
    const s = d.start || [d.w / 2, d.h * 0.7], nodes = Object.values(d.nodes || {}), far = (q, L, r) => L.every(a => Math.hypot(q[0] - a[0], (q[1] - a[1]) * 1.4) >= r);
    const dir = s[0] < d.w / 2 ? 1 : -1, reach = reachFrom(d, s);
    for (let t = 0; t < 160; t++) { const dx = dir * (150 + rnd() * 420), dy = (t < 100 ? -1 : 1) * (40 + rnd() * 120);   // 先找靠房舍那一側（畫面上方），找不到才用下緣
      const q = edgeAt(d, s[0] + dx, s[1] + dy, dy < 0 ? -1 : 1); if (q && reach(q[0], q[1] + 30) && far(q, avoid, 130) && far(q, nodes, 90)) return q; }
    for (let t = 0; t < 300; t++) { const q = SC.randSpot('open', rnd, avoid, 140); if (q && reach(q[0], q[1])) return q; } return null; }
  N.homeHere = homeHere;
  const en0 = G.STORY.onEnter.bind(G.STORY);
  G.STORY.onEnter = function (id) { en0(id); N.list = []; const d = G.D.scenes[id]; if (!d) return; const rg = REG(d, id), ru = 'pr_' + rg, PL = G.PLACE && G.PLACE[id];
    Promise.all([need(ru), need('pr_deco')]).then(() => { if (SC.id !== id) return; const u = unit(ru), ud = unit('pr_deco'); if (!u) return;
      const avoid = [[G.H.x, G.H.y]].concat(d.portals.map(p => { const q = exitPt(p); return [q.x, q.y]; }));
      if (PL) {   // 手工定點
        if (PL.save) { const q = SC.snap(PL.save[0], PL.save[1], 'open', 80); if (q) saveStone(u, 'save_shrine_' + rg + '_idle', q[0], q[1]); }
        for (const [uu, k, x, y, kind, h] of PL.props || []) { const q = SC.snap(x, y, kind || 'edge', 80), un = uu === 'pr_deco' ? ud : u; if (q && un && un.act[k]) add({ nav: 1, deco: 1, u: un, k, h: h || 0, x: q[0], y: q[1] }); }
        /* r3.107.1：城鎮不放可打破／可撿取的雜物（PL.brk 不再擺） */
        return; }
      if ((d.safe || homeHere() || (d.dungeon && /_01$/.test(id))) && !N.list.some(o => o.save)) { const q = stoneSpot(d, id, avoid); if (q) saveStone(u, 'save_shrine_' + rg + '_idle', q[0], q[1]); }
      if (!d.safe && !d.boss && d.spawn) {   // 野外：路邊 2～3 個一組
        /* r3.107.1：每張地圖最多 2 個、單獨擺放，彼此至少相隔地圖寬 35%（不再 2～3 個擠在一起） */
        const L = BRK[rg] || BRK.village, put = [], MAXB = d.explore ? 3 : 2;   // r3.108.0：探索區 3 個
        for (let k = 0; k < 16 && put.length < MAXB; k++) { const c = SC.randSpot('edge', null, avoid, 160); if (!c) continue; if (put.some(p => Math.abs(p[0] - c[0]) < d.w * 0.35)) continue; put.push(c); avoid.push(c);
          const b = L[Math.floor(Math.random() * L.length)]; if (u.act[b + '_intact']) breakable(u, b, c[0], c[1]); } }
    });
  };
  N.ensureStone = function () { const id = SC.id, d = G.D.scenes[id]; if (!d || N.list.some(o => o.save)) return; const rg = REG(d, id), ru = 'pr_' + rg;
    Promise.resolve(need(ru)).then(() => { const u = unit(ru); if (!u || SC.id !== id || N.list.some(o => o.save)) return;
      const avoid = [[G.H.x, G.H.y]].concat(d.portals.map(p => { const q = exitPt(p); return [q.x, q.y]; })); const q = stoneSpot(d, id, avoid); if (q) saveStone(u, 'save_shrine_' + rg + '_idle', q[0], q[1]); }); };
  const ls0 = G.NPCLIFE.step; G.NPCLIFE.step = function () { ls0(); if (N.list.length && !G.NPC.includes(N.list[0])) G.NPC.push(...N.list.filter(o => !G.NPC.includes(o))); };
  const dn0 = G.drawNpc;
  G.drawNpc = function (n) { if (!n.nav) return dn0(n); if (n.k === 'sign_village_idle' && SC.id === 'hub_city') return;   /* r3.169.0：兩岸城新圖不畫舊像素立牌（城南告示牌換新圖） */ const hh = drawProp(n.u, n.k, n.x, n.y, n.h);
    if (n.save && hh) { const a = 0.35 + 0.3 * Math.sin(G.t * 0.07), y = n.y - hh * 0.92; ctx.fillStyle = `rgba(255,230,160,${a})`; ctx.beginPath(); ctx.arc(n.x, y, 3 + a * 2, 0, 6.283); ctx.fill(); } };
  const st0 = G.STORY.step.bind(G.STORY);
  G.STORY.step = function () { st0(); if (G.UI.near && !G.UI.near.amb) return; let best = 56, pick = null;
    for (const o of N.list) { if (o.broken || o.deco) continue; const d = Math.hypot(G.H.x - o.x, (G.H.y - o.y) * 1.6); if (d < best) { best = d; pick = o; } }
    if (pick) G.UI.near = { label: pick.label, kind: 'look', run: () => pick.run() }; };
  /* 開機先載常用地區包 */
  setTimeout(() => { need('pr_village'); need('pr_shrine'); need('pr_deco'); }, 300);
})();
