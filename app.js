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
      menuBtn.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));
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
  injectPartials().then(setupEstimator);
  
  
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
  function makeToggleButton(labelShow = 'Show full itinerary', labelHide = 'Hide details') {
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
    const table = container?.querySelector('table');
    if (!container || !table) return; // No table found, skip
  
    // Create a wrapper around the table container to control collapsed height/gradient
    const wrapper = document.createElement('div');
    wrapper.className = 'itinerary-wrap collapsed'; // Start in collapsed state
  
    // Insert the wrapper before the existing container, then move the container inside it
    container.parentNode.insertBefore(wrapper, container);
    wrapper.appendChild(container);
  
    // Add the toggle button right after the wrapper
    const btn = makeToggleButton();
    wrapper.after(btn);
  
    // Toggle behavior for expanding/collapsing the itinerary
    btn.addEventListener('click', () => {
      // Toggle "collapsed" class to expand/collapse the wrapper
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
  