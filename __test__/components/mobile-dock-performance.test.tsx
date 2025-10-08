import LinkPageProvider from '@/components/link/link-page-provider';
import { LinksMobileDockProvider } from '@/components/link/links-mobile-dock-provider';
import { MobileDock } from '@/components/link/mobile-dock';
import { PagesMobileDockProvider } from '@/components/page/pages-mobile-dock-provider';
import { render, screen } from '@testing-library/react';

// Mock DOM elements
const mockCreateLinkButton = {
  click: jest.fn(),
};

const mockSearchInput = {
  focus: jest.fn(),
};

const mockCreatePageButton = {
  click: jest.fn(),
};

const mockSearchPageInput = {
  focus: jest.fn(),
};

// Mock hooks
jest.mock('@/hooks/use-mobile', () => ({
  useIsMobile: jest.fn(() => true), // Return true to show MobileDock
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}));

describe('MobileDock Performance Testing', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock document.querySelector
    document.querySelector = jest.fn((selector) => {
      if (selector === '[data-create-link-button]') {
        return mockCreateLinkButton;
      }
      if (selector === '[data-search-input]') {
        return mockSearchInput;
      }
      if (selector === '[data-create-page-button]') {
        return mockCreatePageButton;
      }
      if (selector === '[data-search-page-input]') {
        return mockSearchPageInput;
      }
      return null;
    });
  });

  afterEach(() => {
    // Restore mocks
    jest.restoreAllMocks();
  });

  describe('Initial Load Time', () => {
    it('should render MobileDock quickly with LinksMobileDockProvider', () => {
      const startTime = performance.now();

      render(
        <LinkPageProvider>
          <LinksMobileDockProvider>
            <MobileDock
              username="testuser"
              pageLink="http://localhost:3000/testuser"
            />
          </LinksMobileDockProvider>
        </LinkPageProvider>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render in less than 100ms
      expect(renderTime).toBeLessThan(100);

      // Check if MobileDock is rendered
      expect(screen.getByRole('button', { name: /Home/i })).toBeInTheDocument();
    });

    it('should render MobileDock quickly with PagesMobileDockProvider', () => {
      const startTime = performance.now();

      render(
        <LinkPageProvider>
          <PagesMobileDockProvider>
            <MobileDock
              username="testuser"
              pageLink="http://localhost:3000/testuser"
            />
          </PagesMobileDockProvider>
        </LinkPageProvider>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render in less than 100ms
      expect(renderTime).toBeLessThan(100);

      // Check if MobileDock is rendered
      expect(screen.getByRole('button', { name: /Home/i })).toBeInTheDocument();
    });
  });

  describe('Interaction Response Time', () => {
    it('should respond quickly to button clicks', () => {
      render(
        <LinkPageProvider>
          <LinksMobileDockProvider>
            <MobileDock
              username="testuser"
              pageLink="http://localhost:3000/testuser"
            />
          </LinksMobileDockProvider>
        </LinkPageProvider>
      );

      const addButton = screen.getByRole('button', { name: /Add Link/i });

      const startTime = performance.now();
      addButton.click();
      const endTime = performance.now();

      const responseTime = endTime - startTime;

      // Should respond in less than 50ms
      expect(responseTime).toBeLessThan(50);

      // Check if create link button was clicked
      expect(mockCreateLinkButton.click).toHaveBeenCalledTimes(1);
    });

    it('should respond quickly to search button clicks', () => {
      render(
        <LinkPageProvider>
          <PagesMobileDockProvider>
            <MobileDock
              username="testuser"
              pageLink="http://localhost:3000/testuser"
            />
          </PagesMobileDockProvider>
        </LinkPageProvider>
      );

      const searchButton = screen.getByRole('button', { name: /Search Page/i });

      const startTime = performance.now();
      searchButton.click();
      const endTime = performance.now();

      const responseTime = endTime - startTime;

      // Should respond in less than 50ms
      expect(responseTime).toBeLessThan(50);

      // Check if search page input was focused
      expect(mockSearchPageInput.focus).toHaveBeenCalledTimes(1);
    });
  });

  describe('Memory Usage', () => {
    it('should not leak memory when rendering and unrendering', () => {
      const { unmount } = render(
        <LinkPageProvider>
          <LinksMobileDockProvider>
            <MobileDock
              username="testuser"
              pageLink="http://localhost:3000/testuser"
            />
          </LinksMobileDockProvider>
        </LinkPageProvider>
      );

      // Check if MobileDock is rendered
      expect(screen.getByRole('button', { name: /Home/i })).toBeInTheDocument();

      // Unmount component
      unmount();

      // Component should be unmounted without errors
      expect(
        screen.queryByRole('button', { name: /Home/i })
      ).not.toBeInTheDocument();
    });

    it('should clean up event listeners when unmounted', () => {
      const { unmount } = render(
        <LinkPageProvider>
          <PagesMobileDockProvider>
            <MobileDock
              username="testuser"
              pageLink="http://localhost:3000/testuser"
            />
          </PagesMobileDockProvider>
        </LinkPageProvider>
      );

      // Check if MobileDock is rendered
      expect(screen.getByRole('button', { name: /Home/i })).toBeInTheDocument();

      // Unmount component
      unmount();

      // Component should be unmounted without errors
      expect(
        screen.queryByRole('button', { name: /Home/i })
      ).not.toBeInTheDocument();
    });
  });
});
