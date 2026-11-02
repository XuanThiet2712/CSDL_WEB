/**
 * VIP: mở bài tập mẫu bằng mã kích hoạt (sau khi chuyển khoản QR) hoặc tài khoản admin.
 * Mã kích hoạt = 8 ký tự đầu của SHA-256(salt | mã đơn). Admin sinh mã cho từng mã đơn.
 */
(function () {
  'use strict';
  var CFG = window.CSDL_CONFIG || {};
  function $(s) { return document.querySelector(s); }
  function lget(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lset(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function ldel(k) { try { localStorage.removeItem(k); } catch (e) {} }
  function sget(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function sset(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
  function sdel(k) { try { sessionStorage.removeItem(k); } catch (e) {} }

  function sha256(msg) {
    function rr(n, x) { return (x >>> n) | (x << (32 - n)); }
    var s = unescape(encodeURIComponent(msg)), l = s.length, w = [], i, j;
    for (i = 0; i < l; i++) w[i >> 2] |= s.charCodeAt(i) << (24 - 8 * (i % 4));
    w[l >> 2] |= 0x80 << (24 - 8 * (l % 4)); w[(((l + 8) >> 6) + 1 << 4) - 1] = l * 8;
    var H = [], K = [], pc = 0;
    function frac(x) { return (x - Math.floor(x)) * 4294967296 | 0; }
    for (var c = 2; pc < 64; c++) { var p = 1; for (var d = 2; d * d <= c; d++) if (c % d === 0) { p = 0; break; } if (p) { if (pc < 8) H[pc] = frac(Math.pow(c, 0.5)); K[pc++] = frac(Math.pow(c, 1 / 3)); } }
    for (j = 0; j < w.length; j += 16) {
      var a = H.slice(0), W = [];
      for (i = 0; i < 64; i++) {
        if (i < 16) W[i] = w[j + i] | 0; else { var x = W[i - 15], y = W[i - 2]; W[i] = (W[i - 16] + (rr(7, x) ^ rr(18, x) ^ (x >>> 3)) + W[i - 7] + (rr(17, y) ^ rr(19, y) ^ (y >>> 10))) | 0; }
        var t1 = (a[7] + (rr(6, a[4]) ^ rr(11, a[4]) ^ rr(25, a[4])) + ((a[4] & a[5]) ^ (~a[4] & a[6])) + K[i] + W[i]) | 0;
        var t2 = ((rr(2, a[0]) ^ rr(13, a[0]) ^ rr(22, a[0])) + ((a[0] & a[1]) ^ (a[0] & a[2]) ^ (a[1] & a[2]))) | 0;
        a = [(t1 + t2) | 0, a[0], a[1], a[2], (a[3] + t1) | 0, a[4], a[5], a[6]];
      }
      for (i = 0; i < 8; i++) H[i] = (H[i] + a[i]) | 0;
    }
    return H.map(function (h) { return ('00000000' + (h >>> 0).toString(16)).slice(-8); }).join('');
  }

  /* ----- cấu hình hiệu lực (admin có thể ghi đè trên máy này) ----- */
  function ov() { try { return JSON.parse(lget('csdl_cfg_override') || '{}'); } catch (e) { return {}; } }
  function cfg() {
    var o = ov(), b = CFG.bank || {};
    return {
      price: +o.price || CFG.price || 20000,
      bankId: o.bankId !== undefined ? o.bankId : (b.bankId || ''),
      accountNo: o.accountNo !== undefined ? o.accountNo : (b.accountNo || ''),
      accountName: o.accountName !== undefined ? o.accountName : (b.accountName || ''),
      qr: o.qrData || CFG.qrImage || ''
    };
  }
  function adminHash() { return lget('csdl_admin_hash') || (CFG.admin && CFG.admin.passHash) || ''; }
  function hashPw(pw) { return sha256((CFG.salt || '') + ':' + pw); }

  /* ----- mã đơn và mã kích hoạt ----- */
  function order() {
    var o = lget('csdl_order');
    if (!o) {
      var al = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', r = '', i, b = new Uint8Array(6);
      if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(b); else for (i = 0; i < 6; i++) b[i] = Math.random() * 256;
      for (i = 0; i < 6; i++) r += al[b[i] % al.length];
      o = (CFG.memoPrefix || 'CSDL') + r; lset('csdl_order', o);
    }
    return o;
  }
  function codeFor(ord) {
    var h = sha256((CFG.salt || '') + '|' + String(ord).trim().toUpperCase()).slice(0, 8).toUpperCase();
    return h.slice(0, 4) + '-' + h.slice(4);
  }
  function norm(c) { return String(c).toUpperCase().replace(/[^A-Z0-9]/g, ''); }

  /* ----- trạng thái ----- */
  function adminToken() { return sha256((CFG.salt || '') + '|admin|' + adminHash()); }
  function isAdmin() { return sget('csdl_admin') === adminToken() || lget('csdl_admin_dev') === adminToken(); }
  function hasCode() { var c = lget('csdl_vip_code'); return !!c && norm(c) === norm(codeFor(order())); }
  function isVip() { return isAdmin() || hasCode(); }
  function apply() {
    var v = isVip();
    document.body.classList.toggle('vip', v);
    var b = $('#btn-vip'); if (b) { b.textContent = v ? (isAdmin() ? '⭐ Admin' : '⭐ VIP') : '⭐ Mở VIP'; b.classList.toggle('on', v); }
  }

  /* ----- giao diện hộp thoại ----- */
  var dlg = $('#dlg-vip');
  function show(id) {
    ['buy', 'login', 'admin', 'on'].forEach(function (v) { var e = $('#vip-' + v); if (e) e.hidden = v !== id; });
    $('#vip-title').textContent = id === 'buy' ? 'Mở VIP: bài tập mẫu' : id === 'login' ? 'Đăng nhập admin' : id === 'admin' ? 'Quản trị' : 'Tài khoản VIP';
    $('#vip-err').textContent = ''; $('#vip-login-err').textContent = '';
  }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }
  function money(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + 'đ'; }
  function copyBtn(txt) { return ' <button type="button" class="mini" data-copy="' + esc(txt) + '">Copy</button>'; }
  function renderBuy() {
    var c = cfg(), ord = order(), qr = $('#vip-qr'), info = $('#vip-info');
    $('#vip-price').textContent = money(c.price);
    var url = '';
    if (c.qr) url = c.qr;
    else if (c.bankId && c.accountNo) url = 'https://img.vietqr.io/image/' + encodeURIComponent(c.bankId) + '-' + encodeURIComponent(c.accountNo) + '-compact2.png?amount=' + c.price + '&addInfo=' + encodeURIComponent(ord) + '&accountName=' + encodeURIComponent(c.accountName);
    qr.innerHTML = url ? '<img alt="Mã QR chuyển khoản" src="' + esc(url) + '"><p class="hint">Nếu ảnh QR không hiện (cần mạng), hãy chuyển khoản thủ công theo thông tin bên cạnh.</p>' : '<p class="warn">Admin chưa cấu hình tài khoản nhận tiền hoặc ảnh QR. Đăng nhập admin để cài đặt, hoặc điền vào <code>js/core/config.js</code>.</p>';
    info.innerHTML = '<div><span>Số tiền</span><b>' + money(c.price) + '</b></div>' +
      (c.bankId ? '<div><span>Ngân hàng</span><b>' + esc(c.bankId) + '</b></div>' : '') +
      (c.accountNo ? '<div><span>Số tài khoản</span><b>' + esc(c.accountNo) + '</b>' + copyBtn(c.accountNo) + '</div>' : '') +
      (c.accountName ? '<div><span>Chủ tài khoản</span><b>' + esc(c.accountName) + '</b></div>' : '') +
      '<div><span>Nội dung CK</span><b class="memo">' + esc(ord) + '</b>' + copyBtn(ord) + '</div>';
  }
  function openDlg(view) {
    if (isAdmin()) renderAdmin(); else if (hasCode()) { $('#vip-on-msg').textContent = 'Bài tập mẫu đã được mở trên máy này.'; } else renderBuy();
    show(view || (isAdmin() ? 'admin' : hasCode() ? 'on' : 'buy'));
    if (dlg.showModal) { if (!dlg.open) dlg.showModal(); } else dlg.setAttribute('open', '');
  }
  function closeDlg() { if (dlg.close) dlg.close(); else dlg.removeAttribute('open'); }
  function renderAdmin() {
    var c = cfg();
    $('#ad-bank').value = c.bankId; $('#ad-acc').value = c.accountNo; $('#ad-name').value = c.accountName; $('#ad-price').value = c.price;
    $('#ad-out').textContent = ''; $('#ad-msg').textContent = '';
  }

  document.addEventListener('click', function (e) {
    var t = e.target;
    if (t.closest && t.closest('.vip-open')) { openDlg(); return; }
    if (t.dataset && t.dataset.copy !== undefined) { try { navigator.clipboard.writeText(t.dataset.copy); } catch (x) {} if (window.App) App.toast('Đã copy'); }
  });
  $('#btn-vip').addEventListener('click', function () { openDlg(); });
  $('#vip-close').addEventListener('click', closeDlg);
  $('#vip-to-admin').addEventListener('click', function () { show('login'); });
  $('#vip-back').addEventListener('click', function () { renderBuy(); show('buy'); });

  $('#vip-activate').addEventListener('click', function () {
    var v = norm($('#vip-code').value), ok = v && v === norm(codeFor(order()));
    if (!ok) { $('#vip-err').textContent = 'Mã kích hoạt không đúng. Kiểm tra lại, hoặc gửi biên lai kèm mã đơn ' + order() + ' cho admin.'; return; }
    lset('csdl_vip_code', codeFor(order())); apply(); $('#vip-code').value = '';
    $('#vip-on-msg').textContent = 'Kích hoạt thành công. Bài tập mẫu đã được mở.'; show('on');
    if (window.App) App.toast('Đã mở VIP');
  });
  $('#vip-code').addEventListener('keydown', function (e) { if (e.key === 'Enter') $('#vip-activate').click(); });

  $('#vip-login-go').addEventListener('click', function () {
    var u = $('#ad-user').value.trim().toLowerCase(), p = $('#ad-pass').value;
    if (u !== String((CFG.admin && CFG.admin.user) || 'admin').toLowerCase() || hashPw(p) !== adminHash()) { $('#vip-login-err').textContent = 'Sai tài khoản hoặc mật khẩu.'; return; }
    sset('csdl_admin', adminToken()); if ($('#ad-remember').checked) lset('csdl_admin_dev', adminToken());
    $('#ad-pass').value = ''; apply(); renderAdmin(); show('admin');
  });
  $('#ad-pass').addEventListener('keydown', function (e) { if (e.key === 'Enter') $('#vip-login-go').click(); });

  $('#ad-gen').addEventListener('click', function () {
    var o = $('#ad-order').value.trim().toUpperCase();
    if (!/^[A-Z0-9]{4,20}$/.test(o)) { $('#ad-out').textContent = 'Mã đơn gồm chữ và số, ví dụ ' + (CFG.memoPrefix || 'CSDL') + 'AB12CD'; return; }
    var c = codeFor(o); $('#ad-out').innerHTML = 'Mã kích hoạt cho <b>' + esc(o) + '</b>: <b class="memo">' + c + '</b>' + copyBtn(c);
  });
  $('#ad-save').addEventListener('click', function () {
    var o = ov(); o.bankId = $('#ad-bank').value.trim(); o.accountNo = $('#ad-acc').value.trim(); o.accountName = $('#ad-name').value.trim(); o.price = +$('#ad-price').value || 20000;
    lset('csdl_cfg_override', JSON.stringify(o)); $('#ad-msg').textContent = 'Đã lưu trên máy này. Để máy khác cũng thấy, bấm “Sao chép đoạn cấu hình” và dán vào config.js.';
  });
  $('#ad-qr').addEventListener('change', function () {
    var f = this.files[0]; if (!f) return;
    if (f.size > 1500000) { $('#ad-msg').textContent = 'Ảnh quá lớn (tối đa 1,5 MB).'; return; }
    var fr = new FileReader(); fr.onload = function () { var o = ov(); o.qrData = fr.result; lset('csdl_cfg_override', JSON.stringify(o)); $('#ad-msg').textContent = 'Đã dùng ảnh QR của bạn trên máy này. Để máy khác thấy, lưu ảnh vào assets/ và điền qrImage trong config.js.'; };
    fr.readAsDataURL(f);
  });
  $('#ad-qr-clear').addEventListener('click', function () { var o = ov(); delete o.qrData; lset('csdl_cfg_override', JSON.stringify(o)); $('#ad-msg').textContent = 'Đã bỏ ảnh QR tải lên.'; });
  $('#ad-snippet').addEventListener('click', function () {
    var c = cfg(), s = "bank: { bankId: '" + c.bankId + "', accountNo: '" + c.accountNo + "', accountName: '" + c.accountName + "' },\nprice: " + c.price + ",";
    try { navigator.clipboard.writeText(s); } catch (e) {} $('#ad-msg').textContent = 'Đã copy đoạn cấu hình, dán vào js/core/config.js.';
  });
  $('#ad-chpw').addEventListener('click', function () {
    var a = $('#ad-new').value, b = $('#ad-new2').value;
    if (a.length < 6) { $('#ad-msg').textContent = 'Mật khẩu mới tối thiểu 6 ký tự.'; return; }
    if (a !== b) { $('#ad-msg').textContent = 'Hai lần nhập mật khẩu chưa khớp.'; return; }
    lset('csdl_admin_hash', hashPw(a)); sset('csdl_admin', adminToken()); ldel('csdl_admin_dev'); $('#ad-new').value = ''; $('#ad-new2').value = '';
    $('#ad-msg').textContent = 'Đã đổi mật khẩu admin trên máy này. Muốn dùng được ở máy khác, đặt passHash mới trong config.js.';
  });
  function lock() { sdel('csdl_admin'); ldel('csdl_admin_dev'); ldel('csdl_vip_code'); apply(); closeDlg(); if (window.App) App.toast('Đã khoá bài tập mẫu'); }
  $('#ad-logout').addEventListener('click', lock); $('#vip-lock').addEventListener('click', lock);

  window.VIP = { sha256: sha256, codeFor: codeFor, order: order, isVip: isVip, isAdmin: isAdmin, open: openDlg };
  apply();
})();
