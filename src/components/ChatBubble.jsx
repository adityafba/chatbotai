import React from 'react';
import styled from 'styled-components';
import ReactMarkdown from 'react-markdown';

const BubbleContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: ${(props) => (props.isUser ? 'flex-end' : 'flex-start')};
  margin-bottom: 1rem;
`;

const SenderName = styled.div`
  font-size: 0.8rem;
  color: ${(props) => (props.isUser ? '#4a90e2' : '#888')};
  margin-bottom: 0.2rem;
  padding: 0 0.5rem;
`;

const Bubble = styled.div`
  background-color: ${(props) => (props.isUser ? '#e3f2fd' : '#f5f5f5')};
  color: ${(props) => (props.isUser ? '#0d47a1' : '#333')};
  padding: 0.8rem 1rem;
  border-radius: 1rem;
  max-width: 80%;
  word-break: break-word;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  
  /* Styling untuk konten Markdown */
  h1, h2, h3, h4, h5, h6 {
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
    font-weight: 600;
    line-height: 1.25;
  }
  
  h1 {
    font-size: 1.5rem;
  }
  
  h2 {
    font-size: 1.3rem;
    border-bottom: 1px solid #eaecef;
    padding-bottom: 0.3rem;
  }
  
  h3 {
    font-size: 1.1rem;
  }
  
  ul, ol {
    padding-left: 1.5rem;
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
  }
  
  li {
    margin: 0.25rem 0;
  }
  
  p {
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
  }
  
  strong {
    font-weight: 600;
  }
  
  blockquote {
    border-left: 4px solid #dfe2e5;
    padding-left: 1rem;
    color: #6a737d;
    margin: 0.5rem 0;
  }
  
  code {
    background-color: rgba(27, 31, 35, 0.05);
    border-radius: 3px;
    font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
    font-size: 85%;
    padding: 0.2em 0.4em;
  }
  
  pre {
    background-color: #f6f8fa;
    border-radius: 3px;
    font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
    font-size: 85%;
    line-height: 1.45;
    overflow: auto;
    padding: 16px;
  }
`;

const ChatBubble = ({ message, isUser }) => {
  return (
    <BubbleContainer isUser={isUser}>
      <SenderName isUser={isUser}>{isUser ? 'Anda' : 'Jagoan Bisnis AI'}</SenderName>
      <Bubble isUser={isUser}>
        {isUser ? (
          message
        ) : (
          <ReactMarkdown>{message}</ReactMarkdown>
        )}
      </Bubble>
    </BubbleContainer>
  );
};

export default ChatBubble;
