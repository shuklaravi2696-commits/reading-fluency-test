
}let mediaRecorder;
let audioChunks = [];
let timerInterval;
let remainingTime = 60;
let recordingStartTime;
let audioURL = null;

async function startTest() {

    try {

        // Microphone permission
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true
        });

        // Check browser recording support
        if (!window.MediaRecorder) {
            alert("This browser does not support audio recording.");
            return;
        }

        mediaRecorder = new MediaRecorder(stream);

        audioChunks = [];

        // Recording data
        mediaRecorder.ondataavailable = function(event) {

            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }

        };

        // When recording stops
        mediaRecorder.onstop = function() {

            const audioBlob = new Blob(audioChunks, {
                type: "audio/webm"
            });

            audioURL = URL.createObjectURL(audioBlob);

            // Create audio player
            let audioPlayer = document.getElementById("audioPlayer");

            if (!audioPlayer) {

                audioPlayer = document.createElement("audio");

                audioPlayer.id = "audioPlayer";

                audioPlayer.controls = true;

                audioPlayer.style.width = "100%";

                document.body.appendChild(audioPlayer);
            }

            audioPlayer.src = audioURL;

            // Recording proof
            document.getElementById("recordingStatus").textContent =
                "✅ Recording completed — Play the audio below to verify.";

            document.getElementById("recordingStatus").style.color = "green";

        };


        // START RECORDING
        mediaRecorder.start();

        recordingStartTime = Date.now();

        remainingTime = 60;

        document.getElementById("startBtn").disabled = true;

        document.getElementById("stopBtn").disabled = false;


        // Visible recording proof
        document.getElementById("recordingStatus").textContent =
            "🔴 RECORDING NOW...";

        document.getElementById("recordingStatus").style.color = "red";


        updateTimer();


        // 1 minute countdown
        timerInterval = setInterval(function() {

            remainingTime--;

            updateTimer();

            if (remainingTime <= 0) {

                stopTest();

            }

        }, 1000);

    }

    catch (error) {

        console.error(error);

        alert(
            "Microphone access नहीं मिला। Browser में microphone permission Allow करें."
        );

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

    if (mediaRecorder &&
        mediaRecorder.state !== "inactive") {

        mediaRecorder.stop();

        mediaRecorder.stream
            .getTracks()
            .forEach(track => track.stop());

    }

    document.getElementById("startBtn").disabled = false;

    document.getElementById("stopBtn").disabled = true;

    document.getElementById("time").textContent = "00:00";

}
