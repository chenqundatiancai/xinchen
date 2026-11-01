/* =====================================================
   休闲时刻 · 扩展内容（俄罗斯方块 / 五子棋 / 我们的歌）
   ===================================================== */
window.ChillExtra = (function () {
  'use strict';

  var store = window.LoveStore;
  var UI = window.LoveUI;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* =====================================================
     俄罗斯方块
     ===================================================== */
  function tetris(pane, back) {
    var COLS = 10, ROWS = 20, CELL = 20;
    var SHAPES = [
      { s: [[1, 1, 1, 1]], c: '#5fd3f3' },
      { s: [[1, 1], [1, 1]], c: '#ffd166' },
      { s: [[0, 1, 0], [1, 1, 1]], c: '#c58bff' },
      { s: [[0, 1, 1], [1, 1, 0]], c: '#7ee6a8' },
      { s: [[1, 1, 0], [0, 1, 1]], c: '#ff7f9e' },
      { s: [[1, 0, 0], [1, 1, 1]], c: '#7fb2ff' },
      { s: [[0, 0, 1], [1, 1, 1]], c: '#ffb066' }
    ];

    pane.innerHTML = '<div class="game-head"><button class="btn-ghost" id="tBack">← 游戏</button><h3>俄罗斯方块</h3></div>' +
      '<div class="tetris-wrap"><div class="scorebar"><span>分数 <b id="tScore">0</b></span><span>消行 <b id="tLines">0</b></span><span>等级 <b id="tLevel">1</b></span></div>' +
      '<canvas class="tetris" width="200" height="400"></canvas>' +
      '<div class="tkeys"><button data-k="left">←</button><button data-k="rot">↻</button><button data-k="right">→</button>' +
      '<button data-k="down">↓</button><button data-k="drop">落下</button></div></div>';

    var canvas = pane.querySelector('.tetris');
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = COLS * CELL * dpr; canvas.height = ROWS * CELL * dpr;
    canvas.style.width = (COLS * CELL) + 'px'; canvas.style.height = (ROWS * CELL) + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var board = [];
    for (var r = 0; r < ROWS; r++) { board.push([]); for (var c = 0; c < COLS; c++) board[r].push(null); }

    var cur = null, score = 0, lines = 0, level = 1, dead = false, timer = null;

    function newPiece() {
      var p = SHAPES[Math.floor(Math.random() * SHAPES.length)];
      cur = {
        s: p.s.map(function (row) { return row.slice(); }),
        c: p.c,
        x: Math.floor((COLS - p.s[0].length) / 2),
        y: 0
      };
      if (collide(cur.s, cur.x, cur.y)) { dead = true; clearInterval(timer); draw(); }
    }

    function collide(shape, ox, oy) {
      for (var y = 0; y < shape.length; y++) for (var x = 0; x < shape[y].length; x++) {
        if (!shape[y][x]) continue;
        var nx = ox + x, ny = oy + y;
        if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
        if (ny >= 0 && board[ny][nx]) return true;
      }
      return false;
    }

    function merge() {
      for (var y = 0; y < cur.s.length; y++) for (var x = 0; x < cur.s[y].length; x++) {
        if (cur.s[y][x] && cur.y + y >= 0) board[cur.y + y][cur.x + x] = cur.c;
      }
    }

    function clearLines() {
      var cleared = 0;
      for (var y = ROWS - 1; y >= 0; y--) {
        var full = true;
        for (var x = 0; x < COLS; x++) if (!board[y][x]) { full = false; break; }
        if (full) {
          board.splice(y, 1);
          var empty = []; for (var k = 0; k < COLS; k++) empty.push(null);
          board.unshift(empty);
          cleared++; y++;
        }
      }
      if (cleared) {
        lines += cleared;
        score += cleared * 100 * level;
        level = 1 + Math.floor(lines / 8);
        pane.querySelector('#tScore').textContent = score;
        pane.querySelector('#tLines').textContent = lines;
        pane.querySelector('#tLevel').textContent = level;
        if (timer) { clearInterval(timer); timer = setInterval(tick, Math.max(120, 650 - (level - 1) * 55)); }
      }
    }

    function tick() {
      if (dead || !cur) return;
      if (!collide(cur.s, cur.x, cur.y + 1)) cur.y++;
      else { merge(); clearLines(); newPiece(); }
      draw();
    }

    function draw() {
      ctx.clearRect(0, 0, COLS * CELL, ROWS * CELL);
      for (var y = 0; y < ROWS; y++) for (var x = 0; x < COLS; x++) {
        if ((x + y) % 2 === 0) {
          ctx.fillStyle = 'rgba(255,255,255,.025)';
          ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
        }
      }
      for (var yy = 0; yy < ROWS; yy++) for (var xx = 0; xx < COLS; xx++) {
        if (board[yy][xx]) paint(xx, yy, board[yy][xx]);
      }
      if (cur) for (var cy = 0; cy < cur.s.length; cy++) for (var cx = 0; cx < cur.s[cy].length; cx++) {
        if (cur.s[cy][cx]) paint(cur.x + cx, cur.y + cy, cur.c);
      }
      if (dead) {
        ctx.fillStyle = 'rgba(10,3,14,.78)';
        ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL);
        ctx.fillStyle = '#fff';
        ctx.font = '700 16px "PingFang SC","Microsoft YaHei",sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('游戏结束 · 点「落下」重来', COLS * CELL / 2, ROWS * CELL / 2);
      }
    }

    function paint(x, y, color) {
      ctx.fillStyle = color;
      ctx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2);
      ctx.fillStyle = 'rgba(255,255,255,.28)';
      ctx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, 3);
    }

    function rotate() {
      if (!cur) return;
      var s = cur.s;
      var rotated = [];
      for (var x = 0; x < s[0].length; x++) {
        rotated.push([]);
        for (var y = s.length - 1; y >= 0; y--) rotated[x].push(s[y][x]);
      }
      if (!collide(rotated, cur.x, cur.y)) cur.s = rotated;
      draw();
    }

    function move(dx) {
      if (!cur) return;
      if (!collide(cur.s, cur.x + dx, cur.y)) cur.x += dx;
      draw();
    }

    function drop() {
      if (dead) { restart(); return; }
      if (!cur) return;
      while (!collide(cur.s, cur.x, cur.y + 1)) cur.y++;
      merge(); clearLines(); newPiece(); draw();
    }

    function restart() {
      board = [];
      for (var r = 0; r < ROWS; r++) { board.push([]); for (var c = 0; c < COLS; c++) board[r].push(null); }
      score = 0; lines = 0; level = 1; dead = false;
      pane.querySelector('#tScore').textContent = '0';
      pane.querySelector('#tLines').textContent = '0';
      pane.querySelector('#tLevel').textContent = '1';
      newPiece(); draw();
      if (timer) clearInterval(timer);
      timer = setInterval(tick, 650);
    }

    function onKey(e) {
      if (!document.body.contains(pane)) return;
      var k = e.key.toLowerCase();
      if (k === 'arrowleft' || k === 'a') { e.preventDefault(); move(-1); }
      else if (k === 'arrowright' || k === 'd') { e.preventDefault(); move(1); }
      else if (k === 'arrowdown' || k === 's') { e.preventDefault(); if (!collide(cur.s, cur.x, cur.y + 1)) { cur.y++; draw(); } }
      else if (k === 'arrowup' || k === 'w') { e.preventDefault(); rotate(); }
      else if (k === ' ') { e.preventDefault(); drop(); }
    }

    document.addEventListener('keydown', onKey);
    pane.querySelector('.tkeys').onclick = function (ev) {
      var b = ev.target.closest('[data-k]');
      if (!b) return;
      var k = b.getAttribute('data-k');
      if (k === 'left') move(-1);
      if (k === 'right') move(1);
      if (k === 'down') { if (!collide(cur.s, cur.x, cur.y + 1)) { cur.y++; draw(); } }
      if (k === 'rot') rotate();
      if (k === 'drop') drop();
    };
    pane.querySelector('#tBack').onclick = function () { cleanup(); back(); };

    function cleanup() {
      document.removeEventListener('keydown', onKey);
      if (timer) clearInterval(timer);
    }

    restart();
    return cleanup;
  }

  /* =====================================================
     五子棋（15×15，双人 / 人机）
     ===================================================== */
  function gomoku(pane, back) {
    var N = 15, CELL = 24, PAD = 12;
    var size = (N - 1) * CELL + PAD * 2;

    pane.innerHTML = '<div class="game-head"><button class="btn-ghost" id="gBack">← 游戏</button><h3>五子棋</h3></div>' +
      '<div class="snake-wrap"><div class="scorebar"><span id="gTurn">黑棋先走</span>' +
      '<button class="chip is-on" id="gMode">人机对战</button></div>' +
      '<canvas class="gomoku" width="' + size + '" height="' + size + '"></canvas>' +
      '<button class="btn-ghost" id="gReset">重新开始</button></div>';

    var canvas = pane.querySelector('.gomoku');
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = size * dpr; canvas.height = size * dpr;
    canvas.style.width = size + 'px'; canvas.style.height = size + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var grid, turn, over, vsAI = true;

    function reset() {
      grid = [];
      for (var y = 0; y < N; y++) { grid.push([]); for (var x = 0; x < N; x++) grid[y].push(0); }
      turn = 1; over = false;
      pane.querySelector('#gTurn').textContent = '黑棋先走';
      draw();
    }

    function draw() {
      ctx.clearRect(0, 0, size, size);
      ctx.strokeStyle = 'rgba(255,210,170,.35)';
      ctx.lineWidth = 1;
      for (var i = 0; i < N; i++) {
        ctx.beginPath();
        ctx.moveTo(PAD + i * CELL, PAD);
        ctx.lineTo(PAD + i * CELL, PAD + (N - 1) * CELL);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(PAD, PAD + i * CELL);
        ctx.lineTo(PAD + (N - 1) * CELL, PAD + i * CELL);
        ctx.stroke();
      }
      for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
        if (!grid[y][x]) continue;
        ctx.beginPath();
        ctx.arc(PAD + x * CELL, PAD + y * CELL, CELL * 0.42, 0, Math.PI * 2);
        ctx.fillStyle = grid[y][x] === 1 ? '#2a1216' : '#fff6e8';
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,.35)';
        ctx.stroke();
      }
    }

    function win(x, y, who) {
      var dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
      for (var d = 0; d < 4; d++) {
        var cnt = 1;
        for (var s = -1; s <= 1; s += 2) {
          var nx = x + dirs[d][0] * s, ny = y + dirs[d][1] * s;
          while (nx >= 0 && nx < N && ny >= 0 && ny < N && grid[ny][nx] === who) {
            cnt++; nx += dirs[d][0] * s; ny += dirs[d][1] * s;
          }
        }
        if (cnt >= 5) return true;
      }
      return false;
    }

    function place(x, y, who) {
      if (grid[y][x] || over) return false;
      grid[y][x] = who;
      draw();
      if (win(x, y, who)) {
        over = true;
        pane.querySelector('#gTurn').textContent = (who === 1 ? '黑棋' : '白棋') + ' 赢了！';
        UI.toast((who === 1 ? '黑棋' : '白棋') + ' 赢了');
        return true;
      }
      return true;
    }

    function lineScore(count, open) {
      if (count >= 5) return 200000;
      if (count === 4) return open === 2 ? 12000 : (open === 1 ? 900 : 0);
      if (count === 3) return open === 2 ? 1200 : (open === 1 ? 120 : 0);
      if (count === 2) return open === 2 ? 120 : (open === 1 ? 12 : 0);
      if (count === 1) return open === 2 ? 12 : 2;
      return 0;
    }

    function spotScore(x, y, who) {
      var dirs = [[1, 0], [0, 1], [1, 1], [1, -1]], total = 0;
      for (var d = 0; d < 4; d++) {
        var count = 1, open = 0;
        for (var s = -1; s <= 1; s += 2) {
          var nx = x, ny = y;
          while (true) {
            nx += dirs[d][0] * s; ny += dirs[d][1] * s;
            if (nx < 0 || nx >= N || ny < 0 || ny >= N) break;
            if (grid[ny][nx] === who) count++;
            else { if (!grid[ny][nx]) open++; break; }
          }
        }
        total += lineScore(count, open);
      }
      return total;
    }

    function aiMove() {
      var best = null, bestScore = -1;
      for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
        if (grid[y][x]) continue;
        var near = false;
        for (var dy = -2; dy <= 2 && !near; dy++) for (var dx = -2; dx <= 2; dx++) {
          var nx = x + dx, ny = y + dy;
          if (nx >= 0 && nx < N && ny >= 0 && ny < N && grid[ny][nx]) { near = true; break; }
        }
        if (!near) continue;
        var s = spotScore(x, y, 2) * 1.05 + spotScore(x, y, 1) * 1.2 + Math.random() * 5;
        if (s > bestScore) { bestScore = s; best = { x: x, y: y }; }
      }
      if (!best) { best = { x: 7, y: 7 }; }
      return best;
    }

    canvas.onclick = function (ev) {
      if (over) return;
      var box = canvas.getBoundingClientRect();
      var k = size / box.width;   /* 画布可能被缩放过 */
      var x = Math.round(((ev.clientX - box.left) * k - PAD) / CELL);
      var y = Math.round(((ev.clientY - box.top) * k - PAD) / CELL);
      if (x < 0 || x >= N || y < 0 || y >= N) return;
      if (!place(x, y, turn)) return;
      if (over) return;
      turn = turn === 1 ? 2 : 1;
      pane.querySelector('#gTurn').textContent = (turn === 1 ? '黑棋' : '白棋') + ' 走';
      if (vsAI && turn === 2) {
        setTimeout(function () {
          if (over || !document.body.contains(pane)) return;
          var m = aiMove();
          place(m.x, m.y, 2);
          if (!over) {
            turn = 1;
            pane.querySelector('#gTurn').textContent = '黑棋 走';
          }
        }, 220);
      }
    };

    pane.querySelector('#gMode').onclick = function () {
      vsAI = !vsAI;
      this.textContent = vsAI ? '人机对战' : '双人对战';
      this.classList.toggle('is-on', vsAI);
      reset();
    };
    pane.querySelector('#gReset').onclick = reset;
    pane.querySelector('#gBack').onclick = function () { back(); };

    reset();
    return null;
  }


  /* =====================================================
     飞行棋（两人同屏）
     ===================================================== */
  function aeroplane(pane, back) {
    var W = 340, H = 340, PAD = 26, R = 46;
    var CELLS = 44;
    var START = [0, 22];
    var GOAL = 43;             /* 相对起点走满 43 格到达终点 */
    var FLIGHT = { 8: 5, 30: 5 };  /* 落在这些格子往前飞 5 格 */

    pane.innerHTML = '<div class="game-head"><button class="btn-ghost" id="aBack">← 游戏</button><h3>飞行棋</h3></div>' +
      '<div class="snake-wrap">' +
      '<div class="scorebar"><span class="ap-turn" id="aTurn">🔴 红方回合</span><span id="aHint">点「掷骰子」开始</span></div>' +
      '<canvas class="ap-board" width="' + W + '" height="' + H + '"></canvas>' +
      '<div class="ap-actions"><button class="btn-soft" id="aDice">🎲 掷骰子</button>' +
      '<button class="btn-ghost" id="aReset">重开</button></div></div>';

    var canvas = pane.querySelector('.ap-board');
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    /* 生成圆角矩形环上的 CELLS 个点 */
    function buildLoop() {
      var x0 = PAD, y0 = PAD, x1 = W - PAD, y1 = H - PAD, r = R;
      var pts = [], i;
      function line(ax, ay, bx, by, n) {
        for (i = 0; i <= n; i++) pts.push({ x: ax + (bx - ax) * i / n, y: ay + (by - ay) * i / n });
      }
      function arc(cx, cy, a0, a1, n) {
        for (i = 0; i <= n; i++) {
          var a = a0 + (a1 - a0) * i / n;
          pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
        }
      }
      line(x0 + r, y0, x1 - r, y0, 30);
      arc(x1 - r, y0 + r, -Math.PI / 2, 0, 12);
      line(x1, y0 + r, x1, y1 - r, 30);
      arc(x1 - r, y1 - r, 0, Math.PI / 2, 12);
      line(x1 - r, y1, x0 + r, y1, 30);
      arc(x0 + r, y1 - r, Math.PI / 2, Math.PI, 12);
      line(x0, y1 - r, x0, y0 + r, 30);
      arc(x0 + r, y0 + r, Math.PI, Math.PI * 1.5, 12);

      /* 按弧长均匀取 CELLS 个 */
      var lens = [0], acc = 0;
      for (i = 1; i < pts.length; i++) {
        acc += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
        lens.push(acc);
      }
      var out = [], step = acc / CELLS, k = 0;
      for (i = 0; i < CELLS; i++) {
        var target = i * step;
        while (k < lens.length - 1 && lens[k] < target) k++;
        out.push(pts[k]);
      }
      return out;
    }
    var loop = buildLoop();

    var planes, turn, dice, busy, over;

    function reset() {
      planes = [
        { owner: 0, pos: -1 }, { owner: 0, pos: -1 },
        { owner: 1, pos: -1 }, { owner: 1, pos: -1 }
      ];
      turn = 0; dice = 0; busy = false; over = false;
      pane.querySelector('#aTurn').textContent = '🔴 红方回合';
      pane.querySelector('#aHint').textContent = '点「掷骰子」开始';
      draw();
    }

    function cellOf(pl) {
      if (pl.pos < 0) return null;
      return loop[(START[pl.owner] + pl.pos) % CELLS];
    }

    var BASE = [{ x: 122, y: 122 }, { x: H - 42, y: H - 42 }];
    function baseSpot(pl, idx) {
      var b = BASE[pl.owner];
      var off = idx === 0 ? -11 : 11;
      return { x: b.x + off, y: b.y };
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      /* 底 */
      ctx.fillStyle = 'rgba(255,255,255,.03)';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(PAD - 6, PAD - 6, W - (PAD - 6) * 2, H - (PAD - 6) * 2, 52);
      else ctx.rect(PAD - 6, PAD - 6, W - 2 * PAD + 12, H - 2 * PAD + 12);
      ctx.fill();

      /* 格子 */
      for (var i = 0; i < CELLS; i++) {
        var pt = loop[i];
        var isFlight = FLIGHT[i] !== undefined;
        var isStart = (i === START[0] || i === START[1]);
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, isFlight ? 10 : 8, 0, Math.PI * 2);
        ctx.fillStyle = isFlight ? 'rgba(255,212,110,.25)' : (isStart ? 'rgba(255,150,90,.22)' : 'rgba(255,255,255,.08)');
        ctx.fill();
        ctx.strokeStyle = isFlight ? 'rgba(255,212,110,.9)' : 'rgba(255,210,170,.28)';
        ctx.lineWidth = isFlight ? 2 : 1;
        ctx.stroke();
        if (isFlight) {
          ctx.fillStyle = '#ffd46e';
          ctx.font = '700 10px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('⚡', pt.x, pt.y + 3.5);
        }
      }

      /* 基地 */
      [0, 1].forEach(function (owner) {
        var cx = BASE[owner].x;
        var cy = BASE[owner].y;
        ctx.beginPath();
        ctx.arc(cx, cy, 28, 0, Math.PI * 2);
        ctx.fillStyle = owner === 0 ? 'rgba(255,90,90,.14)' : 'rgba(90,150,255,.14)';
        ctx.fill();
        ctx.strokeStyle = owner === 0 ? 'rgba(255,120,120,.5)' : 'rgba(120,170,255,.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      /* 飞机 */
      var baseCount = [0, 0];
      planes.forEach(function (pl, idx) {
        var p, r = 9;
        if (pl.pos < 0) { p = baseSpot(pl, baseCount[pl.owner]++); }
        else if (pl.pos >= GOAL + 1) { p = { x: pl.owner === 0 ? W / 2 - 16 : W / 2 + 16, y: H / 2 }; }
        else p = cellOf(pl);
        if (!p) return;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = pl.owner === 0 ? '#ff5a5a' : '#5a96ff';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.9)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.font = '700 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('✈', p.x, p.y + 3);
      });
    }

    function legalMoves(owner, d) {
      var out = [];
      planes.forEach(function (pl, idx) {
        if (pl.owner !== owner) return;
        if (pl.pos >= GOAL + 1) return;
        if (pl.pos < 0) { if (d === 6) out.push(idx); return; }
        if (pl.pos + d <= GOAL) out.push(idx);
      });
      return out;
    }

    function movePlane(idx) {
      var pl = planes[idx];
      if (pl.pos < 0) pl.pos = 0;
      else pl.pos += dice;

      /* 飞行格 */
      if (pl.pos >= 0 && pl.pos <= GOAL && FLIGHT[(START[pl.owner] + pl.pos) % CELLS] !== undefined) {
        var jump = FLIGHT[(START[pl.owner] + pl.pos) % CELLS];
        if (pl.pos + jump <= GOAL) {
          pl.pos += jump;
          UI.toast('飞到下一格 +' + jump);
        }
      }
      draw();

      /* 撞到对方 */
      var abs = pl.pos <= GOAL ? (START[pl.owner] + pl.pos) % CELLS : -1;
      planes.forEach(function (o) {
        if (o === pl || o.owner === pl.owner || o.pos < 0 || o.pos > GOAL) return;
        var oabs = (START[o.owner] + o.pos) % CELLS;
        if (oabs === abs && abs >= 0) {
          o.pos = -1;
          UI.toast((pl.owner === 0 ? '红方' : '蓝方') + ' 把对方送回家了');
        }
      });
      draw();

      /* 胜负 */
      var done = planes.filter(function (x) { return x.owner === pl.owner && x.pos >= GOAL + 1; });
      if (done.length === 2) {
        over = true;
        pane.querySelector('#aHint').textContent = (pl.owner === 0 ? '🔴 红方' : '🔵 蓝方') + ' 赢了！';
        UI.toast((pl.owner === 0 ? '红方' : '蓝方') + ' 赢了！');
        return;
      }
      nextTurn(dice === 6);
    }

    function nextTurn(again) {
      if (again) {
        pane.querySelector('#aHint').textContent = '掷出 6，再来一次';
        dice = 0;
        return;
      }
      turn = turn === 0 ? 1 : 0;
      dice = 0;
      pane.querySelector('#aTurn').textContent = turn === 0 ? '🔴 红方回合' : '🔵 蓝方回合';
      pane.querySelector('#aHint').textContent = '点「掷骰子」';
      draw();
    }

    pane.querySelector('#aDice').onclick = function () {
      if (over || busy || dice) return;
      dice = 1 + Math.floor(Math.random() * 6);
      var ms = legalMoves(turn, dice);
      pane.querySelector('#aHint').textContent = '掷到 ' + dice + ' 点';
      if (!ms.length) {
        UI.toast('掷到 ' + dice + '，没有能走的棋');
        setTimeout(function () { nextTurn(false); }, 600);
        return;
      }
      if (ms.length === 1) {
        busy = true;
        setTimeout(function () { busy = false; movePlane(ms[0]); }, 260);
        return;
      }
      pane.querySelector('#aHint').textContent = '掷到 ' + dice + '，点一下要走的飞机';
      draw();
      highlight = ms;
    };

    var highlight = [];
    canvas.onclick = function (ev) {
      if (over || busy || !dice || !highlight.length) return;
      var box = canvas.getBoundingClientRect();
      var mx = (ev.clientX - box.left) * (W / box.width);
      var my = (ev.clientY - box.top) * (H / box.height);
      var best = -1, bestD = 22;
      highlight.forEach(function (idx) {
        var pl = planes[idx];
        var p = pl.pos < 0 ? baseSpot(pl, 0) : cellOf(pl);
        if (!p) return;
        var d = Math.hypot(p.x - mx, p.y - my);
        if (d < bestD) { bestD = d; best = idx; }
      });
      if (best >= 0) { highlight = []; movePlane(best); }
    };

    pane.querySelector('#aReset').onclick = reset;
    pane.querySelector('#aBack').onclick = function () { back(); };
    reset();
    return null;
  }

  /* =====================================================
     我们的歌
     ===================================================== */
  function songs(pane) {
    function list() { return store.get('songs', []); }
    function save(a) { return store.set('songs', a); }

    function render() {
      var items = list();
      var html = '<div class="bar"><span style="font-size:12px;color:rgba(255,234,244,.55)">' + items.length + ' 首歌</span>' +
        '<div class="bar__right"><button class="btn-soft" id="addSong">＋ 加一首</button>' +
        '<button class="btn-ghost" id="importSong">导入歌单</button></div></div>';

      if (!items.length) {
        html += '<div class="empty">歌单还是空的。<br>把你们一起听过的歌加进来，或者粘贴一段歌单直接导入。</div>';
      } else {
        html += '<div class="song-list">';
        items.forEach(function (s) {
          var q = encodeURIComponent((s.name || '') + ' ' + (s.artist || ''));
          var url = s.url || ('https://music.163.com/#/search/m/?s=' + q + '&type=1');
          html += '<div class="song-row" data-sid="' + esc(s.id) + '">' +
            '<span class="song-row__icon">♪</span>' +
            '<span class="song-row__main"><b>' + esc(s.name) + '</b>' +
            (s.artist ? '<i>' + esc(s.artist) + '</i>' : '') + '</span>' +
            '<a class="song-row__play" href="' + esc(url) + '" target="_blank" rel="noopener">去听</a>' +
            '<button class="song-row__del" data-act="del">×</button></div>';
        });
        html += '</div>';
        html += '<div class="notice">点「去听」会在网易云/你填的链接里打开。<br>没有链接时按「歌名 + 歌手」自动搜。</div>';
      }

      pane.innerHTML = html;
      var add = pane.querySelector('#addSong');
      if (add) add.onclick = renderAdd;
      var imp = pane.querySelector('#importSong');
      if (imp) imp.onclick = renderImport;

      pane.querySelectorAll('[data-act="del"]').forEach(function (el) {
        el.onclick = function () {
          var row = el.closest('.song-row');
          var id = row.getAttribute('data-sid');
          save(list().filter(function (x) { return x.id !== id; }));
          render();
        };
      });
    }

    function renderAdd() {
      pane.innerHTML = '<div class="form">' +
        '<div class="field"><label>歌名</label><input id="sName" maxlength="40" placeholder="比如：晴天"></div>' +
        '<div class="field"><label>歌手</label><input id="sArtist" maxlength="30" placeholder="周杰伦"></div>' +
        '<div class="field"><label>链接（可不填）</label><input id="sUrl" placeholder="https://..."></div>' +
        '<div class="bar" style="margin:0"><button class="btn-soft" id="sSave">加进歌单</button>' +
        '<button class="btn-ghost" id="sBack">返回</button></div></div>';
      pane.querySelector('#sBack').onclick = render;
      pane.querySelector('#sSave').onclick = function () {
        var name = pane.querySelector('#sName').value.trim();
        if (!name) { UI.toast('写个歌名'); return; }
        var all = list();
        all.push({
          id: 's' + Date.now().toString(36), name: name,
          artist: pane.querySelector('#sArtist').value.trim(),
          url: pane.querySelector('#sUrl').value.trim(), createdAt: Date.now()
        });
        save(all);
        UI.toast('加进歌单了');
        render();
      };
      pane.querySelector('#sName').focus();
    }

    function renderImport() {
      pane.innerHTML = '<div class="form">' +
        '<div class="field"><label>把歌单粘贴进来（一行一首，支持「歌名 - 歌手」）</label>' +
        '<textarea id="sBulk" placeholder="晴天 - 周杰伦&#10;小幸运 - 田馥甄&#10;稻香"></textarea></div>' +
        '<div class="bar" style="margin:0"><button class="btn-soft" id="sImport">导入</button>' +
        '<button class="btn-ghost" id="sBack2">返回</button></div></div>';
      pane.querySelector('#sBack2').onclick = render;
      pane.querySelector('#sImport').onclick = function () {
        var text = pane.querySelector('#sBulk').value;
        var lines = text.split(/\r?\n/).map(function (x) { return x.trim(); }).filter(Boolean);
        if (!lines.length) { UI.toast('先粘贴几行'); return; }
        var all = list();
        lines.forEach(function (line, i) {
          var m = line.split(/\s*[-—–]\s*/);
          all.push({
            id: 's' + Date.now().toString(36) + i,
            name: (m[0] || '').trim(),
            artist: (m[1] || '').trim(),
            url: '', createdAt: Date.now()
          });
        });
        save(all);
        UI.toast('导入了 ' + lines.length + ' 首');
        render();
      };
      pane.querySelector('#sBulk').focus();
    }

    render();
    return null;
  }

  return { tetris: tetris, gomoku: gomoku, aeroplane: aeroplane, songs: songs };
})();
