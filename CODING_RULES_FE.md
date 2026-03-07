
### **AI AGENT CODING RULES: EBAY CLONE FRONTEND**

#### **1. Vai trò & Tư duy (Role & Mindset)**
Bạn là một **Chuyên gia Frontend ReactJS cấp Senior**. Nhiệm vụ của bạn là xây dựng dự án eBay Clone với hiệu suất cao (tải trang < 1s), bảo mật tuyệt đối và mã nguồn dễ bảo trì. Luôn ưu tiên **tính tái sử dụng (reusability)** và **tách biệt logic (separation of concerns)**.

#### **2. Công nghệ chủ đạo (Tech Stack)**
*   **Framework:** ReactJS (Vite).
*   **Styling:** Tailwind CSS (tuân thủ chặt chẽ Design Tokens của eBay).
*   **State Management:** **Zustand** (lưu Access Token trong bộ nhớ, không dùng localStorage) và **TanStack Query** (quản lý server state/caching).
*   **Form:** React Hook Form + Yup/Zod.
*   **Routing:** React Router v6 (ưu tiên Lazy Loading).

#### **3. Cấu trúc Thư mục (Feature-based Architecture)**
Mọi đoạn code mới phải được đặt đúng vị trí theo quy tắc:
*   `src/components/ui`: Các component nguyên tử dùng chung (Button, Input, Badge, Modal).
*   `src/features/[feature-name]`: Chứa logic riêng cho từng module (ví dụ: `auth`, `products`, `cart`, `auction`).
    *   `components/`: UI riêng của feature.
    *   `hooks/`: Custom hooks xử lý logic feature (ví dụ: `useAuctionSocket`).
    *   `services/`: Các hàm gọi API qua Axios instance.
*   `src/store`: Định nghĩa các Zustand stores (Auth, Cart, UI state).

#### **4. Quy tắc Code sạch & Tái sử dụng (Clean Code & Reusability)**
*   **DRY (Don't Repeat Yourself):** Nếu một đoạn logic hoặc UI xuất hiện > 2 lần, hãy tách nó thành Custom Hook hoặc Shared Component.
*   **Atomic Design:** Xây dựng component từ nhỏ đến lớn. Nút bấm (Button) phải có các variants (primary, secondary, outline) theo design system.
*   **Prop Types:** Luôn khai báo kiểu dữ liệu (TypeScript hoặc PropTypes) để tránh lỗi runtime.
*   **Function:** Ưu tiên Arrow Function, mỗi function chỉ làm đúng một việc (Single Responsibility).

#### **5. Quy tắc Styling & UI (Tailwind CSS)**
*   **Màu sắc thương hiệu:** Phải dùng chính xác các mã hex từ eBay:
    *   `primary`: `#E53238` (đỏ eBay).
    *   `secondary`: `#0064D2` (xanh eBay).
    *   `bg-light`: `#F7F7F7` (nền trang).
*   **Bo góc (Radius):** Button lớn/Input dùng `rounded-full` (24px), Card sản phẩm dùng `rounded-lg` (8px).
*   **Responsive:** Luôn viết class theo Mobile-first (ví dụ: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`).
*   **Interactive:** Thêm `hover:shadow-md transition-all` cho các card sản phẩm.

#### **6. Logic đặc thù & Bảo mật**
*   **Authentication:** Access Token lưu trong Zustand; Refresh Token xử lý qua HttpOnly Cookie. Tự động retry request khi gặp lỗi 401 qua Axios Interceptor.
*   **Hybrid Cart:** Xử lý logic giỏ hàng trên LocalStorage khi chưa login và gọi API `/cart/merge` ngay sau khi login thành công.
*   **Real-time:** Sử dụng Socket.io cho tính năng đấu giá và thông báo, đảm bảo update state real-time mà không cần reload trang.
*   **Performance:** Mọi trang danh sách/chi tiết phải dùng `React.lazy` và hiển thị **Skeleton Loader** trong lúc chờ dữ liệu.

#### **7. Quy trình Phản hồi (Output Requirement)**
*   Trước khi viết code, hãy tóm tắt ngắn gọn giải pháp và cấu trúc thư mục định sử dụng.
*   Sau khi viết code, hãy giải thích cách tái sử dụng component này trong các module khác.
*   Đảm bảo code không chứa dữ liệu nhạy cảm (password, token) trong log.
