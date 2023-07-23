import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";

import { emojiActions } from "../reducers/emojiSlice";
import "../styles/ReactionEmoji.css";

import { Player, Controls } from "@lottiefiles/react-lottie-player";

const ReactionEmoji = ({ reaction }) => {
  const dispatch = useDispatch();
  const emoji = useSelector((state) => state.emoji);

  useEffect(() => {
    const reactionJSON = { reaction };
    dispatch(emojiActions.sCurrEmoji(reactionJSON));
  }, [reaction, dispatch]);

  return (
    <div className="player">
      {emoji.currEmoji !== "" && (
        <Player
          src={emoji.currEmoji}
          autoplay={emoji.emojiPlaySetting.autoplay}
          loop={emoji.emojiPlaySetting.loop}
          controls={emoji.emojiPlaySetting.controls}
          style={emoji.emojiPlaySetting.style}
        >
          <Controls
            visible={emoji.emojiPlaySetting.controls}
            buttons={["play", "repeat", "frame", "debug"]}
          />
        </Player>
      )}
    </div>
  );
};

export default ReactionEmoji;
