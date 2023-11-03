import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";

import { convoActions } from "../reducers/convoSlice";
import { emojiActions } from "../reducers/emojiSlice";
import { ask, react } from "../actions/langchainAction";
import "../styles/Conversation.css";

import { TextField, Button } from "@mui/material";
import ReactionEmoji from "./ReactionEmoji";
import bot from "../assets/bot.png";
import botListening from "../assets/bot_listening.png";
import logo from "../assets/logo192.png"; // Adjust the path as needed

// Conversation component
// type: none, static, animated
const Conversation = ({ type }) => {
  // dispatch function
  const backchannels = ["yeah", "oh", "ah", "hmm", "mhm"];
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
    e.preventDefault();
      // Reset the robot's mode to normal
    setIsTyping(false);
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
  const handleMessageChange = (e) => {
    const message = e.target.value;
    setInputValue(message);

    // Check if the message is not empty and set isTyping accordingly
    if (message.trim() !== "") {
      setIsTyping(true);
    } else {
      setIsTyping(false);
    }

    if (message === "") {
      dispatch(convoActions.reset());
    } else {
      const inputJSON = { inputs: message };
      dispatch(react(inputJSON));

      // handle backchannel
      const msgLength = message.length;
      const randBinary = Math.random();
      // Generate a random integer between 5 and 20
      const randomMultiplier = Math.floor(Math.random() * (16)) + 5;

      if ((msgLength % randomMultiplier === 0) & (randBinary < 0.5)) {
        const backchannel =
          backchannels[Math.floor(Math.random() * backchannels.length)];
        setSelectedBackchannel(backchannel + "...");
      
        // Split the backchannel into individual letters
        const letters = backchannel.split("")
        let currentIndex = 0;
        setSelectedBackchannel(letters[currentIndex]);

        const interval = setInterval(() => {
          currentIndex++;
          if (currentIndex < backchannel.length-1) {
            setSelectedBackchannel((prevBackchannel) => prevBackchannel + letters[currentIndex]);
          } else {
            setSelectedBackchannel((prevBackchannel) => prevBackchannel + letters[currentIndex] + "...");
            clearInterval(interval);
          }
        }, 200); // Adjust the interval time as needed
      }
    }
  };

  useEffect(() => {
    // Update emojiForMood based on the value of convo.reaction
    const selectedEmoji = moodToEmojiMapping[convo.reaction] || ""; // Default to a question mark if mood is not found
    setSelectedEmoji(selectedEmoji);
  }, [convo.reaction]);

  return (
    <div className="conversation">
       <div className="bot_avatar">
        <img src={logo} id="bot_avatar_img" />
        <span>KeenChat</span>
      </div>     
     
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

      <div className="avatar-backchannel-container">
        <div className="bot_avatar">
        <img
            src={isTyping ? botListening : bot} // Use "listening mode" image when isTyping is true
            id="bot_avatar_img"
          />
          <span>Bot</span>
        </div>
        <div className="backchannel_container">
          <p style={{ display: "inline" }}>{selectedBackchannel}</p>
          <p style={{ display: "inline", fontStyle: "normal" }}>{selectedEmoji}</p>
        </div>
      </div>


      <div>
        {type && convo.reaction !== "" && (
          <ReactionEmoji reaction={convo.reaction} type={type} />
        )}
        <p>{convo.reaction}</p>
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
