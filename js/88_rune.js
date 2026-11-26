/* ==========================================================================
 * 神諭之地 重製版 — 88_rune.js
 * Version : r3.107.2  (2026-11-26)　r3.107.2：吸魂特效改成「被吸過來」：12 縷柔光粒子錯開、螺旋加速吸進胸口＋拖尾，取代一整顆圓球
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
    if (s.fr >= 3) { s.fr = 0; s.frz = sec(1.5); s.frzCd = G.t + sec(6); s.frBig = !!e.bb; G.UI.toast && 0; } }
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
  function statusDraw() { for (const e of G.E) { const s = e.st2; if (!s || e.st === 'dead') continue; const k = Math.max(0.7, (e.ratio || 1) * 0.85), z = (e.ratio || 1) * 0.1;
      if (s.bnT > 0) (G.FLAMES || flames)(e, 1 + s.bn);   // r3.82.0：可由 117 換掉身上火苗   // r3.59.0：原本借用地面火圈圖（整圈火焰）→ 改成身上竄出的小火苗
      if (s.frz > 0) VX.draw2 && VX.draw2(ctx, 'fx_ice_shell', 0, e.x, e.y - HH() * S(e.y) * k * 0.62, k, { a: 0.85 });
      else if (s.fr > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(160,220,255,' + (0.12 * s.fr) + ')'; ctx.beginPath(); ctx.ellipse(e.x, chest(e), HH() * 0.4 * S(e.y) * k, HH() * 0.6 * S(e.y) * k, 0, 0, TAU); ctx.fill(); ctx.restore(); }
      if (s.sk > 0 && G.t % 6 < 3) { const y = chest(e), r = HH() * 0.45 * S(e.y); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(200,190,255,.9)'; ctx.lineWidth = 1.4; ctx.beginPath();
        let px = e.x - r, py = y; ctx.moveTo(px, py); for (let i = 0; i < 5; i++) { px += r * 0.4; py = y + rnd(-r * 0.4, r * 0.4); ctx.lineTo(px, py); } ctx.stroke(); ctx.restore(); }
      if (s.ha > 0) { const y = e.y - HH() * (e.ratio || 1) * S(e.y) * 1.15; ctx.save(); ctx.strokeStyle = 'rgba(255,120,100,.95)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(e.x - 5, y - 5); ctx.lineTo(e.x + 1, y); ctx.lineTo(e.x - 2, y + 2); ctx.lineTo(e.x + 5, y + 6); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,200,180,.7)'; ctx.beginPath(); ctx.arc(e.x, y, 7, 0, TAU); ctx.stroke(); ctx.restore(); } } }

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
    if (lvOf('den') && G.PROC('r_den', 30)) { const s = e.st2; if (s && s.sk > 0) { s.sk = 0; RD(e, 'den', 0.9); const n = nearest(e.x, e.y, HH() * 3, [e]); if (n) { RD(n, 'den', 0.45); VX.bolt && VX.bolt({ x0: e.x, y0: chest(e), x1: n.x, y1: chest(n), col: '200,190,255', life: 12 }); } } else if (Math.random() < 0.15) shock(e); }
    if (lvOf('ha') && big) armor(e);
    if (fin && lvOf('kaze') && ready('kaze', 2)) windBlade('kaze', 1.2, 4.5, '170,255,225');
    if (fin && lvOf('zan') && ready('zan', 3)) moon();
    if ((fin || big) && lvOf('shin') && ready('shin', 4)) quake();
    if (fin && ON.jg.akaorochi && ready('kusanagi', 6)) windBlade('kusanagi', 4.0, 8, '200,255,240', true);
    if (lvOf('un') && /yumi|teppo/.test(G.WPN && G.WPN.curId && G.WPN.curId()) && G.PROC('r_un', 0) && ++shotN % 5 === 0) homing(e, 0.8 * LVM[lvOf('un')], 'arrow');
    if (lvOf('toki') && comboN >= 30 && QI.t <= 0 && ready('toki', 30)) burst(5, 15, 0, false);
    if (ON.set.yomi && e.hp / e.hpMax < 0.2 && alive(e) && (e._ym || 0) < G.t) { e._ym = G.t + sec(6); s2('fx_yomi_hand', { x: e.x, y: e.y, k: 1, life: 30 }); G.STORY.later(10, () => dmg(e, 2.5, true)); }
    if (ON.set.tenmon && G.PROC('r_ten', 0) && ++tenN % 10 === 0) { VX.pillar && VX.pillar({ x: e.x, y: e.y, h: 4, wk: 1 }); G.STORY.later(6, () => dmg(e, 3.0, true)); }
    if (ON.set.foxfire && crit && ready('fox', 2)) for (let i = 0; i < 3; i++) homing(e, 0.6, 'fox', i);
  }
  const do0 = G.damageOni; G.damageOni = function (e, mult, big, fc, opt) { const hero = e && e.st !== 'dead' && !(opt && (opt.party || opt.rune)) && !G._bleedTick, n0 = G.NUMS.length, hp0 = e && e.hp;
    if (hero && e.st2 && e.st2.sk > 0 && !lvOf('den')) e.st2.sk = 0;
    const r = do0.apply(this, arguments);
    if (hero && e && e.hp < hp0) { const nm = G.NUMS[G.NUMS.length - 1], crit = G.NUMS.length > n0 && nm && nm.crit; try { onHit(e, big, crit); } catch (x) { console.warn('rune hit', x); } }
    return r; };
  const ok0 = R.onKill; R.onKill = function (e) { ok0.apply(this, arguments); try {
      if (lvOf('kon') && ready('kon', 0.5)) { const v = Math.round(H.hpMax * 0.03 * LVM[lvOf('kon')]); H.hp = Math.min(H.hpMax, H.hp + v); G.NUMS.push({ x: H.x, y: H.y - HH() * S(H.y) - 10, v: '+' + v, gold: true, t: 0 }); E.push({ k: 'soul', x: e.x, y: chest(e), t: 0, life: 40, sd: Math.random() * 6.28 }); }
      if (ON.set.onibi) { VX.blast && VX.blast({ x: e.x, y: e.y, r: 1.2 }); for (const n of near(e.x, e.y, HH() * 1.5)) if (n !== e) dmg(n, 1.5, true); } } catch (x) { console.warn('rune kill', x); } };
  /* 致命傷：紙人替身、八咫鏡（日鏡）；閃避成功：鏡返 */
  const hh0 = G.hurtHero; G.hurtHero = function (atk, srcX) {
    if (H.inv > 0 && H.act && /dodge|dash/.test(H.act.kind) && ON.set.mirror && ready('mirror', 3)) { const n = nearest(H.x, H.y, HH() * 3); if (n) { VX.ring && VX.ring({ x: H.x, y: H.y, r1: 1.2, life: 14, col: '180,230,255', lw: 0.08 }); G.STORY.later(4, () => { dmg(n, 1.8, true); VX.impact && VX.impact({ x: n.x, y: n.y, z: 0.6, big: 1 }); }); } }
    const r = hh0.apply(this, arguments);
    if (H.hp <= 0) { if (ON.jg.komakin && ready('yata', 60)) { H.hp = 1; H.inv = 90; sunMirror(); } else if (lvOf('mi') && ready('mi', 90)) { H.hp = 1; H.inv = 90; s2('shiki_doll', { x: H.x, y: H.y, k: 1, life: 36 }); G.UI.banner('紙人替身', '替你擋下了致命一擊'); } }
    else if (H.hp < H.hpMax * 0.5 && lvOf('goho') && ready('goho', 30)) { const B = BUF(); if (B) B.add('dr', 50, sec(6)); E.push({ k: 'goho', t: 0, life: sec(6) }); G.UI.toast('護法童子：6 秒減傷 50%'); }
    if (H.hp > 0 && H.hp < H.hpMax * 0.3 && lvOf('ikari') && QI.t <= 0 && ready('ikari', 60)) { const L = LVM[lvOf('ikari')]; burst(8, 25, 20, true, () => { VX.ring && VX.ring({ x: H.x, y: H.y, r1: 2.2, life: 20, col: '255,140,90', lw: 0.12 }); VX.crack && VX.crack({ x: H.x, y: H.y, r: 1.2 }); for (const n of near(H.x, H.y, HH() * 2.2)) dmg(n, 2.0 * L, true); }); }
    return r; };

  /* ======================= 招式本體 ======================= */
  function thunder(e, id) { const L = LVM[lvOf(id) || 1]; VX.bolt && VX.bolt({ x0: e.x + rnd(-10, 10), y0: e.y - HH() * 5, x1: e.x, y1: e.y, col: '200,220,255', life: 14, w: 3 }); VX.sigil && VX.sigil({ x: e.x, y: e.y, kind: 'raiden', r: 0.6, life: 20 });
    dmg(e, 1.5 * L, true); let p = e; const hit = [e]; for (let i = 0; i < 2; i++) { const n = nearest(p.x, p.y, HH() * 3, hit); if (!n) break; hit.push(n); VX.bolt && VX.bolt({ x0: p.x, y0: chest(p), x1: n.x, y1: chest(n), col: '200,220,255', life: 12 }); dmg(n, 0.6 * L); p = n; } }
  function windBlade(id, coef, len, col, giant) { const f = H.face, L = id === 'kusanagi' ? 1 : LVM[lvOf(id) || 1]; E.push({ k: 'blade', x: H.x, y: H.y, f, d: 0, len: len * HH(), spd: HH() * (giant ? 0.32 : 0.22), coef: coef * L, hit: [], col, giant, t: 0, life: 99 });
    if (giant) { G.SC.shake = Math.max(G.SC.shake || 0, 6); G.UI.toast('草薙劍・叢雲'); } }
  function moon() { const f = H.face, L = LVM[lvOf('zan')], cx = H.x + f * HH() * 1.0; E.push({ k: 'moon', x: cx, y: H.y, f, t: 0, life: 18 });
    for (const n of near(cx, H.y, HH() * 1.5)) dmg(n, 1.6 * L, true); }
  function quake() { const L = LVM[lvOf('shin')], x = H.x + H.face * HH() * 0.6; VX.crack && VX.crack({ x, y: H.y, r: 1.1 }); VX.ring && VX.ring({ x, y: H.y, r1: 1.6, life: 16, col: '235,200,140', lw: 0.1 }); VX.debris2 && VX.debris2({ x, y: H.y, n: 6 });
    G.SC.shake = Math.max(G.SC.shake || 0, 5); for (const n of near(x, H.y, HH() * 1.4)) { dmg(n, 1.4 * L, true); if (!n.bb) { n.stun = Math.max(n.stun || 0, 30); n.lift = 0; E.push({ k: 'lift', e: n, t: 0, life: 30 }); } } }
  function homing(e, coef, kind, i) { const y0 = H.y - HH() * S(H.y) * 0.7; E.push({ k: 'hm', kind, x: H.x + rnd(-10, 10), y: y0, z: 0, vx: H.face * 4 + (i || 0) * 1.5 - 1.5, vy: -3 - (i || 0), e, coef, t: 0, life: 90 }); }
  function sunMirror() { s2('fx_hikagami', { x: H.x, y: H.y, k: 1.2, life: 40, z: 0.8, add: 1 }); G.UI.banner('八咫鏡・日鏡', '致命傷被鏡光反射'); G.flash = 8;
    const f = H.face; E.push({ k: 'beam', x: H.x, y: H.y - HH() * S(H.y) * 0.7, f, t: 0, life: 24, col: '255,240,190' }); for (const n of foes()) if ((n.x - H.x) * f > 0 && Math.abs(n.x - H.x) < HH() * 9 && Math.abs(n.y - H.y) < HH() * 0.9) dmg(n, 5.0, true); }
  /* 常駐召喚：紙鶴 3、紙狐 1、勾玉 3、風球 3；週期：雷陣、潮浪、天照 */
  const PET = { crane: [], fox: null, mag: [], ball: [], ballT: 0 };
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
    if (ON.set.thunder && t % sec(10) === 0) { const L = near(hx, hy, hz * 4.5); for (let i = 0; i < 3 && L.length; i++) { const e = L[i % L.length]; G.STORY.later(i * 10, () => { if (!alive(e)) return; VX.bolt && VX.bolt({ x0: e.x, y0: e.y - hz * 5, x1: e.x, y1: e.y, col: '210,220,255', life: 14, w: 3.5 }); VX.sigil && VX.sigil({ x: e.x, y: e.y, kind: 'raiden', r: 0.7, life: 22 }); dmg(e, 1.2, true); }); } }
    if (ON.set.tide && t % sec(8) === 0 && near(hx, hy, hz * 2.5).length) { VX.ring && VX.ring({ x: hx, y: hy, r1: 2.6, life: 22, col: '120,200,255', lw: 0.14 }); VX.wind && VX.wind({ x: hx, y: hy, r: 2.2, n: 8, life: 22, col: '160,220,255', face: 1, spin: 0.5 });
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
      if (o.k === 'blade') { const w = HH() * (o.giant ? 1.4 : 0.8), h = HH() * (o.giant ? 1.8 : 1.0); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(o.x, o.y - h * 0.55); ctx.scale(o.f, 1);
        const g = ctx.createLinearGradient(-w, 0, w * 0.3, 0); g.addColorStop(0, 'rgba(' + o.col + ',0)'); g.addColorStop(0.7, 'rgba(' + o.col + ',0.35)'); g.addColorStop(1, 'rgba(' + o.col + ',0.6)'); ctx.fillStyle = g;
        ctx.beginPath(); ctx.moveTo(-w, -h * 0.45); ctx.quadraticCurveTo(w * 0.55, -h * 0.5, w * 0.35, 0); ctx.quadraticCurveTo(w * 0.55, h * 0.5, -w, h * 0.45); ctx.quadraticCurveTo(w * 0.05, 0, -w, -h * 0.45); ctx.fill(); ctx.restore(); }
      else if (o.k === 'moon') { const r = HH() * 1.3 * (0.6 + 0.4 * Math.min(1, q * 3)), a = 1 - q; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(o.x, o.y - HH() * 0.6); ctx.scale(o.f, 0.75);
        ctx.strokeStyle = 'rgba(255,240,190,' + a + ')'; ctx.lineWidth = HH() * 0.16 * (1 - q * 0.6); ctx.beginPath(); ctx.arc(-r * 0.3, 0, r, -1.2, 1.2); ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,' + a + ')'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(-r * 0.3, 0, r, -1.1, 1.1); ctx.stroke(); ctx.restore(); }
      else if (o.k === 'hm') { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const c = o.kind === 'fox' ? '255,170,90' : '220,240,255'; const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, 9); g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(0.4, 'rgba(' + c + ',.8)'); g.addColorStop(1, 'rgba(' + c + ',0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(o.x, o.y, 9, 0, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(' + c + ',.5)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(o.x - o.vx * 2.5, o.y - o.vy * 2.5); ctx.stroke(); ctx.restore(); }
      else if (o.k === 'ray') { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(160,255,220,' + (1 - q) + ')'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(o.x0, o.y0); ctx.lineTo(o.x1, o.y1); ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,' + (1 - q) + ')'; ctx.lineWidth = 1; ctx.stroke(); ctx.restore(); }
      else if (o.k === 'beam') { const L = HH() * 9, h = HH() * 0.5 * (1 - q * 0.5); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(o.x, o.y); ctx.scale(o.f, 1); const g = ctx.createLinearGradient(0, -h, 0, h); g.addColorStop(0, 'rgba(255,240,190,0)'); g.addColorStop(0.5, 'rgba(255,250,230,' + (1 - q) + ')'); g.addColorStop(1, 'rgba(255,240,190,0)'); ctx.fillStyle = g; ctx.fillRect(0, -h, L, h * 2); ctx.restore(); }
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
  const fs0 = G.fxStep; G.fxStep = function () { fs0.apply(this, arguments); try { if (++tick % 30 === 1) { if (!R.S || !ON._t) scan(); ON._t = 1; petSync(); } statusStep(); qiStep(); entStep(); petStep(); } catch (x) { console.warn('rune step', x); } };
  const df0 = G.drawFx; G.drawFx = function (Z) { const r = df0.apply(this, arguments); try { statusDraw(); entDraw(); } catch (x) { console.warn('rune draw', x); } return r; };
  const ud0 = G.UI.draw.bind(G.UI); G.UI.draw = function () { ud0(); try { hud(); } catch (x) {} };
  const en0 = G.SC.enter; G.SC.enter = function () { E.length = 0; PET.crane.length = 0; PET.fox = null; PET.mag.length = 0; return en0.apply(this, arguments); };
  (function w() { if (!G.SAVE || !G.SAVE.data || !G.SAVE.data.rpg) return setTimeout(w, 300); try { scan(); } catch (e) {} })();
})();
