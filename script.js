/* ==========================================================
   MAISON ESTATE — script.js
   Vanilla JavaScript only. No libraries.
   Every function is called from init(), and every helper
   returns the value that the caller uses.
   ========================================================== */

'use strict';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_PATTERN = /^\+?[0-9\s()-]{7,20}$/;

/* ----------------------------------------------------------
   Small helpers
   ---------------------------------------------------------- */
function $(selector, scope = document) {
    return scope.querySelector(selector);
}

function $$(selector, scope = document) {
    return Array.from(scope.querySelectorAll(selector));
}

/* ----------------------------------------------------------
   1. PRELOADER → reveals the page
   Shows the logo for about 1.2s, slides the preloader up,
   then removes body.loading so the hero text and nav animate in.
   ---------------------------------------------------------- */
function runPreloader() {
    const preloader = $('#preloader');
    const body = document.body;

    const finishLoading = () => {
        preloader.classList.add('done');
        body.classList.remove('loading');
        setTimeout(() => preloader.remove(), 1000);
    };

    if (prefersReducedMotion) {
        finishLoading();
        return;
    }
    setTimeout(finishLoading, 1200);
}

/* ----------------------------------------------------------
   2. HEADER: solid navy with blur + shadow after 60px scroll
   ---------------------------------------------------------- */
function initHeaderScroll() {
    const header = $('#siteHeader');

    const updateHeader = () => {
        header.classList.toggle('scrolled', window.scrollY > 60);
    };

    window.addEventListener('scroll', updateHeader, { passive: true });
    updateHeader();
}

/* ----------------------------------------------------------
   3. MOBILE MENU: hamburger → X, full-screen overlay
   ---------------------------------------------------------- */
function initMobileMenu() {
    const toggle = $('#menuToggle');
    const menu = $('#mobileMenu');

    const setMenuOpen = (isOpen) => {
        toggle.classList.toggle('open', isOpen);
        menu.classList.toggle('open', isOpen);
        toggle.setAttribute('aria-expanded', String(isOpen));
        toggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
        menu.setAttribute('aria-hidden', String(!isOpen));
        document.body.classList.toggle('menu-open', isOpen);
    };

    toggle.addEventListener('click', () => {
        setMenuOpen(!menu.classList.contains('open'));
    });

    // Close the menu when a link is chosen
    $$('a', menu).forEach((link) => {
        link.addEventListener('click', () => setMenuOpen(false));
    });

    // Close with the Escape key
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            setMenuOpen(false);
        }
    });

    setMenuOpen(false);
}

/* ----------------------------------------------------------
   4. ACTIVE NAV LINK while scrolling
   ---------------------------------------------------------- */
function initActiveLinks() {
    const links = $$('.nav-links .nav-link');
    const sections = links
        .map((link) => document.getElementById(link.getAttribute('href').slice(1)))
        .filter(Boolean);

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            links.forEach((link) => {
                link.classList.toggle('active', link.getAttribute('href') === '#' + entry.target.id);
            });
        });
    }, { rootMargin: '-45% 0px -50% 0px' });

    sections.forEach((section) => observer.observe(section));
}

/* ----------------------------------------------------------
   5. SCROLL REVEAL (IntersectionObserver, observe once)
   Adds .visible when 15% of an element is on screen.
   Grid children get a 120ms stagger.
   ---------------------------------------------------------- */
function applyStagger() {
    $$('.stagger').forEach((group) => {
        Array.from(group.children).forEach((child, index) => {
            child.style.transitionDelay = (index * 120) + 'ms';
        });
    });
}

function initReveal() {
    const targets = $$('.reveal, .reveal-left, .reveal-right, .reveal-zoom');
    applyStagger();

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
        targets.forEach((el) => el.classList.add('visible'));
        return;
    }

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                obs.unobserve(entry.target); // observe once
            }
        });
    }, { threshold: 0.15 });

    targets.forEach((el) => observer.observe(el));
}

/* ----------------------------------------------------------
   6. STATS COUNT-UP (starts when the strip scrolls into view)
   ---------------------------------------------------------- */
function animateCount(el) {
    const target = Number(el.dataset.count);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const duration = 1800;
    const startTime = performance.now();

    const step = (now) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = prefix + Math.round(target * eased) + suffix;
        if (progress < 1) {
            requestAnimationFrame(step);
        }
    };

    requestAnimationFrame(step);
}

function initCounters() {
    if (prefersReducedMotion) return; // final numbers stay in the HTML

    const numbers = $$('.stat-number');
    numbers.forEach((el) => {
        el.textContent = (el.dataset.prefix || '') + '0' + (el.dataset.suffix || '');
    });

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            $$('.stat-number', entry.target).forEach(animateCount);
            obs.unobserve(entry.target);
        });
    }, { threshold: 0.4 });

    observer.observe($('#stats'));
}

