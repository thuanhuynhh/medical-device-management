╔════════════════════════════════════════════════════════════════════╗
║          HỆ THỐNG QUẢN LÝ THIẾT BỊ Y TẾ (Device Management)        ║
╚════════════════════════════════════════════════════════════════════╝

=== YÊU CẦU HỆ THỐNG ===

- Windows 10 hoặc mới hơn
- Node.js phiên bản 20 trở lên (tải tại: https://nodejs.org)
- Kết nối Internet (cho tính năng tunnel)


=== HƯỚNG DẪN CÀI ĐẶT ===

1. Cài đặt Node.js (nếu chưa có):
   - Tải từ https://nodejs.org
   - Chọn phiên bản LTS (Long Term Support)
   - Cài đặt theo hướng dẫn mặc định

2. Khởi chạy hệ thống:
   - Nhấn đúp vào file "start.bat"
   - Lần đầu chạy sẽ tự động cài đặt thư viện
   - Sau đó trình duyệt sẽ tự mở trang cài đặt


=== CÀI ĐẶT LẦN ĐẦU ===

Khi chạy lần đầu, bạn sẽ được yêu cầu:
1. Cấu hình địa chỉ truy cập (domain)
   - Mặc định: vicas-XXXXXX (6 số ngẫu nhiên)
   - Có thể tùy chỉnh theo ý muốn
   
2. Tạo tài khoản quản trị viên (Admin)
   - Họ tên
   - Tên đăng nhập
   - Mật khẩu (ít nhất 6 ký tự)


=== TRUY CẬP HỆ THỐNG ===

Sau khi khởi động, bạn có thể truy cập:

• Truy cập nội bộ (cùng máy tính):
  http://localhost:3000

• Truy cập từ Internet (qua tunnel):
  https://vicas-XXXXXX.nport.io
  (XXXXXX là mã 6 số của bạn)


=== CẤU TRÚC THƯ MỤC ===

device-management/
├── public/           - Giao diện web
├── node_modules/     - Thư viện (tự động cài đặt)
├── devices.db        - Cơ sở dữ liệu
├── server.js         - Server chính
├── package.json      - Cấu hình dự án
├── start.bat         - Khởi chạy Windows
└── README.txt        - File này


=== CÁC TÍNH NĂNG CHÍNH ===

✓ Quản lý thiết bị y tế với mã QR
✓ Kiểm tra định kỳ thiết bị
✓ Quản lý người dùng và phân quyền
✓ Báo cáo tự động qua Zalo
✓ Quản lý sự cố (tickets)
✓ Xuất Excel
✓ Truy cập từ xa qua tunnel


=== LIÊN HỆ HỖ TRỢ ===

Nếu gặp vấn đề, vui lòng liên hệ quản trị viên hệ thống.


=== THÔNG TIN KỸ THUẬT ===

• Framework: Node.js + Express.js
• Database: SQLite (better-sqlite3)
• Tunnel: nport (https://nport.io)
• Port mặc định: 3000


═══════════════════════════════════════════════════════════════════════
                          © 2026 VICAS Medical
═══════════════════════════════════════════════════════════════════════
