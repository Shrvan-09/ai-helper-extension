console.log("✅ AI Helper Content Script loaded");

chrome.storage.sync.get(["gemini_api_key"], (result) => {
  if (!result.gemini_api_key) {
    console.log("Gemini API key not set.");
    return;
  }
  injectAIButton(result.gemini_api_key);
});

let chatboxRef = null; // Store reference to chatbox

function injectAIButton(apiKey) {
  if (document.getElementById("ai-help-btn")) return;

  // Try to find the nav/tab bar containing "Description", "Hints", etc.
  const navBar = document.querySelector('.css-1p8v0p7, .css-1k2j1b1, .problem-header, .coding_header__Q8QwK, .header, .css-1k2j1b1, .MuiTabs-flexContainer');
  if (navBar) {
    // Insert AI Help button as a tab-like button
    const aiTabBtn = document.createElement("button");
    aiTabBtn.id = "ai-help-btn";
    aiTabBtn.innerHTML = `<span style="display:inline-flex;align-items:center;gap:6px;"><span class="btn-icon">🧠</span> <span class="btn-text">AI Help</span></span>`;
    aiTabBtn.type = "button";
    aiTabBtn.style.cssText = `
      background: transparent;
      border: none;
      color: #fff;
      font-size: 1rem;
      font-weight: 500;
      padding: 0 18px;
      height: 44px;
      display: inline-flex;
      align-items: center;
      cursor: pointer;
      border-radius: 8px;
      margin-left: 8px;
      opacity: 0.85;
      transition: background 0.2s, opacity 0.2s;
      outline: none;
    `;
    aiTabBtn.addEventListener('mouseenter', () => {
      aiTabBtn.style.background = '#23293a'; // matches hover of nav bar
      aiTabBtn.style.opacity = '1';
    });
    aiTabBtn.addEventListener('mouseleave', () => {
      aiTabBtn.style.background = 'transparent';
      aiTabBtn.style.opacity = '0.85';
    });
    aiTabBtn.addEventListener("click", () => {
      toggleChatboxFull(apiKey);
    });

    navBar.appendChild(aiTabBtn);
    return;
  }

  // Fallback: insert after Doubt Forum button as before
  const doubtForumBtn = document.querySelector('button, a, .doubt-forum-btn, [href*="doubt"]');
  if (doubtForumBtn) {
    const aiBtn = createAIButton(apiKey);
    doubtForumBtn.parentNode.insertBefore(aiBtn, doubtForumBtn.nextSibling);
  } else {
    document.body.appendChild(createAIButton(apiKey));
  }
}

function createAIButton(apiKey) {
  const button = document.createElement("button");
  button.id = "ai-help-btn";
  button.innerHTML = `<span class="btn-icon">🧠</span> <span class="btn-text">AI Help</span>`;
  button.type = "button";
  // Match the style of other top buttons (adjust selectors as needed)
  button.style.cssText = `
    margin-left: 12px;
    padding: 8px 18px;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    font-size: 1rem;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.15);
    transition: all 0.2s;
    height: 40px;
  `;

  button.addEventListener('mouseenter', () => {
    button.style.background = 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)';
  });
  button.addEventListener('mouseleave', () => {
    button.style.background = 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)';
  });

  button.addEventListener("click", () => {
    toggleChatboxFull(apiKey);
  });

  return button;
}

// Cover the area below the top buttons
function toggleChatboxFull(apiKey) {
  const existingBox = document.getElementById("ai-chatbox");
  if (existingBox) {
    existingBox.remove();
    chatboxRef = null;
    return;
  }

  // Find the top bar (where the buttons are)
  const topBar = document.querySelector('.css-1p8v0p7, .css-1k2j1b1, .problem-header, .coding_header__Q8QwK, .header, .css-1k2j1b1'); // adjust selector as needed
  let topBarRect = { bottom: 60 }; // fallback
  if (topBar) topBarRect = topBar.getBoundingClientRect();

  const chatbox = document.createElement("div");
  chatbox.id = "ai-chatbox";
  chatbox.innerHTML = `
    <div class="ai-chatbox-container" style="height:100%;display:flex;flex-direction:column;">
      <div class="ai-chatbox-header" style="display:flex;justify-content:space-between;align-items:center;padding:12px 20px;background:#6366f1;color:white;">
        <span style="font-size:1.1rem;font-weight:600;">AI Chat</span>
        <div>
          <button id="export-chat-btn" title="Export Chat History" style="margin-right:8px;">📄</button>
          <button id="delete-history-btn" title="Clear Chat History">🗑️</button>
          <button id="close-ai-chatbox" title="Close" style="margin-left:12px;font-size:1.2rem;background:none;border:none;color:white;cursor:pointer;">✖</button>
        </div>
      </div>
      <div id="chat-log" class="chat-log" style="flex:1;overflow-y:auto;padding:16px;background:#f8fafc;"></div>
      <div class="ai-chatbox-footer" style="display:flex;gap:8px;padding:12px 20px;background:#eef2ff;">
        <textarea id="ai-user-input" placeholder="Ask me anything..." style="flex:1;resize:none;height:40px;padding:8px;border-radius:6px;border:1px solid #c7d2fe;"></textarea>
        <button id="send-msg" style="background:#6366f1;color:white;border:none;border-radius:6px;padding:0 18px;font-weight:600;cursor:pointer;">Send</button>
      </div>
    </div>
  `;

  // Position and size: cover area below the top bar
  chatbox.style.position = 'fixed';
  chatbox.style.left = '0';
  chatbox.style.right = '0';
  chatbox.style.top = (topBarRect.bottom + window.scrollY) + 'px';
  chatbox.style.bottom = '0';
  chatbox.style.zIndex = 2001;
  chatbox.style.background = 'rgba(0,0,0,0.08)';
  chatbox.style.boxShadow = '0 8px 32px rgba(99,102,241,0.15)';
  chatbox.style.display = 'flex';
  chatbox.style.flexDirection = 'column';

  document.body.appendChild(chatbox);
  chatboxRef = chatbox;

  // Smooth entrance animation
  chatbox.style.opacity = '0';
  chatbox.style.transform = 'translateY(20px) scale(0.98)';
  setTimeout(() => {
    chatbox.style.transition = 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
    chatbox.style.opacity = '1';
    chatbox.style.transform = 'translateY(0) scale(1)';
  }, 10);

  restoreChatHistory();

  document.getElementById("export-chat-btn").addEventListener("click", () => {
    exportChatHistory();
  });
  document.getElementById("delete-history-btn").addEventListener("click", () => {
    if (confirm("Are you sure you want to clear the chat history for this problem?")) {
      clearCurrentProblemHistory();
      const chatLog = document.getElementById("chat-log");
      chatLog.innerHTML = "";
    }
  });
  document.getElementById("close-ai-chatbox").addEventListener("click", () => {
    chatbox.remove();
    chatboxRef = null;
  });

  document.getElementById("send-msg").addEventListener("click", async () => {
    await handleUserInput(apiKey);
  });
  document.getElementById("ai-user-input").addEventListener("keydown", async (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      await handleUserInput(apiKey);
    }
  });
}

