import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { convoActions } from "../reducers/convoSlice";
import { emojiActions } from "../reducers/emojiSlice";
import { ask, react, ask_backchannel } from "../actions/langchainAction";
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

/*
Conversation component
main: "voice" or "text"
backchannel: "voice", "text", or "none"
inputType: "text" or "voice" (for user input, not implemented yet
*/
const Conversation = ({
  main,
  backchannelType,
  inputType,
  develop = false,
}) => {
  // TODO: save data to database
  // global states
  const dispatch = useDispatch();
  const langchain = useSelector((state) => state.langchain);
  const convo = useSelector((state) => state.convo);

  // local states
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedBackchannel, setSelectedBackchannel] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState("");
  // const [synthesizer, setSynthesizer] = useState(null);
  const [userInput, setUserInput] = useState("");
  const [lastBotMsg, setLastBotMsg] = useState("");
  const [voiceName, setVoiceName] = useState("en-US-AriaNeural");

  const [backchannelFrequency, setBackchannelFrequency] = useState(15);

  const lst = `specific list: "mmm", "yeah", "right", "wow", "okay", "sure", "hmm", "uh-huh", "gotcha", "cool".`;
  const backchannel_prompt = `  
  Based on the conversation context provided by the user, select and generate a single-word backchannel response without any special characters or punctuation like exclamation marks. These words are commonly used to indicate active listening and understanding in a conversation. Ensure that the chosen word is contextually appropriate, reflecting attentiveness or acknowledgment relevant to the specific part of the conversation provided. The response should consist solely of the selected backchannel word, without any additional content. If no backchannel word is an appropriate response, please return "...". Some examples include, if the input message is "So I’ve always felt very scared", the response could be "hmm". If the input message is "Yeah you know that feeling when you’re so pumped up" the response could be "yeah!".
  `;

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
    "I see",
    "okay",
    "uh huh",
    "huh",
    "uh",
  ];

  // Update emojiForMood based on the value of convo.reaction
  // useEffect(() => {
  //   console.log(convo.reaction);
  //   const selectedEmoji = moodToEmojiMapping[convo.reaction] || "."; // Default to a question mark if mood is not found
  //   setSelectedEmoji(selectedEmoji);
  // }, [convo.reaction]);

  // Speech recognition
  const [recognizer, setRecognizer] = useState(null); // State to store the recognizer
  const [isListening, setIsListening] = useState(false); // State to track if currently listening
  const [synthesizer, setSynthesizer] = useState(null); // State to store the synthesizer

  // Function to initialize and start speech recognition
  const startContinuousSpeechRecognition = () => {
    const speechConfig = sdk.SpeechConfig.fromSubscription(
      subscriptionKey,
      serviceRegion
    );
    speechConfig.speechRecognitionLanguage = "en-US";
    // fixes the issue of speech recognition restarting after 2 seconds of silence
    speechConfig.setProperty(
      sdk.PropertyId.Speech_SegmentationSilenceTimeoutMs,
      "5000"
    );
    const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();
    const newRecognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

    // Attach event listener for real-time speech recognition results
    newRecognizer.recognizing = (s, e) => {
      console.log(`RECOGNIZING: Text=${e.result.text}`);
      if (backchannelType === "voice") {
        console.log("backchannel voice");
        generateBackchannelBot(e.result.text);
      }
    };
    newRecognizer.recognized = (s, e) => {
      if (e.result.reason === sdk.ResultReason.RecognizedSpeech) {
        console.log(`RECOGNIZED final: Text=${e.result.text}`);
        processAudioMessage(e.result.text);
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
      // Wait for 0.5 seconds before sending stopcontinuousrecognition
      stopContinuousSpeechRecognition();
    } else {
      console.log("starting speech recognition");
      startContinuousSpeechRecognition();
    }
  };

  // Synthesizer for TTS (text-to-speech)
  // useEffect(() => {
  //   const speechConfig = sdk.SpeechConfig.fromSubscription(
  //     subscriptionKey,
  //     serviceRegion
  //   );
  //   speechConfig.speechSynthesisVoiceName = voiceName;
  //   speechConfig.speechSynthesisLanguage = "en-US";
  //   const audioConfig = sdk.AudioConfig.fromSpeakerOutput();
  //   const newSynthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

  //   // Set the synthesizer in state
  //   setSynthesizer(newSynthesizer);

  //   // Cleanup function to dispose of the synthesizer when the component unmounts
  //   return () => {
  //     if (newSynthesizer) {
  //       newSynthesizer.close();
  //     }
  //   };
  // }, []);

  const synthesizeSpeech = (text) => {
    const speechConfig = sdk.SpeechConfig.fromSubscription(
      subscriptionKey,
      serviceRegion
    );
    speechConfig.speechSynthesisVoiceName = voiceName;
    speechConfig.speechSynthesisLanguage = "en-US";
    const audioConfig = sdk.AudioConfig.fromSpeakerOutput();
    const newSynthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);
    setSynthesizer(newSynthesizer);
    newSynthesizer.speakTextAsync(
      text,
      (result) => {
        if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
          console.log("Speech synthesis completed.");
          newSynthesizer.close();
        } else {
          console.error("Speech synthesis canceled, " + result.errorDetails);
          newSynthesizer.close();
        }
        // Do not close the synthesizer here
      },
      (err) => {
        console.error("Error occurred during speech synthesis: " + err);
        // Do not close the synthesizer here
      }
    );
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
    console.log("processing message");
    let typedMessage = inputValue;
    console.log("typed message", typedMessage);
    setLastBotMsg("...");

    // if user inputType is text, check that textbox is not empty
    if (inputType === "text") {
      if (typedMessage.length === 0) {
        return;
      }
    }

    console.log("input value", inputValue);
    const inputJSON = JSON.parse(JSON.stringify(langchain.inputJSON));
    inputJSON.chat_history += historyToText(
      langchain.bot_identifier,
      langchain.human_identifier,
      langchain.history
    );
    inputJSON.inputs = inputValue;
    console.log(inputJSON);
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
      let index = 0;
      let msg = botResponse["text"];
      const intervalId = setInterval(() => {
        setLastBotMsg(msg.slice(0, index + 1));
        index++;
        if (index === msg.length) clearInterval(intervalId);
      }, 2); // Adjust the delay between characters as needed

      // text-to-speech
      if (main === "voice") {
        console.log("Synthesizing", msg);
        synthesizeSpeech(msg);
      }
    });
  };

  const processAudioMessage = (userMsg) => {
    console.log("processing audio message");
    setLastBotMsg("...");
    const inputJSON = JSON.parse(JSON.stringify(langchain.inputJSON));
    inputJSON.chat_history += historyToText(
      langchain.bot_identifier,
      langchain.human_identifier,
      langchain.history
    );
    inputJSON.inputs = userMsg;
    console.log(inputJSON);
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
      let index = 0;
      let msg = botResponse["text"];

      // text-to-speech
      if (main === "voice") {
        console.log("Synthesizing", msg);
        synthesizeSpeech(msg);
      }

      // display bot message character by character
      const intervalId = setInterval(() => {
        setLastBotMsg(msg.slice(0, index + 1));
        index++;
        if (index === msg.length) clearInterval(intervalId);
      }, 2); // Adjust the delay between characters as needed
    });
  };

  // Generate bot response after user submits message
  const handleMessageSubmit = (e) => {
    setSelectedBackchannel(""); // Clear backchannel
    setLastBotMsg(""); // Clear last bot message
    setInputValue(""); // Clear input value
    setIsTyping(false); // Set isTyping to false (changes bot avatar)
    e.preventDefault();
    processMessage(); // Process message
  };

  // Generate backchannel while user types
  const handleMessageChange = async (e) => {
    console.log("handle message change");
    const message = e.target.value;
    setInputValue(message);
    setIsTyping(true);

    if (message === "") {
      dispatch(convoActions.reset());
    } else {
      // const inputJSON = { inputs: message };
      // dispatch(react(inputJSON));

      // handle backchannel
      if (message.length % backchannelFrequency == 0) {
        generateBackchannelBot(message);
      }
    }
  };

  const generateBackchannelBot = async (message) => {
    console.log("checking for backchannel...");
    if (
      backchannelType != "none" &&
      message.length % backchannelFrequency == 0
    ) {
      console.log("generating backchannel...");
      dispatch(ask_backchannel(backchannel_prompt, message)).then(
        (botResponse) => {
          if (botResponse == "...") {
            return;
          }
          console.log("backchannel", botResponse);
          const backchannelText = botResponse + "...";
          let index = 0;
          // text-to-speech
          if (backchannelType == "voice") {
            synthesizeSpeech(backchannelText);
          }

          const backchannelInterval = setInterval(() => {
            setSelectedBackchannel(backchannelText.slice(0, index));
            index++;
            if (index > backchannelText.length) {
              clearInterval(backchannelInterval);
            }
          }, 100);
        }
      );
    }
  };

  // Create a ref for the convo-history-container
  const convoHistoryRef = useRef(null);

  // Scroll the convo-history-container to the bottom
  const scrollToBottom = () => {
    if (convoHistoryRef.current) {
      convoHistoryRef.current.scrollTop = convoHistoryRef.current.scrollHeight;
    }
  };

  // Scroll to bottom whenever langchain.history changes
  useEffect(() => {
    scrollToBottom();
  }, [lastBotMsg]);

  const handleSliderChange = (event) => {
    setBackchannelFrequency(event.target.value);
  };

  // frontend
  return (
    <div className="conversation">
      <h1>KeenChat</h1>
      {develop ? (
        <div className="bc_slider" style={{ paddingBottom: "20px" }}>
          <label htmlFor="backchannel-slider" style={{ paddingRight: "20px" }}>
            Backchannel Frequency: {backchannelFrequency}
          </label>
          <input
            type="range"
            id="backchannel-slider"
            name="backchannel-slider"
            value={backchannelFrequency}
            onChange={handleSliderChange}
            min={1}
            max={30}
            style={{ width: "70%" }}
          />
        </div>
      ) : null}

      <div className="convo-history-container" ref={convoHistoryRef}>
        {langchain.history.slice(0, -1).map((history, index) => (
          <div key={index}>
            <div className="human-convo">
              {/* <span>{langchain.human_identifier}</span> */}
              <p>{history[langchain.human_identifier]}</p>
            </div>

            <div className="bot-convo">
              {/* <span>{langchain.bot_identifier}</span> */}
              <p>{history[langchain.bot_identifier]}</p>
            </div>
          </div>
        ))}
        {langchain.history.slice(-1).map((history, index) => (
          <div key={index}>
            <div className="human-convo">
              {/* <span>{langchain.human_identifier}</span> */}
              <p>{history[langchain.human_identifier]}</p>
            </div>

            <div className="bot-convo">
              {/* <span>{langchain.bot_identifier}</span> */}
              <p>{lastBotMsg}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bot-avatar-backchannel">
        {inputType === "text" ? (
          <img src={isTyping ? bot_listen : bot_talk} id="bot_avatar_img" />
        ) : (
          <img src={isListening ? bot_listen : bot_talk} id="bot_avatar_img" />
        )}
        <span>Bot </span>

        {backchannelType === "text" ? (
          <div className="backchannel_container" style={{ marginLeft: "20px" }}>
            <p style={{ display: "inline" }}>{selectedBackchannel} </p>
            <p
              style={{
                display: "inline",
                fontStyle: "normal",
                color: "transparent",
              }}
            >
              ...
            </p>
          </div>
        ) : null}
      </div>

      {inputType === "text" ? (
        <form onSubmit={handleMessageSubmit} className="message-form">
          <TextField
            value={inputValue}
            onChange={handleMessageChange}
            label="Type a message"
            className="message-input"
            autoComplete="off"
            style={{ borderRadius: "10px 0px 0px 10px" }}
          />
          <Button
            type="submit"
            variant="contained"
            className="send-button"
            style={{
              borderRadius: "0px 10px 10px 0px",
              boxShadow: "none",
              background: "black",
              color: "white",
            }}
          >
            Send
            {/* <i className="fa-solid fa-paper-plane"></i> */}
          </Button>
        </form>
      ) : (
        <Button
          className="voice-input-button"
          onClick={toggleContinuousSpeechRecognition}
          style={{
            fontSize: "14px",
            background: isListening ? "red" : "black",
            color: "white",
            marginTop: "20px",
          }}
          disableRipple
        >
          <i
            className="fa-solid fa-microphone"
            style={{ marginRight: "10px" }}
          ></i>
          {isListening ? "Stop Listening" : "Start Listening"}
        </Button>
      )}
    </div>
  );
};

export default Conversation;
