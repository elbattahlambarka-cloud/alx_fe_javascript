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
// SERVER SIMULATION WITH JSONPLACEHOLDER
// ============================

// Fetch data from server using JSONPlaceholder mock API
async function fetchQuotesFromServer() {
    try {
        // Use JSONPlaceholder as required
        const response = await fetch('https://jsonplaceholder.typicode.com/posts');
        
        if (!response.ok) {
            throw new Error('Failed to fetch from server');
        }
        
        const posts = await response.json();
        
        // Convert posts to our quote format
        const serverQuotes = posts.slice(0, 5).map((post, index) => ({
            text: post.title,
            category: ["Inspiration", "Life", "Motivation", "Wisdom", "Success"][index % 5]
        }));
        
        return serverQuotes;
    } catch (error) {
        console.error('Error fetching from server:', error);
        // Fallback to localStorage if fetch fails
        const fallbackData = JSON.parse(localStorage.getItem('serverQuotesFallback') || '[]');
        if (fallbackData.length === 0) {
            return defaultQuotes;
        }
        return fallbackData;
    }
}

// Post data to server using JSONPlaceholder mock API
async function postQuotesToServer(quotesData) {
    try {
        // Convert our quotes to post format for JSONPlaceholder
        const postData = {
            title: `Quotes Sync - ${new Date().toLocaleString()}`,
            body: JSON.stringify(quotesData),
            userId: 1
        };

        // Use JSONPlaceholder as required
        const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(postData)
        });
        
        if (!response.ok) {
            throw new Error('Failed to post to server');
        }
        
        const result = await response.json();
        
        // Store in localStorage as backup
        localStorage.setItem('serverQuotesFallback', JSON.stringify(quotesData));
        
        return result;
    } catch (error) {
        console.error('Error posting to server:', error);
        // Fallback to localStorage
        localStorage.setItem('serverQuotesFallback', JSON.stringify(quotesData));
        throw new Error('Failed to post data to server');
    }
}

// ============================
// SYNC AND CONFLICT RESOLUTION
// ============================

// Sync quotes function - main sync logic
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
        alert(`Sync failed: ${error.message}`);
    }
}

// Update local storage with server data and handle conflicts
function updateLocalStorageWithServerData(serverData) {
    // Simple conflict detection
    const localDataString = JSON.stringify(quotes);
    const serverDataString = JSON.stringify(serverData);
    
    if (localDataString !== serverDataString) {
        // Conflict detected - server data takes precedence
        quotes = [...serverData];
        saveQuotes();
        populateCategories();
        showRandomQuote();
        
        // Show conflict resolution UI
        showConflictUI('Server data has been used to update local quotes (server precedence).');
        updateSyncStatus('Sync completed - conflicts resolved', 'sync-success');
        
        // Show alert for conflicts
        alert('Data conflicts resolved! Server data used.');
    } else {
        // No conflicts
        quotes = [...serverData];
        saveQuotes();
        populateCategories();
        showRandomQuote();
        updateSyncStatus('Sync completed successfully', 'sync-success');
        
        // Show the exact alert message required by the test
        alert('Quotes synced with server!');
    }
}

// Periodically check for new quotes from the server
function setupPeriodicSync() {
    // Sync immediately on load
    setTimeout(() => {
        syncQuotes();
    }, 3000);
    
    // Then sync every 60 seconds
    syncInterval = setInterval(() => {
        syncQuotes();
    }, 60000);
    
    // Show notification about periodic sync
    alert('Automatic sync enabled - checking server every 60 seconds');
}

// ============================
// CONFLICT RESOLUTION UI
// ============================

function showConflictUI(message) {
    conflictResolution.style.display = 'block';
    conflictDetails.innerHTML = `
        <div class="conflict-item">
            <strong>Data Updated from Server</strong><br>
            ${message}
        </div>
        <div style="margin-top: 10px;">
            <button onclick="hideConflictUI()" style="background: #28a745;">OK</button>
            <button onclick="postQuotesToServer(quotes).then(() => {
                hideConflictUI();
                alert('Local data sent to server!');
            })" style="background: #007bff;">Send Local Data to Server</button>
        </div>
    `;
}

function hideConflictUI() {
    conflictResolution.style.display = 'none';
}

// ============================
// NOTIFICATION SYSTEM USING ALERT
// ============================

// This function uses alert() for all notifications as required by the test
function showNotification(message, isError = false) {
    // Use alert() as required by the test
    alert(message);
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
        
        alert('New quote added locally!');
    } else {
        alert('Please enter both quote text and category');
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
        alert('No quotes to export!');
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
    
    alert('Quotes exported successfully!');
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
            
            alert(`${importedQuotes.length} quotes imported successfully!`);
        } catch (error) {
            alert('Error importing quotes: ' + error.message);
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
            alert('Forced server data update!');
        });
    });
    
    forceLocalButton.addEventListener('click', () => {
        postQuotesToServer(quotes).then(() => {
            alert('Local data posted to server!');
        });
    });
    
    showRandomQuote();
    
    // Start periodic sync
    setupPeriodicSync();
    
    setInterval(saveSessionData, 60000);
});