function toggleChatbox(apiKey) {
  const existingBox = document.getElementById("ai-chatbox");
  const aiButton = document.getElementById("ai-help-btn");
  if (existingBox) {
    existingBox.remove();
    chatboxRef = null;
    return;
  }

  const chatbox = document.createElement("div");
  chatbox.id = "ai-chatbox";
  chatbox.innerHTML = `
    <div class="ai-chatbox-container">
      <div class="resize-grip" title="Resize from corner"></div>
      <div class="top-resize-handle" title="Drag to resize height">⋮⋮⋮</div>
      <div class="ai-chatbox-header">
        <span>AI Chat</span>
        <div class="header-actions">
          <button id="export-chat-btn" title="Export Chat History">📄</button>
          <button id="delete-history-btn" title="Clear Chat History">🗑️</button>
        </div>
      </div>
      <div id="chat-log" class="chat-log"></div>
      <div class="ai-chatbox-footer">
        <textarea id="ai-user-input" placeholder="Ask me anything..."></textarea>
        <button id="send-msg">Send</button>
      </div>
    </div>
  `;

  // Get AI button position and dimensions
  const buttonRect = aiButton.getBoundingClientRect();
  const chatboxWidth = 380;
  let chatboxHeight = 520;
  const gap = 12;

  // Center chatbox above the button
  let chatLeft = buttonRect.left + (buttonRect.width / 2) - (chatboxWidth / 2);
  let chatTop = buttonRect.top - chatboxHeight - gap;

  // Ensure chatbox stays within viewport horizontally
  if (chatLeft < 10) chatLeft = 10;
  if (chatLeft + chatboxWidth > window.innerWidth - 10)
    chatLeft = window.innerWidth - chatboxWidth - 10;

  // If not enough space above, adjust height and top
  if (chatTop < 10) {
    const availableHeight = buttonRect.top - gap - 10;
    if (availableHeight >= 300) {
      chatboxHeight = availableHeight;
      chatTop = 10;
    } else {
      chatboxHeight = 300;
      chatTop = 10;
    }
  }

  chatbox.style.position = 'fixed';
  chatbox.style.left = chatLeft + 'px';
  chatbox.style.top = chatTop + 'px';
  chatbox.style.zIndex = 2001;
  chatbox.style.width = chatboxWidth + 'px';
  chatbox.style.height = chatboxHeight + 'px';

  document.body.appendChild(chatbox);
  chatboxRef = chatbox;

  // Smooth entrance animation
  chatbox.style.opacity = '0';
  chatbox.style.transform = 'translateY(20px) scale(0.95)';
  setTimeout(() => {
    chatbox.style.transition = 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
    chatbox.style.opacity = '1';
    chatbox.style.transform = 'translateY(0) scale(1)';
  }, 10);

  restoreChatHistory();

  document.getElementById("export-chat-btn").addEventListener("click", () => {
    exportChatHistory();
  });

  document.getElementById("delete-history-btn").addEventListener("click", () => {
    if (confirm("Are you sure you want to clear the chat history for this problem?")) {
      clearCurrentProblemHistory();
      const chatLog = document.getElementById("chat-log");
      chatLog.innerHTML = "";
    }
  });

  // Resize logic
  const grip = chatbox.querySelector('.resize-grip');
  let resizing = false, startX, startY, startWidth, startHeight, startLeft, startTop;
  grip.addEventListener('mousedown', function(e) {
    e.preventDefault();
    resizing = true;
    startX = e.clientX;
    startY = e.clientY;
    const rect = chatbox.getBoundingClientRect();
    startWidth = rect.width;
    startHeight = rect.height;
    startLeft = rect.left;
    startTop = rect.top;
    document.body.style.userSelect = 'none';
    grip.style.background = 'rgba(99, 102, 241, 0.3)';
  });

  const topHandle = chatbox.querySelector('.top-resize-handle');
  let topResizing = false, startTopY, startTopHeight, startTopTop;
  topHandle.addEventListener('mousedown', function(e) {
    e.preventDefault();
    topResizing = true;
    startTopY = e.clientY;
    const rect = chatbox.getBoundingClientRect();
    startTopHeight = rect.height;
    startTopTop = rect.top;
    document.body.style.userSelect = 'none';
    topHandle.style.background = 'rgba(99, 102, 241, 0.5)';
  });

  document.addEventListener('mousemove', function(e) {
    if (resizing) {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      
      // Calculate new dimensions
      let newWidth = Math.max(300, startWidth - deltaX);
      let newHeight = Math.max(350, startHeight - deltaY);
      let newLeft = startLeft + deltaX;
      
      // Constrain to screen boundaries
      const minLeft = 10;
      const maxLeft = window.innerWidth - newWidth - 10;
      const maxWidth = window.innerWidth - startLeft - 10;
      const maxHeight = window.innerHeight - startTop - 10;
      
      // Apply constraints
      if (newLeft < minLeft) {
        newWidth = startWidth + (startLeft - minLeft);
        newLeft = minLeft;
      }
      if (newLeft > maxLeft) {
        newLeft = maxLeft;
        newWidth = window.innerWidth - newLeft - 10;
      }
      if (newWidth > maxWidth) {
        newWidth = maxWidth;
      }
      if (newHeight > maxHeight) {
        newHeight = maxHeight;
      }
      
      // Apply new dimensions and position
      chatbox.style.width = newWidth + 'px';
      chatbox.style.height = newHeight + 'px';
      chatbox.style.left = newLeft + 'px';
      
    } else if (topResizing) {
      const deltaY = e.clientY - startTopY;
      let newHeight = Math.max(350, startTopHeight - deltaY);
      
      // Constrain height to screen
      const maxHeight = window.innerHeight - startTopTop - 20;
      if (newHeight > maxHeight) {
        newHeight = maxHeight;
      }
      
      // Check if new height would push window above screen
      const currentTop = startTop;
      const newTop = currentTop + startTopHeight - newHeight;
      
      if (newTop >= 10) {
        chatbox.style.height = newHeight + 'px';
        chatbox.style.top = newTop + 'px';
      }
    }
  });

  document.addEventListener('mouseup', function() {
    if (resizing) {
      resizing = false;
      document.body.style.userSelect = '';
      grip.style.background = '';
    } else if (topResizing) {
      topResizing = false;
      document.body.style.userSelect = '';
      topHandle.style.background = '';
    }
  });

  // Send message event listeners
  document.getElementById("send-msg").addEventListener("click", async () => {
    await handleUserInput(apiKey);
  });

  document.getElementById("ai-user-input").addEventListener("keydown", async (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      await handleUserInput(apiKey);
    }
  });
}

