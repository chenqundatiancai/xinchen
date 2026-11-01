/* =====================================================
   我们的梦 · 愿望清单
   ===================================================== */
(function () {
  'use strict';

  var store = window.LoveStore;
  var UI = window.LoveUI;
  if (!store || !UI) return;

  var CATS = [
    { k: 'travel', n: '旅行', i: '✈️' },
    { k: 'food', n: '美食', i: '🍜' },
    { k: 'life', n: '生活', i: '🏠' },
    { k: 'together', n: '一起做', i: '🤝' }
  ];

  var CHEERS = [
    '又实现一个，真棒。',
    '这条愿望里，有我们两个的名字。',
    '做到了！以后翻回来看，会笑的。',
    '愿望清单减一，开心加一。',
    '我们一起把想要的生活过出来了一点点。',
    '这个勾，是两个人的。',
    '记下来吧，这是属于我们的小胜利。'
  ];

  function list() { return store.get('dreams', []); }
  function persist(a) { return store.set('dreams', a); }
  function uid() { return 'w' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function catOf(k) {
    for (var i = 0; i < CATS.length; i++) if (CATS[i].k === k) return CATS[i];
    return CATS[2];
  }
  function fmtDate(ts) {
    var d = new Date(ts);
    return d.getFullYear() + '.' + ('0' + (d.getMonth() + 1)).slice(-2) + '.' + ('0' + d.getDate()).slice(-2);
  }
  var filter = 'all';

  function seedDemo() {
    if (list().length) return;
    persist([
      { id: uid(), title: '一起去看一次海', cat: 'travel', note: '想在天快黑的时候，坐在沙滩上不说话。', done: false, createdAt: Date.now() - 1000 },
      { id: uid(), title: '学会做她爱吃的番茄牛腩', cat: 'food', note: '', done: false, createdAt: Date.now() - 2000 },
      { id: uid(), title: '养一只猫', cat: 'life', note: '名字都想好了。', done: false, createdAt: Date.now() - 3000 },
      { id: uid(), title: '一起看完 100 部电影', cat: 'together', note: '', done: true, doneAt: Date.now() - 86400000 * 6, createdAt: Date.now() - 9000 }
    ]);
  }

  function render(root) {
    if (/dreamDemo=1/.test(location.search)) seedDemo();
    var items = list().slice().sort(function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });
    var doneCount = items.filter(function (x) { return x.done; }).length;
    var todo = items.filter(function (x) { return !x.done; });
    var done = items.filter(function (x) { return x.done; });

    var html = '<div class="bar">';
    html += '<span class="dreams__stat">已实现 <b>' + doneCount + '</b> / ' + items.length + ' 个愿望</span>';
    html += '<div class="bar__right">';
    ['all', 'todo', 'done'].forEach(function (f) {
      var label = f === 'all' ? '全部' : (f === 'todo' ? '想去做的' : '已实现');
      html += '<button class="chip' + (filter === f ? ' is-on' : '') + '" data-filter="' + f + '">' + label + '</button>';
    });
    html += '<button class="btn-soft" data-act="new">＋ 许一个愿</button>';
    html += '</div></div>';

    if (!items.length) {
      html += '<div class="empty">愿望清单还是空的。<br>写下想去的地方、想吃的东西、想一起做的事。<br>实现一个，就勾掉一个 —— 它不会消失，会去「已实现」那边发光。</div>';
      root.innerHTML = html;
      bind(root);
      return;
    }

    if (filter !== 'done' && todo.length) {
      html += '<div class="wish-grid">' + todo.map(cardHTML).join('') + '</div>';
    }
    if (filter !== 'todo' && done.length) {
      html += '<div class="wish__sep">已 实 现 · ' + done.length + '</div>';
      html += '<div class="wish-grid">' + done.map(cardHTML).join('') + '</div>';
    }
    if (filter === 'todo' && !todo.length) html += '<div class="empty">都实现啦，再许几个新的吧。</div>';
    if (filter === 'done' && !done.length) html += '<div class="empty">还没有实现的愿望，慢慢来。</div>';

    root.innerHTML = html;
    bind(root);
  }

  function cardHTML(w) {
    var c = catOf(w.cat);
    var html = '<article class="wish' + (w.done ? ' is-done' : '') + '" data-id="' + esc(w.id) + '">';
    html += '<div class="wish__top"><span class="wish__cat">' + c.i + ' ' + c.n + '</span>';
    if (w.done && w.doneAt) html += '<span class="wish__date">实现于 ' + fmtDate(w.doneAt) + '</span>';
    html += '</div>';
    html += '<h3 class="wish__title">' + esc(w.title) + '</h3>';
    if (w.note) html += '<p class="wish__note">' + esc(w.note) + '</p>';
    html += '<div class="wish__foot">';
    html += '<button class="wish__check' + (w.done ? ' is-on' : '') + '" data-act="toggle">' + (w.done ? '✓ 已实现' : '勾掉 · 实现了') + '</button>';
    html += '<button class="wish__del" data-act="del" aria-label="删除">删除</button>';
    html += '</div></article>';
    return html;
  }

  function bind(root) {
    root.onclick = function (ev) {
      var f = ev.target.closest('[data-filter]');
      if (f) { filter = f.getAttribute('data-filter'); render(root); return; }
      var act = ev.target.closest('[data-act]');
      if (!act) return;
      var a = act.getAttribute('data-act');
      if (a === 'new') { renderEditor(root, null); return; }
      var card = act.closest('.wish');
      if (!card) return;
      var id = card.getAttribute('data-id');
      var all = list();
      var idx = -1;
      for (var i = 0; i < all.length; i++) if (all[i].id === id) idx = i;
      if (idx < 0) return;

      if (a === 'toggle') {
        all[idx].done = !all[idx].done;
        all[idx].doneAt = all[idx].done ? Date.now() : null;
        persist(all);
        if (all[idx].done) UI.toast(CHEERS[Math.floor(Math.random() * CHEERS.length)]);
        render(root);
        return;
      }
      if (a === 'del') {
        all.splice(idx, 1);
        persist(all);
        UI.toast('删掉了这个愿望');
        render(root);
        return;
      }
    };
  }

  function renderEditor(root, wish) {
    var w = wish || { id: uid(), title: '', cat: 'travel', note: '', done: false, createdAt: Date.now() };
    var html = '<div class="form">';
    html += '<div class="field"><label>愿望</label><input id="wTitle" maxlength="40" placeholder="比如：一起去看一次海" value="' + esc(w.title) + '"></div>';
    html += '<div class="field"><label>分类</label><div class="bar" style="margin:0" id="wCats">';
    CATS.forEach(function (c) {
      html += '<button class="chip' + (w.cat === c.k ? ' is-on' : '') + '" data-cat="' + c.k + '">' + c.i + ' ' + c.n + '</button>';
    });
    html += '</div></div>';
    html += '<div class="field"><label>想说的话（可不写）</label><textarea id="wNote" placeholder="为什么想做这件事…">' + esc(w.note || '') + '</textarea></div>';
    html += '<div class="bar" style="margin:0">';
    html += '<button class="btn-soft" id="wSave">' + (wish ? '保存' : '记下来') + '</button>';
    html += '<button class="btn-ghost" id="wBack">返回</button>';
    html += '</div></div>';
    root.innerHTML = html;

    var cat = w.cat;
    root.querySelector('#wCats').onclick = function (ev) {
      var b = ev.target.closest('[data-cat]');
      if (!b) return;
      cat = b.getAttribute('data-cat');
      root.querySelectorAll('#wCats .chip').forEach(function (x) { x.classList.toggle('is-on', x.getAttribute('data-cat') === cat); });
    };
    root.querySelector('#wBack').onclick = function () { render(root); };
    root.querySelector('#wSave').onclick = function () {
      var title = root.querySelector('#wTitle').value.trim();
      if (!title) { UI.toast('先写个愿望吧'); return; }
      w.title = title;
      w.cat = cat;
      w.note = root.querySelector('#wNote').value.trim();
      var all = list();
      var idx = -1;
      for (var i = 0; i < all.length; i++) if (all[i].id === w.id) idx = i;
      if (idx >= 0) all[idx] = w; else all.push(w);
      persist(all);
      UI.toast('记下来了，等着我们去实现');
      render(root);
    };
    root.querySelector('#wTitle').focus();
  }

  LoveUI.register('dream', {
    title: '我们的梦',
    icon: '🌙',
    render: function (body) { render(body); }
  });
})();
