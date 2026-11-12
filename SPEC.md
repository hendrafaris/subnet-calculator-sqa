# Spesifikasi — Subnet Calculator API

**Proyek:** `subnet-calculator-sqa`
**Versi:** 1.0.0
**Tanggal:** 2026-11-12

---

## 1. Latar Belakang

Kalkulator subnet berbasis web yang menyediakan antarmuka HTML statis
(front-end) dan REST API berbasis **FastAPI** (back-end). Pengguna memasukkan
alamat IPv4 dan prefix length (CIDR), lalu sistem menghitung dan menampilkan
informasi subnet secara instan.

---

## 2. Ruang Lingkup

| Komponen | Teknologi |
|---|---|
| Front-end | HTML + CSS + Vanilla JS |
| Back-end API | Python 3.12, FastAPI |
| Pengujian | pytest, pytest-cov, httpx (TestClient) |
| Paket manajer | uv |

---

## 3. Endpoint API

### `GET /api/subnet`

Menghitung informasi subnet berdasarkan parameter query.

**Parameter Query:**

| Parameter | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `ip` | `string` | ✅ | Alamat IPv4 (mis. `192.168.1.0`) |
| `prefix` | `integer` | ✅ | Panjang prefix CIDR (0–32) |

**Response sukses `200 OK`:**

```json
{
  "ip": "192.168.1.0",
  "prefix": 24,
  "network_address": "192.168.1.0",
  "broadcast_address": "192.168.1.255",
  "first_host": "192.168.1.1",
  "last_host": "192.168.1.254",
  "total_hosts": 256,
  "usable_hosts": 254,
  "subnet_mask": "255.255.255.0",
  "wildcard": "0.0.0.255",
  "ip_class": "C",
  "ip_type": "Privat"
}
```

**Response error `422 Unprocessable Entity`:** input tidak valid.

---

## 4. Aturan Validasi

| Aturan | Detail |
|---|---|
| Format IP | 4 oktet desimal, masing-masing 0–255 |
| Prefix | Integer 0 ≤ prefix ≤ 32 |
| IP kosong | Harus ditolak (422) |
| Prefix kosong | Harus ditolak (422) |

---

## 5. Tabel Test (Kriteria Penerimaan)

Setiap baris di bawah **harus** diuji oleh test suite (pytest). Test dinyatakan
lulus jika seluruh assertion benar dan coverage ≥ 80 %.

| # | IP Input | Prefix | Network Address | Broadcast Address | First Host | Last Host | Usable Hosts | Catatan |
|---|---|---|---|---|---|---|---|---|
| T-01 | `192.168.1.0` | `24` | `192.168.1.0` | `192.168.1.255` | `192.168.1.1` | `192.168.1.254` | `254` | Kelas C privat, umum |
| T-02 | `10.0.0.0` | `8` | `10.0.0.0` | `10.255.255.255` | `10.0.0.1` | `10.255.255.254` | `16777214` | Kelas A privat |
| T-03 | `172.16.0.0` | `12` | `172.16.0.0` | `172.31.255.255` | `172.16.0.1` | `172.31.255.254` | `1048574` | Kelas B privat |
| T-04 | `192.168.1.100` | `30` | `192.168.1.100` | `192.168.1.103` | `192.168.1.101` | `192.168.1.102` | `2` | Subnet kecil /30 |
| T-05 | `10.1.1.0` | `31` | `10.1.1.0` | `10.1.1.1` | `10.1.1.0` | `10.1.1.1` | `2` | Point-to-point /31 (RFC 3021) |
| T-06 | `10.1.1.5` | `32` | `10.1.1.5` | `10.1.1.5` | `10.1.1.5` | `10.1.1.5` | `1` | Host tunggal /32 |
| T-07 | `0.0.0.0` | `0` | `0.0.0.0` | `255.255.255.255` | `0.0.0.1` | `255.255.255.254` | `4294967294` | Default route |
| T-08 | `999.999.999.999` | `24` | — | — | — | — | — | IP tidak valid → 422 |
| T-09 | `192.168.1.0` | `33` | — | — | — | — | — | Prefix > 32 → 422 |
| T-10 | `192.168.1.0` | `-1` | — | — | — | — | — | Prefix negatif → 422 |

---

## 6. Non-Fungsional

- Waktu respons API < 100 ms untuk input valid.
- Tidak ada state tersimpan (stateless).
- Tidak ada autentikasi (API publik).
- CORS diaktifkan untuk semua origin (`*`) selama pengembangan.

---

## 7. Di Luar Lingkup (v1.0)

- IPv6
- VLSM / subnet splitting
- Autentikasi & rate limiting
- Database / persistensi
- CI/CD pipeline
