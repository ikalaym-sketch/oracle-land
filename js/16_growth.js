/* ==========================================================================
 * 神諭之地 重製版 — 16_growth.js
 * Version : r3.206.0  (2026-11-28)　r3.206.0：設定新增「鏡頭微調」
 * 舊版    : r3.203.0  (2026-11-28)　r3.203.0：設定頁改版（分區、選項攤開）；職業頁右側改版（固定名牌＋能力／外掛能力兩頁、等級牌與類型色標）
 * 舊版    : r3.201.0  (2026-11-28)　r3.201.0：設定新增「按鍵位置」
 * 舊版    : r3.166.0  (2026-11-27)　r3.166.0：拿掉選單「地圖」分頁（統一用小地圖→行旅繪圖）
 * 舊版    : r3.150.0  (2026-11-27)　r3.150.0：轉職為里歐時，原職業的特性／特殊／外掛不生效
 * 舊版    : r3.149.0  (2026-11-27)　r3.149.0：里歐普攻加快 ×1.15（約 15 幀），每下傷害同打刀
 * 舊版    : r3.148.0  (2026-11-27)　r3.148.0：奧義加速每級氣 +5% 生效；衝刺 Lv5 改成「穿過的敵人停頓 0.5 秒」
 * 舊版    : r3.147.0  (2026-11-27)　r3.147.0：修練頁改版（兩欄卡片＋右側說明與升級鈕，等級用圓點，鎖住的排後面）；職業頁拿掉開發用說明
 * 舊版    : r3.142.0  (2026-11-27)　r3.142.0：普攻連段加成（WPN.CMB）
 * 舊版    : r3.140.0  (2026-11-27)　r3.140.0：普攻節奏：武器倍率（WPN.RHY）×（1＋攻速%），可快可慢；慢下來的武器普攻傷害 ×1/倍率
 * 舊版    : r3.125.0  (2026-11-26)　r3.125.0：第 1 章路線清單加入新插入的地圖
 * 舊版    : r3.103.0  (2026-11-26)　r3.103.0：設定格可帶圖示（第 4 欄，難度用）
 * 舊版    : r3.99.0  (2026-11-26)　r3.99.0：修練 6～10 級（巔峰點數）：效果走 GR.tEff、上限 GR.tMax（126_peak）
 * 舊版    : r3.94.0  (2026-11-26)　r3.94.0：增傷全部改相加（G.DZ），攻擊% 改 s._atkP；夥伴、觸發傷害不吃主角增傷與招式連鎖
 * 舊版    : r3.93.0  （r3.93.0：進階修煉「切換斬」換成「破綻追擊」；「閃避反擊」生效；「復甦」加每場站起 1 次——效果在 122_bal）
 * 舊版    : r3.32.0  （r3.32.0：設定頁可由其他模組加項目（難度））
 * 舊版    : r3.28.0  （r3.28.0：炭里改為第五章「炭里長屋」　r3.24.0：招財滿級改為全部掉落物自動吸取）
 * 舊版    : r3.19.4  （r3.19.4：見切／天照大御神／倶利伽羅／總等級 80 改寫並生效，不再有「未生效」）
 * 舊版    : r3.19.2  （r3.19.2：修練「未生效」全部改寫並實裝：誘敵分身、身輕、踏跳、自動服藥、同伴強化、復甦）
 * 舊版    : r3.19.1  （r3.19.1：職業清單可捲動、欄寬加大）
 * 舊版    : r3.10.1  (2026-11-13)
 * 變更    : r3.10.1 地圖選單傳送：頭目戰中禁止。
 * 變更    : r3.8.2 地圖頁據點加「神社後山」。
 * 變更    : r3.6.0 地圖頁：據點兩欄＋未到訪的據點標出位置（例：兩岸城＝第七章）；章節頁列出本章路線與到訪狀態。
 * 變更    : r3.5.0 地圖頁合戰分頁開放（說明找傳送役）、副本說明更新。
 * 變更    : r3.4.0 修練改成上方子選項（基礎／進階／輔助／身法）一次只列一類；背包部位篩選子選項。
 * 變更    : r3.3.0 地圖頁：第 7～12 章、兩岸城／曙火寄居地、副本分頁開放；分頁圖示接 P8。
 * 變更    : r3.1.0 新增。職業（7 職、特性／基本／特殊／極意／覺醒、外掛 3 格、陣營共鳴、總等級獎勵、外觀、頭像）、
 *           修練（共用技能點 26 項）、地圖分頁（章節移動＋未來章節／合戰／副本預留）、BGM／音效。
 * 說明    : 數值依「神諭之地 成長與裝備數值」職業／技能點頁。
 *           靜態加成只在 recalc 時合併進 G.RPG.S（不在每格重算）；觸發型效果走下列掛鉤：
 *             apply(s)        ← 07_rpg.recalc
 *             dmgMul/onHit    ← damageOni 包裝（本檔）
 *             taken/onHurt    ← 03_actors 受擊
 *             onDodge/onSkill ← 03_actors 出招
 *             step()          ← heroStep 包裝（本檔，每格 1 次、無配置）
 *           「未生效」：目前遊戲還沒有對應系統（完美閃避、倒地、藥水、同伴戰鬥、復活、職業終極主動技），UI 會標示。
 * ========================================================================== */
