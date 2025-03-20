document.addEventListener("DOMContentLoaded", async () => {
    const API_KEY = "AIzaSyC0Rxb0nqYA0n1qpaM9uYa-524oamJQj_4";
    const API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
  
    const wordElement = document.getElementById("word");
    const speakBtn = document.getElementById("speakBtn");
    const outputElement = document.getElementById("output");
    const saveWordBtn = document.getElementById("save-word");
    const viewSavedBtn = document.getElementById("view-saved");
  
    if (!wordElement || !speakBtn || !outputElement || !saveWordBtn || !viewSavedBtn) {
      console.error("❌ One or more elements are missing in popup.html");
      return;
    }
  
    chrome.storage.local.get("selectedWord", async (data) => {
      const word = data.selectedWord ? data.selectedWord.trim() : "No word selected";
      wordElement.textContent = word;
  
      if (word === "No word selected") {
        outputElement.innerHTML = `
          <div class="not-found">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <p>No word selected. Right-click a word on any webpage and select "Define this word".</p>
          </div>`;
        return;
      }
  
      try {
        const queries = [
          "Definition", 
          "Synonyms (Limit to 4 words)", 
          "Antonyms (Limit to 4 words)", 
          "Example (Short sentence)", 
         "Translation (give 7 languages including Hindi, Bengali, Tamil, Malayalam, Spanish, French, Chinese)"
        ];
  
        const responses = await Promise.all(queries.map(async (query) => {
          const response = await fetch(`${API_BASE_URL}/models/gemini-2.0-flash:generateContent?key=${API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{
                parts: [{ text: `Provide only essential information for '${word}': ${query}. Keep it minimal and remove unnecessary formatting.` }]  
              }]
            })
          });
          
          if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
          const result = await response.json();
          return result.candidates?.[0]?.content?.parts?.[0]?.text || "N/A";
        }));
  
        // Clean up translation format
        let translationText = responses[4]
          .replace(/^Translation:\s*/, '')
          .replace(/\*\*|\*/g, '')
          .replace(/\n/g, ' ')
          .replace(/(\w+):/g, '\n$1:').trim()
          .replace(/\s+/g, ' ')
          .replace(/^[^:]*:\s*/, '').trim();
        
        // Split translations into an array of language:translation pairs
        let translations = translationText.split(/(?=[A-Z][a-z]+:)/)
          .map(item => item.trim())
          .filter(item => item.includes(':'));
  
        // Parse synonyms and antonyms
        const synonyms = responses[1].split(',').map(s => s.trim()).filter(s => s.length > 0 && !s.includes('N/A'));
        const antonyms = responses[2].split(',').map(s => s.trim()).filter(s => s.length > 0 && !s.includes('N/A'));
  
        outputElement.innerHTML = `
          <div class="word-section">
            <h2>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 20V10"></path>
                <path d="M18 20V4"></path>
                <path d="M6 20v-4"></path>
              </svg>
              Definition
            </h2>
            <p>${responses[0]}</p>
          </div>
          
          <div class="word-section">
            <h2>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              </svg>
              Example
            </h2>
            <p>${responses[3]}</p>
          </div>
          
          <div class="word-section">
            <h2>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              Synonyms & Antonyms
            </h2>
            <div class="synonym-list">
              ${synonyms.map(syn => `<span class="word-tag">${syn}</span>`).join('') || "No synonyms found"}
            </div>
            <div class="antonym-list" style="margin-top: 12px;">
              ${antonyms.map(ant => `<span class="word-tag">${ant}</span>`).join('') || "No antonyms found"}
            </div>
          </div>
          
          <div class="word-section">
            <h2>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 2H3v16h5v4l4-4h5l4-4V2z"></path>
                <path d="M10 8h4"></path>
                <path d="M10 12h4"></path>
                <path d="M10 16h4"></path>
              </svg>
              Translations
            </h2>
            <div class="translation-list">
              ${translations.map(trans => {
                const [lang, transl] = trans.split(':').map(item => item.trim());
                return `<div class="translation-item">
                  <span class="translation-language">${lang}:</span>
                  <span class="translation-text">${transl}</span>
                </div>`;
              }).join('')}
            </div>
          </div>
        `;
      } catch (error) {
        console.error("❌ Error fetching data:", error);
        outputElement.innerHTML = `
          <div class="not-found">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <p>Error loading data. Please try again later.</p>
          </div>`;
      }
    });
  
    speakBtn.addEventListener("click", () => {
      const utterance = new SpeechSynthesisUtterance(wordElement.textContent);
      speechSynthesis.speak(utterance);
    });
  
    saveWordBtn.addEventListener("click", () => {
      chrome.storage.sync.get("savedWords", (result) => {
        let savedWords = result.savedWords || [];
        const wordToSave = wordElement.textContent.trim();
  
        if (!savedWords.includes(wordToSave)) {
          savedWords.push(wordToSave);
          chrome.storage.sync.set({ savedWords }, () => {
            showToast(`${wordToSave} saved!`);
          });
        } else {
          showToast(`${wordToSave} is already saved.`);
        }
      });
    });
  
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
  
    viewSavedBtn.addEventListener("click", () => {
      chrome.windows.create({
        url: chrome.runtime.getURL("saved_words.html"),
        type: "popup",
        width: 450,
        height: 600
      });
    });
  });