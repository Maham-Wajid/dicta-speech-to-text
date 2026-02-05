const speak_button = document.querySelector(".input");
const content = document.querySelector("#content");
const clear_button = document.querySelector("#clear-btn");
const output_content = document.querySelector("#output-content");

clear_button.addEventListener("click", () => {
  output_content.textContent = "Transcribed text will appear here. Click the microphone and start speaking to see the magic happen!";
});

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
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;

    // Select DOM elements
    const startBtn = document.querySelector('.input');
    const statusLabel = document.getElementById('content');
    const resultDiv = document.getElementById('output-content');
    let isListening = false;
    let finalTranscript = '';
    
    // Clear the default message on first interaction
    let firstInteraction = true;

    // Add event listener to the button
    startBtn.addEventListener('click', () => {
      if (!isListening) {
        statusLabel.textContent = 'Requesting microphone access...';
        try {
          recognition.start();
          isListening = true;
          statusLabel.textContent = 'Listening... (click to stop)';
        } catch (error) {
          statusLabel.textContent = 'Error starting recognition';
          console.error('Recognition start error:', error);
        }
        return;
      }

      recognition.stop();
      isListening = false;
      statusLabel.textContent = 'Speak';
    });

    // Confirm recognition has started
    recognition.addEventListener('start', () => {
      if (isListening) {
        statusLabel.textContent = 'Listening... (click to stop)';
      }
    });

    // Handle the result event
    recognition.addEventListener('result', (event) => {
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += `${transcript} `;
          firstInteraction = false;
        } else {
          interimTranscript += `${transcript} `;
        }
      }

      if (firstInteraction) {
        resultDiv.textContent = '';
      }

      const combined = `${finalTranscript}${interimTranscript}`.trim();
      if (combined.length) {
        resultDiv.textContent = combined;
      }

      if (isListening) {
        statusLabel.textContent = 'Listening... (click to stop)';
      }
    });

    // Handle the end event
    recognition.addEventListener('end', () => {
      if (isListening) {
        recognition.start();
        return;
      }

      statusLabel.textContent = 'Start Listening';
    });

    // Handle errors
    recognition.addEventListener('error', (event) => {
        resultDiv.textContent = `Error occurred in recognition: ${event.error}`;
        isListening = false;
        finalTranscript = '';
        statusLabel.textContent = 'Start Listening';
    });
} else {
    // Fallback for browsers that don't support SpeechRecognition
    alert('Speech Recognition API not supported in this browser.');
}
