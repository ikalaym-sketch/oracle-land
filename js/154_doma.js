/* =====================================================================
 * 154_doma.js
 * 版本    : r3.154.0  (2026-11-27)　r3.154.0：道摩「……」改成動作描述
 * 舊版    : r3.136.0  (2026-11-27)
 * 說明    : 劇情補完・支線第 4 批「道摩的記憶」（5 段）。
 *           ‧ 主線推進到指定章節後，章節地圖出現「舊記憶的殘頁」；調查後播回憶（舊紙色濾鏡），最後回到現在由夥伴說一句。
 *             1 善良（第 2 章後・沉根汊澤）2 失望（第 5 章後・炭火共灶街）3 被拒絕（第 7 章後・古都晝之町）
 *             4 失去（第 9 章後・古都夜之町）5 相信力量（第 11 章後・黃泉之門）
 *           ‧ 讀完 5 段：立約殿與道摩開戰時多一個選項「把你的記憶說給他聽」。
 *             非魔化：道摩血量 −50%（戰鬥縮短），結局後日談多一段道摩離開；魔化：血量 −20%，戰後恢復神智說最後一句。
 *           ‧ 記錄：flags.domaMem（讀到第幾段）、flags.domaTold。
 * 依賴    : 53_quest、26_boss（B.start／onEnd）、102_fstory（enc.majin）、54_story_c（c12_end）
 * ===================================================================== */
