
let recognition;

function startTest() {

    const status = document.getElementById("recordingStatus");

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    if (!SpeechRecognition) {

        status.textContent =
            "❌ Hindi Speech Recognition इस browser में उपलब्ध नहीं है। Chrome में खोलें।";

        status.style.color = "red";

        return;
    }

    recognition = new SpeechRecognition();

    recognition.lang = "hi-IN";

    recognition.continuous = true;

    recognition.interimResults = true;


    recognition.onstart = function() {

        status.textContent =
            "🔴 सुन रहा हूँ... अब बोलिए";

        status.style.color = "red";

    };


    recognition.onresult = function(event) {

        let text = "";

        for (
            let i = 0;
            i < event.results.length;
            i++
        ) {

            text +=
                event.results[i][0].transcript + " ";

        }


        status.textContent =
            "🎤 सुना गया: " + text;

        status.style.color = "green";

        console.log("Recognized:", text);

    };


    recognition.onerror = function(event) {

        status.textContent =
            "❌ Error: " + event.error;

        status.style.color = "red";

        console.log("Speech Error:", event.error);

    };


    recognition.onend = function() {

        status.textContent =
            "⏹️ सुनना बंद हुआ";

    };


    try {

        recognition.start();

    }
    catch (error) {

        status.textContent =
            "❌ Recognition start नहीं हुआ";

        console.log(error);

    }

}


function stopTest() {

    if (recognition) {

        recognition.stop();

    }

}