/* ----------------------------------------------------------
   7. HERO PARALLAX (background moves slower than the page)
   The shift is capped so the image never shows an empty edge.
   ---------------------------------------------------------- */
function initParallax() {
    if (prefersReducedMotion) return;

    const media = $('#heroMedia');

    const updateParallax = () => {
        const shift = Math.min(window.scrollY * 0.35, window.innerHeight * 0.15);
        media.style.transform = `translate3d(0, ${shift}px, 0)`;
    };

    window.addEventListener('scroll', updateParallax, { passive: true });
    updateParallax();
}

/* ----------------------------------------------------------
   8. SEARCH CARD TABS + SUBMIT
   ---------------------------------------------------------- */
function initSearchTabs() {
    const tabs = $$('.search-tab');

    tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            tabs.forEach((other) => {
                const isActive = other === tab;
                other.classList.toggle('is-active', isActive);
                other.setAttribute('aria-selected', String(isActive));
            });
        });
    });

    // No backend: submitting the search takes the visitor to the listings
    $('#searchForm').addEventListener('submit', (event) => {
        event.preventDefault();
        $('#properties').scrollIntoView({ behavior: 'smooth' });
    });
}

/* ----------------------------------------------------------
   9. PROPERTY FILTER CHIPS (with fade animation)
   ---------------------------------------------------------- */
function initFilters() {
    const chips = $$('.chip');
    const cards = $$('.grid-item');

    chips.forEach((chip) => {
        chip.addEventListener('click', () => {
            const filter = chip.dataset.filter;

            chips.forEach((other) => {
                const isActive = other === chip;
                other.classList.toggle('is-active', isActive);
                other.setAttribute('aria-pressed', String(isActive));
            });

            cards.forEach((card) => {
                const matches = filter === 'all' || card.dataset.type === filter;
                card.classList.toggle('is-hidden', !matches);

                if (matches) {
                    // Restart the fade animation each time the card comes back
                    card.classList.remove('fade-in');
                    void card.offsetWidth;
                    card.classList.add('fade-in');
                }
            });
        });
    });
}

/* ----------------------------------------------------------
   10. FAVOURITE (heart) TOGGLE
   ---------------------------------------------------------- */
function initFavourites() {
    $$('.fav').forEach((button) => {
        button.addEventListener('click', () => {
            const isSaved = button.getAttribute('aria-pressed') === 'true';
            button.setAttribute('aria-pressed', String(!isSaved));
            button.setAttribute('aria-label', isSaved ? 'Save to favourites' : 'Saved to favourites');
        });
    });
}

/* ----------------------------------------------------------
   11. NEIGHBORHOOD SLIDER
   Prev/next buttons + mouse drag. Touch swipe works natively.
   ---------------------------------------------------------- */
function getSlideStep(track) {
    const card = $('.hood-card', track);
    const gap = parseFloat(getComputedStyle(track).columnGap) || 28;
    return card.offsetWidth + gap;
}

function initNeighborhoodSlider() {
    const track = $('#hoodTrack');
    const prevButton = $('#prevBtn');
    const nextButton = $('#nextBtn');

    prevButton.addEventListener('click', () => {
        track.scrollBy({ left: -getSlideStep(track), behavior: 'smooth' });
    });

    nextButton.addEventListener('click', () => {
        track.scrollBy({ left: getSlideStep(track), behavior: 'smooth' });
    });

    // Mouse drag support
    let isDown = false;
    let hasMoved = false;
    let startX = 0;
    let startScroll = 0;

    track.addEventListener('pointerdown', (event) => {
        if (event.pointerType !== 'mouse') return; // touch uses native swipe
        isDown = true;
        hasMoved = false;
        startX = event.clientX;
        startScroll = track.scrollLeft;
    });

    window.addEventListener('pointermove', (event) => {
        if (!isDown) return;
        const dx = event.clientX - startX;
        if (Math.abs(dx) > 4) {
            hasMoved = true;
            track.classList.add('is-dragging');
        }
        track.scrollLeft = startScroll - dx;
    });

    const endDrag = () => {
        if (!isDown) return;
        isDown = false;
        track.classList.remove('is-dragging'); // scroll-snap comes back and settles the card
    };

    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);

    // Stop the browser from dragging the images as ghost pictures
    track.addEventListener('dragstart', (event) => event.preventDefault());

    // Keyboard: arrow keys work when the track has focus
    track.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowRight') {
            event.preventDefault();
            nextButton.click();
        }
        if (event.key === 'ArrowLeft') {
            event.preventDefault();
            prevButton.click();
        }
    });

    // hasMoved is kept for clarity; a dragged release is not treated as a click.
    track.addEventListener('click', (event) => {
        if (hasMoved) {
            event.preventDefault();
            hasMoved = false;
        }
    });
}

