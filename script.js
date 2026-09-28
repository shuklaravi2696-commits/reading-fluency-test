let mediaRecorder = null;
let audioChunks = [];

let recognition = null;
let testRunning = false;
let stoppingTest = false;

let recognizedText = "";
let finalWordCount = 0;

let startTime = 0;
let timerInterval = null;
let remainingTime = 60;


// ===============================
// TEXT HELPERS
// ===============================

function normalizeText(text) {
    return (text || "")
        .toLowerCase()
        .replace(/[।॥,!?;:"“”‘’(){}\[\]—–\-]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function getWords(text) {
    const clean = normalizeText(text);

    if (!clean) return [];

    return clean
        .split(/\s+/)
        .filter(word => word.trim() !== "");
}

function countWords(text) {
    return getWords(text).length;
}


// ===============================
// TOTAL WORDS
// ===============================

function setTotalWords() {
    const passage = document.getElementById("passage");
    const totalWords = document.getElementById("totalWords");

    if (!passage || !totalWords) return;

    totalWords.textContent = countWords(passage.value);
}


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
            "❌ Hindi Speech Recognition इस browser में उपलब्ध नहीं है। Google Chrome का उपयोग करें।";
        status.style.color = "red";
        return;
    }

    // पुराने test का data साफ करें
    recognizedText = "";
    finalWordCount = 0;
    remainingTime = 60;
    stoppingTest = false;

    document.getElementById("wordsRead").textContent = "0";
    document.getElementById("correctWords").textContent = "0";
    document.getElementById("wpm").textContent = "0";
    document.getElementById("accuracy").textContent = "0%";
    document.getElementById("wcpm").textContent = "0";
    document.getElementById("readingTime").textContent = "0 sec";

    const speechBox =
        document.getElementById("recognizedText");

    if (speechBox) {
        speechBox.textContent =
            "Speech will appear here...";
    }

    try {

        const stream =
            await navigator.mediaDevices.getUserMedia({
                audio: true
            });


        // =========================
        // AUDIO RECORDING
        // =========================

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
                    new Blob(
                        audioChunks,
                        {
                            type:
                                mediaRecorder.mimeType ||
                                "audio/webm"
                        }
                    );


                const url =
                    URL.createObjectURL(blob);


                const player =
                    document.getElementById(
                        "audioPlayer"
                    );


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

        recognition.maxAlternatives = 1;


        recognition.onstart =
            function() {

                testRunning = true;

                status.textContent =
                    "🔴 RECORDING — पढ़ना शुरू करें";

                status.style.color = "red";

            };


        recognition.onresult =
            function(event) {

                let interimText = "";


                for (
                    let i = event.resultIndex;
                    i < event.results.length;
                    i++
                ) {

                    const transcript =
                        event.results[i][0]
                            .transcript;


                    if (
                        event.results[i].isFinal
                    ) {

                        recognizedText +=
                            " " + transcript;

                    } else {

                        interimText +=
                            " " + transcript;

                    }

                }


                finalWordCount =
                    countWords(
                        recognizedText
                    );


                updateLiveResult(
                    finalWordCount
                );


                showSpeech(
                    recognizedText +
                    " " +
                    interimText
                );

            };


        recognition.onerror =
            function(event) {

                console.log(
                    "Speech recognition error:",
                    event.error
                );

            };


        recognition.onend =
            function() {

                if (
                    testRunning &&
                    !stoppingTest
                ) {

                    setTimeout(
                        function() {

                            if (
                                !testRunning ||
                                stoppingTest
                            ) {
                                return;
                            }

                            try {
                                recognition.start();
                            }
                            catch (error) {
                                console.log(
                                    "Recognition restart skipped"
                                );
                            }

                        },
                        150
                    );

                }

            };


        recognition.start();


        // =========================
        // TIMER
        // =========================

        startTime =
            Date.now();

        testRunning = true;

        document.getElementById(
            "startBtn"
        ).disabled = true;


        document.getElementById(
            "stopBtn"
        ).disabled = false;


        updateTimer();


        clearInterval(
            timerInterval
        );


        timerInterval =
            setInterval(
                function() {

                    const elapsed =
                        Math.floor(
                            (
                                Date.now() -
                                startTime
                            ) / 1000
                        );


                    remainingTime =
                        Math.max(
                            0,
                            60 - elapsed
                        );


                    updateTimer();


                    if (
                        elapsed >= 60
                    ) {

                        stopTest();

                    }

                },
                200
            );

    }
    catch (error) {

        console.error(error);

        testRunning = false;

        status.textContent =
            "❌ Microphone शुरू नहीं हुआ: " +
            error.name;

        status.style.color = "red";

        document.getElementById(
            "startBtn"
        ).disabled = false;

        document.getElementById(
            "stopBtn"
        ).disabled = true;

    }

}


// ===============================
// LIVE RESULT
// ===============================

function updateLiveResult(words) {

    const wordsBox =
        document.getElementById(
            "wordsRead"
        );


    const wpmBox =
        document.getElementById(
            "wpm"
        );


    if (wordsBox) {
        wordsBox.textContent =
            words;
    }


    if (wpmBox) {
        wpmBox.textContent =
            words;
    }

}


