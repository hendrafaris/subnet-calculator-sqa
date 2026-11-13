# [Feature] Kalkulator VLSM (Variable Length Subnet Masking)

## Deskripsi

Implementasi fitur **Kalkulator VLSM (Variable Length Subnet Masking)** yang memungkinkan pengguna membagi satu *major network* (misalnya `192.168.1.0/24`) ke dalam beberapa subnet dengan ukuran bervariasi sesuai kebutuhan host tiap departemen/LAN tanpa pemborosan alamat IP.

Endpoint API: `POST /api/vlsm`

Fitur ini melengkapi kalkulator subnet yang sudah ada, dengan menyediakan tab VLSM pada antarmuka web (`index.html`) dan API backend FastAPI.

---

## Tugas

- [ ] Tambahkan model skema Pydantic untuk request dan response VLSM (`VLSMRequest`, `SubnetRequirement`, `AllocatedSubnet`, `VLSMResponse`)
- [ ] Implementasikan fungsi murni `alokasi_vlsm(major_network: str, major_prefix: int, subnets: list[dict]) -> dict` di `main.py`
- [ ] Implementasikan endpoint `POST /api/vlsm` di `main.py`
- [ ] Tambahkan unit test dan API integration test di `test_main.py` (VLSM-01 s.d. VLSM-06)
- [ ] Tambahkan tab "Kalkulator VLSM" di antarmuka web `index.html` dan logika pemanggilan API di `script.js`
- [ ] Pastikan seluruh test lulus dan coverage tetap ≥ 80%

---

## Kriteria Penerimaan

Merujuk pada **SPEC.md §7.3 — Tabel Test VLSM**:

| # | Major Network | Prefix | Kebutuhan Subnet | Hasil Alokasi (/prefix) | Kriteria |
|---|---|---|---|---|---|
| VLSM-01 | `192.168.1.0` | `24` | LAN A (50), LAN B (25), LAN C (10), WAN (2) | LAN A: /26 (`192.168.1.0`), LAN B: /27 (`192.168.1.64`), LAN C: /28 (`192.168.1.96`), WAN: /30 (`192.168.1.112`) | Status 200, alokasi tepat berurutan |
| VLSM-02 | `10.0.0.0` | `16` | Dept 1 (500), Dept 2 (200) | Dept 1: /23 (`10.0.0.0`), Dept 2: /24 (`10.0.2.0`) | Status 200, prefix besar |
| VLSM-03 | `192.168.1.0` | `24` | S1 (200), S2 (100) | Total kebutuhan melebihi kapasitas major network | Status 400 Bad Request |
| VLSM-04 | `192.168.1.0` | `24` | S1 (0) atau S1 (-5) | Host tidak valid | Status 400 Bad Request |
| VLSM-05 | `192.168.1.0` | `24` | `[]` (daftar kosong) | Daftar subnet kosong | Status 400 Bad Request |
| VLSM-06 | `999.999.999.999` | `24` | S1 (10) | Major network IP salah | Status 400 Bad Request |

---

## Alur Kerja

```
1. Buat GitHub Issue untuk VLSM
2. Buat branch feature/issue-<nomor>-vlsm dari main terbaru
3. Tulis test VLSM LEBIH DULU di test_main.py (TDD Red phase)
4. Buat kerangka fungsi alokasi_vlsm dan endpoint POST /api/vlsm (raise NotImplementedError)
5. Jalankan pytest (pastikan merah / gagal)
6. Implementasikan fungsi alokasi_vlsm dan endpoint POST /api/vlsm
7. Hubungkan antarmuka tab VLSM di index.html dan script.js
8. Jalankan pytest (pastikan hijau / lulus)
9. Commit dan push ke remote branch
10. Buat Pull Request ke main ("Closes #<nomor>")
11. Pantau CI pipeline sampai hijau dan merge PR
```
