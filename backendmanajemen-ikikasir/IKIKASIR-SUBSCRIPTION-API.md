# IKIKASIR Subscription API Specification

> Dokumen rancangan API untuk mengelola langganan aplikasi Android
> IKIKASIR melalui Website Manajemen IKIKASIR.
>
> **Stack:** Node.js + TypeScript + Express (sesuaikan dengan framework
> yang sudah digunakan), PostgreSQL, Prisma ORM, Vue.js, Android
> Kotlin + Firebase Authentication.
>
> **Status:** Spesifikasi awal. Endpoint, nama field, dan relasi perlu
> diselaraskan dengan `prisma/schema.prisma` serta pola API yang sudah
> ada sebelum implementasi.

------------------------------------------------------------------------

## 1. Tujuan

API ini digunakan untuk:

-   Menampilkan dan mencari pelanggan IKIKASIR.
-   Melihat status langganan dan tanggal kedaluwarsa.
-   Memeriksa status langganan dari aplikasi Android.
-   Memproses perpanjangan langganan melalui admin website.
-   Menangguhkan atau mengaktifkan kembali langganan sesuai kewenangan.
-   Menyimpan riwayat pembayaran dan perubahan langganan.

Harga paket awal: **Rp250.000 untuk 12 bulan**. Harga dan durasi
sebaiknya berasal dari konfigurasi/paket di database, bukan nilai yang
dipercaya dari request client.

## 2. Arsitektur

``` text
Vue.js Website Manajemen
          |
          | HTTPS / JSON
          v
Node.js REST API
  - autentikasi dan otorisasi
  - validasi request
  - aturan bisnis langganan
  - transaksi database
          |
          v
PostgreSQL melalui Prisma ORM

Android IKIKASIR
  - Firebase Authentication untuk identitas pengguna
  - mengirim Firebase ID token ke API
  - API memverifikasi token dan mencocokkan UID
  - menerima status langganan dari server
```

PostgreSQL menjadi sumber utama data langganan yang dikelola website.
Firebase tetap digunakan untuk autentikasi Android dan layanan Firebase
yang sudah ada. Jangan menyimpan service account Firebase di aplikasi
Android atau frontend website.

## 3. Penyesuaian terhadap struktur backend yang sudah ada

Backend yang sudah diketahui berada di folder
`backendmanajemen-ikikasir` dan menggunakan TypeScript serta Prisma.
Pertahankan file yang ada; jangan mengganti seluruh struktur hanya untuk
fitur ini.

Struktur usulan:

``` text
backendmanajemen-ikikasir/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── app.ts
│   ├── server.ts
│   ├── config/
│   │   └── firebase-admin.ts       # bila belum ada dan diperlukan verifikasi token
│   ├── middlewares/
│   │   ├── authenticate.ts         # gunakan middleware existing bila tersedia
│   │   └── authorize-admin.ts      # gunakan middleware existing bila tersedia
│   └── modules/
│       └── subscriptions/
│           ├── subscription.routes.ts
│           ├── subscription.controller.ts
│           ├── subscription.service.ts
│           ├── subscription.repository.ts
│           ├── subscription.validation.ts
│           └── subscription.types.ts
├── .env
├── .env.example
├── package.json
├── prisma7.config.ts               # pertahankan jika memang digunakan project
└── tsconfig.json
```

**Catatan integrasi struktur:**

-   Jika project sudah memiliki folder `routes`, `controllers`,
    `services`, `middlewares`, atau pola modular lain, ikuti konvensi
    existing. Jangan membuat folder duplikat.
-   Jika backend sudah memiliki autentikasi admin, gunakan middleware
    tersebut; jangan membuat sistem login admin kedua.
-   Daftarkan router langganan melalui `src/app.ts`, mengikuti pola
    pemasangan router API yang sudah ada.
-   `src/server.ts` tetap bertanggung jawab menjalankan server sesuai
    implementasi existing.
-   Prisma adalah lapisan akses PostgreSQL. Hindari query SQL langsung
    jika pola project sudah menggunakan Prisma.
-   Periksa versi Prisma dan konfigurasi yang terpasang sebelum membuat
    migration atau mengubah konfigurasi Prisma.

## 4. Konvensi API

Base path yang diusulkan:

``` text
/api/v1
```

Format respons sukses:

``` json
{
  "success": true,
  "message": "Berhasil mengambil data",
  "data": {}
}
```

Format respons error:

``` json
{
  "success": false,
  "message": "Validasi gagal",
  "errors": [
    {
      "field": "durationMonths",
      "message": "Durasi tidak valid"
    }
  ]
}
```

Status HTTP yang digunakan:

