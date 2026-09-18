let recognition;
let mediaRecorder;
let audioChunks = [];

let testRunning = false;
let remainingTime = 60;
let timerInterval;

let recognizedText = "";


// ============================
// START TEST
// ============================

async function startTest() {

    if (testRunning) return;

    const status =
        document.getElementById("recordingStatus");

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;


    // Check Speech Recognition
    if (!SpeechRecognition) {

        status.textContent =
            "❌ Hindi Speech Recognition उपलब्ध नहीं है। Chrome में खोलें।";

        status.style.color = "red";

        return;
    }


    // Check microphone
    if (!navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia) {

        status.textContent =
            "❌ Microphone उपलब्ध नहीं है।";

        return;
    }


    try {

        // Microphone permission
        const stream =
            await navigator.mediaDevices.getUserMedia({
                audio: true
            });


        // ============================
        // AUDIO RECORDING
        // ============================

        mediaRecorder =
            new MediaRecorder(stream);

        audioChunks = [];


        mediaRecorder.ondataavailable =
            function(event) {

                if (event.data.size > 0) {
                    audioChunks.push(event.data);
                }

            };


        mediaRecorder.onstop =
            function() {

                const blob =
                    new Blob(audioChunks, {
                        type: mediaRecorder.mimeType
                    });


                const audioURL =
                    URL.createObjectURL(blob);


                const player =
                    document.getElementById(
                        "audioPlayer"
                    );


                if (player) {

                    player.src = audioURL;

                    player.style.display = "block";

                }

            };


        // Start recording
        mediaRecorder.start();


        // ============================
        // SPEECH RECOGNITION
        // ============================

        recognition =
            new SpeechRecognition();


        recognition.lang = "hi-IN";

        recognition.continuous = true;

        recognition.interimResults = true;


        recognition.onstart =
            function() {

                status.textContent =
                    "🔴 RECORDING + READING DETECTION ON";

                status.style.color = "red";

            };


        recognition.onresult =
            function(event) {

                let newFinalText = "";

                let interimText = "";


                for (
                    let i = event.resultIndex;
                    i < event.results.length;
                    i++
                ) {

                    let text =
                        event.results[i][0].transcript;


                    if (event.results[i].isFinal) {

                        newFinalText +=
                            text + " ";

                    }
                    else {

                        interimText += text;

                    }

                }


                // Save only final speech
                recognizedText +=
                    newFinalText;


                // Show live speech
                showSpeech(
                    recognizedText +
                    interimText
                );


                // Count actual spoken words
                calculateLiveWPM(
                    recognizedText +
                    interimText
                );

            };


        recognition.onerror =
            function(event) {

                console.log(
                    "Speech error:",
                    event.error
                );

            };


        // If recognition stops temporarily,
        // restart it while test is running

        recognition.onend =
            function() {

                if (testRunning) {

                    try {
                        recognition.start();
                    }
                    catch (e) {}

                }

            };


        // Start recognition
        recognition.start();


        // ============================
        // START TEST
        // ============================

        testRunning = true;

        recognizedText = "";

        remainingTime = 60;


        document.getElementById(
            "startBtn"
        ).disabled = true;


        document.getElementById(
            "stopBtn"
        ).disabled = false;


        updateTimer();


        // ============================
        // 60 SECOND TIMER
        // ============================

        timerInterval =
            setInterval(
                function() {

                    remainingTime--;

                    updateTimer();


                    if (remainingTime <= 0) {

                        stopTest();

                    }

                },
                1000
            );


    }
    catch (error) {

        console.log(error);

        status.textContent =
            "❌ Microphone permission नहीं मिली।";

        status.style.color = "red";

    }

}


// ============================
// TIMER
// ============================

function updateTimer() {

    let minutes =
        Math.floor(
            remainingTime / 60
        );


    let seconds =
        remainingTime % 60;


    minutes =
        String(minutes).padStart(2, "0");


    seconds =
        String(seconds).padStart(2, "0");


    document.getElementById(
        "time"
    ).textContent =
        minutes + ":" + seconds;

}


// ============================
// LIVE WPM
// ============================

function calculateLiveWPM(text) {

    const words =
        getWords(text);


    const count =
        words.length;


    document.getElementById(
        "wordsRead"
    ).textContent = count;


    // Test is 60 seconds
    // Therefore actual words = WPM

    document.getElementById(
        "wpm"
    ).textContent = count;

}


// ============================
// STOP TEST
// ============================

function stopTest() {

    if (!testRunning) return;


    testRunning = false;


    clearInterval(timerInterval);


    // Stop recognition

    if (recognition) {

        try {
            recognition.stop();
        }
        catch (e) {}

    }


    // Stop audio recording

    if (mediaRecorder &&
        mediaRecorder.state !== "inactive") {

        mediaRecorder.stop();


        mediaRecorder.stream
            .getTracks()
            .forEach(
                track => track.stop()
            );

    }


    document.getElementById(
        "startBtn"
    ).disabled = false;


    document.getElementById(
        "stopBtn"
    ).disabled = true;


    document.getElementById(
        "time"
    ).textContent = "00:00";


    // Final WPM

    const words =
        getWords(recognizedText);


    const finalCount =
        words.length;


    document.getElementById(
        "wordsRead"
    ).textContent =
        finalCount;


    document.getElementById(
        "wpm"
    ).textContent =
        finalCount;


    document.getElementById(
        "recordingStatus"
    ).textContent =
        "✅ Test completed — Recording तैयार है।";


    document.getElementById(
        "recordingStatus"
    ).style.color = "green";

}


// ============================
// WORD SPLIT
// ============================

function getWords(text) {

    return text
        .trim()
        .split(/\s+/)
        .filter(
            word => word.length > 0
        );

}


// ============================
// SHOW RECOGNIZED SPEECH
// ============================

function showSpeech(text) {

    let box =
        document.getElementById(
            "recognizedText"
        );


    if (!box) {

        box =
            document.createElement("div");

        box.id =
            "recognizedText";


        box.style.padding =
            "15px";


        box.style.marginTop =
            "15px";


        box.style.border =
            "1px solid #ccc";


        document
            .querySelector(".results")
            .appendChild(box);

    }


    box.innerHTML =
        "<b>Speech detected:</b><br>" +
        text;

    }
