import { createSlice } from "@reduxjs/toolkit";

const convoSlice = createSlice({
  name: "convoSlice",
  initialState: {
    output: "",
  },
  reducers: {
    reset(state) {
      state.output = "";
    },
    addToken(state, action) {
      const payload = action.payload;
      state.output += payload.token;
    },
  },
});

export const convoActions = convoSlice.actions;

export default convoSlice;
