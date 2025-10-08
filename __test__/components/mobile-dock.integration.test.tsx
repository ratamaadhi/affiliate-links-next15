import LinkPageProvider from '@/components/link/link-page-provider';
import { LinksMobileDockProvider } from '@/components/link/links-mobile-dock-provider';
import { MobileDock } from '@/components/link/mobile-dock';
import { PagesMobileDockProvider } from '@/components/page/pages-mobile-dock-provider';
import { fireEvent, render, screen } from '@testing-library/react';

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

describe('MobileDock Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore mocks
    jest.restoreAllMocks();
  });

  describe('with LinksMobileDockProvider', () => {
    beforeEach(() => {
      // Mock document.querySelector
      document.querySelector = jest.fn((selector) => {
        if (selector === '[data-create-link-button]') {
          return mockCreateLinkButton;
        }
        if (selector === '[data-search-input]') {
          return mockSearchInput;
        }
        return null;
      });
    });

    it('should work with LinksMobileDockProvider', () => {
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

      // Check if MobileDock is rendered
      expect(screen.getByRole('button', { name: /Home/i })).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Add Link/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Search Link/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Preview/i })
      ).toBeInTheDocument();
    });

    it('should trigger create link button when add button is clicked', () => {
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

      // Click the add button
      const addButton = screen.getByRole('button', { name: /Add Link/i });
      fireEvent.click(addButton);

      // Check if create link button was clicked
      expect(mockCreateLinkButton.click).toHaveBeenCalledTimes(1);
    });

    it('should focus search input when search button is clicked', () => {
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

      // Click the search button
      const searchButton = screen.getByRole('button', { name: /Search Link/i });
      fireEvent.click(searchButton);

      // Check if search input was focused
      expect(mockSearchInput.focus).toHaveBeenCalledTimes(1);
    });
  });

  describe('with PagesMobileDockProvider', () => {
    beforeEach(() => {
      // Mock document.querySelector
      document.querySelector = jest.fn((selector) => {
        if (selector === '[data-create-page-button]') {
          return mockCreatePageButton;
        }
        if (selector === '[data-search-page-input]') {
          return mockSearchPageInput;
        }
        return null;
      });
    });

    it('should work with PagesMobileDockProvider', () => {
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

      // Check if MobileDock is rendered
      expect(screen.getByRole('button', { name: /Home/i })).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Add Page/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Search Page/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Preview/i })
      ).toBeInTheDocument();
    });

    it('should trigger create page button when add button is clicked', () => {
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

      // Click the add button
      const addButton = screen.getByRole('button', { name: /Add Page/i });
      fireEvent.click(addButton);

      // Check if create page button was clicked
      expect(mockCreatePageButton.click).toHaveBeenCalledTimes(1);
    });

    it('should focus search page input when search button is clicked', () => {
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

      // Click the search button
      const searchButton = screen.getByRole('button', { name: /Search Page/i });
      fireEvent.click(searchButton);

      // Check if search page input was focused
      expect(mockSearchPageInput.focus).toHaveBeenCalledTimes(1);
    });
  });
});
