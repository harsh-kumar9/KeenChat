const UserInput = ({ type }) => {
  return (
    <div className="conversation">
      <h1>KeenChat</h1>

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

      <div>
        <audio id="audioElement" controls style={{ display: "none" }}>
          <source src="" type="audio/mpeg" />
        </audio>
        <img src={isTyping ? bot_listen : bot_talk} id="bot_avatar_img" />
        <span>Bot </span>
        <div className="backchannel_container" style={{ marginLeft: "20px" }}>
          <p style={{ display: "inline" }}>{selectedBackchannel}</p>
          <p style={{ display: "inline", fontStyle: "normal" }}>
            {selectedEmoji}
          </p>
        </div>
      </div>

      <div>
        {type && convo.reaction !== "" && (
          <ReactionEmoji reaction={convo.reaction} type={type} />
        )}
        {/* <p>{convo.reaction}</p> */}
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
