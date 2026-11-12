# Desain UI — Subnet Calculator

**Proyek:** `subnet-calculator-sqa`
**Versi:** 1.0.0
**Tanggal:** 2026-11-12

---

## 1. Prinsip Desain

| Prinsip | Penerapan |
|---|---|
| **Dark-first** | Background `#080b18`, teks utama `#f0f4ff` |
| **Glassmorphism** | Card dengan `backdrop-filter: blur(20px)` dan border transparan |
| **Responsif** | Grid layout, breakpoint tunggal di 640 px |
| **Aksesibilitas** | Label eksplisit, `aria-label`, `role="alert"` pada error |

---

## 2. Palet Warna

| Token | Nilai | Penggunaan |
|---|---|---|
| `--bg` | `#080b18` | Latar halaman |
| `--indigo` | `#6366f1` | Aksen utama, gradient kiri |
| `--cyan` | `#06b6d4` | Aksen sekunder, gradient kanan |
| `--violet` | `#8b5cf6` | Orb animasi |
| `--emerald` | `#10b981` | Validasi sukses |
| `--rose` | `#f43f5e` | Error / validasi gagal |
| `--text-1` | `#f0f4ff` | Teks utama |
| `--text-2` | `#94a3b8` | Label, subtitle |
| `--text-3` | `#64748b` | Placeholder, hint |

---

## 3. Tipografi

| Peran | Font | Weight |
|---|---|---|
| Heading | Inter | 800 |
| Body | Inter | 400–600 |
| Kode / IP | JetBrains Mono | 400–600 |

---

## 4. Layout & Komponen

### 4.1 Latar Halaman (Animated Background)

```
[ .bg-grid ]   — grid titik-titik dengan opacity rendah
[ .orb-1 ]     — blob ungu kiri atas, blur 80px, animasi drift
[ .orb-2 ]     — blob cyan kanan bawah
[ .orb-3 ]     — blob violet tengah
```

### 4.2 Header

```
Logo (ikon SVG jaringan)  |  "NetCalc"  |  Badge "Subnet Calculator"
```

### 4.3 Input Card (Glassmorphism)

```
┌─────────────────────────────────────────────────────┐
│  Hitung Subnet                                      │
│  Masukkan alamat IP dan prefix...                   │
│                                                     │
│  [ 🌐 IP Address _____________ ]  /  [ 📐 Prefix ]  │
│                                                     │
│        [ ➔  Hitung Sekarang  ]                      │
│                                                     │
│  ⚠️ Pesan error (tersembunyi jika valid)             │
└─────────────────────────────────────────────────────┘
```

### 4.4 Summary Bar

```
Kelas | Tipe | Subnet Mask | Wildcard
(gradient text, dipisahkan garis vertikal)
```

### 4.5 Result Grid (2 kolom)

```
┌──────────────────┬──────────────────┐
│  🏠 Network Addr │  📡 Broadcast    │
│  192.168.1.0     │  192.168.1.255   │
│  biner dotted    │  biner dotted    │
├──────────────────┴──────────────────┤
│  ↔️  Range Host                      │
│  192.168.1.1  →  192.168.1.254     │
├────────────────────────────────────-┤
│  🖥️  Jumlah Host (highlight card)   │
│         254  (gradient besar)        │
└─────────────────────────────────────┘
```

### 4.6 Visualisasi Biner

32 kotak bit, dikelompokkan per oktet (spasi kecil di antara oktet):
- **Bit network** → kotak ungu (`rgba(99,102,241,0.25)`)
- **Bit host** → kotak abu-abu (`rgba(255,255,255,0.06)`)
- Animasi masuk satu per satu dengan delay bertahap

### 4.7 Tombol Salin

Tombol kanan bawah, salin semua hasil ke clipboard. Berubah warna hijau
(`--emerald`) selama 2,5 detik setelah disalin.

---

## 5. Interaksi & State

| State | Trigger | Tampilan |
|---|---|---|
| Default | Load halaman | Input diisi `192.168.1.0 / 24`, border hijau |
| Typing valid | Input berubah, format benar | Border `--emerald` |
| Typing invalid | Input berubah, format salah | Border `--rose` + hint teks |
| Hitung (Enter / klik) | — | Hasil muncul dengan animasi `fadeIn` |
| Error submit | Input tidak valid saat klik | `#error-box` muncul dengan `role="alert"` |
| Copied | Klik tombol salin | Teks berubah "Tersalin!" selama 2,5 s |

---

## 6. Responsivitas

| Breakpoint | Perubahan |
|---|---|
| ≥ 640 px | Grid 2 kolom, input horizontal (`IP / Prefix`) |
| < 640 px | Grid 1 kolom, input vertikal, header badge disembunyikan |

---

## 7. Aksesibilitas

- Semua input memiliki `<label>` eksplisit dengan `for` matching `id`.
- Pesan error menggunakan `role="alert"` agar diumumkan oleh screen reader.
- Kontras rasio teks utama terhadap background ≥ 7:1 (WCAG AA).
- Navigasi keyboard penuh: Tab, Enter untuk submit.
