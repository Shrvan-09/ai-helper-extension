console.log("✅ AI Helper Content Script loaded");

chrome.storage.sync.get(["gemini_api_key"], (result) => {
  if (!result.gemini_api_key) {
    console.log("Gemini API key not set.");
    return;
  }

  injectAIButton(result.gemini_api_key);
});


function injectAIButton(apiKey) {
  if (document.getElementById("ai-help-btn")) return;

  const button = document.createElement("button");
  button.id = "ai-help-btn";
  button.innerText = "🧠 AI Help";
  button.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 10px 15px;
    background-color: #4A90E2;
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: bold;
    cursor: pointer;
    z-index: 1000;
  `;

  button.addEventListener("click", () => toggleChatbox(apiKey));
  document.body.appendChild(button);
}

function toggleChatbox(apiKey) {
  const existingBox = document.getElementById("ai-chatbox");
  if (existingBox) {
    existingBox.remove();
    return;
  }

  const chatbox = document.createElement("div");
  chatbox.id = "ai-chatbox";
  chatbox.innerHTML = `
    <div class="ai-chatbox-container">
      <div id="chat-log" class="chat-log"></div>
      <textarea id="ai-user-input" placeholder="Ask me anything..."></textarea>
      <button id="send-msg">Send</button>
    </div>
  `;

  document.body.appendChild(chatbox);

  document.getElementById("send-msg").addEventListener("click", async () => {
    const inputBox = document.getElementById("ai-user-input");
    const userText = inputBox.value.trim();
    if (!userText) return;

    appendMessage("You", userText);
    inputBox.value = "";

    const problemText = getProblemText();
    const aiResponse = await fetchAIResponse(userText, problemText, apiKey);
    appendMessage("AI", aiResponse);
  });
}

function appendMessage(sender, message) {
  const chatLog = document.getElementById("chat-log");
  const msg = document.createElement("div");
  msg.innerHTML = `<strong>${sender}:</strong> ${message}`;
  chatLog.appendChild(msg);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function getProblemText() {
  const container = document.querySelector(".coding_desc_container__gdB9M");
  if (!container) return "No context available.";

  let context = "";
  const children = container.children;

  for (let i = 0; i < children.length; i++) {
    const heading = children[i].querySelector("h5");
    const paragraph = children[i].querySelector("div");

    if (heading && paragraph) {
      context += `\n${heading.innerText}:\n${paragraph.innerText}\n`;
    }
  }

  return context.trim();
}


async function fetchAIResponse(userText, context, apiKey) {
  const prompt = `Problem:\n${context}\n\nUser question:\n${userText}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok || data.error) {
      return `Gemini Error: ${data.error?.message || "Unknown error."}`;
    }

    return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response from Gemini.";
  } catch (err) {
    console.error("❌ Gemini fetch error:", err);
    return "Failed to fetch Gemini response.";
  }
}
