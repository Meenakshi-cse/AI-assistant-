
const listenBtn = document.querySelector("#listen-btn");
const btnLabel = document.querySelector("#btn-label");
const statusBadge = document.querySelector("#status-badge");
const textForm = document.querySelector("#text-form");
const textInput = document.querySelector("#text-input");
const transcriptText = document.querySelector("#transcript-text");
const responseText = document.querySelector("#response-text");
const actionLinks = document.querySelector("#action-links");
const browserWarning = document.querySelector("#browser-warning");
const chips = document.querySelectorAll(".chip");

// Check Speech Recognition Support
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let isListening = false;

if (SpeechRecognition) {
    try {
        recognition = new SpeechRecognition();
        recognition.lang = "en-US";
        recognition.continuous = false; // Stop listening automatically after 1 phrase
        recognition.interimResults = false;

        // Recognition Started
        recognition.onstart = () => {
            isListening = true;
            listenBtn.classList.add("listening");
            btnLabel.textContent = "Listening... 👂";
            statusBadge.textContent = "Listening...";
            statusBadge.className = "status-badge active";
        };

        // Recognition Result Received
        recognition.onresult = (event) => {
            if (event.results && event.results[0] && event.results[0][0]) {
                const transcript = event.results[0][0].transcript;
                handleCommand(transcript);
            }
        };

        // Recognition Error Handling
        recognition.onerror = (event) => {
            console.warn("Speech recognition error:", event.error);
            resetListeningState();

            if (event.error === "not-allowed") {
                responseText.textContent = "Microphone access blocked. Please enable microphone permissions in your browser.";
                statusBadge.textContent = "Mic Denied";
            } else if (event.error === "no-speech") {
                responseText.textContent = "No voice was detected. Please try speaking again.";
                statusBadge.textContent = "No Speech";
            } else {
                responseText.textContent = `Recognition error: ${event.error}`;
                statusBadge.textContent = "Error";
            }
        };

        // Recognition Ended
        recognition.onend = () => {
            resetListeningState();
        };
    } catch (err) {
        console.error("Failed to initialize SpeechRecognition:", err);
        showBrowserWarning();
    }
} else {
    showBrowserWarning();
}

function showBrowserWarning() {
    if (browserWarning) {
        browserWarning.style.display = "block";
    }
    if (listenBtn) {
        listenBtn.title = "Voice recognition is not supported in this browser. Please use Chrome/Edge or type your command.";
    }
}

function resetListeningState() {
    isListening = false;
    listenBtn.classList.remove("listening");
    btnLabel.textContent = "Start Listening";
    if (statusBadge.textContent === "Listening...") {
        statusBadge.textContent = "Ready";
        statusBadge.className = "status-badge";
    }
}

// Function to Speak Text and Update Status
function speak(text, onComplete) {
    // Write out the response immediately
    responseText.textContent = text;
    statusBadge.textContent = "Speaking...";
    statusBadge.className = "status-badge speaking";

    if (!("speechSynthesis" in window)) {
        statusBadge.textContent = "Ready";
        statusBadge.className = "status-badge";
        if (onComplete) onComplete();
        return;
    }

    // Cancel any previous speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    let hasEnded = false;
    const finish = () => {
        if (!hasEnded) {
            hasEnded = true;
            statusBadge.textContent = "Ready";
            statusBadge.className = "status-badge";
            if (onComplete) onComplete();
        }
    };

    utterance.onend = finish;
    utterance.onerror = finish;

    // Safety timeout in case utterance.onend doesn't fire (browser bug)
    const timeoutDuration = Math.max(2500, text.length * 90);
    setTimeout(finish, timeoutDuration);

    window.speechSynthesis.speak(utterance);
}

// Open URL safely and provide fallback clickable button (prevents popup blocker issues)
function openUrl(url, label) {
    const openedWindow = window.open(url, "_blank");

    // Provide a direct clickable button in the UI
    actionLinks.innerHTML = `
        <a href="${url}" target="_blank" rel="noopener noreferrer" class="action-btn">
            🔗 Open ${label}
        </a>
    `;

    // If popup was blocked by browser, notify user
    if (!openedWindow || openedWindow.closed || typeof openedWindow.closed === "undefined") {
        responseText.textContent += " (Popup was blocked: click the link button below)";
    }
}

