/* ==========================================================================
 * 神諭之地 重製版 — 50_party_kit.js
 * Version : r3.154.0  (2026-11-27)　r3.154.0：夥伴招式特效放大 10%＋發光層，跟主角招式亮度一致
 * 舊版    : r3.104.2  (2026-11-26)　r3.104.2：夥伴範圍（結界／束縛／冰霜等）拿掉外框橢圓線，改柔邊貼地漸層＋法陣素材
 * 舊版    : r3.58.0  (2026-11-24)　r3.58.0：事件支援 mkK／chK（見切、雷荷倍率）、fc（必暴擊）、風路 spd（滿級效果用，見 97_partner5）
 * 舊版    : r3.10.1  (2026-11-13)
 * 變更    : r3.10.1 unit/refH 改用顯示階段 P.stg。
 * 變更    : r3.10.0 新增。8 位夥伴的資料、13 招（五通道＋A/B 路線異式）與事件結算：
 *           ・白丸／颯／葛葉／茨木童子／汐音：招式片段與事件時點取自素材包（p_<id>_<階>：sk_<招>）。
 *           ・源賴光／建御雷／役小角：沿用頭目圖集的夥伴版動作（R／T／E 01–13），特效借用同招的頭目特效（縮小、去預告）。
 *           ・事件種類：近擊 hit、投射 proj、護擋 guard、區域 zone、回復 heal、嘲諷 taunt、自身減傷 self、標記 mark。
 *           ・回復共用 12 秒恢復窗；控制對頭目無效、改加破勢（打擊倍率）。
 * 依賴    : 49_party（G.PARTY）、03_actors（damageOni、FX）、12_anim。
 * ========================================================================== */
