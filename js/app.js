/* =====================================================
   欣陈宇宙 · 交互脚本（原生 JS，无依赖）
   1) 开屏按钮 → 弹窗飞散拼成爱心 → 进入宇宙
   2) 星辰背景 / 计时器 / 六大板块滚动出现
   ===================================================== */
(function () {
  'use strict';

  /* ---------- 配置合并 ---------- */
  var DEFAULTS = {
    names: { her: '欣', him: '陈', galaxy: '欣陈宇宙' },
    startDate: '2023-05-20T00:00:00+08:00',
    photos: { cover: '' },
    intro: { buttonText: '进入欣陈宇宙', buttonHint: '', tip: '' },
    heartLines: ['第一次见你，心跳就不听话了'],
    sections: []
  };
  var raw = window.LOVE_CONFIG || {};
  var CFG = {
    names: Object.assign({}, DEFAULTS.names, raw.names || {}),
    startDate: raw.startDate || DEFAULTS.startDate,
    photos: Object.assign({}, DEFAULTS.photos, raw.photos || {}),
    intro: Object.assign({}, DEFAULTS.intro, raw.intro || {}),
    heartLines: (raw.heartLines && raw.heartLines.length) ? raw.heartLines : DEFAULTS.heartLines,
    sections: (raw.sections && raw.sections.length) ? raw.sections : DEFAULTS.sections
  };

  var $ = function (id) { return document.getElementById(id); };
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 全局状态 ---------- */
  var state = 'idle';           // idle -> playing -> heart -> universe
  var startTime = 0;
  var timerHandle = null;
  var starfield = null;

  /* =====================================================
     基础信息
     ===================================================== */
  function pad(n, len) {
    var s = String(n);
    while (s.length < len) s = '0' + s;
    return s;
  }
  function parseStart(str) {
    var d = new Date(str);
    if (isNaN(d.getTime())) d = new Date(2023, 4, 20, 0, 0, 0);
    return d;
  }
  function formatDate(d) {
    return d.getFullYear() + '.' + pad(d.getMonth() + 1, 2) + '.' + pad(d.getDate(), 2);
  }

  function applyConfig() {
    var start = parseStart(CFG.startDate);
    startTime = start.getTime();
    var dateText = formatDate(start);

    var her = document.querySelectorAll('#nameHer');
    var him = document.querySelectorAll('#nameHim');
    var herText = CFG.names.herTag || CFG.names.her;
    var himText = CFG.names.himTag || CFG.names.him;
    for (var i = 0; i < her.length; i++) her[i].textContent = herText;
    for (var j = 0; j < him.length; j++) him[j].textContent = himText;

    if ($('panelTitle')) $('panelTitle').textContent = '我们的' + CFG.names.galaxy;
    if ($('startDateText')) {
      $('startDateText').textContent = dateText;
      $('startDateText').setAttribute('datetime', CFG.startDate);
    }
    if ($('footDate')) $('footDate').textContent = '从 ' + dateText + ' 开始';

    var btnLabel = document.querySelector('.enter-btn__label');
    if (btnLabel && CFG.intro.buttonText) btnLabel.textContent = CFG.intro.buttonText;
    var btnHint = document.querySelector('.enter-btn__hint');
    if (btnHint && CFG.intro.buttonHint) btnHint.textContent = CFG.intro.buttonHint;
    var tip = document.querySelector('.intro__tip');
    if (tip && CFG.intro.tip) tip.textContent = CFG.intro.tip;

    document.title = '我们的' + CFG.names.galaxy + ' · 只属于我们两个人';
  }

  /* =====================================================
     开屏照片
     ===================================================== */
  function setupPhoto() {
    var img = $('introPhotoImg');
    if (!img) return;
    var portrait = window.innerHeight > window.innerWidth;
    var src = (CFG.photos && CFG.photos.cover) ? CFG.photos.cover : '';
    if (portrait && CFG.photos && CFG.photos.coverTall) src = CFG.photos.coverTall;
    if (!src) { img.removeAttribute('src'); return; }
    img.addEventListener('load', function () {
      img.classList.add('is-loaded');
      document.body.classList.add('has-photo');
    });
    img.addEventListener('error', function () { img.style.display = 'none'; });
    img.src = src;

    /* 缓存命中时 load 事件可能早于监听，兜底检查一次 */
    if (img.complete && img.naturalWidth) {
      img.classList.add('is-loaded');
      document.body.classList.add('has-photo');
    }
  }

  /* =====================================================
     黄昏氛围：飘落的花瓣
     ===================================================== */
  function setupPetals() {
    var wrap = document.getElementById('petals');
    if (!wrap) return;
    var frag = document.createDocumentFragment();
    for (var i = 0; i < 20; i++) {
      var p = document.createElement('i');
      p.style.left = (Math.random() * 100).toFixed(1) + '%';
      p.style.setProperty('--dur', (Math.random() * 10 + 12).toFixed(1) + 's');
      p.style.setProperty('--delay', (-Math.random() * 18).toFixed(1) + 's');
      p.style.setProperty('--drift', (Math.random() * 160 - 60).toFixed(0) + 'px');
      p.style.width = (6 + Math.random() * 6).toFixed(0) + 'px';
      p.style.height = (9 + Math.random() * 7).toFixed(0) + 'px';
      p.style.opacity = (0.35 + Math.random() * 0.5).toFixed(2);
      frag.appendChild(p);
    }
    wrap.appendChild(frag);
  }

  /* =====================================================
     开屏飘浮小爱心
     ===================================================== */
  function setupFloatingHearts() {
    var wrap = $('introHearts');
    if (!wrap) return;
    var frag = document.createDocumentFragment();
    for (var i = 0; i < 14; i++) {
      var s = document.createElement('span');
      s.textContent = '♥';
      s.style.left = (Math.random() * 96 + 2).toFixed(2) + '%';
      s.style.bottom = (-10 - Math.random() * 70).toFixed(0) + 'vh';
      s.style.setProperty('--sz', (Math.random() * 14 + 8).toFixed(0) + 'px');
      s.style.setProperty('--dur', (Math.random() * 9 + 11).toFixed(1) + 's');
      s.style.setProperty('--delay', (-Math.random() * 18).toFixed(1) + 's');
      s.style.setProperty('--drift', (Math.random() * 120 - 60).toFixed(0) + 'px');
      s.style.setProperty('--rot', (Math.random() * 80 - 40).toFixed(0) + 'deg');
      frag.appendChild(s);
    }
    wrap.appendChild(frag);
  }

  /* =====================================================
     爱心弹窗
     ===================================================== */
  var PALETTE = [
    ['#ffe1ee', '#7a1240'], ['#ffd166', '#5a2b00'], ['#c7f9ff', '#0a3b45'],
    ['#e6d6ff', '#38196f'], ['#ffb3c6', '#6b0e2c'], ['#c9ffdd', '#0d4a2a'],
    ['#fff2c9', '#5c3d00'], ['#bfe1ff', '#0a2f52'], ['#ffc9e2', '#61103a'],
    ['#d9f7ff', '#134b56']
  ];

  var cards = [];
  var stage, introScene, introContent, heartHint;

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  /* 悬停某张卡片：把它推到最上层，周围的卡片沿远离方向让开 */
  function focusCard(target) {
    if (!target || state !== 'heart') return;
    for (var i = 0; i < cards.length; i++) {
      var c = cards[i];
      if (c === target) {
        c.el.classList.add('is-focus');
        c.el.style.width = c.w + 'px';
        c.el.style.maxHeight = '290px';
        continue;
      }
      var dx = c.dx - target.dx;
      var dy = c.dy - target.dy;
      var d = Math.sqrt(dx * dx + dy * dy) || 1;
      var need = (target.w * 0.92 + 12) - d;
      if (need > 0) {
        var k = Math.min(need, 130) / d;
        c.el.style.setProperty('--sx', (dx * k).toFixed(1) + 'px');
        c.el.style.setProperty('--sy', (dy * k).toFixed(1) + 'px');
      } else {
        c.el.style.setProperty('--sx', '0px');
        c.el.style.setProperty('--sy', '0px');
      }
    }
  }

  function clearFocus() {
    for (var i = 0; i < cards.length; i++) {
      cards[i].el.classList.remove('is-focus');
      cards[i].el.style.width = '';
      cards[i].el.style.maxHeight = '';
      cards[i].el.style.setProperty('--sx', '0px');
      cards[i].el.style.setProperty('--sy', '0px');
    }
  }

  function heartCurve(t) {
    var x = 16 * Math.pow(Math.sin(t), 3);
    var y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    return { x: x, y: y };
  }

  /* 爱心轮廓采样：沿周长均匀取点，遇到"凹口/尖角"这类空间拥挤处自动跳过，
     让每张卡片的位置足够均匀，再由 buildHeart 决定卡片宽度（轻微叠压） */
  function heartPoints(n, w, h) {
    var N = 1800, raw = [], i, t;
    for (i = 0; i <= N; i++) {
      t = (i / N) * Math.PI * 2;
      raw.push(heartCurve(t));
    }
    var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (i = 0; i < raw.length; i++) {
      if (raw[i].x < minX) minX = raw[i].x;
      if (raw[i].x > maxX) maxX = raw[i].x;
      if (raw[i].y < minY) minY = raw[i].y;
      if (raw[i].y > maxY) maxY = raw[i].y;
    }
    var bw = maxX - minX, bh = maxY - minY;
    var scale = Math.min(w / bw, h / bh);
    var pts = [], lens = [0], acc = 0;
    for (i = 0; i < raw.length; i++) {
      pts.push({
        x: (raw[i].x - minX - bw / 2) * scale,
        y: (raw[i].y - minY - bh / 2) * scale
      });
      if (i > 0) {
        acc += Math.sqrt(Math.pow(pts[i].x - pts[i - 1].x, 2) + Math.pow(pts[i].y - pts[i - 1].y, 2));
        lens.push(acc);
      }
    }
    var total = acc;
    var step = total / n;
    var out = [], k, q;

    for (k = 0; k < n * 4 && out.length < n; k++) {
      var target = ((k + 0.5) * step) % total;
      var idx = 0;
      while (idx < lens.length - 1 && lens[idx] < target) idx++;
      var p = pts[idx];
      var ok = true;
      for (q = 0; q < out.length; q++) {
        var dx = p.x - out[q].x, dy = p.y - out[q].y;
        if (dx * dx + dy * dy < (step * 0.82) * (step * 0.82)) { ok = false; break; }
      }
      if (ok) out.push(p);
    }

    var minGap = Infinity;
    for (i = 0; i < out.length; i++) {
      for (q = i + 1; q < out.length; q++) {
        var gx = out[i].x - out[q].x, gy = out[i].y - out[q].y;
        var gap = Math.sqrt(gx * gx + gy * gy);
        if (gap < minGap) minGap = gap;
      }
    }
    return { pts: out, step: step, minGap: minGap, perimeter: total, width: bw * scale, height: bh * scale };
  }

  function buildHeart() {
    stage = $('heartStage');
    if (!stage) return;
    stage.innerHTML = '';
    cards = [];

    var vw = window.innerWidth, vh = window.innerHeight;
    var isSmall = vw < 720;

    /* 每次进入都重新洗牌：同一颗爱心，每次说的话都不一样 */
    var pool = shuffle(CFG.heartLines.slice());
    var maxN = isSmall ? Math.min(pool.length, 16) : Math.min(pool.length, 26);
    var heartW = Math.min(vw * (isSmall ? 0.8 : 0.7), 980);
    var heartH = Math.min(vh * (isSmall ? 0.62 : 0.68), 620);

    /* 卡片故意做大一点，像弹幕一样互相压着；悬停时会自动让位 */
    var geo = heartPoints(maxN, heartW, heartH);
    var n = geo.pts.length;
    var lines = pool.slice(0, n);
    var pts = geo.pts;
    var pw = Math.round(Math.min(isSmall ? 96 : 108, Math.max(68, geo.step * (isSmall ? 1.05 : 1.12))));
    /* 卡片不能超出屏幕左右边缘 */
    pw = Math.max(66, Math.min(pw, Math.round(vw - geo.width - 14)));
    var pf = pw >= 104 ? 11.5 : (pw >= 90 ? 10.5 : 9.5);
    /* 展开后的宽度：要真的放得下一句话 */
    var openW = Math.round(Math.max(158, Math.min(232, geo.step * 2.5)));

    for (var i = 0; i < n; i++) {
      var el = document.createElement('div');
      el.className = 'pop';
      var c = PALETTE[(i * 3 + Math.floor(i / PALETTE.length)) % PALETTE.length];
      el.style.setProperty('--bg', c[0]);
      el.style.setProperty('--fg', c[1]);
      el.style.setProperty('--pw', pw + 'px');
      el.style.setProperty('--pf', pf + 'px');
      el.style.setProperty('--rot', (Math.random() * 12 - 6).toFixed(1) + 'deg');
      el.style.zIndex = String(10 + i);

      var bar = document.createElement('span');
      bar.className = 'pop__bar';
      bar.innerHTML = '<i></i><i></i><i></i>';
      var txt = document.createElement('p');
      txt.className = 'pop__text';
      txt.textContent = lines[i];
      el.appendChild(bar);
      el.appendChild(txt);
      stage.appendChild(el);

      var card = { el: el, dx: pts[i].x, dy: pts[i].y, w: openW, pw: pw };
      el.__card = card;
      cards.push(card);

      /* 鼠标移到哪张，哪张就完全露出来，其他卡片让位 */
      el.addEventListener('mouseenter', function (ev) { focusCard(this.__card); });
      el.addEventListener('mouseleave', function () { clearFocus(); });
      el.addEventListener('click', function (ev) {
        ev.stopPropagation();
        if (window.matchMedia && window.matchMedia('(hover: none)').matches) {
          if (el.classList.contains('is-focus')) clearFocus();
          else focusCard(card);
        }
      });
    }
    stage.setAttribute('aria-label', n + '个装着心里话的小弹窗，拼成一颗爱心');
  }

  function playHeart() {
    if (state !== 'idle') return;
    state = 'playing';

    var btn = $('enterBtn');
    introContent = $('introContent');
    heartHint = $('heartHint');
    if (btn) btn.classList.add('is-pressed');
    if (introContent) introContent.classList.add('is-out');
    setTimeout(function () { if (introContent) introContent.style.display = 'none'; }, 480);

    var gap = reduceMotion ? 20 : 95;
    for (var i = 0; i < cards.length; i++) {
      (function (card, idx) {
        setTimeout(function () {
          card.el.style.setProperty('--dx', card.dx.toFixed(1) + 'px');
          card.el.style.setProperty('--dy', card.dy.toFixed(1) + 'px');
          card.el.classList.add('is-in');
        }, idx * gap + Math.random() * 70);
      })(cards[i], i);
    }

    var total = cards.length * gap + (reduceMotion ? 300 : 900);
    setTimeout(finishHeart, total);
  }

  function finishHeart() {
    if (state === 'heart') return;
    state = 'heart';
    if (heartHint) heartHint.classList.add('is-show');
    if (stage) stage.classList.add('is-live');
  }

  function goUniverse() {
    if (state === 'universe') return;
    state = 'universe';

    introScene = $('sceneIntro');
    var universe = $('sceneUniverse');
    document.body.classList.remove('is-locked');
    window.scrollTo(0, 0);

    if (introScene) {
      introScene.classList.add('is-gone');
      introScene.setAttribute('aria-hidden', 'true');
      setTimeout(function () { introScene.style.display = 'none'; }, 1100);
    }
    if (universe) {
      universe.setAttribute('aria-hidden', 'false');
      universe.classList.add('is-ready');
    }
    startTimer();
    startStars();
    if (window.LoveMusic) LoveMusic.enter();
    if (history.replaceState) history.replaceState(null, '', location.pathname + location.search);
  }

  /* =====================================================
     计时器
     ===================================================== */
  function tick() {
    var diff = Date.now() - startTime;
    if (diff < 0) diff = 0;
    var total = Math.floor(diff / 1000);
    var d = Math.floor(total / 86400);
    var h = Math.floor((total % 86400) / 3600);
    var m = Math.floor((total % 3600) / 60);
    var s = total % 60;

    if ($('tDays')) $('tDays').textContent = String(d);
    if ($('tHours')) $('tHours').textContent = pad(h, 2);
    if ($('tMins')) $('tMins').textContent = pad(m, 2);
    if ($('tSecs')) $('tSecs').textContent = pad(s, 2);
    if ($('footTimer')) $('footTimer').textContent = d + '天' + pad(h, 2) + '时' + pad(m, 2) + '分' + pad(s, 2) + '秒';
    if ($('timer')) $('timer').setAttribute('aria-label', '我们在一起已经 ' + d + ' 天 ' + h + ' 小时 ' + m + ' 分 ' + s + ' 秒');
  }

  function startTimer() {
    tick();
    if (timerHandle) clearInterval(timerHandle);
    timerHandle = setInterval(tick, 1000);
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) tick();
    });
  }

  /* =====================================================
     「我们」六大板块
     ===================================================== */
  function buildSections() {
    var grid = $('usGrid');
    if (!grid || !CFG.sections.length) return;
    var frag = document.createDocumentFragment();

    CFG.sections.forEach(function (item, i) {
      var card = document.createElement('button');
      card.type = 'button';
      card.className = 'us__card';
      card.style.setProperty('--delay', (i % 3) * 0.09 + 's');
      card.setAttribute('data-key', item.key || String(i));
      card.setAttribute('data-icon', item.icon || '✧');
      card.setAttribute('data-title', item.title || '');
      card.setAttribute('data-desc', item.desc || '');

      var top = document.createElement('div');
      top.className = 'us__card-top';
      var icon = document.createElement('span');
      icon.className = 'us__icon';
      icon.textContent = item.icon || '✧';
      var idx = document.createElement('span');
      idx.className = 'us__index';
      idx.textContent = pad(i + 1, 2) + ' / ' + pad(CFG.sections.length, 2);
      top.appendChild(icon);
      top.appendChild(idx);

      var title = document.createElement('h3');
      title.className = 'us__card-title';
      title.textContent = item.title || '';

      var desc = document.createElement('p');
      desc.className = 'us__card-desc';
      desc.textContent = item.desc || '';

      var tag = document.createElement('span');
      tag.className = 'us__card-tag';
      tag.innerHTML = '<i></i>';
      tag.appendChild(document.createTextNode(item.tag || 'LOVE'));

      card.appendChild(top);
      card.appendChild(title);
      card.appendChild(desc);
      card.appendChild(tag);
      frag.appendChild(card);
    });
    grid.appendChild(frag);
  }

  function observeSections() {
    var items = document.querySelectorAll('.us__card');
    if (!items.length) return;

    /* 兜底：无论观察器是否触发，1.4 秒后把还没出现的卡片都放出来 */
    setTimeout(function () {
      var all = document.querySelectorAll('.us__card');
      for (var k = 0; k < all.length; k++) {
        if (!all[k].classList.contains('is-in')) all[k].classList.add('is-in');
      }
    }, 1400);

    if (reduceMotion || !('IntersectionObserver' in window)) {
      for (var i = 0; i < items.length; i++) items[i].classList.add('is-in');
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

    for (var j = 0; j < items.length; j++) io.observe(items[j]);
  }

  /* =====================================================
     板块弹层
     ===================================================== */
  function setupModal() {
    var modal = $('modal');
    if (!modal) return;

    function open(card) {
      var icon = card.getAttribute('data-icon') || '✧';
      var title = card.getAttribute('data-title') || '';
      var desc = card.getAttribute('data-desc') || '';
      $('modalIcon').textContent = icon;
      $('modalTitle').textContent = title;
      $('modalText').textContent = desc + '。这一块还在搭建中，接下来会把我们的照片、地点和小故事一点点搬进来。';
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
    }
    function close() {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
    }

    document.addEventListener('click', function (e) {
      var card = e.target.closest ? e.target.closest('.us__card') : null;
      if (card) {
        var key = card.getAttribute('data-key');
        if (window.LoveUI && LoveUI.open(key)) return;
        open(card);
        return;
      }
      if (e.target.closest && e.target.closest('[data-close]')) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
  }

  /* =====================================================
     星辰背景
     ===================================================== */
  function startStars() {
    if (starfield) return;
    var canvas = $('starfield');
    if (!canvas || !canvas.getContext) return;
    starfield = createStarfield(canvas);
    starfield.start();
  }

  function createStarfield(canvas) {
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, stars = [], shooters = [], raf = null, running = false;
    var mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    var t0 = 0;

    function resize() {
      W = canvas.clientWidth || window.innerWidth;
      H = canvas.clientHeight || window.innerHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      makeStars();
    }

    function makeStars() {
      var count = Math.max(90, Math.min(420, Math.round((W * H) / 6800)));
      stars = [];
      for (var i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: Math.random() * 1.3 + 0.35,
          a: Math.random() * 0.55 + 0.25,
          sp: Math.random() * 0.8 + 0.25,
          ph: Math.random() * Math.PI * 2,
          tint: Math.random()
        });
      }
    }

    function spawnShooter() {
      shooters.push({
        x: Math.random() * W * 0.7 + W * 0.3,
        y: Math.random() * H * 0.35,
        vx: -(Math.random() * 3.4 + 3.6),
        vy: Math.random() * 1.9 + 1.6,
        life: 1
      });
    }

    function colorOf(tint) {
      if (tint > 0.86) return '255,179,217';
      if (tint > 0.72) return '201,182,255';
      if (tint > 0.62) return '160,235,255';
      return '255,255,255';
    }

    function draw(now) {
      if (!t0) t0 = now;
      var t = (now - t0) / 1000;
      mouse.tx += (mouse.x - mouse.tx) * 0.05;
      mouse.ty += (mouse.y - mouse.ty) * 0.05;

      ctx.clearRect(0, 0, W, H);

      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        var tw = 0.55 + 0.45 * Math.sin(t * s.sp + s.ph);
        var px = s.x + mouse.tx * (s.r * 7);
        var py = s.y + mouse.ty * (s.r * 7);
        var col = colorOf(s.tint);
        if (s.r > 1.15) {
          ctx.beginPath();
          ctx.arc(px, py, s.r * 3.4, 0, 6.2832);
          ctx.fillStyle = 'rgba(' + col + ',' + (s.a * tw * 0.09).toFixed(3) + ')';
          ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(px, py, s.r, 0, 6.2832);
        ctx.fillStyle = 'rgba(' + col + ',' + (s.a * tw).toFixed(3) + ')';
        ctx.fill();
      }

      if (Math.random() < 0.0035) spawnShooter();
      for (var k = shooters.length - 1; k >= 0; k--) {
        var sh = shooters[k];
        sh.x += sh.vx; sh.y += sh.vy; sh.life -= 0.012;
        if (sh.life <= 0 || sh.x < -80 || sh.y > H + 80) { shooters.splice(k, 1); continue; }
        var g = ctx.createLinearGradient(sh.x, sh.y, sh.x - sh.vx * 22, sh.y - sh.vy * 22);
        g.addColorStop(0, 'rgba(255,255,255,' + (0.9 * sh.life).toFixed(3) + ')');
        g.addColorStop(1, 'rgba(255,179,217,0)');
        ctx.strokeStyle = g;
        ctx.lineWidth = 1.6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(sh.x, sh.y);
        ctx.lineTo(sh.x - sh.vx * 22, sh.y - sh.vy * 22);
        ctx.stroke();
      }

      raf = requestAnimationFrame(draw);
    }

    function start() {
      if (running) return;
      running = true;
      resize();
      window.addEventListener('resize', resize);
      window.addEventListener('mousemove', function (e) {
        mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
        mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
      });
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
          running = false;
          if (raf) cancelAnimationFrame(raf);
        } else if (!running) {
          running = true;
          raf = requestAnimationFrame(draw);
        }
      });
      if (reduceMotion) { draw(performance.now()); running = false; return; }
      raf = requestAnimationFrame(draw);
    }

    return { start: start };
  }

  /* =====================================================
     窗口尺寸变化：重新排布爱心（避免手机横竖屏后错位）
     ===================================================== */
  var resizeTimer = null;
  function onResize() {
    if (state === 'playing' || state === 'universe') return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      var keep = state;
      buildHeart();
      if (keep === 'heart') {
        for (var i = 0; i < cards.length; i++) {
          var c = cards[i];
          c.el.style.setProperty('--dx', c.dx.toFixed(1) + 'px');
          c.el.style.setProperty('--dy', c.dy.toFixed(1) + 'px');
          c.el.classList.add('is-in');
        }
        state = 'playing';
        finishHeart();
      } else {
        state = 'idle';
      }
    }, 260);
  }

  /* =====================================================
     设置：换背景（存在本机，两个人都能改）
     ===================================================== */
  function setupSettings() {
    var btn = $('settingsBtn'), panel = $('settingsPanel');
    var input = $('bgInput'), reset = $('bgReset');
    var photo = document.querySelector('.uni__photo');
    if (!btn || !panel) return;

    var store = window.LoveStore;
    var saved = store ? store.get('bg', '') : '';
    if (saved && photo) {
      photo.style.backgroundImage = 'url("' + saved + '")';
      photo.classList.add('bg-custom');
    }

    btn.addEventListener('click', function () {
      var isHidden = panel.hasAttribute('hidden');
      if (isHidden) panel.removeAttribute('hidden');
      else panel.setAttribute('hidden', '');
      btn.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
    });

    if (input) {
      input.addEventListener('change', function () {
        var file = input.files && input.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function () {
          var img = new Image();
          img.onload = function () {
            var max = 1600;
            var k = Math.min(1, max / Math.max(img.width, img.height));
            var cv = document.createElement('canvas');
            cv.width = Math.round(img.width * k);
            cv.height = Math.round(img.height * k);
            cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
            var data = cv.toDataURL('image/jpeg', 0.82);
            if (store) store.set('bg', data);
            if (photo) {
              photo.style.backgroundImage = 'url("' + data + '")';
              photo.classList.add('bg-custom');
            }
          };
          img.src = reader.result;
        };
        reader.readAsDataURL(file);
      });
    }

    if (reset) {
      reset.addEventListener('click', function () {
        if (store) store.remove('bg');
        if (photo) photo.style.backgroundImage = '';
      });
    }

    var storageEl = document.getElementById('storageInfo');
    if (storageEl) {
      if (window.LoveStore && window.LoveStore.isCloud && window.LoveStore.isCloud()) {
        var sb = window.LoveStore.client();
        if (sb) {
          sb.from('photos').select('size').then(function (res) {
            if (res.error) return;
            var rows = res.data || [];
            var bytes = 0;
            rows.forEach(function (r) { bytes += Number(r.size) || 0; });
            var mb = (bytes / 1048576).toFixed(1);
            var pct = Math.min(100, Math.round(bytes / (1024 * 1024 * 1024) * 100));
            storageEl.textContent = '照片 ' + rows.length + ' 张 · ' + mb + ' MB / 1 GB（' + pct + '%）';
          });
        }
      } else {
        fetch('/api/storage').then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
          if (!d) return;
          var mb = function (n) { return (n / 1048576).toFixed(1); };
          storageEl.textContent = '照片 ' + d.photos + ' 张 · ' + mb(d.photoBytes) + ' MB ｜ 数据库 ' +
            mb(d.dbBytes) + ' MB ｜ 磁盘剩余 ' + (d.diskFree / 1073741824).toFixed(0) + ' GB';
        }).catch(function () {});
      }
    }

    var syncEl = $('syncStatus');
    function paintSync() {
      if (!syncEl || !store) return;
      var st = store.status();
      syncEl.textContent = st.remote
        ? '已连接 · 两台设备同步中（rev ' + st.rev + '）'
        : '仅本机 · 用 server.py 启动后两台设备可同步';
    }
    paintSync();
    document.addEventListener('love:ready', paintSync);
    document.addEventListener('love:remote', paintSync);

    var changePwd = $('changePwd');
    if (changePwd) {
      changePwd.addEventListener('click', function () {
        var oldP = window.prompt('当前密码：');
        if (oldP === null) return;
        var newP = window.prompt('新密码（至少 6 位）：');
        if (newP === null) return;
        fetch('/api/password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ old: oldP, new: newP })
        }).then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
          .then(function (res) {
            if (window.LoveUI) LoveUI.toast(res.ok ? '密码改好了，下次用新的' : ((res.d && res.d.error) || '改失败了'));
          })
          .catch(function () { if (window.LoveUI) LoveUI.toast('网络断了，没改成'); });
      });
    }

    var logoutBtn = $('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function () {
        try { localStorage.removeItem('love.device'); } catch (e) {}
        fetch('/api/logout', { method: 'POST' }).then(function () { location.href = '/login.html'; })
          .catch(function () { location.href = '/login.html'; });
      });
    }

    var exportBtn = $('dataExport');
    if (exportBtn && store) {
      exportBtn.addEventListener('click', function () {
        var blob = new Blob([store.exportJSON()], { type: 'application/json' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'xinchen-universe-' + new Date().toISOString().slice(0, 10) + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        if (window.LoveUI) LoveUI.toast('备份已导出');
      });
    }

    var importInput = $('dataImport');
    if (importInput && store) {
      importInput.addEventListener('change', function () {
        var f = importInput.files && importInput.files[0];
        if (!f) return;
        var reader = new FileReader();
        reader.onload = function () {
          if (store.importJSON(String(reader.result))) {
            if (window.LoveUI) LoveUI.toast('导入成功，正在刷新');
            setTimeout(function () { location.reload(); }, 700);
          } else {
            if (window.LoveUI) LoveUI.toast('这个文件读不出来');
          }
        };
        reader.readAsText(f);
      });
    }
  }

  /* =====================================================
     启动
     ===================================================== */
  /* 纪念日：当天换主题；临近 10 天挂一条小提示 */
  function anniNextDate(a, now) {
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (a.dates) {
      for (var k = 0; k < 3; k++) {
        var y = today.getFullYear() + k;
        var key = String(y);
        if (!a.dates[key]) continue;
        var p = a.dates[key].split('-');
        var d = new Date(y, parseInt(p[0], 10) - 1, parseInt(p[1], 10));
        if (d >= today) return d;
      }
    }
    if (!a.month) return null;
    var d2 = new Date(today.getFullYear(), a.month - 1, a.day);
    if (d2 < today) d2 = new Date(today.getFullYear() + 1, a.month - 1, a.day);
    return d2;
  }

  function checkFestival() {
    try {
      var list = (window.LoveStore && window.LoveStore.get('anniversaries', [])) || [];
      var now = new Date();
      var today0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      var todayHit = null, near = null;
      list.forEach(function (a) {
        var d = anniNextDate(a, now);
        if (!d) return;
        var days = Math.round((d - today0) / 86400000);
        if (days === 0) todayHit = a;
        if (days > 0 && days <= 10 && (!near || days < near.days)) near = { a: a, days: days, d: d };
      });

      document.body.classList.toggle('is-festival', !!todayHit);

      var badge = document.getElementById('festivalBadge');
      var hit = todayHit || (near ? near.a : null);
      if (!hit) {
        if (badge) badge.remove();
        return;
      }
      if (!badge) {
        badge = document.createElement('div');
        badge.id = 'festivalBadge';
        badge.className = 'festival-badge';
        var inner = document.querySelector('.hero');
        if (inner && inner.parentNode) inner.parentNode.insertBefore(badge, inner);
        else return;
      }
      badge.classList.toggle('is-upcoming', !todayHit);
      badge.textContent = todayHit
        ? ((hit.emoji || '🎉') + ' 今天 · ' + (hit.title || '纪念日'))
        : ((hit.emoji || '🎉') + ' 还有 ' + near.days + ' 天 · ' + (hit.title || '纪念日'));
    } catch (e) {}
  }

  function boot() {
    applyConfig();
    if (window.LoveMusic) LoveMusic.enter();
    checkFestival();
    setTimeout(checkFestival, 1500);   /* 数据同步回来后可能还没有纪念日，等一下再看一眼 */
    introContent = $('introContent');
    heartHint = $('heartHint');
    introScene = $('sceneIntro');
    setupPhoto();
    setupPetals();
    setupFloatingHearts();
    buildHeart();
    buildSections();
    observeSections();
    setupModal();
    setupSettings();

    var btn = $('enterBtn');
    if (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        playHeart();
      });
    }

    var st = $('heartStage');
    if (st) {
      st.addEventListener('click', function () {
        if (state === 'heart') goUniverse();
      });
    }
    document.addEventListener('keydown', function (e) {
      if ((e.key === 'Enter' || e.key === ' ') && state === 'heart') {
        e.preventDefault();
        goUniverse();
      }
    });

    /* URL 参数：?scene=universe / ?scene=heart，方便预览与截图 */
    var params = new URLSearchParams(location.search);
    if (params.get('static') === '1') document.documentElement.classList.add('is-static');

    if (params.get('debug') === '1') {
      setTimeout(function () {
        var sc = $('sceneUniverse'), us = $('us'), inner = document.querySelector('.uni__inner');
        var r = us ? us.getBoundingClientRect() : { top: -1, height: -1 };
        document.title = JSON.stringify({
          iw: window.innerWidth,
          vh: window.innerHeight,
          scrollY: window.scrollY,
          docH: document.documentElement.scrollHeight,
          sceneH: sc ? sc.offsetHeight : -1,
          innerH: inner ? inner.offsetHeight : -1,
          usTop: Math.round(r.top + window.scrollY),
          usH: Math.round(r.height)
        });
      }, 300);
    }

    if (params.get('scene') === 'heart') {
      var ic = $('introContent');
      if (ic) ic.style.display = 'none';
      cards.forEach(function (c) {
        c.el.style.setProperty('--dx', c.dx.toFixed(1) + 'px');
        c.el.style.setProperty('--dy', c.dy.toFixed(1) + 'px');
        c.el.classList.add('is-in');
      });
      finishHeart();
      if (params.get('focus') !== null && cards.length) {
        var fi = Math.min(cards.length - 1, Math.max(0, parseInt(params.get('focus'), 10) || 0));
        setTimeout(function () { focusCard(cards[fi]); }, 120);
      }
    }

    if (params.get('scene') === 'us') document.body.classList.add('is-us-only');

    if (params.get('open') && window.LoveUI) {
      setTimeout(function () { LoveUI.open(params.get('open')); }, 260);
    }

    if (params.get('scene') === 'universe' || params.get('scene') === 'us') {
      var sc = $('sceneIntro');
      if (sc) {
        sc.classList.add('is-gone');
        sc.setAttribute('aria-hidden', 'true');
        sc.style.display = 'none';
      }
      document.body.classList.remove('is-locked');
      var uni = $('sceneUniverse');
      if (uni) { uni.setAttribute('aria-hidden', 'false'); uni.classList.add('is-ready'); state = 'universe'; }
      startTimer();
      startStars();
      if (window.LoveMusic) LoveMusic.enter();
      if (params.get('scroll') === 'us' && $('us')) $('us').scrollIntoView();
    }

    /* 再点一次整个开屏（爱心完成后）也能进入 */
    var intro = $('sceneIntro');
    if (intro) {
      intro.addEventListener('click', function () {
        if (state === 'heart') goUniverse();
      });
    }

    document.addEventListener('love:remote', function () {
      checkFestival();
      if (window.LoveUI) LoveUI.refresh();
    });

    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
