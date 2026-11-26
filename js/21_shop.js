/* ==========================================================================
 * 神諭之地 重製版 — 21_shop.js
 * Version : r3.108.1  (2026-11-26)　r3.108.1：殺價後價格取整數（不再出現小數點）
 * 舊版    : r3.93.0  （r3.93.0：藥水冷卻 1.5 秒→5 秒（S.QCD），冷卻圈依 S.QCD 畫）
 * 舊版    : r3.63.0  （r3.63.0：鍛冶舖改賣精品～傳說、行商可到傳說、價格乘 S.disc）　r3.61.0：（r3.61.0：茶屋改由 S.teaList 提供、商品列表可加 S.xrows、名物價格 ×3）　r3.24.0：（r3.24.0：頁籤依空間縮寬不壓錢數；茶食攤升級頁修正；賣價加成；藥鍵數量移到上方）
 * 舊版    : r3.19.3  (2026-11-14)
 * 變更    : r3.19.3 藥快捷鍵改圓形（放在「閃」左邊）。
 * 變更    : r3.19.0 賣出頁改用 58_forge 的品質晶片＋確認列（sellBar）。
 * 變更    : r3.18.0 鍛冶舖／雜貨舖加分頁（58_forge：強化／勾玉／打造／升級）；賣出頁依品質一鍵賣出；背包上限看雜貨舖等級。
 * 變更    : r3.5.0 行商（事件 NPC：精品～稀品＋便宜素材）、妖玉交換（傳說／稀品套裝，用妖玉買）；茶食效果換地圖不消失（記實際時間）。
 * 變更    : r3.4.0 新增。商店：藥舖／茶食攤／鍛冶舖／雜貨舖／珍品，用錢買賣；HUD 右上「藥」快捷鍵。
 * 說明    : ・商店 id＝<種類>_<地點>（例 med_city）。貨架每天（本機日期）或劇情進度改變時換新，存在 rpg.shop[id]。
 *           ・藥舖：止血草藥（回 30% 生命）、回春丹（回 70%）、醒氣丸（氣 +40）→ 放進 rpg.cons，每種最多 20。
 *           ・茶食攤：當場吃，10 分鐘效果（G.BUFF：攻擊 +8%／冷卻 −8%／會心 +6%）。
 *           ・鍛冶舖：6 件良品～稀品裝備；珍品：3 件稀品以上（偶有傳說），價格較高。
 *           ・雜貨舖：打造素材 5 個一組、背包擴充（+10 格，最多 120）。
 *           ・賣出：背包裝備，價格＝分解價。
 *           ・畫面借用選單框架（M.ui），開商店＝M.shop 有值時改畫商店頁。買賣當下才 markDirty。
 * 依賴    : 07_rpg（G.RPG）、08_menu／17_menu2（G.MENU）、15_skill（G.BUFF）、19_ui8（G.drawIcon）、20_npc（G.AMB.P）。
 * ========================================================================== */
