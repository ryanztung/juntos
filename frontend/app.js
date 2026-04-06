const $ = (id) => document.getElementById(id);

const authPanel = $("auth");
const chatPanel = $("chat");
const messagesDiv = $("messages");
const usernameInput = $("username");
const passwordInput = $("password");
const authMsg = $("authMsg");

// Buttons
const signupBtn = $("signupBtn");
const loginBtn = $("loginBtn");
const logoutBtn = $("logoutBtn");
const chatInput = $("chatInput");
const sendBtn = $("sendBtn");

// Onboarding UI
const onboardingPanel = $("onboarding");
const progressText = $("progressText");
const questionTitle = $("questionTitle");
const questionHelp = $("questionHelp");
const questionOptions = $("questionOptions");
const backQuestionBtn = $("backQuestionBtn");
const nextQuestionBtn = $("nextQuestionBtn");

const API = location.origin + "/api";
let token = localStorage.getItem("token") || "";
let ws;

let currentQuestion = 0;
const onboardingAnswers = JSON.parse(localStorage.getItem("onboardingAnswers") || "{}");

const questions = [
  {
    key: "budget",
    title: "What is your budget?",
    help: "Choose the range that best matches your preferences.",
    options: ["Under $500", "$500 to $1,500", "$1,500 to $3,000", "$3,000+"]
  },
  {
    key: "destination",
    title: "What kind of destination do you want?",
    help: "This helps us suggest the right kind of trip.",
    options: ["Beach", "City", "Nature", "Open to anything"]
  },
  {
    key: "groupSize",
    title: "How many people are traveling?",
    help: "This helps with lodging and activity suggestions.",
    options: ["2 to 3", "4 to 6", "7 to 10", "10+"]
  },
  {
    key: "tripStyle",
    title: "What kind of trip do you want?",
    help: "Pick the vibe that best fits your group.",
    options: ["Relaxing", "Adventure", "Food and nightlife", "Balanced mix"]
  }
];

function showAuth() {
  authPanel.classList.remove("hidden");
  onboardingPanel.classList.add("hidden");
  chatPanel.classList.add("hidden");
}

function showChat() {
  authPanel.classList.add("hidden");
  onboardingPanel.classList.add("hidden");
  chatPanel.classList.remove("hidden");
}

function showOnboarding() {
  authPanel.classList.add("hidden");
  chatPanel.classList.add("hidden");
  onboardingPanel.classList.remove("hidden");
  renderQuestion();
}

function renderQuestion() {
  const q = questions[currentQuestion];

  questionTitle.textContent = q.title;
  questionHelp.textContent = q.help;
  progressText.textContent = `${currentQuestion + 1} of ${questions.length}`;

  questionOptions.innerHTML = "";

  q.options.forEach((option) => {
    const button = document.createElement("button");
    button.className = "option";
    button.textContent = option;

    if (onboardingAnswers[q.key] === option) {
      button.classList.add("selected");
    }

    button.onclick = () => {
      onboardingAnswers[q.key] = option;
      localStorage.setItem("onboardingAnswers", JSON.stringify(onboardingAnswers));
      renderQuestion();
    };

    questionOptions.appendChild(button);
  });

  backQuestionBtn.disabled = currentQuestion === 0;

  if (currentQuestion === questions.length - 1) {
    nextQuestionBtn.textContent = "Finish";
  } else {
    nextQuestionBtn.textContent = "Next";
  }
}

async function callAPI(path, method = "GET", body) {
  const headers = {"Content-Type": "application/json"};
  if (token) headers["Authorization"] = "Bearer " + token;
  const res = await fetch(API + path, {
    method, headers, body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) throw new Error((await res.json()).detail || ("HTTP "+res.status));
  return res.json();
}

function addMessage(m) {
  const el = document.createElement("div");
  el.className = "message" + (m.is_bot ? " bot" : "");
  const meta = document.createElement("div");
  meta.className = "meta";
  meta.textContent = `${m.username || "unknown"} • ${new Date(m.created_at).toLocaleString()}`;
  const body = document.createElement("div");
  body.textContent = m.content;
  el.appendChild(meta);
  el.appendChild(body);
  messagesDiv.appendChild(el);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

async function loadMessages() {
  const data = await callAPI("/messages");
  messagesDiv.innerHTML = "";
  for (const m of data.messages) addMessage(m);
}

function connectWS() {
  const proto = location.protocol === "https:" ? "wss" : "ws";
  ws = new WebSocket(`${proto}://${location.host}/ws`);
  ws.onmessage = (ev) => {
    try {
      const data = JSON.parse(ev.data);
      if (data.type === "message") addMessage(data.message);
    } catch (e) {}
  };
  ws.onclose = () => {
    // try to reconnect after a delay
    setTimeout(connectWS, 2000);
  };
}

signupBtn.onclick = async () => {
  try {
    const out = await callAPI("/signup", "POST", {
      username: usernameInput.value.trim(),
      password: passwordInput.value
    });
    token = out.token;
    localStorage.setItem("token", token);
    await loadMessages();
    connectWS();
    showOnboarding();
  } catch (e) {
    authMsg.textContent = e.message;
  }
};

loginBtn.onclick = async () => {
  try {
    const out = await callAPI("/login", "POST", {
      username: usernameInput.value.trim(),
      password: passwordInput.value
    });
    token = out.token;
    localStorage.setItem("token", token);
    await loadMessages();
    connectWS();
    showChat();
  } catch (e) {
    authMsg.textContent = e.message;
  }
};

backQuestionBtn.onclick = () => {
  if (currentQuestion > 0) {
    currentQuestion--;
    renderQuestion();
  }
};

nextQuestionBtn.onclick = () => {
  const q = questions[currentQuestion];
  if (!onboardingAnswers[q.key]) {
    alert("Please choose an answer first.");
    return;
  }

  if (currentQuestion < questions.length - 1) {
    currentQuestion++;
    renderQuestion();
  } else {
    // onboarding is complete
    console.log("Onboarding answers:", onboardingAnswers);

    // Later this is where you would POST the answers to your backend
    // await callAPI("/profile", "POST", onboardingAnswers);

    showChat();
  }
};

logoutBtn.onclick = () => {
  token = "";
  localStorage.removeItem("token");
  showAuth();
};

sendBtn.onclick = async () => {
  const text = chatInput.value.trim();
  if (!text) return;
  chatInput.value = "";
  await callAPI("/messages", "POST", {content: text});
};

if (token) {
  loadMessages().then(()=>{
    connectWS();
    showChat();
  }).catch(()=>showAuth());
} else {
  showAuth();
}
