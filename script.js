
let startTime;
let timerInterval;
let remainingTime = 60;

let mediaRecorder;
let audioChunks = [];

async function startTest() {

    try {

        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true
        });

        mediaRecorder = new MediaRecorder(stream);

        audioChunks = [];

        mediaRecorder.ondataavailable = function(event) {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };

        mediaRecorder.start();

        startTime = Date.now();
        remainingTime = 60;

        document.getElementById("startBtn").disabled = true;
        document.getElementById("stopBtn").disabled = false;

        updateTimer();

        timerInterval = setInterval(function() {

            remainingTime--;

            updateTimer();

            if (remainingTime <= 0) {
                stopTest();
            }

        }, 1000);

    } catch (error) {

        alert("Microphone permission is required.");

        console.error(error);
    }
}


function updateTimer() {

    let minutes = Math.floor(remainingTime / 60);

    let seconds = remainingTime % 60;

    minutes = String(minutes).padStart(2, "0");
    seconds = String(seconds).padStart(2, "0");

    document.getElementById("time").textContent =
        `${minutes}:${seconds}`;
}


function stopTest() {

    clearInterval(timerInterval);

    if (mediaRecorder && mediaRecorder.state !== "inactive") {

        mediaRecorder.stop();

        mediaRecorder.stream.getTracks().forEach(track => {
            track.stop();
        });
    }

    document.getElementById("startBtn").disabled = false;
    document.getElementById("stopBtn").disabled = true;

    document.getElementById("time").textContent = "00:00";

    console.log("Recording stopped");
}