// ===============================
// DISPLAY SPEECH
// ===============================

function showSpeech(text) {

    const box =
        document.getElementById(
            "recognizedText"
        );


    if (!box) return;


    box.innerHTML =
        "<b>🗣️ Speech Detected:</b><br>" +
        (text || "");

}


// ===============================
// TIMER
// ===============================

function updateTimer() {

    const timeBox =
        document.getElementById(
            "time"
        );


    if (!timeBox) return;


    const minutes =
        Math.floor(
            remainingTime / 60
        );


    const seconds =
        remainingTime % 60;


    timeBox.textContent =
        String(minutes).padStart(2, "0") +
        ":" +
        String(seconds).padStart(2, "0");

}


// ===============================
// STOP TEST
// ===============================

function stopTest() {

    if (!testRunning) return;


    testRunning = false;

    stoppingTest = true;


    clearInterval(
        timerInterval
    );


    timerInterval = null;


    let elapsedSeconds =
        (Date.now() - startTime) / 1000;


    elapsedSeconds =
        Math.max(
            0.1,
            Math.min(
                60,
                elapsedSeconds
            )
        );


    // Speech stop
    if (recognition) {

        try {
            recognition.stop();
        }
        catch (error) {
            console.log(error);
        }

    }


    // Audio stop
    if (
        mediaRecorder &&
        mediaRecorder.state !== "inactive"
    ) {

        try {
            mediaRecorder.stop();
        }
        catch (error) {
            console.log(error);
        }

    }


    if (
        mediaRecorder &&
        mediaRecorder.stream
    ) {

        mediaRecorder.stream
            .getTracks()
            .forEach(
                track =>
                    track.stop()
            );

    }


    calculateFinalResult(
        elapsedSeconds
    );


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


    status.style.color =
        "green";

}


// ===============================
// FINAL RESULT
// ===============================

function calculateFinalResult(
    elapsedSeconds
) {

    const passage =
        document.getElementById(
            "passage"
        );


    if (!passage) return;


    const passageWords =
        getWords(
            passage.value
        );


    const spokenWords =
        getWords(
            recognizedText
        );


    const totalWords =
        passageWords.length;


    const wordsRead =
        spokenWords.length;


    const correctWords =
        calculateCorrectWords(
            passageWords,
            spokenWords
        );


    const minutes =
        elapsedSeconds / 60;


    const wpm =
        Math.round(
            wordsRead / minutes
        );


    const accuracy =
        wordsRead > 0
            ? Math.round(
                (
                    correctWords /
                    wordsRead
                ) * 100
            )
            : 0;


    const wcpm =
        Math.round(
            correctWords / minutes
        );


    document.getElementById(
        "totalWords"
    ).textContent =
        totalWords;


    document.getElementById(
        "wordsRead"
    ).textContent =
        wordsRead;


    document.getElementById(
        "correctWords"
    ).textContent =
        correctWords;


    document.getElementById(
        "readingTime"
    ).textContent =
        elapsedSeconds.toFixed(1) +
        " sec";


    document.getElementById(
        "wpm"
    ).textContent =
        wpm;


    document.getElementById(
        "accuracy"
    ).textContent =
        accuracy + "%";


    document.getElementById(
        "wcpm"
    ).textContent =
        wcpm;


    console.log(
        "Total Words:",
        totalWords
    );

    console.log(
        "Words Detected:",
        wordsRead
    );

    console.log(
        "Correct Words:",
        correctWords
    );

    console.log(
        "WPM:",
        wpm
    );

    console.log(
        "Accuracy:",
        accuracy + "%"
    );

    console.log(
        "WCPM:",
        wcpm
    );

}


// ===============================
// CORRECT WORDS
// ===============================

function calculateCorrectWords(
    passageWords,
    spokenWords
) {

    const n =
        passageWords.length;


    const m =
        spokenWords.length;


    if (
        n === 0 ||
        m === 0
    ) {
        return 0;
    }


    let previous =
        new Array(
            m + 1
        ).fill(0);


    let current =
        new Array(
            m + 1
        ).fill(0);


    for (
        let i = 1;
        i <= n;
        i++
    ) {

        current[0] = 0;


        for (
            let j = 1;
            j <= m;
            j++
        ) {

            if (
                passageWords[i - 1] ===
                spokenWords[j - 1]
            ) {

                current[j] =
                    previous[j - 1] + 1;

            }
            else {

                current[j] =
                    Math.max(
                        previous[j],
                        current[j - 1]
                    );

            }

        }


        const temp =
            previous;

        previous =
            current;

        current =
            temp;

    }


    return previous[m];

}


// ===============================
// PAGE LOAD
// ===============================

window.addEventListener(
    "load",
    function() {

        setTotalWords();

        const timeBox =
            document.getElementById(
                "time"
            );

        if (timeBox) {
            timeBox.textContent =
                "01:00";
        }

    }
);
