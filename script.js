let mediaRecorder = null;
let audioChunks = [];

let recognition = null;
let testRunning = false;

let recognizedText = "";
let finalWordCount = 0;

let startTime = 0;
let timerInterval = null;


// ===============================
// START TEST
// ===============================

async function startTest() {

    if (testRunning) return;

    const status =
        document.getElementById("recordingStatus");

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        status.textContent =
            "❌ Hindi speech recognition इस browser में उपलब्ध नहीं है।";
        return;
    }

    try {

        const stream =
            await navigator.mediaDevices.getUserMedia({
                audio: true
            });


        // =========================
        // RECORDING
        // =========================

        mediaRecorder =
            new MediaRecorder(stream);

        audioChunks = [];

        mediaRecorder.ondataavailable = function(e) {

            if (e.data.size > 0) {
                audioChunks.push(e.data);
            }

        };


        mediaRecorder.onstop = function() {

            const blob =
                new Blob(audioChunks, {
                    type: mediaRecorder.mimeType ||
                          "audio/webm"
                });

            const url =
                URL.createObjectURL(blob);

            const player =
                document.getElementById("audioPlayer");

            if (player) {
                player.src = url;
                player.style.display = "block";
            }

        };


        mediaRecorder.start();


        // =========================
        // SPEECH RECOGNITION
        // =========================

        recognition =
            new SpeechRecognition();

        recognition.lang = "hi-IN";

        recognition.continuous = true;

        recognition.interimResults = true;


        recognition.onstart = function() {

            testRunning = true;

            status.textContent =
                "🔴 RECORDING — पढ़ना शुरू करें";

            status.style.color = "red";

        };


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

                } else {

                    interimText += transcript;

                }

            }


            // केवल FINAL speech को permanently save करें
            if (finalText.trim() !== "") {

                recognizedText += finalText;

                finalWordCount =
                    countWords(recognizedText);

                updateResult(finalWordCount);

            }


            // Screen पर speech दिखाएँ
            showSpeech(
                recognizedText + interimText
            );

        };


        recognition.onerror = function(event) {

            console.log(
                "Recognition error:",
                event.error
            );

            // Error होने पर recording बंद नहीं होगी

        };


        recognition.onend = function() {

            if (testRunning) {

                try {
                    recognition.start();
                }
                catch (e) {}

            }

        };


        recognition.start();


        // =========================
        // TIMER
        // =========================

        startTime = Date.now();

        remainingTime = 60;

        document.getElementById(
            "startBtn"
        ).disabled = true;

        document.getElementById(
            "stopBtn"
        ).disabled = false;


        updateTimer();


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
// WORD COUNT
// ===============================

function countWords(text) {

    if (!text) {
        return 0;
    }


    // Hindi punctuation हटाएँ
    const cleanText =
        text
        .replace(/[।॥,!?;:"“”‘’(){}\[\]—–\-]/g, " ")
        .replace(/\s+/g, " ")
        .trim();


    if (!cleanText) {
        return 0;
    }


    return cleanText
        .split(" ")
        .filter(word => word.trim() !== "")
        .length;

}


// ===============================
// UPDATE RESULT
// ===============================

function updateResult(words) {

    const wordsBox =
        document.getElementById("wordsRead");

    const wpmBox =
        document.getElementById("wpm");


    if (wordsBox) {
        wordsBox.textContent = words;
    }


    /*
       Test = 60 seconds

       इसलिए:
       10 words = 10 WPM
       20 words = 20 WPM
       50 words = 50 WPM
    */

    if (wpmBox) {
        wpmBox.textContent = words;
    }


    console.log(
        "FINAL WORD COUNT:",
        words
    );

}


// ===============================
// DISPLAY SPEECH
// ===============================

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


    document.getElementById("time")
        .textContent =
        minutes + ":" + seconds;

}


// ===============================
// STOP TEST
// ===============================

function stopTest() {

    if (!testRunning) return;

    testRunning = false;

    clearInterval(timerInterval);


    // Stop speech
    if (recognition) {

        try {
            recognition.stop();
        }
        catch (e) {}

    }


    // Stop recording
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


    // Final count
    finalWordCount =
        countWords(recognizedText);

    updateResult(finalWordCount);


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
        "✅ Test complete — Recording तैयार है।";

    status.style.color = "green";


    console.log(
        "Total words actually detected:",
        finalWordCount
    );

}
function setTotalWords() {

    const passage =
        document.getElementById("passage");

    const totalWords =
        document.getElementById("totalWords");

    if (!passage || !totalWords) return;

    const text =
        passage.value || passage.textContent;

    const cleanText =
        text
        .replace(/[।॥,!?;:"“”‘’(){}\[\]—–\-]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    const count =
        cleanText
        ? cleanText.split(" ").length
        : 0;

    totalWords.textContent = count;
}


// Page खुलते ही Total Words दिखाएँ
window.addEventListener(
    "load",
    setTotalWords
);