'use strict';
(function () {
  const PY = G.PARTY, H = G.H, SC = G.SC, A = G.ANIM, TK = 1000 / 60, HH = () => G.HERO_H;
  const alive = e => e && e.st !== 'dead' && !(e.delay > 0);
  const dist = (a, b) => Math.hypot(a.x - b.x, (a.y - b.y) * 1.6);
  const ROM = ['', 'i', 'ii', 'iii'];

  /* ---------- 夥伴定義 ---------- */
  const P5 = (id, o) => Object.assign({ id, pre: '', fx: 'p_' + id + '_fx', unit: P => 'p_' + id + '_' + ((P && P.stg) || PY.stage(id)), refH: P => (PY.K5[id] || {})[ROM[(P && P.stg) || PY.stage(id)]] || 190,   // P.stg＝目前顯示的階段（新階圖載完才切換）
    downClip: 'fall', riseClip: 'rise', face: 'face_' + id }, o);
  const PH = (id, pre, o) => Object.assign({ id, pre: pre + '_', unit: () => 'b_' + id, fx: null, refH: () => { const u = A.get('b_' + id); const f = u && u.act[pre + '_idle'] && u.act[pre + '_idle'].f[0]; return f ? f[5] * (f[8] || 1) : 150; },
    downClip: 'knockdown', riseClip: 'getup', face: 'face_' + id }, o);
  PY.DEF = {
    shiro: P5('shiro', { name: '白丸', role: '坦', ratio: 0.7, hpK: 2.4, atkK: 0.78, defK: 1.6, spd: 2.4, reach: 70, follow: 46, atkCd: 50, guard: 1, thK: 2.2 }),
    hayate: P5('hayate', { name: '颯', role: '遠', ratio: 1.0, hpK: 0.8, atkK: 1.25, defK: 0.8, spd: 2.6, ranged: 1, keep: 230, follow: 64, atkCd: 40 }),
    kuzuha: P5('kuzuha', { name: '葛葉', role: '控', ratio: 0.97, hpK: 0.9, atkK: 1.3, defK: 0.9, spd: 2.4, ranged: 1, keep: 190, follow: 56, atkCd: 56, autoIdle: 1 }),
    ibaraki: P5('ibaraki', { name: '茨木童子', role: '破', ratio: 1.06, hpK: 1.6, atkK: 1.51, defK: 1.15, spd: 2.5, reach: 80, follow: 52, atkCd: 46, thK: 1.4 }),
    shion: P5('shion', { name: '汐音', role: '癒', mz: 0.42, ratio: 0.93, hpK: 0.95, atkK: 0.69, defK: 0.9, spd: 2.3, ranged: 1, keep: 170, follow: 58, atkCd: 60, autoIdle: 1 }),
    yorimitsu: PH('yorimitsu', 'yorimitsu', { name: '源賴光', role: '近', ratio: 1.04, hpK: 1.3, atkK: 1.3, defK: 1.1, spd: 2.6, reach: 84, follow: 54, atkCd: 44, thK: 1.2 }),
    takemikazuchi: PH('takemikazuchi', 'takemikazuchi', { name: '建御雷', role: '破', ratio: 1.1, hpK: 1.4, atkK: 0.95, defK: 1.15, spd: 2.5, reach: 86, follow: 54, atkCd: 48, thK: 1.2 }),
    enno: PH('enno', 'enno', { name: '役小角', role: '控', ratio: 0.96, hpK: 1.0, atkK: 0.69, defK: 0.95, spd: 2.4, ranged: 1, keep: 120, follow: 56, atkCd: 52 })
  };
  for (const id in PY.DEF) if (!PY.DEF[id].reach) PY.DEF[id].reach = 70;

  /* ---------- 招式（ev：t＝毫秒） ---------- */
  const K = G.PKIT = {};
  const sk = (clip, name, ev, o) => Object.assign({ clip, name, ev: ev.sort((a, b) => a.t - b.t) }, o || {});
  const hit = (t, m, o) => Object.assign({ k: 'hit', t, m }, o || {}), proj = (t, m, o) => Object.assign({ k: 'proj', t, m }, o || {});
  const hpLow = p => H.hp / H.hpMax <= p, foesNear = (x, y, r) => G.E.some(e => alive(e) && Math.hypot(e.x - x, (e.y - y) * 1.6) < r);
  const S5 = (id, s) => 'sk_' + s;
  /* 白丸：正面守門／鎮地控場 */
  K.shiro = {
    ordinary: sk('sk_ordinary', '踏石抵肩', [hit(125, 0.6, { fx: 'shoulder_contact' })]),
    autonomous: sk('sk_autonomous', '偏門拒入', [hit(333, 1.0, { fx: 'shoulder_contact', kb: 10 })], { can: P => foesNear(H.x, H.y, 140) }),
    command: sk('sk_command', '留門護側', [{ k: 'guard', t: 200, n: 1, dur: 3, fx: 'guard_contact' }, { k: 'taunt', t: 200, r: 200, dur: 2 }], { cd: 18 }),
    smallCombo: sk('sk_smallCombo', '同守一隙', [hit(500, 1.4, { fx: 'shoulder_contact' })]),
    grandCombo: sk('sk_grandCombo', '守約開門', [hit(900, 3.0, { fx: 'heavy_quake', r: 120, n: 4 }), { k: 'guard', t: 1458, n: 1, dur: 3, fx: 'guard_contact' }]),
    A2: sk('sk_A2', '迎矢護肩', [{ k: 'guard', t: 300, n: 1, dur: 4, proj: 1, fx: 'guard_contact' }], { cd: 12 }),
    A3: sk('sk_A3', '仁王留門', [{ k: 'guard', t: 400, n: 2, dur: 3, fx: 'guard_contact', lv5n: 3 }, { k: 'taunt', t: 400, r: 220, dur: 3, max: 3 }], { cd: 22 }),
    A4: sk('sk_A4', '退路相承', [hit(600, 1.2, { fx: 'shoulder_contact' }), { k: 'guard', t: 917, n: 1, dur: 3, proj: 1, fx: 'guard_contact' }]),
    A6: sk('sk_A6', '一夫當關', [hit(1200, 2.6, { fx: 'heavy_quake', r: 130, n: 4 }), { k: 'guard', t: 1708, n: 1, dur: 3, fx: 'guard_contact', lv5n: 2 }]),
    B2: sk('sk_B2', '偏門雙拒', [hit(708, 1.0, { fx: 'shoulder_contact', n: 2, kb: 14 })], { cd: 12, can: P => foesNear(P.x, P.y, 140) }),
    B3: sk('sk_B3', '石爪鎮步', [hit(458, 1.6, { fx: 'claw_rift', r: 150, n: 3, stun: 36, lane: 1 })], { cd: 20 }),
    B4: sk('sk_B4', '裂隙合擊', [hit(458, 1.4, { fx: 'claw_rift', r: 170, n: 3, lane: 1 })]),
    B6: sk('sk_B6', '石門崩陣', [hit(1208, 2.6, { fx: 'heavy_quake', r: 150, n: 3, kb: 16, stun: 30, lv5n: 5 })])
  };
  /* 颯：風讀射線 */
  K.hayate = {
    ordinary: sk('sk_ordinary', '辨風一矢', [proj(333, 0.6, { fx: 'light_arrow', hitFx: 'arrow_hit', read: 1 })]),
    autonomous: sk('sk_autonomous', '斜羽截步', [proj(417, 0.9, { fx: 'light_arrow', hitFx: 'arrow_hit', slow: 0.2, slowT: 2 })]),
    command: sk('sk_command', '空隙標線', [{ k: 'mark', t: 375, fx: 'read_mark', dur: 6 }, proj(700, 1.6, { fx: 'heavy_arrow', hitFx: 'arrow_hit', useRead: 1 })], { cd: 18 }),
    smallCombo: sk('sk_smallCombo', '穿隙應弦', [proj(167, 1.4, { fx: 'light_arrow', hitFx: 'arrow_hit' })]),
    grandCombo: sk('sk_grandCombo', '同向破雲', [proj(708, 4.0, { fx: 'heavy_arrow', hitFx: 'arrow_hit', pierce: 3, useRead: 1 })]),
    A2: sk('sk_A2', '追隙一矢', [proj(333, 1.1, { fx: 'light_arrow', hitFx: 'arrow_hit' })], { cd: 12 }),
    A3: sk('sk_A3', '穿雲定矢', [proj(708, 2.6, { fx: 'heavy_arrow', hitFx: 'arrow_hit', useRead: 1, pierce: 2 })], { cd: 18 }),
    A4: sk('sk_A4', '破雲追射', [proj(333, 0.75, { fx: 'light_arrow', hitFx: 'arrow_hit' }), proj(708, 0.75, { fx: 'light_arrow', hitFx: 'arrow_hit' })]),
    A6: sk('sk_A6', '一線天穿', [proj(333, 0.8, { fx: 'light_arrow', hitFx: 'arrow_hit' }), proj(708, 0.8, { fx: 'light_arrow', hitFx: 'arrow_hit' }), proj(1542, 2.4, { fx: 'heavy_arrow', hitFx: 'arrow_hit', pierce: 3, useRead: 1, lv5x: 1 })]),
    B2: sk('sk_B2', '截羽緩行', [proj(417, 0.8, { fx: 'light_arrow', hitFx: 'arrow_hit', slow: 0.2, slowT: 2 })], { cd: 12 }),
    B3: sk('sk_B3', '回風牽線', [proj(375, 1.1, { fx: 'light_arrow', hitFx: 'arrow_hit', pull: 40, n: 2 }), { k: 'zone', t: 400, z: 'tether', fx: 'wind_tether', dur: 0.6 }], { cd: 20 }),
    B4: sk('sk_B4', '弦返護路', [proj(208, 0.7, { fx: 'light_arrow', hitFx: 'arrow_hit', kb: 12, dy: -18 }), proj(500, 0.7, { fx: 'light_arrow', hitFx: 'arrow_hit', kb: 12, dy: 18 })]),
    B6: sk('sk_B6', '四羽封徑', [125, 292, 458, 667].map((t, i) => proj(t, 0.85, { fx: 'light_arrow', hitFx: 'arrow_hit', dy: (i - 1.5) * 16 })).concat([{ k: 'zone', t: 700, z: 'lane', fx: 'wind_lane', dur: 4, slow: 0.25, r: 110 }]))
  };
  /* 葛葉：印位、淨化、封步 */
  K.kuzuha = {
    ordinary: sk('sk_ordinary', '折紙點印', [proj(500, 0.6, { fx: 'paper_bolt', hitFx: 'seal_hit' })]),
    autonomous: sk('sk_autonomous', '止污小封', [{ k: 'cleanse', t: 542, fx: 'cleanse' }], { can: P => PY.debuffed() || foesNear(H.x, H.y, 160) }),
    command: sk('sk_command', '自選印位', [{ k: 'zone', t: 625, z: 'ward', fx: 'guard_ward', dur: 4, dr: 0.15, r: 70 }], { cd: 20 }),
    smallCombo: sk('sk_smallCombo', '印隙照刃', [hit(125, 1.3, { fx: 'seal_hit', ranged: 1 })]),
    grandCombo: sk('sk_grandCombo', '同證留白', [hit(600, 2.6, { fx: 'seal_hit', ranged: 1, r: 120, n: 4 }), { k: 'zone', t: 1083, z: 'ward', fx: 'guard_ward', dur: 4, dr: 0.2, r: 80 }]),
    A2: sk('sk_A2', '清祓一葉', [{ k: 'cleanse', t: 292, fx: 'cleanse' }], { cd: 18, can: P => PY.debuffed() || foesNear(H.x, H.y, 160) }),
    A3: sk('sk_A3', '兩儀護印', [{ k: 'zone', t: 625, z: 'ward', fx: 'guard_ward', dur: 4, dr: 0.2, r: 76, once: 1 }], { cd: 22 }),
    A4: sk('sk_A4', '祓印照刃', [hit(200, 1.1, { fx: 'seal_hit', ranged: 1 }), { k: 'cleanse', t: 375, fx: 'cleanse' }]),
    A6: sk('sk_A6', '神樂守界', [hit(792, 2.0, { fx: 'seal_hit', ranged: 1, r: 120, n: 4 }), { k: 'cleanse', t: 900, fx: 'cleanse' }, { k: 'zone', t: 1083, z: 'ward', fx: 'guard_ward', dur: 3, dr: 0.25, r: 80 }]),
    B2: sk('sk_B2', '縛足紙環', [proj(500, 0.6, { fx: 'paper_bolt', hitFx: 'bind_ring', root: 48 })], { cd: 14 }),
    B3: sk('sk_B3', '封步印位', [{ k: 'zone', t: 625, z: 'bind', fx: 'bind_ward', dur: 4, root: 48, r: 80, max: 3, atTarget: 1 }], { cd: 22 }),
    B4: sk('sk_B4', '封術合刃', [hit(375, 1.3, { fx: 'seal_hit', ranged: 1, stun: 30 })]),
    B6: sk('sk_B6', '六方封界', [{ k: 'zone', t: 1542, z: 'bind', fx: 'sixfold', dur: 2, root: 48, r: 120, max: 3, atTarget: 1, m: 2.6 }])
  };
  /* 茨木童子：鬼勢重拳／炎鬼 */
  K.ibaraki = {
    ordinary: sk('sk_ordinary', '肩進短打', [hit(458, 0.7, { fx: 'body_hit', oni: 1 })]),
    autonomous: sk('sk_autonomous', '止進重踏', [hit(250, 1.0, { fx: 'stomp_dust', r: 100, n: 2, stun: 12, ground: 1 })], { can: P => foesNear(P.x, P.y, 110) }),
    command: sk('sk_command', '回肩破守', [hit(708, 2.4, { fx: 'heavy_hit', useOni: 1, big: 1 })], { cd: 20 }),
    smallCombo: sk('sk_smallCombo', '承刃落肩', [hit(208, 1.5, { fx: 'body_hit' })]),
    grandCombo: sk('sk_grandCombo', '有界共擔', [hit(417, 4.0, { fx: 'heavy_hit', big: 1, r: 110, n: 3 })]),
    A2: sk('sk_A2', '炎腕進擊', [hit(417, 1.0, { fx: 'flame_contact', burn: 3 })], { cd: 14 }),
    A3: sk('sk_A3', '灼腕破城', [hit(708, 2.8, { fx: 'heavy_hit', fx2: 'flame_contact', useOni: 1, big: 1, ign: 20 })], { cd: 22 }),
    A4: sk('sk_A4', '烙印合拳', [hit(167, 1.3, { fx: 'flame_contact', burn: 2 })]),
    A6: sk('sk_A6', '羅生炎崩', [hit(417, 1.0, { fx: 'flame_rise', anchor: 'up' }), hit(1000, 1.0, { fx: 'flame_contact' }), hit(1833, 2.2, { fx: 'flame_drop', big: 1, r: 110, n: 3, anchor: 'ground' })]),
    B2: sk('sk_B2', '截身重踏', [hit(375, 0.9, { fx: 'stomp_dust', r: 100, n: 2, stun: 14, ground: 1 })], { cd: 12, can: P => foesNear(P.x, P.y, 110) }),
    B3: sk('sk_B3', '鬼腕截陣', [{ k: 'self', t: 333, dr: 0.5, dur: 0.8, fx: 'guard_brace' }, hit(1292, 1.8, { fx: 'body_hit', useOni: 1 })], { cd: 22 }),
    B4: sk('sk_B4', '攔肩護撤', [hit(250, 1.3, { fx: 'physical_sweep', kb: 18 })]),
    B6: sk('sk_B6', '羅門護撤', [{ k: 'self', t: 333, dr: 0.2, dur: 2, fx: 'guard_brace' }, hit(750, 2.8, { fx: 'physical_sweep', r: 120, n: 4, kb: 16 })])
  };
  /* 汐音：主音＋餘音治療／霜潮 */
  const heal = (t, pct, fx, o) => Object.assign({ k: 'heal', t, pct, fx }, o || {});
  K.shion = {
    ordinary: sk('sk_ordinary', '貝音短波', [proj(375, 0.6, { fx: 'water_wave', hitFx: 'water_hit' })]),
    autonomous: sk('sk_autonomous', '短息照護', [heal(375, 2, 'heal_main', { win: 1 }), heal(2375, 2, 'heal_echo', { echo: 1 })], { can: P => hpLow(0.8) && PY.canHeal() }),
    command: sk('sk_command', '留潮一息', [heal(375, 3, 'heal_main', { win: 1 }), heal(2375, 3, 'heal_echo', { echo: 1 })], { cd: 25, can: P => PY.canHeal() }),
    smallCombo: sk('sk_smallCombo', '應潮合拍', [proj(250, 1.3, { fx: 'water_wave', hitFx: 'water_hit', n: 2 })]),
    grandCombo: sk('sk_grandCombo', '往來同歌', [proj(300, 2.6, { fx: 'water_wave', hitFx: 'water_hit', pierce: 3 }), heal(375, 2, 'heal_main'), heal(2375, 2, 'heal_echo', { echo: 1 })]),
    A2: sk('sk_A2', '潮息小曲', [heal(375, 4, 'heal_main', { win: 1 }), heal(1875, 2, 'heal_echo', { echo: 1 })], { cd: 24, can: P => hpLow(0.6) && PY.canHeal() }),
    A3: sk('sk_A3', '還潮清歌', [heal(375, 6, 'heal_main', { win: 1 }), heal(1875, 4, 'heal_echo', { echo: 1 })], { cd: 25, can: P => PY.canHeal() }),
    A4: sk('sk_A4', '暖潮合拍', [proj(250, 1.0, { fx: 'water_wave', hitFx: 'water_hit' }), heal(250, 2, 'heal_main'), heal(1750, 1, 'heal_echo', { echo: 1 })]),
    A6: sk('sk_A6', '海月返潮', [proj(300, 2.0, { fx: 'water_wave', hitFx: 'water_hit', pierce: 3 }), heal(375, 4, 'heal_main'), heal(1875, 4, 'heal_echo', { echo: 1, lv5x: 1 })]),
    B2: sk('sk_B2', '霜音短波', [proj(375, 0.8, { fx: 'cold_wave', hitFx: 'water_hit', slow: 0.25, slowT: 2 })], { cd: 12 }),
    B3: sk('sk_B3', '潮環凍步', [{ k: 'zone', t: 500, z: 'frost', fx: 'frost_ring', dur: 2, slow: 0.25, r: 90, max: 2, atTarget: 1, freeze: 36, freezeFx: 'freeze_snap' }], { cd: 22 }),
    B4: sk('sk_B4', '逆潮合拍', [proj(375, 1.3, { fx: 'water_wave', hitFx: 'water_hit', kb: 14, n: 2 })]),
    B6: sk('sk_B6', '冰潮鳴奏', [{ k: 'zone', t: 500, z: 'frost', fx: 'ice_tide', dur: 3, slow: 0.3, r: 130, max: 3, atTarget: 1, freeze: 36, freezeFx: 'freeze_snap', m: 2.6 }])
  };
  /* 隱藏夥伴：13 招依序＝普攻、自主、指令、小連攜、大連攜、A2、A3、A4、A6、B2、B3、B4、B6 */
  const ORDER = ['ordinary', 'autonomous', 'command', 'smallCombo', 'grandCombo', 'A2', 'A3', 'A4', 'A6', 'B2', 'B3', 'B4', 'B6'];
  const H13 = (L, p) => { const o = {}; L.forEach((s, i) => { const c = p + String(i + 1).padStart(2, '0'); o[ORDER[i]] = Object.assign(s, { clip: c, bfx: 'boss_' + c }); }); return o; };
  const hx = (name, ev, o) => sk('', name, ev, o);
  K.yorimitsu = H13([
    hx('雲切三連', [hit(300, 0.3), hit(560, 0.3), hit(860, 0.45, { fx: 1, mikiri: 1 })]),
    hx('追隙斬', [hit(500, 1.0, { fx: 1, dash: 40 })], { cd: 12 }),
    hx('見切返刃', [{ k: 'self', t: 100, dr: 0.6, dur: 0.6 }, hit(700, 2.2, { fx: 1, big: 1, useMikiri: 1 })], { cd: 20 }),
    hx('同步斷妖', [hit(400, 1.5, { fx: 1 })]),
    hx('童子切・破邪', [hit(1100, 4.0, { fx: 1, big: 1, r: 120, n: 3 })]),
    hx('影步追斬', [hit(500, 1.2, { fx: 1, dash: 60 })], { cd: 14 }),
    hx('童子切・拔斷', [hit(800, 2.8, { fx: 1, big: 1, ign: 20, useMikiri: 1 })], { cd: 22 }),
    hx('雙刃斷惡', [hit(400, 0.6, { fx: 1 }), hit(800, 0.9, { fx: 1 })]),
    hx('童子切・百鬼斷', [hit(500, 0.8, { fx: 1 }), hit(900, 1.2, { fx: 1 }), hit(1400, 2.0, { fx: 1, big: 1, r: 120, n: 3 })]),
    hx('鞘打截進', [hit(400, 0.9, { fx: 1, stun: 24 })], { cd: 12 }),
    hx('守勢返太刀', [{ k: 'self', t: 100, dr: 0.5, dur: 0.6 }, hit(800, 1.8, { fx: 1 })], { cd: 22 }),
    hx('斷追護撤', [hit(400, 1.3, { fx: 1, kb: 16 })]),
    hx('童子切・鎮惡門', [hit(700, 3.2, { fx: 1, big: 1, r: 120, n: 3 }), hit(2000, 0.8, { fx: 1 })])], 'R');
  K.takemikazuchi = H13([
    hx('布都三劍', [hit(300, 0.3), hit(560, 0.3), hit(860, 0.45, { fx: 1, charge: 1 })]),
    hx('雷步截影', [hit(500, 1.0, { fx: 1, dash: 50 })], { cd: 12 }),
    hx('天雷直貫', [hit(800, 2.4, { fx: 1, big: 1, lane: 1, r: 220, n: 4, useCharge: 1 })], { cd: 20 }),
    hx('同刃落雷', [hit(500, 1.5, { fx: 1, ranged: 1 })]),
    hx('神降・建御雷', [hit(1200, 4.0, { fx: 1, big: 1, r: 140, n: 4, ranged: 1 })]),
    hx('霹靂追刃', [hit(500, 1.2, { fx: 1, dash: 60 })], { cd: 14 }),
    hx('布都雷貫', [hit(700, 1.4, { fx: 1, lane: 1, r: 220, n: 4 }), hit(1000, 1.4, { fx: 1, ranged: 1, useCharge: 1 })], { cd: 22 }),
    hx('斷空雙雷', [hit(450, 0.6, { fx: 1, ranged: 1 }), hit(900, 0.9, { fx: 1, ranged: 1 })]),
    hx('雷神・一劍天斷', [hit(1500, 4.0, { fx: 1, big: 1, r: 150, n: 4, ranged: 1 })]),
    hx('震足回雷', [hit(400, 0.9, { fx: 1, r: 110, n: 2, stun: 15 })], { cd: 12 }),
    hx('雷鼓定界', [hit(500, 0.6, { fx: 1, ranged: 1, r: 90, n: 3, stun: 24 }), hit(900, 0.6, { ranged: 1, r: 90, n: 3 }), hit(1300, 0.6, { ranged: 1, r: 90, n: 3 })], { cd: 22 }),
    hx('震雷合圍', [hit(450, 1.3, { fx: 1, ranged: 1, r: 110, n: 3 })]),
    hx('神降・鳴雷天網', [hit(700, 1.1, { fx: 1, ranged: 1, r: 140, n: 4, stun: 24 }), hit(1500, 1.1, { ranged: 1, r: 140, n: 4 }), hit(2300, 1.1, { ranged: 1, r: 140, n: 4 })])], 'T');
  K.enno = H13([
    hx('行腳三杖', [hit(300, 0.3, { ranged: 1 }), hit(560, 0.3, { ranged: 1 }), hit(860, 0.45, { fx: 1, ranged: 1 })]),
    hx('錫環牽步', [proj(500, 0.9, { spr: 'ao_glide', hitFx: 'aka_strike', kb: 12 })], { cd: 12 }),
    hx('役靈點脈', [proj(600, 1.7, { spr: 'ao_glide', hitFx: 'aka_strike' }), hit(4600, 0.7, { ranged: 1, after: 1 })], { cd: 20 }),
    hx('同步踏歌', [hit(400, 0.7, { fx: 1, ranged: 1 }), proj(700, 0.8, { spr: 'ao_glide', hitFx: 'aka_strike' })]),
    hx('神通・役靈同行', [hit(900, 2.0, { fx: 1, ranged: 1, lane: 1, r: 240, n: 5 }), hit(1300, 2.0, { ranged: 1, lane: 1, r: 240, n: 5 })]),
    hx('朱行逐影', [proj(500, 1.2, { spr: 'ao_glide', hitFx: 'aka_strike' })], { cd: 14 }),
    hx('役靈穿霞', [proj(700, 2.0, { spr: 'ao_glide', hitFx: 'aka_strike' }), hit(4700, 0.8, { ranged: 1, after: 1 })], { cd: 22 }),
    hx('雙響合杖', [hit(400, 0.6, { fx: 1, ranged: 1 }), proj(800, 0.9, { spr: 'ao_glide', hitFx: 'aka_strike' })]),
    hx('神通・兩界渡', [hit(900, 2.0, { fx: 1, ranged: 1, r: 140, n: 4 }), hit(1500, 2.0, { ranged: 1, r: 140, n: 4 })]),
    hx('風鈴退步', [{ k: 'self', t: 100, dash: -40, dr: 0.2, dur: 0.5 }, hit(500, 0.9, { fx: 1, stun: 24, ranged: 1 })], { cd: 12 }),
    hx('行法・回風路', [{ k: 'zone', t: 600, z: 'haste', dur: 3, r: 90, atHero: 1 }], { cd: 22 }),
    hx('留步合杖', [hit(450, 1.2, { fx: 1, ranged: 1 }), { k: 'armor', t: 450, dur: 2 }]),
    hx('神通・山行護陣', [hit(800, 2.4, { fx: 1, ranged: 1, r: 140, n: 4 }), { k: 'armor', t: 800, dur: 3 }])], 'E');

  /* ---------- 事件結算 ---------- */
  const fxSpawn = (P, name, x, y, face, k) => { const def = PY.DEF[P.id]; let u, r;
    if (def.fx) { u = A.get(def.fx); r = u && u.fx[name]; } else { u = A.get(def.unit(P)); r = u && u.act[def.pre + name]; }
    if (!r) return; const s = G.HERO_H * def.ratio * SC.depth(y) / def.refH(P) * (k || 1);
    G.FX.push({ k: 'spr', u: u.key, r, x, y, face: face || P.face, s: s * 1.1 * 130 / G.HERO_H, glow: 0.4, t: 0, life: Math.max(8, Math.round(A.dur(r) / TK)) }); };
  PY.fxSpawn = fxSpawn;
  const targets = (P, o, cx, cy) => { const n = o.n || 1, r = o.r || 0, L = [];
    if (!r) { const e = alive(P.tg) ? P.tg : null; if (e && (o.ranged || dist(e, P) < PY.DEF[P.id].reach + 46)) L.push(e); return L; }
    for (const e of G.E) { if (!alive(e)) continue; const ok = o.lane ? Math.abs(e.y - P.y) < 34 && (e.x - P.x) * P.face > -10 && Math.abs(e.x - P.x) < r : Math.hypot(e.x - cx, (e.y - cy) * 1.6) < r; if (ok) L.push(e); }
    L.sort((a, b) => dist(a, P) - dist(b, P)); return L.slice(0, n); };
  const lv5 = (P, sid) => PY.nodeLv && PY.nodeLv(P.id, sid) >= 5;
  const control = (e, o) => { if (e.boss || e.bb) { e.brk = (e.brk || 0) + 1; return; }
    if (o.stun) e.stun = Math.max(e.stun || 0, o.stun); if (o.root) e.stun = Math.max(e.stun || 0, o.root);
    if (o.slow) { e.db = e.db || {}; e.db.slow = Math.max(e.db.slow || 0, 1); e.slowT = Math.max(e.slowT || 0, (o.slowT || 2) * 60); }
    if (o.kb) e.kb = (e.kb || 0) + Math.sign(e.x - H.x || 1) * o.kb * 0.4;
    if (o.burn) e.burn = { n: o.burn, t: 60 }; };
  PY.debuffed = () => !!(G.BUFF && G.BUFF.debuffed && G.BUFF.debuffed());
  PY.canHeal = () => !(PY.healWin > 0) && H.hp < H.hpMax;
  const RUN = {
    hit(P, ev, c) { const e0 = alive(c.tg) ? c.tg : P.tg, def = PY.DEF[P.id];
      const cx = ev.ranged && e0 ? e0.x : P.x + P.face * (ev.r ? ev.r * 0.4 : def.reach * 0.6), cy = ev.ranged && e0 ? e0.y : P.y;
      if (ev.dash) { const nx = P.x + P.face * ev.dash; if (SC.walkable(nx, P.y)) P.x = nx; }
      let n = ev.n || 1; if (ev.lv5n && lv5(P, c.sid)) n = ev.lv5n;
      const L = targets(P, Object.assign({}, ev, { n }), cx, cy); let m = ev.m;
      if (ev.useOni && P.oni >= 3) { m *= 1.5; P.oni = 0; } if (ev.useMikiri && P.mikiri) { m *= ev.mkK || 1.4; P.mikiri = 0; } if (ev.useCharge && P.charge >= 3) { m *= ev.chK || 1.5; P.charge = 0; }
      for (const e of L) { const by = e.boss || e.bb ? (e.brk ? 1.15 : 1) : 1; PY.dmg(P, e, m * by / Math.max(1, Math.sqrt(L.length)), { ch: c.ch, big: ev.big, opt: ev.ign || ev.fc ? Object.assign({}, ev.ign ? { ign: ev.ign } : {}, ev.fc ? { crit: 100 } : {}) : null }); control(e, ev);
        if (ev.oni) P.oni = Math.min(3, (P.oni || 0) + 1); if (ev.mikiri) P.mikiri = 1; if (ev.charge) P.charge = Math.min(3, (P.charge || 0) + 1); }
      const fe = L[0] || e0, ax = fe ? fe.x : cx, ay = fe ? fe.y : cy, up = ev.anchor === 'ground' ? 0 : ev.anchor === 'up' ? 0.75 : 0.5;
      if (ev.fx && (L.length || ev.r)) { const nm = typeof ev.fx === 'string' ? ev.fx : c.sk.bfx; fxSpawn(P, nm, ev.ground ? P.x + P.face * 30 : ax, (ev.ground ? P.y : ay) - (ev.ground ? 0 : HH() * up * SC.depth(ay)), P.face, typeof ev.fx === 'string' ? 1 : 0.6); }
      if (ev.fx2 && L.length) fxSpawn(P, ev.fx2, ax, ay - HH() * 0.5, P.face);
      if (L.length) G.SC.shake = Math.max(G.SC.shake, ev.big ? 5 : 2); },
    proj(P, ev, c) { const e = alive(c.tg) ? c.tg : P.tg; if (!e && !ev.pierce) return; const def = PY.DEF[P.id], s = SC.depth(P.y);
      const sx = P.x + P.face * HH() * def.ratio * 0.35, sy = P.y - HH() * def.ratio * s * (def.mz || 0.58) + (ev.dy || 0) * 0.3;
      const tx = e ? e.x : P.x + P.face * 400, ty = e ? e.y : P.y; let m = ev.m; if (ev.useRead && P.read >= 3) { m *= 1.5; P.read = 0; }
      PY.proj.push({ P, ch: c.ch, sid: c.sid, ev, m, x: sx, y: sy, gy: P.y + (ev.dy || 0) * 0.2, vx: Math.sign(tx - sx || P.face) * 9, tg: e, life: 70, hit: new Set(), face: Math.sign(tx - sx || P.face) });
      if (ev.lv5x && lv5(P, c.sid)) PY.proj.push(Object.assign({}, PY.proj[PY.proj.length - 1], { y: sy - 10, hit: new Set(), life: 76 })); },
    guard(P, ev, c) { let n = ev.n; if (ev.lv5n && lv5(P, c.sid)) n = ev.lv5n; PY.hg = { n, t: Math.round(ev.dur * 60), proj: ev.proj, P, fx: ev.fx }; P.taunt = Math.max(P.taunt || 0, 30); },
    taunt(P, ev) { P.taunt = Math.round(ev.dur * 60); let k = 0; for (const e of G.E) if (alive(e) && !e.boss && !e.bb && dist(e, P) < ev.r && (!ev.max || k++ < ev.max)) { e.tgO = P; e.tgT = P.taunt; } },
    mark(P, ev, c) { const e = alive(c.tg) ? c.tg : P.tg; if (!e) return; P.read = 3; e.mk = 360; fxSpawn(P, ev.fx, e.x, e.y - HH() * 0.9, 1, 0.8); },
    self(P, ev) { P.dr = ev.dr || 0; P.drT = Math.round((ev.dur || 1) * 60); if (ev.dash) { const nx = P.x + P.face * ev.dash; if (SC.walkable(nx, P.y)) P.x = nx; } if (ev.fx) fxSpawn(P, ev.fx, P.x + P.face * 16, P.y - HH() * 0.5, P.face); },
    armor(P, ev) { PY.armorT = Math.round(ev.dur * 60); },
    cleanse(P, ev) { if (PY.debuffed() && G.BUFF.cleanse) G.BUFF.cleanse(1); else PY.zones.push({ P, z: 'ward', x: H.x, y: H.y, r: 70, t: 0, life: 150, ev: { dr: 0.1, once: 1 }, hits: new Set() });   // 主角沒有異常：改給 2.5 秒一次 10% 減傷
      fxSpawn(P, ev.fx, H.x, H.y - HH() * 0.5, 1); PY.kpiAdd(P.id, 'cleanse', 1); },
    heal(P, ev, c) { if (ev.win) PY.healWin = 720; const amt = Math.round(H.hpMax * ev.pct / 100 * (PY.nodeMul ? PY.nodeMul(P, c.ch) : 1)), h0 = H.hp;
      if (P.st === 'down' || (ev.echo && P.hurtT > 0)) return;   // 餘音前受擊：未到的後段取消
      H.hp = Math.min(H.hpMax, H.hp + amt); if (H.hp > h0) G.NUMS.push({ x: H.x, y: H.y - HH() - 10, v: '+' + (H.hp - h0), t: 0, heal: true });
      fxSpawn(P, ev.fx, H.x, H.y - HH() * 0.55 * SC.depth(H.y), 1); PY.kpiAdd(P.id, 'heal', H.hp - h0); },
    zone(P, ev, c) { const e = alive(c.tg) ? c.tg : P.tg; const x = ev.atHero ? H.x : ev.atTarget && e ? e.x : ev.z === 'ward' ? H.x : P.x + P.face * 120, y = ev.atHero ? H.y : ev.atTarget && e ? e.y : ev.z === 'ward' ? H.y : P.y;
      if (ev.z === 'ward' || ev.z === 'bind') { for (let i = PY.zones.length - 1; i >= 0; i--) if (PY.zones[i].P === P && (PY.zones[i].z === 'ward' || PY.zones[i].z === 'bind')) PY.zones.splice(i, 1); }   // 一地一印
      const Z = { P, z: ev.z, x, y, r: ev.r || 90, t: 0, life: Math.round(ev.dur * 60), ev, hits: new Set(), sid: c.sid, ch: c.ch }; PY.zones.push(Z);
      if (ev.fx) fxSpawn(P, ev.fx, x, y, 1, (ev.r || 90) / 90);
      if (ev.m) for (const t of targets(P, { r: ev.r, n: ev.max || 3 }, x, y)) PY.dmg(P, t, ev.m, { ch: c.ch, big: 1 }); }
  };
  G.PEV = {
    run(P, ev, c) { const f = RUN[ev.k]; if (f) f(P, ev, c); },
    stepWorld() {
      if (PY.healWin > 0) PY.healWin--; if (PY.armorT > 0) PY.armorT--; if (PY.hg && --PY.hg.t <= 0) PY.hg = null;
      for (const e of G.E) { if (e.slowT > 0 && --e.slowT <= 0 && e.db) e.db.slow = 0; if (e.mk > 0) e.mk--;
        if (e.burn && alive(e) && --e.burn.t <= 0) { e.burn.n--; e.burn.t = 60; const P = PY.list.find(q => q.id === 'ibaraki'); if (P) PY.dmg(P, e, 0.25, { ch: 'burn' }); if (e.burn.n <= 0) e.burn = null; } }
      for (let i = PY.proj.length - 1; i >= 0; i--) { const p = PY.proj[i]; p.life--;
        if (p.tg && alive(p.tg) && !p.ev.pierce) { const dx = p.tg.x - p.x; p.vx = Math.sign(dx || p.vx) * 9; p.gy += (p.tg.y - p.gy) * 0.2; }
        p.x += p.vx; p.y += (p.gy - HH() * 0.55 * SC.depth(p.gy) - p.y) * 0.25;
        for (const e of G.E) { if (!alive(e) || p.hit.has(e) || Math.abs(e.x - p.x) > 26 || Math.abs(e.y - p.gy) > 30) continue;
          p.hit.add(e); PY.dmg(p.P, e, p.m, { ch: p.ch, opt: p.ev.fc ? { crit: 100 } : null }); control(e, p.ev); if (p.ev.read) p.P.read = Math.min(3, (p.P.read || 0) + (p.P.tg === e ? 1 : 0));
          if (p.ev.pull && !e.boss && !e.bb) e.x += Math.sign(p.P.x - e.x) * p.ev.pull;
          if (p.ev.hitFx) fxSpawn(p.P, p.ev.hitFx, p.x, p.y, p.face, 0.8); else if (p.ev.bfx) fxSpawn(p.P, PY.DEF[p.P.id].fx ? '' : G.PKIT[p.P.id][p.sid].bfx, e.x, e.y - HH() * 0.5, p.face, 0.55);
          if (!p.ev.pierce || p.hit.size > p.ev.pierce) { p.life = 0; break; } }
        if (p.life <= 0 || !SC.walkable(p.x, p.gy) && p.life < 60) PY.proj.splice(i, 1); }
      for (let i = PY.zones.length - 1; i >= 0; i--) { const Z = PY.zones[i]; Z.t++;
        if (Z.z === 'bind' || Z.z === 'frost' || Z.z === 'lane') for (const e of G.E) { if (!alive(e) || Z.hits.size >= (Z.ev.max || 6) && !Z.hits.has(e)) continue;
          const inside = Z.z === 'lane' ? Math.abs(e.y - Z.y) < 40 && Math.abs(e.x - Z.x) < (Z.r * 1.8) : Math.hypot(e.x - Z.x, (e.y - Z.y) * 1.6) < Z.r;
          if (!inside) continue; if (Z.ev.slow) control(e, { slow: Z.ev.slow, slowT: 0.5 });
          if (!Z.hits.has(e)) { Z.hits.add(e); if (Z.ev.root) control(e, { root: Z.ev.root }); if (Z.ev.freeze && e.slowT > 0) { control(e, { stun: Z.ev.freeze }); if (Z.ev.freezeFx) fxSpawn(Z.P, Z.ev.freezeFx, e.x, e.y - HH() * 0.4, 1, 0.8); } } }
        if (Z.z === 'haste' && Math.hypot(H.x - Z.x, (H.y - Z.y) * 1.6) < Z.r && !Z.used) { Z.used = 1; if (G.BUFF && G.BUFF.add) G.BUFF.add('spd', Z.ev.spd || 10, 120); }
        if (Z.t >= Z.life) PY.zones.splice(i, 1); }
    },
    /* 主角受傷前：白丸護擋／葛葉護印／自身減傷 */
    heroTaken(d, src, isProj) { if (PY.hg && PY.hg.n > 0 && (!PY.hg.proj || isProj)) { const g = PY.hg; g.n--; fxSpawn(g.P, g.fx, H.x + H.face * 16, H.y - HH() * 0.5, H.face); PY.kpiAdd(g.P.id, 'block', d); if (g.n <= 0) PY.hg = null; return 0; }
      for (const Z of PY.zones) if (Z.z === 'ward' && Math.hypot(H.x - Z.x, (H.y - Z.y) * 1.6) < Z.r + 10) { const r = Math.round(d * Z.ev.dr); PY.kpiAdd(Z.P.id, 'ward', r); if (Z.ev.once) Z.t = Z.life; return d - r; }
      const sh = PY.list.find(p => p.id === 'shiro' && p.st !== 'down'); if (sh && Math.hypot(H.x - sh.x, H.y - sh.y) < 90) { const r = Math.round(d * 0.15); PY.kpiAdd('shiro', 'share', r); return d - r; }
      return d; },
    drawZones() { const ctx = G.ctx;
      for (const Z of PY.zones) { const q = Z.t / Z.life, a = Math.min(1, Z.t / 10, (Z.life - Z.t) / 20) * 0.5, col = { ward: '255,226,150', bind: '235,90,90', frost: '150,220,255', lane: '170,240,200', haste: '170,240,200', tether: '170,240,200' }[Z.z] || '255,255,255';
        /* r3.104.2：不畫外框線——柔邊漸層貼地＋法陣素材（壓扁貼地、緩慢呼吸） */
        const rx = Z.z === 'lane' ? Z.r * 1.8 : Z.r, ry = Z.z === 'lane' ? 40 : Z.r / 1.6, br = 1 + 0.03 * Math.sin(G.t * 0.07 + Z.x);
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(Z.x, Z.y); ctx.scale(1, ry / rx); const g = ctx.createRadialGradient(0, 0, rx * 0.15, 0, 0, rx * br);
        g.addColorStop(0, `rgba(${col},${a * 0.05})`); g.addColorStop(0.72, `rgba(${col},${a * 0.2})`); g.addColorStop(1, `rgba(${col},0)`); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, rx * br, 0, 6.283); ctx.fill(); ctx.restore();
        if (Z.z !== 'lane' && G.VX && G.VX.draw2) G.VX.draw2(ctx, Z.z === 'bind' || Z.z === 'frost' ? 'fx_sigil_onmyo' : 'fx_sigil_shrine', 0, Z.x, Z.y, rx / (G.HERO_H * SC.depth(Z.y)) * 0.9 * br, { add: 1, a: a * 0.55, sy: 0.42 }); } },   // 區域外框：特效播完後仍看得出有效範圍（畫在角色下面）
    drawProj() { const ctx = G.ctx; for (const p of PY.proj) { const def = PY.DEF[p.P.id]; let u, r;
        if (def.fx) { u = A.get(def.fx); r = u && u.fx[p.ev.fx]; } else if (p.ev.spr) { u = A.get(def.unit(p.P)); r = u && u.act[def.pre + p.ev.spr]; }
        if (u && r) { const fr = A.frameAt(Object.assign({}, r, { loop: true }), (70 - p.life) * TK), s = G.HERO_H * def.ratio * SC.depth(p.gy) / def.refH(p.P) * 0.75; A.draw(u, fr, p.x, p.y + fr[5] * s * 0.5 - fr[3] * s * 0.5, s, p.face < 0); }
        else { ctx.fillStyle = 'rgba(255,240,200,.9)'; ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, 6.283); ctx.fill(); ctx.fillStyle = 'rgba(255,220,140,.35)'; ctx.beginPath(); ctx.arc(p.x - p.vx, p.y, 8, 0, 6.283); ctx.fill(); } } }
  };
  PY.heroTaken = G.PEV.heroTaken;
})();
