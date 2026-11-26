/* ==========================================================================
 * 神諭之地 重製版 — 11_npclife.js
 * Version : r3.11.1  (2026-11-14)
 * 變更    : r3.11.1 神社對話：名冊／柱子刻名改為尋人告示、黑衣人。
 * 說明    : NPC 生活感——NPC 之間會自己聊天（頭上對話泡泡，輪到誰說話就切說話姿勢、彼此面對面），
 *           閒置時偶爾轉頭張望。對話依劇情進度切換（例：小太找回前／後）。
 *           主角靠近（80px 內）時暫停閒聊，不搶玩家的互動；每段聊天間隔 9～16 秒。只讀旗標、不寫存檔。
 *           之後新增路人、動物：在 CONV 加場景與台詞即可；動物用 who:'animal' 只顯示「（喵）」類短句。
 * ========================================================================== */
'use strict';
(function () {
  const ctx = G.ctx, F = () => G.SAVE.data.flags;
  /* 場景 → 對話組；when() 決定劇情時段；lines: [說話者 npc id, 台詞] */
  const CONV = {
    hub_shrine: [
      { when: () => !F().nest, lines: [['gen', '告示我替妳看著，妳去睡一會兒。'], ['xue', '我睡不著，權爺。'], ['gen', '……當年那場大水，妳也才二十二歲。'], ['xue', '別說了。']] },
      { when: () => !F().nest, lines: [['xue', '權爺，夜裡鐘樓那邊，還有看見黑衣人嗎？'], ['gen', '昨晚沒有。可風一直沒停。'], ['xue', '……謝謝您。']] },
      { when: () => !F().nest, lines: [['gen', '白丸那傢伙跟著蒼真去了？'], ['xue', '嗯。牠嘴上不說，其實很擔心。'], ['gen', '跟妳一樣。']] },
      { when: () => !!F().nest, lines: [['xue', '風口那邊……風停了嗎？'], ['gen', '還沒。鐘繩一直在晃。'], ['xue', '他會回來的。']] }
    ],
    W_R01_01: [
      { when: () => !F().shoe, lines: [['okan', '阿松，喝口熱茶。妳一夜沒睡了。'], ['matsu', '我睡不著……一閉上眼，就聽見風在笑。'], ['okan', '蒼真那孩子靠得住。']] },
      { when: () => !F().shoe, lines: [['smith', '水車我先停一會兒。有聲音，我才聽得見。'], ['matsu', '謝謝你，鐵心。'], ['smith', '……嗯。']] },
      { when: () => true, lines: [['okan', '鐵心，那把刀，你賣給武士老爺多少錢？'], ['smith', '……沒賣。'], ['okan', '哼，難得。']] },
      { when: () => true, lines: [['matsu', '勘婆，退熱草還有嗎？'], ['okan', '有，給妳留了一把最嫩的。'], ['matsu', '等小太回來，我要煮一大鍋粥。']] },
      { when: () => !!F().shoe, lines: [['matsu', '聽說找到小太的草鞋了……'], ['smith', '鞋繩是從裡面割開的。他自己跑的，聰明。'], ['matsu', '那孩子……就是太會替別人想了。']] }
    ]
  };
  const L = G.NPCLIFE = { cur: null, wait: 300, bub: null,
    find(id) { return G.NPC.find(n => n.npc === id); },
    step() {
      if (G.DLG.active() || G.MENU.open || G.mode !== 'play') return;
      for (const n of G.NPC) if (n.npc && !n.talkTo && Math.random() < 0.004) n.face = -n.face;   // 偶爾轉頭張望
      const c = L.cur;
      if (c) { c.t++;
        if (c.t >= c.life) { const pr = c.lines[c.i], sp = L.find(pr[0]); if (sp) sp.speaking = false; c.i++;
          if (c.i >= c.lines.length) { for (const n of c.who) { n.talkTo = null; n.speaking = false; } L.cur = null; L.bub = null; L.wait = 540 + Math.random() * 420; return; }
          L.say(); }
        return; }
      if (--L.wait > 0) return;
      const list = (CONV[G.SC.id] || []).filter(v => v.when() && v.lines.every(([id]) => L.find(id)));
      if (!list.length) { L.wait = 600; return; }
      const v = list[Math.floor(Math.random() * list.length)], who = [...new Set(v.lines.map(l => l[0]))].map(L.find);
      if (who.some(n => Math.hypot(n.x - G.H.x, n.y - G.H.y) < 80)) { L.wait = 180; return; }   // 玩家站太近：先不聊
      who.forEach((n, i) => { n.talkTo = who[(i + 1) % who.length]; });
      L.cur = { lines: v.lines, i: 0, who, t: 0, life: 0 }; L.say();
    },
    say() { const c = L.cur, [id, text] = c.lines[c.i], n = L.find(id); if (!n) { c.life = 1; return; }
      n.speaking = true; c.t = 0; c.life = 100 + text.length * 8; L.bub = { n, text }; },
    /* 世界座標內繪製；文字固定螢幕大小 */
    draw(Z) {
      const b = L.bub; if (!b || !L.cur) return; const n = b.n, d = G.D.npc[n.npc], s = G.SC.depth(n.y), top = n.y - G.HERO_H * d.ratio * s - 8;
      const a = Math.min(1, L.cur.t / 8, (L.cur.life - L.cur.t) / 10);
      ctx.save(); ctx.translate(n.x, top); ctx.scale(1 / Z, 1 / Z); ctx.globalAlpha = Math.max(0, a);
      const fs = 11 * G.FS(); ctx.font = `700 ${fs}px ${G.FONT}`; const lines = G.wrap(b.text, 180), w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 16, h = lines.length * fs * 1.4 + 10;
      ctx.fillStyle = 'rgba(250,244,230,.94)'; G.rr(-w / 2, -h - 7, w, h, 8); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-5, -7.5); ctx.lineTo(5, -7.5); ctx.lineTo(0, 0); ctx.fill();
      ctx.fillStyle = '#2a1c20'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      lines.forEach((l, i) => ctx.fillText(l, 0, -h - 7 + 5 + fs * 0.7 + i * fs * 1.4));
      ctx.restore();
    },
    reset() { L.cur = null; L.bub = null; L.wait = 240; }
  };
})();
