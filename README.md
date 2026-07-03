# VESTA Halo — Landing Page

Landing page giới thiệu **VESTA Halo**, một chiếc nhẫn thông minh (smart ring)
theo dõi giấc ngủ, nhịp tim và phục hồi. Xây dựng thuần **HTML5 + CSS3 +
Vanilla JavaScript**, không dùng framework hay build step, để tối ưu tốc độ
tải và dễ deploy lên bất kỳ static host nào.

## 1. Cấu trúc thư mục

```
vesta-landing/
├── index.html        # Toàn bộ markup: hero, features, scrollytelling,
│                      # specs, mini-shop, reviews, newsletter, FAQ, chatbot
├── css/
│   └── style.css      # Design tokens (CSS variables), layout, responsive,
│                      # animation, dark/light theme
├── js/
│   └── main.js         # Toàn bộ hành vi: theme toggle, scroll reveal,
│                      # giỏ hàng/yêu thích/đã xem, validate form + webhook,
│                      # chatbot rule-based, skeleton loading, tracking click/scroll
├── robots.txt
├── sitemap.xml
├── vercel.json         # Cache headers cho deploy trên Vercel
└── README.md
```

Không có thư viện ngoài nào được tải ngoài Google Fonts (preconnect + swap)
— mọi hình minh hoạ (ring halo, icon...) đều là SVG/CSS thuần, không có ảnh
raster, giúp payload trang cực nhẹ và điểm PageSpeed cao.

## 2. Chạy thử ở local

Không cần build step. Chỉ cần một static server bất kỳ:

```bash
# Cách 1: Python
python3 -m http.server 8080

# Cách 2: Node
npx serve .

# Cách 3: VS Code Live Server extension
```

Mở `http://localhost:8080`.

## 3. Các yêu cầu đã đáp ứng

**Giao diện & UX**
- Hero, tính năng nổi bật, thông số kỹ thuật, form đăng ký nhận tin (đủ 4 khối bắt buộc)
- Design system riêng: bảng màu midnight-ink + gold + lavender, type pairing
  Fraunces/Inter/IBM Plex Mono, không dùng theme mặc định
- Responsive đầy đủ mobile → desktop, menu mobile riêng, grid co giãn

**Hiệu năng & SEO**
- Không ảnh raster (toàn SVG/CSS) → payload nhỏ, LCP nhanh
- `font-display: swap`, preconnect Google Fonts, `defer` cho JS
- Thẻ meta Title/Description/Keywords/Canonical, Open Graph, Twitter Card,
  JSON-LD `Product` schema, `robots.txt`, `sitemap.xml`

**Điểm cộng đã làm**
- Dark mode / Light mode toggle (lưu `localStorage`)
- Scroll reveal animation (`IntersectionObserver`), scrollytelling có parallax
  ở section "Cách hoạt động"
- Skeleton loading cho khối đánh giá khách hàng
- Micro-interactions: hover card nâng lên, nút bấm co giãn khi click, swatch
  màu phóng to khi hover, toast notification
- Form đăng ký nhận tin: validate client-side đầy đủ (tên, email regex, số
  điện thoại VN, checkbox đồng ý) + gửi `fetch POST` tới Webhook (đổi
  `WEBHOOK_URL` trong `js/main.js` sang endpoint thật, tạo free tại
  https://webhook.site để test nhanh)
- Theo dõi hành vi người dùng: click các CTA quan trọng và scroll-depth
  (25/50/75/90%) được log qua hàm `track()` trong `main.js` — có thể nối
  thẳng vào Google Analytics / Mixpanel / server riêng, kèm toast hiển thị
  trực quan khi một mốc scroll được ghi nhận
- Mini thương mại điện tử: chọn màu/size, thêm giỏ hàng, giỏ hàng dạng
  drawer trượt, danh sách yêu thích, "đã xem gần đây" — toàn bộ lưu trong
  `localStorage` nên vẫn còn khi tải lại trang
- Chatbot góc màn hình: rule-based trả lời câu hỏi thường gặp (giá, pin,
  chống nước, size, bảo hành...), có gợi ý câu hỏi nhanh, hiệu ứng "đang gõ".
  Có thể nâng cấp thành gọi API thật (OpenAI/Gemini/Claude) bằng cách thay
  nội dung hàm `getBotReply()` trong `main.js` bằng một lệnh `fetch` tới
  backend.

## 4. Kết nối Webhook thật

Trong `js/main.js`, đầu file:

```js
const WEBHOOK_URL = "https://webhook.site/a6e446d7-5bb5-4d32-ac02-4a18bd6ddb95"; 
```

Form đăng ký nhận tin sẽ POST JSON:

```json
{
  "fullName": "Nguyễn Văn A",
  "email": "ban@vidu.com",
  "phone": "0901234567",
  "source": "vesta-landing-page",
  "submittedAt": "2026-07-03T10:00:00.000Z"
}
```

## 5. Quy trình Git đề xuất

Repo local đã được khởi tạo với lịch sử commit rõ ràng theo nhánh tính năng:

```
main
 ├─ feature/design-system     (design tokens, css base)
 ├─ feature/hero-and-nav
 ├─ feature/features-and-story
 ├─ feature/specs-and-shop
 ├─ feature/newsletter-and-faq
 ├─ feature/chatbot
 └─ feature/seo-and-perf
```

Mỗi nhánh merge vào `main` bằng `git merge --no-ff` kèm message rõ ràng
(xem `git log --oneline --graph --all`).

## 6. Deploy lên hosting miễn phí

### Đẩy code lên GitHub
```bash
git remote add origin https://github.com/<your-username>/vesta-halo-landing.git
git push -u origin main
```

### Deploy - trong 3 nền tảng miễn phí

**Vercel**
```bash
npm i -g vercel
vercel --prod
```
(hoặc import repo trực tiếp trên vercel.com — không cần build command vì
đây là static site thuần)

**Netlify**
- Kéo-thả cả thư mục vào https://app.netlify.com/drop, hoặc
```bash
npm i -g netlify-cli
netlify deploy --prod
```

**Cloudflare Pages**
- Trên dashboard: *Create a project → Connect to Git → Framework preset:
  None → Build command: (để trống) → Output directory: `/`*
