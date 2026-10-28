# CLAUDE.md — IKIKASIR

Dua repo dalam satu workspace `IKIKASIR-Webbase`:

| Repo | Folder | Stack |
|------|--------|-------|
| Backend | `backendmanajemen-ikikasir` | Node.js + TypeScript, Prisma 7, PostgreSQL 18 |
| Frontend | `Manajemen-IKIKASIR-FR` | Vue 3 + TypeScript + Vite, Vitest |

Package manager: **pnpm** (ada `pnpm-lock.yaml`). Gunakan `pnpm`, jangan `npm install`.

## Aturan Umum

1. **Ikuti struktur folder & pola file yang sudah ada.** Sebelum membuat file baru, baca 1 contoh fitur yang sudah jadi (misal Arus Kas / Pelanggan / Subscription) dan tiru gayanya (penamaan, export, error handling, format response). Jika pola existing berbeda dari template di bawah, **pola existing yang menang**.
2. Jangan membuat folder/layer baru di luar struktur di bawah.
3. Jangan mengubah file yang tidak berkaitan dengan tugas.
4. Jangan pernah menulis kredensial asli (password DB, JWT secret) ke file yang di-commit. Pakai `.env`.
5. Bahasa kode (nama variabel, fungsi, file) pakai pola yang sudah dipakai di project. Komentar & pesan response mengikuti bahasa yang sudah dipakai (Indonesia untuk pesan ke user).
6. Setelah selesai, jalankan type-check/test yang relevan dan laporkan file apa saja yang dibuat/diubah.

---

## BACKEND — `backendmanajemen-ikikasir`

### Environment (`.env`, jangan di-commit)

```dotenv
DATABASE_URL="postgresql://postgres:<PASSWORD>@localhost:5432/ikikasir?schema=public"
JWT_SECRET="<isi_secret_acak_panjang>"
JWT_EXPIRES_IN="1d"
PORT=5000
NODE_ENV=development
```

- Database: PostgreSQL 18, nama DB `ikikasir`, host `localhost:5432`.
- Base URL lokal: `http://localhost:5000`.

### Struktur Folder

```
backendmanajemen-ikikasir/
├── prisma/                 # schema.prisma + migrations
├── prisma7.config.ts       # konfigurasi Prisma 7
├── generated/              # Prisma client hasil generate (JANGAN edit manual)
├── scripts/                # script utilitas / seed
├── uploads/                # file upload (jangan di-commit isinya)
├── src/
│   ├── __tests__/          # unit/integration test
│   ├── application/
│   │   ├── dtos/           # DTO / tipe input-output + validasi
│   │   └── usecases/       # logika bisnis, 1 file = 1 aksi
│   ├── domain/             # entity, tipe domain, interface repository
│   ├── infrastructure/     # prisma client, jwt, hash, config, middleware teknis
│   ├── presentation/       # controller + routes + middleware HTTP
│   ├── repositories/       # implementasi akses data (query Prisma)
│   ├── app.ts              # setup app, middleware global, mount routes
│   └── server.ts           # entry point, listen ke PORT
├── .env
└── package.json / pnpm-lock.yaml / tsconfig.json
```

### Tanggung Jawab Tiap Layer

Alur request: **route → controller (presentation) → usecase (application) → repository → Prisma/PostgreSQL**

| Layer | Isi | Tidak boleh |
|-------|-----|-------------|
| `domain` | Entity, tipe, interface repository | Import Prisma / Express |
| `application/dtos` | Tipe & validasi input/output | Logika bisnis |
| `application/usecases` | Aturan bisnis, orkestrasi repository | Akses `req`/`res`, query Prisma langsung |
| `repositories` | Query Prisma, mapping hasil ke domain | Logika bisnis |
| `infrastructure` | Prisma client, JWT, hashing, config | Logika bisnis |
| `presentation` | Routes, controller, auth/role middleware, format response | Query DB langsung |

### Cara Membuat API Baru (checklist wajib berurutan)

Contoh: "buatkan API **Produk**".

1. **Prisma** — tambah/ubah model di `prisma/schema.prisma`, lalu:
   ```bash
   pnpm prisma migrate dev --name tambah_produk
   pnpm prisma generate
   ```
2. **Domain** — buat entity/tipe + interface repository di `src/domain/`.
3. **DTO** — buat DTO create/update/query di `src/application/dtos/`.
4. **Repository** — implementasi query di `src/repositories/`.
5. **Usecase** — 1 file per aksi di `src/application/usecases/` (misal `create-produk`, `get-produk-list`, `get-produk-by-id`, `update-produk`, `delete-produk`).
6. **Controller & Route** — di `src/presentation/`; pasang middleware auth JWT + role sesuai kebutuhan.
7. **Mount route** di `src/app.ts` (prefix `/api/<nama-resource>`).
8. **Test** — tambah di `src/__tests__/`.
9. **Dokumentasi** — tambahkan endpoint ke file Postman collection terkait (`IKIKASIR_*.postman_collection.json`) dan/atau `IKIKASIR-SUBSCRIPTION-API.md` bila relevan.

### Standar API

