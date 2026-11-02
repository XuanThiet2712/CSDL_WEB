/**
 * Đại số quan hệ – bộ phân tích và thực thi biểu thức trên dữ liệu mẫu (không phụ thuộc giao diện).
 * Hỗ trợ: σ π ρ, × ⋈ (tự nhiên / theta) ⟕ ⟖ ⟗, ∪ ∩ − ÷, γ (COUNT SUM AVG MIN MAX), gán ←.
 * Đầu vào là chuỗi đã chuẩn hoá: chỉ số dưới nằm giữa hai ký tự đánh dấu \uE000 … \uE001.
 */
(function (root) {
  'use strict';
  var SO = '\uE000', SC = '\uE001';
  function E(m) { var e = new Error(m); e.ra = 1; return e; }
  function mk(cols, rows) { var s = {}, o = []; rows.forEach(function (r) { var k = JSON.stringify(r); if (!s[k]) { s[k] = 1; o.push(r); } }); return { cols: cols, rows: o }; }
  function lab(c) { return c.r ? c.r + '.' + c.n : c.n; }
  function find(rel, name) {
    var q = null, n = name, d = name.lastIndexOf('.');
    if (d > 0) { q = name.slice(0, d); n = name.slice(d + 1); }
    var m = []; rel.cols.forEach(function (c, i) { if (c.n === n && (q === null || c.r === q)) m.push(i); });
    if (!m.length) throw E('Không có thuộc tính “' + name + '”. Hiện có: ' + rel.cols.map(lab).join(', ') + '.');
    if (m.length > 1) throw E('Thuộc tính “' + name + '” bị mơ hồ vì có ở nhiều quan hệ. Hãy ghi rõ, ví dụ ' + lab(rel.cols[m[0]]) + ' hoặc ' + lab(rel.cols[m[1]]) + '.');
    return m[0];
  }
  function req(rel, name) { return { cols: rel.cols.map(function (c) { return { n: c.n, r: name }; }), rows: rel.rows }; }

  /* ---------- tách từ ---------- */
  var OPS = '←→⋈⟕⟖⟗×∪∩−÷σπρ∧∨¬=≠≤≥<>γℑ𝒢*';
  function tokenize(s) {
    var t = [], a = Array.from(s), i = 0, j;
    while (i < a.length) {
      var c = a[i];
      if (/\s/.test(c)) { i++; continue; }
      if (c === SO) { t.push({ k: 'SO' }); i++; continue; }
      if (c === SC) { t.push({ k: 'SC' }); i++; continue; }
      if (c === '\uE002' || c === '\uE003') { i++; continue; }
      if (/[0-9]/.test(c)) { j = i; while (j < a.length && /[0-9.]/.test(a[j])) j++; t.push({ k: 'num', v: parseFloat(a.slice(i, j).join('')) }); i = j; continue; }
      if (c === "'" || c === '"') { j = i + 1; while (j < a.length && a[j] !== c) j++; if (j >= a.length) throw E('Chuỗi thiếu dấu đóng nháy ' + c); t.push({ k: 'str', v: a.slice(i + 1, j).join('') }); i = j + 1; continue; }
      if (OPS.indexOf(c) >= 0 && c !== '-') { t.push({ k: 'op', v: (c === 'γ' || c === 'ℑ' || c === '𝒢') ? 'G' : c }); i++; continue; }
      if (/[\p{L}_]/u.test(c)) { j = i; while (j < a.length && /[\p{L}\p{N}_.]/u.test(a[j])) j++; t.push({ k: 'id', v: a.slice(i, j).join('') }); i = j; continue; }
      if (c === '(' || c === ')' || c === ',' || c === ';') { t.push({ k: c }); i++; continue; }
      if (c === '-') { t.push({ k: 'op', v: '−' }); i++; continue; }
      if (OPS.indexOf(c) >= 0) { t.push({ k: 'op', v: (c === 'γ' || c === 'ℑ' || c === '𝒢') ? 'G' : c }); i++; continue; }
      throw E('Ký tự không nhận ra: “' + c + '”');
    }
    return t;
  }
  function splitTop(a, sep) { var out = [[]], d = 0; a.forEach(function (x) { if (x.k === '(') d++; if (x.k === ')') d--; if (d === 0 && x.k === sep) out.push([]); else out[out.length - 1].push(x); }); return out; }
  function matchEnd(a, i) { var d = 0; for (var k = i; k < a.length; k++) { if (a[k].k === '(') d++; else if (a[k].k === ')') { d--; if (!d) return k; } } return -1; }
  function strip(a) { while (a.length > 1 && a[0].k === '(' && matchEnd(a, 0) === a.length - 1) a = a.slice(1, -1); return a; }

  /* ---------- điều kiện ---------- */
  function parseCond(toks) {
    var i = 0;
    function isOp(v) { return toks[i] && toks[i].k === 'op' && toks[i].v === v; }
    function or() { var l = and(); while (isOp('∨')) { i++; l = ['or', l, and()]; } return l; }
    function and() { var l = not(); while (isOp('∧')) { i++; l = ['and', l, not()]; } return l; }
    function not() { if (isOp('¬')) { i++; return ['not', not()]; } return cmp(); }
    function operand() { var x = toks[i++]; if (!x) throw E('Điều kiện bị thiếu vế so sánh'); if (x.k === 'num' || x.k === 'str') return ['v', x.v]; if (x.k === 'id') return ['c', x.v]; throw E('Điều kiện có ký hiệu không hợp lệ'); }
    function cmp() {
      if (toks[i] && toks[i].k === '(') { i++; var e = or(); if (!toks[i] || toks[i].k !== ')') throw E('Điều kiện thiếu dấu “)”'); i++; return e; }
      var a = operand(), o = toks[i];
      if (!o || o.k !== 'op' || '=≠≤≥<>'.indexOf(o.v) < 0) throw E('Điều kiện thiếu phép so sánh (=, ≠, <, >, ≤, ≥)');
      i++; return ['cmp', o.v, a, operand()];
    }
    var e = or(); if (i < toks.length) throw E('Điều kiện có ký hiệu thừa'); return e;
  }
  function cmpv(op, x, y) {
    if (!(typeof x === 'number' && typeof y === 'number')) { x = String(x); y = String(y); }
    return op === '=' ? x === y : op === '≠' ? x !== y : op === '<' ? x < y : op === '>' ? x > y : op === '≤' ? x <= y : x >= y;
  }
  function compile(e, rel) {
    if (e[0] === 'or') { var a = compile(e[1], rel), b = compile(e[2], rel); return function (r) { return a(r) || b(r); }; }
    if (e[0] === 'and') { var a2 = compile(e[1], rel), b2 = compile(e[2], rel); return function (r) { return a2(r) && b2(r); }; }
    if (e[0] === 'not') { var n = compile(e[1], rel); return function (r) { return !n(r); }; }
    function val(x) { if (x[0] === 'v') return function () { return x[1]; }; var i = find(rel, x[1]); return function (r) { return r[i]; }; }
    var l = val(e[2]), rr = val(e[3]), op = e[1];
    return function (r) { return cmpv(op, l(r), rr(r)); };
  }
  function select(rel, toks) { var f = compile(parseCond(toks), rel); return { cols: rel.cols, rows: rel.rows.filter(f) }; }

  /* ---------- các phép toán ---------- */
  function project(rel, toks) {
    var items = splitTop(strip(toks), ',').filter(function (x) { return x.length; }), cols = [], get = [], seen = {};
    if (!items.length) throw E('Phép chiếu π chưa có thuộc tính nào');
    items.forEach(function (it) {
      var a = it[0], alias = null;
      if (it.length === 3 && it[1].k === 'op' && it[1].v === '→' && it[2].k === 'id') alias = it[2].v;
      else if (it.length !== 1) throw E('Một mục trong phép chiếu không hợp lệ (dạng đúng: thuộc tính, hoặc giá trị → tên)');
      if (a.k === 'id') { var i = find(rel, a.v); cols.push({ n: alias || rel.cols[i].n, r: null }); get.push(function (r) { return r[i]; }); }
      else if (a.k === 'num' || a.k === 'str') { if (!alias) throw E('Hằng số trong phép chiếu cần có tên cột, ví dụ 0 → SoPhim'); cols.push({ n: alias, r: null }); get.push(function () { return a.v; }); }
      else throw E('Một mục trong phép chiếu không hợp lệ');
    });
    cols.forEach(function (c) { if (seen[c.n]) throw E('Phép chiếu tạo hai cột cùng tên “' + c.n + '”. Hãy dùng → để đặt tên khác.'); seen[c.n] = 1; });
    return mk(cols, rel.rows.map(function (r) { return get.map(function (f) { return f(r); }); }));
  }
  function rename(rel, toks) {
    var a = strip(toks);
    if (!a.length || a[0].k !== 'id') throw E('ρ cần dạng ρ_{(TênMới(thuộc tính, …))}(R)');
    var nm = a[0].v, cols = rel.cols.map(function (c) { return { n: c.n, r: nm }; });
    if (a.length > 1) {
      if (a[1].k !== '(') throw E('ρ cần dạng ρ_{(TênMới(thuộc tính, …))}(R)');
      var names = splitTop(a.slice(2, -1), ',').map(function (x) { return x[0] && x[0].v; });
      if (names.length !== cols.length) throw E('Số tên thuộc tính mới (' + names.length + ') khác số cột của quan hệ (' + cols.length + ')');
      cols = cols.map(function (c, i) { return { n: names[i], r: nm }; });
    }
    return { cols: cols, rows: rel.rows };
  }
  function parseAggs(toks) {
    return splitTop(toks, ',').filter(function (x) { return x.length; }).map(function (it) {
      if (it.length < 4 || it[0].k !== 'id' || it[1].k !== '(') throw E('Hàm thống kê phải có dạng COUNT(thuộc tính) → TênMới');
      var close = matchEnd(it, 1), f = it[0].v.toUpperCase(), arg = it.slice(2, close), as = null;
      if (['COUNT', 'SUM', 'AVG', 'MIN', 'MAX'].indexOf(f) < 0) throw E('Không có hàm thống kê “' + it[0].v + '” (dùng COUNT, SUM, AVG, MIN, MAX)');
      if (close < 0 || arg.length !== 1) throw E('Hàm ' + f + ' cần đúng một thuộc tính');
      var rest = it.slice(close + 1);
      if (rest.length) { if (rest.length === 2 && rest[0].k === 'op' && rest[0].v === '→' && rest[1].k === 'id') as = rest[1].v; else throw E('Sau hàm thống kê chỉ được viết → TênMới'); }
      return { f: f, a: arg[0].k === 'op' ? '*' : arg[0].v, as: as };
    });
  }
  function aggv(g, rs) {
    if (g.f === 'COUNT') return rs.length;
    if (!rs.length) return null;
    var v = rs.map(function (r) { return r[g.i]; });
    if (g.f === 'MIN') return v.reduce(function (a, b) { return cmpv('<', a, b) ? a : b; });
    if (g.f === 'MAX') return v.reduce(function (a, b) { return cmpv('>', a, b) ? a : b; });
    var s = v.reduce(function (a, b) { return a + Number(b); }, 0);
    return g.f === 'SUM' ? s : s / v.length;
  }
  function group(rel, gattrs, aggs) {
    var gi = gattrs.map(function (a) { return find(rel, a); }), cols = gi.map(function (i) { return { n: rel.cols[i].n, r: null }; });
    var ag = aggs.map(function (g) { cols.push({ n: g.as || (g.f + '(' + g.a + ')'), r: null }); return { f: g.f, i: g.a === '*' ? -1 : find(rel, g.a) }; });
    var gr = {}, order = [];
    rel.rows.forEach(function (r) { var k = JSON.stringify(gi.map(function (i) { return r[i]; })); if (!gr[k]) { gr[k] = []; order.push(k); } gr[k].push(r); });
    if (!gi.length && !order.length) { gr['[]'] = []; order.push('[]'); }
    return mk(cols, order.map(function (k) { var rs = gr[k], base = rs.length ? gi.map(function (i) { return rs[0][i]; }) : []; return base.concat(ag.map(function (g) { return aggv(g, rs); })); }));
  }
  function prod(a, b) {
    var cols = a.cols.concat(b.cols), seen = {};
    cols.forEach(function (c) { var k = lab(c); if (seen[k]) throw E('Hai quan hệ có thuộc tính “' + k + '” trùng cả tên lẫn quan hệ. Hãy dùng ρ để đổi tên một bên (ví dụ khi nối bảng với chính nó).'); seen[k] = 1; });
    var rows = []; a.rows.forEach(function (x) { b.rows.forEach(function (y) { rows.push(x.concat(y)); }); });
    return { cols: cols, rows: rows };
  }
  function natjoin(a, b, kind) {
    var common = []; a.cols.forEach(function (c, i) { b.cols.forEach(function (d, j) { if (c.n === d.n) common.push([i, j]); }); });
    if (!common.length) return prod(a, b);
    var bj = b.cols.map(function (_, j) { return j; }).filter(function (j) { return !common.some(function (c) { return c[1] === j; }); });
    var cols = a.cols.concat(bj.map(function (j) { return b.cols[j]; })), rows = [], hit = {};
    a.rows.forEach(function (ra) {
      var m = false;
      b.rows.forEach(function (rb, k) { if (common.every(function (c) { return ra[c[0]] === rb[c[1]]; })) { rows.push(ra.concat(bj.map(function (j) { return rb[j]; }))); m = true; hit[k] = 1; } });
      if (!m && (kind === 'L' || kind === 'F')) rows.push(ra.concat(bj.map(function () { return null; })));
    });
    if (kind === 'R' || kind === 'F') b.rows.forEach(function (rb, k) {
      if (!hit[k]) rows.push(a.cols.map(function (_, i) { var cm = common.filter(function (x) { return x[0] === i; })[0]; return cm ? rb[cm[1]] : null; }).concat(bj.map(function (j) { return rb[j]; })));
    });
    return mk(cols, rows);
  }
  function setop(a, b, op) {
    if (a.cols.length !== b.cols.length) throw E('Hai quan hệ phải có cùng số thuộc tính để dùng ' + op + ' (' + a.cols.length + ' ≠ ' + b.cols.length + ')');
    var an = a.cols.map(function (c) { return c.n; }).sort().join(), bn = b.cols.map(function (c) { return c.n; }).sort().join(), map = b.cols.map(function (_, i) { return i; });
    if (an === bn) map = a.cols.map(function (c) { return b.cols.findIndex(function (d) { return d.n === c.n; }); });
    var br = b.rows.map(function (r) { return map.map(function (i) { return r[i]; }); }), bk = {}, ak = {};
    br.forEach(function (r) { bk[JSON.stringify(r)] = 1; }); a.rows.forEach(function (r) { ak[JSON.stringify(r)] = 1; });
    var rows = op === '∪' ? a.rows.concat(br) : op === '∩' ? a.rows.filter(function (r) { return bk[JSON.stringify(r)]; }) : a.rows.filter(function (r) { return !bk[JSON.stringify(r)]; });
    return mk(a.cols.map(function (c) { return { n: c.n, r: null }; }), rows);
  }
  function divide(a, b) {
    var bi = b.cols.map(function (c) { var i = a.cols.findIndex(function (x) { return x.n === c.n; }); if (i < 0) throw E('Phép chia: thuộc tính “' + c.n + '” của quan hệ chia không có trong quan hệ bị chia'); return i; });
    var xi = a.cols.map(function (_, i) { return i; }).filter(function (i) { return bi.indexOf(i) < 0; });
    if (!xi.length) throw E('Phép chia: quan hệ bị chia phải có thêm thuộc tính ngoài các thuộc tính của quan hệ chia');
    var have = {}, xs = {}, xl = [];
    a.rows.forEach(function (r) { var x = JSON.stringify(xi.map(function (i) { return r[i]; })); have[x + '|' + JSON.stringify(bi.map(function (i) { return r[i]; }))] = 1; if (!xs[x]) { xs[x] = 1; xl.push(xi.map(function (i) { return r[i]; })); } });
    return mk(xi.map(function (i) { return { n: a.cols[i].n, r: null }; }), xl.filter(function (x) { return b.rows.every(function (y) { return have[JSON.stringify(x) + '|' + JSON.stringify(y)]; }); }));
  }

  /* ---------- bộ phân tích cú pháp, thực thi ngay khi phân tích ---------- */
  function statement(t, env) {
    var p = 0, name = null;
    function isK(k) { return t[p] && t[p].k === k; }
    function isOp(v) { return t[p] && t[p].k === 'op' && t[p].v === v; }
    function expect(k, msg) { if (!isK(k)) throw E(msg); return t[p++]; }
    function subs(sym) {
      if (!isK('SO')) throw E('Sau ' + sym + ' cần phần chỉ số dưới, ví dụ ' + sym + '_{(…)}(R). Dùng nút ' + sym + ' để chèn sẵn chỉ số dưới.');
      p++; var d = 1, a = [];
      while (p < t.length) { if (t[p].k === 'SO') d++; else if (t[p].k === 'SC') { d--; if (!d) break; } a.push(t[p]); p++; }
      if (p >= t.length) throw E('Chỉ số dưới thiếu phần kết thúc');
      p++; return a;
    }
    function lookup(n) {
      if (env[n]) return env[n];
      var k = Object.keys(env).filter(function (x) { return x.toLowerCase() === n.toLowerCase(); })[0];
      if (k) return env[k];
      throw E('Chưa có quan hệ “' + n + '”. Các quan hệ đang có: ' + Object.keys(env).join(', ') + '. (Quan hệ trung gian phải được tạo ở dòng phía trên.)');
    }
    function paren(after) {
      if (isK('(')) { p++; var r = set(); expect(')', 'Thiếu dấu “)” để đóng biểu thức sau ' + after); return r; }
      return unary();
    }
    function groupSpec() {
      var aggT, gpre = [];
      if (isK('SO')) { var s = subs('γ'); var parts = splitTop(strip(s), ';'); if (parts.length > 1) { gpre = splitTop(parts[0], ',').map(function (x) { return x[0] && x[0].v; }).filter(Boolean); aggT = parts[1]; } else aggT = parts[0]; }
      else if (isK('(')) { var e = matchEnd(t, p); if (e < 0) throw E('Thiếu dấu “)” trong danh sách hàm thống kê'); aggT = t.slice(p + 1, e); p = e + 1; }
      else throw E('Sau γ cần dấu “(” mở danh sách hàm thống kê. Ví dụ: MaPH γ (COUNT(MaDV) → SoDV)(THAMGIA)');
      return { g: gpre, a: parseAggs(aggT) };
    }
    function unary() {
      var tk = t[p];
      if (tk && tk.k === 'op' && (tk.v === 'σ' || tk.v === 'π' || tk.v === 'ρ')) {
        p++; var s = subs(tk.v), r = paren(tk.v);
        return tk.v === 'σ' ? select(r, s) : tk.v === 'π' ? project(r, s) : rename(r, s);
      }
      if (tk && tk.k === 'op' && tk.v === 'G') { p++; var gs = groupSpec(); return group(paren('γ'), gs.g, gs.a); }
      if (tk && tk.k === 'id') {
        var q = p, at = [];
        while (t[q] && t[q].k === 'id') { at.push(t[q].v); q++; if (t[q] && t[q].k === ',') { q++; continue; } break; }
        if (at.length && t[q] && t[q].k === 'op' && t[q].v === 'G') { p = q + 1; var g2 = groupSpec(); return group(paren('γ'), at.concat(g2.g), g2.a); }
      }
      return primary();
    }
    function primary() {
      if (isK('(')) { p++; var r = set(); expect(')', 'Thiếu dấu “)” đóng biểu thức'); return r; }
      if (isK('id')) return lookup(t[p++].v);
      var x = t[p]; throw E(x ? 'Không hiểu ký hiệu “' + (x.v !== undefined ? x.v : x.k) + '” ở vị trí này' : 'Biểu thức chưa hoàn chỉnh (thiếu vế phải?)');
    }
    function prodE() {
      var l = unary();
      for (;;) {
        var o = t[p]; if (!o || o.k !== 'op' || '×⋈⟕⟖⟗÷'.indexOf(o.v) < 0) return l;
        p++;
        if (o.v === '⋈' && isK('SO')) { var c = subs('⋈'), r = unary(), pr = prod(l, r); l = select(pr, c); }
        else { var r2 = unary(); l = o.v === '×' ? prod(l, r2) : o.v === '÷' ? divide(l, r2) : natjoin(l, r2, o.v === '⋈' ? 'N' : o.v === '⟕' ? 'L' : o.v === '⟖' ? 'R' : 'F'); }
      }
    }
    function set() {
      var l = prodE();
      for (;;) { var o = t[p]; if (!o || o.k !== 'op' || '∪∩−'.indexOf(o.v) < 0) return l; p++; l = setop(l, prodE(), o.v); }
    }
    if (t[0] && t[0].k === 'id' && t[1] && t[1].k === 'op' && t[1].v === '←') { name = t[0].v; p = 2; }
    if (p >= t.length) throw E('Chưa có biểu thức ở vế phải của ←');
    var rel = set();
    if (p < t.length) { var x = t[p]; throw E('Còn ký hiệu thừa ở cuối: “' + (x.v !== undefined ? x.v : x.k) + '”. Kiểm tra lại dấu ngoặc.'); }
    if (name) { rel = req(rel, name); env[name] = rel; }
    return { rel: rel, name: name };
  }

  function balanced(s) { var a = 0, b = 0; for (var i = 0; i < s.length; i++) { var c = s[i]; if (c === '(') a++; else if (c === ')') a--; else if (c === SO) b++; else if (c === SC) b--; } return a === 0 && b === 0; }
  var HDR = /^(C[âa]u|Bài)\s*\d+/i, SYM = /[←σπρ⋈⟕⟖⟗×∪∩−÷γℑ𝒢()]/;
  function isHeader(ln) { return HDR.test(ln) && !SYM.test(ln.replace(/^(C[âa]u|Bài)\s*\d+\s*[:.]?/i, '')); }
  function run(text, db) {
    var env = {}; Object.keys(db).forEach(function (k) { env[k] = db[k]; });
    var lines = text.replace(/\r/g, '').split('\n'), secs = [{ title: '', items: [] }], i = 0;
    while (i < lines.length) {
      var ln = lines[i].trim();
      if (!ln || /^(\/\/|#|--)/.test(ln)) { i++; continue; }
      if (HDR.test(ln) && !SYM.test(ln.replace(/^(C[âa]u|Bài)\s*\d+\s*[:.]?/i, ''))) { secs.push({ title: ln, items: [] }); i++; continue; }
      var stmt = ln, j = i;
      while (!balanced(stmt) && j + 1 < lines.length && j - i < 4) { j++; stmt += ' ' + lines[j].trim(); }
      if (!balanced(stmt)) { stmt = ln; j = i; }
      if (!SYM.test(stmt) && !/^[\p{L}_][\p{L}\p{N}_]*$/u.test(stmt)) { i = j + 1; continue; }   // dòng chữ giải thích: bỏ qua
      var it = { line: i + 1, text: stmt.replace(/[\uE000\uE002]/g, '_{').replace(/[\uE001\uE003]/g, '}') };
      try { var r = statement(tokenize(stmt), env); it.rel = r.rel; it.name = r.name; }
      catch (e) { it.error = e.ra ? e.message : 'Lỗi không xác định: ' + e.message; }
      secs[secs.length - 1].items.push(it); i = j + 1;
    }
    return { sections: secs, env: env };
  }

  /* ---------- dữ liệu mẫu: Tên(cột, cột) rồi các dòng giá trị phân tách bằng dấu phẩy hoặc Tab ---------- */
  function parseData(text) {
    var db = {}, errs = [], cur = null;
    text.replace(/\r/g, '').split('\n').forEach(function (raw, n) {
      var ln = raw.trim();
      if (!ln) { cur = null; return; }
      if (/^(--|#|\/\/)/.test(ln)) return;
      var h = /^([\p{L}_][\p{L}\p{N}_]*)\s*\(([^)]*)\)\s*$/u.exec(ln);
      if (h) {
        var cols = h[2].split(',').map(function (x) { return x.trim(); }).filter(Boolean);
        if (!cols.length) { errs.push('Dòng ' + (n + 1) + ': bảng “' + h[1] + '” chưa có cột nào'); cur = null; return; }
        cur = db[h[1]] = { cols: cols.map(function (c) { return { n: c, r: h[1] }; }), rows: [] }; return;
      }
      if (!cur) { errs.push('Dòng ' + (n + 1) + ': giá trị nằm ngoài bảng. Mỗi bảng bắt đầu bằng dòng Tên(cột1, cột2, …)'); return; }
      var parts = ln.indexOf('\t') >= 0 ? ln.split('\t') : ln.match(/("[^"]*"|'[^']*'|[^,])+/g) || [];
      var vals = parts.map(function (v) { v = v.trim(); if (/^(["']).*\1$/.test(v)) return v.slice(1, -1); return /^-?\d+(\.\d+)?$/.test(v) ? parseFloat(v) : v; });
      if (vals.length !== cur.cols.length) { errs.push('Dòng ' + (n + 1) + ': có ' + vals.length + ' giá trị nhưng bảng “' + cur.cols[0].r + '” có ' + cur.cols.length + ' cột'); return; }
      cur.rows.push(vals);
    });
    Object.keys(db).forEach(function (k) { db[k] = mk(db[k].cols, db[k].rows); });
    return { db: db, errors: errs };
  }
  root.RAEngine = { run: run, parseData: parseData, tokenize: tokenize, isHeader: isHeader };
  if (typeof module !== 'undefined') module.exports = root.RAEngine;
})(typeof window !== 'undefined' ? window : globalThis);
