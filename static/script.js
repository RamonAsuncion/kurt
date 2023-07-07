function updateTime() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');

    let period = 'AM';
    if (hours >= 12) {
        period = 'PM';
    }
    if (hours > 12) {
        hours = hours - 12;
    }
    if (hours === 0) {
        hours = 12;
    }

    document.getElementById('clock').textContent = `${hours}:${minutes} ${period}`;
}

// function that takes in text and get's the audio https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis
function textToSpeech(text) {
    if ('speechSynthesis' in window) {
        // Speech Synthesis supported 🎉
        var msg = new SpeechSynthesisUtterance();
        msg.text = text;
        msg.volume = 1; // 0 to 1
        window.speechSynthesis.speak(msg);
    }
}

// function that takes in user audio and gets the text
function speechToText() {
    // Check for browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        console.error('Speech recognition API is not supported in this browser.');
    }

    // Create a new instance of the speech recognition API
    const recognition = new SpeechRecognition();

    // Set the continuous and interimResults properties
    recognition.continuous = true; // Enables continuous recognition
    recognition.interimResults = true; // Enables interim results

    let finalTranscript = ''; // Stores the final transcript
    let timeoutId = null; // Stores the ID of the timeout

    // Define event handlers
    recognition.onstart = () => console.log('Speech recognition started');
    recognition.onresult = (event) => {
        clearTimeout(timeoutId);

        let transcript = Array.from(event.results)
            .map(result => result[0])
            .map(result => result.transcript)
            .join('');

        finalTranscript += transcript;
    };
    recognition.onerror = (event) => console.error('Error:', event.error);
    recognition.onend = () => {
        console.log('Speech recognition ended');
        return finalTranscript;
    };

    // Start recognition
    recognition.start();
}

// function that takes in text and get's the response from gpt
function getResponse(text) {
    return null;
}

window.onload = async function () {
    updateTime();  // Update the time immediately
    setInterval(updateTime, 1000);  // Update the time every second

    let notDetectedBox = document.getElementById('notDetectedBox');
    let detectedBox = document.getElementById('detectedBox');
    let listeningBox = document.getElementById('listeningBox');
    let clock = document.getElementById('clock');
    let canvas = document.getElementById('canvas');
    let context = canvas.getContext('2d');
    var audio = document.getElementById('detectedAudio');
    audio.volume = 0.25;

    await faceapi.loadTinyFaceDetectorModel('/models'); // Load the face detection model
    await faceapi.loadFaceLandmarkModel('/models'); // Load the face landmark model
    await faceapi.loadFaceExpressionModel('/models'); // Load the face expression model

    // Get the video element
    const video = document.querySelector('video');

    // Define the video constraints
    const constraints = {
        audio: true, // Change to true if you also want to get the user's audio
        video: true
    };

    // Testing out the speech to text
    speechToText().then((text) => {
        textToSpeech(text);
    });

    // Get the user's media
    navigator.mediaDevices.getUserMedia(constraints)
        .then((stream) => {
            // Set the video src to the stream
            video.srcObject = stream;

            // Play the video once it's ready
            video.onloadedmetadata = () => {
                video.play();
            };
        })
        .catch((err) => {
            // Log the error if something goes wrong
            console.error(`${err.name}: ${err.message}`);
        });

    let faceDetected = false;

    video.addEventListener('loadedmetadata', () => {
        setInterval(async () => {
            const detections = await faceapi 
                .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceExpressions();

            if (detections && detections[0] && detections[0].detection._score > 0 && !faceDetected) {
                requestAnimationFrame(() => {
                    // Hide the notDetectedBox immediately
                    notDetectedBox.classList.add('hidden');

                    // Show the detectedBox immediately
                    detectedBox.classList.remove('hidden');

                    audio.play();

                    // After a delay, start fading out the detectedBox
                    setTimeout(() => {
                        detectedBox.style.transition = 'opacity 0.25s ease-out'; 
                        detectedBox.style.opacity = '0';
                    }, 1000);  

                    // Remove 'hidden' class and add 'listening' class to listeningBox
                    listeningBox.classList.remove('hidden');
                    listeningBox.classList.add('listening');

                    // After 2 second, start fading out the clock
                    setTimeout(() => {
                        requestAnimationFrame(() => {
                            clock.style.transition = 'opacity 2.5s ease-out';
                            clock.style.opacity = '0';
                        });
                    }, 3000);

                    // Make the canvas visible
                    setTimeout(() => {
                        canvas.classList.remove('hidden');
                    }, 3500);
                });
                    
                faceDetected = true;
            }

            // Set the canvas width and height
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // Clear the canvas
            context.clearRect(0, 0, canvas.width, canvas.height);

            // Draw the video frame on the canvas  
            if (detections && detections[0] && detections[0].detection._score > 0.5) {  // If a face is detected with a high confidence score
                // Draw the outline of the face
                const box = detections[0].detection._box;
                context.strokeStyle = 'white';
                context.lineWidth = 0.5;
                context.strokeRect(box._x, box._y, box._width, box._height);

                // Draw dots on the eyes and mouth
                const positions = detections[0].landmarks._positions;
                const eyes = [positions[36], positions[39], positions[42], positions[45]];
                const mouth = [positions[51], positions[57]];

                // Draw dots on the eyes
                eyes.forEach((eye) => {
                    context.beginPath();
                    context.arc(eye._x, eye._y, 2, 0, 2 * Math.PI);
                    context.fillStyle = 'white';
                    context.fill();
                });

                // Draw dots on the mouth
                mouth.forEach((dot) => {
                    context.beginPath();
                    context.arc(dot._x, dot._y, 2, 0, 2 * Math.PI);
                    context.fillStyle = 'white';
                    context.fill();
                });
            }
        }, 100);
    });
}