let mediaRecorder = null;
let audioChunks = [];

let recognition = null;

let testRunning = false;
let startTime = 0;
let timerInterval = null;

let recognizedText = "";


// ===============================
// START TEST
// ===============================

async function startTest() {

    if (testRunning) return;

    const status =
        document.getElementById("recordingStatus");

    // Hindi Speech Recognition check
    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    if (!SpeechRecognition) {

        status.textContent =
            "❌ Hindi Speech Recognition इस browser में उपलब्ध नहीं है। Chrome में खोलें।";

        status.style.color = "red";
        return;
    }


    try {

        // ===============================
        // MICROPHONE
        // ===============================

        const stream =
            await navigator.mediaDevices.getUserMedia({
                audio: true
            });


        // ===============================
        // AUDIO RECORDING
        // ===============================

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
                        type: mediaRecorder.mimeType ||
                              "audio/webm"
                    });


                const audioURL =
                    URL.createObjectURL(blob);


                const player =
                    document.getElementById("audioPlayer");


                if (player) {

                    player.src = audioURL;
                    player.style.display = "block";

                }

            };


        // Recording START
        mediaRecorder.start();


        // ===============================
        // SPEECH RECOGNITION
        // ===============================

        recognition =
            new SpeechRecognition();

        recognition.lang = "hi-IN";

        recognition.continuous = true;

        recognition.interimResults = true;


        recognition.onresult =
            function(event) {

                let finalPart = "";
                let interimPart = "";


                for (
                    let i = event.resultIndex;
                    i < event.results.length;
                    i++
                ) {

                    const text =
                        event.results[i][0].transcript;


                    if (event.results[i].isFinal) {

                        finalPart += text + " ";

                    }
                    else {

                        interimPart += text;

                    }

                }


                // केवल final words save करें
                recognizedText += finalPart;


                // Live speech दिखाएँ
                showRecognizedText(
                    recognizedText + interimPart
                );


                // Actual words count
                updateWPM(
                    recognizedText + interimPart
                );

            };


        recognition.onerror =
            function(event) {

                console.log(
                    "Speech recognition:",
                    event.error
                );

                // Speech error होने पर
                // recording बंद नहीं होगी

                if (event.error === "not-allowed") {

                    status.textContent =
                        "⚠️ Microphone/Speech permission Allow करें।";

                }

            };


        recognition.onend =
            function() {

                // Speech recognition अपने आप बंद हो जाए
                // तो recording चलती रहेगी

                if (testRunning) {

                    try {
                        recognition.start();
                    }
                    catch (e) {}

                }

            };


        // Speech recognition START
        recognition.start();


        // ===============================
        // TEST START
        // ===============================

        testRunning = true;

        startTime = Date.now();

        recognizedText = "";

        remainingTime = 60;


        document.getElementById(
            "startBtn"
        ).disabled = true;


        document.getElementById(
            "stopBtn"
        ).disabled = false;


        status.textContent =
            "🔴 RECORDING + WPM TEST RUNNING";

        status.style.color = "red";


        updateTimer();


        // ===============================
        // EXACT 60 SECOND TIMER
        // ===============================

        timerInterval =
            setInterval(function() {

                const elapsed =
                    Math.floor(
                        (Date.now() - startTime) / 1000
                    );


                remainingTime =
                    60 - elapsed;


                if (remainingTime < 0) {
                    remainingTime = 0;
                }


                updateTimer();


                // Exactly 60 seconds
                if (elapsed >= 60) {

                    stopTest();

                }

            }, 200);

    }


    catch (error) {

        console.log(error);

        status.textContent =
            "❌ Microphone शुरू नहीं हुआ: " +
            error.name;

        status.style.color = "red";

    }

}


// ===============================
// TIMER DISPLAY
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


    document.getElementById("time").textContent =
        minutes + ":" + seconds;

}


// ===============================
// COUNT WORDS + WPM
// ===============================

function updateWPM(text) {

    const words = getWords(text);

    const count = words.length;

    const wordsRead =
        document.getElementById("wordsRead");

    const wpm =
        document.getElementById("wpm");

    if (wordsRead) {
        wordsRead.textContent = count;
    }

    if (wpm) {
        wpm.textContent = count;
    }

    console.log("Words detected:", count);
    console.log("Detected words:", words);
}

// ===============================
// WORD SPLIT
// ===============================

function getWords(text) {

    if (!text || !text.trim()) {
        return [];
    }

    // Hindi punctuation हटाएँ
    text = text
        .replace(/[।॥,!?;:"“”‘’(){}\[\]—–\-]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    if (!text) {
        return [];
    }

    return text.split(" ");
}

// ===============================
// SHOW RECOGNIZED SPEECH
// ===============================

function showRecognizedText(text) {

    let box =
        document.getElementById(
            "recognizedText"
        );


    if (!box) {

        box =
            document.createElement("div");

        box.id =
            "recognizedText";


        box.style.marginTop =
            "15px";


        box.style.padding =
            "15px";


        box.style.border =
            "1px solid #ccc";


        box.style.fontSize =
            "18px";


        document
            .querySelector(".results")
            .appendChild(box);

    }


    box.innerHTML =
        "<b>🗣️ Speech Detected:</b><br>" +
        text;

}


// ===============================
// STOP TEST
// ===============================

function stopTest() {

    if (!testRunning) return;


    testRunning = false;


    clearInterval(timerInterval);


    // -------------------------------
    // Stop Speech Recognition
    // -------------------------------

    if (recognition) {

        try {
            recognition.stop();
        }
        catch (e) {}

    }


    // -------------------------------
    // Stop Audio Recording
    // -------------------------------

    if (
        mediaRecorder &&
        mediaRecorder.state !== "inactive"
    ) {

        mediaRecorder.stop();


        mediaRecorder.stream
            .getTracks()
            .forEach(
                track => track.stop()
            );

    }


    // -------------------------------
    // Final Result
    // -------------------------------

    const words =
        getWords(recognizedText);


    const finalWords =
        words.length;


    document.getElementById(
        "wordsRead"
    ).textContent =
        finalWords;


    document.getElementById(
        "wpm"
    ).textContent =
        finalWords;


    // -------------------------------
    // UI
    // -------------------------------

    document.getElementById(
        "startBtn"
    ).disabled = false;


    document.getElementById(
        "stopBtn"
    ).disabled = true;


    document.getElementById(
        "time"
    ).textContent = "00:00";


    const status =
        document.getElementById(
            "recordingStatus"
        );


    status.textContent =
        "✅ Test complete — Recording नीचे Play करें।";

    status.style.color = "green";


    console.log(
        "FINAL SPEECH:",
        recognizedText
    );


    console.log(
        "FINAL WORDS:",
        finalWords
    );


    console.log(
        "FINAL WPM:",
        finalWords
    );

}
