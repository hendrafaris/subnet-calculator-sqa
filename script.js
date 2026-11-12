/* ============================================================
   NetCalc — Subnet Calculator Logic (Connected to FastAPI)
   ============================================================ */

'use strict';

// ── Helpers ──────────────────────────────────────────────────

/**
 * Validate an IPv4 address string.
 */
function isValidIP(ip) {
  const parts = ip.trim().split('.');
  if (parts.length !== 4) return false;
  return parts.every(p => {
    if (p === '' || p.length > 3) return false;
    const n = Number(p);
    return Number.isInteger(n) && n >= 0 && n <= 255;
  });
}

/**
 * Convert an IPv4 string to a 32-bit unsigned integer.
 */
function ipToInt(ip) {
  const p = ip.trim().split('.').map(Number);
  return ((p[0] << 24) | (p[1] << 16) | (p[2] << 8) | p[3]) >>> 0;
}

/**
 * Convert a 32-bit integer to 32-bit binary string (no dots).
 */
function intToBin(n) {
  return (n >>> 0).toString(2).padStart(32, '0');
}

/**
 * Split a 32-bit binary string into dotted octets.
 */
function binToDotted(b) {
  return [b.slice(0, 8), b.slice(8, 16), b.slice(16, 24), b.slice(24, 32)].join('.');
}

/**
 * Format a large number with thousands separators.
 */
function formatNumber(n) {
  return n.toLocaleString('id-ID');
}

// ── Main Calculation via API ─────────────────────────────────

async function calculate() {
  const ipRaw = document.getElementById('ip-input').value.trim();
  const prefixRaw = document.getElementById('prefix-input').value.trim();
  const errorBox = document.getElementById('error-box');
  const resultsEl = document.getElementById('results');

  // Clear previous state
  clearErrors();
  errorBox.classList.add('hidden');
  errorBox.textContent = '';

  let clientHasError = false;

  // Client-side quick check
  if (!ipRaw) {
    setFieldError('ip-input', 'ip-hint', 'Alamat IP tidak boleh kosong.');
    clientHasError = true;
  }
  if (prefixRaw === '') {
    setFieldError('prefix-input', 'prefix-hint', 'Prefix tidak boleh kosong.');
    clientHasError = true;
  }

  if (clientHasError) return;

  try {
    const response = await fetch(`/api/subnet?ip=${encodeURIComponent(ipRaw)}&prefix=${encodeURIComponent(prefixRaw)}`);
    const data = await response.json();

    if (!response.ok) {
      // Tampilkan pesan error dari field detail
      let message = 'Terjadi kesalahan validasi.';
      if (typeof data.detail === 'string') {
        message = data.detail;
      } else if (Array.isArray(data.detail)) {
        message = data.detail.map(d => d.msg || d).join(', ');
      }
      errorBox.textContent = message;
      errorBox.classList.remove('hidden');
      resultsEl.classList.add('hidden');
      return;
    }

    // Isi tampilan dari data API
    document.getElementById('res-class').textContent = data.ip_class || '—';
    document.getElementById('res-type').textContent = data.ip_type || '—';
    document.getElementById('res-mask').textContent = data.subnet_mask || '—';
    document.getElementById('res-wildcard').textContent = data.wildcard || '—';

    document.getElementById('res-network').textContent = data.network_address || '—';
    document.getElementById('res-broadcast').textContent = data.broadcast_address || '—';

    const netInt = ipToInt(data.network_address);
    const bcastInt = ipToInt(data.broadcast_address);
    document.getElementById('res-network-bin').textContent = binToDotted(intToBin(netInt));
    document.getElementById('res-broadcast-bin').textContent = binToDotted(intToBin(bcastInt));

    document.getElementById('res-first').textContent = data.first_host || '—';
    document.getElementById('res-last').textContent = data.last_host || '—';

    document.getElementById('res-hosts').textContent = formatNumber(data.usable_hosts);
    document.getElementById('res-hosts-sub').textContent =
      data.prefix === 32 ? 'host tunggal (/32)' :
      data.prefix === 31 ? 'host (point-to-point /31)' :
      'host yang dapat digunakan';

    // Visualisasi biner
    renderBinary(netInt, data.prefix);

    // Tampilkan bagian hasil
    resultsEl.classList.remove('hidden');
    resultsEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (err) {
    errorBox.textContent = 'Gagal terhubung ke server API: ' + err.message;
    errorBox.classList.remove('hidden');
    resultsEl.classList.add('hidden');
  }
}

// ── Binary Visualization ─────────────────────────────────────

function renderBinary(networkInt, prefix) {
  const container = document.getElementById('binary-visual');
  container.innerHTML = '';
  const bin = intToBin(networkInt);

  for (let i = 0; i < 32; i++) {
    // Add a separator between octets
    if (i > 0 && i % 8 === 0) {
      const sep = document.createElement('div');
      sep.className = 'bit sep';
      container.appendChild(sep);
    }

    const bit = document.createElement('div');
    bit.className = 'bit ' + (i < prefix ? 'net' : 'host');
    bit.textContent = bin[i];
    bit.title = i < prefix
      ? `Bit network ke-${i + 1}`
      : `Bit host ke-${i - prefix + 1}`;
    bit.style.opacity = '0';
    bit.style.animation = `bitIn .3s ease ${i * 12}ms forwards`;
    container.appendChild(bit);
  }

  // Inject keyframe once
  if (!document.getElementById('bit-anim')) {
    const style = document.createElement('style');
    style.id = 'bit-anim';
    style.textContent = `
      @keyframes bitIn {
        from { opacity: 0; transform: scale(.6) translateY(-6px); }
        to   { opacity: 1; transform: scale(1) translateY(0); }
      }
    `;
    document.head.appendChild(style);
  }
}

// ── Error / Validation Helpers ───────────────────────────────

function setFieldError(inputId, hintId, message) {
  const input = document.getElementById(inputId);
  const hint = document.getElementById(hintId);
  input.classList.add('error');
  if (hint) hint.textContent = message;
}

function clearErrors() {
  ['ip-input', 'prefix-input'].forEach(id => {
    const el = document.getElementById(id);
    el.classList.remove('error', 'valid');
  });
  ['ip-hint', 'prefix-hint'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '';
  });
}

