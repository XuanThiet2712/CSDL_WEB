/**
 * Đại số quan hệ – công cụ bổ sung: dán tự chuẩn hoá, nút Chuẩn hoá, Tìm & Thay,
 * Copy dòng / LaTeX, phím tắt và gõ tắt ký hiệu.
 */
(function (root) {
  'use strict';

  /* ---------- PHẦN 1: chuẩn hoá chuỗi (không đụng DOM) ---------- */
  var SUB_O = '\uE000', SUB_C = '\uE001', SUP_O = '\uE002', SUP_C = '\uE003';
  var OPS = 'σπρ⋈⟕⟖⟗ℑγ';           // ký hiệu có thể mang chỉ số dưới
  var UNARY = 'σπρ';                // luôn kèm điều kiện/thuộc tính ngay sau
  var JOINS = '⋈⟕⟖⟗';

  var GREEK = {};                   // 𝜎 𝜋 𝜌 (Word Equation) → σ π ρ
  [0x1D6C2, 0x1D6FC, 0x1D736, 0x1D770, 0x1D7AA].forEach(function (a) {
    GREEK[a + 15] = 'π'; GREEK[a + 16] = 'ρ'; GREEK[a + 18] = 'σ';
  });
  function fixMathGreek(s) {
    return Array.from(s).map(function (c) { return GREEK[c.codePointAt(0)] || c; }).join('');
  }

  function matchClose(s, i) {
    var open = s[i], close = open === '(' ? ')' : '}', d = 0;
    for (var k = i; k < s.length; k++) {
      if (s[k] === open) d++;
      else if (s[k] === close) { d--; if (d === 0) return k; }
    }
    return -1;
  }
  function hasTopLevelCompare(inner) {   // có = < > ≤ ≥ ≠ ở mức ngoài cùng không?
    var d = 0;
    for (var i = 0; i < inner.length; i++) {
      var c = inner[i];
      if (c === '(') d++;
      else if (c === ')') d--;
      else if (d === 0 && '=<>≤≥≠'.indexOf(c) >= 0) return true;
    }
    return false;
  }

  function normalizeSymbols(s) {
    s = s.replace(/[\u200B-\u200D\uFEFF\u2060\u00AD]/g, '')
         .replace(/[\u00A0\u2009\u202F]/g, ' ')
         .replace(/\r\n?/g, '\n');
    s = fixMathGreek(s);
    s = s.replace(/[“”„‟]/g, '"').replace(/[‘’‚‛]/g, "'");
    s = s.replace(/[Σς]/g, 'σ').replace(/Π/g, 'π').replace(/Ρ/g, 'ρ');
    s = s.replace(/⨝/g, '⋈').replace(/[–—]/g, '−');
    s = s.replace(/<=|≦|⩽/g, '≤')
         .replace(/>=|≧|⩾/g, '≥')
         .replace(/!=|<>/g, '≠')
         .replace(/&&|⋀/g, '∧')
         .replace(/\|\||⋁/g, '∨')
         .replace(/<-+|⟵|⇐/g, '←')
         .replace(/-+>|⟶|⇒/g, '→');
    return s;
  }

  /*  σ(…)(R) · π(…)(R) · ρ(…)(R) · R ⋈(điều kiện) S  → nhóm ngoặc đầu tiên thành chỉ số dưới
      Ngoài ra  σ_{…}  σ_(…)  cũng được chuyển.  */
  function convertSubscripts(s) {
    var out = '', i = 0;
    while (i < s.length) {
      var ch = s[i];
      if (OPS.indexOf(ch) >= 0) {
        var j = i + 1;
        while (s[j] === ' ' || s[j] === '\t') j++;
        if (s[j] === '_') {
          var k = j + 1;
          if (s[k] === '{' || s[k] === '(') {
            var c = matchClose(s, k);
            if (c > 0) {
              var body = s.slice(k + 1, c), tb = body.trim();
              var whole = s[k] === '{' && tb.charAt(0) === '(' && matchClose(tb, 0) === tb.length - 1;
              out += ch + SUB_O + (whole ? tb : '(' + body + ')') + SUB_C;
              i = c + 1; continue;
            }
          }
        } else if (s[j] === '(') {
          var c2 = matchClose(s, j);
          if (c2 > 0) {
            var inner = s.slice(j + 1, c2);
            var isSub = UNARY.indexOf(ch) >= 0 ||
                        (JOINS.indexOf(ch) >= 0 && hasTopLevelCompare(inner));
            if (isSub) {
              out += ch + SUB_O + '(' + inner + ')' + SUB_C;
              i = c2 + 1; continue;
            }
          }
        }
      }
      out += ch; i++;
    }
    return out;
  }

  function tidy(s) {
    s = s.replace(/[ \t]*([∧∨≤≥≠=<>])[ \t]*/g, ' $1 ');
    s = s.replace(/[ \t]*,[ \t]*(?=[^\s\d])/g, ', ').replace(/[ \t]+,[ \t]*(?=\d)/g, ', ');
    s = s.replace(/[ \t]{2,}/g, ' ').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n');
    s = s.replace(/([\uE000\uE002])[ \t]+/g, '$1').replace(/[ \t]+([\uE001\uE003])/g, '$1');
    s = s.replace(new RegExp('([' + OPS + '])[ \\t]+([\\uE000])', 'g'), '$1$2');
    s = s.replace(/([\uE001\uE003])[ \t]+\(/g, '$1(');
    return s.replace(/^\s+/, '').replace(/\s+$/, '');
  }

  function toHtml(s) {
    var out = '', mode = null, depth = 0;
    for (var i = 0; i < s.length; i++) {
      var c = s[i];
      if (c === SUB_O || c === SUP_O) {
        var m = c === SUB_O ? 'sub' : 'sup';
        if (depth === 0) { out += '<' + m + '>'; mode = m; depth = 1; }
        else if (mode === m) depth++;
      } else if (c === SUB_C || c === SUP_C) {
        var m2 = c === SUB_C ? 'sub' : 'sup';
        if (depth > 0 && mode === m2) { depth--; if (depth === 0) { out += '</' + m2 + '>'; mode = null; } }
      } else {
        out += c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : c;
      }
    }
    if (depth > 0) out += '</' + mode + '>';
    return out.replace(/<(sub|sup)><\/\1>/g, '');
  }

  function cleanPaste(s) { return toHtml(tidy(convertSubscripts(normalizeSymbols(s)))); }
  function cleanPlain(text) { return cleanPaste(text.replace(/[\uE000-\uE003]/g, '')); }

  /* Duyệt DOM → chuỗi có đánh dấu sub/sup, bỏ mọi định dạng khác.
     keepWs=true: giữ nguyên xuống dòng trong text node (dùng cho chính editor). */
  function extractFromNode(root, keepWs, caret) {
    var out = '';
    function atLineStart() { return out === '' || out.charAt(out.length - 1) === '\n'; }
    function walk(n) {
      if (n.nodeType === 3) {
        var t = n.nodeValue.replace(/[\uE000-\uE003]/g, '');
        if (!keepWs) {
          t = t.replace(/\s+/g, ' ');
          if (atLineStart()) t = t.replace(/^ /, '');
        }
        if (caret && n === caret.node) caret.pos = out.length + Math.min(caret.offset, t.length);
        out += t; return;
      }
      if (n.nodeType !== 1) return;
      var tag = n.tagName.toUpperCase();
      if (/^(STYLE|SCRIPT|TEMPLATE|XML|HEAD|TITLE|META|LINK|NOSCRIPT)$/.test(tag)) return;
      if (tag === 'BR') { out += '\n'; return; }
      var va = (n.style && n.style.verticalAlign) || '';
      var kind = null;
      if (tag === 'SUB' || /:SUB$/.test(tag) || va === 'sub') kind = 'sub';
      else if (tag === 'SUP' || /:SUP$/.test(tag) || va === 'super') kind = 'sup';
      var block = /^(P|DIV|LI|TR|TABLE|H[1-6]|BLOCKQUOTE|PRE|UL|OL)$/.test(tag);
      if (block && !atLineStart()) out += '\n';
      if (kind) out += kind === 'sub' ? SUB_O : SUP_O;
      walkChildren(n);
      if (kind) out += kind === 'sub' ? SUB_C : SUP_C;
      if (tag === 'TD' || tag === 'TH') out += ' ';
      if (block && !atLineStart()) out += '\n';
    }
    function walkChildren(parent) {
      var i = 0;
      for (var c = parent.firstChild; c; c = c.nextSibling, i++) {
        if (caret && parent === caret.node && i === caret.offset) caret.pos = out.length;
        walk(c);
      }
      if (caret && parent === caret.node && i === caret.offset) caret.pos = out.length;
    }
    walkChildren(root);
    return out;
  }
  function extractFromHtml(html) {
    return extractFromNode(new DOMParser().parseFromString(html, 'text/html').body, false);
  }

  root.DSQH = { prep: function (s) { return convertSubscripts(normalizeSymbols(s)); }, extract: extractFromNode, cleanPlain: cleanPlain };

  if (typeof document === 'undefined') {            // chạy test bằng node
    root.__dsqh = { cleanPlain: cleanPlain, cleanPaste: cleanPaste };
    if (typeof module !== 'undefined') module.exports = root.__dsqh;
    return;
  }

  /* ---------- PHẦN 2: gắn vào editor ---------- */
  function init() {
    var ed = document.getElementById('editor');
    if (!ed) return;

    function inEditor(t) { return t === ed || (t && t.nodeType && ed.contains(t)); }

    function insertHtml(html) {
      ed.focus();
      var sel = getSelection();
      if (!sel.rangeCount || !ed.contains(sel.anchorNode)) {
        var r0 = document.createRange(); r0.selectNodeContents(ed); r0.collapse(false);
        sel.removeAllRanges(); sel.addRange(r0);
      }
      var ok = false;
      try { ok = document.execCommand('insertHTML', false, html); } catch (e) {}
      if (!ok) {
        var r = sel.getRangeAt(0); r.deleteContents();
        var t = document.createElement('template'); t.innerHTML = html;
        var last = t.content.lastChild; r.insertNode(t.content);
        if (last) { r.setStartAfter(last); r.collapse(true); sel.removeAllRanges(); sel.addRange(r); }
      }
    }
    function esc(t) { return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
    function insertText(txt) {
      ed.focus();
      if (!document.execCommand('insertText', false, txt)) insertHtml(esc(txt));
    }
    var MARK = '<span id="dsqh-caret">\u200B</span>';
    function gotoMarker() {
      var m = document.getElementById('dsqh-caret'); if (!m) return;
      var r = document.createRange(); r.setStartBefore(m); r.collapse(true);
      var sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
      m.parentNode.removeChild(m);
    }
    function insertTemplate(sym) { insertHtml(sym + '<sub>(' + MARK + ')</sub>'); gotoMarker(); }
    function insertFn(name) { insertHtml(name + '(' + MARK + ')'); gotoMarker(); }

    root.DSQH.insertHtml = insertHtml;
    root.DSQH.insertPlain = function (s) { insertHtml(cleanPlain(s) + '\n'); };

    /* ---- Dán: tự chuẩn hoá ---- */
    document.addEventListener('paste', function (e) {
      if (!inEditor(e.target) || !e.clipboardData) return;
      var html = e.clipboardData.getData('text/html');
      var text = e.clipboardData.getData('text/plain');
      if (!html && !text) return;
      e.preventDefault(); e.stopImmediatePropagation();
      var result = '';
      if (html) { try { result = cleanPaste(extractFromHtml(html)); } catch (err) { result = ''; } }
      if (!result && text) result = cleanPlain(text);
      if (result) insertHtml(result);
    }, true);

    /* ---- Nút "Chuẩn hoá": sửa lại toàn bộ nội dung đang có (Ctrl+Z để hoàn tác) ---- */
    function normalizeAll() {
      var raw = extractFromNode(ed, true);
      if (!raw.trim()) return;
      var html = cleanPaste(raw);
      ed.focus();
      document.execCommand('selectAll');
      insertHtml(html);
    }
    var bar = document.querySelector('.action-buttons');
    if (bar) {
      var nb = document.createElement('button');
      nb.type = 'button'; nb.textContent = 'Chuẩn hoá';
      nb.title = 'Tự sửa toàn bộ nội dung về dạng chuẩn (Alt+Q)';
      nb.addEventListener('click', normalizeAll);
      bar.appendChild(nb);
      var hb = document.createElement('button');
      hb.type = 'button'; hb.textContent = '⌨ Phím tắt';
      hb.addEventListener('click', function () { toggleHelp(true); });
      bar.appendChild(hb);
    }

    /* ---- Tìm & Thay ---- */
    var fp, fIn, rIn, caseCb, reCb, statEl, undoBtn, snapshot = null, cur = null;
    var hasHL = typeof CSS !== 'undefined' && CSS.highlights && typeof Highlight !== 'undefined';
    if (hasHL) {
      var hs = document.createElement('style');
      hs.textContent = '::highlight(dsqh-find){background:#fde68a;color:#000;}::highlight(dsqh-cur){background:#f59e0b;color:#000;}';
      document.head.appendChild(hs);
    }
    function setStat(t) { if (statEl) statEl.textContent = t || ''; }
    function regexParts() {
      var q = fIn.value; if (!q) return null;
      var src = reCb.checked ? q : q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      var fl = caseCb.checked ? '' : 'i';
      try { return { g: new RegExp(src, 'g' + fl), one: new RegExp(src, fl), full: new RegExp('^(?:' + src + ')$', fl) }; }
      catch (e) { setStat('Biểu thức regex không hợp lệ'); return null; }
    }
    function allMatches(re) {
      var res = [], w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT, null), n, m;
      while ((n = w.nextNode())) {
        var t = n.nodeValue; re.lastIndex = 0;
        while ((m = re.exec(t))) {
          if (m[0] === '') { re.lastIndex++; continue; }
          var r = document.createRange();
          r.setStart(n, m.index); r.setEnd(n, m.index + m[0].length);
          res.push(r);
        }
      }
      return res;
    }
    function setHL(list, current) {
      if (!hasHL) return;
      CSS.highlights.set('dsqh-find', new Highlight(...list));
      if (current) CSS.highlights.set('dsqh-cur', new Highlight(current)); else CSS.highlights.delete('dsqh-cur');
    }
    function refresh() {
      var p = regexParts();
      if (!p) { setHL([], null); if (!fIn.value) setStat(''); return; }
      var list = allMatches(p.g);
      setHL(list, null);
      setStat(list.length ? list.length + ' kết quả' : 'Không tìm thấy');
    }
    function go(dir) {
      var p = regexParts(); if (!p) return;
      var list = allMatches(p.g);
      if (!list.length) { setHL([], null); setStat('Không tìm thấy'); return; }
      var pick = null, i;
      if (cur && cur.startContainer.isConnected) {
        if (dir > 0) {
          for (i = 0; i < list.length; i++)
            if (cur.compareBoundaryPoints(Range.END_TO_START, list[i]) <= 0) { pick = list[i]; break; }
        } else {
          for (i = list.length - 1; i >= 0; i--)
            if (cur.compareBoundaryPoints(Range.START_TO_END, list[i]) >= 0) { pick = list[i]; break; }
        }
      }
      if (!pick) pick = dir > 0 ? list[0] : list[list.length - 1];
      cur = pick.cloneRange();
      setHL(list, cur);
      var sel = getSelection(); sel.removeAllRanges(); sel.addRange(pick.cloneRange());
      var el = pick.startContainer.parentElement; if (el && el.scrollIntoView) el.scrollIntoView({ block: 'center', inline: 'nearest' });
      var idx = 0; for (i = 0; i < list.length; i++) if (list[i].compareBoundaryPoints(Range.START_TO_START, pick) === 0) { idx = i; break; }
      setStat((idx + 1) + ' / ' + list.length);
    }
    function replaceOne() {
      var p = regexParts(); if (!p) return;
      if (cur && cur.startContainer.isConnected && !cur.collapsed && p.full.test(cur.toString())) {
        var txt = cur.toString();
        var rep = reCb.checked ? txt.replace(p.one, rIn.value) : rIn.value;
        ed.focus();
        var sel = getSelection(); sel.removeAllRanges(); sel.addRange(cur);
        if (rep === '') document.execCommand('delete'); else document.execCommand('insertText', false, rep);
        if (sel.rangeCount) { var r = sel.getRangeAt(0).cloneRange(); r.collapse(false); cur = r; }
      }
      go(1);
      fIn.focus();
    }
    function replaceAll() {
      var p = regexParts(); if (!p) return;
      var count = allMatches(p.g).length;
      if (!count) { setStat('Không tìm thấy'); return; }
      snapshot = ed.innerHTML;
      var nodes = [], w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT, null), n;
      while ((n = w.nextNode())) nodes.push(n);
      var repl = reCb.checked ? rIn.value : function () { return rIn.value; };
      nodes.forEach(function (nd) {
        var t = nd.nodeValue, nt = t.replace(p.g, repl);
        if (nt !== t) nd.nodeValue = nt;
      });
      cur = null; setHL([], null);
      undoBtn.disabled = false;
      setStat('Đã thay ' + count + ' chỗ');
    }
    function undoReplaceAll() {
      if (snapshot === null) return;
      ed.innerHTML = snapshot; snapshot = null; undoBtn.disabled = true; cur = null; refresh();
    }
    function buildFind() {
      fp = document.createElement('div');
      fp.style.cssText = 'position:fixed;top:84px;right:28px;width:350px;background:var(--surface);color:var(--text);border:1px solid var(--border);border-radius:12px;box-shadow:var(--shadow);padding:14px;z-index:9998;display:none;font:14px/1.45 var(--ui)';
      fp.innerHTML =
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><b>Tìm &amp; Thay</b>' +
        '<button type="button" data-a="close" style="padding:2px 9px">×</button></div>' +
        '<input id="dsqh-find-in" placeholder="Tìm…" style="width:100%;padding:7px;border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:8px;font:inherit;margin-bottom:6px">' +
        '<input id="dsqh-repl-in" placeholder="Thay bằng…" style="width:100%;padding:7px;border:1px solid var(--border);background:var(--surface);color:var(--text);border-radius:8px;font:inherit;margin-bottom:8px">' +
        '<label style="display:block"><input type="checkbox" id="dsqh-case"> Phân biệt hoa/thường</label>' +
        '<label style="display:block;margin-bottom:8px"><input type="checkbox" id="dsqh-re"> Biểu thức chính quy (regex)</label>' +
        '<div style="display:flex;flex-wrap:wrap;gap:6px">' +
        '<button type="button" data-a="prev">◀ Trước</button><button type="button" data-a="next">Tiếp ▶</button>' +
        '<button type="button" data-a="one">Thay</button><button type="button" data-a="all">Thay tất cả</button>' +
        '<button type="button" data-a="undo" disabled>Hoàn tác thay tất cả</button></div>' +
        '<div id="dsqh-stat" style="margin-top:8px;min-height:20px;font-size:13px"></div>';
      document.body.appendChild(fp);
      fIn = fp.querySelector('#dsqh-find-in'); rIn = fp.querySelector('#dsqh-repl-in');
      caseCb = fp.querySelector('#dsqh-case'); reCb = fp.querySelector('#dsqh-re');
      statEl = fp.querySelector('#dsqh-stat'); undoBtn = fp.querySelector('[data-a="undo"]');
      fp.addEventListener('click', function (e) {
        var a = e.target.getAttribute && e.target.getAttribute('data-a'); if (!a) return;
        if (a === 'close') closeFind(); else if (a === 'next') go(1); else if (a === 'prev') go(-1);
        else if (a === 'one') replaceOne(); else if (a === 'all') replaceAll(); else if (a === 'undo') undoReplaceAll();
      });
      fIn.addEventListener('input', function () { cur = null; refresh(); });
      caseCb.addEventListener('change', function () { cur = null; refresh(); });
      reCb.addEventListener('change', function () { cur = null; refresh(); });
      fIn.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); go(e.shiftKey ? -1 : 1); }
      });
      rIn.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); replaceOne(); }
      });
      ed.addEventListener('mousedown', function () { cur = null; });
    }
    function openFind() {
      if (!fp) buildFind();
      var s = getSelection();
      var t = (s.rangeCount && !s.isCollapsed && ed.contains(s.anchorNode)) ? s.toString() : '';
      if (t && t.indexOf('\n') < 0) fIn.value = t;
      fp.style.display = 'block';
      fIn.focus(); fIn.select(); refresh();
    }
    function closeFind() {
      if (!fp) return;
      fp.style.display = 'none';
      if (hasHL) { CSS.highlights.delete('dsqh-find'); CSS.highlights.delete('dsqh-cur'); }
      cur = null; ed.focus();
    }
    function findOpen() { return fp && fp.style.display !== 'none'; }
    var bar2 = document.querySelector('.action-buttons');
    if (bar2) {
      var fb = document.createElement('button');
      fb.type = 'button'; fb.textContent = 'Tìm & Thay'; fb.title = 'Tìm và thay ký tự (Ctrl+H)';
      fb.addEventListener('click', openFind);
      bar2.appendChild(fb);
    }

    /* ---- Copy cả dòng / Copy sạch ---- */
    var toastEl, toastT, ownCopy = false;
    function toast(msg) {
      if (!toastEl) {
        toastEl = document.createElement('div');
        toastEl.style.cssText = 'position:fixed;left:50%;bottom:40px;transform:translateX(-50%);background:var(--text);color:var(--bg);padding:9px 16px;border-radius:999px;z-index:10000;font-size:14px;display:none';
        document.body.appendChild(toastEl);
      }
      toastEl.textContent = msg; toastEl.style.display = 'block';
      clearTimeout(toastT);
      toastT = setTimeout(function () { toastEl.style.display = 'none'; }, 1400);
    }
    function stripZw(s) { return s.replace(/[\u200B-\u200D\uFEFF]/g, ''); }
    function toPlainCopy(m) { return stripZw(m).replace(/[\uE000-\uE003]/g, ''); }
    function toRichCopy(m) {
      return '<span style="font-family:\'Times New Roman\',Times,serif">' +
             toHtml(stripZw(m)).replace(/\n/g, '<br>') + '</span>';
    }
    var LATEX = {
      'σ': '\\sigma', 'π': '\\pi', 'ρ': '\\rho', '⋈': '\\bowtie',
      '⟕': '\\bowtie_{L}', '⟖': '\\bowtie_{R}', '⟗': '\\bowtie_{F}',
      '×': '\\times', '∪': '\\cup', '∩': '\\cap', '−': '-', '÷': '\\div',
      '←': '\\leftarrow', '→': '\\rightarrow', '∧': '\\land', '∨': '\\lor', '¬': '\\neg',
      '∀': '\\forall', '∃': '\\exists', '≠': '\\neq', '≤': '\\le', '≥': '\\ge', '∈': '\\in', 'ℑ': '\\Im', 'γ': '\\gamma'
    };
    function toLatexCopy(m) {
      var t = stripZw(m).replace(/\uE000/g, '_{').replace(/\uE002/g, '^{').replace(/[\uE001\uE003]/g, '}');
      Object.keys(LATEX).forEach(function (k) { t = t.split(k).join(LATEX[k]); });
      t = t.replace(/^\s+|\s+$/g, '');
      var lines = t.split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
      return lines.length > 1 ? '$$\n' + lines.join(' \\\\\n') + '\n$$' : '$$ ' + t + ' $$';
    }
    function getCaretRange() {
      var sel = getSelection();
      if (sel.rangeCount && ed.contains(sel.anchorNode)) return sel.getRangeAt(0);
      if (typeof lastSavedRange !== 'undefined' && lastSavedRange &&
          ed.contains(lastSavedRange.commonAncestorContainer)) return lastSavedRange;
      return null;
    }
    // Trả về (các) dòng chứa con trỏ / vùng chọn, dạng chuỗi có đánh dấu sub/sup
    function linesMarked() {
      var r = getCaretRange(); if (!r) return null;
      var c1 = { node: r.startContainer, offset: r.startOffset };
      var c2 = { node: r.endContainer, offset: r.endOffset };
      var raw = extractFromNode(ed, true, c1);
      extractFromNode(ed, true, c2);
      if (c1.pos === undefined || c2.pos === undefined) return null;
      var p1 = c1.pos, p2 = r.collapsed ? p1 : c2.pos;
      if (p2 > p1 && raw.charAt(p2 - 1) === '\n') p2--;
      var start = p1 === 0 ? 0 : raw.lastIndexOf('\n', p1 - 1) + 1;
      var end = raw.indexOf('\n', p2); if (end < 0) end = raw.length;
      return raw.slice(start, end).replace(/\s+$/, '');
    }
    function isBlank(m) { return !m || !stripZw(m).replace(/[\uE000-\uE003\s]/g, ''); }
    function writeClip(html, text, msg) {
      function fallback() {
        ownCopy = true;
        var h = function (e) {
          e.clipboardData.setData('text/html', html);
          e.clipboardData.setData('text/plain', text);
          e.preventDefault();
        };
        document.addEventListener('copy', h, true);
        var ok = false; try { ok = document.execCommand('copy'); } catch (_) {}
        document.removeEventListener('copy', h, true);
        ownCopy = false;
        toast(ok ? msg : 'Không thể sao chép');
      }
      if (navigator.clipboard && window.ClipboardItem) {
        navigator.clipboard.write([new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([text], { type: 'text/plain' })
        })]).then(function () { toast(msg); }, fallback);
      } else fallback();
    }
    function copyLine(mode) {
      var m = linesMarked();
      if (isBlank(m)) { toast('Dòng trống – không có gì để copy'); return; }
      if (mode === 'latex') { var l = toLatexCopy(m); writeClip(esc(l), l, 'Đã copy dòng dạng LaTeX'); }
      else writeClip(toRichCopy(m), toPlainCopy(m), 'Đã copy dòng');
    }
    // Ctrl+C: không bôi đen → copy cả dòng; có bôi đen → copy sạch (giữ chỉ số dưới, bỏ định dạng thừa)
    document.addEventListener('copy', function (e) {
      if (ownCopy || !e.clipboardData) return;
      var sel = getSelection();
      if (!sel.rangeCount || !ed.contains(sel.anchorNode)) return;
      var m = sel.isCollapsed ? linesMarked() : extractFromNode(sel.getRangeAt(0).cloneContents(), true);
      if (isBlank(m)) return;
      e.preventDefault();
      e.clipboardData.setData('text/html', toRichCopy(m));
      e.clipboardData.setData('text/plain', toPlainCopy(m));
      if (sel.isCollapsed) toast('Đã copy dòng');
    }, true);
    var bar3 = document.querySelector('.action-buttons');
    if (bar3) {
      var cb1 = document.createElement('button');
      cb1.type = 'button'; cb1.textContent = 'Copy dòng';
      cb1.title = 'Copy cả dòng đang chọn, giữ chỉ số dưới khi dán vào Word (Alt+C)';
      cb1.addEventListener('click', function () { copyLine('rich'); });
      bar3.appendChild(cb1);
      var cb2 = document.createElement('button');
      cb2.type = 'button'; cb2.textContent = 'Dòng → LaTeX';
      cb2.title = 'Copy cả dòng dạng LaTeX (Alt+Shift+C)';
      cb2.addEventListener('click', function () { copyLine('latex'); });
      bar3.appendChild(cb2);
    }

    /* ---- Phím tắt ---- */
    var ALT = {
      KeyS: { t: 'σ', k: 'tpl' }, KeyP: { t: 'π', k: 'tpl' }, KeyR: { t: 'ρ', k: 'tpl' },
      KeyJ: { t: '⋈', k: 'tpl' }, KeyX: { t: '×' }, KeyU: { t: '∪' }, KeyI: { t: '∩' },
      KeyM: { t: '−' }, KeyV: { t: '÷' }, KeyG: { t: 'γ' },
      KeyA: { t: ' ∧ ' }, KeyO: { t: ' ∨ ' }, KeyN: { t: '¬' },
      Comma: { t: ' ≤ ' }, Period: { t: ' ≥ ' }, Equal: { t: ' ≠ ' },
      BracketLeft: { t: '←' }, BracketRight: { t: '→' }
    };
    var ALT_SHIFT = {
      KeyS: { t: 'σ' }, KeyP: { t: 'π' }, KeyR: { t: 'ρ' }, KeyJ: { t: '⋈' },
      KeyK: { t: '⟕' }, KeyL: { t: '⟖' }, KeyF: { t: '⟗' },
      KeyG: { t: 'ℑ' }, KeyA: { t: '∀' }, KeyE: { t: '∃' }, KeyI: { t: ' ∈ ' },
      Comma: { t: ' < ' }, Period: { t: ' > ' }, Equal: { t: ' = ' }
    };
    function apply(d) { if (d.k === 'tpl') insertTemplate(d.t); else insertText(d.t); }

    var CMD = {
      s: ['σ', 'tpl'], sigma: ['σ', 'tpl'], p: ['π', 'tpl'], pi: ['π', 'tpl'],
      r: ['ρ', 'tpl'], rho: ['ρ', 'tpl'], j: ['⋈', 'tpl'], join: ['⋈', 'tpl'],
      lj: ['⟕'], rj: ['⟖'], fj: ['⟗'],
      x: ['×'], cross: ['×'], u: ['∪'], union: ['∪'], i: ['∩'], inter: ['∩'],
      m: ['−'], minus: ['−'], d: ['÷'], div: ['÷'],
      a: ['∧'], and: ['∧'], o: ['∨'], or: ['∨'], n: ['¬', 'tight'], not: ['¬', 'tight'],
      fa: ['∀', 'tight'], all: ['∀', 'tight'], ex: ['∃', 'tight'], 'in': ['∈'],
      ne: ['≠'], le: ['≤'], ge: ['≥'], g: ['γ', 'tight'], group: ['γ', 'tight'],
      la: ['←'], ra: ['→'],
      count: ['COUNT', 'fn'], sum: ['SUM', 'fn'], avg: ['AVG', 'fn'], min: ['MIN', 'fn'], max: ['MAX', 'fn']
    };
    var AUTO = { '<=': '≤', '>=': '≥', '!=': '≠', '<>': '≠', '->': '→', '<-': '←' };

    function caretTextCtx() {
      var sel = getSelection();
      if (!sel.rangeCount || !sel.isCollapsed) return null;
      var n = sel.anchorNode;
      if (!n || n.nodeType !== 3 || !ed.contains(n)) return null;
      return { sel: sel, node: n, off: sel.anchorOffset, before: n.nodeValue.slice(0, sel.anchorOffset) };
    }
    function selectBack(ctx, len) {
      var r = document.createRange();
      r.setStart(ctx.node, ctx.off - len); r.setEnd(ctx.node, ctx.off);
      ctx.sel.removeAllRanges(); ctx.sel.addRange(r);
    }
    function runCmd(name, ctx, matchLen, swallowedSpace) {
      var c = CMD[name]; if (!c) return false;
      selectBack(ctx, matchLen);
      if (c[1] === 'tpl') insertTemplate(c[0]);
      else if (c[1] === 'fn') insertFn(c[0]);
      else insertText(c[0] + (c[1] === 'tight' || !swallowedSpace ? '' : ' '));
      return true;
    }

    document.addEventListener('input', function (e) {
      if (!inEditor(e.target) || e.isComposing || e.inputType !== 'insertText') return;
      var ctx = caretTextCtx(); if (!ctx) return;
      var m = /(<=|>=|!=|<>|->|<-)$/.exec(ctx.before);
      if (m) { selectBack(ctx, m[0].length); insertText(AUTO[m[0]]); return; }
      m = /\\([A-Za-z]+)[ \u00A0]$/.exec(ctx.before);
      if (m) runCmd(m[1].toLowerCase(), ctx, m[0].length, true);
    }, true);

    function expandBeforeCaret() {
      var ctx = caretTextCtx(); if (!ctx) return false;
      var m = /\\([A-Za-z]+)$/.exec(ctx.before);
      return m ? runCmd(m[1].toLowerCase(), ctx, m[0].length, false) : false;
    }
    function exitSubscript() {             // Tab trong <sub>: nhảy ra ngoài, tạo sẵn "()"
      var sel = getSelection(); if (!sel.rangeCount) return false;
      var n = sel.anchorNode; if (n && n.nodeType === 3) n = n.parentNode;
      var sub = n && n.closest ? n.closest('sub') : null;
      if (!sub || !ed.contains(sub)) return false;
      var next = sub.nextSibling, r = document.createRange();
      if (next && next.nodeType === 3 && next.nodeValue.charAt(0) === '(') {
        r.setStart(next, 1);
      } else {
        var tn = document.createTextNode('()');
        sub.parentNode.insertBefore(tn, sub.nextSibling);
        r.setStart(tn, 1);
      }
      r.collapse(true); sel.removeAllRanges(); sel.addRange(r);
      return true;
    }

    /* ---- Bảng hướng dẫn ---- */
    var panel;
    function row(k, v) {
      return '<tr><td style="padding:3px 8px;border-bottom:1px solid var(--border);white-space:nowrap"><b>' + k +
             '</b></td><td style="padding:3px 8px;border-bottom:1px solid var(--border)">' + v + '</td></tr>';
    }
    function toggleHelp(force) {
      if (!panel) {
        panel = document.createElement('div');
        panel.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.45);display:none;align-items:center;justify-content:center;z-index:9999;';
        panel.innerHTML =
          '<div style="background:var(--surface);color:var(--text);border:1px solid var(--border);border-radius:14px;box-shadow:var(--shadow);max-width:700px;width:92%;max-height:86vh;overflow:auto;padding:20px 24px;font:14.5px/1.55 var(--ui)">' +
          '<h2 style="margin:0 0 8px;border:0">Phím tắt</h2>' +
          '<p style="margin:0 0 8px"><b>Alt+S / P / R / J</b> chèn σ, π, ρ, ⋈ kèm chỉ số dưới <code>(|)</code>. Gõ điều kiện xong nhấn <b>Tab</b>: con trỏ nhảy ra ngoài và tạo sẵn <code>(|)</code> cho tên bảng.</p>' +
          '<table style="border-collapse:collapse;width:100%">' +
          row('Alt+Shift+S / P / R / J', 'σ π ρ ⋈ (không chỉ số dưới)') +
          row('Alt+Shift+K / L / F', '⟕  ⟖  ⟗') +
          row('Alt+X / U / I / M / V', '×  ∪  ∩  −  ÷') +
          row('Alt+A / O / N', '∧  ∨  ¬') + row('Alt+Shift+A / E / I', '∀  ∃  ∈') +
          row('Alt+,  Alt+.  Alt+=', '≤  ≥  ≠') + row('Alt+Shift+,  Alt+Shift+.  Alt+Shift+=', '<  >  =') +
          row('Alt+[  Alt+]', '←  →') + row('Alt+G / Alt+Shift+G', 'γ / ℑ (gom nhóm)') +
          row('Ctrl+,  Ctrl+.', 'bật/tắt chỉ số dưới / trên') +
          row('Alt+Q', 'Chuẩn hoá toàn bộ nội dung') + row('Ctrl+C (không bôi đen)', 'Copy cả dòng chứa con trỏ') + row('Alt+C / Alt+Shift+C', 'Copy dòng (dán Word giữ chỉ số dưới) / copy dòng dạng LaTeX') + row('Ctrl+H', 'Tìm &amp; Thay (Alt+phím ký hiệu cũng dùng được trong ô Tìm/Thay)') + row('Alt+H', 'Mở/đóng bảng này') +
          '</table>' +
          '<p style="margin:10px 0 4px"><b>Gõ tắt</b> (gõ rồi nhấn Space hoặc Tab):</p>' +
          '<p style="margin:0">Tự đổi ngay: <code>&lt;=</code> ≤ · <code>&gt;=</code> ≥ · <code>!=</code> ≠ · <code>-&gt;</code> → · <code>&lt;-</code> ←<br>' +
          'Lệnh: <code>\\s</code> <code>\\p</code> <code>\\r</code> <code>\\j</code> <code>\\lj \\rj \\fj</code> <code>\\x</code> <code>\\u</code> <code>\\i</code> <code>\\m</code> <code>\\d</code> ' +
          '<code>\\a</code> <code>\\o</code> <code>\\n</code> <code>\\fa</code> <code>\\ex</code> <code>\\in</code> <code>\\ne \\le \\ge</code> <code>\\g</code> <code>\\la \\ra</code> ' +
          '<code>\\count \\sum \\avg \\min \\max</code> (cũng gõ được dạng dài: \\sigma \\pi \\rho \\join \\and \\or \\not…)</p>' +
          '<p style="margin:12px 0 0;text-align:right"><button type="button" id="dsqh-help-close">Đóng (Esc)</button></p></div>';
        document.body.appendChild(panel);
        panel.addEventListener('mousedown', function (e) { if (e.target === panel) toggleHelp(false); });
        panel.querySelector('#dsqh-help-close').addEventListener('click', function () { toggleHelp(false); });
      }
      var show = typeof force === 'boolean' ? force : panel.style.display === 'none';
      panel.style.display = show ? 'flex' : 'none';
      if (!show) ed.focus();
    }

    document.addEventListener('keydown', function (e) {
      if (e.isComposing) return;
      if (window.App && App.tab !== 'ra') return;   // chỉ hoạt động ở tab Đại số quan hệ
      if (e.key === 'Escape' && panel && panel.style.display !== 'none') { toggleHelp(false); return; }
      if (e.key === 'Escape' && findOpen() && fp.contains(e.target)) { closeFind(); return; }
      if (e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey && e.code === 'KeyH') {
        e.preventDefault(); openFind(); return;
      }
      if (fp && fp.contains(e.target) && e.altKey && !e.ctrlKey && !e.metaKey &&
          (e.target === fIn || e.target === rIn)) {            // Alt+phím tắt ký hiệu ngay trong ô Tìm/Thay
        var dd = (e.shiftKey ? ALT_SHIFT : ALT)[e.code];
        if (dd && e.target.setRangeText) {
          e.preventDefault();
          e.target.setRangeText(dd.t.trim(), e.target.selectionStart, e.target.selectionEnd, 'end');
          e.target.dispatchEvent(new Event('input', { bubbles: true }));
        }
        return;
      }
      if (e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey && e.code === 'KeyH') {
        e.preventDefault(); toggleHelp(); return;
      }
      if (!inEditor(e.target)) return;
      if (e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey && e.code === 'KeyQ') {
        e.preventDefault(); normalizeAll(); return;
      }
      if (e.altKey && !e.ctrlKey && !e.metaKey && e.code === 'KeyC') {
        e.preventDefault(); copyLine(e.shiftKey ? 'latex' : 'rich'); return;
      }
      if (e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey) {
        if (e.code === 'Comma') { e.preventDefault(); document.execCommand('subscript'); }
        else if (e.code === 'Period') { e.preventDefault(); document.execCommand('superscript'); }
        return;
      }
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        var d = (e.shiftKey ? ALT_SHIFT : ALT)[e.code];
        if (d) { e.preventDefault(); apply(d); }
        return;
      }
      if (e.key === 'Tab' && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
        if (expandBeforeCaret() || exitSubscript()) { e.preventDefault(); e.stopPropagation(); }
      }
    }, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

})(typeof window !== 'undefined' ? window : globalThis);

