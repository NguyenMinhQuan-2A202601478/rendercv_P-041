# RenderCV Web Editor

Trình soạn CV chạy trên trình duyệt cho RenderCV: giao diện ba khung (danh
sách CV, khung soạn thảo, xem trước PDF trực tiếp), trong đó mỗi CV được
chỉnh qua bốn tab -- **CV, Design, Locale, Settings** -- mỗi tab có hai chế
độ đồng bộ hai chiều (form sinh từ schema, hoặc YAML thô), kèm bộ đổi theme,
tự động lưu, và tải PDF.

Ứng dụng được xây **trên chính core Python của repository này**, không viết
lại: `web/backend` import `rendercv` dưới dạng editable dependency và gọi
đúng pipeline mà CLI dùng, nên phần render và validate không thể lệch khỏi
core.

```
web/backend    Dịch vụ FastAPI bọc core (validate, render, schema,
               themes, lưu trữ CV, preferences)
web/frontend   Giao diện SvelteKit + TypeScript + Tailwind
```

## Yêu cầu môi trường

- **uv** (Python 3.12+) -- dùng cho mọi thứ liên quan Python; tuyệt đối
  không dùng `pip` hay gọi `python` trực tiếp.
- **Node.js 20+** kèm npm.

## Cài đặt

Cài một lần cho cả hai workspace:

```
cd web/backend
uv sync

cd ../frontend
npm install
```

Backend phụ thuộc vào core ở thư mục gốc repository dưới dạng *editable*
path dependency, nên sửa core là có hiệu lực ngay, không cần cài lại.

## Chạy ứng dụng

Hai tiến trình, ở hai terminal:

```
cd web/backend
uv run uvicorn rendercv_web.app:app --port 8000
```

```
cd web/frontend
npm run dev
```

Mở <http://localhost:5173>. Dev server của Vite proxy `/api` sang backend ở
cổng 8000, nên **cả hai đều phải đang chạy**.

Schema database được migrate **tự động khi backend khởi động**
(`upgrade_to_head` trong lifespan của app) -- không có bước
`alembic upgrade` thủ công. Nếu không cấu hình gì, backend tạo file
`web/backend/data/rendercv_web.db` (SQLite) tương đối theo thư mục làm việc
hiện tại.

Ứng dụng không có đăng nhập: một cookie đã ký cấp cho mỗi trình duyệt một
phiên ẩn danh, và các CV thuộc về phiên đó.

## Cấu hình

