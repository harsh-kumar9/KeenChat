import { createSlice } from "@reduxjs/toolkit";

const reactionToEmojiMapper = {
  remorse: "sad",
  grief: "sad",
  caring: "sad",
  anger: "sad",
  sadness: "sad",
  desire: "starStrike",
  excitement: "starStrike",
  pride: "sungrass",
  disgust: "raiseEyebrow",
  annoyance: "raiseEyebrow",
  disapproval: "raiseEyebrow",
  confusion: "raiseEyebrow",
  nervousness: "cry",
  fear: "cry",
  disappointment: "cry",
  embarrassment: "cry",
  amusement: "wink",
  love: "wink",
  surprise: "laugh",
  joy: "laugh",
  optimism: "laugh",
  curiosity: "laugh",
  realization: "laugh",
  relief: "smile",
  gratitude: "smile",
  admiration: "smile",
  approval: "smile",
  neutral: "neutral",
};

const emojiSlice = createSlice({
  name: "emojiSlice",
  initialState: {
    emojiPlaySetting: {
      background: "transparent",
      style: { height: "100%", width: "100%" },
      speed: "1",
      loop: true,
      autoplay: true,
      controls: false,
      direction: "1",
      mode: "normal",
    },
    emojiFactory: {
      sad: "https://lottie.host/0ae89769-d580-444f-b8b6-49653b149a64/WK79b2Ydoa.json",
      starStrike:
        "https://lottie.host/983b1f5d-7e21-4cbf-a85d-5505ffdb10d3/KHT1EE6YE9.json",
      sungrass:
        "https://lottie.host/0631d55b-4856-4598-be38-7f1fa46215dd/WJKZKFqfyj.json",
      raiseEyebrow:
        "https://lottie.host/968dcfa5-d9ea-4186-b46a-9b2bdb0f9410/xNcbAokTMv.json",
      cry: "https://lottie.host/d2a9a464-d8f3-4054-8309-3d6cf185e4ac/IvnCewnxxw.json",
      wink: "https://lottie.host/ebd1c190-656b-440c-875a-c93b08e9f58b/wFmxSQ05Tq.json",
      laugh:
        "https://lottie.host/1d303aef-d0b3-45eb-a8f1-58440ad9c3e0/R2S1JI17sL.json",
      smile:
        "https://lottie.host/385ce493-8132-43ee-b7f3-a3a988f69f25/kCgqAsAWOn.json",
    },
    currEmoji: "",
  },
  reducers: {
    reset(state) {
      state.currEmoji = "";
    },
    sCurrEmoji(state, action) {
      const payload = action.payload;
      const reaction = payload.reaction;

      if (reactionToEmojiMapper.hasOwnProperty(reaction)) {
        const emojiKey = reactionToEmojiMapper[reaction];

        if (emojiKey === "neutral") {
          state.currEmoji = "";
        } else {
          state.currEmoji = state.emojiFactory[emojiKey];
        }
      } else {
        state.currEmoji = "";
      }
    },
  },
});

export const emojiActions = emojiSlice.actions;

export default emojiSlice;
