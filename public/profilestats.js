// Initialize PDF.js
const pdfjsLib = window['pdfjs-dist/build/pdf'];
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js';

document.addEventListener('DOMContentLoaded', function() {
  // Initialize the application
  initApp();
});

function initApp() {
  // Simulate loading
  setTimeout(() => {
    document.getElementById('loadingOverlay').style.opacity = '0';
    setTimeout(() => {
      document.getElementById('loadingOverlay').style.display = 'none';
    }, 500);
  }, 2000);

  // Initialize components
  initParticleBackground();
  initThemeToggle();
  initWarningOverlay();
  initNavigation();
  initCharts();
  initClock();
  initChat();
  initTransactionFilters();
  initSettingsSection();
  initReportsSection();
  initBudgetSection();
}

// Particle Background
function initParticleBackground() {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = [];
  for (let i = 0; i < 100; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 2 + 1,
      speedX: Math.random() * 0.5 - 0.25,
      speedY: Math.random() * 0.5 - 0.25,
    });
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((particle) => {
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
      ctx.fill();

      particle.x += particle.speedX;
      particle.y += particle.speedY;

      if (particle.x < 0 || particle.x > canvas.width) particle.speedX *= -1;
      if (particle.y < 0 || particle.y > canvas.height) particle.speedY *= -1;
    });
    requestAnimationFrame(animate);
  }
  animate();

  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
}

// Theme Toggle
function initThemeToggle() {
  const themeToggle = document.getElementById('themeToggle');
  if (!themeToggle) return;

  // Check for saved theme in localStorage
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    document.body.className = savedTheme;
  }

  themeToggle.addEventListener('click', () => {
    if (document.body.classList.contains('dark')) {
      document.body.classList.remove('dark');
      document.body.classList.add('light');
      localStorage.setItem('theme', 'light');
    } else {
      document.body.classList.remove('light');
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  });
}

// Warning Overlay
document.addEventListener('DOMContentLoaded', () => {
  initWarningOverlay();
});

function initWarningOverlay() {
  const warningOverlay = document.getElementById('warningOverlay');
  const fileInput = document.getElementById('statementUpload');
  const analyzeButton = document.getElementById('analyzeButton');
  const uploadStatus = document.getElementById('uploadStatus');

  if (!warningOverlay || !fileInput || !analyzeButton || !uploadStatus) return;

  warningOverlay.style.display = 'flex';

  fileInput.addEventListener('change', (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      analyzeButton.disabled = false;
      uploadStatus.textContent = `File selected: ${selectedFile.name}`;
      uploadStatus.style.color = '#10B981';
    } else {
      analyzeButton.disabled = true;
      uploadStatus.textContent = 'Please select a valid PDF file';
      uploadStatus.style.color = '#EF4444';
    }
  });

  analyzeButton.addEventListener('click', () => {
    if (fileInput.files.length === 0) {
      uploadStatus.textContent = 'Please select a PDF file first';
      uploadStatus.style.color = '#EF4444';
      return;
    }

    const selectedFile = fileInput.files[0];
    uploadStatus.textContent = 'Analyzing bank statement...';
    uploadStatus.style.color = '#F59E0B';

    const fileReader = new FileReader();
    fileReader.onload = function () {
      const typedArray = new Uint8Array(this.result);
      pdfjsLib.getDocument(typedArray).promise.then(function (pdf) {
        let textContent = '';
        const numPages = pdf.numPages;
        let pagesProcessed = 0;

        function getPageText(pageNum) {
          return pdf.getPage(pageNum).then(function (page) {
            return page.getTextContent().then(function (content) {
              const strings = content.items.map((item) => item.str);
              textContent += strings.join(' ') + '\n';
              pagesProcessed++;
              uploadStatus.textContent = `Analyzing page ${pagesProcessed} of ${numPages}...`;

              if (pagesProcessed === numPages) {
                const parsedData = parseBankStatement(textContent);
                uploadStatus.textContent = 'Analysis complete! Loading dashboard...';
                uploadStatus.style.color = '#10B981';
                updateDashboard(parsedData);

                setTimeout(() => {
                  warningOverlay.style.opacity = '0';
                  setTimeout(() => {
                    warningOverlay.style.display = 'none';
                  }, 500);
                }, 1500);
              }
            });
          });
        }

        const pagePromises = [];
        for (let i = 1; i <= numPages; i++) {
          pagePromises.push(getPageText(i));
        }
        return Promise.all(pagePromises);
      }).catch(function (error) {
        console.error('Error loading PDF:', error);
        uploadStatus.textContent = 'Error loading PDF';
        uploadStatus.style.color = '#EF4444';
        analyzeButton.disabled = false;
      });
    };
    fileReader.readAsArrayBuffer(selectedFile);
  });
}

// Parse Bank Statement Function
function parseBankStatement(text) {
  const data = {
    cashAndSavings: '$0',
    investments: '$0',
    totalAssets: '$0',
    transactions: [],
    budgetStatus: {
      monthlyBudget: '$6,000',
      totalSpent: '$5,200',
      categoryBreakdown: {},
    },
  };

  // Extract account balance
  const balanceMatches = text.match(/Account Balance:\s*([$\d,]+\.\d{2})/);
  if (balanceMatches) data.cashAndSavings = balanceMatches[1];

  // Extract transactions
  const transactionRegex =
    /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([$\-+]?\d{1,3}(?:,\d{3})*\.\d{2})/g;
  let match;
  while ((match = transactionRegex.exec(text)) !== null) {
    data.transactions.push({
      date: match[1],
      description: match[2].trim(),
      amount: match[3].startsWith('$') ? match[3] : `$${match[3]}`,
      category: categorizeTransaction(match[2]),
    });
  }

  // Update totals
  if (data.transactions.length > 0) {
    data.totalAssets = data.cashAndSavings;
    data.budgetStatus.totalSpent = `$${data.transactions
      .filter((t) => t.amount.startsWith('-'))
      .reduce(
        (sum, t) => sum + parseFloat(t.amount.replace(/[^0-9.-]/g, '')),
        0
      )
      .toFixed(2)}`;
  }

  return data;
}

// Helper function to categorize transactions
function categorizeTransaction(description) {
  const categories = {
    grocery: /whole foods|kroger|aldi/i,
    dining: /restaurant|cafe|starbucks/i,
    housing: /rent|mortgage|property management/i,
    transportation: /uber|lyft|taxi|shell petrol/i,
    entertainment: /netflix|spotify|cinema/i,
  };

  for (const [category, regex] of Object.entries(categories)) {
    if (regex.test(description)) return category;
  }
  return 'Other';
}

