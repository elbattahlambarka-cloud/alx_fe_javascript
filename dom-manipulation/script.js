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
// SERVER SIMULATION FUNCTIONS (EXACT NAMES AS REQUIRED)
// ============================

// Fetch data from server using mock API - EXACT FUNCTION NAME REQUIRED
async function fetchQuotesFromServer() {
    try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        
        // Mock server data - in real app this would be fetch('https://jsonplaceholder.typicode.com/posts')
        const serverData = JSON.parse(localStorage.getItem('serverQuotes') || '[]');
        
        // Initialize server data if empty
        if (serverData.length === 0) {
            const initialServerQuotes = [
                { text: "The only way to do great work is to love what you do.", category: "Inspiration" },
                { text: "Life is what happens when you're busy making other plans.", category: "Life" },
                { text: "The future belongs to those who believe in their dreams.", category: "Motivation" },
                { text: "In the middle of difficulty lies opportunity.", category: "Wisdom" },
                { text: "Happiness is not something ready made. It comes from your own actions.", category: "Life" }
            ];
            localStorage.setItem('serverQuotes', JSON.stringify(initialServerQuotes));
            return initialServerQuotes;
        }
        
        // Occasionally add new quotes to simulate server updates
        if (Math.random() > 0.7) {
            const newServerQuote = {
                text: `Server update: ${new Date().toLocaleTimeString()}`,
                category: "Server"
            };
            serverData.push(newServerQuote);
            localStorage.setItem('serverQuotes', JSON.stringify(serverData));
            
            // Show notification about server update
            showNotification(`Server added new quote: "${newServerQuote.text}"`);
        }
        
        return serverData;
    } catch (error) {
        console.error('Error fetching from server:', error);
        throw new Error('Failed to fetch data from server');
    }
}

// Post data to server using mock API - EXACT FUNCTION NAME REQUIRED
async function postQuotesToServer(quotesData) {
    try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        
        // Mock server post - in real app this would be fetch with POST method
        localStorage.setItem('serverQuotes', JSON.stringify(quotesData));
        
        // Show notification
        showNotification('Data successfully posted to server');
        
        return true;
    } catch (error) {
        console.error('Error posting to server:', error);
        throw new Error('Failed to post data to server');
    }
}

// ============================
// SYNC AND CONFLICT RESOLUTION (EXACT NAMES AS REQUIRED)
// ============================

// Sync quotes function - EXACT FUNCTION NAME REQUIRED
async function syncQuotes() {
    try {
        updateSyncStatus('Syncing with server...', 'sync-warning');
        
        // Fetch latest data from server
        serverQuotes = await fetchQuotesFromServer();
        
        // Check for conflicts and update local storage
        const conflicts = detectConflicts(quotes, serverQuotes);
        
        if (conflicts.length > 0) {
            // Conflict resolution: server data takes precedence
            hasConflicts = true;
            handleConflicts(conflicts);
            updateSyncStatus(`Sync completed with ${conflicts.length} conflicts resolved`, 'sync-warning');
        } else {
            // No conflicts, update local data with server data
            quotes = [...serverQuotes];
            saveQuotes();
            populateCategories();
            showRandomQuote();
            updateSyncStatus('Sync completed successfully!', 'sync-success');
            hasConflicts = false;
            hideConflicts();
            
            // Show notification about sync
            showNotification('Quotes synced successfully with server');
        }
        
        lastSyncTime = new Date();
        saveLastSyncTime();
        
    } catch (error) {
        updateSyncStatus(`Sync failed: ${error.message}`, 'sync-error');
        showNotification(`Sync failed: ${error.message}`, true);
    }
}

// Periodically check for new quotes from server
function setupPeriodicSync() {
    // Sync immediately on load
    setTimeout(syncQuotes, 2000);
    
    // Then sync every 30 seconds for demonstration
    syncInterval = setInterval(syncQuotes, 30000);
    
    // Also sync when window gains focus
    window.addEventListener('focus', () => {
        if (!hasConflicts) {
            syncQuotes();
        }
    });
}