(function () {
  const Q = G.QST, B = G.BOSS, SC = G.SC, ctx = G.ctx; if (!Q || !B) return;
  const F = () => G.SAVE.data.flags, D = id => Q.isDone(id), say = (who, text) => ({ who, text }), nar = t => say('', t), act = fn => ({ do: fn });
  let mem = false; const on = act(() => { mem = true; }), off = act(() => { mem = false; });
  const P = id => !!(G.PARTY && G.PARTY.list && G.PARTY.list.some(p => p && p.id === id));
  const M = [
    { need: () => !!F().boss_W_R02_06, map: 'W_R02_03', dx: 200, title: '殘頁・善良', lines: [nar('（紙頁一碰到你的手，四周的顏色就褪成了舊紙的黃。——三百年前，同一條河邊。）'),
      say('年輕的陰陽師', '別哭別哭，燒退了就不痛了。'), nar('（一個穿著素色狩衣的年輕人，膝上躺著發燒的人類孩子，旁邊還蹲著一隻皿乾裂的小河童。）'),
      say('村婦', '道滿大人，診金……我們家實在……'), say('道滿', '不用。這兩個孩子是一起掉進河裡的，我也一起治。'),
      say('小河童', '……你不怕河童嗎？'), say('道滿', '怕什麼？你的皿乾了，跟他的燒一樣，都是病。'), say('道滿', '術是用來讓大家都活下去的。人也好，河童也好。'),
      nar('（年輕人把一碗清水倒在小河童的皿上。小河童眨了眨眼，笑了。）'), off,
      say('河童長者', '……那個陰陽師。'), say('河童長者', '三百年前，有個陰陽師也這樣救過我。我一直記得他的手，很暖。'), say('小雪', '……那隻小河童，是長者大人？')] },
    { need: () => !!F().boss_W_R05_07, map: 'W_R05_01', dx: -220, title: '殘頁・失望', lines: [nar('（舊紙的黃色漫開。共灶街還沒有灶，只有兩堆對峙的火。）'),
      say('道滿', '火不夠，就一起燒。人類出柴，鬼族出炭，灶前坐誰都可以。'), say('鬼族的長老', '……人類會守約嗎？'), say('道滿', '我替他們擔保。用我的名字。'),
      nar('（畫面一轉。幾年後的夜裡，山上的鬼村燒成一片紅。）'), say('道滿', '（道滿跑上山的時候，只剩下灰。）……領主說，鬼族藏了盜匪。'),
      say('道滿', '我替他們擔保過的。用我的名字。'), nar('（他跪在灰裡，一個一個把燒焦的屍骨排好，排了一整夜。）'), off,
      say('鬼王', '（不知道什麼時候，鬼王站在你身後。）……那個陰陽師，是唯一回來替我們收屍的人類。'), say('鬼王', '後來他就不見了。原來……是變成了那副樣子。')] },
    { need: () => !!F().boss_R07_OSAKABE_TRIAL, map: 'Q_kyoto_day', dx: 200, title: '殘頁・被拒絕', lines: [nar('（古都的白天，陰陽寮的大殿。年輕的道滿跪在地上，面前是一排穿著官服的人。）'),
      say('道滿', '封印需要一個「器」。走進寶珠的人，不會回來。'), say('道滿', '請陰陽寮另尋方法。我願意花一輩子去找。'),
      say('陰陽頭', '封印的方法傳了幾百年。你一個年輕人，憑什麼說它錯？'), say('道滿', '憑那個要走進去的人，今年才十六歲。'),
      say('陰陽頭', '……妖言惑眾。除名。'), nar('（大殿的角落，另一個年輕的陰陽師低下頭，什麼都沒說。）'), off,
      say('文也', '（文也翻著從陰陽寮借來的舊冊，手停在一頁上。）……找到了。「道滿，除名。理由：妄言。」'),
      say('文也', '旁邊還有一行很小的字，是另一個人的筆跡：「吾未發一語。悔。——晴明」')] },
    { need: () => !!F().boss_BG_R09_TS01, map: 'Q_kyoto_night', dx: -200, title: '殘頁・失去', lines: [nar('（古都的夜，月亮很大。神社的方向，有一道光直直地衝上天。）'),
      say('道滿', '（道滿一路跑，鞋都跑掉了。）雪——！'), nar('（他衝進神社的時候，封印已經完成了。寶珠在台座上發著光，台座前只剩一件白衣。）'),
      nar('（白衣旁邊，坐著一隻發抖的小白狗，和一個握著刀、跪在地上的年輕劍士。）'), say('雪的聲音', '……道滿。不要恨任何人。'),
      say('道滿', '（道滿抱著那件白衣，聲音啞得聽不出來。）下一次……'), say('道滿', '下一次，我不會讓任何人犧牲。誰都不行。'), off,
      say('小雪', '（小雪沉默了很久。）……他一直記得她說的話。'), say('小雪', '只是做不到。'), say('白丸', '……那隻小白狗，是我。'), say('白丸', '我記得那天晚上。我一直以為，那個陰陽師是來搶珠子的。')] },
    { need: () => !!F().boss_BG_R11_IZ01, map: 'W_R11_05', dx: 200, title: '殘頁・相信力量', lines: [nar('（舊紙的顏色變得很暗。這是道摩——已經不再叫道滿的人——第一次奪走碎片的夜晚。）'),
      say('道摩', '立約，靠的是人心。'), say('道摩', '可是人心會變。領主會毀約，陰陽寮會閉嘴，連我自己，都差點忘了她的臉。'),
      say('道摩', '只有力量不會變。'), say('道摩', '所以我不再請求了。誰擋路，我就從誰手上拿。'), nar('（他握緊碎片的時候，手上第一次冒出了黑色的冥火。）'), off,
      ...(P('ibaraki') ? [say('茨木', '……我懂他。我也是這樣恨過來的。')] : []), ...(P('kuzuha') ? [say('葛葉', '可是他忘了，力量也會變。會變成連自己都認不得的東西。')] : []),
      ...(P('hayate') ? [say('颯', '師父說過，最可怕的不是壞人，是放棄了的好人。')] : []), say('白丸', '……他是對的。只是方法，被逼得越來越狠。'), say('小雪', '蒼真。到了立約殿……我想跟他好好說話。')] }];
  /* 殘頁的調查點 */
  M.forEach((m, i) => Q.add({ id: 'dm_mem' + (i + 1), ch: [2, 5, 7, 9, 11][i], title: '道摩的記憶・' + m.title.replace('殘頁・', ''), desc: '某個地方，留著一張不屬於現在的紙。',
    need: () => m.need() && (i === 0 || D('dm_mem' + i)), reward: { exp: 300 + i * 100 },
    steps: [{ t: 'look', map: m.map, at: 'center', dx: m.dx, label: '舊記憶的殘頁', text: '調查「舊記憶的殘頁」', lines: [on, ...m.lines] }],
    done() { F().domaMem = i + 1; if (i === 4) G.UI.banner('道摩的記憶', '五段都讀完了——立約殿多了一個選項'); } }));
  /* 回憶濾鏡 */
  const dw0 = G.drawWorld; G.drawWorld = function () { dw0.apply(this, arguments); if (!mem) return; if (!G.DLG.active()) { mem = false; return; }
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); const W = ctx.canvas.width, Hh = ctx.canvas.height; ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgba(230,200,150,.85)'; ctx.fillRect(0, 0, W, Hh);
    ctx.globalCompositeOperation = 'source-over'; const g = ctx.createRadialGradient(W / 2, Hh / 2, Hh * 0.3, W / 2, Hh / 2, Hh * 0.9); g.addColorStop(0, 'rgba(60,40,20,0)'); g.addColorStop(1, 'rgba(60,40,20,.55)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, Hh); ctx.restore(); };
  /* 立約殿：把記憶說給他聽 */
  if (B.start) { const bs0 = B.start; B.start = function (id) { const enc = bs0.apply(this, arguments);
    if (enc && id === 'doma' && SC.id === 'W_R12_04' && (F().domaMem || 0) >= 5 && !F().boss_W_R12_04) { enc._mem = 1;
      G.STORY.later(40, () => { if (B.enc !== enc) return; G.DLG.start([say('道摩', '……還有話要說？'), { choice: [
        { label: '把你的記憶說給他聽', then: [say('蒼真', '你在共岸，替河童和人類的孩子治過病。你說，術是用來讓大家都活下去的。'),
          say('蒼真', '你替鬼族擔保過，跪在灰裡替他們收屍。你在陰陽寮跪著求他們另想辦法。'), say('蒼真', '雪走進寶珠的那天晚上，她叫你不要恨任何人。'),
          say('道摩', '……你怎麼會知道。'), say('小雪', '（小雪往前走了一步。）是你自己留下來的。那些紙，一直都在等人讀。'), say('道摩', '（道摩握著符紙的手，慢慢垂了下來。）'),
          act(() => { F().domaTold = 1; G.SAVE.markDirty(); for (const u of enc.units) { const k = enc.majin ? 0.8 : 0.5; u.hp = Math.round(u.hp * k); }
            G.UI.banner('道摩動搖了', enc.majin ? '魔化的力量鬆動了（血量 −20%）' : '他握刀的手在發抖（血量 −50%）'); })] },
        { label: '拔刀', then: [say('道摩', '……也好。')] }] }]); }); }
    return enc; }; }
  const oe0 = B.onEnd; B.onEnd = function (enc) { if (oe0) oe0.apply(this, arguments); if (enc && enc.id === 'doma' && SC.id === 'W_R12_04') F().domaMajinEnd = !!enc.majin;
    if (enc && enc._mem && F().domaTold) G.STORY.later(220, () => { if (G.DLG.active()) return; G.DLG.start(enc.majin ? [nar('（黑色的冥火從道摩身上一點一點退去。他睜開眼睛，眼神是清楚的。）'),
      say('道摩', '……雪說得對。我恨了太久，久到忘了自己為什麼開始。'), say('道摩', '神社的劍士。替我……向那個孩子說聲對不起。'), nar('（他閉上眼睛，像是終於睡著了。）')]
      : [say('道摩', '（道摩把奪來的碎片，一塊一塊放在地上。）……拿去吧。'), say('道摩', '我找了三百年的「別的方法」。'), say('道摩', '原來不是方法。是有人願意一起扛。'),
        say('小雪', '道滿先生……'), say('道摩', '……好久沒人這樣叫我了。')]); }); };
  /* 結局後日談：道摩離開 */
  { const q = Q.by.c12_end, s = q && q.steps[0]; if (s) { const L0 = s.lines; s.lines = function () { const L = (typeof L0 === 'function' ? L0.apply(this, arguments) : L0 || []).slice();
      if (F().domaTold && !F().domaMajinEnd) L.push(nar('（後來，有人在共岸的河邊，看到一個穿素色狩衣的旅人。）'), nar('（他蹲在河邊，替一隻皿乾掉的小河童倒了一碗水，然後往遠方走去了。）'));
      return L; }; } }
})();
