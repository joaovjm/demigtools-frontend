const MessageStatus = ({ type, message, icon }) => (
  
  <div style={{ backgroundColor: type }} className="collector-form-message">
    <p className="collector-form-message-text">
      {message}
      {icon}
    </p>
  </div>
  
);

export default MessageStatus;