function updateDashboard(data) {
  const checkingBalance = document.querySelector('.account-balance.checking');
  const savingsBalance = document.querySelector('.account-balance.savings');
  const investmentBalance = document.querySelector('.account-balance.investment');

  if (checkingBalance) checkingBalance.textContent = data.cashAndSavings || '$0';
  if (savingsBalance) savingsBalance.textContent = data.cashAndSavings || '$0';
  if (investmentBalance)
    investmentBalance.textContent = data.investments || '$0';

  const totalAssetsMetric = document.querySelector('.metric-card.cyan .metric-value');
  const investmentsMetric = document.querySelector('.metric-card.purple .metric-value');
  const cashSavingsMetric = document.querySelector('.metric-card.blue .metric-value');

  if (totalAssetsMetric) totalAssetsMetric.textContent = data.totalAssets || '$0';
  if (investmentsMetric) investmentsMetric.textContent = data.investments || '$0';
  if (cashSavingsMetric)
    cashSavingsMetric.textContent = data.cashAndSavings || '$0';

  const transactionList = document.getElementById('transactionList');
  if (transactionList && data.transactions) {
    transactionList.innerHTML = '';
    // Limit to first 5 transactions
    const limitedTransactions = data.transactions.slice(0, 5);
    
    limitedTransactions.forEach((tx) => {
      const isDeposit = tx.amount.startsWith('+');
      const transactionHTML = `
        <div class="transaction-item">
          <div class="transaction-icon ${isDeposit ? 'deposit' : 'expense'}">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 ${isDeposit ? '8' : '10'}L12 ${
        isDeposit ? '10' : '8'
      }M${isDeposit ? '8' : '10'} 12L${isDeposit ? '10' : '8'} 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" stroke-width="2"/>
            </svg>
          </div>
          <div class="transaction-details">
            <div class="transaction-title">${tx.description}</div>
            <div class="transaction-meta">
              <span class="transaction-date">${tx.date}</span>
              <span class="transaction-category">${tx.category || 'Uncategorized'}</span>
            </div>
          </div>
          <div class="transaction-amount ${isDeposit ? 'deposit' : 'expense'}">${tx.amount}</div>
        </div>
      `;
      transactionList.insertAdjacentHTML('beforeend', transactionHTML);
    });
  }

  const dashboardSection = document.getElementById('dashboardSection');
  if (dashboardSection) dashboardSection.style.display = 'block';
}

// Navigation
function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  if (!navItems.length) return;

  navItems.forEach((item) => {
    item.addEventListener('click', () => {
      // Remove active class from all nav items
      navItems.forEach((nav) => nav.classList.remove('active'));
      // Add active class to clicked item
      item.classList.add('active');
      // Hide all sections
      const sections = document.querySelectorAll('[id$="Section"]');
      sections.forEach((section) => {
        section.style.display = 'none';
      });
      // Show selected section
      const sectionName = item.getAttribute('data-section');
      if (sectionName) {
        const section = document.getElementById(`${sectionName}Section`);
        if (section) {
          section.style.display = 'block';
        }
      }
    });
  });
}

// Charts// Initialize Charts
function initCharts() {
  // Performance Chart
  const performanceChartEl = document.getElementById('performanceChart');
  if (performanceChartEl) {
    const ctx = performanceChartEl.getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
          {
            label: 'Stocks',
            data: [120000, 125000, 130000, 135000, 140000, 142568],
            borderColor: '#10B981',
            tension: 0.4,
            borderWidth: 2,
            pointBackgroundColor: '#10B981',
          },
          {
            label: 'Cash',
            data: [50000, 52000, 54000, 56000, 57000, 58246],
            borderColor: '#3B82F6',
            tension: 0.4,
            borderWidth: 2,
            pointBackgroundColor: '#3B82F6',
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            beginAtZero: false,
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
            ticks: {
              color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
              callback: (value) => '$' + value.toLocaleString(),
            },
          },
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
            ticks: { color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary') },
          },
        },
      },
    });
  }

// Allocation Chart
const allocationChartEl = document.getElementById('allocationChart');
if (allocationChartEl) {
  const ctx = allocationChartEl.getContext('2d');
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Stocks', 'Bonds', 'Real Estate', 'Cash', 'Alternatives'],
      datasets: [
        {
          data: [45, 25, 15, 10, 5],
          backgroundColor: ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899'],
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      cutout: '70%',
      plugins: { legend: { display: false } },
    },
  });
}
}

  // Income & Expenses Chart
  const incomeExpensesChartEl = document.getElementById('incomeExpensesChart');
  if (incomeExpensesChartEl) {
    const ctx = incomeExpensesChartEl.getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
          {
            label: 'Income',
            data: [5200, 5500, 5800, 6000, 6250, 6500],
            backgroundColor: '#10B981',
            borderRadius: 4,
          },
          {
            label: 'Expenses',
            data: [4800, 5100, 5300, 5400, 5200, 5500],
            backgroundColor: '#F59E0B',
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
            labels: { color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary') },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
            ticks: {
              color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
              callback: (value) => '$' + value.toLocaleString(),
            },
          },
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
            ticks: { color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary') },
          },
        },
      },
    });
  }

  // Income Breakdown Chart
  const incomeBreakdownChartEl = document.getElementById('incomeBreakdownChart');
  if (incomeBreakdownChartEl) {
    const ctx = incomeBreakdownChartEl.getContext('2d');
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Salary', 'Investments', 'Side Hustle'],
        datasets: [
          {
            data: [85, 10, 5],
            backgroundColor: ['#10B981', '#3B82F6', '#8B5CF6'],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        cutout: '70%',
        plugins: {
          legend: { display: false },
        },
      },
    });
  }

  // Expense Breakdown Chart
  const expenseBreakdownChartEl = document.getElementById('expenseBreakdownChart');
  if (expenseBreakdownChartEl) {
    const ctx = expenseBreakdownChartEl.getContext('2d');
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Housing', 'Food', 'Transportation', 'Entertainment', 'Other'],
        datasets: [
          {
            data: [35, 16, 9, 6, 34],
            backgroundColor: ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899'],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        cutout: '70%',
        plugins: {
          legend: { display: false },
        },
      },
    });
  }

  // Net Worth Chart
  const networthChartEl = document.getElementById('networthChart');
  if (networthChartEl) {
    const ctx = networthChartEl.getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
          {
            label: 'Net Worth',
            data: [220000, 225000, 230000, 235000, 240000, 248392],
            borderColor: '#10B981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true,
            tension: 0.4,
            borderWidth: 2,
            pointBackgroundColor: '#10B981',
          }
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: true },
        },
        scales: {
          y: {
            beginAtZero: false,
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
            ticks: {
              color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
              callback: (value) => '$' + value.toLocaleString(),
            },
          },
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
            ticks: { color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary') },
          },
        },
      },
    });
  }

  // Assets Breakdown Chart
  const assetsChartEl = document.getElementById('assetsBreakdownChart');
  if (assetsChartEl) {
    const ctx = assetsChartEl.getContext('2d');
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Investments', 'Real Estate', 'Cash', 'Other'],
        datasets: [
          {
            data: [50, 30, 15, 5],
            backgroundColor: ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B'],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        cutout: '70%',
        plugins: {
          legend: { display: false },
        },
      },
    });
  }

  // Liabilities Breakdown Chart
  const liabilitiesChartEl = document.getElementById('liabilitiesBreakdownChart');
  if (liabilitiesChartEl) {
    const ctx = liabilitiesChartEl.getContext('2d');
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Mortgage', 'Student Loans', 'Car Loan', 'Credit Cards'],
        datasets: [
          {
            data: [65, 20, 10, 5],
            backgroundColor: ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B'],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        cutout: '70%',
        plugins: {
          legend: { display: false },
        },
      },
    });
  }

  // Cash Flow Chart
  const cashflowChartEl = document.getElementById('cashflowChart');
  if (cashflowChartEl) {
    const ctx = cashflowChartEl.getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
          {
            label: 'Income',
            data: [5200, 5500, 5800, 6000, 6250, 6500],
            backgroundColor: '#10B981',
            borderRadius: 4,
          },
          {
            label: 'Expenses',
            data: [4800, 5100, 5300, 5400, 5200, 5500],
            backgroundColor: '#F59E0B',
            borderRadius: 4,
          },
          {
            label: 'Net Cash Flow',
            data: [400, 400, 500, 600, 1050, 1000],
            backgroundColor: '#3B82F6',
            borderRadius: 4,
          }
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
            labels: { color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary') },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
            ticks: {
              color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
              callback: (value) => '$' + value.toLocaleString(),
            },
          },
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
            ticks: { color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary') },
          },
        },
      },
    });
  }

  // Cash Flow Trend Chart
  const trendChartEl = document.getElementById('cashflowTrendChart');
  if (trendChartEl) {
    const ctx = trendChartEl.getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
          {
            label: 'Net Cash Flow',
            data: [400, 400, 500, 600, 1050, 1000],
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.4,
            borderWidth: 2,
            pointBackgroundColor: '#3B82F6',
          }
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: true },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
            ticks: {
              color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
              callback: (value) => '$' + value.toLocaleString(),
            },
          },
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
            ticks: { color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary') },
          },
        },
      },
    });
  }

  // Investment Performance Chart
  const performanceChartEl2 = document.getElementById('investmentPerformanceChart');
  if (performanceChartEl2) {
    const ctx = performanceChartEl2.getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
          {
            label: 'Portfolio',
            data: [120000, 125000, 130000, 135000, 140000, 142568],
            borderColor: '#10B981',
            tension: 0.4,
            borderWidth: 2,
            pointBackgroundColor: '#10B981',
          },
          {
            label: 'Benchmark',
            data: [120000, 123000, 127000, 131000, 135000, 138000],
            borderColor: '#3B82F6',
            tension: 0.4,
            borderWidth: 2,
            pointBackgroundColor: '#3B82F6',
            borderDash: [5, 5],
          }
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { 
            display: true,
            position: 'top',
            labels: { color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary') },
          },
        },
        scales: {
          y: {
            beginAtZero: false,
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
            ticks: {
              color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
              callback: (value) => '$' + value.toLocaleString(),
            },
          },
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.1)' },
            ticks: { color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary') },
          },
        },
      },
    });
  }

  // Investment Allocation Chart
  let allocationChartEl2 = document.getElementById('investmentAllocationChart');
  if (allocationChartEl2) {
    const ctx = allocationChartEl2.getContext('2d');
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['US Stocks', 'International Stocks', 'Bonds', 'Real Estate', 'Alternatives'],
        datasets: [
          {
            data: [45, 25, 15, 10, 5],
            backgroundColor: ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899'],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        cutout: '70%',
        plugins: {
          legend: { display: false },
        },
      },
    });
  }

  // Chart tabs
  const chartTabs = document.querySelectorAll('.chart-tab');
  chartTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabGroup = tab.closest('.chart-tabs');
      if (tabGroup) {
        const tabs = tabGroup.querySelectorAll('.chart-tab');
        tabs.forEach(t => t.classList.remove('active'));
      } else {
        chartTabs.forEach(t => t.classList.remove('active'));
      }
      
      tab.classList.add('active');
      
      // In a real app, you would switch charts here
      const chartType = tab.getAttribute('data-chart');
      console.log(`Switching to chart: ${chartType}`);
    });
  });

