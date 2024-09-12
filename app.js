const typingform = document.querySelector(".typing-form");
const chatList = document.querySelector(".chat-list");
const suggestions = document.querySelectorAll(".suggestion-list .suggestion");
const toggleThemeButton = document.querySelector("#toggle-theme-button");
const deleteChatButton = document.querySelector("#delete-chat");

let userMessage = null;
let isResponseGenerating = false;
const API_KEY = "AIzaSyB_-rgErmPZqckBY6Gcxp3GYoebtbd27S8";
const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}`;

const loadLoacalstorageData = () => {
  const isLightMode = localStorage.getItem("themeColor") === "light_mode";
  const savedChats = localStorage.getItem("savedChats");

  document.body.classList.toggle("light_mode", isLightMode);
  toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";

  chatList.innerHTML = savedChats || "";
  document.body.classList.toggle("hide-header", savedChats)
  chatList.scrollTop = chatList.scrollHeight; // Ensure scroll is at the bottom
};

loadLoacalstorageData();

const createMessageElement = (content, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
};

// Format the text: remove single stars and move bold text (**text**) to a new paragraph
const formatText = (text) => {
  const formattedText = text
      .replace(/\*/g, "") // Remove all stars (single or double)
      .replace(/\*\*(.*?)\*\*/g, "<p><b>$1</b></p>") // Bold text starts from a new paragraph
      .replace(/\.\s*(.*?)(?=\.)/g, "<p>$1.</p>") // Start a new paragraph after each sentence
      .replace(/(?<=\.\s)\s*(.*?)(?=\s*$)/g, "<p>$1</p>"); // Wrap remaining text in paragraphs

  return formattedText;
};







const showTypingEffect = (text, textElement, incomingMessageDiv) => {
  const words = text.split(" ");
  let currentWordIndex = 0;

  const typingInterval = setInterval(() => {
    textElement.innerHTML += (currentWordIndex === 0 ? " " : " ") + words[currentWordIndex++];
    incomingMessageDiv.querySelector(".icon").classList.add("hide");

    if (currentWordIndex === words.length) {
      clearInterval(typingInterval);
      isResponseGenerating = false;
      incomingMessageDiv.querySelector(".icon").classList.remove("hide");
      localStorage.setItem("savedChats", chatList.innerHTML);
      incomingMessageDiv.scrollIntoView({ behavior: "smooth" }); // Ensure it scrolls into view
    }
  }, 75);
};

const generateAPIResponse = async (incomingMessageDiv) => {
  const textElement = incomingMessageDiv.querySelector(".text");
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [{ text: userMessage }]
        }]
      })
    });

    const data = await response.json();
if(!response.ok) throw new Error(data.error.message);

    const apiResponse = data?.candidates[0].content.parts[0].text;
    const formattedResponse = formatText(apiResponse); // Format text here
    showTypingEffect(formattedResponse, textElement, incomingMessageDiv);
  } catch (error) {
    isResponseGenerating = false;
    textElement.innerHTML = error.message;
    textElement.classList.add("error")
  } finally {
    incomingMessageDiv.classList.remove("loading");
  }
};

const showLoadingAnimation = () => {
  const html = `       
    <div class="message-content">
      <img src="images/gemini.svg" alt="Gemini Image" class="avatar">
      <p class="text"></p>
      <div class="loading-indicator">
        <div class="loading-bar"></div>
        <div class="loading-bar"></div>
        <div class="loading-bar"></div>
      </div>
    </div>
    <span onClick="copyMessage(this)" class="icon material-symbols-rounded">content_copy</span>
  `;

  const incomingMessageDiv = createMessageElement(html, "incoming", "loading");
  chatList.appendChild(incomingMessageDiv);
  incomingMessageDiv.scrollIntoView({ behavior: "smooth" }); // Scroll to the newly added message
  generateAPIResponse(incomingMessageDiv);
};

const copyMessage = (copyIcon) => {
  const messageText = copyIcon.parentElement.querySelector(".text").innerText;
  navigator.clipboard.writeText(messageText);
  copyIcon.innerText = "done";
  setTimeout(() => copyIcon.innerText = "content_copy", 1000);
};

const handleOutgoingChat = (e) => {
  e.preventDefault(); // Prevent form from reloading the page
  userMessage = typingform.querySelector(".typing-input").value.trim() || userMessage;
  if (!userMessage || isResponseGenerating) return;
  isResponseGenerating = true;
  const html = ` 
    <div class="message-content">
      <img src="images/user.jpg" alt="User Image" class="avatar">
      <p class="text"></p>
    </div>`;

  const outgoingMessageDiv = createMessageElement(html, "outgoing");
  outgoingMessageDiv.querySelector(".text").innerHTML = userMessage;
  chatList.appendChild(outgoingMessageDiv);

  typingform.reset();
  outgoingMessageDiv.scrollIntoView({ behavior: "smooth" }); // Ensure smooth scroll after outgoing message
  document.body.classList.add("hide-header")
  setTimeout(showLoadingAnimation, 500);
};

suggestions.forEach(suggestion => {
  suggestion.addEventListener("click", () => {
    userMessage = suggestion.querySelector(".text").innerText;
    handleOutgoingChat(event);
  });
});

toggleThemeButton.addEventListener("click", () => {
  const isLightMode = document.body.classList.toggle("light_mode");
  localStorage.setItem("themeColor", isLightMode ? "light_mode" : "dark_mode");
  toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";
});

deleteChatButton.addEventListener("click", () => {
  if(confirm("Are you sure you want to delete all messages?")){
    localStorage.removeItem("savedChats")
    loadLoacalstorageData();
  }
})

// Adding event listener to form submission
typingform.addEventListener("submit", (e) => {
  handleOutgoingChat(e);
});