async function handleUserInput(apiKey) {
  const inputBox = document.getElementById("ai-user-input");
  const userText = inputBox.value.trim();
  if (!userText) return;

  // Check if user is asking for code
  if (isCodeRequest(userText)) {
    // Show language selection prompt
    showLanguageSelection(userText, apiKey);
    inputBox.value = "";
    return;
  }

  appendMessage("user", userText);
  inputBox.value = "";

  const problemText = getProblemText();
  appendMessage("ai", "Thinking...", true);
  const aiResponse = await fetchAIResponse(userText, problemText, apiKey);

  // Replace the last "Thinking..." message with the actual response
  const chatLog = document.getElementById("chat-log");
  const lastMsg = chatLog.querySelector('.chat-msg.ai:last-child .chat-bubble');
  if (lastMsg) {
    lastMsg.innerHTML = processCodeBlocks(aiResponse);
    addCopyFunctionality(lastMsg.closest('.chat-msg'));
    saveCurrentChatHistory();
  }
}

// Check if user is requesting code
function isCodeRequest(userText) {
  const codeKeywords = [
    'code', 'solution', 'implement', 'write', 'program', 'algorithm',
    'solve', 'function', 'method', 'class', 'script', 'coding',
    'implementation', 'source code', 'give me code', 'show code',
    'provide code', 'complete code', 'full solution'
  ];
  
  const textLower = userText.toLowerCase();
  return codeKeywords.some(keyword => textLower.includes(keyword));
}

