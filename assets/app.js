/*
 * Game Design Projects — shelf logic.
 *
 * Data: live GitHub org API first, local snapshot second, friendly notice third.
 * Rendering: DOM APIs only. Nothing from the API ever touches innerHTML.
 *
 * Query flags (handy for debugging / previews):
 *   ?offline=1          skip the live API and go straight to data/repos.json
 *   ?theme=light|dark   force a colour scheme (applied inline in <head>)
 *   ?view=plates|index  force a shelf layout
 */
(() => {
  'use strict';

  const ORG = 'game-design-projects';
  const LIVE_URL = `https://api.github.com/orgs/${ORG}/repos?type=public&per_page=100&sort=pushed`;
  const SNAPSHOT_URL = 'data/repos.json';
  const HIDDEN = new Set(['.github', `${ORG}.github.io`]);
  const NOISE_TOPICS = new Set(['itch-io', 'itch-io-game', 'itchio', 'game']);
  const NEW_DAYS = 14;
  const VIEW_KEY = 'gdp:view';

  const params = new URLSearchParams(location.search);
  const OFFLINE = params.get('offline') === '1';

  const log = (...a) => console.info('[gdp]', ...a);
  const $ = (id) => document.getElementById(id);

  const state = {
    repos: [],
    filter: 'all',
    query: '',
    sort: 'updated',
    view: 'plates',
  };

  // ---------------------------------------------------------------- data ---
  const normalize = (r) => ({
    name: r.name,
    description: r.description || '',
    url: r.html_url,
    homepage: r.homepage || '',
    language: r.language || '',
    topics: (r.topics || []).filter((t) => !NOISE_TOPICS.has(t)),
    pushed: r.pushed_at,
    stars: r.stargazers_count || 0,
  });

  const keep = (r) => !r.private && !r.archived && !r.disabled && !HIDDEN.has(r.name);

  async function getJson(url) {
    const res = await fetch(url, { headers: { Accept: 'application/vnd.github+json' } });
    if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
    return res.json();
  }

  async function load() {
    if (OFFLINE) {
      log('?offline=1 — skipping the live API');
    } else {
      try {
        const live = await getJson(LIVE_URL);
        log('live API ok:', live.length, 'repos');
        return { repos: live.filter(keep).map(normalize), source: 'live', at: new Date() };
      } catch (err) {
        log('live API failed, falling back to snapshot:', err.message);
      }
    }
    const snap = await getJson(SNAPSHOT_URL);
    log('snapshot ok:', snap.repos.length, 'repos, generated', snap.generated_at);
    return {
      repos: (snap.repos || []).slice(),
      source: 'snapshot',
      at: new Date(snap.generated_at),
    };
  }

  // ------------------------------------------------------------- helpers ---
  const ACRONYMS = {
    webgpu: 'WebGPU', webgl: 'WebGL', ui: 'UI', ux: 'UX', ai: 'AI', api: 'API',
    '2d': '2D', '3d': '3D', vr: 'VR', ar: 'AR', js: 'JS', css: 'CSS', io: 'IO',
    npc: 'NPC', fps: 'FPS', rpg: 'RPG', gpu: 'GPU', cpu: 'CPU', sdk: 'SDK',
    pcg: 'PCG', hud: 'HUD', ecs: 'ECS', '2.5d': '2.5D', ios: 'iOS', ml: 'ML',
    wechat: 'WeChat', ios26: 'iOS', vfx: 'VFX', nyu: 'NYU', html: 'HTML',
  };

  function prettyName(name) {
    return name
      .split(/[-_\s.]+/)
      .filter(Boolean)
      .map((w) => {
        const low = w.toLowerCase();
        if (ACRONYMS[low]) return ACRONYMS[low];
        return low.charAt(0).toUpperCase() + low.slice(1);
      })
      .join(' ');
  }

  function ago(iso) {
    const ms = Date.now() - new Date(iso).getTime();
    const d = Math.max(0, ms / 86400000);
    if (d < 1) return 'today';
    if (d < 2) return 'yesterday';
    if (d < 30) return `${Math.floor(d)} days ago`;
    if (d < 60) return 'last month';
    if (d < 365) return `${Math.round(d / 30)} months ago`;
    const y = d / 365;
    return y < 2 ? 'a year ago' : `${Math.floor(y)} years ago`;
  }

  const isNew = (r) => (Date.now() - new Date(r.pushed).getTime()) / 86400000 <= NEW_DAYS;

  function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function link(cls, text, href) {
    const a = el('a', cls, text);
    a.href = href;
    a.target = '_blank';
    a.rel = 'noreferrer';
    return a;
  }

  const pad = (n) => String(n).padStart(2, '0');

  // -------------------------------------------------------------- plates ---
  function plate(repo, i) {
    const art = el('article', 'plate');
    art.style.setProperty('--i', String(Math.min(i, 18)));

    // Art. The badge lives in .plate__head so both layouts can place it.
    const frame = el('div', 'plate__frame');
    frame.append(window.GDP_ART.makeArt(repo.name));
    art.append(frame);

    // The caption line lives beside the art so either layout can place it.
    const head = el('div', 'plate__head');
    head.append(el('span', 'plate__no', pad(i + 1)));
    if (isNew(repo)) {
      const badge = el('span', 'plate__badge', 'NEW');
      badge.title = `Pushed ${ago(repo.pushed)}`;
      head.append(badge);
    }
    art.append(head);

    const body = el('div', 'plate__body');

    const title = el('h3', 'plate__title');
    const primaryHref = repo.homepage || repo.url;
    const a = link('', prettyName(repo.name), primaryHref);
    title.append(a);
    body.append(title);

    const hasDesc = Boolean(repo.description);
    const desc = el(
      'p',
      hasDesc ? 'plate__desc' : 'plate__desc plate__desc--empty',
      hasDesc ? repo.description : 'No write-up yet — the code speaks for itself.'
    );
    body.append(desc);

    const meta = el('div', 'plate__meta');
    if (repo.language) meta.append(el('span', 'plate__lang', repo.language));
    if (repo.language) meta.append(el('i', null, '/'));
    meta.append(el('span', null, ago(repo.pushed)));
    if (repo.stars > 0) {
      meta.append(el('i', null, '/'));
      meta.append(el('span', null, `${repo.stars}★`));
    }
    if (!repo.homepage) {
      meta.append(el('i', null, '/'));
      meta.append(el('span', null, 'source only'));
    }
    body.append(meta);

    if (repo.topics.length) {
      const tops = el('div', 'topics');
      repo.topics.slice(0, 4).forEach((t) => tops.append(el('span', null, t)));
      body.append(tops);
    }

    body.append(el('div', 'plate__spacer'));

    const actions = el('div', 'actions');
    if (repo.homepage) {
      const play = link('btn btn--play', 'Play', repo.homepage);
      play.setAttribute('aria-label', `Play ${prettyName(repo.name)} on itch.io`);
      actions.append(play);
      const code = link('btn btn--code', 'Code', repo.url);
      code.setAttribute('aria-label', `Source code for ${prettyName(repo.name)}`);
      actions.append(code);
    } else {
      const code = link('btn btn--play btn--code', 'Read the code', repo.url);
      code.setAttribute('aria-label', `Source code for ${prettyName(repo.name)}`);
      actions.append(code);
    }
    body.append(actions);

    art.append(body);
    return art;
  }

  function skeletons(n) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const s = el('article', 'plate plate--skel');
      s.setAttribute('aria-hidden', 'true');
      const frame = el('div', 'plate__frame');
      frame.append(el('div', 'skel-block'));
      s.append(frame);
      const body = el('div', 'plate__body');
      body.append(el('div', 'skel-line w1'), el('div', 'skel-line w2'), el('div', 'skel-line w3'));
      s.append(body);
      out.push(s);
    }
    return out;
  }

  // ------------------------------------------------------------ selection ---
  function matches(repo, q) {
    if (!q) return true;
    const hay = [repo.name, prettyName(repo.name), repo.description, repo.language]
      .concat(repo.topics)
      .join(' ')
      .toLowerCase();
    return q.split(/\s+/).every((term) => hay.includes(term));
  }

  function passesFilter(repo, filter) {
    if (filter === 'all') return true;
    if (filter === 'playable') return Boolean(repo.homepage);
    if (filter.startsWith('lang:')) return repo.language === filter.slice(5);
    return true;
  }

  const SORTS = {
    updated: (a, b) => new Date(b.pushed) - new Date(a.pushed),
    name: (a, b) => a.name.localeCompare(b.name),
    stars: (a, b) => b.stars - a.stars || new Date(b.pushed) - new Date(a.pushed),
  };

  function visible() {
    const q = state.query.trim().toLowerCase();
    return state.repos
      .filter((r) => passesFilter(r, state.filter) && matches(r, q))
      .sort(SORTS[state.sort] || SORTS.updated);
  }

  // --------------------------------------------------------------- render ---
  function renderShelf() {
    const list = visible();
    const shelf = $('shelf');
    shelf.className = `shelf shelf--${state.view}`;
    shelf.replaceChildren(...list.map(plate));

    // Two different kinds of nothing: an empty org, or an over-narrow filter.
    const bare = state.repos.length === 0;
    $('empty').hidden = list.length > 0;
    $('empty-text').textContent = bare
      ? 'The shelf is empty for now — nothing published yet.'
      : 'Nothing on the shelf matches that.';
    $('clear').hidden = bare;

    const note = $('count');
    note.replaceChildren();
    if (bare) return;
    const strong = el('b', null, String(list.length));
    note.append(strong, document.createTextNode(` of ${state.repos.length} projects`));
    if (state.filter !== 'all' || state.query.trim()) {
      note.append(document.createTextNode(' · filtered'));
    }
    log('render', list.length, 'of', state.repos.length, '·', state.view, '·', state.sort);
  }

  function renderChips() {
    const counts = new Map();
    state.repos.forEach((r) => {
      if (!r.language) return;
      counts.set(r.language, (counts.get(r.language) || 0) + 1);
    });
    const langs = [...counts.keys()].sort((a, b) => counts.get(b) - counts.get(a) || a.localeCompare(b));
    const playable = state.repos.filter((r) => r.homepage).length;

    const items = [
      ['all', 'All', state.repos.length],
      ['playable', 'Playable', playable],
      ...langs.map((l) => [`lang:${l}`, l, counts.get(l)]),
    ];

    const box = $('chips');
    box.replaceChildren(
      ...items.map(([key, label, n]) => {
        const b = el('button', 'chip');
        b.type = 'button';
        b.append(document.createTextNode(label), el('span', null, String(n)));
        b.setAttribute('aria-pressed', String(state.filter === key));
        b.addEventListener('click', () => {
          state.filter = key;
          renderChips();
          renderShelf();
        });
        return b;
      })
    );
  }

  function renderLedger() {
    const playable = state.repos.filter((r) => r.homepage).length;
    const newest = state.repos.reduce(
      (m, r) => (!m || new Date(r.pushed) > new Date(m.pushed) ? r : m),
      null
    );
    const rows = [
      ['Projects', pad(state.repos.length), false],
      ['Playable', pad(playable), false],
      ['Last push', newest ? ago(newest.pushed) : '—', true],
    ];
    $('ledger').replaceChildren(
      ...rows.map(([label, value, word]) => {
        const item = el('div', 'ledger__item');
        item.append(el('dt', null, label), el('dd', word ? 'is-word' : null, value));
        return item;
      })
    );
  }

  function renderFeatured() {
    const fig = $('featured');
    // Feature the newest *playable* project; fall back to the newest of anything.
    const newestOf = (list) =>
      list.reduce((m, r) => (!m || new Date(r.pushed) > new Date(m.pushed) ? r : m), null);
    const newest = newestOf(state.repos.filter((r) => r.homepage)) || newestOf(state.repos);
    if (!newest) {
      fig.hidden = true;
      return;
    }
    fig.hidden = false;

    const frame = el('div', 'featured__frame');
    frame.append(window.GDP_ART.makeArt(newest.name));

    const cap = el('figcaption', 'featured__cap');
    cap.append(el('span', 'tag tag--latest', 'Latest'));

    const title = link('featured__title', prettyName(newest.name), newest.homepage || newest.url);
    cap.append(title);

    const meta = el('span', 'featured__meta');
    const bits = [];
    if (newest.language) bits.push(newest.language);
    bits.push(ago(newest.pushed));
    meta.textContent = bits.join(' · ');
    cap.append(meta);

    const kids = [frame, cap];
    if (newest.description) {
      kids.push(el('p', 'featured__desc', newest.description));
    }
    if (newest.homepage) {
      const p = el('p', 'featured__cta');
      const go = link('link-arrow link-arrow--accent', `Play ${prettyName(newest.name)}`, newest.homepage);
      p.append(go);
      kids.push(p);
    }
    fig.replaceChildren(...kids);
  }

  function renderSource(source, at) {
    const node = $('source');
    node.dataset.source = source;
    if (source === 'live') {
      node.textContent = 'Synced live from the GitHub API';
    } else if (source === 'snapshot') {
      const date = isNaN(at) ? 'an earlier build' : at.toISOString().slice(0, 10);
      node.textContent = `Snapshot from ${date} — live API unavailable`;
    } else {
      node.textContent = 'Offline';
    }
  }

  function setView(view) {
    state.view = view;
    document.querySelectorAll('.viewtoggle button').forEach((b) => {
      b.setAttribute('aria-pressed', String(b.dataset.view === view));
    });
    try { localStorage.setItem(VIEW_KEY, view); } catch (e) { /* private mode */ }
    renderShelf();
  }

  // ----------------------------------------------------------------- boot ---
  function wire() {
    let t = null;
    $('q').addEventListener('input', (e) => {
      const v = e.target.value;
      clearTimeout(t);
      t = setTimeout(() => {
        state.query = v;
        renderShelf();
      }, 90);
    });

    $('sort').addEventListener('change', (e) => {
      state.sort = e.target.value;
      renderShelf();
    });

    document.querySelectorAll('.viewtoggle button').forEach((b) => {
      b.addEventListener('click', () => setView(b.dataset.view));
    });

    $('clear').addEventListener('click', () => {
      state.query = '';
      state.filter = 'all';
      $('q').value = '';
      renderChips();
      renderShelf();
      $('q').focus();
    });
  }

  function boot() {
    try {
      const saved = localStorage.getItem(VIEW_KEY);
      if (saved === 'plates' || saved === 'index') state.view = saved;
    } catch (e) { /* private mode */ }

    const forced = params.get('view');
    if (forced === 'plates' || forced === 'index') state.view = forced;

    document.querySelectorAll('.viewtoggle button').forEach((b) => {
      b.setAttribute('aria-pressed', String(b.dataset.view === state.view));
    });

    wire();
    $('shelf').replaceChildren(...skeletons(6));

    load()
      .then(({ repos, source, at }) => {
        state.repos = repos;
        renderSource(source, at);
        renderLedger();
        renderFeatured();
        renderChips();
        renderShelf();
      })
      .catch((err) => {
        log('both sources failed:', err && err.message);
        $('shelf').replaceChildren();
        $('shelf').hidden = true;
        $('empty').hidden = true;
        $('error').hidden = false;
        $('count').textContent = '';
        $('featured').hidden = true;
        // Nothing to search, sort or lay out — drop the controls entirely.
        document.querySelector('.toolbar').hidden = true;
        renderSource('error');
      });
  }

  boot();
})();
