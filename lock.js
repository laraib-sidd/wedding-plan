/*
 * Client-side password gate for the wedding planner site.
 * NOTE: this is a soft UX lock, not real security — the page is fully
 * static (GitHub Pages, no backend), so anyone who views source and cracks
 * the SHA-256 hash offline can get past it. It's meant to keep casual
 * visitors out of the budget / guest list / vendor tabs, nothing more.
 */
(function () {
  const PASSWORD_HASH = '8ce7c4e59e7fb28a4804faf371794c314f57e4f0610a456b6ee55c5ce7a9faa6';
  const STORAGE_KEY = 'lm-unlocked';

  async function sha256Hex(str) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function isUnlocked() {
    return localStorage.getItem(STORAGE_KEY) === '1';
  }

  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .lock-gate { position: relative; min-height: 220px; }
      .lock-gate > *:not(.lock-overlay) { filter: blur(8px); user-select: none; pointer-events: none; }
      .lock-gate.unlocked > *:not(.lock-overlay) { filter: none; user-select: auto; pointer-events: auto; }
      .lock-overlay {
        position: absolute; inset: 0; z-index: 50;
        display: flex; align-items: center; justify-content: center;
        background: rgba(15,31,61,.55); backdrop-filter: blur(2px);
        border-radius: 14px;
      }
      .lock-box {
        background: #fff; padding: 32px 28px; border-radius: 16px;
        text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,.25);
        width: min(320px, 90%); font-family: 'DM Sans', sans-serif;
      }
      .lock-box .lock-icon { font-size: 2rem; margin-bottom: 8px; }
      .lock-box h3 {
        font-family: 'Cormorant Garamond', serif; color: #0f1f3d;
        margin-bottom: 6px; font-size: 1.3rem;
      }
      .lock-box p { font-size: .82rem; color: #6b6b8a; margin-bottom: 16px; }
      .lock-input {
        width: 100%; padding: 10px 14px; border: 1px solid #e8e0d8; border-radius: 8px;
        font-size: .9rem; margin-bottom: 10px; font-family: inherit;
      }
      .lock-btn {
        width: 100%; padding: 10px 14px; border: none; border-radius: 8px;
        background: #0f1f3d; color: #fff; font-weight: 600; cursor: pointer; font-size: .9rem;
      }
      .lock-btn:hover { background: #1a3260; }
      .lock-error { display: none; color: #c0392b; font-size: .78rem; margin-top: 8px; }
      .lock-error.show { display: block; }
      .nav-lock { margin-left: 4px; opacity: .6; font-size: .75rem; }
    `;
    document.head.appendChild(style);
  }

  function buildOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'lock-overlay';
    overlay.innerHTML = `
      <div class="lock-box">
        <div class="lock-icon">🔒</div>
        <h3>This section is locked</h3>
        <p>Enter the password to view.</p>
        <input type="password" class="lock-input" placeholder="Password" autocomplete="off" />
        <button type="button" class="lock-btn">Unlock</button>
        <div class="lock-error">Incorrect password — try again.</div>
      </div>`;
    const input = overlay.querySelector('.lock-input');
    const btn = overlay.querySelector('.lock-btn');
    const err = overlay.querySelector('.lock-error');

    async function attempt() {
      const hash = await sha256Hex(input.value);
      if (hash === PASSWORD_HASH) {
        localStorage.setItem(STORAGE_KEY, '1');
        unlockAllGates();
      } else {
        err.classList.add('show');
        input.value = '';
        input.focus();
      }
    }

    btn.addEventListener('click', attempt);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') attempt(); });
    return overlay;
  }

  function unlockAllGates() {
    document.querySelectorAll('.lock-gate').forEach((gate) => {
      gate.classList.add('unlocked');
      const overlay = gate.querySelector('.lock-overlay');
      if (overlay) overlay.remove();
    });
  }

  function initGates() {
    const gates = document.querySelectorAll('.lock-gate');
    if (!gates.length) return;
    injectStyles();
    if (isUnlocked()) {
      gates.forEach((g) => g.classList.add('unlocked'));
      return;
    }
    gates.forEach((gate) => gate.appendChild(buildOverlay()));
  }

  document.addEventListener('DOMContentLoaded', initGates);
})();
