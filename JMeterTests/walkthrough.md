# Hướng dẫn Test JMeter cho Product API

Tài liệu này hướng dẫn cách sử dụng các file trong thư mục `JMeterTests` để kiểm tra hiệu năng (load test).

## 1. Chuẩn bị
1. **Cài đặt JMeter**: Tải xuống từ [jmeter.apache.org](https://jmeter.apache.org/download_jmeter.cgi) và giải nén.
2. **Khởi động Backend & Frontend**: 
   - Backend: Cổng 5000.
   - Frontend: Cổng 5173.

## 2. Cách chạy Test
1. Mở JMeter (`bin/jmeter.bat`).
2. Chọn **File > Open** và chọn file trong thư mục `e:\Net_Csharp\Ebay-Clone\JMeterTests`.
3. Nhấn nút **Start** (Play xanh).

## 3. Các file test
- `product_load_test.jmx`: Test riêng API Backend.
- `unified_load_test.jmx`: Test luồng người dùng thật (vào FE rồi load API).
## 4. Cách tùy chỉnh Load (Ví dụ 1000 users, 100 request/s)
Để thay đổi số lượng request và tốc độ tăng trưởng, bạn chọn mục **Thread Group** (Ví dụ: "Product Page Load Scenario") và sửa:
- **Number of Threads (users)**: Nhập `1000` (Tổng số request/user).
- **Ramp-up period (seconds)**: Nhập `10`. 
  - *Giải thích*: Với 1000 users trong 10 giây, JMeter sẽ tự động tăng 100 users mỗi giây cho đến khi đạt 1000.
- **Loop Count**: Số lần lặp lại của mỗi user (trong Loop Controller).

> [!TIP]
> Bạn nên bắt đầu với số lượng user thấp rồi tăng dần để tránh làm treo máy tính cá nhân khi đang chạy dev.
