/* ==========================================================================
 * 神諭之地 重製版 — 10_banter.js
 * Version : r3.168.0  (2026-11-27)　r3.168.0：夥伴頭上泡泡位置平滑、上下位置一句只決定一次（不再上下飄）
 * 舊版    : r3.146.0  (2026-11-27)　r3.146.0：閒聊框不再壓左上頭像欄：頭上框會壓到就改畫在腳下；講話的人不在畫面上時改到上方中央；有橫幅時閒聊延後開始
 * 舊版    : r3.145.0  (2026-11-27)　r3.145.0：有橫幅時閒聊延後開始
 * 舊版    : r3.27.7  （r3.27.7：只有目前出戰位上的夥伴會說話（原本已加入但沒帶出門的也會跳台詞）　r3.19.1：夥伴閒聊改成夥伴頭頂泡泡；不在場時才用左上框）
 * 舊版    : r3.9.0  (2026-11-13)
 * 變更    : r3.9.0 名冊可擴充（B.extra：隱藏夥伴）；閒聊依劇情進度（前／中／後期／通關後）與所在區域（place）換台詞；新增 boss 觸發。
 * 說明    : 夥伴閒聊——待機太久、進入地圖、開戰、低血量、升級、清場、撿到稀有裝備、回到神社時，
 *           隊伍中的夥伴會說一句話（畫面左上、頭像＋對話泡泡，約 4 秒）。
 *           台詞資料先建好主線 5 位（白丸／颯／葛葉／茨木童子／汐音），未入隊的不會出聲；
 *           同一句不會連續重複；冷卻 25 秒（待機觸發 18 秒無操作）。只讀不寫存檔（「看過的地圖」存在記憶體）。
 *           依賴：00_core、04_ui（G.IN.lastAct）、03_actors（G.RPG/G.E）。
 * ========================================================================== */
