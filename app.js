// Configuration
const API_BASE_URL = 'https://evstats-sgar.st-gardelis.workers.dev/';
const MAKERS_API_URL = 'https://evstats.gr/api/makerMetrics';

// Makers to track
const MAKERS = ["total", "byd", "tesla", "volvo", "hyundai", "geely", "leapmotor", "volkswagen", "bmw", "changan deepal"];

// CORS Proxy - Try different ones if one doesn't work
// Option 1: corsproxy.io (recommended - most reliable)
const CORS_PROXY = 'https://corsproxy.io/?';

// Option 2: allOrigins (may have 502 errors)
// const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

// Option 3: thingproxy
// const CORS_PROXY = 'https://thingproxy.freeboard.io/fetch/';

// Set to true to use CORS proxy
const USE_CORS_PROXY = false;

let currentSortMode = 'count';
let modelsData = [];
let monthlyTotalCars = 0; // Track total for percentage calculation
let currentMakersTab = 'monthly';

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    // Set today's date as default
    const today = new Date();
    document.getElementById('dateInput').valueAsDate = today;
    
    // Show CORS info if proxy is enabled
    if (USE_CORS_PROXY) {
        const corsInfo = document.getElementById('corsInfo');
        if (corsInfo) {
            corsInfo.style.display = 'flex';
        }
    }
    
    // Load monthly data on start
    loadMonthlyData();
    updateCurrentMonth();
    
    // Load makers data
    loadMakersData('monthly');
}

// Get current month and year
function getCurrentMonthDates() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const today = new Date();
    const lastDay = today < lastDayOfMonth ? today : lastDayOfMonth;
    
    return { firstDay, lastDay, year, month };
}

