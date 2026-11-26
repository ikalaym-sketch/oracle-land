/* ==========================================================================
 * 神諭之地 重製版 — 93_kassen.js
 * Version : r3.98.0  (2026-11-26)　r3.98.0：軍奉行軍備（兵種／防禦物／本陣）改成左清單＋右詳情，說明分行換行，費用與升級鍵固定在下方；面板加大
 * 舊版    : r3.70.0  (2026-11-24)　r3.70.0：梯子打壞時牆上忍者跳下來；物見櫓、本陣弓手、弓／鐵砲兵打得到爬梯忍者；結算剩下的兵糧換成錢　r3.69.0：r3.69.0：每波敵人更多、出得更密（紅葉河原敵人血量 ×1.3）；攻城器具改成隔波、一波最多一種；每波軍功 30＋波數×8　r3.68.0：r3.68.0：結算後自動回城（獎勵自動收）、每波清地面、軍功約 2～2.5 倍、兵種／防禦物依定位成長（修正兵種加成重複計算）、本陣升級 Lv3／Lv5 效果、建造點重排（每圖 22 個）　r3.67.0：r3.67.0：休息／布陣 60 秒（提早開打每秒換 1 兵糧）、兵糧收入提高、防禦物永久 10 級（Lv3／6／10 特性）＋戰中強化 5 級、兵種戰中 Lv10／20／30 里程碑、軍奉行升級當場套用　r3.62.0：r3.62.0：物見櫓駐軍（派 3 名弓／鐵砲進櫓，最多 2 隊）　r3.60.0：r3.60.0：操作面板移到左下（指揮／出兵／戰中強化／軍令／道具）；兵力上限 30～80、一隊 4～6 人；戰中強化 30 級（血攻防一起）；兵種特性 10 級（Lv3／6／10 特性）；本陣永久升級 8 項；軍令（全修／箭雨／鼓舞／援軍）；合戰道具 6 種；無限守家；打怪不給經驗與裝備　r3.59.0：r3.59.0：建築攻擊看得見（櫓上弓手拉弓、箭加粗拖尾、大筒後座與煙、拒馬反傷火花、篝火回血光點）　r3.57.0：r3.57.0：指揮系統、戰中兵糧、每波人數、建築強化　r3.56.0：結算可關閉　r3.55.0：軍奉行移到城門前廣場
 * 舊版    : r3.52.0  (2026-11-23)　r3.52.0：建造點每張圖 8 → 14 個；布陣／休息時多一個「軍備」鍵（升級、家紋、合戰商店），不用回城找軍奉行
 * 舊版    : r3.51.0  (2026-11-18)　r3.51.0：數值基準跟著一般妖怪血量 ×2.5
 * 舊版    : r3.50.0  (2026-11-18)　r3.50.0：軍奉行加「合戰商店」——靈紋石（重洗一條靈紋）、兵種書（提前解鎖兵種）
 * 舊版    : r3.49.0  (2026-11-18)
 * 變更    : r3.49.0 新增。合戰「守家」（依 2026-11-17_1705_KASSEN_PLAN_v1）。
 *           ・兩張合戰專屬地圖：紅葉河原 WAR_MOMIJI（白天，守本陣）、月夜城 WAR_MOON（夜晚，守城門）。
 *           ・流程：布陣 30 秒（可提前開戰）→ 8 波（波間休息 15 秒，可修理／建造）→ 第 8 波敵大將；
 *             據點血量歸零或主角第 2 次倒下＝失敗；守過 8 波或打倒敵大將＝勝利。
 *           ・出兵：6 兵種（槍／盾／弓／鐵砲／忍者／武者），帶 4 種上場（布陣時可換），花兵糧出一隊 3 人（Lv5 4 人），同時最多 12 名。
 *           ・建造：8 個建造點，6 種防禦物（馬防柵／逆茂木／竹束／物見櫓／大筒／篝火），有血量、損壞圖、毀壞殘骸。
 *           ・攻城兵器：破城槌（4 兵推）、攻城梯（第 5 波起，忍者爬下）、竹束車（後方鐵砲兵正面打不到）、敵陣大筒（落點預警）。
 *           ・兵糧：開場 300、每秒 +3、殺敵 +10／精英 +40、地上兵糧袋要主角撿。軍功（文字顯示）：升級、合戰商店。
 *           ・軍奉行（兩岸城）：兵種 Lv1～5、防禦物 Lv1～2、家紋 8 種（我方藍、敵方紅，旗與背旗疊家紋）。
 * 存檔    : G.SAVE.data.kz = { gk:軍功, lv:{兵種:等級}, dl:{防禦:等級}, kamon:0～7, sel:[4 兵種], clr:{地圖_難度:1} }
 * 依賴    : 03_actors（spawnOni／damageOni／oniStep／drawOni／bodyX）、22_event（EV）、23_warp（WARP）、76_vfx／86_fx2（VX.s2／draw2／x2）、
 *           48_occlude（OCC.add 排序）、49_party（PARTY.tap）、20_npc（AMB）。
 * ========================================================================== */
