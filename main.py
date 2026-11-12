from fastapi import FastAPI, HTTPException, Request, Query
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
import math

app = FastAPI(title="Subnet Calculator API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=400,
        content={"detail": "Input tidak valid: parameter query tidak sesuai."},
    )


def ip_to_int(ip: str) -> int:
    if not ip or not isinstance(ip, str):
        raise ValueError("Alamat IP tidak boleh kosong.")
    parts = ip.strip().split(".")
    if len(parts) != 4:
        raise ValueError(f"Format IP tidak valid: harus terdiri dari 4 oktet ({ip})")
    octets = []
    for p in parts:
        if not p.isdigit() or len(p) == 0:
            raise ValueError(f"Oktet tidak valid: {p}")
        val = int(p)
        if val < 0 or val > 255:
            raise ValueError(f"Oktet di luar rentang 0-255: {val}")
        octets.append(val)
    return (octets[0] << 24) | (octets[1] << 16) | (octets[2] << 8) | octets[3]


def int_to_ip(n: int) -> str:
    n = n & 0xFFFFFFFF
    return f"{(n >> 24) & 0xFF}.{(n >> 16) & 0xFF}.{(n >> 8) & 0xFF}.{n & 0xFF}"


def get_ip_class(first_octet: int) -> str:
    if 1 <= first_octet <= 126:
        return "A"
    if first_octet == 127:
        return "Loopback"
    if 128 <= first_octet <= 191:
        return "B"
    if 192 <= first_octet <= 223:
        return "C"
    if 224 <= first_octet <= 239:
        return "D (Multicast)"
    if 240 <= first_octet <= 255:
        return "E (Reserved)"
    return "—"


def get_ip_type(ip_int: int) -> str:
    oct1 = (ip_int >> 24) & 0xFF
    oct2 = (ip_int >> 16) & 0xFF

    if oct1 == 10:
        return "Privat"
    if oct1 == 172 and 16 <= oct2 <= 31:
        return "Privat"
    if oct1 == 192 and oct2 == 168:
        return "Privat"
    if oct1 == 127:
        return "Loopback"
    if oct1 == 169 and oct2 == 254:
        return "Link-Local"
    return "Publik"


def hitung_subnet(ip: str, prefix: int) -> dict:
    if prefix is None:
        raise ValueError("Prefix tidak boleh kosong.")
    if not isinstance(prefix, int):
        try:
            prefix = int(prefix)
        except (ValueError, TypeError):
            raise ValueError(f"Prefix harus berupa bilangan bulat: {prefix}")

    if prefix < 0 or prefix > 32:
        raise ValueError(f"Prefix harus berada dalam rentang 0 hingga 32 (diberikan: {prefix})")

    ip_int = ip_to_int(ip)

    # Subnet mask & Wildcard
    mask_int = 0 if prefix == 0 else ((0xFFFFFFFF << (32 - prefix)) & 0xFFFFFFFF)
    wildcard_int = (~mask_int) & 0xFFFFFFFF

    # Hitung network address dengan operasi bitwise AND antara IP dan subnet mask
    network_int = ip_int & mask_int
    broadcast_int = network_int | wildcard_int

    total_hosts = 1 if prefix == 32 else 2 ** (32 - prefix)

    if prefix == 32:
        first_host_int = network_int
        last_host_int = network_int
        usable_hosts = 1
    elif prefix == 31:
        first_host_int = network_int
        last_host_int = broadcast_int
        usable_hosts = 2
    else:
        first_host_int = (network_int + 1) & 0xFFFFFFFF
        last_host_int = (broadcast_int - 1) & 0xFFFFFFFF
        usable_hosts = max(0, total_hosts - 2)

    first_octet = (ip_int >> 24) & 0xFF

    net_str = int_to_ip(network_int)
    bcast_str = int_to_ip(broadcast_int)

    return {
        "ip": ip.strip(),
        "prefix": prefix,
        "network": net_str,
        "network_address": net_str,
        "broadcast": bcast_str,
        "broadcast_address": bcast_str,
        "first_host": int_to_ip(first_host_int),
        "last_host": int_to_ip(last_host_int),
        "total_hosts": total_hosts,
        "usable_hosts": usable_hosts,
        "subnet_mask": int_to_ip(mask_int),
        "wildcard": int_to_ip(wildcard_int),
        "ip_class": get_ip_class(first_octet),
        "ip_type": get_ip_type(ip_int),
    }


