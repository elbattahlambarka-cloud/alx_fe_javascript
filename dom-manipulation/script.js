// Array of quote objects - will be loaded from localStorage
let quotes = [];
let currentFilter = 'all';
let lastSyncTime = null;
let serverQuotes = [];
let hasConflicts = false;

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
const conflictModal = document.getElementById('conflictModal');
const modalConflictDetails = document.getElementById('modalConflictDetails');

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

// Simulate fetching data from server (using JSONPlaceholder simulation)
async function fetchFromServer() {
    try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        
        // In a real app, this would be: await fetch('https://jsonplaceholder.typicode.com/posts')
        // For simulation, we'll create some server data with potential conflicts
        const serverData = JSON.parse(localStorage.getItem('serverQuotes') || '[]');
        
        // If no server data exists, initialize with some modified default quotes
        if (serverData.length === 0) {
            serverData.push(
                { text: "The only way to do great work is to love what you do.", category: "Inspiration" },
                { text: "Life is what happens when you're busy making other plans.", category: "Life" }, // Slightly different
                { text: "The future belongs to those who believe in their dreams.", category: "Motivation" }, // Modified
                { text: "In the middle of difficulty lies opportunity.", category: "Wisdom" }, // Different quote
                { text: "Happiness is not something ready made. It comes from your own actions.", category: "Life" } // New quote
            );
            localStorage.setItem('serverQuotes', JSON.stringify(serverData));
        }
        
        // Occasionally modify server data to simulate updates
        if (Math.random() > 0.7) {
            serverData.push({
                text: `Server update: ${new Date().toLocaleTimeString()}`,
                category: "Server"
            });
            localStorage.setItem('serverQuotes', JSON.stringify(serverData));
        }
        
        return serverData;
    } catch (error) {
        console.error('Error fetching from server:', error);
        throw new Error('Failed to fetch data from server');
    }
}

// Simulate posting data to server
async function postToServer(data) {
    try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        
        // In a real app, this would be: await fetch('https://jsonplaceholder.typicode.com/posts', {method: 'POST', body: JSON.stringify(data)})
        localStorage.setItem('serverQuotes', JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Error posting to server:', error);
        throw new Error('Failed to post data to server');
    }
}

// ============================
// SYNC AND CONFLICT RESOLUTION
// ============================

// Sync data with server
async function syncWithServer() {
    try {
        updateSyncStatus('Syncing with server...', 'sync-warning');
        
        // Fetch latest data from server
        serverQuotes = await fetchFromServer();
        
        // Detect conflicts (differences between local and server data)
        const conflicts = detectConflicts(quotes, serverQuotes);
        
        if (conflicts.length > 0) {
            hasConflicts = true;
            showConflicts(conflicts);
            updateSyncStatus(`Conflict detected! ${conflicts.length} differences found.`, 'sync-error');
        } else {
            // No conflicts, update local data with server data
            quotes = [...serverQuotes];
            saveQuotes();
            populateCategories();
            showRandomQuote();
            updateSyncStatus('Sync completed successfully!', 'sync-success');
            hasConflicts = false;
            hideConflicts();
        }
        
        lastSyncTime = new Date();
        saveLastSyncTime();
        
    } catch (error) {
        updateSyncStatus(`Sync failed: ${error.message}`, 'sync-error');
    }
}

// Detect conflicts between local and server data
function detectConflicts(localData, serverData) {
    const conflicts = [];
    
    // Find quotes that exist in both but are different
    localData.forEach(localQuote => {
        const serverQuote = serverData.find(sq => 
            sq.text === localQuote.text || 
            (similarText(localQuote.text, sq.text) && localQuote.category !== sq.category)
        );
        
        if (serverQuote && (localQuote.text !== serverQuote.text || localQuote.category !== serverQuote.category)) {
            conflicts.push({
                type: 'modified',
                local: localQuote,
                server: serverQuote
            });
        }
    });
    
    // Find quotes that only exist in server
    serverData.forEach(serverQuote => {
        const localQuote = localData.find(lq => lq.text === serverQuote.text);
        if (!localQuote) {
            conflicts.push({
                type: 'server_only',
                server: serverQuote
            });
        }
    });
    
    // Find quotes that only exist locally
    localData.forEach(localQuote => {
        const serverQuote = serverData.find(sq => sq.text === localQuote.text);
        if (!serverQuote) {
            conflicts.push({
                type: 'local_only',
                local: localQuote
            });
        }
    });
    
    return conflicts;
}

// Simple text similarity check
function similarText(text1, text2) {
    const words1 = text1.toLowerCase().split(' ');
    const words2 = text2.toLowerCase().split(' ');
    const commonWords = words1.filter(word => words2.includes(word));
    return commonWords.length / Math.max(words1.length, words2.length) > 0.7;
}