-   `200 OK`: permintaan berhasil.
-   `201 Created`: data baru dibuat.
-   `400 Bad Request`: request tidak valid.
-   `401 Unauthorized`: token tidak ada atau tidak valid.
-   `403 Forbidden`: pengguna tidak memiliki izin.
-   `404 Not Found`: data tidak ditemukan.
-   `409 Conflict`: konflik status, misalnya pembayaran sudah diproses.
-   `422 Unprocessable Entity`: request valid secara format tetapi
    melanggar aturan bisnis.
-   `500 Internal Server Error`: kesalahan server; jangan mengirim stack
    trace ke client.

Semua endpoint produksi harus menggunakan HTTPS.

## 5. Rancangan endpoint

### 5.1 Admin --- daftar pelanggan beserta langganan

`GET /api/v1/admin/customers`

**Akses:** admin terautentikasi.

Query opsional:

  -----------------------------------------------------------------------
  Parameter               Tipe                    Keterangan
  ----------------------- ----------------------- -----------------------
  `search`                string                  Cari nama usaha,
                                                  pemilik, telepon, atau
                                                  ID yang diizinkan

  `status`                string                  `active`, `expired`,
                                                  `suspended`, `pending`

  `page`                  integer                 Halaman, default `1`

  `limit`                 integer                 Jumlah data, default
                                                  `20`, maksimum `100`

  `sortBy`                string                  Field yang masuk
                                                  allowlist

  `sortOrder`             string                  `asc` atau `desc`
  -----------------------------------------------------------------------

Contoh respons:

