const UserInput = ({ type }) => {
  return (
    <div className="conversation">
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
