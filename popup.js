document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("save").addEventListener("click", () => {
    const key = document.getElementById("api-key").value.trim();
    chrome.storage.sync.set({ gemini_api_key: key }, () => {
      alert("Gemini API key saved!");
    });
  });
});
