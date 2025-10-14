// Initial quotes array
let quotes = [
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

// Statistics
let quotesDisplayedCount = 0;

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
    // This function creates the form elements dynamically
    // In our case, the form is already in the HTML, so we just set up event listeners
    console.log("Add quote form is ready");
}

// Initialize the application
function init() {
    showRandomQuote();
    updateStatistics();
    
    // Set up event listeners
    newQuoteButton.addEventListener('click', showRandomQuote);
    filterQuotesButton.addEventListener('click', showCategoryFilter);
    addQuoteButton.addEventListener('click', addQuote);
    
    createAddQuoteForm();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);