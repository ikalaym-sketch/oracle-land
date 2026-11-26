/* =====================================================================
 * 148_link.js
 * 版本    : r3.130.0  (2026-11-27)
 * 說明    : 跨章聯動（劇情補完第 0 批）。
 *           ‧ 第 4 章「雷脈改道」→ 第 5 章爐殿前庭（W_R05_04）：
 *             - 第一次走到「突破爐殿前庭」時，岩藏在入口說明雷脈灌進鬼族的爐。
 *             - 地面週期噴火：地縫亮紅 1 秒預警 → 火柱，敵我都會受傷；完成「火種的去向」後停止。
 *           ‧ 第 3 章「將計就計」→ 鬼王 −10% 血（這裡）；葛葉認筆跡、省略林間坂寫在 54_story_b。
 *           ‧ 只在該地圖、該條件成立時運作；每 4 格檢查一次條件，不在其他地圖做事。
 * 依賴    : 53_quest（G.QST）、03_actors（G.hurtHero／G.damageOni／G.lootStep／G.drawLoot）、20_npc（G.AMB）
 * ===================================================================== */
(function () {
  const Q = G.QST, SC = G.SC, H = G.H, ctx = G.ctx; if (!Q) return;
  const F = () => G.SAVE.data.flags, say = (who, text) => ({ who, text });
  const MAP = 'W_R05_04', QID = 'c5_m3';
  const on = () => SC.id === MAP && Q.choice('c4_well') === 'divert' && !Q.isDone(QID) && Q.active && Q.active(QID);
  /* 岩藏的說明（只一次） */
  const IWA = [say('岩藏', '蒼真！你們也走到這裡了。'), say('蒼真', '岩藏？你怎麼會在鬼族的爐殿？'),
    say('岩藏', '這幾天我城裡的爐子，火一點起來就劈啪亂跳，打出來的鐵全都帶著雷。我打了三十年鐵，從沒見過這種事。'),
    say('岩藏', '我想來想去，只有一個原因——雷原那邊改了道的雷脈，順著地底一路流到這座山，灌進了鬼族的爐。'),
    say('岩藏', '你看那些地縫。冒紅光的地方，過一會兒就會噴火，人跟妖怪都一樣燒。千萬別站在上面。'),
    say('蒼真', '……雷脈改道，是我點頭的。我沒想到，它會流到這裡。'),
    say('岩藏', '別這樣想。礦場能繼續開，平八他們那些人才有飯吃，這是真的。'),
    say('岩藏', '只是天底下的東西，水也好、雷也好，總會流到某個地方去。我們能做的，就是知道它流到了哪裡，然後去收拾。'),
    say('岩藏', '看地上的光，亮起來就跑。我在入口這裡等你們。回城以後，我請你喝一杯。')];
  let npc = null, told = false;
  function intro() { const f = F(); if (f.lk_iwa5 || told) return; told = true;
    const p = (SC.def.nodes || {}).west_arrival || [H.x - 120, H.y], s = SC.snap ? SC.snap(p[0] + 120, p[1], 'open', 160) || p : p;
    const go = () => G.STORY.later(30, () => { if (SC.id !== MAP) return; f.lk_iwa5 = 1; G.SAVE.markDirty(); G.DLG.start(IWA.slice()); });
    if (G.AMB && G.AMB.add) G.AMB.add('n_p_iwakura', s[0], s[1], { hold: 1, name: '岩藏' }).then(n => { npc = n; if (n) n.face = 1; go(); }).catch(go); else go(); }
  /* 第 3 章將計就計 → 鬼王 −10% 血（直接減血；不走 bossMod，避免被當成盟友助陣） */
  const B = G.BOSS; if (B && B.start) { const bs0 = B.start; B.start = function (id) { const enc = bs0.apply(this, arguments);
    if (enc && SC.id === 'W_R05_07' && Q.choice('c3_bride') === 'follow' && !F()['boss_W_R05_07']) { for (const u of enc.units) u.hp = u.hpMax = Math.round(u.hpMax * 0.9);
      G.STORY.later(90, () => G.UI.banner('爐火還沒燒旺', '你們搶在黑符補給之前趕到（鬼王血量 −10%）')); }
    return enc; }; }
  /* 噴火口 */
  const V = [], HH = () => G.HERO_H || 90; let tk = 0, cd = 120, live = false;
  function spawn() { const pts = [[H.x + (Math.random() - 0.5) * 80, H.y + (Math.random() - 0.5) * 30]];
    for (let i = 0; i < 2; i++) { const p = SC.snap(H.x + (Math.random() - 0.5) * 520, H.y + (Math.random() - 0.5) * 220, 'walk', 120); if (p) pts.push(p); }
    for (const [x, y] of pts) if (SC.walkable(x, y)) V.push({ x, y, r: HH() * 0.62, t: 0, warn: 60, life: 96 }); }
  function hit(v) { const inE = (x, y) => { const dx = (x - v.x) / v.r, dy = (y - v.y) / (v.r * 0.45); return dx * dx + dy * dy <= 1; };
    if (inE(H.x, H.y)) G.hurtHero(H.hpMax * 0.06, v.x);
    for (const e of G.E) if (e.st !== 'dead' && !e.boss && inE(e.x, e.y)) G.damageOni(e, 0.8, false, false, { rune: 1, env: 1 });
    if (G.spawnFx) try { G.spawnFx('skill_fire_rim_a', 0, v.x, v.y, 1, SC.depth(v.y) * 1.6); } catch (e) {}
    SC.shake = Math.max(SC.shake || 0, 3); }
  const ls0 = G.lootStep; G.lootStep = function () { ls0.apply(this, arguments);
    if (++tk % 4 === 0) live = on(); if (!live) { V.length = 0; return; }
    const s = Q.cur(QID); if (s && s.t === 'kill' && s.map === MAP) intro();
    if (--cd <= 0) { spawn(); cd = 200; }
    for (const v of V) { v.t++; if (v.t === v.warn) hit(v); }
    for (let i = V.length - 1; i >= 0; i--) if (V[i].t >= V[i].life) V.splice(i, 1); };
  const dl0 = G.drawLoot; G.drawLoot = function (Z) { dl0.apply(this, arguments); if (!V.length) return;
    for (const v of V) { ctx.save();
      if (v.t < v.warn) { const q = v.t / v.warn, a = 0.25 + 0.35 * q + 0.15 * Math.sin(v.t * 0.5);
        ctx.fillStyle = `rgba(255,${90 - 50 * q | 0},30,${a * 0.5})`; ctx.strokeStyle = `rgba(255,140,60,${a})`; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(v.x, v.y, v.r, v.r * 0.45, 0, 0, 6.283); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(v.x, v.y, v.r * q, v.r * 0.45 * q, 0, 0, 6.283); ctx.stroke(); }
      else { const k = (v.t - v.warn) / (v.life - v.warn), a = 1 - k, h = HH() * 2.4 * (k < 0.2 ? k / 0.2 : 1);
        const g = ctx.createLinearGradient(0, v.y - h, 0, v.y); g.addColorStop(0, 'rgba(255,200,80,0)'); g.addColorStop(0.35, `rgba(255,140,40,${0.55 * a})`); g.addColorStop(1, `rgba(255,240,160,${0.85 * a})`);
        ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; const w = v.r * (0.75 + 0.15 * Math.sin(v.t * 0.9));
        ctx.beginPath(); ctx.moveTo(v.x - w, v.y); ctx.quadraticCurveTo(v.x - w * 0.6, v.y - h * 0.6, v.x, v.y - h); ctx.quadraticCurveTo(v.x + w * 0.6, v.y - h * 0.6, v.x + w, v.y); ctx.closePath(); ctx.fill();
        ctx.fillStyle = `rgba(255,120,40,${0.45 * a})`; ctx.beginPath(); ctx.ellipse(v.x, v.y, v.r, v.r * 0.45, 0, 0, 6.283); ctx.fill(); }
      ctx.restore(); } };
})();
