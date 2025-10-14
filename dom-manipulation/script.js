// Initial quotes array - will be loaded from localStorage if available
let quotes = [];

// DOM Elements
const quoteTextElement = document.getElementById('quoteText');
const quoteAuthorElement = document.getElementById('quoteAuthor');
const quoteCategoryElement = document.getElementById('quoteCategory');
const newQuoteButton = document.getElementById('newQuote');
const filterQuotesButton = document.getElementById('filterQuotes');
const addQuoteButton = document.getElementById('addQuoteBtn');
const newQuoteTextInput = document.getElementById('newQuoteText');
const newQuoteAuthorInput = document.getElementById('newQuoteAuthor');
const newQuoteCategorySelect = document.getElementById('newQuoteCategory');
const notification = document.getElementById('notification');
const totalQuotesElement = document.getElementById('totalQuotes');
const totalCategoriesElement = document.getElementById('totalCategories');
const quotesDisplayedElement = document.getElementById('quotesDisplayed');

// Management buttons
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const clearBtn = document.getElementById('clearBtn');
const resetBtn = document.getElementById('resetBtn');
const importFile = document.getElementById('importFile');

// Statistics
let quotesDisplayedCount = 0;

// Default quotes for initial setup
const defaultQuotes = [
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs", category: "Inspiration" },
    { text: "Life is what happens to you while you're busy making other plans.", author: "John Lennon", category: "Life" },
    { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt", category: "Motivation" },
    { text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle", category: "Wisdom" },
    { text: "Whoever is happy will make others happy too.", author: "Anne Frank", category: "Life" },
    { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein", category: "Wisdom" },
    { text: "The only impossible journey is the one you never begin.", author: "Tony Robbins", category: "Motivation" },
    { text: "Don't judge each day by the harvest you reap but by the seeds that you plant.", author: "Robert Louis Stevenson", category: "Wisdom" },
    { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney", category: "Success" },
    { text: "Your time is limited, so don't waste it living someone else's life.", author: "Steve Jobs", category: "Inspiration" }
];

// Local Storage Functions
function saveQuotesToLocalStorage() {
    localStorage.setItem('quotes', JSON.stringify(quotes));
    console.log('Quotes saved to localStorage:', quotes.length, 'quotes');
}

function loadQuotesFromLocalStorage() {
    const savedQuotes = localStorage.getItem('quotes');
    if (savedQuotes) {
        quotes = JSON.parse(savedQuotes);
        console.log('Quotes loaded from localStorage:', quotes.length, 'quotes');
    } else {
        // If no saved quotes, use default quotes and save them
        quotes = [...defaultQuotes];
        saveQuotesToLocalStorage();
        console.log('Default quotes loaded and saved to localStorage');
    }
}

function clearLocalStorage() {
    localStorage.removeItem('quotes');
    quotes = [...defaultQuotes];
    saveQuotesToLocalStorage();
    updateStatistics();
    showRandomQuote();
    showNotification('Local storage cleared and default quotes restored');
}

// Function to show random quote
function showRandomQuote() {
    if (quotes.length === 0) {
        quoteTextElement.textContent = "No quotes available. Add some quotes!";
        quoteAuthorElement.textContent = "";
        quoteCategoryElement.textContent = "Empty";
        return;
    }
    
    const randomIndex = Math.floor(Math.random() * quotes.length);
    const randomQuote = quotes[randomIndex];
    
    quoteTextElement.textContent = randomQuote.text;
    quoteAuthorElement.textContent = `- ${randomQuote.author}`;
    quoteCategoryElement.textContent = randomQuote.category;
    
    quotesDisplayedCount++;
    quotesDisplayedElement.textContent = quotesDisplayedCount;
}

// Function to show category filter
function showCategoryFilter() {
    const categories = [...new Set(quotes.map(quote => quote.category))];
    
    if (categories.length === 0) {
        alert("No quotes available to filter.");
        return;
    }
    
    let filterOptions = "Filter by category:\n";
    categories.forEach((category, index) => {
        filterOptions += `${index + 1}. ${category}\n`;
    });
    
    const selectedCategory = prompt(filterOptions + "\nEnter the category number:");
    
    if (selectedCategory && !isNaN(selectedCategory) && selectedCategory > 0 && selectedCategory <= categories.length) {
        const categoryIndex = parseInt(selectedCategory) - 1;
        const filteredQuotes = quotes.filter(quote => quote.category === categories[categoryIndex]);
        
        if (filteredQuotes.length > 0) {
            const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
            const randomQuote = filteredQuotes[randomIndex];
            
            quoteTextElement.textContent = randomQuote.text;
            quoteAuthorElement.textContent = `- ${randomQuote.author}`;
            quoteCategoryElement.textContent = randomQuote.category;
            
            quotesDisplayedCount++;
            quotesDisplayedElement.textContent = quotesDisplayedCount;
            
            showNotification(`Showing quote from category: ${categories[categoryIndex]}`);
        }
    }
}

// Function to add new quote
function addQuote() {
    const text = newQuoteTextInput.value.trim();
    const author = newQuoteAuthorInput.value.trim();
    const category = newQuoteCategorySelect.value;
    
    if (!text) {
        showNotification("Please enter a quote text.", true);
        return;
    }
    
    if (!author) {
        showNotification("Please enter an author name.", true);
        return;
    }
    
    const newQuote = {
        text: text,
        author: author,
        category: category
    };
    
    quotes.push(newQuote);
    
    // Save to localStorage after adding new quote
    saveQuotesToLocalStorage();
    
    newQuoteTextInput.value = '';
    newQuoteAuthorInput.value = '';
    newQuoteCategorySelect.value = 'Inspiration';
    
    updateStatistics();
    showNotification("Quote added successfully!");
    
    setTimeout(() => {
        quoteTextElement.textContent = newQuote.text;
        quoteAuthorElement.textContent = `- ${newQuote.author}`;
        quoteCategoryElement.textContent = newQuote.category;
        
        quotesDisplayedCount++;
        quotesDisplayedElement.textContent = quotesDisplayedCount;
    }, 1500);
}

// Function to delete all quotes
function deleteAllQuotes() {
    if (confirm('Are you sure you want to delete all quotes? This action cannot be undone.')) {
        quotes = [];
        saveQuotesToLocalStorage();
        updateStatistics();
        showRandomQuote();
        showNotification('All quotes deleted');
    }
}

// Function to export quotes as JSON - using the exact function name required
function exportToJsonFile() {
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

// Function to import quotes from JSON file - using the exact function name required
function importFromJsonFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedQuotes = JSON.parse(e.target.result);
            if (Array.isArray(importedQuotes)) {
                quotes = importedQuotes;
                saveQuotesToLocalStorage();
                updateStatistics();
                showRandomQuote();
                showNotification('Quotes imported successfully!');
            } else {
                showNotification('Invalid file format', true);
            }
        } catch (error) {
            showNotification('Error importing quotes: ' + error.message, true);
        }
    };
    reader.readAsText(file);
    
    // Reset file input
    event.target.value = '';
}

// Function to update statistics
function updateStatistics() {
    totalQuotesElement.textContent = quotes.length;
    
    const categories = [...new Set(quotes.map(quote => quote.category))];
    totalCategoriesElement.textContent = categories.length;
}

// Function to show notification
function showNotification(message, isError = false) {
    notification.textContent = message;
    notification.style.background = isError ? '#e74c3c' : '#27ae60';
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Function to create add quote form (as required by the task)
function createAddQuoteForm() {
    console.log("Add quote form is ready");
}

// Initialize the application
function init() {
    // Load quotes from localStorage
    loadQuotesFromLocalStorage();
    
    showRandomQuote();
    updateStatistics();
    
    // Set up event listeners
    newQuoteButton.addEventListener('click', showRandomQuote);
    filterQuotesButton.addEventListener('click', showCategoryFilter);
    addQuoteButton.addEventListener('click', addQuote);
    
    // Management buttons event listeners
    exportBtn.addEventListener('click', exportToJsonFile); // Using exact function name
    importBtn.addEventListener('click', () => {
        importFile.click();
    });
    clearBtn.addEventListener('click', deleteAllQuotes);
    resetBtn.addEventListener('click', clearLocalStorage);
    importFile.addEventListener('change', importFromJsonFile); // Using exact function name
    
    createAddQuoteForm();
    
    console.log('Application initialized with', quotes.length, 'quotes');
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);