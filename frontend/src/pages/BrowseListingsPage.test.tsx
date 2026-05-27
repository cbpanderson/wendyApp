import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders } from '../test/render';
import { server } from '../test/setup';
import BrowseListingsPage from './BrowseListingsPage';

function renderPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/listings" element={<BrowseListingsPage />} />
      <Route path="/listings/:id" element={<div>Detail page</div>} />
    </Routes>,
    { routerProps: { initialEntries: ['/listings'] } }
  );
}

describe('BrowseListingsPage', () => {
  it('renders a list of active listings', async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByText(/Local raw honey/i)).toBeInTheDocument()
    );
    expect(screen.getByText(/Dozen brown eggs/i)).toBeInTheDocument();
    expect(screen.getByText(/Lawn mowing service/i)).toBeInTheDocument();
  });

  it('filters by category', async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() =>
      expect(screen.getByText(/Local raw honey/i)).toBeInTheDocument()
    );
    // Open the category dropdown and pick Honey.
    await user.click(screen.getByLabelText(/category/i));
    await user.click(await screen.findByRole('option', { name: /honey/i }));
    await waitFor(() => {
      expect(screen.getByText(/Local raw honey/i)).toBeInTheDocument();
      expect(screen.queryByText(/Dozen brown eggs/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Lawn mowing service/i)).not.toBeInTheDocument();
    });
  });

  it('filters by search keyword (debounced)', async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() =>
      expect(screen.getByText(/Local raw honey/i)).toBeInTheDocument()
    );
    const search = screen.getByLabelText(/search/i);
    await user.type(search, 'lawn');
    await waitFor(
      () => {
        expect(screen.getByText(/Lawn mowing service/i)).toBeInTheDocument();
        expect(screen.queryByText(/Local raw honey/i)).not.toBeInTheDocument();
      },
      { timeout: 1500 }
    );
  });

  it('shows an empty state when no listings match', async () => {
    server.use(
      http.get('/api/v1/listings', () =>
        HttpResponse.json({ items: [], total: 0 })
      )
    );
    renderPage();
    await waitFor(() =>
      expect(screen.getByText(/no listings match your filters/i)).toBeInTheDocument()
    );
  });

  it('loads more on click', async () => {
    // First page: 1 item, total 2. Second page: another item.
    let calls = 0;
    server.use(
      http.get('/api/v1/listings', ({ request }) => {
        calls++;
        const url = new URL(request.url);
        const offset = Number(url.searchParams.get('offset') ?? '0');
        const itemForPage = (n: number) => ({
          id: `listing-page-${n}`,
          owner: { handle: 'alice', averageStars: null, ratingCount: 0 },
          category: { id: 'cat-eggs', name: 'Fresh Eggs', slug: 'fresh-eggs' },
          title: `Paged item ${n}`,
          description: 'Desc',
          offerType: 'EITHER',
          status: 'ACTIVE',
          photos: [],
          createdAt: '2026-05-01T00:00:00Z',
          updatedAt: '2026-05-01T00:00:00Z',
        });
        if (offset === 0) {
          return HttpResponse.json({ items: [itemForPage(1)], total: 2 });
        }
        return HttpResponse.json({ items: [itemForPage(2)], total: 2 });
      })
    );
    const user = userEvent.setup();
    renderPage();
    await waitFor(() =>
      expect(screen.getByText(/Paged item 1/i)).toBeInTheDocument()
    );
    expect(calls).toBeGreaterThanOrEqual(1);
    await user.click(screen.getByRole('button', { name: /load more/i }));
    await waitFor(() =>
      expect(screen.getByText(/Paged item 2/i)).toBeInTheDocument()
    );
    // Both items now visible together
    expect(screen.getByText(/Paged item 1/i)).toBeInTheDocument();
  });
});
