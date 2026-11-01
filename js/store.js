/* =====================================================
   欣陈宇宙 · 数据层
   ---------------------------------------------------------
   两种模式，自动切换：
   · 云端（Supabase）—— 填了 js/supabase-config.js 就走这个
   · 本地（server.py）—— 没填时还是原来的方式

   对外接口没变：get / set / remove / who / setWho / all / status / exportJSON / importJSON
   ===================================================== */
window.LoveStore = (function () {
  'use strict';

  var KEY = 'love.v2';
  var revs = {};
  var ready = false;
  var timers = {};
  var sb = null;
  var mode = 'local';
  var pollTimer = null;

  /* ---------------- 本地缓存 ---------------- */
  function loadAll() {
    try { var raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : {}; }
    catch (e) { return {}; }
  }
  function saveAll(data) {
    try { localStorage.setItem(KEY, JSON.stringify(data)); return true; }
    catch (e) { return false; }
  }
  function get(key, fallback) {
    var all = loadAll();
    return all[key] === undefined ? fallback : all[key];
  }
  function set(key, value) {
    var all = loadAll();
    all[key] = value;
    var ok = saveAll(all);
    push(key);
    return ok;
  }
  function remove(key) {
    var all = loadAll();
    delete all[key];
    var ok = saveAll(all);
    push(key);
    return ok;
  }
  function who() { return get('who', 'her'); }
  function setWho(w) { set('who', w); }
  function exportJSON() { return JSON.stringify(loadAll(), null, 2); }

  function importJSON(text) {
    try {
      var data = JSON.parse(text);
      if (typeof data !== 'object' || !data) return false;
      saveAll(data);
      Object.keys(data).forEach(function (k) { push(k); });
      return true;
    } catch (e) { return false; }
  }

  function notify() {
    try { document.dispatchEvent(new CustomEvent('love:remote')); } catch (e) {}
  }
  function toast(msg) {
    if (window.LoveUI) LoveUI.toast(msg);
  }
  function toLogin() {
    if (location.pathname.indexOf('login') < 0) location.href = 'login.html';
  }

  /* ---------------- 云端：Supabase ---------------- */
  function cloudConfigured() {
    var c = window.SUPABASE_CONFIG || {};
    return !!(c.url && c.anonKey);
  }

  function cloudBoot() {
    sb = window.supabase.createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
    });
    return sb.auth.getSession().then(function (res) {
      var session = res && res.data && res.data.session;
      if (!session) {
        if (location.pathname.indexOf('login') < 0) { toLogin(); }
        return Promise.reject(new Error('no session'));
      }
      return cloudLoad();
    });
  }

  function cloudLoad() {
    return sb.from('state').select('k,v,rev').then(function (res) {
      if (res.error) throw res.error;
      var all = loadAll();
      var changed = false;
      (res.data || []).forEach(function (row) {
        var r = Number(row.rev) || 0;
        if (r > (revs[row.k] || 0)) {
          revs[row.k] = r;
          all[row.k] = row.v;
          changed = true;
        }
      });
      if (changed) { saveAll(all); notify(); }
      return true;
    });
  }

  function cloudPush(key, retried) {
    var all = loadAll();
    var value = all[key];
    sb.rpc('put_state', { p_key: key, p_value: value === undefined ? null : value, p_base_rev: revs[key] || 0 })
      .then(function (res) {
        if (!res.error) {
          revs[key] = Number(res.data) || (revs[key] || 0) + 1;
          return;
        }
        var msg = String(res.error.message || '');
        var m = msg.match(/conflict:(\d+)/);
        if (m) {
          revs[key] = Number(m[1]);
          if (!retried) cloudPush(key, true);
          else toast('对方刚也改了，已按你这边的保存');
          return;
        }
        toast('同步失败：' + msg.slice(0, 40));
      });
  }

  /* ---------------- 本地：server.py ---------------- */
  function apiGet(retried) {
    return fetch('/api/state', { cache: 'no-store' }).then(function (r) {
      if (r.status === 401) {
        if (retried) { toLogin(); return null; }
        return tryDevice().then(function (ok) {
          if (!ok) { toLogin(); return null; }
          return apiGet(true);
        });
      }
      return r.ok ? r.json() : null;
    }).catch(function () { return null; });
  }

  function tryDevice() {
    var dev = null;
    try { dev = localStorage.getItem('love.device'); } catch (e) {}
    if (!dev) return Promise.resolve(false);
    return fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device: dev })
    }).then(function (r) {
      if (!r.ok) { try { localStorage.removeItem('love.device'); } catch (e) {} return false; }
      return r.json().then(function (d) {
        if (d && d.device) { try { localStorage.setItem('love.device', d.device); } catch (e) {} }
        return true;
      });
    }).catch(function () { return false; });
  }

  function applyRemote(st) {
    if (!st || !st.data) return false;
    var all = loadAll();
    var changed = false;
    Object.keys(st.revs || {}).forEach(function (k) {
      var r = st.revs[k] || 0;
      if (r > (revs[k] || 0)) { revs[k] = r; all[k] = st.data[k]; changed = true; }
    });
    if (changed) { saveAll(all); notify(); }
    return changed;
  }

  function localPush(key, retried) {
    var all = loadAll();
    fetch('/api/state', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: key, value: all[key], baseRev: revs[key] || 0 })
    }).then(function (r) {
      if (r.status === 401) { toLogin(); return null; }
      if (r.status === 409) {
        return r.json().then(function (d) {
          revs[key] = d.rev || 0;
          if (!retried) localPush(key, true);
          else notify();
          toast('对方刚也改了，已按你这边的保存');
          return null;
        });
      }
      return r.ok ? r.json() : null;
    }).then(function (d) {
      if (d && d.revs && d.revs[key] !== undefined) revs[key] = d.revs[key];
    }).catch(function () {});
  }

  /* ---------------- 统一入口 ---------------- */
  function push(key, retried) {
    if (!ready) return;
    clearTimeout(timers[key]);
    timers[key] = setTimeout(function () {
      if (mode === 'cloud') cloudPush(key, retried);
      else localPush(key, retried);
    }, mode === 'cloud' ? 120 : 350);
  }

  function poll() {
    if (mode === 'cloud') { cloudLoad().catch(function () {}); return; }
    apiGet().then(function (st) { if (st) applyRemote(st); });
  }

  function boot() {
    if (cloudConfigured() && window.supabase) {
      mode = 'cloud';
      cloudBoot().then(function () {
        ready = true;
        pollTimer = setInterval(poll, 10000);
        try { document.dispatchEvent(new CustomEvent('love:ready', { detail: { cloud: true } })); } catch (e) {}
      }).catch(function () {});
      return;
    }
    /* 本地模式 */
    apiGet().then(function (st) {
      if (!st) return;
      var local = loadAll();
      var serverEmpty = !st.data || Object.keys(st.data).length === 0;
      if (serverEmpty) {
        ready = true;
        Object.keys(local).forEach(function (k) { revs[k] = 0; push(k); });
      } else {
        revs = {};
        applyRemote(st);
        ready = true;
      }
      pollTimer = setInterval(poll, 8000);
      try { document.dispatchEvent(new CustomEvent('love:ready', { detail: { remote: true } })); } catch (e) {}
    });
  }

  setTimeout(boot, 0);

  function status() {
    var max = 0;
    Object.keys(revs).forEach(function (k) { max = Math.max(max, revs[k] || 0); });
    return { remote: mode === 'cloud' || ready, rev: max, mode: mode };
  }

  return {
    get: get, set: set, remove: remove,
    who: who, setWho: setWho,
    exportJSON: exportJSON, importJSON: importJSON,
    all: loadAll, status: status, poll: poll,
    isCloud: function () { return mode === 'cloud'; },
    client: function () { return sb; },
    refresh: poll
  };
})();
