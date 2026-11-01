/* =====================================================
   忘性大的福星 · 提醒 + 天气 + 记账
   ===================================================== */
(function () {
  'use strict';

  var store = window.LoveStore;
  var UI = window.LoveUI;
  if (!store || !UI) return;

  var CFG = window.LOVE_CONFIG || {};
  var NAMES = CFG.names || { her: '喻佳欣', him: '陈群' };
  var TABS = [['todo', '⏰ 要做的事'], ['anni', '🎂 纪念日'], ['money', '💰 今天花了多少']];
  var CATS = ['吃饭', '交通', '购物', '娱乐', '其他'];

  var LINES = [
    '今天也要好好吃饭，别饿着自己。',
    '出门前照一下镜子，你很好看。',
    '累了就靠一会儿，我在。',
    '记得喝水，别一口气忙到晚上。',
    '晚上早点睡，明天还想见你。',
    '冷了就加件衣服，别硬扛。',
    '有雨的话，伞在门口别忘了。',
    '今天不用很厉害，正常发挥就好。'
  ];

  var WMO = {
    0: '晴', 1: '多云', 2: '多云', 3: '阴', 45: '有雾', 48: '雾凇',
    51: '毛毛雨', 53: '小雨', 55: '中雨', 61: '小雨', 63: '中雨', 65: '大雨',
    71: '小雪', 73: '中雪', 75: '大雪', 80: '阵雨', 81: '阵雨', 82: '暴雨',
    85: '阵雪', 86: '阵雪', 95: '雷阵雨', 96: '雷阵雨', 99: '雷阵雨'
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

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function ymd(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function todayLine() {
    var t = new Date();
    var day = Math.floor((t - new Date(t.getFullYear(), 0, 0)) / 86400000);
    return LINES[day % LINES.length];
  }
  function uid() { return 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }

  var tab = 'todo';
  var bodyRef = null;


  /* ---------------- 纪念日 ---------------- */

  /* 默认纪念日：固定日期的节日 + 农历节日（农历日期每年不同，用表驱动，2026-2032 已核对） */
  var QIXI = { 2026: '08-19', 2027: '08-08', 2028: '08-26', 2029: '08-16', 2030: '08-05', 2031: '08-24', 2032: '08-12' };
  var MID = { 2026: '09-25', 2027: '09-15', 2028: '10-03', 2029: '09-22', 2030: '09-12', 2031: '10-01', 2032: '09-19' };
  var SPRING = { 2026: '02-17', 2027: '02-06', 2028: '01-26', 2029: '02-13', 2030: '02-03', 2031: '01-23', 2032: '02-11' };

  function defaultAnnis() {
    var s = new Date((CFG.startDate || '2026-09-22T00:00:00+08:00'));
    return [
      { id: 'a_love', title: '我们在一起', emoji: '💗', month: s.getMonth() + 1, day: s.getDate(), type: 'yearly', love: true, custom: false },
      { id: 'a_her', title: (NAMES.her || '喻佳欣') + '生日', emoji: '🎂', month: 11, day: 3, type: 'yearly', custom: false },
      { id: 'a_his', title: (NAMES.him || '陈群') + '生日', emoji: '🎂', month: 6, day: 8, type: 'yearly', custom: false },
      { id: 'a_valentine', title: '情人节', emoji: '💐', month: 2, day: 14, type: 'yearly', custom: false },
      { id: 'a_qixi', title: '七夕', emoji: '🌌', lunar: '农历七月初七', dates: QIXI, month: 8, day: 19, type: 'yearly', custom: false },
      { id: 'a_520', title: '520', emoji: '💌', month: 5, day: 20, type: 'yearly', custom: false },
      { id: 'a_521', title: '521', emoji: '💞', month: 5, day: 21, type: 'yearly', custom: false },
      { id: 'a_children', title: '儿童节', emoji: '🍭', month: 6, day: 1, type: 'yearly', custom: false },
      { id: 'a_mid', title: '中秋', emoji: '🌕', lunar: '农历八月十五', dates: MID, month: 9, day: 25, type: 'yearly', custom: false },
      { id: 'a_halloween', title: '万圣节', emoji: '🎃', month: 10, day: 31, type: 'yearly', custom: false },
      { id: 'a_eve', title: '平安夜', emoji: '🕯️', month: 12, day: 24, type: 'yearly', custom: false },
      { id: 'a_xmas', title: '圣诞节', emoji: '🎄', month: 12, day: 25, type: 'yearly', custom: false },
      { id: 'a_newyear_eve', title: '跨年夜', emoji: '🎆', month: 12, day: 31, type: 'yearly', custom: false },
      { id: 'a_newyear', title: '元旦', emoji: '🎊', month: 1, day: 1, type: 'yearly', custom: false },
      { id: 'a_spring', title: '春节', emoji: '🧧', lunar: '农历正月初一', dates: SPRING, month: 2, day: 17, type: 'yearly', custom: false }
    ];
  }

  function annis() {
    var list = store.get('anniversaries', null);
    var seed = store.get('anniversariesSeed', 0);
    if (list === null) {
      list = defaultAnnis();
      store.set('anniversaries', list);
      store.set('anniversariesSeed', 2);
      return list;
    }
    /* 老数据升级：把新加的默认节日补进来（按 id 去重，不覆盖用户改过的） */
    if (seed < 3) {
      list.forEach(function (a) {
        if (a.id === 'a_eve' && a.emoji === '🎄' && a.custom === false) a.emoji = '🕯️';
      });
    }
    if (seed < 2) {
      var have = {};
      list.forEach(function (a) { have[a.id] = true; });
      defaultAnnis().forEach(function (a) {
        if (!have[a.id]) list.push(a);
      });
      store.set('anniversaries', list);
      store.set('anniversariesSeed', 2);
    }
    if (seed < 3) store.set('anniversariesSeed', 3);
    return list;
  }
  function saveAnnis(a) { return store.set('anniversaries', a); }

  function nextAnniversary(a, now) {
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (a.dates) {
      for (var k = 0; k < 3; k++) {
        var y = today.getFullYear() + k;
        var key = String(y);
        if (!a.dates[key]) continue;
        var parts = a.dates[key].split('-');
        var d2 = new Date(y, parseInt(parts[0], 10) - 1, parseInt(parts[1], 10));
        if (d2 >= today) return d2;
      }
      /* 超出表的年份：退回固定日期 */
    }
    var d = new Date(today.getFullYear(), a.month - 1, a.day);
    if (d < today) d = new Date(today.getFullYear() + 1, a.month - 1, a.day);
    return d;
  }
  function daysBetween(from, to) {
    var a = new Date(from.getFullYear(), from.getMonth(), from.getDate());
    var b = new Date(to.getFullYear(), to.getMonth(), to.getDate());
    return Math.round((b - a) / 86400000);
  }
  function loveYears(date) {
    var s = new Date(CFG.startDate || '2026-09-22T00:00:00+08:00');
    return date.getFullYear() - s.getFullYear();
  }
  function anniLabel(a, next) {
    if (a.love) {
      var n = loveYears(next);
      return n + ' 周年';
    }
    return a.title;
  }
  function isToday(a, now) {
    if (a._next) return a._next.getMonth() === now.getMonth() && a._next.getDate() === now.getDate();
    return a.month === now.getMonth() + 1 && a.day === now.getDate();
  }

  function renderAnni(pane) {
    var now = new Date();
    var list = annis().slice();
    list.forEach(function (a) {
      a._next = nextAnniversary(a, now);
      a._days = daysBetween(now, a._next);
      a._today = isToday(a, now);
    });
    list.sort(function (a, b) { return a._days - b._days; });

    var todayOnes = list.filter(function (a) { return a._today; });
    if (todayOnes.length) document.body.classList.add('is-festival');
    else document.body.classList.remove('is-festival');

    var html = '';
    if (todayOnes.length) {
      html += '<div class="anni-hero is-today"><span class="anni-hero__emoji">' + todayOnes[0].emoji + '</span>' +
        '<div class="anni-hero__main"><div class="anni-hero__label">就 是 今 天</div>' +
        '<div class="anni-hero__title">' + esc(anniLabel(todayOnes[0], todayOnes[0]._next)) + '</div>' +
        '<div class="anni-hero__days">今天记得对她/他说点什么</div></div></div>';
    } else if (list.length) {
      var near = list[0];
      html += '<div class="anni-hero"><span class="anni-hero__emoji">' + near.emoji + '</span>' +
        '<div class="anni-hero__main"><div class="anni-hero__label">最近的一个</div>' +
        '<div class="anni-hero__title">' + esc(anniLabel(near, near._next)) + '</div>' +
        '<div class="anni-hero__days">距离 <b>' + near._days + '</b> 天 · ' + near._next.getFullYear() + '.' +
        pad(near._next.getMonth() + 1) + '.' + pad(near._next.getDate()) + '</div></div></div>';
    }

    html += '<div class="bar"><span style="font-size:12px;color:rgba(255,234,244,.55)">一共 ' + list.length + ' 个日子</span>' +
      '<div class="bar__right"><button class="btn-soft" data-act="anniAdd">＋ 加一个日子</button></div></div>';

    html += '<div class="anni-grid">';
    list.forEach(function (a) {
      html += '<div class="anni' + (a._today ? ' is-today' : '') + '" data-aid="' + esc(a.id) + '">';
      if (a.custom !== false) html += '<button class="anni__del" data-act="anniDel" aria-label="删除">×</button>';
      html += '<span class="anni__emoji">' + a.emoji + '</span>';
      html += '<span class="anni__title">' + esc(anniLabel(a, a._next)) + '</span>';
      html += '<span class="anni__days' + (a._today ? ' is-now' : '') + '">' + (a._today ? '就是今天' : '还有 ' + a._days + ' 天') + '</span>';
      var dateTxt = pad(a._next.getMonth() + 1) + '.' + pad(a._next.getDate());
      if (a.type === 'once') dateTxt += ' · 仅一次';
      else if (a.lunar) dateTxt += ' · ' + a.lunar;
      else dateTxt += ' · 每年';
      html += '<span class="anni__date">' + dateTxt + '</span>';
      html += '</div>';
    });
    html += '</div>';

    html += '<div class="notice">恋爱周年会自己往上加：满一年显示「1 周年」，过了就到「2 周年」。<br>' +
      '到当天，整站会换成金色主题。</div>';

    pane.innerHTML = html;

    pane.onclick = function (ev) {
      var add = ev.target.closest('[data-act="anniAdd"]');
      if (add) { renderAnniAdd(pane); return; }
      var del = ev.target.closest('[data-act="anniDel"]');
      if (del) {
        var box = del.closest('.anni');
        var id = box.getAttribute('data-aid');
        saveAnnis(annis().filter(function (x) { return x.id !== id; }));
        renderAnni(pane);
      }
    };
  }

  function renderAnniAdd(pane) {
    var emojis = ['💗', '🎂', '🎄', '💌', '🌙', '🎉', '🌹', '🍰', '✈️', '🏖️', '🎬', '🎁'];
    var html = '<div class="form">';
    html += '<div class="field"><label>叫什么</label><input id="aTitle" maxlength="20" placeholder="比如：第一次一起看海"></div>';
    html += '<div class="bar" style="margin:0"><div class="field" style="max-width:90px"><label>月</label><input id="aMonth" type="number" min="1" max="12" value="1"></div>';
    html += '<div class="field" style="max-width:90px"><label>日</label><input id="aDay" type="number" min="1" max="31" value="1"></div>';
    html += '<div class="field"><label>重复</label><select id="aType"><option value="yearly">每年</option><option value="once">只这一次</option></select></div></div>';
    html += '<div class="field"><label>选个表情</label><div class="bar" style="margin:0" id="aEmojis">';
    emojis.forEach(function (e, i) {
      html += '<button class="chip' + (i === 0 ? ' is-on' : '') + '" data-emoji="' + e + '" style="font-size:16px;padding:4px 9px">' + e + '</button>';
    });
    html += '</div></div>';
    html += '<div class="bar" style="margin:0"><button class="btn-soft" id="aSave">加进来</button><button class="btn-ghost" id="aBack">返回</button></div></div>';
    pane.innerHTML = html;

    var emoji = emojis[0];
    pane.querySelector('#aEmojis').onclick = function (ev) {
      var b = ev.target.closest('[data-emoji]');
      if (!b) return;
      emoji = b.getAttribute('data-emoji');
      pane.querySelectorAll('#aEmojis .chip').forEach(function (x) { x.classList.toggle('is-on', x.getAttribute('data-emoji') === emoji); });
    };
    pane.querySelector('#aBack').onclick = function () { renderAnni(pane); };
    pane.querySelector('#aSave').onclick = function () {
      var title = pane.querySelector('#aTitle').value.trim();
      var m = parseInt(pane.querySelector('#aMonth').value, 10);
      var d = parseInt(pane.querySelector('#aDay').value, 10);
      if (!title) { UI.toast('先写个名字'); return; }
      if (!(m >= 1 && m <= 12) || !(d >= 1 && d <= 31)) { UI.toast('月/日填得不对'); return; }
      var list = annis();
      list.push({ id: 'a' + Date.now().toString(36), title: title, emoji: emoji, month: m, day: d, type: pane.querySelector('#aType').value, custom: true });
      saveAnnis(list);
      UI.toast('记下了，到那天提醒你');
      renderAnni(pane);
    };
    pane.querySelector('#aTitle').focus();
  }

  /* ---------------- 天气 ---------------- */
  function weatherHTML() {
    var s = store.get('settings', {});
    var cached = store.get('weatherCache', null);
    var today = ymd(new Date());
    if (cached && cached.date === today && (s.lat != null || s.city)) {
      return cardHTML(cached.icon, cached.text, cached.line || todayLine());
    }
    if (s.lat == null && !s.city) {
      /* 没设置过就先落在江西省会，用户可以在「换城市」里改到自己的区县 */
      s.province = '江西省';
      s.city = '南昌市';
      s.district = '';
      s.lat = 28.6825;
      s.lon = 115.8581;
      store.set('settings', s);
    }
    return '<div class="wx-card" id="wxCard"><span class="wx-card__icon">🌤️</span>' +
      '<div class="wx-card__main"><div class="wx-card__place">' + esc(placeText(s)) + '</div>' +
      '<div class="wx-card__temp" id="wxTemp">正在看今天的天气…</div>' +
      '<div class="wx-card__line">' + esc(todayLine()) + '</div></div>' +
      '<div style="display:flex;flex-direction:column;gap:6px">' +
      '<button class="wx-card__btn" id="wxRefresh">刷新</button>' +
      '<button class="wx-card__btn" id="wxLocate">定位</button>' +
      '<button class="wx-card__btn" id="wxPick">换城市</button></div></div>';
  }


  function placeText(s) {
    var parts = [];
    if (s.province && s.province !== s.city) parts.push(s.province);
    if (s.city) parts.push(s.city);
    if (s.district && s.district !== s.city && s.district !== s.province) parts.push(s.district);
    return parts.length ? parts.join(' · ') : (s.city || '');
  }

  /* ---------------- 城市搜索（本地数据，精确到区县） ---------------- */
  function renderCitySearch(host) {
    var card = host.querySelector('#wxCard');
    if (!card) return;
    card.innerHTML =
      '<div style="width:100%">' +
      '<div style="display:flex;gap:8px;align-items:center">' +
      '<input id="wxQ" placeholder="搜省 / 市 / 区县：余杭、进贤、婺源…" ' +
      'style="flex:1;padding:9px 13px;border-radius:11px;font-size:13px;background:rgba(255,255,255,.08);' +
      'border:1px solid rgba(255,255,255,.16);color:#ffeaf4;outline:none;min-width:0">' +
      '<button class="wx-card__btn" id="wxBack">取消</button></div>' +
      '<div id="wxResults" style="margin-top:10px;display:flex;flex-direction:column;gap:6px;max-height:240px;overflow:auto"></div>' +
      '</div>';

    var input = card.querySelector('#wxQ');
    var box = card.querySelector('#wxResults');
    var data = window.CN_DIVISIONS || [];

    function label(r) {
      if (r[5] === 0) return '省级';
      var bits = [];
      if (r[3] && r[3] !== r[4]) bits.push(r[3]);
      if (r[4]) bits.push(r[4]);
      if (!bits.length) return r[5] === 1 ? '地级市' : '区县';
      return bits.join(' · ');
    }

    function paint(rows) {
      if (!rows.length) {
        box.innerHTML = '<div class="wx-empty">没搜到，试试少输几个字（比如只输「余杭」）</div>';
        return;
      }
      box.innerHTML = rows.map(function (r, i) {
        return '<button class="wx-city" data-i="' + i + '"><b>' + esc(r[0]) + '</b><span>' + esc(label(r)) + '</span></button>';
      }).join('');
      box.querySelectorAll('.wx-city').forEach(function (b) {
        b.onclick = function () {
          var r = rows[parseInt(b.getAttribute('data-i'), 10)];
          var st = store.get('settings', {});
          st.province = r[3] || '';
          if (r[5] === 2) { st.city = r[4] || r[3] || ''; st.district = r[0]; }
          else if (r[5] === 1) { st.city = r[0]; st.district = ''; }
          else { st.city = r[0]; st.district = ''; st.province = ''; }
          st.lat = Math.round(r[2] * 1000) / 1000;
          st.lon = Math.round(r[1] * 1000) / 1000;
          store.remove('weatherCache');
          store.set('settings', st);
          UI.toast('天气切到「' + placeText(st) + '」了');
          render(host);
        };
      });
    }

    function search(q) {
      if (!q) { box.innerHTML = '<div class="wx-empty">输入地名，精确到区县</div>'; return; }
      var ql = q.toLowerCase();
      var exact = [], prefix = [], other = [];
      for (var i = 0; i < data.length; i++) {
        var r = data[i];
        var n = String(r[0]).toLowerCase();
        if (n === ql) exact.push(r);
        else if (n.indexOf(ql) === 0) prefix.push(r);
        else if ((r[0] + ' ' + (r[3] || '') + ' ' + (r[4] || '')).toLowerCase().indexOf(ql) >= 0) other.push(r);
        if (exact.length > 12) break;
      }
      function byLevel(a, b) { return b[5] - a[5]; }
      var rows = exact.concat(prefix.sort(byLevel), other.sort(byLevel)).slice(0, 12);
      paint(rows);
    }

    input.addEventListener('input', function () { search(this.value.trim()); });
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') search(this.value.trim()); });
    card.querySelector('#wxBack').onclick = function () { render(host); };
    input.focus();
    search('');
  }

  function bindWeather(host) {
    var saveCity = host.querySelector('#wxSaveCity');
    if (saveCity) {
      saveCity.onclick = function () {
        var city = host.querySelector('#wxCity').value.trim();
        if (!city) { UI.toast('写个城市名'); return; }
        var s = store.get('settings', {});
        s.city = city;
        delete s.lat; delete s.lon;
        store.remove('weatherCache');
        store.set('settings', s);
        render(host);
      };
    }
    var refresh = host.querySelector('#wxRefresh');
    if (refresh) refresh.onclick = function () { loadWeather(host, true); };

    var pick = host.querySelector('#wxPick');
    if (pick) pick.onclick = function () { renderCitySearch(host); };
    if (location.search.indexOf('citySearch=1') >= 0) setTimeout(function () {
      renderCitySearch(host);
      var m = location.search.match(/[?&]q=([^&]+)/);
      if (m) {
        var inp = host.querySelector('#wxQ');
        if (inp) { inp.value = decodeURIComponent(m[1]); inp.dispatchEvent(new Event('input')); }
      }
    }, 600);

    var locate = host.querySelector('#wxLocate');
    if (locate) {
      locate.onclick = function () {
        if (!navigator.geolocation) { UI.toast('这个浏览器不支持定位'); return; }
        locate.textContent = '…';
        navigator.geolocation.getCurrentPosition(function (pos) {
          var s = store.get('settings', {});
          s.lat = Math.round(pos.coords.latitude * 1000) / 1000;
          s.lon = Math.round(pos.coords.longitude * 1000) / 1000;
          s.city = '当前位置';
          store.remove('weatherCache');
          store.set('settings', s);
          render(host);
        }, function () {
          locate.textContent = '定位';
          UI.toast('没拿到定位，先按江西的天气给你看');
        }, { timeout: 8000, maximumAge: 600000 });
      };
    }
  }
  function cardHTML(icon, text, line) {
    return '<div class="wx-card" id="wxCard"><span class="wx-card__icon">' + icon + '</span>' +
      '<div class="wx-card__main"><div class="wx-card__place">' + esc(placeText(store.get('settings', {}))) + '</div>' +
      '<div class="wx-card__temp" id="wxTemp">' + esc(text) + '</div>' +
      '<div class="wx-card__line">' + esc(line) + '</div></div>' +
      '<div style="display:flex;flex-direction:column;gap:6px">' +
      '<button class="wx-card__btn" id="wxRefresh">刷新</button>' +
      '<button class="wx-card__btn" id="wxLocate">定位</button>' +
      '<button class="wx-card__btn" id="wxPick">换城市</button></div></div>';
  }

  function loadWeather(pane, force) {
    var card = pane.querySelector('#wxCard');
    if (!card) return;
    var cached = store.get('weatherCache', null);
    var today = ymd(new Date());
    if (!force && cached && cached.date === today) return;

    var s = store.get('settings', {});
    if (s.lat == null && !s.city) {
      card.querySelector('#wxTemp').textContent = '还不知道你们在哪 － 在下面填个城市';
      return;
    }
    var pos;
    if (s.lat != null) {
      pos = Promise.resolve({ lat: s.lat, lon: s.lon });
    } else {
      pos = fetch('https://geocoding-api.open-meteo.com/v1/search?name=' + encodeURIComponent(s.city) + '&count=1&language=zh&format=json')
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (!d.results || !d.results.length) throw new Error('城市没找到');
          var st = store.get('settings', {});
          st.lat = d.results[0].latitude; st.lon = d.results[0].longitude;
          store.set('settings', st);
          return { lat: st.lat, lon: st.lon };
        });
    }
    pos.then(function (p) {
      return fetch('https://api.open-meteo.com/v1/forecast?latitude=' + p.lat + '&longitude=' + p.lon +
        '&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=auto')
        .then(function (r) { return r.json(); });
    }).then(function (d) {
      if (!d.current) throw new Error('no data');
      var code = d.current.weather_code;
      var t = Math.round(d.current.temperature_2m);
      var text = iconFor(code) + ' ' + (WMO[code] || '晴') + ' ' + t + '℃';
      var line = todayLine();
      var hi = d.daily && d.daily.temperature_2m_max ? Math.round(d.daily.temperature_2m_max[0]) : null;
      var lo = d.daily && d.daily.temperature_2m_min ? Math.round(d.daily.temperature_2m_min[0]) : null;
      if (hi != null && lo != null) line = '最低 ' + lo + '℃ / 最高 ' + hi + '℃ · ' + line;
      store.set('weatherCache', { date: today, icon: iconFor(code), text: text, line: line });
      card.outerHTML = cardHTML(iconFor(code), text, line);
    }).catch(function () {
      var el = pane.querySelector('#wxTemp');
      if (el) el.textContent = '天气没拿到（可能没联网），但今天也要开心';
    });
  }

  /* ---------------- 提醒 ---------------- */
  function reminders() { return store.get('reminders', []); }
  function saveReminders(a) { return store.set('reminders', a); }

  function periodKey(r, d) {
    var t = new Date(d);
    if (r.repeat === 'daily') return ymd(t);
    if (r.repeat === 'weekly') {
      var day = (t.getDay() + 6) % 7;
      t.setDate(t.getDate() - day);
      return 'W' + ymd(t);
    }
    if (r.repeat === 'monthly') return ymd(t).slice(0, 7);
    return 'once';
  }

  function nextTime(r) {
    var base = new Date(r.at);
    if (!r.repeat || r.repeat === 'none') return base;
    var d = new Date(base);
    var now = new Date();
    var step = r.repeat === 'daily' ? 1 : (r.repeat === 'weekly' ? 7 : 30);
    var guard = 0;
    while (d < now && guard++ < 400) d.setDate(d.getDate() + step);
    return d;
  }

  function renderTodo(pane) {
    var items = reminders().slice();
    items.forEach(function (r) { r._next = nextTime(r); });
    items.sort(function (a, b) { return a._next - b._next; });

    var now = new Date();
    var todayStr = ymd(now);
    var dueToday = [], later = [], done = [];
    items.forEach(function (r) {
      var repeating = r.repeat && r.repeat !== 'none';
      var isDone = repeating ? (r.doneOn === periodKey(r, now)) : !!r.done;
      if (isDone) { done.push(r); return; }
      if (repeating && r.repeat === 'daily') { dueToday.push(r); return; }
      if (ymd(r._next) === todayStr || r._next < now) dueToday.push(r);
      else later.push(r);
    });

    var html = '<div class="bar"><span style="font-size:12px;color:rgba(255,234,244,.55)">' +
      (dueToday.length ? '<b style="color:#ff9ec9">' + dueToday.length + '</b> 件今天要做' : '今天没有安排，挺好') + '</span>' +
      '<div class="bar__right"><button class="btn-soft" data-act="add">＋ 记一件</button>' +
      '<button class="btn-ghost" data-act="ics">导出日历</button></div></div>';

    function row(r, isDone) {
      var n = r._next;
      var when = ymd(n) + ' ' + pad(n.getHours()) + ':' + pad(n.getMinutes());
      var overdue = !isDone && n < now;
      var h = '<div class="todo-row' + (overdue ? ' is-due' : '') + (isDone ? ' is-done' : '') + '" data-id="' + esc(r.id) + '">';
      h += '<button class="todo-check' + (isDone ? ' is-on' : '') + '" data-act="toggle">' + (isDone ? '✓' : '') + '</button>';
      h += '<div class="todo-row__main"><div class="todo-row__title">' + esc(r.title) + '</div>';
      h += '<div class="todo-row__meta"><span class="' + (overdue ? 'tag-due' : '') + '">' + (overdue ? '已过期 · ' : '') + when + '</span>';
      if (r.repeat && r.repeat !== 'none') h += '<span>' + ({ daily: '每天', weekly: '每周', monthly: '每月' })[r.repeat] + '</span>';
      h += '</div></div><button class="todo-row__del" data-act="del">删</button></div>';
      return h;
    }

    if (dueToday.length) html += dueToday.map(function (r) { return row(r, false); }).join('');
    if (!dueToday.length && !later.length && !done.length) {
      html += '<div class="empty">还没有要记的事。<br>记下"交水电费""给她买那个小蛋糕"，到点我替你们顶着。</div>';
    }

    if (later.length) {
      html += '<div class="wish__sep">之 后</div>';
      html += later.map(function (r) { return row(r, false); }).join('');
    }
    if (done.length) {
      html += '<div class="wish__sep">已 完 成</div>';
      html += done.slice(0, 12).map(function (r) { return row(r, true); }).join('');
    }

    html += '<div class="notice">提醒只在打开网页时能看到。想真正"到点响"，点上面的「导出日历」，把 .ics 导进手机日历。<br>' +
      '天气来自 Open-Meteo，需要在设置里填城市（现在：' + esc((store.get('settings', {}).city) || '未设置') + '）。</div>';

    pane.innerHTML = html;

    pane.onclick = function (ev) {
      var act = ev.target.closest('[data-act]');
      var rowEl = ev.target.closest('.todo-row');
      if (act && act.getAttribute('data-act') === 'add') { renderAdd(pane); return; }
      if (act && act.getAttribute('data-act') === 'ics') { exportICS(items); return; }
      if (!rowEl) return;
      var id = rowEl.getAttribute('data-id');
      var list = reminders();
      var idx = -1;
      for (var i = 0; i < list.length; i++) if (list[i].id === id) idx = i;
      if (idx < 0) return;
      var r = list[idx];
      if (act && act.getAttribute('data-act') === 'toggle') {
        if (r.repeat && r.repeat !== 'none') {
          var key = periodKey(r, new Date());
          r.doneOn = (r.doneOn === key) ? null : key;
        } else {
          r.done = !r.done;
        }
        saveReminders(list);
        renderTodo(pane);
        UI.toast(r.done || r.doneOn ? '完成一件，夸你一下' : '又放回清单啦');
        return;
      }
      if (act && act.getAttribute('data-act') === 'del') {
        list.splice(idx, 1);
        saveReminders(list);
        renderTodo(pane);
      }
    };
  }

  function renderAdd(pane) {
    var d = new Date(Date.now() + 3600000);
    var def = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    var html = '<div class="form">';
    html += '<div class="field"><label>要做什么</label><input id="rTitle" maxlength="40" placeholder="比如：给她买那个小蛋糕"></div>';
    html += '<div class="field"><label>什么时候</label><input type="datetime-local" id="rAt" value="' + def + '"></div>';
    html += '<div class="field"><label>重复</label><select id="rRepeat"><option value="none">只提醒一次</option><option value="daily">每天</option><option value="weekly">每周</option><option value="monthly">每月</option></select></div>';
    html += '<div class="bar" style="margin:0"><button class="btn-soft" id="rSave">记下</button><button class="btn-ghost" id="rBack">返回</button></div></div>';
    pane.innerHTML = html;

    pane.querySelector('#rBack').onclick = function () { renderTodo(pane); };
    pane.querySelector('#rSave').onclick = function () {
      var title = pane.querySelector('#rTitle').value.trim();
      var at = pane.querySelector('#rAt').value;
      if (!title) { UI.toast('先写要做什么'); return; }
      if (!at) { UI.toast('选个时间'); return; }
      var list = reminders();
      list.push({ id: uid(), title: title, at: at, repeat: pane.querySelector('#rRepeat').value, done: false, createdAt: Date.now() });
      saveReminders(list);
      UI.toast('记下了，到点我会提醒你');
      renderTodo(pane);
    };
    pane.querySelector('#rTitle').focus();
  }

  function exportICS(items) {
    var lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//XinChen Universe//CN', 'CALSCALE:GREGORIAN'];
    items.forEach(function (r) {
      var d = new Date(r.at);
      var dt = d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + 'T' + pad(d.getHours()) + pad(d.getMinutes()) + '00';
      lines.push('BEGIN:VEVENT');
      lines.push('UID:' + r.id + '@xinchen');
      lines.push('DTSTAMP:' + dt);
      lines.push('DTSTART:' + dt);
      lines.push('SUMMARY:' + String(r.title).replace(/[,;]/g, ' '));
      if (r.repeat === 'daily') lines.push('RRULE:FREQ=DAILY');
      if (r.repeat === 'weekly') lines.push('RRULE:FREQ=WEEKLY');
      if (r.repeat === 'monthly') lines.push('RRULE:FREQ=MONTHLY');
      lines.push('END:VEVENT');
    });
    lines.push('END:VCALENDAR');
    var blob = new Blob([lines.join('\r\n')], { type: 'text/calendar' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'xinchen-提醒.ics';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    UI.toast('导出了，用手机日历打开就能真正到点提醒');
  }

  /* ---------------- 记账 ---------------- */
  function money() { return store.get('money', []); }
  function saveMoney(a) { return store.set('money', a); }
  function budget() { return store.get('budget', { daily: 80 }); }

  function renderMoney(pane) {
    var all = money();
    var today = ymd(new Date());
    var todayItems = all.filter(function (x) { return x.date === today; });
    var spent = todayItems.reduce(function (s, x) { return s + Number(x.amount || 0); }, 0);
    var b = budget();
    var left = b.daily - spent;
    var pct = Math.min(100, Math.round(spent / Math.max(1, b.daily) * 100));
    var month = today.slice(0, 7);
    var monthTotal = all.filter(function (x) { return (x.date || '').slice(0, 7) === month; })
      .reduce(function (s, x) { return s + Number(x.amount || 0); }, 0);

    var html = '<div class="money-top">';
    html += '<div class="money-card"><div class="money-card__label">今日预算</div><div class="money-card__num">' + b.daily + '<small>元</small></div>' +
      '<div class="money-bar"><i style="width:' + Math.min(100, pct) + '%"></i></div></div>';
    html += '<div class="money-card"><div class="money-card__label">今天花了</div><div class="money-card__num">' + spent.toFixed(0) + '<small>元</small></div>' +
      '<div style="font-size:11px;color:rgba(255,234,244,.5);margin-top:8px">' + todayItems.length + ' 笔</div></div>';
    html += '<div class="money-card"><div class="money-card__label">还能花</div><div class="money-card__num" style="color:' + (left < 0 ? '#ff8a5c' : '#ffd46e') + '">' +
      Math.abs(left).toFixed(0) + '<small>元' + (left < 0 ? '（超了）' : '') + '</small></div>' +
      '<div style="font-size:11px;color:rgba(255,234,244,.5);margin-top:8px">本月 ' + monthTotal.toFixed(0) + ' 元</div></div>';
    html += '</div>';

    html += '<div class="form" style="margin-bottom:16px">';
    html += '<div class="bar" style="margin:0">';
    html += '<div class="field" style="max-width:120px"><label>多少钱</label><input id="mAmount" type="number" min="0" step="0.01" placeholder="0"></div>';
    html += '<div class="field"><label>花在哪</label><input id="mNote" maxlength="24" placeholder="比如：楼下奶茶"></div>';
    html += '<div class="field" style="max-width:120px"><label>预算/天</label><input id="mBudget" type="number" min="0" value="' + b.daily + '"></div>';
    html += '</div>';
    html += '<div class="bar" style="margin:0" id="mCats">';
    CATS.forEach(function (c, i) {
      html += '<button class="chip' + (i === 0 ? ' is-on' : '') + '" data-cat="' + c + '">' + c + '</button>';
    });
    html += '<button class="btn-soft" id="mSave" style="margin-left:auto">记一笔</button></div></div>';

    if (!todayItems.length) {
      html += '<div class="empty">今天还没花钱。<br>也挺好，省下来的都是以后的旅行基金。</div>';
    } else {
      todayItems.slice().reverse().forEach(function (x) {
        html += '<div class="exp-row" data-id="' + esc(x.id) + '"><span class="exp-row__cat">' + esc(x.cat) + '</span>' +
          '<span class="exp-row__note">' + esc(x.note || '') + '</span>' +
          '<span class="exp-row__amt">' + Number(x.amount).toFixed(0) + ' 元</span>' +
          '<button class="exp-row__del" data-act="del">×</button></div>';
      });
    }

    pane.innerHTML = html;

    var cat = CATS[0];
    pane.querySelector('#mCats').onclick = function (ev) {
      var c = ev.target.closest('[data-cat]');
      if (!c) return;
      cat = c.getAttribute('data-cat');
      pane.querySelectorAll('#mCats .chip').forEach(function (x) { x.classList.toggle('is-on', x.getAttribute('data-cat') === cat); });
    };

    pane.querySelector('#mSave').onclick = function () {
      var amt = parseFloat(pane.querySelector('#mAmount').value);
      if (!(amt > 0)) { UI.toast('填个金额'); return; }
      var bd = parseFloat(pane.querySelector('#mBudget').value);
      if (bd > 0) store.set('budget', { daily: bd });
      var list = money();
      list.push({ id: uid(), amount: amt, cat: cat, note: pane.querySelector('#mNote').value.trim(), date: today, createdAt: Date.now() });
      saveMoney(list);
      var b2 = budget();
      if (spent + amt > b2.daily) UI.toast('超预算啦，明天省着点，不过我请你也行');
      else UI.toast('记下了');
      renderMoney(pane);
    };

    pane.querySelectorAll('[data-act="del"]').forEach(function (el) {
      el.onclick = function () {
        var row = el.closest('.exp-row');
        var id = row.getAttribute('data-id');
        saveMoney(money().filter(function (x) { return x.id !== id; }));
        renderMoney(pane);
      };
    });
  }

  /* ---------------- 入口 ---------------- */
  function render(body) {
    bodyRef = body;
    var html = '<div class="tabs">';
    TABS.forEach(function (t) {
      html += '<button class="tabs__btn' + (tab === t[0] ? ' is-on' : '') + '" data-tab="' + t[0] + '">' + t[1] + '</button>';
    });
    html += '</div>' + weatherHTML() + '<div id="luckyPane"></div>';
    body.innerHTML = html;

    body.querySelector('.tabs').onclick = function (ev) {
      var b = ev.target.closest('[data-tab]');
      if (!b) return;
      tab = b.getAttribute('data-tab');
      render(body);
    };
    var pane = body.querySelector('#luckyPane');
    if (tab === 'money') renderMoney(pane);
    else if (tab === 'anni') renderAnni(pane);
    else renderTodo(pane);
    loadWeather(body, false);

    bindWeather(body);
  }

  LoveUI.register('lucky', {
    title: '忘性大的福星',
    icon: '✨',
    render: function (body) {
      if (/luckyMoney=1/.test(location.search)) tab = 'money';
      if (/luckyAnni=1/.test(location.search)) tab = 'anni';
      if (/luckyDemo=1/.test(location.search) && !reminders().length && !money().length) {
        var t = new Date();
        var d1 = new Date(t.getTime() + 3 * 3600000);
        var d2 = new Date(t.getTime() + 86400000);
        var f = function (d) {
          return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
        };
        saveReminders([
          { id: uid(), title: '给她买那家小蛋糕', at: f(d1), repeat: 'none', done: false, createdAt: Date.now() },
          { id: uid(), title: '交水电费', at: f(d2), repeat: 'monthly', done: false, createdAt: Date.now() },
          { id: uid(), title: '给猫铲屎', at: f(t), repeat: 'daily', doneOn: ymd(t), createdAt: Date.now() }
        ]);
        saveMoney([
          { id: uid(), amount: 18, cat: '吃饭', note: '楼下炒饭', date: ymd(t), createdAt: Date.now() },
          { id: uid(), amount: 6, cat: '交通', note: '地铁', date: ymd(t), createdAt: Date.now() - 1000 }
        ]);
      }
      render(body);
    }
  });
})();