'use strict';
(function () {
  const ctx = G.ctx;
  /* ---------- 台詞 ---------- */
  const L = {
    shiro: { face: 'face_shiro', name: '白丸',
      idle: ['……站著發呆，人是不會自己走回來的。', '我的耳朵癢。代表有人在說我壞話，或是要下雨了。', '你再不走，我就先去了。', '石頭做的身體不怕冷，可是怕無聊。', '小雪說我嘴硬。……我只是不愛講廢話。', '（白丸打了個大大的呵欠，石牙磨得喀喀響。）'],
      enter: { hub_shrine: ['回來了。鳥居還是那個鳥居，還好。', '小雪又熬夜了，社務所的燈一直亮著。'], W_R01_01: ['水車的聲音很吵，鼻子倒是很清楚。', '藥草的味道……那孩子昨晚身上就是這個味道。'],
        W_R01_03: ['這座橋，赤鬼最愛在下面躲。', '溪水聲會蓋過腳步聲。小心背後。'], W_R01_04: ['舊神社……以前也有一隻狛犬守在這裡。現在只剩台座了。', '竹子太密，風一吹，什麼聲音都像人在笑。'], W_R01_07: ['風好重。……這裡的風在哭。'] },
      fight: ['來了！', '左邊那隻交給我。', '別讓牠們繞到你背後。'], low: ['你在流血。退一步，換我。', '喂！站穩！'], lvup: ['……有長進。一點點。', '刀變快了。還不夠快。'],
      clear: ['結束了。走吧。', '哼，石頭比鬼硬。'], loot: ['那東西在發光。撿起來，別浪費。'], home: ['到家了。……我是說，到神社了。'] },
    hayate: { face: null, name: '颯',
      idle: ['要不要比一下誰先到下一個路口？', '風往東吹。……我只是隨口說說。', '我哥以前也這樣，站著不動就是在想事情。', '箭袋還有一半，夠用。'],
      enter: { W_R02: ['水聲這麼急，上游一定出事了。'], W_R03: ['狐狸的地盤，說話小心點。'], W_R04: ['雷鳴峽……我族人以前在這裡押過貨。'] },
      fight: ['我從上面掩護你！', '別擋我的射線！'], low: ['撐住，我來引開牠們！'], lvup: ['不錯嘛，追得上我了。'], clear: ['一箭都沒浪費。'], loot: ['那個亮晶晶的，我先看到的。'], home: ['神社的飯糰，我要兩個。'] },
    kuzuha: { face: null, name: '葛葉',
      idle: ['……你也覺得，這裡的風帶著誰的聲音嗎？', '狐社的鈴，我好久沒搖了。', '別看我，我只是在想事情。', '如果名字能自己選，你會叫什麼？'],
      enter: { W_R03: ['這裡……是我長大的地方。'], W_R05: ['火的氣味，讓人想起祭典。'], W_R09: ['這些布上，都織著人的名字。'] },
      fight: ['我來畫結界，你們別踩出圈！', '退後，讓我淨化！'], low: ['別硬撐！到我這裡來！'], lvup: ['你的氣息變穩了。'], clear: ['結束了。……大家都還好嗎？'], loot: ['這個，有被人祝福過的痕跡。'], home: ['小雪姐姐，又在等我們吧。'] },
    ibaraki: { face: null, name: '茨木童子',
      idle: ['手……還是有點不習慣。被押了太久了。', '鬼不需要休息。……好吧，偶爾需要。', '你看什麼？我又沒在笑。', '酒吞那傢伙，現在大概又在喝了。'],
      enter: { W_R06: ['天上的書庫，連空氣都有墨水味。'], W_R08: ['大江……我的家鄉。'], W_R12: ['到這裡，就不能回頭了。'] },
      fight: ['讓開，這隻我來拆！', '鬼的拳頭，可不是拿來端酒杯的。'], low: ['躲到我後面！'], lvup: ['哼，還算像樣。'], clear: ['太弱了，連熱身都不夠。'], loot: ['值錢嗎？……我是說，拿去換飯吃。'], home: ['神社的人，不怕我了？'] },
    shion: { face: null, name: '汐音',
      idle: ['陸地好乾。……我不是在抱怨。', '姊姊說，海會記得每一艘沉下去的船。', '你知道嗎？貝殼裡聽得到很遠的地方。', '我可以哼歌嗎？小小聲的。'],
      enter: { W_R10: ['海的味道……我回來了。'], W_R11: ['這裡好冷。牽著我，別放手。'], W_R12: ['天上也有潮汐呢。'] },
      fight: ['受傷的人到我這邊！', '我會唱到你們站起來為止！'], low: ['我來治療，撐一下！'], lvup: ['你的心跳，聽起來更有力了。'], clear: ['大家都還在。太好了。'], loot: ['好漂亮，像海底的星星。'], home: ['神社的池塘，魚很少呢。'] }
  };
  /* 夥伴之間的對話（兩人都在隊伍時，待機觸發；先建好資料） */
  const PAIR = [
    [['hayate', '白丸，你真的是石頭做的？那你會不會沉下去？'], ['shiro', '……你要不要試試看，被石頭咬是什麼感覺。']],
    [['kuzuha', '茨木，你的手……還痛嗎？'], ['ibaraki', '不痛。……謝了。']],
    [['shion', '大家都會游泳嗎？'], ['shiro', '石頭不游泳。'], ['hayate', '天狗用飛的。']]
  ];

  const B = G.BANTER = { cur: null, cd: 600, last: {}, seen: {}, L, PAIR, extra: [] };
  const party = () => { const f = G.SAVE.data.flags, r = []; if (f.shiroJoin) r.push('shiro'); for (const id of ['hayate', 'kuzuha', 'ibaraki', 'shion'].concat(B.extra)) if (f['join_' + id]) r.push(id); const on = (G.PARTY && G.PARTY.slots ? G.PARTY.slots() : []).filter(Boolean); return r.filter(id => on.includes(id)); };   /* r3.27.7：只算出戰位 */
  /* 劇情進度：前期（1–4 章）／中期（5–8）／後期（9–12）／通關後 */
  B.stage = () => { const f = G.SAVE.data.flags; if (f.boss_W_R12_06) return 'post'; let c = 1; for (let i = 12; i >= 1; i--) if (f['ch' + i]) { c = i; break; } return c >= 9 ? 'late' : c >= 5 ? 'mid' : 'early'; };
  const pick = (id, arr) => { if (!arr || !arr.length) return null; let s; for (let i = 0; i < 4; i++) { s = arr[Math.floor(Math.random() * arr.length)]; if (s !== B.last[id]) break; } B.last[id] = s; return s; };
  B.say = function (id, text, force) {
    if (!text || (!force && (B.cur || B.cd > 0))) return false;
    B.cur = { id, text, t: 0, life: Math.max(200, 90 + text.length * 7) }; B.cd = 25 * 60; return true;
  };
  /* 觸發：kind ∈ idle/enter/fight/low/lvup/clear/loot/home */
  B.trigger = function (kind, force) {
    const p = party(); if (!p.length || G.mode !== 'play') return;
    if (kind === 'enter') { const sid = G.SC.id, reg = sid.slice(0, 5); if (sid === 'hub_shrine' && !G.SAVE.data.flags.matsu) return;   // 剛開場不說「回來了」
      for (const id of p) { const e = L[id].enter, lines = e[sid] || e[reg]; if (!lines) continue;
        const key = id + sid; if (B.seen[key] && Math.random() < 0.6) continue; B.seen[key] = 1; if (B.say(id, pick(id, lines), true)) return; } return; }
    if (kind === 'idle' && p.length >= 2 && Math.random() < 0.3) { const ok = PAIR.filter(c => c.every(([id]) => p.includes(id))); if (ok.length) { B.queue = ok[Math.floor(Math.random() * ok.length)].slice(); const [id, t] = B.queue.shift(); B.say(id, t, true); return; } }
    const id = p[Math.floor(Math.random() * p.length)], st = L[id].stage, arr = (L[id][kind] || []).concat(kind === 'idle' && st ? st[B.stage()] || [] : []);
    if (kind === 'idle' && L[id].place && L[id].place[G.SC.id.slice(0, 5)] && Math.random() < 0.4) { B.say(id, pick(id, L[id].place[G.SC.id.slice(0, 5)]), force); return; }
    B.say(id, pick(id, arr), force);
  };
  B.step = function () {
    if (B.cd > 0) B.cd--;
    if (B.cur && G.UI.ban && B.cur.t < 10) return;   // r3.145.0：有橫幅時，閒聊等橫幅結束再開始
    if (B.cur && ++B.cur.t >= B.cur.life) { B.cur = null; if (B.queue && B.queue.length) { const [id, t] = B.queue.shift(); B.say(id, t, true); } }
    if (G.DLG.active() || G.MENU.open) return;
    if (B.pendingEnter > 0 && --B.pendingEnter === 0) { B.trigger('enter'); if (G.SC.id === 'hub_shrine' && !B.cur && G.SAVE.data.flags.matsu) B.trigger('home', true); }
    if (G.t - (G.IN.lastAct || 0) > 18 * 60 && !B.cur && B.cd <= 0) { B.trigger('idle'); G.IN.lastAct = G.t; }
    const H = G.H; if (H.hp < H.hpMax * 0.3 && !B.lowSaid) { B.lowSaid = true; B.trigger('low', true); } if (H.hp > H.hpMax * 0.6) B.lowSaid = false;
    const alive = G.E.some(e => e.st !== 'dead' && e.delay <= 0); if (alive && !B.inFight) { B.inFight = true; B.trigger('fight'); } if (!alive && B.inFight) { B.inFight = false; if (G.E.length) B.trigger('clear'); }
  };
  /* r3.19.1：說話的夥伴在場時，改畫在夥伴頭頂的泡泡（不再與左側頭像重疊） */
  /* r3.146.0：左上頭像欄範圍（主角＋夥伴＋放招泡泡） */
  const hudRect = () => { const n = (G.PARTY && G.PARTY.list ? G.PARTY.list.length : 0); return { x1: Math.min(G.SAFE.l, 6) + 8 + 44 + 46 + 120, y1: G.SAFE.t + 84 + n * 58 }; };
  function head(c, d, a) { const P = G.PARTY && G.PARTY.list.find(q => q.id === c.id && q.st !== 'down'); if (!P || G.DLG.active()) return false;
    const sc = G.SC.depth(P.y), p = G.SC.toScreen(P.x, P.y - G.HERO_H * sc * 1.25); if (p.x < 0 || p.x > G.LW || p.y < 0 || p.y > G.LH) return false;
    ctx.globalAlpha = Math.max(0, a); ctx.font = `700 ${12 * G.FS()}px ${G.FONT}`;
    const lines = G.wrap(c.text, Math.min(240, G.LW * 0.32)), lh = 16 * G.FS(), w = Math.max(...lines.map(l => ctx.measureText(l).width), ctx.measureText(d.name).width) + 22, h = 20 + lines.length * lh;
    let x = Math.max(8 + G.SAFE.l, Math.min(G.LW - w - 8 - G.SAFE.r, p.x - w / 2)), y = Math.max(8 + G.SAFE.t, p.y - h - 10), dn = false;
    const hud = hudRect(); if (c._dn === undefined) c._dn = x < hud.x1 && y < hud.y1; if (c._dn) { const f = G.SC.toScreen(P.x, P.y); y = Math.min(G.LH - h - 8, f.y + 14); dn = true; }   // r3.168.0：上／下只在開頭決定一次
    if (c._bx === undefined) { c._bx = x; c._by = y; } else { c._bx += (x - c._bx) * 0.12; c._by += (y - c._by) * 0.12; } x = c._bx; y = c._by;   // r3.168.0：位置平滑，不跟著上下飄   // r3.146.0：會壓到左上頭像欄 → 改畫在腳下
    ctx.fillStyle = 'rgba(14,9,12,.86)'; G.rr(x, y, w, h, 9); ctx.fill(); ctx.strokeStyle = 'rgba(227,194,122,.55)'; ctx.lineWidth = 1; G.rr(x + .5, y + .5, w - 1, h - 1, 9); ctx.stroke();
    const tx = Math.max(x + 12, Math.min(x + w - 12, p.x)); ctx.fillStyle = 'rgba(14,9,12,.86)'; ctx.beginPath(); if (dn) { ctx.moveTo(tx - 6, y + 1); ctx.lineTo(tx + 6, y + 1); ctx.lineTo(tx, y - 8); } else { ctx.moveTo(tx - 6, y + h - 1); ctx.lineTo(tx + 6, y + h - 1); ctx.lineTo(tx, y + h + 8); } ctx.closePath(); ctx.fill();
    G.txt(d.name, x + 11, y + 11, 10, G.C.gold, 'left', G.FONT_S, 900); lines.forEach((l, i) => G.txt(l, x + 11, y + 11 + (i + 1) * lh, 12, G.C.ink, 'left', G.FONT, 700));
    ctx.globalAlpha = 1; return true; }
  B.draw = function () {
    const c = B.cur; if (!c) return; const d = L[c.id], a = Math.min(1, c.t / 10, (c.life - c.t) / 15);
    if (d && head(c, d, a)) return;
    ctx.globalAlpha = Math.max(0, a); ctx.font = `700 ${12 * G.FS()}px ${G.FONT}`;
    const lines = G.wrap(c.text, Math.min(320, G.LW * 0.42)), lh = 17 * G.FS(), w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 50, h = 22 + lines.length * lh;
    const bar = (G.BOSS && G.BOSS.enc && !G.BOSS.enc.done) || G.E.some(e => (e.boss || e.elite) && e.st !== 'dead'), x = (G.LW - w) / 2, y = G.SAFE.t + (bar ? 84 : 40) * G.FS();   // r3.146.0：講話的人不在畫面上 → 上方中央（避開頭像欄、頭目血條）
    ctx.fillStyle = 'rgba(14,9,12,.82)'; G.rr(x, y, w, h, 10); ctx.fill(); ctx.strokeStyle = 'rgba(227,194,122,.45)'; ctx.lineWidth = 1; G.rr(x + .5, y + .5, w - 1, h - 1, 10); ctx.stroke();
    if (d.face && G.IMG[d.face]) { ctx.save(); ctx.beginPath(); ctx.arc(x + 20, y + 20, 13, 0, 6.283); ctx.clip(); ctx.drawImage(G.IMG[d.face], x + 7, y + 7, 26, 26); ctx.restore(); }
    else { ctx.fillStyle = '#3a2a30'; ctx.beginPath(); ctx.arc(x + 20, y + 20, 13, 0, 6.283); ctx.fill(); G.txt(d.name[0], x + 20, y + 21, 12, G.C.gold, 'center', G.FONT_S, 900); }
    G.txt(d.name, x + 40, y + 12, 10, G.C.gold, 'left', G.FONT_S, 900);
    lines.forEach((l, i) => G.txt(l, x + 40, y + 12 + (i + 1) * lh, 12, G.C.ink, 'left', G.FONT, 700));
    ctx.globalAlpha = 1;
  };
  B.LINES = L;   // 供日後擴充／檢查
})();
