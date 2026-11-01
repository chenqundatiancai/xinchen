/* =====================================================
   背景音乐
   ---------------------------------------------------------
   - 一进首页就播放（登录后立刻有）
   - 底部控制栏：上一首 / 播放暂停 / 下一首 / 音量 / 静音
   - 歌单在 config.js 的 music.tracks 里
   ===================================================== */
window.LoveMusic = (function () {
  'use strict';

  var CFG = window.LOVE_CONFIG || {};
  var M = CFG.music || {};
  var store = window.LoveStore;
  var tracks = (M.tracks && M.tracks.length) ? M.tracks : [
    { title: '黄昏', artist: '环境音', src: 'assets/music/dusk-loop.wav' }
  ];

  var audio = new Audio();
  var idx = 0;
  var muted = false;
  var target = 0.38;
  var bar = null;
  var started = false;
  var blockedOnce = false;

  audio.loop = false;
  audio.preload = 'auto';
  audio.volume = 0;

  function readVol() {
    var v = store ? store.get('musicVolume', 38) : 38;
    v = Number(v);
    if (isNaN(v)) v = 38;
    return Math.min(100, Math.max(0, v));
  }

  function loadTrack(i, autoplay) {
    idx = (i + tracks.length) % tracks.length;
    audio.src = tracks[idx].src;
    paint();
    if (autoplay) play();
  }

  function fadeTo(v) {
    var from = audio.volume;
    var t0 = performance.now();
    function step(now) {
      var p = Math.min(1, (now - t0) / 1200);
      audio.volume = Math.max(0, Math.min(1, from + (v - from) * p));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function play() {
    var p = audio.play();
    if (p && p.catch) {
      p.catch(function () {
        if (!blockedOnce && window.LoveUI) {
          LoveUI.toast('点一下播放键，音乐就来了');
          blockedOnce = true;
        }
        paint();
      });
    }
    fadeTo(muted ? 0 : target);
    paint();
  }

  function pause() {
    audio.pause();
    paint();
  }

  function toggle() {
    if (audio.paused) play(); else pause();
    saveOn();
  }

  function saveOn() {
    if (store) store.set('musicOn', !audio.paused);
  }

  function paint() {
    if (!bar) return;
    var t = tracks[idx] || {};
    var title = bar.querySelector('#musicTitle');
    var artist = bar.querySelector('#musicArtist');
    if (title) title.textContent = t.title || '背景音乐';
    if (artist) artist.textContent = t.artist || '';
    var main = bar.querySelector('[data-act="toggle"]');
    if (main) main.textContent = audio.paused ? '▶' : '❚❚';
    var muteBtn = bar.querySelector('[data-act="mute"]');
    if (muteBtn) muteBtn.textContent = (muted || target === 0) ? '🔇' : '🔊';
    var vol = bar.querySelector('#musicVol');
    if (vol && document.activeElement !== vol) vol.value = String(muted ? 0 : Math.round(target * 100));
  }

  function buildBar() {
    if (bar) return bar;
    bar = document.createElement('div');
    bar.className = 'musicbar';
    bar.id = 'musicBar';
    bar.innerHTML =
      '<button class="musicbar__btn" data-act="prev" aria-label="上一首">⏮</button>' +
      '<button class="musicbar__btn musicbar__btn--main" data-act="toggle" aria-label="播放/暂停">▶</button>' +
      '<button class="musicbar__btn" data-act="next" aria-label="下一首">⏭</button>' +
      '<div class="musicbar__info"><b id="musicTitle"></b><span id="musicArtist"></span></div>' +
      '<input id="musicVol" class="musicbar__vol" type="range" min="0" max="100" step="1" value="38" aria-label="音量">' +
      '<button class="musicbar__btn" data-act="mute" aria-label="静音">🔊</button>';
    document.body.appendChild(bar);

    bar.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-act]');
      if (!b) return;
      var act = b.getAttribute('data-act');
      if (act === 'toggle') toggle();
      if (act === 'next') { loadTrack(idx + 1, true); saveOn(); }
      if (act === 'prev') { loadTrack(idx - 1, true); saveOn(); }
      if (act === 'mute') {
        muted = !muted;
        audio.muted = muted;
        paint();
      }
    });

    var vol = bar.querySelector('#musicVol');
    vol.addEventListener('input', function () {
      var v = Number(this.value) / 100;
      muted = false;
      audio.muted = false;
      target = v;
      audio.volume = v;
      if (store) store.set('musicVolume', Math.round(v * 100));
      paint();
      if (v > 0 && audio.paused) play();
    });

    audio.addEventListener('ended', function () {
      if (tracks.length > 1) loadTrack(idx + 1, true);
      else { audio.currentTime = 0; play(); }
    });
    audio.addEventListener('play', paint);
    audio.addEventListener('pause', paint);
    return bar;
  }

  /* 一进页面就调用 */
  function enter() {
    if (!buildBar()) return;
    document.body.classList.add('music-on');
    if (started) return;
    started = true;

    var savedOn = store ? store.get('musicOn', true) : true;
    var savedIdx = store ? store.get('musicIndex', 0) : 0;
    idx = Math.min(tracks.length - 1, Math.max(0, Number(savedIdx) || 0));
    target = readVol() / 100;
    loadTrack(idx, false);

    if (M.autoplay === false || !savedOn) { paint(); return; }
    play();
  }

  return { enter: enter, play: play, pause: pause, toggle: toggle, next: function () { loadTrack(idx + 1, true); } };
})();
