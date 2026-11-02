# CSDL Studio

Bộ công cụ soạn bài và tự học cho môn Cơ sở dữ liệu, gồm hai công cụ trong một trang:

- **Đại số quan hệ** (Lab04): trình soạn biểu thức với bảng ký hiệu, chỉ số dưới, gõ tắt, dán tự chuẩn hoá, Tìm & Thay, Copy dòng, Copy LaTeX; **chạy biểu thức trên dữ liệu mẫu tự nhập**, bài học và đề bài Lab04.
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
   ├─ core/
   │  ├─ config.js         Cấu hình VIP: giá, tài khoản nhận tiền, salt, tài khoản admin
   │  ├─ app.js            Tab, giao diện sáng/tối, thông báo, sao lưu/khôi phục
   │  └─ vip.js            Mở VIP bằng mã kích hoạt, đăng nhập admin, mã QR, quản trị
   ├─ ra/
   │  ├─ editor.js         Lõi soạn thảo: chèn ký hiệu, chỉ số dưới, Copy LaTeX, Save/Load, TXT, Print
   │  ├─ tools.js          Chuẩn hoá khi dán, Tìm & Thay, Copy dòng, phím tắt, gõ tắt
   │  ├─ engine.js         Bộ chạy đại số quan hệ (σ π ρ × ⋈ ∪ ∩ − ÷ γ ←) trên dữ liệu mẫu
   │  ├─ data.js           Dữ liệu mẫu Lab04, ví dụ có lời giải (VIP), tóm tắt đề 30 câu
   │  └─ ui.js             Nút Chạy, tab Dữ liệu mẫu, tab Học và đề bài
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

## Chạy biểu thức đại số quan hệ

1. Vào tab **Dữ liệu mẫu**, sửa hoặc thêm bảng theo dạng `Tên(cột1, cột2)` rồi các dòng giá trị cách nhau bằng dấu phẩy (có sẵn dữ liệu Lab04).
2. Viết bài ở tab **Soạn bài**; mỗi câu bắt đầu bằng dòng `Câu n` (bấm số câu ở tab **Học và đề bài** để chèn).
3. Đặt con trỏ trong một câu, bấm **Ctrl+Enter** (chạy câu này) hoặc **Ctrl+Shift+Enter** (chạy cả bài). Kết quả hiện thành bảng bên dưới; lỗi được báo bằng tiếng Việt (thiếu ngoặc, tên quan hệ chưa định nghĩa, thuộc tính mơ hồ sau phép nối, thiếu “(” sau γ…).

Công cụ hiểu cả kiểu có chỉ số dưới thật lẫn kiểu gõ phẳng như `σ(GioiTinh = 'Nữ')(DIENVIEN)` hoặc `σ_{(…)}(R)`. Kết quả theo ngữ nghĩa tập hợp (không có dòng trùng).

## VIP: bài tập mẫu và tài khoản admin

Nội dung có lời giải (nạp đề mẫu Lab05, các nút “Chạy ví dụ”, “Chạy thử”, “Chèn vào bài” ở phần học) chỉ hiện khi mở **VIP**.

**Cách người dùng mở VIP (20.000đ):** bấm ⭐ Mở VIP, quét mã QR, chuyển khoản đúng số tiền và **nội dung chuyển khoản** (mã đơn riêng của từng máy, dạng `CSDLxxxxxx`), gửi biên lai kèm mã đơn cho admin, nhận **mã kích hoạt** (dạng `XXXX-XXXX`) và nhập vào.

**Admin:** đăng nhập ở ⭐ Mở VIP > Đăng nhập admin. Tài khoản mặc định: `admin` / `Admin@2026` — **đổi ngay** trong mục “Đổi mật khẩu admin”. Admin được mở VIP trực tiếp, và có:
- Sinh mã kích hoạt cho từng mã đơn.
- Cài tài khoản nhận tiền (mã ngân hàng theo vietqr.io như MB, VCB, ACB, số tài khoản, tên chủ tài khoản) hoặc tải ảnh QR ngân hàng của bạn.
- Nút “Sao chép đoạn cấu hình” để dán vào `js/core/config.js`.

**Trước khi phát hành cho người khác:**
1. Điền `bank` (hoặc `qrImage`: đặt ảnh QR vào `assets/` rồi ghi đường dẫn) trong `js/core/config.js`, để máy nào cũng thấy mã QR. QR tạo từ thông tin ngân hàng cần có mạng (ảnh lấy từ img.vietqr.io); ảnh QR của bạn thì không cần mạng.
2. Đổi `salt` thành chuỗi bí mật của riêng bạn (mã kích hoạt phụ thuộc salt; đổi salt thì mã cũ mất hiệu lực).
3. Đổi mật khẩu admin: đặt `passHash` mới trong config.js. Hash = SHA-256 của `salt + ':' + mậtkhẩu`; lấy nhanh bằng cách mở Console của trình duyệt và gõ `VIP.sha256(CSDL_CONFIG.salt + ':' + 'matkhau-moi')`.

**Giới hạn cần biết:** toàn bộ chạy trên trình duyệt, nên đây là khoá mềm. Nó ngăn người dùng thường, nhưng ai biết đọc mã nguồn vẫn có thể gỡ khoá, và công cụ **không thể tự xác nhận tiền đã vào tài khoản**; việc đối chiếu biên lai là do admin làm. Muốn tự động và chặn chắc chắn cần máy chủ (ví dụ Vercel kèm webhook SePay, Casso hoặc payOS).