// Show language selection interface
function showLanguageSelection(originalQuestion, apiKey) {
  const chatLog = document.getElementById("chat-log");
  
  // Add user's original message
  appendMessage("user", originalQuestion);
  
  // Create language selection message
  const selectionMsg = document.createElement("div");
  selectionMsg.className = "chat-msg ai language-selection";
  selectionMsg.innerHTML = `
    <div class="avatar">🤖</div>
    <div class="chat-bubble language-selection-bubble">
      <p><strong>Which programming language would you prefer for the solution?</strong></p>
      <div class="language-buttons">
        <button class="lang-btn" data-lang="cpp" data-question="${escapeHTML(originalQuestion)}">
          <span class="lang-icon">⚡</span>
          <span class="lang-name">C++</span>
          <span class="lang-desc">Fast & Efficient</span>
        </button>
        <button class="lang-btn" data-lang="python" data-question="${escapeHTML(originalQuestion)}">
          <span class="lang-icon">🐍</span>
          <span class="lang-name">Python</span>
          <span class="lang-desc">Clean & Simple</span>
        </button>
        <button class="lang-btn" data-lang="java" data-question="${escapeHTML(originalQuestion)}">
          <span class="lang-icon">☕</span>
          <span class="lang-name">Java</span>
          <span class="lang-desc">Robust & Popular</span>
        </button>
        <button class="lang-btn" data-lang="javascript" data-question="${escapeHTML(originalQuestion)}">
          <span class="lang-icon">🌐</span>
          <span class="lang-name">JavaScript</span>
          <span class="lang-desc">Web & Versatile</span>
        </button>
      </div>
      <p class="selection-note">Click on your preferred language to get the solution.</p>
    </div>
  `;
  
  chatLog.appendChild(selectionMsg);
  chatLog.scrollTop = chatLog.scrollHeight;
  
  // Add event listeners to language buttons
  const langButtons = selectionMsg.querySelectorAll('.lang-btn');
  langButtons.forEach(button => {
    button.addEventListener('click', async () => {
      const selectedLang = button.getAttribute('data-lang');
      const question = button.getAttribute('data-question');
      
      // Remove the selection interface
      selectionMsg.remove();
      
      // Add user's language choice message
      appendMessage("user", `Please provide the solution in ${getLanguageDisplayName(selectedLang)}.`);
      
      // Get AI response with specified language
      appendMessage("ai", "Thinking...", true);
      const problemText = getProblemText();
      const aiResponse = await fetchAIResponseWithLanguage(question, problemText, selectedLang, apiKey);
      
      const lastMsg = chatLog.querySelector('.chat-msg.ai:last-child .chat-bubble');
      if (lastMsg) {
        lastMsg.innerHTML = processCodeBlocks(aiResponse);
        addCopyFunctionality(lastMsg.closest('.chat-msg'));
        saveCurrentChatHistory();
      }
    });
  });
}

// Get display name for language
function getLanguageDisplayName(lang) {
  const displayNames = {
    'cpp': 'C++',
    'python': 'Python',
    'java': 'Java',
    'javascript': 'JavaScript'
  };
  return displayNames[lang] || lang;
}

// Modified AI fetch function with language specification
async function fetchAIResponseWithLanguage(userText, context, language, apiKey) {
  const languageInstructions = {
    'cpp': 'Provide the solution in C++ with proper includes, using namespace std, and a complete main function.',
    'python': 'Provide the solution in Python with proper imports and a main execution block.',
    'java': 'Provide the solution in Java with a complete class structure and main method.',
    'javascript': 'Provide the solution in JavaScript with proper function declarations.'
  };

  const prompt = `You are an AI assistant specialized in helping with competitive programming problems. You must ONLY answer questions related to the given problem context.

PROBLEM CONTEXT:
${context}

LANGUAGE REQUIREMENT: ${languageInstructions[language] || `Provide the solution in ${language}.`}

CRITICAL FORMATTING RULES:
1. NEVER use HTML tags like <br>, <div>, etc. in your response
2. Use plain text with proper line breaks (newlines)
3. ALWAYS wrap code in triple backticks with the specified language:
   \`\`\`${language}
   // Your complete solution here
   \`\`\`

4. Provide COMPLETE, RUNNABLE code that can be copied and executed immediately
5. Include all necessary imports/includes
6. Add proper main function/execution block
7. Include comments explaining the approach
8. Provide time and space complexity analysis
9. Format code with proper indentation using spaces, not HTML

EXAMPLE FORMAT:
Here's the solution in ${getLanguageDisplayName(language)}:

\`\`\`${language}
// Complete working code here
\`\`

**Time Complexity:** O(n)
**Space Complexity:** O(1)

**Explanation:**
- Step 1: ...
- Step 2: ...

USER QUESTION: ${userText}

Provide a complete solution in ${getLanguageDisplayName(language)} with clean formatting (NO HTML TAGS).

RESPONSE:`;

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
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2000,
            topP: 0.8,
            topK: 40
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok || data.error) {
      return `Gemini Error: ${data.error?.message || "Unknown error."}`;
    }

    let aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response from Gemini.";
    
    // Additional cleaning to remove any HTML that might have been generated
    aiResponse = aiResponse
      .replace(/<br\s*\/?>/g, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

    return aiResponse;
  } catch (err) {
    console.error("❌ Gemini fetch error:", err);
    return "Failed to fetch Gemini response.";
  }
}

async function handleUserInput(apiKey) {
  const inputBox = document.getElementById("ai-user-input");
  const userText = inputBox.value.trim();
  if (!userText) return;

  // Check if user is asking for code
  if (isCodeRequest(userText)) {
    // Show language selection prompt
    showLanguageSelection(userText, apiKey);
    inputBox.value = "";
    return;
  }

  appendMessage("user", userText);
  inputBox.value = "";

  const problemText = getProblemText();
  appendMessage("ai", "Thinking...", true);
  const aiResponse = await fetchAIResponse(userText, problemText, apiKey);

  // Replace the last "Thinking..." message with the actual response
  const chatLog = document.getElementById("chat-log");
  const lastMsg = chatLog.querySelector('.chat-msg.ai:last-child .chat-bubble');
  if (lastMsg) {
    lastMsg.innerHTML = processCodeBlocks(aiResponse);
    addCopyFunctionality(lastMsg.closest('.chat-msg'));
    saveCurrentChatHistory();
  }
}

