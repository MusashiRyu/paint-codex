import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import App from '../app/App';
import { AboutSheet } from '../features/about/AboutSheet';
import { appConfig } from '../app/config';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('AboutSheet', () => {
  it('credits the people the app is built from', () => {
    render(<AboutSheet onClose={() => {}} />);

    expect(screen.getByRole('link', { name: 'miniature-paints' })).toHaveAttribute(
      'href',
      appConfig.links.paintData
    );
    expect(screen.getByRole('link', { name: 'Lukas Stordeur' })).toHaveAttribute(
      'href',
      appConfig.links.design
    );
    expect(screen.getByText(/not affiliated with/i)).toBeInTheDocument();
  });

  it('links the published privacy policy', () => {
    render(<AboutSheet onClose={() => {}} />);

    expect(screen.getByRole('link', { name: /privacy policy/i })).toHaveAttribute(
      'href',
      appConfig.links.privacy
    );
  });

  /**
   * Every outbound link depends on these two attributes. Without `target`
   * the page loads inside the WebView and replaces the app; without `noreferrer`
   * the destination learns where the visit came from, which the privacy policy
   * says it does not. Neither failure is visible in a browser, so they are
   * asserted rather than eyeballed.
   */
  it('sends every outbound link to the browser, and tells it nothing', () => {
    render(<AboutSheet onClose={() => {}} />);

    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);

    for (const link of links) {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
  });

  describe('the tip link', () => {
    it('points at the configured page when the flag is on', () => {
      render(<AboutSheet onClose={() => {}} />);

      expect(screen.getByRole('link', { name: 'LEAVE A TIP' })).toHaveAttribute(
        'href',
        appConfig.links.support
      );
    });

    // The flag removes the whole section and not just the button, so prove it.
    describe('with the flag off', () => {
      const original = appConfig.featureFlags.supportLink;

      beforeEach(() => {
        appConfig.featureFlags.supportLink = false;
      });

      afterEach(() => {
        appConfig.featureFlags.supportLink = original;
      });

      it('removes the whole section', () => {
        render(<AboutSheet onClose={() => {}} />);

        expect(screen.queryByRole('link', { name: 'LEAVE A TIP' })).toBeNull();
        expect(screen.queryByText(/leave a tip/i)).toBeNull();
        // The rest of the sheet still stands on its own.
        expect(screen.getByRole('link', { name: 'miniature-paints' })).toBeInTheDocument();
      });
    });
  });

  it('closes when asked', () => {
    const onClose = vi.fn();
    render(<AboutSheet onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: 'Close about' }));

    expect(onClose).toHaveBeenCalledOnce();
  });
});

describe('the header entry point', () => {
  beforeEach(() => {
    // App refreshes the catalog on mount; keep the test off the network.
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
  });

  it('opens the About sheet, which is otherwise unreachable', () => {
    render(<App />);

    expect(screen.queryByRole('dialog', { name: 'About Paco' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'About Paco' }));

    expect(screen.getByRole('dialog', { name: 'About Paco' })).toBeInTheDocument();
  });
});
