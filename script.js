/**
 * NOVA Virtual Dollar Card - Interactive Logic & LocalStorage Persistence
 * Handles:
 *  - Persistent card state (Cardholder, Balance, Spending Velocity, Freeze Lock)
 *  - Interactive Card Freeze Toggle
 *  - Dynamic CVV token countdown & renewal
 *  - Card issuance & settings modal
 *  - Mobile menu toggle & smooth navigation
 */

(function () {
  'use strict';

  // LocalStorage Key
  const STORAGE_KEY = 'nova_virtual_dollar_card_state';

  // Default State matching original design
  const DEFAULT_STATE = {
    cardholderName: 'CHINEME WORLU',
    balance: 4250.00,
    limit: 5000.00,
    spent: 3200.00,
    isFrozen: false,
    cvv: '834'
  };

  // Current Application State
  let appState = { ...DEFAULT_STATE };

  // DOM Elements Cache
  const elements = {
    // Freeze toggle
    cardFreezeToggle: document.getElementById('card-freeze-toggle'),
    cardFreezeText: document.getElementById('card-freeze-text'),
    velocityBar: document.getElementById('velocity-bar'),
    velocityText: document.getElementById('velocity-text'),
    
    // CVV elements
    cvvValue: document.getElementById('cvv-value'),
    cvvTimer: document.getElementById('cvv-timer'),

    // Modal elements
    cardModal: document.getElementById('card-modal'),
    modalCloseBtn: document.getElementById('modal-close-btn'),
    cardSettingsForm: document.getElementById('card-settings-form'),
    inputCardholder: document.getElementById('input-cardholder'),
    inputBalance: document.getElementById('input-balance'),
    inputLimit: document.getElementById('input-limit'),
    inputSpendRange: document.getElementById('input-spend-range'),
    spendRangeVal: document.getElementById('spend-range-val'),
    limitRangeVal: document.getElementById('limit-range-val'),
    inputFreezeCard: document.getElementById('input-freeze-card'),
    btnResetDefaults: document.getElementById('btn-reset-defaults'),

    // CTA Triggers to open modal
    navCtaBtn: document.getElementById('nav-cta-btn'),
    mobileCtaBtn: document.getElementById('mobile-cta-btn'),
    heroGetCardBtn: document.getElementById('hero-get-card-btn'),
    ctaActionBtn: document.getElementById('cta-action-btn'),
    openSigninBtn: document.getElementById('open-signin-btn'),
    step1Link: document.getElementById('step1-link'),
    step2Link: document.getElementById('step2-link'),

    // Mobile nav
    mobileToggle: document.getElementById('mobile-toggle'),
    mobileDrawer: document.getElementById('mobile-drawer'),

    // Toast
    toast: document.getElementById('toast'),

    // Navigation links
    navLinks: document.querySelectorAll('.nav-link')
  };

  /* --------------------------------------------------------------------------
     State & LocalStorage Management
     -------------------------------------------------------------------------- */
  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        appState = { ...DEFAULT_STATE, ...parsed };
      }
    } catch (e) {
      console.warn('Could not load NOVA state from localStorage:', e);
      appState = { ...DEFAULT_STATE };
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
    } catch (e) {
      console.warn('Could not save NOVA state to localStorage:', e);
    }
  }

  function updateUI() {
    // 1. Update Freeze Button
    if (elements.cardFreezeToggle && elements.cardFreezeText) {
      if (appState.isFrozen) {
        elements.cardFreezeToggle.classList.remove('unlocked');
        elements.cardFreezeToggle.classList.add('frozen');
        elements.cardFreezeText.textContent = 'Card Frozen';
      } else {
        elements.cardFreezeToggle.classList.remove('frozen');
        elements.cardFreezeToggle.classList.add('unlocked');
        elements.cardFreezeText.textContent = 'Instant Unlocked';
      }
    }

    // 2. Update Velocity Progress Bar & Text
    if (elements.velocityBar && elements.velocityText) {
      const percentage = Math.min(100, Math.max(0, (appState.spent / appState.limit) * 100));
      elements.velocityBar.style.width = `${percentage}%`;
      elements.velocityText.textContent = `Monthly spend velocity: $${Number(appState.spent).toLocaleString()} / $${Number(appState.limit).toLocaleString()}`;
    }

    // 3. Update Modal Inputs
    if (elements.inputCardholder) elements.inputCardholder.value = appState.cardholderName;
    if (elements.inputBalance) elements.inputBalance.value = appState.balance;
    if (elements.inputLimit) {
      elements.inputLimit.value = appState.limit;
      if (elements.inputSpendRange) elements.inputSpendRange.max = appState.limit;
      if (elements.limitRangeVal) elements.limitRangeVal.textContent = Number(appState.limit).toLocaleString();
    }
    if (elements.inputSpendRange) {
      elements.inputSpendRange.value = appState.spent;
      if (elements.spendRangeVal) elements.spendRangeVal.textContent = Number(appState.spent).toLocaleString();
    }
    if (elements.inputFreezeCard) elements.inputFreezeCard.checked = appState.isFrozen;
  }

  /* --------------------------------------------------------------------------
     Toast Notification Helper
     -------------------------------------------------------------------------- */
  let toastTimeout;
  function showToast(message) {
    if (!elements.toast) return;
    elements.toast.textContent = message;
    elements.toast.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      elements.toast.classList.remove('show');
    }, 3000);
  }

  /* --------------------------------------------------------------------------
     Interactive Card Freeze Toggle
     -------------------------------------------------------------------------- */
  if (elements.cardFreezeToggle) {
    elements.cardFreezeToggle.addEventListener('click', () => {
      appState.isFrozen = !appState.isFrozen;
      saveState();
      updateUI();
      showToast(appState.isFrozen ? '❄ Card locked. Transactions temporarily restricted.' : '✓ Card unlocked. Ready for global spending.');
    });
  }

  /* --------------------------------------------------------------------------
     Modal Handlers (Open, Close, Submit, Reset)
     -------------------------------------------------------------------------- */
  function openModal() {
    updateUI();
    if (elements.cardModal) {
      elements.cardModal.classList.add('open');
      elements.cardModal.setAttribute('aria-hidden', 'false');
    }
  }

  function closeModal() {
    if (elements.cardModal) {
      elements.cardModal.classList.remove('open');
      elements.cardModal.setAttribute('aria-hidden', 'true');
    }
  }

  const modalTriggers = [
    elements.navCtaBtn,
    elements.mobileCtaBtn,
    elements.heroGetCardBtn,
    elements.ctaActionBtn,
    elements.openSigninBtn,
    elements.step1Link,
    elements.step2Link
  ];

  modalTriggers.forEach(btn => {
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        openModal();
      });
    }
  });

  if (elements.modalCloseBtn) {
    elements.modalCloseBtn.addEventListener('click', closeModal);
  }

  if (elements.cardModal) {
    elements.cardModal.addEventListener('click', (e) => {
      if (e.target === elements.cardModal) {
        closeModal();
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && elements.cardModal && elements.cardModal.classList.contains('open')) {
      closeModal();
    }
  });

  // Modal Range Input Synchronization
  if (elements.inputSpendRange) {
    elements.inputSpendRange.addEventListener('input', (e) => {
      if (elements.spendRangeVal) {
        elements.spendRangeVal.textContent = Number(e.target.value).toLocaleString();
      }
    });
  }

  if (elements.inputLimit) {
    elements.inputLimit.addEventListener('input', (e) => {
      const newLimit = parseFloat(e.target.value) || 5000;
      if (elements.inputSpendRange) elements.inputSpendRange.max = newLimit;
      if (elements.limitRangeVal) elements.limitRangeVal.textContent = Number(newLimit).toLocaleString();
    });
  }

  // Modal Form Submission
  if (elements.cardSettingsForm) {
    elements.cardSettingsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      appState.cardholderName = elements.inputCardholder.value.trim().toUpperCase() || 'CHINEME WORLU';
      appState.balance = parseFloat(elements.inputBalance.value) || 4250.00;
      appState.limit = parseFloat(elements.inputLimit.value) || 5000.00;
      appState.spent = parseFloat(elements.inputSpendRange.value) || 3200.00;
      appState.isFrozen = elements.inputFreezeCard.checked;

      saveState();
      updateUI();
      closeModal();
      showToast('✓ Card settings saved to LocalStorage');
    });
  }

  // Reset to Defaults
  if (elements.btnResetDefaults) {
    elements.btnResetDefaults.addEventListener('click', () => {
      appState = { ...DEFAULT_STATE };
      saveState();
      updateUI();
      showToast('Reset to original default settings');
    });
  }

  /* --------------------------------------------------------------------------
     Dynamic CVV Countdown Generator
     -------------------------------------------------------------------------- */
  let cvvSeconds = 42;
  function startCVVCounter() {
    if (!elements.cvvTimer || !elements.cvvValue) return;

    setInterval(() => {
      cvvSeconds--;
      if (cvvSeconds <= 0) {
        cvvSeconds = 45;
        // Generate new 3-digit CVV
        const newCVV = Math.floor(100 + Math.random() * 900).toString();
        appState.cvv = newCVV;
        elements.cvvValue.textContent = newCVV;
        saveState();
      }
      elements.cvvTimer.textContent = cvvSeconds;
    }, 1000);
  }

  /* --------------------------------------------------------------------------
     Mobile Drawer Navigation
     -------------------------------------------------------------------------- */
  if (elements.mobileToggle && elements.mobileDrawer) {
    elements.mobileToggle.addEventListener('click', () => {
      elements.mobileDrawer.classList.toggle('open');
      elements.mobileToggle.classList.toggle('active');
    });

    // Close mobile drawer when clicking any link
    const drawerLinks = elements.mobileDrawer.querySelectorAll('.drawer-link, .drawer-actions button');
    drawerLinks.forEach(link => {
      link.addEventListener('click', () => {
        elements.mobileDrawer.classList.remove('open');
        elements.mobileToggle.classList.remove('active');
      });
    });
  }

  /* --------------------------------------------------------------------------
     Smooth Scroll & Active Nav Link Highlighting
     -------------------------------------------------------------------------- */
  const sections = document.querySelectorAll('section[id]');
  window.addEventListener('scroll', () => {
    const scrollY = window.pageYOffset;

    sections.forEach(section => {
      const sectionHeight = section.offsetHeight;
      const sectionTop = section.offsetTop - 120;
      const sectionId = section.getAttribute('id');

      if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
        elements.navLinks.forEach(link => {
          if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    });
  });

  /* --------------------------------------------------------------------------
     Interactive 3D Mouse Parallax Tilt for Hero Card
     -------------------------------------------------------------------------- */
  const heroVisual = document.querySelector('.hero-visual');
  const heroMockup = document.querySelector('.hero-mockup-wrapper');

  if (heroVisual && heroMockup) {
    heroVisual.addEventListener('mousemove', (e) => {
      const rect = heroVisual.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      
      const tiltX = (y / (rect.height / 2)) * -8;
      const tiltY = (x / (rect.width / 2)) * 8;

      heroMockup.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-8px)`;
    });

    heroVisual.addEventListener('mouseleave', () => {
      heroMockup.style.transform = '';
      heroMockup.style.transition = 'transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)';
      setTimeout(() => {
        heroMockup.style.transition = '';
      }, 600);
    });
  }

  /* --------------------------------------------------------------------------
     Testimonials Slider Carousel
     -------------------------------------------------------------------------- */
  const testimonialsWrapper = document.querySelector('.testimonials-cards-wrapper');
  const testimonialsTrack = document.querySelector('.testimonials-track');
  const prevArrow = document.querySelector('.testimonial-arrow-prev');
  const nextArrow = document.querySelector('.testimonial-arrow-next');
  const dotsContainer = document.querySelector('.testimonial-dots');

  if (testimonialsWrapper && testimonialsTrack && dotsContainer) {
    const cards = Array.from(testimonialsTrack.querySelectorAll('.testimonial-card'));
    const CARD_COUNT = cards.length;
    const canAutoAdvance = CARD_COUNT > 1;
    const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const TRANSITION = 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)';
    const AUTOPLAY_DELAY = 5000;
    const RESUME_DELAY = 6000;

    let currentIndex = 0;
    let slideStep = 0;
    let isDragging = false;
    let isUserPaused = false;
    let isHoverPaused = false;
    let autoplayTimer = null;
    let resumeTimer = null;
    let wrapTimer = null;
    let activePointerId = null;
    let startX = 0;
    let dragBase = 0;
    let currentTranslate = 0;

    // Clone first/last cards so the track can loop seamlessly
    if (canAutoAdvance) {
      const lastClone = cards[CARD_COUNT - 1].cloneNode(true);
      const firstClone = cards[0].cloneNode(true);
      lastClone.setAttribute('aria-hidden', 'true');
      firstClone.setAttribute('aria-hidden', 'true');
      testimonialsTrack.appendChild(firstClone);
      testimonialsTrack.prepend(lastClone);
    }

    function getSlideStep() {
      const firstCard = testimonialsTrack.querySelector('.testimonial-card');
      if (!firstCard) return 0;
      const gap = parseFloat(getComputedStyle(testimonialsTrack).columnGap || '0') || 0;
      return firstCard.offsetWidth + gap;
    }

    function setTransform(translate, animate) {
      if (animate) {
        testimonialsTrack.style.transition = TRANSITION;
      } else {
        testimonialsTrack.style.transition = 'none';
      }
      currentTranslate = translate;
      testimonialsTrack.style.transform = `translate3d(${translate}px, 0, 0)`;
    }

    function goTo(realIndex) {
      if (CARD_COUNT <= 1) return;
      clearTimeout(wrapTimer);

      if (realIndex < 0) {
        // Wrap left: glide onto the cloned last card, then snap to the real one
        setTransform(0, true);
        wrapTimer = setTimeout(() => {
          if (isDragging) return;
          currentIndex = CARD_COUNT - 1;
          setTransform(-CARD_COUNT * slideStep, false);
          updateDots();
        }, 380);
      } else if (realIndex >= CARD_COUNT) {
        // Wrap right: glide onto the cloned first card, then snap to the real one
        setTransform(-(CARD_COUNT + 1) * slideStep, true);
        wrapTimer = setTimeout(() => {
          if (isDragging) return;
          currentIndex = 0;
          setTransform(-slideStep, false);
          updateDots();
        }, 380);
      } else {
        currentIndex = realIndex;
        setTransform(-(realIndex + 1) * slideStep, true);
        updateDots();
      }
    }

    function updateDots() {
      if (!dotsContainer) return;
      dotsContainer.querySelectorAll('.testimonial-dot').forEach((dot, i) => {
        const active = i === currentIndex;
        dot.classList.toggle('is-active', active);
        dot.setAttribute('aria-selected', active ? 'true' : 'false');
      });
    }

    function buildDots() {
      if (!dotsContainer) return;
      dotsContainer.innerHTML = '';
      if (!canAutoAdvance) {
        dotsContainer.style.display = 'none';
        return;
      }
      dotsContainer.style.display = 'flex';
      for (let i = 0; i < CARD_COUNT; i++) {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'testimonial-dot' + (i === 0 ? ' is-active' : '');
        dot.setAttribute('role', 'tab');
        dot.setAttribute('aria-label', `Go to testimonial ${i + 1}`);
        dot.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
        dot.dataset.index = String(i);
        dotsContainer.appendChild(dot);
      }
    }

    function pauseAutoplay(temporary) {
      if (autoplayTimer) {
        clearInterval(autoplayTimer);
        autoplayTimer = null;
      }
      if (temporary) {
        clearTimeout(resumeTimer);
        resumeTimer = setTimeout(() => {
          if (!isHoverPaused && !isUserPaused) startAutoplay();
        }, RESUME_DELAY);
      } else {
        isUserPaused = true;
      }
    }

    function startAutoplay() {
      if (autoplayTimer || !canAutoAdvance || isUserPaused || isHoverPaused || reducedMotion) return;
      autoplayTimer = setInterval(() => {
        goTo(currentIndex + 1);
      }, AUTOPLAY_DELAY);
    }

    function recomputeLayout() {
      slideStep = getSlideStep();
      if (!isDragging) {
        setTransform(-(currentIndex + 1) * slideStep, false);
      }
    }

    // Build dots & run initial layout
    buildDots();

    if (canAutoAdvance && prevArrow && nextArrow) {
      prevArrow.removeAttribute('disabled');
      nextArrow.removeAttribute('disabled');
      prevArrow.addEventListener('click', () => {
        pauseAutoplay(false);
        goTo(currentIndex - 1);
      });
      nextArrow.addEventListener('click', () => {
        pauseAutoplay(false);
        goTo(currentIndex + 1);
      });
    } else {
      if (prevArrow) prevArrow.style.display = 'none';
      if (nextArrow) nextArrow.style.display = 'none';
    }

    if (dotsContainer) {
      dotsContainer.addEventListener('click', (e) => {
        const dot = e.target.closest('.testimonial-dot');
        if (!dot) return;
        pauseAutoplay(false);
        goTo(parseInt(dot.dataset.index, 10));
      });
    }

    // Swipe / drag support (pointer events cover mouse + touch)
    testimonialsWrapper.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (CARD_COUNT <= 1) return;
      if (e.pointerType === 'mouse' && e.target.closest('.testimonial-arrow')) return;

      isDragging = true;
      activePointerId = e.pointerId;
      startX = e.clientX;
      dragBase = currentTranslate;
      clearTimeout(wrapTimer);
      pauseAutoplay(true);
      testimonialsTrack.classList.add('is-dragging');
      try {
        testimonialsWrapper.setPointerCapture(e.pointerId);
      } catch (err) { /* pointer capture not supported */ }
    });

    testimonialsWrapper.addEventListener('pointermove', (e) => {
      if (!isDragging || e.pointerId !== activePointerId) return;
      const delta = e.clientX - startX;
      setTransform(dragBase + delta, false);
    });

    function endDrag(e) {
      if (!isDragging || e.pointerId !== activePointerId) return;
      isDragging = false;
      activePointerId = null;
      testimonialsTrack.classList.remove('is-dragging');

      const delta = e.clientX != null ? e.clientX - startX : 0;
      const threshold = Math.max(60, slideStep * 0.2);
      if (delta < -threshold) {
        goTo(currentIndex + 1);
      } else if (delta > threshold) {
        goTo(currentIndex - 1);
      } else {
        setTransform(-(currentIndex + 1) * slideStep, true);
      }
    }

    testimonialsWrapper.addEventListener('pointerup', endDrag);
    testimonialsWrapper.addEventListener('pointercancel', () => {
      if (!isDragging) return;
      isDragging = false;
      activePointerId = null;
      testimonialsTrack.classList.remove('is-dragging');
      setTransform(-(currentIndex + 1) * slideStep, true);
    });

    // Pause auto-advance while hovering the carousel
    testimonialsWrapper.addEventListener('mouseenter', () => {
      isHoverPaused = true;
      if (autoplayTimer) {
        clearInterval(autoplayTimer);
        autoplayTimer = null;
      }
    });
    testimonialsWrapper.addEventListener('mouseleave', () => {
      isHoverPaused = false;
      startAutoplay();
    });

    window.addEventListener('resize', recomputeLayout);

    // Initial measurement + start
    recomputeLayout();
    startAutoplay();
  }

  /* --------------------------------------------------------------------------
     Initialization
     -------------------------------------------------------------------------- */
  loadState();
  updateUI();
  startCVVCounter();

})();
