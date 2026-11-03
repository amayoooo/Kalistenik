# Kalistenik Pro

Aplikasi latihan kalistenik untuk HP, dari **Basic** sampai **Expert**, ditambah modul **Pelvic Floor (Kegel)**.
Bentuknya PWA (Progressive Web App): bisa dipasang di layar HP dan dipakai offline. Semua data tersimpan di HP pengguna.

## Isi folder

| File | Fungsi |
| --- | --- |
| `index.html` | Tampilan dan gaya (CSS) aplikasi |
| `data.js` | **Semua data program**: gerakan, set, repetisi, target, jadwal. Ubah angka latihan di sini |
| `app.js` | Logika aplikasi: navigasi, sesi latihan, timer, pemandu Kegel, progres |
| `sw.js` | Service worker agar aplikasi bisa offline |
| `manifest.webmanifest` | Nama, ikon, dan warna aplikasi saat dipasang di HP |
| `icons/` | Ikon aplikasi |
| `netlify.toml` | Pengaturan Netlify |

## Fitur

- Tes awal untuk menentukan level
- 4 level, 6 kategori (Push, Pull, Legs, Core, Skill, Pelvic Floor), 52 gerakan
- Jadwal mingguan otomatis sesuai level
- Mode latihan: penghitung repetisi, stopwatch untuk gerakan tahan, timer istirahat otomatis dengan bunyi dan getar
- Sistem unlock: capai target untuk membuka gerakan berikutnya
- Syarat naik level dan pemberitahuan naik level
- Pemandu Kegel dengan aba-aba "Kencangkan / Tahan / Lepas" dan getaran HP
- Nama menu Pelvic Floor yang bisa disamarkan ("Core Dalam")
- Progres: streak, grafik sesi per minggu, riwayat
- Tema gelap / terang

---

## Cara upload ke GitHub dan online di Netlify

### 1. Upload ke GitHub
1. Buat akun di [github.com](https://github.com) (gratis).
2. Klik tombol **+** di kanan atas → **New repository**.
3. Isi nama, misalnya `kalistenik-pro`, pilih **Public**, lalu klik **Create repository**.
4. Di halaman repository, klik **uploading an existing file**.
5. Ekstrak file ZIP aplikasi, lalu seret **semua isi folder** (termasuk folder `icons`) ke halaman tersebut.
   Pastikan `index.html` berada langsung di halaman utama repository, bukan di dalam subfolder.
6. Klik **Commit changes**.

### 2. Hubungkan ke Netlify
1. Buka [app.netlify.com](https://app.netlify.com) dan daftar dengan akun GitHub.
2. Klik **Add new site** → **Import an existing project** → **GitHub**.
3. Pilih repository `kalistenik-pro`.
4. Biarkan **Build command** kosong dan **Publish directory** berisi `.` (titik).
5. Klik **Deploy**. Dalam 1 menit, aplikasi online di alamat seperti `https://nama-acak.netlify.app`.
6. Ubah nama alamat di **Site configuration → Change site name** jika ingin, misalnya `kalistenik-pro.netlify.app`.

### 3. Pasang di HP
- **Android (Chrome):** buka alamat aplikasi → menu titik tiga → **Instal aplikasi** / **Tambahkan ke layar utama**.
- **iPhone (Safari):** buka alamat aplikasi → tombol **Bagikan** → **Tambahkan ke Layar Utama**.

### 4. Memperbarui aplikasi
1. Ubah file (misalnya angka di `data.js`) lalu upload ulang ke GitHub.
2. Di `sw.js`, naikkan versi: `const VERSION = "kp-v2";` supaya HP mengunduh versi terbaru.
3. Netlify otomatis meng-online-kan perubahan setiap kali GitHub diperbarui.

---

## Mengubah program latihan

Buka `data.js`. Setiap gerakan berbentuk seperti ini:

```js
{ id: "pushup", cat: "push", lv: 2, name: "Push-up", sets: 3, min: 8, max: 12, unit: "reps", tSets: 3, tVal: 20, gate: true, how: [...], mistakes: [...] }
```

- `sets`, `min`, `max`: resep latihan (3 set × 8–12)
- `unit`: `"reps"` untuk repetisi, `"hold"` untuk detik
- `side: true`: dikerjakan per sisi / per kaki
- `tSets`, `tVal`: target lulus (3 × 20). Tercapai → gerakan berikutnya terbuka
- `gate: true`: menjadi syarat naik level

Urutan gerakan di dalam satu kategori dan level adalah urutan unlock.

## Catatan kesehatan

Angka program adalah panduan umum. Hentikan latihan kalau terasa nyeri, terutama di sendi, pergelangan tangan, atau siku.
Untuk nyeri panggul, nyeri saat berhubungan, atau gangguan buang air, konsultasikan ke dokter atau fisioterapis panggul.
