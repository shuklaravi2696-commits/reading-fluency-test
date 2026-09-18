let startTime;
let timerInterval;

let mediaRecorder;
let audioChunks = [];

function countWords(text) {
    return text.trim()
        .split(/\s+/)
        .filter(word => word.length > 0)
        .length;
}

async function startTest() {

    try {

        // Ask for microphone permission
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true
        });

        // Start recording
        mediaRecorder = new MediaRecorder(stream);

        audioChunks = [];

        mediaRecorder.ondataavailable = function(event) {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };

        mediaRecorder.start();

        // Start timer
        startTime = Date.now();

        document.getElementById("startBtn").disabled = true;
        document.getElementById("stopBtn").disabled = false;

        timerInterval = setInterval(updateTimer, 1000);

        console.log("Recording started");

    } catch (error) {

        alert("Microphone permission is required to start the test.");

        console.error(error);
    }
}

function updateTimer() {

    let elapsed = Math.floor(
        (Date.now() - startTime) / 1000
    );

    let minutes = Math.floor(elapsed / 60);

    let seconds = elapsed % 60;

    minutes = String(minutes).padStart(2, "0");
    seconds = String(seconds).padStart(2, "0");

    document.getElementById("time").textContent =
        `${minutes}:${seconds}`;
}

function stopTest() {

    clearInterval(timerInterval);

    if (mediaRecorder && mediaRecorder.state !== "inactive") {

        mediaRecorder.stop();

        // Stop microphone
        mediaRecorder.stream.getTracks().forEach(track => {
            track.stop();
        });
    }

    let elapsedSeconds =
        (Date.now() - startTime) / 1000;

    let passage =
        document.getElementById("passage").value;

    let words =
        countWords(passage);

    let minutes =
        elapsedSeconds / 60;

    let wpm =
        minutes > 0
            ? Math.round(words / minutes)
            : 0;

    document.getElementById("wordsRead").textContent =
        words;

    document.getElementById("wpm").textContent =
        wpm;

    document.getElementById("startBtn").disabled = false;
    document.getElementById("stopBtn").disabled = true;

    console.log("Recording stopped");
}
