// Array of quote objects - will be loaded from localStorage
let quotes = [];
let currentFilter = 'all';

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

// Default quotes for initial setup
const defaultQuotes = [
    { text: "The only way to do great work is to love what you do.", category: "Inspiration" },
    { text: "Life is what happens to you while you're busy making other plans.", category: "Life" },
    { text: "The future belongs to those who believe in the beauty of their dreams.", category: "Motivation" },
    { text: "It is during our darkest moments that we must focus to see the light.", category: "Wisdom" },
    { text: "Whoever is happy will make others happy too.", category: "Life" }
];

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

function saveFilterPreference() {
    localStorage.setItem('lastCategoryFilter', currentFilter);
}

function loadFilterPreference() {
    const savedFilter = localStorage.getItem('lastCategoryFilter');
    if (savedFilter) {
        currentFilter = savedFilter;
        categoryFilter.value = currentFilter;
    }
}

// ============================
// SESSION STORAGE FUNCTIONS
// ============================

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
// CATEGORY FILTERING SYSTEM
// ============================

// Function to populate categories dynamically
function populateCategories() {
    // Clear existing options except "All Categories"
    while (categoryFilter.options.length > 1) {
        categoryFilter.remove(1);
    }
    
    // Get unique categories
    const categories = [...new Set(quotes.map(quote => quote.category))];
    
    // Add categories to dropdown
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });
    
    updateStatistics();
}

// Function to filter quotes based on selected category
function filterQuotes() {
    currentFilter = categoryFilter.value;
    
    // Save filter preference to localStorage
    saveFilterPreference();
    
    if (currentFilter === 'all') {
        // Show all quotes
        showRandomQuote();
        filterInfo.textContent = `Showing all ${quotes.length} quotes`;
        filteredQuotesElement.textContent = quotes.length;
    } else {
        // Filter quotes by category
        const filteredQuotes = quotes.filter(quote => quote.category === currentFilter);
        
        if (filteredQuotes.length === 0) {
            quoteDisplay.innerHTML = `
                <div class="quote">
                    <p>No quotes found in category: <strong>${currentFilter}</strong></p>
                    <p><em>Try selecting a different category or add new quotes.</em></p>
                </div>
            `;
        } else {
            // Show random quote from filtered category
            const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
            const randomQuote = filteredQuotes[randomIndex];
            
            quoteDisplay.innerHTML = `
                <div class="quote">
                    <p>"${randomQuote.text}"</p>
                    <small>Category: ${randomQuote.category}</small>
                    <p><em>Showing ${filteredQuotes.length} quotes in this category</em></p>
                </div>
            `;
        }
        
        filterInfo.textContent = `Showing ${filteredQuotes.length} quotes in category: ${currentFilter}`;
        filteredQuotesElement.textContent = filteredQuotes.length;
    }
    
    // Save to session storage
    saveSessionData();
}

function clearFilter() {
    categoryFilter.value = 'all';
    currentFilter = 'all';
    saveFilterPreference();
    showRandomQuote();
    filterInfo.textContent = 'Showing all quotes';
}

// ============================
// CORE QUOTE FUNCTIONS
// ============================

// Function to display random quote
function showRandomQuote() {
    if (quotes.length === 0) {
        quoteDisplay.innerHTML = "<p>No quotes available. Add some quotes!</p>";
        return;
    }
    
    let quotesToShow = quotes;
    
    // Apply current filter if not "all"
    if (currentFilter !== 'all') {
        quotesToShow = quotes.filter(quote => quote.category === currentFilter);
        if (quotesToShow.length === 0) {
            quoteDisplay.innerHTML = `
                <div class="quote">
                    <p>No quotes found in category: <strong>${currentFilter}</strong></p>
                    <p><em>Showing random quote from all categories instead.</em></p>
                </div>
            `;
            quotesToShow = quotes; // Fallback to all quotes
            currentFilter = 'all';
            categoryFilter.value = 'all';
            saveFilterPreference();
        }
    }
    
    const randomIndex = Math.floor(Math.random() * quotesToShow.length);
    const randomQuote = quotesToShow[randomIndex];
    
    // Update DOM using innerHTML
    quoteDisplay.innerHTML = `
        <div class="quote">
            <p>"${randomQuote.text}"</p>
            <small>Category: ${randomQuote.category}</small>
        </div>
    `;
    
    // Update filter info
    if (currentFilter === 'all') {
        filterInfo.textContent = `Showing all ${quotes.length} quotes`;
        filteredQuotesElement.textContent = quotes.length;
    } else {
        const filteredCount = quotes.filter(quote => quote.category === currentFilter).length;
        filterInfo.textContent = `Showing ${filteredCount} quotes in category: ${currentFilter}`;
        filteredQuotesElement.textContent = filteredCount;
    }
    
    // Save to session storage
    saveSessionData();
}

