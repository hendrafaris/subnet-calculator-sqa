# [Feature] Kalkulator Subnet

## Deskripsi

Implementasi **REST API kalkulator subnet** berbasis FastAPI yang menerima
alamat IPv4 dan prefix length (CIDR notation), lalu mengembalikan informasi
jaringan secara lengkap: network address, broadcast address, range host
(first/last), jumlah host yang dapat digunakan, subnet mask, wildcard mask,
kelas IP, dan tipe (privat/publik).

Endpoint utama: `GET /api/subnet?ip=<IPv4>&prefix=<0-32>`

API ini dipakai oleh front-end (`index.html`) yang sudah tersedia sebagai
pengganti kalkulasi JavaScript sisi klien, sehingga logika subnet terpusat,
dapat diuji, dan mudah diperluas.

---

## Tugas

- [ ] Buat modul `src/subnet_calculator/subnet.py` — fungsi murni kalkulasi subnet
- [ ] Buat modul `src/subnet_calculator/api.py` — FastAPI app + endpoint `GET /api/subnet`
- [ ] Buat `src/subnet_calculator/schemas.py` — Pydantic models request/response
- [ ] Tambahkan CORS middleware (`fastapi.middleware.cors.CORSMiddleware`)
- [ ] Buat `tests/test_subnet.py` — unit test fungsi kalkulasi (T-01 s.d. T-07)
- [ ] Buat `tests/test_api.py` — integration test endpoint via `httpx.AsyncClient`
- [ ] Pastikan semua kasus error (T-08, T-09, T-10) mengembalikan HTTP 422
- [ ] Jalankan `uv run pytest --cov=subnet_calculator --cov-report=term-missing` dan pastikan coverage ≥ 80 %
- [ ] Update `README.md` dengan instruksi menjalankan API (`uv run fastapi dev`)

---

## Kriteria Penerimaan

Semua baris tabel berikut (dari **SPEC.md §5**) harus lulus sebagai test
otomatis di pytest. Test dinyatakan selesai jika `pytest` exit code `0` dan
coverage ≥ 80 %.

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

> Referensi lengkap: lihat **[SPEC.md](../SPEC.md) §5 — Tabel Test**.

---

## Alur Kerja

```
1. Issue dibuat (GitHub Issues)
        │
        ▼
2. Branch dibuat dari main
   → feature/issue-<nomor>-subnet-calculator
        │
        ▼
3. Tulis test dulu (TDD)
   → tests/test_subnet.py
   → tests/test_api.py
   → jalankan pytest → semua GAGAL (red phase)
        │
        ▼
4. Implementasi
   → src/subnet_calculator/subnet.py
   → src/subnet_calculator/schemas.py
   → src/subnet_calculator/api.py
   → jalankan pytest → semua LULUS (green phase)
        │
        ▼
5. Commit
   → "feat: implementasi API kalkulator subnet (#<nomor>)"
        │
        ▼
6. Pull Request ke main
   → Judul: "[Feature] Kalkulator Subnet (#<nomor>)"
   → Body: rangkuman perubahan, link ke issue
   → Reviewers: (opsional, solo project)
        │
        ▼
7. CI (jika ditambahkan kelak)
   → pytest --cov otomatis
   → Harus hijau sebelum merge
        │
        ▼
8. Merge ke main
   → Closes #<nomor>
   → Hapus branch feature
```

---

## Referensi

- [`SPEC.md`](../SPEC.md) — Spesifikasi teknis lengkap & tabel test
- [`DESIGN.md`](../DESIGN.md) — Desain UI & komponen
- [`index.html`](../index.html) — Front-end statis yang sudah ada
- [`pyproject.toml`](../pyproject.toml) — Dependensi proyek
