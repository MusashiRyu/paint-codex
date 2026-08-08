import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildCatalogHtmlOfSize } from './helpers/catalogHtml';

/**
 * The catalogue is module-level state seeded at import time, so each case
 * re-imports the graph to get a clean repository plus whatever localStorage
 * was left holding.
 */
async function loadModules() {
  const repository = await import('../domain/paintRepository');
  const sync = await import('../domain/paintCatalogSync');
  return { repository, sync };
}

function respondWith(html: string, init?: { ok?: boolean; status?: number }) {
  return vi.fn().mockResolvedValue({
    ok: init?.ok ?? true,
    status: init?.status ?? 200,
    text: () => Promise.resolve(html),
  });
}

/** Comfortably above the "the parse broke" floor of half the bundled snapshot. */
const HEALTHY_HTML = buildCatalogHtmlOfSize(200);

beforeEach(() => {
  vi.resetModules();
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('refreshPaintCatalog', () => {
  it('adopts a fetched catalogue and notifies subscribers', async () => {
    vi.stubGlobal('fetch', respondWith(HEALTHY_HTML));
    const { repository, sync } = await loadModules();

    const listener = vi.fn();
    repository.subscribeToPaints(listener);

    const result = await sync.refreshPaintCatalog();

    expect(result).toEqual({ status: 'updated', paintCount: 600 });
    expect(repository.getPaints()).toHaveLength(600);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('revalidates rather than reading from cache', async () => {
    const fetchMock = respondWith(HEALTHY_HTML);
    vi.stubGlobal('fetch', fetchMock);
    const { sync } = await loadModules();

    await sync.refreshPaintCatalog();

    const [, init] = fetchMock.mock.calls[0];
    expect(init.cache).toBe('no-cache');
  });

  it('reports an unchanged upstream without touching the catalogue', async () => {
    vi.stubGlobal('fetch', respondWith(HEALTHY_HTML));
    const { repository, sync } = await loadModules();
    await sync.refreshPaintCatalog();

    const adopted = repository.getPaints();
    const listener = vi.fn();
    repository.subscribeToPaints(listener);

    expect(await sync.refreshPaintCatalog()).toEqual({ status: 'unchanged' });
    expect(repository.getPaints()).toBe(adopted);
    expect(listener).not.toHaveBeenCalled();
  });

  it('does not re-render when the document changed but the paints did not', async () => {
    vi.stubGlobal('fetch', respondWith(HEALTHY_HTML));
    const { repository, sync } = await loadModules();
    await sync.refreshPaintCatalog();

    const adopted = repository.getPaints();
    const listener = vi.fn();
    repository.subscribeToPaints(listener);

    // Same table, different page around it.
    vi.stubGlobal('fetch', respondWith(`<!-- edited -->${HEALTHY_HTML}`));
    expect(await sync.refreshPaintCatalog()).toEqual({ status: 'unchanged' });
    expect(repository.getPaints()).toBe(adopted);
    expect(listener).not.toHaveBeenCalled();
  });

  it('rejects a parse that lost most of the catalogue', async () => {
    vi.stubGlobal('fetch', respondWith(buildCatalogHtmlOfSize(3)));
    const { repository, sync } = await loadModules();
    const bundled = repository.getPaints();

    const result = await sync.refreshPaintCatalog();

    expect(result.status).toBe('rejected');
    expect(repository.getPaints()).toBe(bundled);
    expect(localStorage.getItem('paco-paint-catalog')).toBeNull();
  });

  it('rejects markup it cannot find a catalogue in at all', async () => {
    vi.stubGlobal('fetch', respondWith('<html><body>404: Not Found</body></html>'));
    const { repository, sync } = await loadModules();
    const bundled = repository.getPaints();

    expect((await sync.refreshPaintCatalog()).status).toBe('rejected');
    expect(repository.getPaints()).toBe(bundled);
  });

  it('keeps the current catalogue when the network fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const { repository, sync } = await loadModules();
    const bundled = repository.getPaints();

    expect(await sync.refreshPaintCatalog()).toEqual({ status: 'failed', reason: 'offline' });
    expect(repository.getPaints()).toBe(bundled);
  });

  it('keeps the current catalogue on an HTTP error', async () => {
    vi.stubGlobal('fetch', respondWith('', { ok: false, status: 503 }));
    const { repository, sync } = await loadModules();
    const bundled = repository.getPaints();

    expect(await sync.refreshPaintCatalog()).toEqual({ status: 'failed', reason: 'HTTP 503' });
    expect(repository.getPaints()).toBe(bundled);
  });

  it('shares one request between concurrent callers', async () => {
    const fetchMock = respondWith(HEALTHY_HTML);
    vi.stubGlobal('fetch', fetchMock);
    const { sync } = await loadModules();

    const [a, b] = await Promise.all([sync.refreshPaintCatalog(), sync.refreshPaintCatalog()]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(a).toBe(b);
  });
});

describe('catalogue persistence', () => {
  it('serves a refreshed catalogue on the next launch, before any fetch', async () => {
    vi.stubGlobal('fetch', respondWith(HEALTHY_HTML));
    const first = await loadModules();
    await first.sync.refreshPaintCatalog();
    expect(first.repository.getPaints()).toHaveLength(600);

    // Relaunch: fresh modules, same storage, network not yet consulted.
    vi.resetModules();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const second = await loadModules();

    expect(second.repository.getPaints()).toHaveLength(600);
  });

  it('skips reparsing when the cached document is still current', async () => {
    vi.stubGlobal('fetch', respondWith(HEALTHY_HTML));
    await (await loadModules()).sync.refreshPaintCatalog();

    vi.resetModules();
    vi.stubGlobal('fetch', respondWith(HEALTHY_HTML));
    const second = await loadModules();
    const listener = vi.fn();
    second.repository.subscribeToPaints(listener);

    expect(await second.sync.refreshPaintCatalog()).toEqual({ status: 'unchanged' });
    expect(listener).not.toHaveBeenCalled();
  });

  it('discards a cache written against a different bundled snapshot', async () => {
    vi.stubGlobal('fetch', respondWith(HEALTHY_HTML));
    await (await loadModules()).sync.refreshPaintCatalog();

    const stored = JSON.parse(localStorage.getItem('paco-paint-catalog')!);
    stored.bundledSignature = 'from-an-older-build';
    localStorage.setItem('paco-paint-catalog', JSON.stringify(stored));

    vi.resetModules();
    const { repository } = await loadModules();

    expect(repository.getPaints()).toBe(repository.getBundledPaints());
    expect(localStorage.getItem('paco-paint-catalog')).toBeNull();
  });

  it('falls back to the bundled snapshot when the cache is corrupt', async () => {
    localStorage.setItem('paco-paint-catalog', '{ not json');
    const { repository } = await loadModules();

    expect(repository.getPaints()).toBe(repository.getBundledPaints());
    expect(localStorage.getItem('paco-paint-catalog')).toBeNull();
  });

  it('falls back to the bundled snapshot when the cache holds the wrong shape', async () => {
    localStorage.setItem(
      'paco-paint-catalog',
      JSON.stringify({ version: 1, bundledSignature: 'x', htmlHash: 'y', paints: [{ nope: true }] })
    );
    const { repository } = await loadModules();

    expect(repository.getPaints()).toBe(repository.getBundledPaints());
  });

  it('still applies a refresh for the session when storage is unavailable', async () => {
    const failing = vi.fn(() => {
      throw new Error('QuotaExceededError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(failing);
    vi.stubGlobal('fetch', respondWith(HEALTHY_HTML));

    const { repository, sync } = await loadModules();
    expect((await sync.refreshPaintCatalog()).status).toBe('updated');
    expect(repository.getPaints()).toHaveLength(600);

    vi.restoreAllMocks();
  });
});
