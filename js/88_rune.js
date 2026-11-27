/* ==========================================================================
 * 神諭之地 重製版 — 88_rune.js
 * Version : r3.197.0  (2026-11-28)　r3.197.0：靈紋／套裝／神器改播手繪素材（風刃、叢雲、斬月、震地、落雷、感電、潮浪、狐火、鬼火、穿雲、鏡返、日鏡、勾玉光線、凍結）；新增手繪素材播放器 G.AFX
 * 舊版    : r3.196.0  (2026-11-28)　r3.196.0：靈紋／套裝／神器的幾何圖形全部換成有主題的分層畫法（風刃、斬月、震地、落雷、狐火、光箭、感電、破甲、鏡返、潮浪、鬼火、天光、日鏡、勾玉光線）
 * 舊版    : r3.195.0  (2026-11-28)　r3.195.0：霜結腳下的藍色實線圈改成霜霧
 * 舊版    : r3.166.0  (2026-11-27)　r3.166.0：冰緩狀態不再畫整片白色橢圓 → 身邊飄冰晶＋腳下淡藍霜圈
 * 舊版    : r3.107.2  (2026-11-26)　r3.107.2：吸魂特效改成「被吸過來」：12 縷柔光粒子錯開、螺旋加速吸進胸口＋拖尾，取代一整顆圓球
 * 舊版    : r3.94.0  (2026-11-26)　r3.94.0：觸發改每次出手 1 次＋內部冷卻（雷鳴 1 秒、燃燒／冰霜同目標 0.5 秒）
 * 舊版    : r3.82.0  (2026-11-25)　r3.82.0：燃燒畫法改走 G.FLAMES（117 換成火星）　r3.63.0：強化 +20 的裝備靈紋 +1 級　r3.59.0：r3.59.0：燃燒改成身上火苗（原本是地面火圈）　r3.57.0：RUNE.lines 給物品卡折疊區
 * 舊版    : r3.43.1  (2026-11-18)　r3.43.1：護法光環改用結界光罩
 * 舊版    : r3.40.0  (2026-11-18)
 * 變更    : r3.40.0 新增。靈紋 16 種、套裝 4 件招式 8 種、三神器 4 種、狀態異常（燃燒／冰凍／感電／破甲）、爆氣、增益圖示。
 *           ・公式：傷害＝主角攻擊 × 係數 × 靈紋等級倍率（Lv1 ×1.0／Lv2 ×1.3／Lv3 ×1.7）；可會心；不吃技能倍率與連段加成；敵防、難度照常。
 *             實作：G.damageOni(e, 係數×等級倍率, …, { rune: 1 })；rune 傷害不會再觸發靈紋（避免連鎖爆量）。
 *           ・靈紋：傳說裝備 1 條（Lv1～2）、神話 2 條（Lv2～3）；不佔原詞綴；同名取高等級。舊存檔的傳說／神話裝備第一次讀到時補上（it.rn）。
 *           ・套裝：原 2／4 件數值不變，4 件再多一招（合戰「陽陣」留待合戰）。
 *           ・三神器：草薙劍（叢雲）、八咫鏡（日鏡）、八尺瓊勾玉（勾玉輪）、三件全帶（天照）。
 *           ・素材：x2_ling（紙鶴／紙狐／紙人、勾玉、黃泉之手、日鏡、冰殼）、x2_core（燃燒、光柱、法陣、命中）、x2_ui（增益圖示）、
 *             菁英氣紋（a/p/aura_*.webp，由 89_obj 載入）當爆氣光焰。
 *           ・護法童子：飛行物不好逐一辨識，改為 6 秒減傷 50%＋日鏡護盾（效果等同擋下大部分遠程傷害）。
 * 依賴    : 07_rpg（SETS／QUAL／recalc／S）、15_skill（G.BUFF）、03_actors（damageOni／hurtHero／drawFx／fxStep）、
 *           76_vfx／84_fxkit／86_fx2（VX.*）、13_weapons（G.WPN）、08_menu（itemCard 呼叫 G.RUNE.card）。
 * 存檔    : rpg.eq／bag 裡的裝備多一個欄位 rn＝[[靈紋id, 等級], …]。
 * ========================================================================== */
