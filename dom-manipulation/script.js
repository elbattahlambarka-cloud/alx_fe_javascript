// Array of quote objects - will be loaded from localStorage
let quotes = [];
let currentFilter = 'all';
let lastSyncTime = null;
let serverQuotes = [];
let hasConflicts = false;
let syncInterval;

// DOM Elements
const quoteDisplay = document.getElementById('quoteDisplay');
const newQuoteButton = document.getElementById('newQuote');
const exportBtn = document.getElementById('exportBtn');
const importFile = document.getElementById('importFile');
const sessionInfo = document.getElementById('sessionInfo');
const totalQuotesElement = document.getElementById('totalQuotes');
const totalCategoriesElement = document.getElementById('totalCategories');
const filteredQuotesElement = document.getElementById('filteredQuotes');
const categoryFilter = document.getElementById('categoryFilter');
const clearFilterButton = document.getElementById('clearFilter');
const filterInfo = document.getElementById('filterInfo');
const syncNowButton = document.getElementById('syncNow');
const forceServerButton = document.getElementById('forceServer');
const forceLocalButton = document.getElementById('forceLocal');
const syncStatus = document.getElementById('syncStatus');
const conflictResolution = document.getElementById('conflictResolution');
const conflictDetails = document.getElementById('conflictDetails');

// Default quotes for initial setup
const defaultQuotes = [
    { text: "The only way to do great work is to love what you do.", category: "Inspiration" },
    { text: "Life is what happens to you while you're busy making other plans.", category: "Life" },
    { text: "The future belongs to those who believe in the beauty of their dreams.", category: "Motivation" },
    { text: "It is during our darkest moments that we must focus to see the light.", category: "Wisdom" },
    { text: "Whoever is happy will make others happy too.", category: "Life" }
];

// ============================
// SERVER SIMULATION FUNCTIONS
// ============================

// Fetch data from server using mock API
async function fetchQuotesFromServer() {
    try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock server data using localStorage to simulate persistent server storage
        let serverData = JSON.parse(localStorage.getItem('serverQuotes') || '[]');
        
        // Initialize server data if empty
        if (serverData.length === 0) {
            serverData = [
                { text: "The only way to do great work is to love what you do.", category: "Inspiration" },
                { text: "Life is what happens when you're busy making other plans.", category: "Life" },
                { text: "The future belongs to those who believe in their dreams.", category: "Motivation" },
                { text: "In the middle of difficulty lies opportunity.", category: "Wisdom" },
                { text: "Happiness is not something ready made. It comes from your own actions.", category: "Life" }
            ];
            localStorage.setItem('serverQuotes', JSON.stringify(serverData));
        }
        
        return serverData;
    } catch (error) {
        console.error('Error fetching from server:', error);
        throw new Error('Failed to fetch data from server');
    }
}

// Post data to server using mock API - SIMPLE VERSION FOR TEST
async function postQuotesToServer(quotesData) {
    try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simply save to localStorage to simulate server storage
        localStorage.setItem('serverQuotes', JSON.stringify(quotesData));
        
        return true;
    } catch (error) {
        console.error('Error posting to server:', error);
        throw new Error('Failed to post data to server');
    }
}

// ============================
// SYNC AND CONFLICT RESOLUTION
// ============================

// Sync quotes function - SIMPLE VERSION FOR TEST
async function syncQuotes() {
    try {
        updateSyncStatus('Syncing with server...', 'sync-warning');
        
        // Fetch latest data from server
        const serverData = await fetchQuotesFromServer();
        
        // Update local storage with server data and handle conflicts
        updateLocalStorageWithServerData(serverData);
        
        lastSyncTime = new Date();
        saveLastSyncTime();
        
    } catch (error) {
        updateSyncStatus(`Sync failed: ${error.message}`, 'sync-error');
        showNotification(`Sync failed: ${error.message}`, true);
    }
}