``` json
{
  "success": true,
  "message": "Daftar pelanggan berhasil diambil",
  "data": {
    "items": [
      {
        "id": "customer-uuid",
        "businessName": "Toko Contoh",
        "ownerName": "Pemilik Toko",
        "phone": "08xxxxxxxxxx",
        "subscription": {
          "id": "subscription-uuid",
          "status": "active",
          "startedAt": "2026-10-19T00:00:00.000Z",
          "expiresAt": "2027-10-19T00:00:00.000Z",
          "daysRemaining": 365
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

Status `active`/`expired` sebaiknya dihitung berdasarkan `expiresAt` dan
waktu server, dengan pengecualian status administratif seperti
`suspended`. Jangan hanya mengandalkan job terjadwal untuk menentukan
apakah langganan sudah kedaluwarsa.

### 5.2 Admin --- detail pelanggan

`GET /api/v1/admin/customers/:customerId`

Mengembalikan detail pelanggan, langganan saat ini, dan ringkasan
riwayat yang diperlukan oleh halaman detail. Jangan mengembalikan data
rahasia atau kredensial.

### 5.3 Android --- cek langganan akun yang sedang login

`GET /api/v1/subscriptions/me`

**Akses:** pengguna Android dengan Firebase ID token valid.

Header:

``` http
Authorization: Bearer <FIREBASE_ID_TOKEN>
```

Backend harus memverifikasi Firebase ID token menggunakan Firebase Admin
SDK, lalu menggunakan `uid` hasil verifikasi untuk mencari relasi
pelanggan. Jangan mempercayai `firebaseUid` yang dikirim dalam
body/query sebagai identitas.

Contoh respons saat aktif:

``` json
{
  "success": true,
  "message": "Status langganan berhasil diperiksa",
  "data": {
    "subscriptionStatus": "active",
    "canUseCashier": true,
    "plan": {
      "name": "IKIKASIR Tahunan",
      "durationMonths": 12
    },
    "startedAt": "2026-10-19T00:00:00.000Z",
    "expiresAt": "2027-10-19T00:00:00.000Z",
    "serverTime": "2026-10-19T00:00:00.000Z"
  }
}
```

Contoh respons saat expired:

``` json
{
  "success": true,
  "message": "Langganan telah kedaluwarsa",
  "data": {
    "subscriptionStatus": "expired",
    "canUseCashier": false,
    "expiresAt": "2026-10-18T23:59:59.000Z",
    "serverTime": "2026-10-19T00:00:00.000Z"
  }
}
```

Jika UID Firebase tidak terhubung ke pelanggan, API mengembalikan status
yang jelas, misalnya `404` dengan kode error `SUBSCRIPTION_NOT_FOUND`.
Jangan menganggap akun yang tidak ditemukan sebagai aktif.

### 5.4 Admin --- perpanjangan langganan

`POST /api/v1/admin/subscriptions/:subscriptionId/renew`

**Akses:** admin terautentikasi dan berwenang.

Request:

``` json
{
  "durationMonths": 12,
  "paymentMethod": "bank_transfer",
  "paymentReference": "INV-2026-001",
  "notes": "Perpanjangan satu tahun"
}
```

Nominal pembayaran dan status `paid` tidak boleh dipercaya begitu saja
dari client. Server mengambil harga dari paket yang berlaku. Endpoint
ini hanya boleh mengaktifkan masa baru setelah pembayaran benar-benar
terkonfirmasi atau admin yang berwenang secara eksplisit mencatat
konfirmasi manual sesuai aturan bisnis.

Aturan perpanjangan:

1.  Ambil langganan dan paket dari database.
2.  Validasi status, durasi yang diizinkan, harga, dan hak admin.
3.  Tentukan tanggal mulai masa tambahan:
    -   Jika langganan belum expired: tambahkan durasi dari `expiresAt`
        saat ini.
    -   Jika sudah expired: mulai dari waktu/tanggal yang ditetapkan
        saat perpanjangan dikonfirmasi.
4.  Simpan pembayaran, perubahan tanggal expired, dan riwayat dalam satu
    transaksi database.
5.  Cegah pemrosesan ganda menggunakan idempotency key atau referensi
    transaksi unik.
6.  Kembalikan tanggal expired yang baru.

Contoh respons:

``` json
{
  "success": true,
  "message": "Langganan berhasil diperpanjang",
  "data": {
    "subscriptionId": "subscription-uuid",
    "previousExpiresAt": "2027-10-19T00:00:00.000Z",
    "newExpiresAt": "2028-10-19T00:00:00.000Z",
    "amount": 250000,
    "currency": "IDR",
    "paymentStatus": "paid"
  }
}
```

Tanggal dalam contoh hanya ilustrasi; implementasi harus konsisten
dengan zona waktu dan aturan tanggal yang dipilih project.

### 5.5 Admin --- tangguhkan langganan

`POST /api/v1/admin/subscriptions/:subscriptionId/suspend`

Request:

``` json
{
  "reason": "Permintaan admin"
}
```

Endpoint harus memeriksa izin admin, menyimpan alasan dan waktu
perubahan, serta mencatat aktor yang melakukan tindakan.

### 5.6 Admin --- aktifkan kembali langganan yang ditangguhkan

`POST /api/v1/admin/subscriptions/:subscriptionId/reactivate`

Menghapus penangguhan administratif hanya jika aturan bisnis
mengizinkan. Endpoint ini **tidak boleh otomatis memperpanjang**
`expiresAt`; jika masa langganan sudah habis, proses perpanjangan tetap
diperlukan.

### 5.7 Admin --- riwayat langganan

`GET /api/v1/admin/subscriptions/:subscriptionId/history`

Mengembalikan daftar pembayaran, perpanjangan, penangguhan, pengaktifan
kembali, serta perubahan penting lainnya, termasuk waktu dan admin
pelaksana.

## 6. Rancangan model data

Nama model di bawah adalah rancangan konseptual. Sesuaikan dengan model
dan relasi yang sudah ada di `prisma/schema.prisma`; jangan membuat
tabel pelanggan kedua jika tabel pelanggan sudah tersedia.

### Customer

-   `id`: UUID atau tipe ID yang konsisten dengan project.
-   `firebaseUid`: UID Firebase Authentication, unik jika satu akun
    hanya mewakili satu pelanggan.
-   `businessName`: nama usaha.
-   `ownerName`: nama pemilik.
-   `phone`: nomor kontak.
-   `createdAt`, `updatedAt`.

### Subscription

-   `id`.
-   `customerId`: foreign key ke customer.
-   `planId`: foreign key ke paket.
-   `status`: status administratif, misalnya `active`, `suspended`, atau
    `pending`.
-   `startedAt`.
-   `expiresAt`.
-   `createdAt`, `updatedAt`.

Status efektif untuk akses Android dihitung oleh server. Jika `status`
bukan `suspended` tetapi `expiresAt` sudah lewat, status efektif adalah
`expired`.

### SubscriptionPlan

-   `id`.
-   `name`: misalnya `IKIKASIR Tahunan`.
-   `durationMonths`: `12`.
-   `price`: `250000` dalam satuan rupiah.
-   `isActive`.
-   `createdAt`, `updatedAt`.

Gunakan tipe numerik yang sesuai untuk uang di PostgreSQL (misalnya
integer untuk rupiah bulat atau `Decimal` jika memerlukan pecahan).
Hindari floating point untuk nominal pembayaran.

### SubscriptionPayment / SubscriptionHistory

Minimal catat:

-   `id`, `subscriptionId`.
-   `amount`, `paymentMethod`, `paymentStatus`.
-   `paymentReference` yang unik bila tersedia.
-   `previousExpiresAt`, `newExpiresAt`.
-   `processedBy` atau ID admin.
-   `notes`, `createdAt`.

Pertimbangkan tabel riwayat terpisah jika satu tabel pembayaran tidak
cukup untuk merekam tindakan non-pembayaran seperti suspend/reactivate.

## 7. Aturan keamanan

-   Semua endpoint admin harus menggunakan autentikasi dan otorisasi
    admin yang sudah diterapkan project.
-   Endpoint `/subscriptions/me` wajib memverifikasi Firebase ID token
    di server dan mencocokkan UID ke pelanggan.
-   Jangan mengirim secret Firebase, kredensial database, atau token
    admin ke frontend maupun APK.
-   Validasi body, parameter, pagination, dan field sorting.
-   Gunakan Prisma parameterized queries; jangan membangun SQL dari
    input mentah.
-   Gunakan transaksi database untuk pembayaran dan perubahan masa
    aktif.
-   Tambahkan audit log untuk perpanjangan, suspend, dan reaktivasi.
-   Terapkan rate limiting pada endpoint yang relevan dan jangan
    mengembalikan stack trace di production.
-   Android dapat menyimpan hasil pemeriksaan terakhir untuk pengalaman
    offline, tetapi status cache tidak boleh menjadi otoritas permanen.
    Tentukan kebijakan grace period secara eksplisit; jangan membuat
    grace period tanpa persetujuan bisnis.
-   Jika transaksi kasir dapat disinkronkan ke server, validasi
    langganan juga di server pada operasi tersebut. Pemeriksaan UI saja
    tidak cukup untuk menegakkan akses.

## 8. Integrasi di `src/app.ts`

Daftarkan router sesuai pola yang sudah ada. Contoh konseptual Express:

``` ts
// Sesuaikan import dan pola router dengan project existing.
import subscriptionRoutes from "./modules/subscriptions/subscription.routes";

