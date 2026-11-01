/* =====================================================
   恋爱日记
   ---------------------------------------------------------
   - 两个人各自的字体与笔迹颜色
   - 天气一键自动填写（Open-Meteo，免费无需 key）
   - 纸张可换（横线 / 网格 / 牛皮 / 便签）
   - 写完可改；删除需要两个人先后确认
   ===================================================== */
(function () {
  'use strict';

  var CFG = window.LOVE_CONFIG || {};
  var store = window.LoveStore;
  var UI = window.LoveUI;
  if (!store || !UI) return;

  var NAMES = CFG.names || { her: '喻佳欣', him: '陈群' };
  var MOODS = ['😊', '🥰', '😌', '🤤', '😴', '😣', '😤', '🤩'];

  var WMO = {
    0: '晴', 1: '多云', 2: '多云', 3: '阴', 45: '有雾', 48: '雾凇',
    51: '毛毛雨', 53: '小雨', 55: '中雨', 56: '冻雨', 57: '冻雨',
    61: '小雨', 63: '中雨', 65: '大雨', 66: '冻雨', 67: '冻雨',
    71: '小雪', 73: '中雪', 75: '大雪', 77: '雪粒',
    80: '阵雨', 81: '阵雨', 82: '暴雨', 85: '阵雪', 86: '阵雪',
    95: '雷阵雨', 96: '雷阵雨', 99: '雷阵雨'
  };

  function iconFor(code) {
    if (code === 0) return '☀️';
    if (code === 1 || code === 2) return '⛅';
    if (code === 3) return '☁️';
    if (code === 45 || code === 48) return '🌫️';
    if (code >= 51 && code <= 67) return '🌧️';
    if (code >= 71 && code <= 77) return '❄️';
    if (code >= 80 && code <= 82) return '🌦️';
    if (code >= 85 && code <= 86) return '🌨️';
    if (code >= 95) return '⛈️';
    return '☀️';
  }

  function p2(n) { return (n < 10 ? '0' : '') + n; }
  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
  }
  function uid() {
    return 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function list() { return store.get('diary', []); }
  function persist(arr) { return store.set('diary', arr); }
  function settings() { return store.get('settings', {}); }
  function paper() { return settings().paper || 'lined'; }

  /* ---------------- 视图 1：日记列表 ---------------- */
  var query = '';

  function renderList(root) {
    var who = store.who();
    var items = list().slice().sort(function (a, b) {
      if (a.date === b.date) return (b.createdAt || 0) - (a.createdAt || 0);
      return a.date < b.date ? 1 : -1;
    });

    if (query) {
      var q = query.toLowerCase();
      items = items.filter(function (e) {
        return ((e.text || '') + ' ' + (e.date || '') + ' ' + (e.weather || '') + ' ' + (e.mood || '')).toLowerCase().indexOf(q) >= 0;
      });
    }

    var html = '';
    html += '<div class="diary__bar">';
    html += '<div class="diary__group"><span>我在写</span>';
    html += '<button class="diary__chip' + (who === 'her' ? ' is-on' : '') + '" data-who="her">' + esc(NAMES.her) + '</button>';
    html += '<button class="diary__chip' + (who === 'him' ? ' is-on' : '') + '" data-who="him">' + esc(NAMES.him) + '</button>';
    html += '</div>';
    html += '<div class="diary__group"><span>纸张</span>';
    [['lined', '横线'], ['grid', '网格'], ['kraft', '牛皮'], ['sticky', '便签']].forEach(function (p) {
      html += '<button class="diary__chip' + (paper() === p[0] ? ' is-on' : '') + '" data-paper="' + p[0] + '">' + p[1] + '</button>';
    });
    html += '</div></div>';

    html += '<div style="display:flex;gap:10px;align-items:center;margin:0 0 12px">';
    html += '<input id="diarySearch" placeholder="搜日记：字、日期、天气…" value="' + esc(query) + '" style="flex:1;padding:9px 13px;border-radius:11px;font-size:13px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);color:#ffeaf4;outline:none">';
    if (query) html += '<button class="diary__chip" data-act="clearSearch">清空</button>';
    html += '</div>';
    html += '<button class="diary__new" data-act="new">＋ 写一篇</button>';

    if (!items.length) {
      html += '<div class="diary__empty">还没有日记。<br>写下第一句，就从今天开始。<br><span style="opacity:.7">写完可以改，删除要两个人同意</span></div>';
    }

    html += '<div class="diary__list">';
    items.forEach(function (e) {
      var isHer = e.author === 'her';
      var canApprove = e.delReq && e.delReq.by !== who;
      html += '<article class="entry paper paper--' + paper() + ' entry--' + (isHer ? 'her' : 'him') + '" data-id="' + esc(e.id) + '">';
      html += '<div class="entry__top">';
      html += '<span class="entry__author">' + esc(isHer ? NAMES.her : NAMES.him) + '</span>';
      html += '<span class="entry__date">' + esc(e.date) + '</span>';
      if (e.weather) html += '<span class="entry__weather">' + esc(e.weather) + '</span>';
      if (e.mood) html += '<span>' + esc(e.mood) + '</span>';
      html += '</div>';
      if (e.photo) html += '<img class="entry__photo" src="' + e.photo + '" alt="">';
      html += '<p class="entry__text ' + (isHer ? 'is-her' : 'is-him') + '">' + esc(e.text) + '</p>';
      html += '<div class="entry__foot"><span>' + (e.updatedAt && e.updatedAt !== e.createdAt ? '改过' : '写下') + '</span>';
      html += '<div class="entry__act">';
      html += '<button class="entry__btn" data-act="edit">修改</button>';
      html += '<button class="entry__btn" data-act="del">删除</button>';
      html += '</div></div>';

      if (e.delReq) {
        if (canApprove) {
          html += '<div class="entry__del">「' + esc(e.delReq.by === 'her' ? NAMES.her : NAMES.him) + '」想删除这篇日记，你同意吗？';
          html += '<div class="row"><button class="entry__btn" data-act="agree">同意删除</button>';
          html += '<button class="entry__btn" data-act="keep">先留着</button></div></div>';
        } else {
          html += '<div class="entry__del">已提交删除申请，等「' + esc(e.delReq.by === 'her' ? NAMES.him : NAMES.her) + '」确认。</div>';
        }
      }
      html += '</article>';
    });
    html += '</div>';

    root.innerHTML = html;
    var si = root.querySelector('#diarySearch');
    if (si) {
      si.oninput = function () {
        query = this.value.trim();
        var pos = this.selectionStart;
        renderList(root);
        var again = root.querySelector('#diarySearch');
        if (again) { again.focus(); try { again.setSelectionRange(pos, pos); } catch (e) {} }
      };
    }

    root.onclick = function (ev) {
      var chip = ev.target.closest('[data-who]');
      if (chip) { store.setWho(chip.getAttribute('data-who')); renderList(root); return; }
      var pchip = ev.target.closest('[data-paper]');
      if (pchip) {
        var s = settings(); s.paper = pchip.getAttribute('data-paper'); store.set('settings', s);
        renderList(root); return;
      }
      var act = ev.target.closest('[data-act]');
      if (!act) return;
      var action = act.getAttribute('data-act');
      if (action === 'new') { renderEditor(root, null); return; }
      if (action === 'clearSearch') { query = ''; renderList(root); return; }
      var article = act.closest('.entry');
      if (!article) return;
      var id = article.getAttribute('data-id');
      var entry = list().filter(function (x) { return x.id === id; })[0];
      if (!entry) return;
      if (action === 'edit') renderEditor(root, entry);
      if (action === 'del') requestDelete(root, entry);
      if (action === 'agree') confirmDelete(root, entry);
      if (action === 'keep') cancelDelete(root, entry);
    };
  }

  /* ---------------- 删除需要两个人同意 ---------------- */
  function requestDelete(root, entry) {
    var who = store.who();
    if (entry.delReq && entry.delReq.by === who) { UI.toast('已经申请过了，等对方确认'); return; }
    entry.delReq = { by: who, at: Date.now() };
    persist(list().map(function (x) { return x.id === entry.id ? entry : x; }));
    UI.toast('已申请删除，等「' + (who === 'her' ? NAMES.him : NAMES.her) + '」确认');
    renderList(root);
  }

  function confirmDelete(root, entry) {
    var who = store.who();
    if (!entry.delReq || entry.delReq.by === who) { UI.toast('要对方先申请才行'); return; }
    persist(list().filter(function (x) { return x.id !== entry.id; }));
    UI.toast('这篇日记已经一起删掉了');
    renderList(root);
  }

  function cancelDelete(root, entry) {
    var who = store.who();
    if (!entry.delReq || entry.delReq.by === who) { UI.toast('这是你自己的申请，要对方来处理'); return; }
    delete entry.delReq;
    persist(list().map(function (x) { return x.id === entry.id ? entry : x; }));
    UI.toast('留着啦，这篇不删了');
    renderList(root);
  }

  /* ---------------- 视图 2：写 / 改 ---------------- */
  function renderEditor(root, entry) {
    var who = store.who();
    var isHer = who === 'her';
    var s = settings();
    var draft = entry ? JSON.parse(JSON.stringify(entry)) : {
      id: uid(), date: todayStr(), author: who, weather: '', mood: '', text: '', photo: ''
    };
    if (!entry) draft.author = who;

    var html = '';
    html += '<div class="composer">';
    html += '<div class="composer__row">';
    html += '<input type="date" id="diaryDate" value="' + esc(draft.date) + '">';
    html += '<input type="text" id="diaryCity" placeholder="城市，如 杭州" value="' + esc(s.city || '') + '" style="width:120px">';
    html += '<button class="composer__btn" id="diaryWeather">☁️ 自动填写天气</button>';
    html += '<span id="diaryWeatherNow" style="font-size:12px;color:rgba(255,234,244,.7)">' + esc(draft.weather || '') + '</span>';
    html += '</div>';
    html += '<div class="composer__moods" id="diaryMoods">';
    MOODS.forEach(function (m) {
      html += '<button class="mood' + (draft.mood === m ? ' is-on' : '') + '" data-mood="' + m + '">' + m + '</button>';
    });
    html += '</div>';
    html += '<div class="paper paper--' + paper() + ' composer__paper">';
    html += '<textarea id="diaryText" placeholder="今天想记下点什么…" style="font-family:' +
      (isHer ? '"STKaiti","KaiTi","楷体",serif' : '"PingFang SC","Microsoft YaHei",sans-serif') + '">' + esc(draft.text) + '</textarea>';
    html += '</div>';
    html += '<div class="composer__photo">';
    html += '<input type="file" id="diaryPhoto" accept="image/*" style="font-size:11px;color:rgba(255,234,244,.6)">';
    html += '<span id="diaryPhotoPreview"></span>';
    html += '</div>';
    html += '<div class="composer__actions">';
    html += '<button class="btn-primary" id="diarySave">' + (entry ? '保存修改' : '保存这篇') + '</button>';
    html += '<button class="btn-ghost" id="diaryBack">返回</button>';
    html += '<span class="composer__hint">作者：' + esc(isHer ? NAMES.her : NAMES.him) + '（换人请回列表切换）</span>';
    html += '</div></div>';

    root.innerHTML = html;

    var dateEl = root.querySelector('#diaryDate');
    var cityEl = root.querySelector('#diaryCity');
    var weatherNow = root.querySelector('#diaryWeatherNow');
    var textEl = root.querySelector('#diaryText');
    var photoInput = root.querySelector('#diaryPhoto');
    var photoPreview = root.querySelector('#diaryPhotoPreview');
    var currentPhoto = draft.photo || '';

    if (currentPhoto) photoPreview.innerHTML = '<img src="' + currentPhoto + '" alt="">';

    root.querySelector('#diaryMoods').onclick = function (ev) {
      var m = ev.target.closest('[data-mood]');
      if (!m) return;
      var val = m.getAttribute('data-mood');
      draft.mood = draft.mood === val ? '' : val;
      root.querySelectorAll('.mood').forEach(function (b) { b.classList.toggle('is-on', b.getAttribute('data-mood') === draft.mood); });
    };

    root.querySelector('#diaryWeather').onclick = function () {
      var btn = this;
      btn.disabled = true;
      btn.textContent = '查询中…';
      fetchWeather(cityEl.value.trim()).then(function (w) {
        draft.weather = w.text;
        weatherNow.textContent = w.text;
        UI.toast('天气已填好');
      }).catch(function (err) {
        UI.toast(err && err.message ? err.message : '天气查询失败，可以手填');
      }).then(function () {
        btn.disabled = false;
        btn.textContent = '☁️ 自动填写天气';
      });
    };

    photoInput.onchange = function () {
      var f = photoInput.files && photoInput.files[0];
      if (!f) return;
      compressImage(f, 1280, 0.75)
        .then(function (data) { return UI.savePhoto ? UI.savePhoto(data) : data; })
        .then(function (url) {
          currentPhoto = url;
          photoPreview.innerHTML = '<img src="' + url + '" alt="">';
        })
        .catch(function () { UI.toast('这张图读不出来'); });
    };

    root.querySelector('#diaryBack').onclick = function () { renderList(root); };

    root.querySelector('#diarySave').onclick = function () {
      var text = textEl.value.trim();
      if (!text) { UI.toast('还没有写字呢'); textEl.focus(); return; }
      draft.text = text;
      draft.date = dateEl.value || todayStr();
      if (!entry) draft.createdAt = Date.now();
      draft.updatedAt = Date.now();
      draft.photo = currentPhoto;
      if (cityEl.value.trim()) { var st = settings(); st.city = cityEl.value.trim(); store.set('settings', st); }

      var all = list();
      var idx = -1;
      for (var i = 0; i < all.length; i++) if (all[i].id === draft.id) idx = i;
      if (idx >= 0) all[idx] = draft; else all.push(draft);

      if (!persist(all)) {
        UI.toast('浏览器存不下了，删掉几张旧照片再试');
        return;
      }
      UI.toast(entry ? '改好啦' : '写好啦，收进日记里了');
      renderList(root);
    };

    textEl.focus();
  }

  /* ---------------- 天气 ---------------- */
  function fetchWeather(city) {
    var s = settings();
    var gotPos;
    if (s.lat != null && s.lon != null && (!city || city === s.city)) {
      gotPos = Promise.resolve({ lat: s.lat, lon: s.lon });
    } else if (city) {
      gotPos = fetch('https://geocoding-api.open-meteo.com/v1/search?name=' +
        encodeURIComponent(city) + '&count=1&language=zh&format=json')
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (!d.results || !d.results.length) throw new Error('没找到这个城市');
          var st = settings();
          st.lat = d.results[0].latitude;
          st.lon = d.results[0].longitude;
          st.city = city;
          store.set('settings', st);
          return { lat: st.lat, lon: st.lon };
        });
    } else {
      return Promise.reject(new Error('先填一个城市'));
    }

    return gotPos.then(function (pos) {
      var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + pos.lat +
        '&longitude=' + pos.lon + '&current=temperature_2m,weather_code&timezone=auto';
      return fetch(url).then(function (r) { return r.json(); });
    }).then(function (d) {
      if (!d.current) throw new Error('天气数据异常');
      var code = d.current.weather_code;
      var t = Math.round(d.current.temperature_2m);
      return { text: iconFor(code) + ' ' + (WMO[code] || '晴') + ' ' + t + '℃' };
    });
  }

  /* ---------------- 图片压缩 ---------------- */
  function compressImage(file, maxSide, quality) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () {
        var img = new Image();
        img.onload = function () {
          var k = Math.min(1, maxSide / Math.max(img.width, img.height));
          var cv = document.createElement('canvas');
          cv.width = Math.round(img.width * k);
          cv.height = Math.round(img.height * k);
          cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
          resolve(cv.toDataURL('image/jpeg', quality));
        };
        img.onerror = reject;
        img.src = reader.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /* 仅供截图自检：?diaryDemo=1 塞两条示例 */
  function seedDemo() {
    if (list().length) return;
    persist([
      { id: uid(), date: '2026-11-01', author: 'her', weather: '☀️ 晴 21℃', mood: '🥰',
        text: '第一次用我们的日记本。今天你戴眼镜的样子有点可爱，讲话也慢慢的。', photo: '',
        createdAt: Date.now() - 1000, updatedAt: Date.now() - 1000 },
      { id: uid(), date: '2026-10-31', author: 'him', weather: '⛅ 多云 18℃', mood: '😌',
        text: '今天下班路过那家烧烤，想起你上次说还想吃，就记下来了。', photo: '',
        createdAt: Date.now() - 90000, updatedAt: Date.now() - 90000 }
    ]);
  }

  LoveUI.register('diary', {
    title: '恋爱日记',
    icon: '📔',
    render: function (body) {
      var q = location.search;
      if (/diaryDemo=1/.test(q)) seedDemo();
      renderList(body);
      if (/diaryEditor=1/.test(q)) {
        setTimeout(function () { renderEditor(body, null); }, 60);
      }
    }
  });
})();