// Update local storage with server data and handle conflicts
function updateLocalStorageWithServerData() {
    const conflicts = detectConflicts(quotes, serverQuotes);
    
    if (conflicts.length === 0) {
        // Simple case: no conflicts, just update
        quotes = [...serverQuotes];
        saveQuotes();
        populateCategories();
        showNotification('Local data updated with server data');
    } else {
        // Conflict resolution strategy: server takes precedence
        quotes = [...serverQuotes];
        saveQuotes();
        populateCategories();
        showRandomQuote();
        
        // Show conflict resolution notification
        showNotification(`${conflicts.length} conflicts resolved. Server data used.`);
        
        // Update UI to show conflicts were resolved
        updateSyncStatus(`Resolved ${conflicts.length} conflicts`, 'sync-warning');
    }
}

// ============================
// CONFLICT DETECTION AND HANDLING
// ============================

function detectConflicts(localData, serverData) {
    const conflicts = [];
    
    // Check for modified quotes
    localData.forEach(localQuote => {
        const serverQuote = serverData.find(sq => 
            sq.text === localQuote.text && sq.category !== localQuote.category
        );
        
        if (serverQuote) {
            conflicts.push({
                type: 'modified',
                local: localQuote,
                server: serverQuote,
                message: `Category changed from "${localQuote.category}" to "${serverQuote.category}"`
            });
        }
    });
    
    // Check for quotes only on server
    serverData.forEach(serverQuote => {
        const existsLocally = localData.some(lq => lq.text === serverQuote.text);
        if (!existsLocally) {
            conflicts.push({
                type: 'server_only',
                server: serverQuote,
                message: `New quote from server: "${serverQuote.text}"`
            });
        }
    });
    
    // Check for quotes only locally (would be lost in server precedence)
    localData.forEach(localQuote => {
        const existsOnServer = serverData.some(sq => sq.text === localQuote.text);
        if (!existsOnServer) {
            conflicts.push({
                type: 'local_only',
                local: localQuote,
                message: `Local quote not on server: "${localQuote.text}"`
            });
        }
    });
    
    return conflicts;
}

function handleConflicts(conflicts) {
    // Show conflict resolution UI
    conflictResolution.style.display = 'block';
    
    let conflictHTML = '<h4>Data Conflicts Detected:</h4>';
    conflicts.forEach((conflict, index) => {
        conflictHTML += `
            <div class="conflict-item">
                <strong>Conflict ${index + 1}:</strong> ${conflict.message}
            </div>
        `;
    });
    
    conflictHTML += `
        <div style="margin-top: 10px;">
            <button onclick="resolveWithServer()" style="background: #28a745;">Use Server Data</button>
            <button onclick="resolveWithLocal()" style="background: #dc3545;">Keep Local Data</button>
            <button onclick="mergeData()" style="background: #ffc107;">Merge Both</button>
        </div>
    `;
    
    conflictDetails.innerHTML = conflictHTML;
    
    // Show notification about conflicts
    showNotification(`${conflicts.length} conflicts detected. Please resolve.`, true);
}

function hideConflicts() {
    conflictResolution.style.display = 'none';
}

// Conflict resolution strategies
function resolveWithServer() {
    quotes = [...serverQuotes];
    saveQuotes();
    populateCategories();
    showRandomQuote();
    updateSyncStatus('Conflicts resolved: Using server data', 'sync-success');
    hasConflicts = false;
    hideConflicts();
    showNotification('Conflicts resolved using server data');
}

function resolveWithLocal() {
    // Keep local data, but post it to server
    postQuotesToServer(quotes);
    updateSyncStatus('Conflicts resolved: Keeping local data', 'sync-success');
    hasConflicts = false;
    hideConflicts();
    showNotification('Conflicts resolved keeping local data');
}

function mergeData() {
    const mergedQuotes = [...quotes];
    serverQuotes.forEach(serverQuote => {
        if (!mergedQuotes.find(q => q.text === serverQuote.text)) {
            mergedQuotes.push(serverQuote);
        }
    });
    quotes = mergedQuotes;
    saveQuotes();
    populateCategories();
    showRandomQuote();
    updateSyncStatus('Conflicts resolved: Merged datasets', 'sync-success');
    hasConflicts = false;
    hideConflicts();
    showNotification('Conflicts resolved by merging data');
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

// [All previous functions from Task 2 remain the same but use updated sync function names...]

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
        
        // Show notification
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
    forceServerButton.addEventListener('click', resolveWithServer);
    forceLocalButton.addEventListener('click', resolveWithLocal);
    
    showRandomQuote();
    setupPeriodicSync();
    
    setInterval(saveSessionData, 60000);
});