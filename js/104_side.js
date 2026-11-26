/* ==========================================================================
 * 神諭之地 重製版 — 104_side.js
 * Version : r3.62.0  (2026-11-24)
 * 變更    : r3.62.0 新增。F 項目第二批：
 *           1. 各章支線再補 2 條（共 24 條）：A＝探索區討伐（到該章探索區打倒指定數量後回報）；B＝尋物／問話（章節地圖調查 3 處後送到兩岸城）。
 *           2. 立約殿最終抉擇（第 12 章「終焉高台」開頭）：
 *              分給所有人（重新立約）＝照原本條件判定結局；讓小雪成為封印＝無名結局；打碎寶珠＝暴雨結局。
 *           ・任務在開機載入世界資料後才建立（需要章節地圖 id），只建立一次。
 * 存檔    : qc.c12_final（最終抉擇）；任務進度沿用 53_quest。
 * 依賴    : 53_quest（Q.add、by、choice、bond、xue）、52_hub（firstOf／ids）、98_explore（探索區場景 E<章>_<n>）。
 * ========================================================================== */
'use strict';
(function () {
  const Q = G.QST, F = () => G.SAVE.data.flags; if (!Q) return;
  const say = (who, text) => ({ who, text });
  /* [章, A 委託人, A 名字, A 內容, A 台詞, A 回報台詞, B 委託人, B 名字, B 內容, B 三處, B 收件人, B 收件台詞] */
  const SIDE = [
    [1, 'n_p_kinu', '阿絹', '月下金稻田的稻草人被鬼占了', '稻田那邊晚上有鬼在跳舞……稻子都被踩壞了。', '稻子保住了！今年的新米，第一碗給你。', 'n_p_gohei', '五平', '五平的工具箱', ['倒下的籬笆', '水車旁', '竹林口'], 'n_t_human_townswoman', '這是我家老頭子的鑿子……他每天都在找。謝謝你。'],
    [2, 'n_t_kappa_mentor', '河童長者', '柳蔭河堤的水妖太多', '河堤那邊的水妖不聽河童的話，把魚都趕跑了。', '魚回來了。河童欠你一次。', 'n_p_otoku', '阿德', '河童的小皿', ['河邊石頭', '蘆葦叢', '小橋下'], 'n_t_kappa_mentor', '小皿找回來了？這孩子終於能下水了。'],
    [3, 'n_t_fox_elder', '狐族長者', '稻架農家的野狐失控', '有幾隻年輕的狐狸被道摩的符迷了心……請把牠們打醒。', '牠們醒了，正在跟村民道歉呢。', 'n_sagitsune', '鷺狐', '嫁入行列的鈴鐺', ['稻架下', '鳥居旁', '田埂'], 'n_t_fox_elder', '這是新娘的鈴鐺……狐族會好好收著。'],
    [4, 'n_t_tengu_elder', '天狗長者', '巨杉霧嶺的雷妖作亂', '雷脈被攪亂之後，霧嶺的雷妖到處亂劈。', '霧散了。天狗們能飛了。', 'n_p_heihachi', '平八', '礦坑的平安符', ['坑道口', '吊橋邊', '雷石堆'], 'n_t_human_townswoman', '平安符……他說過一直帶在身上。'],
    [5, 'n_t_oni_veteran', '鬼鍛冶權六', '富士望道的野盜搶了鬼族的炭', '那些野盜把守爐用的炭全搶走了！', '炭拿回來了？爐火不會斷了。', 'n_chikage', '千景', '長屋的失物', ['灶房後', '井邊', '晾衣竿下'], 'n_chikage', '是我娘的梳子！我以為燒掉了……'],
    [6, 'n_t_human_elder', '茂兵衛爺', '赤壁雲棧的幻影', '關宿的旅人說，赤壁那邊有影子在攔路。', '旅人們回來了。古約的路通了。', 'n_hanasumi', '花澄', '古約的抄本', ['崖邊石碑', '棧道口', '倒塌的茶屋'], 'n_t_human_elder', '這一頁……正好是書庫缺的那一頁。'],
    [7, 'n_fumiya', '文也', '松並木古道的紙兵', '紙閣的紙兵逃出來，在古道上嚇人。', '紙兵都燒乾淨了。私塾的孩子可以去郊遊了。', 'n_hoan', '芳庵', '布街的染料', ['雨廊布街', '染坊後院', '河邊晒場'], 'n_hoan', '這種藍，只有這條街染得出來。'],
    [8, 'n_t_oni_veteran', '鬼鍛冶權六', '紅葉茶屋的醉鬼', '幾個鬼喝醉了在茶屋鬧事，人類都不敢上山了。', '酒醒了，他們在幫茶屋修屋頂。', 'n_umeno', '梅乃', '山路宿場的信', ['宿場門口', '杉並木下', '驛站馬廄'], 'n_t_human_townswoman', '是我弟弟寫的……他在鬼族那邊過得很好。'],
    [9, 'n_toma', '冬馬', '谷底回音盆地的蛛群', '盆地裡的蜘蛛越來越多，連織娘都不敢靠近。', '盆地安靜了。織娘說要給你做件衣服。', 'n_sasane', '笹音', '斷掉的絲線', ['回音石', '蛛網下', '溪邊'], 'n_sasane', '是八絃的絲……她還活著。'],
    [10, 'n_migiwae', '汀江', '破船礁灣的海賊', '礁灣的海賊在搶撈上來的寶物。', '寶物都回到漁村了。', 'n_migiwae', '汀江', '潮見舞台的面具', ['舞台下', '礁石間', '船骸旁'], 'n_t_human_townswoman', '這是祭典的面具……今年可以照常辦了。'],
    [11, 'n_fuyuno', '冬乃', '黃泉路上的亡者', '有些亡者迷路了，在活人的路上徘徊。', '他們都走過去了。謝謝你送他們一程。', 'n_kozueha', '梢葉', '亡者的口信', ['石室角落', '枯樹下', '冥燈旁'], 'n_kozueha', '……是我爹的聲音。他說，不怪我。'],
    [12, 'n_kagetsuna', '景綱', '終焉之前的掃蕩', '決戰前，把道摩殘兵清乾淨。', '城下沒有道摩兵了。……去吧，我們等你回來。', 'n_toma', '冬馬', '大家的護符', ['鎮災社', '斷權鳥居', '立約殿前'], 'n_kagetsuna', '每個人的護符都在這裡。帶著它們，去吧。'] ];
  function build() { if (Q.by.c1_s2_a) return; const HUB = G.HUB;
    for (const [c, ua, na, ta, la, ra, ub, nb, tb, spots, uc, rc] of SIDE) {
      const first = HUB.firstOf(c), L = (HUB.ids ? HUB.ids(c) : [first]).filter(id => G.D.scenes[id] && id !== HUB.bossOf(c)), second = L[1] || first, ex = 'E' + String(c).padStart(2, '0') + '_' + (c % 2 ? 1 : 2), exd = G.D.scenes[ex];
      const exName = exd ? exd.name.replace(/^探索・/, '') : '';
      if (G.D.scenes[first] && exd) Q.add({ id: 'c' + c + '_s2_a', ch: c, title: ta.slice(0, 12), desc: ta + '（探索區「' + exName + '」）', reward: { exp: 160 + c * 40, gold: 120 + c * 30 },
        giver: { map: first, at: 'center', dx: 220, u: ua, name: na, need: () => !!F()['ch' + c] || c === 1, lines: [say(na, la), say(na, '地方在「' + exName + '」，從這張地圖的探索標記就能過去。')] },
        steps: [{ t: 'kill', map: ex, at: 'center', n: 8, foes: (exd.foes || []).slice(0, 3), text: '在「' + exName + '」打倒 8 個敵人' },
          { t: 'talk', map: first, at: 'center', dx: 220, u: ua, name: na, text: '回報' + na, lines: [say(na, ra)] }] });
      if (G.D.scenes[second]) Q.add({ id: 'c' + c + '_s2_b', ch: c, title: tb, desc: nb + '在找' + tb.replace(/^.*的/, '') + '。', reward: { exp: 140 + c * 36, gold: 100 + c * 28 },
        giver: { map: 'hub_city', at: 'center', dx: -260 + c * 30, u: ub, name: nb, need: () => !!F()['ch' + c] && Q.isDone && Q.isDone(Q.L.find(q => q.ch === c && q.main) ? Q.L.find(q => q.ch === c && q.main).id : ''), lines: [say(nb, '我在「' + (G.D.scenes[second].name || '') + '」弄丟了東西……可以幫我找找嗎？')] },
        steps: [{ t: 'gather', map: second, text: '在「' + (G.D.scenes[second].name || '') + '」找線索', spots: spots.map((s, i) => ({ at: 'center', dx: [-260, 40, 300][i], label: s, lines: [say('蒼真', i < 2 ? '（' + s + '……沒有。）' : '（找到了！）')] })) },
          { t: 'talk', map: 'hub_city', at: 'center', dx: -260 + c * 30, u: uc, name: uc === ub ? nb : '委託人家屬', text: '把東西送回去', lines: [say(uc === ub ? nb : '委託人家屬', rc)] }] }); }
    /* 最終抉擇：終焉高台之前 */
    const m5 = Q.by.c12_m5; if (m5 && !m5._final) { m5._final = 1;
      m5.steps.unshift({ t: 'choice', map: 'W_R12_04', at: 'center', dx: 120, name: '小雪', key: 'c12_final', text: '寶珠的力量要怎麼處理？', lines: [say('小雪', '道摩倒下了。寶珠的力量……現在在我手上。'), say('小雪', '你決定吧。我會照你說的做。')],
        opts: [{ label: '分給所有人，重新立約', v: 'share', lines: [say('蒼真', '人、妖、神，每個人都拿一點。誰都不用一個人扛。'), say('小雪', '……嗯。那就要大家都來才行。')] },
          { label: '讓小雪成為新的封印', v: 'seal', lines: [say('蒼真', '……拜託妳了。'), say('小雪', '我知道了。（她笑了一下，有點寂寞。）')] },
          { label: '打碎寶珠，不再讓任何人背負', v: 'break', lines: [say('蒼真', '這種東西，不該存在。'), say('小雪', '打碎它……封印也會跟著碎。你確定嗎？'), say('蒼真', '……確定。')] }] }); }
    const ed = Q.by.c12_end; if (ed && !ed._final) { ed._final = 1; const st = ed.steps[0], l0 = st.lines;
      st.lines = function () { const v = Q.choice ? Q.choice('c12_final') : null, b0 = Q.bond, x0 = Q.xue;
        if (v === 'seal') { Q.bond = () => 0; Q.xue = () => 0; } else if (v === 'break') Q.bond = () => -9;
        try { return typeof l0 === 'function' ? l0.apply(this, arguments) : l0; } finally { Q.bond = b0; Q.xue = x0; } }; } }
  const bt0 = G.ASSET.boot.bind(G.ASSET); G.ASSET.boot = () => bt0().then(r => { try { build(); } catch (e) { console.warn('side', e); } return r; });
  G.SIDE2 = { SIDE, build };
})();
