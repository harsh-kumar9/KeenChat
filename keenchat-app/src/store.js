import { configureStore } from "@reduxjs/toolkit";

import langchainSlice from "./reducers/langchainSlice";
import convoSlice from "./reducers/convoSlice";
import emojiSlice from "./reducers/emojiSlice";

const store = configureStore({
  reducer: {
    langchain: langchainSlice.reducer,
    convo: convoSlice.reducer,
    emoji: emojiSlice.reducer,
  },
});

export default store;
