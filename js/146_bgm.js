/* =====================================================================
 * 146_bgm.js
 * 版本    : r3.152.0  (2026-11-27)
 * 說明    : 背景音樂改用交接清單 music_catalog（42 首／44 檔，a/bgm/*.ogg）。
 *           ‧ 城鎮固定主曲；探索每區 3 首輪播（播完換下一首、換圖續播）；
 *           ‧ 普通戰鬥依章節；頭目依頭目指定（大禍津日、九尾等先播前奏再循環）；
 *           ‧ 合戰 epicbattle、神社 sakuya、標題沿用 bgm_title.mp3。
 *           ‧ 只包裝 G.AU.play（16_growth 每 30 格呼叫一次），不另開每幀檢查。
 *           ‧ 設定頁加「音樂來源」（CC BY 4.0 標示）。
 * 依賴    : 16_growth（G.AU）、18_world（G.WORLD.meta）、26_boss（G.BOSS.enc）
 * ===================================================================== */
(function () {
  const AU = G.AU; if (!AU) return;
  const SRC = t => t === 'title' ? 'a/au/bgm_title.mp3' : 'a/bgm/bgm_' + t + '.ogg';
  const INTRO = { demise: 1, gothic_dark: 1 };
  const TOWN = { hub_city: 'windmill_village', T_ashihomura: 'harvest2', T_kayamori: 'soft_day', W_R05_05: 'soft_day', T_akebi: 'gentle_theme2', T_yokai: 'harvest6' };
  const EXP = { 1: ['breeze', 'breeze3', 'breeze4'], 2: ['winds_embrace', 'limpid_water', 'overworld_folk'], 3: ['otogi4', 'hanagoyomi2', 'awayuki'],
    4: ['ancient_gust', 'twilight_gallop', 'zephyr_fields'], 5: ['overworld_folk', 'otogi4', 'twilight_gallop'], 6: ['dungeon_tower', 'time_and_pray', 'dual_illusions'],
    7: ['winds_embrace', 'hanagoyomi2', 'breeze3'], 8: ['overworld_folk', 'breeze3', 'forest_sage'], 9: ['cryptic_canvas', 'silent_shadows', 'dual_illusions'],
    10: ['sea_breeze', 'mystic_tides', 'limpid_water'], 11: ['entangle', 'silent_shadows', 'cryptic_canvas'], 12: ['zephyr_fields', 'ancient_gust', 'twilight_gallop'],
    FUJI: ['twilight_gallop', 'dungeon_tower', 'lost_place6'], EZO: ['morning_snowfields', 'frozen_forest', 'snowchill'], SKY: ['zephyr_fields', 'ancient_gust', 'overworld_folk'],
    IZUMO: ['otogi4', 'hanagoyomi2', 'time_and_pray'], SEAL: ['time_and_pray', 'entangle', 'dual_illusions'] };
  const BAT = { 1: 'battlefield5', 2: 'fight2', 3: 'kengeki', 4: 'raid_folkmetal2', 5: 'kengeki', 6: 'fight3', 7: 'battlefield5', 8: 'kengeki', 9: 'fight3',
    10: 'fight2', 11: 'fight3', 12: 'crisis', FUJI: 'kengeki', EZO: 'fight3', SKY: 'raid_folkmetal2', IZUMO: 'kengeki', SEAL: 'fight3' };
  const AME = 'amenoshita3', GOT = 'gothic_dark';
  const BOSS = { kappa: AME, raiju: AME, orochi: AME, watatsumi: AME, komakin: AME, kinhannya: AME, akaorochi: AME, susanoo: AME, seimei: AME, takemikazuchi: AME, enno: AME,
    kyubi: GOT, osakabe: GOT, tsuchigumo: GOT, izanami: GOT, omagatsuhi: 'demise' };   // 其餘（鎌鼬、鬼王、酒吞、茨木、道摩、義經、隱藏王、小王…）＝raid

  /* 場景 → 區域鍵（章 1～12 或副本鍵） */
  function region(id) { let m;
    if ((m = /^D_(FUJI|EZO|SKY|IZUMO)/.exec(id))) return m[1];
    if (/^A_|^hub_mountain$/.test(id)) return 'SEAL';
    if ((m = /^(?:W_|BG_)?R(\d\d)/.exec(id)) || (m = /^N_EX(\d\d)/.exec(id))) return +m[1];
    const mt = G.WORLD && G.WORLD.meta && G.WORLD.meta[id], d = G.D.scenes[id] || {};
    if (mt && mt.ch) return mt.ch; if (d.ch) return d.ch;
    const f = (G.SAVE.data && G.SAVE.data.flags) || {}; let c = 1; while (c < 12 && f['ch' + c]) c++; return c; }
  /* 探索曲池輪播位置（每區各自記） */
  const POS = {};
  function base(id) { if (id === 'hub_shrine') return 'sakuya'; if (TOWN[id]) return TOWN[id];
    const r = region(id), L = EXP[r] || EXP[1]; const i = POS[r] || 0; return { pool: r, t: L[i % L.length] }; }
  function bossTrack() { const e = G.BOSS && G.BOSS.enc; return (e && !e.done && BOSS[e.id]) || 'raid'; }
  function resolve(k) { const id = G.SC && G.SC.id;
    if (k === 'boss' && !(G.BOSS && G.BOSS.enc && !G.BOSS.enc.done) && !G.E.some(e => e.boss && e.st !== 'dead')) k = 'battle';   // 舊規則把赤鬼當頭目；沒有真頭目就用普通戰鬥曲
    if (k === 'title') return 'title'; if (k === 'war') return 'epicbattle'; if (k === 'boss') return bossTrack();
    if (k === 'battle') return BAT[region(id)] || 'battlefield5'; if (k === 'shrine') return 'sakuya';
    return base(id); }

  /* 播放器：每首一個 Audio；暫停保留進度（戰鬥結束回來續播） */
  const EL = AU.el;
  function el(t, intro) { const k = intro ? t + '#i' : t; let a = EL[k];
    if (!a) { a = EL[k] = new Audio(intro ? 'a/bgm/bgm_' + t + '_intro.ogg' : INTRO[t] ? 'a/bgm/bgm_' + t + '_loop.ogg' : t === 'title' ? SRC(t) : 'a/bgm/bgm_' + t + '_loop.ogg');
      a.preload = 'auto'; a.volume = 0; a.addEventListener('ended', () => onEnd(k)); }
    return a; }
  let curK = null, curPool = null;
  function onEnd(k) {
    if (k !== curK) return;
    if (k.endsWith('#i')) { const t = k.slice(0, -2), a = el(t); a.loop = true; a.volume = AU.vol(); curK = t; const p = a.play(); if (p && p.catch) p.catch(() => {}); return; }
    if (curPool != null) { const L = EXP[curPool]; POS[curPool] = ((POS[curPool] || 0) + 1) % L.length; const a = EL[k]; if (a) a.currentTime = 0; AU.play(AU.want, true); } }
  AU.play = function (k, force) {
    AU.want = k; if (!AU.unlocked) return;
    const r = resolve(k), t = typeof r === 'string' ? r : r.t, pool = typeof r === 'string' ? null : r.pool;
    const same = curK === t || curK === t + '#i';
    if (same && !force) return;
    const v = AU.vol(); curPool = pool;
    let a, key = t;
    if (INTRO[t] && !(EL[t] && EL[t].currentTime > 0)) { a = el(t, true); key = t + '#i'; a.loop = false; }
    else { a = el(t); a.loop = pool == null; }
    for (const n in EL) if (n !== key) AU.fade(EL[n], 0, true);
    curK = key; AU.cur = k;
    if (!v) return;
    const p = a.play(); if (p && p.catch) p.catch(() => {}); AU.fade(a, v, false); };

  /* 設定頁：音樂來源（CC BY 4.0 標示） */
  (G.SET_EXTRA = G.SET_EXTRA || []).push(() => ['音樂來源', 'PeriTune', () => G.UI.toast('背景音樂：PeriTune / Sei Mutsuki（CC BY 4.0）peritune.com')]);
})();
