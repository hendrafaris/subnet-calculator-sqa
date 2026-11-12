# Subnet Calculator & VLSM (SQA)

Kalkulator subnet IPv4 dan VLSM berbasis web dengan FastAPI.

## Fitur
- Perhitungan Network Address, Broadcast Address, Host Range, dan Jumlah Host.
- Perhitungan alokasi VLSM (Variable Length Subnet Masking).
- REST API cepat berbasis FastAPI.
- Desain antarmuka web modern dengan glassmorphism dan visualisasi biner.

## Menjalankan secara Lokal dengan uv

```bash
uv sync --dev
uv run fastapi dev main.py
```

Buka antarmuka di `http://127.0.0.1:8000`.

## Pengujian

```bash
uv run pytest test_main.py -v --cov=main --cov-report=term-missing
```

## Docker

### Build Image
```bash
docker build -t subnet-calculator .
```

### Menjalankan Container
```bash
docker run -d --name subnet-app -p 8000:8000 subnet-calculator
```

### Menjalankan Smoke Test ke Container Lokal
```bash
uv run python scripts/smoke_test.py http://127.0.0.1:8000
```

### Menghentikan dan Menghapus Container
```bash
docker rm -f subnet-app
```

## Deploy

Aplikasi ini berjalan di Vercel (produksi):

https://subnet-calculator-sqa-nu.vercel.app

Vercel men-deploy ulang otomatis setiap ada push atau merge ke branch `main`.

### Smoke test produksi

```
uv run python scripts/smoke_test.py https://subnet-calculator-sqa-nu.vercel.app
```

Hasil yang diharapkan: `Ringkasan: 4 lulus, 0 gagal`.