// Get a unique key for the current problem (using URL)
function getProblemKey() {
  return "chat_history_" + window.location.pathname;
}

// Save chat history for the current problem
function saveChatHistory(history) {
  const key = getProblemKey();
  chrome.storage.local.set({ [key]: history });
}

// Load chat history for the current problem
function loadChatHistory(callback) {
  const key = getProblemKey();
  chrome.storage.local.get([key], (result) => {
    callback(result[key] || []);
  });
}

// Save current chat history from DOM
function saveCurrentChatHistory() {
  const chatLog = document.getElementById("chat-log");
  if (!chatLog) return;
  
  const allMsgs = [];
  chatLog.querySelectorAll('.chat-msg').forEach(div => {
    const who = div.classList.contains('user') ? 'user' : 'ai';
    const text = div.querySelector('.chat-bubble').textContent;
    if (text !== "Thinking...") { // Don't save "Thinking..." messages
      allMsgs.push({ sender: who, message: text });
    }
  });
  saveChatHistory(allMsgs);
}

// Modified appendMessage to handle code blocks with copy functionality
function appendMessage(sender, message, skipSave = false) {
  const chatLog = document.getElementById("chat-log");
  const msg = document.createElement("div");
  msg.className = `chat-msg ${sender}`;
  
  let avatar, bubble;
  if (sender === "user") {
    avatar = `<div class="avatar">U</div>`;
    bubble = `<div class="chat-bubble">${escapeHTML(message)}</div>`;
    msg.innerHTML = `${bubble}${avatar}`;
  } else {
    avatar = `<div class="avatar">🤖</div>`;
    // Process AI message for code blocks
    const processedMessage = processCodeBlocks(message);
    bubble = `<div class="chat-bubble">${processedMessage}</div>`;
    msg.innerHTML = `${avatar}${bubble}`;
  }
  
  chatLog.appendChild(msg);
  chatLog.scrollTop = chatLog.scrollHeight;

  // Add copy functionality to code blocks
  if (sender === "ai") {
    addCopyFunctionality(msg);
  }

  // Save chat history unless restoring or it's a temporary message
  if (!skipSave && message !== "Thinking...") {
    saveCurrentChatHistory();
  }
}

// Process AI messages to detect and format code blocks
function processCodeBlocks(message) {
  let processedMessage = message;
  
  // First, detect and replace code blocks (```language...code...```)
  const codeBlockRegex = /```(\w+)?\s*\n?([\s\S]*?)```/g;
  let codeBlockMatches = [];
  
  processedMessage = processedMessage.replace(codeBlockRegex, (match, language, code) => {
    const lang = language || 'text';
    const codeId = 'code_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const placeholder = `__CODE_BLOCK_${codeBlockMatches.length}__`;
    
    // Clean and format the code for proper execution
    const cleanCode = formatCodeForExecution(code.trim(), lang);
    
    codeBlockMatches.push(`
      <div class="code-container">
        <div class="code-header">
          <span class="code-language">${lang.toUpperCase()}</span>
          <div class="code-actions">
            <button class="copy-code-btn" data-code-id="${codeId}" title="Copy to Clipboard">📋 Copy</button>
            <button class="copy-formatted-btn" data-code-id="${codeId}" title="Copy Ready-to-Run Code">🚀 Copy & Run</button>
          </div>
        </div>
        <pre class="code-block" id="${codeId}" data-original-code="${escapeHTML(code.trim())}" data-formatted-code="${escapeHTML(cleanCode)}"><code class="language-${lang}">${escapeHTML(cleanCode)}</code></pre>
      </div>
    `);
    
    return placeholder;
  });
  
  // Handle code without backticks (same logic as before)
  if (!codeBlockRegex.test(message)) {
    const codePatterns = [
      /(\w+\s*\([^)]*\)\s*{[\s\S]*?})/g,
      /(#include\s*<[^>]+>[\s\S]*)/g,
      /(import\s+\w+[\s\S]*)/g,
      /(class\s+\w+[\s\S]*?{[\s\S]*?})/g,
      /(for\s*\([^)]*\)\s*{[\s\S]*?})/g,
      /(if\s*\([^)]*\)\s*{[\s\S]*?})/g,
      /(while\s*\([^)]*\)\s*{[\s\S]*?})/g,
    ];
    
    codePatterns.forEach(pattern => {
      processedMessage = processedMessage.replace(pattern, (match) => {
        if (match.includes('{') && match.includes('}') || 
            match.includes('int ') || match.includes('def ') ||
            match.includes('#include') || match.includes('import ')) {
          
          const codeId = 'code_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
          const placeholder = `__CODE_BLOCK_${codeBlockMatches.length}__`;
          
          let language = detectLanguage(match);
          const cleanCode = formatCodeForExecution(match.trim(), language);
          
          codeBlockMatches.push(`
            <div class="code-container">
              <div class="code-header">
                <span class="code-language">${language.toUpperCase()}</span>
                <div class="code-actions">
                  <button class="copy-code-btn" data-code-id="${codeId}" title="Copy to Clipboard">📋 Copy</button>
                  <button class="copy-formatted-btn" data-code-id="${codeId}" title="Copy Ready-to-Run Code">🚀 Copy & Run</button>
                </div>
              </div>
              <pre class="code-block" id="${codeId}" data-original-code="${escapeHTML(match.trim())}" data-formatted-code="${escapeHTML(cleanCode)}"><code class="language-${language}">${escapeHTML(cleanCode)}</code></pre>
            </div>
          `);
          
          return placeholder;
        }
        return match;
      });
    });
  }
  
  // Rest of the function remains the same...
  processedMessage = escapeHTML(processedMessage);
  codeBlockMatches.forEach((codeBlock, index) => {
    processedMessage = processedMessage.replace(`__CODE_BLOCK_${index}__`, codeBlock);
  });
  
  const inlineCodeRegex = /`([^`\n]+)`/g;
  processedMessage = processedMessage.replace(inlineCodeRegex, '<code class="inline-code">$1</code>');
  processedMessage = processedMessage.replace(/\n/g, '<br>');
  
  return processedMessage;
}

// Format code to be runnable
function formatCodeForExecution(code, language) {
  let formattedCode = code;
  
  switch(language.toLowerCase()) {
    case 'cpp':
    case 'c++':
      // Ensure proper includes and main function
      if (!formattedCode.includes('#include')) {
        formattedCode = `#include <iostream>\n#include <vector>\n#include <algorithm>\nusing namespace std;\n\n${formattedCode}`;
      }
      if (!formattedCode.includes('int main')) {
        formattedCode = `${formattedCode}\n\nint main() {\n    // Call your function here\n    return 0;\n}`;
      }
      break;
      
    case 'python':
      // Ensure proper imports if needed
      if (formattedCode.includes('List') && !formattedCode.includes('from typing import')) {
        formattedCode = `from typing import List\n\n${formattedCode}`;
      }
      // Add main execution block if it's a function
      if (formattedCode.includes('def ') && !formattedCode.includes('if __name__')) {
        formattedCode = `${formattedCode}\n\nif __name__ == "__main__":\n    # Call your function here\n    pass`;
      }
      break;
      
    case 'java':
      // Ensure proper class structure
      if (!formattedCode.includes('class ') && !formattedCode.includes('public class')) {
        formattedCode = `public class Solution {\n${formattedCode}\n\n    public static void main(String[] args) {\n        // Call your function here\n    }\n}`;
      }
      break;
  }
  
  return formattedCode;
}

