import { configureStore } from "@reduxjs/toolkit";

import langchainSlice from "./reducers/langchainSlice";
import convoSlice from "./reducers/convoSlice";

const store = configureStore({
  reducer: {
    langchain: langchainSlice.reducer,
    convo: convoSlice.reducer,
  },
});

export default store;
