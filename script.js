// Data for routes
const routesData = [
  { id: 'car', name: 'Car Route', icon: 'car', time: '20 min', cost: '₹50', co2: 6, color: '#FF4D4D', bgColor: 'rgba(255, 77, 77, 0.1)', pathSelector: '#path-car' },
  { id: 'bus', name: 'Public Transport', icon: 'bus', time: '30 min', cost: '₹20', co2: 2, color: '#FFB84D', bgColor: 'rgba(255, 184, 77, 0.1)', pathSelector: '#path-bus' },
  { id: 'bike', name: 'Bike/Walking', icon: 'bike', time: '35 min', cost: '₹0', co2: 0, color: '#00FF88', bgColor: 'rgba(0, 255, 136, 0.1)', greenest: true, pathSelector: '#path-bike' }
];

lucide.createIcons();

// DOM Elements
const routeForm = document.getElementById('route-form');
const startInput = document.getElementById('start-location');
const destInput = document.getElementById('dest-location');
const routeOptionsPanel = document.getElementById('route-options-panel');
const routeCardsContainer = document.getElementById('route-cards-container');
const carbonSavingsPanel = document.getElementById('carbon-savings-panel');
const mockMapPanel = document.getElementById('mock-map-panel');

// Impact Banner and Pledge
const impactBanner = document.getElementById('impact-banner');
const impactHeadline = document.getElementById('impact-headline');
const pledgeBtn = document.getElementById('pledge-btn');
const pledgeProgress = document.getElementById('pledge-progress');
const pledgeStatus = document.getElementById('pledge-status');

// What If
const simSlider = document.getElementById('sim-slider');
const simDaysDisplay = document.getElementById('sim-days-display');
const simMonthly = document.getElementById('sim-monthly');
const simAnnual = document.getElementById('sim-annual');

// Chat
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatMessages = document.getElementById('chat-messages');
const chatChips = document.querySelectorAll('.chat-chip');

// State using LocalStorage
let lastSearch = JSON.parse(localStorage.getItem('greenRoute_lastSearch')) || null;
let savedHistory = JSON.parse(localStorage.getItem('greenRoute_history')) || { totalSaved: 0, pledgeDays: 0 };

document.addEventListener('DOMContentLoaded', () => {
  // Theme init
  const themeToggle = document.getElementById('theme-toggle');
  const savedTheme = localStorage.getItem('greenRoute_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  themeToggle.addEventListener('click', () => {
    let currentTheme = document.documentElement.getAttribute('data-theme');
    let targetTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', targetTheme);
    localStorage.setItem('greenRoute_theme', targetTheme);
    updateThemeIcon(targetTheme);
  });

  // Load pledge state
  updatePledgeUI();

  // Load last search
  if (lastSearch && lastSearch.start && lastSearch.dest) {
    startInput.value = lastSearch.start;
    destInput.value = lastSearch.dest;
    handleSearch(null, lastSearch.selectedId);
  }

  // Initial Chat
  addChatMsg("Hi! I am your Gemini Climate Coach. 🌿 How can I help you commute smarter today?", 'ai');
});

function updateThemeIcon(theme) {
  const iconName = theme === 'light' ? 'moon' : 'sun';
  document.getElementById('theme-toggle').innerHTML = `<i data-lucide="${iconName}"></i>`;
  lucide.createIcons();
}

// Pledge logic
pledgeBtn.addEventListener('click', () => {
  if (savedHistory.pledgeDays < 3) {
    savedHistory.pledgeDays += 1;
    localStorage.setItem('greenRoute_history', JSON.stringify(savedHistory));
    updatePledgeUI();
  }
});

function updatePledgeUI() {
  const p = Math.min(savedHistory.pledgeDays, 3);
  pledgeProgress.style.width = `${(p / 3) * 100}%`;
  pledgeStatus.textContent = `${p}/3 Days`;
  if (p === 3) {
    pledgeBtn.innerHTML = '<i data-lucide="award"></i> Pledge Complete!';
    pledgeBtn.style.background = 'var(--warning)';
    pledgeBtn.style.color = '#000';
    pledgeBtn.disabled = true;
    pledgeProgress.classList.remove('warning-fill');
    pledgeProgress.style.background = 'var(--accent-green)';
  }
  lucide.createIcons();
}