// Detect programming language
function detectLanguage(code) {
  if (code.includes('#include') || code.includes('cout') || code.includes('int main')) return 'cpp';
  if (code.includes('def ') || code.includes('import ') || code.includes('print(')) return 'python';
  if (code.includes('public class') || code.includes('System.out') || code.includes('public static')) return 'java';
  if (code.includes('function') || code.includes('const ') || code.includes('let ')) return 'javascript';
  return 'text';
}

// Enhanced copy functionality
function addCopyFunctionality(messageElement) {
  const copyButtons = messageElement.querySelectorAll('.copy-code-btn');
  const copyFormattedButtons = messageElement.querySelectorAll('.copy-formatted-btn');
  
  // Regular copy button
  copyButtons.forEach(button => {
    button.addEventListener('click', async (e) => {
      e.stopPropagation();
      const codeId = button.getAttribute('data-code-id');
      const codeBlock = document.getElementById(codeId);
      
      if (codeBlock) {
        const originalCode = codeBlock.getAttribute('data-original-code');
        await copyToClipboard(originalCode || codeBlock.textContent, button, '📋 Copy');
      }
    });
  });
  
  // Copy formatted (runnable) button
  copyFormattedButtons.forEach(button => {
    button.addEventListener('click', async (e) => {
      e.stopPropagation();
      const codeId = button.getAttribute('data-code-id');
      const codeBlock = document.getElementById(codeId);
      
      if (codeBlock) {
        const formattedCode = codeBlock.getAttribute('data-formatted-code');
        await copyToClipboard(formattedCode || codeBlock.textContent, button, '🚀 Copy & Run');
      }
    });
  });
}