// Clock
function initClock() {
  const timeElement = document.getElementById('currentTime');
  const dateElement = document.getElementById('currentDate');
  const marketStatusElement = document.getElementById('marketStatus');
  if (!timeElement || !dateElement || !marketStatusElement) return;

  function updateTime() {
    const now = new Date();
    timeElement.textContent = now.toLocaleTimeString();
    dateElement.textContent = now.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const hours = now.getHours();
    const minutes = now.getMinutes();
    const day = now.getDay();

    if (day >= 1 && day <= 5 && ((hours === 9 && minutes >= 30) || (hours > 9 && hours < 16))) {
      const closingHour = 16;
      const hoursLeft = closingHour - hours - 1;
      const minutesLeft = 60 - minutes;
      marketStatusElement.textContent = `${hoursLeft}h ${minutesLeft}m`;
      marketStatusElement.classList.add('open');
      marketStatusElement.classList.remove('closed');
    } else {
      marketStatusElement.textContent = 'Closed';
      marketStatusElement.classList.add('closed');
      marketStatusElement.classList.remove('open');
    }
  }

  updateTime();
  setInterval(updateTime, 1000);
}

// Chat
function initChat() {
  const messageInput = document.getElementById('messageInput');
  const sendButton = document.getElementById('sendButton');
  const chatMessages = document.getElementById('chatMessages');
  if (!messageInput || !sendButton || !chatMessages) return;

  sendButton.addEventListener('click', sendMessage);
  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });

  function sendMessage() {
    const message = messageInput.value.trim();
    if (!message) return;

    const userMessageHTML = `
      <div class="message user">
        <div class="message-content">
          <p>${message}</p>
        </div>
      </div>
    `;
    chatMessages.insertAdjacentHTML('beforeend', userMessageHTML);
    messageInput.value = '';
    chatMessages.scrollTop = chatMessages.scrollHeight;

    setTimeout(() => {
      const aiResponse = getAIResponse(message);
      const aiMessageHTML = `
        <div class="message ai">
          <div class="message-avatar">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#8B5CF6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M2 12H22" stroke="#8B5CF6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M12 2C14.5013 4.73835 15.9228 8.29203 16 12C15.9228 15.708 14.5013 19.2616 12 22C9.49872 19.2616 8.07725 15.708 8 12C8.07725 8.29203 9.49872 4.73835 12 2Z" stroke="#8B5CF6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="message-content">
            <p>${aiResponse}</p>
          </div>
        </div>
      `;
      chatMessages.insertAdjacentHTML('beforeend', aiMessageHTML);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 1000);
  }

  function getAIResponse(message) {
    // Simple responses based on keywords
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('investment') || lowerMessage.includes('invest')) {
      return "Based on your risk profile and financial goals, I recommend allocating 60% to index funds, 30% to blue-chip stocks, and 10% to bonds. This balanced approach should provide steady growth while managing risk.";
    } else if (lowerMessage.includes('budget') || lowerMessage.includes('spending')) {
      return "Looking at your spending patterns, you could optimize your budget by reducing restaurant expenses by 15%. This would save approximately $120 per month that could be redirected to your vacation savings goal.";
    } else if (lowerMessage.includes('save') || lowerMessage.includes('saving')) {
      return "To reach your savings goal of $10,000 by next year, I recommend increasing your monthly contributions by $150. I've identified areas in your budget where you could make adjustments to accommodate this increase.";
    } else if (lowerMessage.includes('debt') || lowerMessage.includes('loan')) {
      return "Your current debt-to-income ratio is 28%, which is healthy. If you increase your monthly payment on your highest interest loan by $75, you could save $1,200 in interest and pay it off 8 months earlier.";
    } else if (lowerMessage.includes('retirement') || lowerMessage.includes('401k') || lowerMessage.includes('ira')) {
      return "Based on your current retirement contributions and projected growth, you're on track to reach 85% of your retirement goal. I recommend increasing your 401(k) contribution by 2% to fully meet your target retirement income.";
    } else if (lowerMessage.includes('tax') || lowerMessage.includes('taxes')) {
      return "I've identified several potential tax deductions you might be missing. Contributing more to your HSA and tracking your home office expenses could save you approximately $1,800 on your next tax return.";
    } else if (lowerMessage.includes('credit') || lowerMessage.includes('score')) {
      return "Your credit score is currently 742, which is good. To improve it further, I recommend reducing your credit utilization ratio by paying down your credit card balance and avoiding new credit applications for the next 6 months.";
    } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return "Hello! I'm your AI financial assistant. How can I help you with your finances today? You can ask me about investments, budgeting, savings strategies, debt management, or any other financial questions.";
    } else {
      return "I'm analyzing your request about \"" + message + "\". Based on your financial profile, I recommend reviewing your portfolio allocation to ensure it aligns with your long-term goals. Would you like me to provide more specific advice on this topic?";
    }
  }
}

