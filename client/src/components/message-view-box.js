const MessageViewBox = ({ messages, childRef }) => {
  return (
    <div className="message-view-box" ref={childRef}>
      {
        messages.map((message) => (
          <div key={message.messageId} className="message">
            <div className="username"><b>{message.userName}</b></div>
            <div className="text">{message.text}</div>
            <div className="date">{message.date}</div>
          </div>
        ))
      }
    </div>
  );
}

export default MessageViewBox;