/* ==========================================================================
 * 神諭之地 重製版 — 19_ui8.js
 * Version : r3.166.0  (2026-11-27)　r3.166.0：選單分組「任務」圖示
 * 舊版    : r3.3.0  (2026-11-12)
 * 變更    : r3.3.0 新增。P8 介面圖示接入：技能／招式圖示（選單按鍵頁＋戰鬥按鍵）、選單分頁圖示、裝備部位圖示、
 *           NPC 新頭像（權爺、阿松、小雪、鐵心）。
 * 說明    : 圖集 a/p/ui_icons.webp（96px 格，369 個）＋ ui_faces.webp（128px，40 個頭像），索引 a/p/ui.json。
 *           開機後背景載入（不擋開場）；未載完前所有呼叫回傳 false → 沿用原本文字／淡框。
 *           G.drawIcon(key, x, y, size, alpha) → 是否畫出。key：圖示名，或 'mv:<招式id>'（依目前武器）。
 * ========================================================================== */
'use strict';
(function () {
  const ctx = G.ctx;
  const U = G.UI8 = { J: null, img: {}, ready: false,
    load() { return fetch('a/p/ui.json?v=' + G.VER).then(r => r.json()).then(j => { U.J = j;
      return Promise.all(['icons', 'faces'].map(k => new Promise(ok => { const im = new Image(); im.onload = () => { U.img[k] = im; ok(); }; im.onerror = ok; im.src = 'a/p/' + j[k].img + '?v=' + G.VER; }))); })
      .then(() => { U.ready = true; U.faces(); }).catch(e => console.warn('ui8', e)); },
    /* NPC 頭像：新圖取代舊圖（同一張 G.IMG 鍵，對話框自動套用） */
    faces() { const F = U.J.faces, im = U.img.faces; if (!im) return;
      const MAP = { face_gen: 'gen', face_matsu: 'matsu', face_xue: 'xue', face_smith: 'smith' };
      for (const k in MAP) { const p = F.i[MAP[k] + '_portrait_neutral']; if (!p) continue; const c = document.createElement('canvas'); c.width = c.height = F.s;
        c.getContext('2d').drawImage(im, p[0], p[1], F.s, F.s, 0, 0, F.s, F.s); G.IMG[k] = c; } }
  };
  /* 選單分頁／子分頁圖示 */
  const ALIAS = { '角色': 'ui_icon_quest_target', '裝備': 'item_armor_windway_body', '武器': 'item_weapon_katana_ferry', '夥伴': 'ui_icon_interact_hand', '地圖': 'ui_icon_map_village', '任務': 'ui_icon_map_village', '角色/結局走向': 'ui_icon_map_village', '系統': 'ui_icon_material_bag',
    '角色/狀態': 'ui_icon_quest_target', '角色/職業': 'item_accessory_yata', '角色/修練': 'item_consumable_clearbreath', '裝備/穿戴': 'item_armor_windway_head', '裝備/背包': 'ui_icon_material_bag',
    '武器/熟練度': 'item_material_tamahagane', '武器/技能': 'item_key_jade_light', '武器/按鍵': 'ui_icon_interact_exclamation', '系統/設定': 'item_accessory_compass', '系統/測試': 'item_accessory_abacus',
    slot_weapon: 'item_weapon_katana_ferry', slot_head: 'item_armor_windway_head', slot_body: 'item_armor_windway_body', slot_hands: 'item_armor_windway_hands', slot_feet: 'item_armor_windway_feet', slot_charm: 'item_accessory_yasakani' };
  const WPN_ICON = { katana: 'item_weapon_katana_ferry', nodachi: 'item_weapon_nodachi_longevening', kanabo: 'item_weapon_kanabo_bellback', ono: 'item_weapon_ono_buildbeam', naginata: 'item_weapon_naginata_turnreed',
    yari: 'item_weapon_yari_crosspile', kusarigama: 'item_weapon_kusarigama_twocrossings', staff: 'item_weapon_staff_walkinglamp', yumi: 'item_weapon_yumi_reedstring', teppo: 'item_weapon_teppo_clearfire' };
  U.resolve = function (key) { if (!key) return null;
    if (key.startsWith('mv:')) return 'skill_soma_' + G.WPN.curId() + '_' + key.slice(3);
    if (key.startsWith('wpn:')) return WPN_ICON[key.slice(4)];
    if (key === '武器') return WPN_ICON[G.WPN.curId()];
    return ALIAS[key] || key; };
  G.drawIcon = function (key, x, y, s, alpha) {
    if (!U.ready) return false; const k = U.resolve(key), I = U.J.icons, p = I.i[k]; if (!p || !U.img.icons) return false;
    if (alpha !== undefined) { ctx.save(); ctx.globalAlpha *= alpha; }
    ctx.drawImage(U.img.icons, p[0], p[1], I.s, I.s, x, y, s, s); if (alpha !== undefined) ctx.restore(); return true; };
  setTimeout(() => U.load(), 50);
})();