/* ----------------------------------------------------------
   12. TESTIMONIAL SLIDER
   Auto-advances every 6 seconds with a fade and dot indicators.
   ---------------------------------------------------------- */
function initTestimonials() {
    const slides = $$('.testi-slide');
    const dots = $$('.dot');
    let current = 0;
    let timer = null;

    const showSlide = (index) => {
        current = (index + slides.length) % slides.length;

        slides.forEach((slide, i) => {
            const isActive = i === current;
            slide.classList.toggle('is-active', isActive);
            slide.setAttribute('aria-hidden', String(!isActive));
        });

        dots.forEach((dot, i) => {
            const isActive = i === current;
            dot.classList.toggle('is-active', isActive);
            dot.setAttribute('aria-selected', String(isActive));
        });

        return current;
    };

    const restartTimer = () => {
        clearInterval(timer);
        timer = setInterval(() => showSlide(current + 1), 6000);
    };

    dots.forEach((dot, i) => {
        dot.addEventListener('click', () => {
            showSlide(i);
            restartTimer();
        });
    });

    showSlide(0);
    restartTimer();
}

/* ----------------------------------------------------------
   13. CONTACT FORM: client-side validation (no backend)
   ---------------------------------------------------------- */
function getFieldError(field) {
    const value = field.value.trim();

    if (field.required && !value) {
        return 'This field is required.';
    }
    if (field.name === 'name' && value && value.length < 2) {
        return 'Please enter at least 2 characters.';
    }
    if (field.type === 'email' && value && !EMAIL_PATTERN.test(value)) {
        return 'Please enter a valid email address.';
    }
    if (field.name === 'phone' && value && !PHONE_PATTERN.test(value)) {
        return 'Please enter a valid phone number.';
    }
    if (field.name === 'message' && value && value.length < 10) {
        return 'Your message should be at least 10 characters.';
    }
    return '';
}

function showFieldError(field) {
    const message = getFieldError(field);
    const errorEl = document.getElementById(field.id + '-error');
    const isValid = message === '';

    field.setAttribute('aria-invalid', String(!isValid));
    if (errorEl) {
        errorEl.textContent = message;
    }
    field.closest('.form-group').classList.toggle('invalid', !isValid);

    return isValid;
}

function validateForm(form) {
    const fields = $$('input, select, textarea', form);
    const results = fields.map((field) => showFieldError(field));
    return results.every(Boolean);
}

function initContactForm() {
    const form = $('#contactForm');
    const success = $('#formSuccess');

    // Check each field when the visitor leaves it, and again while fixing it
    $$('input, select, textarea', form).forEach((field) => {
        field.addEventListener('blur', () => showFieldError(field));
        field.addEventListener('input', () => {
            if (field.getAttribute('aria-invalid') === 'true') {
                showFieldError(field);
            }
        });
    });

    form.addEventListener('submit', (event) => {
        event.preventDefault();

        if (!validateForm(form)) {
            const firstInvalid = $('[aria-invalid="true"]', form);
            if (firstInvalid) firstInvalid.focus();
            return;
        }

        form.reset();
        form.hidden = true;
        success.hidden = false;
        success.focus();
    });
}

/* ----------------------------------------------------------
   14. NEWSLETTER (footer)
   ---------------------------------------------------------- */
function initNewsletter() {
    const form = $('#newsletterForm');
    const message = $('#nlMsg');

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const email = form.elements.email.value.trim();
        const isValid = EMAIL_PATTERN.test(email);

        message.textContent = isValid
            ? 'Thank you for subscribing. Welcome to Maison Estate.'
            : 'Please enter a valid email address.';

        if (isValid) {
            form.reset();
        }
    });
}

/* ----------------------------------------------------------
   15. BACK TO TOP (appears after 400px of scrolling)
   ---------------------------------------------------------- */
function initBackToTop() {
    const button = $('#backToTop');

    const updateVisibility = () => {
        button.classList.toggle('show', window.scrollY > 400);
    };

    window.addEventListener('scroll', updateVisibility, { passive: true });
    button.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
    updateVisibility();
}

/* ----------------------------------------------------------
   INIT: runs once the DOM is ready (script is loaded with defer)
   ---------------------------------------------------------- */
function init() {
    runPreloader();
    initHeaderScroll();
    initMobileMenu();
    initActiveLinks();
    initReveal();
    initCounters();
    initParallax();
    initSearchTabs();
    initFilters();
    initFavourites();
    initNeighborhoodSlider();
    initTestimonials();
    initContactForm();
    initNewsletter();
    initBackToTop();
}

document.addEventListener('DOMContentLoaded', init);