'use strict';
(function () {
  const R = G.RPG, VX = G.VX, SC = G.SC, H = G.H, A = G.ANIM, HH = () => G.HERO_H, S = y => SC.depth(y), TAU = 6.2832, ctx = G.ctx;
  /* r3.107.2：吸魂——魂從敵人身上被抽出、一縷一縷螺旋吸進主角胸口（12 顆柔光粒子錯開出發、加速、帶拖尾），最後在胸口亮一下；不再是一整顆圓球飛過來 */
  function soulDraw(o, hz) { const L = o.life - 12, tx = H.x, ty = H.y - hz * 0.55, c = '190,160,255', c2 = '235,225,255'; ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 12; i++) { const d0 = i * 1.4, sd = o.sd + i * 0.53, ox = Math.cos(sd) * hz * 0.22, oy = Math.sin(sd * 1.7) * hz * 0.18, sx = o.x + ox, sy = o.y + oy, side = (i % 2 ? 1 : -1) * hz * (0.35 + 0.1 * (i % 3));
      for (let k = 0; k < 7; k++) { const q = Math.max(0, Math.min(1, (o.t - d0 - k * 0.6) / L)); if (q <= 0 || q >= 1) continue; const e = q * q * (3 - 2 * q), u = e * e,   // 先慢後快
          mx = (sx + tx) / 2 - (ty - sy) / Math.hypot(tx - sx, ty - sy || 1) * side, my = (sy + ty) / 2 + (tx - sx) / Math.hypot(tx - sx, ty - sy || 1) * side * 0.5,
          x = (1 - u) * (1 - u) * sx + 2 * (1 - u) * u * mx + u * u * tx, y = (1 - u) * (1 - u) * sy + 2 * (1 - u) * u * my + u * u * ty, r = hz * (0.05 - k * 0.005) * (1 - u * 0.5), a = (1 - k * 0.13) * Math.min(1, q * 6) * (1 - Math.max(0, u - 0.85) / 0.15);
        const g = ctx.createRadialGradient(x, y, 0, x, y, r * 2.2); g.addColorStop(0, 'rgba(' + c2 + ',' + 0.85 * a + ')'); g.addColorStop(0.35, 'rgba(' + c + ',' + 0.45 * a + ')'); g.addColorStop(1, 'rgba(' + c + ',0)'); ctx.fillStyle = g; ctx.fillRect(x - r * 2.2, y - r * 2.2, r * 4.4, r * 4.4); } }
    const sq = Math.max(0, (o.t - o.life + 14) / 14); if (sq > 0) { const R = hz * (0.25 + 0.2 * sq), a = Math.sin(sq * Math.PI), g = ctx.createRadialGradient(tx, ty, 0, tx, ty, R); g.addColorStop(0, 'rgba(' + c2 + ',' + 0.5 * a + ')'); g.addColorStop(1, 'rgba(' + c + ',0)'); ctx.fillStyle = g; ctx.fillRect(tx - R, ty - R, R * 2, R * 2); }
    const fq = Math.max(0, 1 - o.t / 10); if (fq > 0) { const R = hz * 0.3, g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, R); g.addColorStop(0, 'rgba(' + c + ',' + 0.35 * fq + ')'); g.addColorStop(1, 'rgba(' + c + ',0)'); ctx.fillStyle = g; ctx.fillRect(o.x - R, o.y - R, R * 2, R * 2); }
    ctx.restore(); }
  if (!R || !VX) return;
  const rnd = (a, b) => a + Math.random() * (b - a), ri = (a, b) => Math.floor(rnd(a, b + 1)), sec = s => Math.round(s * 60);
  const BUF = () => G.BUFF;
  /* ======================= 資料 ======================= */
  const RN = {
    kaze: { n: '風刃', c: '#9fe8d0', d: '收尾時放出風刃 120%，貫穿', cd: 2 },
    rai: { n: '落雷', c: '#cfe0ff', d: '命中 12% 落雷 150%，再連到 2 隻各 60%', cd: 1 },
    shin: { n: '震地', c: '#e0c08a', d: '重擊／收尾時震地 140%，把敵人震起', cd: 4 },
    zan: { n: '斬月', c: '#fff0c0', d: '收尾時斬出月弧 160%', cd: 3 },
    un: { n: '穿雲', c: '#e8f4ff', d: '弓、鐵砲每 5 次命中射出追蹤箭 80%', cd: 0 },
    kon: { n: '吸魂', c: '#c8a8ff', d: '擊殺時回復最大血量 3%', cd: 0.5 },
    tsuru: { n: '紙鶴', c: '#f4efe0', d: '3 隻紙鶴環繞，每 1.2 秒啄擊 35%', cd: 0 },
    kitsu: { n: '紙狐', c: '#ffd9a0', d: '1 隻紙狐跟隨，每 1.5 秒撲咬 70%', cd: 0 },
    mi: { n: '紙人替身', c: '#f0e6d8', d: '受到致命傷時免死一次，留 1 點血', cd: 90 },
    goho: { n: '護法童子', c: '#ffe6a0', d: '血量低於 50% 時張開護盾，6 秒減傷 50%', cd: 30 },
    en: { n: '燃燒', c: '#ff9a60', d: '命中 20% 點燃：每秒 20%，4 秒，最多 3 層', cd: 0 },
    hyo: { n: '冰凍', c: '#a8e4ff', d: '命中加 1 層霜，3 層凍住 1.5 秒（頭目變慢 40%）', cd: 0 },
    den: { n: '感電', c: '#d8d0ff', d: '命中 15% 感電：下次受擊 +90%，並跳到旁邊 45%', cd: 0 },
    ha: { n: '破甲', c: '#ffb0a0', d: '重擊使敵人防禦 −20%，5 秒', cd: 0 },
    ikari: { n: '怒氣爆發', c: '#ff7a5a', d: '血量低於 30% 爆氣 8 秒：攻擊 +25%、攻速 +20%，結束震波 200%', cd: 60 },
    toki: { n: '鬥氣', c: '#ffcf70', d: '連段 30 下爆氣 5 秒：攻擊 +15%', cd: 30 }
  };
  const IDS = Object.keys(RN), LVM = [0, 1.0, 1.3, 1.7];
  const SETM = { wind: ['風球環繞', '3 顆風球環繞，碰到敵人 100%，8 秒補滿'], mirror: ['鏡返', '閃避成功時反擊 180%（3 秒）'], foxfire: ['狐火', '會心時放出 3 團追蹤狐火，各 60%（2 秒）'],
    thunder: ['雷陣', '每 10 秒連劈 3 道落雷，各 120%'], onibi: ['鬼火爆', '擊殺後原地爆炸 150%，半徑 1.5 身高'], tide: ['潮浪', '每 8 秒掀起潮浪 130%，推開敵人'],
    yomi: ['黃泉之手', '對血量低於 20% 的敵人 250%（同一隻 6 秒）'], tenmon: ['天光', '每第 10 次命中降下光柱 300%'] };
  const JG = { akaorochi: ['叢雲', '收尾揮出 8 身高長的巨大風斬 400%（6 秒）'], komakin: ['日鏡', '受致命傷時改成反射光束 500%，免死（60 秒）'], kinhannya: ['勾玉輪', '3 顆勾玉環繞，每 2 秒射光線各 50%'] };
  const JG3 = ['天照', '三神器都在身上（草薙劍＋一件神器御守裝備，另一件在背包）：每 30 秒光柱雨 10 道各 200%'];
  /* ---------- 靈紋配給（傳說 1、神話 2；舊裝備補上） ---------- */
  function ensure(it) { if (!it || it.rn !== undefined) return it; if (it.q < 4) { it.rn = 0; return it; }
    const n = it.q >= 5 ? 2 : 1, pool = IDS.slice(), out = [];
    for (let i = 0; i < n; i++) { const k = pool.splice(ri(0, pool.length - 1), 1)[0]; out.push([k, it.q >= 5 ? ri(2, 3) : ri(1, 2)]); }
    it.rn = out; G.SAVE.markDirty(); return it; }
  const mk0 = R.make.bind(R); R.make = function () { return ensure(mk0.apply(this, arguments)); };
  /* 目前生效：靈紋（同名取高）、套裝 4 件、三神器 */
  const ON = { rn: {}, set: {}, jg: {}, jg3: false };
  function scan() { const d = R.d(); ON.rn = {}; ON.set = {}; ON.jg = {}; let nj = 0; if (!d || !d.eq) return;
    const cnt = {}; for (const k of R.SLOT) { const it = d.eq[k]; if (!it) continue; ensure(it); if (it.rn) for (const [id, lv] of it.rn) ON.rn[id] = Math.max(ON.rn[id] || 0, Math.min(3, lv + ((it.en || 0) >= 20 ? 1 : 0)));   // r3.63.0：強化 +20 靈紋 +1 級（最高 3）
      if (it.set) cnt[it.set] = (cnt[it.set] || 0) + 1; const t = R.TPL[it.t]; if (t && t.jingi && !ON.jg[t.jingi]) { ON.jg[t.jingi] = 1; nj++; } }
    for (const k in cnt) if (cnt[k] >= 4 && SETM[k]) ON.set[k] = 1;
    // 八咫鏡與勾玉都是御守，只能戴一件 → 天照：草薙劍＋一件神器御守裝備中，另一件放在背包（三件都在身上）
    const own = new Set(); for (const it of (d.bag || []).concat(Object.values(d.eq))) { const t = it && R.TPL[it.t]; if (t && t.jingi) own.add(t.jingi); } ON.jg3 = nj >= 2 && own.size >= 3; }
  const rc0 = R.recalc.bind(R); R.recalc = function () { const r = rc0.apply(this, arguments); try { scan(); } catch (e) { console.warn('rune', e); } return r; };
  /* ---------- 物品卡：靈紋／套裝招式／神器招式 ---------- */
  /* r3.57.0：給物品卡折疊區用——回傳 [文字, 顏色]，由卡片自行換行 */
  function lines(it) { ensure(it); const L = [];
    if (it.rn && it.rn.length) for (const [id, lv] of it.rn) { const r = RN[id]; L.push(['◆ ' + r.n + ' Lv' + lv + '：' + r.d + (r.cd ? '（' + r.cd + ' 秒）' : ''), r.c]); }
    if (it.set && SETM[it.set]) L.push(['4 件招式・' + SETM[it.set][0] + '：' + SETM[it.set][1], ON.set[it.set] ? '#f3d98a' : '#9a8f7c']);
    const t = R.TPL[it.t]; if (t && t.jingi && JG[t.jingi]) { L.push(['神器招式・' + JG[t.jingi][0] + '：' + JG[t.jingi][1], '#ffe28a']); L.push([JG3[0] + '：' + JG3[1], ON.jg3 ? '#ffe28a' : '#9a8f7c']); }
    return L; }
  function card(it, x, yy, w, L) { ensure(it); const T = (t, c, s, xx) => G.txt(t, xx || x + 16, yy, s || 11, c, 'left', G.FONT, 600);
    if (it.rn && it.rn.length) { yy += 2; T('靈紋', '#c8a8ff', 12); yy += L; for (const [id, lv] of it.rn) { const r = RN[id]; T('◆ ' + r.n + ' Lv' + lv + '：' + r.d + (r.cd ? '（' + r.cd + ' 秒）' : ''), r.c, 10.5, x + 22); yy += L; } }
    if (it.set && SETM[it.set]) { T('4 件招式・' + SETM[it.set][0] + '：' + SETM[it.set][1], ON.set[it.set] ? '#f3d98a' : '#9a8f7c', 10.5, x + 22); yy += L; }
    const t = R.TPL[it.t]; if (t && t.jingi && JG[t.jingi]) { T('神器招式・' + JG[t.jingi][0] + '：' + JG[t.jingi][1], '#ffe28a', 10.5, x + 22); yy += L; T(JG3[0] + '：' + JG3[1], ON.jg3 ? '#ffe28a' : '#9a8f7c', 10.5, x + 22); yy += L; }
    return yy; }

  /* ======================= 共用 ======================= */
  const lvOf = id => ON.rn[id] || 0;
  const CD = {}, ready = (k, s) => { if ((CD[k] || 0) > G.t) return false; CD[k] = G.t + sec(s); return true; };
  const alive = e => e && e.st !== 'dead' && e.hp > 0 && e.alpha !== 0 && !(e.head && /^(sleep|cut|wake)$/.test(e.s));
  const foes = () => { const L = G.E.filter(alive), hd = L.some(e => e.head); return hd ? L.filter(e => e.head || !e.bb) : L; };
  const near = (x, y, r) => foes().filter(e => Math.hypot(e.x - x, (e.y - y) * 1.4) < r);
  const nearest = (x, y, r, ex) => { let b = null, bd = r || 1e9; for (const e of foes()) { if (ex && ex.includes(e)) continue; const d = Math.hypot(e.x - x, (e.y - y) * 1.4); if (d < bd) { bd = d; b = e; } } return b; };
  const chest = e => e.y - HH() * (e.ratio || 1) * S(e.y) * 0.55;
  function dmg(e, coef, big, o) { if (!alive(e)) return; G.damageOni(e, coef, !!big, false, Object.assign({ rune: 1 }, o || {})); }
  const RD = (e, id, coef, big) => dmg(e, coef * LVM[lvOf(id) || 1], big);
  const s2 = (n, o) => VX.s2 && VX.s2(n, o);
  ['x2_ling', 'x2_ui'].forEach(k => (function w() { if (!A.IDX || !VX.x2) return setTimeout(w, 200); VX.x2(k); })());
  /* 自己的實體：投射物／召喚物（fxStep 更新、drawFx 繪製） */
  const E = []; G.RUNE = { RN, SETM, JG, ON, ensure, card, lines, scan, E, burn, frost, shock, armor };   // r3.59.0：狀態函式給夥伴版靈紋（99_partner6）

  /* ======================= 狀態異常 ======================= */
  function burn(e) { const s = e.st2 = e.st2 || {}; s.bn = Math.min(3, (s.bn || 0) + 1); s.bnT = sec(4); }
  function frost(e) { const s = e.st2 = e.st2 || {}; if ((s.frzCd || 0) > G.t) return; s.fr = (s.fr || 0) + 1; s.frT = sec(4);
    if (s.fr >= 3) { KU('moon', () => { const K2 = G.KF; K2.burst(e.x, e.y, 0.5 * (e.ratio || 1), 2.2); K2.puff(e.x, e.y, 1.2); K2.glint(e.x, e.y, 0.6 * (e.ratio || 1), 0.5, 12); }); { const k = HH() * S(e.y) * (e.ratio || 1); AFX.play('p_shion_fx', 'freeze_snap', { x: e.x, y: e.y + k * 0.05, size: k * 1.7, by: 'h', anc: 'b', tpf: 4 }); }   /* r3.197.0：凍結瞬間＝夥伴紫苑的手繪冰牙合攏 */ if (!AFX.ok('p_shion_fx', 'freeze_snap')) KFa(22, 'o', (c2, u) => { const k = HH() * S(e.y) * (e.ratio || 1); for (let i = 0; i < 7; i++) { const an = i * 0.9 + 0.3, d = k * (0.2 + 0.5 * Math.min(1, u / 10)); snow(c2, e.x + Math.cos(an) * d, e.y - k * 0.5 + Math.sin(an) * d * 0.8, k * 0.07, u * 0.1 + i, 1 - u / 22); } }); s.fr = 0; s.frz = sec(1.5);   /* r3.196.0：凍住的瞬間白霜炸開＋雪花 */ s.frzCd = G.t + sec(6); s.frBig = !!e.bb; G.UI.toast && 0; } }
  function shock(e) { const s = e.st2 = e.st2 || {}; s.sk = sec(6); }
  function armor(e) { e.db = e.db || {}; e.db.def = Math.max(e.db.def || 0, 20); e.db.defT = Math.max(e.db.defT || 0, sec(5)); (e.st2 = e.st2 || {}).ha = sec(5); }
  G.STAT2 = { burn, frost, shock, armor };
  function statusStep() { for (const e of G.E) { const s = e.st2; if (!s) continue; if (e.st === 'dead') { e.st2 = null; continue; }
      if (s.bnT > 0) { s.bnT--; if (s.bnT % 60 === 0) dmg(e, 0.2 * s.bn * LVM[lvOf('en') || 1]); if (!s.bnT) s.bn = 0; }
      if (s.frT > 0 && --s.frT === 0) s.fr = 0;
      if (s.frz > 0) { s.frz--; if (!s.frz) s2('fx_ice_shell_break', { x: e.x, y: e.y - HH() * S(e.y) * 0.6, k: Math.max(0.8, (e.ratio || 1) * 0.9), life: 20 }); }
      if (s.sk > 0) s.sk--; if (s.ha > 0) s.ha--; } }
  // 冰凍：一般敵人停住；頭目變慢 40%（跳過 40% 的格）
  const os0 = G.oniStep; G.oniStep = function (e) { const s = e.st2; if (s && s.frz > 0) { if (!s.frBig) { if (e.flash > 0) e.flash--; return; } s.acc = (s.acc || 0) + 0.6; if (s.acc < 1) return; s.acc -= 1; } return os0(e); };
  /* r3.59.0：燃燒＝身上 2～4 簇火苗往上竄＋身體橘紅閃爍（G.FLAMES 供茨木灼燒共用） */
  function flames(e, n) { const h = HH() * (e.ratio || 1) * S(e.y), t = G.t; ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const a0 = 0.18 + 0.08 * Math.sin(t * 0.3); ctx.fillStyle = 'rgba(255,110,40,' + a0 + ')'; ctx.beginPath(); ctx.ellipse(e.x, e.y - h * 0.5, h * 0.24, h * 0.42, 0, 0, TAU); ctx.fill();
    for (let i = 0; i < Math.min(4, n); i++) { const ph = (t * 0.045 + i * 0.37 + (e._fs || (e._fs = Math.random()))) % 1, ox = Math.sin(i * 2.1 + (e._fs * 9)) * h * 0.16, by = e.y - h * (0.25 + 0.18 * i % 0.55),
        x = e.x + ox + Math.sin(t * 0.2 + i) * 2, y = by - ph * h * 0.35, sz = h * 0.17 * (1 - ph * 0.5), al = (1 - ph) * 0.9;
      const g = ctx.createRadialGradient(x, y, 0, x, y, sz * 1.6); g.addColorStop(0, 'rgba(255,240,170,' + al + ')'); g.addColorStop(0.45, 'rgba(255,140,40,' + al * 0.8 + ')'); g.addColorStop(1, 'rgba(200,40,10,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x, y - sz * 2.2); ctx.quadraticCurveTo(x + sz * 1.1, y - sz * 0.2, x, y + sz * 0.9); ctx.quadraticCurveTo(x - sz * 1.1, y - sz * 0.2, x, y - sz * 2.2); ctx.fill(); }
    ctx.restore(); }
  G.FLAMES = flames;
  function frostMotes(e, k, n) { const sc = S(e.y), h = HH() * (e.ratio || 1) * sc, t = G.t, seed = e._fs || (e._fs = Math.random()), m = Math.min(5, 2 + n);
    ctx.save(); { const rx = h * 0.42 * k; ctx.save(); ctx.translate(e.x, e.y); ctx.scale(1, 0.3); const gg = ctx.createRadialGradient(0, 0, 0, 0, 0, rx); gg.addColorStop(0, 'rgba(225,245,255,' + (0.3 + 0.08 * n) + ')'); gg.addColorStop(0.6, 'rgba(170,220,255,' + (0.16 + 0.05 * n) + ')'); gg.addColorStop(1, 'rgba(170,220,255,0)'); ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(0, 0, rx, 0, TAU); ctx.fill(); ctx.restore(); }   /* r3.195.0：腳下不畫藍色實線圈，改一小片霜霧（層數越多越濃） */
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < m; i++) { const a = t * 0.035 + i * TAU / m + seed * 6, ph = (t * 0.012 + i * 0.29 + seed) % 1, x = e.x + Math.cos(a) * h * 0.28 * k, y = e.y - h * (0.15 + 0.7 * ph), r = (2.2 + (i % 2)) * Math.max(0.7, sc), al = Math.sin(ph * Math.PI) * 0.9;
      ctx.strokeStyle = 'rgba(150,215,255,' + al + ')'; ctx.lineWidth = 1; ctx.beginPath();
      for (let j = 0; j < 3; j++) { const b = j * Math.PI / 3 + a * 0.5; ctx.moveTo(x - Math.cos(b) * r, y - Math.sin(b) * r); ctx.lineTo(x + Math.cos(b) * r, y + Math.sin(b) * r); } ctx.stroke(); }
    ctx.restore(); }
  /* ====================== r3.196.0 靈紋／套裝／神器／名物 美術元件 ======================
   * 原則：每個效果至少三層（深色收邊、主色漸層、高光），形狀有主題（狐臉火、浪頭、鏡片、裂盾…），不用單色圓／環／直線當主體。 */
  const KU = (pal, fn) => { try { if (G.KF && G.KF.use) G.KF.use(pal, fn); } catch (x) { console.warn('rfx', x); } }, KFa = (life, layer, draw, step) => { try { return G.KF && G.KF.add && G.KF.add(life, layer, draw, step); } catch (x) {} };
  const rgb = (c, a) => 'rgba(' + c + ',' + Math.max(0, Math.min(1, a)).toFixed(3) + ')';
  const PALF = { fox: ['70,24,6', '255,150,50', '255,220,140', '255,252,235'], kyubi: ['16,36,96', '90,170,255', '190,235,255', '255,255,255'], oni: ['30,10,60', '150,90,255', '170,255,200', '240,255,245'], sake: ['70,10,10', '220,60,50', '255,150,110', '255,230,210'], mura: ['24,4,10', '150,20,40', '230,70,80', '255,200,200'] };
  /* 帶臉的火（狐火／鬼火）：頭朝 ang 方向，後面拖一條會擺動的尾焰；face=1 畫狐耳與眼 */
  function wisp(c2, x, y, ang, k, pal, a, face, ph) { const P4 = PALF[pal] || PALF.fox, fl = 1 + 0.18 * Math.sin(G.t * 0.7 + (ph || 0)), wg = Math.sin(G.t * 0.45 + (ph || 0)) * 0.35; c2.save(); c2.translate(x, y); c2.rotate(ang); c2.globalAlpha *= a; { const gg = c2.createRadialGradient(0, 0, 0, 0, 0, k * 2.6); gg.addColorStop(0, rgb(P4[1], 0.45)); gg.addColorStop(1, rgb(P4[1], 0)); c2.fillStyle = gg; c2.beginPath(); c2.arc(0, 0, k * 2.6, 0, TAU); c2.fill(); }
    const body = (sc, col, al) => { c2.fillStyle = rgb(col, al); c2.beginPath(); c2.moveTo(-k * 0.2, -k * 0.62 * sc); c2.bezierCurveTo(k * 0.5 * sc, -k * 0.7 * sc, k * 0.95 * sc, -k * 0.3 * sc, k * 0.95 * sc, 0); c2.bezierCurveTo(k * 0.95 * sc, k * 0.3 * sc, k * 0.5 * sc, k * 0.7 * sc, -k * 0.2, k * 0.62 * sc);
      c2.bezierCurveTo(-k * 1.2 * fl, k * 0.5 * sc + wg * k, -k * 2.0 * fl, -k * 0.2 * sc + wg * k * 1.4, -k * 3.2 * sc * fl, wg * k * 2); c2.bezierCurveTo(-k * 2.0 * fl, k * 0.1 * sc + wg * k * 1.2, -k * 1.2 * fl, -k * 0.6 * sc + wg * k, -k * 0.2, -k * 0.62 * sc); c2.fill(); };   /* 圓頭＋一條會擺動的 S 形尾焰 */
    body(1.25, P4[0], 0.5); if (face) for (const sd of [-1, 1]) { c2.fillStyle = rgb(P4[1], 0.95); c2.beginPath(); c2.moveTo(k * 0.05, sd * k * 0.5); c2.quadraticCurveTo(k * 0.3, sd * k * 1.05, k * 0.62, sd * k * 0.98); c2.quadraticCurveTo(k * 0.55, sd * k * 0.6, k * 0.5, sd * k * 0.4); c2.fill(); }
    body(1, P4[1], 0.95); body(0.72, P4[2], 1); body(0.4, P4[3], 1);
    if (face) { c2.fillStyle = rgb(P4[0], 0.9); for (const sd of [-1, 1]) { c2.beginPath(); c2.ellipse(k * 0.4, sd * k * 0.26, k * 0.16, k * 0.055, sd * 0.5, 0, TAU); c2.fill(); } }
    c2.restore(); }
  /* 光箭：金白箭身＋箭羽＋深色收邊，朝 ang 飛 */
  function lightArrow(c2, x, y, ang, k, a) { c2.save(); c2.translate(x, y); c2.rotate(ang); c2.globalAlpha *= a; const sh = (w, l, col, al) => { c2.fillStyle = rgb(col, al); c2.beginPath(); c2.moveTo(k * 1.2, 0); c2.lineTo(k * 0.5, -w); c2.lineTo(-l, -w * 0.35); c2.lineTo(-l, w * 0.35); c2.lineTo(k * 0.5, w); c2.closePath(); c2.fill(); };
    sh(k * 0.3, k * 3.2, '70,44,10', 0.5); sh(k * 0.2, k * 3, '255,206,120', 0.95); sh(k * 0.09, k * 2.2, '255,252,240', 1); for (const sd of [-1, 1]) { c2.fillStyle = rgb('255,236,180', 0.9); c2.beginPath(); c2.moveTo(-k * 1.6, 0); c2.lineTo(-k * 2.6, sd * k * 0.55); c2.lineTo(-k * 2.2, 0); c2.fill(); } c2.restore(); }
  /* 黑羽／水滴／雪花／甲片（小圖示都帶收邊與高光） */
  function feather(c2, x, y, rot, k, a, col) { c2.save(); c2.translate(x, y); c2.rotate(rot); c2.globalAlpha *= a; c2.fillStyle = rgb('8,8,14', 0.6); c2.beginPath(); c2.moveTo(-k * 1.1, 0); c2.quadraticCurveTo(0, -k * 0.5, k * 1.1, 0); c2.quadraticCurveTo(0, k * 0.5, -k * 1.1, 0); c2.fill();
    c2.fillStyle = rgb(col || '34,36,52', 1); c2.beginPath(); c2.moveTo(-k, 0); c2.quadraticCurveTo(0, -k * 0.38, k, 0); c2.quadraticCurveTo(0, k * 0.38, -k, 0); c2.fill(); c2.strokeStyle = rgb('170,180,210', 0.8); c2.lineWidth = Math.max(0.6, k * 0.07); c2.beginPath(); c2.moveTo(-k, 0); c2.lineTo(k, 0); c2.stroke(); c2.restore(); }
  function droplet(c2, x, y, k, a) { c2.save(); c2.translate(x, y); c2.globalAlpha *= a; const sh = (sc, col, al) => { c2.fillStyle = rgb(col, al); c2.beginPath(); c2.moveTo(0, -k * 1.5 * sc); c2.bezierCurveTo(k * 0.9 * sc, -k * 0.2 * sc, k * 0.8 * sc, k * 0.9 * sc, 0, k * 0.9 * sc); c2.bezierCurveTo(-k * 0.8 * sc, k * 0.9 * sc, -k * 0.9 * sc, -k * 0.2 * sc, 0, -k * 1.5 * sc); c2.fill(); };
    sh(1.25, '14,50,70', 0.5); sh(1, '90,190,220', 0.95); sh(0.6, '200,240,250', 0.9); c2.fillStyle = rgb('255,255,255', 0.95); c2.beginPath(); c2.ellipse(-k * 0.25, k * 0.1, k * 0.12, k * 0.28, 0.4, 0, TAU); c2.fill(); c2.restore(); }
  function snow(c2, x, y, r, rot, a) { c2.save(); c2.translate(x, y); c2.rotate(rot); c2.globalAlpha *= a; c2.lineCap = 'round'; for (const [w, col, al] of [[0.34, '30,70,110', 0.45], [0.18, '200,235,255', 1], [0.07, '255,255,255', 1]]) { c2.strokeStyle = rgb(col, al); c2.lineWidth = Math.max(0.6, r * w); for (let j = 0; j < 3; j++) { const b = j * Math.PI / 3; c2.beginPath(); c2.moveTo(-Math.cos(b) * r, -Math.sin(b) * r); c2.lineTo(Math.cos(b) * r, Math.sin(b) * r); c2.stroke(); for (const sd of [-1, 1]) { const bx = Math.cos(b) * r * 0.6 * sd, by = Math.sin(b) * r * 0.6 * sd; c2.beginPath(); c2.moveTo(bx, by); c2.lineTo(bx + Math.cos(b + 0.9) * r * 0.28 * sd, by + Math.sin(b + 0.9) * r * 0.28 * sd); c2.stroke(); } } } c2.restore(); }
  /* 破甲：一面裂開的甲片（盾形），右半片慢慢往下剝落 */
  function brokenPlate(c2, x, y, k, t) { const off = 0.5 + 0.5 * Math.sin(t * 0.08); c2.save(); c2.translate(x, y); const half = (sd, dy, rot) => { c2.save(); c2.translate(sd * k * 0.08, dy); c2.rotate(rot); c2.beginPath(); c2.moveTo(0, -k); c2.lineTo(sd * k * 0.8, -k * 0.7); c2.lineTo(sd * k * 0.7, k * 0.3); c2.lineTo(0, k); c2.lineTo(-sd * k * 0.14, k * 0.3); c2.lineTo(sd * k * 0.12, -k * 0.1); c2.lineTo(-sd * k * 0.1, -k * 0.5); c2.closePath();
        c2.fillStyle = rgb('40,10,8', 0.85); c2.fill(); c2.save(); c2.clip(); c2.fillStyle = rgb('190,60,44', 1); c2.fillRect(-k, -k, k * 2, k * 2); c2.fillStyle = rgb('255,150,120', 0.9); c2.fillRect(-k, -k, k * 2, k * 0.55); c2.restore(); c2.strokeStyle = rgb('40,10,8', 0.9); c2.lineWidth = Math.max(0.8, k * 0.12); c2.stroke(); c2.restore(); };
    half(-1, 0, 0); half(1, k * 0.25 * off, 0.18 * off); c2.restore(); }
  /* 感電：在身上爬的電弧（每 3 格換一次形狀），深紫收邊＋紫＋白芯 */
  function arcs(c2, e) { const h = HH() * (e.ratio || 1) * S(e.y), sd0 = Math.floor(G.t / 3) * 7.13 + e.x; let q = sd0; const R2 = () => { q = (q * 9301 + 49297) % 233280; return q / 233280; }; c2.save(); c2.lineCap = 'round'; c2.lineJoin = 'round';
    for (let n = 0; n < 2; n++) { const pts = [], x0 = e.x + (R2() - 0.5) * h * 0.5, y0 = e.y - h * (0.15 + R2() * 0.7); let px = x0, py = y0; pts.push([px, py]); for (let i = 0; i < 4; i++) { px += (R2() - 0.5) * h * 0.3; py += (R2() - 0.5) * h * 0.3; pts.push([px, py]); }
      for (const [w, col, al] of [[0.05, '34,16,80', 0.6], [0.028, '170,140,255', 1], [0.011, '255,255,255', 1]]) { c2.strokeStyle = rgb(col, al); c2.lineWidth = Math.max(0.8, h * w); c2.beginPath(); pts.forEach((p2, i) => c2[i ? 'lineTo' : 'moveTo'](p2[0], p2[1])); c2.stroke(); } } c2.restore(); }
  G.RFX = { wisp, lightArrow, feather, droplet, snow, KU, KFa, rgb };
  /* r3.197.0：手繪素材特效播放器——直接播頭目／夥伴／里歐招式裡現成的手繪動畫（取代程式畫的幾何圖形）。
   * 素材第一次用到才下載（之後留在記憶體，不重複讀取）；還沒載好的那一次由呼叫端的 fb() 用舊畫法頂替。
   * fr(單位, 動畫, 第幾格, x, y, o)：立即畫一格。play(單位, 動畫, o)：播一段。
   * o：size＝畫面大小（像素，對齊 by：'w' 寬／'h' 高／預設長邊）、anc＝對位點（'c' 中心／'b' 底部中央／[fx,fy] 比例）、ang 旋轉、flip 翻面、a 透明度、add 加亮、sy 垂直壓扁、
   *    tpf 每格幾幀、fr＝[起,迄] 只播其中幾格、loop 重複幾次、hold 最後一格多停幾幀、at(u)→[x,y,ang] 跟隨、layer、delay、fb。 */
  const AFX = (function () { const asked = {}, isLv = k => k.slice(0, 3) === 'lv_';
    function unit(k) { const u = A.get(k); if (u) return u; if (!asked[k]) { asked[k] = 1; try { const q = isLv(k) ? G.LEON.boot().then(() => G.LEON.LD(k)) : A.load(k); if (q && q.catch) q.catch(() => { asked[k] = 0; }); } catch (x) { asked[k] = 0; } } return null; }
    function rec(k, c) { const u = unit(k); if (!u) return null; const r = isLv(k) ? (u._xr || (u._xr = { f: u.x })) : ((u.fx && u.fx[c]) || (u.act && u.act[c])); if (!r || !r.f || !r.f.length) return null; const im = u.imgs && u.imgs[r.f[0][7] || 0]; if (!im || !(im.naturalWidth || im.width)) return null;
      if (!r._bb) { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const f of r.f) { const s8 = f[8] || 1; x0 = Math.min(x0, -f[4] * s8); y0 = Math.min(y0, -f[5] * s8); x1 = Math.max(x1, (f[2] - f[4]) * s8); y1 = Math.max(y1, (f[3] - f[5]) * s8); } r._bb = { x0, y0, w: x1 - x0, h: y1 - y0 }; } return [u, r]; }
    function fr(k, c, fi, x, y, o) { const R2 = rec(k, c); if (!R2) return false; const u = R2[0], r = R2[1], f = r.f[Math.max(0, Math.min(r.f.length - 1, fi | 0))], im = u.imgs[f[7] || 0]; if (!im) return false; o = o || {};
      const bb = r._bb, s8 = f[8] || 1, sc = (o.size || 100) / (o.by === 'w' ? bb.w : o.by === 'h' ? bb.h : Math.max(bb.w, bb.h)), an = o.anc || 'c', fx = an === 'c' || an === 'b' ? 0.5 : an[0], fy = an === 'c' ? 0.5 : an === 'b' ? 1 : an[1], ax = bb.x0 + bb.w * fx, ay = bb.y0 + bb.h * fy;
      ctx.save(); ctx.translate(x, y); if (o.flip) ctx.scale(-1, 1); if (o.ang) ctx.rotate(o.ang); if (o.sy) ctx.scale(1, o.sy); if (o.a !== undefined) ctx.globalAlpha *= Math.max(0, Math.min(1, o.a)); if (o.add) ctx.globalCompositeOperation = 'lighter';
      try { ctx.drawImage(im, f[0], f[1], f[2], f[3], (-f[4] * s8 - ax) * sc, (-f[5] * s8 - ay) * sc, f[2] * s8 * sc, f[3] * s8 * sc); } catch (e) {} ctx.restore(); return true; }
    function play(k, c, o) { o = o || {}; const R2 = rec(k, c); if (!R2 || !G.KF || !G.KF.add) { if (o.fb) try { o.fb(); } catch (e) {} return false; }
      const r = R2[1], i0 = o.fr ? o.fr[0] : 0, i1 = o.fr ? o.fr[1] : r.f.length - 1, n = i1 - i0 + 1, tpf = o.tpf || 4, loop = o.loop || 1, hold = o.hold || 0, life = n * tpf * loop + hold, dl = o.delay || 0, fade = o.fade === undefined ? Math.min(6, tpf) : o.fade;
      G.KF.add(life + dl, o.layer || 'o', (c2, u) => { u -= dl; if (u < 0) return; const p = o.at ? o.at(u) : null; if (o.at && !p) return; const fi = u >= n * tpf * loop ? i1 : i0 + Math.floor(u / tpf) % n, a = (o.a === undefined ? 1 : o.a) * Math.min(1, (life - u) / Math.max(1, fade)) * (o.fin ? Math.min(1, (u + 1) / o.fin) : 1);
        fr(k, c, fi, p ? p[0] : o.x, p ? p[1] : o.y, { size: typeof o.size === 'function' ? o.size(u) : o.size, by: o.by, anc: o.anc, ang: p && p[2] !== undefined ? p[2] : o.ang, flip: o.flip, a, add: o.add, sy: o.sy }); }); return true; }
    const pre = L => { for (const k of L) unit(k); };
    return { fr, play, pre, rec, ok: (k, c) => !!rec(k, c) }; })();
  G.AFX = AFX;
  G.RUNE.T = { windBlade: (...a) => windBlade(...a), moon: () => moon(), quake: () => quake(), strike: (...a) => strike(...a), tideFx: (...a) => tideFx(...a), mirrorFx: n => mirrorFx(n), homing: (...a) => homing(...a), sunMirror: () => sunMirror(), lv: (id, v) => { ON.rn[id] = v; }, ray: o => E.push(o) };   /* 測試面板用的觸發入口 */

  function statusDraw() { for (const e of G.E) { const s = e.st2; if (!s || e.st === 'dead') continue; const k = Math.max(0.7, (e.ratio || 1) * 0.85), z = (e.ratio || 1) * 0.1;
      if (s.bnT > 0) (G.FLAMES || flames)(e, 1 + s.bn);   // r3.82.0：可由 117 換掉身上火苗   // r3.59.0：原本借用地面火圈圖（整圈火焰）→ 改成身上竄出的小火苗
      if (s.frz > 0) VX.draw2 && VX.draw2(ctx, 'fx_ice_shell', 0, e.x, e.y - HH() * S(e.y) * k * 0.62, k, { a: 0.85 });
      else if (s.fr > 0) frostMotes(e, k, s.fr);   // r3.166.0：原本整片白色橢圓 → 改成身邊飄的冰晶＋腳下霜圈
      if (s.sk > 0) { const hh = HH() * (e.ratio || 1) * S(e.y); if (!AFX.fr('b_raiju', 'raijuo_electric_burst', 1 + Math.floor((G.t + e.x) / 4) % 3, e.x, e.y - hh * 0.5, { size: hh * 1.15, a: 0.9 })) arcs(ctx, e); }   /* r3.197.0：感電＝雷獸的手繪電光 */   /* r3.196.0：感電＝身上爬的電弧（原本一條閃爍的紫色折線） */
      if (s.ha > 0) brokenPlate(ctx, e.x, e.y - HH() * (e.ratio || 1) * S(e.y) * 1.2, Math.max(6, HH() * S(e.y) * 0.075), G.t); } }   /* 破甲＝裂開剝落的甲片（原本一道紅折線＋圓圈） */

  /* ======================= 爆氣 ======================= */
  const QI = { t: 0, max: 1, big: false, end: null };
  function burst(s, atk, aspd, big, end) { QI.t = QI.max = sec(s); QI.big = big; QI.end = end; const B = BUF(); if (B) { B.add('atk', atk, sec(s)); if (aspd) B.add('aspd', aspd, sec(s)); }
    G.UI.banner(big ? '怒氣爆發' : '鬥氣', big ? '攻擊 +25%・攻速 +20%' : '攻擊 +15%'); VX.ring && VX.ring({ x: H.x, y: H.y, r1: 1.8, life: 18, col: big ? '255,120,80' : '255,210,120', lw: 0.1 }); G.SC.shake = Math.max(G.SC.shake || 0, 4); }
  function qiStep() { if (QI.t > 0 && --QI.t === 0 && QI.end) { const f = QI.end; QI.end = null; f(); } }
  function qiDraw() { if (QI.t <= 0) return; const AU = G.AURA, a = Math.min(1, QI.t / 20, (QI.max - QI.t) / 8 + 0.2), h = HH() * S(H.y) * 1.1;
    if (AU && AU.draw) AU.draw(ctx, H.x, H.y, h * 0.75, h, QI.big ? 'crimson' : 'gold', a, true); }
  G.QIB = { draw: qiDraw, on: () => QI.t > 0 };

  /* ======================= 觸發 ======================= */
  let hitN = 0, comboN = 0, lastHit = 0, shotN = 0, lastAct = null, tenN = 0;
  const isFin = () => { const a = H.act, W = G.WPN; if (!a || a.kind !== 'atk' || !W || !W.cur) return false; const c = W.cur().combo || []; return c.indexOf(a.name) === c.length - 1; };
  function onHit(e, big, crit) {
    hitN++; comboN = G.t - lastHit < 120 ? comboN + 1 : 1; lastHit = G.t;
    const a = H.act, fin = isFin() && a !== lastAct && (lastAct = a);
    if (lvOf('rai') && G.PROC('r_rai', 0) && Math.random() < 0.12 && ready('rai', 1)) thunder(e, 'rai');
    if (lvOf('en') && G.PROC('r_en', 30, e) && Math.random() < 0.2) burn(e);
    if (lvOf('hyo') && G.PROC('r_hyo', 30, e)) frost(e);
    if (lvOf('den') && G.PROC('r_den', 30)) { const s = e.st2; if (s && s.sk > 0) { s.sk = 0; RD(e, 'den', 0.9); { const hh = HH() * (e.ratio || 1) * S(e.y); AFX.play('b_raiju', 'raijuo_electric_burst', { x: e.x, y: e.y - hh * 0.5, size: hh * 2.0, tpf: 3 }); } const n = nearest(e.x, e.y, HH() * 3, [e]); if (n) { RD(n, 'den', 0.45); VX.bolt && VX.bolt({ x0: e.x, y0: chest(e), x1: n.x, y1: chest(n), col: '200,190,255', life: 12 }); } } else if (Math.random() < 0.15) shock(e); }
    if (lvOf('ha') && big) armor(e);
    if (fin && lvOf('kaze') && ready('kaze', 2)) windBlade('kaze', 1.2, 4.5, '170,255,225');
    if (fin && lvOf('zan') && ready('zan', 3)) moon();
    if ((fin || big) && lvOf('shin') && ready('shin', 4)) quake();
    if (fin && ON.jg.akaorochi && ready('kusanagi', 6)) windBlade('kusanagi', 4.0, 8, '200,255,240', true);
    if (lvOf('un') && /yumi|teppo/.test(G.WPN && G.WPN.curId && G.WPN.curId()) && G.PROC('r_un', 0) && ++shotN % 5 === 0) homing(e, 0.8 * LVM[lvOf('un')], 'arrow');
    if (lvOf('toki') && comboN >= 30 && QI.t <= 0 && ready('toki', 30)) burst(5, 15, 0, false);
    if (ON.set.yomi && e.hp / e.hpMax < 0.2 && alive(e) && (e._ym || 0) < G.t) { e._ym = G.t + sec(6); s2('fx_yomi_hand', { x: e.x, y: e.y, k: 1, life: 30 }); G.STORY.later(10, () => dmg(e, 2.5, true)); }
    if (ON.set.tenmon && G.PROC('r_ten', 0) && ++tenN % 10 === 0) { VX.pillar && VX.pillar({ x: e.x, y: e.y, h: 4, wk: 1 }); VX.sigil && VX.sigil({ x: e.x, y: e.y, kind: 'shrine', r: 0.9, life: 34, a: 0.7 }); KU('holy', () => { const K2 = G.KF; K2.light(e.x, e.y, 1.6, 24, 0.6, 0.4); K2.glint(e.x, e.y, 0.1, 0.6, 14); }); G.STORY.later(6, () => dmg(e, 3.0, true)); }   /* r3.196.0：天光＝光柱＋落點金色紋樣＋飄落金羽 */
    if (ON.set.foxfire && crit && ready('fox', 2)) for (let i = 0; i < 3; i++) homing(e, 0.6, 'fox', i);
  }
  const do0 = G.damageOni; G.damageOni = function (e, mult, big, fc, opt) { const hero = e && e.st !== 'dead' && !(opt && (opt.party || opt.rune)) && !G._bleedTick, n0 = G.NUMS.length, hp0 = e && e.hp;
    if (hero && e.st2 && e.st2.sk > 0 && !lvOf('den')) e.st2.sk = 0;
    const r = do0.apply(this, arguments);
    if (hero && e && e.hp < hp0) { const nm = G.NUMS[G.NUMS.length - 1], crit = G.NUMS.length > n0 && nm && nm.crit; try { onHit(e, big, crit); } catch (x) { console.warn('rune hit', x); } }
    return r; };
  const ok0 = R.onKill; R.onKill = function (e) { ok0.apply(this, arguments); try {
      if (lvOf('kon') && ready('kon', 0.5)) { const v = Math.round(H.hpMax * 0.03 * LVM[lvOf('kon')]); H.hp = Math.min(H.hpMax, H.hp + v); G.NUMS.push({ x: H.x, y: H.y - HH() * S(H.y) - 10, v: '+' + v, gold: true, t: 0 }); E.push({ k: 'soul', x: e.x, y: chest(e), t: 0, life: 40, sd: Math.random() * 6.28 }); }
      if (ON.set.onibi) { VX.blast && VX.blast({ x: e.x, y: e.y, r: 1.0 }); { const x0 = e.x, y0 = e.y, k0 = HH() * S(y0); let okW = 1; for (let i = 0; i < 4; i++) { const dx = (i - 1.5) * 0.42 + rnd(-0.1, 0.1), up = rnd(0.5, 1), fl = i % 2 === 0; if (!AFX.play('b_izanami', 'izanami_wisp', { size: k0 * rnd(1.1, 1.5), by: 'w', flip: fl, tpf: 5, delay: i * 3, at: u => [x0 + dx * k0, y0 - k0 * (0.45 + u * 0.03 * up)] })) { okW = 0; break; } }   /* r3.197.0：鬼火爆＝伊邪那美的手繪怨火 */
        if (!okW) { const x0 = e.x, y0 = e.y, W8 = []; for (let i = 0; i < 6; i++) W8.push([rnd(-1, 1), rnd(0.6, 1.2), rnd(0, 6)]); KFa(34, 'o', (c2, u) => { const k = HH() * S(y0); for (const w of W8) wisp(c2, x0 + w[0] * k * 0.6 + Math.sin(u * 0.2 + w[2]) * k * 0.12, y0 - k * (0.3 + u * 0.035 * w[1]), -Math.PI / 2, k * 0.13, 'oni', Math.min(1, u / 4) * (1 - u / 34), 0, w[2]); }); } }   /* r3.196.0：鬼火爆＝爆炸後幾縷紫綠怨火往上飄散 */ for (const n of near(e.x, e.y, HH() * 1.5)) if (n !== e) dmg(n, 1.5, true); } } catch (x) { console.warn('rune kill', x); } };
  /* r3.196.0：鏡返＝身前閃現一面銅鏡（鏡框、鏡面漸層、一道反光）→ 碎成鏡片射向目標（原本一圈藍環） */
  function mirrorFx(n) { const hx = H.x, hy = H.y, f = Math.sign(n.x - H.x) || H.face, Sh = []; for (let i = 0; i < 8; i++) Sh.push([rnd(-0.35, 0.35), rnd(-0.5, 0.5), rnd(0, 6), rnd(0.6, 1.2)]);
    KFa(20, 'o', (c2, u) => { const k = HH() * S(hy), mx = hx + f * k * 0.5, my = hy - k * 0.62, tx = n.x, ty = n.y - k * 0.5;
      /* r3.197.0：鏡返＝狛金的手繪銅鏡立在身前，射出手繪鏡光打向目標（原本程式畫的圓鏡＋三角碎片） */
      if (AFX.ok('b_mb_komakin', 'komakin_mirror_a')) { const a = Math.min(1, u / 2) * Math.min(1, (20 - u) / 5), dx = tx - mx, dy = ty - my, L = Math.hypot(dx, dy) || 1, lf = dx < 0, an = Math.atan2(dy, dx);
        AFX.fr('b_mb_komakin', 'komakin_mirror_a', 0, mx, hy - k * 0.1, { size: k * 0.95, by: 'h', anc: 'b', flip: f < 0, a });
        if (u >= 3) AFX.fr('b_mb_komakin', 'komakin_mirror_ray', Math.min(3, Math.floor((u - 3) / 4)), mx, my, { size: Math.max(L, k * 1.2), by: 'w', anc: [0, 0.5], ang: lf ? Math.PI - an : an, flip: lf, sy: Math.min(1, k * 1.3 / (L * 0.39)), a: Math.min(1, (20 - u) / 4) }); return; }
      if (u < 6) { const g0 = Math.min(1, u / 2), r = k * 0.42 * g0; c2.save(); c2.translate(mx, my); c2.scale(0.55, 1); c2.fillStyle = rgb('40,26,8', 0.7); c2.beginPath(); c2.arc(0, 0, r * 1.14, 0, TAU); c2.fill(); c2.fillStyle = rgb('206,160,70', 1); c2.beginPath(); c2.arc(0, 0, r * 1.06, 0, TAU); c2.fill();
        const gr = c2.createLinearGradient(-r, -r, r, r); gr.addColorStop(0, rgb('235,250,255', 1)); gr.addColorStop(0.5, rgb('130,190,220', 1)); gr.addColorStop(1, rgb('60,100,150', 1)); c2.fillStyle = gr; c2.beginPath(); c2.arc(0, 0, r * 0.9, 0, TAU); c2.fill();
        c2.save(); c2.beginPath(); c2.arc(0, 0, r * 0.9, 0, TAU); c2.clip(); c2.fillStyle = rgb('255,255,255', 0.85); c2.rotate(-0.6); c2.fillRect(-r * 2, -r * 0.2 + (u - 3) * r * 0.3, r * 4, r * 0.22); c2.restore(); c2.restore(); }
      else { const q = (u - 6) / 14, e2 = q * q; for (const s2 of Sh) { const x = mx + (tx - mx) * e2 + s2[0] * k * (1 - e2), y = my + (ty - my) * e2 + s2[1] * k * (1 - e2), L = k * 0.11 * s2[3]; c2.save(); c2.translate(x, y); c2.rotate(s2[2] + u * 0.5); c2.globalAlpha = 1 - Math.max(0, q - 0.8) / 0.2;
          c2.fillStyle = rgb('20,40,70', 0.7); c2.beginPath(); c2.moveTo(L * 1.3, 0); c2.lineTo(-L * 0.8, -L * 0.8); c2.lineTo(-L * 0.5, L * 0.9); c2.fill(); c2.fillStyle = rgb('150,205,235', 1); c2.beginPath(); c2.moveTo(L, 0); c2.lineTo(-L * 0.6, -L * 0.6); c2.lineTo(-L * 0.35, L * 0.7); c2.fill(); c2.fillStyle = rgb('255,255,255', 0.95); c2.beginPath(); c2.moveTo(L, 0); c2.lineTo(-L * 0.6, -L * 0.6); c2.lineTo(-L * 0.1, -L * 0.1); c2.fill(); c2.restore(); } } }); }
  /* r3.196.0：潮浪＝一圈往外推的浪頭（深藍浪身、青色浪面、白色浪花）＋水沫（原本一圈藍環＋風線） */
  function tideFx(hx, hy) { const N = 12, F2 = []; for (let i = 0; i < 30; i++) F2.push([rnd(0, TAU), rnd(0.8, 1.1), rnd(0.1, 0.55)]);
    VX.ring && VX.ring({ x: hx, y: hy, r0: 0.3, r1: 2.7, life: 26, col: '120,200,255', lw: 0.22 }); KU('moon', () => { const k = HH() * S(hy); for (let i = 0; i < 8; i++) { const an = i / 8 * TAU; G.STORY.later(6, () => KU('moon', () => G.KF.puff(hx + Math.cos(an) * 1.6 * k, hy + Math.sin(an) * 0.6 * k, 1.0, 22))); } });
    KFa(26, 'o', (c2, u) => { const k = HH() * S(hy), q = u / 26, R0 = k * (0.4 + 2.3 * (1 - Math.pow(1 - q, 2))), a = q < 0.65 ? 1 : 1 - (q - 0.65) / 0.35;
      { const fi = Math.min(5, Math.floor(u / 4.4)), W8 = [[-2.4, 0.9], [2.4, 0.9], [-0.6, 0.75], [0.6, 0.75], [-3.7, 1], [3.7, 1], [-1.2, 1.1], [1.2, 1.1]]; let ok = 1;   /* r3.197.0：潮浪＝河童大將的手繪浪頭，一圈由內往外推（後排先畫） */
        for (const w8 of W8) { const cx = Math.cos(w8[0]), sy = Math.sin(w8[0]); if (!AFX.fr('b_kappa', 'kappataisho_tide_wave', fi, hx + cx * R0 * 0.85, hy + sy * R0 * 0.36 + k * 0.1, { size: k * 2.3 * w8[1] * (0.7 + 0.3 * q), by: 'w', anc: 'b', flip: cx < 0, a })) { ok = 0; break; } }
        if (!ok) KU('moon', () => { for (let i = 0; i < N; i++) { const an = i / N * TAU + 0.2, cx = Math.cos(an); if (Math.abs(cx) < 0.25) continue; G.KF.moonShape(c2, hx + cx * R0, hy + Math.sin(an) * R0 * 0.38 - k * 0.3, k * 0.42 * (1 - q * 0.3), cx > 0 ? 1 : -1, a, k); } }); }   /* 一圈往外推的浪頭（筆觸月牙） */
      c2.fillStyle = rgb('240,252,255', 0.95 * a); for (const f2 of F2) { const r = R0 * f2[1]; c2.beginPath(); c2.arc(hx + Math.cos(f2[0]) * r, hy + Math.sin(f2[0]) * r * 0.38 - k * f2[2] * Math.sin(q * Math.PI), Math.max(1, k * 0.02), 0, TAU); c2.fill(); } }); }
  /* 致命傷：紙人替身、八咫鏡（日鏡）；閃避成功：鏡返 */
  const hh0 = G.hurtHero; G.hurtHero = function (atk, srcX) {
    if (H.inv > 0 && H.act && /dodge|dash/.test(H.act.kind) && ON.set.mirror && ready('mirror', 3)) { const n = nearest(H.x, H.y, HH() * 3); if (n) { mirrorFx(n); G.STORY.later(4, () => { dmg(n, 1.8, true); VX.impact && VX.impact({ x: n.x, y: n.y, z: 0.6, big: 1 }); }); } }
    const r = hh0.apply(this, arguments);
    if (H.hp <= 0) { if (ON.jg.komakin && ready('yata', 60)) { H.hp = 1; H.inv = 90; sunMirror(); } else if (lvOf('mi') && ready('mi', 90)) { H.hp = 1; H.inv = 90; s2('shiki_doll', { x: H.x, y: H.y, k: 1, life: 36 }); G.UI.banner('紙人替身', '替你擋下了致命一擊'); } }
    else if (H.hp < H.hpMax * 0.5 && lvOf('goho') && ready('goho', 30)) { const B = BUF(); if (B) B.add('dr', 50, sec(6)); E.push({ k: 'goho', t: 0, life: sec(6) }); G.UI.toast('護法童子：6 秒減傷 50%'); }
    if (H.hp > 0 && H.hp < H.hpMax * 0.3 && lvOf('ikari') && QI.t <= 0 && ready('ikari', 60)) { const L = LVM[lvOf('ikari')]; burst(8, 25, 20, true, () => { { const x0 = H.x, y0 = H.y; KU('ember', () => { const K2 = G.KF, k = HH() * S(y0); K2.burst(x0, y0, 0.5, 3.2); K2.crack(x0, y0, 1.6, 70, true); K2.embers(x0, y0, 0.4, 16, { sp: 1.6, life: 34 }); for (let i = 0; i < 8; i++) { const an = i / 8 * TAU; K2.puff(x0 + Math.cos(an) * 1.6 * k, y0 + Math.sin(an) * 0.6 * k, 1.1); } }); }   /* r3.196.0：怒氣結束的震波＝焰色爆開＋地裂＋火星＋塵柱 */ for (const n of near(H.x, H.y, HH() * 2.2)) dmg(n, 2.0 * L, true); }); }
    return r; };

  /* ======================= 招式本體 ======================= */
  function thunder(e, id) { const L = LVM[lvOf(id) || 1]; strike(e.x, e.y, 5); VX.sigil && VX.sigil({ x: e.x, y: e.y, kind: 'raiden', r: 0.6, life: 20 });
    dmg(e, 1.5 * L, true); let p = e; const hit = [e]; for (let i = 0; i < 2; i++) { const n = nearest(p.x, p.y, HH() * 3, hit); if (!n) break; hit.push(n); { const a1 = [p.x, chest(p)], b1 = [n.x, chest(n)]; KU('moon', () => { G.KF.bolt(a1[0], a1[1], b1[0], b1[1], 12, 1.6, 1); G.KF.glint(b1[0], n.y, 0.55 * (n.ratio || 1), 0.3, 8); }); } dmg(n, 0.6 * L); p = n; } }
  /* r3.196.0：落雷＝加粗帶墨邊的雷光＋分岔＋落點焦痕、塵與電光（原本一條折線） */
  function strike(x, y, w) { KU('moon', () => { const K2 = G.KF, k = HH() * S(y); /* r3.197.0：落雷＝伊邪那美的手繪落雷 */ AFX.play('b_izanami', 'izanami_thunder', { x, y: y + k * 0.08, size: k * (w >= 6 ? 5.2 : 4.4), by: 'h', anc: 'b', tpf: 3, hold: 2, flip: Math.random() < 0.5, fb: () => KU('moon', () => { G.KF.bolt(x + rnd(-0.5, 0.5) * k, y - 6 * k, x, y - 0.1 * k, 16, Math.min(3, w * 0.5), 3); }) }); K2.light(x, y, 1.3, 16, 0.7, 0.5); K2.puff(x, y, 0.9); K2.scar && K2.scar(x, y, 1, 1.5); }); }
  function windBlade(id, coef, len, col, giant) { const f = H.face, L = id === 'kusanagi' ? 1 : LVM[lvOf(id) || 1]; E.push({ k: 'blade', x: H.x, y: H.y, f, d: 0, len: len * HH(), spd: HH() * (giant ? 0.32 : 0.22), coef: coef * L, hit: [], col, giant, t: 0, life: 99 });
    if (giant) { G.SC.shake = Math.max(G.SC.shake || 0, 6); G.UI.toast('草薙劍・叢雲'); } }
  function moon() { const f = H.face, L = LVM[lvOf('zan')], cx = H.x + f * HH() * 1.0; { const k0 = HH() * S(H.y), hx0 = H.x, hy0 = H.y; AFX.play('b_yoshitsune', 'fx_yoshitsune_iai_slash', { x: hx0 + f * k0 * 0.9, y: hy0 - k0 * 0.6, size: k0 * 3.6, by: 'w', flip: f < 0, tpf: 4, hold: 3, fb: () => KU('moon', () => G.KF.smear({ x: hx0, y: hy0, f, cy: 0.6, r: 1.7, sq: 0.8, a0: -1.3, a1: 1.3, w: 0.6, dur: 4, life: 22, tier: 2, trail: 2.6 })) }); }   /* r3.197.0：斬月＝義經居合的手繪月弧 */
    KU('moon', () => { const K2 = G.KF; K2.glint(cx + f * HH() * 0.5, H.y, 0.6, 0.5, 12); K2.scar && K2.scar(cx, H.y, f, 2); });   /* r3.196.0：斬月＝帶墨邊的月白大月牙＋地面刀痕（原本一道純白弧線） */
    for (const n of near(cx, H.y, HH() * 1.5)) dmg(n, 1.6 * L, true); }
  function quake() { const L = LVM[lvOf('shin')], x = H.x + H.face * HH() * 0.6; { const y0 = H.y; KU('lance', () => { const K2 = G.KF, k = HH() * S(y0); AFX.play('b_ezo', 'fx_ground_cracks', { x, y: y0, size: k * 4.4, by: 'w', layer: 'g', tpf: 4, hold: 50, fade: 24, fb: () => KU('lance', () => G.KF.crack(x, y0, 1.5, 70, true)) }); /* r3.197.0：震地的地裂＝手繪熔岩裂紋 */ K2.rocks(x, y0, 14, 1.5); for (let i = 0; i < 6; i++) { const an = i / 6 * TAU; K2.puff(x + Math.cos(an) * 1.1 * k, y0 + Math.sin(an) * 0.45 * k, 1.0); } K2.light(x, y0, 1.6, 16, 0.5, 0.2); }); VX.debris2 && VX.debris2({ x, y: y0, n: 6 }); }   /* r3.196.0：震地＝地裂透光＋掀起岩塊＋一圈塵柱（原本裂紋線＋一圈環） */
    G.SC.shake = Math.max(G.SC.shake || 0, 5); for (const n of near(x, H.y, HH() * 1.4)) { dmg(n, 1.4 * L, true); if (!n.bb) { n.stun = Math.max(n.stun || 0, 30); n.lift = 0; E.push({ k: 'lift', e: n, t: 0, life: 30 }); } } }
  function homing(e, coef, kind, i) { const y0 = H.y - HH() * S(H.y) * 0.7; E.push({ k: 'hm', kind, x: H.x + rnd(-10, 10), y: y0, z: 0, vx: H.face * 4 + (i || 0) * 1.5 - 1.5, vy: -3 - (i || 0), e, coef, t: 0, life: 90 }); }
  function sunMirror() { s2('fx_hikagami', { x: H.x, y: H.y, k: 1.2, life: 40, z: 0.8, add: 1 }); G.UI.banner('八咫鏡・日鏡', '致命傷被鏡光反射'); G.flash = 8;
    const f = H.face; E.push({ k: 'beam', x: H.x, y: H.y - HH() * S(H.y) * 0.7, f, t: 0, life: 24, col: '255,240,190' }); for (const n of foes()) if ((n.x - H.x) * f > 0 && Math.abs(n.x - H.x) < HH() * 9 && Math.abs(n.y - H.y) < HH() * 0.9) dmg(n, 5.0, true); }
  /* 常駐召喚：紙鶴 3、紙狐 1、勾玉 3、風球 3；週期：雷陣、潮浪、天照 */
  const PET = { crane: [], fox: null, mag: [], ball: [], ballT: 0 };
  /* r3.197.0：身上帶著的靈紋／套裝／神器用到的手繪素材先備好（每半秒檢查一次，已載入的不會重讀） */
  function afxPre() { const L = []; if (lvOf('kaze')) L.push('lv_windslash'); if (lvOf('zan')) L.push('b_yoshitsune'); if (lvOf('shin')) L.push('b_ezo'); if (lvOf('rai') || ON.set.thunder || ON.set.onibi) L.push('b_izanami'); if (lvOf('den')) L.push('b_raiju'); if (lvOf('un')) L.push('p_hayate_fx'); if (lvOf('hyo')) L.push('p_shion_fx');
    if (ON.jg.akaorochi) L.push('b_mb_akaorochi'); if (ON.set.tide) L.push('b_kappa'); if (ON.set.foxfire) L.push('b_kyubi'); if (ON.set.mirror || ON.jg.komakin || ON.jg.kinhannya) L.push('b_mb_komakin'); AFX.pre(L); }
  function petSync() { const want = { crane: lvOf('tsuru') ? 3 : 0, fox: !!lvOf('kitsu'), mag: ON.jg.kinhannya ? 3 : 0, ball: ON.set.wind ? 3 : 0 };
    while (PET.crane.length < want.crane) PET.crane.push({ a: PET.crane.length * TAU / 3, cd: 30 + PET.crane.length * 24, x: H.x, y: H.y, st: 0 }); PET.crane.length = want.crane;
    if (want.fox && !PET.fox) PET.fox = { x: H.x - 30, y: H.y + 8, cd: 60, st: 0, f: 1 }; if (!want.fox) PET.fox = null;
    while (PET.mag.length < want.mag) PET.mag.push({ a: PET.mag.length * TAU / 3, cd: 40 + PET.mag.length * 40 }); PET.mag.length = want.mag;
    if (!want.ball) { PET.ball.length = 0; PET.ballT = 0; } else if (!PET.ball.length && !PET.ballT) { PET.ball = [0, 1, 2].map(i => ({ a: i * TAU / 3 })); } }
  function petStep() { if (G.mode !== 'play') return; const t = G.t, hx = H.x, hy = H.y, hz = HH() * S(hy);
    for (const c of PET.crane) { c.a += 0.035; const ox = hx + Math.cos(c.a) * hz * 0.9, oy = hy - hz * 1.15 + Math.sin(c.a) * hz * 0.25;
      if (c.st === 0) { c.x += (ox - c.x) * 0.2; c.y += (oy - c.y) * 0.2; if (--c.cd <= 0) { const e = nearest(hx, hy, hz * 4); if (e) { c.tg = e; c.st = 1; c.k = 0; } c.cd = sec(1.2); } }
      else { const e = c.tg; c.k++; if (!alive(e) || c.k > 40) { c.st = 0; continue; } const tx = e.x, ty = chest(e); c.x += (tx - c.x) * 0.25; c.y += (ty - c.y) * 0.25; if (Math.hypot(tx - c.x, ty - c.y) < 8) { RD(e, 'tsuru', 0.35); VX.impact && VX.impact({ x: e.x, y: e.y, z: 0.5 }); c.st = 0; } } }
    const fx = PET.fox; if (fx) { if (fx.st === 0) { const tx = hx - H.face * hz * 0.7, ty = hy + 10; fx.x += (tx - fx.x) * 0.08; fx.y += (ty - fx.y) * 0.08; fx.f = Math.sign(tx - fx.x) || fx.f;
        if (--fx.cd <= 0) { const e = nearest(hx, hy, hz * 3.5); if (e) { fx.tg = e; fx.st = 1; fx.k = 0; } fx.cd = sec(1.5); } }
      else { const e = fx.tg; fx.k++; if (!alive(e) || fx.k > 50) { fx.st = 0; } else { const tx = e.x - Math.sign(e.x - fx.x) * 10, ty = e.y; fx.f = Math.sign(e.x - fx.x) || fx.f; fx.x += (tx - fx.x) * 0.22; fx.y += (ty - fx.y) * 0.22;
          if (Math.hypot(tx - fx.x, ty - fx.y) < 10) { RD(e, 'kitsu', 0.7, true); VX.impact && VX.impact({ x: e.x, y: e.y, z: 0.4, big: 1 }); fx.st = 0; } } } }
    for (const m of PET.mag) { m.a += 0.03; if (--m.cd <= 0) { m.cd = sec(2); const e = nearest(hx, hy, hz * 5); if (e) { const mx = hx + Math.cos(m.a) * hz * 0.75, my = hy - hz * 1.0 + Math.sin(m.a) * hz * 0.2; E.push({ k: 'ray', x0: mx, y0: my, x1: e.x, y1: chest(e), t: 0, life: 10 }); dmg(e, 0.5); } } }
    if (ON.set.wind) { if (!PET.ball.length) { if (++PET.ballT >= sec(8)) { PET.ballT = 0; PET.ball = [0, 1, 2].map(i => ({ a: i * TAU / 3 })); } }
      for (const b of PET.ball) { b.a += 0.06; const bx = hx + Math.cos(b.a) * hz * 0.95, by = hy - hz * 0.45 + Math.sin(b.a) * hz * 0.3; b.x = bx; b.y = by;
        const e = foes().find(e => Math.hypot(e.x - bx, (e.y - hy) * 1.4) < hz * 0.45); if (e) { dmg(e, 1.0, true); VX.wind && VX.wind({ x: bx, y: hy, r: 0.6, n: 3, life: 14, col: '200,255,235', face: 1, spin: 0.4 }); b.dead = 1; } }
      PET.ball = PET.ball.filter(b => !b.dead); }
    if (ON.set.thunder && t % sec(10) === 0) { const L = near(hx, hy, hz * 4.5); for (let i = 0; i < 3 && L.length; i++) { const e = L[i % L.length]; G.STORY.later(i * 10, () => { if (!alive(e)) return; strike(e.x, e.y, 6); VX.sigil && VX.sigil({ x: e.x, y: e.y, kind: 'raiden', r: 0.7, life: 22 }); dmg(e, 1.2, true); }); } }
    if (ON.set.tide && t % sec(8) === 0 && near(hx, hy, hz * 2.5).length) { tideFx(hx, hy);
      for (const e of near(hx, hy, hz * 2.6)) { dmg(e, 1.3, true); e.kb = Math.sign(e.x - hx || 1) * 9 / (e.ratio || 1); } }
    if (ON.jg3 && t % sec(30) === sec(5) && near(hx, hy, hz * 6).length) { VX.sigil && VX.sigil({ x: hx, y: hy, kind: 'shrine', r: 3.2, life: 120, a: 0.5 }); G.UI.banner('天照', '三神器共鳴');
      for (let i = 0; i < 10; i++) G.STORY.later(8 + i * 8, () => { const L = near(hx, hy, hz * 6), e = L.length ? L[ri(0, L.length - 1)] : null, x = e ? e.x : hx + rnd(-hz * 4, hz * 4), y = e ? e.y : hy + rnd(-30, 30);
        VX.pillar && VX.pillar({ x, y, h: 5, wk: 1.1 }); for (const n of near(x, y, hz * 0.8)) dmg(n, 2.0, true); }); } }
  /* 投射物與短效 */
  function entStep() { for (const o of E) { o.t++;
      if (o.k === 'blade') { o.d += o.spd; o.x += o.f * o.spd; for (const e of foes()) if (!o.hit.includes(e) && Math.abs(e.x - o.x) < HH() * (o.giant ? 0.9 : 0.5) && Math.abs(e.y - o.y) < HH() * (o.giant ? 1.0 : 0.6)) { o.hit.push(e); dmg(e, o.coef, true); }
        if (o.d >= o.len) o.t = o.life; }
      else if (o.k === 'hm') { const e = alive(o.e) ? o.e : nearest(o.x, o.y, HH() * 6); if (e) { o.e = e; const tx = e.x, ty = chest(e), dx = tx - o.x, dy = ty - o.y, d = Math.hypot(dx, dy) || 1; o.vx += dx / d * 0.9; o.vy += dy / d * 0.9; const sp = Math.hypot(o.vx, o.vy), mx = 9; if (sp > mx) { o.vx *= mx / sp; o.vy *= mx / sp; }
          if (d < 12) { dmg(e, o.coef); VX.impact && VX.impact({ x: e.x, y: e.y, z: 0.6 }); o.t = o.life; } } o.x += o.vx; o.y += o.vy; }
      else if (o.k === 'lift') { const q = o.t / o.life; o.e.lift = Math.sin(q * Math.PI) * HH() * 0.5; if (o.t >= o.life) o.e.lift = 0; } }
    for (let i = E.length - 1; i >= 0; i--) if (E[i].t >= E[i].life) E.splice(i, 1); }
  const sp = (n, fi, x, y, k, o) => VX.draw2 && VX.draw2(ctx, n, fi, x, y, k, o);
  function entDraw() { const hz = HH() * S(H.y);
    for (const o of E) { const q = o.t / o.life;
      if (o.k === 'blade') { const k = HH() * S(o.y), R0 = k * (o.giant ? 1.7 : 0.95), cy = o.y - k * 0.58;   /* r3.196.0：風刃／叢雲＝筆觸月牙風刃（薙刀那套青碧色）＋後方氣流與葉片；叢雲更大、中間一把劍影、帶雲氣 */
        /* r3.197.0：風刃＝里歐「風斬」的手繪風刃；叢雲＝赤大蛇的手繪劍氣（原本程式畫的月牙＋長條）。素材還沒載好時才用舊畫法 */
        const drawn = o.giant ? AFX.fr('b_mb_akaorochi', 'akaorochi_sword_wave', o.t < 3 ? 0 : 1 + Math.floor(o.t / 4) % 2, o.x - o.f * k * 0.4, cy, { size: k * 4.2, by: 'w', flip: o.f < 0 }) : AFX.fr('lv_windslash', null, 3 + Math.floor(o.t / 3) % 3, o.x, cy, { size: k * 3.3, by: 'w', ang: -0.96, flip: o.f < 0 });
        if (!drawn) {
        ctx.save(); ctx.lineCap = 'round'; for (let i = 0; i < 5; i++) { const yy = cy + (i - 2) * R0 * 0.22, L = R0 * (1.2 + ((i * 37) % 5) * 0.2), x1 = o.x - o.f * R0 * 0.2, x0 = x1 - o.f * L; for (const [w, col, al] of [[0.05, '8,46,42', 0.3], [0.022, '200,255,235', 0.8]]) { const g0 = ctx.createLinearGradient(x0, 0, x1, 0); g0.addColorStop(0, rgb(col, 0)); g0.addColorStop(1, rgb(col, al)); ctx.strokeStyle = g0; ctx.lineWidth = Math.max(1, k * w); ctx.beginPath(); ctx.moveTo(x0, yy + Math.sin(o.t * 0.5 + i) * k * 0.03); ctx.lineTo(x1, yy); ctx.stroke(); } } ctx.restore();
        KU('gale', () => G.KF.moonShape(ctx, o.x, cy, R0, o.f, 1, k));
        if (o.giant) { ctx.save(); ctx.translate(o.x, cy); ctx.scale(o.f, 1); const bl = (sc, col, al) => { ctx.fillStyle = rgb(col, al); ctx.beginPath(); ctx.moveTo(R0 * 0.75, 0); ctx.lineTo(R0 * 0.45, -k * 0.06 * sc); ctx.lineTo(-R0 * 1.0, -k * 0.045 * sc); ctx.lineTo(-R0 * 1.0, k * 0.045 * sc); ctx.lineTo(R0 * 0.45, k * 0.06 * sc); ctx.closePath(); ctx.fill(); }; bl(1.7, '8,46,42', 0.55); bl(1, '215,255,245', 1); bl(0.4, '255,255,255', 1); ctx.fillStyle = rgb('206,160,70', 1); ctx.fillRect(-R0 * 1.05, -k * 0.15, k * 0.05, k * 0.3); ctx.restore(); } }
        if (o.t % 4 === 0 && o._lt !== o.t) { o._lt = o.t; KU('gale', () => { G.KF.leaves(o.x, o.y, 0.55, o.giant ? 4 : 2, { sp: 1.6, life: 26, rx: 0.5 }); if (o.giant) G.KF.puff(o.x - o.f * k, o.y, 0.9, 20); }); } }
      else if (o.k === 'moon') { /* 斬月改在發動時用月牙元件畫 */ }
      else if (o.k === 'hm') { const an = Math.atan2(o.vy, o.vx), k = HH() * S(o.y); const lf = Math.cos(an) < 0, ag = lf ? Math.PI - an : an;   /* r3.197.0：狐火＝九尾的手繪狐火；穿雲＝夥伴疾風的手繪重箭 */
        if (o.kind === 'fox') { if (!AFX.fr('b_kyubi', 'kyubi_fox_fire', 1 + Math.floor(o.t / 4) % 2, o.x, o.y, { size: k * 1.25, by: 'w', ang: ag, flip: lf })) wisp(ctx, o.x, o.y, an, k * 0.1, 'fox', 1, 1, o.x); }
        else if (!AFX.fr('p_hayate_fx', 'heavy_arrow', 3 + Math.floor(o.t / 3) % 6, o.x, o.y, { size: k * 1.5, by: 'w', ang: ag, flip: lf })) lightArrow(ctx, o.x, o.y, an, k * 0.1, 1); }   /* r3.196.0：狐火＝有狐耳狐眼、拖尾焰的火；穿雲＝金白光箭（原本都是一顆光點） */
      else if (o.k === 'ray') { const a = 1 - q, dx = o.x1 - o.x0, dy = o.y1 - o.y0, L = Math.hypot(dx, dy) || 1, k = HH() * S(o.y1); ctx.save(); ctx.translate(o.x0, o.y0); ctx.rotate(Math.atan2(dy, dx));   /* r3.196.0：勾玉光線＝由粗到細的翠綠光束（墨邊、白芯），命中點綻開一枚小勾玉 */
        if (AFX.fr('b_mb_komakin', 'komakin_mirror_ray', Math.min(3, Math.floor(q * 4)), 0, 0, { size: L, by: 'w', anc: [0, 0.5], sy: Math.min(1, k * 0.9 / (L * 0.39)), a: Math.min(1, a * 2) })) { ctx.restore(); continue; }   /* r3.197.0：勾玉光線＝手繪鏡光 */
        const beam = (w, col, al) => { ctx.fillStyle = rgb(col, al * a); ctx.beginPath(); ctx.moveTo(0, -w); ctx.quadraticCurveTo(L * 0.5, -w * 0.5, L, 0); ctx.quadraticCurveTo(L * 0.5, w * 0.5, 0, w); ctx.closePath(); ctx.fill(); }; beam(k * 0.07, '8,50,40', 0.6); beam(k * 0.045, '120,240,190', 1); beam(k * 0.018, '255,255,255', 1); ctx.restore();
        sp('fx_magatama', 0, o.x1, o.y1 + k * 0.1, 0.5 + 0.4 * q, { add: 1, a: a }); }
      else if (o.k === 'beam') { const k = HH() * S(o.y), L = k * 6.5, a = 1 - q, h = k * 0.42 * (1 - q * 0.5); ctx.save(); ctx.translate(o.x, o.y); ctx.scale(o.f, 1);   /* r3.196.0：日鏡＝鏡前先亮起日輪（光芒旋轉）＋金邊白芯的光束＋金粉（原本一條白色漸層長方形） */
        if (AFX.fr('b_mb_komakin', 'komakin_mirror_ray', Math.min(3, Math.floor(q * 4)), 0, 0, { size: L, by: 'w', anc: [0, 0.5], sy: 0.75, a: Math.min(1, a * 2) })) { ctx.restore(); continue; }   /* r3.197.0：日鏡光束＝狛金的手繪鏡光 */
        const band = (w, col, al) => { ctx.fillStyle = rgb(col, al * a); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(k * 0.5, -w, k * 1.2, -w); ctx.lineTo(L, -w * 0.7); ctx.lineTo(L, w * 0.7); ctx.lineTo(k * 1.2, w); ctx.quadraticCurveTo(k * 0.5, w, 0, 0); ctx.fill(); };
        band(h * 1.25, '90,50,6', 0.45); band(h, '255,196,90', 0.9); band(h * 0.62, '255,240,190', 1); band(h * 0.28, '255,255,255', 1);
        ctx.rotate(o.t * 0.12); for (let i = 0; i < 12; i++) { ctx.rotate(TAU / 12); ctx.fillStyle = rgb(i % 2 ? '255,196,90' : '255,244,200', 0.9 * a); ctx.beginPath(); ctx.moveTo(k * 0.3, -k * 0.045); ctx.lineTo(k * (i % 2 ? 0.62 : 0.8), 0); ctx.lineTo(k * 0.3, k * 0.045); ctx.fill(); }
        ctx.fillStyle = rgb('90,50,6', 0.6 * a); ctx.beginPath(); ctx.arc(0, 0, k * 0.34, 0, TAU); ctx.fill(); ctx.fillStyle = rgb('255,210,110', a); ctx.beginPath(); ctx.arc(0, 0, k * 0.3, 0, TAU); ctx.fill(); ctx.fillStyle = rgb('255,252,235', a); ctx.beginPath(); ctx.arc(-k * 0.04, -k * 0.04, k * 0.19, 0, TAU); ctx.fill(); ctx.restore();
        if (o.t % 3 === 0 && o._lt !== o.t) { o._lt = o.t; KU('holy', () => G.KF.motes(o.x + o.f * rnd(1, 8) * k, o.y + k * 0.55, 0.55, 2, { sp: 0.6, life: 22 })); } }
      else if (o.k === 'soul') soulDraw(o, hz);
      else if (o.k === 'goho') { const a = Math.min(1, (o.life - o.t) / 20, o.t / 8); if (!o.sh && G.PFX_SHIELD) { o.sh = 1; G.PFX_SHIELD({ c: '255,225,150', c2: '255,245,215' }, o.life - o.t); } else if (!G.PFX_SHIELD) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(255,230,150,' + 0.6 * a + ')'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(H.x, H.y - hz * 0.55, hz * 0.6, hz * 0.75, 0, 0, TAU); ctx.stroke(); ctx.restore(); }   // r3.43.0：改用結界光罩
        if (o.t % 40 < 20) sp('fx_hikagami', 0, H.x + H.face * hz * 0.5, H.y - hz * 0.2, 0.8, { add: 1, a: 0.5 * a }); } }
    for (const c of PET.crane) sp('shiki_crane', Math.floor(G.t / 6) % 4, c.x, c.y, 0.9, { flip: (c.st ? (c.tg && c.tg.x < c.x) : Math.sin(c.a) > 0) });
    if (PET.fox) sp('shiki_fox', PET.fox.st ? 4 + Math.floor(G.t / 5) % 4 : Math.floor(G.t / 8) % 4, PET.fox.x, PET.fox.y, 0.55, { flip: PET.fox.f < 0 });
    for (const m of PET.mag) sp('fx_magatama', 0, H.x + Math.cos(m.a) * hz * 0.75, H.y - hz * 1.0 + Math.sin(m.a) * hz * 0.2, 0.9, { add: 1 });
    for (const b of PET.ball) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, hz * 0.22); g.addColorStop(0, 'rgba(240,255,250,.9)'); g.addColorStop(0.5, 'rgba(150,240,210,.55)'); g.addColorStop(1, 'rgba(150,240,210,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(b.x, b.y, hz * 0.22, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(220,255,245,.7)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(b.x, b.y, hz * 0.15, b.a * 3, b.a * 3 + 3.6); ctx.stroke(); ctx.restore(); } }

  /* ======================= 增益圖示（HUD：名字右邊） ======================= */
  const ICO = [['atk', 'fx_ico_atk'], ['aspd', 'fx_ico_aspd'], ['crit', 'fx_ico_crit'], ['nextCrit', 'fx_ico_nextcrit'], ['dr', 'fx_ico_guard'], ['spd', 'fx_ico_spd']];
  function hud() { const B = BUF(); if (!B || G.mode !== 'play') return; const u = A.get('x2_ui'); if (!u || !u.fx) return; let x = 10 + Math.min(G.SAFE.l, 6) + 92, y = 12 + G.SAFE.t + 1; const L = ICO.filter(([k]) => B.get(k) > 0).map(i => i[1]); if (QI.t > 0) L.unshift('fx_ico_qi');
    for (const n of L) { const R0 = u.fx[n]; if (!R0) continue; const fr = R0.f[0], s = 15 / Math.max(fr[2], fr[3]); ctx.drawImage(u.imgs[fr[7] || 0], fr[0], fr[1], fr[2], fr[3], x, y, fr[2] * s, fr[3] * s); x += 17; } }

  /* ======================= 掛勾 ======================= */
  let tick = 0;
  const fs0 = G.fxStep; G.fxStep = function () { fs0.apply(this, arguments); try { if (++tick % 30 === 1) { if (!R.S || !ON._t) scan(); ON._t = 1; petSync(); afxPre(); } statusStep(); qiStep(); entStep(); petStep(); } catch (x) { console.warn('rune step', x); } };
  const df0 = G.drawFx; G.drawFx = function (Z) { const r = df0.apply(this, arguments); try { statusDraw(); entDraw(); } catch (x) { console.warn('rune draw', x); } return r; };
  const ud0 = G.UI.draw.bind(G.UI); G.UI.draw = function () { ud0(); try { hud(); } catch (x) {} };
  const en0 = G.SC.enter; G.SC.enter = function () { E.length = 0; PET.crane.length = 0; PET.fox = null; PET.mag.length = 0; return en0.apply(this, arguments); };
  (function w() { if (!G.SAVE || !G.SAVE.data || !G.SAVE.data.rpg) return setTimeout(w, 300); try { scan(); } catch (e) {} })();
})();