// Transaction Filters
function initTransactionFilters() {
  const searchInput = document.getElementById('transactionSearch');
  const categoryFilter = document.getElementById('categoryFilter');
  const accountFilter = document.getElementById('accountFilter');
  const applyFiltersButton = document.getElementById('applyFilters');
  const transactionList = document.getElementById('transactionList');
  if (!searchInput || !categoryFilter || !accountFilter || !applyFiltersButton || !transactionList) return;

  applyFiltersButton.addEventListener('click', filterTransactions);
  searchInput.addEventListener('input', filterTransactions);
  categoryFilter.addEventListener('change', filterTransactions);
  accountFilter.addEventListener('change', filterTransactions);

  function filterTransactions() {
    const searchTerm = searchInput.value.toLowerCase();
    const category = categoryFilter.value;
    const account = accountFilter.value;
    const transactions = transactionList.querySelectorAll('.transaction-item');
    let visibleCount = 0;

    transactions.forEach((transaction) => {
      const title = transaction.querySelector('.transaction-title').textContent.toLowerCase();
      const transactionCategory = transaction.querySelector('.transaction-category')?.textContent.toLowerCase() || '';
      const transactionAccount = transaction.querySelector('.transaction-account')?.textContent.toLowerCase() || '';
      const matchesSearch = title.includes(searchTerm);
      const matchesCategory = category === 'all' || transactionCategory.includes(category.toLowerCase());
      const matchesAccount = account === 'all' || transactionAccount.includes(account.toLowerCase());

      if (matchesSearch && matchesCategory && matchesAccount) {
        transaction.style.display = 'flex';
        visibleCount++;
      } else {
        transaction.style.display = 'none';
      }
    });

    if (visibleCount === 0) {
      if (!document.getElementById('noTransactionsMessage')) {
        const noResultsMessage = document.createElement('div');
        noResultsMessage.id = 'noTransactionsMessage';
        noResultsMessage.className = 'text-center py-8 text-muted';
        noResultsMessage.textContent = 'No transactions found matching your filters.';
        transactionList.appendChild(noResultsMessage);
      }
    } else {
      const noResultsMessage = document.getElementById('noTransactionsMessage');
      if (noResultsMessage) {
        noResultsMessage.remove();
      }
    }
  }
}
    
    // Show message if no results
    if (visibleCount === 0) {
      if (!document.getElementById('noTransactionsMessage')) {
        const noResultsMessage = document.createElement('div');
        noResultsMessage.id = 'noTransactionsMessage';
        noResultsMessage.className = 'text-center py-8 text-muted';
        noResultsMessage.textContent = 'No transactions found matching your filters.';
        transactionList.appendChild(noResultsMessage);
      }
    } else {
      const noResultsMessage = document.getElementById('noTransactionsMessage');
      if (noResultsMessage) {
        noResultsMessage.remove();
      }
    }
  
  // View All Transactions button
  const viewAllButton = document.getElementById('viewAllTransactions');
  if (viewAllButton) {
    viewAllButton.addEventListener('click', () => {
      // Reset filters
      searchInput.value = '';
      categoryFilter.value = 'all';
      accountFilter.value = 'all';
      filterTransactions();
    });
  }
  
  // Add Transaction button
  const addTransactionButton = document.getElementById('addTransaction');
  if (addTransactionButton) {
    addTransactionButton.addEventListener('click', () => {
      alert('Opening add transaction form...');
      // In a real app, you would open a modal or form here
    });
  }

