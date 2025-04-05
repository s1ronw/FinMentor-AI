

document.addEventListener("DOMContentLoaded", () => {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js';

  // DOM Elements
  const chatMessages = document.getElementById("chatMessages");
  const userInput = document.getElementById("userInput");
  const sendButton = document.getElementById("sendButton");
  const chatHistory = document.getElementById("chatHistory");
  const newChatButton = document.getElementById("newChatButton");
  const clearHistoryButton = document.getElementById("clearHistoryButton");
  const uploadButton = document.getElementById("uploadButton");
  const fileInput = document.getElementById("fileInput");

  // State
  let currentChatId = null;
  let chats = loadChatsFromStorage();
  let isTyping = false;
  let currentStatementText = '';

  // G4F API endpoint (adjust this based on your setup)
  const G4F_API_ENDPOINT = 'http://localhost:8080/v1/chat/completions';

  // Initialize the chat
  initializeChat();

  // Event Listeners
  sendButton.addEventListener("click", handleUserInput);
  userInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleUserInput();
  });
  newChatButton.addEventListener("click", createNewChat);
  clearHistoryButton.addEventListener("click", clearAllChats);
  uploadButton.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", handleFileUpload);

  function initializeChat() {
    renderChatHistory();
    if (chats.length === 0) {
      createNewChat();
    } else {
      loadChat(chats[0].id);
    }
  }

  function createNewChat() {
    const newChatId = Date.now().toString();
    const newChat = {
      id: newChatId,
      title: "New Conversation",
      date: new Date().toLocaleDateString(),
      messages: [
        {
          content: "Hello! I'm FinMentor, your AI financial assistant. How can I help you today?",
          isUser: false
        }
      ],
    };
    chats.unshift(newChat);
    saveChatsToStorage();
    renderChatHistory();
    loadChat(newChatId);
    currentStatementText = '';
  }

  function loadChat(chatId) {
    currentChatId = chatId;
    const chat = chats.find((c) => c.id === chatId);
    const historyItems = document.querySelectorAll(".chat-history-item");
    historyItems.forEach((item) => {
      item.classList.toggle("active", item.dataset.id === chatId);
    });
    chatMessages.innerHTML = "";
    if (chat && chat.messages.length > 0) {
      chat.messages.forEach((msg) => addMessage(msg.content, msg.isUser, false));
    }
  }

  async function handleUserInput() {
    const userMessage = userInput.value.trim();
    if (!userMessage || isTyping) return;

    addMessage(userMessage, true);
    userInput.value = "";

    const currentChat = chats.find((c) => c.id === currentChatId);
    if (currentChat && currentChat.title === "New Conversation") {
      currentChat.title = userMessage.split(" ").slice(0, 3).join(" ") + "...";
      saveChatsToStorage();
      renderChatHistory();
    }

    const typingElement = simulateTyping();
    try {
      const aiResponse = await generateAIResponseWithRetry(userMessage);
      typingElement.remove();
      addMessage(aiResponse, false);
    } catch (error) {
      console.error('Error:', error);
      typingElement.remove();
      addMessage("Sorry, I encountered an error. Please try again.", false);
    } finally {
      isTyping = false;
    }
  }

  async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const fileType = file.type;
    if (!['application/pdf', 'image/jpeg', 'image/jpg'].includes(fileType)) {
      addMessage("Unsupported file type. Please upload PDF, JPEG, or JPG files.", false);
      return;
    }

    addMessage("Analyzing your bank statement...", false);

    try {
      let extractedText;
      if (fileType === 'application/pdf') {
        extractedText = await extractTextFromPDF(file);
      } else {
        extractedText = await extractTextFromImage(file);
      }
      currentStatementText = extractedText;
      addMessage("Bank statement analyzed. You can now ask questions about it.", false);
    } catch (error) {
      console.error("Error analyzing file:", error);
      addMessage("There was an error analyzing your bank statement. Please try again.", false);
    }
    fileInput.value = "";
  }

  async function extractTextFromPDF(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }
    return fullText;
  }

  async function extractTextFromImage(file) {
    const { data: { text } } = await Tesseract.recognize(file, 'eng');
    return text;
  }

  async function generateAIResponseWithRetry(userMessage, retryCount = 3, delay = 1000) {
    for (let attempt = 0; attempt < retryCount; attempt++) {
      try {
        return await generateAIResponse(userMessage);
      } catch (error) {
        if (attempt < retryCount - 1) {
          console.log(`Request failed, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // Exponential backoff
        } else {
          throw new Error('Failed to get response after multiple attempts.');
        }
      }
    }
  }

  async function generateAIResponse(userMessage) {
    const chat = chats.find((c) => c.id === currentChatId);
    if (!chat) throw new Error("Chat not found.");

    const messages = chat.messages.map((msg) => ({
      role: msg.isUser ? 'user' : 'assistant',
      content: msg.content,
    }));
    messages.push({ role: 'user', content: userMessage });

    if (currentStatementText) {
      messages.unshift({
        role: 'system',
        content: `The user has uploaded a bank statement with the following text: "${currentStatementText}". Use this information to answer their questions about their finances.`,
      });
    }

    const response = await fetch(G4F_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // You can change this to other available models
        messages: messages,
        max_tokens: 500,
        web_search: false
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  function addMessage(content, isUser, saveToHistory = true) {
    const messageElement = document.createElement("div");
    messageElement.classList.add("message", isUser ? "user-message" : "ai-message");
    messageElement.textContent = content;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    if (saveToHistory) {
      const chat = chats.find((c) => c.id === currentChatId);
      if (chat) {
        chat.messages.push({ content, isUser });
        saveChatsToStorage();
      }
    }
  }

  function simulateTyping() {
    isTyping = true;
    const typingElement = document.createElement("div");
    typingElement.classList.add("message", "ai-message", "typing-indicator");
    typingElement.innerHTML = `
      <span class="dot"></span>
      <span class="dot"></span>
      <span class="dot"></span>
    `;
    typingElement.style.cssText = `
      padding: 10px 20px;
      display: inline-block;
    `;
    const dots = typingElement.querySelectorAll(".dot");
    dots.forEach((dot, index) => {
      dot.style.cssText = `
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: white;
        margin: 0 3px;
        opacity: 0.6;
        animation: typingAnimation 1.4s infinite ease-in-out;
        animation-delay: ${index * 0.2}s;
      `;
    });
    chatMessages.appendChild(typingElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return typingElement;
  }

  function renderChatHistory() {
    chatHistory.innerHTML = "";
    chats.forEach((chat) => {
      const chatItem = document.createElement("div");
      chatItem.classList.add("chat-history-item");
      chatItem.dataset.id = chat.id;
      if (chat.id === currentChatId) chatItem.classList.add("active");
      chatItem.innerHTML = `
        <div class="chat-history-item-content">
          <div class="chat-history-item-title">${chat.title}</div>
          <div class="chat-history-item-date">${chat.date}</div>
        </div>
        <button class="chat-history-item-delete" data-id="${chat.id}">×</button>
      `;
      chatItem.addEventListener("click", (e) => {
        if (!e.target.classList.contains("chat-history-item-delete")) loadChat(chat.id);
      });
      chatHistory.appendChild(chatItem);
    });
    document.querySelectorAll(".chat-history-item-delete").forEach((button) => {
      button.addEventListener("click", (e) => {
        e.stopPropagation();
        deleteChat(e.target.dataset.id);
      });
    });
  }

  function deleteChat(chatId) {
    const index = chats.findIndex((chat) => chat.id === chatId);
    if (index !== -1) {
      chats.splice(index, 1);
      saveChatsToStorage();
      if (chatId === currentChatId) {
        if (chats.length > 0) loadChat(chats[0].id);
        else createNewChat();
      }
      renderChatHistory();
    }
  }

  function clearAllChats() {
    if (confirm("Are you sure you want to clear all chat history?")) {
      chats = [];
      saveChatsToStorage();
      createNewChat();
    }
  }

  function saveChatsToStorage() {
    localStorage.setItem("finmentorChats", JSON.stringify(chats));
  }

  function loadChatsFromStorage() {
    const savedChats = localStorage.getItem("finmentorChats");
    return savedChats ? JSON.parse(savedChats) : [];
  }
});