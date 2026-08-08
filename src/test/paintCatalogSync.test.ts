import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import bundledPaints from '../data/paints.snapshot.json';
import { PAINT_CATALOG_SOURCES } from '../domain/paintCatalogSource';
import type { CatalogDocument } from '../domain/paintCatalogSource';
import { buildCatalogDocumentsOfSize } from './helpers/catalogMarkdown';

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

/**
 * A fetch stub that answers per URL, since the refresh now pulls one document
 * per brand. A bare string answers every URL with the same body.
 */
function respondWith(
  body: CatalogDocument[] | string,
  init?: { ok?: boolean; status?: number }
) {
  const byUrl = new Map(
    PAINT_CATALOG_SOURCES.map((source, index) => [
      source.url,
      typeof body === 'string' ? body : (body[index]?.markdown ?? ''),
    ])
  );
  return vi.fn().mockImplementation((url: string) =>
    Promise.resolve({
      ok: init?.ok ?? true,
      status: init?.status ?? 200,
      text: () => Promise.resolve(byUrl.get(url) ?? ''),
    })
  );
}

/**
 * Comfortably above the "the parse broke" floor, which is half the bundled
 * count *per brand*. Derived from the snapshot rather than written as a
 * literal so a rescrape that grows a brand cannot turn every case in this file
 * red at once.
 */
const PER_BRAND = (() => {
  const counts = new Map<string, number>();
  for (const paint of bundledPaints as { brand: string }[]) {
    counts.set(paint.brand, (counts.get(paint.brand) ?? 0) + 1);
  }
  return Math.ceil(Math.max(...counts.values()) / 2) + 8;
})();

const HEALTHY = buildCatalogDocumentsOfSize(PER_BRAND);
const HEALTHY_COUNT = PER_BRAND * 3;

