# Chạy trên localhost (PowerShell)

Sổ tay lệnh cho Windows + PowerShell. Phần *cài đặt lần đầu* (submodule,
`just sync`, `npm install`) nằm ở [`README.md`](README.md) — file này là
những lệnh bạn gõ **hằng ngày** sau khi đã cài xong.

> **PowerShell 5.1 không hiểu `&&`.** Chép lệnh nhiều dòng từ tài liệu kiểu
> bash vào đây sẽ báo `The token '&&' is not a valid statement separator in
> this version`. Mọi lệnh dưới đây đã viết đúng cú pháp PowerShell — chạy
> **từng dòng một**.

## Khởi động

Cần **hai** terminal. Backend trước, frontend sau.

### Terminal 1 — Backend (cổng 8000)

```powershell
Set-Location "C:\AI Thuc Chien\PROJECT\rendercv_P-041\web\backend"
```

```powershell
uv run --env-file .env uvicorn rendercv_web.app:app --port 8000
```

> **`--env-file .env` là phần dễ quên nhất.** Thiếu nó, backend không đọc
> `GOOGLE_OAUTH_CLIENT_ID`/`_SECRET`, và giao diện đăng nhập sẽ **bị ẩn**
> dù bạn đã điền đúng vào `.env` — trông y như tính năng bị hỏng.
>
> Chưa có `.env`? Chạy `Copy-Item .env.example .env` rồi mở ra điền. Nếu
> chỉ cần chạy ẩn danh trên SQLite thì bỏ luôn cờ này.

### Terminal 2 — Frontend (cổng 5173)

```powershell
Set-Location "C:\AI Thuc Chien\PROJECT\rendercv_P-041\web\frontend"
```

```powershell
npm run dev
```

Mở <http://localhost:5173>. Trang chủ là landing; editor ở
<http://localhost:5173/app>.

Frontend proxy `/api` sang cổng 8000, nên **thiếu backend là editor không
tải được CV nào**.

## Kiểm tra nhanh xem đã lên chưa

```powershell
Invoke-RestMethod http://localhost:8000/api/auth/me
```

Trả về JSON có `provider_available`. `true` nghĩa là backend đã đọc được
credentials Google; `false` là chưa cấu hình (vẫn chạy bình thường, chỉ ẩn
nút đăng nhập).

## Chạy test

### Core (thư mục gốc repository)

```powershell
Set-Location "C:\AI Thuc Chien\PROJECT\rendercv_P-041"
```

```powershell
just check
```

```powershell
just test
```

Trên Windows sẽ có **2 test bị skip** — đúng như dự kiến, không phải lỗi.

### Backend

```powershell
Set-Location "C:\AI Thuc Chien\PROJECT\rendercv_P-041\web\backend"
```

```powershell
uv run --frozen pytest -q
```

### Frontend

```powershell
Set-Location "C:\AI Thuc Chien\PROJECT\rendercv_P-041\web\frontend"
```

```powershell
npm run check
```

```powershell
npm run test
```

### End-to-end (Playwright)

> **Bắt buộc dùng database dùng-một-lần.** Chạy e2e vào database mặc định
> `web/backend/data/rendercv_web.db` sẽ ghi CV test vào dữ liệu thật của
> bạn và làm các test phụ thuộc thứ tự bootstrap chập chờn.

Terminal 1 — backend riêng cho test:

```powershell
Set-Location "C:\AI Thuc Chien\PROJECT\rendercv_P-041\web\backend"
```

```powershell
$env:RENDERCV_WEB_DATABASE_URL = "sqlite:///$env:TEMP/rendercv_e2e.db"
```

```powershell
uv run uvicorn rendercv_web.app:app --port 8000
```

Terminal 2:

```powershell
Set-Location "C:\AI Thuc Chien\PROJECT\rendercv_P-041\web\frontend"
```

```powershell
npx playwright test
```

Playwright tự dựng frontend **riêng ở cổng 5199**, không dùng cổng 5173 —
nên dev server bạn đang mở không bị ảnh hưởng.

Xong nhớ mở terminal mới hoặc gỡ biến, kẻo lần sau chạy backend lại trỏ
vào database tạm:

```powershell
Remove-Item Env:\RENDERCV_WEB_DATABASE_URL
```

## Xem log

Backend in log thẳng ra terminal đang chạy nó. Muốn giữ lại thành file:

```powershell
uv run --env-file .env uvicorn rendercv_web.app:app --port 8000 2>&1 | Tee-Object -FilePath "$env:TEMP\rendercv-backend.log"
```