// Settings Section
function initSettingsSection() {
  // Settings tabs functionality
  const settingsTabs = document.querySelectorAll('.settings-tab');
  if (!settingsTabs.length) return;
  
  // Create content for each settings tab
  const settingsContent = {
    profile: `
      <div class="settings-section">
        <h3 class="settings-heading">Profile Information</h3>
        <form class="settings-form" id="profileForm">
          <div class="form-group">
            <label for="fullName">Full Name</label>
            <input type="text" id="fullName" value="Ramzan Kamzan" class="settings-input">
          </div>
          <div class="form-group">
            <label for="email">Email Address</label>
            <input type="email" id="email" value="ramzan.kamzan@example.com" class="settings-input">
          </div>
          <div class="form-group">
            <label for="phone">Phone Number</label>
            <input type="tel" id="phone" value="(555) 123-4567" class="settings-input">
          </div>
          <div class="form-group">
            <label for="address">Address</label>
            <textarea id="address" class="settings-textarea">123 Financial St, Money City, CA 90210</textarea>
          </div>
          <div class="form-group">
            <label for="currency">Currency</label>
            <select id="currency" class="settings-select">
              <option value="usd" selected>USD ($)</option>
              <option value="eur">EUR (€)</option>
              <option value="gbp">GBP (£)</option>
              <option value="jpy">JPY (¥)</option>
              <option value="cad">CAD ($)</option>
            </select>
          </div>
          <div class="form-group">
            <label for="language">Language</label>
            <select id="language" class="settings-select">
              <option value="en" selected>English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="zh">Chinese</option>
            </select>
          </div>
          <div class="form-actions">
            <button type="submit" class="settings-button primary">Save Changes</button>
            <button type="button" class="settings-button secondary">Cancel</button>
          </div>
        </form>
      </div>
    `,
    accounts: `
      <div class="settings-section">
        <h3 class="settings-heading">Linked Accounts</h3>
        <div class="linked-accounts">
          <div class="account-item p-4 bg-bg-secondary rounded-lg mb-4 border border-border">
            <div class="flex justify-between items-center mb-2">
              <div class="font-medium">Chase Bank</div>
              <div class="badge green-badge">Connected</div>
            </div>
            <div class="text-sm text-secondary mb-2">Checking •••4582</div>
            <div class="text-sm text-secondary">Last synced: Today, 9:45 AM</div>
            <div class="mt-3">
              <button class="settings-button secondary">Disconnect</button>
            </div>
          </div>
          
          <div class="account-item p-4 bg-bg-secondary rounded-lg mb-4 border border-border">
            <div class="flex justify-between items-center mb-2">
              <div class="font-medium">Vanguard</div>
              <div class="badge green-badge">Connected</div>
            </div>
            <div class="text-sm text-secondary mb-2">Investment •••7890</div>
            <div class="text-sm text-secondary">Last synced: Yesterday, 5:30 PM</div>
            <div class="mt-3">
              <button class="settings-button secondary">Disconnect</button>
            </div>
          </div>
          
          <div class="mt-4">
            <button class="settings-button primary">
              <span class="mr-2">+</span> Add New Account
            </button>
          </div>
        </div>
      </div>
    `,
    notifications: `
      <div class="settings-section">
        <h3 class="settings-heading">Notification Preferences</h3>
        <form class="settings-form" id="notificationsForm">
          <div class="form-group">
            <label class="flex items-center justify-between">
              <span>Email Notifications</span>
              <input type="checkbox" checked class="w-5 h-5">
            </label>
          </div>
          <div class="form-group">
            <label class="flex items-center justify-between">
              <span>Push Notifications</span>
              <input type="checkbox" checked class="w-5 h-5">
            </label>
          </div>
          <div class="form-group">
            <label class="flex items-center justify-between">
              <span>SMS Notifications</span>
              <input type="checkbox" class="w-5 h-5">
            </label>
          </div>
          
          <h4 class="text-lg font-medium mt-6 mb-4">Notification Types</h4>
          
          <div class="form-group">
            <label class="flex items-center justify-between">
              <span>Large Transactions (over $500)</span>
              <input type="checkbox" checked class="w-5 h-5">
            </label>
          </div>
          <div class="form-group">
            <label class="flex items-center justify-between">
              <span>Unusual Activity</span>
              <input type="checkbox" checked class="w-5 h-5">
            </label>
          </div>
          <div class="form-group">
            <label class="flex items-center justify-between">
              <span>Budget Alerts</span>
              <input type="checkbox" checked class="w-5 h-5">
            </label>
          </div>
          <div class="form-group">
            <label class="flex items-center justify-between">
              <span>Bill Reminders</span>
              <input type="checkbox" checked class="w-5 h-5">
            </label>
          </div>
          <div class="form-group">
            <label class="flex items-center justify-between">
              <span>Investment Updates</span>
              <input type="checkbox" checked class="w-5 h-5">
            </label>
          </div>
          <div class="form-group">
            <label class="flex items-center justify-between">
              <span>Marketing Communications</span>
              <input type="checkbox" class="w-5 h-5">
            </label>
          </div>
          
          <div class="form-actions">
            <button type="submit" class="settings-button primary">Save Preferences</button>
            <button type="button" class="settings-button secondary">Reset to Default</button>
          </div>
        </form>
      </div>
    `,
    preferences: `
      <div class="settings-section">
        <h3 class="settings-heading">App Preferences</h3>
        <form class="settings-form" id="preferencesForm">
          <div class="form-group">
            <label for="defaultView">Default Dashboard View</label>
            <select id="defaultView" class="settings-select">
              <option value="overview" selected>Overview</option>
              <option value="investments">Investments</option>
              <option value="budget">Budget</option>
              <option value="transactions">Transactions</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="dateFormat">Date Format</label>
            <select id="dateFormat" class="settings-select">
              <option value="mm/dd/yyyy" selected>MM/DD/YYYY</option>
              <option value="dd/mm/yyyy">DD/MM/YYYY</option>
              <option value="yyyy-mm-dd">YYYY-MM-DD</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="timeFormat">Time Format</label>
            <select id="timeFormat" class="settings-select">
              <option value="12h" selected>12-hour (AM/PM)</option>
              <option value="24h">24-hour</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="flex items-center justify-between">
              <span>Enable Dark Mode</span>
              <input type="checkbox" checked class="w-5 h-5" id="darkModeToggle">
            </label>
          </div>
          
          <div class="form-group">
            <label class="flex items-center justify-between">
              <span>Enable Animations</span>
              <input type="checkbox" checked class="w-5 h-5">
            </label>
          </div>
          
          <div class="form-group">
            <label class="flex items-center justify-between">
              <span>Auto-refresh Data</span>
              <input type="checkbox" checked class="w-5 h-5">
            </label>
          </div>
          
          <div class="form-actions">
            <button type="submit" class="settings-button primary">Save Preferences</button>
            <button type="button" class="settings-button secondary">Reset to Default</button>
          </div>
        </form>
      </div>
    `,
    security: `
      <div class="settings-section">
        <h3 class="settings-heading">Security Settings</h3>
        <form class="settings-form" id="securityForm">
          <div class="form-group">
            <label for="currentPassword">Current Password</label>
            <input type="password" id="currentPassword" class="settings-input" placeholder="Enter current password">
          </div>
          
          <div class="form-group">
            <label for="newPassword">New Password</label>
            <input type="password" id="newPassword" class="settings-input" placeholder="Enter new password">
          </div>
          
          <div class="form-group">
            <label for="confirmPassword">Confirm New Password</label>
            <input type="password" id="confirmPassword" class="settings-input" placeholder="Confirm new password">
          </div>
          
          <div class="form-group">
            <label class="flex items-center justify-between">
              <span>Enable Two-Factor Authentication</span>
              <input type="checkbox" class="w-5 h-5">
            </label>
          </div>
          
          <div class="form-group">
            <label class="flex items-center justify-between">
              <span>Require Password for Transactions</span>
              <input type="checkbox" checked class="w-5 h-5">
            </label>
          </div>
          
          <div class="form-group">
            <label for="sessionTimeout">Session Timeout</label>
            <select id="sessionTimeout" class="settings-select">
              <option value="15">15 minutes</option>
              <option value="30" selected>30 minutes</option>
              <option value="60">1 hour</option>
              <option value="120">2 hours</option>
            </select>
          </div>
          
          <div class="form-actions">
            <button type="submit" class="settings-button primary">Update Security Settings</button>
          </div>
        </form>
        
        <div class="mt-8 pt-6 border-t border-border">
          <h4 class="text-lg font-medium mb-4">Login History</h4>
          <div class="login-history">
            <div class="history-item p-3 bg-bg-secondary rounded-lg mb-3">
              <div class="flex justify-between">
                <div class="font-medium">Current Session</div>
                <div class="badge green-badge">Active</div>
              </div>
              <div class="text-sm text-secondary mt-1">Chrome on Windows • IP: 192.168.1.1</div>
              <div class="text-xs text-muted mt-1">Started: Today, 9:45 AM</div>
            </div>
            
            <div class="history-item p-3 bg-bg-secondary rounded-lg mb-3">
              <div class="flex justify-between">
                <div class="font-medium">Previous Login</div>
              </div>
              <div class="text-sm text-secondary mt-1">Safari on iPhone • IP: 192.168.1.2</div>
              <div class="text-xs text-muted mt-1">Yesterday, 7:30 PM</div>
            </div>
          </div>
        </div>
      </div>
    `
  };
  
  // Settings content container
  const settingsContentContainer = document.querySelector('.settings-content');
  if (!settingsContentContainer) return;
  
  // Handle tab clicks
  settingsTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active class from all tabs
      settingsTabs.forEach(t => t.classList.remove('active'));
      
      // Add active class to clicked tab
      tab.classList.add('active');
      
      // Update content based on selected tab
      const tabName = tab.getAttribute('data-settings');
      if (tabName && settingsContent[tabName]) {
        settingsContentContainer.innerHTML = settingsContent[tabName];
        
        // Initialize form handlers for the new content
        initSettingsFormHandlers();
      }
    });
  });
  
  // Initialize form handlers
  function initSettingsFormHandlers() {
    // Profile form
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
      profileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Profile information saved successfully!');
      });
    }
    
    // Notifications form
    const notificationsForm = document.getElementById('notificationsForm');
    if (notificationsForm) {
      notificationsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Notification preferences saved successfully!');
      });
    }
    
    // Preferences form
    const preferencesForm = document.getElementById('preferencesForm');
    if (preferencesForm) {
      preferencesForm.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('App preferences saved successfully!');
      });
      
      // Dark mode toggle in preferences
      const darkModeToggle = document.getElementById('darkModeToggle');
      if (darkModeToggle) {
        darkModeToggle.checked = document.body.classList.contains('dark');
        darkModeToggle.addEventListener('change', () => {
          if (darkModeToggle.checked) {
            document.body.classList.remove('light');
            document.body.classList.add('dark');
            localStorage.setItem('theme', 'dark');
          } else {
            document.body.classList.remove('dark');
            document.body.classList.add('light');
            localStorage.setItem('theme', 'light');
          }
        });
      }
    }
    
    // Security form
    const securityForm = document.getElementById('securityForm');
    if (securityForm) {
      securityForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (!currentPassword) {
          alert('Please enter your current password.');
          return;
        }
        
        if (newPassword !== confirmPassword) {
          alert('New passwords do not match.');
          return;
        }
        
        if (newPassword && newPassword.length < 8) {
          alert('New password must be at least 8 characters long.');
          return;
        }
        
        alert('Security settings updated successfully!');
      });
    }
    
    // Account buttons
    const disconnectButtons = document.querySelectorAll('.account-item .settings-button');
    disconnectButtons.forEach(button => {
      button.addEventListener('click', () => {
        const accountName = button.closest('.account-item').querySelector('.font-medium').textContent;
        alert(`Disconnected ${accountName} account.`);
        button.closest('.account-item').style.opacity = '0.5';
      });
    });
    
    // Add account button
    const addAccountButton = document.querySelector('.linked-accounts .settings-button.primary');
    if (addAccountButton) {
      addAccountButton.addEventListener('click', () => {
        alert('Opening account connection wizard...');
      });
    }
  }
  
  // Initialize with default tab (profile)
  if (settingsContentContainer && settingsContent.profile) {
    settingsContentContainer.innerHTML = settingsContent.profile;
    initSettingsFormHandlers();
  }
}

