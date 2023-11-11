import { useState, useEffect } from "react";
import axios from "axios";

const AudioComponent = () => {
  // Function to convert text to audio using ElevenLabs API
  const convertTextToAudio = async (textToConvert) => {
    // Set the API key for ElevenLabs API
    const apiKey = "5e8fc541c60a889eb2548d69bbdc94d8";
    console.log(apiKey);

    // ID of voice to be used for speech
    const voiceId = "21m00Tcm4TlvDq8ikWAM";

    // API request options
    const apiRequestOptions = {
      method: "POST",
      url: `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      headers: {
        accept: "audio/mpeg",
        "content-type": "application/json",
        "xi-api-key": apiKey,
      },
      data: {
        text: textToConvert,
      },
      responseType: "arraybuffer", // To receive binary data in response
    };

    // Sending the API request and waiting for response
    const apiResponse = await axios.request(apiRequestOptions);

    // Return the binary audio data received from API
    return apiResponse.data;
  };

  // Asynchronous function to fetch audio data and update state variable
  const fetchAndUpdateAudioData = async (textToConvert) => {
    console.log(textToConvert);
    const audioData = await convertTextToAudio(textToConvert);
    const audioBlob = new Blob([audioData], { type: "audio/mpeg" });
    const blobUrl = URL.createObjectURL(audioBlob);

    const audioElement = document.getElementById("audioElement");
    if (audioElement && blobUrl) {
      // Start audio playback programmatically
      audioElement.src = blobUrl;
      audioElement.load();
      audioElement.play();
    }
  };

  // Function to handle button click
  const handleButtonClick = () => {
    // Update the text to be converted
    console.log("Button clicked");
    const words = ["Uh-huh", "Oh...", "Hmm...", "Yeah...", "I see..."];
    const textToConvert = words[Math.floor(Math.random() * words.length)];
    fetchAndUpdateAudioData(textToConvert);
  };

  // Render an audio element when source URL is available
  return (
    <div>
      <h1>Audio Test</h1>
      <div>
        <button onClick={handleButtonClick}>Change Text and Convert</button>
      </div>
      <div>
        <audio id="audioElement" controls style={{ display: "none" }}>
          <source src="" type="audio/mpeg" />
        </audio>
      </div>
    </div>
  );
};

export default AudioComponent;