// Update local storage with server data and handle conflicts - SIMPLE VERSION FOR TEST
function updateLocalStorageWithServerData(serverData) {
    const conflicts = [];
    
    // Simple conflict detection: check if quotes are different
    if (JSON.stringify(quotes) !== JSON.stringify(serverData)) {
        conflicts.push({
            message: 'Local data differs from server data'
        });
    }
    
    if (conflicts.length > 0) {
        // Server data takes precedence in conflicts
        quotes = [...serverData];
        saveQuotes();
        populateCategories();
        showRandomQuote();
        
        // Show conflict notification
        showNotification('Data updated from server. Server data used to resolve conflicts.');
        updateSyncStatus('Sync completed - conflicts resolved', 'sync-success');
        
        // Show conflict UI
        showConflictUI('Server data has been used to update local quotes.');
    } else {
        // No conflicts
        quotes = [...serverData];
        saveQuotes();
        populateCategories();
        showRandomQuote();
        updateSyncStatus('Sync completed successfully', 'sync-success');
        showNotification('Quotes synced successfully with server');
    }
}

// Periodically check for new quotes from the server
function setupPeriodicSync() {
    // Sync every 30 seconds
    syncInterval = setInterval(syncQuotes, 30000);
    
    // Show notification about periodic sync
    showNotification('Automatic sync enabled - checking server every 30 seconds');
}

// ============================
// CONFLICT RESOLUTION UI
// ============================

function showConflictUI(message) {
    conflictResolution.style.display = 'block';
    conflictDetails.innerHTML = `
        <div class="conflict-item">
            <strong>Conflict Resolved:</strong> ${message}
        </div>
        <div style="margin-top: 10px;">
            <button onclick="hideConflictUI()" style="background: #28a745;">OK</button>
        </div>
    `;
}

function hideConflictUI() {
    conflictResolution.style.display = 'none';
}

// ============================
// NOTIFICATION SYSTEM
// ============================

function showNotification(message, isError = false) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${isError ? '#dc3545' : '#28a745'};
        color: white;
        border-radius: 5px;
        z-index: 1000;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        max-width: 300px;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 5000);
}

// ============================
// LOCAL STORAGE FUNCTIONS
// ============================

function saveQuotes() {
    localStorage.setItem('quotes', JSON.stringify(quotes));
    updateStatistics();
}

function loadQuotes() {
    const savedQuotes = localStorage.getItem('quotes');
    if (savedQuotes) {
        quotes = JSON.parse(savedQuotes);
    } else {
        quotes = [...defaultQuotes];
        saveQuotes();
    }
    updateStatistics();
}

function saveSelectedCategory() {
    localStorage.setItem('selectedCategory', currentFilter);
}

function restoreSelectedCategory() {
    const savedCategory = localStorage.getItem('selectedCategory');
    if (savedCategory) {
        currentFilter = savedCategory;
        categoryFilter.value = currentFilter;
        filterQuotes();
    }
}

function saveLastSyncTime() {
    localStorage.setItem('lastSyncTime', lastSyncTime ? lastSyncTime.toISOString() : '');
}

function loadLastSyncTime() {
    const savedTime = localStorage.getItem('lastSyncTime');
    if (savedTime) {
        lastSyncTime = new Date(savedTime);
        updateSyncStatus(`Last sync: ${lastSyncTime.toLocaleString()}`, 'sync-success');
    } else {
        updateSyncStatus('Last sync: Never', 'sync-warning');
    }
}

// ============================
// SYNC STATUS MANAGEMENT
// ============================

function updateSyncStatus(message, className) {
    syncStatus.textContent = message;
    syncStatus.className = 'sync-status ' + className;
}

// ============================
// REMAINING FUNCTIONS (from previous tasks)
// ============================

function populateCategories() {
    while (categoryFilter.options.length > 1) {
        categoryFilter.remove(1);
    }
    
    const categories = [...new Set(quotes.map(quote => quote.category))];
    
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });
    
    updateStatistics();
}

