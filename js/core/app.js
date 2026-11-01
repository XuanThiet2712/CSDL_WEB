/* CSDL Studio – điều phối chung: tab, giao diện sáng/tối, thông báo, sao lưu/khôi phục */
(function () {
  'use strict';
  var BACKUP_KEYS = ['relational_algebra_editor_html_v2', 'relational_algebra_font_size_pt', 'phu_thuoc_ham_v1', 'phu_thuoc_ham_v1_auto'];
  var toastEl, toastT;
  function store(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function load(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }

  var App = window.App = {
    tab: 'ra',
    setTab: function (t, silent) {
      if (t !== 'ra' && t !== 'fd') t = 'ra';
      App.tab = t;
      document.querySelectorAll('.tab').forEach(function (b) {
        var on = b.dataset.tab === t; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1;
      });
      document.querySelectorAll('.panel').forEach(function (p) { p.hidden = p.id !== 'p-' + t; });
      if (!silent) { store('csdl_tab', t); try { history.replaceState(null, '', '#' + t); } catch (e) {} }
      document.dispatchEvent(new CustomEvent('app:tab', { detail: t }));
    },
    toast: function (msg) {
      if (!toastEl) { toastEl = document.createElement('div'); toastEl.id = 'toast'; toastEl.setAttribute('role', 'status'); document.body.appendChild(toastEl); }
      toastEl.textContent = msg; toastEl.classList.add('show');
      clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('show'); }, 1800);
    },
    toggleTheme: function () {
      var r = document.documentElement, dark = r.dataset.theme ? r.dataset.theme === 'dark' : !!(window.matchMedia && matchMedia('(prefers-color-scheme:dark)').matches);
      r.dataset.theme = dark ? 'light' : 'dark'; store('csdl_theme', r.dataset.theme);
    },
    backup: function () {
      var o = { app: 'csdl-studio', version: 1, savedAt: new Date().toISOString(), data: {} };
      BACKUP_KEYS.forEach(function (k) { var v = load(k); if (v !== null) o.data[k] = v; });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify(o, null, 2)], { type: 'application/json' }));
      a.download = 'csdl-studio-backup-' + new Date().toISOString().slice(0, 10) + '.json';
      a.click(); URL.revokeObjectURL(a.href); App.toast('Đã tạo file sao lưu');
    },
    restore: function (file) {
      var fr = new FileReader();
      fr.onload = function () {
        try {
          var o = JSON.parse(fr.result);
          if (!o || o.app !== 'csdl-studio' || !o.data) throw new Error('File không đúng định dạng');
          if (!confirm('Khôi phục sẽ ghi đè bài làm hiện tại trong trình duyệt. Tiếp tục?')) return;
          Object.keys(o.data).forEach(function (k) { if (BACKUP_KEYS.indexOf(k) >= 0) store(k, o.data[k]); });
          location.reload();
        } catch (e) { alert('Không khôi phục được: ' + e.message); }
      };
      fr.readAsText(file);
    }
  };

  document.querySelectorAll('.tab').forEach(function (b, i, all) {
    b.addEventListener('click', function () { App.setTab(b.dataset.tab); });
    b.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var n = all[(i + (e.key === 'ArrowRight' ? 1 : all.length - 1)) % all.length]; n.focus(); App.setTab(n.dataset.tab);
    });
  });
  document.getElementById('btn-theme').addEventListener('click', App.toggleTheme);
  document.getElementById('btn-backup').addEventListener('click', App.backup);
  var fileIn = document.getElementById('file-restore');
  document.getElementById('btn-restore').addEventListener('click', function () { fileIn.click(); });
  fileIn.addEventListener('change', function () { if (fileIn.files[0]) App.restore(fileIn.files[0]); fileIn.value = ''; });
  // Ctrl+Alt+1 / Ctrl+Alt+2: chuyển tab nhanh
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey && e.altKey && (e.code === 'Digit1' || e.code === 'Digit2')) { e.preventDefault(); App.setTab(e.code === 'Digit1' ? 'ra' : 'fd'); }
  });
  var h = location.hash.replace('#', '');
  App.setTab(h === 'ra' || h === 'fd' ? h : (load('csdl_tab') || 'ra'), true);
})();