'use strict';
(function () {
  const ctx = G.ctx, C = G.C, M = G.MENU, R = () => G.RPG, rd = () => G.RPG.d(), fs = () => G.FS();
  const P = () => (G.AMB ? G.AMB.P() : 1);
  const MED = [{ k: 'herb', n: '止血草藥', d: '回復 30% 生命（HUD「藥」鍵使用）', p: () => 18 + 6 * P(), ic: 'item_consumable_patch' },
    { k: 'herb2', n: '回春丹', d: '回復 70% 生命（生命低於 35% 時優先使用）', p: () => 55 + 16 * P(), ic: 'item_consumable_clearbreath' },
    { k: 'qi', n: '醒氣丸', d: '「氣」+40，買下當場服用', p: () => 45 + 10 * P(), ic: 'item_consumable_guarddust' }];
  const FOOD = [{ k: 'dango', n: '三色糰子', d: '10 分鐘內 攻擊 +8%', p: () => 26 + 7 * P(), b: ['atk', 8], ic: 'item_consumable_roadmeal' },
    { k: 'matcha', n: '熱抹茶', d: '10 分鐘內 冷卻時間 −8%', p: () => 26 + 7 * P(), b: ['cdr', 8], ic: 'item_consumable_lampoil' },
    { k: 'onigiri', n: '梅子飯糰', d: '10 分鐘內 會心率 +6%', p: () => 26 + 7 * P(), b: ['crit', 6], ic: 'item_consumable_anchorincense' }];
  const MATK = ['iron', 'bone', 'cloth', 'jade', 'ember'], MATIC = { iron: 'item_material_tamahagane', bone: 'item_material_hide', cloth: 'item_material_fiber', jade: 'item_material_radiance', ember: 'item_material_ember' };
  const BUFT = 36000;
  const S = G.SHOP = { cur: null, npc: null, tab: 0, sel: 0,
    type: id => id.split('_')[0],
    cons() { const d = rd(); return d.cons || (d.cons = { herb: 0, herb2: 0 }); },
    open(id, npc) { S.cur = id; S.npc = npc; S.tab = 0; S.sel = 0; M.shop = id; M.scroll.shopL = 0; M.show(); },
    /* 貨架：每天／進度改變才重抽（種子亂數，同一天同一家同樣的貨） */
    stock(id) { const d = rd(), day = new Date().toDateString(), p = P(); d.shop = d.shop || {}; let s = d.shop[id];
      const ty = S.type(id); if (!['smith', 'curio', 'peddler', 'yg'].includes(ty)) return null;
      if (!s || s.day !== day || s.P !== p) { s = d.shop[id] = { day, P: p, items: gen(id, ty, day) }; G.SAVE.markDirty(); }
      return s; }
  };
  function gen(id, ty, day) {
    let h = 2166136261; for (const ch of id + day) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
    const rnd = () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)) >>> 0) / 4294967296;
    const mr = Math.random, out = [], lv = rd().lv, n = { curio: 3, peddler: 3, yg: 4 }[ty] || 6, Q = { smith: [2, 4], curio: [3, 5], peddler: [2, 4], yg: [3, 4] }[ty], SETK = Object.keys(R().SETS);
    Math.random = rnd;
    try { for (let i = 0; i < n; i++) { let it = null;
        const want = ty === 'yg' ? (i < 2 ? 4 : 3) : 0;
        for (let k = 0; k < 400; k++) { it = R().roll(lv + (ty === 'yg' ? 3 : 0), ty === 'yg' ? SETK[Math.floor(Math.random() * SETK.length)] : null); if (want ? it.q === want : it.q >= Q[0] && it.q <= Q[1]) break; }
        if (it.q > Q[1]) it.q = Q[1]; if (ty === 'yg' && it.q >= 3 && !it.set) it.set = SETK[Math.floor(Math.random() * SETK.length)]; out.push(it); } }
    finally { Math.random = mr; }
    return out;
  }
  const price = (it, ty) => ty === 'yg' ? (it.q >= 4 ? 30 : 10) : Math.max(1, Math.round(R().value(it) * (ty === 'curio' ? 10 : ty === 'peddler' ? 7 : 6) * (it.uq ? 3 : 1) * (S.disc ? S.disc(ty) : 1)));   // r3.108.1：殺價後取整數   // r3.61.0：名物 3 倍價　r3.63.0：行商殺價
  const CUR = ty => ty === 'yg' ? '妖玉' : '錢';
  function pay(g, cur) { const d = rd(), k = cur === '妖玉' ? 'yg' : 'gold'; if ((d[k] || 0) < g) { G.UI.toast(cur + '不夠（需要 ' + g + '）'); return false; } d[k] -= g; G.SAVE.markDirty(); return true; }
  /* ---------- 使用藥品 ---------- */
  S.quick = function () { const c = S.cons(), H = G.H; if (H.hp >= H.hpMax) { G.UI.toast('生命是滿的'); return; }
    if (S.qcd > 0) return; const big = c.herb2 > 0 && (H.hp < H.hpMax * 0.35 || !c.herb), k = big ? 'herb2' : c.herb > 0 ? 'herb' : null;
    if (!k) { G.UI.toast('沒有藥了（城鎮藥舖購買）'); return; }
    c[k]--; const v = Math.round(H.hpMax * (big ? 0.7 : 0.3)); H.hp = Math.min(H.hpMax, H.hp + v); S.qcd = S.QCD; G.SAVE.markDirty();
    G.NUMS && G.NUMS.push({ x: H.x, y: H.y - G.HERO_H, v: '+' + v, t: 0 }); G.AU && G.AU.sfx && G.AU.sfx('ui'); };
  S.qcd = 0; S.QCD = 300;
  S.hud = function (b) { if (S.qcd > 0) S.qcd--; const c = S.cons(), n = (c.herb || 0) + (c.herb2 || 0);
    if (b.r) { ctx.fillStyle = 'rgba(18,12,14,.55)'; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 6.283); ctx.fill(); ctx.strokeStyle = n ? 'rgba(143,211,143,.85)' : 'rgba(227,194,122,.45)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(b.x, b.y, b.r - 3, 0, 6.283); ctx.stroke();   // r3.19.3：圓形藥鍵
      const okI = G.drawIcon && G.drawIcon('item_consumable_patch', b.x - b.r + 6, b.y - b.r + 5, (b.r - 6) * 2, n ? 1 : 0.4); if (!okI) G.txt('藥', b.x, b.y - 2, 14, n ? C.ink : C.dim, 'center', G.FONT_S, 900);
      if (S.qcd > 0) { ctx.fillStyle = 'rgba(8,5,8,.62)'; ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.arc(b.x, b.y, b.r - 3, -1.5708, -1.5708 + 6.283 * S.qcd / S.QCD); ctx.fill(); }
      ctx.fillStyle = 'rgba(10,7,9,.82)'; G.rr(b.x + b.r * 0.3, b.y - b.r - 4, 26, 14, 6); ctx.fill(); G.txt('×' + n, b.x + b.r * 0.3 + 13, b.y - b.r + 3, 9, n ? C.gold : C.dim, 'center', G.FONT, 700); return; }
    ctx.fillStyle = 'rgba(12,8,10,.72)'; G.rr(b.x, b.y, b.w, b.h, b.h / 2); ctx.fill(); ctx.strokeStyle = n ? 'rgba(143,211,143,.7)' : 'rgba(227,194,122,.3)'; ctx.lineWidth = 1; G.rr(b.x + .5, b.y + .5, b.w - 1, b.h - 1, b.h / 2); ctx.stroke();
    const okI = G.drawIcon && G.drawIcon('item_consumable_patch', b.x + 4, b.y + 3, b.h - 6, n ? 1 : 0.4);
    G.txt((okI ? '' : '藥') + '×' + n, b.x + b.w / 2 + (okI ? 9 : 0), b.y + b.h / 2 + 1, 11, n ? C.ink : C.dim, 'center', G.FONT, 700);
    if (S.qcd > 0) { ctx.fillStyle = 'rgba(8,5,8,.55)'; G.rr(b.x, b.y, b.w * S.qcd / S.QCD, b.h, b.h / 2); ctx.fill(); } };
  /* ---------- 商店頁 ---------- */
  /* 茶食效果：換地圖會清 BUFF → 依實際剩餘時間補回 */
  const en0 = G.STORY.onEnter.bind(G.STORY);
  G.STORY.onEnter = function (id) { en0(id); const f = rd().food; if (!f) return; const t = Date.now();
    for (const k in f) { const [st, v, until] = f[k]; if (until > t) G.BUFF.add(st, v, Math.round((until - t) * 60 / 1000)); else delete f[k]; } };
  const close0 = M.close.bind(M); M.close = function () { M.shop = null; S.cur = null; close0(); };
  const draw0 = M.draw;
  M.draw = function () { if (!M.shop) return draw0(); const { box, button, hit, scrollArea, clip, itemCard, tile } = M.ui; M.hits = []; M.area = [];
    ctx.fillStyle = 'rgba(10,7,9,.92)'; ctx.fillRect(0, 0, G.LW, G.LH);
    const L = 12 + G.SAFE.l, T = 12 + G.SAFE.t, B = G.LH - 12 - G.SAFE.b, Rt = G.LW - 12 - G.SAFE.r, SH = 34 * fs(), id = M.shop, ty = S.type(id), d = rd(), D = G.NPCD;
    button(Rt - 84, T, 84, SH, '✕ 離開', () => M.close());
    if (G.drawIcon) G.drawIcon('ui_icon_map_shop', L, T + 1, SH - 2); G.txt((S.npc ? S.npc.name + '・' : '') + D.SHOPN[ty], L + SH + 6, T + SH / 2 + 1, 17, C.gold, 'left', G.FONT_S, 900);
    const tabs = (ty === 'tea' || ty === 'yg' ? ['購買'] : ['購買', '賣出']).concat(S.xtabs ? S.xtabs(ty) : []); let tx = L + (tabs.length > 3 ? 150 : 220) * fs(); const tEnd = Rt - 84 - 140, gp = tabs.length > 3 ? 6 : 8, tW = Math.min(tabs.length > 3 ? 62 : 92, (tEnd - tx - gp * (tabs.length - 1)) / tabs.length);   /* r3.24.0：頁籤寬度依空間縮，不壓到錢數 */
    tabs.forEach((n, i) => { const on = i === S.tab, tw = tW; ctx.fillStyle = on ? 'rgba(150,92,36,.9)' : 'rgba(30,22,26,.9)'; G.rr(tx, T, tw, SH, SH / 2); ctx.fill(); ctx.strokeStyle = on ? C.gold : 'rgba(227,194,122,.3)'; G.rr(tx + .5, T + .5, tw - 1, SH - 1, SH / 2); ctx.stroke();
      G.txt(n, tx + tw / 2, T + SH / 2 + 1, 13, on ? C.ink : C.sub, 'center', G.FONT_S, 900); hit(tx, T, tw, SH, () => { S.tab = i; S.sel = 0; M.scroll.shopL = 0; }); tx += tw + (tabs.length > 3 ? 6 : 8); });
    if (G.drawIcon) G.drawIcon(ty === 'yg' ? 'item_key_jade_light' : 'ui_icon_coin', Rt - 84 - 130, T + 4, SH - 8); G.txt(ty === 'yg' ? '妖玉 ' + (d.yg || 0) : '錢 ' + d.gold, Rt - 84 - 100, T + SH / 2 + 1, 14, ty === 'yg' ? '#9fe0ef' : '#f3d98a', 'left', G.FONT, 900);
    const top = T + SH + 12, h = B - top, lw = Math.min(380, (Rt - L) * 0.5), cx = L + lw + 10, cw = Rt - cx;
    const rows = list(ty, id), RH = 50 * fs();
    const xb = ty === 'tea' || ty === 'yg' ? 1 : 2;   /* r3.24.0：茶食攤／妖玉沒有賣出頁，第 2 個頁籤是升級（原本誤開賣出頁） */
    if (S.tab === 1 && xb === 2) return sellPage(L, top, lw, h, cx, cw);
    if (S.tab >= xb && S.xpage) return S.xpage(ty, S.tab - xb + 2, L, top, lw, h, cx, cw);
    box(L, top, lw, h); const off = scrollArea('shopL', L, top + 4, lw, h - 8, rows.length * (RH + 4)); clip(L, top + 4, lw, h - 8);
    rows.forEach((r, i) => { const yy = top + 6 + i * (RH + 4) + off, on = i === S.sel; if (yy > top + h || yy + RH < top) return;
      ctx.fillStyle = on ? 'rgba(120,80,30,.45)' : 'rgba(255,255,255,.04)'; G.rr(L + 6, yy, lw - 12, RH, 6); ctx.fill();
      const isz = RH - 10; if (r.it) tile(L + 11, yy + 5, isz, r.it); else if (!(G.drawIcon && G.drawIcon(r.ic, L + 11, yy + 5, isz))) { ctx.strokeStyle = 'rgba(227,194,122,.25)'; G.rr(L + 11, yy + 5, isz, isz, 5); ctx.stroke(); }
      G.txt(r.n, L + 18 + isz, yy + RH * 0.34, 13, r.c || C.ink, 'left', G.FONT_S, 900); G.txt(r.sub || '', L + 18 + isz, yy + RH * 0.72, 10, C.sub, 'left', G.FONT, 500);
      G.txt(r.sold ? '售完' : r.p + ' ' + CUR(ty), L + lw - 16, yy + RH / 2, 12, r.sold ? C.dim : (ty === 'yg' ? d.yg || 0 : d.gold) >= r.p ? '#f3d98a' : '#e07a6a', 'right', G.FONT, 900);
      hit(L + 6, Math.max(yy, top + 4), lw - 12, RH, () => { S.sel = i; }); });
    if (!rows.length) G.txt('今天沒有貨了，明天再來。', L + lw / 2, top + 40, 12, C.dim, 'center');
    ctx.restore();
    const r = rows[Math.min(S.sel, rows.length - 1)]; if (!r) { box(cx, top, cw, h); return; }
    if (r.it) { itemCard(cx, top, cw, h, r.it, d.eq[R().TPL[r.it.t].slot], r.sold ? [] : [['購買　' + r.p + ' ' + CUR(ty), () => r.buy(), 'main']]); return; }
    box(cx, top, cw, h); G.txt(r.n, cx + 16, top + 26, 17, C.gold, 'left', G.FONT_S, 900); G.txt(r.d, cx + 16, top + 54, 12, C.ink, 'left', G.FONT, 500);
    if (r.have !== undefined) G.txt('持有　' + r.have + (r.max ? '／' + r.max : ''), cx + 16, top + 80, 12, C.sub, 'left', G.FONT, 700);
    const bw = Math.min(160, (cw - 40) / 2); button(cx + 16, top + h - 48, bw, 34, '買 1　' + r.p + ' 錢', () => r.buy(1), d.gold >= r.p ? 'main' : 'off');
    if (r.multi) button(cx + 24 + bw, top + h - 48, bw, 34, '買 5　' + r.p * 5 + ' 錢', () => r.buy(5), d.gold >= r.p * 5 ? '' : 'off');
  };
  function list(ty, id) { const d = rd(), c = S.cons();
    if (ty === 'med') return MED.map(m => ({ n: m.n, d: m.d, ic: m.ic, p: m.p(), have: m.k === 'qi' ? undefined : c[m.k] || 0, max: 20, multi: m.k !== 'qi', sub: m.k === 'qi' ? '立即服用' : '持有 ' + (c[m.k] || 0),
      buy: (k = 1) => { if (m.k === 'qi') { if (!pay(m.p())) return; d.qi = Math.min(100, (d.qi || 0) + 40); G.UI.toast('「氣」+40'); return; }
        k = Math.min(k, 20 - (c[m.k] || 0)); if (k <= 0) { G.UI.toast('最多帶 20 個'); return; } if (!pay(m.p() * k)) return; c[m.k] = (c[m.k] || 0) + k; G.UI.toast('買了 ' + m.n + ' ×' + k); } }));
    if (ty === 'tea' && S.teaList) return S.teaList(pay);   // r3.61.0：茶屋品項／效果（101_shop2）
    if (ty === 'tea') return FOOD.map(f => ({ n: f.n, d: f.d + '（當場吃，效果不疊加，重買會重新計時）', ic: f.ic, p: f.p(), sub: f.d,
      buy: () => { if (!pay(f.p())) return; G.BUFF.v[f.b[0]] = 0; G.BUFF.add(f.b[0], f.b[1], BUFT); (d.food = d.food || {})[f.k] = [f.b[0], f.b[1], Date.now() + BUFT * 1000 / 60]; G.UI.toast('吃了' + f.n + '：' + f.d); } }));
    if (ty === 'goods') { const R1 = R(), up = Math.round((d.bagMax - 60) / 10);
      return MATK.map(k => ({ n: R1.MATS[k].n + ' ×5', d: '鍛冶舖強化／打造用素材', ic: MATIC[k], c: R1.MATS[k].c, p: (6 + 2 * P()) * 5, have: d.mats[k] || 0, multi: true, sub: '持有 ' + (d.mats[k] || 0),
        buy: (n = 1) => { if (!pay((6 + 2 * P()) * 5 * n)) return; d.mats[k] = (d.mats[k] || 0) + 5 * n; G.UI.toast(R1.MATS[k].n + ' +' + 5 * n); } }))
        .concat(d.bagMax < (G.FORGE ? G.FORGE.bagCap() : 120) ? [{ n: '背包擴充', d: '背包容量 +10 格（目前 ' + d.bagMax + '，最多 ' + (G.FORGE ? G.FORGE.bagCap() : 120) + '）', ic: 'ui_icon_material_bag', p: 300 * (up + 1), sub: '目前 ' + d.bagMax + ' 格',
          buy: () => { if (!pay(300 * (up + 1))) return; d.bagMax += 10; G.UI.toast('背包擴充到 ' + d.bagMax + ' 格'); } }] : []); }
    const st = S.stock(id); if (!st) return [];
    const extra = ty === 'peddler' ? ['ember', 'jade'].map(k => ({ n: R().MATS[k].n + ' ×5（便宜）', d: '行商特價素材', ic: MATIC[k], c: R().MATS[k].c, p: (3 + P()) * 5, sub: '持有 ' + (d.mats[k] || 0), multi: true,
      buy: (n = 1) => { if (!pay((3 + P()) * 5 * n)) return; d.mats[k] = (d.mats[k] || 0) + 5 * n; G.UI.toast(R().MATS[k].n + ' +' + 5 * n); } })) : [];
    return st.items.map((it, i) => it ? { it, n: R().name(it), c: R().QUAL[it.q].c, sub: R().QUAL[it.q].n + '・' + R().SLOTN[R().TPL[it.t].slot] + '・Lv ' + it.lv, p: price(it, ty),
      buy: () => { if (d.bag.length >= d.bagMax) { G.UI.toast('背包已滿'); return; } if (!pay(price(it, ty), CUR(ty))) return; st.items[i] = null; R().addItem(it); G.UI.toast('買到 ' + R().name(it)); } } : null).filter(Boolean).concat(extra).concat(S.xrows ? S.xrows(ty, id, pay) : []);   // r3.61.0：xrows＝珍品屋刷新／特殊道具
  }
  function sellPage(L, top, lw, h, cx, cw) { const { box, hit, scrollArea, clip, itemCard, tile } = M.ui, d = rd(), ts = 44 * fs(), gap = 6, cols = Math.max(3, Math.floor((lw - 20 + gap) / (ts + gap)));
    box(L, top, lw, h); const rows = Math.ceil(d.bag.length / cols), gy = top + 10, gh = h - 62, off = scrollArea('shopS', L, gy, lw, gh, rows * (ts + gap)); clip(L, gy, lw, gh);
    d.bag.forEach((it, k) => { const tx = L + 10 + (k % cols) * (ts + gap), ty = gy + Math.floor(k / cols) * (ts + gap) + off; if (ty > gy + gh || ty + ts < gy) return;
      tile(tx, ty, ts, it, S.sel === it.u); hit(tx, Math.max(ty, gy), ts, ts, () => { S.sel = it.u; }); });
    if (!d.bag.length) G.txt('背包是空的。', L + lw / 2, gy + 40, 12, C.dim, 'center'); ctx.restore();
    if (G.FORGE) G.FORGE.sellBar(L, top + h - 44, lw);
    const i = d.bag.findIndex(it => it.u === S.sel), it = d.bag[i];
    itemCard(cx, top, cw, h, it || null, it ? d.eq[R().TPL[it.t].slot] : null, it ? [['賣出　+' + (R().sellValue ? R().sellValue(it) : R().value(it)) + ' 錢', () => { const g = R().salvage(i); S.sel = 0; G.UI.toast('賣出　錢 +' + g); }, 'main']] : []); }
})();