| Biến môi trường | Mặc định | Ghi chú |
| --- | --- | --- |
| `RENDERCV_WEB_DATABASE_URL` | `sqlite:///./data/rendercv_web.db` | Nhận mọi URL kiểu SQLAlchemy. Postgres chạy được mà không cần sửa code. |
| `RENDERCV_WEB_SECRET` | *(giá trị dev không an toàn)* | Dùng để ký cookie phiên. **Bắt buộc phải đặt trước khi deploy** -- xem mục [Deploy](#deploy). |
| `RENDERCV_WEB_HTTPS` | *(tắt)* | Đặt `1` khi phục vụ qua HTTPS để cookie phiên có cờ `Secure`. |
| `RENDERCV_WEB_ALLOWED_ORIGINS` | `http://localhost:5173` | Origin được phép gọi API, ngăn cách bằng dấu phẩy. Chỉ cần khi frontend khác origin với API. |
| `GOOGLE_OAUTH_CLIENT_ID` / `_SECRET` / `_REDIRECT_URI` | *(chưa đặt)* | Bật đăng nhập Google. Chưa đặt thì giao diện đăng nhập bị ẩn hoàn toàn. |

## Kiểm thử

Mỗi tầng có gate riêng. Tất cả phải xanh trước khi mở PR.

**Core** (chạy từ thư mục gốc repository):

```
just check
just test
```

**Backend:**

```
cd web/backend
uv run pytest -q
```

**Frontend** (kiểm tra kiểu, unit test, build production):

```
cd web/frontend
npm run check
npm run test
npm run build
```

**End-to-end (Playwright).** Bộ test này điều khiển trình duyệt thật, gọi
vào backend thật, nên backend phải đang chạy -- và đây là chỗ duy nhất mà
làm sai sẽ mất dữ liệu:

> **Luôn trỏ backend của e2e vào một database dùng-một-lần.** Chạy bộ test
> vào `web/backend/data/rendercv_web.db` mặc định sẽ ghi CV test vào dữ liệu
> phát triển của bạn, đồng thời làm các test phụ thuộc thứ tự bootstrap
> chập chờn.

PowerShell:

```
$env:RENDERCV_WEB_DATABASE_URL = "sqlite:///$env:TEMP/rendercv_e2e.db"
cd web/backend
uv run uvicorn rendercv_web.app:app --port 8000
```

Rồi ở terminal khác:

```
cd web/frontend
npm run test:e2e
```

Playwright tự dựng frontend **riêng** ở cổng 5199 (không phải 5173) nên
không tranh cổng với dev server bạn đang mở. Nó chạy `workers: 1` một cách
có chủ đích: backend dev chỉ là một tiến trình uvicorn duy nhất, và các lần
render Typst nặng CPU sẽ làm nghẽn chính event loop của nó khi chạy song
song.

## Tuỳ chọn: xem trước phía client (WASM)

Bình thường bản xem trước do backend render, và đó vẫn là bộ render chuẩn.
Ngoài ra còn một đường chạy hoàn toàn phía client: Pyodide chạy wheel
rendercv để sinh mã nguồn Typst, rồi typst.ts biên dịch ra PDF ngay trong
trình duyệt, không gọi `/api/render` lần nào.

Tính năng này **mặc định tắt** và không tốn gì cho tới khi được bật. Muốn
thử, build assets một lần (~30 MB, đổ vào `static/wasm/` đã được gitignore):

```
cd web/frontend
npm run build:wasm-assets
```

Rồi bật cờ trong console của trình duyệt và tải lại trang:

```
localStorage.setItem('rendercv.wasmPreview', 'true')
```

Giới hạn đã biết: chỉ có font của theme classic, bản thân Pyodide được tải
từ CDN jsdelivr, và vài dependency Python thuần nhỏ được lấy từ PyPI lúc
chạy. Khởi động nguội mất khoảng 17-20 giây; các lần render sau khi đã nóng
máy dưới một giây.

## Đăng nhập Google (tuỳ chọn)

Ứng dụng chạy đầy đủ mà không cần đăng nhập -- phiên ẩn danh theo cookie là
mặc định. Bật đăng nhập chỉ thêm một khả năng: dùng chung CV giữa nhiều
trình duyệt và thiết bị.

Khi chưa cấu hình, backend báo `provider_available: false` và giao diện **ẩn
toàn bộ** nút đăng nhập -- không có nút chết.

Tạo OAuth client ở [Google Cloud Console](https://console.cloud.google.com/apis/credentials):
chọn *Create credentials* → *OAuth client ID* → *Web application*, rồi khai
báo **Authorized redirect URI** đúng bằng địa chỉ mà trình duyệt sẽ quay về:

| Môi trường | Redirect URI |
| --- | --- |
| Dev | `http://localhost:5173/api/auth/google/callback` |
| Deploy | `https://<tên-miền-của-bạn>/api/auth/google/callback` |

URI phải khớp **từng ký tự**, kể cả `https` và dấu `/` cuối. Sai một chút là
Google trả `redirect_uri_mismatch`.

Rồi đặt biến môi trường cho backend:

```
GOOGLE_OAUTH_CLIENT_ID=...
GOOGLE_OAUTH_CLIENT_SECRET=...
GOOGLE_OAUTH_REDIRECT_URI=https://<tên-miền-của-bạn>/api/auth/google/callback
```

Lần đầu một người đăng nhập, các CV họ đã soạn khi còn ẩn danh **được gộp
vào tài khoản**, không mất gì. Đăng nhập ở trình duyệt thứ hai cũng vậy: CV
soạn ẩn danh ở máy đó được chuyển vào tài khoản đã có.

## Deploy

### Biến môi trường

| Biến | Bắt buộc | Ghi chú |
| --- | --- | --- |
| `RENDERCV_WEB_SECRET` | **Có** | Chuỗi ngẫu nhiên đủ dài, giữ ngoài mã nguồn. Xem cảnh báo bên dưới. |
| `RENDERCV_WEB_HTTPS` | **Có** (khi chạy HTTPS) | Đặt `1` để cookie phiên được đánh dấu `Secure`. Không đặt thì cookie đi qua mạng ở dạng đọc được. |
| `RENDERCV_WEB_DATABASE_URL` | Nên có | Chuỗi kết nối Postgres. Không đặt thì rơi về SQLite theo file, sẽ mất dữ liệu mỗi lần container khởi động lại. |
| `RENDERCV_WEB_ALLOWED_ORIGINS` | Chỉ khi khác origin | Danh sách origin của frontend, ngăn cách bằng dấu phẩy. Bỏ qua nếu frontend và API cùng một origin. |
| `GOOGLE_OAUTH_*` | Không | Xem mục trên. |

> **`RENDERCV_WEB_SECRET` là thứ dễ quên nhất và hậu quả nặng nhất.** Giá
> trị dự phòng là một chuỗi hardcode nằm trong repository công khai -- ai
> cũng có thể giả mạo cookie phiên có chữ ký hợp lệ và đọc CV của người
> khác. Backend chỉ ghi cảnh báo vào log chứ không chặn, nên không có gì
> nhắc bạn ngoài dòng log đó.

### Postgres

Cài kèm driver -- **đây là bước hay bị bỏ sót**, thiếu nó backend chết ngay
lúc khởi động:

```
uv sync --extra postgres
```

Chuỗi kết nối dán thẳng từ nhà cung cấp là dùng được. Cả ba dạng dưới đây
đều chạy, vì backend tự chuẩn hoá về driver đã cài:

```
postgres://...              (Railway, Heroku)
postgresql://...            (Neon, Supabase)
postgresql+psycopg://...    (dạng SQLAlchemy đầy đủ)
```

Không cần chạy migration bằng tay: backend tự nâng schema lên bản mới nhất
lúc khởi động.

### CORS

Nếu frontend và API phục vụ **cùng một origin** (reverse proxy đưa `/api`
về backend), bỏ qua mục này.

Nếu **khác origin** (ví dụ frontend trên Vercel, backend trên Railway), phải
khai báo origin của frontend:

```
RENDERCV_WEB_ALLOWED_ORIGINS=https://cv.example.com
```

Cookie phiên gửi kèm `credentials`, nên trình duyệt sẽ **từ chối** mọi
request nếu origin không khớp chính xác. Triệu chứng rất dễ gây hiểu lầm:
trang tải bình thường nhưng không đăng nhập được và không lưu được gì, dấu
vết duy nhất là lỗi CORS trong console.

## Đọc tiếp ở đâu

- `docs/plans/active/cv-editor-web-app.md` -- kế hoạch thực thi, kèm bằng
  chứng kiểm chứng của từng phase.
- `graphify-out/GRAPH_REPORT.md` -- bản đồ sinh tự động về cách core và các
  tầng web kết nối với nhau.
- `CLAUDE.md` ở thư mục gốc -- quy ước code, áp dụng cho cả Python trong
  `web/backend` lẫn core.