// Helper function to copy to clipboard with feedback
async function copyToClipboard(text, button, originalText) {
  try {
    // Comprehensive cleaning of the text
    let cleanText = text;
    
    // Remove HTML tags and entities
    cleanText = cleanText
      .replace(/<br\s*\/?>/g, '\n')           // Replace <br> with newlines
      .replace(/<[^>]*>/g, '')                // Remove all HTML tags
      .replace(/&lt;/g, '<')                  // Convert HTML entities
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .trim();                                // Remove leading/trailing whitespace
    
    await navigator.clipboard.writeText(cleanText);
    button.textContent = '✅ Copied!';
    button.style.background = '#10b981';
    button.style.color = 'white';
    setTimeout(() => {
      button.textContent = originalText;
      button.style.background = '';
      button.style.color = '';
    }, 2000);
  } catch (err) {
    // Fallback for older browsers
    let cleanText = text
      .replace(/<br\s*\/?>/g, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .trim();
    
    const textArea = document.createElement('textarea');
    textArea.value = cleanText;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    
    button.textContent = '✅ Copied!';
    button.style.background = '#10b981';
    setTimeout(() => {
      button.textContent = originalText;
      button.style.background = '';
    }, 2000);
  }
}

// Restore chat history when chatbox opens
function restoreChatHistory() {
  loadChatHistory((history) => {
    if (history.length) {
      history.forEach(msg => appendMessage(msg.sender, msg.message, true));
    }
  });
}

function escapeHTML(str) {
  return str.replace(/[&<>"']/g, function (m) {
    return ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[m];
  });
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
  const prompt = `You are an AI assistant specialized in helping with competitive programming problems. You must ONLY answer questions related to the given problem context.

PROBLEM CONTEXT:
${context}

CRITICAL CODE FORMATTING RULES:
1. ALWAYS provide COMPLETE, RUNNABLE code solutions
2. For C++, include all necessary headers and main function:
   \`\`\`cpp
   #include <iostream>
   #include <vector>
   #include <algorithm>
   using namespace std;
   
   // Your solution function here
   
   int main() {
       // Test your solution here
       return 0;
   }
   \`\`\`

3. For Python, provide complete functions with proper imports:
   \`\`\`python
   def solution():
       # Your code here
       pass
   
   if __name__ == "__main__":
       # Test your solution here
       pass
   \`\`\`

4. For Java, provide complete class structure:
   \`\`\`java
   public class Solution {
       public static void main(String[] args) {
           // Your solution here
       }
   }
   \`\`\`

5. Make sure all code can be copied and run immediately
6. Include proper variable declarations and return statements
7. Add sample test cases in main/test sections

RESPONSE RULES:
- ONLY answer questions about the above problem
- Always provide COMPLETE, EXECUTABLE code
- Include complexity analysis
- Add comments explaining the approach
- If any question is off-topic, respond with:
"I can only help with the current problem. Please ask questions related to this specific coding problem."

USER QUESTION: ${userText}

RESPONSE:`;

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
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2000, // Increased for longer solutions
            topP: 0.8,
            topK: 40
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok || data.error) {
      return `Gemini Error: ${data.error?.message || "Unknown error."}`;
    }

    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response from Gemini.";
    
    // Additional client-side check for context relevance
    if (isOffTopicResponse(userText, aiResponse)) {
      return "I can only help with the current problem. Please ask questions related to this specific coding problem.";
    }

    return aiResponse;
  } catch (err) {
    console.error("❌ Gemini fetch error:", err);
    return "Failed to fetch Gemini response.";
  }
}

// Enhanced helper function to detect solution requests
function isOffTopicResponse(userQuestion, aiResponse) {
  const offTopicKeywords = ['weather', 'food', 'movie', 'music', 'sports', 'politics', 'news', 'personal'];
  const problemKeywords = ['algorithm', 'code', 'solution', 'problem', 'complexity', 'array', 'string', 'tree', 'graph', 'dynamic', 'programming', 'solve', 'implement', 'write', 'function'];
  const solutionKeywords = ['solution', 'code', 'implement', 'solve', 'answer', 'complete', 'full'];
  
  const questionLower = userQuestion.toLowerCase();
  const hasOffTopicKeywords = offTopicKeywords.some(keyword => questionLower.includes(keyword));
  const hasProblemKeywords = problemKeywords.some(keyword => questionLower.includes(keyword));
  const hasSolutionKeywords = solutionKeywords.some(keyword => questionLower.includes(keyword));
  
  // If question has solution keywords or problem keywords, it's likely on-topic
  if (hasSolutionKeywords || hasProblemKeywords) {
    return false;
  }
  
  // If question has off-topic keywords and no problem keywords, it's likely off-topic
  return hasOffTopicKeywords && !hasProblemKeywords;
}

// Clear chat history for current problem
function clearCurrentProblemHistory() {
  const key = getProblemKey();
  chrome.storage.local.remove([key], () => {
    if (chrome.runtime.lastError) {
      console.error("❌ Failed to clear chat history:", chrome.runtime.lastError);
    } else {
      console.log("✅ Chat history cleared for:", key);
    }
  });
}

// Export chat history function
function exportChatHistory() {
  //close the chatbox if open
  const chatbox = document.getElementById("ai-chatbox");
  if (chatbox) {
    chatbox.style.display = "none";
  }
  // Get chat log and messages
  const chatLog = document.getElementById("chat-log");
  if (!chatLog) return;

  const messages = [];
  const problemTitle = getProblemTitle();
  const currentTime = new Date().toLocaleString();
  
  // Extract all messages from the chat log
  chatLog.querySelectorAll('.chat-msg').forEach(msgDiv => {
    const isUser = msgDiv.classList.contains('user');
    const bubble = msgDiv.querySelector('.chat-bubble');
    
    if (bubble && bubble.textContent.trim() !== "Thinking...") {
      let messageText = '';
      
      if (isUser) {
        messageText = bubble.textContent.trim();
      } else {
        // For AI messages, extract text and preserve code blocks
        messageText = extractMessageContent(bubble);
      }
      
      messages.push({
        sender: isUser ? 'User' : 'AI Assistant',
        message: messageText,
        timestamp: new Date().toISOString()
      });
    }
  });

  if (messages.length === 0) {
    alert("No chat history to export!");
    return;
  }

  // Show export options
  showExportOptions(messages, problemTitle, currentTime);
}