'use strict';
(function () {
  const ctx = G.ctx, SC = G.SC, H = G.H, A = G.ANIM, VX = G.VX, C = G.C, TK = 1000 / 60, HH = () => G.HERO_H, S = y => SC.depth(y);
  const rnd = a => a[Math.floor(Math.random() * a.length)], R = (a, b) => a + Math.random() * (b - a), dist = (a, b) => Math.hypot(a.x - b.x, (a.y - b.y) * 1.4);
  const KS = () => { const s = G.SAVE.data; if (!s.kz) s.kz = { gk: 0, lv: {}, dl: {}, kamon: 0, sel: null, clr: {} }; return s.kz; };
  const P = () => (G.AMB ? G.AMB.P() : 1);
  /* ---------- 定義 ---------- */
  const UNIT = {
    spear: { n: '槍足輕', u: 'yaribushi', ico: 'ico_unit_spear', cost: 60, cd: 360, hp: 9, atk: 0.16, reach: 60, sp: 1.3, p: 1, sk: '槍衾：衝過來的敵人受 2 倍傷害' },
    shield: { n: '盾足輕', u: 'doma_shield_soldier', ico: 'ico_unit_shield', cost: 80, cd: 480, hp: 18, atk: 0.08, reach: 56, sp: 1.15, p: 4, sk: '盾壁：吸引附近敵人，身後我方受傷減半' },
    bow: { n: '弓足輕', u: 'ashiyumi', ico: 'ico_unit_bow', cost: 70, cd: 360, hp: 5, atk: 0.13, reach: 270, sp: 1.2, p: 1, rg: 1, sk: '火矢：命中點燃敵人' },
    gun: { n: '鐵砲足輕', u: 'ashigun', ico: 'ico_unit_matchlock', cost: 100, cd: 600, hp: 5, atk: 0.38, reach: 310, sp: 1.1, p: 4, rg: 2, rel: 150, sk: '三段擊：三人輪流開槍，不用等裝填' },
    ninja: { n: '忍者', u: 'ninja', ico: 'ico_unit_ninja', cost: 90, cd: 720, hp: 7, atk: 0.12, reach: 52, sp: 1.9, p: 8, sk: '煙玉：讓一區敵人暫停攻擊' },
    samurai: { n: '武者', u: 'kagemusha', ico: 'ico_unit_samurai', cost: 150, cd: 900, hp: 13, atk: 0.3, reach: 66, sp: 1.35, p: 8, sk: '突擊號令：附近我方攻擊提高' }
  };
  const UK = ['spear', 'shield', 'bow', 'gun', 'ninja', 'samurai'];
  const DEF = {
    fence: { n: '馬防柵', s: 'war_fence', cost: 50, hp: 90, k: 0.95, hw: 0.78, solid: 1, d: '擋路很耐打；攻擊它的敵人會被尖刺反傷', up: '血量加倍' },
    abatis: { n: '逆茂木', s: 'war_abatis', cost: 60, hp: 25, k: 1.0, hw: 0, d: '碰到的敵人受重傷、速度減半', up: '傷害提高' },
    bamboo: { n: '竹束', s: 'war_bamboo', cost: 40, hp: 30, k: 1.0, hw: 0.42, solid: 1, d: '身後我方（含主角）受傷減半；附近鐵砲裝填加快', up: '範圍加寬' },
    tower: { n: '物見櫓', s: 'war_tower', cost: 120, hp: 30, k: 0.78, hw: 0.5, solid: 1, d: '櫓上 2 名弓手自動射擊，射程很長', up: '櫓上射手 3 名' },
    cannon: { n: '大筒', s: 'war_cannon', cost: 150, hp: 25, k: 1.0, hw: 0.5, solid: 1, d: '每 6 秒自動開砲，炸一大片', up: '裝填變快' },
    brazier: { n: '篝火', s: 'war_brazier', cost: 30, hp: 15, k: 0.9, hw: 0.18, solid: 1, d: '忍者現形；旁邊我方攻擊 +25%、每秒回血', up: '範圍變大' }
  };
  const DK = ['fence', 'abatis', 'bamboo', 'tower', 'cannon', 'brazier'];
  const KAMON = ['下弦月羽', '三つ巴', '桔梗', '下り藤', '四つ菱', '荒波', '雁', '鶴丸'];
  const MAP = {
    WAR_MOMIJI: { n: '紅葉河原', p: 4, foeK: 1.3, base: { x: 205, y: 330, r: 46 }, banner: [232, 322], ebanner: [1590, 318],
      routes: [{ x: 1650, y: [400, 680], w: 1 }, { x: 1540, y: [320, 345], w: 1 }, { x: 300, y: [905, 925], w: 4 }],
      slots: [[440,  340], [455,  470], [365,  585], [820,  330], [860,  500], [820,  680], [620,  300], [640,  560], [600,  760], [1060,  420], [1080,  640], [150,  420], [330,  395], [360,  270], [240,  495], [60,  495], [480,  245], [150,  570], [540,  395], [240,  645], [510,  570], [60,  645]],   /* r3.68.0：拿掉敵人出口 320 內的點，本陣周圍補點，每點相距 ≥125（共 22 個） */
      human: ['yaribushi', 'ashiyumi', 'ashigun', 'sanzoku', 'doma_shield_soldier'], yokai: ['akaoni', 'kurooni'], boss: 'kagemusha', bossN: '赤備武者大將',
      ecannon: [1572, 352] },
    WAR_MOON: { n: '月夜城', p: 8, night: 1, gate: 1, base: { x: 1215, y: 268, r: 70 },
      routes: [{ x: [820, 980], y: 915, w: 1 }, { x: [380, 460], y: 878, w: 1 }, { x: [1180, 1240], y: 890, w: 1 }],
      slots: [[1080,  345], [1215,  380], [1350,  345], [520,  385], [700,  480], [1480,  420], [1440,  570], [360,  560], [1200,  560], [960,  430], [1560,  640], [960,  293], [1110,  443], [1320,  443], [1500,  318], [870,  368], [1020,  518], [780,  293], [870,  493], [1560,  493], [750,  393], [1320,  618]],   /* r3.68.0：拿掉敵人出口 320 內的點，本陣周圍補點，每點相距 ≥125（共 22 個） */
      ladders: [[372, 276], [1418, 282]], lamps: [[1124, 160], [1320, 160]],
      human: ['yaribushi', 'ashiyumi', 'ashigun', 'doma_shield_soldier', 'doma_spear_soldier'], yokai: ['akaoni', 'shikigami'], boss: 'doma_ritualist', bossN: '道摩的陰陽大將' }
  };
  const RANGED = new Set(['ashiyumi', 'ashigun', 'bandit_archer', 'doma_archer', 'skelgun']);
  /* 數值基準：同等級一般敵人的血量／攻擊（含合戰難度與遊戲難度）。兵、防禦物、據點都用「幾下」來定，不會因主角裝備忽強忽弱 */
  const gd = () => (G.GDIFF && G.GDIFF.cur ? G.GDIFF.cur() : { hp: 1, atk: 1 }), mul = () => (G.EV && G.EV.mul) || { hp: 1, atk: 1 };
  const refHp = c => (70 + 30 * (c.lv - 1)) * (G.EHP || 1) * mul().hp * gd().hp, refAtk = c => (10 + 4 * (c.lv - 1)) * mul().atk * gd().atk;
  const hitOpt = (c, e, frac, face, src) => ({ party: { face }, atk: refHp(c) * frac / Math.max(0.05, 1 - (e.def || 0) / ((e.def || 0) + 80)), crit: 5, critD: 150, src });
  const K = G.KASSEN = { on: false, c: null, MAP, UNIT, DEF, KAMON, menu: null };
  const lvU = k => Math.max(1, Math.min(10, KS().lv[k] || 1)), lvD = k => Math.max(1, Math.min(10, KS().dl[k] || 1));   /* r3.67.0：防禦物 2 → 10 級 */   // r3.60.0：兵種特性 5 → 10 級
  /* r3.60.0：本陣永久升級（軍奉行・本陣）＋戰中強化（兵糧） */
  const GU = { bar: { n: '兵舍', d: '兵力上限 +10' }, rice: { n: '兵糧所', d: '兵糧進帳 +20%' }, loot: { n: '戰利', d: '擊破兵糧 +25%' }, start: { n: '軍需', d: '開局兵糧 +100' },
    base: { n: '本陣普請', d: '本陣血量 +20%、受傷 −6%、每秒回 0.1%' }, eng: { n: '工兵', d: '建造 −8%、修理 −10%、防禦物耐久 +15%' }, cmd: { n: '軍令', d: '軍令冷卻 −10%' }, drill: { n: '調練', d: '出兵冷卻 −8%' } };
  const GUF = { bar: ['開局免費出一隊槍兵', '每隊 +1 人'], rice: ['休息中兵糧 ×2', '每波開始 +100 兵糧'], loot: ['精英必掉兵糧袋', '道具掉落率 ×2'], start: ['開局送 1 個合戰道具', '開局免費一座物見櫓'], base: ['本陣弓手自動射擊', '本陣第一次低於 30% 時修復 30%'], eng: ['建好後 5 秒無敵', '休息開始時自動修理 50%'], cmd: ['軍令效果 +30%', '軍令冷卻再 −20%'], drill: ['新出陣的兵 3 秒無敵', '出兵冷卻再 −25%'] };
  const GK = Object.keys(GU), GMAX = 5, gu = k => Math.min(GMAX, (KS().up || {})[k] || 0);
  const CAP = () => 30 + 10 * gu('bar');
  const UMAX = 30, ulv = (c, k) => (c.ulv && c.ulv[k]) || 0, uCost = l => Math.round(30 + 20 * l + 2 * l * l), bCost = l => Math.round(40 + 25 * l + 2 * l * l), rCost = l => 80 + 60 * l;
  const buf = (c, k) => !!(c.buf && c.buf[k] > 0);
  /* r3.68.0：兵種依定位成長（每戰中級；永久每級 ×2）——hp 血量、atk 攻擊、dr 受傷減免（逐級相乘）、spd 射速、ev 閃避 */
  const UG = { shield: { r: '坦', hp: 8, atk: 2, dr: 3 }, spear: { r: '均衡', hp: 5, atk: 4, dr: 2 }, samurai: { r: '均衡偏攻', hp: 5, atk: 6, dr: 1 }, bow: { r: '遠攻', hp: 3, atk: 6, dr: 1, spd: 1 }, gun: { r: '爆發', hp: 2, atk: 8, dr: 1 }, ninja: { r: '刺客', hp: 3, atk: 5, dr: 0, ev: 1 } };
  const ugN = (c, k) => ulv(c || {}, k) + 2 * (lvU(k) - 1), ugOf = k => UG[k] || UG.spear;
  const uHp = (c, k) => 1 + ugOf(k).hp / 100 * ugN(c, k), uAtk = (c, k) => 1 + ugOf(k).atk / 100 * ugN(c, k), uDr = (c, k) => Math.max(0.3, Math.pow(1 - ugOf(k).dr / 100, ugN(c, k))), uEv = (c, k) => Math.min(0.3, (ugOf(k).ev || 0) / 100 * ugN(c, k));
  const ugTxt = k => { const g = ugOf(k), L = []; if (g.hp) L.push('血 +' + g.hp + '%'); if (g.atk) L.push('攻 +' + g.atk + '%'); if (g.dr) L.push('減傷 ' + g.dr + '%'); if (g.spd) L.push('射速 +' + g.spd + '%'); if (g.ev) L.push('閃避 +' + g.ev + '%'); return L.join('・'); };
  /* r3.68.0：防禦物依定位成長（戰中每級；永久每級 = 1/3） */
  const BG = { fence: { r: '血量型', hp: 40, dmg: 10 }, bamboo: { r: '防禦型', hp: 30, dr: 4 }, abatis: { r: '攻擊型', dmg: 35, hp: 10 }, tower: { r: '均衡', dmg: 20, hp: 15, rng: 5 }, cannon: { r: '攻擊型', dmg: 35, rad: 5 }, brazier: { r: '輔助', rad: 10, heal: 20, hp: 10 } };
  const bgN = (k, up) => (up || 0) + (lvD(k) - 1) / 3, bgK = (k, f, up) => 1 + ((BG[k] || {})[f] || 0) / 100 * bgN(k, up);
  const bgTxt = k => { const g = BG[k], N = { hp: '耐久', dmg: k === 'fence' ? '反傷' : '傷害', dr: '身後減傷', rng: '射程', rad: '範圍', heal: '回血' }, L = []; for (const f of ['hp', 'dmg', 'dr', 'rng', 'rad', 'heal']) if (g[f]) L.push(N[f] + ' +' + g[f] + '%'); return L.join('・'); };
  /* r3.67.0：防禦物等級——永久 Lv（每級血量／傷害 +12%，Lv3／6／10 特性）＋戰中強化 up（每級 +25%，最多 5） */
  const DL = (k, n) => lvD(k) >= n, dk = k => bgK(k, 'dmg', 0), bu = b => 1, dm = b => bgK(b.k, 'dmg', b.up) * adj(b), BUP = 5, upCost = b => Math.round(DEF[b.k].cost * (0.8 + 0.6 * (b.up || 0)));
  const FL = [3, 6, 10], FEAT = { fence: ['血量加倍', '擊退攻擊者', '被打壞時炸出木刺'], abatis: ['傷害 +50%', '刺中的敵人定身 0.5 秒', '刺中的敵人流血'], bamboo: ['範圍加寬', '反彈射向身後的箭（50%）', '身後我方每秒回血 1%'],
    tower: ['櫓上射手 3 名', '火矢（點燃）', '連射（間隔 −40%）'], cannon: ['裝填加快', '落點燒地', '一次兩發'], brazier: ['範圍變大', '攻擊加成 25% → 40%', '敵人畏火：靠近會僵住'] };
  const hbOf = (c, k) => refAtk(c) * DEF[k].hp * (k === 'fence' && DL('fence', 3) ? 2 : 1) * (1 + 0.15 * gu('eng'));
  function reB(c, b) { const r = b.hpMax ? b.hp / b.hpMax : 1, mx = hbOf(c, b.k) * bgK(b.k, 'hp', b.up); b.hpMax = mx; b.hp = Math.max(1, mx * r); b.lv = lvD(b.k); }
  /* 軍奉行升級（布陣／休息中也能買）→ 當場套用到本陣、防禦物、已出陣的兵 */
  function applyGear(c) { const r = c.bhp / c.bhpMax; c.bhpMax = Math.round(refAtk(c) * 220 * (1 + 0.2 * gu('base'))); c.bhp = Math.max(1, c.bhpMax * r);
    for (const b of c.st) if (b.hp > 0) reB(c, b);
    for (const u of c.units) if (u.hp > 0) reU(c, u);
    VX.ring && VX.ring({ x: c.M.base.x, y: c.M.base.y, r1: 1.6, life: 24, col: '255,214,120', lw: 0.08 }); G.UI.toast('軍備升級已套用到這一場'); }
  function reU(c, u) { const hm = refAtk(c) * u.U.hp * uHp(c, u.k), q = u.hp / u.hpMax; u.hpMax = hm; u.hp = hm * q; u.atkK = u.U.atk * uAtk(c, u.k); u.fl = 6; }
  const early = c => { const sec = Math.floor(c.T / 60); if (sec > 0 && c.ready) { c.rice += sec; G.UI.toast('提早開打・兵糧 +' + sec); } c.T = 0; };
  /* 兵種特性：Lv3／6／10 各一個 */
  const TRAIT = { spear: ['槍衾：迎面衝來的敵人受 2 倍傷害', '長槍突刺：同時刺中身後一名敵人（60%）', '槍陣不退：血量低於 30% 時受傷減半'],
    shield: ['盾壁：吸引附近敵人，身後我方受傷減半', '盾擊：被打時 25% 讓攻擊者失衡 1 秒', '不動：受傷 −30%'],
    bow: ['火矢：命中點燃敵人', '連射：30% 多射一箭', '穿透箭：箭再命中後方一名敵人（50%）'],
    gun: ['三段擊：三人輪流開槍，不用等裝填', '狙擊：射程 +30%、對精英與大將 +30%', '散彈：同時打中旁邊 2 名敵人（40%）'],
    ninja: ['煙玉：讓一區敵人暫停攻擊', '暗殺：15% 造成 3 倍傷害', '分身：倒下時 40% 留下一個分身（血量一半）'],
    samurai: ['突擊號令：附近我方攻擊提高', '衝陣：對新目標的第一擊 2 倍並擊退', '不屈：致命傷時留 1 血、3 秒無敵（每人一次）'] };
  const TL = [3, 6, 10];
  /* 合戰道具（打怪掉落，身上最多 3 個） */
  const ITEM = { drum: { n: '軍太鼓', c: '鼓', col: '#e3b24a', d: '全軍攻速 +30%（20 秒）' }, sake: { n: '鬼神酒', c: '酒', col: '#e0503c', d: '全軍攻擊 +25%（20 秒）' }, pill: { n: '兵糧丸', c: '丸', col: '#7fd36b', d: '全軍與主角回血 30%' },
    armor: { n: '鐵甲符', c: '甲', col: '#9fc0e8', d: '全軍受傷 −30%（20 秒）' }, smoke: { n: '狼煙', c: '煙', col: '#cfc4b0', d: '敵軍全體緩速（12 秒）' }, powder: { n: '火藥桶', c: '火', col: '#ff8a3c', d: '敵人最密集處大爆炸' } };
  const IK = Object.keys(ITEM);
  /* 軍令（戰中按鈕） */
  const cmdK = () => (gu('cmd') >= 3 ? 1.3 : 1);
  const ORD = { fix: { n: '全修', cd: 0 }, rain: { n: '箭雨', cd: 60 }, rally: { n: '鼓舞', cd: 75 }, aid: { n: '援軍', cd: 120 } };
  const unlocked = k => P() >= UNIT[k].p || !!(KS().book || {})[k] || (G.CHEAT && G.CHEAT.on.map);
  const selDefault = () => { const L = UK.filter(unlocked); return L.slice(0, 4); };
  const sel = () => { const s = KS(); let L = (s.sel || []).filter(k => UNIT[k] && unlocked(k)); for (const k of selDefault()) if (L.length < 4 && !L.includes(k)) L.push(k); return L.slice(0, 4); };

  /* ---------- 圖：x2 圖集直接畫（UI 用螢幕像素） ---------- */
  const fr2 = (atl, n, i) => { const u = VX.x2(atl); const r = u && u.fx && u.fx[n]; if (!r) return null; return [u, r.f[Math.min(r.f.length - 1, i || 0)], r.f.length]; };
  function icon(n, x, y, w, h, a) { const q = fr2('x2_ui', n, 0); if (!q) return false; const [u, f] = q; ctx.save(); if (a !== undefined) ctx.globalAlpha *= a; ctx.drawImage(u.imgs[f[7] || 0], f[0], f[1], f[2], f[3], x, y, w, h || w); ctx.restore(); return true; }
  const KC = {};
  function kamonImg(i, col) { const key = i + col; if (KC[key]) return KC[key]; const q = fr2('x2_ui', 'kamon', i); if (!q) return null; const [u, f] = q;
    const c = document.createElement('canvas'); c.width = 128; c.height = 128; const g = c.getContext('2d'); g.drawImage(u.imgs[f[7] || 0], f[0], f[1], f[2], f[3], 0, 0, 128, 128);
    g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, 128, 128); return (KC[key] = c); }
  const BLUE = '#27497e', RED = '#9a2b24';
  function banner(x, y, ours, k) { k = k || 1.2; const n = ours ? 'war_banner_ours' : 'war_banner_enemy', fi = Math.floor(G.t / 9 + x) % 4; if (!VX.draw2(ctx, n, fi, x, y, k)) return;
    const sc = HH() * S(y) * k / 160, im = kamonImg(ours ? KS().kamon : (K.c ? K.c.ekamon : 1), ours ? BLUE : RED); if (im) ctx.drawImage(im, x + (57 - 10.3) * sc - 24 * sc, y + (130 - 352.5) * sc - 24 * sc, 48 * sc, 48 * sc); }
  function sashimono(x, y, face, ours, s) { const k = 0.95, n = ours ? 'war_sashimono_ours' : 'war_sashimono_enemy', bx = x - face * 0.1 * HH() * s, by = y - 0.5 * HH() * s, fi = Math.floor(G.t / 10 + x) % 4;
    if (!VX.draw2(ctx, n, fi, bx, by, k, { flip: face > 0 })) return; const sc = HH() * S(y) * k / 160, im = kamonImg(ours ? KS().kamon : (K.c ? K.c.ekamon : 1), ours ? BLUE : RED);
    if (im) { const cx = bx + (face > 0 ? -1 : 1) * (15 - 2.5) * sc, cy = by + (30 - 80.2) * sc; ctx.drawImage(im, cx - 7 * sc, cy - 7 * sc, 14 * sc, 14 * sc); } }

  /* ---------- 據點與目標 ---------- */
  const baseObj = c => c.baseT || (c.baseT = { base: 1, get x() { return c.M.base.x; }, get y() { return c.M.base.y; }, r: c.M.base.r, alive: () => c.bhp > 0,
    hurt: (d, src) => { d *= (1 - 0.06 * gu('base')) / (1 + 0.03 * c.blv); c.bhp = Math.max(0, c.bhp - d); c.bflash = 8; if (c.bhp <= 0 && !c.done) lose(c, c.M.gate ? '城門被攻破' : '本陣被攻破'); } });
  const heroT = { hero: 1, get x() { return H.x; }, get y() { return H.y; }, r: 10, alive: () => H.hp > 0, hurt: (d, e) => G.hurtHero(d * 0.8, e ? e.x : H.x) };
  const soldierT = u => ({ x: u.x, y: u.y, r: 14, u, alive: () => u.hp > 0, hurt: (d, e) => hurtUnit(u, d, e) });
  const structT = b => ({ x: b.x, y: b.y, r: DEF[b.k].hw * HH() + 10, b, alive: () => b.hp > 0, hurt: d => hurtStruct(b, d) });

  /* ---------- 開戰 ---------- */
  K.start = function (w, h) {
    const id = SC.id, M = MAP[id]; if (!M) return null; const d = SC.def, i = w.diff.i, lv = G.RPG.d().lv + w.diff.off;
    const c = { n: '守家', k: 'war', war: 1, kz: 1, lv, t: 0, h, w, M, id, diff: i, ph: 'prep', T: 3600, wave: 0, rice: 400 + 100 * gu('start'), bhpMax: 1, ulv: {}, blv: 0, rlv: 0, buf: {}, items: [], cdS: {}, endless: w.mode === 'endless', downs0: G.SAVE.data.flags.downs || 0, downs: 0,
      units: [], st: [], bags: [], fx: [], ekamon: (KS().kamon + 3) % 8, kills: 0, wkill: 0, spawnQ: [], cdU: {}, edit: false, gk: 0 };
    c.bhpMax = Math.round(refAtk(c) * 220 * (1 + 0.2 * gu('base'))); c.bhp = c.bhpMax; K.c = c; K.on = true; G.EV.cur = c;
    SC.lock.east = SC.lock.west = '合戰中，無法離開'; SC.auto = false; d.obstacles = [];
    c.slots = M.slots.map(([x, y], j) => ({ i: j, x, y, b: null }));
    const all = M.human.concat(M.yokai, [M.boss, 'ninja', 'shikigami'], UK.map(k => UNIT[k].u));
    h.load(all).then(() => { c.ready = 1; });
    G.UI.banner('合戰　守家・' + M.n, (G.WARP.DIFF ? G.WARP.DIFF[i].n : '') + '・布陣 60 秒（靠近建造點可蓋防禦物）');
    c.obj = () => objText(c); c.step = () => step(c);
    return c;
  };
  function objText(c) { const W = c.endless ? '第 ' + Math.max(1, c.wave) + ' 波（無限）' : '第 ' + Math.max(1, c.wave) + '／8 波';
    if (c.ph === 'prep') return '守家・布陣（' + Math.ceil(c.T / 60) + ' 秒）'; if (c.ph === 'rest') return '守家・' + W + ' 結束（休息 ' + Math.ceil(c.T / 60) + ' 秒）';
    if (c.ph === 'wave') return '守家・' + W + '　守住' + (c.M.gate ? '城門' : '本陣'); return ''; }
  function win(c, why) { if (c.done) return; finishK(c, true, why); }
  function lose(c, why) { if (c.done) return; if (c.endless && c.wave > 8) return finishK(c, true, why + '・撐到第 ' + c.wave + ' 波'); finishK(c, false, why); }
  function finishK(c, ok, why) { const s = KS(), i = c.diff, pct = c.endless ? 1 : c.bhp / c.bhpMax, mk = [1, 1.5, 2, 3][i] * (c.endless ? 1 + Math.max(0, c.wave - 8) * 0.15 : 1);
    if (c.endless) { s.best = s.best || {}; s.best[c.id] = Math.max(s.best[c.id] || 0, c.wave); }
    delete SC.lock.east; delete SC.lock.west; delete G.SAVE.data.war;
    let gk = c.gk; if (ok) { gk += Math.round(200 * mk * (pct >= 0.8 && !c.downs ? 1.5 : pct >= 0.8 ? 1.2 : 1)); const key = c.id + '_' + i; if (!s.clr[key]) { s.clr[key] = 1; gk += 400; } }
    s.gk = (s.gk || 0) + gk; c.gkAll = gk;
    { const g = Math.min(Math.floor((c.rice || 0) * (1 + 0.5 * i)), 50000 * (1 + i)); if (g > 0) { G.RPG.d().gold += g; c.riceG = g; } }   /* r3.70.0：剩下的兵糧換成錢（每 1 兵糧 1 錢，困難 ×1.5、地獄 ×2、無間 ×2.5；上限 5 萬 ×難度） */
    c.rank = !ok ? '' : pct >= 0.8 && !c.downs ? 'S' : pct >= 0.4 ? 'A' : 'B';
    for (const e of G.E) if (e.kz && e.st !== 'dead') { e.st = 'dead'; e.t = 0; e.hp = 0; }
    if (ok) { c.h.reward(c, 3 * (1 + i * 0.7) * (c.rank === 'S' ? 1.5 : 1), Math.min(4, 1 + i), 1 + i * 2); if (i >= 2) c.h.reward(c, 1, 4);   /* 地獄以上必掉一件傳說 */
      if (Math.random() < [0.35, 0.5, 0.7, 1][i]) { let it = null; for (let k = 0; k < 60; k++) { it = G.RPG.roll(c.lv, 'wind'); if (it.q >= 2) break; } if (it) { if (it.q < 2) it.q = 2; it.set = 'yojin'; G.LOOT.push({ x: H.x + 30, y: H.y + 6, t: 0, kind: 'item', it }); } } c.h.finish(c, '守家　勝利　評價 ' + c.rank, (why ? why + '・' : '') + '軍功 +' + gk); }
    else c.h.fail(c, why + '・軍功 +' + gk);
    c.res = { ok, t: 420 }; G.SAVE.markDirty(); }

  /* ---------- 每格 ---------- */
  /* r3.68.0：結算後 EV 不再呼叫 step → 由 NPCLIFE.step 每格推進倒數、收獎勵、回城 */
  function doneStep(c) { if (c.res && c.res.t > 0) { c.res.t--; if (c.res.t < 100) for (const l of G.LOOT) { l.t = Math.max(l.t, 24); l.x += (H.x - l.x) * 0.3; l.y += (H.y - l.y) * 0.3; }   /* r3.68.0：結算後自動收獎勵、回城 */
        if (c.res.t === 1 && G.HUB && G.HUB.goCity && SC.id === c.id && !SC.trans) G.HUB.goCity(); } stepUnits(c); }
  { const ls0 = G.NPCLIFE.step; G.NPCLIFE.step = function () { ls0.apply(this, arguments); const c = K.c; if (c && c.done && c.res && c.res.t > 0 && SC.id === c.id) doneStep(c); }; }
  function step(c) {
    if (c.done) return doneStep(c);
    c.t++; if (c.bflash > 0) c.bflash--;
    if (c.t % 60 === 0) { c.rice += Math.round((c.ph === 'wave' ? 10 : 6 * (gu('rice') >= 3 ? 2 : 1)) * (1 + 0.2 * gu('rice')) * (1 + 0.15 * c.rlv)); c.bhp = Math.min(c.bhpMax, c.bhp + c.bhpMax * (0.001 * gu('base') + 0.0005 * c.blv)); }   // r3.60.0：兵糧所／本陣回血
    for (const k in c.buf) if (c.buf[k] > 0) c.buf[k]--; for (const k in c.cdS) if (c.cdS[k] > 0) c.cdS[k]--;
    /* 倒下：第 1 次在據點復活（等 10 秒），第 2 次失敗 */
    const dn = (G.SAVE.data.flags.downs || 0) - c.downs0; if (dn > c.downs) { c.downs = dn; if (dn >= 2) return lose(c, '主角第 2 次倒下');
      const b = c.M.base; H.x = b.x + (c.M.gate ? 0 : 110); H.y = b.y + (c.M.gate ? 90 : 60); H.inv = 600; c.reviveT = 600; G.UI.banner('退回' + (c.M.gate ? '城門' : '本陣') + '重整', '10 秒後再上陣・再倒下一次就失敗'); }
    if (c.reviveT > 0) { c.reviveT--; const b = c.M.base; H.x = b.x + (c.M.gate ? 0 : 110); H.y = b.y + (c.M.gate ? 90 : 60); H.act = null; }
    if (c.ph === 'prep' || c.ph === 'rest') { c.T--; if (c.T <= 0 && c.ready) nextWave(c); }
    else if (c.ph === 'wave') waveStep(c);
    stepUnits(c); stepStructs(c); stepBags(c); if (c.ph === 'wave') nameSkill(c);
    if (c.t === 90 && !c.gift) { c.gift = 1; if (gu('bar') >= 3 && unlocked('spear')) dispatch(c, 'spear', true); if (gu('start') >= 3 && c.items.length < 3) c.items.push(rnd(IK));
      if (gu('start') >= 5) { const B = c.M.base, sl = c.slots.filter(q => !q.b).sort((p, q) => Math.hypot(p.x - B.x, p.y - B.y) - Math.hypot(q.x - B.x, q.y - B.y))[0]; if (sl) { c.rice += bCostOf('tower'); build(c, sl, 'tower'); } }
      if (gu('bar') >= 3 || gu('start') >= 3) G.UI.toast('本陣支援已送到'); }
    if (gu('base') >= 3 && c.ph === 'wave' && c.t % 90 === 0) { const B = c.M.base, e = G.E.filter(q => q.kz && q.st !== 'dead' && !q.wo && q.delay <= 0 && (revealed(c, q) || wallN(q)) && Math.hypot(q.x - B.x, (q.y - B.y) * 1.4) < (wallN(q) ? 700 : 380)).sort((p, q) => Math.hypot(p.x - B.x, p.y - B.y) - Math.hypot(q.x - B.x, q.y - B.y))[0];
      if (e) { tracer(B.x, B.y - 60, e.x, e.y - 20, 'arrow'); G.damageOni(e, 1, false, false, hitOpt(c, e, 0.15 * (1 + 0.2 * gu('base')), Math.sign(e.x - B.x) || 1, null)); } }
    if (gu('base') >= 5 && !c.baseHeal && c.bhp < c.bhpMax * 0.3 && c.bhp > 0) { c.baseHeal = 1; c.bhp += c.bhpMax * 0.3; G.UI.banner('本陣普請', '本陣緊急修復 30%'); VX.ring && VX.ring({ x: c.M.base.x, y: c.M.base.y, r1: 2, life: 30, col: '150,230,150', lw: 0.1 }); }
    if (c.t % 20 === 0) { const s = KS(), sig = JSON.stringify([s.lv, s.dl, s.up]); if (c.sig && sig !== c.sig) applyGear(c); c.sig = sig; }
    for (const e of G.E) { if (!e.kz || e.st === 'dead' || e.wo) continue; if (e.type === 'ninja') e.alpha = revealed(c, e) ? 1 : 0.28;
      if (e.kzSlow > 0 && --e.kzSlow <= 0 && e.db) e.db.slow = 0;
      if (e.kzBleed > 0 && --e.kzBleed % 60 === 0) { G.damageOni(e, 1, false, false, hitOpt(c, e, 0.04 * dk('abatis'), 1, null)); VX.spark && VX.spark({ x: e.x, y: e.y, z: HH() * 0.4, n: 5, spd: 2, col: '200,30,30' }); }
      if (e.kzBurn > 0 && --e.kzBurn % 60 === 0) { G.damageOni(e, 1, false, false, hitOpt(c, e, 0.03, 1, null)); VX.s2('fx_burn', { x: e.x, y: e.y - 20, k: 0.5, life: 24 }); } }
  }
  const revealed = (c, e) => !c.M.night || Math.hypot(e.x - H.x, e.y - H.y) < 150 || c.st.some(b => b.k === 'brazier' && b.hp > 0 && Math.hypot(e.x - b.x, e.y - b.y) < braR(b));
  const braR = b => (DL('brazier', 3) ? 240 : 175) * bgK('brazier', 'rad', b && b.up);
  /* r3.56.0：同類防禦物相鄰（130 內）效果 +20% */
  const adj = b => K.c && K.c.st.some(q => q !== b && q.k === b.k && q.hp > 0 && Math.hypot(q.x - b.x, q.y - b.y) < 130) ? 1.2 : 1;
  function nextWave(c) { c.wave++; if (c.wave > 8 && !c.endless) return win(c, '守住 8 波'); c.ph = 'wave'; c.wkill = 0; c.edit = false; K.menu = null; clearField(c); if (gu('rice') >= 5) { c.rice += 100; G.NUMS.push({ x: c.M.base.x, y: c.M.base.y - 60, v: '兵糧 +100', t: 0 }); }
    const i = c.diff, w = c.wave, M = c.M, n = Math.min(110, 18 + w * 6 + i * 4), Q = c.spawnQ = [], ex = Math.max(0, w - 8);   /* r3.69.0：每波敵人更多（第 8 波約 66 隻） */   // r3.60.0：無限模式第 9 波起越來越強   // r3.56.0：第 8 波約 42 隻（原 22）
    const pool = M.human.concat(w >= 3 ? M.yokai : []).concat(w >= 5 && M.night ? [] : w >= 4 ? ['ninja'] : []);
    for (let k = 0; k < n; k++) Q.push({ t: rnd(pool), r: w >= 5 && k % 2 ? M.routes[(k >> 1) % M.routes.length] : pickRoute(M, w) });   // 第 5 波起分路同時進攻
    if (ex) for (const q of Q) { q.lvUp = Math.floor(ex / 2); q.hpK = 1 + 0.12 * ex; }
    if (w === 3 || w === 6 || (ex && w % 3 === 0)) for (let k = 0; k < 1 + Math.floor(ex / 6); k++) Q.splice(Math.floor(n / 2), 0, { t: rnd(M.human.concat(M.yokai)), r: pickRoute(M, w), elite: 1, lvUp: Math.floor(ex / 2), hpK: 1 + 0.12 * ex });
    if (w % 8 === 0) Q.push({ t: M.boss, r: M.routes[0], boss: 1, lvUp: Math.floor(ex / 2), hpK: 1 + 0.12 * ex });
    c.qT = 0; G.UI.banner(c.endless ? '第 ' + w + ' 波' + (ex ? '（敵人強化 +' + Math.round(ex * 12) + '%）' : '') : '第 ' + w + '／8 波', w % 8 === 0 ? M.bossN + '出陣！' : w === 4 && !M.gate ? '敵人從下方石頭缺口繞後！' : w === 5 && M.ladders ? '忍者搭梯子爬牆！' : '');
    /* 攻城兵器 */
    /* r3.69.0：攻城器具隔波出現、一波最多一種（月夜城：3 槌・5 梯・7 槌；紅葉河原：3 車・5 砲・7 車；無限每 3 波輪替） */
    const sg = M.gate ? { 3: 'ram', 5: 'ladder', 7: 'ram' } : { 3: 'cart', 5: 'ecannon', 7: 'cart' }, SR = M.gate ? ['ram', 'ladder'] : ['cart', 'ecannon'], kind = w <= 8 ? sg[w] : (w % 3 === 0 ? SR[(w / 3) % 2] : null);
    if (kind === 'ram' && M.gate) spawnRam(c); else if (kind === 'cart') spawnCart(c); else if (kind === 'ladder' && M.ladders) for (const p of M.ladders) spawnLadder(c, p);
    else if (kind === 'ecannon' && M.ecannon && !G.E.some(e => e.wo === 'ecannon' && e.st !== 'dead')) spawnObj(c, 'ecannon', M.ecannon[0], M.ecannon[1], refHp(c) * 5);
  }
  /* r3.68.0：每波開始清地面——兵糧袋換成兵糧、道具收進道具欄（滿了丟掉）、打壞的防禦物殘骸移除（建造點空出來）、屍體清掉 */
  function clearField(c) { let r = 0, n = 0; for (const b of c.bags) { if (b.got) continue; if (b.it) { if (c.items.length < 3) { c.items.push(b.it); n++; } } else r += 45; } c.bags = []; if (r) { c.rice += r; G.NUMS.push({ x: c.M.base.x, y: c.M.base.y - 40, v: '兵糧 +' + r, t: 0 }); }
    for (const sl of c.slots) if (sl.b && sl.b.hp <= 0) { c.st = c.st.filter(q => q !== sl.b); sl.b = null; } c.st = c.st.filter(b => b.hp > 0);
    c.units = c.units.filter(u => u.hp > 0); G.E = G.E.filter(e => !(e.kz && e.st === 'dead' && !e.wo)); if (n) G.UI.toast('撿回合戰道具 ' + n + ' 個'); }
  /* r3.70.0：梯子打壞 → 從這把梯子上牆的忍者跳到城內地面（之後一般兵也打得到） */
  function jumpDown(L) { for (const e of G.E) { if (e.fromL !== L || e.st === 'dead') continue; let y = e.y + 80; for (let k = 0; k < 12 && !SC.walkable(e.x, y); k++) y += 20; if (!SC.walkable(e.x, y)) continue;
      e.y = y; e.fromL = null; e.stun = Math.max(e.stun || 0, 40); e.alpha = 1; G.FX.push({ k: 'dust', x: e.x, y: e.y, t: 0, life: 22 }); } }
  const wallN = e => !!(e.fromL);   // 爬梯上牆的忍者：遠程（物見櫓、本陣弓手、弓／鐵砲兵）不受黑夜影響也打得到
  function pickRoute(M, w) { const L = M.routes.filter(r => (r.w || 1) <= w); return rnd(L); }
  const rpt = r => [Array.isArray(r.x) ? R(r.x[0], r.x[1]) : r.x, Array.isArray(r.y) ? R(r.y[0], r.y[1]) : r.y];
  function spawnFoe(c, t, x, y, o) { o = o || {}; const e = G.spawnOni(x, y, 10, c.lv + (o.lvUp || 0), t); if (!e) return null; e.kz = 1; e.ev = 1; e.kzh = !/oni$|shikigami/.test(t); e.cd = 40 + Math.random() * 60;
    if (o.elite) { c.h.elite(e, 4); e.elite = '精英'; }
    if (c.M.foeK) { e.hp = e.hpMax = Math.round(e.hpMax * c.M.foeK); }
    if (o.hpK) { e.hp = e.hpMax = Math.round(e.hpMax * o.hpK); e.atk = Math.round(e.atk * (1 + (o.hpK - 1) * 0.5)); }
    if (o.boss) { c.h.elite(e, 14); e.boss = true; e.elite = c.M.bossN; e.ratio = e.ratio / 1.15 * 1.4; e.kzBoss = 1; e.sumT = 300; c.bossE = e; }
    return e; }
  function waveStep(c) { if (!c.ready) return; c.qT--;
    if (c.spawnQ.length && c.qT <= 0 && G.E.filter(e => e.kz && !e.wo && e.st !== 'dead').length < (c.endless ? 50 : 40)) { const q = c.spawnQ.shift(), p = rpt(q.r); spawnFoe(c, q.t, p[0], p[1], q); c.qT = Math.max(8, 30 - c.wave * 2 - c.diff * 2); }   /* r3.69.0：出得更密、場上上限 40（無限 50） */   // 場上最多 30 隻（無限 40）
    /* 敵大將：陰陽大將召喚紙人 */
    const b = c.bossE; if (b && b.st !== 'dead' && b.type === 'doma_ritualist' && --b.sumT <= 0) { b.sumT = 480; for (let k = 0; k < 2; k++) spawnFoe(c, 'shikigami', b.x + R(-60, 60), b.y + R(-20, 20)); G.UI.toast('陰陽大將召喚紙人'); }
    if (c.bossE && c.bossE.st === 'dead') { c.gk += 120; if (!c.endless) return win(c, '打倒' + c.M.bossN + '・軍功 +120'); c.bossE = null; G.UI.banner('打倒' + c.M.bossN, '軍功 +120・無限守家繼續'); }
    /* 梯子出忍者 */
    for (const e of G.E) if (e.wo === 'ladder' && e.st !== 'dead' && --e.sT <= 0) { e.sT = 360; if (G.E.filter(q => q.fromL === e && q.st !== 'dead').length < 3) { const n = spawnFoe(c, 'ninja', e.x + R(-10, 10), e.y + 8); if (n) n.fromL = e; } }
    if (!c.spawnQ.length && !G.E.some(e => e.kz && !e.wo && e.st !== 'dead')) { G.E.forEach(e => { if (e.wo && e.wo !== 'ladder' && e.wo !== 'ecannon' && e.st !== 'dead') { e.hp = 0; e.st = 'dead'; e.t = 0; } });
      c.gk += 30 + c.wave * 8 + (c.endless ? Math.max(0, c.wave - 8) * 6 : 0); if (c.wave >= 8 && !c.endless) return win(c, '守住 8 波'); c.ph = 'rest'; c.T = 3600; if (gu('eng') >= 5) for (const b of c.st) if (b.hp > 0) b.hp = Math.min(b.hpMax, b.hp + b.hpMax * 0.5); G.UI.toast('第 ' + c.wave + ' 波擊退・軍功 +' + (30 + c.wave * 8) + '・休息 ' + (c.T / 60) + ' 秒（可修理／建造／強化）'); } }

  /* ---------- 敵人 AI：打主角交給原本邏輯；否則打兵、防禦物、據點 ---------- */
  const oni0 = G.oniStep;
  G.oniStep = function (e) { if (!e.kz || !K.c || K.c.done) { if (e.wo) return objStep(e); return oni0(e); } if (e.wo) return objStep(e); return foeStep(K.c, e); };
  function pick(c, e) {
    const dh = Math.hypot(H.x - e.x, (H.y - e.y) * 1.4); if (H.hp > 0 && !(c.reviveT > 0) && RANGED.has(e.type) && dh > 90 && dh < 250) return heroT;   /* 弓、鐵砲兵對主角放箭 */
    if (H.hp > 0 && !(c.reviveT > 0) && dh < 190) return null;
    if (G.PARTY && G.PARTY.list.some(p => p.hp > 0 && Math.hypot(p.x - e.x, (p.y - e.y) * 1.4) < 150)) return null;
    if (e.ram && e.ram.st !== 'dead') return { push: e.ram };
    let best = null, bd = 1e9;
    for (const u of c.units) { if (u.hp <= 0) continue; const d = dist(u, e) - (u.k === 'shield' && lvU('shield') >= 3 ? 70 : 0); if (d < 160 && d < bd) { bd = d; best = soldierT(u); } }
    if (best) return best;
    for (const b of c.st) { if (b.hp <= 0 || !DEF[b.k].solid) continue; const d = dist(b, e); if (d < 110 + DEF[b.k].hw * HH() && d < bd) { bd = d; best = structT(b); } }
    return best || baseObj(c); }
  function foeStep(c, e) {
    if (e.delay > 0 || e.st === 'dead' || e.st === 'hurt' || e.stun > 0) return oni0(e);
    if (e.kt === undefined || G.t % 15 === (e.ph | 0) % 15 || (e.kt && e.kt.alive && !e.kt.alive())) e.kt = pick(c, e);
    const T = e.kt; if (!T) return oni0(e);
    e.t++; if (e.flash > 0) e.flash--;
    if (e.kb) { const nx = e.x + e.kb; if (SC.walkable(nx, e.y)) e.x = nx; e.kb *= 0.8; if (Math.abs(e.kb) < 0.2) e.kb = 0; }
    G.enemyDebStep && G.enemyDebStep(e);
    if (T.push) { const r = T.push, sl = e.slot | 0; e.x += (r.x - r.face * (60 + (sl % 2) * 26) - e.x) * 0.25; e.y += (r.y + (sl < 2 ? -14 : 14) - e.y) * 0.25; e.face = r.face; e.st = 'walk'; return; }
    const rg = RANGED.has(e.type), bx = G.bodyX(e), reach = rg ? 230 : (T.r || 20) + 34 + bx, dx = T.x - e.x, dy = T.y - e.y, dd = Math.hypot(dx, dy * 1.4);
    const slow = abatisSlow(c, e);
    if (e.st === 'walk') { if (Math.abs(dx) > 4) e.face = Math.sign(dx); e.cd--;
      if (dd <= reach) { if (e.cd <= 0) { e.st = 'atk'; e.t = 0; e.atkHit = false; const r = e.u0 || (e.u0 = G.enemyUnit(e.type)), rec = r && (r.act.attack || r.act.atk); e.atkMs = (rec ? Math.max(600, A.dur(rec)) : 966) * 1.6; } }
      else { const sp = (e.sm ? 1.25 : 1.05) * (e.db && e.db.slow ? 0.5 : 1) * slow; G.tryMove(e, Math.abs(dx) > 4 ? Math.sign(dx) * sp : 0, Math.abs(dy) > 6 ? Math.sign(dy) * sp * 0.6 : 0); } }
    else if (e.st === 'atk') { const ms = e.t * TK;
      if (!e.atkHit && ms >= e.atkMs * 0.48) { e.atkHit = true; if (T.alive() && dd <= reach * 1.3) { const sm = e.smoke > 0 ? 0 : 1; if (rg) tracer(e.x, e.y - HH() * 0.55 * S(e.y), T.x, T.y - 18, e.type === 'ashigun' ? 'gun' : 'arrow');
          T.hurt(e.atk * sm * (T.base || T.hero ? 1 : 1.2), e); if (!rg) G.FX.push({ k: 'dust', x: T.x, y: T.y, t: 0, life: 16 }); } }
      if (ms >= e.atkMs) { e.st = 'walk'; e.t = 0; e.cd = 60 + Math.random() * 60; } }
    if (e.smoke > 0) e.smoke--; }
  function abatisSlow(c, e) { for (const b of c.st) if (b.k === 'abatis' && b.hp > 0 && Math.abs(e.x - b.x) < 0.7 * HH() && Math.abs(e.y - b.y) < 20) {
      if (!e.abT || G.t - e.abT > 30) { e.abT = G.t; G.damageOni(e, 1, false, false, hitOpt(c, e, (DL('abatis', 3) ? 0.18 : 0.12) * dm(b), Math.sign(e.x - b.x) || 1, b)); if (DL('abatis', 6) && !e.boss) e.stun = Math.max(e.stun || 0, 30); if (DL('abatis', 10)) e.kzBleed = Math.max(e.kzBleed || 0, 240); b.hp -= e.atk * 0.3; if (b.hp <= 0) breakStruct(c, b); }
      return 0.45; } return 1; }

  /* ---------- 攻城兵器（放進 G.E，主角與夥伴都打得到） ---------- */
  function spawnObj(c, kind, x, y, hp, o) { const e = G.spawnOni(x, y, 0, c.lv, 'akaoni'); if (!e) return null; Object.assign(e, { _gd: 1, elite: 0, wo: kind, kz: 1, hp, hpMax: hp, atk: 0, ratio: kind === 'ram' ? 1.5 : 1.2, face: -1, st: 'walk', alpha: 1, delay: 0 }, o || {}); return e; }
  function spawnRam(c) { const r = c.M.routes[0], p = rpt(r), e = spawnObj(c, 'ram', p[0], p[1] - 10, refHp(c) * 6); if (!e) return; e.face = 1;
    for (let k = 0; k < 4; k++) { const f = spawnFoe(c, rnd(['yaribushi', 'doma_spear_soldier']), p[0] + R(-40, 40), p[1]); if (f) { f.ram = e; f.slot = k; } } G.UI.toast('破城槌出現！打倒推槌的兵就會停'); }
  function spawnCart(c) { const r = c.M.routes[0], p = rpt(r), e = spawnObj(c, 'cart', p[0], p[1] - 10, refHp(c) * 4); if (!e) return;
    for (let k = 0; k < 2; k++) { const f = spawnFoe(c, 'ashigun', p[0] + R(30, 70), p[1] + (k ? 18 : -18)); if (f) f.cart = e; } G.UI.toast('竹束車推進：正面打不到後面的鐵砲兵'); }
  function spawnLadder(c, p) { const e = spawnObj(c, 'ladder', p[0], p[1], 3, { hits: 3, sT: 60 }); }
  function objStep(e) { const c = K.c; e.kb = 0; if (e.st === 'hurt') { e.st = 'walk'; } if (e.flash > 0) e.flash--; e.t++;
    if (e.st === 'dead') { if (e.hold === undefined) e.hold = 60; e.alpha = Math.max(0, 1 - Math.max(0, e.t - e.hold) / 40); return; }
    if (!c || c.done) return;
    const B = baseObj(c);
    if (e.wo === 'ram') { const pushers = G.E.filter(q => q.ram === e && q.st !== 'dead' && q.kt && q.kt.push).length; const dx = B.x - e.x, dy = B.y + 20 - e.y, d = Math.hypot(dx, dy);
      if (d > 70) { if (pushers) { const sp = 0.32 + 0.06 * pushers; e.x += dx / d * sp; e.y += dy / d * sp; e.face = Math.sign(dx) || 1; e.mv = 1; } else e.mv = 0; }
      else { e.mv = 0; if (pushers && (e.hitT = (e.hitT || 0) + 1) % 120 === 0) { B.hurt(c.bhpMax * 0.04 * (1 + c.diff * 0.15), e); SC.shake = 3; G.FX.push({ k: 'dust', x: B.x, y: B.y + 10, t: 0, life: 20 }); } } }
    else if (e.wo === 'cart') { const dx = B.x - e.x, dy = B.y - e.y, d = Math.hypot(dx, dy); e.face = Math.sign(dx) || 1; if (d > 260) { e.x += dx / d * 0.38; e.y += dy / d * 0.38; e.mv = 1; } else e.mv = 0;
      for (const q of G.E) if (q.cart === e && q.st === 'walk' && !(q.kt && q.kt === null)) { /* 鐵砲兵跟在車後 */ if (d > 260 && Math.hypot(q.x - e.x, q.y - e.y) > 50) { q.x += (e.x - e.face * 55 - q.x) * 0.08; q.y += (e.y + (q.y > e.y ? 18 : -18) - q.y) * 0.08; } } }
    else if (e.wo === 'ecannon') { e.face = -1; if ((e.fT = (e.fT || 200) - 1) <= 0) { e.fT = 360 - c.diff * 40; const L = [H].concat(c.units.filter(u => u.hp > 0), c.st.filter(b => b.hp > 0)); const t = Math.random() < 0.55 ? H : rnd(L);
        const tx = t.x + R(-30, 30), ty = t.y + R(-12, 12); c.fx.push({ k: 'warn', x: tx, y: ty, t: 0, life: 75, done: () => blast(c, tx, ty, e) }); VX.s2('fx_muzzle_big', { x: e.x - 50, y: e.y - 30, k: 0.9, life: 16 }); } } }
  function blast(c, x, y, src) { VX.s2('fx_blast', { x, y, k: 1.4, life: 30 }); SC.shake = Math.max(SC.shake || 0, 2); const r = 75;
    if (Math.hypot(H.x - x, (H.y - y) * 1.5) < r) G.hurtHero(refAtk(c) * 2.2, x);
    for (const u of c.units) if (u.hp > 0 && Math.hypot(u.x - x, (u.y - y) * 1.5) < r) hurtUnit(u, refAtk(c) * 3);
    for (const b of c.st) if (b.hp > 0 && Math.hypot(b.x - x, (b.y - y) * 1.5) < r + 20) hurtStruct(b, b.hpMax * 0.2); }
  /* 傷害修正：竹束車正面、梯子 3 下、盾壁、篝火加攻、槍衾 */
  const dmg0 = G.damageOni;
  G.damageOni = function (e, mult, big, fc, opt) {
    if (e.wo === 'ladder') { if (e.st === 'dead') return; e.flash = 8; e.hits--; e.hp = Math.max(0, e.hits); if (e.hits <= 0) { e.st = 'dead'; e.t = 0; G.UI.toast('攻城梯被打壞・牆上的忍者跳下來了'); jumpDown(e); } return; }
    if (e.cart && e.cart.st !== 'dead' && e.cart.hp > 0) { const ax = opt && opt.party ? (opt.src ? opt.src.x : e.x - opt.party.face * 50) : H.x; if ((ax - e.cart.x) * e.cart.face > 0) { mult *= 0.15; if (G.t % 20 === 0) G.NUMS.push({ x: e.x, y: e.y - HH() * S(e.y) - 14, v: '擋', t: 0 }); } }
    const was = e.st; dmg0(e, mult, big, fc, opt);
    if (e.kz && e.st === 'dead' && was !== 'dead' && K.c && !K.c.done && !e.wo) { const c = K.c; c.rice += Math.round((e.elite ? 60 : 18) * (1 + 0.25 * gu('loot'))); c.kills++; if (e.elite) c.gk += 3; if (Math.random() < 0.14 || (e.elite && gu('loot') >= 3)) c.bags.push({ x: e.x, y: e.y, t: 0 });
      if (Math.random() < (e.kzBoss ? 1 : e.elite ? 0.35 : 0.04) * (gu('loot') >= 5 ? 2 : 1)) c.bags.push({ x: e.x + 12, y: e.y + 4, t: 0, it: rnd(IK) }); }   // r3.60.0：合戰道具
  };

  /* ---------- 我方兵 ---------- */
  function dispatch(c, k, free) { const U = UNIT[k], L = lvU(k), n = 4 + (L >= 5 ? 1 : 0) + (L >= 10 ? 1 : 0) + (ulv(c, k) >= 10 ? 1 : 0) + (gu('bar') >= 5 ? 1 : 0), cap = CAP() + (free ? 6 : 0) - c.units.filter(u => u.hp > 0).length;   // r3.60.0：上限 30（兵舍 +10／級）、一隊 4～6 人
    if (!free) { if (!unlocked(k)) return G.UI.toast(U.n + '尚未解鎖'); if ((c.cdU[k] || 0) > 0) return; if (c.rice < U.cost) return G.UI.toast('兵糧不足'); } if (cap <= 0) return G.UI.toast('兵力已滿（最多 ' + CAP() + ' 名）');
    if (!free) { c.rice -= U.cost; c.cdU[k] = Math.round(U.cd * (1 - 0.08 * gu('drill')) * (gu('drill') >= 5 ? 0.75 : 1)); } const B = c.M.base, mh = uHp(c, k), ma = uAtk(c, k), sq = { k, i: (c.sqN = (c.sqN || 0) + 1), ord: K.ordAll && K.ordAll !== 'hold' ? K.ordAll : 'atk' };
    for (let j = 0; j < Math.min(n, cap); j++) { const x = B.x + (c.M.gate ? R(-60, 60) : R(60, 110)), y = B.y + (c.M.gate ? R(60, 100) : R(20, 70));
      c.units.push({ k, U, sq, j, x, y, face: c.M.gate ? 1 : 1, hp: refAtk(c) * U.hp * mh, hpMax: refAtk(c) * U.hp * mh, atkK: U.atk * ma, inv: gu('drill') >= 3 ? 180 : 0, st: 'walk', t: 0, cd: 30 + j * 25, ph: Math.random() * 999, alpha: 0 }); }
    if (!free) G.UI.toast('出兵：' + U.n + ' Lv' + L + (ulv(c, k) ? '・強化 +' + ulv(c, k) : '')); }
  function hurtUnit(u, d, src) { if (u.hp <= 0) return; const c = K.c; let k = 1;
    if (c) { for (const b of c.st) if (b.k === 'bamboo' && b.hp > 0 && Math.abs(u.x - b.x) < (DL('bamboo', 3) ? 120 : 75) && Math.abs(u.y - b.y) < 40) { k = Math.max(0.25, 0.5 - 0.04 * bgN('bamboo', b.up)); if (DL('bamboo', 6) && src && src.kz && RANGED.has(src.type) && src.st !== 'dead' && Math.random() < 0.5) { tracer(b.x, b.y - 30, src.x, src.y - 20, 'arrow'); G.damageOni(src, 1, false, false, hitOpt(c, src, 0.1 * dm(b), Math.sign(src.x - b.x) || 1, b)); } break; }
      if (k === 1 && u.k !== 'shield') for (const s of c.units) if (s.k === 'shield' && s.hp > 0 && lvU('shield') >= 3 && Math.hypot(s.x - u.x, s.y - u.y) < 70) { k = 0.5; break; } }
    if (u.inv > 0) return; if (Math.random() < uEv(c, u.k)) { G.NUMS.push({ x: u.x, y: u.y - HH() * S(u.y) - 8, v: '閃', t: 0 }); return; } k *= uDr(c, u.k); if (c && buf(c, 'dr')) k *= 0.7; const L = lvU(u.k);
    if (u.k === 'shield' && L >= 10) k *= 0.7; if (u.k === 'spear' && L >= 10 && u.hp < u.hpMax * 0.3) k *= 0.5;
    if (u.k === 'shield' && L >= 6 && src && !src.boss && Math.random() < 0.25) src.stun = Math.max(src.stun || 0, 60);
    u.hp -= d * k; u.fl = 8; if (u.st !== 'atk') { u.st = 'hurt'; u.t = 0; }
    if (u.hp <= 0 && u.k === 'samurai' && L >= 10 && !u.undy) { u.undy = 1; u.hp = 1; u.inv = 180; VX.ring && VX.ring({ x: u.x, y: u.y, r1: 1.1, life: 20, col: '255,210,120', lw: 0.1 }); return; }
    if (u.hp <= 0) { u.hp = 0; u.st = 'dead'; u.t = 0; if (u.k === 'ninja' && L >= 10 && !u.clone && c && Math.random() < 0.4) { const q = Object.assign({}, u, { hp: u.hpMax * 0.5, st: 'walk', t: 0, clone: 1, alpha: 0.2, tg: null }); c.units.push(q); VX.s2('fx_smoke', { x: u.x, y: u.y, k: 1, life: 30 }); } } }
  function targetFor(c, u) { let best = null, bd = 1e9; const ninjaPri = u.k === 'ninja';
    for (const e of G.E) { if (!e.kz || e.st === 'dead' || e.delay > 0 || (e.type === 'ninja' && !revealed(c, e) && !(wallN(e) && u.U.rg)) || (wallN(e) && !u.U.rg)) continue; let d = Math.hypot(e.x - u.x, (e.y - u.y) * 1.4);
      if (ninjaPri && e.wo && e.wo !== 'ecannon') d -= 600; if (e.wo === 'ladder' && !ninjaPri) d += 300; if (d < bd) { bd = d; best = e; } }
    return bd < 650 ? best : null; }
  function stepUnits(c) { const done = c.done;
    for (const u of c.units) { u.t++; if (u.fl > 0) u.fl--; if (u.inv > 0) u.inv--; if (u.alpha < 1 && u.hp > 0) u.alpha = Math.min(1, u.alpha + 0.06);
      if (u.st === 'dead') { u.alpha = Math.max(0, 1 - u.t / 50); continue; }
      if (u.st === 'hurt') { if (u.t > 14) { u.st = 'walk'; u.t = 0; } continue; }
      if (done) { u.st = 'walk'; continue; }
      const U = u.U; if (!u.tg || u.tg.st === 'dead' || G.t % 20 === (u.j * 5) % 20) u.tg = targetFor(c, u);
      const od = u.sq.ord || 'atk';   // r3.56.0：指揮——突擊 atk／固守 hold／隨我 follow／撤退 back
      if (od === 'back') u.tg = null; else if (u.tg && od !== 'atk') { const ax = od === 'hold' ? u.sq.hx : H.x, ay = od === 'hold' ? u.sq.hy : H.y; if (Math.hypot(u.tg.x - ax, (u.tg.y - ay) * 1.4) > (od === 'hold' ? 170 : 230)) u.tg = null; }
      const e = u.tg, rg = U.rg, reach = e ? (rg ? U.reach * (1 + (towerNear(c, u) ? 0.3 : 0) + (u.k === 'gun' && lvU('gun') >= 6 ? 0.3 : 0)) : U.reach + G.bodyX(e)) : 0;
      if (u.st === 'walk') { u.cd--;
        if (!e) { /* 沒敵人：依指揮站位（突擊／撤退＝據點前；固守＝下令處；隨我＝主角身後） */ const B = c.M.base;
          let hx = B.x + (c.M.gate ? (u.sq.i % 3 - 1) * 90 + (u.j - 1) * 26 : 150 + u.j * 24), hy = B.y + (c.M.gate ? 110 + (u.sq.i % 2) * 40 : 60 + (u.sq.i % 3) * 40);
          if (od === 'hold') { hx = u.sq.hx + (u.j - 1) * 26; hy = u.sq.hy + (u.sq.i % 3 - 1) * 18; } else if (od === 'follow') { hx = H.x - (H.face || 1) * (70 + (u.sq.i % 3) * 22) + (u.j - 1) * 20; hy = H.y + (u.sq.i % 2 ? 22 : -14); }
          if (od === 'back' && Math.hypot(u.x - hx, u.y - hy) < 60) u.hp = Math.min(u.hpMax, u.hp + u.hpMax * 0.004);
          const dx = hx - u.x, dy = hy - u.y; if (Math.hypot(dx, dy) > 8) { G.tryMove(u, Math.sign(dx) * Math.min(Math.abs(dx), U.sp), Math.sign(dy) * Math.min(Math.abs(dy), U.sp * 0.6)); u.face = Math.sign(dx) || u.face; u.mv = 1; } else u.mv = 0; continue; }
        const dx = e.x - u.x, dy = e.y - u.y, dd = Math.hypot(dx, dy * 1.4); if (Math.abs(dx) > 3) u.face = Math.sign(dx);
        if (dd <= reach && Math.abs(dy) < (rg ? 400 : 26 + G.bodyX(e) * 0.3)) { u.mv = 0; if (u.cd <= 0) { u.st = 'atk'; u.t = 0; u.hit = false; const r = unitRec(u, 'attack'); u.atkMs = (r ? Math.max(500, A.dur(r)) : 800) * 1.25; } }
        else { u.mv = 1; const sp = U.sp; G.tryMove(u, Math.abs(dx) > reach * 0.7 ? Math.sign(dx) * sp : 0, Math.abs(dy) > 5 ? Math.sign(dy) * sp * 0.6 : 0); } }
      else if (u.st === 'atk') { const ms = u.t * TK;
        if (!u.hit && ms >= u.atkMs * 0.45) { u.hit = true; if (e && e.st !== 'dead') unitHit(c, u, e); }
        if (ms >= u.atkMs) { u.st = 'walk'; u.t = 0; u.cd = cdOf(c, u); } } }
    if (G.t % 120 === 0) c.units = c.units.filter(u => u.hp > 0 || u.alpha > 0);
    for (const k in c.cdU) if (c.cdU[k] > 0) c.cdU[k]--; }
  const towerNear = (c, u) => c.st.some(b => b.k === 'tower' && b.hp > 0 && Math.hypot(b.x - u.x, b.y - u.y) < 90);
  function cdOf(c, u) { const sp = 1 / ((buf(c, 'spd') ? 1.3 : 1) * (buf(c, 'rally') ? 1.3 * cmdK() : 1) * (1 + (ugOf(u.k).spd || 0) / 100 * ugN(c, u.k))); return Math.round(cdOf0(c, u) * sp); }
  function cdOf0(c, u) { const U = u.U; if (u.k === 'gun') { const three = lvU('gun') >= 3, bam = c.st.some(b => b.k === 'bamboo' && b.hp > 0 && Math.hypot(b.x - u.x, b.y - u.y) < 110); return (three ? 45 : U.rel) * (bam ? 0.7 : 1); }
    return u.k === 'ninja' ? 26 : u.k === 'bow' ? 70 : 46; }
  function unitHit(c, u, e) { let m = u.atkK * (ulv(c, u.k) >= 20 ? 1.2 : 1) * (buf(c, 'atk') ? 1.25 : 1) * (buf(c, 'rally') ? 1.3 : 1); const L = lvU(u.k);
    if (u.k === 'gun' && L >= 6 && (e.elite || e.boss)) m *= 1.3; if (u.k === 'ninja' && L >= 6 && Math.random() < 0.15) { m *= 3; G.NUMS.push({ x: e.x, y: e.y - HH() * S(e.y) - 18, v: '暗殺', t: 0 }); }
    if (u.k === 'samurai' && L >= 6 && u.lastT !== e) { u.lastT = e; m *= 2; if (!e.boss) e.kb = (e.kb || 0) + u.face * 6; } const bra = c.st.some(b => b.k === 'brazier' && b.hp > 0 && Math.hypot(b.x - u.x, b.y - u.y) < braR(b));
    if (bra) m *= DL('brazier', 6) ? 1.4 : 1.25; if (K.drumT > 0 && Math.hypot(u.x - H.x, u.y - H.y) < 260) m *= 1.15; if (c.units.some(s => s.k === 'samurai' && s.hp > 0 && lvU('samurai') >= 3 && s !== u && Math.hypot(s.x - u.x, s.y - u.y) < 160)) m *= 1.25;
    if (u.k === 'spear' && lvU('spear') >= 3 && e.st === 'walk' && Math.sign(e.face) === -u.face) m *= 2;
    const opt = hitOpt(c, e, m, u.face, u); m = 1;
    if (u.U.rg) { tracer(u.x, u.y - HH() * 0.55 * S(u.y), e.x, e.y - HH() * 0.5 * S(e.y) * (e.ratio || 1), u.k === 'gun' ? 'gun' : lvU('bow') >= 3 ? 'fire' : 'arrow'); }
    else G.FX.push({ k: 'dust', x: e.x, y: e.y, t: 0, life: 10 });
    G.damageOni(e, m, false, false, opt);
    const near = (r, skip) => G.E.filter(q => q.kz && q.st !== 'dead' && !q.wo && !skip.includes(q) && Math.hypot(q.x - e.x, (q.y - e.y) * 1.4) < r);
    if (u.k === 'spear' && L >= 6) { const b = near(70, [e])[0]; if (b) G.damageOni(b, 1, false, false, hitOpt(c, b, opt.atk / refHp(c) * 0.6 * Math.max(0.05, 1 - (b.def || 0) / ((b.def || 0) + 80)), u.face, u)); }
    if (u.k === 'bow' && L >= 10 && Math.random() < 0.5) { const b = near(90, [e])[0]; if (b) { tracer(e.x, e.y - 20, b.x, b.y - 20, 'arrow'); G.damageOni(b, 1, false, false, hitOpt(c, b, u.atkK * 0.8, u.face, u)); } }
    if (u.k === 'bow' && L >= 6 && Math.random() < 0.3 && e.st !== 'dead') { tracer(u.x, u.y - HH() * 0.55 * S(u.y), e.x, e.y - 20, 'arrow'); G.damageOni(e, 1, false, false, hitOpt(c, e, u.atkK, u.face, u)); }
    if (u.k === 'gun' && L >= 10 && Math.random() < 0.4) for (const b of near(80, [e]).slice(0, 2)) G.damageOni(b, 1, false, false, hitOpt(c, b, u.atkK * 0.6, u.face, u));
    if (u.k === 'bow' && lvU('bow') >= 3 && e.st !== 'dead' && !e.wo) e.kzBurn = 240;
    if (u.k === 'ninja' && lvU('ninja') >= 3 && (!u.smT || G.t - u.smT > 720)) { u.smT = G.t; VX.s2('fx_smoke', { x: e.x, y: e.y, k: 1.6, life: 50 }); for (const q of G.E) if (q.kz && q.st !== 'dead' && Math.hypot(q.x - e.x, q.y - e.y) < 110) q.smoke = 120; } }
  function tracer(x0, y0, x1, y1, k) { const life = k === 'gun' ? 7 : 12;
    VX.custom((o, g) => { const a = 1 - o.t / o.life, p = Math.min(1, o.t / (life * 0.7)); g.save();
      if (k === 'gun') { g.strokeStyle = 'rgba(255,200,120,' + 0.8 * a + ')'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 + (x1 - x0) * p, y0 + (y1 - y0) * p); g.stroke(); }
      else { const x = x0 + (x1 - x0) * p, y = y0 + (y1 - y0) * p - Math.sin(p * Math.PI) * 22, an = Math.atan2(y1 - y0 - Math.cos(p * Math.PI) * 22 * Math.PI, x1 - x0); g.translate(x, y); g.rotate(an);
        g.strokeStyle = 'rgba(255,240,200,' + a * 0.25 + ')'; g.lineWidth = 3; g.beginPath(); g.moveTo(-30, 0); g.lineTo(-10, 0); g.stroke();   // r3.59.0：箭變粗＋拖尾＋箭頭
        g.strokeStyle = k === 'fire' ? 'rgba(255,150,60,' + a + ')' : 'rgba(250,240,220,' + a + ')'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(-16, 0); g.lineTo(6, 0); g.stroke();
        g.fillStyle = 'rgba(250,240,220,' + a + ')'; g.beginPath(); g.moveTo(9, 0); g.lineTo(3, -3); g.lineTo(3, 3); g.fill(); if (p >= 1 && o.t < life + 2) { g.fillStyle = 'rgba(255,230,160,.8)'; g.beginPath(); g.arc(6, 0, 5, 0, 6.283); g.fill(); }
        if (k === 'fire') { g.fillStyle = 'rgba(255,190,90,' + a + ')'; g.beginPath(); g.arc(4, 0, 2, 0, 6.283); g.fill(); } }
      g.restore(); }, life, 'o');
    if (k === 'gun') VX.s2('fx_muzzle', { x: x0 + Math.sign(x1 - x0) * 14, y: y0, k: 0.5, life: 8, flip: x1 < x0 }); }
  function unitRec(u, n) { const un = G.enemyUnit(u.U.u); if (!un) return null; const X = un.act; return n === 'attack' ? X.attack || X.atk : n === 'hurt' ? X.hit || X.hurt : n === 'dead' ? X.death || X.fall || X.hit : X.walk || X.idle; }
  function drawUnit(u) { const un = G.enemyUnit(u.U.u); if (!un) return; const s = S(u.y), base = HH() * s / (un.vm || un.refE || 140);
    let rec = unitRec(u, 'walk'), fr; if (!rec) return;
    if (u.st === 'atk') { const r = unitRec(u, 'attack'); if (r) { rec = r; fr = A.frameAt(r, u.t * TK, u.atkMs); } }
    else if (u.st === 'hurt') { const r = unitRec(u, 'hurt'); if (r) { rec = r; fr = A.frameAt(r, u.t * TK); } }
    else if (u.st === 'dead') { const r = unitRec(u, 'dead'); if (r) { rec = r; fr = A.frameAt(r, u.t * TK); } }
    if (!fr) fr = u.mv ? A.frameAt(rec, G.t * TK + u.ph) : rec.f[0];
    const a = u.alpha; if (K.c && ulv(K.c, u.k) >= 20 && u.hp > 0) { ctx.save(); ctx.globalAlpha = a * (0.55 + 0.25 * Math.sin(G.t * 0.1 + u.ph)); ctx.strokeStyle = ulv(K.c, u.k) >= 30 ? '#ffd76a' : '#e3c27a'; ctx.lineWidth = 2 * s; ctx.beginPath(); ctx.ellipse(u.x, u.y + 2, 18 * s, 6 * s, 0, 0, 6.283); ctx.stroke(); ctx.restore(); }   /* r3.67.0：精銳金環 */
    ctx.save(); ctx.globalAlpha = a; sashimono(u.x, u.y, u.face, true, s); ctx.restore();
    A.draw(un, fr, u.x, u.y, base * (rec.k || 1), u.face < 0, a);
    if (u.fl > 0) { ctx.save(); ctx.globalAlpha = u.fl / 16; ctx.fillStyle = '#fff'; ctx.restore(); }
    if (u.hp > 0 && u.hp < u.hpMax) { const w = 26 * s, y = u.y - HH() * s - 4; ctx.fillStyle = 'rgba(10,8,12,.7)'; ctx.fillRect(u.x - w / 2 - 1, y - 1, w + 2, 4); ctx.fillStyle = '#5aa0e8'; ctx.fillRect(u.x - w / 2, y, w * u.hp / u.hpMax, 2); } }

  /* ---------- 防禦物 ---------- */
  const bCostOf = k => Math.round(DEF[k].cost * (1 - 0.08 * gu('eng'))), fixCost = b => Math.ceil(DEF[b.k].cost * (b.hpMax - b.hp) / b.hpMax * 0.6 * (1 - 0.1 * gu('eng')));
  function build(c, sl, k) { const D = DEF[k], cost = bCostOf(k); if (c.rice < cost) return G.UI.toast('兵糧不足'); c.rice -= cost; const hp = hbOf(c, k) * bgK(k, 'hp', 0);
    const b = sl.b = { k, sl, x: sl.x, y: sl.y, hp, hpMax: hp, t: 0, lv: lvD(k), up: 0, inv: gu('eng') >= 3 ? 300 : 0 }; c.st.push(b); obst(b, true); K.menu = null; G.UI.toast('建造：' + D.n);
    if (D.solid && Math.abs(H.x - b.x) < D.hw * HH() + 10 && Math.abs(H.y - b.y) < 22) H.y = b.y + 30; }
  function obst(b, on) { const D = DEF[b.k], d = SC.def; if (!D.solid) return; if (on) { const w = D.hw * HH() * S(b.y); b.poly = [[b.x - w, b.y - 12], [b.x + w, b.y - 12], [b.x + w, b.y + 8], [b.x - w, b.y + 8]]; d.obstacles.push(b.poly); }
    else if (b.poly) { d.obstacles = d.obstacles.filter(p => p !== b.poly); b.poly = null; } }
  function hurtStruct(b, d) { if (b.hp <= 0 || b.inv > 0) return; b.hp -= d; b.fl = 6;
    if (b.k === 'fence' && K.c) { let best = null, bd = 90; for (const e of G.E) if (e.kz && e.st !== 'dead' && !e.wo) { const dd = Math.hypot(e.x - b.x, (e.y - b.y) * 1.5); if (dd < bd) { bd = dd; best = e; } }   // r3.56.0：尖刺反傷
      if (best) { G.damageOni(best, 1, false, false, hitOpt(K.c, best, 0.05 * dm(b), Math.sign(best.x - b.x) || 1, b)); if (DL('fence', 6) && !best.boss) best.kb = (best.kb || 0) + (Math.sign(best.x - b.x) || 1) * 7; VX.spark && VX.spark({ x: best.x, y: best.y, z: HH() * 0.4, n: 6, spd: 4, col: '255,220,150' }); } }
    if (b.hp <= 0) breakStruct(K.c, b); }
  function breakStruct(c, b) { b.hp = 0; b.dead = G.t; obst(b, false); if (c && b.k === 'fence' && DL('fence', 10)) { hitArea(c, b.x, b.y, 120, 0.45 * bgK('fence', 'dmg', b.up), true); VX.s2('fx_blast', { x: b.x, y: b.y - 10, k: 1, life: 22 }); } G.FX.push({ k: 'dust', x: b.x, y: b.y, t: 0, life: 26 }); VX.s2('fx_debris', { x: b.x, y: b.y - 10, k: 1, life: 30 }); if (c) G.UI.toast(DEF[b.k].n + '被打壞了'); }
  function stepStructs(c) { for (const b of c.st) { if (b.hp <= 0) continue; b.t++; if (b.fl > 0) b.fl--; if (b.inv > 0) b.inv--;
      if (b.k === 'tower' && b.t % (DL('tower', 10) ? 42 : 70) === 0) { const L = G.E.filter(e => e.kz && e.st !== 'dead' && e.delay <= 0 && !e.wo && (revealed(c, e) || wallN(e)) && Math.hypot(e.x - b.x, (e.y - b.y) * 1.4) < 440 * bgK('tower', 'rng', b.up)).sort((p, q) => Math.hypot(p.x - b.x, p.y - b.y) - Math.hypot(q.x - b.x, q.y - b.y));
        for (let j = 0; j < Math.min(L.length, (DL('tower', 3) ? 3 : 2) + (b.gar || 0)); j++) { const e = L[j]; tracer(b.x + (j - 1) * 10, b.y - HH() * 1.55 * S(b.y), e.x, e.y - 20, DL('tower', 6) ? 'fire' : 'arrow'); b.shot = G.t; b.aim = Math.sign(e.x - b.x) || 1; G.damageOni(e, 1, false, false, hitOpt(c, e, 0.11 * dm(b) * (1 + 0.4 * (b.gar || 0)), Math.sign(e.x - b.x) || 1, b)); if (DL('tower', 6)) e.kzBurn = Math.max(e.kzBurn || 0, 180); } }
      if (b.k === 'cannon' && b.t % Math.round((DL('cannon', 3) ? 270 : 360) / adj(b)) === 0) { let best = null, bn = 0; for (const e of G.E) { if (!e.kz || e.st === 'dead' || e.delay > 0 || e.wo === 'ladder' || Math.hypot(e.x - b.x, e.y - b.y) > 520) continue;
          const n = G.E.filter(q => q.kz && q.st !== 'dead' && Math.hypot(q.x - e.x, (q.y - e.y) * 1.5) < 80).length; if (n > bn) { bn = n; best = e; } }
        if (best) { const tx = best.x, ty = best.y; b.fireT = G.t; VX.s2('fx_smoke', { x: b.x + Math.sign(tx - b.x) * 30, y: b.y - 26, k: 1.1, life: 40 }); VX.s2('fx_muzzle_big', { x: b.x + Math.sign(tx - b.x) * 40, y: b.y - 22, k: 0.8, life: 14, flip: tx < b.x }); b.face = Math.sign(tx - b.x) || 1;
          const shell = (tx, ty, life) => c.fx.push({ k: 'warn', ours: 1, x: tx, y: ty, t: 0, life, done: () => { VX.s2('fx_blast', { x: tx, y: ty, k: 1.8, life: 28 }); SC.shake = Math.max(SC.shake || 0, 1.5);
            for (const e of G.E) if (e.kz && e.st !== 'dead' && e.wo !== 'ladder' && Math.hypot(e.x - tx, (e.y - ty) * 1.5) < 120 * bgK('cannon', 'rad', b.up)) { G.damageOni(e, 1, true, false, hitOpt(c, e, 0.35 * bgK('cannon', 'dmg', b.up), Math.sign(e.x - tx) || 1, b)); if (DL('cannon', 6)) e.kzBurn = Math.max(e.kzBurn || 0, 240); } } });
          shell(tx, ty, 36); if (DL('cannon', 10)) { const o2 = G.E.find(e => e.kz && e.st !== 'dead' && !e.wo && e.delay <= 0 && Math.hypot(e.x - tx, e.y - ty) > 150 && Math.hypot(e.x - b.x, e.y - b.y) < 520); if (o2) shell(o2.x, o2.y, 56); } } } }
    for (const f of c.fx) { f.t++; if (f.t === f.life && f.done) f.done(); } c.fx = c.fx.filter(f => f.t <= f.life);
    if (c.t % 60 === 0) for (const b of c.st) if (b.k === 'brazier' && b.hp > 0) { const r = braR(b), k = adj(b) * bgK('brazier', 'heal', b.up);
      if (DL('brazier', 10)) for (const e of G.E) if (e.kz && e.st !== 'dead' && !e.wo && !e.boss && Math.hypot(e.x - b.x, e.y - b.y) < r * 0.8 && Math.random() < 0.5) e.stun = Math.max(e.stun || 0, 45);   // r3.56.0：篝火每秒回血
      for (const u of c.units) if (u.hp > 0 && Math.hypot(u.x - b.x, u.y - b.y) < r) { if (u.hp < u.hpMax) healMote(u.x, u.y); u.hp = Math.min(u.hpMax, u.hp + u.hpMax * 0.01 * k); }
      if (Math.hypot(H.x - b.x, H.y - b.y) < r) { if (H.hp < H.hpMax) healMote(H.x, H.y); H.hp = Math.min(H.hpMax, H.hp + H.hpMax * 0.005 * k); } }
    if (c.t % 60 === 30 && DL('bamboo', 10)) for (const b of c.st) if (b.k === 'bamboo' && b.hp > 0) for (const u of c.units) if (u.hp > 0 && u.hp < u.hpMax && Math.abs(u.x - b.x) < 120 && Math.abs(u.y - b.y) < 40) { healMote(u.x, u.y); u.hp = Math.min(u.hpMax, u.hp + u.hpMax * 0.01 * bgK('bamboo', 'hp', b.up)); } }
  function stepBags(c) { for (const b of c.bags) { b.t++; if (!b.got && Math.hypot(H.x - b.x, (H.y - b.y) * 1.5) < 42) { if (b.it) { if (c.items.length >= 3) { if (b.t % 90 === 1) G.UI.toast('合戰道具已滿（最多 3 個）'); continue; } b.got = 1; c.items.push(b.it); G.NUMS.push({ x: b.x, y: b.y - 30, v: ITEM[b.it].n, t: 0 }); continue; }
      b.got = 1; c.rice += 45; G.NUMS.push({ x: b.x, y: b.y - 30, v: '兵糧 +45', t: 0 }); } }
    c.bags = c.bags.filter(b => !b.got && b.t < (b.it ? 3600 : 1800)); }
  /* r3.59.0：物見櫓上的弓手（射擊時拉弓）、篝火回血光點 */
  function towerArchers(b) { const un = G.enemyUnit('ashiyumi'); if (!un) return; const X = un.act, at = X.attack || X.atk, id = X.idle || X.walk; if (!id) return;
    const n = (DL('tower', 3) ? 3 : 2) + (b.gar || 0), s = S(b.y), base = HH() * s / (un.vm || un.refE || 140) * 0.75, y = b.y - HH() * 1.5 * s, dt = (G.t - (b.shot || -999)) * TK, face = b.aim || 1;
    for (let j = 0; j < n; j++) { const firing = at && dt < A.dur(at), rec = firing ? at : id, fr = firing ? A.frameAt(at, dt + j * 60) : rec.f[0]; A.draw(un, fr, b.x + (j - (n - 1) / 2) * 14 * s, y, base * (rec.k || 1), face < 0, 1); } }
  function healMote(x, y) { VX.custom && VX.custom((o, g) => { const q = o.t / o.life; g.save(); g.globalCompositeOperation = 'lighter'; for (let i = 0; i < 3; i++) { const px = x + Math.sin(i * 2.4 + o.t * 0.1) * 10, py = y - 10 - HH() * 0.9 * q - i * 8;
      g.fillStyle = 'rgba(140,255,150,' + (1 - q) * 0.8 + ')'; g.beginPath(); g.arc(px, py, 2.4, 0, 6.283); g.fill(); } g.restore(); }, 40, 'o'); }
  function drawStruct(b) { const D = DEF[b.k], s = b.y; let fi = 0, n = D.s;
    if (b.hp <= 0) { if (b.k === 'brazier') n = 'war_brazier_out'; else fi = 2; }
    else if (b.k === 'brazier') fi = Math.floor(G.t / 6) % 4; else if (b.k === 'cannon') fi = G.t - (b.fireT || -99) < 14 ? 1 : 0; else if (b.hp < b.hpMax * 0.5) fi = 1;
    const a = b.hp <= 0 ? Math.max(0.35, 1 - (G.t - b.dead) / 600) : 1;
    const rc = b.k === 'cannon' && b.hp > 0 ? Math.max(0, 14 - (G.t - (b.fireT || -99))) * 0.5 * -(b.face || 1) : 0;   // r3.59.0：開砲後座
    VX.draw2(ctx, n, fi, b.x + rc, b.y, D.k, { a, flip: b.k === 'cannon' && b.face < 0 });
    if (b.k === 'tower' && b.hp > 0) towerArchers(b);
    if (b.fl > 0) { ctx.save(); ctx.globalAlpha = 0.25; VX.draw2(ctx, n, fi, b.x, b.y, D.k, { add: 1 }); ctx.restore(); }
    if (b.hp > 0 && b.up) { const up = b.up, sc = S(b.y);   /* r3.67.0：戰中強化外觀——Lv1+ 金菱、Lv3+ 我方背旗、Lv5 金色光暈 */
      if (up >= 5) { const pu = 0.5 + 0.3 * Math.sin(G.t * 0.08); ctx.save(); ctx.globalAlpha = pu * 0.5; ctx.fillStyle = '#ffd76a'; ctx.beginPath(); ctx.ellipse(b.x, b.y + 4, D.hw * HH() * sc + 14, 10, 0, 0, 6.283); ctx.fill(); ctx.globalAlpha = pu * 0.22; VX.draw2(ctx, n, fi, b.x, b.y, D.k, { add: 1 }); ctx.restore(); }
      if (up >= 3) sashimono(b.x + Math.max(14, D.hw * HH() * sc * 0.7), b.y - 2, 1, true, sc * 0.85);
      for (let i = 0; i < up; i++) { const px = b.x - (up - 1) * 5 + i * 10, py = b.y + 17; ctx.fillStyle = '#ffd76a'; ctx.beginPath(); ctx.moveTo(px, py - 4); ctx.lineTo(px + 3.5, py); ctx.lineTo(px, py + 4); ctx.lineTo(px - 3.5, py); ctx.closePath(); ctx.fill(); } }
    if (b.hp > 0 && b.hp < b.hpMax) { const w = 40, y = b.y + 8; ctx.fillStyle = 'rgba(10,8,12,.7)'; ctx.fillRect(b.x - w / 2 - 1, y - 1, w + 2, 4); ctx.fillStyle = '#e3c27a'; ctx.fillRect(b.x - w / 2, y, w * b.hp / b.hpMax, 2); } }

  /* ---------- 繪製：地面層（建造點、腳下藍圈、兵糧袋、落點預警）＋排序層 ---------- */
  function drawGround() { const c = K.c; if (!c || SC.id !== c.id) return;
    for (const sl of c.slots) if (!sl.b || sl.b.hp <= 0) { const on = c.ph !== 'wave', pu = on ? 0.75 + 0.25 * Math.sin(G.t * 0.08 + sl.i) : 0.4, sc = S(sl.y), rx = 0.62 * HH() * sc, ry = rx * 0.34;   /* r3.52.0：建造點加金色底光，地面上看得清楚 */
      const dB = Math.hypot(sl.x - c.M.base.x, (sl.y - c.M.base.y) * 1.4), rc = dB < 320 ? ['255,214,120', '255,230,150'] : dB < 720 ? ['235,235,225', '250,250,240'] : ['240,120,100', '255,150,130'];   /* r3.68.0：內圈金、中圈白、前哨紅 */
      ctx.save(); ctx.fillStyle = 'rgba(' + rc[0] + ',' + 0.3 * pu + ')'; ctx.beginPath(); ctx.ellipse(sl.x, sl.y + 6, rx, ry, 0, 0, 6.283); ctx.fill(); ctx.strokeStyle = 'rgba(' + rc[1] + ',' + 0.95 * pu + ')'; ctx.lineWidth = 2.2; ctx.setLineDash([6, 4]); ctx.stroke(); ctx.restore();
      VX.draw2(ctx, 'war_slot', 0, sl.x, sl.y + 6, 0.78, { a: on ? 1 : 0.4 }); }
    for (const u of c.units) if (u.hp > 0) VX.draw2(ctx, 'fx_ally_circle', 0, u.x, u.y, 0.3, { sy: 0.32, a: 0.55 * u.alpha });
    for (const b of c.bags) { if (!b.it) { VX.draw2(ctx, 'war_rice', 0, b.x, b.y, 0.55); continue; } const I = ITEM[b.it], s = S(b.y), y = b.y - 12 * s - Math.sin(G.t * 0.08 + b.x) * 3;   // 合戰道具：發光的令牌
      ctx.save(); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(b.x, b.y, 12 * s, 4 * s, 0, 0, 6.283); ctx.fill(); ctx.shadowColor = I.col; ctx.shadowBlur = 10; ctx.fillStyle = 'rgba(30,20,16,.9)'; ctx.beginPath(); ctx.arc(b.x, y, 11 * s, 0, 6.283); ctx.fill();
      ctx.strokeStyle = I.col; ctx.lineWidth = 2; ctx.stroke(); ctx.restore(); ctx.font = `900 ${12 * s}px ${G.FONT_S}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = I.col; ctx.fillText(I.c, b.x, y + 1); }
    for (const f of c.fx) if (f.k === 'warn' && f.t >= 0) { const p = f.t / f.life; VX.draw2(ctx, 'fx_warn_circle', 0, f.x, f.y, 0.62 * (0.6 + 0.4 * p), { sy: 0.4, a: f.ours ? 0.35 : 0.75 }); }
    if (c.M.gate) { const b = baseObj(c), r = c.bhp / c.bhpMax; const fi = r <= 0 ? 2 : r < 0.4 ? 1 : r < 0.75 ? 0 : -1; if (fi >= 0) { const q = fr2('x2_war', 'war_gate_dmg', fi); if (q) { const [u, f] = q; ctx.drawImage(u.imgs[f[7] || 0], f[0], f[1], f[2], f[3], 1148, 104, 136, 118); } } } }
  function addSorted(L) { const c = K.c; if (!c || SC.id !== c.id) return;
    for (const u of c.units) if (u.alpha > 0) L.push({ y: u.y, oc: { kzU: u } });
    for (const b of c.st) L.push({ y: b.y, oc: { kzB: b } });
    if (!c.M.gate) { L.push({ y: c.M.banner[1], oc: { kzF: 1 } }); L.push({ y: c.M.ebanner[1], oc: { kzF: 2 } }); } }
  function drawSorted(o) { const c = K.c; if (o.kzU) return drawUnit(o.kzU); if (o.kzB) return drawStruct(o.kzB);
    if (o.kzF === 1) { banner(c.M.banner[0], c.M.banner[1], true, 1.15); if (c.bflash > 0) { ctx.save(); ctx.globalAlpha = c.bflash / 16; ctx.fillStyle = '#f33'; ctx.beginPath(); ctx.ellipse(c.M.base.x, c.M.base.y, 50, 16, 0, 0, 6.283); ctx.fill(); ctx.restore(); } }
    else if (o.kzF === 2) banner(c.M.ebanner[0], c.M.ebanner[1], false, 1.15); }
  /* 敵兵背旗、攻城兵器、大將名牌 */
  const drawOni0 = G.drawOni;
  G.drawOni = function (e) {
    if (e.wo) return drawObj(e);
    if (e.kz && e.kzh && e.st !== 'dead') { ctx.save(); ctx.globalAlpha = e.alpha; sashimono(e.x, e.y, e.face, false, S(e.y) * (e.ratio || 1)); ctx.restore(); }
    drawOni0(e);
    if (e.kzBoss && e.st !== 'dead') { const y = e.y - HH() * e.ratio * S(e.y) - 18; ctx.save(); ctx.font = '900 12px ' + G.FONT_S; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(20,8,8,.85)'; ctx.strokeText(e.elite, e.x, y); ctx.fillStyle = '#f0ad52'; ctx.fillText(e.elite, e.x, y); ctx.restore(); } };
  function drawObj(e) { if (e.alpha <= 0) return; const a = e.alpha;
    if (e.wo === 'ram') VX.draw2(ctx, 'war_ram', e.mv ? Math.floor(G.t / 7) % 6 : 0, e.x, e.y, 1.25, { a, flip: e.face < 0 });
    else if (e.wo === 'cart') VX.draw2(ctx, e.st === 'dead' ? 'war_bamboo_cart_destroyed' : 'war_bamboo_cart', e.mv ? Math.floor(G.t / 8) % 4 : 0, e.x, e.y, 1.05, { a, flip: e.face < 0 });
    else if (e.wo === 'ecannon') { VX.draw2(ctx, 'war_cannon', e.fT > 340 ? 1 : 0, e.x, e.y, 1.05, { a, flip: true }); }
    else if (e.wo === 'ladder') { if (e.st === 'dead') VX.draw2(ctx, 'war_ladder_b', 0, e.x, e.y + 6, 0.32, { a }); else VX.draw2(ctx, 'war_ladder_a', 0, e.x, e.y, 0.66, { a }); }
    if (e.flash > 0) { ctx.save(); ctx.globalAlpha = e.flash / 14; VX.draw2(ctx, e.wo === 'ram' ? 'war_ram' : e.wo === 'cart' ? 'war_bamboo_cart' : e.wo === 'ladder' ? 'war_ladder_a' : 'war_cannon', 0, e.x, e.y, e.wo === 'ram' ? 1.25 : e.wo === 'ladder' ? 0.66 : 1.05, { add: 1, flip: e.wo !== 'ladder' && e.face < 0 }); ctx.restore(); }
    if (e.st !== 'dead' && e.hp < e.hpMax) { const s = S(e.y), w = 54 * s, y = e.y - (e.wo === 'ladder' ? 150 : 80) * s; ctx.fillStyle = 'rgba(10,6,6,.75)'; ctx.fillRect(e.x - w / 2 - 1, y - 1, w + 2, 5); ctx.fillStyle = G.C.red; ctx.fillRect(e.x - w / 2, y, w * Math.max(0, e.hp) / e.hpMax, 3); } }
  /* 夜晚：月夜城暗色＋篝火／燈籠／主角照明 */
  let NC = null;
  function drawNight() { const c = K.c; if (!c || !c.M.night || SC.id !== c.id) return; const d = SC.def, q = 4;
    if (!NC) { NC = document.createElement('canvas'); NC.width = Math.ceil(d.w / q); NC.height = Math.ceil(d.h / q); } const g = NC.getContext('2d');
    g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, NC.width, NC.height); g.fillStyle = 'rgba(8,12,34,0.5)'; g.fillRect(0, 0, NC.width, NC.height); g.globalCompositeOperation = 'destination-out';
    const hole = (x, y, r, a) => { const gr = g.createRadialGradient(x / q, y / q, 0, x / q, y / q, r / q); gr.addColorStop(0, 'rgba(0,0,0,' + a + ')'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x / q, y / q, r / q, 0, 6.283); g.fill(); };
    hole(H.x, H.y - 20, 190, 0.9); for (const p of c.M.lamps || []) hole(p[0], p[1] + 60, 160, 0.8); for (const b of c.st) if (b.k === 'brazier' && b.hp > 0) hole(b.x, b.y - 20, braR(b) * (1 + 0.03 * Math.sin(G.t * 0.2)), 1);
    ctx.drawImage(NC, 0, 0, d.w, d.h); }
  /* 合戰套裝「陽陣」：只在合戰掉落；4 件招式「陣太鼓」每 20 秒擊鼓，周圍我方（含小兵）攻擊 +15%、8 秒 */
  (function setReg() { if (!(G.RPG && G.RPG.SETS && G.RUNE && G.RUNE.SETM)) return setTimeout(setReg, 50);
    G.RPG.SETS.yojin = { n: '陽陣', region: '合戰', b2: { def: 15, hp: 150 }, b4: { atk: 20 }, d2: '防禦 +15、生命 +150', d4: '攻擊 +20' };
    G.RUNE.SETM.yojin = ['陣太鼓', '每 20 秒擊鼓：周圍我方（含小兵）攻擊 +15%，8 秒'];
    const fs0 = G.fxStep; G.fxStep = function () { fs0.apply(this, arguments); if (G.mode !== 'play' || !G.RUNE.ON.set.yojin) { K.drumT = 0; return; } K.dt = (K.dt || 0) + 1; if (K.drumT > 0) K.drumT--;
      if (K.dt % 1200 === 600) { K.drumT = 480; G.BUFF && G.BUFF.add('atk', 15, 480); VX.ring && VX.ring({ x: H.x, y: H.y, r1: 3, life: 30, col: '255,210,120', lw: 0.06 }); G.AU && G.AU.sfx('heavy'); } }; })();
  /* 合戰專用 BGM（Drive：battlefield5）；頭目在場仍用頭目曲 */
  (function bgm() { if (!(G.AU && G.AU.tick)) return setTimeout(bgm, 50); const AU = G.AU, t0 = AU.tick;
    AU.tick = function () { const c = K.c; if (G.mode === 'play' && c && SC.id === c.id && !(G.t % 30)) { if (!AU.el.war) { const a = AU.el.war = new Audio('a/au/bgm_war.mp3?v=' + G.VER); a.loop = true; a.preload = 'auto'; a.volume = 0; }
        AU.play(G.E.some(e => e.boss && e.st !== 'dead' && e.delay <= 0) ? 'boss' : 'war'); return; } return t0.apply(this, arguments); }; })();
  (function hook() { if (!(G.drawLoot && G.OCC && G.PARTY && G.PARTY.tap && G.drawFx && G.STORY && G.WARP)) return setTimeout(hook, 30);
    const dl0 = G.drawLoot; G.drawLoot = function (Z) { try { drawGround(); } catch (x) { console.warn('kz', x); } return dl0.apply(this, arguments); };
    const oa0 = G.OCC.add; G.OCC.add = function (L) { oa0.call(this, L); try { addSorted(L); } catch (x) { console.warn('kz', x); } };
    const od0 = G.OCC.draw; G.OCC.draw = function (o) { if (o.kzU || o.kzB || o.kzF) return drawSorted(o); return od0.call(this, o); };
    const fx0 = G.drawFx; G.drawFx = function (Z) { const r = fx0.apply(this, arguments); try { drawNight(); } catch (x) { console.warn('kz', x); } return r; };
    const tp0 = G.PARTY.tap; G.PARTY.tap = function (p) { return tap(p) || tp0.call(this, p); };
    const ud0 = G.UI.draw; G.UI.draw = function () { ud0.apply(this, arguments); try { hud(); } catch (x) { console.warn('kz', x); } };
    const ok0 = G.RPG.onKill; G.RPG.onKill = function (e) { if (e && e.kz && K.c) return; return ok0.apply(this, arguments); };   // r3.60.0：合戰裡打怪沒有經驗、不掉裝備素材（只掉兵糧和合戰道具）
    const st0 = G.STORY.step; G.STORY.step = function () { st0.apply(this, arguments); nearSlot(); };
    const ob0 = G.STORY.objective; G.STORY.objective = function () { const c = K.c; if (c && !c.done && SC.id === c.id) return objText(c); const w = G.EV && G.EV.cur; if (w && w.war && !w.done && w.obj) { const t = w.obj(); if (t) return t; } return ob0.apply(this, arguments); };
    const en0 = G.STORY.onEnter; G.STORY.onEnter = function (id) { if (K.c && K.c.id !== id) { K.c = null; K.on = false; K.menu = null; } en0.call(this, id); if (id === 'hub_city') bugyoNpc(); };
  })();

  /* ---------- 建造點互動 ---------- */
  function nearSlot() { const c = K.c; if (!c || c.done || SC.id !== c.id || (G.UI.near && !G.UI.near.kz && G.UI.near.kind === 'talk')) return; let best = 64, pick = null;
    for (const sl of c.slots) { const d = Math.hypot(H.x - sl.x, (H.y - sl.y) * 1.5); if (d < best) { best = d; pick = sl; } }
    if (!pick) return; const b = pick.b && pick.b.hp > 0 ? pick.b : null;
    if (c.ph === 'wave' && !b) return;
    G.UI.near = { kz: 1, label: b ? (b.hp < b.hpMax ? '修理' : DEF[b.k].n) : '建造', kind: 'look', run: () => { K.menu = { k: 'build', sl: pick }; } }; }
  /* ---------- HUD ---------- */
  const BT = []; let lastHud = 0;
  function btn(x, y, w, h, f, o) { BT.push({ x, y, w, h, f, o }); }
  function panel(x, y, w, h) { ctx.fillStyle = 'rgba(14,10,12,.86)'; G.rr(x, y, w, h, 8); ctx.fill(); ctx.strokeStyle = 'rgba(227,194,122,.45)'; ctx.lineWidth = 1; G.rr(x + .5, y + .5, w - 1, h - 1, 8); ctx.stroke(); }
  function button(x, y, w, h, label, f, on, off) { ctx.fillStyle = off ? 'rgba(40,34,36,.85)' : on ? 'rgba(150,92,36,.95)' : 'rgba(46,32,28,.92)'; G.rr(x, y, w, h, 6); ctx.fill(); ctx.strokeStyle = off ? 'rgba(227,194,122,.2)' : 'rgba(227,194,122,.6)'; G.rr(x + .5, y + .5, w - 1, h - 1, 6); ctx.stroke();
    G.txt(label, x + w / 2, y + h / 2 + 1, 12, off ? '#8a7f74' : '#f3e8d2', 'center', G.FONT, 800); if (f && !off) btn(x, y, w, h, f); }
  function hud() { BT.length = 0; const c = K.c;
    if (K.menu && K.menu.k === 'bugyo') return bugyoMenu();
    if (!c || SC.id !== c.id) return;
    if (c.res && c.done && c.res.t > 0) return result(c);   // r3.56.0：按 ✕ 或 7 秒後關閉（原本一直畫）
    const fs = G.FS(), cx = G.LW / 2, top = 46 + G.SAFE.t, bw = 200;
    /* 據點血量＋兵糧 */
    panel(cx - bw / 2 - 70, top, bw + 140, 26); const r = c.bhp / c.bhpMax;
    G.txt(c.M.gate ? '城門' : '本陣', cx - bw / 2 - 62, top + 13, 11, '#e3c27a', 'left', G.FONT_S, 900);
    ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(cx - bw / 2 - 20, top + 9, bw, 8); ctx.fillStyle = r > 0.5 ? '#5aa0e8' : r > 0.25 ? '#e3b24a' : '#e0503c'; ctx.fillRect(cx - bw / 2 - 20, top + 9, bw * r, 8);
    G.txt('兵糧 ' + c.rice, cx + bw / 2 - 12, top + 13, 11, '#f3d98a', 'left', G.FONT, 800);
    if (K.menu && K.menu.k === 'build') return buildMenu(c);
    /* r3.60.0：操作面板移到左下（上排指揮、中排出兵／強化、下排軍令＋道具）；開戰／編成／模式放在據點血條下方 */
    const L = sel(), PW = 314, PH = 134, px = 8 + G.SAFE.l, py = G.LH - 8 - G.SAFE.b - PH, up = !!K.upg;
    if (K.fold) { button(px, G.LH - 8 - G.SAFE.b - 34, 92, 30, '▲ 軍令面板', () => { K.fold = 0; }); phaseBar(c, cx, top); return bossBar(c); }
    panel(px, py, PW, PH); button(px + PW - 26, py - 14, 24, 20, '▼', () => { K.fold = 1; });
    /* 上排：部隊＋命令 */
    { const sqs = []; for (const u of c.units) if (u.hp > 0 && !sqs.includes(u.sq)) sqs.push(u.sq); if (K.selSq && !sqs.includes(K.selSq)) K.selSq = null;
      const sn = K.selSq ? UNIT[K.selSq.k].n.replace('足輕', '') + K.selSq.i : '全軍', ON = { atk: '突擊', hold: '固守', follow: '隨我', back: '撤退' }, cur = K.selSq ? (K.selSq.ord || 'atk') : (K.ordAll || 'atk');
      button(px + 6, py + 6, 70, 24, '▶ ' + sn, () => { const i = sqs.indexOf(K.selSq); K.selSq = i + 1 < sqs.length ? sqs[i + 1] : null; });
      Object.keys(ON).forEach((k, j) => button(px + 80 + j * 57, py + 6, 54, 24, ON[k], () => { const T = K.selSq ? [K.selSq] : sqs; if (!K.selSq) K.ordAll = k;
        for (const q of T) { q.ord = k; if (k === 'hold') { q.hx = H.x; q.hy = H.y; } } G.UI.toast(sn + '：' + ON[k] + (k === 'hold' ? '（守住目前位置）' : k === 'back' ? '（回本陣補血）' : '')); }, cur === k)); }
    /* 中排：出兵（強化模式＝升級該兵種） */
    const sz = 42, y = py + 36;
    L.forEach((k, j) => { const U = UNIT[k], x = px + 8 + j * 52, cd = c.cdU[k] || 0, ul = ulv(c, k), uc = uCost(ul), ok = up ? (ul < UMAX && c.rice >= uc) : (c.rice >= U.cost && cd <= 0);
      ctx.fillStyle = c.edit ? 'rgba(120,80,30,.9)' : up ? 'rgba(40,60,90,.9)' : 'rgba(18,14,20,.85)'; ctx.beginPath(); ctx.arc(x + sz / 2, y + sz / 2, sz / 2, 0, 6.283); ctx.fill();
      ctx.save(); ctx.beginPath(); ctx.arc(x + sz / 2, y + sz / 2, sz / 2 - 3, 0, 6.283); ctx.clip(); icon(U.ico, x + 3, y + 3, sz - 6, sz - 6, ok || c.edit ? 1 : 0.4);
      if (cd > 0 && !up) { ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.beginPath(); ctx.moveTo(x + sz / 2, y + sz / 2); ctx.arc(x + sz / 2, y + sz / 2, sz / 2, -Math.PI / 2, -Math.PI / 2 + 6.283 * cd / U.cd); ctx.fill(); } ctx.restore();
      ctx.strokeStyle = ok ? (up ? 'rgba(140,200,255,.9)' : 'rgba(227,194,122,.85)') : 'rgba(227,194,122,.3)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x + sz / 2, y + sz / 2, sz / 2, 0, 6.283); ctx.stroke();
      if (ul) { ctx.fillStyle = 'rgba(30,60,110,.95)'; G.rr(x + sz - 16, y - 4, 22, 14, 7); ctx.fill(); G.txt('+' + ul, x + sz - 5, y + 3, 9, '#cfe6ff', 'center', G.FONT, 900); }
      G.txt(c.edit ? U.n.replace('足輕', '') : up ? (ul >= UMAX ? '滿' : '▲' + uc) : U.n.replace('足輕', '') + ' ' + U.cost, x + sz / 2, y + sz + 7, 10, up ? '#9fd0ff' : c.rice >= U.cost ? '#f3d98a' : '#a07a6a', 'center', G.FONT, 800);
      btn(x, y, sz, sz, () => { if (c.edit) { const pool = UK.filter(q => unlocked(q) && (q === k || !L.includes(q))); const nx = pool[(pool.indexOf(k) + 1) % pool.length]; const s = KS(); s.sel = L.slice(); s.sel[j] = nx; G.SAVE.markDirty(); }
        else if (up) upU(c, k); else dispatch(c, k); }); });
    const alive = c.units.filter(u => u.hp > 0).length, rx = px + 8 + 4 * 52;
    G.txt('兵 ' + alive + '/' + CAP(), rx, y + 8, 11, '#cfe0f5', 'left', G.FONT, 800); G.txt('糧 ' + c.rice, rx, y + 24, 11, '#f3d98a', 'left', G.FONT, 800);
    button(rx, y + 32, 92, 22, up ? '✓ 強化中' : '▲ 戰中強化', () => { K.upg = !K.upg; }, up);
    /* 下排：軍令＋道具（強化模式＝本陣／兵糧所） */
    const y3 = py + PH - 32;
    if (up) { const bc = bCost(c.blv), rc = rCost(c.rlv);
      button(px + 8, y3, 146, 26, c.blv >= UMAX ? '本陣強化 滿' : '本陣強化 Lv' + c.blv + '（' + bc + '）', () => { if (c.blv >= UMAX) return; if (c.rice < bc) return G.UI.toast('兵糧不足'); c.rice -= bc; c.blv++; c.bhp = Math.min(c.bhpMax, c.bhp + c.bhpMax * 0.05); G.UI.toast('本陣強化 Lv' + c.blv + '：受傷 −' + Math.round((1 - 1 / (1 + 0.03 * c.blv)) * 100) + '%・回血加快'); }, false, c.blv >= UMAX || c.rice < bc);
      button(px + 158, y3, 146, 26, c.rlv >= 10 ? '兵糧所 滿' : '兵糧所 Lv' + c.rlv + '（' + rc + '）', () => { if (c.rlv >= 10) return; if (c.rice < rc) return G.UI.toast('兵糧不足'); c.rice -= rc; c.rlv++; G.UI.toast('兵糧所 Lv' + c.rlv + '：進帳 +' + (15 * c.rlv) + '%'); }, false, c.rlv >= 10 || c.rice < rc); }
    else { Object.keys(ORD).forEach((k, j) => { const O = ORD[k], x = px + 8 + j * 54, cd = c.cdS[k] || 0, fc = k === 'fix' ? fixAllCost(c) : 0, off = cd > 0 || (k === 'fix' && (!fc || c.rice < fc));
        button(x, y3, 50, 26, k === 'fix' ? (fc ? '全修' + fc : '全修') : O.n, () => order(c, k), false, off);
        if (cd > 0) { ctx.fillStyle = 'rgba(0,0,0,.5)'; G.rr(x, y3, 50 * cd / (O.cd * 60 * (1 - 0.1 * gu('cmd'))), 26, 6); ctx.fill(); G.txt(Math.ceil(cd / 60) + '', x + 25, y3 + 14, 11, '#f3e8d2', 'center', G.FONT, 900); } });
      for (let j = 0; j < 3; j++) { const x = px + 228 + j * 28, it = c.items[j], I = it && ITEM[it]; ctx.fillStyle = 'rgba(30,22,26,.9)'; G.rr(x, y3, 26, 26, 5); ctx.fill(); ctx.strokeStyle = I ? I.col : 'rgba(227,194,122,.25)'; ctx.lineWidth = 1.5; G.rr(x + .5, y3 + .5, 25, 25, 5); ctx.stroke();
        if (I) { G.txt(I.c, x + 13, y3 + 14, 14, I.col, 'center', G.FONT_S, 900); btn(x, y3, 26, 26, () => useItem(c, j)); } } }
    phaseBar(c, cx, top); bossBar(c); }
  function phaseBar(c, cx, top) { const y = top + 32, L = [];
    if (c.ph === 'prep') { L.push(['開戰', () => early(c), 1]); L.push([c.edit ? '完成' : '編成', () => { c.edit = !c.edit; }, c.edit]); L.push([c.endless ? '模式：無限' : '模式：8 波', () => { c.endless = !c.endless; G.UI.toast(c.endless ? '無限守家：撐越久獎勵越多（第 9 波起敵人逐波變強）' : '一般守家：守住 8 波'); }, c.endless]); }
    if (c.ph === 'rest') L.push(['下一波', () => early(c), 1]);
    if (c.ph === 'prep' || c.ph === 'rest') L.push(['軍備', () => { K.menu = { k: 'bugyo', tab: 0 }; }]);
    if (c.endless && c.wave >= 8 && c.ph === 'rest') L.push(['收兵領賞', () => finishK(c, true, '收兵・撐到第 ' + c.wave + ' 波')]);
    const w = 72, x0 = cx - (L.length * (w + 6) - 6) / 2; L.forEach(([t, f, on], j) => button(x0 + j * (w + 6), y, w, 26, t, f, !!on)); }
  function bossBar(c) {
    const bb = c.bossE; if (bb && bb.st !== 'dead' && bb.delay <= 0) { const w = Math.min(360, G.LW * 0.42), bx2 = (G.LW - w) / 2, by2 = G.LH - 34 - G.SAFE.b;   /* 頭目血條名稱：敵大將名 */
      ctx.fillStyle = 'rgba(12,8,10,.95)'; ctx.fillRect(bx2 - 2, by2 - 17, w * 0.6, 14); G.txt(bb.elite + '　Lv ' + bb.lv, bx2, by2 - 8, 11, '#f0ad52', 'left', G.FONT_S, 900); }
  }
  /* ---------- r3.60.0：戰中強化、軍令、合戰道具 ---------- */
  function upU(c, k) { const l = ulv(c, k); if (l >= UMAX) return G.UI.toast(UNIT[k].n + ' 已強化到頂'); const cost = uCost(l); if (c.rice < cost) return G.UI.toast('兵糧不足（需要 ' + cost + '）');
    c.rice -= cost; c.ulv[k] = l + 1; for (const u of c.units) if (u.k === k && u.hp > 0) reU(c, u);
    G.UI.toast(UNIT[k].n + '（' + ugOf(k).r + '）強化 +' + (l + 1) + '：每級 ' + ugTxt(k));
    const ms = { 10: '每隊多 1 人（下次出兵起）', 20: '精銳：傷害 +20%、腳下金環', 30: '名隊：每 20 秒自動發動「' + NSN[k] + '」' }[l + 1]; if (ms) G.UI.banner(UNIT[k].n + '　強化 ' + (l + 1), ms); }
  /* r3.67.0：兵種名隊技（戰中強化 30） */
  const NSN = { spear: '槍衾旋風', shield: '鐵壁', bow: '箭雨', gun: '齊射', ninja: '影縫', samurai: '鬨聲' };
  function nameSkill(c) { c.nsT = c.nsT || {}; for (const k in c.ulv) { if (ulv(c, k) < 30) continue; const L = c.units.filter(u => u.k === k && u.hp > 0); if (!L.length) continue; c.nsT[k] = (c.nsT[k] || 0) + 1; if (c.nsT[k] % 1200) continue;
      const foes = r => (x, y) => G.E.filter(e => e.kz && e.st !== 'dead' && !e.wo && e.delay <= 0 && Math.hypot(e.x - x, (e.y - y) * 1.4) < r);
      if (k === 'spear') for (const u of L) { hitArea(c, u.x, u.y, 95, 0.6); VX.ring && VX.ring({ x: u.x, y: u.y, r1: 1.1, life: 16, col: '255,220,150', lw: 0.06 }); }
      else if (k === 'shield') { c.buf.dr = 300; for (const u of L) VX.ring && VX.ring({ x: u.x, y: u.y, r1: 0.9, life: 20, col: '160,200,255', lw: 0.08 }); }
      else if (k === 'bow') { const e = densest(c, 120); if (e) { const x = e.x, y = e.y; c.fx.push({ k: 'warn', ours: 1, x, y, t: 0, life: 30, done: () => { hitArea(c, x, y, 130, 0.9, true); VX.s2('fx_blast', { x, y, k: 1.2, life: 24 }); } }); } }
      else if (k === 'gun') for (const u of L) { const e = foes(520)(u.x, u.y).sort((p, q) => Math.hypot(p.x - u.x, p.y - u.y) - Math.hypot(q.x - u.x, q.y - u.y))[0]; if (e) { tracer(u.x, u.y - HH() * 0.55 * S(u.y), e.x, e.y - 20, 'gun'); G.damageOni(e, 1, true, false, hitOpt(c, e, 1.5, u.face, u)); } }
      else if (k === 'ninja') for (const u of L) for (const e of foes(150)(u.x, u.y)) e.stun = Math.max(e.stun || 0, e.boss ? 40 : 90);
      else if (k === 'samurai') c.buf.atk = 300;
      G.NUMS.push({ x: L[0].x, y: L[0].y - HH() * S(L[0].y) - 24, v: '名隊・' + NSN[k], t: 0 }); } }
  const fixAllCost = c => { let t = 0; for (const b of c.st) if (b.hp > 0 && b.hp < b.hpMax - 1) t += fixCost(b); return Math.ceil(t * 0.8); };
  function densest(c, r) { let best = null, bn = 0; for (const e of G.E) { if (!e.kz || e.st === 'dead' || e.wo || e.delay > 0) continue; let n = 0; for (const q of G.E) if (q.kz && q.st !== 'dead' && !q.wo && Math.hypot(q.x - e.x, (q.y - e.y) * 1.4) < r) n++; if (n > bn) { bn = n; best = e; } } return best; }
  function hitArea(c, x, y, r, frac, big) { for (const e of G.E) if (e.kz && e.st !== 'dead' && e.wo !== 'ladder' && Math.hypot(e.x - x, (e.y - y) * 1.4) < r) G.damageOni(e, 1, !!big, false, hitOpt(c, e, frac, Math.sign(e.x - x) || 1, null)); }
  function order(c, k) { const O = ORD[k]; if ((c.cdS[k] || 0) > 0) return; const cdF = () => { c.cdS[k] = Math.round(O.cd * 60 * (1 - 0.1 * gu('cmd')) * (gu('cmd') >= 5 ? 0.8 : 1)); };
    if (k === 'fix') { const cost = fixAllCost(c); if (!cost) return G.UI.toast('沒有受損的防禦物'); if (c.rice < cost) return G.UI.toast('兵糧不足（全修需要 ' + cost + '）'); c.rice -= cost;
      for (const b of c.st) if (b.hp > 0 && b.hp < b.hpMax) { b.hp = b.hpMax; b.fl = 10; VX.ring && VX.ring({ x: b.x, y: b.y, r1: 1.0, life: 18, col: '150,230,150', lw: 0.08 }); } return G.UI.toast('全部修復（兵糧 −' + cost + '）'); }
    if (k === 'rain') { const e = densest(c, 140); if (!e) return G.UI.toast('附近沒有敵人'); cdF(); const x = e.x, y = e.y;
      for (let v = 0; v < 3; v++) c.fx.push({ k: 'warn', ours: 1, x, y, t: -v * 18, life: 24, done: () => { for (let a = 0; a < 10; a++) { const tx = x + R(-120, 120), ty = y + R(-40, 40); tracer(tx - 60, ty - 260, tx, ty - 6, 'arrow'); } hitArea(c, x, y, 150, 0.3 * cmdK()); } });
      return G.UI.banner('軍令・箭雨', '三輪齊射'); }
    if (k === 'rally') { cdF(); c.buf.rally = Math.round(600 * cmdK()); for (const u of c.units) if (u.hp > 0) VX.ring && VX.ring({ x: u.x, y: u.y, r1: 0.8, life: 16, col: '255,200,90', lw: 0.08 }); VX.ring && VX.ring({ x: H.x, y: H.y, r1: 3, life: 30, col: '255,200,90', lw: 0.08 }); G.AU && G.AU.sfx('heavy'); return G.UI.banner('軍令・鼓舞', '全軍攻擊、攻速 +30%（10 秒）'); }
    if (k === 'aid') { cdF(); dispatch(c, unlocked('samurai') ? 'samurai' : 'spear', true); dispatch(c, 'spear', true); return G.UI.banner('軍令・援軍', '援兵從本陣趕到'); } }
  function useItem(c, j) { const it = c.items[j]; if (!it) return; c.items.splice(j, 1); const I = ITEM[it];
    if (it === 'drum') c.buf.spd = 1200; else if (it === 'sake') c.buf.atk = 1200; else if (it === 'armor') c.buf.dr = 1200;
    else if (it === 'pill') { for (const u of c.units) if (u.hp > 0) u.hp = Math.min(u.hpMax, u.hp + u.hpMax * 0.3); H.hp = Math.min(H.hpMax, H.hp + H.hpMax * 0.3); }
    else if (it === 'smoke') { for (const e of G.E) if (e.kz && e.st !== 'dead') { e.db = e.db || {}; e.db.slow = 1; e.kzSlow = 720; } VX.s2('fx_smoke', { x: H.x + 200, y: H.y, k: 3, life: 60 }); }
    else if (it === 'powder') { const e = densest(c, 150); if (e) { const x = e.x, y = e.y; c.fx.push({ k: 'warn', ours: 1, x, y, t: 0, life: 30, done: () => { VX.s2('fx_blast', { x, y, k: 2.4, life: 34 }); SC.shake = 4; hitArea(c, x, y, 170, 0.9, true); } }); } }
    VX.ring && VX.ring({ x: H.x, y: H.y, r1: 2.4, life: 24, col: '255,220,140', lw: 0.08 }); G.UI.banner(I.n, I.d); }
  function buildMenu(c) { const sl = K.menu.sl, b = sl.b && sl.b.hp > 0 ? sl.b : null, w = Math.min(440, G.LW - 40), h = b ? 196 : 250, x = (G.LW - w) / 2, y = (G.LH - h) / 2 - 20;
    panel(x, y, w, h); button(x + w - 60, y + 8, 50, 26, '✕', () => { K.menu = null; });
    if (b) { const D = DEF[b.k], miss = b.hpMax - b.hp, cost = fixCost(b), L = lvD(b.k), up = b.up || 0, uc = upCost(b);
      G.txt(D.n + '　Lv' + L + '／10' + (up ? '　強化 ' + up + '／' + BUP : ''), x + 16, y + 22, 15, '#e3c27a', 'left', G.FONT_S, 900); G.txt(D.d, x + 16, y + 48, 11, '#f3e8d2', 'left', G.FONT, 600);
      G.txt('耐久 ' + Math.ceil(b.hp) + '／' + Math.ceil(b.hpMax) + '　' + BG[b.k].r + '・強化每級：' + bgTxt(b.k), x + 16, y + 70, 11, '#cfc4b0', 'left', G.FONT, 600);
      G.txt(FEAT[b.k].map((t, i) => (L >= FL[i] ? '◆' : '◇Lv' + FL[i] + ' ') + t).join('　'), x + 16, y + 92, 10, '#9fc0e8', 'left', G.FONT, 700);
      if (b.k === 'tower') { const bows = c.units.filter(u => u.hp > 0 && (u.k === 'bow' || u.k === 'gun')), g = b.gar || 0;   // r3.62.0：物見櫓駐軍
        G.txt('駐軍 ' + g + '／2（每隊：多 1 名弓手、櫓的傷害 +40%）', x + 16, y + 118, 11, '#9fc0e8', 'left', G.FONT, 700);
        button(x + w - 150, y + 106, 134, 26, g >= 2 ? '駐軍已滿' : '派弓／鐵砲 3 名駐守', () => { const L2 = bows.sort((a, q) => Math.hypot(a.x - b.x, a.y - b.y) - Math.hypot(q.x - b.x, q.y - b.y)).slice(0, 3); for (const u of L2) { u.hp = 0; u.st = 'dead'; u.alpha = 0; } b.gar = g + 1; VX.ring && VX.ring({ x: b.x, y: b.y, r1: 1.2, life: 18, col: '160,200,255', lw: 0.08 }); G.UI.toast('物見櫓駐軍 ' + b.gar + '／2'); K.menu = null; }, false, g >= 2 || bows.length < 3); }
      const by = y + h - 46;
      button(x + 16, by, 120, 32, miss > 1 ? '修理（' + cost + '）' : '耐久已滿', () => { if (c.rice < cost) return G.UI.toast('兵糧不足'); c.rice -= cost; b.hp = b.hpMax; K.menu = null; }, false, miss <= 1 || c.ph === 'wave');
      button(x + 144, by, 168, 32, up >= BUP ? '強化已滿' : '強化 ' + up + '→' + (up + 1) + '（兵糧 ' + uc + '）', () => { if (c.rice < uc) return G.UI.toast('兵糧不足（需要 ' + uc + '）'); c.rice -= uc; b.up = up + 1; reB(c, b); b.hp = b.hpMax; b.fl = 10;
        VX.ring && VX.ring({ x: b.x, y: b.y, r1: 1.3, life: 20, col: '255,214,120', lw: 0.09 }); G.UI.toast(D.n + ' 強化 ' + b.up + '：' + bgTxt(b.k) + '（補滿耐久）'); }, true, up >= BUP || c.rice < uc);
      button(x + w - 112, by, 96, 32, '拆除（退半）', () => { c.rice += Math.floor(D.cost / 2); breakStruct(null, b); b.dead = G.t - 600; c.st = c.st.filter(q => q !== b); sl.b = null; K.menu = null; }, false, c.ph === 'wave'); return; }
    G.txt('建造防禦物　兵糧 ' + c.rice, x + 16, y + 22, 15, '#e3c27a', 'left', G.FONT_S, 900);
    DK.forEach((k, j) => { const D = DEF[k], col = j % 2, row = Math.floor(j / 2), bx = x + 12 + col * (w - 24) / 2, by = y + 44 + row * 66, bw = (w - 32) / 2, bc = bCostOf(k), ok = c.rice >= bc;
      ctx.fillStyle = ok ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.25)'; G.rr(bx, by, bw, 60, 6); ctx.fill();
      G.txt(D.n + '　' + bc, bx + 8, by + 14, 13, ok ? '#f3d98a' : '#8a7f74', 'left', G.FONT_S, 900); G.txt('Lv' + lvD(k), bx + bw - 8, by + 14, 10, '#9fc0e8', 'right', G.FONT, 800);
      G.wrap(D.d, bw - 16).slice(0, 2).forEach((l, i) => G.txt(l, bx + 8, by + 32 + i * 14, 10, '#cfc4b0', 'left', G.FONT, 500));
      if (ok) btn(bx, by, bw, 60, () => build(c, sl, k)); }); }
  function result(c) { const w = Math.min(360, G.LW - 40), h = 150, x = (G.LW - w) / 2, y = G.LH * 0.28; ctx.fillStyle = '#100b0d'; G.rr(x, y, w, h, 8); ctx.fill(); panel(x, y, w, h);
    G.txt(c.res.ok ? '守家　勝利' : '守家　失敗', x + w / 2, y + 26, 18, c.res.ok ? '#e3c27a' : '#e07a6a', 'center', G.FONT_S, 900);
    if (c.rank) G.txt('評價　' + c.rank, x + w / 2, y + 58, 22, c.rank === 'S' ? '#f3d98a' : c.rank === 'A' ? '#9fc0e8' : '#cfc4b0', 'center', G.FONT_S, 900);
    G.txt('據點 ' + Math.round(c.bhp / c.bhpMax * 100) + '%・擊破 ' + c.kills + '・軍功 +' + (c.gkAll || 0) + (c.riceG ? '・兵糧換錢 +' + c.riceG : ''), x + w / 2, y + 92, 12, '#f3e8d2', 'center', G.FONT, 700);
    G.txt('獎勵自動收進背包・' + Math.ceil(c.res.t / 60) + ' 秒後回城', x + w / 2, y + 118, 10, '#cfc4b0', 'center', G.FONT, 600); button(x + w - 78, y + 8, 68, 24, '回城', () => { c.res.t = Math.min(c.res.t, 100); }, true); }
  function tap(p) { for (let i = BT.length - 1; i >= 0; i--) { const b = BT[i]; if (p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) { b.f(); return true; } }
    if (K.menu) { K.menu = null; return true; } return false; }

  K._t = { dispatch: k => K.c && dispatch(K.c, k), build: (i, k) => K.c && build(K.c, K.c.slots[i], k), tap, upU: k => K.c && upU(K.c, k), nameSkill: () => K.c && nameSkill(K.c), FEAT };
  /* ---------- 軍奉行（兩岸城） ---------- */
  /* 合戰商店：靈紋石（軍功 80：重洗一條靈紋，等級依裝備品質重骰）、兵種書（提前解鎖：盾／鐵砲 150、忍者／武者 300） */
  const STONE = 80, BOOK = { shield: 150, gun: 150, ninja: 300, samurai: 300 };
  function runeItems() { const d = G.RPG.d(), L = []; for (const k of G.RPG.SLOT) { const it = d.eq[k]; if (it && G.RUNE) { G.RUNE.ensure(it); if (it.rn && it.rn.length) L.push([it, '身上']); } }
    for (const it of d.bag) { if (G.RUNE) G.RUNE.ensure(it); if (it.rn && it.rn.length) L.push([it, '背包']); } return L; }
  function reroll(it, j) { const s = KS(); if ((s.stone || 0) <= 0) return G.UI.toast('沒有靈紋石'); const ids = Object.keys(G.RUNE.RN).filter(k => !it.rn.some((r, i) => i !== j && r[0] === k));
    const lv = it.q >= 5 ? 2 + Math.floor(Math.random() * 2) : 1 + Math.floor(Math.random() * 2), id = ids[Math.floor(Math.random() * ids.length)], old = G.RUNE.RN[it.rn[j][0]].n;
    it.rn[j] = [id, lv]; s.stone--; G.RPG.recalc && G.RPG.recalc(); G.SAVE.markDirty(); G.UI.toast(old + ' → ' + G.RUNE.RN[id].n + ' Lv' + lv); }
  function shopTab(x, y, w, h, top) { const s = KS(), lw = Math.min(250, w * 0.42);
    G.txt('購買（軍功）', x + 16, top + 6, 12, '#e3c27a', 'left', G.FONT_S, 900);
    button(x + 16, top + 18, lw - 8, 32, '靈紋石　軍功 ' + STONE + '（持有 ' + (s.stone || 0) + '）', () => { if ((s.gk || 0) < STONE) return G.UI.toast('軍功不足'); s.gk -= STONE; s.stone = (s.stone || 0) + 1; G.SAVE.markDirty(); }, false, (s.gk || 0) < STONE);
    let yy = top + 58; for (const k of ['shield', 'gun', 'ninja', 'samurai']) { const U = UNIT[k], has = unlocked(k), c = BOOK[k];
      button(x + 16, yy, lw - 8, 28, has ? U.n + '　已解鎖' : U.n + '兵種書　軍功 ' + c, () => { if ((s.gk || 0) < c) return G.UI.toast('軍功不足'); s.gk -= c; s.book = s.book || {}; s.book[k] = 1; G.SAVE.markDirty(); G.UI.toast(U.n + ' 解鎖'); }, false, has || (s.gk || 0) < c); yy += 34; }
    G.txt('兵種書：不用等章節，直接能帶上場', x + 16, yy + 6, 10, '#a89c8a', 'left', G.FONT, 600);
    /* 靈紋重洗：每格一件裝備，每條靈紋一個「洗」 */
    const rx = x + lw + 20, rw = x + w - 16 - rx, L = runeItems(), per = Math.max(1, Math.floor((y + h - top - 40) / 50)), pg = Math.min(K.menu.pg | 0, Math.max(0, Math.ceil(L.length / per) - 1)); K.menu.pg = pg;
    G.txt('靈紋重洗（用 1 顆靈紋石洗一條）', rx, top + 6, 12, '#e3c27a', 'left', G.FONT_S, 900);
    if (!L.length) G.txt('身上和背包沒有帶靈紋的裝備（傳說以上才有）', rx, top + 34, 11, '#a89c8a', 'left', G.FONT, 600);
    L.slice(pg * per, pg * per + per).forEach(([it, where], i) => { const by = top + 18 + i * 50; ctx.fillStyle = 'rgba(255,255,255,.05)'; G.rr(rx, by, rw, 46, 6); ctx.fill();
      const Q = G.RPG.QUAL[it.q] || {}; G.txt(G.RPG.name(it) + '（' + where + '）', rx + 8, by + 11, 11, Q.c || '#f3e8d2', 'left', G.FONT_S, 900);
      it.rn.forEach(([id, lv], j) => { const r = G.RUNE.RN[id], bx = rx + 8 + j * ((rw - 16) / 2), bw = (rw - 24) / 2;
        G.txt('◆ ' + r.n + ' Lv' + lv, bx, by + 32, 10, r.c, 'left', G.FONT, 800); button(bx + bw - 40, by + 23, 40, 20, '洗', () => reroll(it, j), false, (s.stone || 0) <= 0); }); });
    const np = Math.ceil(L.length / per); if (np > 1) { button(rx, y + h - 34, 40, 24, '◀', () => { K.menu.pg = Math.max(0, pg - 1); }, false, pg <= 0); G.txt((pg + 1) + '／' + np, rx + 64, y + h - 22, 11, '#cfc4b0', 'center', G.FONT, 700); button(rx + 88, y + h - 34, 40, 24, '▶', () => { K.menu.pg = pg + 1; }, false, pg >= np - 1); } }
  function bugyoNpc() { if (!G.AMB || !G.AMB.add) return; const g = ((G.D.scenes.hub_city || {}).nodes || {}).center; if (!g) return;
    setTimeout(() => { if (SC.id !== 'hub_city' || G.AMB.list.some(n => n.kzb)) return;
      const bp = (SC.snap && SC.snap(720, 305, 'open', 160)) || [720, 305];   // r3.55.0：移到北邊城門前廣場（原本擠在時雨旁）
      G.AMB.add('n_t_human_guard', bp[0], bp[1], { name: '軍奉行・景勝', hold: 1, kzb: 1, onTalk: n => G.DLG.start([{ who: '軍奉行・景勝', text: '合戰的兵、防禦物、家紋，都歸我管。軍功拿來，就幫你練兵。' },
        { choice: [{ label: '軍備（升級・家紋）', then: [{ do: () => { K.menu = { k: 'bugyo', tab: 0 }; } }] }, { label: '離開', then: [] }] }]) }).then(n => { if (n) { n.face = -1; } }); }, 400); }
  /* r3.98.0：軍備清單改成「左清單／右詳情」：左邊只列名稱與等級，右邊分行顯示成長、特性、費用與升級鍵（文字自動換行、可捲動） */
  function wrapT(t, x, y, mw, sz, col, wt, lh) { ctx.font = `${wt || 500} ${sz * G.FS()}px ${G.FONT}`; const L = G.wrap(t, mw); L.forEach((l, i) => G.txt(l, x, y + i * lh, sz, col, 'left', G.FONT, wt || 500)); return y + L.length * lh; }
  function itemsOf(tab, s) {
    if (tab === 0) return UK.map(k => { const U = UNIT[k], L = lvU(k), ok = unlocked(k); return { k, n: U.n, L, max: 10, ok, ico: U.ico, lock: '第 ' + U.p + ' 章後或兵種書',
      role: ugOf(k).r + '・一隊 ' + (4 + (L >= 5 ? 1 : 0) + (L >= 10 ? 1 : 0)) + ' 人', grow: '每級 ×2：' + ugTxt(k), tr: TRAIT[k].map((t, i) => [TL[i], t]), g: 2000 * L, m: 50 * L,
      up: () => { s.lv[k] = L + 1; const ti = TL.indexOf(L + 1); return U.n + ' 升到 Lv' + (L + 1) + (ti >= 0 ? '：學會「' + TRAIT[k][ti].split('：')[0] + '」' : ''); } }; });
    if (tab === 1) return DK.map(k => { const D = DEF[k], L = lvD(k); return { k, n: D.n, L, max: 10, ok: true, role: BG[k].r, grow: '每 3 級＝戰中強化 1 級：' + bgTxt(k), tr: FEAT[k].map((t, i) => [FL[i], t]), g: 1500 * L, m: 40 * L,
      up: () => { s.dl[k] = L + 1; const ti = FL.indexOf(L + 1); return D.n + ' 升到 Lv' + (L + 1) + (ti >= 0 ? '：' + FEAT[k][ti] : ''); } }; });
    s.up = s.up || {}; return GK.map(k => { const D = GU[k], L = gu(k); return { k, n: D.n, L, max: GMAX, ok: true, role: '本陣永久強化', grow: '每級：' + D.d, tr: GUF[k].map((t, i) => [[3, 5][i], t]), g: 2500 * (L + 1), m: 60 * (L + 1),
      up: () => { s.up[k] = L + 1; return D.n + ' 升到 Lv' + (L + 1); } }; }); }
  function listTab(tab, x, y, w, h, top, s, d) { const L = itemsOf(tab, s), key = 'si' + tab, si = Math.min(L.length - 1, K.menu[key] | 0), lw = Math.min(250, w * 0.38), bot = y + h - 12, RH = Math.min(44, (bot - top) / L.length);
    L.forEach((it, j) => { const yy = top + j * RH, on = j === si; ctx.fillStyle = on ? 'rgba(150,92,36,.55)' : 'rgba(255,255,255,.04)'; G.rr(x + 12, yy, lw, RH - 4, 6); ctx.fill();
      if (on) { ctx.strokeStyle = 'rgba(227,194,122,.7)'; ctx.lineWidth = 1; G.rr(x + 12.5, yy + .5, lw - 1, RH - 5, 6); ctx.stroke(); }
      let tx = x + 22; if (it.ico && icon(it.ico, x + 16, yy + 2, RH - 8, RH - 8, it.ok ? 1 : 0.35)) tx = x + 16 + RH;
      G.txt(it.n, tx, yy + (RH - 4) / 2, 13, it.ok ? '#f3e8d2' : '#8a7f74', 'left', G.FONT_S, 900);
      G.txt(it.ok ? 'Lv ' + it.L + '／' + it.max : '未開放', x + 12 + lw - 10, yy + (RH - 4) / 2, 11, it.ok ? (it.L >= it.max ? '#e3c27a' : '#cfc4b0') : '#8a7f74', 'right', G.FONT, 800);
      btn(x + 12, yy, lw, RH - 4, () => { K.menu[key] = j; }); });
    const it = L[si], cx = x + 24 + lw, cw = x + w - 14 - cx; if (!it) return;
    ctx.fillStyle = 'rgba(255,255,255,.03)'; G.rr(cx, top, cw, bot - top, 8); ctx.fill();
    let yy = top + 20; G.txt(it.n, cx + 14, yy, 17, '#e3c27a', 'left', G.FONT_S, 900); G.txt(it.ok ? 'Lv ' + it.L + '／' + it.max : '未開放', cx + cw - 14, yy, 13, '#f3d98a', 'right', G.FONT_S, 900); yy += 18;
    ctx.fillStyle = 'rgba(255,255,255,.1)'; G.rr(cx + 14, yy, cw - 28, 5, 2.5); ctx.fill(); ctx.fillStyle = '#e3c27a'; G.rr(cx + 14, yy, (cw - 28) * it.L / it.max, 5, 2.5); ctx.fill(); yy += 22;
    G.txt(it.role, cx + 14, yy, 12, '#cfc4b0', 'left', G.FONT, 700); yy += 22;
    if (!it.ok) { G.txt('開放條件：' + it.lock, cx + 14, yy, 12, '#e07a6a', 'left', G.FONT, 700); yy += 22; }
    G.txt('成長', cx + 14, yy, 12, '#e3c27a', 'left', G.FONT_S, 900); yy += 18; yy = wrapT(it.grow, cx + 14, yy, cw - 28, 12, '#f3e8d2', 500, 18) + 8;
    G.txt('特性', cx + 14, yy, 12, '#e3c27a', 'left', G.FONT_S, 900); yy += 18;
    for (const [lv, t] of it.tr) { const got = it.L >= lv; G.txt((got ? '◆ ' : '◇ ') + 'Lv' + lv, cx + 14, yy, 11, got ? '#7fd36b' : '#8a7f74', 'left', G.FONT, 800);
      yy = wrapT(t, cx + 74, yy, cw - 88, 11, got ? '#f3e8d2' : '#a89c8a', 500, 16) + 4; }
    if (tab === 4) { const b = s.best || {}; G.txt('無限守家最佳：紅葉河原 ' + (b.WAR_MOMIJI || 0) + ' 波・月夜城 ' + (b.WAR_MOON || 0) + ' 波', cx + 14, bot - 50, 10, '#a89c8a', 'left', G.FONT, 600); }
    if (it.L >= it.max) { G.txt('已滿級', cx + cw - 14, bot - 22, 13, '#e3c27a', 'right', G.FONT_S, 900); return; }
    const poor = d.gold < it.g || (s.gk || 0) < it.m, bw = Math.min(230, cw - 28);
    G.txt('費用　錢 ' + it.g + '・軍功 ' + it.m, cx + 14, bot - 22, 12, poor ? '#e07a6a' : '#f3d98a', 'left', G.FONT, 800);
    button(cx + cw - 14 - Math.min(110, bw), bot - 38, Math.min(110, bw), 32, '升級', () => { if (!it.ok) return G.UI.toast('尚未開放：' + it.lock); if (d.gold < it.g || (s.gk || 0) < it.m) return G.UI.toast('錢或軍功不足');
      d.gold -= it.g; s.gk -= it.m; const msg = it.up(); G.SAVE.markDirty(); G.UI.toast(msg); }, false, !it.ok || poor); }
  function bugyoMenu() { const s = KS(), d = G.RPG.d(), w = Math.min(760, G.LW - 30), h = Math.min(420, G.LH - 24), x = (G.LW - w) / 2, y = (G.LH - h) / 2, tab = K.menu.tab | 0;
    ctx.fillStyle = 'rgba(8,6,8,.55)'; ctx.fillRect(0, 0, G.LW, G.LH); panel(x, y, w, h); btn(0, 0, G.LW, G.LH, () => {});
    G.txt('軍奉行　軍備', x + 16, y + 22, 16, '#e3c27a', 'left', G.FONT_S, 900); G.txt('軍功 ' + (s.gk || 0) + '　錢 ' + d.gold, x + 150, y + 22, 12, '#f3d98a', 'left', G.FONT, 800);
    button(x + w - 56, y + 8, 46, 26, '✕', () => { K.menu = null; });
    ['兵種', '防禦物', '家紋', '合戰商店', '本陣'].forEach((t, i) => button(x + 16 + i * 84, y + 42, 78, 28, t, () => { K.menu.tab = i; K.menu.pg = 0; }, i === tab));
    const top = y + 80;
    if (tab === 0 || tab === 1 || tab === 4) listTab(tab, x, y, w, h, top, s, d);
    else if (tab === 3) shopTab(x, y, w, h, top);
    else if (tab === 2) { G.txt('我方家紋（旗、陣幕、背旗都會用到）', x + 16, top + 4, 12, '#f3e8d2', 'left', G.FONT, 700);
      KAMON.forEach((n, i) => { const col = i % 4, row = Math.floor(i / 4), bx = x + 20 + col * ((w - 40) / 4), by = top + 20 + row * Math.min(110, (y + h - top - 24) / 2), on = s.kamon === i, im = kamonImg(i, BLUE);
        ctx.fillStyle = on ? 'rgba(150,92,36,.5)' : 'rgba(240,232,214,.9)'; G.rr(bx, by, 80, 80, 8); ctx.fill(); if (on) { ctx.strokeStyle = '#e3c27a'; ctx.lineWidth = 2; G.rr(bx, by, 80, 80, 8); ctx.stroke(); }
        if (im) { if (on) { ctx.fillStyle = 'rgba(240,232,214,.95)'; ctx.beginPath(); ctx.arc(bx + 40, by + 40, 34, 0, 6.283); ctx.fill(); } ctx.drawImage(im, bx + 8, by + 8, 64, 64); }
        G.txt(n, bx + 40, by + 92, 11, on ? '#e3c27a' : '#cfc4b0', 'center', G.FONT, 800); btn(bx, by, 80, 100, () => { s.kamon = i; G.SAVE.markDirty(); }); }); } }
  /* r3.56.0：竹束也保護主角（身後受傷減半） */
  const hh0 = G.hurtHero; G.hurtHero = function (atk, srcX) { const c = K.c; if (c && !c.done && c.st) for (const b of c.st) if (b.k === 'bamboo' && b.hp > 0 && Math.abs(H.x - b.x) < (DL('bamboo', 3) ? 120 : 75) && Math.abs(H.y - b.y) < 40) { atk *= Math.max(0.25, 0.5 - 0.04 * bgN('bamboo', b.up)); break; }
    return hh0.call(this, atk, srcX); };
})();
