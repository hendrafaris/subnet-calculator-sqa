/* ============================================================
   NetCalc — Subnet Calculator Logic
   ============================================================ */

'use strict';

// ── Helpers ──────────────────────────────────────────────────

/**
 * Validate an IPv4 address string.
 * Returns true if valid.
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
 * Convert a 32-bit unsigned integer to IPv4 dotted-decimal string.
 */
function intToIp(n) {
  n = n >>> 0;
  return [
    (n >>> 24) & 0xff,
    (n >>> 16) & 0xff,
    (n >>>  8) & 0xff,
     n         & 0xff
  ].join('.');
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
  return [b.slice(0,8), b.slice(8,16), b.slice(16,24), b.slice(24,32)].join('.');
}

/**
 * Determine the IP class (A, B, C, D, E).
 */
function getClass(ip) {
  const first = Number(ip.trim().split('.')[0]);
  if (first >= 1   && first <= 126) return 'A';
  if (first === 127)                return 'Loopback';
  if (first >= 128 && first <= 191) return 'B';
  if (first >= 192 && first <= 223) return 'C';
  if (first >= 224 && first <= 239) return 'D (Multicast)';
  if (first >= 240)                 return 'E (Reserved)';
  return '—';
}

/**
 * Determine if the IP is private or public.
 */
function getType(ipInt) {
  const oct = [
    (ipInt >>> 24) & 0xff,
    (ipInt >>> 16) & 0xff,
    (ipInt >>>  8) & 0xff,
     ipInt         & 0xff
  ];
  if (oct[0] === 10)                                      return 'Privat';
  if (oct[0] === 172 && oct[1] >= 16 && oct[1] <= 31)    return 'Privat';
  if (oct[0] === 192 && oct[1] === 168)                   return 'Privat';
  if (oct[0] === 127)                                     return 'Loopback';
  if (oct[0] === 169 && oct[1] === 254)                   return 'Link-Local';
  return 'Publik';
}

/**
 * Format a large number with thousands separators.
 */
function formatNumber(n) {
  return n.toLocaleString('id-ID');
}

// ── Main Calculation ─────────────────────────────────────────

function calculate() {
  const ipRaw    = document.getElementById('ip-input').value.trim();
  const prefixRaw = document.getElementById('prefix-input').value.trim();

  // Clear previous state
  clearErrors();
  document.getElementById('error-box').classList.add('hidden');

  let hasError = false;

  // Validate IP
  if (!ipRaw) {
    setFieldError('ip-input', 'ip-hint', 'Alamat IP tidak boleh kosong.');
    hasError = true;
  } else if (!isValidIP(ipRaw)) {
    setFieldError('ip-input', 'ip-hint', 'Format IP tidak valid (contoh: 192.168.1.0).');
    hasError = true;
  }

  // Validate prefix
  const prefix = parseInt(prefixRaw, 10);
  if (prefixRaw === '') {
    setFieldError('prefix-input', 'prefix-hint', 'Prefix tidak boleh kosong.');
    hasError = true;
  } else if (isNaN(prefix) || prefix < 0 || prefix > 32) {
    setFieldError('prefix-input', 'prefix-hint', 'Prefix harus antara 0 – 32.');
    hasError = true;
  }

  if (hasError) return;

  // ── Compute ───────────────────────────────────────────────

  const ipInt      = ipToInt(ipRaw);
  const maskInt    = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  const wildcardInt = (~maskInt) >>> 0;
  const networkInt  = (ipInt & maskInt) >>> 0;
  const broadcastInt = (networkInt | wildcardInt) >>> 0;

  const totalHosts = Math.pow(2, 32 - prefix);  // includes network + broadcast
  const usableHosts = prefix >= 31 ? (prefix === 31 ? 2 : 1) : Math.max(0, totalHosts - 2);

  let firstHostInt, lastHostInt;
  if (prefix === 32) {
    firstHostInt = networkInt;
    lastHostInt  = networkInt;
  } else if (prefix === 31) {
    firstHostInt = networkInt;
    lastHostInt  = broadcastInt;
  } else {
    firstHostInt = (networkInt + 1) >>> 0;
    lastHostInt  = (broadcastInt - 1) >>> 0;
  }

  // ── Fill UI ───────────────────────────────────────────────

  document.getElementById('res-class').textContent    = getClass(ipRaw);
  document.getElementById('res-type').textContent     = getType(ipInt);
  document.getElementById('res-mask').textContent     = intToIp(maskInt);
  document.getElementById('res-wildcard').textContent = intToIp(wildcardInt);

  document.getElementById('res-network').textContent   = intToIp(networkInt);
  document.getElementById('res-broadcast').textContent = intToIp(broadcastInt);

  document.getElementById('res-network-bin').textContent   = binToDotted(intToBin(networkInt));
  document.getElementById('res-broadcast-bin').textContent = binToDotted(intToBin(broadcastInt));

  document.getElementById('res-first').textContent = intToIp(firstHostInt);
  document.getElementById('res-last').textContent  = intToIp(lastHostInt);

  document.getElementById('res-hosts').textContent = formatNumber(usableHosts);
  document.getElementById('res-hosts-sub').textContent =
    prefix === 32 ? 'host tunggal (/32)' :
    prefix === 31 ? 'host (point-to-point /31)' :
    'host yang dapat digunakan';

  // Binary visualization
  renderBinary(networkInt, prefix);

  // Show results
  const resultsEl = document.getElementById('results');
  resultsEl.classList.remove('hidden');
  resultsEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
    // Animate in with delay
    bit.style.animationDelay = `${i * 15}ms`;
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
  const hint  = document.getElementById(hintId);
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
    ['Network Address',  document.getElementById('res-network')?.textContent],
    ['Broadcast Address',document.getElementById('res-broadcast')?.textContent],
    ['Subnet Mask',      document.getElementById('res-mask')?.textContent],
    ['Wildcard',         document.getElementById('res-wildcard')?.textContent],
    ['Host Pertama',     document.getElementById('res-first')?.textContent],
    ['Host Terakhir',    document.getElementById('res-last')?.textContent],
    ['Jumlah Host',      document.getElementById('res-hosts')?.textContent],
    ['Kelas',            document.getElementById('res-class')?.textContent],
    ['Tipe',             document.getElementById('res-type')?.textContent],
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
    // Fallback for older browsers
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  });
}

// ── Auto-fill example on load ─────────────────────────────────
window.addEventListener('load', () => {
  document.getElementById('ip-input').value    = '192.168.1.0';
  document.getElementById('prefix-input').value = '24';
  document.getElementById('ip-input').classList.add('valid');
  document.getElementById('prefix-input').classList.add('valid');
});
