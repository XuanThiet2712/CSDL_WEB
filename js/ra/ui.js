/** Đại số quan hệ – giao diện chạy biểu thức, dữ liệu mẫu, đề bài và ví dụ */
(function () {
  'use strict';
  function $(s) { return document.querySelector(s); }
  var ed = $('#editor');
  if (!ed || !window.RAEngine || !window.DSQH) return;
  var KEY = 'csdl_ra_data', dataEl = $('#ra-data'), db = {}, timer;
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function fmt(v) { if (v === null) return '<i class="nul">NULL</i>'; if (typeof v === 'number' && v % 1) return esc(+v.toFixed(4)); return esc(v); }
  function table(rel, max) {
    max = max || 200;
    var h = '<div class="tw"><table><thead><tr>' + rel.cols.map(function (c) { return '<th>' + esc(c.n) + '</th>'; }).join('') + '</tr></thead><tbody>';
    if (!rel.rows.length) h += '<tr><td class="empty" colspan="' + rel.cols.length + '">(không có bộ nào)</td></tr>';
    rel.rows.slice(0, max).forEach(function (r) { h += '<tr>' + r.map(function (v) { return '<td>' + fmt(v) + '</td>'; }).join('') + '</tr>'; });
    return h + '</tbody></table>' + (rel.rows.length > max ? '<p class="hint">Chỉ hiện ' + max + ' bộ đầu.</p>' : '') + '</div>';
  }
  /* ----- dữ liệu mẫu ----- */
  function loadDB() { var r = RAEngine.parseData(dataEl.value); db = r.db; return r; }
  function refreshData() {
    var r = loadDB(), names = Object.keys(r.db);
    try { localStorage.setItem(KEY, dataEl.value); } catch (e) {}
    $('#ra-data-status').innerHTML = r.errors.length ? '<ul class="rerr">' + r.errors.map(function (e) { return '<li>' + esc(e) + '</li>'; }).join('') + '</ul>' : '<p class="hint">Đã đọc ' + names.length + ' bảng.</p>';
    $('#ra-data-preview').innerHTML = names.map(function (n) { return '<details><summary><b>' + esc(n) + '</b> (' + r.db[n].rows.length + ' bộ)</summary>' + table(r.db[n], 50) + '</details>'; }).join('');
  }
  var saved = null; try { saved = localStorage.getItem(KEY); } catch (e) {}
  dataEl.value = saved || window.RA_DEFAULT_DATA; refreshData();
  dataEl.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(refreshData, 350); });
  $('#ra-data-reset').addEventListener('click', function () { if (confirm('Đặt lại về dữ liệu mẫu Lab04? Dữ liệu bạn đã sửa sẽ mất.')) { dataEl.value = window.RA_DEFAULT_DATA; refreshData(); } });

  /* ----- các màn hình ----- */
  function view(v) {
    document.querySelectorAll('#p-ra .rview').forEach(function (e) { e.hidden = e.id !== 'rv-' + v; });
    document.querySelectorAll('#p-ra .mini-tabs button').forEach(function (b) { b.classList.toggle('on', b.dataset.rv === v); });
    if (v === 'edit') ed.focus();
  }
  document.querySelectorAll('#p-ra .mini-tabs button').forEach(function (b) { b.addEventListener('click', function () { view(b.dataset.rv); }); });

  /* ----- chạy ----- */
  function caretRange() {
    var s = getSelection(); if (s.rangeCount && ed.contains(s.anchorNode)) return s.getRangeAt(0);
    return (typeof lastSavedRange !== 'undefined' && lastSavedRange && ed.contains(lastSavedRange.commonAncestorContainer)) ? lastSavedRange : null;
  }
  function render(secs) {
    var ok = 0, bad = 0, h = secs.map(function (s) {
      if (!s.items.length) return '';
      return '<div class="rsec">' + (s.title ? '<h4>' + esc(s.title) + '</h4>' : '') + s.items.map(function (it) {
        var head = '<div class="ritem"><div class="rhead"><code>' + esc(it.text) + '</code></div>';
        if (it.error) { bad++; return head + '<p class="rerr">⚠ Dòng ' + it.line + ': ' + esc(it.error) + '</p></div>'; }
        ok++; return head + '<div class="rmeta">' + (it.name ? esc(it.name) + ' = ' : '') + it.rel.rows.length + ' bộ, ' + it.rel.cols.length + ' cột</div>' + table(it.rel) + '</div>';
      }).join('') + '</div>';
    }).join('');
    return { html: h, ok: ok, bad: bad };
  }
  function run(scope) {
    loadDB();
    var r = caretRange(), caret = r ? { node: r.startContainer, offset: r.startOffset } : null;
    var raw = DSQH.extract(ed, true, caret), res = RAEngine.run(DSQH.prep(raw), db), secs = res.sections, k = 0;
    if (scope === 'cau' && caret && caret.pos != null) k = raw.slice(0, caret.pos).split('\n').filter(RAEngine.isHeader).length;
    var show = scope === 'cau' ? [secs[Math.min(k, secs.length - 1)]] : secs, o = render(show);
    $('#ra-out').innerHTML = o.html || '<p class="hint">Chưa có biểu thức nào để chạy trong ' + (scope === 'cau' ? 'câu này' : 'bài') + '. Viết biểu thức, ví dụ: π_{(MaDV)}(DIENVIEN)</p>';
    $('#ra-res-info').textContent = (o.ok + o.bad) ? '· ' + o.ok + ' chạy được' + (o.bad ? ', ' + o.bad + ' lỗi' : '') : '';
    $('#ra-res').open = true;
    var t = show[0] && show[0].title; $('#ra-res-title').textContent = scope === 'cau' ? (t || 'Phần đầu bài') : 'Cả bài';
  }
  window.RA = { run: run };
  document.addEventListener('keydown', function (e) {
    if (window.App && App.tab !== 'ra') return;
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && (e.target === ed || ed.contains(e.target))) { e.preventDefault(); run(e.shiftKey ? 'all' : 'cau'); }
  }, true);

  /* ----- đề bài ----- */
  var brief = $('#ra-brief');
  function setBrief(n) { brief.hidden = false; brief.innerHTML = '<b>Câu ' + n + ':</b> ' + esc(window.RA_DE[n - 1]) + ' <button type="button" class="mini" id="ra-brief-x" aria-label="Ẩn đề">×</button>'; $('#ra-brief-x').onclick = function () { brief.hidden = true; }; }
  $('#ra-de').innerHTML = window.RA_DE.map(function (t, i) { return '<li><button type="button" class="chip" data-de="' + (i + 1) + '">Câu ' + (i + 1) + '</button> ' + esc(t) + '</li>'; }).join('');
  $('#ra-de').addEventListener('click', function (e) {
    var n = +(e.target.dataset && e.target.dataset.de); if (!n) return;
    view('edit'); setBrief(n);
    var has = DSQH.extract(ed, true).split('\n').some(function (l) { return new RegExp('^C[âa]u\\s*' + n + '\\b', 'i').test(l.trim()); });
    if (!has) DSQH.insertHtml((ed.textContent.trim() ? '\n' : '') + 'Câu ' + n + '\n');
  });

  /* ----- ví dụ có lời giải (VIP) ----- */
  var out = $('#ra-learn-out');
  $('#rv-learn').addEventListener('click', function (e) {
    var id = e.target.dataset && e.target.dataset.raex; if (!id) return;
    var ex = window.RA_EXAMPLES[id]; if (!ex) return;
    if (e.target.dataset.act === 'ins') { view('edit'); DSQH.insertPlain(ex.s); return; }
    loadDB(); var res = RAEngine.run(DSQH.prep(ex.s), db), o = render(res.sections);
    out.hidden = false; out.innerHTML = '<h4>' + esc(ex.t) + '</h4><pre class="src">' + esc(ex.s) + '</pre>' + o.html;
    out.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });
  view('edit');
})();