// Reports Section
function initReportsSection() {
  // Report tabs functionality
  const reportTabs = document.querySelectorAll('.report-tab');
  if (!reportTabs.length) return;
  
  // Create content for each report tab
  const reportContent = {
    income: `
      <div class="chart-container large">
        <canvas id="incomeExpensesChart" height="300"></canvas>
      </div>

      <div class="report-summary">
        <div class="summary-card">
          <div class="summary-title">Total Income</div>
          <div class="summary-value">$6,250.00</div>
          <div class="summary-change up">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="12" height="12">
              <path d="M12 19V5M5 12L12 5L19 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            +12.5% from last month
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-title">Total Expenses</div>
          <div class="summary-value">$5,200.00</div>
          <div class="summary-change down">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="12" height="12">
              <path d="M12 5V19M19 12L12 19L5 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            -3.2% from last month
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-title">Savings</div>
          <div class="summary-value">$1,050.00</div>
          <div class="summary-change up">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="12" height="12">
              <path d="M12 19V5M5 12L12 5L19 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            +32.8% from last month
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-title">Savings Rate</div>
          <div class="summary-value">16.8%</div>
          <div class="summary-change up">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="12" height="12">
              <path d="M12 19V5M5 12L12 5L19 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            +5.2% from last month
          </div>
        </div>
      </div>

      <div class="report-details">
        <div class="card">
          <div class="card-header">
            <div class="card-title">Income Breakdown</div>
          </div>
          <div class="card-content">
            <div class="pie-chart-container">
              <canvas id="incomeBreakdownChart" height="200"></canvas>
            </div>
            <div class="chart-legend">
              <div class="legend-item">
                <div class="legend-color" style="background-color: #10B981;"></div>
                <div class="legend-label">Salary (85%)</div>
              </div>
              <div class="legend-item">
                <div class="legend-color" style="background-color: #3B82F6;"></div>
                <div class="legend-label">Investments (10%)</div>
              </div>
              <div class="legend-item">
                <div class="legend-color" style="background-color: #8B5CF6;"></div>
                <div class="legend-label">Side Hustle (5%)</div>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <div class="card-title">Expense Breakdown</div>
          </div>
          <div class="card-content">
            <div class="pie-chart-container">
              <canvas id="expenseBreakdownChart" height="200"></canvas>
            </div>
            <div class="chart-legend">
              <div class="legend-item">
                <div class="legend-color" style="background-color: #10B981;"></div>
                <div class="legend-label">Housing (35%)</div>
              </div>
              <div class="legend-item">
                <div class="legend-color" style="background-color: #3B82F6;"></div>
                <div class="legend-label">Food (16%)</div>
              </div>
              <div class="legend-item">
                <div class="legend-color" style="background-color: #8B5CF6;"></div>
                <div class="legend-label">Transportation (9%)</div>
              </div>
              <div class="legend-item">
                <div class="legend-color" style="background-color: #F59E0B;"></div>
                <div class="legend-label">Entertainment (6%)</div>
              </div>
              <div class="legend-item">
                <div class="legend-color" style="background-color: #EC4899;"></div>
                <div class="legend-label">Other (34%)</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
    networth: `
      <div class="chart-container large">
        <canvas id="networthChart" height="300"></canvas>
      </div>

      <div class="report-summary">
        <div class="summary-card">
          <div class="summary-title">Total Net Worth</div>
          <div class="summary-value">$248,392.54</div>
          <div class="summary-change up">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="12" height="12">
              <path d="M12 19V5M5 12L12 5L19 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            +8.3% from last month
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-title">Total Assets</div>
          <div class="summary-value">$285,450.00</div>
          <div class="summary-change up">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="12" height="12">
              <path d="M12 19V5M5 12L12 5L19 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            +7.2% from last month
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-title">Total Liabilities</div>
          <div class="summary-value">$37,057.46</div>
          <div class="summary-change down">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="12" height="12">
              <path d="M12 5V19M19 12L12 19L5 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            -2.1% from last month
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-title">Debt-to-Asset Ratio</div>
          <div class="summary-value">13.0%</div>
          <div class="summary-change up">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="12" height="12">
              <path d="M12 19V5M5 12L12 5L19 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            +1.2% from last month
          </div>
        </div>
      </div>

      <div class="report-details">
        <div class="card">
          <div class="card-header">
            <div class="card-title">Assets Breakdown</div>
          </div>
          <div class="card-content">
            <div class="pie-chart-container">
              <canvas id="assetsBreakdownChart" height="200"></canvas>
            </div>
            <div class="chart-legend">
              <div class="legend-item">
                <div class="legend-color" style="background-color: #10B981;"></div>
                <div class="legend-label">Investments (50%)</div>
              </div>
              <div class="legend-item">
                <div class="legend-color" style="background-color: #3B82F6;"></div>
                <div class="legend-label">Real Estate (30%)</div>
              </div>
              <div class="legend-item">
                <div class="legend-color" style="background-color: #8B5CF6;"></div>
                <div class="legend-label">Cash (15%)</div>
              </div>
              <div class="legend-item">
                <div class="legend-color" style="background-color: #F59E0B;"></div>
                <div class="legend-label">Other (5%)</div>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <div class="card-title">Liabilities Breakdown</div>
          </div>
          <div class="card-content">
            <div class="pie-chart-container">
              <canvas id="liabilitiesBreakdownChart" height="200"></canvas>
            </div>
            <div class="chart-legend">
              <div class="legend-item">
                <div class="legend-color" style="background-color: #10B981;"></div>
                <div class="legend-label">Mortgage (65%)</div>
              </div>
              <div class="legend-item">
                <div class="legend-color" style="background-color: #3B82F6;"></div>
                <div class="legend-label">Student Loans (20%)</div>
              </div>
              <div class="legend-item">
                <div class="legend-color" style="background-color: #8B5CF6;"></div>
                <div class="legend-label">Car Loan (10%)</div>
              </div>
              <div class="legend-item">
                <div class="legend-color" style="background-color: #F59E0B;"></div>
                <div class="legend-label">Credit Cards (5%)</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
    cashflow: `
      <div class="chart-container large">
        <canvas id="cashflowChart" height="300"></canvas>
      </div>

      <div class="report-summary">
        <div class="summary-card">
          <div class="summary-title">Monthly Cash Flow</div>
          <div class="summary-value">+$1,050.00</div>
          <div class="summary-change up">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="12" height="12">
              <path d="M12 19V5M5 12L12 5L19 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            +15.3% from last month
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-title">Average Daily Spending</div>
          <div class="summary-value">$173.33</div>
          <div class="summary-change down">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="12" height="12">
              <path d="M12 5V19M19 12L12 19L5 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            -5.2% from last month
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-title">Largest Expense</div>
          <div class="summary-value">Housing</div>
          <div class="summary-change">
            $1,800.00 (34.6% of expenses)
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-title">Discretionary Spending</div>
          <div class="summary-value">$1,250.00</div>
          <div class="summary-change down">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="12" height="12">
              <path d="M12 5V19M19 12L12 19L5 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            -8.7% from last month
          </div>
        </div>
      </div>

      <div class="report-details">
        <div class="card">
          <div class="card-header">
            <div class="card-title">Monthly Cash Flow Trend</div>
          </div>
          <div class="card-content">
            <div class="chart-container">
              <canvas id="cashflowTrendChart" height="200"></canvas>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <div class="card-title">Top Spending Categories</div>
          </div>
          <div class="card-content">
            <div class="spending-categories">
              <div class="category-item p-3 border-b border-border">
                <div class="flex justify-between mb-1">
                  <div class="font-medium">Housing</div>
                  <div>$1,800.00</div>
                </div>
                <div class="progress-bar small">
                  <div class="progress-fill" style="width: 34.6%; background-color: #10B981;"></div>
                </div>
              </div>
              
              <div class="category-item p-3 border-b border-border">
                <div class="flex justify-between mb-1">
                  <div class="font-medium">Food</div>
                  <div>$850.00</div>
                </div>
                <div class="progress-bar small">
                  <div class="progress-fill" style="width: 16.3%; background-color: #3B82F6;"></div>
                </div>
              </div>
              
              <div class="category-item p-3 border-b border-border">
                <div class="flex justify-between mb-1">
                  <div class="font-medium">Transportation</div>
                  <div>$450.00</div>
                </div>
                <div class="progress-bar small">
                  <div class="progress-fill" style="width: 8.7%; background-color: #8B5CF6;"></div>
                </div>
              </div>
              
              <div class="category-item p-3 border-b border-border">
                <div class="flex justify-between mb-1">
                  <div class="font-medium">Entertainment</div>
                  <div>$320.00</div>
                </div>
                <div class="progress-bar small">
                  <div class="progress-fill" style="width: 6.2%; background-color: #F59E0B;"></div>
                </div>
              </div>
              
              <div class="category-item p-3">
                <div class="flex justify-between mb-1">
                  <div class="font-medium">Shopping</div>
                  <div>$380.00</div>
                </div>
                <div class="progress-bar small">
                  <div class="progress-fill" style="width: 7.3%; background-color: #EC4899;"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
    investments: `
      <div class="chart-container large">
        <canvas id="investmentPerformanceChart" height="300"></canvas>
      </div>

      <div class="report-summary">
        <div class="summary-card">
          <div class="summary-title">Total Investments</div>
          <div class="summary-value">$142,568.32</div>
          <div class="summary-change up">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="12" height="12">
              <path d="M12 19V5M5 12L12 5L19 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            +5.8% from last month
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-title">YTD Return</div>
          <div class="summary-value">12.4%</div>
          <div class="summary-change up">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="12" height="12">
              <path d="M12 19V5M5 12L12 5L19 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            +2.1% from benchmark
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-title">Dividend Income</div>
          <div class="summary-value">$1,845.32</div>
          <div class="summary-change up">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="12" height="12">
              <path d="M12 19V5M5 12L12 5L19 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            +3.2% from last year
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-title">Risk Score</div>
          <div class="summary-value">65/100</div>
          <div class="summary-change">
            Moderate Risk
          </div>
        </div>
      </div>

      <div class="report-details">
        <div class="card">
          <div class="card-header">
            <div class="card-title">Asset Allocation</div>
          </div>
          <div class="card-content">
            <div class="pie-chart-container">
              <canvas id="investmentAllocationChart" height="200"></canvas>
            </div>
            <div class="chart-legend">
              <div class="legend-item">
                <div class="legend-color" style="background-color: #10B981;"></div>
                <div class="legend-label">US Stocks (45%)</div>
              </div>
              <div class="legend-item">
                <div class="legend-color" style="background-color: #3B82F6;"></div>
                <div class="legend-label">International Stocks (25%)</div>
              </div>
              <div class="legend-item">
                <div class="legend-color" style="background-color: #8B5CF6;"></div>
                <div class="legend-label">Bonds (15%)</div>
              </div>
              <div class="legend-item">
                <div class="legend-color" style="background-color: #F59E0B;"></div>
                <div class="legend-label">Real Estate (10%)</div>
              </div>
              <div class="legend-item">
                <div class="legend-color" style="background-color: #EC4899;"></div>
                <div class="legend-label">Alternatives (5%)</div>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <div class="card-title">Top Holdings</div>
          </div>
          <div class="card-content">
            <div class="holdings-list">
              <div class="holding-item p-3 border-b border-border">
                <div class="flex justify-between mb-1">
                  <div class="font-medium">AAPL</div>
                  <div>$12,450.00</div>
                </div>
                <div class="flex justify-between text-xs text-secondary">
                  <div>Apple Inc.</div>
                  <div class="text-accent-green">+15.3%</div>
                </div>
              </div>
              
              <div class="holding-item p-3 border-b border-border">
                <div class="flex justify-between mb-1">
                  <div class="font-medium">MSFT</div>
                  <div>$10,820.00</div>
                </div>
                <div class="flex justify-between text-xs text-secondary">
                  <div>Microsoft Corp.</div>
                  <div class="text-accent-green">+12.7%</div>
                </div>
              </div>
              
              <div class="holding-item p-3 border-b border-border">
                <div class="flex justify-between mb-1">
                  <div class="font-medium">AMZN</div>
                  <div>$8,950.00</div>
                </div>
                <div class="flex justify-between text-xs text-secondary">
                  <div>Amazon.com Inc.</div>
                  <div class="text-accent-green">+9.2%</div>
                </div>
              </div>
              
              <div class="holding-item p-3 border-b border-border">
                <div class="flex justify-between mb-1">
                  <div class="font-medium">GOOGL</div>
                  <div>$7,650.00</div>
                </div>
                <div class="flex justify-between text-xs text-secondary">
                  <div>Alphabet Inc.</div>
                  <div class="text-accent-green">+8.5%</div>
                </div>
              </div>
              
              <div class="holding-item p-3">
                <div class="flex justify-between mb-1">
                  <div class="font-medium">VTI</div>
                  <div>$15,200.00</div>
                </div>
                <div class="flex justify-between text-xs text-secondary">
                  <div>Vanguard Total Stock Market ETF</div>
                  <div class="text-accent-green">+7.8%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
  };
  
  // Report content container
  const reportContentContainer = document.querySelector('.report-content');
  if (!reportContentContainer) return;
  
  // Handle tab clicks
  reportTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active class from all tabs
      reportTabs.forEach(t => t.classList.remove('active'));
      
      // Add active class to clicked tab
      tab.classList.add('active');
      
      // Update content based on selected tab
      const tabName = tab.getAttribute('data-report');
      if (tabName && reportContent[tabName]) {
        reportContentContainer.innerHTML = reportContent[tabName];
        
        // Initialize charts for the new content
        initReportCharts(tabName);
      }
    });
  });
  
  // Initialize charts for reports
  function initReportCharts(reportType) {
    // Re-initialize charts based on the report type
    setTimeout(() => {
      initCharts();
    }, 100);
  }
  
  // Initialize with default tab (income)
  if (reportContentContainer && reportContent.income) {
    reportContentContainer.innerHTML = reportContent.income;
    setTimeout(() => {
      initCharts();
    }, 100);
  }
  
  // Report period selector
  const reportPeriodSelect = document.getElementById('reportPeriod');
  if (reportPeriodSelect) {
    reportPeriodSelect.addEventListener('change', () => {
      const period = reportPeriodSelect.value;
      alert(`Changed report period to: ${period}`);
      
      // In a real app, you would update the charts and data here
    });
  }
  
  // Download button
  const downloadButton = document.querySelector('.download-button');
  if (downloadButton) {
    downloadButton.addEventListener('click', () => {
      alert('Downloading report as PDF...');
    });
  }
}

