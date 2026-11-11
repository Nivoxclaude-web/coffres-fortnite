(() => {
  'use strict';

  const KEY = 'fn-chests-v1';
  const $ = (id) => document.getElementById(id);
  const DAY = 86400000;

  // ---------- Stockage ----------
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  function newProfile(name) { return { id: uid(), name, games: [], current: null }; }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d && Array.isArray(d.profiles) && d.profiles.length) return d;
      }
    } catch (e) { /* stockage indisponible ou corrompu */ }
    const p = newProfile('Joueur 1');
    return { currentId: p.id, profiles: [p] };
  }

  let data = load();

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(data)); }
    catch (e) { toast('Impossible de sauvegarder', true); }
  }

  function me() {
    let p = data.profiles.find((x) => x.id === data.currentId);
    if (!p) { p = data.profiles[0]; data.currentId = p.id; }
    return p;
  }

  // ---------- Utilitaires ----------
  function toast(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { t.hidden = true; }, 1800);
  }

  function buzz(ms) { if (navigator.vibrate) navigator.vibrate(ms); }

  function fmtDate(ts) {
    return new Date(ts).toLocaleString('fr-CA', {
      weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  }

  function fmtDur(ms) {
    const s = Math.max(0, Math.floor(ms / 1000));
    const m = Math.floor(s / 60);
    return `${m}:${String(s % 60).padStart(2, '0')}`;
  }

  function startOfToday() { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); }

  function totalOf(p) {
    return p.games.reduce((a, g) => a + g.chests, 0) + (p.current ? p.current.chests : 0);
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // ---------- Rendu ----------
  function renderHeader() {
    const p = me();
    $('profileName').textContent = p.name;
    $('avatar').textContent = (p.name.trim()[0] || '?').toUpperCase();
    $('grandTotal').textContent = totalOf(p);
  }

  function renderGame() {
    const p = me();
    const playing = !!p.current;
    $('idle').hidden = playing;
    $('playing').hidden = !playing;
    if (playing) {
      $('gameCount').textContent = p.current.chests;
      $('elapsed').textContent = fmtDur(Date.now() - p.current.start);
    } else {
      const last = p.games[p.games.length - 1];
      $('lastGame').textContent = last
        ? `Dernière partie : ${last.chests} coffre${last.chests > 1 ? 's' : ''} · ${fmtDate(last.end)}`
        : 'Lance une partie et touche le gros bouton à chaque coffre ouvert.';
    }
  }

  function renderStats() {
    const p = me();
    const games = p.games;
    const total = games.reduce((a, g) => a + g.chests, 0);
    const n = games.length;
    const best = n ? Math.max(...games.map((g) => g.chests)) : 0;
    const today = startOfToday();
    const weekAgo = Date.now() - 7 * DAY;
    const sum = (from) => games.filter((g) => g.end >= from).reduce((a, g) => a + g.chests, 0);

    $('sTotal').textContent = total;
    $('sGames').textContent = n;
    $('sAvg').textContent = n ? (total / n).toFixed(1).replace('.', ',') : '0';
    $('sBest').textContent = best;
    $('sToday').textContent = sum(today);
    $('sWeek').textContent = sum(weekAgo);

    renderChart(games.slice(-10));

    const ul = $('history');
    if (!n) {
      ul.innerHTML = '<li class="empty">Aucune partie terminée pour l\'instant.</li>';
      return;
    }
    ul.innerHTML = games.slice().reverse().map((g) => `
      <li>
        <span class="n">${g.chests}</span>
        <span class="d">${fmtDate(g.end)} · ${fmtDur(g.end - g.start)}</span>
        <button class="del" data-del="${g.start}" aria-label="Supprimer cette partie">×</button>
      </li>`).join('');
  }

  function renderChart(list) {
    const box = $('chart');
    if (!list.length) {
      box.innerHTML = '<div class="empty">Le graphique apparaîtra après ta première partie.</div>';
      return;
    }
    const W = 300, H = 150, pad = 18, slots = 10;
    const max = Math.max(1, ...list.map((g) => g.chests));
    const bw = (W - 8) / slots;
    let bars = '';
    list.forEach((g, i) => {
      const h = Math.max(2, (g.chests / max) * (H - pad * 2));
      const x = 4 + i * bw + bw * 0.15;
      const y = H - pad - h;
      const w = bw * 0.7;
      const isBest = g.chests === max;
      bars += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="${isBest ? '#f7c531' : '#8f5bff'}"/>`;
      bars += `<text x="${x + w / 2}" y="${y - 4}" text-anchor="middle" font-size="11" font-weight="700" fill="#f4f2ff">${g.chests}</text>`;
    });
    box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Coffres des dernières parties">
      <line x1="0" y1="${H - pad}" x2="${W}" y2="${H - pad}" stroke="#4a4290" stroke-width="1"/>${bars}</svg>`;
  }

  function renderProfiles() {
    const ul = $('profileList');
    ul.innerHTML = data.profiles.map((p) => `
      <li class="${p.id === data.currentId ? 'current' : ''}">
        <button class="pick" data-pick="${p.id}">
          <span class="avatar">${esc((p.name.trim()[0] || '?').toUpperCase())}</span>
          <span>${esc(p.name)}</span>
        </button>
        <span class="meta">${totalOf(p)} 🧰</span>
        <button class="icon" data-rename="${p.id}" aria-label="Renommer">✏️</button>
        <button class="icon" data-remove="${p.id}" aria-label="Supprimer">🗑️</button>
      </li>`).join('');
  }

  function render() {
    renderHeader();
    renderGame();
    if (!$('tab-stats').hidden) renderStats();
    if (!$('sheet').hidden) renderProfiles();
  }

  // ---------- Actions partie ----------
  $('startBtn').addEventListener('click', () => {
    me().current = { start: Date.now(), chests: 0 };
    save(); buzz(30); render();
  });

  $('plusBtn').addEventListener('click', () => {
    const p = me();
    if (!p.current) return;
    p.current.chests++;
    save(); buzz(40);
    const btn = $('plusBtn');
    btn.classList.remove('pop'); void btn.offsetWidth; btn.classList.add('pop');
    render();
  });

  $('minusBtn').addEventListener('click', () => {
    const p = me();
    if (!p.current || p.current.chests <= 0) return;
    p.current.chests--;
    save(); buzz(15); render();
  });

  $('endBtn').addEventListener('click', () => {
    const p = me();
    if (!p.current) return;
    const g = { start: p.current.start, end: Date.now(), chests: p.current.chests };
    const prevBest = p.games.length ? Math.max(...p.games.map((x) => x.chests)) : 0;
    p.games.push(g);
    p.current = null;
    save(); buzz([30, 50, 30]); render();
    toast(g.chests > prevBest && p.games.length > 1
      ? `Nouveau record : ${g.chests} coffres ! 🏆`
      : `Partie enregistrée : ${g.chests} coffre${g.chests > 1 ? 's' : ''}`);
  });

  $('cancelBtn').addEventListener('click', () => {
    if (!confirm('Annuler la partie en cours ? Les coffres de cette partie ne seront pas comptés.')) return;
    me().current = null;
    save(); render();
  });

  $('history').addEventListener('click', (e) => {
    const b = e.target.closest('[data-del]');
    if (!b) return;
    if (!confirm('Supprimer cette partie de l\'historique ?')) return;
    const p = me();
    p.games = p.games.filter((g) => String(g.start) !== b.dataset.del);
    save(); render();
  });

  // ---------- Onglets ----------
  function showTab(name) {
    document.querySelectorAll('.tabs button').forEach((b) => b.classList.toggle('active', b.dataset.tab === name));
    document.querySelectorAll('.tab').forEach((t) => {
      const on = t.id === `tab-${name}`;
      t.classList.toggle('active', on);
      t.hidden = !on;
    });
    render();
  }
  document.querySelectorAll('.tabs button').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.tab)));

  // ---------- Profils ----------
  $('profileBtn').addEventListener('click', () => { $('sheet').hidden = false; renderProfiles(); });
  $('closeSheet').addEventListener('click', () => { $('sheet').hidden = true; });
  $('sheet').addEventListener('click', (e) => { if (e.target.id === 'sheet') $('sheet').hidden = true; });

  $('addForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('newName').value.trim();
    if (!name) return;
    if (data.profiles.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
      toast('Ce nom existe déjà'); return;
    }
    const p = newProfile(name);
    data.profiles.push(p);
    data.currentId = p.id;
    $('newName').value = '';
    save(); render(); toast(`Bienvenue ${name} !`);
  });

  $('profileList').addEventListener('click', (e) => {
    const pick = e.target.closest('[data-pick]');
    const ren = e.target.closest('[data-rename]');
    const rem = e.target.closest('[data-remove]');
    if (pick) {
      data.currentId = pick.dataset.pick;
      save(); $('sheet').hidden = true; render();
    } else if (ren) {
      const p = data.profiles.find((x) => x.id === ren.dataset.rename);
      const name = (prompt('Nouveau nom :', p.name) || '').trim().slice(0, 20);
      if (name) { p.name = name; save(); render(); }
    } else if (rem) {
      const p = data.profiles.find((x) => x.id === rem.dataset.remove);
      if (data.profiles.length === 1) { toast('Il faut garder au moins un joueur'); return; }
      if (!confirm(`Supprimer ${p.name} et toutes ses stats ? C'est définitif.`)) return;
      data.profiles = data.profiles.filter((x) => x.id !== p.id);
      if (data.currentId === p.id) data.currentId = data.profiles[0].id;
      save(); render();
    }
  });

  $('exportBtn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `coffres-fortnite-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });

  $('importInput').addEventListener('change', async (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    try {
      const d = JSON.parse(await f.text());
      if (!d || !Array.isArray(d.profiles) || !d.profiles.length) throw new Error('format');
      if (!confirm('Remplacer toutes les données actuelles par ce fichier ?')) return;
      data = d;
      save(); render(); toast('Données importées');
    } catch (err) {
      toast('Fichier invalide');
    }
  });

  // ---------- Démarrage ----------
  $('tab-stats').hidden = true;
  render();
  setInterval(() => { if (me().current) $('elapsed').textContent = fmtDur(Date.now() - me().current.start); }, 1000);

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
