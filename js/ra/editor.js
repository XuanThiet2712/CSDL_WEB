/**
 * Đại số quan hệ – lõi trình soạn thảo (contenteditable, chỉ số dưới, Copy LaTeX, Save/Load, TXT, Print, cỡ chữ)
 */

// Chèn ký hiệu hoặc chỉ số dưới tại vị trí con trỏ trong contenteditable
function insertAtCursor(text, isSubscript = false, cursorOffset) {
    const editor = document.getElementById('editor');
    if (!editor) return;

    editor.focus();
    const sel = window.getSelection();
    if (!sel.rangeCount) return;

    const range = sel.getRangeAt(0);
    range.deleteContents();

    if (isSubscript) {
        // Tạo node ký hiệu chính (ví dụ: σ, π)
        const symbolNode = document.createTextNode(text);
        range.insertNode(symbolNode);

        // Tạo thẻ sub (chỉ số dưới) ngay sau ký hiệu chính
        const subNode = document.createElement('sub');
        // Sử dụng Zero-Width Space (U+200B) để trình duyệt cho phép con trỏ nhảy vào trong thẻ sub rỗng
        subNode.innerHTML = '&#8203;'; 
        
        range.setStartAfter(symbolNode);
        range.insertNode(subNode);

        // Đưa con trỏ chuột vào bên trong thẻ sub (sau ký tự zero-width space)
        const newRange = document.createRange();
        newRange.setStart(subNode, 1);
        newRange.collapse(true);
        sel.removeAllRanges();
        sel.addRange(newRange);
    } else {
        // Chèn văn bản thông thường
        const textNode = document.createTextNode(text);
        range.insertNode(textNode);

        // Thiết lập vị trí con trỏ sau khi chèn
        const newRange = document.createRange();
        if (typeof cursorOffset === 'number') {
            newRange.setStart(textNode, cursorOffset);
        } else {
            newRange.setStartAfter(textNode);
        }
        newRange.collapse(true);
        sel.removeAllRanges();
        sel.addRange(newRange);
    }
}

// Chuyển đổi nội dung HTML của editor thành Plain Text (thay <sub> thành _{})
function getEditorPlainText() {
    const editor = document.getElementById('editor');
    if (!editor) return '';

    const clone = editor.cloneNode(true);

    // Tìm và đổi các thẻ sub <sub>nội dung</sub> thành _{nội dung}
    const subs = clone.getElementsByTagName('sub');
    for (let i = subs.length - 1; i >= 0; i--) {
        const sub = subs[i];
        let textContent = sub.textContent;
        // Xóa ký tự Zero-Width Space nếu có
        textContent = textContent.replace(/\u200B/g, '');
        
        const textNode = document.createTextNode(`_{${textContent}}`);
        sub.parentNode.replaceChild(textNode, sub);
    }

    // Chuyển đổi các thẻ xuống dòng phổ biến của contenteditable thành ký tự xuống dòng \n
    let html = clone.innerHTML;
    html = html.replace(/<div>/gi, '\n').replace(/<\/div>/gi, '');
    html = html.replace(/<p>/gi, '\n').replace(/<\/p>/gi, '');
    html = html.replace(/<br\s*\/?>/gi, '\n');

    const temp = document.createElement('div');
    temp.innerHTML = html;

    // Lấy plain text và loại bỏ các ký tự ẩn
    let plainText = temp.textContent;
    plainText = plainText.replace(/\u200B/g, '');

    return plainText;
}

// Chuyển đổi nội dung HTML của editor thành Markdown LaTeX
function getEditorLatex() {
    const editor = document.getElementById('editor');
    if (!editor) return '';

    const clone = editor.cloneNode(true);

    // 1. Tìm và đổi các thẻ sub <sub>nội dung</sub> thành _{nội dung}
    const subs = clone.getElementsByTagName('sub');
    for (let i = subs.length - 1; i >= 0; i--) {
        const sub = subs[i];
        let textContent = sub.textContent;
        // Xóa ký tự Zero-Width Space nếu có
        textContent = textContent.replace(/\u200B/g, '');
        
        const textNode = document.createTextNode(`_{${textContent}}`);
        sub.parentNode.replaceChild(textNode, sub);
    }

    // Chuyển đổi các thẻ xuống dòng phổ biến của contenteditable thành ký tự xuống dòng \n
    let html = clone.innerHTML;
    html = html.replace(/<div>/gi, '\n').replace(/<\/div>/gi, '');
    html = html.replace(/<p>/gi, '\n').replace(/<\/p>/gi, '');
    html = html.replace(/<br\s*\/?>/gi, '\n');

    const temp = document.createElement('div');
    temp.innerHTML = html;

    // Lấy plain text và loại bỏ các ký tự ẩn
    let plainText = temp.textContent;
    plainText = plainText.replace(/\u200B/g, '');

    // 2. Bản đồ chuyển đổi các ký tự sang lệnh LaTeX tương ứng
    const latexMapping = {
        'σ': '\\sigma',
        'π': '\\pi',
        'ρ': '\\rho',
        '⋈': '\\bowtie',
        '⟕': '\\bowtie_{L}',
        '⟖': '\\bowtie_{R}',
        '⟗': '\\bowtie_{F}',
        '×': '\\times',
        '∪': '\\cup',
        '∩': '\\cap',
        '−': '-',
        '÷': '\\div',
        '←': '\\leftarrow',
        '→': '\\rightarrow',
        '∧': '\\land',
        '∨': '\\lor',
        '¬': '\\neg',
        '∀': '\\forall',
        '∃': '\\exists',
        '≠': '\\neq',
        '≤': '\\le',
        '≥': '\\ge',
        '∈': '\\in',
        'ℑ': '\\Im',
        'γ': '\\gamma'
    };

    // Thực hiện thay thế từng ký tự đặc biệt
    for (const [symbol, latex] of Object.entries(latexMapping)) {
        const escapedSymbol = symbol.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(escapedSymbol, 'g');
        plainText = plainText.replace(regex, latex);
    }

    plainText = plainText.trim();
    if (!plainText) return '';

    // 3. Định dạng Markdown LaTeX dựa trên số dòng
    const lines = plainText.split('\n');
    if (lines.length === 1) {
        return `$$ ${plainText} $$`;
    } else {
        const latexLines = lines.map(line => line.trim()).filter(line => line.length > 0);
        return `$$\n${latexLines.join(' \\\\\n')}\n$$`;
    }
}

