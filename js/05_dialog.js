/* ==========================================================================
 * 神諭之地 重製版 — 05_dialog.js
 * Version : r3.166.0  (2026-11-27)　r3.166.0：選項上方已有台詞時不再顯示「你要怎麼做？」
 * 舊版    : r3.160.0  (2026-11-27)　r3.160.0：玄符（黑符的雙胞胎哥哥）共用黑符半身像
 * 舊版    : r3.157.2  (2026-11-27)　r3.157.2：對話開始前先等半身像載好（最多 0.6 秒），連選項分支一起預載——修正第一次出場（如五條大橋弁慶）沒有頭像
 * 舊版    : r3.157.0  (2026-11-27)　r3.157.0：接入 68 張對話半身像（a/bust，講話時才載入；茨木／景綱／晴明等簡稱也對得到）
 * 舊版    : r3.154.0  (2026-11-27)　r3.154.0：出選項時上方保留上一句台詞（誰在問、問什麼）
 * 舊版    : r3.146.0  (2026-11-27)　r3.146.0：記錄對話結束時間（_endT，橫幅延後用）
 * 舊版    : r3.145.0  (2026-11-27)　r3.145.0：對話改成半身頭像：框外上方站人，位置在一段對話內固定（蒼真右、對方左），講話的人亮、其他人暗；名字牌移到講話者那側；有底色的頭像自動去背
 * 舊版    : r3.90.0  (2026-11-26)　r3.90.0：選項框加寬（440→560）；選項文字太長先縮字、再分兩行，不再超出框
 * 舊版    : r2.0.0  (2026-11-10)
 * 變更    : r2.0.0 對話框高度、行距、換行寬度隨字體大小縮放；新增鐵心頭像。
 * 變更    : r1.1.0 新增小雪／阿松／勘婆／權爺／小太頭像；G.DLG.who＝目前說話者（NPC 切說話格）。
 * 說明    : 視覺小說式對話——頭像（有素材才顯示，沒有就只顯示名牌）、打字機（三段速度）、
 *           選項（可設旗標）、{do} 動作行、記錄（最近 60 句）、快進。
 *           對話結束時才把旗標／記錄寫入存檔 1 次（不在每句寫）。
 * 行格式  : {who,text} ｜ {choice:[{label,set,then:[...]}]} ｜ {do:fn}
 * ========================================================================== */