routeForm.addEventListener('submit', (e) => handleSearch(e, null));

function handleSearch(e, preSelectId) {
  if (e) e.preventDefault();
  const start = startInput.value.trim();
  const dest = destInput.value.trim();
  if (!start || !dest) return;

  routeOptionsPanel.classList.remove('hidden');
  mockMapPanel.classList.remove('hidden');
  renderRoutes(preSelectId);
  updateMapHighlight(preSelectId);

  lastSearch = { start, dest, selectedId: preSelectId };
  localStorage.setItem('greenRoute_lastSearch', JSON.stringify(lastSearch));
}

function renderRoutes(selectedId) {
  routeCardsContainer.innerHTML = '';

  routesData.forEach((route, idx) => {
    const isSelected = selectedId === route.id;
    const card = document.createElement('div');
    card.className = `route-card slide-up ${isSelected ? 'selected' : ''}`;
    card.style.animationDelay = `${idx * 0.15}s`;

    card.innerHTML = `
      ${route.greenest ? '<div class="badge-greenest">GREENEST</div>' : ''}
      <div class="route-header">
        <div class="route-icon-box" style="background: ${route.bgColor}; color: ${route.color}">
          <i data-lucide="${route.icon}"></i>
        </div>
        <div>
          <h3 style="margin-bottom:0.15rem">${route.name}</h3>
          <span class="text-sm text-secondary">
            CO₂: <span style="color: ${route.color}; font-weight: bold">${route.co2}kg</span>
          </span>
        </div>
      </div>
      <div class="route-stats">
        <div class="flex-center" style="gap: 0.3rem"><i data-lucide="clock" class="text-sm"></i> ${route.time}</div>
        <div class="flex-center" style="gap: 0.3rem"><i data-lucide="indian-rupee" class="text-sm"></i> ${route.cost}</div>
      </div>
    `;

    card.addEventListener('click', () => selectRoute(route.id));
    routeCardsContainer.appendChild(card);
  });

  lucide.createIcons();

  if (selectedId) {
    const selectedRoute = routesData.find(r => r.id === selectedId);
    showCarbonSavings(selectedRoute);
  } else {
    carbonSavingsPanel.classList.add('hidden');
    impactBanner.classList.add('hidden');
  }
}

function selectRoute(routeId) {
  lastSearch.selectedId = routeId;
  localStorage.setItem('greenRoute_lastSearch', JSON.stringify(lastSearch));
  renderRoutes(routeId);
  updateMapHighlight(routeId);
}

function updateMapHighlight(routeId) {
  routesData.forEach(route => {
    const path = document.querySelector(route.pathSelector);
    if (!path) return;

    // reset dasharray animation to replay it
    path.style.animation = 'none';
    path.offsetHeight; /* trigger reflow */
    path.style.animation = null;

    if (!routeId || routeId === route.id) {
      path.classList.remove('inactive');
      if (route.greenest && routeId === route.id) {
        path.style.strokeWidth = 8;
      }
    } else {
      path.classList.add('inactive');
    }
  });
}

