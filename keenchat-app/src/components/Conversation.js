import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";

import { convoActions } from "../reducers/convoSlice";
import { langchainActions } from "../reducers/langchainSlice";
import { ask } from "../actions/langchainAction";
import "../styles/Conversation.css";

import { TextField, Button } from "@mui/material";


const Conversation = () => {
  const dispatch = useDispatch();
  const langchain = useSelector((state) => state.langchain);
  const convo = useSelector((state) => state.convo);
  const [inputValue, setInputValue] = useState("");

  const historyToText = (botIdentifier, humanIdentifier, historyJSON) => {
    let text = "";
    // console.log("history to text");
    // console.log(historyJSON);
    for (let i = 0; i < historyJSON.length; i++) {
      if (historyJSON[i][humanIdentifier].length > 0) {
        text += `${humanIdentifier}: ` + historyJSON[i][humanIdentifier] + "\n";
      }
      if (historyJSON[i][botIdentifier].length > 0) {
        text += `${botIdentifier}: ` + historyJSON[i][botIdentifier] + "\n";
      }
    }

    return text;
  };

  const handleMessageSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim() !== "") {
      const inputJSON = JSON.parse(JSON.stringify(langchain.inputJSON));
      inputJSON.chat_history += historyToText(
        langchain.bot_identifier,
        langchain.human_identifier,
        langchain.history
      );
      inputJSON.input = inputValue;

      dispatch(convoActions.reset());
      dispatch(
        ask(
          langchain.prompt,
          langchain.bot_identifier,
          langchain.human_identifier,
          inputJSON
        )
      );
      setInputValue("");
    }
  };

  return (
    <div className="conversation">
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
      <form onSubmit={handleMessageSubmit} className="message-form">
        <TextField
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          label="Type a message"
          className="message-input"
        />
        <Button type="submit" variant="contained" className="send-button">
          Send
        </Button>
      </form>
    </div>
  );
};

export default Conversation;