Theo dõi file log ở terminal khác:

```powershell
Get-Content "$env:TEMP\rendercv-backend.log" -Wait -Tail 20
```

Lọc riêng những request đáng chú ý:

```powershell
Get-Content "$env:TEMP\rendercv-backend.log" -Wait | Select-String -Pattern "PUT /api/cvs|4\d\d|5\d\d"
```

Vài dòng log hay gặp và ý nghĩa:

| Dòng log | Nghĩa |
| --- | --- |
| `RENDERCV_WEB_SECRET is not set` | Bình thường khi chạy local; **bắt buộc phải đặt trước khi deploy** |
| `PUT /api/cvs/{id} 200` | Autosave thành công |
| `PUT /api/cvs/{id} 409` | Xung đột — CV bị sửa ở nơi khác, giao diện sẽ hiện thanh hoà giải |
| `PUT /api/cvs/{id} 404` | Trang cũ đang lưu vào một CV không còn tồn tại (hay gặp khi vừa đổi database) |
| `POST /api/render 200` | Render PDF xong |
| `Google token exchange failed` | Sai `GOOGLE_OAUTH_CLIENT_SECRET` |

## Khi cổng đã bị chiếm

Triệu chứng: backend báo lỗi bind, hoặc frontend gọi `/api` nhận 404/502 dù
"đã chạy backend rồi".

**Xem ai đang giữ cổng:**

```powershell
Get-NetTCPConnection -LocalPort 8000,5173 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { $p = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue; "$($_.LocalPort) <- PID $($_.OwningProcess) $($p.ProcessName)" }
```

**Xác nhận đúng ứng dụng của mình đang trả lời** (quan trọng hơn bạn tưởng —
một app khác cũng có thể đang chiếm cổng 8000):

```powershell
(Invoke-RestMethod http://localhost:8000/openapi.json).info.title
```

Phải ra `RenderCV Web Editor API`. Ra tên khác nghĩa là cổng thuộc về ứng
dụng khác, và mọi thứ bạn thấy trên trình duyệt đều không đến từ dự án này.

**Dừng backend của dự án này** (lọc theo đường dẫn, không đụng Python khác):

```powershell
Get-CimInstance Win32_Process -Filter "Name='python.exe'" | Where-Object { $_.CommandLine -like '*rendercv_P-041*' -and $_.CommandLine -like '*uvicorn*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
```

Ba nguồn chiếm cổng thường gặp, theo thứ tự dễ bỏ sót:

1. **Tiến trình uvicorn mồ côi** — đóng terminal không phải lúc nào cũng
   giết tiến trình con. Dùng lệnh lọc ở trên.
2. **Container Docker** — kiểm bằng `docker ps --filter "publish=8000"`,
   dừng bằng `docker stop <ten-container>`.
3. **Ứng dụng chạy trong WSL** — khó nhất: `Get-Process` không thấy PID mà
   `netstat` báo, vì cổng được `wslrelay` chuyển tiếp. Phải vào WSL để dừng.

## Đăng nhập Google trên localhost

Không bắt buộc — ứng dụng chạy đầy đủ ở chế độ ẩn danh.

Muốn bật: điền `GOOGLE_OAUTH_CLIENT_ID` và `GOOGLE_OAUTH_CLIENT_SECRET` vào
`web/backend/.env`, khởi động backend **có `--env-file .env`**, rồi mở
<http://localhost:5173/app>.

Redirect URI phải khai báo trong Google Cloud Console **đúng từng ký tự**:

```
http://localhost:5173/api/auth/google/callback
```

Cổng là **5173** (frontend), không phải 8000 — vì trình duyệt phải quay về
đúng origin đang giữ cookie phiên.

Đọc lỗi theo vị trí xảy ra:

| Lỗi | Nguyên nhân |
| --- | --- |
| `401 invalid_client` **ngay lập tức** | Sai Client ID |
| Vào được màn hình chọn tài khoản, chọn xong **rồi** mới lỗi | Sai Client secret |
| `redirect_uri_mismatch` | Redirect URI khai báo không khớp |

Hướng dẫn tạo OAuth client từng bước:
[`../docs/runbooks/enable-google-sign-in-and-postgres.md`](../docs/runbooks/enable-google-sign-in-and-postgres.md).

## Dọn dẹp

Dừng tất cả tiến trình của dự án này:

```powershell
Get-CimInstance Win32_Process -Filter "Name='python.exe'" | Where-Object { $_.CommandLine -like '*rendercv_P-041*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
```

Frontend thì `Ctrl+C` ở terminal của nó là đủ.
