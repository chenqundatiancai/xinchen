/* =====================================================
   休闲时刻 · 小游戏 + 一起看
   ===================================================== */
(function () {
  'use strict';

  var store = window.LoveStore;
  var UI = window.LoveUI;
  if (!store || !UI) return;

  var tab = 'games';
  var cleanup = null;

  var DEFAULT_LINKS = [
    { cat: '影视', icon: '🎬', name: 'B站 · 影视区', url: 'https://www.bilibili.com/v/movie/', note: '正版片源，大量免费' },
    { cat: '影视', icon: '📺', name: '央视网 · 电视剧', url: 'https://tv.cctv.com/', note: '免费，画质稳' },
    { cat: '影视', icon: '🎥', name: '咪咕视频', url: 'https://www.miguvideo.com/', note: '部分免费' },
    { cat: '动漫', icon: '🌸', name: 'B站 · 番剧', url: 'https://www.bilibili.com/anime/', note: '正版番剧，免费集很多' },
    { cat: '动漫', icon: '🐉', name: 'B站 · 国创', url: 'https://www.bilibili.com/guochuang/', note: '国产动画' },
    { cat: '综艺', icon: '🎤', name: 'B站 · 综艺', url: 'https://www.bilibili.com/v/variety/', note: '免费综艺' },
    { cat: '综艺', icon: '🎙️', name: '央视网 · 综艺', url: 'https://tv.cctv.com/variety/', note: '免费' },
    { cat: '纪录片', icon: '🌍', name: 'B站 · 纪录片', url: 'https://www.bilibili.com/v/documentary/', note: '免费纪录片很多' },
    { cat: '纪录片', icon: '📖', name: '央视网 · 纪实', url: 'https://jishi.cctv.com/', note: '免费，画质好' },
    { cat: '一起听', icon: '🌧️', name: 'Rainy Mood', url: 'https://rainymood.com/', note: '雨声，适合一起发呆' },
    { cat: '一起听', icon: '☕', name: 'Coffitivity', url: 'https://coffitivity.com/', note: '咖啡厅白噪音' },
    { cat: '一起听', icon: '🎵', name: '网易云音乐', url: 'https://music.163.com/', note: '一起听歌' }
  ];

  function links() {
    var custom = store.get('links', []);
    return DEFAULT_LINKS.concat(custom);
  }
  function cats() {
    var set = [], all = links();
    for (var i = 0; i < all.length; i++) if (set.indexOf(all[i].cat) < 0) set.push(all[i].cat);
    return set;
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ============ 2048 ============ */
  function game2048(pane, back) {
    var g = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
    var score = 0;
    var best = store.get('best2048', 0);
    var dead = false;

    function empty() {
      var out = [];
      for (var r = 0; r < 4; r++) for (var c = 0; c < 4; c++) if (!g[r][c]) out.push([r, c]);
      return out;
    }
    function add() {
      var e = empty();
      if (!e.length) return;
      var p = e[Math.floor(Math.random() * e.length)];
      g[p[0]][p[1]] = Math.random() < 0.9 ? 2 : 4;
    }
    function line(row) {
      var arr = row.filter(function (v) { return v; });
      var out = [], gained = 0;
      for (var i = 0; i < arr.length; i++) {
        if (arr[i] === arr[i + 1]) { out.push(arr[i] * 2); gained += arr[i] * 2; i++; }
        else out.push(arr[i]);
      }
      while (out.length < 4) out.push(0);
      return { row: out, gained: gained };
    }
    function move(dir) {
      if (dead) return;
      var moved = false, gained = 0, r, c;
      for (var i = 0; i < 4; i++) {
        var lineVals;
        if (dir === 'left' || dir === 'right') lineVals = [g[i][0], g[i][1], g[i][2], g[i][3]];
        else lineVals = [g[0][i], g[1][i], g[2][i], g[3][i]];
        if (dir === 'right' || dir === 'down') lineVals.reverse();
        var res = line(lineVals);
        gained += res.gained;
        if (dir === 'right' || dir === 'down') res.row.reverse();
        if (dir === 'left' || dir === 'right') {
          for (c = 0; c < 4; c++) if (g[i][c] !== res.row[c]) { moved = true; g[i][c] = res.row[c]; }
        } else {
          for (r = 0; r < 4; r++) if (g[r][i] !== res.row[r]) { moved = true; g[r][i] = res.row[r]; }
        }
      }
      if (!moved) return;
      score += gained;
      if (score > best) { best = score; store.set('best2048', best); }
      add();
      draw();
    }
    function draw() {
      var html = '';
      for (var r = 0; r < 4; r++) for (var c = 0; c < 4; c++) {
        var v = g[r][c];
        html += '<div class="g2048__cell' + (v ? ' v' + v : '') + '">' + (v || '') + '</div>';
      }
      pane.querySelector('.g2048__grid').innerHTML = html;
      pane.querySelector('#s2048').textContent = score;
      pane.querySelector('#b2048').textContent = best;
      if (!empty().length && !canMerge()) { dead = true; UI.toast('这局结束啦，再来一次？'); }
    }
    function canMerge() {
      for (var r = 0; r < 4; r++) for (var c = 0; c < 4; c++) {
        if (c < 3 && g[r][c] === g[r][c + 1]) return true;
        if (r < 3 && g[r][c] === g[r + 1][c]) return true;
      }
      return false;
    }

    pane.innerHTML = '<div class="game-head"><button class="btn-ghost" id="gBack">← 游戏</button><h3>2048</h3></div>' +
      '<div class="g2048"><div class="scorebar" style="justify-content:space-between;margin-bottom:10px">' +
      '<span>分数 <b id="s2048">0</b></span><span>最高 <b id="b2048">' + best + '</b></span></div>' +
      '<div class="g2048__grid"></div>' +
      '<div class="g2048__actions"><button class="btn-soft" id="gReset">重新开始</button></div>' +
      '<div class="notice">方向键 / WASD / 手指滑动</div></div>';

    add(); add(); draw();

    function onKey(e) {
      if (!document.body.contains(pane)) return;
      var k = e.key.toLowerCase();
      var map = { arrowleft: 'left', arrowright: 'right', arrowup: 'up', arrowdown: 'down', a: 'left', d: 'right', w: 'up', s: 'down' };
      if (map[k]) { e.preventDefault(); move(map[k]); }
    }
    document.addEventListener('keydown', onKey);

    var gridEl = pane.querySelector('.g2048__grid');
    var sx = 0, sy = 0;
    gridEl.addEventListener('touchstart', function (e) {
      sx = e.touches[0].clientX; sy = e.touches[0].clientY;
    }, { passive: true });
    gridEl.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return;
      if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 'right' : 'left');
      else move(dy > 0 ? 'down' : 'up');
    });

    pane.querySelector('#gReset').onclick = function () {
      g = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
      score = 0; dead = false; add(); add(); draw();
    };
    pane.querySelector('#gBack').onclick = function () { cleanupGame(); back(); };

    cleanup = function () { document.removeEventListener('keydown', onKey); };
  }

  /* ============ 贪吃蛇 ============ */
  function gameSnake(pane, back) {
    var N = 15, cell = 20;
    var snake = [{ x: 7, y: 7 }], dir = { x: 1, y: 0 }, food = { x: 11, y: 7 };
    var score = 0, alive = true, timer = null;

    pane.innerHTML = '<div class="game-head"><button class="btn-ghost" id="gBack">← 游戏</button><h3>贪吃蛇</h3></div>' +
      '<div class="snake-wrap"><div class="scorebar">分数 <b id="sSnake">0</b></div>' +
      '<div style="position:relative"><canvas class="snake" width="300" height="300"></canvas></div>' +
      '<div class="dpad"><button class="dpad__up" data-dir="up">↑</button><button class="dpad__left" data-dir="left">←</button>' +
      '<button class="dpad__down" data-dir="down">↓</button><button class="dpad__right" data-dir="right">→</button></div></div>';

    var canvas = pane.querySelector('canvas');
    var ctx = canvas.getContext('2d');
    var size = 300;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = size * dpr; canvas.height = size * dpr;
    canvas.style.width = size + 'px'; canvas.style.height = size + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cell = size / N;

    function placeFood() {
      do {
        food = { x: Math.floor(Math.random() * N), y: Math.floor(Math.random() * N) };
      } while (snake.some(function (s) { return s.x === food.x && s.y === food.y; }));
    }

    function draw() {
      ctx.clearRect(0, 0, size, size);
      ctx.fillStyle = 'rgba(255,255,255,.03)';
      for (var x = 0; x < N; x++) for (var y = 0; y < N; y++) {
        if ((x + y) % 2 === 0) ctx.fillRect(x * cell, y * cell, cell, cell);
      }
      ctx.fillStyle = '#ffd46e';
      ctx.beginPath();
      ctx.arc(food.x * cell + cell / 2, food.y * cell + cell / 2, cell * 0.32, 0, Math.PI * 2);
      ctx.fill();
      snake.forEach(function (s, i) {
        ctx.fillStyle = i === 0 ? '#ff2d7e' : '#ff7eb6';
        ctx.beginPath();
        var pad = i === 0 ? 1.5 : 2.5;
        ctx.roundRect ? ctx.roundRect(s.x * cell + pad, s.y * cell + pad, cell - pad * 2, cell - pad * 2, 5)
          : ctx.rect(s.x * cell + pad, s.y * cell + pad, cell - pad * 2, cell - pad * 2);
        ctx.fill();
      });
    }

    function step() {
      if (!alive) return;
      var head = { x: (snake[0].x + dir.x + N) % N, y: (snake[0].y + dir.y + N) % N };
      if (snake.some(function (s) { return s.x === head.x && s.y === head.y; })) {
        alive = false;
        clearInterval(timer);
        var over = document.createElement('div');
        over.className = 'snake-over';
        over.textContent = '撞到自己了 · 点这里重来';
        over.onclick = function () { restart(); };
        pane.querySelector('.snake-wrap div[style]').appendChild(over);
        return;
      }
      snake.unshift(head);
      if (head.x === food.x && head.y === food.y) {
        score++;
        pane.querySelector('#sSnake').textContent = score;
        placeFood();
        if (timer) { clearInterval(timer); timer = setInterval(step, Math.max(80, 150 - score * 4)); }
      } else {
        snake.pop();
      }
      draw();
    }

    function restart() {
      snake = [{ x: 7, y: 7 }]; dir = { x: 1, y: 0 }; score = 0; alive = true;
      pane.querySelector('#sSnake').textContent = '0';
      var ov = pane.querySelector('.snake-over');
      if (ov) ov.remove();
      placeFood(); draw();
      if (timer) clearInterval(timer);
      timer = setInterval(step, 150);
    }

    function setDir(d) {
      if (d === 'left' && dir.x !== 1) dir = { x: -1, y: 0 };
      if (d === 'right' && dir.x !== -1) dir = { x: 1, y: 0 };
      if (d === 'up' && dir.y !== 1) dir = { x: 0, y: -1 };
      if (d === 'down' && dir.y !== -1) dir = { x: 0, y: 1 };
    }
    function onKey(e) {
      if (!document.body.contains(pane)) return;
      var k = e.key.toLowerCase();
      if (k === 'arrowleft' || k === 'a') { e.preventDefault(); setDir('left'); }
      if (k === 'arrowright' || k === 'd') { e.preventDefault(); setDir('right'); }
      if (k === 'arrowup' || k === 'w') { e.preventDefault(); setDir('up'); }
      if (k === 'arrowdown' || k === 's') { e.preventDefault(); setDir('down'); }
    }
    document.addEventListener('keydown', onKey);
    pane.querySelector('.dpad').onclick = function (e) {
      var b = e.target.closest('[data-dir]');
      if (b) setDir(b.getAttribute('data-dir'));
    };
    pane.querySelector('#gBack').onclick = function () { cleanupGame(); back(); };

    placeFood(); draw();
    timer = setInterval(step, 150);

    cleanup = function () {
      document.removeEventListener('keydown', onKey);
      if (timer) clearInterval(timer);
    };
  }

  /* ============ 记忆翻牌 ============ */
  function gameMemory(pane, back) {
    var pool = ['🌙', '🍜', '🐱', '🌸', '🎧', '🍓', '⭐', '🍰', '🐳', '🌵', '🧋', '🎈'];
    var picked = pool.slice().sort(function () { return Math.random() - 0.5; }).slice(0, 6);
    var deck = picked.concat(picked).sort(function () { return Math.random() - 0.5; });
    var open = [], locked = false, moves = 0, matched = 0;

    pane.innerHTML = '<div class="game-head"><button class="btn-ghost" id="gBack">← 游戏</button><h3>记忆翻牌</h3></div>' +
      '<div class="snake-wrap"><div class="scorebar"><span>步数 <b id="mMoves">0</b></span><span>配对 <b id="mPairs">0</b>/6</span></div>' +
      '<div class="memory" id="memGrid"></div><button class="btn-soft" id="mReset">重新开始</button></div>';

    function draw() {
      var html = '';
      deck.forEach(function (v, i) {
        html += '<button class="mem-card' + (open.indexOf(i) >= 0 ? ' is-open' : '') + '" data-i="' + i + '"><span>' + v + '</span></button>';
      });
      pane.querySelector('#memGrid').innerHTML = html;
      pane.querySelector('#mMoves').textContent = moves;
      pane.querySelector('#mPairs').textContent = matched;
    }

    pane.querySelector('#memGrid').onclick = function (e) {
      var card = e.target.closest('.mem-card');
      if (!card || locked) return;
      var i = parseInt(card.getAttribute('data-i'), 10);
      if (open.indexOf(i) >= 0 || card.classList.contains('is-off')) return;
      open.push(i);
      draw();
      if (open.length === 2) {
        moves++;
        var a = open[0], b = open[1];
        if (deck[a] === deck[b]) {
          matched++;
          open = [];
          draw();
          pane.querySelectorAll('.mem-card').forEach(function (el) {
            var idx = parseInt(el.getAttribute('data-i'), 10);
            if (idx === a || idx === b) el.classList.add('is-off');
          });
          if (matched === 6) UI.toast('全配对成功，真厉害！');
        } else {
          locked = true;
          setTimeout(function () { open = []; locked = false; draw(); }, 620);
        }
        pane.querySelector('#mMoves').textContent = moves;
        pane.querySelector('#mPairs').textContent = matched;
      }
    };
    pane.querySelector('#mReset').onclick = function () { open = []; locked = false; moves = 0; matched = 0; draw(); };
    pane.querySelector('#gBack').onclick = function () { back(); };
    draw();
    cleanup = function () {};
  }

  function cleanupGame() {
    if (cleanup) { cleanup(); cleanup = null; }
  }

  /* ============ 一起看 ============ */
  function renderWatch(pane) {
    var cs = cats();
    var cur = store.get('watchCat', cs[0]);
    if (cs.indexOf(cur) < 0) cur = cs[0];

    var html = '<div class="bar">';
    cs.forEach(function (c) {
      html += '<button class="chip' + (c === cur ? ' is-on' : '') + '" data-cat="' + esc(c) + '">' + esc(c) + '</button>';
    });
    html += '<div class="bar__right"><button class="btn-soft" id="addLink">＋ 加一个</button></div></div>';

    html += '<div class="links">';
    links().filter(function (l) { return l.cat === cur; }).forEach(function (l, i) {
      var custom = l.url && l.custom;
      html += '<a class="link-row" href="' + esc(l.url) + '" target="_blank" rel="noopener noreferrer">';
      html += '<span class="link-row__icon">' + l.icon + '</span>';
      html += '<span class="link-row__name">' + esc(l.name) + '</span>';
      html += '<span class="link-row__note">' + esc(l.note || '') + '</span>';
      if (l.custom) html += '<span class="link-row__del" data-del="' + esc(l.id) + '">删除</span>';
      html += '</a>';
    });
    html += '</div>';

    html += '<div class="notice">只收正规、免费的官方入口（B站 / 央视网 / 咪咕 / 白噪音站）。<br>' +
      '有失效的、或者你们常看的站，点「＋ 加一个」自己补进来。</div>';

    pane.innerHTML = html;

    pane.querySelector('.bar').onclick = function (e) {
      var c = e.target.closest('[data-cat]');
      if (c) { store.set('watchCat', c.getAttribute('data-cat')); renderWatch(pane); return; }
      if (e.target.closest('#addLink')) renderAddLink(pane);
    };
    pane.querySelectorAll('[data-del]').forEach(function (el) {
      el.addEventListener('click', function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        var id = el.getAttribute('data-del');
        store.set('links', store.get('links', []).filter(function (x) { return x.id !== id; }));
        renderWatch(pane);
      });
    });
  }

  function renderAddLink(pane) {
    var html = '<div class="form">';
    html += '<div class="field"><label>名称</label><input id="lName" placeholder="比如：想一起看的某部番"></div>';
    html += '<div class="field"><label>链接</label><input id="lUrl" placeholder="https://"></div>';
    html += '<div class="field"><label>分类</label><select id="lCat">' + cats().map(function (c) { return '<option>' + c + '</option>'; }).join('') + '</select></div>';
    html += '<div class="bar" style="margin:0"><button class="btn-soft" id="lSave">加进来</button><button class="btn-ghost" id="lBack">返回</button></div></div>';
    pane.innerHTML = html;

    pane.querySelector('#lBack').onclick = function () { renderWatch(pane); };
    pane.querySelector('#lSave').onclick = function () {
      var name = pane.querySelector('#lName').value.trim();
      var url = pane.querySelector('#lUrl').value.trim();
      if (!name || !/^https?:\/\//i.test(url)) { UI.toast('名称和 http(s) 链接都要填'); return; }
      var all = store.get('links', []);
      all.push({ id: 'l' + Date.now().toString(36), cat: pane.querySelector('#lCat').value, icon: '🔗', name: name, url: url, note: '', custom: true });
      store.set('links', all);
      UI.toast('加好了');
      renderWatch(pane);
    };
    pane.querySelector('#lName').focus();
  }

  /* ============ 入口 ============ */
  function renderGames(pane) {
    var html = '<div class="games">';
    html += '<button class="game-card" data-game="2048"><span class="game-card__icon">🔢</span><span class="game-card__title">2048</span><span class="game-card__desc">数字合成，越玩越上头。方向键或滑动。</span></button>';
    html += '<button class="game-card" data-game="snake"><span class="game-card__icon">🐍</span><span class="game-card__title">贪吃蛇</span><span class="game-card__desc">经典回归，吃到了就变长，别咬到自己。</span></button>';
    html += '<button class="game-card" data-game="memory"><span class="game-card__icon">🃏</span><span class="game-card__title">记忆翻牌</span><span class="game-card__desc">六对图案，看谁记得快。</span></button>';
    html += '<button class="game-card" data-game="tetris"><span class="game-card__icon">🧱</span><span class="game-card__title">俄罗斯方块</span><span class="game-card__desc">经典街机，越消越快，停不下来。</span></button>';
    html += '<button class="game-card" data-game="gomoku"><span class="game-card__icon">⚫</span><span class="game-card__title">五子棋</span><span class="game-card__desc">15×15，能人机也能双人。</span></button>';
    html += '<button class="game-card" data-game="aeroplane"><span class="game-card__icon">✈️</span><span class="game-card__title">飞行棋</span><span class="game-card__desc">两个人一台设备抢，掷 6 起飞，踩到对方送他回家。</span></button>';
    html += '</div><div class="notice">小游戏成绩只存在本机，最高分会被记住。</div>';
    pane.innerHTML = html;

    pane.querySelector('.games').onclick = function (e) {
      var c = e.target.closest('[data-game]');
      if (!c) return;
      cleanupGame();
      var key = c.getAttribute('data-game');
      if (window.ChillExtra && window.ChillExtra[key]) {
        cleanup = window.ChillExtra[key](pane, function () { renderGames(pane); }) || null;
        return;
      }
      if (key === '2048') game2048(pane, function () { renderGames(pane); });
      if (key === 'snake') gameSnake(pane, function () { renderGames(pane); });
      if (key === 'memory') gameMemory(pane, function () { renderGames(pane); });
    };
  }

  function render(body) {
    cleanupGame();
    var html = '<div class="tabs">';
    html += '<button class="tabs__btn' + (tab === 'games' ? ' is-on' : '') + '" data-tab="games">🕹️ 小游戏</button>';
    html += '<button class="tabs__btn' + (tab === 'watch' ? ' is-on' : '') + '" data-tab="watch">📺 一起看</button>';
    html += '<button class="tabs__btn' + (tab === 'songs' ? ' is-on' : '') + '" data-tab="songs">🎵 我们的歌</button>';
    html += '</div><div id="chillPane"></div>';
    body.innerHTML = html;
    body.querySelector('.tabs').onclick = function (e) {
      var b = e.target.closest('[data-tab]');
      if (!b) return;
      cleanupGame();
      tab = b.getAttribute('data-tab');
      render(body);
    };
    var pane = body.querySelector('#chillPane');
    if (tab === 'watch') renderWatch(pane);
    else if (tab === 'songs') { cleanup = (window.ChillExtra ? window.ChillExtra.songs(pane) : null); }
    else renderGames(pane);
  }

  LoveUI.register('chill', {
    title: '休闲时刻',
    icon: '🎮',
    render: function (body) {
      if (/chillWatch=1/.test(location.search)) tab = 'watch';
      if (/chillSongs=1/.test(location.search)) tab = 'songs';
      render(body);
      var gm = (location.search.match(/[?&]game=(\w+)/) || [])[1];
      if (gm) {
        var pane = body.querySelector('#chillPane');
        if (gm === '2048') game2048(pane, function () { renderGames(pane); });
        else if (gm === 'snake') gameSnake(pane, function () { renderGames(pane); });
        else if (gm === 'memory') gameMemory(pane, function () { renderGames(pane); });
        else if (window.ChillExtra && window.ChillExtra[gm]) {
          cleanup = window.ChillExtra[gm](pane, function () { renderGames(pane); }) || null;
        }
      }
    }
  });
})();
