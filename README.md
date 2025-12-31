# 🏥 Hệ thống Quản lý Thiết bị Y tế

> **Ứng dụng giúp các khoa phòng bệnh viện quản lý thiết bị y tế một cách đơn giản và hiệu quả**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/thuanhuynhh/medical-device-management)

---

## 🎯 Giới thiệu

Đây là ứng dụng web giúp **bác sĩ và nhân viên y tế** dễ dàng:

- 📋 **Quản lý danh sách thiết bị** trong khoa phòng
- 📱 **Tạo mã QR** dán vào thiết bị để nhận diện nhanh
- ✅ **Kiểm tra thiết bị hàng ngày** bằng cách quét mã QR
- 📊 **Xem báo cáo thống kê** trạng thái thiết bị
- 🔔 **Nhận thông báo qua Zalo** khi có sự cố

---

## 🚀 Cài đặt nhanh (1 Click)

### Triển khai lên Vercel (Miễn phí)

Nhấn nút bên dưới để tự động cài đặt ứng dụng lên máy chủ Vercel của bạn:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/thuanhuynhh/medical-device-management)

**Các bước:**

1. Nhấn nút **"Deploy with Vercel"** ở trên
2. Đăng nhập bằng tài khoản GitHub (miễn phí)
3. Nhấn **"Deploy"** và chờ khoảng 1-2 phút
4. Hoàn tất! Truy cập đường link được cung cấp

---

## 💻 Cài đặt trên máy tính cá nhân

Nếu bạn muốn chạy ứng dụng trên máy tính của mình:

### Yêu cầu

- Cài đặt [Node.js](https://nodejs.org/) (phiên bản 18 trở lên)

### Các bước cài đặt

```bash
# 1. Tải mã nguồn về máy
git clone https://github.com/thuanhuynhh/medical-device-management.git

# 2. Vào thư mục ứng dụng
cd medical-device-management

# 3. Cài đặt các thành phần cần thiết
npm install

# 4. Chạy ứng dụng
npm start
```

Sau đó mở trình duyệt và truy cập: **http://localhost:3000**

---

## 🔐 Đăng nhập

Khi truy cập lần đầu, sử dụng tài khoản mặc định:

| Vai trò       | Tài khoản | Mật khẩu   |
| ------------- | --------- | ---------- |
| Quản trị viên | `admin`   | `admin123` |

> ⚠️ **Lưu ý**: Hãy đổi mật khẩu ngay sau khi đăng nhập lần đầu

---

## 📱 Hướng dẫn sử dụng

### Bước 1: Thêm thiết bị mới

1. Vào mục **"Thiết bị"** trên thanh menu
2. Nhấn nút **"Thêm thiết bị"**
3. Điền thông tin: Tên, Model, Vị trí, Khoa phòng...
4. Nhấn **"Tạo thiết bị"**

### Bước 2: In mã QR

1. Trong danh sách thiết bị, nhấn biểu tượng **QR**
2. Nhấn **"In mã QR"**
3. Dán mã QR lên thiết bị tương ứng

### Bước 3: Kiểm tra hàng ngày

1. Mở trang **"Kiểm tra"** hoặc quét mã QR trên thiết bị
2. Chọn trạng thái: ✅ Tốt / ⚠️ Có vấn đề / ❌ Nghiêm trọng
3. Ghi chú nếu cần và nhấn **"Ghi nhận"**

### Bước 4: Xem báo cáo

- Vào **"Dashboard"** để xem thống kê tổng quan
- Vào **"Lịch sử kiểm tra"** để xem chi tiết từng lần kiểm tra

---

## 👥 Phân quyền người dùng

| Vai trò           | Quyền hạn                                                    |
| ----------------- | ------------------------------------------------------------ |
| **Quản trị viên** | Toàn quyền: quản lý thiết bị, người dùng, cài đặt hệ thống   |
| **Kiểm tra viên** | Quản lý thiết bị và kiểm tra trong khoa phòng được phân công |
| **Kỹ thuật viên** | Xem thiết bị, xử lý sự cố được giao                          |
| **Người xem**     | Chỉ xem và thực hiện kiểm tra                                |

---

## ✨ Tính năng nổi bật

| Tính năng                  | Mô tả                                             |
| -------------------------- | ------------------------------------------------- |
| 🔍 **Quét QR kiểm tra**    | Nhân viên chỉ cần quét mã QR để ghi nhận kiểm tra |
| 📊 **Dashboard trực quan** | Biểu đồ thống kê dễ hiểu                          |
| 🔔 **Thông báo Zalo**      | Nhận cảnh báo khi thiết bị có vấn đề              |
| 🌙 **Chế độ tối**          | Hỗ trợ giao diện sáng/tối                         |
| 📱 **Responsive**          | Sử dụng tốt trên điện thoại và máy tính           |
| 🔒 **Phân quyền rõ ràng**  | Mỗi người dùng chỉ thấy dữ liệu phù hợp           |

---

## ❓ Câu hỏi thường gặp

**Q: Ứng dụng có miễn phí không?**  
A: Có, ứng dụng hoàn toàn miễn phí và mã nguồn mở.

**Q: Dữ liệu có an toàn không?**  
A: Dữ liệu được lưu trữ trên máy chủ của bạn, không chia sẻ với bên thứ ba.

**Q: Cần hỗ trợ kỹ thuật?**  
A: Liên hệ qua GitHub Issues hoặc email của nhà phát triển.

---

## 📞 Liên hệ & Hỗ trợ

- 🌐 **GitHub**: [github.com/thuanhuynhh/medical-device-management](https://github.com/thuanhuynhh/medical-device-management)
- 📧 **Issues**: Tạo issue trên GitHub nếu gặp lỗi

---

**Copyrights (c) 2026 All rights reserved**