function filterQuotes() {
    currentFilter = categoryFilter.value;
    saveSelectedCategory();
    
    let filteredQuotes = [];
    
    if (currentFilter === 'all') {
        filteredQuotes = quotes;
        filterInfo.textContent = `Showing all ${quotes.length} quotes`;
    } else {
        filteredQuotes = quotes.filter(quote => quote.category === currentFilter);
        filterInfo.textContent = `Showing ${filteredQuotes.length} quotes in category: ${currentFilter}`;
    }
    
    filteredQuotesElement.textContent = filteredQuotes.length;
    
    if (filteredQuotes.length === 0) {
        quoteDisplay.innerHTML = `
            <div class="quote">
                <p>No quotes found in category: <strong>${currentFilter}</strong></p>
                <p><em>Try selecting a different category or add new quotes.</em></p>
            </div>
        `;
    } else {
        const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
        const randomQuote = filteredQuotes[randomIndex];
        
        quoteDisplay.innerHTML = `
            <div class="quote">
                <p>"${randomQuote.text}"</p>
                <small>Category: ${randomQuote.category}</small>
            </div>
        `;
    }
    
    saveSessionData();
}

function showRandomQuote() {
    if (quotes.length === 0) {
        quoteDisplay.innerHTML = "<p>No quotes available. Add some quotes!</p>";
        return;
    }
    
    let quotesToShow = quotes;
    
    if (currentFilter !== 'all') {
        quotesToShow = quotes.filter(quote => quote.category === currentFilter);
        if (quotesToShow.length === 0) {
            quoteDisplay.innerHTML = `
                <div class="quote">
                    <p>No quotes found in category: <strong>${currentFilter}</strong></p>
                    <p><em>Try selecting a different category or add new quotes.</em></p>
                </div>
            `;
            return;
        }
    }
    
    const randomIndex = Math.floor(Math.random() * quotesToShow.length);
    const randomQuote = quotesToShow[randomIndex];
    
    quoteDisplay.innerHTML = `
        <div class="quote">
            <p>"${randomQuote.text}"</p>
            <small>Category: ${randomQuote.category}</small>
        </div>
    `;
    
    if (currentFilter === 'all') {
        filterInfo.textContent = `Showing all ${quotes.length} quotes`;
        filteredQuotesElement.textContent = quotes.length;
    } else {
        const filteredCount = quotes.filter(quote => quote.category === currentFilter).length;
        filterInfo.textContent = `Showing ${filteredCount} quotes in category: ${currentFilter}`;
        filteredQuotesElement.textContent = filteredCount;
    }
    
    saveSessionData();
}

function addQuote() {
    const quoteText = document.getElementById('newQuoteText').value.trim();
    const quoteCategory = document.getElementById('newQuoteCategory').value.trim();
    
    if (quoteText && quoteCategory) {
        quotes.push({
            text: quoteText,
            category: quoteCategory
        });
        
        saveQuotes();
        populateCategories();
        
        document.getElementById('newQuoteText').value = '';
        document.getElementById('newQuoteCategory').value = '';
        
        quoteDisplay.innerHTML = `
            <div class="quote">
                <p>"${quoteText}"</p>
                <small>Category: ${quoteCategory}</small>
                <p><em>Quote added successfully!</em></p>
            </div>
        `;
        
        saveSessionData();
        
        showNotification('New quote added locally');
    } else {
        showNotification('Please enter both quote text and category', true);
    }
}

function createAddQuoteForm() {
    const formContainer = document.createElement('div');
    
    formContainer.innerHTML = `
        <h3>Add New Quote</h3>
        <div>
            <input id="newQuoteText" type="text" placeholder="Enter a new quote" />
            <input id="newQuoteCategory" type="text" placeholder="Enter quote category" />
            <button onclick="addQuote()">Add Quote</button>
        </div>
    `;
    
    document.body.appendChild(formContainer);
}

