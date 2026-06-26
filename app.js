/* ============================================================
   GateX AI — Hackathon 2026
   App Logic:
   1. Pricing Matrix (State-Isolated — 0 global re-renders)
   2. Bento-to-Accordion (Context Lock across breakpoints)
   3. Scroll animations (IntersectionObserver)
   4. Navbar scroll effect
   5. Mobile menu
   6. Smooth scroll navigation
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

    // ======================== 1. PRICING MATRIX (STATE-ISOLATED) ========================
    // Constraint: 0 global re-renders. We directly mutate textContent of DOM refs.
    // No React/framework state involved. Pure DOM manipulation.
    
    const PRICING_MATRIX = {
        // Base monthly prices in USD
        base: {
            starter: 29,
            pro: 79,
            enterprise: 199
        },
        // Annual discount factor
        annualDiscount: 0.80, // 20% off
        // Currency conversion rates
        currencies: {
            USD: { symbol: '$', rate: 1 },
            INR: { symbol: '₹', rate: 83.5 },
            EUR: { symbol: '€', rate: 0.92 }
        }
    };

    // State (NOT in React — just simple JS variables)
    let currentBilling = 'monthly';
    let currentCurrency = 'USD';

    // DOM refs (we manipulate these directly, no re-render)
    const priceElements = document.querySelectorAll('.price-value');
    const symbolElements = document.querySelectorAll('[data-price-symbol]');
    const toggleSwitch = document.getElementById('toggleSwitch');
    const toggleLabels = document.querySelectorAll('.toggle-label');
    const currencyBtns = document.querySelectorAll('.currency-btn');

    function updatePrices() {
        const plans = ['starter', 'pro', 'enterprise'];
        const currency = PRICING_MATRIX.currencies[currentCurrency];
        const discount = currentBilling === 'annual' ? PRICING_MATRIX.annualDiscount : 1;

        priceElements.forEach((el, i) => {
            const basePrice = PRICING_MATRIX.base[plans[i]];
            const finalPrice = Math.round(basePrice * currency.rate * discount);
            // Direct DOM mutation — 0 re-renders
            el.textContent = finalPrice.toLocaleString();
        });

        symbolElements.forEach(el => {
            el.textContent = currency.symbol;
        });
    }

    // Billing toggle
    if (toggleSwitch) {
        toggleSwitch.addEventListener('click', () => {
            currentBilling = currentBilling === 'monthly' ? 'annual' : 'monthly';
            toggleSwitch.classList.toggle('active', currentBilling === 'annual');
            
            toggleLabels.forEach(label => {
                const billing = label.dataset.billing;
                label.classList.toggle('active', billing === currentBilling);
            });

            updatePrices();
        });
    }

    // Currency buttons
    currencyBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentCurrency = btn.dataset.currency;
            currencyBtns.forEach(b => b.classList.toggle('active', b === btn));
            updatePrices();
        });
    });


    // ======================== 2. BENTO-TO-ACCORDION (CONTEXT LOCK) ========================
    // Constraint: If user hovers card index 2 on desktop, and resizes to mobile,
    // accordion panel 2 must auto-expand. Context is locked across breakpoints.
    
    let activeBentoIndex = -1;
    const bentoCards = document.querySelectorAll('.bento-card');
    const MOBILE_BREAKPOINT = 768;

    function isMobile() {
        return window.innerWidth <= MOBILE_BREAKPOINT;
    }

    function setActiveBento(index) {
        activeBentoIndex = index;
        
        if (isMobile()) {
            // Accordion mode: toggle active class
            bentoCards.forEach((card, i) => {
                card.classList.toggle('active-bento', i === index);
            });
        }
    }

    function clearActiveBento() {
        if (!isMobile()) {
            activeBentoIndex = -1;
            bentoCards.forEach(card => card.classList.remove('active-bento'));
        }
    }

    // Desktop: hover sets active index
    bentoCards.forEach((card, i) => {
        card.addEventListener('mouseenter', () => {
            setActiveBento(i);
        });

        card.addEventListener('mouseleave', () => {
            clearActiveBento();
        });

        // Mobile: tap to toggle
        card.addEventListener('click', () => {
            if (isMobile()) {
                if (activeBentoIndex === i) {
                    activeBentoIndex = -1;
                    card.classList.remove('active-bento');
                } else {
                    setActiveBento(i);
                }
            }
        });
    });

    // Context Lock: On resize, preserve active index
    const resizeObserver = new ResizeObserver(() => {
        if (activeBentoIndex >= 0 && activeBentoIndex < bentoCards.length) {
            if (isMobile()) {
                bentoCards.forEach((card, i) => {
                    card.classList.toggle('active-bento', i === activeBentoIndex);
                });
            } else {
                // On desktop, clear accordion classes (hover handles it)
                bentoCards.forEach(card => card.classList.remove('active-bento'));
            }
        }
    });

    resizeObserver.observe(document.body);


    // ======================== 3. SCROLL ANIMATIONS ========================
    const scrollElements = document.querySelectorAll('.fade-in-scroll');

    const scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                scrollObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -60px 0px'
    });

    scrollElements.forEach(el => scrollObserver.observe(el));


    // ======================== 4. NAVBAR SCROLL EFFECT ========================
    const navbar = document.getElementById('navbar');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.scrollY;
        
        if (currentScroll > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        lastScroll = currentScroll;
    }, { passive: true });


    // ======================== 5. MOBILE MENU ========================
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navLinks = document.getElementById('navLinks');

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenuBtn.classList.toggle('open');
            navLinks.classList.toggle('open');
            document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
        });

        // Close menu on link click
        navLinks.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenuBtn.classList.remove('open');
                navLinks.classList.remove('open');
                document.body.style.overflow = '';
            });
        });
    }


    // ======================== 6. ACTIVE NAV LINK ON SCROLL ========================
    const sections = document.querySelectorAll('section[id]');
    const navLinksAll = document.querySelectorAll('.nav-link');

    const navObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                navLinksAll.forEach(link => {
                    link.classList.toggle('active', link.getAttribute('href') === '#' + id);
                });
            }
        });
    }, {
        threshold: 0.2,
        rootMargin: '-72px 0px -50% 0px'
    });

    sections.forEach(section => navObserver.observe(section));


    // ======================== 7. CTA EMAIL SUBMIT ========================
    const ctaSubmit = document.getElementById('ctaSubmit');
    const ctaEmail = document.getElementById('ctaEmail');

    if (ctaSubmit && ctaEmail) {
        ctaSubmit.addEventListener('click', (e) => {
            e.preventDefault();
            const email = ctaEmail.value.trim();
            if (email && email.includes('@')) {
                ctaSubmit.textContent = '✓ Subscribed!';
                ctaSubmit.style.pointerEvents = 'none';
                ctaEmail.value = '';
                setTimeout(() => {
                    ctaSubmit.innerHTML = 'Get Started Free <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
                    ctaSubmit.style.pointerEvents = '';
                }, 3000);
            } else {
                ctaEmail.style.borderColor = '#ff5f57';
                setTimeout(() => {
                    ctaEmail.style.borderColor = '';
                }, 2000);
            }
        });
    }


    // ======================== 8. SMOOTH SCROLL (FALLBACK) ========================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                const offset = 80; // nav height
                const top = target.getBoundingClientRect().top + window.scrollY - offset;
                window.scrollTo({ top, behavior: 'smooth' });
            }
        });
    });

});
