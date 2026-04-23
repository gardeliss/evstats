// Configuration
const API_BASE_URL = 'https://evstats.gr/api/dailyBevModels';
let currentSortMode = 'count'; // 'count' or 'name'
let modelsData = [];

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

async function initializeApp() {
    try {
        showLoading();
        updateCurrentMonth();
        
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
        console.error('Error initializing app:', error);
        showError('Σφάλμα κατά τη φόρτωση των δεδομένων. Παρακαλώ δοκιμάστε ξανά.');
    }
}

// Get current month and year
function getCurrentMonthDates() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-indexed
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    
    // Last day of the month or today, whichever is earlier
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

// Update current month display
function updateCurrentMonth() {
    const { year, month } = getCurrentMonthDates();
    const monthNames = [
        'Ιανουάριος', 'Φεβρουάριος', 'Μάρτιος', 'Απρίλιος', 'Μάιος', 'Ιούνιος',
        'Ιούλιος', 'Αύγουστος', 'Σεπτέμβριος', 'Οκτώβριος', 'Νοέμβριος', 'Δεκέμβριος'
    ];
    
    document.getElementById('currentMonth').textContent = `${monthNames[month]} ${year}`;
}

// Fetch data for all days in the current month
async function fetchAllDaysData() {
    const { firstDay, lastDay } = getCurrentMonthDates();
    const allModels = {};
    let totalCars = 0;
    let daysWithData = 0;
    
    const currentDate = new Date(firstDay);
    const promises = [];
    
    // Create promises for all days
    while (currentDate <= lastDay) {
        const dateStr = formatDate(currentDate);
        promises.push(fetchDayData(dateStr));
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Update loading detail
    updateLoadingDetail(`Ανάκτηση δεδομένων για ${promises.length} ημέρες...`);
    
    // Fetch all days in parallel
    const results = await Promise.allSettled(promises);
    
    // Process results
    results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
            const dayData = result.value;
            daysWithData++;
            
            // Aggregate models
            if (dayData.cars && dayData.cars.models) {
                Object.entries(dayData.cars.models).forEach(([model, count]) => {
                    if (!allModels[model]) {
                        allModels[model] = 0;
                    }
                    allModels[model] += count;
                });
                
                totalCars += dayData.cars.total || 0;
            }
        }
    });
    
    // Convert to array and sort by count
    const modelsArray = Object.entries(allModels).map(([name, count]) => ({
        name,
        count
    })).sort((a, b) => b.count - a.count);
    
    return {
        models: modelsArray,
        totalCars,
        totalModels: modelsArray.length,
        daysWithData
    };
}

// Fetch data for a specific day
async function fetchDayData(dateStr) {
    try {
        const url = `${API_BASE_URL}/${dateStr}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            return null;
        }
        
        const data = await response.json();
        return data;
        
    } catch (error) {
        console.warn(`Failed to fetch data for ${dateStr}:`, error);
        return null;
    }
}

// Update stats display
function updateStats(data) {
    document.getElementById('totalCars').textContent = data.totalCars.toLocaleString('el-GR');
    document.getElementById('totalModels').textContent = data.totalModels.toLocaleString('el-GR');
    document.getElementById('daysLoaded').textContent = data.daysWithData.toLocaleString('el-GR');
}

// Render the table
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
        
        // Animate bar fill
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
    
    // Update button states
    document.getElementById('sortByCount').classList.toggle('active', mode === 'count');
    document.getElementById('sortByName').classList.toggle('active', mode === 'name');
    
    // Sort data
    const sortedData = [...modelsData];
    if (mode === 'count') {
        sortedData.sort((a, b) => b.count - a.count);
    } else {
        sortedData.sort((a, b) => a.name.localeCompare(b.name, 'el'));
    }
    
    // Re-render table
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
    document.getElementById('resultsContainer').style.display = 'none';
}

function hideLoading() {
    document.getElementById('loadingContainer').style.display = 'none';
}

function showResults() {
    document.getElementById('resultsContainer').style.display = 'block';
}

function showError(message) {
    document.getElementById('loadingContainer').style.display = 'none';
    document.getElementById('resultsContainer').style.display = 'none';
    document.getElementById('errorContainer').style.display = 'block';
    document.getElementById('errorText').textContent = message;
}