def alokasi_vlsm(network_cidr: str, kebutuhan_host: list[int]) -> list[dict]:
    if not network_cidr or "/" not in network_cidr:
        raise ValueError("Network CIDR tidak valid (contoh: 192.168.1.0/24).")
    ip_str, prefix_str = network_cidr.split("/", 1)
    try:
        base_prefix = int(prefix_str)
    except ValueError:
        raise ValueError("Prefix CIDR harus integer.")

    if base_prefix < 0 or base_prefix > 30:
        raise ValueError("Prefix network induk untuk VLSM harus antara 0 dan 30.")

    base_ip_int = ip_to_int(ip_str)
    base_mask_int = 0 if base_prefix == 0 else ((0xFFFFFFFF << (32 - base_prefix)) & 0xFFFFFFFF)
    major_network_int = base_ip_int & base_mask_int
    major_broadcast_int = major_network_int | ((~base_mask_int) & 0xFFFFFFFF)

    if not kebutuhan_host or len(kebutuhan_host) == 0:
        raise ValueError("Daftar kebutuhan host tidak boleh kosong.")

    for h in kebutuhan_host:
        if not isinstance(h, int) or h <= 0:
            raise ValueError(f"Kebutuhan host harus integer positif, didapat: {h}")

    # Urutkan kebutuhan host dari yang terbesar
    kebutuhan_sorted = sorted(kebutuhan_host, reverse=True)
    hasil = []
    current_ip_int = major_network_int

    for hosts in kebutuhan_sorted:
        # Hitung bit host yang dibutuhkan: 2^n - 2 >= hosts (kecuali hosts == 2 -> /30 atau /31)
        needed_bits = math.ceil(math.log2(hosts + 2))
        needed_bits = max(2, needed_bits)
        prefix = 32 - needed_bits
        block_size = 2 ** needed_bits

        if current_ip_int + block_size - 1 > major_broadcast_int:
            raise ValueError("Kapasitas network induk tidak mencukupi untuk alokasi VLSM.")

        sub_net_int = current_ip_int
        sub_bcast_int = current_ip_int + block_size - 1
        sub_first_int = sub_net_int + 1
        sub_last_int = sub_bcast_int - 1

        mask_int = (0xFFFFFFFF << (32 - prefix)) & 0xFFFFFFFF

        hasil.append({
            "kebutuhan_host": hosts,
            "usable_hosts": block_size - 2,
            "prefix": prefix,
            "network_cidr": f"{int_to_ip(sub_net_int)}/{prefix}",
            "network": int_to_ip(sub_net_int),
            "broadcast": int_to_ip(sub_bcast_int),
            "first_host": int_to_ip(sub_first_int),
            "last_host": int_to_ip(sub_last_int),
            "subnet_mask": int_to_ip(mask_int),
        })

        current_ip_int += block_size

    return hasil


@app.get("/")
def read_root():
    return FileResponse("index.html")


@app.get("/style.css")
def get_style():
    return FileResponse("style.css")


@app.get("/script.js")
def get_script():
    return FileResponse("script.js")


@app.get("/api/subnet")
def api_subnet(ip: str = Query(default=""), prefix: int = Query(default=None)):
    if not ip or prefix is None:
        raise HTTPException(
            status_code=400,
            detail="Parameter 'ip' dan 'prefix' wajib diisi.",
        )
    try:
        return hitung_subnet(ip, prefix)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/vlsm")
async def api_vlsm(request: Request):
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="JSON request body tidak valid.")

    network = body.get("network")
    kebutuhan_host = body.get("kebutuhan_host")

    if not network or kebutuhan_host is None:
        raise HTTPException(
            status_code=400,
            detail="Field 'network' dan 'kebutuhan_host' wajib diisi.",
        )

    try:
        return alokasi_vlsm(network, kebutuhan_host)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
