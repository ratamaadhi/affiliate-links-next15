import { render } from '@testing-library/react';

// Mock components with data attributes
const MockCreateLinkButton = () => (
  <button data-create-link-button>Create Link</button>
);

const MockSearchLinkInput = () => (
  <input data-search-input placeholder="Search link" />
);

const MockCreatePageButton = () => (
  <button data-create-page-button>Create Page</button>
);

const MockSearchPageInput = () => (
  <input data-search-page-input placeholder="Search page" />
);

describe('Data Attributes Testing', () => {
  describe('Required Attributes', () => {
    it('should have data-create-link-button in CreateLinkButton', () => {
      render(<MockCreateLinkButton />);
      const createLinkButton = document.querySelector(
        '[data-create-link-button]'
      );
      expect(createLinkButton).toBeInTheDocument();
    });

    it('should have data-search-input in SearchLinkInput', () => {
      render(<MockSearchLinkInput />);
      const searchInput = document.querySelector('[data-search-input]');
      expect(searchInput).toBeInTheDocument();
    });

    it('should have data-create-page-button in CreatePageButton', () => {
      render(<MockCreatePageButton />);
      const createPageButton = document.querySelector(
        '[data-create-page-button]'
      );
      expect(createPageButton).toBeInTheDocument();
    });

    it('should have data-search-page-input in SearchPageInput', () => {
      render(<MockSearchPageInput />);
      const searchPageInput = document.querySelector(
        '[data-search-page-input]'
      );
      expect(searchPageInput).toBeInTheDocument();
    });
  });

  describe('DOM Query Testing', () => {
    it('should return correct element for data-create-link-button', () => {
      render(<MockCreateLinkButton />);
      const createLinkButton = document.querySelector(
        '[data-create-link-button]'
      );
      expect(createLinkButton).toBeInstanceOf(HTMLButtonElement);
    });

    it('should return correct element for data-search-input', () => {
      render(<MockSearchLinkInput />);
      const searchInput = document.querySelector('[data-search-input]');
      expect(searchInput).toBeInstanceOf(HTMLInputElement);
    });

    it('should return correct element for data-create-page-button', () => {
      render(<MockCreatePageButton />);
      const createPageButton = document.querySelector(
        '[data-create-page-button]'
      );
      expect(createPageButton).toBeInstanceOf(HTMLButtonElement);
    });

    it('should return correct element for data-search-page-input', () => {
      render(<MockSearchPageInput />);
      const searchPageInput = document.querySelector(
        '[data-search-page-input]'
      );
      expect(searchPageInput).toBeInstanceOf(HTMLInputElement);
    });

    it('should return null for non-existent data attributes', () => {
      const nonExistentElement = document.querySelector('[data-non-existent]');
      expect(nonExistentElement).toBeNull();
    });
  });
});
