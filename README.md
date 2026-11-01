# CSDL Studio

Bộ công cụ soạn bài và tự học cho môn Cơ sở dữ liệu, gồm hai công cụ trong một trang:

- **Đại số quan hệ** (Lab04): trình soạn biểu thức với bảng ký hiệu, chỉ số dưới, gõ tắt, dán tự chuẩn hoá, Tìm & Thay, Copy dòng, Copy LaTeX.
- **Phụ thuộc hàm** (Lab05): trình soạn bài, máy tính tự giải từng bước (bao đóng, khoá, phủ tối thiểu, dạng chuẩn, F ≡ G, phân rã 3NF, chase), 12 bài học và luyện tập ngẫu nhiên.

## Cách chạy

Giải nén rồi mở `index.html` bằng trình duyệt (Chrome, Edge, Firefox). Không cần cài đặt hay kết nối mạng.
Nếu muốn chạy bằng máy chủ cục bộ: `python -m http.server 8000` rồi mở http://localhost:8000.

## Cấu trúc thư mục

```
csdl-studio/
├─ index.html              Khung trang: header, tab, hai công cụ
├─ assets/
│  └─ favicon.svg
├─ css/
│  ├─ base.css             Biến giao diện sáng/tối, layout, button, form, in ấn
│  ├─ ra.css               Giao diện riêng của Đại số quan hệ
│  └─ fd.css               Giao diện riêng của Phụ thuộc hàm
└─ js/
   ├─ core/app.js          Tab, giao diện sáng/tối, thông báo, sao lưu/khôi phục
   ├─ ra/
   │  ├─ editor.js         Lõi soạn thảo: chèn ký hiệu, chỉ số dưới, Copy LaTeX, Save/Load, TXT, Print
   │  └─ tools.js          Chuẩn hoá khi dán, Tìm & Thay, Copy dòng, phím tắt, gõ tắt
   └─ fd/
      ├─ algorithms.js     Thuật toán thuần (không đụng giao diện)
      ├─ reports.js        Sinh lời giải từng bước dạng văn bản
      ├─ data.js           Đề mẫu Lab05
      ├─ editor.js         Vùng soạn bài của công cụ phụ thuộc hàm
      └─ ui.js             Máy tính, bài học, luyện tập
```

Mã nguồn là JavaScript thuần, nạp bằng thẻ `<script>` thường (chạy được cả khi mở trực tiếp file, không cần build). Thứ tự nạp trong `index.html` quan trọng: `algorithms` → `reports` → `data` → `ui`.

## Tính năng chung

- Giao diện sáng/tối, tự theo hệ thống, nút ◐ để đổi và nhớ lựa chọn.
- Nhớ tab đang dùng; địa chỉ `#ra` và `#fd` mở thẳng từng công cụ; **Ctrl+Alt+1 / Ctrl+Alt+2** chuyển tab.
- **Sao lưu / Khôi phục**: tải toàn bộ bài làm (cả hai công cụ) ra một file `.json` để chuyển sang máy khác.
- Bài làm tự lưu trong trình duyệt (nút Save / tự lưu ở công cụ Phụ thuộc hàm).

## Phím tắt chính

Bấm **Alt+H** (tab Đại số quan hệ) hoặc xem mục “Phím tắt” (tab Phụ thuộc hàm) để có bảng đầy đủ.

| Việc | Đại số quan hệ | Phụ thuộc hàm |
|---|---|---|
| Ký hiệu | Alt+S σ, Alt+P π, Alt+R ρ, Alt+J ⋈, Alt+G γ | Alt+T →, Alt+P ⁺, Alt+S ⊆, Alt+U ∪ |
| Gõ tắt | `<=` ≤, `->` →, `\sigma` + Space | `->` →, `^+` ⁺, `\in` + Space |
| Tìm & Thay | Ctrl+H | nút Tìm & Thay |
| Copy dòng | Ctrl+C khi không bôi đen, Alt+C | nút Copy kết quả / Chèn vào bài |

## Ghi chú

- Đề Lab04 dùng ký hiệu gom nhóm **γ**; công cụ có cả γ (Alt+G) và ℑ (Alt+Shift+G). Nên dùng γ khi nộp.
- Nút “Lược đồ Lab04” chèn nhanh tên quan hệ và thuộc tính (DIENVIEN, MaDV, …).
- Kết quả của máy tính phụ thuộc hàm nên được dùng để đối chiếu; bài nộp cần tự trình bày và giải thích bằng lời của mình.
# CSDL_WEB