// Function to add new quote
function addQuote() {
    const quoteText = document.getElementById('newQuoteText').value.trim();
    const quoteCategory = document.getElementById('newQuoteCategory').value.trim();
    
    if (quoteText && quoteCategory) {
        // Add new quote to array
        quotes.push({
            text: quoteText,
            category: quoteCategory
        });
        
        // Save to local storage
        saveQuotes();
        
        // Update categories dropdown
        populateCategories();
        
        // Clear input fields
        document.getElementById('newQuoteText').value = '';
        document.getElementById('newQuoteCategory').value = '';
        
        // Update DOM to show confirmation
        quoteDisplay.innerHTML = `
            <div class="quote">
                <p>"${quoteText}"</p>
                <small>Category: ${quoteCategory}</small>
                <p><em>Quote added successfully!</em></p>
            </div>
        `;
        
        // Save to session storage
        saveSessionData();
    } else {
        alert('Please enter both quote text and category');
    }
}

// Function to create add quote form dynamically
function createAddQuoteForm() {
    const formContainer = document.createElement('div');
    
    // Create form elements using DOM manipulation
    formContainer.innerHTML = `
        <h3>Add New Quote</h3>
        <div>
            <input id="newQuoteText" type="text" placeholder="Enter a new quote" />
            <input id="newQuoteCategory" type="text" placeholder="Enter quote category" />
            <button onclick="addQuote()">Add Quote</button>
        </div>
    `;
    
    // Append form to body
    document.body.appendChild(formContainer);
}

// ============================
// JSON IMPORT/EXPORT FUNCTIONS
// ============================

// Export quotes to JSON file
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

// Import quotes from JSON file
function importFromJsonFile(event) {
    const fileReader = new FileReader();
    fileReader.onload = function(event) {
        try {
            const importedQuotes = JSON.parse(event.target.result);
            
            // Validate that it's an array
            if (!Array.isArray(importedQuotes)) {
                throw new Error('Invalid JSON format: Expected an array');
            }
            
            // Add imported quotes to existing quotes
            quotes.push(...importedQuotes);
            saveQuotes();
            
            // Update categories dropdown
            populateCategories();
            
            // Show success message
            quoteDisplay.innerHTML = `
                <div class="quote">
                    <p><em>${importedQuotes.length} quotes imported successfully!</em></p>
                    <p>Total quotes now: ${quotes.length}</p>
                </div>
            `;
            
            // Save to session storage
            saveSessionData();
            
            alert('Quotes imported successfully!');
        } catch (error) {
            alert('Error importing quotes: ' + error.message);
        }
    };
    fileReader.readAsText(event.target.files[0]);
    
    // Reset file input
    event.target.value = '';
}

// ============================
// UTILITY FUNCTIONS
// ============================

function updateStatistics() {
    totalQuotesElement.textContent = quotes.length;
    
    // Calculate unique categories
    const categories = [...new Set(quotes.map(quote => quote.category))];
    totalCategoriesElement.textContent = categories.length;
    
    // Update filtered count
    if (currentFilter === 'all') {
        filteredQuotesElement.textContent = quotes.length;
    } else {
        const filteredCount = quotes.filter(quote => quote.category === currentFilter).length;
        filteredQuotesElement.textContent = filteredCount;
    }
}

// ============================
// INITIALIZATION
// ============================

// Event listener for "Show New Quote" button
document.addEventListener('DOMContentLoaded', function() {
    // Load quotes from local storage
    loadQuotes();
    
    // Load filter preference
    loadFilterPreference();
    
    // Load session data
    loadSessionData();
    
    // Populate categories dropdown
    populateCategories();
    
    // Create the add quote form dynamically
    createAddQuoteForm();
    
    // Add event listeners
    newQuoteButton.addEventListener('click', showRandomQuote);
    exportBtn.addEventListener('click', exportToJsonFile);
    importFile.addEventListener('change', importFromJsonFile);
    categoryFilter.addEventListener('change', filterQuotes);
    clearFilterButton.addEventListener('click', clearFilter);
    
    // Display initial quote with current filter
    if (currentFilter === 'all') {
        showRandomQuote();
    } else {
        filterQuotes();
    }
    
    // Auto-save session data every minute
    setInterval(saveSessionData, 60000);
});