app.use("/api/v1", subscriptionRoutes);
```

Jangan menambahkan baris ini sebelum memastikan project memang
menggunakan Express dan format export router yang sama.

## 9. Environment variables

Contoh nama variabel yang perlu disesuaikan dengan konfigurasi project:

``` env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"
FIREBASE_PROJECT_ID="your-firebase-project-id"
PORT=3000
NODE_ENV=development
```

Jika Firebase Admin SDK menggunakan kredensial service account, gunakan
mekanisme kredensial aman yang sesuai lingkungan deployment (misalnya
Application Default Credentials atau secret manager). Jangan commit
private key ke Git. `.env` harus masuk `.gitignore`; hanya
`.env.example` dengan nilai placeholder yang boleh di-commit.

## 10. Checklist implementasi

-   [ ] Audit `prisma/schema.prisma` untuk memastikan model
    customer/admin yang sudah ada.
-   [ ] Cocokkan UID Firebase dengan akun pelanggan yang sudah berjalan.
-   [ ] Tentukan apakah satu pelanggan hanya punya satu subscription
    atau bisa beberapa.
-   [ ] Tambahkan model dan migration Prisma tanpa merusak data
    existing.
-   [ ] Buat validasi request dan service untuk aturan langganan.
-   [ ] Implementasikan endpoint admin dengan middleware existing.
-   [ ] Implementasikan verifikasi Firebase ID token pada endpoint
    Android.
-   [ ] Implementasikan transaksi dan idempotensi untuk perpanjangan.
-   [ ] Hubungkan router ke `src/app.ts`.
-   [ ] Tambahkan pengujian untuk aktif, expired, suspended, UID tidak
    dikenal, pembayaran gagal, dan request renewal duplikat.
-   [ ] Integrasikan halaman Vue.js dan Android setelah API diuji.
-   [ ] Uji bahwa pelanggan expired tidak dapat melakukan operasi kasir
    yang dilindungi.

## 11. Hal yang harus dipastikan sebelum coding

1.  Bentuk model customer/admin yang sudah ada di
    `prisma/schema.prisma`.
2.  Framework dan pola routing yang digunakan oleh `src/app.ts`.
3.  Middleware autentikasi/otorisasi yang sudah ada.
4.  Apakah akun login Android sudah memakai Firebase Authentication dan
    UID-nya dapat dipetakan ke pelanggan PostgreSQL.
5.  Apakah pembayaran dikonfirmasi manual oleh admin atau menggunakan
    payment gateway.

Dokumen ini mendefinisikan kontrak awal API, bukan menyatakan endpoint
tersebut sudah tersedia. Implementasi harus mengikuti struktur dan
konvensi aktual backend Manajemen IKIKASIR.