function exportToJsonFile() {
    if (quotes.length === 0) {
        showNotification('No quotes to export!', true);
        return;
    }
    
    const dataStr = JSON.stringify(quotes, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'quotes-backup.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showNotification('Quotes exported successfully!');
}

function importFromJsonFile(event) {
    const fileReader = new FileReader();
    fileReader.onload = function(event) {
        try {
            const importedQuotes = JSON.parse(event.target.result);
            
            if (!Array.isArray(importedQuotes)) {
                throw new Error('Invalid JSON format: Expected an array');
            }
            
            quotes.push(...importedQuotes);
            saveQuotes();
            populateCategories();
            
            quoteDisplay.innerHTML = `
                <div class="quote">
                    <p><em>${importedQuotes.length} quotes imported successfully!</em></p>
                    <p>Total quotes now: ${quotes.length}</p>
                </div>
            `;
            
            saveSessionData();
            
            showNotification(`${importedQuotes.length} quotes imported successfully!`);
        } catch (error) {
            showNotification('Error importing quotes: ' + error.message, true);
        }
    };
    fileReader.readAsText(event.target.files[0]);
    
    event.target.value = '';
}

function updateStatistics() {
    totalQuotesElement.textContent = quotes.length;
    
    const categories = [...new Set(quotes.map(quote => quote.category))];
    totalCategoriesElement.textContent = categories.length;
    
    if (currentFilter === 'all') {
        filteredQuotesElement.textContent = quotes.length;
    } else {
        const filteredCount = quotes.filter(quote => quote.category === currentFilter).length;
        filteredQuotesElement.textContent = filteredCount;
    }
}

// Session storage functions
function saveSessionData() {
    const currentQuote = quoteDisplay.innerHTML;
    const timestamp = new Date().toISOString();
    
    sessionStorage.setItem('lastViewedQuote', currentQuote);
    sessionStorage.setItem('lastViewTime', timestamp);
    sessionStorage.setItem('sessionStartTime', sessionStorage.getItem('sessionStartTime') || timestamp);
    sessionStorage.setItem('currentFilter', currentFilter);
    
    updateSessionInfo();
}

function loadSessionData() {
    updateSessionInfo();
}

function updateSessionInfo() {
    const lastViewTime = sessionStorage.getItem('lastViewTime');
    const sessionStartTime = sessionStorage.getItem('sessionStartTime');
    const sessionFilter = sessionStorage.getItem('currentFilter');
    
    let info = '';
    
    if (sessionStartTime) {
        const startTime = new Date(sessionStartTime);
        const duration = Math.floor((new Date() - startTime) / 1000 / 60);
        info += `Session: ${duration} min | `;
    }
    
    if (lastViewTime) {
        const viewTime = new Date(lastViewTime);
        const timeDiff = Math.floor((new Date() - viewTime) / 1000 / 60);
        info += `Last view: ${timeDiff} min ago`;
    }
    
    if (sessionFilter && sessionFilter !== 'all') {
        info += ` | Filter: ${sessionFilter}`;
    }
    
    sessionInfo.textContent = info || 'New session started';
}

// ============================
// INITIALIZATION
// ============================

document.addEventListener('DOMContentLoaded', function() {
    loadQuotes();
    restoreSelectedCategory();
    loadSessionData();
    loadLastSyncTime();
    populateCategories();
    createAddQuoteForm();
    
    // Add event listeners
    newQuoteButton.addEventListener('click', showRandomQuote);
    exportBtn.addEventListener('click', exportToJsonFile);
    importFile.addEventListener('change', importFromJsonFile);
    categoryFilter.addEventListener('change', filterQuotes);
    clearFilterButton.addEventListener('click', () => {
        categoryFilter.value = 'all';
        currentFilter = 'all';
        saveSelectedCategory();
        filterQuotes();
    });
    
    // Sync event listeners
    syncNowButton.addEventListener('click', syncQuotes);
    forceServerButton.addEventListener('click', () => {
        fetchQuotesFromServer().then(serverData => {
            quotes = serverData;
            saveQuotes();
            populateCategories();
            showRandomQuote();
            showNotification('Forced server data update');
        });
    });
    
    forceLocalButton.addEventListener('click', () => {
        postQuotesToServer(quotes);
        showNotification('Local data posted to server');
    });
    
    showRandomQuote();
    
    // Start periodic sync
    setupPeriodicSync();
    
    setInterval(saveSessionData, 60000);
});