// Handle recognized voice or typed command
function handleCommand(rawCommand) {
    if (!rawCommand || !rawCommand.trim()) return;

    const command = rawCommand.toLowerCase().trim();

    // Display user command on screen ("Make it write")
    transcriptText.textContent = `"${rawCommand.trim()}"`;
    actionLinks.innerHTML = "";

    // 1. YouTube Commands
    if (command.startsWith("play ") || (command.includes("youtube") && (command.includes("search") || command.includes("play")))) {
        const query = command.replace(/play|search|on youtube|youtube/gi, "").trim();
        const searchTarget = query || "trending music";
        speak(`Playing ${searchTarget} on YouTube.`);
        openUrl(`https://www.youtube.com/results?search_query=${encodeURIComponent(searchTarget)}`, `YouTube: "${searchTarget}"`);
    } else if (command.includes("open youtube") || command === "youtube") {
        speak("Opening YouTube...");
        openUrl("https://www.youtube.com", "YouTube");
    }
    // 2. Google Commands
    else if (command.includes("open google") || command === "google") {
        speak("Opening Google...");
        openUrl("https://www.google.com", "Google");
    }
    // 3. WhatsApp Commands
    else if (command.includes("open whatsapp") || command.includes("whatsapp")) {
        speak("Opening WhatsApp Web...");
        openUrl("https://web.whatsapp.com", "WhatsApp Web");
    }
    // 4. Facebook Commands
    else if (command.includes("open facebook") || command.includes("facebook")) {
        speak("Opening Facebook...");
        openUrl("https://www.facebook.com", "Facebook");
    }
    // 5. Instagram Commands
    else if (command.includes("open instagram") || command.includes("instagram")) {
        speak("Opening Instagram...");
        openUrl("https://www.instagram.com", "Instagram");
    }
    // 6. GitHub Commands
    else if (command.includes("open github") || command.includes("github")) {
        speak("Opening GitHub...");
        openUrl("https://github.com", "GitHub");
    }
    // 7. Time Command
    else if (command.includes("time")) {
        const now = new Date();
        const timeString = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        speak(`The current time is ${timeString}.`);
    }
    // 8. Date Command
    else if (command.includes("date") || command.includes("day")) {
        const now = new Date();
        const dateString = now.toLocaleDateString([], {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        });
        speak(`Today is ${dateString}.`);
    }
    // 9. Greetings
    else if (command === "hello" || command === "hi" || command.includes("who are you")) {
        speak("Hello! I am your AI assistant. You can give me voice or text commands anytime.");
    }
    // 10. Default: Google Search
    else {
        const cleanQuery = command.replace(/^search (for )?|^who is |^what is /i, "").trim();
        const queryToSearch = cleanQuery || command;
        speak(`Searching Google for ${queryToSearch}...`);
        openUrl(`https://www.google.com/search?q=${encodeURIComponent(queryToSearch)}`, `Google Search: "${queryToSearch}"`);
    }
}

// Attach Event Listeners

// Voice button click (Toggle listening)
listenBtn.addEventListener("click", () => {
    if (!recognition) {
        speak("Voice recognition is not supported in this browser. Please use Google Chrome or type your command below.");
        return;
    }

    if (isListening) {
        recognition.stop();
        resetListeningState();
    } else {
        // Stop any ongoing speech before listening so mic doesn't hear assistant's voice
        window.speechSynthesis.cancel();
        try {
            recognition.start();
        } catch (err) {
            console.warn("Recognition already started or error:", err);
        }
    }
});

// Text form submission ("Write it")
textForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const query = textInput.value.trim();
    if (query) {
        handleCommand(query);
        textInput.value = "";
    }
});

// Quick suggestion chips
chips.forEach((chip) => {
    chip.addEventListener("click", () => {
        const cmd = chip.getAttribute("data-cmd") || chip.textContent.trim();
        textInput.value = "";
        handleCommand(cmd);
    });
});

 
