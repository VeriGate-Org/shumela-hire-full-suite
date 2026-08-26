import React from 'react';
import { render, screen } from '@testing-library/react';
import PageWrapper from '../PageWrapper';
import { PageHeadingProvider, usePageHeading } from '@/contexts/PageHeadingContext';

/**
 * PageWrapper renders a page's heading and its content — and, importantly, nothing else.
 *
 * <p>It used to render ModernLayout, so every page carried its own sidebar, top bar and footer and
 * each navigation rebuilt the lot. The shell now belongs to the app layout. These tests hold that
 * boundary: the props are unchanged, but the chrome must not come back.
 */

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn(), back: jest.fn() }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: { children: React.ReactNode; href: string }) {
    return <a href={href} {...props}>{children}</a>;
  };
});

/** Reports the heading the chrome would show for this page. */
function TitleSpy() {
  const { heading } = usePageHeading();
  return <span data-testid="published-title">{heading ?? '(none)'}</span>;
}

function renderPageWrapper(props: React.ComponentProps<typeof PageWrapper>) {
  return render(
    <PageHeadingProvider>
      <TitleSpy />
      <PageWrapper {...props} />
    </PageHeadingProvider>,
  );
}

describe('PageWrapper', () => {
  it('renders title and subtitle', () => {
    renderPageWrapper({
      title: 'Job Listings',
      subtitle: 'Manage all open positions',
      children: <div>Content</div>,
    });

    expect(screen.getByRole('heading', { name: 'Job Listings' })).toBeInTheDocument();
    expect(screen.getByText('Manage all open positions')).toBeInTheDocument();
  });

  it('renders children content', () => {
    renderPageWrapper({ children: <div data-testid="page-content">Main page content</div> });

    expect(screen.getByTestId('page-content')).toHaveTextContent('Main page content');
  });

  it('renders actions when provided', () => {
    renderPageWrapper({
      title: 'Dashboard',
      actions: <button>Add New</button>,
      children: <div>Content</div>,
    });

    expect(screen.getByRole('button', { name: 'Add New' })).toBeInTheDocument();
  });

  it('renders no heading block at all when there is nothing to put in it', () => {
    const { container } = renderPageWrapper({ children: <div>Content</div> });

    expect(container.querySelector('section')).toBeNull();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('does not render the application chrome — that belongs to the layout', () => {
    const { container } = renderPageWrapper({
      title: 'Interviews',
      subtitle: 'Upcoming interview schedule',
      children: <div>Interview list</div>,
    });

    // A page rendering its own sidebar is what made every navigation rebuild the shell.
    expect(container.querySelector('aside')).toBeNull();
    expect(container.querySelector('header')).toBeNull();
    expect(container.querySelector('footer')).toBeNull();
    expect(container.querySelector('main')).toBeNull();
  });

  it('publishes its title upward for the breadcrumb', () => {
    renderPageWrapper({ title: 'Interviews', children: <div>Interview list</div> });

    expect(screen.getByTestId('published-title')).toHaveTextContent('Interviews');
  });

  it('publishes nothing when the page has no title', () => {
    renderPageWrapper({ children: <div>Content</div> });

    expect(screen.getByTestId('published-title')).toHaveTextContent('(none)');
  });

  it("a page's own title outranks a nested band's section label", () => {
    // The dashboard passes "Administrator Dashboard" and nests a band whose eyebrow is "System".
    // React runs child effects before the parent's, so with one slot the nested band won and the
    // page's own title never reached the breadcrumb.
    function BandLike({ eyebrow }: { eyebrow: string }) {
      const { setSectionLabel, clearSectionLabel } = usePageHeading();
      React.useEffect(() => {
        setSectionLabel(eyebrow);
        return () => clearSectionLabel(eyebrow);
      }, [eyebrow, setSectionLabel, clearSectionLabel]);
      return null;
    }

    render(
      <PageHeadingProvider>
        <TitleSpy />
        <PageWrapper title="Administrator Dashboard">
          <BandLike eyebrow="System" />
        </PageWrapper>
      </PageHeadingProvider>,
    );

    expect(screen.getByTestId('published-title')).toHaveTextContent('Administrator Dashboard');
  });

  it('falls back to the section label when the page states no title', () => {
    function BandLike({ eyebrow }: { eyebrow: string }) {
      const { setSectionLabel, clearSectionLabel } = usePageHeading();
      React.useEffect(() => {
        setSectionLabel(eyebrow);
        return () => clearSectionLabel(eyebrow);
      }, [eyebrow, setSectionLabel, clearSectionLabel]);
      return null;
    }

    render(
      <PageHeadingProvider>
        <TitleSpy />
        <PageWrapper>
          <BandLike eyebrow="Hiring pipeline" />
        </PageWrapper>
      </PageHeadingProvider>,
    );

    expect(screen.getByTestId('published-title')).toHaveTextContent('Hiring pipeline');
  });

  it('clears the published title when the page goes away', () => {
    const { unmount } = render(
      <PageHeadingProvider>
        <TitleSpy />
        <PageWrapper title="Interviews">
          <div>Interview list</div>
        </PageWrapper>
      </PageHeadingProvider>,
    );
    expect(screen.getByTestId('published-title')).toHaveTextContent('Interviews');

    // Without this, a page with no title of its own would inherit the previous page's breadcrumb.
    unmount();
    render(
      <PageHeadingProvider>
        <TitleSpy />
        <PageWrapper>
          <div>Other content</div>
        </PageWrapper>
      </PageHeadingProvider>,
    );
    expect(screen.getByTestId('published-title')).toHaveTextContent('(none)');
  });
});
