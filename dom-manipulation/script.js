// Array of quote objects
let quotes = [
    { text: "The only way to do great work is to love what you do.", category: "Inspiration" },
    { text: "Life is what happens to you while you're busy making other plans.", category: "Life" },
    { text: "The future belongs to those who believe in the beauty of their dreams.", category: "Motivation" },
    { text: "It is during our darkest moments that we must focus to see the light.", category: "Wisdom" },
    { text: "Whoever is happy will make others happy too.", category: "Life" }
];

// Function to display random quote
function showRandomQuote() {
    if (quotes.length === 0) {
        document.getElementById('quoteDisplay').innerHTML = "<p>No quotes available. Add some quotes!</p>";
        return;
    }
    
    const randomIndex = Math.floor(Math.random() * quotes.length);
    const randomQuote = quotes[randomIndex];
    
    // Update DOM using innerHTML as required
    document.getElementById('quoteDisplay').innerHTML = `
        <div class="quote">
            <p>"${randomQuote.text}"</p>
            <small>Category: ${randomQuote.category}</small>
        </div>
    `;
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
        
        // Clear input fields
        document.getElementById('newQuoteText').value = '';
        document.getElementById('newQuoteCategory').value = '';
        
        // Update DOM to show confirmation
        document.getElementById('quoteDisplay').innerHTML = `
            <div class="quote">
                <p>"${quoteText}"</p>
                <small>Category: ${quoteCategory}</small>
                <p><em>Quote added successfully!</em></p>
            </div>
        `;
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

// Event listener for "Show New Quote" button
document.addEventListener('DOMContentLoaded', function() {
    // Create the add quote form dynamically
    createAddQuoteForm();
    
    // Add event listener to the "Show New Quote" button
    document.getElementById('newQuote').addEventListener('click', showRandomQuote);
    
    // Display initial quote
    showRandomQuote();
});