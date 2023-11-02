import React, { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";

import { emojiActions } from "../reducers/emojiSlice";
import "../styles/ReactionEmoji.css";

import { Player, Controls } from "@lottiefiles/react-lottie-player";

// ReactionEmoji component
const ReactionEmoji = ({ reaction, type }) => {
  const dispatch = useDispatch();

  const emoji = useSelector((state) => state.emoji);
  const [isloaded, setIsLoaded] = useState(false);
  const playerRef = useRef(null);

  useEffect(() => {
    const reactionJSON = { reaction };
    dispatch(emojiActions.sCurrEmoji(reactionJSON));
  }, [reaction, dispatch]);

  useEffect(() => {
    dispatch(emojiActions.sIsLoaded(isloaded));
  }, [isloaded, dispatch]);

  return (
    <div className="player">
      {emoji.currEmoji !== "" && (
        <Player
          lottieRef={(instance) => {
            playerRef.current = instance;
          }}
          onEvent={(event) => {
            if (event === "load") {
              setIsLoaded(true);
            }
          }}
          src={emoji.currEmoji}
          autoplay={
            type === "animated" ? emoji.emojiPlaySetting.autoplay : false
          }
          loop={emoji.emojiPlaySetting.loop}
          controls={emoji.emojiPlaySetting.controls}
          style={
            isloaded === true
              ? emoji.emojiPlaySetting.style
              : emoji.emojiPlaySetting.noDisplay
          }
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
