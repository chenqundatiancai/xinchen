/* =====================================================
   欣陈宇宙 · 模块容器
   ---------------------------------------------------------
   每个板块（日记/足迹/梦想…）注册进来，点卡片就打开对应的面板。
   ===================================================== */
window.LoveUI = (function () {
  'use strict';
  var registry = {};
  var lastKey = null;
  var sheet, sheetTitle, sheetIcon, sheetBody;

  function el(id) { return document.getElementById(id); }

  function ensure() {
    if (sheet) return;
    sheet = el('sheet');
    sheetTitle = el('sheetTitle');
    sheetIcon = el('sheetIcon');
    sheetBody = el('sheetBody');
    if (!sheet) return;

    sheet.addEventListener('click', function (e) {
      if (e.target.hasAttribute && e.target.hasAttribute('data-sheet-close')) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && sheet && sheet.getAttribute('aria-hidden') === 'false') close();
    });
  }

  function register(key, mod) { registry[key] = mod; }

  function openSheet(opts) {
    ensure();
    if (!sheet) return;
    sheetTitle.textContent = opts.title || '';
    sheetIcon.textContent = opts.icon || '✧';
    sheetBody.innerHTML = '';
    sheet.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    sheetBody.scrollTop = 0;
    if (typeof opts.render === 'function') opts.render(sheetBody);
    var closeBtn = sheet.querySelector('.sheet__close');
    if (closeBtn) closeBtn.focus();
  }

  function close() {
    ensure();
    if (!sheet) return;
    sheet.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function open(key) {
    var mod = registry[key];
    if (!mod) return false;
    lastKey = key;
    openSheet({
      title: mod.title,
      icon: mod.icon,
      render: function (body) { mod.render(body); }
    });
    return true;
  }

  var toastTimer = null;
  function toast(message) {
    var node = document.getElementById('loveToast');
    if (!node) {
      node = document.createElement('div');
      node.id = 'loveToast';
      node.className = 'toast';
      document.body.appendChild(node);
    }
    node.textContent = message;
    node.classList.add('is-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { node.classList.remove('is-show'); }, 2200);
  }

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

  /* 数据同步后刷新当前面板 */
  function refresh() {
    if (!lastKey || !registry[lastKey] || !sheet) return;
    if (sheet.getAttribute('aria-hidden') !== 'false') return;
    registry[lastKey].render(sheetBody);
  }

  /* 照片：云端模式传 Supabase Storage，本地模式传 server.py，都失败则退回 dataURL */
  function dataUrlToBlob(dataUrl) {
    var m = /^data:([^;]+);base64,(.*)$/.exec(dataUrl || '');
    if (!m) return null;
    var bin = atob(m[2]);
    var arr = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return { blob: new Blob([arr], { type: m[1] }), mime: m[1] };
  }

  function savePhotoCloud(dataUrl) {
    var store = window.LoveStore;
    var sb = store && store.client && store.client();
    var parsed = dataUrlToBlob(dataUrl);
    if (!sb || !parsed) return Promise.resolve(dataUrl);
    var ext = parsed.mime.indexOf('png') >= 0 ? 'png' : (parsed.mime.indexOf('webp') >= 0 ? 'webp' : 'jpg');
    var name = (window.crypto && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2)) + '.' + ext;
    return sb.storage.from('photos').upload(name, parsed.blob, { contentType: parsed.mime, upsert: false })
      .then(function (res) {
        if (res.error) throw res.error;
        /* 记录一笔，用来统计用量；失败不影响上传 */
        sb.from('photos').insert({ path: name, mime: parsed.mime, size: parsed.blob.size }).then(function () {}, function () {});
        return sb.storage.from('photos').createSignedUrl(name, 60 * 60 * 24 * 365);
      })
      .then(function (res) {
        if (res.error) throw res.error;
        return res.data.signedUrl;
      })
      .catch(function () { toast('照片上传失败，先存本地了'); return dataUrl; });
  }

  function savePhoto(dataUrl) {
    if (window.LoveStore && window.LoveStore.isCloud && window.LoveStore.isCloud()) {
      return savePhotoCloud(dataUrl);
    }
    return fetch('/api/photo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: dataUrl })
    }).then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { return (d && d.url) ? d.url : dataUrl; })
      .catch(function () { return dataUrl; });
  }

  return { register: register, open: open, openSheet: openSheet, close: close, toast: toast, compressImage: compressImage, refresh: refresh, savePhoto: savePhoto };
})();
