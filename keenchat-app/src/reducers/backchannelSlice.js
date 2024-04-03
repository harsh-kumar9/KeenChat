import { createSlice } from "@reduxjs/toolkit";

const prompt = `The following is a friendly conversation between a human and an AI. 
The AI is talkative and provides lots of specific details from its context. 
If the AI does not know the answer to a question, it truthfully says it does not know.

Current conversation:
{chat_history}
Human: {inputs}
AI:`;

const langchainSlice = createSlice({
  name: "langchainSlice",
  initialState: {
    prompt: prompt,
    bot_identifier: "AI",
    human_identifier: "Human",
    inputJSON: {
      chat_history: "",
      inputs: "",
    },
    history: [],
    isLoading: false,
  },
  reducers: {
    reset(state) {
      state.inputJSON = {
        chat_history: "",
        inputs: "",
      };
      state.history = [];
    },
    sChatHistory(state, action) {
      const payload = action.payload;
      state.inputJSON.chat_history = payload.chat_history;
    },
    sInput(state, action) {
      const payload = action.payload;
      state.inputJSON.inputs = payload.inputs;
    },
    sInputJSON(state, action) {
      const payload = action.payload;
      state.inputJSON = payload;
    },
    sLoading(state, action) {
      const payload = action.payload;
      state.isLoading = payload.isLoading;
    },
    pushHistory(state, action) {
      const payload = action.payload;
      state.history.push(payload.history);
    },
    addBotMsgToLatestMsg(state, action) {
      const payload = action.payload;
      if (state.history.length === 0) {
        const history = {};
        history[state.human_identifier] = "";
        history[state.bot_identifier] = payload.msg;

        state.history.push(history);
      } else {
        state.history[state.history.length - 1][state.bot_identifier] =
          payload.msg;
      }
    },
    addHumanMsgToLatestMsg(state, action) {
      const payload = action.payload;
      if (state.history.length === 0) {
        const history = {};
        history[state.human_identifier] = payload.msg;
        history[state.bot_identifier] = "";

        state.history.push(history);
      } else {
        state.history[state.history.length - 1][state.human_identifier] =
          payload.msg;
      }
    },
  },
});

export const langchainActions = langchainSlice.actions;

export default langchainSlice;