// Budget Section
function initBudgetSection() {
  const refreshButton = document.querySelector('#budgetSection .refresh-button');
  if (refreshButton) {
    refreshButton.addEventListener('click', () => {
      alert('Refreshing budget data...');
    });
  }
}
  
  // Budget category buttons
  const budgetCategoryButtons = document.querySelectorAll('.budget-category-button');
  if (budgetCategoryButtons.length) {
    budgetCategoryButtons.forEach(button => {
      button.addEventListener('click', () => {
        const categoryName = button.textContent.trim();
        alert(`Viewing details for ${categoryName} category`);
      });
    });
  }
  
  // Add budget item button
  const addBudgetButton = document.querySelector('.add-budget-button');
  if (addBudgetButton) {
    addBudgetButton.addEventListener('click', () => {
      alert('Opening form to add new budget item...');
    });
  }
  
  // Budget progress bars
  const budgetBars = document.querySelectorAll('.budget-progress-bar');
  if (budgetBars.length) {
    budgetBars.forEach(bar => {
      const fill = bar.querySelector('.budget-progress-fill');
      if (fill) {
        const percent = parseInt(fill.getAttribute('data-percent') || '0');
        fill.style.width = `${percent}%`;
        
        // Add warning class if over 80% spent
        if (percent > 80) {
          fill.classList.add('warning');
        }
      }
    });
  }

