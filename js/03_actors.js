/* ==========================================================================
 * 神諭之地 重製版 — 03_actors.js
 * Version : r3.201.0  (2026-11-28)　r3.201.0：里歐外型時殘影改用里歐的圖
 * 舊版    : r3.199.0  (2026-11-28)　r3.199.0：塵土改手繪塵圈
 * 舊版    : r3.197.0  (2026-11-28)　r3.197.0：敵人普通近戰出手時有爪痕／揮擊弧光
 * 舊版    : r3.196.0  (2026-11-28)　受擊白閃減半、舊版預警改柔光、掉落光柱柔邊、秘傳時隱藏妖怪血條
 * 舊版    : r3.195.0  (2026-11-28)　會心傷害數字重做（大字、橘紅金黃漸層、斬痕、驚嘆號），跟一般數字拉開
 * 舊版    : r3.190.0  (2026-11-28)　追蹤飛行物轉彎維持原速
 * 舊版    : r3.154.0  (2026-11-27)　r3.154.0：夥伴特效（spr）可加發光層 glow
 * 舊版    : r3.151.0  (2026-11-27)　r3.151.0：劇情人物靜態圖站著時加呼吸起伏
 * 舊版    : r3.148.0  (2026-11-27)　r3.148.0：衝刺 Lv5 穿過的敵人停頓 0.5 秒
 * 舊版    : r3.146.0  (2026-11-27)　r3.146.0：「此鍵尚未設定」提示加前往按鈕
 * 舊版    : r3.145.0  (2026-11-27)　掉落物：稀品以上才顯示名字，光柱高度依品質拉開；r3.145.0：傷害數字放大（一般 19、暴擊 28），出現與合併時彈一下，暴擊上跳
 * 舊版    : r3.143.0  (2026-11-27)　r3.143.0：和弓特性：普攻出箭中可移動（不轉身，速度 ×0.6）
 * 舊版    : r3.126.0  (2026-11-27)　r3.126.0：里歐出招中本體步進直接略過（讓外層各模組的每格處理照常執行）
 * 舊版    : r3.111.0  (2026-11-26)　r3.111.0：近戰外框橢圓預警停用（改由 139_foeai 畫頭目同款預警）
 * 舊版    : r3.107.0  (2026-11-26)　r3.107.0：暫時攻擊%（茶屋糰子、名物、招式增益 G.BUFF atk）併入攻擊區，與裝備／修練的攻擊% 同區相加
 * 舊版    : r3.106.0  (2026-11-26)　r3.106.0：掉落物繪製掛點 G.LOOTDRAW（134_econ：銅錢／寶箱）
 * 舊版    : r3.105.0  (2026-11-26)　r3.105.0：傷害數字 1 萬以上顯示「萬」（G.fmtN）
 * 舊版    : r3.94.0  (2026-11-26)　r3.94.0：傷害改 5 區（G.DZ：增傷相加上限 300%、易傷破甲上限 60%）；觸發閘 G.PROC（每次出手 1 次＋內部冷卻）
 * 舊版    : r3.93.0  （r3.93.0：倒下先交給 G.heroDown（122_bal：復甦站起／小雪救回神社），沒接手才原地站起）
 * 舊版    : r3.87.0  （r3.87.0：掉落物腳下品質色圈拿掉）
 * 舊版    : r3.71.1  （r3.71.1：招式鍵出招中按下一律緩衝；連段等待 0.5→0.75 秒）
 * 舊版    : r3.53.0  （r3.53.0：防禦常數 G.DEFK 隨等級成長）　舊版 r3.51.0  （r3.51.0：一般妖怪血量 ×2.5）
 * 舊版    : r3.49.0  （r3.49.0：大型妖怪身體寬度——主角不會走進牠身體裡；攻擊判定、牠的出手距離都依實際畫面寬度）
 * 舊版    : r3.21.0  （r3.21.0：撞牆沿牆滑開，不卡矮屋）
 * 舊版    : r3.20.3  （r3.20.3：一般敵人出手放慢 1.6 倍）
 * 舊版    : r3.19.2  （後跳距離吃「踏跳」；敵人可改打誘敵分身）
 * 舊版    : r3.19.1  （跑步速度 2.3→2.75）
 * 舊版    : r3.18.3  （r3.18.3：drawNpc 支援圖集待機（任務委託的頭目／夥伴））
 * 舊版    : r3.16.0  (2026-11-14)
 * 變更    : r3.14.0 普攻判定可偏移圓心（ev.cx，下劈落點）；G.WPN.onFire 鉤子（刺光、流血等）。
 * 變更    : r3.13.0 遠程普攻改由 G.WPN.shoot（槍口／弓弦出手、分類飛行物）；飛行物可帶擊退 p.kb；向量飛行物 p.pk 由 G.FXV.proj 繪製。
 * 變更    : r3.12.0 武器重做接口：每招尺寸校正（G.WPN.actK）、刃線錨點（特效跟著刀身逐格移動）、普攻判定覆寫（patchAct）、
 *           招式改走行為引擎（SKB）、交鋒返脈反擊後可直接接普攻第 4 段、向量特效（G.FXV）與花瓣飛行物。spawnFx 回傳特效物件。
 * 變更    : r3.11.1 走／跑：開始移動一律先走，持續推 0.6 秒（且推過半）才轉跑；放開／推淺回走；跑步中急轉（反向）煞車 0.12 秒回走再加速。
 *           速度 走 1.0／跑 2.3；動畫播放速度跟實際移動速度同步（不滑步）；走路加上下起伏；起跑揚塵。掉落顏色防呆。
 * 變更    : r3.10.0 夥伴出戰：妖怪依仇恨選目標（可打夥伴）；主角受傷先經夥伴護擋／護印；夥伴出手走 damageOni 但用夥伴能力值；
 *           主角重擊命中觸發小連攜；夥伴與投射物一起排序繪製。
 * 變更    : r3.9.1 繪製排序加入前景遮擋物（48_occlude）：角色走到柱子／樹幹後方時被遮住；
 *           NPC 走位踏步（n.walking）與石像狀態（n.stone 灰階）。
 * 變更    : r3.8.0 新增 G.hurtHero（見下）。
 * 變更    : r3.7.2 妖怪體型分級（微0.8／小0.9／人1.0／大1.35／巨1.6，妖狐・狐火1.1），以原圖實測高度（橫向身形取身長）換算；
 *           浮空／輪心錨點改腳底；招式個別比例 k（妖狐・山童・轆轤首）。體型與強弱分開：微／小仍較弱較快。
 *           新增 G.hurtHero(atk, srcX)：頭目招式共用的主角受傷（防禦／架勢減傷、無敵幀、霸體）。
 * 變更    : r3.1.0 技／特技／奧義改由 15_skill 行為引擎執行；增益／敵人狀態（降防、易傷、標記、緩速）計入傷害；霸體不被打斷；
 *           投射物：追蹤、迴旋回程、拋物線、爆炸範圍、分裂、散彈；長時間招式動畫循環；跳躍高度。
 * 變更    : r3.0.5 箭矢／子彈／炸彈放大 2.2 倍並加彈道殘影（原本太小看不到）。
 * 變更    : r3.0.4 按鍵改為 普攻／招式×3（組合技）／技×2／身法×2／奧義；閃身依搖桿方向、不推＝後跳；架勢招式格擋反擊；
 *           技能接專屬特效＋屬性特效；進化／極意實效（範圍、多段、劍氣、持續傷害區、暈眩、必暴擊、回復、穿透、拉近）；
 *           招式收招停 0.1 秒；奧義無敵上限 40 格；千本櫻結束落櫻。
 * 變更    : r3.0.3 刀光放大（普攻 ×1.6、技能／奧義 ×1.9）、命中特效 ×1.4。
 * 變更    : r3.0.2 修正刀光／命中特效畫在腳底（特效錨點為圖片中心，改放胸口高度）；跑步改用 8 格專用跑步動作。
 * 變更    : r3.0.1 走／跑切換加遲滯、換步態時從第 1 格開始（修正移動抽筋；圖集水平錨點改軀幹中心，見 a/p）。
 * 變更    : r3.0.0 主角改用武器圖集（12_anim）逐幀錨點／毫秒播放；10 武器普攻連段＋技／特技／奧義由動作合約驅動
 *           （命中時間、形狀 sector/line/circle/field/projectile、位移、無敵、可取消時機）；投射物；圖集特效；
 *           敵人改為多種妖怪（P2 圖集，依場景名單載入），赤鬼保留舊圖；白閃剪影改 LRU 上限 240 格。
 * 變更    : r2.2.0 掉落物分錢／素材／裝備，各用不同顏色光柱與名牌；錢自動飛向主角；NPC 對話泡泡掛點。
 * 說明    : 角色——主角狀態機（idle／walk(run)／atk／skill／ult／dodge／dash／hurt）、敵人 AI（接近→紅圈預警→判定→硬直）、
 *           NPC、白丸協戰、掉落物、特效／數字。依賴：00_core、02_scene、12_anim、13_weapons。輸入由 04_ui 寫入 G.IN。
 *           合約單位換算：距離 ×K（1.4）＝本版世界座標；傷害倍率＝合約傷害／16（打刀普攻第 1 段＝1.0）。
 * ========================================================================== */
