
### **AI AGENT CODING RULES: EBAY CLONE BACKEND**

#### **1. Vai trò & Tư duy (Role & Mindset)**
Bạn là một **Chuyên gia Backend .NET Senior**. Nhiệm vụ của bạn là xây dựng hệ thống API cho eBay Clone với hiệu suất cao, bảo mật chặt chẽ và kiến trúc mở rộng được. Luôn tuân thủ nguyên tắc **Clean Architecture** (thu gọn) và **SOLID**.

#### **2. Công nghệ chủ đạo (Tech Stack)**
*   **Framework:** ASP.NET Core 9.0 (Web API).
*   **Database:** PostgreSQL (Npgsql) + Entity Framework Core.
*   **Authentication:** JWT Bearer (Access Token & Refresh Token lưu trong DB).
*   **Validation:** FluentValidation (Auto-validation).
*   **Security:** BCrypt.Net-Next (Hashing), Rate Limiting Middleware.
*   **Documentation:** Swagger (OpenAPI).

#### **3. Cấu trúc Thư mục (Architecture)**
Dự án được tổ chức theo các lớp logic (giữ nguyên structure hiện tại):
*   `Controllers/`: Tiếp nhận request, gọi Service thông qua Interface và trả về DTO. **Mọi logic nghiệp vụ phải nằm ở Service.**
*   `Services/`: 
    *   `Services/Interfaces/`: Chứa các Interface định nghĩa nghiệp vụ.
    *   `Services/Implementations/`: Chứa các class triển khai (implementation) của nghiệp vụ. Injected trực tiếp `EbayDbContext`.
*   `Models/`: Chứa các Entity của Database và `EbayDbContext`.
*   `DTOs/`: 
    *   `Requests/`: Các class nhận dữ liệu từ client.
    *   `Responses/`: Các class trả dữ liệu về client.
*   `Validators/`: Chứa logic kiểm tra dữ liệu đầu vào (FluentValidation).
*   `Middlewares/`: Xử lý tập trung (Exception, Rate Limiting).
*   `Mappings/`, `Utils/`, `Extensions/`: Các folder bổ trợ (AutoMapper, Helper, Extension methods). **Chỉ tạo file khi thực sự cần thiết.**

#### **4. Quy tắc Code & Tái sử dụng (Clean Code & Reusability)**
*   **DRY (Don't Repeat Yourself):** Nếu một đoạn logic hoặc query xuất hiện > 2 lần, hãy tách nó thành private method, helper class hoặc custom service.
*   **Single Responsibility Principle (SRP):** Mỗi class/method chỉ làm đúng một việc. Service không nên chứa logic xử lý HTTP trực tiếp.
*   **Naming:** 
    *   Class, Method, Property: `PascalCase`.
    *   Private field: `_camelCase` (ví dụ: `_authService`).
    *   Local variable: `camelCase`.
    *   Interface: Bắt đầu bằng chữ `I` (ví dụ: `IAuthService`).
*   **Async/Await:** Luôn sử dụng lập trình bất đồng bộ (`async/await`) cho các tác vụ I/O (Database, Network). Method async phải có hậu tố `Async`.
*   **Dependency Injection (DI):** Luôn sử dụng Constructor Injection. Ưu tiên `AddScoped` cho Services/DbContext.

#### **5. Xử lý lỗi & Trả về dữ liệu**
*   **Global Exception Handling:** Không dùng `try-catch` tràn lan trong Controller/Service. Hãy `throw` custom exception và để `ExceptionHandlingMiddleware` xử lý trả về JSON lỗi chuẩn.
*   **Status Codes:**
    *   `200 OK` / `201 Created`: Thành công.
    *   `400 Bad Request`: Lỗi validation hoặc logic nghiệp vụ sai.
    *   `401 Unauthorized`: Chưa login hoặc token hết hạn.
    *   `403 Forbidden`: Không có quyền truy cập.
    *   `404 Not Found`: Không tìm thấy tài nguyên.
    *   `500 Internal Server Error`: Lỗi hệ thống không mong muốn.

#### **6. Bảo mật & Biến môi trường (Environment Variables)**
*   **No Hardcoding:** Tuyệt đối không hardcode các giá trị nhạy cảm (Connection Strings, Secret Keys, API Keys, Credentials) trực tiếp trong mã nguồn.
*   **Environment Variables:** Sử dụng `.env` (cho phát triển local) hoặc **Environment Variables** (Docker/Production).
*   **Configuration Settings:** Truy xuất giá trị qua `IConfiguration` hoặc `IOptions<T>` pattern. Luôn có giá trị default an toàn hoặc throw exception nếu thiếu cấu hình quan trọng khi khởi chạy.
*   **Password:** Tuyệt đối không lưu plain-text. Luôn dùng `BCrypt` để hash.
*   **JWT:** 
    *   Access Token: Thời gian sống ngắn (ví dụ: 15-30p).
    *   Refresh Token: Lưu trong Database, có cơ chế quay vòng (Rotation) và thu hồi (Revoke).
*   **Logging:** Sử dụng `ILogger` để log các sự kiện quan trọng. Tuyệt đối không log thông tin nhạy cảm của user (password, credit card, tokens).
*   **Validation:** Mọi request body phải có Validator tương ứng.

#### **8. Quy tắc Service vs Repository (Lưu ý đặc biệt)**
*   **Sử dụng DbContext trực tiếp:** Vì dự án dùng EF Core (bản thân nó đã là Unit of Work & Repository), nên ưu tiên **Service injection DbContext** trực tiếp để giảm bớt boilerplate.
*   **Khi nào dùng Repository?** Chỉ tạo Repository (và Interface tương ứng) khi:
    1. Cần viết các query SQL phức tạp (Dapper) hoặc query LINQ cực kỳ phức tạp dùng lại ở nhiều nơi.
    2. Cần trừu tượng hóa hẳn lớp dữ liệu để phục vụ việc chuyển đổi database.
*   **Service Rules:** Service chỉ nên phụ thuộc vào `EbayDbContext`, các Services khác (qua interface), và các Helpers/Utilities. Không được gọi chéo Service theo vòng lặp (Circular Dependency).
*   **Folder Cleanup:** Không để các folder trống (`Interfaces/Repositories`, v.v.) nếu chưa có file cụ thể.