// Sao chép nội dung dưới dạng Markdown LaTeX
function copyText() {
    const latexText = getEditorLatex();
    if (!latexText) {
        alert('Không có nội dung để sao chép!');
        return;
    }

    navigator.clipboard.writeText(latexText)
        .then(() => {
            alert('Đã sao chép biểu thức dạng Markdown LaTeX vào Clipboard!');
        })
        .catch(err => {
            alert('Không thể sao chép: ' + err);
        });
}

// Xóa sạch nội dung soạn thảo
function clearText() {
    const editor = document.getElementById('editor');
    if (!editor) return;

    if (!editor.textContent.trim()) {
        editor.innerHTML = '';
        return;
    }

    if (confirm('Bạn có chắc chắn muốn xóa toàn bộ nội dung hiện tại không?')) {
        editor.innerHTML = '';
        editor.focus();
    }
}

// Lưu HTML hiện tại vào localStorage
function saveText() {
    const editor = document.getElementById('editor');
    if (!editor) return;

    localStorage.setItem('relational_algebra_editor_html_v2', editor.innerHTML);
    alert('Đã lưu nội dung thành công vào bộ nhớ trình duyệt!');
}

// Tải HTML từ localStorage
function loadText() {
    const editor = document.getElementById('editor');
    if (!editor) return;

    const savedHtml = localStorage.getItem('relational_algebra_editor_html_v2');
    if (savedHtml !== null) {
        if (editor.textContent.trim() && !confirm('Tải nội dung đã lưu sẽ ghi đè lên nội dung hiện tại. Tiếp tục?')) {
            return;
        }
        editor.innerHTML = savedHtml;
        editor.focus();
    } else {
        alert('Không tìm thấy dữ liệu đã lưu trước đó!');
    }
}

