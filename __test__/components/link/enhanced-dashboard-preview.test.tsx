import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { EnhancedDashboardPreview } from '@/components/link/enhanced-dashboard-preview';
import { LinkPageContext } from '@/context/link-page-context';

// Mock the LinkPageContext
const mockContext = {
  selectedPage: {
    id: '1',
    slug: 'test-page',
    title: 'Test Page',
    description: 'Test Description',
  },
};

describe('EnhancedDashboardPreview', () => {
  beforeEach(() => {
    // Mock iframe
    Object.defineProperty(HTMLIFrameElement.prototype, 'contentWindow', {
      value: {
        postMessage: jest.fn(),
      },
      writable: true,
    });
  });

  it('renders loading state initially', () => {
    render(
      <LinkPageContext.Provider value={mockContext}>
        <EnhancedDashboardPreview
          pageLink="http://localhost:3000/testuser"
          username="testuser"
        />
      </LinkPageContext.Provider>
    );

    expect(screen.getByTestId('skeleton-loader')).toBeInTheDocument();
  });

  it('shows no page selected message when no pageLink or username', () => {
    render(
      <LinkPageContext.Provider value={mockContext}>
        <EnhancedDashboardPreview pageLink="" username="" />
      </LinkPageContext.Provider>
    );

    expect(screen.getByText('No Page Selected or Found')).toBeInTheDocument();
  });

  it('renders iframe with correct attributes when not loading', () => {
    // Mock useState to simulate loaded state
    const mockUseState = jest.spyOn(React, 'useState');
    mockUseState.mockReturnValueOnce([false, jest.fn()]); // isLoading = false
    mockUseState.mockReturnValueOnce([false, jest.fn()]); // hasError = false
    mockUseState.mockReturnValueOnce([0, jest.fn()]); // retryCount = 0

    render(
      <LinkPageContext.Provider value={mockContext}>
        <EnhancedDashboardPreview
          pageLink="http://localhost:3000/testuser"
          username="testuser"
        />
      </LinkPageContext.Provider>
    );

    const iframe = screen.getByTitle('preview');
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute(
      'src',
      'http://localhost:3000/testuser/test-page'
    );
    expect(iframe).toHaveAttribute(
      'sandbox',
      'allow-same-origin allow-scripts'
    );
    expect(iframe).toHaveAttribute('loading', 'eager');

    mockUseState.mockRestore();
  });

  it('renders error state when hasError is true', () => {
    // Mock useState to simulate error state
    const mockUseState = jest.spyOn(React, 'useState');
    mockUseState.mockReturnValueOnce([false, jest.fn()]); // isLoading = false
    mockUseState.mockReturnValueOnce([true, jest.fn()]); // hasError = true
    mockUseState.mockReturnValueOnce([0, jest.fn()]); // retryCount = 0

    render(
      <LinkPageContext.Provider value={mockContext}>
        <EnhancedDashboardPreview
          pageLink="https://example.com"
          username="testuser"
        />
      </LinkPageContext.Provider>
    );

    expect(screen.getByText('Preview Failed to Load')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();

    mockUseState.mockRestore();
  });

  it('handles null selectedPage state correctly', () => {
    const nullContext = {
      selectedPage: null,
      keywordLink: '',
    };

    render(
      <LinkPageContext.Provider value={nullContext}>
        <EnhancedDashboardPreview
          pageLink="https://example.com"
          username="testuser"
        />
      </LinkPageContext.Provider>
    );

    // Should render iframe without crashing
    const iframe = screen.getByTitle('preview');
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute('src', 'https://example.com');
  });
});
