const speak_button = document.querySelector(".input");
const content = document.querySelector("#content");

function speak(sentence) {
  const speak_sentence = new SpeechSynthesisUtterance(sentence);
  speak_sentence.rate = 1;
  speak_sentence.pitch = 1;
  window.speechSynthesis.speak(speak_sentence);
}

function greetings() {
  var day = new Date();
  var hour = day.getHours();

  if (hour >= 0 && hour < 12) {
    speak("Good Morning, How can i assist you?");
  } else if (hour == 12) {
    speak("Good Noon, How can i assist you?");
  } else if (hour > 12 && hour <= 17) {
    speak("Good Afternoon, How can i assist you?");
  } else {
    speak("Good Evening, How can i assist you?");
  }
}

// Ensure speech synthesis works on load
function initialize() {
  speak("Activating Dicta");
  speak("Connecting");
  greetings();
}

document.addEventListener("DOMContentLoaded", () => {
  initialize();
});


// Check for browser support
window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (window.SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    // Select DOM elements
    const startBtn = document.getElementById('content');
    const resultDiv = document.getElementById('output-content');

    // Add event listener to the button
    startBtn.addEventListener('click', () => {
        recognition.start();
        startBtn.textContent = 'Listening...';
    });

    // Handle the result event
    recognition.addEventListener('result', (event) => {
        const transcript = event.results[0][0].transcript;
        resultDiv.textContent = transcript;
        startBtn.textContent = 'Start Listening';
    });

    // Handle the end event
    recognition.addEventListener('end', () => {
        if (startBtn.textContent === 'Listening...') {
            startBtn.textContent = 'Start Listening';
        }
    });

    // Handle errors
    recognition.addEventListener('error', (event) => {
        resultDiv.textContent = `Error occurred in recognition: ${event.error}`;
        startBtn.textContent = 'Start Listening';
    });
} else {
    // Fallback for browsers that don't support SpeechRecognition
    alert('Speech Recognition API not supported in this browser.');
}
