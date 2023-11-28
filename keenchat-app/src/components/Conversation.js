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
import * as sdk from "microsoft-cognitiveservices-speech-sdk";

// replace with your own subscription key,
// service region (e.g., "westus"), and
// the name of the file you save the synthesized audio.
var subscriptionKey = "86be001229f24a638dd9ccfc0b443de5";
var serviceRegion = "eastus"; // e.g., "westus"

// const { OpenAIApi } = require("openai");
// const client = new OpenAIApi({
//   api_key: process.env.REACT_APP_OPENAI_API_TOKEN,
// });
const openai = new OpenAIApi(process.env.REACT_APP_OPENAI_API_TOKEN);

// Conversation component
// type: none, static, animated
const Conversation = ({ type }) => {
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
  // we are done with the setup

  // Define state for synthesizer to manage its lifecycle
  const [synthesizer, setSynthesizer] = useState(null);

  // useEffect hook to instantiate and dispose of the synthesizer
  useEffect(() => {
    // Instantiate the synthesizer
    const speechConfig = sdk.SpeechConfig.fromSubscription(
      subscriptionKey,
      serviceRegion
    );
    const audioConfig = sdk.AudioConfig.fromSpeakerOutput();
    const newSynthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

    // Set the synthesizer in state
    setSynthesizer(newSynthesizer);

    // Cleanup function to dispose of the synthesizer when the component unmounts
    return () => {
      if (newSynthesizer) {
        newSynthesizer.close();
      }
    };
  }, []);

  const synthesizeSpeech = (text) => {
    if (synthesizer) {
      synthesizer.speakTextAsync(
        text,
        (result) => {
          if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
            console.log("Speech synthesis completed.");
          } else {
            console.error("Speech synthesis canceled, " + result.errorDetails);
          }
          // Do not close the synthesizer here
        },
        (err) => {
          console.error("Error occurred during speech synthesis: " + err);
          // Do not close the synthesizer here
        }
      );
    } else {
      console.error("Synthesizer not initialized.");
    }
  };

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
    let botMsg = "";
    for (let i = 0; i < historyJSON.length; i++) {
      // msg is by human
      if (historyJSON[i][humanIdentifier].length > 0) {
        text += `${humanIdentifier}: ` + historyJSON[i][humanIdentifier] + "\n";
      }
      // msg is by bot
      if (historyJSON[i][botIdentifier].length > 0) {
        botMsg = historyJSON[i][botIdentifier];
        text += `${botIdentifier}: ` + botMsg + "\n";
      }
    }

    return text;
  };

  // Main message
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

      // get bot message
      dispatch(
        ask(
          langchain.prompt,
          langchain.bot_identifier,
          langchain.human_identifier,
          inputJSON
        )
      ).then((botResponse) => {
        // Access the bot's response from the state or wherever it is stored
        // console.log(langchain);
        // const botResponse = langchain.botResponse; // Replace with the actual state structure

        synthesizeSpeech(botResponse["text"]);

        // reset input value to empty
        setInputValue("");
      });
    }
  };

  // Backchannel
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
        // fetchAndUpdateAudioData(backchannel);
        synthesizeSpeech(backchannel);
      }
    }
  };

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