// ── Live Validation ──────────────────────────────────────────

document.getElementById('ip-input').addEventListener('input', function () {
  this.classList.remove('error', 'valid');
  document.getElementById('ip-hint').textContent = '';
  if (this.value && isValidIP(this.value)) {
    this.classList.add('valid');
  }
});

document.getElementById('prefix-input').addEventListener('input', function () {
  this.classList.remove('error', 'valid');
  document.getElementById('prefix-hint').textContent = '';
  const v = parseInt(this.value, 10);
  if (!isNaN(v) && v >= 0 && v <= 32) {
    this.classList.add('valid');
  }
});

// ── Enter key to submit ──────────────────────────────────────

document.addEventListener('keydown', function (e) {
  if (e.key === 'Enter') calculate();
});

// ── Copy Results ─────────────────────────────────────────────

function copyResults() {
  const fields = [
    ['Network Address', document.getElementById('res-network')?.textContent],
    ['Broadcast Address', document.getElementById('res-broadcast')?.textContent],
    ['Subnet Mask', document.getElementById('res-mask')?.textContent],
    ['Wildcard', document.getElementById('res-wildcard')?.textContent],
    ['Host Pertama', document.getElementById('res-first')?.textContent],
    ['Host Terakhir', document.getElementById('res-last')?.textContent],
    ['Jumlah Host', document.getElementById('res-hosts')?.textContent],
    ['Kelas', document.getElementById('res-class')?.textContent],
    ['Tipe', document.getElementById('res-type')?.textContent],
  ];

  const text = fields.map(([label, val]) => `${label}: ${val}`).join('\n');

  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('copy-btn');
    btn.classList.add('copied');
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      Tersalin!`;
    setTimeout(() => {
      btn.classList.remove('copied');
      btn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
        Salin`;
    }, 2500);
  }).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  });
}

// ── Auto-fill example on load ─────────────────────────────────
window.addEventListener('load', () => {
  document.getElementById('ip-input').value = '192.168.1.0';
  document.getElementById('prefix-input').value = '24';
  document.getElementById('ip-input').classList.add('valid');
  document.getElementById('prefix-input').classList.add('valid');
  calculate();
});