// Tải xuống file .txt (định dạng plain text chuẩn)
function downloadTxt() {
    const text = getEditorPlainText();
    if (!text.trim()) {
        alert('Không có nội dung để tải xuống!');
        return;
    }

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'dai_so_quan_he.txt';
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Kích hoạt tính năng in
function printPage() {
    window.print();
}

// Lưu trữ vùng chọn cuối cùng của người dùng trong editor để thay đổi cỡ chữ bôi đen
let lastSavedRange = null;

document.addEventListener('selectionchange', () => {
    const sel = window.getSelection();
    if (sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        const editor = document.getElementById('editor');
        if (editor && editor.contains(range.commonAncestorContainer)) {
            lastSavedRange = range.cloneRange();
        }
    }
});

// Thay đổi cỡ chữ của editor hoặc đoạn văn bản bôi đen (1-100 pt)
function changeFontSize(value) {
    const editor = document.getElementById('editor');
    if (!editor) return;

    let size = parseInt(value, 10);
    if (isNaN(size)) return;

    if (size < 1) size = 1;
    if (size > 100) size = 100;

    // Luôn cập nhật cỡ chữ nền của cả editor để khi gõ mới hoặc xuống dòng tiếp tục nhận cỡ chữ này
    editor.style.fontSize = size + 'pt';
    localStorage.setItem('relational_algebra_font_size_pt', size);

    const sel = window.getSelection();
    let range = null;

    // Chỉ áp dụng đổi cỡ chữ bằng thẻ span cho vùng bôi đen thực tế hiện tại
    if (sel.rangeCount && !sel.isCollapsed && editor.contains(sel.anchorNode)) {
        range = sel.getRangeAt(0);
    }

    if (range) {
        // Tạo thẻ span bọc đoạn bôi đen
        const span = document.createElement('span');
        span.style.fontSize = size + 'pt';
        
        try {
            span.appendChild(range.extractContents());
            range.insertNode(span);
            
            // Chọn lại đoạn văn bản vừa thay đổi
            const newRange = document.createRange();
            newRange.selectNodeContents(span);
            sel.removeAllRanges();
            sel.addRange(newRange);
            
            // Cập nhật lại vùng chọn đã lưu
            lastSavedRange = newRange.cloneRange();
        } catch (e) {
            console.error("Lỗi khi đổi cỡ chữ phần bôi đen:", e);
        }
    }
}

// Kiểm tra tính hợp lệ của ô nhập khi rời con trỏ (onblur)
function validateFontSizeInput(input) {
    let size = parseInt(input.value, 10);
    if (isNaN(size) || size < 1) {
        size = 14; // Mặc định nếu không hợp lệ
    } else if (size > 100) {
        size = 100;
    }
    input.value = size;
    changeFontSize(size);
}

// Lắng nghe sự kiện bàn phím trên editor để hỗ trợ phím Tab và phím di chuyển
window.addEventListener('DOMContentLoaded', () => {
    const editor = document.getElementById('editor');
    if (!editor) return;

    // Tự động khôi phục dữ liệu cũ nếu có
    const savedHtml = localStorage.getItem('relational_algebra_editor_html_v2');
    if (savedHtml) {
        editor.innerHTML = savedHtml;
    }

    // Tự động khôi phục cỡ chữ cũ nếu có
    const savedFontSize = localStorage.getItem('relational_algebra_font_size_pt') || localStorage.getItem('relational_algebra_font_size');
    if (savedFontSize) {
        let sizeStr = savedFontSize.replace('pt', '');
        let size = parseInt(sizeStr, 10);
        if (!isNaN(size) && size >= 1 && size <= 100) {
            editor.style.fontSize = size + 'pt';
            const input = document.getElementById('font-size-input');
            if (input) {
                input.value = size;
            }
        }
    }


    editor.addEventListener('keydown', function(e) {
        const sel = window.getSelection();
        if (sel.rangeCount === 0) return;

        const range = sel.getRangeAt(0);
        const startContainer = range.startContainer;
        const startOffset = range.startOffset;
        let container = startContainer;

        // Nhấn Tab hoặc Mũi tên Phải để thoát chỉ số dưới sang bên phải
        if (e.key === 'Tab' || e.key === 'ArrowRight') {
            let insideSub = false;
            let subNode = null;
            let temp = container;
            while (temp && temp !== editor) {
                if (temp.nodeName === 'SUB') {
                    insideSub = true;
                    subNode = temp;
                    break;
                }
                temp = temp.parentNode;
            }

            if (insideSub && subNode) {
                let isAtEnd = false;
                if (startContainer.nodeType === Node.TEXT_NODE) {
                    isAtEnd = (startOffset === startContainer.length);
                } else {
                    isAtEnd = (startOffset === startContainer.childNodes.length);
                }

                if (isAtEnd) {
                    e.preventDefault(); // Chặn hành vi mặc định
                    
                    // Sử dụng thẻ span chứa ký tự zero-width space để tránh trình duyệt tự động gộp text gõ mới vào lại thẻ sub
                    let nextNode = subNode.nextSibling;
                    if (!nextNode || nextNode.nodeName !== 'SPAN') {
                        nextNode = document.createElement('span');
                        nextNode.innerHTML = '&#8203;';
                        subNode.parentNode.insertBefore(nextNode, subNode.nextSibling);
                    }

                    const newRange = document.createRange();
                    newRange.setStart(nextNode.firstChild, 1);
                    newRange.collapse(true);
                    sel.removeAllRanges();
                    sel.addRange(newRange);
                }
            }
        }

        // Nhấn Mũi tên Trái để thoát chỉ số dưới sang bên trái
        if (e.key === 'ArrowLeft') {
            let insideSub = false;
            let subNode = null;
            let temp = container;
            while (temp && temp !== editor) {
                if (temp.nodeName === 'SUB') {
                    insideSub = true;
                    subNode = temp;
                    break;
                }
                temp = temp.parentNode;
            }

            if (insideSub && subNode) {
                let isAtStart = false;
                if (startContainer.nodeType === Node.TEXT_NODE) {
                    isAtStart = (startOffset === 0) || (startOffset === 1 && startContainer.textContent.startsWith('\u200B'));
                } else {
                    isAtStart = (startOffset === 0);
                }

                if (isAtStart) {
                    e.preventDefault(); // Chặn hành vi mặc định

                    // Sử dụng thẻ span chứa ký tự zero-width space để đứng trước thẻ sub
                    let prevNode = subNode.previousSibling;
                    if (!prevNode || prevNode.nodeName !== 'SPAN') {
                        prevNode = document.createElement('span');
                        prevNode.innerHTML = '&#8203;';
                        subNode.parentNode.insertBefore(prevNode, subNode);
                    }

                    const newRange = document.createRange();
                    newRange.setStart(prevNode.firstChild, 1);
                    newRange.collapse(true);
                    sel.removeAllRanges();
                    sel.addRange(newRange);
                }
            }
        }
    });
});
