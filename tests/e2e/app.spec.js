import { test, expect } from '@playwright/test';

test.describe('EcoVisual Carbon Footprint App', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the local server
    await page.goto('/');
  });

  test('should load the home page and show the hero title', async ({ page }) => {
    // Check title in document
    await expect(page).toHaveTitle(/EcoVisual/);
    
    // Check main title visibility
    const mainTitle = page.locator('.hero-title');
    await expect(mainTitle).toBeVisible();
  });

  test('should calculate emissions dynamically when sliders are changed', async ({ page }) => {
    // Check initial emissions value (default sliders calculation is 20.7 kg/day)
    const emissionsResult = page.locator('#result-co2');
    await expect(emissionsResult).toHaveText('20.7');

    // Drag the car slider to 300 miles (initial value is 100)
    const carSlider = page.locator('#slider-car');
    await carSlider.fill('300');
    
    // Check that emissions result has updated to a higher value
    await expect(async () => {
      const val = parseFloat(await emissionsResult.innerText());
      expect(val).toBeGreaterThan(20.7);
    }).toPass();
  });

  test('should open, search, filter and read from the Climate Reads library', async ({ page }) => {
    const libraryOverlay = page.locator('#articles-library');
    const footerLibraryBtn = page.locator('#footer-library-link');
    
    // Expect library is hidden initially
    await expect(libraryOverlay).not.toHaveClass(/open/);

    // Scroll down and click the footer library link to open the overlay
    await footerLibraryBtn.scrollIntoViewIfNeeded();
    await footerLibraryBtn.click();
    await expect(libraryOverlay).toHaveClass(/open/);

    // Filter by Science
    const scienceBtn = page.locator('.library-filter-btn[data-filter="science"]');
    await scienceBtn.click();
    await expect(scienceBtn).toHaveClass(/active/);

    // All visible cards should contain the SCIENCE tag
    const visibleCardTags = page.locator('#library-grid .library-card .lib-card-tag');
    const firstTagText = await visibleCardTags.first().innerText();
    expect(firstTagText.toUpperCase()).toContain('SCIENCE');

    // Search for 'electrification'
    const searchInput = page.locator('#library-search-input');
    await searchInput.fill('electrification');

    // Check that at least one card is shown and click it to open article
    const firstCard = page.locator('#library-grid .library-card').first();
    await expect(firstCard).toBeVisible();
    await firstCard.click();

    // Verify modal is open and has markdown content loaded
    const modal = page.locator('#article-modal');
    await expect(modal).toHaveClass(/open/);
    
    // Wait for the modal body header to contain the article title
    await expect(page.locator('#modal-body h1')).toHaveText(/The Future Grid: Why Electrification Is the Real Answer/);

    // Close the article modal
    await page.locator('#modal-close').click();
    await expect(modal).not.toHaveClass(/open/);

    // Close the library
    await page.locator('#library-close').click();
    await expect(libraryOverlay).not.toHaveClass(/open/);
  });
});
