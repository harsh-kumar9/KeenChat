import { createSlice } from "@reduxjs/toolkit";

const convoSlice = createSlice({
  name: "convoSlice",
  initialState: {
    output: "",
    reaction: "",
  },
  reducers: {
    reset(state) {
      state.output = "";
      state.reaction = "";
    },
    sReaction(state, action) {
      const payload = action.payload;
      state.reaction = payload.label;
    },
    addToken(state, action) {
      const payload = action.payload;
      state.output += payload.token;
    },
  },
});

export const convoActions = convoSlice.actions;

export default convoSlice;