function showCarbonSavings(route) {
  carbonSavingsPanel.classList.remove('hidden');

  const savings = Math.max(0, 6 - route.co2);
  const annualSavings = (savings * 20 * 12).toLocaleString();

  if (savings === 0) {
    carbonSavingsPanel.innerHTML = `
      <h3 class="text-danger flex-center" style="gap: 0.5rem"><i data-lucide="wind"></i> High Emission Route</h3>
      <p class="text-secondary mt-1">You selected ${route.name}. Consider a greener option to save carbon!</p>
    `;
    impactBanner.classList.add('hidden');
  } else {
    const trees = (savings * 0.05).toFixed(1);
    const monthly = savings * 20;

    savedHistory.totalSaved += savings;
    localStorage.setItem('greenRoute_history', JSON.stringify(savedHistory));

    impactBanner.classList.remove('hidden');
    impactHeadline.innerHTML = `This route choice avoids <span class="text-accent">${annualSavings} kg CO₂/year</span> 🌍`;

    const carDays = Math.round((savings * 20 * 12) / 6);
    document.getElementById('impact-cardays').innerHTML = `Equivalent to removing a commuter car from roads for <span class="text-primary font-bold">${carDays} days</span>.`;

    carbonSavingsPanel.innerHTML = `
      <div style="display: flex; gap: 1.5rem; align-items: flex-start">
        <div style="background: var(--accent-green); padding: 1rem; border-radius: 50%; color: #0A192F; box-shadow: 0 0 20px rgba(0, 255, 136, 0.3)">
          <i data-lucide="leaf" style="width: 32px; height: 32px;"></i>
        </div>
        <div>
          <h3 style="font-size: 1.5rem;">Awesome Choice!</h3>
          <p class="mt-1">
            You saved <span class="text-accent font-bold" style="font-size: 1.25rem">${savings}kg CO₂</span> by choosing ${route.name}.
          </p>
        </div>
      </div>
      <div class="grid-2 gap-1 mt-1">
        <div class="stat-card">
          <div class="stat-label">Trees Equivalent</div>
          <div class="stat-value text-accent">~${trees} Trees</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Monthly Impact</div>
          <div class="stat-value text-accent">${monthly}kg CO₂</div>
        </div>
      </div>
    `;
  }
  lucide.createIcons();
}

function updateSimulator() {
  const days = parseInt(simSlider.value);
  simDaysDisplay.textContent = days;

  const dailySavings = 6;
  const monthly = days * 4 * dailySavings;
  const annual = monthly * 12;

  simMonthly.innerHTML = `-${monthly} <span class="text-sm text-secondary">kg CO₂</span>`;
  simAnnual.innerHTML = `-${annual} <span class="text-sm text-secondary">kg CO₂</span>`;
}

simSlider.addEventListener('input', updateSimulator);
updateSimulator();

// Chat Handling
function addChatMsg(text, sender) {
  const msg = document.createElement('div');
  msg.className = `chat-msg msg-${sender} slide-up`;
  msg.style.animationDelay = '0s';
  msg.textContent = text;
  chatMessages.appendChild(msg);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function handleBotResponse(text) {
  setTimeout(() => {
    let aiResponse = "Every sustainable step counts! Choosing greener transport reduces your carbon footprint significantly over a year.";
    const lowerText = text.toLowerCase();

    if (lowerText.includes('bike') || lowerText.includes('biking') || lowerText.includes('walk') || lowerText.includes('cycling')) {
      aiResponse = "Biking and walking produce zero tailpipe emissions! They improve physical and mental health and completely bypass traffic congestion in cities.";
    } else if (lowerText.includes('bus') || lowerText.includes('public') || lowerText.includes('transport')) {
      aiResponse = "Public transport is highly efficient. A single full bus can replace up to 40 private cars on the road, drastically reducing the city's overall carbon emissions.";
    } else if (lowerText.includes('car')) {
      aiResponse = "Standard cars emit roughly 120-150g of CO2 per km. If driving is unavoidable, try carpooling or consider switching to an EV to drastically lower impact.";
    } else if (lowerText.includes('student') || lowerText.includes('students')) {
      aiResponse = "For students, cycling or public transit are usually the best choices. They are cost-effective, environmentally friendly, and transit systems often offer student discounts!";
    } else if (lowerText.includes('reduce')) {
      aiResponse = "You can reduce emissions by substituting even 2 days of driving with public transit or biking. Carpooling and maintaining your vehicle's efficiency also help immensely.";
    }

    addChatMsg(aiResponse, 'ai');
  }, 800);
}

chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;
  addChatMsg(text, 'user');
  chatInput.value = '';
  handleBotResponse(text);
});

chatChips.forEach(chip => {
  chip.addEventListener('click', () => {
    const text = chip.textContent;
    addChatMsg(text, 'user');
    handleBotResponse(text);
  });
});
