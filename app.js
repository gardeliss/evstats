// Configuration
const API_BASE_URL = 'https://evstats.gr/api/dailyBevModels';

// CORS Proxy - Try different ones if one doesn't work
// Option 1: corsproxy.io (recommended - most reliable)
const CORS_PROXY = 'https://corsproxy.io/?';

// Option 2: allOrigins (may have 502 errors)
// const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

// Option 3: thingproxy
// const CORS_PROXY = 'https://thingproxy.freeboard.io/fetch/';

// Set to true to use CORS proxy
const USE_CORS_PROXY = true;

let currentSortMode = 'count';
let modelsData = [];

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
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 3rem; color: var(--color-text-muted);">Δεν υπάρχουν δεδομένα</td></tr>';
        return;
    }
    
    const maxCount = models[0].count;
    
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
        
        // Bar
        const barTd = document.createElement('td');
        barTd.className = 'bar-col';
        const barContainer = document.createElement('div');
        barContainer.className = 'bar-container';
        const barFill = document.createElement('div');
        barFill.className = 'bar-fill';
        const percentage = (model.count / maxCount) * 100;
        
        setTimeout(() => {
            barFill.style.width = `${percentage}%`;
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
