// ===============================
// Inject header/footer partials
// ===============================
// This function loads your header and footer HTML from /partials
// and injects them into #header-mount and #footer-mount on the page.
// It also wires up the mobile menu toggle and updates the footer year.
async function injectPartials() {
    // Find the header/footer mount points in the DOM
    const headerMount = document.getElementById('header-mount');
    const footerMount = document.getElementById('footer-mount');
  
    // If a header mount exists, fetch and inject the header partial
    if (headerMount) {
      const h = await fetch('partials/header.html').then(r => r.text());
      headerMount.innerHTML = h;
    }
  
    // If a footer mount exists, fetch and inject the footer partial
    if (footerMount) {
      const f = await fetch('partials/footer.html').then(r => r.text());
      footerMount.innerHTML = f;
    }
  
    // After injection, some elements now exist in the DOM.
    // Wire up the mobile menu button to show/hide the mobile menu.
    const menuBtn = document.getElementById('menuBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    if (menuBtn && mobileMenu) {
      const iconPathClosed = 'M4 6h16M4 12h16M4 18h16';
      const iconPathOpen = 'M6 6l12 12M6 18L18 6';
      const svgPath = menuBtn.querySelector('svg path');

      menuBtn.addEventListener('click', () => {
        const isHidden = mobileMenu.classList.toggle('hidden');
        menuBtn.setAttribute('aria-expanded', String(!isHidden));
        if (svgPath) {
          svgPath.setAttribute('d', isHidden ? iconPathClosed : iconPathOpen);
        }
      });
    }
  
    // Update the year in the footer (if the element exists)
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  }
  
  // ======================================
  // Estimator setup (only on estimator.html)
  // ======================================
  // This function attaches the cost calculator logic to the estimator page.
  // If the calculator button doesn't exist, it exits (so it won't run on other pages).
  function setupEstimator() {
    // Button that triggers the calculation
    const calcBtn = document.getElementById('calcBtn');
    if (!calcBtn) return; // Not on the estimator page, so do nothing.
  
    // Helper: format numbers as USD currency
    const fmt = (n) => Number(n).toLocaleString(undefined, { style: 'currency', currency: 'USD' });
  
    // Main calculation logic
    function calculate() {
      // Get inputs from the form
      const pkg = document.getElementById('pkg');
      const days = Math.max(1, parseInt(document.getElementById('days').value || '0', 10));
      const people = Math.max(1, parseInt(document.getElementById('people').value || '1', 10));
      const airfare = Math.max(0, parseFloat(document.getElementById('airfare').value || '0'));
  
      // Pull prices from the selected package <option> data-* attributes
      const hotelPerNight = parseFloat(pkg.selectedOptions[0].dataset.hotel);
      const vehiclePerDay = parseFloat(pkg.selectedOptions[0].dataset.vehicle);
      const guidePerDay = parseFloat(pkg.selectedOptions[0].dataset.guide);
  
      // Assume 1 room per 2 guests (rounded up)
      const rooms = Math.ceil(people / 2);
  
      // Sum selected activities (per person, one-time)
      const actValues = Array.from(document.querySelectorAll('.activity:checked')).map(i => parseFloat(i.value));
      const activitiesPerPerson = actValues.reduce((a, b) => a + b, 0);
  
      // Calculate totals
      const hotelTotal = hotelPerNight * days * rooms;
      const vehicleTotal = vehiclePerDay * days;
      const guideTotal  = guidePerDay * days;
      const activitiesTotal = activitiesPerPerson * people;
      const airfareTotal = airfare * people;
  
      // Ground total = hotel + vehicle + guide + activities (excludes airfare)
      const groundTotal = hotelTotal + vehicleTotal + guideTotal + activitiesTotal;
  
      // Grand total = ground + airfare
      const grandTotal = groundTotal + airfareTotal;
  
      // Render the result breakdown
      const result = document.getElementById('result');
      result.innerHTML = `
        <div class="space-y-1">
          <div><strong>Package:</strong> ${pkg.value.toUpperCase()} • <strong>Days:</strong> ${days} • <strong>Travelers:</strong> ${people} • <strong>Rooms:</strong> ${rooms}</div>
          <div class="mt-3 grid grid-cols-2 gap-2 text-slate-700">
            <div>Hotel (${fmt(hotelPerNight)}/night × ${days} × ${rooms} rooms)</div><div class="text-right font-medium">${fmt(hotelTotal)}</div>
            <div>Vehicle (${fmt(vehiclePerDay)}/day × ${days})</div><div class="text-right font-medium">${fmt(vehicleTotal)}</div>
            <div>Guide (${fmt(guidePerDay)}/day × ${days})</div><div class="text-right font-medium">${fmt(guideTotal)}</div>
            <div>Activities (per person one-time)</div><div class="text-right font-medium">${fmt(activitiesTotal)}</div>
            <div class="col-span-2 h-px bg-slate-200 my-1"></div>
            <div class="font-semibold">Estimated Ground Total</div><div class="text-right font-semibold">${fmt(groundTotal)}</div>
            <div>Airfare (${fmt(airfare)} × ${people})</div><div class="text-right font-medium">${fmt(airfareTotal)}</div>
            <div class="col-span-2 h-px bg-slate-200 my-1"></div>
            <div class="text-lg font-bold">Grand Total</div><div class="text-right text-lg font-bold">${fmt(grandTotal)}</div>
          </div>
          <p class="text-xs text-slate-500 mt-2">Note: Estimates only. Final pricing varies by season, hotel selection, and availability. Taxes/fees extra where applicable.</p>
        </div>`;
    }
  
    // Attach the click handler to run the calculation
    calcBtn.addEventListener('click', calculate);
  }
  
  // Run partial injection first, then set up the estimator (in case we are on that page)
  injectPartials().then(() => {
    setupEstimator();
    setupTestimonialsSlider();
    setupFloatingWhatsApp();
  });

  // ===============================
  // Homepage: testimonials carousel
  // ===============================
  function setupTestimonialsSlider() {
    const panel = document.querySelector('[data-testimonial-panel]');
    if (!panel) return; // Not on homepage

    // Grab the testimonial content elements and navigation controls.
    const quoteEl = panel.querySelector('[data-testimonial-quote]');
    const authorEl = panel.querySelector('[data-testimonial-author]');
    const metaEl = panel.querySelector('[data-testimonial-meta]');
    const dots = Array.from(document.querySelectorAll('[data-testimonial-dot]'));
    const prevBtn = document.querySelector('[data-testimonial-prev]');
    const nextBtn = document.querySelector('[data-testimonial-next]');
    if (!quoteEl || !authorEl || !metaEl || !dots.length || !prevBtn || !nextBtn) return;

    // Collection of short testimonials to cycle through.
    const slides = [
      {
        quote: '"We felt cared for the entire time—every transfer, guide, and detail just happened."',
        author: '- The Jensen family, Vermont',
        meta: 'Family Journey · 24-Day Premium Plan'
      },
      {
        quote: '"Wellness days, culture, and adventure were paced perfectly. We came home rested and inspired."',
        author: '- Priya & Jordan, California',
        meta: 'Wellness Escape · 20-Day Luxury Plan'
      },
      {
        quote: '"The surprises were so thoughtful—calligraphed itineraries, helicopter champagne, the works."',
        author: '- Camille & Aaron, Toronto',
        meta: 'Anniversary Journey · Custom 18-Day Itinerary'
      }
    ];

    let index = 0; // Current testimonial index
    let timerId;   // Interval ID for autoplay
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Toggle visual + ARIA state on pagination dots.
    const setActiveDot = (activeIndex) => {
      dots.forEach((dot, dotIndex) => {
        dot.dataset.active = String(dotIndex === activeIndex);
        dot.setAttribute('aria-pressed', dotIndex === activeIndex ? 'true' : 'false');
      });
    };

    // Render the actual testimonial copy and metadata.
    const render = (activeIndex) => {
      const slide = slides[activeIndex];
      quoteEl.textContent = slide.quote;
      authorEl.textContent = slide.author;
      metaEl.textContent = slide.meta;
      setActiveDot(activeIndex);
    };

    // Move to a specific slide index (with wrapping).
    const goTo = (nextIndex) => {
      index = (nextIndex + slides.length) % slides.length;
      render(index);
    };

    // Kick off the autoplay loop unless the user prefers reduced motion.
    const startAutoPlay = () => {
      if (prefersReducedMotion) return;
      stopAutoPlay();
      timerId = window.setInterval(() => {
        goTo(index + 1);
      }, 8000);
    };

    // Stop the autoplay loop.
    const stopAutoPlay = () => {
      if (timerId) {
        window.clearInterval(timerId);
        timerId = undefined;
      }
    };

    // Manual navigation controls.
    prevBtn.addEventListener('click', () => {
      goTo(index - 1);
      startAutoPlay();
    });

    nextBtn.addEventListener('click', () => {
      goTo(index + 1);
      startAutoPlay();
    });

    // Allow users to use the pagination dots as navigation.
    dots.forEach((dot, dotIndex) => {
      dot.addEventListener('click', () => {
        goTo(dotIndex);
        startAutoPlay();
      });
      dot.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          goTo(dotIndex);
          startAutoPlay();
        }
      });
    });

    render(index);
    startAutoPlay();

    // Pause autoplay on hover for easier reading.
    panel.addEventListener('mouseenter', stopAutoPlay);
    panel.addEventListener('mouseleave', startAutoPlay);
  }

  // ===============================
  // Floating WhatsApp chat button
  // ===============================
  function setupFloatingWhatsApp() {
    if (document.querySelector('[data-whatsapp-button]')) return;
    // Build a floating anchor that opens WhatsApp in a new tab.
    const btn = document.createElement('a');
    btn.href = 'https://wa.me/18023106841';
    btn.target = '_blank';
    btn.rel = 'noopener';
    btn.className = 'fixed bottom-5 right-4 z-50 inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-900/30 transition hover:-translate-y-0.5 hover:bg-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-200 sm:bottom-6 sm:right-6';
    btn.setAttribute('aria-label', 'Chat on WhatsApp');
    btn.dataset.whatsappButton = 'true';
    btn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 .5A11.5 11.5 0 0 0 2.1 18.42L.5 23.5l5.26-1.55A11.5 11.5 0 1 0 12 .5Zm0 2a9.5 9.5 0 0 1 8.17 14.5l-.28.46a1 1 0 0 0-.12.24l-.72 1.76-1.87-.59a1 1 0 0 0-.76.06 9.5 9.5 0 1 1-4.3-17.43ZM8.54 6.98a.74.74 0 0 0-.55.26 4.38 4.38 0 0 0-1.1 3c0 2.11 1.6 4.14 4.57 5.94 2.89 1.74 4.6 1.96 5.68 1.73a3.33 3.33 0 0 0 1.26-.68 1 1 0 0 0 .33-.74c0-.41 0-1.27-.59-1.48s-1.43-.7-1.62-.77-.38-.12-.54.17-.62.77-.76.93-.28.22-.52.08a7.73 7.73 0 0 1-2.27-1.4 8.58 8.58 0 0 1-1.61-2.01c-.17-.29 0-.45.13-.58.13-.13.29-.33.43-.5a1.94 1.94 0 0 0 .28-.5 1.64 1.64 0 0 0-.08-.58c-.08-.17-.62-1.54-.86-2.09s-.39-.52-.54-.53Z"/>
      </svg>
      WhatsApp
    `;
    document.body.appendChild(btn);
  }
  
  
  // ===================================================
  // Hamro Vacation: Packages page — collapsible tables
  // ===================================================
  
  // IDs of the two package sections we want to enhance
  const sections = ['premium-20', 'luxury-20'];
  
  /**
   * Creates the "Show full itinerary" / "Hide details" toggle button.
   * @param {string} labelShow - text when collapsed
   * @param {string} labelHide - text when expanded
   * @returns {HTMLButtonElement}
   */
  function makeToggleButton(labelShow = 'See full itinerary', labelHide = 'Hide itinerary') {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'reveal-btn mt-4';
    btn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor"
           stroke-width="2" viewBox="0 0 24 24">
        <!-- Default icon: chevron-down -->
        <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
      </svg>
      <span>${labelShow}</span>
    `;
    // Store both labels on the element so we can swap text later
    btn.dataset.show = labelShow;
    btn.dataset.hide = labelHide;
    return btn;
  }
  
  // Enhance both package sections
  sections.forEach(id => {
    const section = document.getElementById(id);
    if (!section) return; // Section not found on this page
  
    // Find the first "responsive table" container and the table inside it
    const container = section.querySelector('.overflow-x-auto.rounded-2xl.border.bg-white.shadow-sm');
    // The tables are inside overflow containers; we wrap them to control height.
    const table = container?.querySelector('table');
    if (!container || !table) return; // No table found, skip
  
    // Create a wrapper around the table container to control collapsed height/gradient
    const wrapper = document.createElement('div');
    // Collapsed by default so visitors only see a preview of the itinerary.
    wrapper.className = 'itinerary-wrap collapsed'; // Start in collapsed state
  
    // Insert the wrapper before the existing container, then move the container inside it
    container.parentNode.insertBefore(wrapper, container);
    wrapper.appendChild(container);
  
    // Measure first rows so the collapsed state does not clip halfway through a row
    // Defer measurement so the browser has time to lay out the table first.
    requestAnimationFrame(() => {
      const previewRows = 6;
      let measured = table.tHead ? table.tHead.offsetHeight : 0;
      const rows = table.tBodies?.length ? Array.from(table.tBodies[0].rows) : Array.from(table.querySelectorAll('tbody tr'));
      rows.slice(0, previewRows).forEach(row => {
        measured += row.offsetHeight;
      });
      wrapper.style.setProperty('--collapse-height', `${Math.ceil(measured + 16)}px`);
    });

    // Add the toggle button right after the wrapper
    // Insert the toggle button after the wrapper so we can expand/collapse.
    const btn = makeToggleButton();
    wrapper.after(btn);
  
    // Toggle behavior for expanding/collapsing the itinerary
    btn.addEventListener('click', () => {
      // Toggle "collapsed" class to expand/collapse the wrapper
      // Flip the collapsed state and update the visuals.
      wrapper.classList.toggle('collapsed');
  
      // Update button label + icon based on current state
      const span = btn.querySelector('span');
      const path = btn.querySelector('svg path');
      if (wrapper.classList.contains('collapsed')) {
        // Now collapsed -> show the "show" label and chevron-down
        span.textContent = btn.dataset.show;
        path.setAttribute('d', 'M19 9l-7 7-7-7'); // chevron-down
      } else {
        // Now expanded -> show the "hide" label and chevron-up
        span.textContent = btn.dataset.hide;
        path.setAttribute('d', 'M5 15l7-7 7 7');   // chevron-up
      }
    });
  });
  
  // Optional nicety: if the URL has a hash like #premium-20 or #luxury-20,
  // scroll smoothly to that section on load.
  if (location.hash && sections.includes(location.hash.slice(1))) {
    const target = document.querySelector(location.hash);
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  