beforeEach(() => {
  vi.resetModules();
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('refreshPaintCatalog', () => {
  it('adopts a fetched catalogue and notifies subscribers', async () => {
    vi.stubGlobal('fetch', respondWith(HEALTHY));
    const { repository, sync } = await loadModules();

    const listener = vi.fn();
    repository.subscribeToPaints(listener);

    const result = await sync.refreshPaintCatalog();

    expect(result).toEqual({ status: 'updated', paintCount: HEALTHY_COUNT });
    expect(repository.getPaints()).toHaveLength(HEALTHY_COUNT);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('fetches every brand document', async () => {
    const fetchMock = respondWith(HEALTHY);
    vi.stubGlobal('fetch', fetchMock);
    const { sync } = await loadModules();

    await sync.refreshPaintCatalog();

    expect(fetchMock.mock.calls.map(([url]) => url).sort()).toEqual(
      PAINT_CATALOG_SOURCES.map((source) => source.url).sort()
    );
  });

  it('revalidates rather than reading from cache', async () => {
    const fetchMock = respondWith(HEALTHY);
    vi.stubGlobal('fetch', fetchMock);
    const { sync } = await loadModules();

    await sync.refreshPaintCatalog();

    for (const [, init] of fetchMock.mock.calls) {
      expect(init.cache).toBe('no-cache');
    }
  });

  it('reports an unchanged upstream without touching the catalogue', async () => {
    vi.stubGlobal('fetch', respondWith(HEALTHY));
    const { repository, sync } = await loadModules();
    await sync.refreshPaintCatalog();

    const adopted = repository.getPaints();
    const listener = vi.fn();
    repository.subscribeToPaints(listener);

    expect(await sync.refreshPaintCatalog()).toEqual({ status: 'unchanged' });
    expect(repository.getPaints()).toBe(adopted);
    expect(listener).not.toHaveBeenCalled();
  });

  it('does not re-render when the documents changed but the paints did not', async () => {
    vi.stubGlobal('fetch', respondWith(HEALTHY));
    const { repository, sync } = await loadModules();
    await sync.refreshPaintCatalog();

    const adopted = repository.getPaints();
    const listener = vi.fn();
    repository.subscribeToPaints(listener);

    // Same tables, edited prose around them.
    const edited = HEALTHY.map((document) => ({
      ...document,
      markdown: `<!-- edited -->\n${document.markdown}`,
    }));
    vi.stubGlobal('fetch', respondWith(edited));
    expect(await sync.refreshPaintCatalog()).toEqual({ status: 'unchanged' });
    expect(repository.getPaints()).toBe(adopted);
    expect(listener).not.toHaveBeenCalled();
  });

  it('rejects a parse that lost most of the catalogue', async () => {
    vi.stubGlobal('fetch', respondWith(buildCatalogDocumentsOfSize(3)));
    const { repository, sync } = await loadModules();
    const bundled = repository.getPaints();

    const result = await sync.refreshPaintCatalog();

    expect(result.status).toBe('rejected');
    expect(repository.getPaints()).toBe(bundled);
    expect(localStorage.getItem('paco-paint-catalog')).toBeNull();
  });

  it('rejects when a single brand document goes missing', async () => {
    // The brand that vanishes is the smallest one in the real snapshot, so its
    // absence is invisible in the total — the per-brand floor is what catches
    // it. Guarding on the sum alone would adopt this and ship a catalogue with
    // no Citadel paints in it.
    const partial = [{ brand: 'Citadel', markdown: '404: Not Found' }, HEALTHY[1], HEALTHY[2]];
    vi.stubGlobal('fetch', respondWith(partial));
    const { repository, sync } = await loadModules();
    const bundled = repository.getPaints();

    expect((await sync.refreshPaintCatalog()).status).toBe('rejected');
    expect(repository.getPaints()).toBe(bundled);
  });

  it('rejects documents it cannot find a catalogue in at all', async () => {
    vi.stubGlobal('fetch', respondWith('404: Not Found'));
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

  it('shares one round of requests between concurrent callers', async () => {
    const fetchMock = respondWith(HEALTHY);
    vi.stubGlobal('fetch', fetchMock);
    const { sync } = await loadModules();

    const [a, b] = await Promise.all([sync.refreshPaintCatalog(), sync.refreshPaintCatalog()]);

    expect(fetchMock).toHaveBeenCalledTimes(PAINT_CATALOG_SOURCES.length);
    expect(a).toBe(b);
  });
});

describe('catalogue persistence', () => {
  it('serves a refreshed catalogue on the next launch, before any fetch', async () => {
    vi.stubGlobal('fetch', respondWith(HEALTHY));
    const first = await loadModules();
    await first.sync.refreshPaintCatalog();
    expect(first.repository.getPaints()).toHaveLength(HEALTHY_COUNT);

    // Relaunch: fresh modules, same storage, network not yet consulted.
    vi.resetModules();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const second = await loadModules();

    expect(second.repository.getPaints()).toHaveLength(HEALTHY_COUNT);
  });

  it('skips reparsing when the cached documents are still current', async () => {
    vi.stubGlobal('fetch', respondWith(HEALTHY));
    await (await loadModules()).sync.refreshPaintCatalog();

    vi.resetModules();
    vi.stubGlobal('fetch', respondWith(HEALTHY));
    const second = await loadModules();
    const listener = vi.fn();
    second.repository.subscribeToPaints(listener);

    expect(await second.sync.refreshPaintCatalog()).toEqual({ status: 'unchanged' });
    expect(listener).not.toHaveBeenCalled();
  });

  it('discards a cache written against a different bundled snapshot', async () => {
    vi.stubGlobal('fetch', respondWith(HEALTHY));
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
    vi.stubGlobal('fetch', respondWith(HEALTHY));

    const { repository, sync } = await loadModules();
    expect((await sync.refreshPaintCatalog()).status).toBe('updated');
    expect(repository.getPaints()).toHaveLength(HEALTHY_COUNT);

    vi.restoreAllMocks();
  });
});