// Extract message content preserving code blocks
function extractMessageContent(bubble) {
  let content = '';
  
  bubble.childNodes.forEach(node => {
    if (node.nodeType === Node.TEXT_NODE) {
      content += node.textContent;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      if (node.classList.contains('code-container')) {
        // Extract code block
        const langSpan = node.querySelector('.code-language');
        const codeBlock = node.querySelector('.code-block code');
        const lang = langSpan ? langSpan.textContent.toLowerCase() : 'text';
        const code = codeBlock ? codeBlock.textContent : '';
        content += `\n\`\`\`${lang}\n${code}\n\`\`\`\n`;
      } else if (node.classList.contains('inline-code')) {
        content += `\`${node.textContent}\``;
      } else if (node.tagName === 'BR') {
        content += '\n';
      } else {
        content += node.textContent;
      }
    }
  });
  
  return content.trim();
}

// Get problem title from page
function getProblemTitle() {
  const titleElement = document.querySelector('h1') || 
                      document.querySelector('.problem-title') || 
                      document.querySelector('title');
  return titleElement ? titleElement.textContent.trim() : 'Coding Problem';
}

// Show export format options
function showExportOptions(messages, problemTitle, currentTime) {
  const overlay = document.createElement('div');
  overlay.className = 'export-overlay';
  overlay.innerHTML = `
    <div class="export-modal">
      <div class="export-header">
        <h3>Export Chat History</h3>
        <button class="close-export-btn">×</button>
      </div>
      <div class="export-content">
        <p><strong>Problem:</strong> ${escapeHTML(problemTitle)}</p>
        <p><strong>Messages:</strong> ${messages.length}</p>
        <p><strong>Export Time:</strong> ${currentTime}</p>
        
        <div class="export-formats">
          <button class="export-format-btn" data-format="txt">
            <span class="format-icon">📄</span>
            <span class="format-name">Text File (.txt)</span>
            <span class="format-desc">Simple text format</span>
          </button>
          <button class="export-format-btn" data-format="md">
            <span class="format-icon">📝</span>
            <span class="format-name">Markdown (.md)</span>
            <span class="format-desc">Formatted with code blocks</span>
          </button>
          <button class="export-format-btn" data-format="json">
            <span class="format-icon">🔧</span>
            <span class="format-name">JSON (.json)</span>
            <span class="format-desc">Structured data format</span>
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Add event listeners
  overlay.querySelector('.close-export-btn').addEventListener('click', () => {
    overlay.remove();
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.remove();
    }
  });

  overlay.querySelectorAll('.export-format-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const format = btn.getAttribute('data-format');
      downloadChatHistory(messages, problemTitle, currentTime, format);
      overlay.remove();
    });
  });
}

// Download chat history in specified format
function downloadChatHistory(messages, problemTitle, currentTime, format) {
  let content = '';
  let filename = '';
  let mimeType = '';

  switch (format) {
    case 'txt':
      content = formatAsText(messages, problemTitle, currentTime);
      filename = `chat-${sanitizeFilename(problemTitle)}-${Date.now()}.txt`;
      mimeType = 'text/plain';
      break;
    
    case 'md':
      content = formatAsMarkdown(messages, problemTitle, currentTime);
      filename = `chat-${sanitizeFilename(problemTitle)}-${Date.now()}.md`;
      mimeType = 'text/markdown';
      break;
    
    case 'json':
      content = formatAsJSON(messages, problemTitle, currentTime);
      filename = `chat-${sanitizeFilename(problemTitle)}-${Date.now()}.json`;
      mimeType = 'application/json';
      break;
  }

  // Create and trigger download
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  // Show success message
  showExportSuccess(filename);

  // After export, close the chat window if it exists
  const chatbox = document.getElementById("ai-chatbox");
  if (chatbox) {
    chatbox.remove();
    chatboxRef = null;
  }
}

// Format as plain text
function formatAsText(messages, problemTitle, currentTime) {
  let content = `CHAT HISTORY - ${problemTitle}\n`;
  content += `Exported: ${currentTime}\n`;
  content += `Total Messages: ${messages.length}\n`;
  content += '='.repeat(50) + '\n\n';

  messages.forEach((msg, index) => {
    content += `[${index + 1}] ${msg.sender}:\n`;
    content += `${msg.message}\n\n`;
    content += '-'.repeat(30) + '\n\n';
  });

  return content;
}

// Format as Markdown
function formatAsMarkdown(messages, problemTitle, currentTime) {
  let content = `# Chat History - ${problemTitle}\n\n`;
  content += `**Exported:** ${currentTime}  \n`;
  content += `**Total Messages:** ${messages.length}\n\n`;
  content += '---\n\n';

  messages.forEach((msg, index) => {
    content += `## ${msg.sender}\n\n`;
    content += `${msg.message}\n\n`;
  });

  return content;
}

// Format as JSON
function formatAsJSON(messages, problemTitle, currentTime) {
  const data = {
    problemTitle,
    exportTime: currentTime,
    totalMessages: messages.length,
    messages: messages
  };
  
  return JSON.stringify(data, null, 2);
}

// Sanitize filename
function sanitizeFilename(filename) {
  return filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

// Show export success message
function showExportSuccess(filename) {
  const successMsg = document.createElement('div');
  successMsg.className = 'export-success';
  successMsg.innerHTML = `
    <div class="success-content">
      <span class="success-icon">✅</span>
      <span class="success-text">Chat exported as ${filename}</span>
    </div>
  `;

  document.body.appendChild(successMsg);

  setTimeout(() => {
    successMsg.style.opacity = '0';
    setTimeout(() => {
      successMsg.remove();
    }, 300);
  }, 3000);
}