/* =====================================================
   大馋猪的天堂 · 食物转盘 + 美食分享
   ===================================================== */
(function () {
  'use strict';

  var store = window.LoveStore;
  var UI = window.LoveUI;
  if (!store || !UI) return;

  var DISHES = ['烧烤', '火锅', '炒饭', '拉面', '寿司', '炸鸡',
    '麻辣烫', '螺蛳粉', '披萨', '汉堡', '烤鱼', '甜品',
    '小龙虾', '盖浇饭', '水饺', '酸菜鱼', '砂锅粥', '铁板鱿鱼',
    '黄焖鸡', '冒菜', '牛肉面', '烤冷面', '卤味', '冰粉'];

  var COLORS = ['#ffb3c6', '#ffd166', '#c9ffdd', '#c7f9ff', '#ffe1ee', '#e6d6ff',
    '#ffc9a3', '#bfe1ff', '#ffc9e2', '#d9f7ff', '#ffe8b3', '#d7ffd9'];

  function reviews() { return store.get('foods', []); }
  function persist(a) { return store.set('foods', a); }
  function uid() { return 'f' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function stars(n) {
    var out = '';
    for (var i = 1; i <= 5; i++) out += i <= n ? '★' : '☆';
    return out;
  }
  function fmtDate(ts) {
    var d = new Date(ts);
    return d.getFullYear() + '.' + ('0' + (d.getMonth() + 1)).slice(-2) + '.' + ('0' + d.getDate()).slice(-2);
  }

  var tab = 'wheel';
  var rotation = 0;
  var spinning = false;
  var lastWinner = '';
  var root = null;

  /* ---------------- 转盘 ---------------- */
  function drawWheel(canvas) {
    var size = canvas.clientWidth || 320;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);

    var r = size / 2 - 4;
    var cx = size / 2, cy = size / 2;
    var n = DISHES.length;
    var seg = Math.PI * 2 / n;

    for (var i = 0; i < n; i++) {
      var a0 = rotation + i * seg;
      var a1 = a0 + seg;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, a0, a1);
      ctx.closePath();
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(32,6,26,.85)';
      ctx.stroke();

      var mid = a0 + seg / 2;
      var flip = Math.cos(mid) < 0;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(flip ? mid + Math.PI : mid);
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#2a0b1c';
      ctx.font = '800 ' + (n > 20 ? 10 : (n > 14 ? 12 : 13)) + 'px "PingFang SC","Microsoft YaHei",sans-serif';
      ctx.textAlign = flip ? 'left' : 'right';
      ctx.fillText(DISHES[i], flip ? -(r - 18) : (r - 18), 0);
      ctx.restore();
    }

    ctx.beginPath();
    ctx.arc(cx, cy, 30, 0, Math.PI * 2);
    ctx.fillStyle = '#fffdf7';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#20061a';
    ctx.stroke();
  }

  function spin(canvas, resultEl) {
    if (spinning) return;
    spinning = true;
    var n = DISHES.length;
    var seg = Math.PI * 2 / n;
    var idx = Math.floor(Math.random() * n);
    var turns = 4 + Math.floor(Math.random() * 3);

    var desired = -Math.PI / 2 - (idx * seg + seg / 2);
    var cur = rotation % (Math.PI * 2);
    var delta = ((desired - cur) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
    var from = rotation;
    var to = from + delta + Math.PI * 2 * turns;
    var start = performance.now();
    var dur = 3800;

    resultEl.innerHTML = '转呀转…';

    function frame(now) {
      var p = Math.min(1, (now - start) / dur);
      var e = 1 - Math.pow(1 - p, 3);
      rotation = from + (to - from) * e;
      drawWheel(canvas);
      if (p < 1) {
        requestAnimationFrame(frame);
      } else {
        spinning = false;
        lastWinner = DISHES[idx];
        resultEl.innerHTML = '今天就吃 <b>' + esc(lastWinner) + '</b>！' + nearbyHTML(lastWinner);
        paintActions(resultEl);
      }
    }
    requestAnimationFrame(frame);
  }

  function paintActions(resultEl) {
    var wrap = resultEl.parentNode.querySelector('.wheel-actions');
    if (!wrap) return;
    wrap.style.display = 'flex';
  }


  /* 附近门店：用手机地图的搜索链接，按定位/城市筛 */
  function nearbyHTML(dish) {
    var s = store.get('settings', {});
    var city = s.city && s.city !== '当前位置' ? s.city : '南昌';
    var d = encodeURIComponent(dish);
    var c = encodeURIComponent(city);
    var center = (s.lat != null ? s.lon + ',' + s.lat : '');
    var amap = 'https://uri.amap.com/search?keyword=' + d + (center ? '&center=' + center : '') + '&city=' + c + '&callnative=1';
    var dianping = 'https://m.dianping.com/search?keyword=' + d + '&city=' + c;
    var meituan = 'https://i.meituan.com/s/' + d;
    return '<div class="nearby"><span class="nearby__label">附近吃这家</span>' +
      '<a class="nearby__link" href="' + amap + '" target="_blank" rel="noopener">高德</a>' +
      '<a class="nearby__link" href="' + dianping + '" target="_blank" rel="noopener">点评</a>' +
      '<a class="nearby__link" href="' + meituan + '" target="_blank" rel="noopener">美团</a>' +
      '</div>';
  }

  /* ---------------- 菜谱 ---------------- */
  var RECIPES = [
    { n: '火锅', t: '20 分钟', k: '简单', i: ['火锅底料', '肥牛', '土豆', '生菜', '菌菇'], s: ['锅里加水烧开，放底料化开', '先下耐煮的土豆、菌菇', '肉片涮 10 秒就捞', '最后下青菜，蘸料自己调'] },
    { n: '番茄牛腩', t: '90 分钟', k: '中等', i: ['牛腩 500g', '番茄 3 个', '洋葱', '姜片', '番茄酱'], s: ['牛腩冷水下锅焯出血沫', '番茄划十字烫皮切块', '炒香洋葱姜片，下番茄炒出沙', '加牛腩和水，小火炖 70 分钟', '最后加番茄酱、盐收汁'] },
    { n: '可乐鸡翅', t: '30 分钟', k: '简单', i: ['鸡翅 10 个', '可乐一罐', '生抽', '姜片'], s: ['鸡翅两面划刀，焯水', '少油煎到两面金黄', '倒可乐没过鸡翅，加生抽姜片', '大火收汁到发亮'] },
    { n: '蛋炒饭', t: '10 分钟', k: '简单', i: ['隔夜饭', '鸡蛋 2 个', '葱花', '火腿丁'], s: ['鸡蛋打散先炒成块盛出', '下饭粒炒散，粒粒分明', '加火腿、蛋块、盐', '出锅前撒葱花'] },
    { n: '麻婆豆腐', t: '20 分钟', k: '中等', i: ['嫩豆腐', '肉末', '豆瓣酱', '花椒粉'], s: ['豆腐切块，盐水泡 5 分钟', '炒香肉末和豆瓣酱', '加水下豆腐，小火煮 5 分钟', '勾芡两次，撒花椒粉和葱花'] },
    { n: '酸辣土豆丝', t: '15 分钟', k: '简单', i: ['土豆 2 个', '干辣椒', '醋', '蒜'], s: ['土豆切细丝，清水冲掉淀粉', '热油爆香干辣椒蒜末', '大火快炒 1 分钟', '沿锅边淋醋，加盐出锅'] },
    { n: '水饺', t: '60 分钟', k: '中等', i: ['面粉', '猪肉馅', '白菜', '姜末'], s: ['白菜剁碎挤干水', '肉馅加姜末、生抽、香油拌匀', '和面擀皮，包好', '水开下锅，点三次凉水'] },
    { n: '酸菜鱼', t: '40 分钟', k: '中等', i: ['黑鱼片', '酸菜', '泡椒', '蛋清'], s: ['鱼片用蛋清、盐、淀粉抓匀', '炒香酸菜和泡椒，加水煮开', '鱼片下锅烫 1 分钟', '热油泼在花椒辣椒上'] },
    { n: '砂锅粥', t: '50 分钟', k: '简单', i: ['大米', '虾', '蟹', '姜丝'], s: ['米提前泡 30 分钟', '砂锅水开下米，小火慢熬', '粥稠了下虾蟹', '出锅撒姜丝、葱花、白胡椒'] },
    { n: '黄焖鸡', t: '40 分钟', k: '简单', i: ['鸡腿肉', '香菇', '青椒', '冰糖'], s: ['鸡块焯水', '冰糖炒糖色，下鸡块上色', '加香菇、生抽、水焖 20 分钟', '收汁前下青椒'] },
    { n: '牛肉面', t: '120 分钟', k: '偏难', i: ['牛腱', '面条', '八角桂皮', '香菜'], s: ['牛腱焯水后加香料炖 90 分钟', '汤留用，肉切片', '面条煮熟捞入碗中', '浇热汤、摆牛肉、撒香菜'] },
    { n: '烤冷面', t: '15 分钟', k: '简单', i: ['冷面片', '鸡蛋', '香肠', '洋葱'], s: ['平底锅刷油，放冷面片', '打鸡蛋摊开，翻面', '刷酱、放香肠洋葱', '卷起来切段'] },
    { n: '冒菜', t: '25 分钟', k: '简单', i: ['火锅底料', '各类蔬菜', '丸子', '香油'], s: ['底料炒香加水', '先下丸子后下菜', '煮熟捞进碗里', '浇汤，淋香油撒芝麻'] },
    { n: '卤味', t: '60 分钟', k: '中等', i: ['鸡爪/豆干', '卤料包', '生抽老抽', '冰糖'], s: ['食材焯水', '卤料包加水、生抽老抽冰糖煮开', '下食材小火卤 40 分钟', '关火泡 1 小时更入味'] },
    { n: '小龙虾', t: '50 分钟', k: '偏难', i: ['小龙虾', '蒜/十三香', '啤酒', '干辣椒'], s: ['虾刷洗干净，剪头挑虾线', '热油爆香蒜和辣椒', '下虾翻炒，倒啤酒没过', '焖 20 分钟收汁'] },
    { n: '铁板鱿鱼', t: '20 分钟', k: '简单', i: ['鱿鱼须', '洋葱', '孜然辣椒面', '蒜蓉酱'], s: ['鱿鱼切条焯 10 秒', '铁板/平底锅烧热刷油', '下鱿鱼和洋葱快炒', '撒孜然辣椒面、刷蒜蓉酱'] },
    { n: '冰粉', t: '15 分钟', k: '简单', i: ['冰粉粉', '红糖', '山楂碎', '花生碎'], s: ['冰粉粉用开水冲开搅匀', '放凉冷藏 2 小时', '红糖加水熬成糖浆', '浇糖浆，撒配料'] },
    { n: '烤鱼', t: '60 分钟', k: '偏难', i: ['鲈鱼', '豆芽', '干辣椒花椒', '豆瓣酱'], s: ['鱼两面煎定型', '炒香豆瓣酱和辣椒，加水', '鱼放进去小火煮 8 分钟', '泼热油，撒香菜'] },
    { n: '红烧肉', t: '70 分钟', k: '中等', i: ['五花肉', '冰糖', '生抽老抽', '八角'], s: ['五花肉切块焯水', '冰糖小火炒出糖色，下肉翻炒上色', '加生抽老抽、八角和水，小火炖 50 分钟', '大火收汁到发亮'] },
    { n: '糖醋排骨', t: '45 分钟', k: '中等', i: ['排骨', '香醋', '糖', '料酒'], s: ['排骨焯水后煎至微黄', '料酒、生抽、糖、醋按 1:2:3:4 调汁', '倒入汁和水，小火焖 25 分钟', '收汁撒白芝麻'] },
    { n: '宫保鸡丁', t: '25 分钟', k: '中等', i: ['鸡腿肉', '花生米', '干辣椒', '葱段'], s: ['鸡丁用料酒生抽淀粉腌 10 分钟', '炒香干辣椒花椒，下鸡丁滑散', '加葱段、糖醋汁翻炒', '最后拌入炸花生米'] },
    { n: '鱼香肉丝', t: '25 分钟', k: '中等', i: ['里脊肉', '木耳', '胡萝卜', '泡椒'], s: ['肉丝上浆滑油盛出', '炒香泡椒姜蒜，下配菜', '倒鱼香汁（糖醋酱油淀粉）', '回肉丝大火翻匀'] },
    { n: '回锅肉', t: '35 分钟', k: '中等', i: ['五花肉', '蒜苗', '豆瓣酱', '豆豉'], s: ['五花肉整块煮 20 分钟切片', '少油煸到微卷出油', '下豆瓣酱豆豉炒香', '加蒜苗断生即可'] },
    { n: '地三鲜', t: '30 分钟', k: '简单', i: ['茄子', '土豆', '青椒', '蒜'], s: ['茄子和土豆切块分别过油', '炒香蒜末', '下三样一起翻炒', '淋酱油糖水淀粉勾芡'] },
    { n: '西红柿炒蛋', t: '10 分钟', k: '简单', i: ['西红柿 2 个', '鸡蛋 3 个', '糖', '葱花'], s: ['鸡蛋打散炒成大块盛出', '西红柿炒出汁，加一点糖', '倒回鸡蛋翻匀', '撒葱花出锅'] },
    { n: '青椒肉丝', t: '20 分钟', k: '简单', i: ['里脊肉', '青椒', '蒜', '生抽'], s: ['肉丝上浆腌 10 分钟', '热锅滑炒肉丝盛出', '炒青椒断生', '回肉丝调味翻匀'] },
    { n: '干煸四季豆', t: '20 分钟', k: '简单', i: ['四季豆', '肉末', '干辣椒', '蒜'], s: ['四季豆掰段，油里煸到起皱', '炒香肉末和干辣椒', '下四季豆翻炒', '加盐和一点生抽'] },
    { n: '蒜蓉西兰花', t: '12 分钟', k: '简单', i: ['西兰花', '蒜末', '蚝油'], s: ['西兰花焯水 1 分钟过凉', '热油爆香蒜末', '下西兰花快炒', '加蚝油和盐出锅'] },
    { n: '香菇滑鸡', t: '35 分钟', k: '简单', i: ['鸡腿肉', '香菇', '姜片', '蚝油'], s: ['鸡块用蚝油生抽腌 15 分钟', '炒香姜片和香菇', '下鸡块翻炒上色', '加水焖 15 分钟收汁'] },
    { n: '白灼虾', t: '15 分钟', k: '简单', i: ['鲜虾', '姜片', '料酒', '生抽'], s: ['水里加姜片料酒烧开', '下虾煮到变色立刻捞出', '过冰水更弹', '蘸姜醋汁吃'] },
    { n: '蒜蓉粉丝蒸扇贝', t: '25 分钟', k: '中等', i: ['扇贝', '粉丝', '蒜蓉', '葱花'], s: ['粉丝泡软垫底', '扇贝放上，铺蒜蓉', '水开蒸 6 分钟', '淋热油和蒸鱼豉油'] },
    { n: '皮蛋瘦肉粥', t: '50 分钟', k: '简单', i: ['大米', '皮蛋', '瘦肉', '姜丝'], s: ['米泡 30 分钟后小火熬', '肉丝用盐淀粉腌一下', '粥稠了下皮蛋和肉丝', '撒姜丝葱花白胡椒'] },
    { n: '葱油拌面', t: '15 分钟', k: '简单', i: ['面条', '小葱', '生抽老抽', '糖'], s: ['冷油下葱段小火熬到焦黄', '加生抽老抽和糖煮开成葱油', '面条煮熟沥干', '浇两勺葱油拌匀'] },
    { n: '煎饺', t: '20 分钟', k: '简单', i: ['速冻饺子', '面粉水', '油', '芝麻'], s: ['平底锅刷油摆好饺子', '倒面粉水到饺子三分之一', '盖盖中火焖 8 分钟', '水干后淋油煎脆底，撒芝麻'] },
    { n: '三明治', t: '10 分钟', k: '简单', i: ['吐司', '鸡蛋', '生菜', '火腿'], s: ['吐司烤到微焦', '煎蛋和火腿', '生菜洗净擦干', '叠起来对角切'] },
    { n: '鸡胸沙拉', t: '15 分钟', k: '简单', i: ['鸡胸', '生菜', '小番茄', '油醋汁'], s: ['鸡胸盐黑胡椒腌 10 分钟', '平底锅两面各煎 4 分钟', '切条和蔬菜装盘', '淋油醋汁'] },
    { n: '燕麦粥', t: '10 分钟', k: '简单', i: ['燕麦片', '牛奶', '香蕉', '蜂蜜'], s: ['牛奶小火加热', '下燕麦煮 3 分钟', '关火放香蕉片', '淋一点蜂蜜'] },
    { n: '焦糖奶茶', t: '15 分钟', k: '简单', i: ['红茶', '牛奶', '糖', '木薯珍珠'], s: ['糖小火炒成焦糖', '倒牛奶和红茶煮开', '珍珠煮 15 分钟过凉水', '混合装杯'] }
  ];

  function renderRecipes(pane) {
    var html = '<div class="bar"><span style="font-size:12px;color:rgba(255,234,244,.55)">' + RECIPES.length + ' 道家常菜，看着做</span>' +
      '<div class="bar__right"><input id="rSearch" placeholder="搜菜名或食材" style="padding:8px 12px;border-radius:10px;font-size:12.5px;' +
      'background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);color:#ffeaf4;outline:none;width:170px"></div></div>';
    html += '<div class="websearch" id="webSearch"></div>';
    html += '<div class="recipe-grid" id="recipeGrid"></div>';
    pane.innerHTML = html;

    function webLinks(q) {
      var node = pane.querySelector('#webSearch');
      if (!node) return;
      var kw = encodeURIComponent(q || '家常菜');
      var w = encodeURIComponent((q || '家常菜') + ' 做法');
      node.innerHTML =
        '<span class="websearch__label">全网找「' + esc(q || '家常菜') + '」</span>' +
        '<a class="websearch__link" target="_blank" rel="noopener" href="https://www.xiachufang.com/search/?keyword=' + kw + '">下厨房</a>' +
        '<a class="websearch__link" target="_blank" rel="noopener" href="https://www.douguo.com/search/recipe/' + kw + '">豆果</a>' +
        '<a class="websearch__link" target="_blank" rel="noopener" href="https://search.bilibili.com/all?keyword=' + w + '">B站</a>' +
        '<a class="websearch__link" target="_blank" rel="noopener" href="https://www.xiaohongshu.com/search_result?keyword=' + w + '">小红书</a>';
    }

    function paint(kw) {
      var list = RECIPES.filter(function (r) {
        if (!kw) return true;
        return r.n.indexOf(kw) >= 0 || r.i.join(' ').indexOf(kw) >= 0;
      });
      var g = pane.querySelector('#recipeGrid');
      if (!list.length) { g.innerHTML = '<div class="empty">没找到，换个词试试</div>'; return; }
      g.innerHTML = list.map(function (r, i) {
        return '<button class="recipe" data-ri="' + RECIPES.indexOf(r) + '">' +
          '<span class="recipe__name">' + esc(r.n) + '</span>' +
          '<span class="recipe__meta">' + esc(r.t) + ' · ' + esc(r.k) + '</span>' +
          '<span class="recipe__ing">' + esc(r.i.slice(0, 3).join(' / ')) + '</span></button>';
      }).join('');
    }
    paint('');
    webLinks('');
    pane.querySelector('#rSearch').oninput = function () {
      var v = this.value.trim();
      paint(v);
      webLinks(v);
    };
    pane.querySelector('#recipeGrid').onclick = function (ev) {
      var b = ev.target.closest('[data-ri]');
      if (!b) return;
      renderRecipeDetail(pane, RECIPES[parseInt(b.getAttribute('data-ri'), 10)]);
    };
  }

  function renderRecipeDetail(pane, r) {
    var html = '<div class="album__head"><button class="btn-ghost" data-act="back">← 菜谱</button>' +
      '<div class="album__title">' + esc(r.n) + '</div></div>';
    html += '<div class="recipe-detail">';
    html += '<div class="recipe-detail__meta">' + esc(r.t) + ' · ' + esc(r.k) + '</div>';
    html += '<div class="recipe-detail__label">要准备</div>';
    html += '<div class="recipe-detail__chips">' + r.i.map(function (x) { return '<span class="chip">' + esc(x) + '</span>'; }).join('') + '</div>';
    html += '<div class="recipe-detail__label">怎么做</div>';
    html += '<ol class="recipe-detail__steps">' + r.s.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol>';
    var kw = encodeURIComponent(r.n);
    var w = encodeURIComponent(r.n + ' 做法');
    html += '<div class="websearch"><span class="websearch__label">还想看别家做法</span>' +
      '<a class="websearch__link" target="_blank" rel="noopener" href="https://www.xiachufang.com/search/?keyword=' + kw + '">下厨房</a>' +
      '<a class="websearch__link" target="_blank" rel="noopener" href="https://www.douguo.com/search/recipe/' + kw + '">豆果</a>' +
      '<a class="websearch__link" target="_blank" rel="noopener" href="https://search.bilibili.com/all?keyword=' + w + '">B站</a>' +
      '<a class="websearch__link" target="_blank" rel="noopener" href="https://www.xiaohongshu.com/search_result?keyword=' + w + '">小红书</a></div>';
    html += '</div>';
    pane.innerHTML = html;
    pane.querySelector('[data-act="back"]').onclick = function () { renderRecipes(pane); };
  }

  /* ---------------- 分享 ---------------- */
  function renderShare(root) {
    var items = reviews().slice().sort(function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });
    var html = '<div class="form" id="foodForm">';
    html += '<div class="bar" style="margin:0">';
    html += '<div class="field"><label>吃了什么</label><input id="fName" maxlength="24" placeholder="比如：楼下的炒饭" value="' + esc(lastWinner) + '"></div>';
    html += '<div class="field" style="max-width:150px"><label>在哪</label><input id="fPlace" maxlength="20" placeholder="店名 / 地址"></div>';
    html += '</div>';
    html += '<div class="field"><label>几颗星</label><div class="stars" id="fStars">';
    for (var s = 1; s <= 5; s++) html += '<button class="star" data-star="' + s + '">★</button>';
    html += '</div></div>';
    html += '<div class="field"><label>评价</label><textarea id="fNote" placeholder="好吃在哪？下次还想点什么？"></textarea></div>';
    html += '<div class="bar" style="margin:0"><button class="btn-soft" id="fSave">记下来</button>';
    html += '<span style="font-size:11px;color:rgba(255,234,244,.4)">下次翻到这里，就知道该点什么</span></div>';
    html += '</div>';

    html += '<div style="margin:20px 0 12px;font-size:12px;color:rgba(255,234,244,.45)">吃过的 ' + items.length + ' 顿</div>';
    if (!items.length) {
      html += '<div class="empty">还没有记录。<br>吃到好吃的东西，记一笔，下次就不用想了。</div>';
    }
    items.forEach(function (f) {
      html += '<div class="food-card">';
      html += '<div class="food-card__main">';
      html += '<div class="food-card__name">' + esc(f.name) + '<span class="food-card__stars">' + stars(f.rating) + '</span></div>';
      html += '<div class="food-card__meta">' + fmtDate(f.createdAt) + (f.place ? ' · ' + esc(f.place) : '') + '</div>';
      if (f.note) html += '<div class="food-card__note">' + esc(f.note) + '</div>';
      if (f.next) html += '<div class="food-card__next">下次想吃：' + esc(f.next) + '</div>';
      html += '</div></div>';
    });

    root.innerHTML = html;

    var rating = 0;
    var starsEl = root.querySelector('#fStars');
    starsEl.onclick = function (ev) {
      var b = ev.target.closest('[data-star]');
      if (!b) return;
      rating = parseInt(b.getAttribute('data-star'), 10);
      starsEl.querySelectorAll('.star').forEach(function (x) {
        x.classList.toggle('is-on', parseInt(x.getAttribute('data-star'), 10) <= rating);
      });
    };

    root.querySelector('#fSave').onclick = function () {
      var name = root.querySelector('#fName').value.trim();
      if (!name) { UI.toast('先写吃了什么'); return; }
      if (!rating) { UI.toast('点几颗星吧'); return; }
      var all = reviews();
      all.push({
        id: uid(), name: name, place: root.querySelector('#fPlace').value.trim(),
        rating: rating, note: root.querySelector('#fNote').value.trim(),
        createdAt: Date.now()
      });
      if (persist(all)) {
        UI.toast('记下来了，下次还去');
        lastWinner = '';
        renderShare(root);
      } else {
        UI.toast('存不下了，删几条旧记录再试');
      }
    };
  }

  /* ---------------- 页面 ---------------- */
  function render(body) {
    root = body;
    var html = '<div class="tabs">';
    html += '<button class="tabs__btn' + (tab === 'wheel' ? ' is-on' : '') + '" data-tab="wheel">🎡 转盘</button>';
    html += '<button class="tabs__btn' + (tab === 'recipe' ? ' is-on' : '') + '" data-tab="recipe">📖 菜谱</button>';
    html += '<button class="tabs__btn' + (tab === 'share' ? ' is-on' : '') + '" data-tab="share">🍜 分享</button>';
    html += '</div><div id="foodPane"></div>';
    body.innerHTML = html;

    body.querySelector('.tabs').onclick = function (ev) {
      var b = ev.target.closest('[data-tab]');
      if (!b) return;
      tab = b.getAttribute('data-tab');
      render(body);
    };

    var pane = body.querySelector('#foodPane');
    if (tab === ' wheel'.trim()) tab = 'wheel';
    if (tab === 'wheel') {
      pane.innerHTML = '<div class="wheel-wrap">' +
        '<div class="wheel"><div class="wheel__needle"></div><canvas id="foodWheel"></canvas>' +
        '<div class="wheel__hub">吃啥</div></div>' +
        '<div class="wheel-result" id="wheelResult">' + (lastWinner ? '上次：<b>' + esc(lastWinner) + '</b>' : '不知道吃什么？转一下') + '</div>' +
        '<button class="btn-soft" id="wheelSpin" style="padding:12px 34px">转！</button>' +
        '<div class="wheel-actions" style="display:none;gap:10px">' +
        '<button class="btn-ghost" id="wheelAgain">再转一次</button>' +
        '<button class="btn-soft" id="wheelPick">就它了</button></div>' +
        '</div>';

      var canvas = pane.querySelector('#foodWheel');
      var resultEl = pane.querySelector('#wheelResult');
      drawWheel(canvas);

      pane.querySelector('#wheelSpin').onclick = function () { spin(canvas, resultEl); };
      pane.querySelector('#wheelAgain').onclick = function () { spin(canvas, resultEl); };
      pane.querySelector('#wheelPick').onclick = function () {
        if (!lastWinner) return;
        tab = 'share';
        render(body);
        UI.toast('记一笔：' + lastWinner);
      };
    } else if (tab === 'recipe') {
      renderRecipes(pane);
    } else {
      renderShare(pane);
    }
  }

  LoveUI.register('food', {
    title: '大馋猪的天堂',
    icon: '🍰',
    render: function (body) {
      if (/foodShare=1/.test(location.search)) tab = 'share';
      if (/foodRecipe=1/.test(location.search)) tab = 'recipe';
      if (/foodDemo=1/.test(location.search) && !reviews().length) {
        persist([
          { id: uid(), name: '楼下那家炒饭', place: '小区门口', rating: 5,
            note: '锅气很足，加了双份蛋。她吃了两口就说下次还来。', next: '想试试他家的腊肠炒饭', createdAt: Date.now() - 86400000 * 2 },
          { id: uid(), name: '烧烤', place: '夜市第三家', rating: 4,
            note: '烤五花很香，就是有点咸。', next: '下次让老板少放盐', createdAt: Date.now() - 86400000 * 9 }
        ]);
      }
      render(body);
    }
  });
})();
