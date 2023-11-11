import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";

import { convoActions } from "../reducers/convoSlice";
import { emojiActions } from "../reducers/emojiSlice";
import { ask, react } from "../actions/langchainAction";
import "../styles/Conversation.css";

import { TextField, Button } from "@mui/material";
import ReactionEmoji from "./ReactionEmoji";
import bot_talk from "../assets/bot-talk.png";
import bot_listen from "../assets/bot-listen.png";
import { OpenAIApi } from "openai";
import axios from "axios";

// const { OpenAIApi } = require("openai");
// const client = new OpenAIApi({
//   api_key: process.env.REACT_APP_OPENAI_API_TOKEN,
// });
const openai = new OpenAIApi(process.env.REACT_APP_OPENAI_API_TOKEN);

// Conversation component
// type: none, static, animated
const Conversation = ({ type }) => {
  // dispatch function
  const backchannels = [
    "yeah",
    "oh",
    "ah",
    "hmm",
    "mhm",
    "I see",
    "okay",
    "uh huh",
    "huh",
    "uh",
  ];
  const dispatch = useDispatch();

  // global states
  const langchain = useSelector((state) => state.langchain);
  const convo = useSelector((state) => state.convo);
  console.log(convo.reaction);
  const emoji = useSelector((state) => state.emoji);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedBackchannel, setSelectedBackchannel] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState("");
  const [sourceUrl, setSourceUrl] = useState(null);
  const [voiceBackchannel, setVoiceBackchannel] = useState("hello");

  // confusion, anger, neutral, sadness, joy, admiration, fear, nervousness
  const moodToEmojiMapping = {
    confusion: "😕",
    anger: "😡",
    neutral: "",
    sadness: "😢",
    joy: "😄",
    admiration: "😍",
    fear: "😱",
    nervousness: "😬",
    disapproval: "😕",
    disgust: "😢",
  };

  // get chat history from JSON
  const historyToText = (botIdentifier, humanIdentifier, historyJSON) => {
    let text = "";
    console.log("history to text");
    console.log(historyJSON);
    for (let i = 0; i < historyJSON.length; i++) {
      // msg is by human
      if (historyJSON[i][humanIdentifier].length > 0) {
        text += `${humanIdentifier}: ` + historyJSON[i][humanIdentifier] + "\n";
      }
      // msg is by bot
      if (historyJSON[i][botIdentifier].length > 0) {
        text += `${botIdentifier}: ` + historyJSON[i][botIdentifier] + "\n";
      }
    }

    return text;
  };

  // handle message submit (add to chat history)
  const handleMessageSubmit = (e) => {
    setSelectedBackchannel("");
    setIsTyping(false);
    e.preventDefault();
    if (inputValue.trim() !== "") {
      const inputJSON = JSON.parse(JSON.stringify(langchain.inputJSON));
      inputJSON.chat_history += historyToText(
        langchain.bot_identifier,
        langchain.human_identifier,
        langchain.history
      );
      inputJSON.inputs = inputValue;

      // set emoji
      if (type) {
        dispatch(emojiActions.reset());
      }

      // dispatch convo reset
      dispatch(convoActions.reset());
      dispatch(
        ask(
          langchain.prompt,
          langchain.bot_identifier,
          langchain.human_identifier,
          inputJSON
        )
      );

      // reset input value to empty
      setInputValue("");
    }
  };

  // handle message change (input value)
  const handleMessageChange = async (e) => {
    const message = e.target.value;
    setInputValue(message);
    setIsTyping(true);

    if (message === "") {
      dispatch(convoActions.reset());
    } else {
      const inputJSON = { inputs: message };
      dispatch(react(inputJSON));

      // handle backchannel
      const msgLength = message.length;
      const randBinary = Math.random();
      const msgInterval = 7;
      if ((msgLength % msgInterval == 0) & (randBinary < 0.4)) {
        // Select a random backchannel from the backchannels array
        // const backchannel =
        //   backchannels[Math.floor(Math.random() * backchannels.length)];
        const randomIndex = Math.floor(Math.random() * backchannels.length);
        const backchannel = backchannels[randomIndex];
        const backchannelText = `${backchannel}...`;
        setSelectedBackchannel(backchannelText);
        setVoiceBackchannel(backchannel);

        // Use setInterval to update the backchannel one letter at a time
        let index = 0;
        const backchannelInterval = setInterval(() => {
          setSelectedBackchannel(backchannelText.slice(0, index));
          index++;
          // When the backchannel is fully shown, clear the interval
          if (index > backchannelText.length) {
            clearInterval(backchannelInterval);
          }
        }, 100);
        fetchAndUpdateAudioData(backchannel);
      }
    }
  };

  // Function to convert text to audio using ElevenLabs API
  const convertTextToAudio = async (textToConvert) => {
    // Set the API key for ElevenLabs API
    const apiKey = "5e8fc541c60a889eb2548d69bbdc94d8";

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

  // const speakBackchannel = async (text) => {
  //   console.log("Speaking backchannel");
  //   // console.log(client);
  //   console.log("Printing openai");
  //   console.log(openai);
  //   try {
  //     console.log("Trying to create audio");
  //     const mp3 = await openai.audio.speech.create({
  //       model: "tts-1",
  //       voice: "alloy",
  //       input: text,
  //     });

  //     const buffer = Buffer.from(await mp3.arrayBuffer());
  //     const audioElement = new Audio(URL.createObjectURL(new Blob([buffer])));
  //     audioElement.play();
  //   } catch (error) {
  //     console.error("Error in TTS service:", error);
  //   }
  // };

  useEffect(() => {
    // Update emojiForMood based on the value of convo.reaction
    console.log(convo.reaction);
    const selectedEmoji = moodToEmojiMapping[convo.reaction] || "."; // Default to a question mark if mood is not found
    setSelectedEmoji(selectedEmoji);
  }, [convo.reaction]);

  return (
    <div className="conversation">
      <h1>KeenChat</h1>

      <div className="convo-history-container">
        {langchain.history.map((history, index) => (
          <div key={index}>
            <div className="human-convo">
              {/* <span>{langchain.human_identifier}</span> */}
              <p>{history[langchain.human_identifier]}</p>
            </div>

            <div className="bot-convo">
              {/* <span>{langchain.bot_identifier}</span> */}
              <p>
                {index === langchain.history.length - 1
                  ? convo.output
                  : history[langchain.bot_identifier]}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div>
        <audio id="audioElement" controls style={{ display: "none" }}>
          <source src="" type="audio/mpeg" />
        </audio>
        <img src={isTyping ? bot_listen : bot_talk} id="bot_avatar_img" />
        <span>Bot </span>
        <div className="backchannel_container" style={{ marginLeft: "20px" }}>
          <p style={{ display: "inline" }}>{selectedBackchannel}</p>
          <p style={{ display: "inline", fontStyle: "normal" }}>
            {selectedEmoji}
          </p>
        </div>
      </div>

      <div>
        {type && convo.reaction !== "" && (
          <ReactionEmoji reaction={convo.reaction} type={type} />
        )}
        {/* <p>{convo.reaction}</p> */}
      </div>

      <form onSubmit={handleMessageSubmit} className="message-form">
        <TextField
          value={inputValue}
          onChange={handleMessageChange}
          label="Type a message"
          className="message-input"
          autoComplete="off"
        />
        <Button type="submit" variant="contained" className="send-button">
          Send
        </Button>
      </form>
    </div>
  );
};

export default Conversation;