'use strict';
(function () {
  const ctx = G.ctx, SPEED = [0.45, 0.8, 1.6];
  const FACE = { '蒼真': 'face_soma', '白丸': 'face_shiro', '小雪': 'face_xue', '阿松': 'face_matsu', '勘婆': 'face_okan', '權爺': 'face_gen', '小太': 'face_kota', '鐵心': 'face_smith' };
  /* r3.157.0：對話半身像（a/bust/bust_*.webp，512×512 去背、朝右）——講話時才載入，載好之前先用舊頭像 */
  const BN = { '蒼真': 'soma', '小雪': 'xue', '白丸': 'shiro', '茨木童子': 'ibaraki', '茨木': 'ibaraki', '葛葉': 'kuzuha', '役小角': 'enno', '汐音': 'shion', '源賴光': 'yorimitsu', '颯': 'hayate',
    '建御雷': 'takemikazuchi', '小太': 'kota', '鐵心': 'smith', '阿松': 'matsu', '權爺': 'gen', '勘婆': 'okan', '文也': 'fumiya', '道摩': 'doma', '河童長者': 'kappa_elder', '須佐之男': 'susanoo',
    '酒吞童子': 'shuten', '酒吞': 'shuten', '綾小路景綱': 'kagetsuna', '景綱': 'kagetsuna', '茂兵衛爺': 'mohei', '狐族長者': 'fox_elder', '天狗長者': 'tengu_elder', '白衣的巫女': 'yuki', '平八': 'heihachi', '岩藏': 'iwakura',
    '牛若丸': 'ushiwaka', '伊邪那美': 'izanami', '綿津見': 'watatsumi', '冬乃': 'fuyuno', '八絃': 'yatsuo', '弁慶': 'benkei', '時雨': 'shigure', '傳送役・時雨': 'shigure', '五平': 'gohei', '鬼鍛冶權六': 'gonroku', '權六': 'gonroku',
    '長壁姬': 'osakabe', '源義經': 'yoshitsune', '鬼灘': 'onada', '道滿': 'doman', '年輕的陰陽師': 'doman', '澄岳': 'chogaku', '宗八': 'sohachi', '鬼王': 'oniou', '雷獸': 'raiju', '花澄': 'hanasumi', '砂狐': 'sagitsune',
    '阿德婆婆': 'otoku', '阿德': 'otoku', '蓬庵': 'hoan', '汀江': 'migiwae', '潮丸的娘': 'migiwae', '巡檢孫六': 'magoroku', '孫六': 'magoroku', '九尾': 'kyubi', '鬼族使者': 'oni_envoy', '阿紺': 'okon', '染布的阿紺': 'okon', '爐火女神': 'hearth_goddess',
    '海邊的河童': 'kappa_sea', '安倍晴明': 'seimei', '晴明': 'seimei', '阿春': 'oharu', '劍士的亡魂': 'swordsman_ghost', '鎌鼬': 'kamaitachi', '鎌鼬長兄': 'kamaitachi', '阿菊': 'okiku', '河童大將': 'kappa_general',
    '村長': 'village_chief', '鬼族守爐人': 'oni_keeper', '貓又': 'nekomata', '茶屋婆婆': 'teahouse_granny', '梅乃婆婆': 'umeno', '受傷的人魚': 'mermaid', '真穗': 'maho',
    '半兵衛': 'hanbei', '行商・半兵衛': 'hanbei', '潮丸': 'shiomaru', '甚藏': 'jinzo', '太吉': 'takichi', '挑夫太吉': 'takichi', '阿絹': 'okinu', '朔兵衛': 'sakubei', '千景': 'chikage', '鈴緒': 'suzuo', '冬馬': 'toma',
    '柚吉': 'yuzukichi', '小百合': 'sayuri', '蓮太': 'renta', '笹音': 'sasane', '太助': 'tasuke', '拉車的太助': 'tasuke', '槇之介': 'makinosuke', '小太郎': 'kotaro', '阿吉': 'akichi', '渡船夫': 'ferryman', '無名武士': 'nameless_samurai',
    '傘妖': 'kasaobake', '鬼族的母親': 'oni_mother', '織娘之女': 'weaver_girl', '葦穗村的長老': 'ashiho_elder', '士兵隊長': 'guard_captain', '道摩兵': 'doma_soldier', '道摩的副將': 'doma_general',
    '鬼族的孩子': 'oni_child', '鬼族的大叔': 'oni_uncle', '人類的攤販': 'vendor_human', '鬼族的攤販': 'vendor_oni', '老人': 'old_man', '陰陽頭': 'onmyo_head', '漁婦': 'fishwife', '掌櫃': 'innkeeper', '老闆娘': 'landlady',
    '老爺爺': 'grandpa', '放牛的孩子': 'cowherd', '前鬼': 'zenki', '後鬼': 'goki', '被綁住的小妖': 'bound_imp', '黑符陰陽師': 'kurofu', '黑符': 'kurofu', '玄符': 'kurofu', '仙鶴': 'crane', '人類代表': 'rep_human', '鬼族代表': 'rep_oni',
    '村婦': 'village_woman', '小河童': 'kappa_child', '鬼族的長老': 'oni_elder', '使者': 'messenger', '宿場的老闆': 'post_owner', '農婦': 'farm_wife' };
  const BREQ = {};
  function bustKey(n) { const b = BN[n]; if (!b) return null; const k = 'bust_' + b; if (G.IMG[k]) return k;
    if (!BREQ[k]) { BREQ[k] = 1; G.ASSET.img(k, 'a/bust/' + k + '.webp').catch(() => { BREQ[k] = 2; }); }   /* 還沒有圖的角色：記下失敗，之後不再等 */ return null; }
  const D = G.DLG = { list: null, i: 0, shown: 0, done: null, choice: null, log: false, skip: false, B: {},
    active() { return !!this.list; },
    get who() { const L = this.list && this.list[this.i]; return L && L.who; },
    start(list, done) { const need = new Set(); const walk = A => { for (const L of A || []) { if (!L) continue; if (L.who && BN[L.who]) need.add(L.who); if (L.choice) for (const c of L.choice) walk(c.then); } }; walk(list);   /* r3.157.2：連選項分支一起先載半身像 */
      for (const n of need) bustKey(n); for (const n of [...need]) if (G.IMG['bust_' + BN[n]] || BREQ['bust_' + BN[n]] === 2) need.delete(n); this.hold = need.size ? { names: [...need], t: G.t } : null;   /* 半身像沒載好前先等（最多 0.6 秒），不再出現第一句沒頭像 */
      this.list = list.slice(); this.i = 0; this.done = done; this.skip = false; this.log = false; G.IN.stick = null; this.prep(); },
    prep() {
      while (this.list && this.list[this.i] && this.list[this.i].do) { const f = this.list[this.i].do; this.i++; f(); }
      const L = this.list && this.list[this.i]; this.shown = 0; this.choice = L && L.choice ? L.choice : null;
      if (!L) return this.finish();
      if (L.text) { const lg = G.SAVE.data.log; lg.push([L.who || '', L.text]); if (lg.length > 60) lg.splice(0, lg.length - 60); }
    },
    finish() { const d = this.done; this._endT = G.t; this.list = null; this.choice = null; G.SAVE.markDirty(); G.SAVE.flush(); d && d(); },
    advance() { const L = this.list && this.list[this.i]; if (!L || this.choice) return;
      if (this.shown < L.text.length) { this.shown = L.text.length; return; }
      this.i++; if (this.i >= this.list.length) this.finish(); else this.prep(); },
    step() { if (!this.list) return; const L = this.list[this.i]; if (!L || !L.text) return;
      if (this.shown < L.text.length) this.shown = Math.min(L.text.length, this.shown + SPEED[G.SAVE.data.textSpeed]);
      else if (this.skip && !this.choice && G.t % 6 === 0) this.advance(); },
    tap(p) { if (this.hold) return;
      const B = this.B, hit = G.UI.hit;
      if (this.log) { this.log = false; return; }
      if (B.log && hit(p, B.log)) { this.log = true; return; }
      if (B.skip && hit(p, B.skip)) { this.skip = !this.skip; return; }
      if (this.choice) { const ch = this.choice;
        for (let k = 0; k < ch.length; k++) { const c = ch[k]; if (!hit(p, choiceRect(k, ch.length))) continue;
          if (c.set) G.SAVE.data.flags[c.set] = true;
          G.SAVE.data.log.push(['▶', c.label]); this.list.splice(this.i, 1, ...(c.then || [])); if (this.i >= this.list.length) this.finish(); else this.prep(); return; }
        return; }
      this.skip = false; this.advance();
    }
  };
  const box = () => { const w = Math.min(G.LW - 32 - G.SAFE.l - G.SAFE.r, 800), h = Math.round(116 * Math.max(1, G.FS() * 1.06)); return { x: (G.LW - w) / 2, y: G.LH - h - 12 - G.SAFE.b, w, h }; };
  const choiceRect = (k, n) => { const w = Math.min(560, G.LW - 80), h = 44, top = G.LH * 0.5 - (n * 54) / 2; return { x: (G.LW - w) / 2, y: top + k * 54, w, h }; };
  /* r3.90.0：選項文字太長時先縮字（15→12），還放不下就分兩行（不再超出選項框） */
  function choiceLabel(t, b) { const fs = G.FS(), maxW = b.w - 28, cx = b.x + b.w / 2, cy = b.y + b.h / 2 + 1;
    for (let s = 15; s >= 12; s--) { ctx.font = `900 ${s * fs}px ${G.FONT_S}`; if (ctx.measureText(t).width <= maxW) return G.txt(t, cx, cy, s, G.C.ink, 'center', G.FONT_S, 900); }
    ctx.font = `900 ${12 * fs}px ${G.FONT_S}`; const L = G.wrap(t, maxW), s2 = L.length > 2 ? 11 : 12, lh = Math.min(17, (b.h - 6) / Math.min(2, L.length));
    if (L.length > 2) { ctx.font = `900 ${11 * fs}px ${G.FONT_S}`; const L2 = G.wrap(t, maxW); L.length = 0; L.push(...L2.slice(0, 2)); if (L2.length > 2) L[1] = L[1].slice(0, -1) + '…'; }
    L.slice(0, 2).forEach((l, i) => G.txt(l, cx, cy + (i - (Math.min(2, L.length) - 1) / 2) * lh, s2, G.C.ink, 'center', G.FONT_S, 900)); }
  D.draw = function () { const hd = this.hold; if (hd) { if (G.t - hd.t > 36 || hd.names.every(n => G.IMG['bust_' + BN[n]] || BREQ['bust_' + BN[n]] === 2)) this.hold = null; else return; }
    const L = this.list && this.list[this.i]; if (!L) return;
    if (this.log) return drawLog();
    if (this.choice) { G.veil(0.35);
      const cy0 = choiceRect(0, this.choice.length).y; let pv = null; for (let j = this.i - 1; j >= 0; j--) { const q = this.list[j]; if (q && q.text) { pv = q; break; } }   /* r3.154.0：選項上方保留上一句台詞，看得出是誰在問 */
      if (pv && cy0 - 30 > 70 + G.SAFE.t) { const pw = Math.min(600, G.LW - 60), px = (G.LW - pw) / 2, Ls = (ctx.font = `600 ${13 * G.FS()}px ${G.FONT}`, G.wrap(pv.text, pw - 32)).slice(0, 2), ph = 20 + Ls.length * 18 + (pv.who ? 14 : 0), py = cy0 - 34 - ph;
        ctx.fillStyle = 'rgba(12,8,10,.88)'; G.rr(px, py, pw, ph, 8); ctx.fill(); ctx.strokeStyle = 'rgba(227,194,122,.4)'; ctx.lineWidth = 1; G.rr(px + .5, py + .5, pw - 1, ph - 1, 8); ctx.stroke();
        let ly = py + 14; if (pv.who) { G.txt(pv.who, px + 16, ly, 12, G.C.gold, 'left', G.FONT_S, 900); ly += 16; } Ls.forEach(l => { G.txt(l, px + 16, ly + 2, 13, G.C.ink, 'left', G.FONT, 600); ly += 18; }); }
      if (!pv) G.txt('你要怎麼做？', G.LW / 2, choiceRect(0, this.choice.length).y - 22, 13, G.C.sub, 'center', G.FONT, 500);
      this.choice.forEach((c, k) => { const b = choiceRect(k, this.choice.length); ctx.fillStyle = 'rgba(16,10,14,.9)'; G.rr(b.x, b.y, b.w, b.h, 8); ctx.fill();
        ctx.strokeStyle = G.C.gold; ctx.lineWidth = 1.2; G.rr(b.x + .5, b.y + .5, b.w - 1, b.h - 1, 8); ctx.stroke(); choiceLabel(c.label, b); });
      return; }
    const { x, y, w, h } = box();
    busts(this, L, x, y, w);   // r3.145.0：半身頭像（框外上方）
    const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, 'rgba(20,14,18,.93)'); g.addColorStop(1, 'rgba(10,7,10,.97)');
    ctx.fillStyle = g; G.rr(x, y, w, h, 10); ctx.fill(); ctx.strokeStyle = 'rgba(227,194,122,.55)'; ctx.lineWidth = 1; G.rr(x + .5, y + .5, w - 1, h - 1, 10); ctx.stroke();
    let tx = x + 22; const side = stage(this, L), P = bustP();
    if (L.who) { ctx.font = `900 15px ${G.FONT_S}`; const nw = ctx.measureText(L.who).width + 22, nx = side === 'R' ? x + w - P * 1.05 : side === 'L' ? x + P * 0.5 : tx - 4;   /* 右側名字牌避開「跳過／記錄／快進」 */   // r3.145.0：名字牌在講話的人那一側
      ctx.fillStyle = G.C.gold; G.rr(nx, y - 13, nw, 26, 13); ctx.fill(); G.txt(L.who, nx + nw / 2, y, 15, '#1a1014', 'center', G.FONT_S, 900); }
    const narr = !L.who || L.text[0] === '（';
    const fs = G.FS(); ctx.font = `${narr ? 500 : 700} ${16 * fs}px ${G.FONT}`; const lines = G.wrap(L.text.slice(0, Math.floor(this.shown)), x + w - tx - 26);
    lines.slice(0, 3).forEach((ln, i) => G.txt(ln, tx, y + 34 + i * 25 * fs, 16, narr ? '#d6c9b2' : '#f6eddb', 'left', G.FONT, narr ? 500 : 700));
    if (this.shown >= L.text.length && (G.t >> 4) % 2) G.txt('▼', x + w - 20, y + h - 16, 11, G.C.gold, 'center');
    const B = this.B; B.log = { x: x + w - 128, y: y - 30, w: 56, h: 24 }; B.skip = { x: x + w - 64, y: y - 30, w: 56, h: 24 };
    G.UI.pill(B.log, '記錄'); G.UI.pill(B.skip, this.skip ? '快進中' : '快進', this.skip);
  };
  /* ---------- r3.145.0：半身頭像——位置在一段對話內固定（蒼真右、其他人左；第三人接替最久沒講話的一側），講話的人亮、其他人暗 ---------- */
  const faceOf = n => { if (!n) return null; const bk = bustKey(n); if (bk) return bk; if (FACE[n]) return FACE[n]; const PD = G.PARTY && G.PARTY.DEF; if (PD) for (const id in PD) if (PD[id].name === n && PD[id].face) return PD[id].face; return null; };
  const BUST = {}; let castL = null, cast = { L: null, R: null };
  function bustImg(k, dim) { const im = G.IMG[k]; if (!im) return null; const c0 = BUST[k]; if (c0 && c0.src === im) return dim ? c0.d : c0.c;   /* 有底色的頭像去背一次後快取 */
    let c = im; try { const cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height; const x = cv.getContext('2d'); x.drawImage(im, 0, 0); const d = x.getImageData(0, 0, cv.width, cv.height), a = d.data;
      if (a[3] > 200) { const r0 = a[0], g0 = a[1], b0 = a[2]; for (let i = 0; i < a.length; i += 4) { const dd = Math.abs(a[i] - r0) + Math.abs(a[i + 1] - g0) + Math.abs(a[i + 2] - b0); if (dd < 30) a[i + 3] = 0; else if (dd < 60) a[i + 3] = Math.round((dd - 30) / 30 * 255); } x.putImageData(d, 0, 0); c = cv; } } catch (e) {}
    let dc = c; try { const cv = document.createElement('canvas'); cv.width = c.width; cv.height = c.height; const x = cv.getContext('2d'); x.drawImage(c, 0, 0); const d = x.getImageData(0, 0, cv.width, cv.height), a = d.data;   /* 變暗版（不用 ctx.filter，iOS Safari 也能用） */
      for (let i = 0; i < a.length; i += 4) { const l = (a[i] + a[i + 1] + a[i + 2]) / 3; a[i] = (a[i] * 0.6 + l * 0.4) * 0.45; a[i + 1] = (a[i + 1] * 0.6 + l * 0.4) * 0.45; a[i + 2] = (a[i + 2] * 0.6 + l * 0.4) * 0.45; } x.putImageData(d, 0, 0); dc = cv; } catch (e) {}
    BUST[k] = { src: im, c, d: dc }; return dim ? dc : c; }
  const bustP = () => Math.round(Math.min(G.LH * 0.6, 300));
  function stage(D, L) { if (D.list !== castL) { castL = D.list; cast = { L: null, R: null }; } const n = L.who, f = faceOf(n); if (!n || !f) return null;
    for (const s of ['L', 'R']) if (cast[s] && cast[s].n === n) { cast[s].t = G.t; cast[s].f = f; return s; }   /* 半身像載好後換掉暫用的舊頭像 */
    const pf = n === '蒼真' ? 'R' : 'L', ot = pf === 'L' ? 'R' : 'L', s = !cast[pf] ? pf : !cast[ot] ? ot : (cast.L.t <= cast.R.t ? 'L' : 'R');
    cast[s] = { n, f, t: G.t }; return s; }
  function busts(D, L, x, y, w) { const P = bustP(), narr = !L.who || L.text[0] === '（';
    for (const s of ['L', 'R']) { const c = cast[s]; if (!c) continue; const on = !narr && c.n === L.who, im = bustImg(c.f, !on); if (!im) continue; const k = on ? 1 : 0.94, sz = P * k, bx = s === 'L' ? x + 8 : x + w - sz - 8, by = y + 18 - sz;
      ctx.save(); ctx.beginPath(); ctx.rect(bx - 4, by - 4, sz + 8, y + 18 - by + 4); ctx.clip();
      if (s === 'R') { ctx.translate(bx * 2 + sz, 0); ctx.scale(-1, 1); } ctx.drawImage(im, bx, by, sz, sz); ctx.restore(); } }
  function drawLog() {
    G.veil(0.86); const x = Math.max(40, (G.LW - 700) / 2), top = 60 + G.SAFE.t, bot = G.LH - 34 - G.SAFE.b;
    G.txt('對話記錄', G.LW / 2, 28 + G.SAFE.t, 16, G.C.gold, 'center', G.FONT_S, 900);
    ctx.font = `500 ${13 * G.FS()}px ${G.FONT}`;
    const rows = []; let hgt = 0;   // 由最新往回塞，塞滿為止，再由上往下畫
    for (const [who, t] of G.SAVE.data.log.slice().reverse()) { const ln = G.wrap(t, G.LW - x * 2 - 90), hh = ln.length * 20 + 8; if (hgt + hh > bot - top) break; rows.unshift([who, ln]); hgt += hh; }
    let y = top;
    for (const [who, ln] of rows) { G.txt(who, x, y, 13, G.C.gold, 'left', G.FONT_S, 900); ln.forEach((s, i) => G.txt(s, x + 84, y + i * 20, 13, G.C.ink, 'left', G.FONT, 500)); y += ln.length * 20 + 8; }
    G.txt('點擊任意處返回', G.LW / 2, G.LH - 16 - G.SAFE.b, 11, G.C.dim, 'center', G.FONT, 500);
  }
})();