// Show conflicts to user
function showConflicts(conflicts) {
    conflictResolution.style.display = 'block';
    
    let conflictHTML = '';
    conflicts.forEach((conflict, index) => {
        if (conflict.type === 'modified') {
            conflictHTML += `
                <div class="conflict-item">
                    <strong>Modified Quote</strong><br>
                    <strong>Local:</strong> "${conflict.local.text}" (${conflict.local.category})<br>
                    <strong>Server:</strong> "${conflict.server.text}" (${conflict.server.category})
                </div>
            `;
        } else if (conflict.type === 'server_only') {
            conflictHTML += `
                <div class="conflict-item">
                    <strong>New on Server</strong><br>
                    "${conflict.server.text}" (${conflict.server.category})
                </div>
            `;
        } else if (conflict.type === 'local_only') {
            conflictHTML += `
                <div class="conflict-item">
                    <strong>Only in Local</strong><br>
                    "${conflict.local.text}" (${conflict.local.category})
                </div>
            `;
        }
    });
    
    conflictDetails.innerHTML = conflictHTML;
}

function hideConflicts() {
    conflictResolution.style.display = 'none';
}

// Conflict resolution strategies
function resolveConflict(strategy) {
    if (strategy === 'server') {
        // Server data takes precedence
        quotes = [...serverQuotes];
        updateSyncStatus('Conflict resolved: Using server data', 'sync-success');
    } else if (strategy === 'local') {
        // Keep local data
        updateSyncStatus('Conflict resolved: Keeping local data', 'sync-success');
    } else if (strategy === 'merge') {
        // Merge both datasets
        const mergedQuotes = [...quotes];
        serverQuotes.forEach(serverQuote => {
            if (!mergedQuotes.find(q => q.text === serverQuote.text)) {
                mergedQuotes.push(serverQuote);
            }
        });
        quotes = mergedQuotes;
        updateSyncStatus('Conflict resolved: Merged both datasets', 'sync-success');
    }
    
    saveQuotes();
    populateCategories();
    showRandomQuote();
    hasConflicts = false;
    hideConflicts();
    closeConflictModal();
}

function openConflictModal() {
    conflictModal.style.display = 'block';
}

function closeConflictModal() {
    conflictModal.style.display = 'none';
}

// Force use server data
function forceUseServerData() {
    if (confirm('This will replace all local quotes with server data. Continue?')) {
        quotes = [...serverQuotes];
        saveQuotes();
        populateCategories();
        showRandomQuote();
        updateSyncStatus('Forced server data update', 'sync-success');
        hasConflicts = false;
        hideConflicts();
    }
}

// Force keep local data
function forceKeepLocalData() {
    if (confirm('This will upload local data to server. Continue?')) {
        postToServer(quotes);
        updateSyncStatus('Local data forced to server', 'sync-success');
        hasConflicts = false;
        hideConflicts();
    }
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
        // If no saved quotes, use default quotes
        quotes = [...defaultQuotes];
        saveQuotes();
    }
    updateStatistics();
}

// Save selected category to local storage
function saveSelectedCategory() {
    localStorage.setItem('selectedCategory', currentFilter);
}

// Restore last selected category when page loads
function restoreSelectedCategory() {
    const savedCategory = localStorage.getItem('selectedCategory');
    if (savedCategory) {
        currentFilter = savedCategory;
        categoryFilter.value = currentFilter;
        // Apply the filter immediately
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
// PERIODIC SYNC SETUP
// ============================

function setupPeriodicSync() {
    // Sync immediately on load
    setTimeout(syncWithServer, 3000);
    
    // Then sync every 2 minutes
    setInterval(syncWithServer, 2 * 60 * 1000);
    
    // Also sync when window gains focus (user returns to tab)
    window.addEventListener('focus', () => {
        if (!hasConflicts) {
            syncWithServer();
        }
    });
}

// ============================
// REMAINING FUNCTIONS (from previous tasks)
// ============================

// [All previous functions from Task 2 remain the same...]
// populateCategories, filterQuotes, showRandomQuote, addQuote, 
// createAddQuoteForm, exportToJsonFile, importFromJsonFile, 
// updateStatistics, session storage functions, etc.

// Function to populate categories dynamically
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
            
            alert('Quotes imported successfully!');
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
    
    // New sync event listeners
    syncNowButton.addEventListener('click', syncWithServer);
    forceServerButton.addEventListener('click', forceUseServerData);
    forceLocalButton.addEventListener('click', forceKeepLocalData);
    
    showRandomQuote();
    setupPeriodicSync();
    
    setInterval(saveSessionData, 60000);
});