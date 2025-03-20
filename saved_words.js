document.addEventListener("DOMContentLoaded", function () {
    const wordList = document.getElementById("wordList");
    const emptyState = document.getElementById("emptyState");
    const searchInput = document.getElementById("searchInput");
    const clearSearch = document.getElementById("clearSearch");
    const exportBtn = document.getElementById("exportBtn");
    const clearAllBtn = document.getElementById("clearAllBtn");
    
    let savedWords = [];
    
    // Load saved words from storage
    function loadWords() {
        chrome.storage.sync.get("savedWords", function (data) {
            savedWords = data.savedWords || [];
            displayWords(savedWords);
        });
    }
    
    // Display words in the list
    function displayWords(words) {
        wordList.innerHTML = "";
        
        if (words.length === 0) {
            emptyState.style.display = "flex";
            return;
        }
        
        emptyState.style.display = "none";
        
        words.forEach((word, index) => {
            const li = document.createElement("li");
            li.className = "word-item";
            
            const wordContent = document.createElement("div");
            wordContent.className = "word-content";
            
            const wordText = document.createElement("span");
            wordText.className = "word-text";
            wordText.textContent = word;
            
            const wordActions = document.createElement("div");
            wordActions.className = "word-actions";
            
            // Lookup button
            const lookupBtn = document.createElement("button");
            lookupBtn.className = "btn-lookup";
            lookupBtn.title = "Look up this word";
            lookupBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
            `;
            lookupBtn.addEventListener("click", function() {
                lookupWord(word);
            });
            
            // Delete button
            const deleteBtn = document.createElement("button");
            deleteBtn.className = "btn-delete";
            deleteBtn.title = "Delete this word";
            deleteBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
            `;
            deleteBtn.addEventListener("click", function() {
                deleteWord(index, word);
            });
            
            wordActions.appendChild(lookupBtn);
            wordActions.appendChild(deleteBtn);
            
            wordContent.appendChild(wordText);
            wordContent.appendChild(wordActions);
            
            li.appendChild(wordContent);
            wordList.appendChild(li);
        });
    }

    // Delete a word
    function deleteWord(index, word) {
        if (confirm(`Are you sure you want to delete "${word}"?`)) {
            savedWords.splice(index, 1);
            chrome.storage.sync.set({ "savedWords": savedWords }, function() {
                showToast(`"${word}" has been removed`);
                displayWords(savedWords);
            });
        }
    }
    
    // Look up a word (open in popup)
    function lookupWord(word) {
        chrome.storage.local.set({ selectedWord: word }, () => {
            chrome.windows.create({
                url: chrome.runtime.getURL("popup.html"),
                type: "popup",
                width: 450,
                height: 600
            });
        });
    }
    
    // Search functionality
    searchInput.addEventListener("input", function() {
        const searchTerm = this.value.toLowerCase().trim();
        
        if (searchTerm === "") {
            displayWords(savedWords);
            return;
        }
        
        const filteredWords = savedWords.filter(word => 
            word.toLowerCase().includes(searchTerm)
        );
        
        displayWords(filteredWords);
    });
    
    // Clear search
    clearSearch.addEventListener("click", function() {
        searchInput.value = "";
        displayWords(savedWords);
    });
    
    // Export words
    exportBtn.addEventListener("click", function() {
        if (savedWords.length === 0) {
            showToast("No words to export");
            return;
        }
        
        const wordText = savedWords.join("\n");
        const blob = new Blob([wordText], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement("a");
        a.href = url;
        a.download = "saved-words.txt";
        a.click();
        
        URL.revokeObjectURL(url);
        showToast("Words exported successfully");
    });
    
    // Clear all words
    clearAllBtn.addEventListener("click", function() {
        if (savedWords.length === 0) {
            showToast("No words to clear");
            return;
        }
        
        if (confirm("Are you sure you want to delete all saved words? This cannot be undone.")) {
            chrome.storage.sync.set({ "savedWords": [] }, function() {
                savedWords = [];
                displayWords(savedWords);
                showToast("All words have been cleared");
            });
        }
    });
    
    // Show toast message
    function showToast(message) {
        // Remove any existing toast
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }
        
        // Create new toast
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        // Add styles for the toast
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.left = '50%';
        toast.style.transform = 'translateX(-50%)';
        toast.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        toast.style.color = 'white';
        toast.style.padding = '10px 20px';
        toast.style.borderRadius = '4px';
        toast.style.zIndex = '1000';
        toast.style.transition = 'opacity 0.5s';
        
        // Animate and remove after 2 seconds
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 500);
        }, 2000);
    }
    
    // Load words on initial page load
    loadWords();
});
