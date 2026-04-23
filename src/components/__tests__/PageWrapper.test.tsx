import React from 'react';
import { render, screen } from '@testing-library/react';
import PageWrapper from '../PageWrapper';

// Mock aws-amplify/auth
jest.mock('aws-amplify/auth', () => ({
  signIn: jest.fn(),
  signOut: jest.fn(),
  fetchAuthSession: jest.fn(),
  getCurrentUser: jest.fn(),
  fetchUserAttributes: jest.fn(),
}));

// Mock aws-amplify
jest.mock('aws-amplify', () => ({
  Amplify: {
    configure: jest.fn(),
  },
}));

// Mock amplify-config
jest.mock('@/lib/amplify-config', () => ({
  isCognitoConfigured: false,
  configureAmplify: jest.fn(),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next/link
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: { children: React.ReactNode; href: string }) {
    return <a href={href} {...props}>{children}</a>;
  };
});

// Mock the ModernLayout component to isolate PageWrapper testing
jest.mock('@/components/ModernLayout', () => {
  return function MockModernLayout({
    children,
    title,
    subtitle,
    actions,
  }: {
    children: React.ReactNode;
    title?: string;
    subtitle?: string;
    actions?: React.ReactNode;
  }) {
    return (
      <div data-testid="modern-layout">
        {title && <h1 data-testid="layout-title">{title}</h1>}
        {subtitle && <p data-testid="layout-subtitle">{subtitle}</p>}
        {actions && <div data-testid="layout-actions">{actions}</div>}
        <div data-testid="layout-children">{children}</div>
      </div>
    );
  };
});

function renderPageWrapper(props: React.ComponentProps<typeof PageWrapper>) {
  return render(
    <PageWrapper {...props} />
  );
}

describe('PageWrapper', () => {
  it('renders title and subtitle', async () => {
    renderPageWrapper({
      title: 'Job Listings',
      subtitle: 'Manage all open positions',
      children: <div>Content</div>,
    });

    expect(await screen.findByTestId('layout-title')).toHaveTextContent('Job Listings');
    expect(screen.getByTestId('layout-subtitle')).toHaveTextContent('Manage all open positions');
  });

  it('renders children content', async () => {
    renderPageWrapper({
      children: <div data-testid="page-content">Main page content</div>,
    });

    const children = await screen.findByTestId('layout-children');
    expect(children).toBeInTheDocument();
    expect(screen.getByTestId('page-content')).toHaveTextContent('Main page content');
  });

  it('renders actions when provided', async () => {
    renderPageWrapper({
      title: 'Dashboard',
      actions: <button>Add New</button>,
      children: <div>Content</div>,
    });

    const actionsContainer = await screen.findByTestId('layout-actions');
    expect(actionsContainer).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add New' })).toBeInTheDocument();
  });

  it('does not render actions container when no actions are provided', async () => {
    renderPageWrapper({
      title: 'Reports',
      children: <div>Report content</div>,
    });

    await screen.findByTestId('layout-title');
    expect(screen.queryByTestId('layout-actions')).not.toBeInTheDocument();
  });

  it('does not render title or subtitle when none provided', async () => {
    renderPageWrapper({
      children: <div>Content</div>,
    });

    await screen.findByTestId('layout-children');
    expect(screen.queryByTestId('layout-title')).not.toBeInTheDocument();
    expect(screen.queryByTestId('layout-subtitle')).not.toBeInTheDocument();
  });

  it('passes ModernLayout the correct props structure', async () => {
    renderPageWrapper({
      title: 'Interviews',
      subtitle: 'Upcoming interview schedule',
      actions: <span>Filter button</span>,
      children: <div>Interview list</div>,
    });

    const layout = await screen.findByTestId('modern-layout');
    expect(layout).toBeInTheDocument();
    expect(screen.getByTestId('layout-title')).toHaveTextContent('Interviews');
    expect(screen.getByTestId('layout-subtitle')).toHaveTextContent('Upcoming interview schedule');
    expect(screen.getByText('Filter button')).toBeInTheDocument();
    expect(screen.getByText('Interview list')).toBeInTheDocument();
  });
});
