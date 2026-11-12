import pytest
from fastapi.testclient import TestClient
from main import app, hitung_subnet

client = TestClient(app)


# ---------------------------------------------------------------------------
# Test Cases Data from SPEC.md Table
# ---------------------------------------------------------------------------

VALID_SUBNET_CASES = [
    # (id, ip, prefix, expected_network, expected_broadcast, expected_first, expected_last, expected_usable)
    (
        "T-01",
        "192.168.1.0",
        24,
        "192.168.1.0",
        "192.168.1.255",
        "192.168.1.1",
        "192.168.1.254",
        254,
    ),
    (
        "T-02",
        "10.0.0.0",
        8,
        "10.0.0.0",
        "10.255.255.255",
        "10.0.0.1",
        "10.255.255.254",
        16777214,
    ),
    (
        "T-03",
        "172.16.0.0",
        12,
        "172.16.0.0",
        "172.31.255.255",
        "172.16.0.1",
        "172.31.255.254",
        1048574,
    ),
    (
        "T-04",
        "192.168.1.100",
        30,
        "192.168.1.100",
        "192.168.1.103",
        "192.168.1.101",
        "192.168.1.102",
        2,
    ),
    (
        "T-05",
        "10.1.1.0",
        31,
        "10.1.1.0",
        "10.1.1.1",
        "10.1.1.0",
        "10.1.1.1",
        2,
    ),
    (
        "T-06",
        "10.1.1.5",
        32,
        "10.1.1.5",
        "10.1.1.5",
        "10.1.1.5",
        "10.1.1.5",
        1,
    ),
    (
        "T-07",
        "0.0.0.0",
        0,
        "0.0.0.0",
        "255.255.255.255",
        "0.0.0.1",
        "255.255.255.254",
        4294967294,
    ),
]

INVALID_SUBNET_CASES = [
    # (id, ip, prefix)
    ("T-08", "999.999.999.999", 24),
    ("T-09", "192.168.1.0", 33),
    ("T-10", "192.168.1.0", -1),
    ("T-INV-1", "invalid-ip", 24),
    ("T-INV-2", "192.168.1", 24),
    ("T-INV-3", "", 24),
]


# ---------------------------------------------------------------------------
# 1. Root Endpoint Test
# ---------------------------------------------------------------------------

def test_read_root():
    """GET / harus mengembalikan status code 200."""
    response = client.get("/")
    assert response.status_code == 200


# ---------------------------------------------------------------------------
# 2. Unit Tests: hitung_subnet
# ---------------------------------------------------------------------------

@pytest.mark.parametrize(
    "case_id, ip, prefix, exp_net, exp_bcast, exp_first, exp_last, exp_usable",
    VALID_SUBNET_CASES,
)
def test_hitung_subnet_valid(
    case_id, ip, prefix, exp_net, exp_bcast, exp_first, exp_last, exp_usable
):
    """Menguji fungsi hitung_subnet untuk kasus valid (normal, /31, /32, /0)."""
    res = hitung_subnet(ip, prefix)
    assert res["network_address"] == exp_net
    assert res["broadcast_address"] == exp_bcast
    assert res["first_host"] == exp_first
    assert res["last_host"] == exp_last
    assert res["usable_hosts"] == exp_usable


@pytest.mark.parametrize("case_id, ip, prefix", INVALID_SUBNET_CASES)
def test_hitung_subnet_invalid(case_id, ip, prefix):
    """Menguji fungsi hitung_subnet menolak input tidak valid dengan ValueError."""
    with pytest.raises(ValueError):
        hitung_subnet(ip, prefix)


# ---------------------------------------------------------------------------
# 3. API Integration Tests: GET /api/subnet
# ---------------------------------------------------------------------------

@pytest.mark.parametrize(
    "case_id, ip, prefix, exp_net, exp_bcast, exp_first, exp_last, exp_usable",
    VALID_SUBNET_CASES,
)
def test_api_subnet_success(
    case_id, ip, prefix, exp_net, exp_bcast, exp_first, exp_last, exp_usable
):
    """GET /api/subnet sukses (200) dengan data subnet yang sesuai."""
    response = client.get(f"/api/subnet?ip={ip}&prefix={prefix}")
    assert response.status_code == 200
    data = response.json()
    assert data["network_address"] == exp_net
    assert data["broadcast_address"] == exp_bcast
    assert data["first_host"] == exp_first
    assert data["last_host"] == exp_last
    assert data["usable_hosts"] == exp_usable


@pytest.mark.parametrize("case_id, ip, prefix", INVALID_SUBNET_CASES)
def test_api_subnet_invalid_returns_400(case_id, ip, prefix):
    """GET /api/subnet mengembalikan status code 400 untuk input tidak valid."""
    response = client.get(f"/api/subnet?ip={ip}&prefix={prefix}")
    assert response.status_code == 400