'use strict';
G.H = { x: 150, y: 650, face: 1, st: 'idle', t: 0, ms: 0, hp: 120, hpMax: 120, combo: 0, buf: false, inv: 0, vx: 0, dist: 0, dashCd: 0, hits: [], act: null, cd: {} };
G.E = []; G.FX = []; G.NUMS = []; G.NPC = []; G.PROJ = []; G.hitstop = 0; G.flash = 0;
G.ONI_RATIO = 1.38;
(function () {
  const ctx = G.ctx, H = G.H, SC = G.SC, A = G.ANIM, K = 1.4, DMG0 = 16, TK = 1000 / 60, RUN_MS = 600;   // RUN_MS：持續推多久從走轉跑
  const HITFX = { cut: 'weapon_cut_a', thrust: 'weapon_thrust_a', blunt: 'weapon_blunt_a' };
  function tryMove(o, dx, dy) { const nx = o.x + dx, ny = o.y + dy;
    if (SC.walkable(nx, ny)) { o.x = nx; o.y = ny; return true; } if (Math.abs(dx) > 0.05 && SC.walkable(nx, o.y)) { o.x = nx; return true; } if (Math.abs(dy) > 0.05 && SC.walkable(o.x, ny)) { o.y = ny; return true; }
    const L = Math.hypot(dx, dy), a0 = Math.atan2(dy, dx); if (L > 0.3) { const sg = o.sl || 1; for (const r of [0.6 * sg, -0.6 * sg, 1.2 * sg, -1.2 * sg, 1.57 * sg, -1.57 * sg]) { const ax = o.x + Math.cos(a0 + r) * L, ay = o.y + Math.sin(a0 + r) * L; if (SC.walkable(ax, ay)) { o.x = ax; o.y = ay; o.sl = Math.sign(r); return true; } } }   /* r3.21.0：正面撞牆時沿牆滑開，不卡在矮屋／障礙角 */
    return false; }
  G.tryMove = tryMove;
  const U = () => G.WPN.unit(), REC = n => { const u = U(); return u && u.act[n]; };
  const cheat = k => G.CHEAT && G.CHEAT.on[k];

  /* ---------- 動作（合約驅動） ---------- */
  function ticksOf(r) { return r.c && r.c.dur ? r.c.dur : Math.max(6, Math.round(A.dur(r) / TK)); }
  function synthEvents(r, T) {   // 沒合約的動作：以 hit 格換算時間，預設前方扇形
    if (!r.hit || !r.hit.length) return [];
    const tot = A.dur(r), out = []; for (const hi of r.hit) { let ms = 0; for (let i = 0; i < hi && i < r.f.length; i++) ms += r.f[i][6] || 66.7;
      out.push({ at: Math.round(ms / tot * T), damage: DMG0, shape: 'sector', reach: 56, arc: 1.6 }); } return out; }
  function startAct(name, kind, o) {
    const r = REC(name); if (!r) return false; if (!r._p && G.WPN.patchAct) G.WPN.patchAct(name, r); const T = ticksOf(r), hasEv = r.c && r.c.ev && r.c.ev.length;
    H.act = Object.assign({ name, r, c: r.c || null, T, ev: hasEv ? r.c.ev : (kind === 'atk' || kind === 'skill' || kind === 'ult' ? synthEvents(r, T) : []), ei: 0, kind, mult: 1, tier: 0 }, o || {});
    H.st = kind; H.t = 0; H.hits = []; H.buf = false; if (G.AU && (kind === 'atk' || kind === 'skill' || kind === 'ult')) G.AU.sfx(G.WPN.curId() === 'teppo' ? 'shot' : G.WPN.curId() === 'yumi' ? 'bow' : 'swing'); return true; }
  G.heroStartAct = startAct;
  function canCancel(slot) { const a = H.act; if (!a) return true; if (a.kind === 'hurt') return false; const cx = a.c && a.c.cx;
    const at = cx && cx[slot] != null ? cx[slot] : a.T * 0.6; return H.t >= at; }

  /* 按鍵：atk 普攻｜c1–c3 招式（組合技）｜skA skB 技／特技｜m1 m2 身法｜ult 奧義 */
  const KEYS = ['c1', 'c2', 'c3', 'skA', 'skB', 'm1', 'm2', 'ult'];
  G.heroStep = function () {
    if (G.LEON && G.LEON.CUR) return;   /* r3.126.0：里歐招式由 145 自己步進 */
    const IN = G.IN, W = G.WPN, R = G.RPG, rd = R.d(); let mx = IN.mx, my = IN.my; const m = Math.hypot(mx, my); if (m > 1) { mx /= m; my /= m; }
    H.t++; if (H.chainSt && H.chainSt.win > 0) H.chainSt.win--; if (H.inv > 0) H.inv--; if (H.recov > 0) H.recov--; for (const k in H.cd) if (H.cd[k] > 0) H.cd[k]--;
    if (cheat('qi')) rd.qi = 100; if (cheat('god')) H.hp = H.hpMax;
    const free = H.st === 'idle' || H.st === 'walk', face = () => { if (Math.abs(mx) > 0.2) H.face = Math.sign(mx); };
    const wp = W.cur(), u = U();
    if (!u) { IN.atk = false; for (const k of KEYS) IN[k] = false; return; }
    const sl = W.slots(), CD = (k, t) => { H.cd[k] = cheat('nocd') ? 0 : t; };
    if (H.chainBuf && (!H.act || canCancel(1))) { IN[H.chainBuf] = true; H.chainBuf = null; }   // 招式鍵連按緩衝：出招中按下，可取消時自動接下一段
    for (const key of KEYS) { if (!IN[key]) continue; IN[key] = false;
      if (key[0] === 'c' && H.act && !canCancel(1)) { H.chainBuf = key; continue; }   // r3.71.1：任何招式鍵在出招中按下都先緩衝（原本只緩衝同一鍵，接別的鍵會被吃掉）
      if (!(free || canCancel(1))) continue;
      /* 身法 */
      if (key === 'm1' || key === 'm2') { const b = wp.BD[sl.M[key === 'm1' ? 0 : 1]]; if (!b) continue; const ck = 'm:' + b.id; if ((H.cd[ck] || 0) > 0) continue;
        let clip = b.a; if (b.id === 'dodge') { if (Math.abs(mx) > 0.2) H.face = Math.sign(mx); else clip = REC('backstep') ? 'backstep' : clip; } else face();   // 閃身：推搖桿＝往該方向；不推＝後跳
        if (startAct(clip, b.id === 'shunpo' || b.id === 'slide' ? 'dash' : 'dodge')) { const GW = G.GROW; CD(ck, GW ? Math.max(6, Math.round(b.cd * GW.dodgeMul()) - (b.id === 'dodge' ? GW.dodgeSub() : 0)) : b.cd); H.inv = Math.max(H.inv, 12); H.act.dm = (GW ? GW.distMul(H.act.kind) : 1) * (b.id === 'backstep' && GW ? 1 + ((GW.A || {}).backDist || 0) / 100 : 1); H.lastBody = b.id; if (GW && H.act.kind === 'dodge') GW.onDodge(); }
        continue; }
      /* 招式（組合技） */
      if (key[0] === 'c') { const ci = +key[1] - 1, ch = W.chain(ci), cs = H.chainSt;   // 招式鍵：連按依序出第 1→2→3 段
        let seg = cs && cs.k === ci && cs.win > 0 && cs.i < 2 && ch[cs.i + 1] ? cs.i + 1 : 0;
        const mv = wp.MV[ch[seg]]; if (!mv) { G.UI.toast('此鍵尚未設定招式', () => { G.MENU.show(); G.MENU.goto && G.MENU.goto('按鍵'); }); continue; }
        if (!W.mvOk(mv)) { G.UI.toast(mv.n + '：熟練度 ' + mv.u + ' 解鎖'); continue; }
        const ck = 'k:' + ci; if (!seg && (H.cd[ck] || 0) > 0) continue; face();
        if (startAct(mv.id, mv.k === 'guard' ? 'guard' : 'skill', { mult: (G.GROW ? G.GROW.mvMul() : 1) * (seg === 2 ? 1.2 : 1), chainK: ci, seg })) {
          if (G.SKB && G.SKB.get(W.curId(), mv.id)) G.SKB.start(H.act, mv, W.mvLv(mv));   // 招式：有行為表就走行為引擎（判定／三階）
          if (!seg) CD(ck, Math.round(W.chainCd(ci) * (G.GROW ? G.GROW.mvCdMul() : 1)));
          H.chainSt = { k: ci, i: seg, win: H.act.T + 45 }; }   // 收招後 0.5 秒內再按＝下一段；第 3 段 ×1.2
        continue; }
      /* 技 A／技 B／奧義 */
      const s = key === 'ult' ? W.ult() : wp.SK[sl[key === 'skA' ? 'A' : 'B']];
      if (!s) { G.UI.toast('此鍵尚未設定技能', () => { G.MENU.show(); G.MENU.goto && G.MENU.goto('技能'); }); continue; }
      const lv = W.lv(s.id); if (!lv) { G.UI.toast(s.n + '：尚未學會（選單 › 技能）'); continue; }
      if (s.t === '奧義') { if (rd.qi < 100) { G.UI.toast('「氣」尚未集滿'); continue; } }
      else if ((H.cd[s.id] || 0) > 0) continue;
      face();
      const md = W.mods(s, lv);
      if (startAct(W.clipOf(s, lv), s.t === '奧義' ? 'ult' : 'skill', { mult: W.mult(s, lv), tier: W.tier(lv), sk: s, md, efx: specFx(wp, s), elem: W.elemFx(s) })) {
        if (s.t === '奧義') rd.qi = 0; else CD(s.id, Math.round(W.cd(s) * 60 * (md.cdr ? 0.8 : 1) * (1 - G.BUFF.get('cdr') / 100)));
        const act0 = H.act; const viaBeh = G.SKB && G.SKB.start(H.act, s, lv); if (G.GROW) G.GROW.onSkill(act0, s, key);   // 15_skill：依招式說明的專屬行為
        if (!viaBeh && md.extra) addExtra(H.act, md.extra);
        H.inv = Math.max(H.inv, s.t === '奧義' ? Math.min(H.act.T, 40) : 6); }
    }
    /* 普攻連段 */
    if (IN.atk) { if (H.st === 'atk') H.buf = true; else if (free || (H.toFinish && H.act && H.act.kind === 'guard')) { face(); H.combo = H.toFinish ? wp.combo.length - 1 : 0; H.toFinish = 0; startAct(wp.combo[H.combo], 'atk', { mult: 1 }); } }   // 交鋒返脈極意：反擊後直接接普攻第 4 段
    IN.atk = false;
    if (H.act) actStep(mx, my, wp);
    else {
      const moving = H.st === 'walk' ? m > 0.12 : m > 0.25, sp0 = 1 + ((R.S ? R.S.spd : 0) + (G.GROW ? G.GROW.spdBonus() : 0)) / 100;
      if (moving) { H.recov = 0; if (H.st !== 'walk') { H.st = 'walk'; H.t = 0; H.run = false; H.mvT = 0; }
        if (Math.abs(mx) > 0.3) H.face = Math.sign(mx);
        // 走→跑：持續推 RUN_MS 且推過半才跑；跑中推淺（<0.3）回走；反向急轉：煞車 0.12 秒（回走，計時退到 0.48 秒）
        const ux = mx / Math.max(m, .01), uy = my / Math.max(m, .01);
        if (H.run && H.ux !== undefined && ux * H.ux + uy * H.uy < -0.5) { H.run = false; H.ms = 0; H.mvT = (RUN_MS - 120) / TK; }
        H.ux = ux; H.uy = uy; H.mvT = (H.mvT || 0) + (m > 0.5 ? 1 : 0);
        const run = H.run ? m > 0.3 : H.mvT * TK >= RUN_MS;
        if (run !== H.run) { H.run = run; H.ms = 0; if (run) G.FX.push({ k: 'dust', x: H.x - H.face * 12, y: H.y, t: 0, life: 16 }); }
        const base = run ? 2.75 : 1.0, k = Math.min(1, m) * base * sp0; H.dist += k; H.ms += TK * Math.max(0.5, Math.min(1.3, k / base));
        tryMove(H, mx / Math.max(m, .01) * k, my / Math.max(m, .01) * k * 0.7); }
      else { if (H.st !== 'idle') { H.st = 'idle'; H.t = 0; } H.ms += TK; H.mvT = 0; H.run = false; }
    }
    G.fieldStep(); G.SKB && G.SKB.step();
    if (H.hp <= 0 && !(G.heroDown && G.heroDown())) { H.hp = H.hpMax; G.UI.banner('再站起來一次'); G.SAVE.data.flags.downs = (G.SAVE.data.flags.downs || 0) + 1; }
  };
  /* 專屬特效：武器包裡名稱含招式代號者優先（居合 iai_fx、櫻 sakura_fx、奧義 ultimate_fx…） */
  function specFx(wp, s) { const u = U(); if (!u || !u.fx) return null; const stem = s.id.replace(/^(skill_|special_|ultimate_)/, '');
    if (s.t === '奧義') { const k = 'hero_' + wp.id + '_ultimate_fx'; if (u.fx[k]) return k; }
    for (const k in u.fx) if (k.indexOf('_' + stem + '_fx') >= 0) return k; return null; }
  /* 進化／極意「多段」：在最後一擊後追加同形狀的判定 */
  function addExtra(a, n) { if (!a.ev.length) return; const last = a.ev[a.ev.length - 1]; a.ev = a.ev.slice();
    for (let i = 1; i <= n; i++) a.ev.push(Object.assign({}, last, { at: Math.min(a.T - 1, last.at + 7 * i), damage: (last.damage || DMG0) * 0.7 })); }
  function actStep(mx, my, wp) {
    const a = H.act, c = a.c, t = H.t;
    if (a.kind === 'atk' && wp.id === 'yumi' && Math.hypot(mx, my) > 0.2) tryMove(H, mx * 0.6, my * 0.42);   // r3.143.0：和弓邊走邊射
    if (a.beh) G.SKB.tick(a, mx, my);
    else if (c && c.mv) { const [dist, f0, f1, i0, i1] = c.mv; if (t >= f0 && t < f1 && f1 > f0) tryMove(H, H.face * dist * K * (a.dm || 1) / (f1 - f0), my * 0.8); if (t >= i0 && t < i1) H.inv = Math.max(H.inv, 2); }
    else if (a.kind === 'dash') tryMove(H, H.face * (t < 12 ? 7.5 : 2), my * 1.5);
    if (a.kind === 'hurt') tryMove(H, -H.face * 1.2, 0);
    if (a.kind === 'guard') H.guard = t < a.T;   // 架勢：期間受擊自動格擋反擊
    if (a.kind === 'dash') { dashHit(); if (t % 3 === 0) ghost(); }
    if (a.kind === 'ult' && t % 4 === 0) ghost();
    while (a.ei < a.ev.length && t >= a.ev[a.ei].at) { const ev = a.ev[a.ei++]; fire(ev, a, wp, a.ei === a.ev.length); }
    if (H.act !== a) return;
    if (a.kind === 'atk' && H.buf && H.combo + 1 < wp.combo.length && canCancel(0)) { nextCombo(mx, wp); return; }
    if (t >= a.T) { if (a.kind === 'atk' && H.buf && H.combo + 1 < wp.combo.length) { nextCombo(mx, wp); return; }
      if (a.sk && a.sk.id === 'sakura') G.spawnFx('hero_katana_sakura_fall', 0, H.x, H.y - G.HERO_H * 0.6 * SC.depth(H.y), H.face, SC.depth(H.y) * 2);
      H.lastFr = heroFrame(); H.lastN = a.name; H.recov = a.kind === 'atk' || a.kind === 'dodge' || a.kind === 'dash' ? 0 : 6;   // 招式收招：停在最後一格約 0.1 秒再回待機
      H.act = null; H.guard = false; H.st = 'idle'; H.t = 0; H.ms = 0; H.buf = false; }
  }
  function nextCombo(mx, wp) { const n = H.combo + 1; if (Math.abs(mx) > 0.2) H.face = Math.sign(mx); if (startAct(wp.combo[n], 'atk', { mult: 1 })) H.combo = n; else { H.act = null; H.st = 'idle'; } }
  function ghost() { const u = U(), fr = heroFrame(); if (u && fr) G.FX.push({ k: 'ghost', u: u.key, fr, x: H.x, y: H.y, face: H.face, s: SC.depth(H.y) * G.WPN.actK(H.act && H.act.name), t: 0, life: 14 }); }

  /* ---------- 判定 ---------- */
  function fire(ev, a, wp, last) {
    const s = SC.depth(H.y), md = a.md || {}, mult = (ev.damage || DMG0) / DMG0 * a.mult * (a.sk && wp.id === 'staff' ? 1.2 : 1);
    const big = a.kind === 'atk' ? H.combo === wp.combo.length - 1 : last, area = md.area || 1;
    const bp = G.WPN.bladePt(), fxS = s * (a.kind === 'atk' ? 1.6 : 1.9) * Math.sqrt(area), fx0 = bp ? bp[0] : H.x + H.face * G.HERO_H * 0.45 * s, fy0 = bp ? bp[1] : H.y - G.HERO_H * 0.52 * s;
    if (G.WPN.onFire) G.WPN.onFire(ev, a, bp);
    const sf = spawnFx(a.efx || ev.effect, a.efx ? 0 : a.tier, fx0, fy0, H.face, fxS); if (bp && sf) { sf.act = a; sf.fol = 1; }   // 刀光：刃線錨點，跟著刀身逐格移動（無資料才放胸前）
    if (a.elem && (last || a.ei === 1)) { const rr = (ev.reach || 50) * K * s * area; spawnFx(a.elem, 0, ev.shape === 'circle' || ev.shape === 'field' ? H.x : H.x + H.face * rr * 0.6, H.y - G.HERO_H * 0.45 * s, H.face, s * 1.6 * Math.sqrt(area)); }
    if (md.heal && last) H.hp = Math.min(H.hpMax, H.hp + H.hpMax * 0.08);
    if (md.wave && last) G.PROJ.push({ x: H.x + H.face * 24 * s, y: H.y, h: 34 * s, vx: H.face * 9, vy: 0, left: G.HERO_H * 6, mult: mult * 0.8, big: true, pierce: 9, hits: [], face: H.face, img: 'skill_wind_blade_a', sc: 1.6 });
    if (ev.shape === 'buff') { H.hp = Math.min(H.hpMax, H.hp + H.hpMax * 0.05); return; }
    if (ev.shape === 'projectile') { if (G.WPN.shoot && G.WPN.shoot(ev, a, mult, big)) return; const ang = ev.angles && ev.angles.length ? ev.angles : [0], sp = (ev.speed || 6) * K;
      for (const an of ang) G.PROJ.push({ x: H.x + H.face * 20 * s, y: H.y, h: 34 * s, vx: H.face * Math.cos(an) * sp, vy: Math.sin(an) * sp * 0.5, left: (ev.range || ev.reach || 150) * K * area,
        mult, big, pierce: (wp.id === 'yumi' && a.kind !== 'atk') || wp.id === 'yari' || md.pierce ? 3 : 1, hits: [], face: H.face, stun: md.stun,
        img: wp.id === 'teppo' ? 'projectile_bullet_a' : wp.id === 'yumi' ? 'projectile_arrow_a' : wp.id === 'ono' ? 'projectile_stone_a' : 'projectile_release_a' });
      return; }
    const reach = (ev.reach || 50) * K * s * area, wdt = Math.max(26, (ev.width || 6) * K * 3) * s * Math.sqrt(area);
    let any = 0;
    for (const e of G.E) { if (e.st === 'dead' || e.delay > 0) continue;
      const dx = (e.x - H.x) * H.face, dy = e.y - H.y, ad = Math.abs(dy), bx = G.bodyX(e); let ok;
      if (ev.shape === 'circle' || ev.shape === 'field') ok = Math.hypot(e.x - H.x - H.face * (ev.cx || 0) * G.HERO_H * s, dy * 1.8) < reach + 18 + bx;
      else if (ev.shape === 'line') ok = dx > -12 - bx && dx < reach + 22 + bx && ad < wdt + bx * 0.25;
      else ok = dx > -12 - bx && dx < reach + 22 + bx && ad < Math.max(30, reach * Math.sin(Math.min(1.5, (ev.arc || 1.2) / 2)) * 0.55) + bx * 0.25;
      if (ok) { any++; if (md.pull) e.x += (H.x + H.face * 30 - e.x) * 0.5; G.damageOni(e, mult, big, md.crit && last); if (ev.kb) e.kb = H.face * ev.kb * G.HERO_H * s / 5 / (e.ratio || 1); if (md.stun && last) e.stun = 60; hitFx(e, wp); } }
    if (md.dot && last) G.FIELDS.push({ x: ev.shape === 'circle' || ev.shape === 'field' ? H.x : H.x + H.face * reach * 0.6, y: H.y, r: Math.max(50, reach * 0.7), t: 0, life: 180, mult: mult * 0.25, fx: a.elem || 'skill_fire_ground_a' });
    if (any) { G.hitstop = big ? 6 : 3; SC.shake = big ? 7 : 3; G.WPN.gainProf(1); }
  }
  /* 持續傷害區（極意：燃燒／流血／殘留…）：每 0.5 秒對範圍內敵人造成傷害 */
  G.FIELDS = [];
  G.fieldStep = function () { if (!G.FIELDS.length) return;
    for (const f of G.FIELDS) { f.t++; if (f.t % 30 === 0) { for (const e of G.E) if (e.st !== 'dead' && e.delay <= 0 && Math.hypot(e.x - f.x, (e.y - f.y) * 1.8) < f.r) G.damageOni(e, f.mult, false);
        if (f.t % 60 === 0) spawnFx(f.fx, 0, f.x, f.y - 14, 1, SC.depth(f.y) * 1.3); } }
    G.FIELDS = G.FIELDS.filter(f => f.t < f.life); };
  function dashHit() { const wp = G.WPN.cur();
    for (const e of G.E) { if (e.st === 'dead' || e.delay > 0 || H.hits.includes(e)) continue;
      if (Math.abs(e.x - H.x) < 34 && Math.abs(e.y - H.y) < 30) { H.hits.push(e); G.damageOni(e, 1.4, true); hitFx(e, wp); G.hitstop = 4; SC.shake = 5;
        if (G.GROW && G.GROW.F && G.GROW.F.dashHit) e.stun = Math.max(e.stun || 0, e.boss || e.bb ? 12 : 30); } } }   // r3.148.0：修練「衝刺」Lv5：穿過的敵人停頓（頭目 0.2 秒）
  function hitFx(e, wp) { const s = SC.depth(e.y); spawnFx(HITFX[wp.hitfx], 0, e.x - H.face * 6, e.y - G.HERO_H * 0.5 * e.ratio * s, H.face, s * 1.4);
    for (let i = 0; i < 4; i++) G.FX.push({ k: 'spark', x: e.x - H.face * 8, y: e.y - 50 * s, vx: H.face * (1 + Math.random() * 3), vy: -1 - Math.random() * 2.5, t: 0, life: 18 }); }
  /* 圖集特效：先找武器包，再找共用包；技能等級 3／5 換 evolved／master 版。特效格的錨點＝圖片中心 → 中心放在 (x,y) */
  function spawnFx(name, tier, x, y, face, s) {
    if (!name) return; if (tier && name.endsWith('_basic')) name = name.replace(/_basic$/, tier === 2 ? '_master' : '_evolved');
    const w = U(), fc = A.get('fx_common'); let u = null, r = null;
    if (w && w.fx && w.fx[name]) { u = w; r = w.fx[name]; } else if (fc && fc.fx[name]) { u = fc; r = fc.fx[name]; }
    if (!r) return; const life = Math.max(6, Math.round(A.dur(r) / TK));
    const f = { k: 'spr', u: u.key, r, x, y, face, s, t: 0, life }; G.FX.push(f); return f;
  }
  G.spawnFx = spawnFx;
  G.projStep = function () {
    if (!G.PROJ.length) return;
    for (const p of G.PROJ) {
      if (p.home) { let best = null, bd = 1e9; for (const e of G.E) { if (e.st === 'dead' || e.delay > 0 || p.hits.includes(e)) continue; const d = Math.hypot(e.x - p.x, e.y - p.y); if (d < bd) { bd = d; best = e; } }
        if (best) { const sp = p.sp0 || (p.sp0 = Math.hypot(p.vx, p.vy)) || 1, dx = best.x - p.x, dy = best.y - p.y, d = Math.hypot(dx, dy) || 1; p.vx += (dx / d * sp - p.vx) * 0.15; p.vy += (dy / d * sp - p.vy) * 0.15; const v = Math.hypot(p.vx, p.vy); if (v > 0.001) { p.vx *= sp / v; p.vy *= sp / v; } p.face = Math.sign(p.vx) || p.face; } }   /* r3.190.0：轉彎維持原速 */
      p.x += p.vx; p.y += p.vy; p.left -= Math.hypot(p.vx, p.vy);
      if (p.lob) p.arc = Math.sin(Math.max(0, 1 - p.left / p.d0) * Math.PI) * 40;
      if (p.x < 0 || p.x > SC.def.w) p.left = 0;
      for (const e of G.E) { if (p.left <= 0) break; if (e.st === 'dead' || e.delay > 0 || p.hits.includes(e)) continue;
        const bx = G.bodyX(e); if (Math.abs(e.x - p.x) < 22 + bx && Math.abs(e.y - p.y) < 26 + bx * 0.25) { p.hits.push(e);
          if (p.a && G.SKB) G.SKB.hitE(e, p.a, p.raw !== undefined ? p.raw : p.mult, { big: p.big, crit: p.crit, stun: p.stun, last: p.big, ign: p.ign }); else { G.damageOni(e, p.mult, p.big); if (p.stun) e.stun = 60; }
          if (p.kb) e.kb = Math.sign(p.vx || p.face) * p.kb / (e.ratio || 1); hitFx(e, G.WPN.cur()); G.hitstop = 2;
          if (p.scatter) for (let k = -1; k <= 1; k++) G.PROJ.push({ x: p.x, y: p.y, h: p.h, vx: p.vx, vy: k * 2, left: 120, mult: p.mult * 0.5, raw: (p.raw || p.mult) * 0.5, a: p.a, big: false, pierce: 1, hits: [e], face: p.face, img: p.img, sc: 1.6 });
          if (p.hits.length >= p.pierce || p.bomb) p.left = 0; } }
      if (p.left <= 0 && p.ret && !p.back) { p.back = true; p.left = p.d0; p.vx = -p.vx; p.vy = -p.vy; p.hits = []; p.face = -p.face; }   // 迴旋：回程再打一次
      if (p.left <= 0 && p.bomb && !p.done) { p.done = true; G.spawnFx('skill_fire_rim_a', 0, p.x, p.y - p.h, 1, SC.depth(p.y) * 2.2 * p.bomb / (G.HERO_H * 1.2)); SC.shake = 6;
        for (const e of G.E) if (e.st !== 'dead' && e.delay <= 0 && Math.hypot(e.x - p.x, (e.y - p.y) * 1.8) < p.bomb + 16 && p.a && G.SKB) G.SKB.hitE(e, p.a, (p.raw || p.mult) * 0.8, { big: true, last: true, stun: p.stun });
        if (p.split) for (let k = 0; k < 3; k++) G.ZONES.push({ k: 'burst', x: p.x + (k - 1) * 40, y: p.y + (k - 1) * 10, r: G.HERO_H * 0.7, t: 0, life: 12 + k * 6, m: 0.6, a: p.a, fx: 'skill_fire_ball_b' }); }
    }
    G.PROJ = G.PROJ.filter(p => p.left > 0 || (p.ret && !p.back));
  };

  /* ---------- 主角繪製 ---------- */
  function heroFrame() {
    const a = H.act;
    if (a) { const nat = A.dur(a.r); if (a.beh && a.T * TK > nat * 1.4) { const ms = (H.t * TK) % nat; return A.frameAt(a.r, ms, nat); } return A.frameAt(a.r, H.t * TK, a.T * TK); }   // 長時間招式：動畫循環
    if (H.recov > 0 && H.st === 'idle' && H.lastFr) return H.lastFr;
    const r = H.st === 'walk' ? (H.run ? REC('run') || REC('walk') : REC('walk')) : REC('idle'); return r ? A.frameAt(r, H.ms) : null;
  }
  G.heroFrame = heroFrame;
  G.drawHero = function () {
    const u = U(); if (!u) return; const s = SC.depth(H.y), fr = heroFrame();
    const sc = G.HERO_H * s / (u.refH || 130) * G.WPN.actK(H.act ? H.act.name : H.recov > 0 && H.lastN ? H.lastN : H.st === 'walk' ? (H.run ? 'run' : 'walk') : 'idle');   // 每招尺寸校正
    const bob = !H.act && H.st === 'walk' && !H.run ? Math.abs(Math.sin(H.ms / 200 * Math.PI)) * 2.2 * s : 0;   // 走路上下起伏（每 2 格一步）
    shadow(H.x, H.y, 15 * s);
    const blink = H.inv > 0 && H.st === 'hurt' && (G.t >> 2) % 2;
    const sk = !H.act && !(H.recov > 0) && (H.st === 'idle' || H.st === 'walk') && G.GROW && G.GROW.skinUnit();   // 職業外觀：目前只有待機／走路
    if (sk) { const r = sk.act[H.st === 'walk' ? 'walk' : 'idle'] || sk.act.idle; A.draw(sk, A.frameAt(r, H.ms), H.x, H.y - (H.hop || 0) - bob, G.HERO_H * s / (sk.refH || 130), H.face < 0, blink ? 0.45 : 1); }
    else if (fr) A.draw(u, fr, H.x, H.y - (H.hop || 0) - bob, sc, H.face < 0, blink ? 0.45 : 1);
  };

  /* ---------- 敵人（多種妖怪；赤鬼用舊圖集） ---------- */
  const SZ = { '微': 0.8, '小': 0.9, '人': 1, '大': 1.35, '巨': 1.6 }, SZX = { yokyubi: 1.1, kitsunebi: 1.1 }, CL = {};
  const CLS = { '微': 'chochin akachochin onichochin kitsunebi kogumo kodama', '小': 'inugami nozuchi gaki karakasa kinkasa hitotsume bamboo itsumade enemy_raiju kumohei ittan yamawaro yokyubi nekomata ubume enemy_ningyo', '大': 'akaoni kurooni aooni kioni midorioni shirooni yoioni ushioni kanakuma hoshikuma torakuma kumadoji hihi nue kasha mizuchi wani jorogumo wanyudo muraiju', '巨': 'umibozu oumibozu nurikabe' };
  for (const c in CLS) for (const t of CLS[c].split(' ')) CL[t] = c;
  const cls = t => CL[t] || '人';
  const ratio = t => SZX[t] || SZ[cls(t)];
  G.EHP = 2.5;   /* r3.51.0：一般妖怪血量 ×2.5（同等級普攻約 7～12 下） */
  G.enemyCls = cls;
  /* r3.49.0：圖集內個別動作畫得比走路小／大（實測身形比例），出手、受擊時大小不跳 */
  const KFIX = { nurikabe: { attack: 1.4 }, sohei: { attack: 1.4, hit: 1.3, death: 1.3 }, ninja: { hit: 1.2, death: 1.15 }, kageyumi: { attack: 0.78 }, nekomata: { attack: 0.82 } };
  G.enemyUnit = type => { const u = A.get('e_' + type); if (u && !u._kf && u.act) { u._kf = 1; const F = KFIX[type]; if (F) for (const n in F) if (u.act[n]) u.act[n].k = (u.act[n].k || 1) * F[n]; } return u; };
  /* r3.49.0：身體超出一般人形的半寬（像素）。依走路圖實際寬度×體型；一般人形＝0，塗壁／海坊主等巨大妖怪才有值 */
  G.bodyX = e => { if (!e || e.bb) return 0; const u = G.enemyUnit(e.type); let hw = 0.42;
    if (u) { if (u._hw === undefined) { const w = u.act.walk || u.act.idle, f = w && w.f[0]; u._hw = f ? f[2] * (f[8] || 1) / (u.vm || u.refE || 140) / 2 : 0.42; } hw = u._hw; }
    return Math.max(0, hw * (e.ratio || 1) * 0.85 - 0.3) * G.HERO_H * SC.depth(e.y); };
  G.spawnOni = (x, y, delay, lv, type) => { lv = lv || G.SC.def.lv || 1;
    if (!type) { const Lf = (G.SC.def.foes || []).filter(t => G.enemyUnit(t)); type = Lf.length && Math.random() < (G.SC.def.ch ? 1 : 0.7) ? Lf[Math.floor(Math.random() * Lf.length)] : 'akaoni'; }
    if (!G.enemyUnit(type)) type = 'akaoni';
    const r = ratio(type), c = cls(type), sm = c === '微' || c === '小', bg = c === '大' || c === '巨', hp = Math.round((70 + 30 * (lv - 1)) * G.EHP * (bg ? 1.2 : sm ? 0.7 : 1));
    const e = { type, ratio: r, sm, x, y, lv, atk: Math.round((10 + 4 * (lv - 1)) * (sm ? 0.75 : 1)), def: 2 * lv, face: x > G.H.x ? -1 : 1, st: 'walk', t: 0, hp, hpMax: hp, delay: delay || 0, flash: 0, kb: 0, atkHit: false, alpha: 1, cd: 60 + Math.random() * 60, ph: Math.random() * 1000, atkMs: 966 };
    G.E.push(e); return e; };
  /* r3.94.0：傷害乘區登記。增傷（inc，上限 +300%）、易傷破甲（vul，上限 +60%）由各模組 add／vuln，本體算一次後歸零。
     觸發閘 PROC(key, cd, e)：同一次出手（H.act）同一 key 只觸發 1 次；cd＝內部冷卻（格），給 e＝每個目標各自計。 */
  G.DZ = { inc: 0, vul: 0, cap: 3, vcap: 0.6, add(x) { if (x) this.inc += x; }, vuln(x) { if (x) this.vul += x; }, reset() { this.inc = 0; this.vul = 0; } };
  const PCD = {};
  G.PROC = function (key, cd, e) { const a = H.act, kk = e ? key + '#' : key;
    if (a) { const s = a._pr || (a._pr = new Set()), id = e ? kk + (e._pid || (e._pid = ++G.PROC.n)) : kk; if (s.has(id)) return false; s.add(id); }
    const box = e ? (e._pc || (e._pc = {})) : PCD; if ((box[key] || -1e9) > G.t) return false; box[key] = G.t + (cd || 0); return true; };
  G.PROC.n = 0;
  /* r3.105.0：傷害數字 1 萬以上顯示「萬」（1.2萬、35萬；1 億以上「億」） */
  G.fmtN = v => typeof v !== 'number' || Math.abs(v) < 1e4 ? v : Math.abs(v) >= 1e8 ? (v / 1e8).toFixed(Math.abs(v) < 1e9 ? 1 : 0).replace(/\.0$/, '') + '億' : (v / 1e4).toFixed(Math.abs(v) < 1e5 ? 1 : 0).replace(/\.0$/, '') + '萬';
  G.damageOni = function (e, mult, big, forceCrit, opt) {
    if (e.st === 'dead') return;
    const pa = opt && opt.party, S0 = G.RPG.S, S = pa ? { atk: opt.atk, crit: opt.crit, critD: opt.critD, ls: 0 } : S0, BF = pa ? null : G.BUFF, nc = BF ? BF.get('nextCrit') : 0, db = e.db || {};
    const crit = forceCrit || Math.random() * 100 < S.crit + (BF ? BF.get('crit') : 0) + nc; if (nc) BF.t.nextCrit = 0;
    const Z = G.DZ, inc = Math.min(Z.cap, Z.inc), vu = Math.min(Z.vcap, ((db.vuln || 0) + (db.mark || 0)) / 100 + Z.vul); Z.inc = 0; Z.vul = 0;   // r3.94.0：5 區（攻擊／招式／增傷／會心／易傷），同區相加
    const def = e.def * (1 - ((opt && opt.ign) || 0) / 100) * (1 - (db.def || 0) / 100), up = (BF && BF.get('atk') ? (100 + (S._atkP || 0) + BF.get('atk')) / (100 + (S._atkP || 0)) : 1) * (1 + inc) * (1 + vu);
    const d = cheat('kill') ? Math.ceil(e.hp) : Math.max(1, Math.round(S.atk * mult * up * (1 - def / (def + 80)) * (crit ? (S.critD + (BF ? BF.get('critD') : 0)) / 100 : 1) * (0.92 + Math.random() * 0.16)));
    if (BF && BF.get('ls')) H.hp = Math.min(H.hpMax, H.hp + d * BF.get('ls') / 100);
    const rd = G.RPG.d(); if (!pa) { rd.qi = Math.min(100, rd.qi + (big ? 5 : 3)); H.lastHit = e; if (G.PARTY) { G.PARTY.threat(e, 'hero', d); if (big) G.PARTY.onHeroBig(e); } }
    if (S.ls > 0) H.hp = Math.min(H.hpMax, H.hp + d * S.ls / 100);
    e.hp -= d; e.flash = 8; e.kb = (pa ? pa.face : H.face) * (big ? 7 : 3.5) / e.ratio;
    if (!(e.st === 'atk' && !big)) { e.st = 'hurt'; e.t = 0; }
    G.NUMS.push({ x: e.x, y: e.y - G.HERO_H * e.ratio * SC.depth(e.y) - 6, v: d, crit, t: 0 });
    if (e.hp <= 0 && e.st !== 'dead') { e.st = 'dead'; e.t = 0; G.RPG.onKill(e); G.STORY.onKill(e); }
  };
  function eRec(e, a, b, c, d) { const u = G.enemyUnit(e.type); if (!u) return null; const X = u.act; return X[a] || (b && X[b]) || (c && X[c]) || (d && X[d]) || null; }
  /* 頭目等外部招式打到主角：atk＝攻擊力（已乘倍率）；回傳是否命中 */
  G.DEFK = () => 60 + 9 * ((G.RPG && G.RPG.d().lv || 1) - 1);   // r3.53.0：防禦常數隨主角等級成長（原固定 60，後期幾乎不掉血）
  G.hurtHero = function (atk, srcX) {
    if (H.inv > 0 || H.hp <= 0 || cheat('god')) return false;
    const df = G.RPG.S.def, dr = G.BUFF ? G.BUFF.get('dr') : 0, fr = Math.sign(srcX - H.x) === H.face, gd = H.guard && fr;
    let d = Math.max(1, Math.round(atk * (1 - df / (df + G.DEFK())) * (1 - dr / 100) * (0.9 + Math.random() * 0.2) * (gd ? 0.3 : 1)));
    if (G.GROW) d = G.GROW.taken(d, null); if (G.PARTY) { d = G.PARTY.heroTaken(d, null); if (d <= 0) { H.inv = 30; return true; } } H.hp = Math.max(0, H.hp - d); H.inv = 40; if (G.GROW) G.GROW.onHurt(d, null); G.AU && G.AU.sfx('hurt');
    if (gd) G.spawnFx('feedback_guard_a', 0, H.x + H.face * 12, H.y - G.HERO_H * 0.55 * SC.depth(H.y), H.face, SC.depth(H.y) * 1.4);
    else if (!(G.BUFF && G.BUFF.get('armor')) && !(G.GROW && G.GROW.armor()) && !(G.PARTY && G.PARTY.armorT > 0)) { H.face = Math.sign(srcX - H.x) || H.face; if (!startAct('hurt', 'hurt')) { H.act = null; H.st = 'idle'; } }
    G.NUMS.push({ x: H.x, y: H.y - G.HERO_H * SC.depth(H.y) - 6, v: d, hurt: true, t: 0 }); G.hitstop = 4; G.flash = 6; return true;
  };
  G.oniStep = function (e) {
    if (e.delay > 0) { e.delay--; return; }
    e.t++; if (e.flash > 0) e.flash--;
    if (e.kb) { const nx = e.x + e.kb; if (SC.walkable(nx, e.y)) e.x = nx; e.kb *= 0.8; if (Math.abs(e.kb) < 0.2) e.kb = 0; }
    if (e.st === 'dead') { if (e.hold === undefined) { const r = eRec(e, 'death', 'fall'); e.hold = r ? A.dur(r) / TK : 0; } e.alpha = Math.max(0, 1 - Math.max(0, e.t - e.hold) / 40); return; }
    if (e.st === 'hurt') { if (e.t > 16) { e.st = 'walk'; e.t = 0; } return; }
    G.enemyDebStep && G.enemyDebStep(e);
    if (e.stun > 0) { e.stun--; return; }   // 暈眩／定身
    const T = G.PARTY && (G.PARTY.list.length || (G.DECOY && G.DECOY())) ? G.PARTY.targetOf(e) : H, dx = T.x - e.x, dy = T.y - e.y, rr = e.ratio / 1.38, bx = G.bodyX(e), reach = Math.max(54, 104 * Math.min(rr, 1.05)) + bx;   /* r3.49.0：出手距離＝一般距離＋身體寬度 */
    if (bx > 2 && H.hp > 0) { const ox = H.x - e.x, oy = Math.abs(H.y - e.y), lim = bx + 0.45 * G.HERO_H * SC.depth(e.y);   /* r3.49.0：主角不能走進大型妖怪身體裡，輕推到身體外 */
      if (oy < 16 + bx * 0.2 && Math.abs(ox) < lim) { const sg = Math.sign(ox) || -e.face, px = Math.min(6, lim - Math.abs(ox)); if (SC.walkable(H.x + sg * px, H.y)) H.x += sg * px; } }
    if (e.st === 'walk') {
      if (Math.abs(dx) > 4) e.face = Math.sign(dx);
      e.cd--;
      if (Math.abs(dx) < reach - 14 && Math.abs(dy) < 26 && e.cd <= 0) { e.st = 'atk'; e.t = 0; e.atkHit = false; const r = eRec(e, 'attack', 'atk'); e.atkMs = (r ? Math.max(600, A.dur(r)) : 966) * 1.6; return; }   // r3.20.3：出手放慢 1.6 倍（預警後約 0.5～0.8 秒才判定，可閃避）
      const sp = (e.sm ? 1.25 : 1.05) * (e.db && e.db.slow ? 0.5 : 1); tryMove(e, Math.abs(dx) > reach * 0.68 ? Math.sign(dx) * sp : 0, Math.abs(dy) > 6 ? Math.sign(dy) * sp * 0.6 : 0);
    } else if (e.st === 'atk') {
      const ms = e.t * TK, hitMs = e.atkMs * 0.48;
      if (!e.atkHit && ms >= hitMs) { e.atkHit = true; SC.shake = 3 + 2 * rr; if (G.FOEAI && G.FOEAI.meleeFx && e._fc !== 'ranged' && e._fc !== 'spirit') G.FOEAI.meleeFx(e);   /* r3.197.0：普通近戰出手時有爪痕／揮擊弧光 */
        G.FX.push({ k: 'dust', x: e.x + e.face * 60 * rr, y: e.y, t: 0, life: 20 });
        const rx = (H.x - e.x) * e.face;
        if (T !== H) { const px = (T.x - e.x) * e.face; if (px > -10 && px < reach && Math.abs(T.y - e.y) < 30) G.PARTY.hurt(T, e.atk, e.x, e); }
        else if (rx > -10 && rx < reach && Math.abs(H.y - e.y) < 30 && H.guard) {   // 架勢中：格擋＋反擊
          if (G.GROW) G.GROW.onGuard(e); if (!(G.SKB && G.SKB.counter(e))) { G.spawnFx('feedback_guard_a', 0, H.x + H.face * 12, H.y - G.HERO_H * 0.55 * SC.depth(H.y), H.face, SC.depth(H.y) * 1.4); G.damageOni(e, 2.2, true); e.stun = 40; G.hitstop = 6; SC.shake = 6; } }
        else if (rx > -10 && rx < reach && Math.abs(H.y - e.y) < 30 && H.inv <= 0 && !cheat('god')) {
          const df = G.RPG.S.def, dr = G.BUFF ? G.BUFF.get('dr') : 0, d0 = Math.max(1, Math.round(e.atk * (1 - df / (df + G.DEFK())) * (1 - dr / 100) * (0.9 + Math.random() * 0.2))), d1 = G.GROW ? G.GROW.taken(d0, e) : d0, d = G.PARTY ? G.PARTY.heroTaken(d1, e) : d1; if (d <= 0) { H.inv = 30; } else { H.hp = Math.max(0, H.hp - d); H.inv = 40; if (G.GROW) G.GROW.onHurt(d, e); G.AU && G.AU.sfx('hurt');
          if (!(G.BUFF && G.BUFF.get('armor')) && !(G.GROW && G.GROW.armor()) && !(G.PARTY && G.PARTY.armorT > 0)) { H.face = -e.face; if (!startAct('hurt', 'hurt')) { H.act = null; H.st = 'idle'; } }   // 霸體：不被打斷
          G.NUMS.push({ x: H.x, y: H.y - G.HERO_H * SC.depth(H.y) - 6, v: d, hurt: true, t: 0 }); G.hitstop = 4; G.flash = 6; } } }
      if (ms >= e.atkMs) { e.st = 'walk'; e.t = 0; e.cd = 70 + Math.random() * 70; }
    }
  };
  G.drawOni = function (e) {
    const u = G.enemyUnit(e.type); if (!u) return; const s = SC.depth(e.y), sc0 = G.HERO_H * e.ratio * s / (u.vm || u.refE || 140), walk = eRec(e, 'walk');
    let fr, rec = walk;
    if (e.st === 'atk') { const r = eRec(e, 'attack', 'atk'); rec = r || walk; fr = r ? A.frameAt(r, e.t * TK, e.atkMs) : walk.f[0]; }
    else if (e.st === 'hurt') { const r = eRec(e, 'hit', 'hurt'); rec = r || walk; fr = r ? A.frameAt(r, e.t * TK) : walk.f[0]; }
    else if (e.st === 'dead') { const r = eRec(e, 'death', 'fall', 'hit', 'hurt'); rec = r || walk; fr = r ? A.frameAt(r, e.t * TK) : walk.f[0]; }
    else fr = A.frameAt(walk, G.t * TK + e.ph);
    const sc = sc0 * (rec.k || 1);
    shadow(e.x, e.y, 22 * s * e.ratio / 1.2); e._fx3 = [u, fr, sc];   /* r3.170.0：給受擊染色用（162_fx3） */
    A.draw(u, fr, e.x, e.y, sc, e.face < 0, e.alpha);
    if (e.flash > 0) { const w = A.white(u, fr); ctx.save(); ctx.globalAlpha = Math.min(0.5, e.flash / 14) * e.alpha;   /* r3.196.0：受擊白閃減半（原本整隻變純白） */ if (e.face < 0) { ctx.translate(e.x * 2, 0); ctx.scale(-1, 1); }
      ctx.drawImage(w, e.x - fr[4] * sc, e.y - fr[5] * sc, fr[2] * sc, fr[3] * sc); ctx.restore(); }
    if (e.st !== 'dead' && e.hp < e.hpMax && !(G.VX && G.VX.dimT > 0 && H.act && H.act.mvx && H.act.mvx.hd)) { const w = 44 * s,   /* r3.196.0：秘傳演出時不顯示妖怪血條 */ y = e.y - G.HERO_H * e.ratio * s - 4; ctx.fillStyle = 'rgba(10,6,6,.75)'; ctx.fillRect(e.x - w / 2 - 1, y - 1, w + 2, 5);
      ctx.fillStyle = G.C.red; ctx.fillRect(e.x - w / 2, y, w * Math.max(0, e.hp) / e.hpMax, 3); }
    if (!G.FOEAI && e.st === 'atk' && e.t * TK < e.atkMs * 0.48) { const a = 0.35 + 0.3 * Math.sin(G.t * 0.6), rr = e.ratio / 1.38, bx = G.bodyX(e); { const wx = e.x + e.face * 30, rx = 40 * (e.ratio || 1); ctx.save(); ctx.translate(wx, e.y); ctx.scale(1, 0.32); const gw = ctx.createRadialGradient(0, 0, rx * 0.2, 0, 0, rx); gw.addColorStop(0, `rgba(255,90,60,0)`); gw.addColorStop(0.75, `rgba(255,90,60,${a * 0.7})`); gw.addColorStop(1, `rgba(255,90,60,0)`); ctx.fillStyle = gw; ctx.beginPath(); ctx.arc(0, 0, rx, 0, 6.283); ctx.fill(); ctx.restore(); }   /* r3.196.0：舊版預警改無外框的紅色柔光 */ ctx.strokeStyle = 'rgba(0,0,0,0)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(e.x + e.face * (56 * Math.min(rr, 1.05) * s + bx), e.y, Math.max(24, 46 * rr) * s, 14 * s, 0, 0, 6.283); ctx.stroke(); }
  };

  /* ---------- NPC（白丸：單張立繪＋呼吸起伏） ---------- */
  G.drawNpc = function (n) {
    if (n.anim) { if (!n.u || !n.clip) return; const s = SC.depth(n.y), sc = G.HERO_H * n.hk * s / (n.u.refH || 130); if (Math.abs(G.H.x - n.x) > 6) n.face = Math.sign(G.H.x - n.x); shadow(n.x, n.y, 16 * s * n.hk); A.draw(n.u, A.frameAt(n.clip, G.t * 16.7), n.x, n.y, sc, n.face * (n.nat || 1) < 0, 1); return; }   // r3.18.3：頭目／夥伴委託人
    if (n.npc) {   // 圖集 NPC：f[0]＝待機、f[1]＝說話；母稿面向右
      const d = G.D.npc[n.npc], s = SC.depth(n.y), f = d.f[G.DLG.who === n.name || n.speaking ? 1 : 0], sc = G.HERO_H * d.ratio * s / d.h;
      if (n.talkTo) { if (Math.abs(n.talkTo.x - n.x) > 4) n.face = Math.sign(n.talkTo.x - n.x); }
      else if (!n.walking && Math.abs(G.H.x - n.x) > 6 && Math.hypot(G.H.x - n.x, G.H.y - n.y) < 160) n.face = Math.sign(G.H.x - n.x);
      const wb = n.walking ? Math.abs(Math.sin(G.t * 0.28)) * 3 : 0;   // 走位時上下踏步
      shadow(n.x, n.y, 13 * s * d.ratio); const br = n.walking ? 1 : 1 + Math.sin(G.t * 0.06 + n.x * 0.01) * 0.022;   // r3.151.0：劇情人物（小雪、阿松…）站著時呼吸起伏
      ctx.save(); ctx.translate(n.x, n.y); ctx.scale(1, br); ctx.translate(-n.x, -n.y); sprite(G.IMG.npc, f, n.x, n.y - wb, sc, n.face < 0, 1); ctx.restore(); return;
    }
    const s = SC.depth(n.y), img = G.IMG[n.img], h = G.HERO_H * (n.ratio || 0.78) * s, w = h * img.width / img.height, st = n.stone || 0, b = st >= 1 ? 0 : Math.sin(G.t * 0.05) * 0.8;
    shadow(n.x, n.y, w * 0.36);
    ctx.save(); if (st > 0) ctx.filter = `grayscale(${st}) brightness(${1 - st * 0.22}) contrast(${1 - st * 0.15})`;   // 石像狀態（序幕白丸）
    if (n.face < 0) { ctx.translate(n.x * 2, 0); ctx.scale(-1, 1); } ctx.drawImage(img, n.x - w / 2, n.y - h + b + h * 0.04 - (n.hop || 0), w, h); ctx.restore();
  };

  /* ---------- 白丸協戰：每 4 秒撲咬 180px 內最近的敵人（以夥伴等級＋主角攻擊計） ---------- */
  G.shiroStep = function (n) {
    if (!n || !n.follow) return false;
    n.cd = (n.cd || 120) - 1;
    if (n.bite) { const e = n.bite.e, b = n.bite; b.t++;
      if (b.t < 14 && e.st !== 'dead') { n.x += (e.x - e.face * 6 - n.x) * 0.25; n.y += (e.y + 2 - n.y) * 0.25; n.hop = Math.sin(b.t / 14 * Math.PI) * 14; if (Math.abs(e.x - n.x) > 4) n.face = Math.sign(e.x - n.x); }
      if (b.t === 14 && e.st !== 'dead') { const lv = G.RPG.d().comp.shiro.lv; G.damageOni(e, 0.55 + lv * 0.05, false); G.FX.push({ k: 'bite', x: e.x, y: e.y - 30, t: 0, life: 12 }); }
      if (b.t >= 24) { n.bite = null; n.hop = 0; } return true; }
    if (n.cd <= 0) { let best = null, bd = 180; for (const e of G.E) { if (e.st === 'dead' || e.delay > 0) continue; const d = Math.hypot(e.x - n.x, e.y - n.y); if (d < bd) { bd = d; best = e; } }
      n.cd = best ? 240 : 30; if (best) { n.bite = { e: best, t: 0 }; return true; } }
    return false;
  };
  /* ---------- 掉落物：錢自動吸入；素材／裝備走近拾取；用不同顏色光柱標示 ---------- */
  G.lootStep = function () {
    if (!G.LOOT.length) return; const R = G.RPG, d = R.d();
    for (const l of G.LOOT) { l.t++; if (l.t < 24) continue;
      const dist = Math.hypot(l.x - H.x, (l.y - H.y) * 1.6);
      if (l.kind === 'gold' && dist < 130) { l.x += (H.x - l.x) * 0.18; l.y += (H.y - l.y) * 0.18; }
      if (dist > 30) continue; l.got = true;
      if (l.kind === 'gold') { d.gold += l.v; G.NUMS.push({ x: H.x, y: H.y - G.HERO_H - 4, v: '+' + l.v + ' 錢', gold: true, t: 0 }); }
      else if (l.kind === 'mat') { d.mats[l.id] = (d.mats[l.id] || 0) + l.n; G.UI.toast('獲得 ' + R.MATS[l.id].n + ' ×' + l.n); }
      else if (l.kind === 'item' && R.addItem(l.it)) { G.UI.toast('獲得【' + R.QUAL[l.it.q].n + '】' + R.name(l.it)); if (l.it.q >= 3) G.BANTER.trigger('loot', true); }
      G.SAVE.markDirty(); }
    G.LOOT = G.LOOT.filter(l => !l.got);
  };
  const LCOL = l => l.kind === 'gold' ? '#f3d36a' : l.kind === 'mat' ? (G.RPG.MATS[l.id] || { c: '#ccc' }).c : l.kind === 'key' ? '#c08cff' : ((l.it && G.RPG.QUAL[l.it.q]) || { c: '#ccc' }).c;
  G.drawLoot = function (Z) {
    for (const l of G.LOOT) { if (G.LOOTDRAW && G.LOOTDRAW(l, Z)) continue; const c = LCOL(l), b = Math.max(0, 1 - l.t / 20), y = l.y - 5 - Math.abs(Math.sin(l.t * 0.08 + l.x)) * 3 - b * 26, a = 0.55 + 0.45 * Math.sin(G.t * 0.12 + l.x);
      ctx.fillStyle = 'rgba(30,20,10,.3)'; ctx.beginPath(); ctx.ellipse(l.x, l.y, 7, 2.5, 0, 0, 6.283); ctx.fill();
      if (l.kind === 'gold') { ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(l.x, y, 4, 4 * Math.abs(Math.cos(G.t * 0.1 + l.x)) + 0.6, 0, 0, 6.283); ctx.fill(); continue; }
      const big = l.kind === 'item' ? [16, 24, 40, 60, 80, 100][l.it.q] || 40 : 30,   /* r3.145.0：光柱依品質拉開差距 */ g = ctx.createLinearGradient(0, y - big, 0, y);
      g.addColorStop(0, c + '00'); g.addColorStop(1, c + '66'); ctx.fillStyle = g; for (let i = 0; i < 4; i++) { ctx.globalAlpha = (0.6 + 0.4 * a) * (1 - i * 0.2); ctx.fillRect(l.x - 2 - i * 2, y - big * (1 - i * 0.1), 4 + i * 4, big * (1 - i * 0.1)); } ctx.globalAlpha = 1;   /* r3.196.0：掉落光柱左右淡出（原本一條硬邊方塊） */
      /* r3.87.0：拿掉掉落物腳下的品質色圈（綠色品質掉一地時變成一堆綠圈）；品質色改由光柱＋菱形表示 */
      ctx.fillStyle = c; ctx.save(); ctx.translate(l.x, y); ctx.rotate(0.785); ctx.fillRect(-4, -4, 8, 8); ctx.restore();
      if ((l.kind === 'item' && l.it.q >= 3) || l.kind === 'key') { const lab =   /* r3.145.0：只有稀品以上顯示名字 */ l.kind === 'item' ? G.RPG.name(l.it) : l.name; ctx.save(); ctx.translate(l.x, y - big - 6); ctx.scale(1 / Z, 1 / Z);
        ctx.font = `700 ${11 * G.FS()}px ${G.FONT}`; const w = ctx.measureText(lab).width + 12; ctx.fillStyle = 'rgba(12,8,10,.75)'; G.rr(-w / 2, -10, w, 20, 10); ctx.fill();
        ctx.fillStyle = c; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(lab, 0, 1); ctx.restore(); } }
  };

  /* ---------- 特效／數字（上限 160 個，避免大招堆太多拖慢） ---------- */
  G.fxStep = function () {
    if (G.FX.length) { let bp; for (const f of G.FX) { f.t++; if (f.fol && H.act === f.act && (bp = bp || G.WPN.bladePt())) { f.x += (bp[0] - f.x) * 0.6; f.y += (bp[1] - f.y) * 0.6; } } G.FX = G.FX.filter(f => f.t < f.life); if (G.FX.length > 160) G.FX.splice(0, G.FX.length - 160); }
    if (G.NUMS.length) { for (const n of G.NUMS) { n.t++; n.y -= 0.6; } G.NUMS = G.NUMS.filter(n => n.t < 50); }
    G.projStep();
  };
  G.drawFx = function (Z) {
    const fc = A.get('fx_common');
    for (const p of G.PROJ) { if (p.petal && G.FXV) { G.FXV.petal(p, ctx); continue; } if (p.pk && G.FXV) { G.FXV.proj(p, ctx); continue; } const r = fc && fc.fx[p.img];
      const tr = p.img === 'projectile_bullet_a' ? 'rgba(255,220,140,' : p.img === 'projectile_arrow_a' ? 'rgba(240,245,255,' : null, py = p.y - p.h - (p.arc || 0);
      if (tr) { const L = Math.min(70, Math.abs(p.vx) * 6); const g = ctx.createLinearGradient(p.x - Math.sign(p.vx) * L, 0, p.x, 0); g.addColorStop(0, tr + '0)'); g.addColorStop(1, tr + '.85)');
        ctx.strokeStyle = g; ctx.lineWidth = p.img === 'projectile_bullet_a' ? 2.2 : 1.6; ctx.beginPath(); ctx.moveTo(p.x - Math.sign(p.vx) * L, py); ctx.lineTo(p.x, py); ctx.stroke(); }   // 箭／彈道殘影
      if (r) { const fr = A.frameAt(r, G.t * TK), sc = SC.depth(p.y) * G.HERO_H / 130 * (p.sc || 2.2); A.draw(fc, fr, p.x, py, sc, p.face < 0); }
      else { ctx.strokeStyle = 'rgba(255,240,200,.9)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(p.x - p.vx * 2, p.y - p.h); ctx.lineTo(p.x, p.y - p.h); ctx.stroke(); } }
    for (const f of G.FX) { const a = 1 - f.t / f.life;
      if (f.k === 'spr') { const u = A.get(f.u); if (!u) continue; const fr = A.frameAt(f.r, f.t * TK), sc = f.s * G.HERO_H / 130;
        A.draw(u, fr, f.x, f.y, sc, f.face < 0, Math.min(1, a * 2.5)); if (f.glow) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; A.draw(u, fr, f.x, f.y, sc, f.face < 0, Math.min(1, a * 2.5) * f.glow); ctx.restore(); } }   /* r3.154.0：夥伴特效加一層發光 */
      else if (f.k === 'orb') { const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, 10); g.addColorStop(0, `rgba(255,250,220,${a})`); g.addColorStop(1, 'rgba(255,220,120,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(f.x, f.y, 10, 0, 6.283); ctx.fill(); }
      else if (f.k === 'spark') { f.x += f.vx; f.y += f.vy; f.vy += 0.18; ctx.fillStyle = `rgba(255,${200 + (f.t * 3 | 0)},140,${a})`; ctx.fillRect(f.x, f.y, 2.4, 2.4); }
      else if (f.k === 'dust') { if (G.AFX && G.AFX.fr('x2_core', 'fx_dust', Math.min(5, Math.floor(f.t / f.life * 6)), f.x, f.y, { size: 110 + f.t * 2.5, by: 'w', a: Math.min(1, a * 1.6) })) continue;   /* r3.199.0：塵土＝手繪的塵圈（原本咖啡色半透明橢圓） */ ctx.fillStyle = `rgba(140,110,80,${a * 0.45})`; ctx.beginPath(); ctx.ellipse(f.x, f.y, 30 + f.t * 2, 8 + f.t * 0.5, 0, 0, 6.283); ctx.fill(); }
      else if (G.FXV && G.FXV[f.k]) G.FXV[f.k](f, a, ctx);
      else if (f.k === 'ghost') { if (f.lv === undefined) f.lv = (G.LEON && G.LEON.ghost && G.LEON.ghost(f)) || 0;   /* r3.201.0：換成里歐外型時，殘影也用里歐的圖（原本還是主角原樣） */ if (f.lv) { A.draw(f.lv.u, f.lv.fr, f.x, f.y, f.lv.k, f.lv.flip, a * 0.35); continue; } const u = A.get(f.u); if (u) A.draw(u, f.fr, f.x, f.y, G.HERO_H * f.s / (u.refH || 130), f.face < 0, a * 0.35); }
      else if (f.k === 'lvup') { f.x = H.x; f.y = H.y; const h = 120 * Math.min(1, f.t / 12); const g = ctx.createLinearGradient(0, f.y - h, 0, f.y); g.addColorStop(0, 'rgba(255,230,150,0)'); g.addColorStop(1, `rgba(255,230,150,${a * 0.55})`);
        ctx.fillStyle = g; ctx.fillRect(f.x - 18, f.y - h, 36, h); }
      else if (f.k === 'bite') { ctx.strokeStyle = `rgba(255,255,255,${a})`; ctx.lineWidth = 2.5; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(f.x - 10, f.y + i * 6); ctx.lineTo(f.x + 10, f.y + i * 6 - 4); ctx.stroke(); } }
      else if (f.k === 'wind') { ctx.strokeStyle = `rgba(220,240,235,${a * 0.5})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.quadraticCurveTo(f.x + 40, f.y - 8, f.x + 90, f.y); ctx.stroke(); f.x += f.vx; }
    }
    /* r3.195.0：會心數字跟一般數字拉開——一般＝米白小字直直往上；會心＝大字、橘紅到金黃的漸層、深紅描邊、略斜、
     * 出現時從 1.9 倍「砸」下來回彈，背後一道橫向的金色斬痕與碎光，尾端加「！」；停留久一點再淡出 */
    for (const n of G.NUMS) { const cr = !!n.crit && !n.hurt && !n.gold, a = cr ? Math.min(1, (50 - n.t) / 12) : 1 - n.t / 50, pt = n.pop != null ? G.t - n.pop : n.t, pp = Math.max(0, 1 - pt / 8);
      const s = 1 / Z * (cr ? (pt < 5 ? 1.9 - 0.9 * (pt / 5) : 1 + 0.12 * Math.max(0, 1 - (pt - 5) / 5)) : 1 + 0.35 * pp), by = cr ? n.t * 0.35 : 0;   /* 會心上升得慢（留在原地讓人看清楚） */
      ctx.save(); ctx.translate(n.x, n.y + by); ctx.scale(s, s); ctx.globalAlpha = Math.max(0, a); ctx.textAlign = 'center'; const nv = G.fmtN(n.v) + (cr ? '！' : '');
      if (cr) { ctx.rotate(-0.1); ctx.font = `900 30px ${G.FONT_S}`; const w = ctx.measureText(nv).width;
        if (pt < 10) { const q = pt / 10, L = (w * 0.5 + 26) * (0.5 + 0.5 * Math.min(1, pt / 3)), g = ctx.createLinearGradient(-L, 0, L, 0); g.addColorStop(0, 'rgba(255,210,110,0)'); g.addColorStop(0.5, 'rgba(255,236,170,' + 0.95 * (1 - q) + ')'); g.addColorStop(1, 'rgba(255,210,110,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-L, -11); ctx.quadraticCurveTo(0, -11 - 7 * (1 - q), L, -11); ctx.quadraticCurveTo(0, -11 + 7 * (1 - q), -L, -11); ctx.fill();
          ctx.fillStyle = 'rgba(255,240,190,' + (1 - q) + ')'; for (let i = 0; i < 6; i++) { const an = i * 1.05 + (n.x % 7), d = 18 + q * 26; ctx.fillRect(Math.cos(an) * d * 1.5, -11 + Math.sin(an) * d * 0.7, 2.5, 2.5); } }
        ctx.lineJoin = 'round'; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(70,10,6,.92)'; ctx.strokeText(nv, 0, 0); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,240,200,.9)'; ctx.strokeText(nv, 0, 0);
        const g2 = ctx.createLinearGradient(0, -26, 0, 2); g2.addColorStop(0, '#fff2b0'); g2.addColorStop(0.45, '#ffc23a'); g2.addColorStop(1, '#ff5a2a'); ctx.fillStyle = g2; ctx.fillText(nv, 0, 0); }
      else { ctx.font = `900 ${n.gold ? 13 : 18}px ${G.FONT_S}`; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(20,10,8,.85)'; ctx.strokeText(nv, 0, 0); ctx.fillStyle = n.gold ? '#f3d36a' : n.hurt ? '#ff8a7a' : '#fff4e0'; ctx.fillText(nv, 0, 0); }
      ctx.restore(); }
  };

  /* ---------- 小工具 ---------- */
  function sprite(img, f, x, y, sc, flip, alpha) {
    const [sx, sy, w, h, px, py] = f; ctx.save(); if (alpha !== undefined) ctx.globalAlpha = alpha;
    if (flip) { ctx.translate(x * 2, 0); ctx.scale(-1, 1); }
    ctx.drawImage(img, sx, sy, w, h, x - px * sc, y - py * sc, w * sc, h * sc); ctx.restore();
  }
  function shadow(x, y, w) { ctx.fillStyle = 'rgba(30,20,10,.32)'; ctx.beginPath(); ctx.ellipse(x, y, w, w * 0.32, 0, 0, 6.283); ctx.fill(); }
  const L = [];
  G.drawWorld = function () {
    const Z = SC.begin();
    SC.drawExits(); G.STORY.drawMarks(); G.drawLoot(Z); if (G.PEV) G.PEV.drawZones();
    L.length = 0; L.push({ y: H.y, h: 1 });
    for (const e of G.E) if (e.delay <= 0) L.push({ y: e.y, e });
    for (const n of G.NPC) L.push({ y: n.y, n });
    if (G.OCC) G.OCC.add(L); if (G.PARTY) G.PARTY.add(L);
    L.sort((a, b) => a.y - b.y); for (const o of L) { if (o.e) G.drawOni(o.e); else if (o.n) G.drawNpc(o.n); else if (o.oc) G.OCC.draw(o.oc); else if (o.pa) G.PARTY.draw(o.pa); else G.drawHero(); }
    if (G.PEV) G.PEV.drawProj();
    G.drawFx(Z); G.NPCLIFE && G.NPCLIFE.draw(Z); SC.end();
    if (G.flash > 0) { ctx.fillStyle = `rgba(160,20,20,${G.flash / 30})`; ctx.fillRect(0, 0, G.LW, G.LH); }
  };
})();
