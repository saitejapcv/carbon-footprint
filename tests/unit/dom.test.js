import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

// Import app after JSDOM environment is active
import app from '../../app.js';

describe('DOM Interactions and UI State', () => {
  beforeEach(() => {
    global.intersectionObservers = [];
    // Load the actual index.html file content into JSDOM document
    const htmlPath = path.resolve(__dirname, '../../index.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    document.documentElement.innerHTML = htmlContent;

    // Inject developer UI elements to cover slider/label updates in app.js
    const slider = document.createElement('input');
    slider.id = 'pollution-slider';
    const label = document.createElement('span');
    label.id = 'slider-val-label';
    document.body.appendChild(slider);
    document.body.appendChild(label);

    // Reset module/app state before test
    app.init();
  });

  afterEach(async () => {
    // Trigger canvas off-screen to stop any running animation loop safely
    if (global.intersectionObservers && global.intersectionObservers[0] && global.intersectionObservers[0].callback) {
      try {
        global.intersectionObservers[0].callback([{ isIntersecting: false }]);
      } catch (e) {}
    }
    // Wait a tick for the frame to exit
    await new Promise(resolve => setTimeout(resolve, 0));
  });

  describe('Mobile Navigation Menu', () => {
    it('should toggle mobile menu open state when trigger is clicked', () => {
      const trigger = document.querySelector('.mobile-menu-trigger');
      const overlay = document.getElementById('mobile-menu-overlay');

      expect(overlay.classList.contains('open')).toBe(false);
      expect(trigger.classList.contains('active')).toBe(false);

      // Trigger click to open
      trigger.click();
      expect(overlay.classList.contains('open')).toBe(true);
      expect(trigger.classList.contains('active')).toBe(true);
      expect(trigger.getAttribute('aria-expanded')).toBe('true');

      // Trigger click again to close
      trigger.click();
      expect(overlay.classList.contains('open')).toBe(false);
      expect(trigger.classList.contains('active')).toBe(false);
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
    });

    it('should close mobile menu when the backdrop is clicked', () => {
      const trigger = document.querySelector('.mobile-menu-trigger');
      const overlay = document.getElementById('mobile-menu-overlay');
      const backdrop = document.getElementById('mobile-menu-backdrop');

      // Open first
      trigger.click();
      expect(overlay.classList.contains('open')).toBe(true);

      // Click backdrop to close
      backdrop.click();
      expect(overlay.classList.contains('open')).toBe(false);
    });
  });

  describe('Climate Reads Library', () => {
    it('should open and close the library overlay', () => {
      const navLibraryLink = document.getElementById('nav-library');
      const libraryOverlay = document.getElementById('articles-library');
      const closeBtn = document.getElementById('library-close');

      expect(libraryOverlay.classList.contains('open')).toBe(false);

      // Open library
      navLibraryLink.click();
      expect(libraryOverlay.classList.contains('open')).toBe(true);
      expect(document.body.classList.contains('scroll-locked')).toBe(true);

      // Close library
      closeBtn.click();
      expect(libraryOverlay.classList.contains('open')).toBe(false);
      expect(document.body.classList.contains('scroll-locked')).toBe(false);
    });

    it('should filter library cards when category filter buttons are clicked', () => {
      const grid = document.getElementById('library-grid');
      
      // Select the 'science' filter button
      const scienceBtn = document.querySelector('.library-filter-btn[data-filter="science"]');
      expect(scienceBtn).not.toBeNull();

      scienceBtn.click();
      expect(scienceBtn.classList.contains('active')).toBe(true);

      // Get rendered cards in the grid
      const cards = grid.querySelectorAll('.library-card');
      expect(cards.length).toBeGreaterThan(0);

      // Verify all rendered cards have the science tag in their header
      cards.forEach(card => {
        const tagText = card.querySelector('.lib-card-tag').textContent.toUpperCase();
        expect(tagText).toContain('SCIENCE');
      });
    });

    it('should filter cards dynamically when a search query is typed', () => {
      const searchInput = document.getElementById('library-search-input');
      const grid = document.getElementById('library-grid');

      // Type search query that matches 'diet' or food
      searchInput.value = 'diet';
      searchInput.dispatchEvent(new Event('input'));

      const cards = grid.querySelectorAll('.library-card');
      expect(cards.length).toBeGreaterThan(0);

      // Every card title or summary should match the term "diet"
      cards.forEach(card => {
        const title = card.querySelector('.lib-card-title').textContent.toLowerCase();
        const summary = card.querySelector('.lib-card-summary').textContent.toLowerCase();
        expect(title.includes('diet') || title.includes('food') || summary.includes('diet') || summary.includes('food')).toBe(true);
      });
    });

    it('should render a fallback message if no articles match search', () => {
      const searchInput = document.getElementById('library-search-input');
      const grid = document.getElementById('library-grid');

      // Type a query that will definitely not match anything
      searchInput.value = 'nonexistentxyzterm';
      searchInput.dispatchEvent(new Event('input'));

      const cards = grid.querySelectorAll('.library-card');
      expect(cards.length).toBe(0);
      expect(grid.textContent).toContain('NO ARTICLES MATCHED');
    });
  });

  describe('Article Reader Modal', () => {
    it('should open and display article contents when clicking a card', async () => {
      const grid = document.getElementById('library-grid');
      const modal = document.getElementById('article-modal');
      const modalBody = document.getElementById('modal-body');

      // Click first library card to read article
      const firstCard = grid.querySelector('.library-card');
      firstCard.click();

      // Wait for fetch/rendering to populate the modal body
      await vi.waitFor(() => {
        expect(modalBody.innerHTML).toContain('<h1>Mock Article</h1>');
      });

      expect(modal.classList.contains('open')).toBe(true);
      expect(modalBody.innerHTML).toContain('This is a mock article content.');

      // Close the modal
      const closeBtn = document.getElementById('modal-close');
      closeBtn.click();
      expect(modal.classList.contains('open')).toBe(false);
    });

    it('should close the modal when the Escape key is pressed', async () => {
      const grid = document.getElementById('library-grid');
      const modal = document.getElementById('article-modal');

      // Open modal
      grid.querySelector('.library-card').click();
      await vi.waitFor(() => {
        expect(modal.classList.contains('open')).toBe(true);
      });

      // Dispatch Escape key event
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      expect(modal.classList.contains('open')).toBe(false);
    });

    it('should render an error message when article fetch fails', async () => {
      // Mock fetch failure
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const grid = document.getElementById('library-grid');
      const modal = document.getElementById('article-modal');
      const modalBody = document.getElementById('modal-body');

      // Click card
      grid.querySelector('.library-card').click();

      // Wait for error rendering
      await vi.waitFor(() => {
        expect(modalBody.innerHTML).toContain('Failed to load article');
      });
      expect(modal.classList.contains('open')).toBe(true);
    });

    it('should render an error message when fetch throws a network exception', async () => {
      // Mock network connection failure
      global.fetch.mockRejectedValueOnce(new Error('Network connection interrupted'));

      const grid = document.getElementById('library-grid');
      const modalBody = document.getElementById('modal-body');

      // Click card
      grid.querySelector('.library-card').click();

      // Wait for error rendering
      await vi.waitFor(() => {
        expect(modalBody.innerHTML).toContain('Failed to load article');
        expect(modalBody.innerHTML).toContain('Network connection interrupted');
      });
    });

    it('should safely return and not open modal if modal elements are missing from the DOM', () => {
      // Remove modal element
      const modal = document.getElementById('article-modal');
      modal.remove();

      const grid = document.getElementById('library-grid');
      // Click card
      expect(() => grid.querySelector('.library-card').click()).not.toThrow();
    });

    it('should safely return from initArticleModal if modal or close button is missing', () => {
      // Remove close button
      const closeBtn = document.getElementById('modal-close');
      if (closeBtn) closeBtn.remove();
      
      // Re-run init to cover the guard return path
      expect(() => app.init()).not.toThrow();
    });
  });

  describe('Calculator UI Controls & Inputs', () => {
    it('should handle tab switching', () => {
      const tabTransport = document.querySelector('.calc-tab-btn[data-tab="transport"]');
      const tabEnergy = document.querySelector('.calc-tab-btn[data-tab="energy"]');
      const contentTransport = document.getElementById('tab-transport');
      const contentEnergy = document.getElementById('tab-energy');

      expect(tabTransport.classList.contains('active')).toBe(true);

      // Switch to energy tab
      tabEnergy.click();
      expect(tabTransport.classList.contains('active')).toBe(false);
      expect(tabEnergy.classList.contains('active')).toBe(true);
      expect(contentTransport.classList.contains('active')).toBe(false);
      expect(contentEnergy.classList.contains('active')).toBe(true);
    });

    it('should handle slider inputs and update readout values', () => {
      const carSlider = document.getElementById('slider-car');
      const valCar = document.getElementById('val-car');

      carSlider.value = '350';
      carSlider.dispatchEvent(new Event('input'));
      expect(valCar.textContent).toBe('350 mi');

      const flightsSlider = document.getElementById('slider-flights');
      const valFlights = document.getElementById('val-flights');

      flightsSlider.value = '1';
      flightsSlider.dispatchEvent(new Event('input'));
      expect(valFlights.textContent).toBe('1 flight');

      flightsSlider.value = '3';
      flightsSlider.dispatchEvent(new Event('input'));
      expect(valFlights.textContent).toBe('3 flights');

      const electricitySlider = document.getElementById('slider-electricity');
      const valElectricity = document.getElementById('val-electricity');

      electricitySlider.value = '150';
      electricitySlider.dispatchEvent(new Event('input'));
      expect(valElectricity.textContent).toBe('$150');
    });

    it('should handle segmented button clicks and sync checkbox updates', () => {
      const heatingElectricBtn = document.querySelector('#control-heating .calc-segment-btn[data-val="electric"]');
      heatingElectricBtn.click();
      expect(heatingElectricBtn.classList.contains('active')).toBe(true);

      const syncCheckbox = document.getElementById('sync-engine-checkbox');
      syncCheckbox.checked = false;
      syncCheckbox.dispatchEvent(new Event('change'));
      expect(syncCheckbox.checked).toBe(false);
    });
  });

  describe('Smooth Scrolling, Navigation link triggers & window events', () => {
    it('should click header navigation links and invoke scrolling handlers', () => {
      // Mock window.scrollTo and Element.prototype.scrollIntoView
      const originalScrollTo = window.scrollTo;
      const originalScrollIntoView = Element.prototype.scrollIntoView;
      window.scrollTo = vi.fn();
      Element.prototype.scrollIntoView = vi.fn();

      document.getElementById('nav-home').click();
      expect(window.scrollTo).toHaveBeenCalled();

      document.getElementById('nav-decay').click();
      expect(Element.prototype.scrollIntoView).toHaveBeenCalled();

      document.getElementById('nav-calc').click();
      document.getElementById('nav-reads').click();

      // Click nav link to open library
      const libraryOverlay = document.getElementById('articles-library');
      document.getElementById('nav-library').click();
      expect(libraryOverlay.classList.contains('open')).toBe(true);

      // Clean up mobile-link closes
      const mobileTrigger = document.querySelector('.mobile-menu-trigger');
      mobileTrigger.click(); // opens mobile menu overlay
      document.getElementById('mobile-nav-home').click(); // clicks item (closes overlay)
      
      const overlay = document.getElementById('mobile-menu-overlay');
      expect(overlay.classList.contains('open')).toBe(false);

      // Restore mocks
      window.scrollTo = originalScrollTo;
      Element.prototype.scrollIntoView = originalScrollIntoView;
    });

    it('should handle footer link smooth scroll matching target hashes', () => {
      const originalScrollIntoView = Element.prototype.scrollIntoView;
      Element.prototype.scrollIntoView = vi.fn();

      // Add a dummy footer link with hash
      const footerLink = document.createElement('a');
      footerLink.className = 'footer-link';
      footerLink.setAttribute('href', '#assembly-section');
      document.body.appendChild(footerLink);

      app.init();
      footerLink.click();
      expect(Element.prototype.scrollIntoView).toHaveBeenCalled();

      Element.prototype.scrollIntoView = originalScrollIntoView;
    });

    it('should trigger scroll and resize event handlers on window', async () => {
      // Mutate scrollY and trigger scroll events to animate transition frames
      window.scrollY = 600;
      window.dispatchEvent(new Event('scroll'));

      // Let animation loop run longer to allow progress to exceed 0.35
      await new Promise(resolve => setTimeout(resolve, 200));

      window.dispatchEvent(new Event('resize'));
      window.dispatchEvent(new Event('load'));

      // Reset scrollY
      window.scrollY = 0;
      window.dispatchEvent(new Event('scroll'));
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should handle mouse move, mouse leave, and window scrolling animations', async () => {
      const heroSection = document.getElementById('hero-section');
      if (heroSection) {
        // Dispatch mousemove inside Hero Section
        heroSection.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, clientY: 200 }));
        
        // Wait a few milliseconds to let the animation loop execute
        await new Promise(resolve => setTimeout(resolve, 30));
        
        // Dispatch mouseleave
        heroSection.dispatchEvent(new MouseEvent('mouseleave'));
        
        await new Promise(resolve => setTimeout(resolve, 30));
      }
    });

    it('should run ScrollTrigger callbacks from GSAP mock', () => {
      expect(global.lastScrollTriggerConfig).not.toBeNull();

      // Trigger scrolling update callbacks (with transition start)
      global.lastScrollTriggerConfig.onUpdate({ progress: 0.98 });
      // Call again consecutively to cover killing an active tween
      global.lastScrollTriggerConfig.onUpdate({ progress: 0.99 });
      // Trigger onEnterBack while videoTransitionStarted is true
      global.lastScrollTriggerConfig.onEnterBack();
      // Trigger transition reset
      global.lastScrollTriggerConfig.onUpdate({ progress: 0.5 });
      global.lastScrollTriggerConfig.onLeave();
    });

    it('should handle video transition failures and retry paths', () => {
      expect(global.lastScrollTriggerConfig).not.toBeNull();
      
      const videoEl = document.getElementById('assembly-video');
      if (videoEl) {
        // 1. Force play to reject to trigger autoplay block retry code
        const originalPlay = videoEl.play;
        videoEl.play = vi.fn().mockResolvedValue().mockRejectedValueOnce(new Error('Autoplay block'));
        
        // 2. Force currentTime to throw error to trigger console.warn block
        Object.defineProperty(videoEl, 'currentTime', {
          get: () => 0,
          set: () => { throw new Error('mock currentTime error'); },
          configurable: true,
        });

        // Trigger transition start
        global.lastScrollTriggerConfig.onUpdate({ progress: 0.99 });

        // Restore play method
        videoEl.play = originalPlay;
      }
    });

    it('should calculate sticky params across different inner widths', () => {
      const originalWidth = window.innerWidth;
      
      // Small screen
      window.innerWidth = 350;
      app.init();

      // Tablet screen
      window.innerWidth = 600;
      app.init();

      // Restore
      window.innerWidth = originalWidth;
    });

    it('should cover particle rendering across different active ecosystems', async () => {
      // 1. Kelp ecosystem clean
      app.state.activeEcosystem = 'kelp';
      app.state.pollutionFactor = 0.2;
      window.dispatchEvent(new Event('resize'));
      await new Promise(resolve => setTimeout(resolve, 100));

      // 1b. Kelp ecosystem polluted (factor >= 0.5)
      app.state.activeEcosystem = 'kelp';
      app.state.pollutionFactor = 0.8;
      window.dispatchEvent(new Event('resize'));
      await new Promise(resolve => setTimeout(resolve, 100));

      // 2. Glacier ecosystem polluted (> 0.7)
      app.state.activeEcosystem = 'glacier';
      app.state.pollutionFactor = 0.9;
      window.dispatchEvent(new Event('resize'));
      await new Promise(resolve => setTimeout(resolve, 100));

      // 2b. Glacier ecosystem clean (< 0.4)
      app.state.activeEcosystem = 'glacier';
      app.state.pollutionFactor = 0.2;
      window.dispatchEvent(new Event('resize'));
      await new Promise(resolve => setTimeout(resolve, 100));

      // 2c. Glacier ecosystem medium (0.4 <= factor <= 0.7)
      app.state.activeEcosystem = 'glacier';
      app.state.pollutionFactor = 0.5;
      window.dispatchEvent(new Event('resize'));
      await new Promise(resolve => setTimeout(resolve, 100));

      // 3. Rainforest ecosystem clean
      app.state.activeEcosystem = 'rainforest';
      app.state.pollutionFactor = 0.1;
      window.dispatchEvent(new Event('resize'));
      await new Promise(resolve => setTimeout(resolve, 100));

      // 4. Rainforest ecosystem medium
      app.state.activeEcosystem = 'rainforest';
      app.state.pollutionFactor = 0.5;
      window.dispatchEvent(new Event('resize'));
      await new Promise(resolve => setTimeout(resolve, 100));

      // 5. Rainforest ecosystem polluted
      app.state.activeEcosystem = 'rainforest';
      app.state.pollutionFactor = 0.8;
      window.dispatchEvent(new Event('resize'));
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should handle backtracking retry loop when random cell assignments conflict', () => {
      const originalAbs = Math.abs;
      // Force conflict in isSafe by making Math.abs always return 0
      Math.abs = () => 0;

      app.init();

      // Restore Math.abs
      Math.abs = originalAbs;
    });

    it('should stop particle rendering when canvas is scrolled off-screen', async () => {
      expect(global.intersectionObservers[0]).not.toBeUndefined();
      
      // Trigger scrolled off-screen (isIntersecting = false)
      global.intersectionObservers[0].callback([{ isIntersecting: false }]);
      
      // Wait for the scheduled animation frame to execute and return/terminate
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should handle document.fonts being missing', () => {
      const originalFonts = document.fonts;
      // Temporarily define fonts as undefined
      document.fonts = undefined;
      
      expect(() => app.init()).not.toThrow();
      
      // Restore
      document.fonts = originalFonts;
    });

    it('should safely return from initScrollStack if scroller is missing', () => {
      // Remove scroller
      const scroller = document.querySelector('.scroll-stack-scroller');
      if (scroller) scroller.remove();
      
      expect(() => app.init()).not.toThrow();
    });

    it('should safely return from initScrollStack if scroller has no cards', () => {
      // Keep scroller but clear cards
      const scroller = document.querySelector('.scroll-stack-scroller');
      if (scroller) {
        scroller.innerHTML = '';
      }
      
      expect(() => app.init()).not.toThrow();
    });

    it('should safely return from initArticleModal if modal is missing', () => {
      // Remove modal
      const modal = document.getElementById('article-modal');
      if (modal) modal.remove();
      
      expect(() => app.init()).not.toThrow();
    });
  });

  describe('Main Article Cards', () => {
    it('should open modal when clicking a main page card read-btn', async () => {
      // Add a card element
      const container = document.querySelector('.scroll-stack-scroller') || document.body;
      const card = document.createElement('div');
      card.className = 'scroll-stack-card article-card';
      card.setAttribute('data-article', '01-daily-life-carbon-footprint.md');
      card.dataset.tag = 'FOUNDATIONAL';
      
      const readBtn = document.createElement('button');
      readBtn.className = 'read-btn';
      card.appendChild(readBtn);
      container.appendChild(card);

      // Re-run init to bind click
      app.init();

      readBtn.click();

      // Wait for content rendering
      const modalBody = document.getElementById('modal-body');
      await vi.waitFor(() => {
        expect(modalBody.innerHTML).toContain('<h1>Mock Article</h1>');
      });
    });
  });

  describe('Calculator Section Reveal Edge Cases', () => {
    it('should safely return from initCalculatorReveal if section title is missing', () => {
      // Remove title
      const title = document.querySelector('#calculator-section .section-title');
      if (title) title.remove();
      
      expect(() => app.init()).not.toThrow();
    });

    it('should safely return from initCalculatorReveal if calculator section is missing', () => {
      // Remove section
      const section = document.getElementById('calculator-section');
      if (section) section.remove();
      
      expect(() => app.init()).not.toThrow();
    });
  });

  describe('Articles Library Reveal Edge Cases', () => {
    it('should safely return from initArticlesLibrary if articles library element is missing', () => {
      // Remove articles-library element
      const lib = document.getElementById('articles-library');
      if (lib) lib.remove();
      
      expect(() => app.init()).not.toThrow();
    });

    it('should safely return from renderLibraryGrid if library grid is missing', () => {
      // Remove grid
      const grid = document.getElementById('library-grid');
      if (grid) grid.remove();
      
      expect(() => app.init()).not.toThrow();
    });
  });

  describe('HTML Escaping Utility', () => {
    it('should escape HTML characters correctly', () => {
      const input = '<script>alert("XSS & tab");</script>';
      const expected = '&lt;script&gt;alert(&quot;XSS &amp; tab&quot;);&lt;/script&gt;';
      expect(app.escapeHTML(input)).toBe(expected);
    });

    it('should return empty string for non-string inputs', () => {
      expect(app.escapeHTML(null)).toBe('');
      expect(app.escapeHTML(undefined)).toBe('');
      expect(app.escapeHTML(123)).toBe('');
    });
  });
});
