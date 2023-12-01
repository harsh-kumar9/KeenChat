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
import * as sdk from "microsoft-cognitiveservices-speech-sdk";

// Azure Speech Services credentials
var subscriptionKey = process.env.REACT_APP_AZURE_SPEECH_KEY;
var serviceRegion = process.env.REACT_APP_AZURE_SPEECH_REGION; // e.g., "westus"

// Conversation component
// main: "voice" or "text"
// backchannel: "voice", "text", or "none"
// inputType: "text" or "voice" (for user input, not implemented yet
const Conversation = ({ main, backchannelType, inputType }) => {
  // global states
  const dispatch = useDispatch();
  const langchain = useSelector((state) => state.langchain);
  const convo = useSelector((state) => state.convo);

  // local states
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedBackchannel, setSelectedBackchannel] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState("");
  const [synthesizer, setSynthesizer] = useState(null);
  const [userInput, setUserInput] = useState("");

  // constants
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

  // Update emojiForMood based on the value of convo.reaction
  useEffect(() => {
    console.log(convo.reaction);
    const selectedEmoji = moodToEmojiMapping[convo.reaction] || "."; // Default to a question mark if mood is not found
    setSelectedEmoji(selectedEmoji);
  }, [convo.reaction]);

  // Speech recognition
  const [recognizer, setRecognizer] = useState(null); // State to store the recognizer
  const [isListening, setIsListening] = useState(false); // State to track if currently listening

  // Function to initialize and start speech recognition
  const startContinuousSpeechRecognition = () => {
    const speechConfig = sdk.SpeechConfig.fromSubscription(
      subscriptionKey,
      serviceRegion
    );
    speechConfig.speechRecognitionLanguage = "en-US";
    const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();
    const newRecognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

    // Attach event listener for real-time speech recognition results
    newRecognizer.recognizing = (s, e) => {
      console.log(`RECOGNIZING: Text=${e.result.text}`);
      if (backchannelType === "voice") {
        generateBackchannel(e.result.text, 3, 1);
      }
    };

    newRecognizer.recognized = (s, e) => {
      if (e.result.reason === sdk.ResultReason.RecognizedSpeech) {
        console.log(`RECOGNIZED final: Text=${e.result.text}`);
        setInputValue(e.result.text); // Final update to inputValue
      }
    };

    // Start continuous recognition
    newRecognizer.startContinuousRecognitionAsync();
    setRecognizer(newRecognizer);
    setIsListening(true);
  };

  // Function to stop speech recognition
  const stopContinuousSpeechRecognition = () => {
    if (recognizer) {
      // Set a timeout to delay the stop function
      recognizer.stopContinuousRecognitionAsync(
        () => {
          console.log("Recognition stopped");
          setIsListening(false);
          processMessage(); // Process the final message
        },
        (error) => {
          console.error("Error stopping recognition:", error);
        }
      );
      setRecognizer(null);
    }
  };

  const toggleContinuousSpeechRecognition = () => {
    if (isListening) {
      // TODO: doesn't work if user stops listening before speech is recognized
      // ie. need to wait ~0.5s after you stop talking before you can press "stop listening"
      // how to make sure speech is recognized before stopping?
      console.log("stopping speech recognition");
      stopContinuousSpeechRecognition();
    } else {
      console.log("starting speech recognition");
      startContinuousSpeechRecognition();
    }
  };
  // Function to initialize and start speech recognition
  const startSpeechRecognition = () => {
    const speechConfig = sdk.SpeechConfig.fromSubscription(
      subscriptionKey,
      serviceRegion
    );
    speechConfig.speechRecognitionLanguage = "en-US";
    const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();
    const newRecognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

    newRecognizer.recognizeOnceAsync((result) => {
      if (result.reason === sdk.ResultReason.RecognizedSpeech) {
        setUserInput(result.text);
        console.log("RECOGNIZED: Text=" + result.text);
      } else {
        console.log("ERROR: Speech was cancelled or could not be recognized.");
      }
      stopSpeechRecognition(); // Stop listening after speech is recognized
    });

    setRecognizer(newRecognizer);
    setIsListening(true);
  };

  // Function to stop speech recognition
  const stopSpeechRecognition = () => {
    if (recognizer) {
      recognizer.stopContinuousRecognitionAsync();
      setIsListening(false);
    }
  };
  // Toggle function for starting/stopping speech recognition
  const toggleSpeechRecognition = () => {
    if (isListening) {
      console.log("stopping speech recognition");
      stopSpeechRecognition();
      processMessage();
    } else {
      console.log("starting speech recognition");
      startSpeechRecognition();
    }
  };

  // Synthesizer for TTS (text-to-speech)
  useEffect(() => {
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

  // Get chat history from JSON
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

  const processMessage = () => {
    if (inputValue.trim() !== "") {
      const inputJSON = JSON.parse(JSON.stringify(langchain.inputJSON));
      inputJSON.chat_history += historyToText(
        langchain.bot_identifier,
        langchain.human_identifier,
        langchain.history
      );
      inputJSON.inputs = inputValue;

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
        // reset input value to empty
        setInputValue("");

        // text-to-speech
        if (main === "voice") {
          synthesizeSpeech(botResponse["text"]);
        }
      });
    }
  };
  // Generate bot response after user submits message
  const handleMessageSubmit = (e) => {
    setSelectedBackchannel("");
    setIsTyping(false);
    e.preventDefault();
    processMessage();
  };

  // Generate backchannel while user types
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
      generateBackchannel(message);
    }
  };

  const generateBackchannel = (
    message,
    msgInterval = 7,
    msgProbability = 0.5
  ) => {
    console.log("checking for backchannel...");
    if (backchannelType != "none") {
      const msgLength = message.length;
      const randBinary = Math.random();
      if ((msgLength % msgInterval == 0) & (randBinary < msgProbability)) {
        // Select a random backchannel from the backchannels array
        // const backchannel =
        //   backchannels[Math.floor(Math.random() * backchannels.length)];
        const randomIndex = Math.floor(Math.random() * backchannels.length);
        const backchannel = backchannels[randomIndex];
        const backchannelText = `${backchannel}...`;
        setSelectedBackchannel(backchannelText);
        console.log("backchannel: " + backchannel);

        // text-to-speech
        if (backchannelType == "voice") {
          synthesizeSpeech(backchannel);
        }
        // Use setInterval to update the backchannel one letter at a time
        let index = 0;
        const backchannelInterval = setInterval(() => {
          setSelectedBackchannel(backchannelText.slice(0, index));
          index++;
          if (index > backchannelText.length) {
            clearInterval(backchannelInterval);
          }
        }, 100);
      }
    }
  };

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

      <div className="bot-avatar-backchannel">
        <img src={isTyping ? bot_listen : bot_talk} id="bot_avatar_img" />
        <span>Bot </span>

        {backchannelType === "text" ? (
          <div className="backchannel_container" style={{ marginLeft: "20px" }}>
            <p style={{ display: "inline" }}>{selectedBackchannel}</p>
            <p style={{ display: "inline", fontStyle: "normal" }}>
              {selectedEmoji}
            </p>
          </div>
        ) : null}
      </div>

      {inputType === "text" ? (
        <form
          onSubmit={handleMessageSubmit}
          className="message-form"
          style={{ marginTop: "20px" }}
        >
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
      ) : (
        <Button
          className="voice-input-button"
          onClick={toggleContinuousSpeechRecognition}
        >
          {isListening ? "Stop Listening" : "Start Listening"}
        </Button>
      )}
    </div>
  );
};

export default Conversation;
