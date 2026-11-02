/**
 * Cấu hình CSDL Studio.
 * LƯU Ý: toàn bộ chạy trên trình duyệt nên đây chỉ là "khoá mềm" (chặn người dùng thường,
 * không chặn được người biết đọc mã nguồn). Muốn chặn chắc chắn cần máy chủ kiểm tra thanh toán.
 */
window.CSDL_CONFIG = {
  price: 20000,                 // số tiền (VNĐ) để mở VIP
  memoPrefix: 'CSDL',           // tiền tố nội dung chuyển khoản
  bank: {
    bankId: 'MB',                 // mã ngân hàng theo vietqr.io, ví dụ: MB, VCB, ACB, TCB, VPB (để trống nếu dùng ảnh QR riêng)
    accountNo: '70003690701',              // số tài khoản nhận tiền
    accountName: 'NGUYEN XUAN THIET'             // tên chủ tài khoản (không dấu)
  },
  qrImage: '',                  // hoặc đường dẫn ảnh QR của bạn, ví dụ 'assets/qr-20k.png'
  salt: '8dc9448bd3992a6f8e9f87fd',               // ĐỔI chuỗi này trước khi phát hành; dùng để sinh mã kích hoạt
  admin: {
    user: 'admin',
    // Mật khẩu mặc định: Admin@2026  (hãy đổi ngay trong app: Mở VIP > Đăng nhập admin > Đổi mật khẩu)
    passHash: 'bbf820fa0c375f829525c18f1ec08b83c782a59a6e5272803d0d5c4201b28c2f'
  }
};
