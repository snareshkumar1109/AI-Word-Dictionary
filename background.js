chrome.contextMenus.create({
  id: "define-word",
  title: "Define this word",
  contexts: ["selection"]
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "define-word" && info.selectionText) {
    const selectedWord = info.selectionText.trim();
    chrome.storage.local.set({ selectedWord: selectedWord }, () => {
      chrome.action.openPopup();
    });
  }
});