// Format date as YYYY-MM-DD
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Format date for display (Greek)
function formatDateGreek(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('el-GR', { 
        weekday: 'long',
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

// Update current month display
function updateCurrentMonth() {
    const { year, month } = getCurrentMonthDates();
    const monthNames = [
        'Ιανουάριος', 'Φεβρουάριος', 'Μάρτιος', 'Απρίλιος', 'Μάιος', 'Ιούνιος',
        'Ιούλιος', 'Αύγουστος', 'Σεπτέμβριος', 'Οκτώβριος', 'Νοέμβριος', 'Δεκέμβριος'
    ];
    
    document.getElementById('currentMonth').textContent = `${monthNames[month]} ${year}`;
}

// Search by specific date
async function searchByDate() {
    const dateInput = document.getElementById('dateInput');
    const dateValue = dateInput.value;
    
    if (!dateValue) {
        alert('Παρακαλώ επιλέξτε μια ημερομηνία');
        return;
    }
    
    try {
        showLoading();
        updateLoadingDetail(`Φόρτωση δεδομένων για ${formatDateGreek(dateValue)}...`);
        
        const data = await fetchDayData(dateValue);
        
        if (!data) {
            showError(`Δεν βρέθηκαν δεδομένα για την ημερομηνία ${formatDateGreek(dateValue)}`);
            setTimeout(() => {
                hideLoading();
                document.getElementById('errorContainer').style.display = 'none';
            }, 3000);
            return;
        }
        
        displayDailyResults(dateValue, data);
        hideLoading();
        
    } catch (error) {
        console.error('Error searching by date:', error);
        showError('Σφάλμα κατά την αναζήτηση. Παρακαλώ δοκιμάστε ξανά.');
        setTimeout(() => {
            hideLoading();
            document.getElementById('errorContainer').style.display = 'none';
        }, 3000);
    }
}

// Display daily results
function displayDailyResults(dateStr, data) {
    const dailyResults = document.getElementById('dailyResults');
    const selectedDate = document.getElementById('selectedDate');
    const dailyTotal = document.getElementById('dailyTotal');
    const dailyModels = document.getElementById('dailyModels');
    const dailyTableBody = document.getElementById('dailyTableBody');
    
    // Extract models from API response (trying both v1 and v2)
    let models = {};
    let total = 0;
    
    if (data.v2 && data.v2.cars && data.v2.cars.models) {
        models = data.v2.cars.models;
        total = data.v2.cars.total || 0;
    } else if (data.v1 && data.v1.cars && data.v1.cars.models) {
        models = data.v1.cars.models;
        total = data.v1.cars.total || 0;
    }
    
    // Convert to array and sort
    const modelsArray = Object.entries(models)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
    
    // Update display
    selectedDate.textContent = formatDateGreek(dateStr);
    dailyTotal.textContent = total.toLocaleString('el-GR');
    dailyModels.textContent = modelsArray.length.toLocaleString('el-GR');
    
    // Render table
    dailyTableBody.innerHTML = '';
    
    if (modelsArray.length === 0) {
        dailyTableBody.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 2rem; color: var(--color-text-muted);">Δεν υπάρχουν ταξινομήσεις για αυτή την ημέρα</td></tr>';
    } else {
        modelsArray.forEach((model, index) => {
            const tr = document.createElement('tr');
            
            // Rank
            const rankTd = document.createElement('td');
            const rankSpan = document.createElement('span');
            rankSpan.className = index < 3 ? 'rank top-3' : 'rank';
            rankSpan.textContent = index + 1;
            rankTd.appendChild(rankSpan);
            tr.appendChild(rankTd);
            
            // Model name
            const modelTd = document.createElement('td');
            const modelSpan = document.createElement('span');
            modelSpan.className = 'model-name';
            modelSpan.textContent = model.name;
            modelTd.appendChild(modelSpan);
            tr.appendChild(modelTd);
            
            // Count
            const countTd = document.createElement('td');
            const countSpan = document.createElement('span');
            countSpan.className = 'count';
            countSpan.textContent = model.count.toLocaleString('el-GR');
            countTd.appendChild(countSpan);
            tr.appendChild(countTd);
            
            dailyTableBody.appendChild(tr);
        });
    }
    
    // Show results
    dailyResults.style.display = 'block';
    
    // Scroll to results
    setTimeout(() => {
        dailyResults.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
}

// Load monthly aggregated data
async function loadMonthlyData() {
    try {
        showLoading();
        updateLoadingDetail('Φόρτωση μηνιαίων δεδομένων...');
        
        const aggregatedData = await fetchAllDaysData();
        
        if (aggregatedData.models.length === 0) {
            showError('Δεν βρέθηκαν δεδομένα για τον τρέχοντα μήνα.');
            return;
        }
        
        modelsData = aggregatedData.models;
        
        updateStats(aggregatedData);
        renderTable(modelsData);
        updateLastUpdate();
        
        hideLoading();
        showResults();
        
    } catch (error) {
        console.error('Error loading monthly data:', error);
        showError('Σφάλμα κατά τη φόρτωση των δεδομένων. Παρακαλώ δοκιμάστε ξανά.');
    }
}

// Fetch data for all days in the current month
async function fetchAllDaysData() {
    const { firstDay, lastDay } = getCurrentMonthDates();
    const allModels = {};
    let totalCars = 0;
    let daysWithData = 0;
    
    const currentDate = new Date(firstDay);
    const promises = [];
    
    while (currentDate <= lastDay) {
        const dateStr = formatDate(currentDate);
        promises.push(fetchDayData(dateStr));
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    updateLoadingDetail(`Ανάκτηση δεδομένων για ${promises.length} ημέρες...`);
    
    const results = await Promise.allSettled(promises);
    
    results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value) {
            const dayData = result.value;
            
            // Try v2 first, then v1
            let models = {};
            let total = 0;
            
            if (dayData.v2 && dayData.v2.cars) {
                models = dayData.v2.cars.models || {};
                total = dayData.v2.cars.total || 0;
            } else if (dayData.v1 && dayData.v1.cars) {
                models = dayData.v1.cars.models || {};
                total = dayData.v1.cars.total || 0;
            }
            
            if (Object.keys(models).length > 0) {
                daysWithData++;
                
                Object.entries(models).forEach(([model, count]) => {
                    if (!allModels[model]) {
                        allModels[model] = 0;
                    }
                    allModels[model] += count;
                });
                
                totalCars += total;
            }
        }
    });
    
    const modelsArray = Object.entries(allModels)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
    
    return {
        models: modelsArray,
        totalCars,
        totalModels: modelsArray.length,
        daysWithData
    };
}

// Fetch data for a specific day
async function fetchDayData(dateStr) {
    // List of CORS proxies to try (in order)
    const proxies = [
        'https://corsproxy.io/?',
        'https://api.allorigins.win/raw?url=',
        'https://thingproxy.freeboard.io/fetch/',
    ];
    
    const directUrl = `${API_BASE_URL}/${dateStr}`;
    
    // Try direct access first (if not using proxy)
    if (!USE_CORS_PROXY) {
        try {
            const response = await fetch(directUrl);
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.warn('Direct access failed, trying proxies...');
        }
    }
    
    // Try each proxy
    for (const proxy of proxies) {
        try {
            const url = `${proxy}${encodeURIComponent(directUrl)}`;
            const response = await fetch(url);
            
            if (response.ok) {
                const data = await response.json();
                console.log(`✅ Success with proxy: ${proxy}`);
                return data;
            }
        } catch (error) {
            console.warn(`❌ Proxy failed: ${proxy}`, error.message);
            continue;
        }
    }
    
    console.error(`All proxies failed for ${dateStr}`);
    return null;
}

// Update stats display
function updateStats(data) {
    document.getElementById('totalCars').textContent = data.totalCars.toLocaleString('el-GR');
    document.getElementById('totalModels').textContent = data.totalModels.toLocaleString('el-GR');
    document.getElementById('daysLoaded').textContent = data.daysWithData.toLocaleString('el-GR');
}

// Render the monthly table
function renderTable(models) {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';
    
    if (models.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 3rem; color: var(--color-text-muted);">Δεν υπάρχουν δεδομένα</td></tr>';
        return;
    }
    
    const maxCount = models[0].count;
    
    // Calculate total for percentages
    const total = models.reduce((sum, model) => sum + model.count, 0);
    monthlyTotalCars = total;
    
    models.forEach((model, index) => {
        const tr = document.createElement('tr');
        
        // Rank
        const rankTd = document.createElement('td');
        const rankSpan = document.createElement('span');
        rankSpan.className = index < 3 ? 'rank top-3' : 'rank';
        rankSpan.textContent = index + 1;
        rankTd.appendChild(rankSpan);
        tr.appendChild(rankTd);
        
        // Model name
        const modelTd = document.createElement('td');
        const modelSpan = document.createElement('span');
        modelSpan.className = 'model-name';
        modelSpan.textContent = model.name;
        modelTd.appendChild(modelSpan);
        tr.appendChild(modelTd);
        
        // Count
        const countTd = document.createElement('td');
        const countSpan = document.createElement('span');
        countSpan.className = 'count';
        countSpan.textContent = model.count.toLocaleString('el-GR');
        countTd.appendChild(countSpan);
        tr.appendChild(countTd);
        
        // Percentage
        const percentTd = document.createElement('td');
        const percentSpan = document.createElement('span');
        percentSpan.className = 'percentage';
        const percentage = ((model.count / total) * 100).toFixed(2);
        percentSpan.textContent = `${percentage}%`;
        percentTd.appendChild(percentSpan);
        tr.appendChild(percentTd);
        
        // Bar
        const barTd = document.createElement('td');
        barTd.className = 'bar-col';
        const barContainer = document.createElement('div');
        barContainer.className = 'bar-container';
        const barFill = document.createElement('div');
        barFill.className = 'bar-fill';
        const barPercentage = (model.count / maxCount) * 100;
        
        // Add percentage label inside bar
        const barLabel = document.createElement('span');
        barLabel.className = 'maker-bar-label';
        barLabel.textContent = `${percentage}%`;
        barFill.appendChild(barLabel);
        
        setTimeout(() => {
            barFill.style.width = `${barPercentage}%`;
        }, 50 + index * 30);
        
        barContainer.appendChild(barFill);
        barTd.appendChild(barContainer);
        tr.appendChild(barTd);
        
        tbody.appendChild(tr);
    });
}

// Sort table
function sortTable(mode) {
    currentSortMode = mode;
    
    document.getElementById('sortByCount').classList.toggle('active', mode === 'count');
    document.getElementById('sortByName').classList.toggle('active', mode === 'name');
    
    const sortedData = [...modelsData];
    if (mode === 'count') {
        sortedData.sort((a, b) => b.count - a.count);
    } else {
        sortedData.sort((a, b) => a.name.localeCompare(b.name, 'el'));
    }
    
    renderTable(sortedData);
}

// Update loading detail text
function updateLoadingDetail(text) {
    const loadingDetail = document.getElementById('loadingDetail');
    if (loadingDetail) {
        loadingDetail.textContent = text;
    }
}

// Update last update time
function updateLastUpdate() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('el-GR', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    const dateStr = now.toLocaleDateString('el-GR', { 
        day: 'numeric', 
        month: 'short',
        year: 'numeric'
    });
    
    document.getElementById('lastUpdate').textContent = `${dateStr} στις ${timeStr}`;
}

// Show/hide UI elements
function showLoading() {
    document.getElementById('loadingContainer').style.display = 'block';
    document.getElementById('errorContainer').style.display = 'none';
}

function hideLoading() {
    document.getElementById('loadingContainer').style.display = 'none';
}

function showResults() {
    document.getElementById('resultsContainer').style.display = 'block';
}

function showError(message) {
    document.getElementById('loadingContainer').style.display = 'none';
    document.getElementById('errorContainer').style.display = 'block';
    document.getElementById('errorText').textContent = message;
}

// Toggle collapsible sections
function toggleSection(contentId, chevronId) {
    const content = document.getElementById(contentId);
    const chevron = document.getElementById(chevronId);
    
    if (content.classList.contains('expanded')) {
        content.classList.remove('expanded');
        chevron.classList.add('rotated');
    } else {
        content.classList.add('expanded');
        chevron.classList.remove('rotated');
    }
}

// Switch makers tab
function switchMakersTab(tab) {
    currentMakersTab = tab;
    
    // Update tab buttons
    document.getElementById('monthlyTab').classList.toggle('active', tab === 'monthly');
    document.getElementById('yearlyTab').classList.toggle('active', tab === 'yearly');
    
    // Load data
    loadMakersData(tab);
}

// Load makers data
async function loadMakersData(timePeriod) {
    try {
        document.getElementById('makersLoading').style.display = 'block';
        document.getElementById('makersContent').style.display = 'none';
        
        const makersParam = encodeURIComponent(JSON.stringify(MAKERS));
        const url = `${MAKERS_API_URL}?filterMakers=${makersParam}&timePeriod=${timePeriod}`;
        
        const data = await fetchMakersAPI(url);
        
        if (!data) {
            console.error('No makers data received');
            return;
        }
        
        renderMakersChart(data, timePeriod);
        
        document.getElementById('makersLoading').style.display = 'none';
        document.getElementById('makersContent').style.display = 'block';
        
    } catch (error) {
        console.error('Error loading makers data:', error);
        document.getElementById('makersLoading').style.display = 'none';
    }
}

// Fetch makers API
async function fetchMakersAPI(url) {
    const proxies = [
        'https://corsproxy.io/?',
        'https://api.allorigins.win/raw?url=',
        'https://thingproxy.freeboard.io/fetch/',
    ];
    
    // Try direct access first
    if (!USE_CORS_PROXY) {
        try {
            const response = await fetch(url);
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.warn('Direct access failed, trying proxies...');
        }
    }
    
    // Try each proxy
    for (const proxy of proxies) {
        try {
            const proxyUrl = `${proxy}${encodeURIComponent(url)}`;
            const response = await fetch(proxyUrl);
            
            if (response.ok) {
                const data = await response.json();
                console.log(`✅ Makers API success with proxy: ${proxy}`);
                return data;
            }
        } catch (error) {
            console.warn(`❌ Proxy failed: ${proxy}`, error.message);
            continue;
        }
    }
    
    console.error('All proxies failed for makers API');
    return null;
}

// Render makers chart
function renderMakersChart(data, timePeriod) {
    const chartContainer = document.getElementById('makersChart');
    
    // Get the latest period data
    const periods = data.periods || [];
    const latestPeriodIndex = periods.length - 1;
    
    if (latestPeriodIndex < 0) {
        chartContainer.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--color-text-muted);">Δεν υπάρχουν δεδομένα</p>';
        return;
    }
    
    const latestPeriod = periods[latestPeriodIndex];
    
    // Create chart HTML
    let html = `
        <div class="period-selector">
            <span class="period-label">Περίοδος:</span>
            <select class="period-dropdown" onchange="updateMakersPeriod(this.value)">
    `;
    
    // Add period options (last 12 for monthly, all for yearly)
    const displayPeriods = timePeriod === 'month' 
        ? periods.slice(-12) 
        : periods;
    
    displayPeriods.forEach((period, idx) => {
        const actualIdx = timePeriod === 'month' 
            ? periods.length - 12 + idx 
            : idx;
        const selected = actualIdx === latestPeriodIndex ? 'selected' : '';
        html += `<option value="${actualIdx}" ${selected}>${formatPeriod(period, timePeriod)}</option>`;
    });
    
    html += `
            </select>
        </div>
        <div class="makers-chart-wrapper" id="makersChartContent">
    `;
    
    // Get data for latest period and sort by value
    const makersWithValues = MAKERS
        .filter(maker => maker !== 'total') // Exclude total from chart
        .map(maker => {
            const values = data.data[maker] || [];
            const value = values[latestPeriodIndex] || 0;
            return { maker, value };
        })
        .filter(item => item.value > 0) // Only show makers with data
        .sort((a, b) => b.value - a.value);
    
    const maxValue = Math.max(...makersWithValues.map(item => item.value), 1);
    
    // Render each maker
    makersWithValues.forEach(({ maker, value }) => {
        const percentage = (value / maxValue) * 100;
        const displayName = maker.toUpperCase();
        
        html += `
            <div class="maker-row">
                <div class="maker-name">${displayName}</div>
                <div class="maker-bar-container">
                    <div class="maker-bar-fill" style="width: ${percentage}%;">
                        <span class="maker-bar-label">${value.toLocaleString('el-GR')}</span>
                    </div>
                </div>
                <div class="maker-value">${value.toLocaleString('el-GR')}</div>
            </div>
        `;
    });
    
    html += `</div>`;
    
    chartContainer.innerHTML = html;
    
    // Store data globally for period updates
    window.currentMakersData = data;
    window.currentMakersTimePeriod = timePeriod;
}

// Update makers chart for different period
function updateMakersPeriod(periodIndex) {
    const data = window.currentMakersData;
    const timePeriod = window.currentMakersTimePeriod;
    
    if (!data) return;
    
    const chartContent = document.getElementById('makersChartContent');
    const periods = data.periods || [];
    const idx = parseInt(periodIndex);
    
    // Get data for selected period
    const makersWithValues = MAKERS
        .filter(maker => maker !== 'total')
        .map(maker => {
            const values = data.data[maker] || [];
            const value = values[idx] || 0;
            return { maker, value };
        })
        .filter(item => item.value > 0)
        .sort((a, b) => b.value - a.value);
    
    const maxValue = Math.max(...makersWithValues.map(item => item.value), 1);
    
    let html = '';
    makersWithValues.forEach(({ maker, value }) => {
        const percentage = (value / maxValue) * 100;
        const displayName = maker.toUpperCase();
        
        html += `
            <div class="maker-row">
                <div class="maker-name">${displayName}</div>
                <div class="maker-bar-container">
                    <div class="maker-bar-fill" style="width: ${percentage}%;">
                        <span class="maker-bar-label">${value.toLocaleString('el-GR')}</span>
                    </div>
                </div>
                <div class="maker-value">${value.toLocaleString('el-GR')}</div>
            </div>
        `;
    });
    
    chartContent.innerHTML = html;
}

// Format period for display
function formatPeriod(period, timePeriod) {
    if (timePeriod === 'year') {
        return period; // Just the year
    } else {
        // Format YYYY-MM to "Month Year"
        const [year, month] = period.split('-');
        const monthNames = [
            'Ιαν', 'Φεβ', 'Μάρ', 'Απρ', 'Μάι', 'Ιούν',
            'Ιούλ', 'Αύγ', 'Σεπ', 'Οκτ', 'Νοέ', 'Δεκ'
        ];
        return `${monthNames[parseInt(month) - 1]} ${year}`;
    }
}
