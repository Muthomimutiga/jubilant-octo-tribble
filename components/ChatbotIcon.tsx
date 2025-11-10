import React from 'react';
import { BotMessageSquare } from 'lucide-react';
import './Chatbot.css';

interface ChatbotIconProps {
  onOpen: () => void;
}

const ChatbotIcon: React.FC<ChatbotIconProps> = ({ onOpen }) => {
  return (
    <button
      onClick={onOpen}
      className="chatbot-fab"
      aria-label="Open AI Assistant Ross"
    >
      <BotMessageSquare className="w-8 h-8" />
    </button>
  );
};

export default ChatbotIcon;