// Initialize all forms
document.addEventListener('submit', function(e) {
  e.preventDefault();
  const formId = e.target.id;
  
  if (formId) {
    alert(`Form ${formId} submitted successfully!`);
  }
});

// Initialize all buttons
document.addEventListener('click', function(e) {
  if (e.target.tagName === 'BUTTON' && e.target.classList.contains('text-button')) {
    const buttonText = e.target.textContent.trim();
    alert(`Button clicked: ${buttonText}`);
  }
});

// Fix for settings section
document.addEventListener('DOMContentLoaded', function() {
  // Fix the syntax error in the settings section
  const settingsContentContainer = document.querySelector('.settings-content');
  if (settingsContentContainer) {
    settingsContentContainer.innerHTML = `
      <div class="settings-section">
        <h3 class="settings-heading">Profile Information</h3>
        <form class="settings-form" id="profileForm">
          <div class="form-group">
            <label for="fullName">Full Name</label>
            <input type="text" id="fullName" value="Ramzan Kamzan" class="settings-input">
          </div>
          <div class="form-group">
            <label for="email">Email Address</label>
            <input type="email" id="email" value="ramzan.kamzan@example.com" class="settings-input">
          </div>
          <div class="form-group">
            <label for="phone">Phone Number</label>
            <input type="tel" id="phone" value="(555) 123-4567" class="settings-input">
          </div>
          <div class="form-group">
            <label for="address">Address</label>
            <textarea id="address" class="settings-textarea">123 Financial St, Money City, CA 90210</textarea>
          </div>
          <div class="form-group">
            <label for="currency">Currency</label>
            <select id="currency" class="settings-select">
              <option value="usd" selected>USD ($)</option>
              <option value="eur">EUR (€)</option>
              <option value="gbp">GBP (£)</option>
              <option value="jpy">JPY (¥)</option>
              <option value="cad">CAD ($)</option>
            </select>
          </div>
          <div class="form-group">
            <label for="language">Language</label>
            <select id="language" class="settings-select">
              <option value="en" selected>English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="zh">Chinese</option>
            </select>
          </div>
          <div class="form-actions">
            <button type="submit" class="settings-button primary">Save Changes</button>
            <button type="button" class="settings-button secondary">Cancel</button>
          </div>
        </form>
      </div>
    `;
  }
});