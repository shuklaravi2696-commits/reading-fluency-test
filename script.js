let mediaRecorder;
let audioChunks = [];

let recognition;
let recognitionSupported = false;

let timerInterval;
let remainingTime = 60;
let testRunning = false;

let recognizedText = "";


// ===============================
// START TEST
// ===============================

async function startTest() {

    if (testRunning) return;

    const status = document.getElementById("recordingStatus");

    try {

        // -------------------------------
        // Microphone
        // -------------------------------

        if (!navigator.mediaDevices ||
            !navigator.mediaDevices.getUserMedia) {

            status.textContent =
                "❌ Microphone recording is not supported.";

            return;
        }

        const stream =
            await navigator.mediaDevices.getUserMedia({
                audio: true
            });


        // -------------------------------
        // Media Recorder
        // -------------------------------

        if (!window.MediaRecorder) {

            status.textContent =
                "❌ Audio recording is not supported.";

            stream.getTracks().forEach(track => track.stop());

            return;
        }


        mediaRecorder = new MediaRecorder(stream);

        audioChunks = [];


        mediaRecorder.ondataavailable = function(event) {

            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }

        };


        mediaRecorder.onstop = function() {

            const audioBlob =
                new Blob(audioChunks, {
                    type: mediaRecorder.mimeType
                });

            const audioURL =
                URL.createObjectURL(audioBlob);

            const audioPlayer =
                document.getElementById("audioPlayer");

            if (audioPlayer) {
                audioPlayer.src = audioURL;
            }

        };


        // -------------------------------
        // Hindi Speech Recognition
        // -------------------------------

        const SpeechRecognition =
            window.SpeechRecognition ||
            window.webkitSpeechRecognition;


        if (SpeechRecognition) {

            recognitionSupported = true;

            recognition =
                new SpeechRecognition();

            recognition.lang = "hi-IN";

            recognition.continuous = true;

            recognition.interimResults = true;


            recognition.onresult = function(event) {

                let finalText = "";
                let interimText = "";


                for (
                    let i = event.resultIndex;
                    i < event.results.length;
                    i++
                ) {

                    const transcript =
                        event.results[i][0].transcript;

                    if (event.results[i].isFinal) {

                        finalText += transcript + " ";

                    }
                    else {

                        interimText += transcript;

                    }

                }


                recognizedText += finalText;

                showRecognizedText(
                    recognizedText + interimText
                );

                updateWordCount(
                    recognizedText + interimText
                );

            };


            recognition.onerror = function(event) {

                console.log(
                    "Speech recognition error:",
                    event.error
                );

            };


            recognition.onend = function() {

                // Don't restart after test has ended
                if (testRunning) {

                    try {
                        recognition.start();
                    }
                    catch (e) {}

                }

            };

        }


        // -------------------------------
        // Start Recording
        // -------------------------------

        mediaRecorder.start();

        testRunning = true;

        recognizedText = "";

        remainingTime = 60;


        document.getElementById("startBtn").disabled = true;

        document.getElementById("stopBtn").disabled = false;


        status.textContent =
            "🔴 RECORDING + READING DETECTION ON";

        status.style.color = "red";


        // Start speech recognition

        if (recognitionSupported) {

            try {
                recognition.start();
            }
            catch (e) {}

        }
        else {

            status.textContent =
                "🔴 RECORDING ON — Speech recognition unavailable";

        }


        updateTimer();


        // -------------------------------
        // 60 SECOND TIMER
        // -------------------------------

        timerInterval =
            setInterval(function() {

                remainingTime--;

                updateTimer();


                if (remainingTime <= 0) {

                    stopTest();

                }

            }, 1000);


    }
    catch (error) {

        console.error(error);

        status.textContent =
            "❌ Microphone permission नहीं मिली.";

        status.style.color = "red";

    }

}


// ===============================
// TIMER
// ===============================

function updateTimer() {

    let minutes =
        Math.floor(remainingTime / 60);

    let seconds =
        remainingTime % 60;


    minutes =
        String(minutes).padStart(2, "0");

    seconds =
        String(seconds).padStart(2, "0");


    const timer =
        document.getElementById("time");


    if (timer) {

        timer.textContent =
            `${minutes}:${seconds}`;

    }

}


// ===============================
// STOP TEST
// ===============================

function stopTest() {

    if (!testRunning) return;

    testRunning = false;

    clearInterval(timerInterval);


    // Stop speech recognition

    if (recognition) {

        try {
            recognition.stop();
        }
        catch (e) {}

    }


    // Stop recording

    if (mediaRecorder &&
        mediaRecorder.state !== "inactive") {

        mediaRecorder.stop();

        mediaRecorder.stream
            .getTracks()
            .forEach(track => track.stop());

    }


    document.getElementById("startBtn").disabled = false;

    document.getElementById("stopBtn").disabled = true;


    document.getElementById("time").textContent =
        "00:00";


    // Calculate final result

    calculateFinalResult();


    const status =
        document.getElementById("recordingStatus");


    status.textContent =
        "✅ Test completed — Recording saved for playback.";

    status.style.color = "green";

}


// ===============================
// SHOW RECOGNIZED TEXT
// ===============================

function showRecognizedText(text) {

    let box =
        document.getElementById("recognizedText");


    if (box) {

        box.textContent = text;

    }

}


// ===============================
// WORD COUNT
// ===============================

function getWords(text) {

    return text
        .trim()
        .split(/\s+/)
        .filter(word => word.length > 0);

}


function updateWordCount(text) {

    const words =
        getWords(text);


    const wordsRead =
        document.getElementById("wordsRead");


    if (wordsRead) {

        wordsRead.textContent =
            words.length;

    }


    // Live WPM
    // Test हमेशा 60 seconds का है

    const wpm =
        words.length;


    const wpmBox =
        document.getElementById("wpm");


    if (wpmBox) {

        wpmBox.textContent =
            wpm;

    }

}


// ===============================
// FINAL RESULT
// ===============================

function calculateFinalResult() {

    const words =
        getWords(recognizedText);


    const wordsRead =
        words.length;


    // Because test duration is exactly 1 minute
    const wpm =
        wordsRead;


    const wordsReadBox =
        document.getElementById("wordsRead");


    const wpmBox =
        document.getElementById("wpm");


    if (wordsReadBox) {

        wordsReadBox.textContent =
            wordsRead;

    }


    if (wpmBox) {

        wpmBox.textContent =
            wpm;

    }


    console.log("Recognized Text:", recognizedText);

    console.log("Words Read:", wordsRead);

    console.log("WPM:", wpm);

}
