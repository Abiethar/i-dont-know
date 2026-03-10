// Simple fade-in transition on page load
document.addEventListener("DOMContentLoaded", () => {
  const wrapper = document.querySelector(".page-wrapper");
  if (wrapper) {
    requestAnimationFrame(() => {
      wrapper.classList.add("fade-enter-active");
    });
  }

  const page = wrapper?.dataset.page;
  if (!page) return;

  if (page === "page1") {
    initPage1();
  } else if (page === "page2") {
    initPage2();
  } else if (page === "page3") {
    initPage3();
  }

  initChatbot();
});

function smoothNavigate(targetPath) {
  const wrapper = document.querySelector(".page-wrapper");
  if (!wrapper) {
    window.location.href = targetPath;
    return;
  }

  wrapper.style.transition = "opacity 0.35s ease, transform 0.35s ease";
  wrapper.style.opacity = "1";
  wrapper.style.transform = "translateY(0)";

  requestAnimationFrame(() => {
    wrapper.style.opacity = "0";
    wrapper.style.transform = "translateY(15px)";
  });

  setTimeout(() => {
    window.location.href = targetPath;
  }, 330);
}

function initPage1() {
  const nextBtn = document.querySelector("[data-nav='page2']");
  if (nextBtn) {
    nextBtn.addEventListener("click", () => smoothNavigate("page2.html"));
  }
}

function initPage2() {
  const yesBtn = document.getElementById("yes-btn");
  const noBtn = document.getElementById("no-btn");
  const buttonsRow = document.getElementById("question-buttons");
  const extraMessage = document.getElementById("extra-message");
  const cryingWrapper = document.getElementById("crying-wrapper");
  const heroImg = document.querySelector(".snoopy-hero img");

  if (!yesBtn || !noBtn || !buttonsRow) return;

  yesBtn.addEventListener("click", () => {
    smoothNavigate("page3.html");
  });

  noBtn.addEventListener("click", () => {
    if (heroImg) heroImg.src = "snoopy-crying.gif";
    // First "No" click: replace second button and keep Yes
    buttonsRow.innerHTML = "";

    const yes2 = document.createElement("button");
    yes2.type = "button";
    yes2.className = "btn";
    yes2.textContent = "Yes";
    yes2.addEventListener("click", () => smoothNavigate("page3.html"));

    const sureBtn = document.createElement("button");
    sureBtn.type = "button";
    sureBtn.className = "btn btn-ghost";
    sureBtn.textContent = "Are u sure TT";

    sureBtn.addEventListener("click", () => {
      sureBtn.textContent = "မရဘူးကွာ Yes နှိပ်ရမယ်";
      

      if (cryingWrapper) {
        cryingWrapper.hidden = false;
      }
    });

    buttonsRow.appendChild(yes2);
    buttonsRow.appendChild(sureBtn);
  });
}

function initPage3() {
  // Currently nothing extra, but left here for future custom interactions.
}

function initChatbot() {
  const toggle = document.querySelector(".chatbot-toggle");
  const windowEl = document.querySelector(".chatbot-window");
  const messagesEl = document.getElementById("chatbot-messages");
  const form = document.querySelector(".chatbot-input-area");
  const input = document.getElementById("chatbot-input");

  if (!toggle || !windowEl || !messagesEl || !form || !input) return;

  // Initial welcome message
  if (!messagesEl.dataset.initialized) {
    addBotMessage(
      messagesEl,
      "Hi, I'm Snoopy AI 🐶. I can chat with you about these chapters or just keep you company."
    );
    messagesEl.dataset.initialized = "true";
  }

  toggle.addEventListener("click", () => {
    const isHidden = windowEl.hasAttribute("hidden");
    if (isHidden) {
      windowEl.removeAttribute("hidden");
      setTimeout(() => {
        input.focus();
      }, 50);
    } else {
      windowEl.setAttribute("hidden", "");
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    addUserMessage(messagesEl, text);
    input.value = "";

    const typingEl = addBotMessage(messagesEl, "Snoopy is thinking...");
    typingEl.classList.add("chatbot-message--typing");

    try {
      const reply = await sendMessageToAI(text);
      typingEl.remove();
      addBotMessage(messagesEl, reply);
    } catch (error) {
      typingEl.remove();
      addBotMessage(
        messagesEl,
        "Oops, something went wrong. Please try again in a moment."
      );
    }
  });
}

function addUserMessage(container, text) {
  const bubble = document.createElement("div");
  bubble.className = "chatbot-message chatbot-message--user";
  bubble.textContent = text;
  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight;
}

function addBotMessage(container, text) {
  const bubble = document.createElement("div");
  bubble.className = "chatbot-message chatbot-message--bot";
  bubble.textContent = text;
  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight;
  return bubble;
}

const GEMINI_API_KEY = "AIzaSyACyU_Bhmqb11WnGf_Kwuhnp0r-74rgis8";
const GEMINI_MODEL = "gemini-3-flash-preview";

async function sendMessageToAI(userText) {
  // If no API key is set, fall back to the original friendly local replies
  if (!GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_GEMINI_API_KEY_HERE") {
    const friendlyReplies = [
      "That’s so sweet. Tell me more about how you feel right now.",
      "If this were a chapter in our story, what would you call it?",
      "Snoopy is hugging you through the screen right now.",
      "That sounds really special. What makes it memorable for you?",
      "I’m listening. You can type as long or as short as you like."
    ];

    const index = Math.floor(Math.random() * friendlyReplies.length);
    const base = friendlyReplies[index];
    return `${base} (You said: “${userText}”)`;
  }

  const systemPrompt =
    "You are Snoopy AI, a warm, playful chatbot who knows this is a personal 'Our Story' website with 10 chapters and a cute Snoopy theme. " +
    "Answer briefly (1–3 sentences), be kind and encouraging, and you can ask gentle follow‑up questions. " +
    "Avoid harmful, offensive, or very technical answers.";

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${systemPrompt}\n\nUser: ${userText}`
              }
            ]
          }
        ]
      })
    }
  );

  if (!response.ok) {
    throw new Error("Gemini API error");
  }

  const data = await response.json();
  const candidate = data.candidates && data.candidates[0];
  const parts = candidate && candidate.content && candidate.content.parts;
  const text =
    (parts && parts.map((p) => p.text || "").join("").trim()) ||
    "I had a little trouble answering that, but I’m still here for you.";

  return text;
}