'use strict';
(function () {
  const ctx = G.ctx, C = G.C, H = G.H, M = G.MENU;
  const R = () => G.RPG, d = () => G.RPG.d(), S = () => G.SAVE.data;
  /* ---------- 職業資料 ---------- */
  const J = (id, n, fac, max, req, trait, ab) => ({ id, n, fac, max, req, trait, ab });
  const JOBS = [
    J('samurai', '武士', '中', 20, null, ['武士之心', '攻擊、防禦 +5%；武器熟練度獲得 +20%', { atkP: 5, defP: 5, profP: 20 }], [
      [3, '基本', '鍛體', '生命 +5%（永久）', { hpP: 5 }], [5, '特殊', '構え', '站定 1 秒後，下一擊傷害 +40%', { rt: 'kamae' }],
      [7, '基本', '刀術', '攻擊 +3%（永久）', { atkP: 3 }], [10, '特殊', '不屈', '受致命傷時保留 1 點生命（冷卻 90 秒）', { rt: 'fukutsu' }],
      [11, '基本', '堅忍', '防禦 +5%（永久）', { defP: 5 }], [15, '特殊', '武者修行', '擊殺菁英回復 50% 氣力', { rt: 'musha' }],
      [20, '極意', '一意專心', '同一把武器連續使用 30 秒後全傷害 +20%，招式冷卻 −20%', { rt: 'ichii' }]]),
    J('kensei', '劍聖', '光', 20, ['samurai', 10, 1], ['劍心', '完美閃避判定 +50%、攻速 +8%', { aspd: 8 }], [
      [3, '基本', '疎走', '攻速 +3%（永久）', { aspd: 3 }], [5, '特殊', '見切', '閃避後 1 秒內的下一擊必定暴擊', { rt: 'mikiri' }],
      [7, '基本', '心眼', '暴擊率 +2%（永久）', { crit: 2 }], [10, '特殊', '返刃', '防禦成功時自動反擊（150%）', { rt: 'kaeshi' }],
      [11, '基本', '輕身', '閃避冷卻 −5%（永久）', { dodgeCd: 5 }], [15, '特殊', '流水', '連段中受擊不中斷', { rt: 'ryusui' }],
      [20, '極意', '劍聖之境', '連段每段 +4%（上限 +40%）；招式冷卻 −30%', { rt: 'kensei', mvCdr: 30 }]]),
    J('tsukuyomi', '月讀', '光', 20, ['kensei', 20, 4], ['月影', '閃避距離 +30%、夜間或暗處傷害 +10%', { dodgeDist: 30 }], [
      [3, '基本', '月華', '暴擊傷害 +10%（永久）', { critD: 10 }], [5, '特殊', '朧', '閃避留下殘影，吸引敵人 2 秒', { rt: 'oboro' }],
      [7, '基本', '夜行', '移速 +3%（永久）', { spd: 3 }], [10, '特殊', '月影步', '閃避後 1.5 秒攻速 +20%', { rt: 'tsukihokage' }],
      [11, '基本', '虛影', '閃避無敵 +0.05 秒（永久）', { dodgeInv: 3 }], [15, '特殊', '満ち欠け', '暴擊命中回復 2 氣力', { rt: 'michikake' }],
      [20, '極意', '滿月', '每第 5 次閃避：周圍敵人緩速 40%、所有冷卻 −2 秒', { rt: 'mangetsu' }]]),
    J('amaterasu', '天照', '光', 30, ['tsukuyomi', 20, 8], ['日輪', '受傷 −10%、全抗 +10%', { dr: 10, res: 10 }], [
      [3, '基本', '日光', '生命 +6%（永久）', { hpP: 6 }], [5, '特殊', '日輪之守', '每 15 秒護盾（最大生命 15%）', { rt: 'shield' }],
      [7, '基本', '神光', '全抗 +5%（永久）', { res: 5 }], [10, '特殊', '御光', '擊殺回復自己與同伴 2% 生命', { rt: 'mikou' }],
      [11, '基本', '暖陽', '生命回復 0.5%／秒（永久）', { regen: 0.5 }], [15, '特殊', '神鏡', '防禦時反射 30% 傷害', { rt: 'shinkyo' }],
      [20, '極意', '天岩戶', '致命傷時無敵 2 秒並回復 30%（冷卻 120 秒）', { rt: 'iwato' }],
      [25, '覺醒', '日輪光環', '周圍敵人受傷 +10%、我方受傷 −10%', { rt: 'sunaura' }],
      [30, '終極', '天照大御神', '自動：生命低於 30% 時發動，10 秒全隊無敵＋周圍淨化（每秒 300%），冷卻 180 秒', { rt: 'ultA' }]]),
    J('shura', '修羅', '闇', 20, ['samurai', 10, 1], ['闘魂', '攻速 +12%、受傷 +5%', { aspd: 12, dr: -5 }], [
      [3, '基本', '猛攻', '攻擊 +3%（永久）', { atkP: 3 }], [5, '特殊', '修羅道', '每次命中攻速 +1%（疊 15 層）', { rt: 'shuradou' }],
      [7, '基本', '疾風', '攻速 +3%（永久）', { aspd: 3 }], [10, '特殊', '鬥氣', '擊殺後 3 秒移速 +20%、攻擊 +10%', { rt: 'touki' }],
      [11, '基本', '連斬', '連段終結技 +10%（永久）', { finP: 10 }], [15, '特殊', '追擊', '終結技後自動追加 1 擊（80%）', { rt: 'tsuigeki' }],
      [20, '極意', '阿修羅', '普攻連段 +1 段；招式不被打斷', { rt: 'ashura' }]]),
    J('rakshasa', '羅剎', '闇', 20, ['shura', 20, 4], ['飢鬼', '吸血 +2%、生命 −10%', { ls: 2, hpP: -10 }], [
      [3, '基本', '嗜血', '吸血 +1%（永久）', { ls: 1 }], [5, '特殊', '渴血', '每少 10% 生命，傷害 +4%', { rt: 'katsuketsu' }],
      [7, '基本', '鬼力', '攻擊 +4%（永久）', { atkP: 4 }], [10, '特殊', '啃食', '擊殺回復 5% 生命', { rt: 'konshoku' }],
      [11, '基本', '徹骨', '暴擊傷害 +10%（永久）', { critD: 10 }], [15, '特殊', '鬼面', '暴擊時對周圍濺射 50%', { rt: 'kimen' }],
      [20, '極意', '羅剎天', '生命低於 30% 時吸血 ×3、不受定身暈眩', { rt: 'rasetsuten' }]]),
    J('myoo', '明王', '闇', 30, ['rakshasa', 20, 8], ['憤怒相', '攻擊 +12%、防禦 −10%', { atkP: 12, defP: -10 }], [
      [3, '基本', '剃力', '攻擊 +5%（永久）', { atkP: 5 }], [5, '特殊', '怒氣', '每受傷疊 1 層怒氣（上限 10），每層攻擊 +2%', { rt: 'rage' }],
      [7, '基本', '忿怒', '暴擊傷害 +15%（永久）', { critD: 15 }], [10, '特殊', '憤怒一擊', '怒氣滿時下一個武技 +60%（消耗怒氣）', { rt: 'rageHit' }],
      [11, '基本', '金剛身', '生命 +4%（永久）', { hpP: 4 }], [15, '特殊', '不動之構', '施放武技時霸體', { rt: 'fudou' }],
      [20, '極意', '明王降臨', '怒氣滿時狂暴 8 秒：攻擊 +30%、攻速 +20%、受傷 +15%（冷卻 45 秒）', { rt: 'berserk' }],
      [25, '覺醒', '迴樓羅炎', '周圍敵人每秒 100%、狂暴時敵人防禦 −20%', { rt: 'fireaura' }],
      [30, '終極', '倶利伽羅', '施放奧義時發動：火焰巨劍 8 秒，每秒 600% 範圍、吸血 +10%，冷卻 180 秒', { rt: 'ultB' }]])];
  const JB = {}; JOBS.forEach(j => JB[j.id] = j);
  const TOTAL = [[20, '攻擊、防禦、生命 +2%', { atkP: 2, defP: 2, hpP: 2 }], [40, '職業點獲得 +20%', { jxpP: 20 }], [60, '攻擊、防禦、生命 +3%', { atkP: 3, defP: 3, hpP: 3 }],
    [80, '「氣」獲得 +15%', { qiP: 15 }], [100, '攻擊、防禦、生命 +5%', { atkP: 5, defP: 5, hpP: 5 }], [120, '特殊能力格 +1（3 → 4 格）', { slot: 1 }],
    [140, '陣營共鳴效果 ×1.5', { resoX: 1 }], [160, '稱號「神諭者」：攻擊、防禦、生命 +5%', { atkP: 5, defP: 5, hpP: 5 }]];
  /* ---------- 修練（共用技能點） ---------- */
  const T = (id, cat, n, d1, d5, per, lv5, req, na) => ({ id, cat, n, d1, d5, per, lv5, req: req || 0, na: na || 0 });
  const TRAIN = [
    T('dodge', '身法', '閃避強化', '閃避冷卻 −0.1 秒', '閃避後 1 秒無敵', { dodgeSec: 0.1 }, 'dodgeInv60'),
    T('dash', '身法', '衝刺', '衝刺距離 +10%', '衝刺穿過的敵人受擊停頓 0.5 秒', { dashDist: 10 }, 'dashHit'),   // r3.148.0：Lv5 改效果（原本衝刺本來就有傷害）
    T('decoy', '身法', '誘敵分身', '閃避時留下分身吸引敵人，持續 +0.3 秒', '分身消失時爆炸（80% 範圍傷害）', { decoy: 1 }, 'decoyBoom'),
    T('sprint', '身法', '疾走', '移速 +3%', '脫離戰鬥 3 秒後移速再 +20%', { spd: 3 }, 'sprint'),
    T('light', '身法', '身輕', '閃身／瞬步冷卻 −6%', '閃避後 0.5 秒移動速度 +30%', { dodgeCd: 6 }, 'lightRun'),
    T('leap', '身法', '踏跳', '後跳距離 +10%', '後跳落地 1 秒內下一擊 +30%', { backDist: 10 }, 'leapHit'),
    T('body', '基礎', '體魄', '生命 +3%', '生命低於 30% 時受傷 −15%', { hpP: 3 }, 'lowDr'),
    T('power', '基礎', '力量', '攻擊 +2%', '暴擊傷害 +20%', { atkP: 2 }, 'critD20'),
    T('guard', '基礎', '硬氣', '防禦 +3%', '受擊 5% 機率完全格擋', { defP: 3 }, 'block5'),
    T('calm', '基礎', '靜心', '冷卻縮減 +3%', '武技 10% 機率不進冷卻', { cdr: 3 }, 'nocd10'),
    T('qisea', '基礎', '氣海', '氣力獲得 +5%（上限固定 100）', '氣力滿時移速 +10%', { qiP: 5 }, 'qiFullSpd'),
    T('breath', '基礎', '調息', '氣力回復 +5%', '擊殺回復 2 氣力', { qiP: 5 }, 'killQi'),
    T('insight', '基礎', '洞察', '暴擊率 +1%', '暴擊時回復 1 氣力', { crit: 1 }, 'critQi'),
    T('ward', '基礎', '護體', '全抗 +3%', '異常狀態時間 −50%', { res: 3 }, null),
    T('combo', '進階', '連段延伸', '終結技 +5%', '普攻連段多 1 段', { finP: 5 }, null, 40),
    T('counter', '進階', '閃避反擊', '完美閃避自動反擊 100%＋25%', '反擊附帶暈眩 1 秒（頭目 0.5 秒）', {}, null, 40),
    T('burst', '進階', '氣力爆發', '氣力滿時武技 +6%', '氣力滿時施放武技，3 秒內不耗氣力', { qiSk: 6 }, null, 50),
    T('breach', '進階', '破綻追擊', '對暈眩／破綻中的敵人傷害 +6%', '對暈眩／破綻中的敵人必定會心', {}, null, 50),
    T('chain', '進階', '武技連鎖', '技接不同技 +4%', '第 3 個不同武技傷害 ×1.5', { chain: 4 }, 'chain3', 60),
    T('ultup', '進階', '奧義加速', '奧義集氣 +5%（奧義用氣力，無冷卻）', '擊殺頭目時氣力集滿', { ultQi: 5 }, 'bossQi', 70),
    T('potion', '輔助', '自動服藥', '生命低於（10＋2×等級）% 自動用藥', '用藥時無敵 1 秒', { autoPot: 1 }, 'potInv'),
    T('ally', '輔助', '同伴強化', '同伴傷害 +6%', '同伴受到的傷害 −20%', { allyDmg: 6 }, 'allyGuard'),
    T('treasure', '輔助', '尋寶', '寶物發現 +5%', '菁英必掉魔法以上裝備 +1 件', { mf: 5 }, null),
    T('study', '輔助', '精進', '經驗 +2%', '職業點獲得 +20%', { expP: 2 }, 'jxp20'),
    T('fortune', '輔助', '招財', '金幣 +8%', '掉落物（錢、素材、裝備）全畫面自動吸取拾取', { gf: 8 }, 'magnet'),
    T('revive', '輔助', '復甦', '低於 25% 每秒回 1%；每場戰鬥倒下可站起 1 次（生命 20%＋10%）', '站起時 3 秒無敵並震退周圍敵人', { regenLow: 1 }, 'reviveGuard')];
  const TB = {}; TRAIN.forEach(t => TB[t.id] = t);

  /* ---------- 存檔 ---------- */
  function jd() { const r = d(); if (!r.job) r.job = { cur: 'samurai', lv: { samurai: 1 }, xp: { samurai: 0 }, ext: [null, null, null, null], skin: 'samurai', reset: 0 };
    const j = r.job; j.ext = j.ext || [null, null, null, null]; r.train = r.train || {}; return j; }
  const need = L => 10 + 9 * L;
  const jlv = id => (jd().lv[id] || 0);
  const total = () => { const j = jd(); let t = 0; for (const k in j.lv) if (k !== 'leon') t += j.lv[k]; return t; };   // r3.149.0：里歐外觀等級不算進職業總等級
  const learned = (job, a) => jlv(job.id) >= a[0];
  const reqOk = job => { if (!job.req) return true; const [pj, pl, ch] = job.req; return jlv(pj) >= pl && (G.GROW.chapter() >= ch); };

  const GR = G.GROW = { JOBS, JB, TRAIN, TB, F: {}, st: { kamaeT: 0, kamae: false, fukutsuCd: 0, iwatoCd: 0, shieldT: 0, shield: 0, stacks: 0, stackT: 0, rage: 0, berserk: 0, berserkCd: 0,
      wpnT: 0, wpnId: null, dodgeN: 0, chain: [], chainT: 0, toukiT: 0, combatT: 0, regenAcc: 0, as: 0, tsuigeki: null, auraT: 0, slowT: 0 },
    jd, jlv, total, need, chapter: () => 1,
    cur() { return JB[jd().cur] || JOBS[0]; },
    /* 外掛特殊能力：其他職業已學會的「特殊」 */
    extList() { const out = []; for (const j of JOBS) if (j.id !== jd().cur) j.ab.forEach((a, i) => { if (a[1] === '特殊' && learned(j, a)) out.push(j.id + ':' + i); }); return out; },
    extSlots() { return 3 + (total() >= 120 ? 1 : 0); },
    abOf(key) { const [jid, i] = key.split(':'); return [JB[jid], JB[jid].ab[+i]]; },
    /* 收集目前生效的效果（recalc 時 1 次） */
    effects() { const j = jd(), cj = GR.cur(), E = [], lo = !!(G.LEON && G.LEON.on && G.LEON.on());   // r3.150.0：轉職為里歐時，原職業的特性／特殊／外掛不生效（基本能力照常）
      if (!lo) E.push(cj.trait[2]);
      for (const job of JOBS) for (const a of job.ab) if (a[1] === '基本' && learned(job, a)) E.push(a[4]);
      if (!lo) for (const a of cj.ab) if (a[1] !== '基本' && learned(cj, a)) E.push(a[4]);
      const fac = []; for (let i = 0; i < (lo ? 0 : GR.extSlots()); i++) { const k = j.ext[i]; if (!k || !GR.extList().includes(k)) continue; const [jb, a] = GR.abOf(k); E.push(a[4]); fac.push(jb.fac); }
      if (fac.length >= 3) { const x = total() >= 140 ? 1.5 : 1; const nonN = fac.filter(f => f !== '中');
        if (nonN.length && nonN.every(f => f === '光')) E.push({ dr: 8 * x, _reso: '光' }); else if (nonN.length && nonN.every(f => f === '闇')) E.push({ dmgP: 8 * x, _reso: '闇' }); }
      for (const t of TOTAL) if (total() >= t[0]) E.push(t[2]);
      for (const t of TRAIN) { const lv = d().train[t.id] || 0; if (!lv || t.na) continue; const o = {}; for (const k in t.per) o[k] = t.per[k] * (GR.tEff ? GR.tEff(lv) : lv); if (lv >= 5 && t.lv5) o.rt = t.lv5; E.push(o); }
      return E; },
    apply(s) { const A = {}, F = {}; for (const e of GR.effects()) for (const k in e) { if (k === 'rt') { if (!e.na) F[e.rt] = true; } else if (typeof e[k] === 'number') A[k] = (A[k] || 0) + e[k]; else if (k === '_reso') F.reso = e[k]; }
      if (A.ultQi) A.qiP = (A.qiP || 0) + A.ultQi;   // r3.148.0：奧義加速每級「氣」+5%（原本沒有作用）
      s._atkP = (s._atkP || 0) + (A.atkP || 0); s.def *= 1 + (A.defP || 0) / 100; s.hp *= 1 + (A.hpP || 0) / 100;
      s.crit += A.crit || 0; s.critD += (A.critD || 0) + (F.critD20 ? 20 : 0); s.spd += A.spd || 0; s.cdr += A.cdr || 0; s.ls += A.ls || 0; s.mf += A.mf || 0; s.gf += A.gf || 0;
      s.aspd = (s.aspd || 0) + (A.aspd || 0); s.dr = Math.min(50, A.dr || 0); s.res = (s.res || 0) + (A.res || 0);
      GR.A = A; GR.F = F; return s; },
    /* ---------- 傷害倍率（造成） ---------- */
    dmgMul(e) { const F = GR.F, A = GR.A || {}, st = GR.st, a = H.act; let m = (A.dmgP || 0) / 100;   // r3.94.0：全部改相加（增傷區），招式倍率 a.gm 另計
      if (F.kamae && st.kamae) { m += 0.4; st.kamae = false; }
      if (F.ichii && st.wpnT >= 1800) m += 0.2;
      if (F.katsuketsu) m += 0.04 * Math.floor((1 - H.hp / H.hpMax) * 10);
      if (F.rage) m += 0.02 * st.rage;
      if (st.berserk > 0) m += 0.3;
      if (F.touki && st.toukiT > 0) m += 0.1;
      if (a && a.kind === 'atk') { const wp = G.WPN.cur(); if (H.combo === wp.combo.length - 1) m += (A.finP || 0) / 100; if (F.kensei) m += Math.min(0.4, 0.04 * (H.combo + 1)); }
      if (F.sunaura && e && Math.abs(e.x - H.x) < G.HERO_H * 2) m += 0.1;
      return 1 + m; },
    onHit(e, crit, big) { const F = GR.F, st = GR.st, rd = d(); st.combatT = 0;
      if (F.shuradou) { st.stacks = Math.min(15, st.stacks + 1); st.stackT = 180; }
      if (crit && F.michikake) rd.qi = Math.min(100, rd.qi + 2);
      if (crit && F.critQi) rd.qi = Math.min(100, rd.qi + 1);
      if (GR.A && GR.A.qiP) rd.qi = Math.min(100, rd.qi + (big ? 5 : 3) * GR.A.qiP / 100);
      if (crit && F.kimen && !GR._splash) { GR._splash = true; for (const o of G.E) if (o !== e && o.st !== 'dead' && Math.hypot(o.x - e.x, (o.y - e.y) * 1.6) < G.HERO_H * 1.2) G.damageOni(o, 0.5, false); GR._splash = false; }
      const a = H.act, wp = G.WPN.cur();
      if (F.tsuigeki && a && a.kind === 'atk' && H.combo === wp.combo.length - 1 && st.tsuigeki !== a) { st.tsuigeki = a; st.followE = e; st.followT = 10; } },
    lsMul() { return GR.F.rasetsuten && H.hp < H.hpMax * 0.3 ? 3 : 1; },
    /* ---------- 受傷 ---------- */
    taken(d0, e) { const F = GR.F, st = GR.st, S2 = R().S; let m = 1 - (S2.dr || 0) / 100;
      if (F.lowDr && H.hp < H.hpMax * 0.3) m *= 0.85;
      if (st.berserk > 0) m *= 1.15;
      if (F.sunaura) m *= 0.9;
      if (F.block5 && Math.random() < 0.05) { G.UI.toast('完全格擋'); return 0; }
      let dmg = Math.max(1, Math.round(d0 * m));
      if (st.shield > 0) { const ab = Math.min(st.shield, dmg); st.shield -= ab; dmg -= ab; }
      return dmg; },
    onHurt() { const F = GR.F, st = GR.st; st.combatT = 0;
      if (F.rage) { st.rage = Math.min(10, st.rage + 1); if (F.berserk && st.rage >= 10 && st.berserkCd <= 0) { st.berserk = 480; st.berserkCd = 2700; G.UI.toast('明王降臨：狂暴 8 秒'); } }
      if (H.hp <= 0) {
        if (F.iwato && st.iwatoCd <= 0) { H.hp = Math.round(H.hpMax * 0.3); H.inv = 120; st.iwatoCd = 7200; G.UI.toast('天岩戶：無敵 2 秒並回復 30%'); }
        else if (F.fukutsu && st.fukutsuCd <= 0) { H.hp = 1; st.fukutsuCd = 5400; H.inv = 40; G.UI.toast('不屈：保留 1 點生命'); } } },
    armor() { const F = GR.F, a = H.act; if (!a) return false;
      if (F.ryusui && a.kind === 'atk') return true;
      if ((F.ashura || F.fudou) && (a.kind === 'skill' || a.kind === 'ult')) return true; return false; },
    onGuard(e) { const F = GR.F; if (F.kaeshi) G.damageOni(e, 1.5, true); if (F.shinkyo) G.damageOni(e, Math.max(0.3, e.atk * 0.3 / Math.max(1, R().S.atk)), false); },
    dodgeMul() { const A = GR.A || {}; return (1 - (A.dodgeCd || 0) / 100); },
    dodgeSub() { return Math.round(((GR.A || {}).dodgeSec || 0) * 60); },
    distMul(kind) { const A = GR.A || {}; return kind === 'dodge' ? 1 + (A.dodgeDist || 0) / 100 : kind === 'dash' ? 1 + (A.dashDist || 0) / 100 : 1; },
    onDodge() { const F = GR.F, st = GR.st, A = GR.A || {};
      if (A.dodgeInv) H.inv = Math.max(H.inv, 12 + A.dodgeInv);
      if (F.dodgeInv60) H.inv = Math.max(H.inv, 60);
      if (F.tsukihokage) G.BUFF.add('aspd', 20, 90);
      if (F.oboro) { st.oboroX = H.x; st.oboroT = 120; G.FX.push({ k: 'ghost', u: G.WPN.unit() && G.WPN.unit().key, fr: G.heroFrame(), x: H.x, y: H.y, s: SCd(), face: H.face, t: 0, life: 120 }); }
      if (F.mangetsu && ++st.dodgeN % 5 === 0) { for (const e of G.E) if (e.st !== 'dead' && Math.abs(e.x - H.x) < G.HERO_H * 3) { e.db = e.db || {}; e.db.slow = 1; e.db.slowT = 180; }
        for (const k in H.cd) H.cd[k] = Math.max(0, H.cd[k] - 120); G.UI.toast('滿月：敵人緩速、冷卻 −2 秒'); } },
    /* 招式（組合技）冷卻倍率 */
    mvCdMul() { const F = GR.F, A = GR.A || {}; let m = 1 - (A.mvCdr || 0) / 100; if (F.ichii && GR.st.wpnT >= 1800) m *= 0.8; return m; },
    /* 招式等級：跟目前職業等級 1/5/10/15/20 → Lv1–5；30 級 180% */
    mvLv() { const L = jlv(jd().cur); return L >= 20 ? 5 : L >= 15 ? 4 : L >= 10 ? 3 : L >= 5 ? 2 : 1; },
    mvMul() { const L = jlv(jd().cur); return L >= 30 ? 1.8 : [1, 1.15, 1.3, 1.45, 1.6][GR.mvLv() - 1]; },
    onSkill(a, s, key) { const F = GR.F, A = GR.A || {}, st = GR.st, rd = d(); let gm = 1;
      if (A.qiSk && rd.qi >= 100 && s.t !== '奧義') gm *= 1 + A.qiSk / 100;
      if (A.chain && s.t !== '奧義') { if (st.chainT <= 0) st.chain = []; if (st.chain[st.chain.length - 1] !== s.id) { st.chain.push(s.id); if (st.chain.length > 1) gm *= 1 + A.chain / 100; if (F.chain3 && new Set(st.chain.slice(-3)).size === 3 && st.chain.length >= 3) gm *= 1.5; } st.chainT = 180; }
      if (F.rageHit && st.rage >= 10) { gm *= 1.6; st.rage = 0; G.UI.toast('憤怒一擊 +60%'); }
      if (F.nocd10 && s.t !== '奧義' && Math.random() < 0.1) { H.cd[s.id] = 0; G.UI.toast('靜心：不進冷卻'); }
      a.gm = gm; },
    /* ---------- 擊殺／經驗 ---------- */
    onKill(e) { const F = GR.F, st = GR.st, rd = d(), A = GR.A || {};
      const base = e.boss ? 30 : e.elite ? 5 : 1; GR.gainJxp(base * (1 + ((A.jxpP || 0) + (F.jxp20 ? 20 : 0)) / 100));
      if (F.killQi) rd.qi = Math.min(100, rd.qi + 2);
      if (F.musha && (e.elite || e.boss)) rd.qi = Math.min(100, rd.qi + 50);
      if (F.mikou) H.hp = Math.min(H.hpMax, H.hp + H.hpMax * 0.02);
      if (F.konshoku) H.hp = Math.min(H.hpMax, H.hp + H.hpMax * 0.05);
      if (F.touki) st.toukiT = 180;
      if (F.bossQi && e.boss) rd.qi = 100; },
    gainJxp(n) { const j = jd(), id = j.cur, job = JB[id]; j.xp[id] = (j.xp[id] || 0) + n; j.lv[id] = j.lv[id] || 1; let up = false;
      while (j.lv[id] < job.max && j.xp[id] >= need(j.lv[id])) { j.xp[id] -= need(j.lv[id]); j.lv[id]++; up = true; }
      if (j.lv[id] >= job.max) j.xp[id] = 0;
      if (up) { const L = j.lv[id], a = job.ab.find(x => x[0] === L); G.UI.banner(job.n + '　職業 Lv ' + L, a ? '習得【' + a[2] + '】' + a[3] : '招式等級 Lv ' + GR.mvLv()); R().recalc(); }
      G.SAVE.markDirty(); },
    /* ---------- 每格 ---------- */
    step() { const F = GR.F, st = GR.st, A = GR.A || {}, rd = d();
      if (G.mode !== 'play' || G.MENU.open) return;
      st.combatT++; if (st.fukutsuCd > 0) st.fukutsuCd--; if (st.iwatoCd > 0) st.iwatoCd--; if (st.berserk > 0) st.berserk--; if (st.berserkCd > 0) st.berserkCd--; if (st.toukiT > 0) st.toukiT--; if (st.chainT > 0) st.chainT--;
      if (st.stackT > 0 && --st.stackT <= 0) st.stacks = 0;
      const wid = G.WPN.curId(); if (wid !== st.wpnId) { st.wpnId = wid; st.wpnT = 0; } else st.wpnT++;
      if (F.kamae) { if (H.st === 'idle' && !H.act) { if (++st.kamaeT >= 60) st.kamae = true; } else st.kamaeT = 0; }
      if (A.regen) { st.regenAcc += H.hpMax * A.regen / 100 / 60; if (st.regenAcc >= 1) { const v = Math.floor(st.regenAcc); st.regenAcc -= v; H.hp = Math.min(H.hpMax, H.hp + v); } }
      if (F.shield && ++st.shieldT >= 900) { st.shieldT = 0; st.shield = Math.round(H.hpMax * 0.15); G.FX.push({ k: 'lvup', x: H.x, y: H.y, t: 0, life: 30 }); }
      if (st.followT > 0 && --st.followT === 0 && st.followE && st.followE.st !== 'dead') G.damageOni(st.followE, 0.8, false);
      if (st.oboroT > 0) { st.oboroT--; for (const e of G.E) if (e.st === 'walk' && Math.abs(e.x - st.oboroX) < G.HERO_H * 3) e.face = Math.sign(st.oboroX - e.x) || e.face; }
      if (F.fireaura && ++st.auraT >= 60) { st.auraT = 0; for (const e of G.E) if (e.st !== 'dead' && e.st !== 'hurt' && Math.abs(e.x - H.x) < G.HERO_H * 1.6 && Math.abs(e.y - H.y) < 30) { G.damageOni(e, 1.0, false); if (st.berserk > 0) { e.db = e.db || {}; e.db.def = Math.max(e.db.def || 0, 20); } } }
      /* 攻速：普攻動作多走一格（事件用 >= 判定，不會漏） */
      const as = Math.min(50, (R().S.aspd || 0) + G.BUFF.get('aspd') + st.stacks + (st.berserk > 0 ? 20 : 0));
      if (H.act && H.act.kind === 'atk') { const lo = G.LEON && G.LEON.on && G.LEON.on(), rk = lo ? 1.15 : (G.WPN.RHY && G.WPN.RHY[G.WPN.curId()]) || 1;   // r3.140.0：武器普攻節奏；r3.149.0：里歐普攻加快 ×1.15（約 15 幀一下，打刀約 19）
        if (!H.act._rk) { H.act._rk = 1; const ck = lo ? 0.7 : rk; if (ck < 1) H.act.mult = (H.act.mult || 1) / ck;   /* 里歐每下傷害與打刀相同（×1.43） */ const cb = G.WPN.CMB && G.WPN.CMB[G.WPN.curId()]; if (cb && cb[H.combo]) H.act.mult *= cb[H.combo]; }   // r3.142.0：連段加成 if (H.act.mvx && H.act.mvx.norm && !H.act.mvx._rk) { H.act.mvx._rk = 1; H.act.mvx.mul = H.act.mult || 1; }   // 85_normal 普攻用 mvx.mul（不論先後都對齊 act.mult）   // 變慢的武器補傷害（每秒輸出不變）
        st.as += rk * (1 + as / 100) - 1; if (st.as >= 1) { st.as -= 1; H.t++; } else if (st.as <= -1) { st.as += 1; if (H.t > 1) H.t--; } } else st.as = 0;
      if (F.magnet) for (const l of G.LOOT) if (l.t >= 24) { l.x += (H.x - l.x) * 0.08; l.y += (H.y - l.y) * 0.08; } },
    spdBonus() { const F = GR.F, st = GR.st; let v = 0; if (F.sprint && st.combatT > 180) v += 20; if (F.qiFullSpd && d().qi >= 100) v += 10; if (F.touki && st.toukiT > 0) v += 20; return v; },
    /* ---------- 轉職／外觀 ---------- */
    canChange() { return G.SC.id === 'hub_shrine' || (G.CHEAT && G.CHEAT.on.free); },
    change(id) { const j = jd(), job = JB[id]; if (!job || !reqOk(job)) return false; j.cur = id; j.lv[id] = j.lv[id] || 1; j.xp[id] = j.xp[id] || 0; j.ext = j.ext.map(k => k && k.split(':')[0] === id ? null : k);
      R().recalc(); GR.portrait(); G.SAVE.markDirty(); G.UI.toast('轉職為「' + job.n + '」'); return true; },
    reqOk, reqText(job) { if (!job.req) return '初始'; const [pj, pl, ch] = job.req; return JB[pj].n + ' Lv' + pl + (ch > 1 ? '＋第 ' + ch + ' 章' : ''); },
    skins: null, skinKey() { const j = jd(); return j.skin && j.skin !== 'samurai' ? j.skin + '_' + G.WPN.curId() : null; },
    skinUnit() { const k = GR.skinKey(); if (!k || !GR.skins || !GR.skins[k]) return null; const u = G.ANIM.get('j_' + k); if (u) return u;
      if (!GR._sl) { GR._sl = k; G.ANIM.load('j_' + k, GR.skins[k]).catch(() => {}).then(() => { GR._sl = null; }); } return null; },
    setSkin(id) { const j = jd(); const prev = j.skin; j.skin = id; G.SAVE.markDirty();
      if (prev && prev !== id && prev !== 'samurai') for (const w of G.WPN.LIST) G.ANIM.free('j_' + prev + '_' + w.id);
      if (id !== 'samurai' && !GR.skins) fetch('a/p/skins.json?v=' + G.VER).then(r => r.json()).then(x => { GR.skins = x; }).catch(() => {}); GR.portrait(); },
    pt: {}, portrait() { const id = jd().skin || 'samurai'; if (!G.IMG.face_soma0) G.IMG.face_soma0 = G.IMG.face_soma;
      if (id === 'samurai') { G.IMG.face_soma = G.IMG.face_soma0; return; }
      const done = im => { const c = document.createElement('canvas'); c.width = c.height = 128; c.getContext('2d').drawImage(im, 0, 0, 128, 128, 0, 0, 128, 128); GR.pt[id] = c; if ((jd().skin || 'samurai') === id) G.IMG.face_soma = c; };
      if (GR.pt[id]) { G.IMG.face_soma = GR.pt[id]; return; } const im = new Image(); im.onload = () => done(im); im.src = 'a/p/pt_' + id + '.webp?v=' + G.VER; },
    /* ---------- 修練 ---------- */
    tLv: id => d().train[id] || 0,
    tLearn(id) { const t = TB[id], r = d(), lv = GR.tLv(id); if (lv >= 5) return; if (r.lv < t.req) { G.UI.toast('需要角色 Lv' + t.req); return; }
      if (r.sp < 1 && !(G.CHEAT && G.CHEAT.on.free)) { G.UI.toast('技能點不足'); return; } if (!(G.CHEAT && G.CHEAT.on.free)) r.sp--; r.train[id] = lv + 1; R().recalc(); G.SAVE.markDirty(); },
    tResetCost() { return jd().reset ? d().lv * 200 : 0; },
    tReset() { const r = d(), c = GR.tResetCost(); if (r.gold < c) { G.UI.toast('錢不足（' + c + '）'); return; } let n = 0; for (const k in r.train) n += r.train[k]; if (!n) return;
      r.gold -= c; r.sp += n; r.train = {}; jd().reset = (jd().reset || 0) + 1; R().recalc(); G.SAVE.markDirty(); G.UI.toast('修練已重置，退回 ' + n + ' 點' + (c ? '（花費 ' + c + '）' : '（首次免費）')); }
  };
  const SCd = () => G.SC.depth(H.y);

  /* ---------- 包裝既有函式（不改原檔邏輯） ---------- */
  const dmg0 = G.damageOni;
  G.damageOni = function (e, mult, big, forceCrit, opt) { if (!e || e.st === 'dead') return; const n0 = G.NUMS.length, ls0 = R().S.ls, lm = GR.lsMul();
    if (lm > 1) R().S.ls = ls0 * lm; const pr = opt && (opt.party || opt.rune); if (!pr) G.DZ.add(GR.dmgMul(e) - 1); dmg0(e, mult * (!pr && H.act && H.act.gm ? H.act.gm : 1), big, forceCrit, opt); if (lm > 1) R().S.ls = ls0;
    const num = G.NUMS.length > n0 ? G.NUMS[G.NUMS.length - 1] : null; GR.onHit(e, num && num.crit, big); G.AU.sfx(num && num.crit ? 'crit' : big ? 'heavy' : 'hit'); };
  const kill0 = G.RPG.onKill; G.RPG.onKill = function (e) { kill0(e); GR.onKill(e); };
  const exp0 = G.RPG.gainExp; G.RPG.gainExp = function (n) { exp0(Math.round(n * (1 + ((GR.A && GR.A.expP) || 0) / 100))); };
  const prof0 = G.WPN.gainProf; G.WPN.gainProf = function (n, id) { return prof0.call(G.WPN, Math.round(n * (1 + ((GR.A && GR.A.profP) || 0) / 100)), id); };
  const hs0 = G.heroStep; G.heroStep = function () { hs0(); GR.step(); AU.tick(); };
  G.WPN.mvLv = () => GR.mvLv();
  const enter0 = G.SC.enter; G.SC.enter = function (id, at) { const ok = enter0.call(this, id, at); if (ok) { const s = S(); s.seen = s.seen || {}; s.seen[id] = 1; G.AU.scene(id); } return ok; };

  /* ---------- 音訊 ---------- */
  const TRK = { title: 'bgm_title', village: 'bgm_village', shrine: 'bgm_shrine', field: 'bgm_field', battle: 'bgm_battle', boss: 'bgm_boss' };
  const VOL = [0, 0.25, 0.5, 0.8];
  const AU = G.AU = { el: {}, cur: null, ac: null, unlocked: false, last: {},
    vol() { const s = S(); return VOL[s && s.bgm !== undefined ? s.bgm : 2]; },
    sfxOn() { const s = S(); return !s || s.sfx === undefined || s.sfx; },
    unlock() { if (AU.unlocked) return; AU.unlocked = true; try { AU.ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { AU.ac = null; } if (AU.want) AU.play(AU.want, true); },
    play(k, force) { AU.want = k; if (!AU.unlocked) return; if (AU.cur === k && !force) return; const v = AU.vol();
      for (const n in AU.el) if (n !== k) AU.fade(AU.el[n], 0, true);
      if (!v) { AU.cur = k; return; }
      let a = AU.el[k]; if (!a) { a = AU.el[k] = new Audio('a/au/' + TRK[k] + '.mp3?v=' + G.VER); a.loop = true; a.preload = 'auto'; a.volume = 0; }
      AU.cur = k; const p = a.play(); if (p && p.catch) p.catch(() => {}); AU.fade(a, v, false); },
    fade(a, to, stop) { clearInterval(a._f); a._f = setInterval(() => { const dv = to - a.volume; if (Math.abs(dv) < 0.03) { a.volume = to; clearInterval(a._f); if (stop && to === 0) a.pause(); } else a.volume = Math.max(0, Math.min(1, a.volume + Math.sign(dv) * 0.03)); }, 40); },
    setVol() { const v = AU.vol(); if (!v) { for (const n in AU.el) AU.fade(AU.el[n], 0, true); } else if (AU.want) AU.play(AU.want, true); },
    scene(id) { const def = G.D.scenes[id] || {}; AU.play(id === 'hub_shrine' ? 'shrine' : def.foes ? 'field' : 'village'); },
    /* 戰鬥中（有敵人）切戰鬥曲，有頭目切頭目曲；每 30 格檢查一次 */
    tick() { if (G.mode === 'title') { AU.play('title'); return; } if (G.mode !== 'play' || (G.t % 30)) return; const sc = G.SC.id; if (!sc) return;
      let boss = false, n = 0; for (const e of G.E) if (e.st !== 'dead') { n++; if (e.boss || e.type === 'akaoni') boss = true; }
      const def = G.D.scenes[sc] || {}; const base = sc === 'hub_shrine' ? 'shrine' : def.foes ? 'field' : 'village';
      AU.play(boss ? 'boss' : n ? 'battle' : base); },
    /* 音效：WebAudio 合成（短、無檔案）；同種 50ms 內不重複，避免多段命中爆音 */
    sfx(k) { const ac = AU.ac; if (!ac || !AU.sfxOn()) return; const t = ac.currentTime; if (AU.last[k] && t - AU.last[k] < 0.05) return; AU.last[k] = t;
      const g = ac.createGain(); g.connect(ac.destination);
      const noise = (dur, f, q, vol) => { const n = Math.floor(ac.sampleRate * dur), b = ac.createBuffer(1, n, ac.sampleRate), c = b.getChannelData(0); for (let i = 0; i < n; i++) c[i] = (Math.random() * 2 - 1) * (1 - i / n);
        const s = ac.createBufferSource(); s.buffer = b; const bf = ac.createBiquadFilter(); bf.type = 'bandpass'; bf.frequency.value = f; bf.Q.value = q; s.connect(bf); bf.connect(g); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur); s.start(t); };
      const tone = (f0, f1, dur, vol, type) => { const o = ac.createOscillator(); o.type = type || 'sine'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur); o.connect(g); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur); o.start(t); o.stop(t + dur); };
      if (k === 'swing') noise(0.12, 2400, 1.2, 0.18);
      else if (k === 'hit') { noise(0.08, 900, 0.8, 0.3); tone(180, 70, 0.08, 0.25); }
      else if (k === 'heavy') { noise(0.16, 500, 0.7, 0.4); tone(120, 40, 0.18, 0.4); }
      else if (k === 'crit') { noise(0.1, 1600, 1, 0.35); tone(900, 300, 0.12, 0.18, 'triangle'); }
      else if (k === 'hurt') { tone(220, 90, 0.18, 0.3, 'sawtooth'); }
      else if (k === 'shot') { noise(0.18, 300, 0.5, 0.5); tone(90, 40, 0.15, 0.3); }
      else if (k === 'bow') { tone(500, 180, 0.12, 0.2, 'triangle'); }
      else if (k === 'ui') tone(880, 660, 0.06, 0.12, 'triangle'); }
  };
  ['pointerdown', 'keydown', 'touchstart'].forEach(ev => window.addEventListener(ev, () => AU.unlock(), { once: false, passive: true }));

  /* ---------- 選單分頁 ---------- */
  const fs = () => G.FS(), ui = () => M.ui;
  const idx = M.TABS.indexOf('設定'); M.TABS.splice(idx < 0 ? M.TABS.length : idx, 0, '職業', '修練');   // r3.166.0：拿掉「地圖」分頁（統一用行旅繪圖）
  M.PAGE['職業'] = function (x, y, w, h) {
    const { box, button, scrollArea, clip, hit } = ui(), j = jd(), cj = GR.cur(), lw = Math.min(280, w * 0.44), RH = 38 * fs();
    box(x, y, lw, h); G.txt('職業總等級 ' + total() + '／160', x + 12, y + 16, 11, C.gold, 'left', G.FONT, 700);
    const selId = M.sel.job || j.cur;
    const offL = scrollArea('jobL', x, y + 28, lw, h - 32, JOBS.length * RH + 8); clip(x, y + 28, lw, h - 32);   // r3.19.1：職業清單可捲動
    JOBS.forEach((job, i) => { const yy = y + 30 + i * RH + offL; if (yy > y + h || yy + RH < y + 28) return; const ok = reqOk(job), on = job.id === selId; ctx.fillStyle = on ? 'rgba(120,80,30,.45)' : 'rgba(255,255,255,.03)'; ctx.fillRect(x + 6, yy + 2, lw - 12, RH - 4);
      /* r3.203.0：未解鎖的字改亮一點（原本太暗看不清），右邊加狀態：目前／可轉職／未解鎖 */
      G.txt(job.n, x + 14, yy + RH * 0.36, 13, ok ? C.ink : '#a89c88', 'left', G.FONT_S, 900);
      G.txt(ok ? job.fac + '系・Lv ' + (jlv(job.id) || 0) + '／' + job.max : '解鎖：' + GR.reqText(job), x + 14, yy + RH * 0.72, 10, ok ? C.sub : '#8f8576', 'left', G.FONT, 500);
      G.txt(job.id === j.cur ? '目前' : ok ? ((jlv(job.id) || 0) >= job.max ? '已滿級' : '可轉職') : '未解鎖', x + lw - 14, yy + RH * 0.36, 10, job.id === j.cur ? '#f3d98a' : ok ? '#86cf8f' : '#8f8576', 'right', G.FONT, 700);
      hit(x + 6, Math.max(yy + 2, y + 28), lw - 12, RH - 4, () => { M.sel.job = job.id; }); }); ctx.restore();
    /* r3.203.0：右側改版——上方固定：職業名、等級條、轉職／外觀按鈕、特性卡；下方分兩頁「能力」「外掛能力」（目前職業才有），不用捲到最底才找得到外掛。
     * 能力＝一列一項：等級牌（達成＝金底）＋類型色標＋名稱＋效果（太長自動換行）；外掛＝上排格子、下排可掛的能力清單，點格子再點能力就換好。 */
    const job = JB[selId], cx = x + lw + 10, cw = w - lw - 10; box(cx, y, cw, h);
    const ok = reqOk(job), L = jlv(job.id) || 0, isCur = job.id === j.cur, ext = isCur ? GR.extSlots() : 0, xp = j.xp[job.id] || 0, TYC = { 基本: '#86cf8f', 特殊: '#6fb0f0', 極意: '#f0ad52', 覺醒: '#c095f0' };
    const chip = (t, bx, my, col, fill) => { ctx.font = `800 ${10 * fs()}px ${G.FONT}`; const tw = ctx.measureText(t).width + 12, bh = 16 * fs(); ctx.fillStyle = fill ? col : 'rgba(0,0,0,.35)'; G.rr(bx, my - bh / 2, tw, bh, 4); ctx.fill(); if (!fill) { ctx.strokeStyle = col; ctx.lineWidth = 1; G.rr(bx + .5, my - bh / 2 + .5, tw - 1, bh - 1, 4); ctx.stroke(); } G.txt(t, bx + tw / 2, my + 1, 10, fill ? '#1c1410' : col, 'center', G.FONT, 800); return tw; };
    const bw = Math.round(92 * Math.max(1, fs())), bxR = cx + cw - bw - 12; let yy = y + 20;
    G.txt(job.n, cx + 14, yy, 17, C.gold, 'left', G.FONT_S, 900); ctx.font = `900 ${17 * fs()}px ${G.FONT_S}`; const nw = ctx.measureText(job.n).width; let hx = cx + 22 + nw; hx += chip(job.fac + '系', hx, yy, '#e3c27a') + 6; if (isCur) { hx += chip('目前職業', hx, yy, '#f3d98a', 1) + 6; if (hx + 70 * fs() < bxR) chip('招式 Lv ' + GR.mvLv(), hx, yy, '#b9ad98'); }
    yy += 24; G.txt('Lv ' + L + '／' + job.max, cx + 14, yy, 12, C.ink, 'left', G.FONT, 700);
    if (L && L < job.max) { const bx = cx + 14 + 74 * fs(), bwid = Math.max(60, Math.min(170, bxR - bx - 110 * fs())); ctx.fillStyle = 'rgba(255,255,255,.1)'; G.rr(bx, yy - 3, bwid, 6, 3); ctx.fill(); ctx.fillStyle = C.gold; G.rr(bx, yy - 3, Math.max(4, bwid * Math.min(1, xp / need(L))), 6, 3); ctx.fill(); G.txt(Math.floor(xp) + '／' + need(L), bx + bwid + 8, yy, 10, C.sub, 'left', G.FONT, 600); }
    if (!isCur) button(bxR, y + 8, bw, 28, ok ? (GR.canChange() ? '轉職' : '需在神社') : '未解鎖', ok && GR.canChange() ? () => GR.change(job.id) : null, ok && GR.canChange() ? 'main' : 'off');
    const skinOn = (j.skin || 'samurai') === job.id; button(bxR, y + (isCur ? 8 : 40), bw, 26, skinOn ? '外觀使用中' : '換此外觀', ok && L ? () => GR.setSkin(job.id) : null, skinOn ? 'main' : ok && L ? '' : 'off');
    yy = y + (isCur ? 62 : 74); ctx.font = `600 ${11 * fs()}px ${G.FONT}`; { const tl = G.wrap(job.trait[1] + '（只在此職業生效）', cw - 44), th = 24 * fs() + tl.length * 16 * fs();
      ctx.fillStyle = 'rgba(150,92,36,.2)'; G.rr(cx + 10, yy, cw - 20, th, 6); ctx.fill(); ctx.fillStyle = '#e3c27a'; ctx.fillRect(cx + 10, yy + 4, 3, th - 8);
      const tw = chip('特性', cx + 22, yy + 13 * fs(), '#f3d98a', 1); G.txt(job.trait[0], cx + 28 + tw, yy + 13 * fs() + 1, 12, '#fff3d6', 'left', G.FONT_S, 900); tl.forEach((l, k) => G.txt(l, cx + 22, yy + 24 * fs() + 8 * fs() + k * 16 * fs(), 11, C.ink, 'left', G.FONT, 600)); yy += th + 8; }
    let jt = isCur ? (M.sel.jtab || 0) : 0; if (isCur) { const used = (j.ext || []).slice(0, ext).filter(k => k && GR.extList().includes(k)).length;
      [['能力', 0], ['外掛能力 ' + used + '／' + ext, 1]].forEach(([t, k], q) => button(cx + 10 + q * (Math.round(118 * Math.max(1, fs())) + 4), yy, Math.round(118 * Math.max(1, fs())), 26, t, () => { M.sel.jtab = k; M.scroll.job = 0; }, jt === k ? 'main' : '')); yy += 34; }
    const top = yy, vh = y + h - top - 4;
    if (jt === 0) { ctx.font = `500 ${11 * fs()}px ${G.FONT}`; const tx = cx + 104 * fs() + 14, tw2 = cx + cw - 16 - tx, nmW = a => { ctx.font = `900 ${12 * fs()}px ${G.FONT_S}`; return ctx.measureText(a[2] + (L >= a[0] ? '' : '　未習得')).width + 12; }, rowsH = job.ab.map(a => { const nw2 = nmW(a); ctx.font = `500 ${11 * fs()}px ${G.FONT}`; return ctx.measureText(a[3]).width <= tw2 - nw2 ? 0 : Math.max(1, G.wrap(a[3], tw2).length); }), RH2 = n => (n ? 22 * fs() + n * 15 * fs() : 24 * fs()) + 6;   /* 效果放得下就跟名稱同一行（一頁看得到更多列） */
      const total2 = rowsH.reduce((q, n) => q + RH2(n), 0) + 30 * fs(), off = scrollArea('job', cx, top, cw, vh, total2); clip(cx, top, cw, vh); let ry = top + off;
      job.ab.forEach((a, k) => { const rh = RH2(rowsH[k]), lr = L >= a[0], na = a[4].na, col = TYC[a[1]] || '#e3c27a'; if (ry + rh > top - 4 && ry < y + h) { ctx.fillStyle = lr ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.02)'; G.rr(cx + 10, ry, cw - 20, rh - 4, 6); ctx.fill();
          const pw = 42 * fs(), ph = 18 * fs(), my = ry + (rowsH[k] ? 13 * fs() : (rh - 4) / 2); ctx.fillStyle = lr ? '#e3c27a' : 'rgba(0,0,0,.4)'; G.rr(cx + 16, my - ph / 2, pw, ph, 4); ctx.fill(); if (!lr) { ctx.strokeStyle = 'rgba(227,194,122,.35)'; ctx.lineWidth = 1; G.rr(cx + 16.5, my - ph / 2 + .5, pw - 1, ph - 1, 4); ctx.stroke(); } G.txt('Lv ' + a[0], cx + 16 + pw / 2, my + 1, 11, lr ? '#1c1410' : C.sub, 'center', G.FONT, 800);
          ctx.globalAlpha = lr ? 1 : 0.6; chip(a[1], cx + 22 + pw, my, col, lr); ctx.globalAlpha = 1;
          G.txt(a[2] + (lr ? '' : '　未習得'), tx, my + 1, 12, lr && !na ? '#fff3d6' : C.sub, 'left', G.FONT_S, 900);
          if (!rowsH[k]) G.txt(a[3], tx + nmW(a), my + 1, 11, lr && !na ? C.ink : C.dim, 'left', G.FONT, 500); else { ctx.font = `500 ${11 * fs()}px ${G.FONT}`; G.wrap(a[3], tw2).forEach((l, q) => G.txt(l, tx, ry + 22 * fs() + 8 * fs() + q * 15 * fs(), 11, lr && !na ? C.ink : C.dim, 'left', G.FONT, 500)); } } ry += rh; });
      let lx = cx + 14; const ly = ry + 12 * fs(); [['基本', '永久生效，換職也保留'], ['特殊', '本職全開，也能外掛'], ['極意', '本職限定']].forEach(([t, d2]) => { lx += chip(t, lx, ly, TYC[t], 1) + 4; G.txt(d2, lx, ly + 1, 10, C.sub, 'left', G.FONT, 500); ctx.font = `500 ${10 * fs()}px ${G.FONT}`; lx += ctx.measureText(d2).width + 12; });
      ctx.restore(); }
    else { const list = GR.extList(), gapS = 6, sw = (cw - 20 - gapS * (ext - 1)) / ext, sh = 46 * fs(); let si = Math.min(ext - 1, M.sel.jslot || 0); yy = top;
      G.txt('3 格同系觸發共鳴：光＝受傷 −8%／闇＝傷害 +8%' + (GR.F.reso ? '　　共鳴中：' + GR.F.reso : ''), cx + 14, yy + 6, 10, GR.F.reso ? '#f3d98a' : C.sub, 'left', G.FONT, 600); yy += 18;
      for (let q = 0; q < ext; q++) { const k = j.ext[q] && list.includes(j.ext[q]) ? j.ext[q] : null, on = q === si, sx = cx + 10 + q * (sw + gapS), ab = k ? GR.abOf(k) : null;
        ctx.fillStyle = on ? 'rgba(150,92,36,.55)' : 'rgba(255,255,255,.05)'; G.rr(sx, yy, sw, sh, 7); ctx.fill(); ctx.strokeStyle = on ? '#fff3cf' : 'rgba(227,194,122,.35)'; ctx.lineWidth = 1; G.rr(sx + .5, yy + .5, sw - 1, sh - 1, 7); ctx.stroke();
        G.txt('格 ' + (q + 1), sx + 8, yy + sh * 0.26, 10, on ? '#fff3d6' : C.gold, 'left', G.FONT, 700); G.txt(ab ? ab[1][2] : '（空）', sx + 8, yy + sh * 0.68, 13, ab ? '#fff3d6' : C.dim, 'left', G.FONT_S, 900); if (ab) G.txt(ab[0].n + '・' + ab[0].fac, sx + sw - 8, yy + sh * 0.26, 10, C.sub, 'right', G.FONT, 600);
        hit(sx, yy, sw, sh, () => { M.sel.jslot = q; }); }
      yy += sh + 8; const curK = j.ext[si] && list.includes(j.ext[si]) ? j.ext[si] : null; G.txt('選一個能力掛到「格 ' + (si + 1) + '」', cx + 14, yy + 8, 11, C.gold, 'left', G.FONT, 700);
      button(cx + cw - 92, yy - 4, 80, 24, '卸下', curK ? () => { j.ext[si] = null; R().recalc(); G.SAVE.markDirty(); } : null, curK ? '' : 'off'); yy += 26;
      const vh2 = y + h - yy - 4, RH3 = 40 * fs(), off = scrollArea('job', cx, yy, cw, vh2, Math.max(1, list.length) * RH3 + 8); clip(cx, yy, cw, vh2);
      if (!list.length) G.txt('其他職業學會「特殊」能力後，就可以掛在這裡。', cx + 14, yy + 20, 11, C.dim, 'left', G.FONT, 500);
      list.forEach((k, q) => { const ry = yy + q * RH3 + off; if (ry + RH3 < yy || ry > y + h) return; const [jb, a] = GR.abOf(k), at = j.ext.indexOf(k), mine = k === curK, used = at >= 0 && at < ext && !mine;
        ctx.fillStyle = mine ? 'rgba(150,92,36,.45)' : 'rgba(255,255,255,.04)'; G.rr(cx + 10, ry, cw - 20, RH3 - 4, 6); ctx.fill();
        G.txt(a[2], cx + 20, ry + RH3 * 0.3, 12, used ? C.sub : '#fff3d6', 'left', G.FONT_S, 900); ctx.font = `900 ${12 * fs()}px ${G.FONT_S}`; chip(jb.n + '・' + jb.fac + '系', cx + 28 + ctx.measureText(a[2]).width, ry + RH3 * 0.3, '#e3c27a');
        ctx.font = `500 ${10 * fs()}px ${G.FONT}`; G.txt(cut(a[3], cw - 130, 10), cx + 20, ry + RH3 * 0.68, 10, used ? C.dim : C.ink, 'left', G.FONT, 500);
        G.txt(mine ? '已掛在此格' : used ? '已掛在格 ' + (at + 1) : '點一下掛上', cx + cw - 20, ry + RH3 * 0.3, 10, mine ? '#f3d98a' : used ? C.dim : '#86cf8f', 'right', G.FONT, 700);
        if (!used && !mine && ry + RH3 > yy) hit(cx + 10, Math.max(ry, yy), cw - 20, RH3 - 4, () => { j.ext[si] = k; R().recalc(); G.SAVE.markDirty(); }); });
      ctx.restore(); }
  };
  M.OPTS = M.OPTS || {};
  const TCAT = [['基礎', '#e3c27a'], ['進階', '#e0866a'], ['輔助', '#86cf8f'], ['身法', '#6fb0f0']];
  M.OPTS['修練'] = { list: () => TCAT, get: () => M.sel.tcat || 0, set: j => { M.sel.tcat = j; M.scroll.train = 0; } };
  M.OPTS['背包'] = { list: () => [['全部', '#e3c27a'], ['武器', '#e0866a'], ['頭', '#6fb0f0'], ['胴', '#86cf8f'], ['手', '#c095f0'], ['足', '#e0c068'], ['御守', '#7fd6e6']],
    get: () => M.filter + 1, set: j => { M.filter = j - 1; M.scroll.bag = 0; } };
  /* r3.147.0：修練頁改版——左邊兩欄卡片（名稱、等級圓點、每級效果、Lv5 效果），右邊說明＋升級按鈕；鎖住的變暗排後面 */
  const cut = (t, mw, px) => { ctx.font = `500 ${px * fs()}px ${G.FONT}`; if (ctx.measureText(t).width <= mw) return t; let s = t; while (s.length > 1 && ctx.measureText(s + '…').width > mw) s = s.slice(0, -1); return s + '…'; };
  const pips = (x, y, n, mx, r) => { for (let i = 0; i < mx; i++) { ctx.beginPath(); ctx.arc(x + i * (r * 2 + 3) + r, y, r, 0, 6.283); ctx.fillStyle = i < n ? (i >= 5 ? '#f0ad52' : '#f3d98a') : 'rgba(255,255,255,.14)'; ctx.fill(); } };
  M.PAGE['修練'] = function (x, y, w, h) {
    const { box, button, scrollArea, clip, hit } = ui(), r = d(), cat = TCAT[M.sel.tcat || 0][0], mx = GR.tMax ? GR.tMax() : 5;
    const L = TRAIN.filter(q => q.cat === cat).slice().sort((a, b) => (r.lv < a.req) - (r.lv < b.req) || a.req - b.req);
    if (!L.some(t => t.id === M.sel.tal)) M.sel.tal = L[0] && L[0].id; const T = TRAIN.find(t => t.id === M.sel.tal);
    const lw = Math.round(w * 0.62), cw = (lw - 18) / 2, CH = 66 * fs(), rx = x + lw + 10, rw = w - lw - 10;
    box(x, y, lw, h); G.txt('剩餘點數 ' + r.sp + ((r.pk || 0) > 0 ? '　巔峰點數 ' + (r.pp || 0) : ''), x + 14, y + 16, 13, r.sp ? '#8fd38f' : C.sub, 'left', G.FONT_S, 900);
    const c = GR.tResetCost(); button(x + lw - 104, y + 4, 92, 26, '重置' + (c ? ' ' + c + ' 錢' : ''), () => GR.tReset());
    const rows = Math.ceil(L.length / 2), off = scrollArea('train', x, y + 34, lw, h - 38, rows * (CH + 6) + 10); clip(x, y + 34, lw, h - 38);
    L.forEach((t, i) => { const lv = GR.tLv(t.id), lock = r.lv < t.req, dim = lock || t.na, cx = x + 6 + (i % 2) * (cw + 6), cy = y + 38 + Math.floor(i / 2) * (CH + 6) + off, on = t.id === M.sel.tal;
      if (cy > y + h || cy + CH < y + 34) return;
      ctx.fillStyle = on ? 'rgba(120,80,30,.45)' : 'rgba(255,255,255,.04)'; G.rr(cx, cy, cw, CH, 8); ctx.fill(); if (on) { ctx.strokeStyle = 'rgba(243,217,138,.8)'; ctx.lineWidth = 1.2; G.rr(cx + .5, cy + .5, cw - 1, CH - 1, 8); ctx.stroke(); }
      G.txt(t.n, cx + 10, cy + 14 * fs(), 13, dim ? C.dim : C.ink, 'left', G.FONT_S, 900);
      if (lock) G.txt('需 Lv' + t.req, cx + cw - 10, cy + 14 * fs(), 10, C.dim, 'right', G.FONT, 700); else pips(cx + cw - 10 - mx * 9, cy + 14 * fs(), lv, mx, 3);
      G.txt(cut('每級 ' + t.d1, cw - 20, 11), cx + 10, cy + 34 * fs(), 11, dim ? C.dim : C.sub, 'left', G.FONT, 500);
      G.txt(cut('Lv5 ' + t.d5, cw - 20, 11), cx + 10, cy + 52 * fs(), 11, dim ? C.dim : lv >= 5 ? '#f3d98a' : '#b9a57a', 'left', G.FONT, 500);
      const can = !lock && !t.na && lv < mx && (lv >= 5 ? (r.pp || 0) >= 2 : r.sp > 0); if (can) { ctx.fillStyle = '#8fd38f'; ctx.beginPath(); ctx.arc(cx + cw - 6, cy + 6, 3.5, 0, 6.283); ctx.fill(); }   // 可升級小點
      hit(cx, Math.max(cy, y + 34), cw, CH, () => { M.sel.tal = t.id; }); });
    ctx.restore();
    /* 右邊：說明＋升級 */
    box(rx, y, rw, h); if (!T) return; const lv = GR.tLv(T.id), lock = r.lv < T.req, pk = lv >= 5; let yy = y + 20;
    G.txt(T.n, rx + 14, yy, 16, C.gold, 'left', G.FONT_S, 900); yy += 22 * fs(); pips(rx + 15, yy, lv, mx, 4); G.txt('Lv ' + lv + '／' + mx, rx + 22 + mx * 11, yy + 1, 11, C.sub, 'left', G.FONT, 700); yy += 22 * fs();
    ctx.font = `500 ${12 * fs()}px ${G.FONT}`; const para = (t, col) => { G.wrap(t, rw - 28).forEach(l => { G.txt(l, rx + 14, yy, 12, col, 'left', G.FONT, 500); yy += 18 * fs(); }); yy += 6; };
    para('每級：' + T.d1, C.ink); para('Lv5：' + T.d5, pk ? '#f3d98a' : '#b9a57a'); if (mx > 5) para('Lv6～10 用巔峰點數（每級 2 點），效果減半，Lv10 翻倍', C.sub);
    const can = !lock && !T.na && lv < mx && (pk ? (r.pp || 0) >= 2 : r.sp > 0), lab = lock ? '角色 Lv' + T.req + ' 解鎖' : lv >= mx ? '已滿級' : pk ? '升級（巔峰 2 點）' : '升級（1 點）';
    button(rx + 14, y + h - 46, rw - 28, 34, lab, can ? () => GR.tLearn(T.id) : null, can ? 'main' : 'off');
  };
  /* 地圖：據點（神社・城鎮）不屬章節；每章只能傳送到該章第一張地圖 */
  const HUBS = ['hub_shrine', 'hub_mountain', 'W_R01_01', 'T_ashihomura', 'W_R05_05', 'hub_city', 'T_akebi'], ROUTE1 = ['hub_shrine', 'W_R01_01', 'W_R01_02', 'W_R01_03', 'W_R01_04', 'W_R01_05', 'W_R01_05B', 'W_R01_06', 'W_R01_07'];
  const CHAP = [['第一章　風之谷', 'W_R01_03'], ['第二章　共岸', 'W_R02_01'], ['第三章　狐路', 'W_R03_01'], ['第四章　雷原', 'W_R04_01'], ['第五章　爐殿', 'W_R05_01'], ['第六章　八岐試煉', 'W_R06_01'],
    ['第七章　千扇紙閣', 'W_R07_01'], ['第八章　宴盟山路', 'W_R08_01'], ['第九章　八絃蛛窟', 'W_R09_01'], ['第十章　三潮珊庭', 'W_R10_01'], ['第十一章　黃泉', 'W_R11_01'], ['終章　立約', 'W_R12_01']];
  const DUNG = [['EZO', '雪原'], ['FUJI', '樹海火山'], ['IZUMO', '出雲神域'], ['SKY', '天空']];
  M.PAGE['地圖'] = function (x, y, w, h) {
    const { box, button, scrollArea, clip } = ui(), s = S(), lw = Math.min(200, w * 0.36), RH = 40 * fs(); s.seen = s.seen || {}; const seen = s.seen; seen[G.SC.id] = 1;
    let far = 0; ROUTE1.forEach((id, i) => { if (seen[id] || (s.cleared && s.cleared[id])) far = Math.max(far, i); }); ROUTE1.forEach((id, i) => { if (i <= far) seen[id] = 1; });   // 舊存檔：走到過的最遠點之前都算到訪
    const tabs = [['據點', true]].concat(CHAP.map(c => [c[0], !!c[1]]), [['合戰', true], ['副本', true]]), sel = M.sel.map || 0;
    box(x, y, lw, h); const off = scrollArea('mapL', x, y + 4, lw, h - 8, tabs.length * RH); clip(x, y + 4, lw, h - 8);
    tabs.forEach(([n, open], i) => { const yy = y + 6 + i * RH + off, on = i === sel; ctx.fillStyle = on ? 'rgba(120,80,30,.45)' : 'rgba(255,255,255,.03)'; G.rr(x + 6, yy + 2, lw - 12, RH - 4, 6); ctx.fill();
      if (!(G.drawIcon && G.drawIcon(i === 0 ? 'ui_icon_map_village' : i > CHAP.length ? 'ui_icon_map_dungeon' : 'item_key_kusanagi_map_1', x + 12, yy + 8, RH - 16, open ? 1 : 0.4))) { ctx.strokeStyle = 'rgba(227,194,122,.25)'; G.rr(x + 12, yy + 8, RH - 16, RH - 16, 5); ctx.stroke(); }   // 圖示（P8）／預留格
      G.txt(n, x + RH + 2, yy + RH / 2, 13, open ? C.ink : C.dim, 'left', G.FONT_S, 900); if (!open) G.txt('未開放', x + lw - 14, yy + RH / 2, 10, C.dim, 'right', G.FONT, 500);
      M.ui.hit(x + 6, Math.max(y + 4, yy + 2), lw - 12, RH - 4, () => { M.sel.map = i; }); });
    ctx.restore();
    const cx = x + lw + 10, cw = w - lw - 10, bw = Math.min(340, cw - 28), busy = G.E.some(e => e.st !== 'dead'); box(cx, y, cw, h);
    const go = id => { const L = G.EV && G.EV.bossLock(); if (L) { G.UI.toast(L); return; } M.close(); G.SC.trans = { t: 0, to: id, at: null }; };
    const row = (id, by, lab, bx, bww) => { const sc = G.D.scenes[id], ok = seen[id], here = id === G.SC.id;
      button(bx || cx + 14, by, bww || bw, RH, (lab || (sc ? sc.name : id)) + (here ? '（目前位置）' : ok ? '' : '（未到訪）'), ok && !here && !busy ? () => go(id) : null, here ? 'main' : ok && !busy ? '' : 'off'); };
    const note = busy ? '戰鬥中無法移動' : '只能前往去過的地點';
    if (sel === 0) { G.txt('據點（神社・城鎮）', cx + 14, y + 20, 15, C.gold, 'left', G.FONT_S, 900); if (G.FORGE) G.txt('神社 Lv ' + G.FORGE.shrineLv() + '　鍛冶舖 Lv ' + G.FORGE.shopLv('smith') + '　雜貨舖 Lv ' + G.FORGE.shopLv('goods'), cx + cw - 14, y + 20, 11, '#8fd38f', 'right', G.FONT, 700); G.txt(note, cx + 14, y + 42, 10, busy ? '#e07a6a' : C.dim, 'left', G.FONT, 500);
      const two = cw > 500, bw2 = two ? (cw - 38) / 2 : bw, HINT = { hub_shrine: '', hub_mountain: '試煉場', W_R01_01: '第一章', T_ashihomura: '第二章', W_R05_05: '第五章', hub_city: '第七章', T_akebi: '第八章' };
      const LH = HUBS.slice().sort((a, b) => (!seen[a]) - (!seen[b])), top = y + 56, vh = y + h - top - 6, off = scrollArea('mapH', cx, top, cw, vh, LH.length * (RH + 8)); clip(cx, top, cw, vh);   // r3.19.2：單欄、去過的在前
      LH.forEach((id, i) => { const yy = top + i * (RH + 8) + off, nm = (G.D.scenes[id] || {}).name || id; if (yy > top + vh || yy + RH < top) return; row(id, yy, seen[id] || !HINT[id] ? nm : nm + '・' + HINT[id], cx + 14, cw - 28); }); ctx.restore(); }
    else if (sel <= CHAP.length) { const [n, first] = CHAP[sel - 1]; G.txt(n, cx + 14, y + 20, 15, first ? C.gold : C.dim, 'left', G.FONT_S, 900);
      if (first) { G.txt('傳送到本章第一張地圖；其他地圖請從這裡走過去。' + (busy ? '（戰鬥中無法移動）' : ''), cx + 14, y + 42, 10, busy ? '#e07a6a' : C.dim, 'left', G.FONT, 500); row(first, y + 60);
        const ids = sel === 1 ? ['W_R01_02', 'W_R01_03', 'W_R01_04', 'W_R01_05', 'W_R01_05B', 'W_R01_06', 'W_R01_07'] : (G.WORLD.chapters[sel] || []); let ty = y + 60 + RH + 22;   // 本章路線（由西往東）
        G.txt('本章路線（由西往東；● 已到過）', cx + 14, ty, 12, C.gold, 'left', G.FONT_S, 900); ty += 22 * fs();
        const parts = ids.map(id => (seen[id] ? '● ' : '○ ') + ((G.D.scenes[id] || {}).name || id) + (G.D.scenes[id] && G.D.scenes[id].safe ? '（城鎮）' : G.D.scenes[id] && G.D.scenes[id].boss ? '（頭目）' : ''));
        G.wrap(parts.join(' → '), cw - 30).forEach(l => { G.txt(l, cx + 14, ty, 11, C.ink, 'left', G.FONT, 500); ty += 18 * fs(); }); }
      else G.txt('尚未開放：主線推進到此章後解鎖', cx + 14, y + 44, 11, C.dim, 'left', G.FONT, 500); }
    else if (sel === CHAP.length + 1) { G.txt('合戰', cx + 14, y + 20, 15, C.gold, 'left', G.FONT_S, 900); G.txt('殲滅戰／守城戰／限時討伐：請到城鎮或神社找「傳送役」選擇模式與難度。', cx + 14, y + 44, 11, C.sub, 'left', G.FONT, 500); }
    else { const lv = G.RPG.d().lv, all = G.CHEAT && G.CHEAT.on.map;
      G.txt('副本', cx + 14, y + 20, 15, C.gold, 'left', G.FONT_S, 900); G.txt('Lv 40 起開放（普通難度）；選難度請找城鎮的「傳送役」' + (busy ? '（戰鬥中無法移動）' : ''), cx + 14, y + 42, 10, busy ? '#e07a6a' : C.dim, 'left', G.FONT, 500);
      DUNG.forEach(([k, n], i) => { const id = 'D_' + k + '_01', need = (G.WORLD.meta[id] && G.WORLD.meta[id].lv) || 40, ok = seen[id] || all || lv >= Math.min(40, need), by = y + 60 + i * (RH + 10);
        button(cx + 14, by, bw, RH, n + '　建議 Lv ' + need + (ok ? '' : '（Lv 40 解鎖）'), ok && !busy && G.D.scenes[id] ? () => { seen[id] = 1; go(id); } : null, ok && !busy ? '' : 'off'); }); }
  };
  /* 設定頁加 BGM／音效 */
  /* r3.19.2：設定頁重排——兩欄同高的設定格，存檔／回標題在最下方；觸控裝置不顯示鍵盤說明 */
  /* r3.203.0：設定頁改版——分「畫面／聲音／遊戲」三區、兩欄；選項少的直接把全部選項攤開（目前的亮起），點哪個就是哪個，不用一直點著輪；
   * 其他模組加進來的設定（難度、夥伴指令…）維持「點一下換下一個」，但樣式統一；存檔／回標題縮成底部一排。 */
  M.PAGE['設定'] = function (x, y, w, h) { const s = S(), D = G.SAVE.data, { box, hit } = ui(), dirty = () => G.SAVE.markDirty();
    const seg = (n, opts, cur, set) => ({ n, opts, cur, set }), cyc = (n, v, f, ic) => ({ n, v, f, ic });
    const SCR = [seg('視角', G.ZOOMS.map(z => z.n), D.zoom, i => { D.zoom = i; dirty(); }), seg('鏡頭微調', ['更遠', '遠', '標準', '近', '更近'], D.zk === undefined ? 2 : D.zk, i => { D.zk = i; dirty(); }), seg('字體大小', ['小', '中', '大'], D.font, i => { D.font = i; dirty(); G.UI.layout(); }),
      seg('按鍵位置', ['標準', '1', '2', '3', '貼角'], D.pad || 0, i => { D.pad = i; dirty(); G.UI.layout(); }), seg('全螢幕', ['關', '開'], document.fullscreenElement ? 1 : 0, i => { if (!!document.fullscreenElement !== !!i) G.UI.fullscreen(); })];
    const SND = [seg('背景音樂', ['關', '小', '中', '大'], s.bgm === undefined ? 2 : s.bgm, i => { s.bgm = i; dirty(); AU.setVol(); }), seg('音效', ['關', '開'], (s.sfx === undefined || s.sfx) ? 1 : 0, i => { s.sfx = !!i; dirty(); if (i) AU.sfx('ui'); })];
    const GAME = [seg('對話速度', ['慢', '普通', '快'], D.textSpeed, i => { D.textSpeed = i; dirty(); })];
    for (const f of G.SET_EXTRA || []) { const r = f(); (/音樂/.test(r[0]) ? SND : GAME).push(cyc(r[0], r[1], r[2], r[3])); }
    const touch = 'ontouchstart' in window, gap = 12, cols = w >= 560 ? 2 : 1, cw = (w - gap * (cols - 1)) / cols, FH = Math.min(38 * fs(), 40), foot = FH + (touch ? 6 : 24);
    const COL = cols === 2 ? [[['畫面', SCR], ['聲音', SND]], [['遊戲', GAME]]] : [[['畫面', SCR], ['聲音', SND], ['遊戲', GAME]]];
    const need = c => c.reduce((a, g) => a + 24 + g[1].length, 0), most = Math.max(...COL.map(c => c.reduce((a, g) => a + g[1].length, 0))), heads = Math.max(...COL.map(c => c.length));
    const RH = Math.max(24, Math.min(34 * fs(), (h - foot - heads * 26 - 8) / most)), HH2 = 26;
    COL.forEach((col, ci) => { const cx = x + ci * (cw + gap); let yy = y; box(cx, y, cw, h - foot - 6);
      for (const [title, rows] of col) { G.txt(title, cx + 14, yy + HH2 / 2 + 2, 12, C.gold, 'left', G.FONT_S, 900); ctx.fillStyle = 'rgba(227,194,122,.28)'; ctx.fillRect(cx + 14 + 34 * fs(), yy + HH2 / 2 + 2, cw - 28 - 34 * fs(), 1); yy += HH2;
        for (const r of rows) { const my = yy + RH / 2, bh = Math.min(RH - 6, 26 * fs());
          const iw = r.ic && G.ICO && G.ICO.drawC(r.ic, cx + 14 + bh / 2, my, bh) ? bh + 4 : 0; G.txt(r.n, cx + 14 + iw, my + 1, 13, C.ink, 'left', G.FONT, 700);
          if (r.opts) { const n = r.opts.length, bw = Math.min(54 * fs(), (cw - 28 - 104 * fs()) / n - 4), x0 = cx + cw - 12 - n * (bw + 4) + 4;
            r.opts.forEach((o, k) => { const on = k === r.cur, bx = x0 + k * (bw + 4); ctx.fillStyle = on ? 'rgba(150,92,36,.95)' : 'rgba(255,255,255,.05)'; G.rr(bx, my - bh / 2, bw, bh, 6); ctx.fill(); if (on) { ctx.strokeStyle = 'rgba(255,238,200,.7)'; ctx.lineWidth = 1; G.rr(bx + .5, my - bh / 2 + .5, bw - 1, bh - 1, 6); ctx.stroke(); }
              G.txt(o, bx + bw / 2, my + 1, 12, on ? '#fff3d6' : C.sub, 'center', G.FONT, on ? 800 : 600); hit(bx, my - RH / 2, bw, RH, () => r.set(k)); }); }
          else { ctx.font = `700 ${12 * fs()}px ${G.FONT}`; const tw = Math.min(cw - 40 - iw - 90 * fs(), ctx.measureText(r.v + '　›').width + 22), bx = cx + cw - 12 - tw; ctx.fillStyle = 'rgba(255,255,255,.05)'; G.rr(bx, my - bh / 2, tw, bh, 6); ctx.fill(); ctx.strokeStyle = 'rgba(227,194,122,.35)'; ctx.lineWidth = 1; G.rr(bx + .5, my - bh / 2 + .5, tw - 1, bh - 1, 6); ctx.stroke();
            G.txt(r.v + '　›', bx + tw / 2, my + 1, 12, C.gold, 'center', G.FONT, 700); hit(cx + 8, my - RH / 2, cw - 16, RH, r.f); }
          yy += RH; } yy += 2; } });
    const by = y + h - foot, bw2 = (w - gap) / 2;
    [['立即存檔', () => { D.x = G.H.x; D.y = G.H.y; D.hp = G.H.hp; G.SAVE.markDirty(); G.UI.toast(G.SAVE.flush() ? '已存檔' : '存檔失敗（瀏覽器不允許儲存）'); }], ['回到標題', () => { M.close(); G.toTitle(); }]]
      .forEach(([n, f], i) => { const bx = x + i * (bw2 + gap); box(bx, by, bw2, FH); G.txt(n, bx + bw2 / 2, by + FH / 2 + 1, 13, C.gold, 'center', G.FONT_S, 900); hit(bx, by, bw2, FH, f); });
    if (!touch) G.txt('鍵盤：WASD 移動・J 斬・1 2 3 招式・U I 技・K L 身法・O 奧義・E 互動・Esc 選單', x, y + h - 8, 10, C.dim, 'left', G.FONT, 500); };
  const init0 = G.RPG.init; G.RPG.init = function () { init0(); GR.init(); R().recalc(); };
  setInterval(() => { if (G.mode === 'title') AU.play('title'); }, 1000);
  GR.init = function () { jd(); if ((jd().skin || 'samurai') !== 'samurai') GR.setSkin(jd().skin); else GR.portrait(); };
})();