- Prefix: `/api/...`, nama resource huruf kecil, kebab-case.
- Auth: header `Authorization: Bearer <token>` (JWT, expire sesuai `JWT_EXPIRES_IN`).
- Format response — **samakan dengan controller yang sudah ada**. Bila belum ada acuan, gunakan:
  ```json
  { "success": true, "message": "…", "data": { } }
  { "success": false, "message": "…", "errors": [ ] }
  ```
- Status code: 200 OK, 201 Created, 400 validasi, 401 belum login, 403 tidak punya akses, 404 tidak ditemukan, 409 konflik, 500 server error.
- List endpoint: dukung `page`, `limit`, `search` dan kembalikan `meta` pagination.
- Password selalu di-hash, jangan pernah dikembalikan di response.
- Query Prisma: pakai `select`/`include` seperlunya; gunakan transaksi (`prisma.$transaction`) untuk operasi multi-tabel (contoh: transaksi + stok + arus kas).

### Perintah Backend

```bash
pnpm install
pnpm prisma generate
pnpm prisma migrate dev
pnpm dev          # sesuaikan dengan script di package.json
pnpm test
```

---

## FRONTEND — `Manajemen-IKIKASIR-FR`

### Environment

`.env` (jangan di-commit) mengikuti `.env.example`:

```dotenv
VITE_API_BASE_URL=http://localhost:5000/api
```

> Nama variabel mengikuti `.env.example` & `env.d.ts` yang sudah ada. Jangan hardcode URL di komponen.

### Struktur Folder

```
Manajemen-IKIKASIR-FR/
├── public/
├── src/
│   ├── __tests__/      # test Vitest
│   ├── api/            # semua pemanggilan REST API (axios/fetch client + modul per resource)
│   ├── components/     # komponen UI reusable
│   ├── composables/    # logika reusable (useXxx): state, fetch, form
│   ├── images/         # aset gambar
│   ├── router/         # definisi route + guard auth
│   ├── types/          # tipe TypeScript (request/response/model)
│   ├── views/          # halaman (1 route = 1 view)
│   ├── App.vue
│   ├── main.ts
│   └── style.css
├── env.d.ts
├── vite.config.ts / vitest.config.ts
└── package.json / pnpm-lock.yaml
```

### Pembagian Tugas

| Folder | Isi |
|--------|-----|
| `types/` | Interface model + payload request + bentuk response API |
| `api/` | Fungsi pemanggil endpoint saja (tanpa state UI). Pakai instance client yang sama (base URL + interceptor token) |
| `composables/` | `useXxx()` yang membungkus `api/` + state `loading`, `error`, `data` |
| `components/` | Tabel, form, modal, dll. yang dipakai ulang |
| `views/` | Halaman; merangkai composable + komponen |
| `router/` | Daftarkan route baru + `meta` (auth/role) |

### Cara Menyambung API ke Frontend (checklist wajib berurutan)

Contoh: "sambungkan API **Produk** ke halaman **views/Produk**".

1. **Types** — buat `src/types/produk.ts` (model, payload create/update, response list + pagination), sesuai bentuk response backend.
2. **API** — buat `src/api/produk.ts` dengan fungsi `getProdukList`, `getProdukById`, `createProduk`, `updateProduk`, `deleteProduk`, memakai client yang sudah ada di `src/api/`. Token JWT disisipkan lewat interceptor, bukan manual per fungsi.
3. **Composable** — buat `src/composables/useProduk.ts` berisi state (`items`, `loading`, `error`, pagination) dan aksi yang memanggil `api/produk`.
4. **View / Component** — di `src/views/...` (atau `components/`) pakai composable tadi; tampilkan loading, error, dan empty state.
5. **Router** — pastikan route ada di `src/router/` dengan guard auth/role bila perlu.
6. **Test** — tambah test composable/komponen di `src/__tests__/`.

### Aturan Frontend

- Gunakan `<script setup lang="ts">` dan Composition API (ikuti gaya file `.vue` yang sudah ada).
- Dilarang memanggil `fetch/axios` langsung di view/komponen — selalu lewat `src/api/`.
- Tangani error API dengan pesan yang ramah user; pada 401 arahkan ke login & hapus token.
- Jangan ubah `App.vue`, `main.ts`, `env.d.ts` kecuali memang diperlukan tugasnya.
- Styling mengikuti yang sudah dipakai di project (`style.css` + kelas yang ada); jangan menambah library UI baru tanpa diminta.

### Perintah Frontend

```bash
pnpm install
pnpm dev
pnpm build
pnpm test:unit    # sesuaikan dengan script di package.json
```

---

## Format Perintah ke Claude

Gunakan pola singkat seperti ini:

```
Buatkan API <nama fitur> di backend (fields: ..., aturan: ...),
lalu sambungkan ke frontend di <views/halaman tujuan>.
```

Contoh:

```
Buatkan API Produk (nama, harga, stok, kategori; hanya role admin yang bisa
tambah/ubah/hapus) lalu sambungkan ke views/ProdukView.vue.
```

Claude harus: (1) membaca fitur existing sebagai acuan, (2) mengikuti checklist backend lalu frontend di atas, (3) tidak membuat struktur folder baru, (4) merangkum file yang dibuat/diubah dan langkah migrasi yang perlu dijalankan.
