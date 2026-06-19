/**
 * EcoVisual — App Logic & Dynamic Environmental Engine
 * 
 * Implements:
 * 1. High-performance HTML5 Canvas leaf particle simulation.
 * 2. Synthesized Web Audio API soundscapes (serene ambient wind and drone notes).
 * 3. Custom cursor lag and brackets spring effect on scroll hint.
 * 4. Scroll-driven title shrinking, nav links fade-in, and footer tagline slide-up.
 */

const app = (() => {
  // --- STATE ---
  const state = {
    environmentalState: 'eco-warrior',
    pollutionFactor: 0,
    activeEcosystem: 'rainforest',
    audio: {
      context: null,
      gainNode: null,
      isPlaying: false,
      oscillators: [],
      filter: null,
      noiseNode: null
    }
  };

  let applyPalette = null;

  const ECOSYSTEM_PALETTES = {
    rainforest: {
      clean: {
        '--bg-color-1': '#0F201B',
        '--bg-color-2': '#050B09',
        '--accent-color': '#10B981',
        '--text-primary': '#F3F4F6',
        '--text-secondary': '#9CA3AF'
      },
      polluted: {
        '--bg-color-1': '#1A160F',
        '--bg-color-2': '#0B0805',
        '--accent-color': '#D97706',
        '--text-primary': '#D1D5DB',
        '--text-secondary': '#6B7280'
      }
    },
    glacier: {
      clean: {
        '--bg-color-1': '#0F1E2C',
        '--bg-color-2': '#04090F',
        '--accent-color': '#38BDF8',
        '--text-primary': '#F8FAFC',
        '--text-secondary': '#94A3B8'
      },
      polluted: {
        '--bg-color-1': '#1E141B',
        '--bg-color-2': '#0D060C',
        '--accent-color': '#EF4444',
        '--text-primary': '#E2E8F0',
        '--text-secondary': '#64748B'
      }
    },
    kelp: {
      clean: {
        '--bg-color-1': '#0A1B29',
        '--bg-color-2': '#020B12',
        '--accent-color': '#06B6D4',
        '--text-primary': '#F0FDFA',
        '--text-secondary': '#99F6E4'
      },
      polluted: {
        '--bg-color-1': '#18181B',
        '--bg-color-2': '#09090B',
        '--accent-color': '#A855F7',
        '--text-primary': '#E4E4E7',
        '--text-secondary': '#71717A'
      }
    }
  };

  function normalizeHex(hex) {
    if (hex.length === 4) {
      return '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
    }
    return hex;
  }

  function createGlassSurface(element, options = {}) {
    if (!element) return;
    
    // Default options matching React component props
    const borderRadius = options.borderRadius !== undefined ? options.borderRadius : 16;
    const borderWidth = options.borderWidth !== undefined ? options.borderWidth : 0.07;
    const brightness = options.brightness !== undefined ? options.brightness : 50;
    const opacity = options.opacity !== undefined ? options.opacity : 0.93;
    const blur = options.blur !== undefined ? options.blur : 11;
    const displace = options.displace !== undefined ? options.displace : 0;
    const backgroundOpacity = options.backgroundOpacity !== undefined ? options.backgroundOpacity : 0.15;
    const saturation = options.saturation !== undefined ? options.saturation : 1.8;
    const distortionScale = options.distortionScale !== undefined ? options.distortionScale : -180;
    const redOffset = options.redOffset !== undefined ? options.redOffset : 0;
    const greenOffset = options.greenOffset !== undefined ? options.greenOffset : 10;
    const blueOffset = options.blueOffset !== undefined ? options.blueOffset : 20;
    const xChannel = options.xChannel || 'R';
    const yChannel = options.yChannel || 'G';
    const mixBlendMode = options.mixBlendMode || 'difference';

    // Generate unique IDs for the SVG filter definitions
    const uniqueId = Math.random().toString(36).substring(2, 11);
    const filterId = `glass-filter-${uniqueId}`;
    const redGradId = `red-grad-${uniqueId}`;
    const blueGradId = `blue-grad-${uniqueId}`;

    // Wrap the text content in contentDiv
    const originalHTML = element.innerHTML;
    element.innerHTML = '';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'glass-surface__content';
    contentDiv.innerHTML = originalHTML;

    // Create the inline SVG filter
    const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgEl.setAttribute('class', 'glass-surface__filter');
    svgEl.innerHTML = `
      <defs>
        <filter id="${filterId}" color-interpolation-filters="sRGB" x="0%" y="0%" width="100%" height="100%">
          <feImage id="feimage-${uniqueId}" x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="map" />

          <feDisplacementMap id="redchannel-${uniqueId}" in="SourceGraphic" in2="map" result="dispRed" />
          <feColorMatrix
            in="dispRed"
            type="matrix"
            values="1 0 0 0 0
                    0 0 0 0 0
                    0 0 0 0 0
                    0 0 0 1 0"
            result="red"
          />

          <feDisplacementMap
            id="greenchannel-${uniqueId}"
            in="SourceGraphic"
            in2="map"
            result="dispGreen"
          />
          <feColorMatrix
            in="dispGreen"
            type="matrix"
            values="0 0 0 0 0
                    0 1 0 0 0
                    0 0 0 0 0
                    0 0 0 1 0"
            result="green"
          />

          <feDisplacementMap id="bluechannel-${uniqueId}" in="SourceGraphic" in2="map" result="dispBlue" />
          <feColorMatrix
            in="dispBlue"
            type="matrix"
            values="0 0 0 0 0
                    0 0 0 0 0
                    0 0 1 0 0
                    0 0 0 1 0"
            result="blue"
          />

          <feBlend in="red" in2="green" mode="screen" result="rg" />
          <feBlend in="rg" in2="blue" mode="screen" result="output" />
          <feGaussianBlur id="blur-${uniqueId}" in="output" stdDeviation="${displace}" />
        </filter>
      </defs>
    `;

    element.appendChild(svgEl);
    element.appendChild(contentDiv);

    element.classList.add('glass-surface');

    // Check backdrop-filter capability for SVG filter URLs
    const supportsSVGFilters = () => {
      if (typeof window === 'undefined' || typeof document === 'undefined') return false;
      const isWebkit = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
      const isFirefox = /Firefox/.test(navigator.userAgent);
      if (isWebkit || isFirefox) return false;
      const div = document.createElement('div');
      div.style.backdropFilter = `url(#${filterId})`;
      return div.style.backdropFilter !== '';
    };

    const svgSupported = supportsSVGFilters();
    element.classList.add(svgSupported ? 'glass-surface--svg' : 'glass-surface--fallback');

    // Apply variables to styling
    element.style.borderRadius = `${borderRadius}px`;
    element.style.setProperty('--glass-frost', backgroundOpacity);
    element.style.setProperty('--glass-saturation', saturation);
    element.style.setProperty('--filter-id', `url(#${filterId})`);

    const feImage = document.getElementById(`feimage-${uniqueId}`);
    const redChannel = document.getElementById(`redchannel-${uniqueId}`);
    const greenChannel = document.getElementById(`greenchannel-${uniqueId}`);
    const blueChannel = document.getElementById(`bluechannel-${uniqueId}`);

    if (redChannel) {
      redChannel.setAttribute('scale', (distortionScale + redOffset).toString());
      redChannel.setAttribute('xChannelSelector', xChannel);
      redChannel.setAttribute('yChannelSelector', yChannel);
    }
    if (greenChannel) {
      greenChannel.setAttribute('scale', (distortionScale + greenOffset).toString());
      greenChannel.setAttribute('xChannelSelector', xChannel);
      greenChannel.setAttribute('yChannelSelector', yChannel);
    }
    if (blueChannel) {
      blueChannel.setAttribute('scale', (distortionScale + blueOffset).toString());
      blueChannel.setAttribute('xChannelSelector', xChannel);
      blueChannel.setAttribute('yChannelSelector', yChannel);
    }

    const generateDisplacementMap = () => {
      const rect = element.getBoundingClientRect();
      const actualWidth = Math.ceil(rect.width || 300);
      const actualHeight = Math.ceil(rect.height || 60);
      const edgeSize = Math.min(actualWidth, actualHeight) * (borderWidth * 0.5);

      const svgContent = `
        <svg viewBox="0 0 ${actualWidth} ${actualHeight}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="${redGradId}" x1="100%" y1="0%" x2="0%" y2="0%">
              <stop offset="0%" stop-color="#0000"/>
              <stop offset="100%" stop-color="red"/>
            </linearGradient>
            <linearGradient id="${blueGradId}" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#0000"/>
              <stop offset="100%" stop-color="blue"/>
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="${actualWidth}" height="${actualHeight}" fill="black"></rect>
          <rect x="0" y="0" width="${actualWidth}" height="${actualHeight}" rx="${borderRadius}" fill="url(#${redGradId})" />
          <rect x="0" y="0" width="${actualWidth}" height="${actualHeight}" rx="${borderRadius}" fill="url(#${blueGradId})" style="mix-blend-mode: ${mixBlendMode}" />
          <rect x="${edgeSize}" y="${edgeSize}" width="${actualWidth - edgeSize * 2}" height="${actualHeight - edgeSize * 2}" rx="${borderRadius}" fill="hsl(0 0% ${brightness}% / ${opacity})" style="filter:blur(${blur}px)" />
        </svg>
      `;

      return `data:image/svg+xml,${encodeURIComponent(svgContent)}`;
    };

    const updateDisplacementMap = () => {
      if (feImage) {
        feImage.setAttribute('href', generateDisplacementMap());
      }
    };

    updateDisplacementMap();

    // ResizeObserver updates map on resize (keeps shape aligned across screens)
    const resizeObserver = new ResizeObserver(() => {
      setTimeout(updateDisplacementMap, 0);
    });
    resizeObserver.observe(element);
  }

  function initGlassSurfaces() {
    const el = document.getElementById('shared-glass-title');
    if (el) {
      createGlassSurface(el, {
        borderRadius: 16,
        backgroundOpacity: 0.15,
        saturation: 1.8,
        blur: 11,
        borderWidth: 0.05,
        brightness: 55,
        opacity: 0.9,
        displace: 1.5,
        distortionScale: -120,
        redOffset: 0,
        greenOffset: 8,
        blueOffset: 16
      });
    }
    updateActiveGlassTitle();
  }

  let activeTitleText = '';

  function updateActiveGlassTitle() {
    const activeGlassTitle = document.getElementById('shared-glass-title');
    if (!activeGlassTitle) return;

    if (!cards || cards.length === 0) {
      const scroller = document.querySelector('.scroll-stack-scroller');
      if (scroller) {
        cards = Array.from(scroller.querySelectorAll('.scroll-stack-card'));
      }
    }
    if (!cards || cards.length === 0) return;

    const stickyTop = getStickyParams().stickyTopPx;
    let activeCard = cards[0];

    for (let i = 0; i < cards.length; i++) {
      const rect = cards[i].getBoundingClientRect();
      if (rect.top <= stickyTop + 30) {
        activeCard = cards[i];
      }
    }

    if (activeCard) {
      const originalTitle = activeCard.querySelector('.card-title');
      const titleText = originalTitle ? originalTitle.textContent.trim() : '';

      if (titleText && titleText !== activeTitleText) {
        activeTitleText = titleText;
        const glassContent = activeGlassTitle.querySelector('.glass-surface__content');
        if (glassContent) {
          glassContent.textContent = titleText;
        }
      }
    }
  }

  function interpolateColor(color1, color2, factor) {
    
    const h1 = normalizeHex(color1);
    const h2 = normalizeHex(color2);

    const r1 = parseInt(h1.substring(1, 3), 16);
    const g1 = parseInt(h1.substring(3, 5), 16);
    const b1 = parseInt(h1.substring(5, 7), 16);

    const r2 = parseInt(h2.substring(1, 3), 16);
    const g2 = parseInt(h2.substring(3, 5), 16);
    const b2 = parseInt(h2.substring(5, 7), 16);

    const r = Math.round(r1 + factor * (r2 - r1));
    const g = Math.round(g1 + factor * (g2 - g1));
    const b = Math.round(b1 + factor * (b2 - b1));

    const componentToHex = (c) => {
      const hex = c.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return '#' + componentToHex(r) + componentToHex(g) + componentToHex(b);
  }

  // --- CANVAS PARTICLE SYSTEM ---
  let canvas, ctx;
  let particles = [];
  let isAnimating = false;

  function startAnimationLoop() {
    if (!isAnimating) {
      isAnimating = true;
      animateParticles();
    }
  }

  // --- CURSOR FOLLOW STATE FOR SCROLL DOWN ---
  let scrollHint;
  let leftBracket, rightBracket;
  let targetX = 60;
  let targetY = window.innerHeight / 2;
  let currentX = 60;
  let currentY = window.innerHeight / 2;
  let prevMouseX = 60;
  let prevMouseY = window.innerHeight / 2;
  let mouseMoved = false;

  let targetBracketOffset = 0;
  let currentBracketOffset = 0;
  let cachedVW = window.innerWidth; // cached viewport width (updated on resize)
 
  let targetScrollProgress = 0;
  let currentScrollProgress = 0;
  let heroTitle, titleContainer, navLinks, footerGrid, heroSec;
  let initialFooterTop = null;

  let lastHintX = -999, lastHintY = -999;

  function updateScrollHint() {
    if (!scrollHint) return;

    // Smooth movement interpolation (lerp with lag)
    currentX += (targetX - currentX) * 0.08;
    currentY += (targetY - currentY) * 0.08;

    // Skip DOM write if position hasn't changed meaningfully
    const dx = Math.abs(currentX - lastHintX);
    const dy = Math.abs(currentY - lastHintY);
    if (dx > 0.3 || dy > 0.3) {
      scrollHint.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
      lastHintX = currentX;
      lastHintY = currentY;
    }

    // Calculate bracket separation based on mouse velocity
    if (mouseMoved) {
      const ddx = targetX - prevMouseX;
      const ddy = targetY - prevMouseY;
      const speed = Math.hypot(ddx, ddy);
      
      targetBracketOffset = Math.min(18, speed * 0.35);
      
      prevMouseX = targetX;
      prevMouseY = targetY;
    }

    // Smooth bracket decay back to 0
    currentBracketOffset += (targetBracketOffset - currentBracketOffset) * 0.15;
    targetBracketOffset *= 0.92;

    if (leftBracket && rightBracket && Math.abs(currentBracketOffset) > 0.1) {
      leftBracket.style.transform = `translateX(${-currentBracketOffset}px)`;
      rightBracket.style.transform = `translateX(${currentBracketOffset}px)`;
    }
  }

  let lastRenderedProgress = -1; // Track last rendered to skip redundant writes
  let lastFadeOpacity = -1;

  function updateScrollAnimation() {
    if (!heroTitle || !navLinks || !footerGrid) return;

    // Smoothly interpolate scroll progress
    const diff = targetScrollProgress - currentScrollProgress;
    if (Math.abs(diff) > 0.0001) {
      currentScrollProgress += diff * 0.02344;
    } else {
      currentScrollProgress = targetScrollProgress;
    }

    const progress = currentScrollProgress;

    // --- Fade out footer + canvas (checked independently as it depends on scrollY, not progress) ---
    const scrollTop = window.scrollY;
    const vh = window.innerHeight;
    const fadeStart = vh * 0.35;
    const fadeEnd = vh * 0.85;
    const fadeOpacity = scrollTop > fadeStart
      ? Math.max(0, 1 - (scrollTop - fadeStart) / (fadeEnd - fadeStart))
      : 1;
    
    // Only write fade if it changed
    const roundedFade = Math.round(fadeOpacity * 100);
    if (roundedFade !== lastFadeOpacity) {
      footerGrid.style.opacity = fadeOpacity;
      if (canvas) canvas.style.opacity = fadeOpacity;
      lastFadeOpacity = roundedFade;
    }

    // --- Early exit: skip all other DOM writes if progress hasn't changed ---
    const roundedProgress = Math.round(progress * 10000);
    if (roundedProgress === lastRenderedProgress) return;
    lastRenderedProgress = roundedProgress;

    const easedProgress = Math.pow(progress, 1.4);
 
    // 1 & 2. Sizing and Gap progress driven via CSS custom properties
    heroTitle.style.setProperty('--scroll-progress', easedProgress);
 
    // 3. Nav Links Opacity
    navLinks.style.opacity = easedProgress;
    if (easedProgress > 0.85) {
      navLinks.classList.add('visible');
    } else {
      navLinks.classList.remove('visible');
    }

    // 4. Toggle hero collapsed class
    if (heroSec) {
      if (progress > 0.85) {
        heroSec.classList.add('collapsed');
      } else {
        heroSec.classList.remove('collapsed');
      }
    }
 
    // 5. Scroll Hint opacity
    if (scrollHint) {
      scrollHint.style.opacity = Math.max(0, 1 - progress * 1.8);
    }
 
    // 6. Footer Moving Up
    if (initialFooterTop === null) {
      footerGrid.style.transform = 'none';
      initialFooterTop = footerGrid.getBoundingClientRect().top;
    }
    const totalTravel = initialFooterTop - 180;
    footerGrid.style.transform = `translate3d(0,${-totalTravel * easedProgress}px,0)`;
  }

  class Particle {
    constructor() {
      this.reset();
    }

    reset() {
      this.x = Math.random() * canvas.width;
      this.size = Math.random() * 6 + 4; // 4..10px
      this.angle = Math.random() * Math.PI * 2;
      this.spin = Math.random() * 0.04 - 0.02;
      this.opacity = Math.random() * 0.4 + 0.3;
      this.seed = Math.random(); // individual variation
      
      const eco = state.activeEcosystem;
      const factor = state.pollutionFactor || 0;
      
      if (eco === 'kelp' && factor < 0.5) {
        this.y = canvas.height + 20 + Math.random() * 100;
        this.speedY = -(Math.random() * 0.8 + 0.6);
        this.speedX = Math.random() * 0.4 - 0.2;
      } else {
        this.y = -20 - Math.random() * canvas.height;
        this.speedY = Math.random() * 1.2 + 0.6;
        this.speedX = Math.random() * 0.8 - 0.4;
      }
    }

    update() {
      const eco = state.activeEcosystem;
      const factor = state.pollutionFactor || 0;

      if (eco === 'glacier') {
        const baseSpeedY = this.seed * 0.8 + 0.5;
        const rainSpeedY = this.seed * 2.5 + 3.5;
        this.speedY = baseSpeedY * (1 - factor) + rainSpeedY * factor;
        this.speedX = (this.seed * 0.4 - 0.2) * (1 - factor) + (this.seed * 0.5 - 0.25) * factor;
      } else if (eco === 'kelp') {
        if (factor < 0.5) {
          this.speedY = -(this.seed * 0.8 + 0.6);
          this.speedX = Math.sin(this.y * 0.02) * 0.3;
        } else {
          this.speedY = (Math.sin(this.y * 0.01 + this.seed * 10) * 0.3) + (this.seed * 0.4 - 0.2);
          this.speedX = Math.cos(this.x * 0.01 + this.seed * 10) * 0.4;
        }
      } else {
        const leafSpeedY = this.seed * 1.0 + 0.5;
        const ashSpeedY = this.seed * 1.5 + 1.0;
        this.speedY = leafSpeedY * (1 - factor) + ashSpeedY * factor;
        this.speedX = this.seed * 0.8 - 0.4;
      }

      this.y += this.speedY;
      
      if (eco === 'kelp' && factor >= 0.5) {
        this.x += this.speedX;
      } else {
        this.x += this.speedX + Math.sin(this.y * 0.01 + this.seed * 5) * 0.2;
      }
      
      this.angle += this.spin;

      if (eco === 'kelp' && factor < 0.5) {
        if (this.y < -20 || this.x < -20 || this.x > canvas.width + 20) {
          this.reset();
        }
      } else {
        if (this.y > canvas.height + 20 || this.x < -20 || this.x > canvas.width + 20) {
          this.reset();
        }
      }
    }

    draw() {
      const eco = state.activeEcosystem;
      const factor = state.pollutionFactor || 0;
      
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);

      if (eco === 'rainforest') {
        const h = (100 + this.seed * 40) * (1 - factor) + (25 + this.seed * 15) * factor;
        const s = 70 * (1 - factor) + 8 * factor;
        const l = 45 * (1 - factor) + 20 * factor;
        ctx.fillStyle = `hsla(${h}, ${s}%, ${l}%, ${this.opacity})`;
        
        ctx.beginPath();
        if (factor < 0.4) {
          ctx.ellipse(0, 0, this.size, this.size / 2.2, 0, 0, Math.PI * 2);
        } else if (factor > 0.7) {
          ctx.rect(-this.size/3, -this.size/3, this.size * 0.6, this.size * 0.6);
        } else {
          ctx.ellipse(0, 0, this.size * (1 - factor * 0.3), this.size / (2.2 + factor * 2), 0, 0, Math.PI * 2);
        }
        ctx.fill();

      } else if (eco === 'glacier') {
        if (factor < 0.4) {
          ctx.strokeStyle = `rgba(186, 230, 253, ${this.opacity})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          const len = this.size;
          ctx.moveTo(-len/2, 0); ctx.lineTo(len/2, 0);
          ctx.moveTo(0, -len/2); ctx.lineTo(0, len/2);
          ctx.stroke();
        } else if (factor > 0.7) {
          if (this.seed < 0.6) {
            ctx.strokeStyle = `rgba(200, 200, 200, ${this.opacity * 0.6})`;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(0, -this.size * 1.5);
            ctx.lineTo(0, this.size * 1.5);
            ctx.stroke();
          } else {
            ctx.fillStyle = `rgba(30, 30, 30, ${this.opacity})`;
            ctx.beginPath();
            ctx.arc(0, 0, this.size * 0.4, 0, Math.PI * 2);
            ctx.fill();
          }
        } else {
          ctx.fillStyle = `rgba(220, 225, 235, ${this.opacity})`;
          ctx.beginPath();
          ctx.arc(0, 0, this.size * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }

      } else if (eco === 'kelp') {
        if (factor < 0.5) {
          ctx.strokeStyle = `rgba(165, 243, 252, ${this.opacity * 0.6})`;
          ctx.lineWidth = 1;
          ctx.fillStyle = `rgba(165, 243, 252, ${this.opacity * 0.1})`;
          ctx.beginPath();
          ctx.arc(0, 0, this.size * 0.8, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(-this.size * 0.3, -this.size * 0.3, this.size * 0.15, 0, Math.PI * 2);
          ctx.fill();
        } else {
          const colors = [
            `rgba(168, 85, 247, ${this.opacity})`,
            `rgba(236, 72, 153, ${this.opacity})`,
            `rgba(249, 115, 22, ${this.opacity})`,
            `rgba(244, 244, 245, ${this.opacity})`,
            `rgba(107, 114, 128, ${this.opacity})`
          ];
          const colorIdx = Math.floor(this.seed * colors.length);
          ctx.fillStyle = colors[colorIdx];
          ctx.beginPath();
          ctx.rect(-this.size/2, -this.size/3, this.size, this.size * 0.6);
          ctx.fill();
        }
      }

      ctx.restore();
    }
  }

  let canvasVisible = true; // Track if hero canvas is in viewport

  function initCanvas() {
    canvas = document.getElementById('bg-canvas');
    ctx = canvas.getContext('2d', { alpha: true });
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Use IntersectionObserver to pause canvas rendering when off-screen
    const canvasObserver = new IntersectionObserver((entries) => {
      canvasVisible = entries[0].isIntersecting;
      if (canvasVisible) {
        startAnimationLoop();
      }
    }, { threshold: 0 });
    canvasObserver.observe(canvas);
    
    // Spawn initial particles
    updateParticleSystem();
    startAnimationLoop();
  }

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function updateParticleSystem() {
    particles = [];
    const particleCount = 40;
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }
  }

  function animateParticles() {
    if (!isAnimating) return;

    // Only paint particles when hero canvas is visible
    if (canvasVisible) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
      }
    }
    
    // Scroll animation + cursor update
    updateScrollAnimation();
    updateScrollHint();

    // Check if we can sleep: canvas offscreen and scroll/cursor animation settled
    const scrollSettled = Math.abs(targetScrollProgress - currentScrollProgress) < 0.001;
    const cursorSettled = Math.abs(targetX - currentX) < 0.5 && 
                          Math.abs(targetY - currentY) < 0.5 && 
                          Math.abs(currentBracketOffset) < 0.1;
    
    if (!canvasVisible && scrollSettled && cursorSettled) {
      isAnimating = false;
      return;
    }

    requestAnimationFrame(animateParticles);
  }



  // --- LISTENERS & INITIALIZATION ---
  function setupDOMListeners() {
    // Scroll Hint & Brackets selection
    scrollHint = document.querySelector('.scroll-hint');
    leftBracket = document.querySelector('.bracket-left');
    rightBracket = document.querySelector('.bracket-right');

    const heroSection = document.getElementById('hero-section');
    
    // Set initial position centered vertically, 60px from left (20px on mobile)
    const getDefX = () => window.innerWidth <= 640 ? 20 : 60;
    targetX = getDefX();
    targetY = window.innerHeight / 2;
    currentX = getDefX();
    currentY = window.innerHeight / 2;
    prevMouseX = getDefX();
    prevMouseY = window.innerHeight / 2;

    // Cursor tracking inside Hero Section
    heroSection.addEventListener('mousemove', (e) => {
      mouseMoved = true;
      const rect = heroSection.getBoundingClientRect();
      targetX = e.clientX - rect.left + 22;
      targetY = e.clientY - rect.top + 22;
      startAnimationLoop();
    });

    heroSection.addEventListener('mouseleave', () => {
      mouseMoved = false;
      targetX = getDefX();
      targetY = window.innerHeight / 2;
      startAnimationLoop();
    });

    // Reset default center on window resize
    window.addEventListener('resize', () => {
      if (!mouseMoved) {
        targetX = getDefX();
        targetY = window.innerHeight / 2;
      }
      startAnimationLoop();
    });


    // Handle menu nav item clicks
    document.querySelectorAll('.nav-link-item').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const id = link.id;
        if (id === 'nav-home') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (id === 'nav-decay') {
          const section = document.getElementById('assembly-section');
          if (section) section.scrollIntoView({ behavior: 'smooth' });
        } else if (id === 'nav-calc') {
          const section = document.getElementById('calculator-section');
          if (section) section.scrollIntoView({ behavior: 'smooth' });
        } else if (id === 'nav-reads') {
          const section = document.getElementById('articles-section');
          if (section) section.scrollIntoView({ behavior: 'smooth' });
        } else if (id === 'nav-library') {
          const libraryEl = document.getElementById('articles-library');
          if (libraryEl) {
            libraryEl.classList.add('open');
            libraryEl.setAttribute('aria-hidden', 'false');
            document.body.classList.add('scroll-locked');
          }
        }
      });
    });

    // Handle footer link smooth scrolls
    document.querySelectorAll('.footer-link').forEach(link => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('#') && href !== '#') {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const target = document.querySelector(href);
          if (target) target.scrollIntoView({ behavior: 'smooth' });
        });
      }
    });

    // Tick footer timestamp
    function updateFooterTimestamp() {
      const tsEl = document.getElementById('footer-timestamp');
      if (!tsEl) return;
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const tzName = Intl.DateTimeFormat().resolvedOptions().timeZone.split('/').pop().replace('_', ' ').toUpperCase();
      tsEl.textContent = `${tzName}, ${timeStr}`;
    }
    updateFooterTimestamp();
    setInterval(updateFooterTimestamp, 1000);

    // Scroll driven animation handler for Hero Section morphing
    heroTitle = document.querySelector('.hero-title');
    titleContainer = document.querySelector('.hero-title-container');
    navLinks = document.querySelector('.nav-links');
    footerGrid = document.querySelector('.hero-footer-grid');
    heroSec = document.getElementById('hero-section'); // Cache — used every RAF frame

    function handleScrollEffects() {
      const scrollTop = window.scrollY;
      const maxScroll = window.innerHeight * 0.35;
      targetScrollProgress = Math.min(1, Math.max(0, scrollTop / maxScroll));
      updateActiveGlassTitle();
      startAnimationLoop();
    }

    // Bind scroll event
    window.addEventListener('scroll', handleScrollEffects, { passive: true });
    
    // Bind resize to recalculate
    window.addEventListener('resize', () => {
      cachedVW = window.innerWidth; // Update cached viewport width
      initialFooterTop = null;
      handleScrollEffects();
    });

    // Recalculate on load and font ready to ensure centering uses loaded custom font widths
    window.addEventListener('load', () => {
      initialFooterTop = null;
      handleScrollEffects();
    });

    if (document.fonts) {
      document.fonts.ready.then(() => {
        initialFooterTop = null;
        handleScrollEffects();
      });
    }

    // Run once after DOM settles to set initial positions
    setTimeout(handleScrollEffects, 100);
  }

  function getNonAdjacentBatches(rows, cols, numBatches) {
    const totalCells = rows * cols;
    const cells = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        cells.push({ r, c, index: r * cols + c });
      }
    }

    // Shuffle cells to randomize starting distribution on every load
    for (let i = cells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cells[i], cells[j]] = [cells[j], cells[i]];
    }

    const assignment = new Array(totalCells).fill(-1);
    const batchCounts = new Array(numBatches).fill(0);
    const maxBatchSize = Math.ceil(totalCells / numBatches); // 5 for 28/6

    function isSafe(cellIndex, batchIdx) {
      const cell = cells[cellIndex];
      // Check batch capacity
      if (batchCounts[batchIdx] >= maxBatchSize) return false;

      // Check 8-way adjacency with already assigned cells in the same batch
      for (let i = 0; i < cellIndex; i++) {
        if (assignment[i] === batchIdx) {
          const other = cells[i];
          if (Math.abs(cell.r - other.r) <= 1 && Math.abs(cell.c - other.c) <= 1) {
            return false;
          }
        }
      }
      return true;
    }

    function backtrack(cellIndex) {
      if (cellIndex === totalCells) return true;

      // Try assigning the cell to each batch
      // Shuffle batch indices to add more randomness
      const batchIndices = Array.from({ length: numBatches }, (_, i) => i);
      for (let i = batchIndices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [batchIndices[i], batchIndices[j]] = [batchIndices[j], batchIndices[i]];
      }

      for (let i = 0; i < numBatches; i++) {
        const b = batchIndices[i];
        if (isSafe(cellIndex, b)) {
          assignment[cellIndex] = b;
          batchCounts[b]++;
          
          if (backtrack(cellIndex + 1)) return true;
          
          // Backtrack
          assignment[cellIndex] = -1;
          batchCounts[b]--;
        }
      }
      return false;
    }

    // Run backtracking. If it fails, retry with a fresh shuffle
    let attempts = 0;
    while (!backtrack(0) && attempts < 50) {
      attempts++;
      // reshuffle cells
      for (let i = cells.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cells[i], cells[j]] = [cells[j], cells[i]];
      }
      assignment.fill(-1);
      batchCounts.fill(0);
    }

    // Convert assignment to indices grouped by batch
    const batches = Array.from({ length: numBatches }, () => []);
    for (let i = 0; i < totalCells; i++) {
      const cell = cells[i];
      const b = assignment[i];
      if (b !== -1) {
        batches[b].push(cell.index);
      }
    }
    return batches;
  }

  function initAssemblyGrid() {
    const gridContainer = document.querySelector('.grid-container');
    if (!gridContainer) return;

    const cols = 7;
    const rows = 4;
    const totalSlices = cols * rows;

    // 1. Create Slices Dynamically and store coordinates on dataset
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const slice = document.createElement('div');
        slice.classList.add('slice');
        
        // Dimensions
        const widthPct = 100 / cols;
        const heightPct = 100 / rows;
        const leftPct = c * widthPct;
        const topPct = r * heightPct;
        
        // Background positions
        const bgXPct = c * (100 / (cols - 1));
        const bgYPct = r * (100 / (rows - 1));
        
        slice.style.width = `${widthPct}%`;
        slice.style.height = `${heightPct}%`;
        slice.style.left = `${leftPct}%`;
        slice.style.top = `${topPct}%`;
        slice.style.backgroundSize = `${cols * 100}% ${rows * 100}%`;
        slice.style.backgroundPosition = `${bgXPct}% ${bgYPct}%`;
        
        // Store coordinates on element dataset for initial placement calculations
        slice.dataset.left = leftPct;
        slice.dataset.top = topPct;
        slice.dataset.width = widthPct;
        slice.dataset.height = heightPct;

        gridContainer.appendChild(slice);
      }
    }

    // 2. Set Scattered Initial Properties
    gsap.registerPlugin(ScrollTrigger);
    
    const slices = gsap.utils.toArray('.slice');
    
    // Generate batches where no adjacent cells share the same batch
    const numBatches = 6;
    const batchIndicesGroups = getNonAdjacentBatches(rows, cols, numBatches);
    
    // Batch 1 (batchIndicesGroups[0]) represents the 5 initially visible slices
    const initialIndices = batchIndicesGroups[0];

    slices.forEach((slice, index) => {
      const leftPct = parseFloat(slice.dataset.left);
      const topPct = parseFloat(slice.dataset.top);
      const widthPct = parseFloat(slice.dataset.width);
      const heightPct = parseFloat(slice.dataset.height);

      // Vector from the grid container center (50%, 50%) to the slice center
      const dx = (leftPct + widthPct / 2) - 50;
      const dy = (topPct + heightPct / 2) - 50;

      // Project initial starting coordinates to the exact opposite quadrant, far off
      const multiplier = 1.6;
      const randomX = -dx * multiplier + gsap.utils.random(-8, 8);
      const randomY = -dy * multiplier + gsap.utils.random(-8, 8);
      
      const randomRot = gsap.utils.random(-40, 40);
      const randomScale = gsap.utils.random(0.4, 0.65);

      // Determine initial depth blur and opacity
      let blurVal = 0;
      let opacityVal = 0;

      const isInitiallyVisible = initialIndices.includes(index);
      if (isInitiallyVisible) {
        // Keep 5 pieces visible initially
        opacityVal = gsap.utils.random(0.45, 0.75);
        
        // Assign distinct depth category blurs to the 5 initial pieces
        const visibleIndex = initialIndices.indexOf(index);
        const blurs = [0, 6, 12, 20, 28]; // [sharp, low, medium, high, extreme]
        blurVal = blurs[visibleIndex] !== undefined ? blurs[visibleIndex] : 12;
        
        // Slices coming from the bottom (randomY > 0) get an additional heavy blur multiplier
        if (randomY > 0) {
          blurVal = Math.max(blurVal, 22) + gsap.utils.random(10, 20);
        }
      } else {
        // Start other pieces completely invisible
        opacityVal = 0;
        
        // Slices coming from the bottom get a heavy starting blur range (30px - 48px),
        // while slices from the top get a lighter range (12px - 24px)
        if (randomY > 0) {
          blurVal = gsap.utils.random(30, 48);
        } else {
          blurVal = gsap.utils.random(12, 24);
        }
      }

      // Use opacity instead of blur for depth effect (blur is extremely expensive)
      gsap.set(slice, {
        x: `${randomX}vw`,
        y: `${randomY}vh`,
        rotation: randomRot,
        scale: randomScale,
        opacity: opacityVal,
        zIndex: 1
      });
    });

    // Map batch indices to slice elements
    const batches = batchIndicesGroups.map(group => group.map(idx => slices[idx]));

    const videoEl = document.getElementById('assembly-video');
    let videoTransitionStarted = false;
    let videoTransitionTween = null;

    if (videoEl) {
      videoEl.muted = true;
      videoEl.load();
    }

    // 3. Create ScrollTrigger Timeline for Pinned Section
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: "#assembly-section",
        start: "top top",
        end: "+=2000", // Shorter scrolling depth since transition is automatic
        scrub: 1.5,    // Smooth inertia scrub
        pin: true,
        anticipatePin: 1,
        onUpdate: (self) => {
          const progress = self.progress;
          if (progress > 0.95) {
            if (!videoTransitionStarted) {
              videoTransitionStarted = true;
              startVideoAutoTransition();
            }
          } else if (progress < 0.85) {
            if (videoTransitionStarted) {
              videoTransitionStarted = false;
              resetVideoAutoTransition();
            }
          }
        },
        onLeave: () => {
          if (videoEl) videoEl.pause();
        },
        onEnterBack: () => {
          if (videoEl && videoTransitionStarted && (!videoTransitionTween || !videoTransitionTween.isActive())) {
            videoEl.play().catch(() => {});
          }
        }
      }
    });

    // Step A: Assemble Slices in a cascading waterfall sequence
    const batchDuration = 1.4; // duration of motion for each batch
    const overlap = batchDuration * 0.5; // overlap is exactly 50% (next batch starts when current is 50% of its way)

    batches.forEach((batchSlices, batchIndex) => {
      // Calculate absolute starting position on timeline
      const timelinePosition = batchIndex * (batchDuration - overlap);
      
      tl.to(batchSlices, {
        x: 0,
        y: 0,
        rotation: 0,
        scale: 1.002,
        opacity: 1,
        zIndex: 10,
        ease: "power2.inOut",
        duration: batchDuration,
        stagger: 0.08
      }, timelinePosition);
    });

    // Step B: Container Scale-Up & Typography Overlay Fade-in (runs at the end of the batch sequence)
    const finalSequenceStart = batches.length * (batchDuration - overlap) + overlap;

    tl.to(".grid-container", {
      scale: 1.06,
      ease: "power1.out",
      duration: 1.2
    }, finalSequenceStart)
    
    .to(".text-overlay", {
      opacity: 1,
      y: 0,
      ease: "power2.out",
      duration: 1.2
    }, "<");

    function startVideoAutoTransition() {
      if (videoTransitionTween) videoTransitionTween.kill();
      if (!videoEl) return;

      // Lock scroll while playing cinematic video
      document.body.classList.add('scroll-locked');

      // 1. Play video from start safely
      videoEl.muted = true;
      try {
        if (videoEl.readyState >= 1) {
          videoEl.currentTime = 0;
        }
      } catch (e) {
        console.warn("Could not reset video currentTime:", e);
      }

      videoEl.play().catch(err => {
        console.warn("Autoplay block or load error, retrying with load():", err);
        videoEl.load();
        videoEl.play().catch(e => console.error("Retry playback failed:", e));
      });

      // 2. Animate overlay and shutter
      videoTransitionTween = gsap.timeline();
      
      // Initialize grid-container clipPath to full size
      gsap.set(".grid-container", { clipPath: "inset(0% 0% 0% 0%)" });

      videoTransitionTween
        // Fade in the video overlay
        .to(".assembly-video", {
          opacity: 1,
          duration: 1.0,
          ease: "power1.out"
        })
        // Collapse grid-container vertically to center starting immediately with the video play/fade-in
        .to(".grid-container", {
          clipPath: "inset(50% 0% 50% 0%)",
          duration: 3.2, // A smooth 3.2s duration to let the video play during collapse
          ease: "power2.inOut"
        }, "<")
        // Fade out text overlay at the same time
        .to(".text-overlay", {
          opacity: 0,
          duration: 1.2,
          ease: "power2.out"
        }, "<")
        // Fade out the remaining thin line, unlock scroll, and pause video
        .to(".grid-container", {
          opacity: 0,
          duration: 0.5,
          onComplete: () => {
            if (videoEl) videoEl.pause();
            document.body.classList.remove('scroll-locked');
            
            // Refresh ScrollTrigger since layout shifted
            ScrollTrigger.refresh();
            
            // Programmatically scroll to calculator section so user doesn't need to scroll manually
            const calcSection = document.getElementById('calculator-section');
            if (calcSection) {
              calcSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }

          }
        }, "-=0.4");
    }

    function resetVideoAutoTransition() {
      if (videoTransitionTween) videoTransitionTween.kill();
      if (videoEl) videoEl.pause();

      // Ensure scroll is unlocked when resetting
      document.body.classList.remove('scroll-locked');

      videoTransitionTween = gsap.timeline();
      
      videoTransitionTween
        .to(".assembly-video", {
          opacity: 0,
          duration: 0.4,
          overwrite: "auto"
        })
        .to(".grid-container", {
          clipPath: "inset(0% 0% 0% 0%)",
          opacity: 1,
          duration: 0.5,
          overwrite: "auto",
          onComplete: () => {
            // Remove inline clip-path so scattered slices are not clipped during entry scroll
            gsap.set(".grid-container", { clearProps: "clipPath" });
            // Clear inline styles on text-overlay so ScrollTrigger timeline takes over again!
            gsap.set(".text-overlay", { clearProps: "opacity,transform" });
            
            // Refresh ScrollTrigger since layout restored
            ScrollTrigger.refresh();
          }
        }, "<");
    }
  }

  function initPaletteEngine() {
    applyPalette = function() {
      const eco = state.activeEcosystem;
      const factor = state.pollutionFactor;
      const palette = ECOSYSTEM_PALETTES[eco];

      Object.keys(palette.clean).forEach(key => {
        const val1 = palette.clean[key];
        const val2 = palette.polluted[key];
        const interpolated = interpolateColor(val1, val2, factor);
        
        document.documentElement.style.setProperty(key, interpolated);
        
        if (key === '--accent-color') {
          const hex = normalizeHex(interpolated);
          const r = parseInt(hex.substring(1, 3), 16);
          const g = parseInt(hex.substring(3, 5), 16);
          const b = parseInt(hex.substring(5, 7), 16);
          
          document.documentElement.style.setProperty('--accent-glow', `rgba(${r}, ${g}, ${b}, 0.2)`);
        }
      });

      // Calculate dynamic image hue shift
      // Green is around hue 120. Shifting by factor * -120 takes it from 120 (emerald green) to 0 (red).
      const hueShift = factor * -120;
      const saturation = 1 + factor * 0.5;
      const brightness = 1 - factor * 0.2;
      const filterVal = `hue-rotate(${hueShift}deg) saturate(${saturation}) brightness(${brightness})`;
      document.documentElement.style.setProperty('--image-filter', filterVal);

      // Update footer logs
      const footerEmissions = document.getElementById('footer-emissions-index');
      if (footerEmissions) {
        const co2El = document.getElementById('result-co2');
        const co2Val = co2El ? parseFloat(co2El.textContent) : 0;
        let stageNum = 1;
        if (co2Val < 11.0) stageNum = 1;
        else if (co2Val < 22.0) stageNum = 2;
        else if (co2Val < 33.0) stageNum = 3;
        else if (co2Val < 44.0) stageNum = 4;
        else stageNum = 5;
        
        const stageNames = ["LUSH & SAFE", "EARLY DAMAGE", "TIPPING POINT", "SEVERE DAMAGE", "COLLAPSE"];
        footerEmissions.textContent = `STAGE ${stageNum} (${stageNames[stageNum - 1]})`;
      }
      
      const footerTheme = document.getElementById('footer-accent-theme');
      if (footerTheme) {
        let themeName = "RAINFOREST EMERALD";
        if (eco === 'rainforest') {
          themeName = factor > 0.5 ? "SICK SAVANNA" : "RAINFOREST EMERALD";
        } else if (eco === 'glacier') {
          themeName = factor > 0.5 ? "MELTING CRATER" : "GLACIER ICE";
        } else if (eco === 'kelp') {
          themeName = factor > 0.5 ? "TOXIC ALGAE" : "KELP CYAN";
        }
        footerTheme.textContent = themeName;
      }
    };

    applyPalette();
  }

  // --- FULL LIBRARY CONTROLLER ---
  const ARTICLES_LIST = [
    {
      id: "01",
      filename: "01-daily-life-carbon-footprint.md",
      title: "Daily Life Activities and Their Carbon Footprint",
      tag: "foundational",
      readTime: "8 min",
      summary: "Every part of daily life — what we drive, what we eat, what we buy, how we heat and cool our homes — releases greenhouse gases."
    },
    {
      id: "02",
      filename: "02-what-is-carbon-footprint.md",
      title: "What Is a Carbon Footprint?",
      tag: "foundational",
      readTime: "6 min",
      summary: "A carbon footprint represents the total greenhouse-gas emissions caused directly and indirectly by an individual, organization, event, or product."
    },
    {
      id: "03",
      filename: "03-climate-change-101.md",
      title: "Climate Change 101: Why a Footprint Matters",
      tag: "science",
      readTime: "6 min",
      summary: "Human activities have thickened the greenhouse-gas blanket, warming the planet. Understand the core science behind carbon footprints."
    },
    {
      id: "04",
      filename: "04-five-stages-explained.md",
      title: "The 5 Stages of a Personal Carbon Footprint",
      tag: "foundational",
      readTime: "7 min",
      summary: "Explore the five distinct stages of emissions, mapping personal lifestyles to global temperature thresholds and climate consequences."
    },
    {
      id: "05",
      filename: "05-transport-and-flying.md",
      title: "Transport and Flying: The Single Biggest Lever",
      tag: "action",
      readTime: "7 min",
      summary: "Transportation is the largest contributor to carbon emissions. Discover the outsized impact of cars, transit, and aviation."
    },
    {
      id: "06",
      filename: "06-food-and-farming.md",
      title: "Food and Farming: What You Eat Shapes the Climate",
      tag: "action",
      readTime: "7 min",
      summary: "Agriculture and food systems account for a major portion of global emissions. Learn how diet changes can reduce your footprint."
    },
    {
      id: "07",
      filename: "07-home-energy.md",
      title: "Home Energy: Heating, Cooling, and the Grid",
      tag: "action",
      readTime: "7 min",
      summary: "Residential electricity and heating fuel emit significant greenhouse gases. Explore paths to home efficiency and clean energy."
    },
    {
      id: "08",
      filename: "08-equity-and-inequality.md",
      title: "Climate Inequality: Whose Emissions, Whose Harms",
      tag: "policy",
      readTime: "7 min",
      summary: "A deep dive into the global wealth gap and emissions. The richest individuals generate the most pollution, while the poorest suffer the consequences."
    },
    {
      id: "09",
      filename: "09-coral-reefs-and-tipping-points.md",
      title: "Coral Reefs and Tipping Points: Why 1.5°C vs 2°C Matters",
      tag: "science",
      readTime: "7 min",
      summary: "A fraction of a degree decides the survival of marine ecosystems. Understand the critical tipping points of global coral reefs."
    },
    {
      id: "10",
      filename: "10-carbon-pricing-around-world.md",
      title: "Carbon Pricing Around the World",
      tag: "policy",
      readTime: "7 min",
      summary: "How carbon taxes and cap-and-trade systems harness market forces to lower carbon pollution across global economies."
    },
    {
      id: "11",
      filename: "11-why-carbon-offsets-fail.md",
      title: "Why Carbon Offsets Usually Don't Work",
      tag: "policy",
      readTime: "6 min",
      summary: "An analysis of why many offset schemes fail to deliver real, permanent, and additional carbon reductions."
    },
    {
      id: "12",
      filename: "12-action-plan-by-stage.md",
      title: "A 12-Month Action Plan by Stage",
      tag: "action",
      readTime: "7 min",
      summary: "A month-by-month guide with actionable, scalable steps to systematically reduce your carbon footprint over a year."
    },
    {
      id: "13",
      filename: "13-future-grid-and-electrification.md",
      title: "The Future Grid: Why Electrification Is the Real Answer",
      tag: "science",
      readTime: "7 min",
      summary: "How electrifying vehicles, heat pumps, and industries will enable 100% renewable grid integration and deep decarbonization."
    },
    {
      id: "14",
      filename: "14-corporate-greenwashing-vs-real-action.md",
      title: "Corporate Greenwashing vs. Real Action",
      tag: "policy",
      readTime: "6 min",
      summary: "Learn to distinguish between superficial PR branding campaigns and verified, systemic carbon reduction initiatives."
    },
    {
      id: "15",
      filename: "15-how-to-talk-to-friends-and-family.md",
      title: "How to Talk to Friends and Family About Climate Change",
      tag: "action",
      readTime: "6 min",
      summary: "Effective communication strategies to build empathy, avoid climate fatigue, and inspire collective local action."
    }
  ];

  let activeFilterTag = "all";
  let librarySearchQuery = "";

  function initArticlesLibrary() {
    const navLibraryBtn = document.getElementById('nav-library');
    const footerLibraryBtn = document.getElementById('footer-library-link');
    const libraryCloseBtn = document.getElementById('library-close');
    const libraryBackdrop = document.getElementById('library-backdrop');
    const libraryEl = document.getElementById('articles-library');
    const searchInput = document.getElementById('library-search-input');
    const filterBtns = document.querySelectorAll('.library-filter-btn');

    if (!libraryEl) return;

    const openLib = (e) => {
      if (e) e.preventDefault();
      libraryEl.classList.add('open');
      libraryEl.setAttribute('aria-hidden', 'false');
      document.body.classList.add('scroll-locked');
    };

    const closeLib = () => {
      libraryEl.classList.remove('open');
      libraryEl.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('scroll-locked');
    };

    if (navLibraryBtn) navLibraryBtn.addEventListener('click', openLib);
    if (footerLibraryBtn) footerLibraryBtn.addEventListener('click', openLib);
    if (libraryCloseBtn) libraryCloseBtn.addEventListener('click', closeLib);
    if (libraryBackdrop) libraryBackdrop.addEventListener('click', closeLib);

    // Search input handler
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        librarySearchQuery = e.target.value.toLowerCase();
        renderLibraryGrid();
      });
    }

    // Category filter button handlers
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeFilterTag = btn.dataset.filter;
        renderLibraryGrid();
      });
    });

    renderLibraryGrid();
  }

  function renderLibraryGrid() {
    const grid = document.getElementById('library-grid');
    if (!grid) return;

    grid.innerHTML = '';

    const filtered = ARTICLES_LIST.filter(art => {
      const matchesTag = activeFilterTag === 'all' || art.tag === activeFilterTag;
      const matchesSearch = art.title.toLowerCase().includes(librarySearchQuery) || 
                            art.tag.toLowerCase().includes(librarySearchQuery) ||
                            art.summary.toLowerCase().includes(librarySearchQuery);
      return matchesTag && matchesSearch;
    });

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; font-family: var(--font-mono); color: var(--text-secondary); font-size: 0.85rem; border: 1px dashed rgba(255,255,255,0.06); border-radius: 12px;">
          NO ARTICLES MATCHED YOUR SEARCH QUERY
        </div>
      `;
      return;
    }

    filtered.forEach(art => {
      const card = document.createElement('div');
      card.className = 'library-card';
      card.innerHTML = `
        <div>
          <span class="lib-card-tag">ARTICLE ${art.id} — ${art.tag}</span>
          <h3 class="lib-card-title">${art.title}</h3>
          <p class="lib-card-summary">${art.summary}</p>
        </div>
        <div class="lib-card-footer">
          <span>READ TIME: ${art.readTime}</span>
          <span class="lib-card-read-more">READ FULL ARTICLE</span>
        </div>
      `;

      card.addEventListener('click', () => {
        openArticle(art.filename, `ARTICLE ${art.id} — ${art.tag.toUpperCase()}`);
      });

      grid.appendChild(card);
    });

  }

  function initCalculator() {
    const tabBtns = document.querySelectorAll('.calc-tab-btn');
    const tabContents = document.querySelectorAll('.calc-tab-content');
    
    // Tab switching logic
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const targetTab = btn.dataset.tab;
        tabContents.forEach(content => {
          if (content.id === `tab-${targetTab}`) {
            content.classList.add('active');
          } else {
            content.classList.remove('active');
          }
        });
      });
    });

    // Sliders list
    const sliders = [
      { id: 'slider-car', valId: 'val-car', suffix: ' mi' },
      { id: 'slider-flights', valId: 'val-flights', format: (val) => `${val} flight${val === 1 ? '' : 's'}` },
      { id: 'slider-transit', valId: 'val-transit', suffix: ' mi' },
      { id: 'slider-electricity', valId: 'val-electricity', prefix: '$' },
      { id: 'slider-clean-energy', valId: 'val-clean-energy', suffix: '%' },
      { id: 'slider-local', valId: 'val-local', suffix: '%' },
      { id: 'slider-waste', valId: 'val-waste', suffix: '%' }
    ];

    // Bind slider input events
    sliders.forEach(s => {
      const sliderEl = document.getElementById(s.id);
      const valEl = document.getElementById(s.valId);
      if (sliderEl && valEl) {
        sliderEl.addEventListener('input', () => {
          const val = parseInt(sliderEl.value);
          if (s.format) {
            valEl.textContent = s.format(val);
          } else if (s.prefix) {
            valEl.textContent = `${s.prefix}${val}`;
          } else if (s.suffix) {
            valEl.textContent = `${val}${s.suffix}`;
          } else {
            valEl.textContent = val;
          }
          calculateCarbonFootprint();
        });
      }
    });

    // Segmented controls
    const segmentedControls = ['control-heating', 'control-diet'];
    segmentedControls.forEach(ctrlId => {
      const ctrl = document.getElementById(ctrlId);
      if (ctrl) {
        const btns = ctrl.querySelectorAll('.calc-segment-btn');
        btns.forEach(btn => {
          btn.addEventListener('click', () => {
            btns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            calculateCarbonFootprint();
          });
        });
      }
    });

    // Sync switch
    const syncCheckbox = document.getElementById('sync-engine-checkbox');
    if (syncCheckbox) {
      syncCheckbox.addEventListener('change', () => {
        calculateCarbonFootprint();
      });
    }

    // Run initial calculation
    calculateCarbonFootprint();
  }

  function calculateCarbonFootprint() {
    // 1. Gather values
    const carMiles = parseFloat(document.getElementById('slider-car')?.value || 0);
    const flights = parseFloat(document.getElementById('slider-flights')?.value || 0);
    const transitMiles = parseFloat(document.getElementById('slider-transit')?.value || 0);
    const electricityBill = parseFloat(document.getElementById('slider-electricity')?.value || 0);
    const cleanEnergyShare = parseFloat(document.getElementById('slider-clean-energy')?.value || 0);
    
    let heatingFuel = 'gas';
    const heatingActiveBtn = document.querySelector('#control-heating .calc-segment-btn.active');
    if (heatingActiveBtn) {
      heatingFuel = heatingActiveBtn.dataset.val;
    }
    
    let dietProfile = 'average';
    const dietActiveBtn = document.querySelector('#control-diet .calc-segment-btn.active');
    if (dietActiveBtn) {
      dietProfile = dietActiveBtn.dataset.val;
    }
    
    const localShare = parseFloat(document.getElementById('slider-local')?.value || 0);
    const foodWaste = parseFloat(document.getElementById('slider-waste')?.value || 0);

    // 2. Perform math (Annual in tonnes, then convert to Daily in kg)
    // Transport
    const carEmissions = carMiles * 52 * 0.00035;
    const flightEmissions = flights * 0.4;
    const transitEmissions = transitMiles * 52 * 0.0001;
    const transportTotal = carEmissions + flightEmissions + transitEmissions;

    // Energy
    const electricityBase = (electricityBill * 12 / 0.15) * 0.00038;
    const electricityEmissions = electricityBase * (1 - cleanEnergyShare / 100);
    
    let heatingEmissions = 1.2; // default gas
    if (heatingFuel === 'electric') heatingEmissions = 0.3;
    else if (heatingFuel === 'coal') heatingEmissions = 2.8;
    const energyTotal = electricityEmissions + heatingEmissions;

    // Diet
    let dietBase = 1.6; // default average
    if (dietProfile === 'heavy-meat') dietBase = 2.8;
    else if (dietProfile === 'vegetarian') dietBase = 0.8;
    
    const localReduction = 1 - 0.15 * (localShare / 100);
    const wasteIncrease = 0.40 * (foodWaste / 50);
    const dietTotal = dietBase * (localReduction + wasteIncrease);

    // Grand Total Annual in tonnes
    const grandTotalAnnualTonnes = transportTotal + energyTotal + dietTotal;
    
    // Grand Total Daily in kg CO2e
    const grandTotalDailyKg = (grandTotalAnnualTonnes * 1000) / 365;

    // 3. Update DOM readout
    const resultCo2El = document.getElementById('result-co2');
    if (resultCo2El) {
      resultCo2El.textContent = grandTotalDailyKg.toFixed(1);
    }

    // 4. Update progress bar (0 - 55 kg CO2e / day)
    const meterFillBar = document.getElementById('meter-fill-bar');
    if (meterFillBar) {
      const percentage = Math.min(100, Math.max(0, (grandTotalDailyKg / 55) * 100));
      meterFillBar.style.width = `${percentage}%`;
    }

    // Determine stage based on daily emissions (0-11: Stage 1, 11-22: Stage 2, 22-33: Stage 3, 33-44: Stage 4, 44+: Stage 5)
    let stage = 1;
    if (grandTotalDailyKg < 11.0) stage = 1;
    else if (grandTotalDailyKg < 22.0) stage = 2;
    else if (grandTotalDailyKg < 33.0) stage = 3;
    else if (grandTotalDailyKg < 44.0) stage = 4;
    else stage = 5;

    // Calculate category daily values (convert annual tonnes to daily kg)
    const transportDaily = (transportTotal * 1000) / 365;
    const energyDaily = (energyTotal * 1000) / 365;
    const dietDaily = (dietTotal * 1000) / 365;

    let highestCategory = 'transport';
    let highestVal = transportDaily;

    if (energyDaily > highestVal) {
      highestCategory = 'energy';
      highestVal = energyDaily;
    }
    if (dietDaily > highestVal) {
      highestCategory = 'diet';
      highestVal = dietDaily;
    }

    // Build personalized actionable reduction insights
    let personalizedInsight = '';
    if (highestCategory === 'transport') {
      personalizedInsight = '\n\n💡 RECOMMENDED ACTION: Your transport emissions are your largest impact source. Try reducing weekly driving by 30 miles (saves ~11 kg CO₂e/day) or replacing one flight with a train ride.';
    } else if (highestCategory === 'energy') {
      personalizedInsight = '\n\n💡 RECOMMENDED ACTION: Your home energy is the main emissions source. Increasing clean electricity share or switching heating fuel to electric saves up to ~8 kg CO₂e/day.';
    } else {
      personalizedInsight = '\n\n💡 RECOMMENDED ACTION: Food choices are driving your footprint. Adopting a vegetarian profile or lowering waste by 10% can systematically reduce emissions by ~6 kg CO₂e/day.';
    }

    // 5. Update feedback card with dynamic captions matching the stage danger
    const gradeTextEl = document.getElementById('feedback-grade-text');
    const descTextEl = document.getElementById('feedback-desc-text');
    if (gradeTextEl && descTextEl) {
      if (stage === 1) {
        gradeTextEl.textContent = 'STAGE 1: LUSH & SAFE';
        descTextEl.textContent = 'With per-person emissions this low, ecosystems stay in balance: forests grow, rivers run clear, and most species can adapt to local conditions.';
      } else if (stage === 2) {
        gradeTextEl.textContent = 'STAGE 2: EARLY DAMAGE';
        descTextEl.textContent = 'Damage is visible but local: trees shed leaves out of season, lakes and rivers develop algal blooms, and bird migrations shift by days to weeks.';
      } else if (stage === 3) {
        gradeTextEl.textContent = 'STAGE 3: TIPPING POINT';
        descTextEl.textContent = 'The climate has crossed regional tipping points: 70–90% of warm-water coral reefs lost, half of all tree species show drought stress, and once-a-decade heat waves now hit every 2–3 years.';
      } else if (stage === 4) {
        gradeTextEl.textContent = 'STAGE 4: SEVERE DAMAGE';
        descTextEl.textContent = 'Severe damage: wildfire seasons months longer, plankton declines at the base of ocean food webs, and the first human-caused permanent extinctions of mammals and amphibians.';
      } else {
        gradeTextEl.textContent = 'STAGE 5: COLLAPSE';
        descTextEl.textContent = 'Total collapse: parts of the Amazon flip from rainforest to savanna, multi-meter sea-level rise locks in over centuries, and large regions of farmland can no longer grow traditional crops.';
      }
      descTextEl.textContent += personalizedInsight;
    }

    // 6. Sync with environmental engine if checked
    const syncCheckbox = document.getElementById('sync-engine-checkbox');
    if (syncCheckbox && syncCheckbox.checked) {
      // Map 5.5 kg/day - 44.0 kg/day to 0.0 - 1.0 pollution factor
      let factor = 0;
      if (grandTotalDailyKg <= 5.5) {
        factor = 0;
      } else if (grandTotalDailyKg >= 44.0) {
        factor = 1;
      } else {
        factor = (grandTotalDailyKg - 5.5) / (44.0 - 5.5);
      }

      state.pollutionFactor = factor;
      document.documentElement.style.setProperty('--pollution-factor', factor);

      // Update palette slider
      const pollutionSlider = document.getElementById('pollution-slider');
      const sliderValLabel = document.getElementById('slider-val-label');
      if (pollutionSlider) {
        pollutionSlider.value = Math.round(factor * 100);
      }
      if (sliderValLabel) {
        sliderValLabel.textContent = `${Math.round(factor * 100)}%`;
      }

      // Re-apply palette visual variables
      if (typeof applyPalette === 'function') {
        applyPalette();
      }
    }
  }

  function initCalculatorReveal() {
    // --- 1. Split the section title into per-letter spans ---
    const title = document.querySelector('#calculator-section .section-title');
    if (!title) return;

    const originalText = title.textContent.trim();
    title.textContent = ''; // clear
    title.setAttribute('aria-label', originalText);

    const words = originalText.split(' ');
    words.forEach((word, wi) => {
      const wordSpan = document.createElement('span');
      wordSpan.classList.add('word');
      wordSpan.setAttribute('aria-hidden', 'true');

      for (let i = 0; i < word.length; i++) {
        const letterSpan = document.createElement('span');
        letterSpan.classList.add('letter');
        letterSpan.textContent = word[i];
        wordSpan.appendChild(letterSpan);
      }
      title.appendChild(wordSpan);
    });

    const allLetters = title.querySelectorAll('.letter');

    // --- 2. Mark calculator panels and inner groups for reveal ---
    const inputPanel = document.querySelector('#calculator-section .input-panel');
    const outputPanel = document.querySelector('#calculator-section .output-panel');
    const calcGrid = document.querySelector('#calculator-section .calculator-grid');

    const revealElements = [];

    if (inputPanel) {
      inputPanel.classList.add('calc-reveal');
      revealElements.push(inputPanel);
    }
    if (outputPanel) {
      outputPanel.classList.add('calc-reveal');
      revealElements.push(outputPanel);
    }

    // --- 3. Create the GSAP timeline (paused) ---
    const tl = gsap.timeline({ paused: true });

    // Letters float upward with stagger
    tl.to(allLetters, {
      y: 0,
      opacity: 1,
      duration: 0.7,
      ease: 'power3.out',
      stagger: {
        each: 0.04,
        from: 'start'
      }
    });

    // Panels slide up (staggered, overlapping with letters)
    if (revealElements.length > 0) {
      tl.to(revealElements, {
        y: 0,
        opacity: 1,
        duration: 0.9,
        ease: 'power2.out',
        stagger: 0.15
      }, '-=0.3');
    }

    // --- 4. Trigger with IntersectionObserver ---
    const section = document.getElementById('calculator-section');
    if (!section) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          tl.play();
          observer.unobserve(section);
        }
      });
    }, { threshold: 0.15 });
    observer.observe(section);
  }

  /* =========================================
     SMOOTH SCROLLING & SCROLLSTACK ANIMATION
     ========================================= */
  /* =========================================
     SMOOTH SCROLLING & SCROLLSTACK ANIMATION
     ========================================= */
  let cards = [];

  function getStickyParams() {
    const w = window.innerWidth;
    if (w <= 480) {
      return { stickyTopPx: 80 };
    } else if (w <= 768) {
      return { stickyTopPx: 90 };
    } else {
      return { stickyTopPx: 110 };
    }
  }

  function initScrollStack() {
    const scroller = document.querySelector('.scroll-stack-scroller');
    if (!scroller) return;

    cards = Array.from(scroller.querySelectorAll('.scroll-stack-card'));
    if (!cards.length) return;

    // Set origin and GPU promotion for smooth rendering
    cards.forEach((card) => {
      card.style.willChange = 'transform';
      card.style.transformOrigin = 'center center'; // Rotate from center for best kinetic feel
      card.style.backfaceVisibility = 'hidden';
    });

    cards.forEach((card, i) => {
      // 1. For card index > 0: Animate its entry (starts rotated & slightly scaled down,
      // and straightens out to scale 1 / rotation 0 when it locks into its sticky position)
      if (i > 0) {
        const isLeft = (i % 2 !== 0);
        const startRot = isLeft ? -4.5 : 4.5;
        const startX = isLeft ? -50 : 50;

        gsap.fromTo(card, 
          { 
            rotation: startRot,
            x: startX,
            scale: 0.95
          },
          {
            rotation: 0,
            x: 0,
            scale: 1,
            scrollTrigger: {
              trigger: card,
              start: 'top 95%', // begins animating as soon as card top enters viewport
              end: () => `top ${getStickyParams().stickyTopPx}px`, // ends precisely when it hits its CSS sticky position
              scrub: true,
              invalidateOnRefresh: true
            }
          }
        );
      }

      // 2. For card index < last: Animate the card underneath to scale down and fade out
      // completely (opacity: 0) as the next card stacks on top of it.
      if (i < cards.length - 1) {
        const nextCard = cards[i + 1];
        
        gsap.to(card, {
          scale: 0.93,
          opacity: 0, // fade out completely so bottom card doesn't show translucently
          scrollTrigger: {
            trigger: nextCard,
            start: 'top 82%', // start fading out as the stacking card is scrolling up
            end: () => `top ${getStickyParams().stickyTopPx}px`, // completely invisible when next card pins
            scrub: true,
            invalidateOnRefresh: true
          }
        });
      }
    });
  }

  /* =========================================
     MARKDOWN PARSING & ARTICLE MODAL
     ========================================= */
  function parseMarkdownToHTML(markdown) {
    let cleanMd = markdown.replace(/^---[\s\S]*?---/, '');

    // Escape HTML characters
    cleanMd = cleanMd
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Process headings
    cleanMd = cleanMd.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');
    cleanMd = cleanMd.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
    cleanMd = cleanMd.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');

    // Bold text
    cleanMd = cleanMd.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Parse links: [Text](URL)
    cleanMd = cleanMd.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // Blockquotes
    cleanMd = cleanMd.replace(/^>\s+\[!(IMPORTANT|NOTE|WARNING|TIP|CAUTION)\]\s*$/gm, '');
    cleanMd = cleanMd.replace(/^>\s+(.+)$/gm, '<blockquote>$1</blockquote>');
    cleanMd = cleanMd.replace(/<\/blockquote>\n<blockquote>/g, '<br>');

    // Tables
    const lines = cleanMd.split('\n');
    let inTable = false;
    let tableHtml = '';
    const outputLines = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('|') && line.endsWith('|')) {
        if (!inTable) {
          inTable = true;
          tableHtml = '<table><thead>';
        }
        if (line.match(/^\|[\s-:-|]+$/)) {
          tableHtml = tableHtml.replace('<thead>', '').replace('</thead>', '');
          tableHtml = '<table><thead>' + tableHtml + '</thead><tbody>';
          continue;
        }

        const cells = line.split('|').map(c => c.trim()).filter((c, idx, arr) => idx > 0 && idx < arr.length - 1);
        const cellTag = tableHtml.includes('<tbody>') ? 'td' : 'th';
        
        tableHtml += '<tr>';
        cells.forEach(cell => {
          tableHtml += `<${cellTag}>${cell}</${cellTag}>`;
        });
        tableHtml += '</tr>';
      } else {
        if (inTable) {
          inTable = false;
          if (tableHtml.includes('<tbody>')) {
            tableHtml += '</tbody></table>';
          } else {
            tableHtml += '</table>';
          }
          outputLines.push(tableHtml);
          tableHtml = '';
        }
        outputLines.push(lines[i]);
      }
    }
    if (inTable) {
      if (tableHtml.includes('<tbody>')) {
        tableHtml += '</tbody></table>';
      } else {
        tableHtml += '</table>';
      }
      outputLines.push(tableHtml);
    }
    cleanMd = outputLines.join('\n');

    // Bullet lists
    cleanMd = cleanMd.replace(/^\s*-\s+(.+)$/gm, '<li>$1</li>');
    
    // Wrap lists in <ul> tags
    const finalLines = cleanMd.split('\n');
    let inList = false;
    const parsedLines = [];
    for (let i = 0; i < finalLines.length; i++) {
      const line = finalLines[i];
      if (line.trim().startsWith('<li>') && line.trim().endsWith('</li>')) {
        if (!inList) {
          inList = true;
          parsedLines.push('<ul>');
        }
        parsedLines.push(line);
      } else {
        if (inList) {
          inList = false;
          parsedLines.push('</ul>');
        }
        parsedLines.push(line);
      }
    }
    if (inList) {
      parsedLines.push('</ul>');
    }
    cleanMd = parsedLines.join('\n');

    // Paragraph wrapping for loose lines
    const paragraphs = cleanMd.split(/\n\n+/);
    const result = paragraphs.map(p => {
      const trimmed = p.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('<h') || trimmed.startsWith('<table') || trimmed.startsWith('<ul') || trimmed.startsWith('<blockquote') || trimmed.startsWith('<hr')) {
        return trimmed;
      }
      return `<p>${trimmed.replace(/\n/g, '<br>')}</p>`;
    });

    return result.join('\n');
  }

  async function openArticle(filename, tagText) {
    const modal = document.getElementById('article-modal');
    const modalBody = document.getElementById('modal-body');
    const modalTag = document.getElementById('modal-article-tag');
    if (!modal || !modalBody || !modalTag) return;

    modalTag.textContent = tagText || "ARTICLE READ";
    modalBody.innerHTML = '<div style="display:flex; justify-content:center; align-items:center; height:200px; font-family:var(--font-mono); color:var(--text-secondary); font-size:0.8rem;">LOADING ARTICLE CONTENT...</div>';

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('scroll-locked');

    try {
      const response = await fetch('content/articles/' + filename);
      if (!response.ok) throw new Error("Article file not found");
      const markdown = await response.text();
      const htmlContent = parseMarkdownToHTML(markdown);
      modalBody.innerHTML = htmlContent;
    } catch (err) {
      modalBody.innerHTML = `
        <div style="padding: 2rem; border: 1px dashed rgba(239, 68, 68, 0.2); border-radius: 12px; background: rgba(239, 68, 68, 0.05); color: #f87171; text-align: center;">
          <h3 style="margin-bottom: 0.5rem; font-family:var(--font-mono); color:#ef4444;">Failed to load article</h3>
          <p style="font-size:0.82rem; margin-bottom: 0; color:#fca5a5;">Error details: ${err.message}</p>
        </div>
      `;
    }
  }

  function initArticleModal() {
    const modal = document.getElementById('article-modal');
    const closeBtn = document.getElementById('modal-close');
    const backdrop = modal ? modal.querySelector('.modal-backdrop') : null;

    if (!modal || !closeBtn) return;

    const cards = document.querySelectorAll('.scroll-stack-card.article-card');
    cards.forEach(card => {
      const readBtn = card.querySelector('.read-btn');
      const filename = card.getAttribute('data-article');
      const tagText = card.querySelector('.card-tag')?.textContent;
      if (readBtn && filename) {
        readBtn.addEventListener('click', () => {
          openArticle(filename, tagText);
        });
      }
    });

    const closeModal = () => {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('scroll-locked');
    };

    closeBtn.addEventListener('click', closeModal);
    if (backdrop) {
      backdrop.addEventListener('click', closeModal);
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('open')) {
        closeModal();
      }
    });
  }

  function init() {
    initCanvas();
    setupDOMListeners();
    initAssemblyGrid();
    initPaletteEngine();
    initCalculator();
    initCalculatorReveal();
    initScrollStack();
    initArticleModal();
    initArticlesLibrary();
    initGlassSurfaces();
  }

  // Public functions exposed
  return {
    init
  };
})();

// Initialize on DOM load
window.addEventListener('DOMContentLoaded', app.init);
