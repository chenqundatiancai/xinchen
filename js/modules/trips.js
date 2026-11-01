/* =====================================================
   我们的足迹 · 中国地图标点 + 城市相册 + 时间轴
   ===================================================== */
(function () {
  'use strict';

  var store = window.LoveStore;
  var UI = window.LoveUI;
  if (!store || !UI) return;

  var CFG = window.LOVE_CONFIG || {};
  var NAMES = CFG.names || { her: '喻佳欣', him: '陈群' };
  var MAP = window.CHINA_MAP || null;

  var CITIES = [
    ['北京', 116.40, 39.90], ['上海', 121.47, 31.23], ['广州', 113.26, 23.13], ['深圳', 114.06, 22.54],
    ['杭州', 120.15, 30.28], ['南京', 118.80, 32.06], ['苏州', 120.62, 31.30], ['成都', 104.07, 30.57],
    ['重庆', 106.55, 29.57], ['西安', 108.94, 34.34], ['武汉', 114.30, 30.59], ['长沙', 112.94, 28.23],
    ['厦门', 118.09, 24.48], ['青岛', 120.38, 36.07], ['大连', 121.62, 38.91], ['天津', 117.20, 39.13],
    ['沈阳', 123.43, 41.80], ['哈尔滨', 126.53, 45.80], ['昆明', 102.71, 25.04], ['大理', 100.16, 25.61],
    ['丽江', 100.23, 26.86], ['三亚', 109.51, 18.25], ['海口', 110.20, 20.04], ['桂林', 110.29, 25.27],
    ['阳朔', 110.49, 24.78], ['香港', 114.17, 22.32], ['澳门', 113.54, 22.20], ['台北', 121.56, 25.03],
    ['拉萨', 91.11, 29.65], ['乌鲁木齐', 87.62, 43.82], ['兰州', 103.83, 36.06], ['西宁', 101.78, 36.62],
    ['银川', 106.23, 38.49], ['呼和浩特', 111.75, 40.84], ['太原', 112.55, 37.87], ['郑州', 113.63, 34.75],
    ['济南', 117.00, 36.65], ['合肥', 117.28, 31.86], ['福州', 119.30, 26.08], ['南昌', 115.89, 28.68],
    ['贵阳', 106.63, 26.65], ['南宁', 108.37, 22.82], ['石家庄', 114.51, 38.04], ['长春', 125.32, 43.82],
    ['洛阳', 112.45, 34.62], ['敦煌', 94.66, 40.13], ['张家界', 110.48, 29.13], ['黄山', 118.34, 29.71]
  ];

  function trips() { return store.get('trips', []); }
  function persist(a) { return store.set('trips', a); }
  function uid(p) { return p + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function project(lon, lat) {
    return { x: (lon - MAP.minLon) * MAP.scale + MAP.ox, y: (MAP.maxLat - lat) * MAP.scale + MAP.oy };
  }
  function fmtDate(s) { return String(s || '').replace(/-/g, '.'); }

  /* 城市名反查坐标（Open-Meteo 地理编码，免费无需 key） */
  function geocodeCity(name) {
    return fetch('https://geocoding-api.open-meteo.com/v1/search?name=' +
      encodeURIComponent(name) + '&count=1&language=zh&format=json')
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d.results || !d.results.length) return null;
        return { lon: d.results[0].longitude, lat: d.results[0].latitude };
      })
      .catch(function () { return null; });
  }

  var tab = 'map';
  var bodyRef = null;

  /* ---------------- 地图 ---------------- */
  function renderMap(root) {
    var items = trips().slice().sort(function (a, b) { return (a.date || '') < (b.date || '') ? -1 : 1; });
    var html = '<div class="bar">';
    html += '<span style="font-size:12px;color:rgba(255,234,244,.55)">去过 <b style="color:#ffb3d9">' + items.length + '</b> 个地方</span>';
    html += '<div class="bar__right"><button class="btn-soft" data-act="add">＋ 标一个地方</button></div></div>';

    html += '<div class="map-wrap" id="mapWrap">';
    if (!MAP) {
      html += '<div class="map-empty">地图数据没加载出来</div>';
    } else {
      html += '<svg class="map" viewBox="0 30 1000 610" preserveAspectRatio="xMidYMid meet" aria-label="中国地图">';
      html += '<path class="map__land" d="' + MAP.d + '"/>';
      var PROVS = window.CHINA_PROVINCES || [];
      if (PROVS.length) {
        html += '<g class="map__provs">';
        for (var pi = 0; pi < PROVS.length; pi++) {
          html += '<path class="map__prov" d="' + PROVS[pi].d + '"/>';
        }
        html += '</g>';
      }
      html += '<g class="map__pins">';
      var routePts = [];
      items.forEach(function (t) {
        var lon = t.lon, lat = t.lat;
        if (lon == null) {
          for (var i = 0; i < CITIES.length; i++) if (CITIES[i][0] === t.city) { lon = CITIES[i][1]; lat = CITIES[i][2]; break; }
        }
        if (lon == null) return;
        var p = project(lon, lat);
        routePts.push(p);
        html += '<g class="pin" transform="translate(' + p.x.toFixed(1) + ',' + p.y.toFixed(1) + ')" data-id="' + esc(t.id) + '">';
        html += '<circle class="pin__halo" r="10"/>';
        html += '<circle class="pin__dot" r="6"/>';
        html += '<text class="map__label" x="0" y="-14" text-anchor="middle">' + esc(t.city) + '</text>';
        html += '</g>';
      });
      html += '</g>';
      if (routePts.length > 1) {
        var d = 'M' + routePts[0].x.toFixed(1) + ' ' + routePts[0].y.toFixed(1);
        for (var ri = 1; ri < routePts.length; ri++) {
          d += 'L' + routePts[ri].x.toFixed(1) + ' ' + routePts[ri].y.toFixed(1);
        }
        html += '<path class="map__route" d="' + d + '"/>';
      }
      html += '</svg>';
      html += '<div class="map-tip" id="mapTip"></div>';
    }
    html += '</div>';

    if (!items.length) {
      html += '<div class="empty" style="margin-top:14px">还没有标记的地方。<br>点右上角「标一个地方」，把一起去过的城市钉在地图上。</div>';
    }

    root.innerHTML = html;

    var wrap = root.querySelector('#mapWrap');
    var tip = root.querySelector('#mapTip');
    if (wrap && tip) {
      wrap.addEventListener('mouseover', function (ev) {
        var pin = ev.target.closest('.pin');
        if (!pin) return;
        var id = pin.getAttribute('data-id');
        var t = null;
        for (var i = 0; i < items.length; i++) if (items[i].id === id) t = items[i];
        if (!t) return;
        var box = wrap.getBoundingClientRect();
        var pb = pin.getBoundingClientRect();
        tip.innerHTML = (t.cover ? '<img src="' + t.cover + '" alt="">' : '') +
          '<b>' + esc(t.city) + '</b><span>' + esc(t.intro || '去过的地方') + '</span>' +
          (t.date ? '<span style="color:rgba(255,179,217,.8)">' + fmtDate(t.date) + '</span>' : '');
        tip.style.left = (pb.left - box.left + pb.width / 2) + 'px';
        tip.style.top = (pb.top - box.top - 6) + 'px';
        tip.classList.add('is-show');
      });
      wrap.addEventListener('mouseout', function (ev) {
        if (!ev.target.closest('.pin')) return;
        tip.classList.remove('is-show');
      });
    }

    root.onclick = function (ev) {
      var add = ev.target.closest('[data-act="add"]');
      if (add) { renderAdd(root); return; }
      var pin = ev.target.closest('.pin');
      if (pin) {
        var id = pin.getAttribute('data-id');
        var t = null;
        for (var i = 0; i < items.length; i++) if (items[i].id === id) t = items[i];
        if (t) renderAlbum(root, t);
      }
    };
  }

  /* ---------------- 添加一个地方 ---------------- */
  function renderAdd(root) {
    var html = '<div class="form">';
    html += '<div class="field"><label>城市</label><input id="tCity" list="cityList" placeholder="比如：杭州" autocomplete="off">';
    html += '<datalist id="cityList">' + CITIES.map(function (c) { return '<option value="' + c[0] + '">'; }).join('') + '</datalist></div>';
    html += '<div class="field"><label>去过的时间</label><input type="date" id="tDate"></div>';
    html += '<div class="field"><label>一句话</label><textarea id="tIntro" placeholder="那天发生了什么？"></textarea></div>';
    html += '<div class="field"><label>封面照片（可不放）</label><input type="file" id="tCover" accept="image/*"></div>';
    html += '<div class="bar" style="margin:0"><button class="btn-soft" id="tSave">钉在地图上</button>';
    html += '<button class="btn-ghost" id="tBack">返回</button></div></div>';
    root.innerHTML = html;

    root.querySelector('#tDate').value = new Date().toISOString().slice(0, 10);
    var cover = '';

    root.querySelector('#tCover').onchange = function (ev) {
      var f = ev.target.files && ev.target.files[0];
      if (!f) return;
      UI.compressImage(f, 1280, 0.75)
        .then(function (d) { return UI.savePhoto ? UI.savePhoto(d) : d; })
        .then(function (url) { cover = url; UI.toast('封面选好了'); });
    };
    root.querySelector('#tBack').onclick = function () { renderMap(root); };
    root.querySelector('#tSave').onclick = function () {
      var city = root.querySelector('#tCity').value.trim();
      if (!city) { UI.toast('先写个城市'); return; }
      var hit = null;
      for (var i = 0; i < CITIES.length; i++) if (CITIES[i][0] === city) hit = CITIES[i];
      var item = {
        id: uid('t'), city: city, date: root.querySelector('#tDate').value,
        intro: root.querySelector('#tIntro').value.trim(), cover: cover,
        lon: hit ? hit[1] : null, lat: hit ? hit[2] : null, photos: [], createdAt: Date.now()
      };
      var all = trips();
      all.push(item);
      if (!persist(all)) { UI.toast('存不下了'); return; }
      UI.toast('钉好了：' + city);
      renderMap(root);

      /* 不在内置城市表里的，自动查一下坐标，查到就补到地图上 */
      if (!hit) {
        geocodeCity(city).then(function (pos) {
          if (!pos) { UI.toast('没查到「' + city + '」的坐标，先记下了'); return; }
          var all2 = trips();
          for (var k = 0; k < all2.length; k++) {
            if (all2[k].id === item.id) { all2[k].lon = pos.lon; all2[k].lat = pos.lat; }
          }
          persist(all2);
          UI.toast('已经标到地图上了');
          renderMap(root);
        });
      }
    };
    root.querySelector('#tCity').focus();
  }

  /* ---------------- 城市相册 ---------------- */
  function renderAlbum(root, trip) {
    var html = '<div class="album__head">';
    html += '<button class="btn-ghost" data-act="back">← 地图</button>';
    html += '<div class="album__title">' + esc(trip.city) + '</div>';
    html += '<div class="album__date">' + fmtDate(trip.date) + '</div>';
    html += '</div>';
    if (trip.intro) html += '<p class="album__intro">' + esc(trip.intro) + '</p>';

    html += '<div class="bar"><button class="btn-soft" data-act="photo">＋ 加一张明信片</button></div>';
    html += '<div class="album__grid">';
    if (!trip.photos || !trip.photos.length) {
      html += '<div class="empty" style="grid-column:1/-1">还没有照片。<br>加一张，写一句话，就像寄一张明信片给以后的我们。</div>';
    }
    (trip.photos || []).forEach(function (p) {
      html += '<div class="postcard" data-pid="' + esc(p.id) + '">';
      html += p.src ? '<img src="' + p.src + '" alt="">' : '<div class="postcard__none">没有图片</div>';
      html += '<p>' + esc(p.note || '（还没写）') + '</p>';
      html += '<div class="postcard__act"><button class="postcard__btn" data-act="note">写一句</button>';
      html += '<button class="postcard__btn" data-act="rm">删掉</button></div></div>';
    });
    html += '</div>';

    root.innerHTML = html;

    root.onclick = function (ev) {
      if (ev.target.closest('[data-act="back"]')) { renderMap(root); return; }
      if (ev.target.closest('[data-act="photo"]')) { addPhoto(root, trip); return; }
      var card = ev.target.closest('.postcard');
      if (!card) return;
      var pid = card.getAttribute('data-pid');
      if (ev.target.closest('[data-act="note"]')) { editNote(root, trip, pid); return; }
      if (ev.target.closest('[data-act="rm"]')) {
        trip.photos = (trip.photos || []).filter(function (x) { return x.id !== pid; });
        saveTrip(trip);
        renderAlbum(root, trip);
      }
    };
  }

  function saveTrip(trip) {
    var all = trips();
    for (var i = 0; i < all.length; i++) if (all[i].id === trip.id) all[i] = trip;
    persist(all);
  }

  function addPhoto(root, trip) {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = function () {
      var f = input.files && input.files[0];
      if (!f) return;
      UI.compressImage(f, 1280, 0.75)
        .then(function (data) { return UI.savePhoto ? UI.savePhoto(data) : data; })
        .then(function (url) {
          trip.photos = trip.photos || [];
          trip.photos.push({ id: uid('p'), src: url, note: '' });
          saveTrip(trip);
          renderAlbum(root, trip);
          UI.toast('加好了，点「写一句」补上一段小故事');
        })
        .catch(function () { UI.toast('这张图读不出来'); });
    };
    input.click();
  }

  function editNote(root, trip, pid) {
    var photo = null;
    (trip.photos || []).forEach(function (p) { if (p.id === pid) photo = p; });
    if (!photo) return;
    var text = window.prompt('写下这张照片的故事：', photo.note || '');
    if (text === null) return;
    photo.note = text.trim();
    saveTrip(trip);
    renderAlbum(root, trip);
  }

  /* ---------------- 手动事件（电影 / 纪念日 / 其他） ---------------- */
  var EVENT_TYPES = [
    { k: 'movie', n: '看电影', i: '🎬' },
    { k: 'trip', n: '旅行', i: '🧳' },
    { k: 'anni', n: '纪念日', i: '🎂' },
    { k: 'other', n: '其他', i: '✨' }
  ];
  function events() { return store.get('events', []); }
  function saveEvents(a) { return store.set('events', a); }

  function renderEventAdd(root) {
    var html = '<div class="form">';
    html += '<div class="field"><label>发生了什么</label><input id="eTitle" maxlength="30" placeholder="比如：一起看了《你的名字》"></div>';
    html += '<div class="field"><label>哪天</label><input type="date" id="eDate"></div>';
    html += '<div class="field"><label>类型</label><div class="bar" style="margin:0" id="eTypes">';
    EVENT_TYPES.forEach(function (t, i) {
      html += '<button class="chip' + (i === 0 ? ' is-on' : '') + '" data-type="' + t.k + '">' + t.i + ' ' + t.n + '</button>';
    });
    html += '</div></div>';
    html += '<div class="field"><label>想说的话（可不写）</label><textarea id="eNote" placeholder="当时的感受…"></textarea></div>';
    html += '<div class="bar" style="margin:0"><button class="btn-soft" id="eSave">加进时间轴</button>' +
      '<button class="btn-ghost" id="eBack">返回</button></div></div>';
    root.innerHTML = html;

    root.querySelector('#eDate').value = new Date().toISOString().slice(0, 10);
    var type = 'movie';
    root.querySelector('#eTypes').onclick = function (ev) {
      var b = ev.target.closest('[data-type]');
      if (!b) return;
      type = b.getAttribute('data-type');
      root.querySelectorAll('#eTypes .chip').forEach(function (x) {
        x.classList.toggle('is-on', x.getAttribute('data-type') === type);
      });
    };
    root.querySelector('#eBack').onclick = function () { renderTimeline(root); };
    root.querySelector('#eSave').onclick = function () {
      var title = root.querySelector('#eTitle').value.trim();
      if (!title) { UI.toast('先写点什么'); return; }
      var list = events();
      list.push({
        id: uid('e'), type: type, title: title, date: root.querySelector('#eDate').value,
        note: root.querySelector('#eNote').value.trim(), createdAt: Date.now()
      });
      saveEvents(list);
      UI.toast('加进时间轴了');
      renderTimeline(root);
    };
    root.querySelector('#eTitle').focus();
  }

  /* ---------------- 时间轴 ---------------- */
  function renderTimeline(root) {
    var events = [];
    var start = new Date(CFG.startDate || '2026-09-22T00:00:00+08:00');
    events.push({ date: start, icon: '💗', title: '我们在一起了', sub: '「' + (NAMES.galaxy || '欣陈宇宙') + '」从这一天开始' });

    trips().forEach(function (t) {
      if (!t.date) return;
      events.push({ date: new Date(t.date), icon: '📍', title: t.city, sub: t.intro || '去过的地方' });
    });
    store.get('diary', []).forEach(function (d) {
      if (!d.date) return;
      events.push({ date: new Date(d.date), icon: '📔', title: (d.author === 'her' ? NAMES.her : NAMES.him) + '写下了一篇日记', sub: (d.text || '').slice(0, 46) });
    });
    store.get('dreams', []).forEach(function (w) {
      if (!w.done || !w.doneAt) return;
      events.push({ date: new Date(w.doneAt), icon: '🌙', title: '实现了一个愿望：' + w.title, sub: '我们的梦' });
    });
    store.get('foods', []).forEach(function (f) {
      events.push({ date: new Date(f.createdAt), icon: '🍜', title: '吃了 ' + f.name, sub: (f.note || '').slice(0, 40) });
    });
    store.get('events', []).forEach(function (e) {
      if (!e.date) return;
      var t = null;
      for (var i = 0; i < EVENT_TYPES.length; i++) if (EVENT_TYPES[i].k === e.type) t = EVENT_TYPES[i];
      events.push({ date: new Date(e.date), icon: t ? t.i : '✨', title: e.title, sub: e.note || '' });
    });
    store.get('anniversaries', []).forEach(function (a) {
      var now = new Date();
      var d = null;
      if (a.dates && a.dates[now.getFullYear()]) {
        var pt = a.dates[now.getFullYear()].split('-');
        d = new Date(now.getFullYear(), parseInt(pt[0], 10) - 1, parseInt(pt[1], 10));
      } else if (a.month && a.day) {
        d = new Date(now.getFullYear(), a.month - 1, a.day);
      }
      if (!d) return;
      if (d > now) d = new Date(d.getFullYear() - 1, d.getMonth(), d.getDate());
      events.push({ date: d, icon: a.emoji || '🎂', title: a.title + '（去年这天）', sub: '' });
    });

    events.sort(function (a, b) { return a.date - b.date; });

    var html = '<div class="bar"><span style="font-size:12px;color:rgba(255,234,244,.55)">从在一起那天开始，一共 ' + events.length + ' 个瞬间</span>' +
      '<div class="bar__right"><button class="btn-soft" id="addEvent">＋ 记一个瞬间</button></div></div>';
    html += '<div class="tl">';
    events.forEach(function (e) {
      var days = Math.floor((e.date - start) / 86400000);
      var dateStr = e.date.getFullYear() + '.' + ('0' + (e.date.getMonth() + 1)).slice(-2) + '.' + ('0' + e.date.getDate()).slice(-2);
      html += '<div class="tl__item">';
      html += '<div class="tl__date">' + dateStr + (days > 0 ? ' · 在一起第 ' + days + ' 天' : (days === 0 ? ' · 第 1 天' : '')) + '</div>';
      html += '<div class="tl__title">' + e.icon + ' ' + esc(e.title) + '</div>';
      if (e.sub) html += '<div class="tl__sub">' + esc(e.sub) + '</div>';
      html += '</div>';
    });
    html += '</div>';
    root.innerHTML = html;

    var addBtn = root.querySelector('#addEvent');
    if (addBtn) addBtn.onclick = function () { renderEventAdd(root); };
  }

  /* ---------------- 入口 ---------------- */
  function render(body) {
    bodyRef = body;
    var html = '<div class="tabs">';
    html += '<button class="tabs__btn' + (tab === 'map' ? ' is-on' : '') + '" data-tab="map">🗺️ 足迹地图</button>';
    html += '<button class="tabs__btn' + (tab === 'time' ? ' is-on' : '') + '" data-tab="time">⏳ 我们的时间轴</button>';
    html += '</div><div id="tripPane"></div>';
    body.innerHTML = html;
    body.querySelector('.tabs').onclick = function (ev) {
      var b = ev.target.closest('[data-tab]');
      if (!b) return;
      tab = b.getAttribute('data-tab');
      render(body);
    };
    var pane = body.querySelector('#tripPane');
    if (tab === 'map') renderMap(pane); else renderTimeline(pane);
  }

  LoveUI.register('map', {
    title: '我们的足迹',
    icon: '🗺️',
    render: function (body) {
      if (/tripTime=1/.test(location.search)) tab = 'time';
      if (/tripDemo=1/.test(location.search) && !trips().length) {
        persist([
          { id: uid('t'), city: '杭州', date: '2026-10-03', intro: '第一次一起出门，西湖边走了三小时，脚疼但没舍得回去。', cover: 'https://brbohlghtzostsonhexr.supabase.co/storage/v1/object/sign/photos/site-cover.jpg?token=eyJraWQiOiJkYjk0YmUzNi1hMGYwLTRhYWMtOTVmYi0yNTBjYmQ5M2QyNDciLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJwaG90b3Mvc2l0ZS1jb3Zlci5qcGciLCJzY29wZSI6ImRvd25sb2FkIiwiaWF0IjoxNzkzNTM3OTg4LCJleHAiOjE4MjUwNzM5ODh9.g9ucFJVTDjb0Vakq8UIj2jg1z4yRSwYNOBXg88fKv7lQpPfcxGUFwL1ISZ8EkXYRyRfohaSCUDjqlnOqEsbOyA', lon: 120.15, lat: 30.28, photos: [
            { id: uid('p'), src: 'https://brbohlghtzostsonhexr.supabase.co/storage/v1/object/sign/photos/site-cover.jpg?token=eyJraWQiOiJkYjk0YmUzNi1hMGYwLTRhYWMtOTVmYi0yNTBjYmQ5M2QyNDciLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJwaG90b3Mvc2l0ZS1jb3Zlci5qcGciLCJzY29wZSI6ImRvd25sb2FkIiwiaWF0IjoxNzkzNTM3OTg4LCJleHAiOjE4MjUwNzM5ODh9.g9ucFJVTDjb0Vakq8UIj2jg1z4yRSwYNOBXg88fKv7lQpPfcxGUFwL1ISZ8EkXYRyRfohaSCUDjqlnOqEsbOyA', note: '那天风很大，你的头发一直往我脸上飘。' },
            { id: uid('p'), src: 'https://brbohlghtzostsonhexr.supabase.co/storage/v1/object/sign/photos/site-her.jpg?token=eyJraWQiOiJkYjk0YmUzNi1hMGYwLTRhYWMtOTVmYi0yNTBjYmQ5M2QyNDciLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJwaG90b3Mvc2l0ZS1oZXIuanBnIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc5MzUzODAwNCwiZXhwIjoxODI1MDc0MDA0fQ.85xyTAe8qYSOVXy3z5fmZLGfG-xuPY5yxGa4siBxkGQR3kW1jXnhDy8Z2x9HjKhJzMBgQq0RanAjULByzAr0xQ', note: '在湖边拍的，你说这张不许删。' }
          ], createdAt: Date.now() - 5000 },
          { id: uid('t'), city: '成都', date: '2026-10-19', intro: '吃了一整天的辣，她说下次还来。', cover: '', lon: 104.07, lat: 30.57, photos: [], createdAt: Date.now() - 4000 },
          { id: uid('t'), city: '厦门', date: '2026-10-27', intro: '海风很大，她把头靠在我肩上。', cover: '', lon: 118.09, lat: 24.48, photos: [], createdAt: Date.now() - 3000 }
        ]);
      }
            var albumCity = (location.search.match(/tripAlbum=([^&]+)/) || [])[1];
      if (albumCity) {
        var target = trips().filter(function (t) { return t.city === decodeURIComponent(albumCity); })[0];
        if (target) {
          LoveUI.openSheet({ title: '我们的足迹', icon: '🗺️', render: function (b) { renderAlbum(b, target); } });
          return;
        }
      }
      render(body);
    }
  });
})();
