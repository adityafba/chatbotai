import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import ChatBubble from './ChatBubble';
import CategorySelection from './CategorySelection';
import ApiKeyInput from './ApiKeyInput';
import deepseekService from '../services/deepseekService';
import knowledgeBaseUtils from '../utils/knowledgeBaseUtils';
import config from '../config';

const ChatbotContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
`;

const ChatHeader = styled.div`
  background-color: #4a90e2;
  color: white;
  padding: 1rem;
  border-radius: 10px 10px 0 0;
  text-align: center;
  font-size: 1.5rem;
  font-weight: bold;
`;

const ChatBody = styled.div`
  flex: 1;
  padding: 1rem;
  background-color: white;
  border-left: 1px solid #e0e0e0;
  border-right: 1px solid #e0e0e0;
  overflow-y: auto;
  height: 400px;
`;

const ChatFooter = styled.div`
  display: flex;
  padding: 1rem;
  background-color: #f5f5f5;
  border-radius: 0 0 10px 10px;
  border: 1px solid #e0e0e0;
`;

const ChatInput = styled.input`
  flex: 1;
  padding: 0.8rem;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 1rem;
  margin-right: 0.5rem;
`;

const SendButton = styled.button`
  padding: 0.8rem 1.5rem;
  background-color: #4a90e2;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s;

  &:hover {
    background-color: #357abD;
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const ChatStats = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  background-color: #f9f9f9;
  border-radius: 10px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
`;

const StatsTitle = styled.h3`
  margin-bottom: 0.5rem;
  color: #333;
`;

const StatItem = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.3rem;
`;

const CategoryTag = styled.span`
  display: inline-block;
  background-color: #e0f7fa;
  color: #00838f;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
`;

const UsedCategoriesContainer = styled.div`
  margin-top: 0.5rem;
  margin-bottom: 1rem;
  display: flex;
  flex-wrap: wrap;
`;

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('deepseek_api_key') || '');
  const [categoryStats, setCategoryStats] = useState(
    config.knowledgeBase.categories.reduce((acc, category) => {
      acc[category] = 0;
      return acc;
    }, {})
  );
  const [usedCategories, setUsedCategories] = useState([]);
  
  const chatBodyRef = useRef(null);

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages]);

  // Welcome message and initialize API key - only runs once on component mount
  useEffect(() => {
    // Set default API key
    const defaultApiKey = import.meta.env.VITE_DEEPSEEK_API_KEY || 'sk-bc6819a2bdcb4676987fb2bb2e054709';
    localStorage.setItem('deepseek_api_key', defaultApiKey);
    setApiKey(defaultApiKey);
    
    // Only set welcome message if messages is empty
    if (messages.length === 0) {
      setMessages([
        {
          text: 'Selamat datang di Chatbot Interaktif! Silakan pilih kategori untuk memulai percakapan atau langsung ajukan pertanyaan untuk mendapatkan rekomendasi bisnis dari basis pengetahuan kami.',
          isUser: false,
        },
      ]);
    }
  }, []);

  const handleSendMessage = async () => {
    if (input.trim() === '') return;

    // Add user message
    const userMessage = { text: input, isUser: true };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // If no category is selected, use the smart category detection
      if (!selectedCategory) {
        const response = await fetchResponseWithSmartCategoryDetection(input);
        setMessages((prev) => [...prev, { 
          text: response.text, 
          isUser: false,
          categories: response.categories 
        }]);
        
        // Update used categories
        setUsedCategories(prev => {
          const newCategories = [...prev];
          response.categories.forEach(cat => {
            if (!newCategories.includes(cat)) {
              newCategories.push(cat);
            }
          });
          return newCategories;
        });
        
        // Update category stats
        const updatedStats = {...categoryStats};
        response.categories.forEach(category => {
          updatedStats[category] = (updatedStats[category] || 0) + 1;
        });
        setCategoryStats(updatedStats);
      } else {
        // Update category stats for selected category
        setCategoryStats((prev) => ({
          ...prev,
          [selectedCategory]: prev[selectedCategory] + 1,
        }));
        
        // Use the selected category
        setTimeout(async () => {
          const response = await fetchResponse(input, selectedCategory);
          setMessages((prev) => [...prev, { 
            text: response, 
            isUser: false,
            categories: [selectedCategory]
          }]);
          
          // Update used categories if not already included
          if (!usedCategories.includes(selectedCategory)) {
            setUsedCategories(prev => [...prev, selectedCategory]);
          }
        }, 500);
      }
    } catch (error) {
      console.error('Error fetching response:', error);
      setMessages((prev) => [
        ...prev,
        { text: 'Maaf, terjadi kesalahan. Silakan coba lagi.', isUser: false },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchResponseWithSmartCategoryDetection = async (query) => {
    try {
      console.log('Using smart category detection for query:', query);
      
      // Use the new loadRelevantKnowledgeBase function
      const { content, categories } = await knowledgeBaseUtils.loadRelevantKnowledgeBase(query);
      
      console.log('Relevant categories detected:', categories);
      
      // Use DeepSeek service with the combined knowledge base
      const aiResponse = await deepseekService.getResponse(
        query, 
        categories.join(', '), 
        content
      );
      
      return {
        text: aiResponse,
        categories
      };
    } catch (error) {
      console.error('Error in smart category detection:', error);
      return {
        text: "Maaf, terjadi kesalahan saat mencari informasi. Silakan coba lagi nanti.",
        categories: []
      };
    }
  };

  const fetchResponse = async (query, category) => {
    try {
      // Load knowledge base content for the selected category
      const knowledgeBaseContent = await knowledgeBaseUtils.loadKnowledgeBase(category);
      
      // Use DeepSeek service
      const aiResponse = await deepseekService.getResponse(query, category, knowledgeBaseContent);
      return aiResponse;
    } catch (error) {
      console.error('Error fetching response:', error);
      return "Maaf, terjadi kesalahan saat mencari informasi. Silakan coba lagi nanti.";
    }
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setMessages((prev) => [
      ...prev,
      {
        text: `Anda telah memilih kategori ${category}. Silakan ajukan pertanyaan Anda.`,
        isUser: false,
      },
    ]);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <ChatbotContainer>
      <ChatHeader>Chatbot Interaktif</ChatHeader>
      
      <CategorySelection 
        onSelectCategory={handleCategorySelect} 
        selectedCategory={selectedCategory} 
      />
      
      <ChatBody ref={chatBodyRef}>
        {messages.map((message, index) => (
          <React.Fragment key={index}>
            <ChatBubble message={message.text} isUser={message.isUser} />
            {!message.isUser && message.categories && message.categories.length > 0 && (
              <UsedCategoriesContainer>
                {message.categories.map(cat => (
                  <CategoryTag key={cat}>{cat}</CategoryTag>
                ))}
              </UsedCategoriesContainer>
            )}
          </React.Fragment>
        ))}
        {isLoading && <ChatBubble message="Sedang mengetik..." isUser={false} />}
      </ChatBody>
      
      <ChatFooter>
        <ChatInput
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ketik pesan Anda di sini..."
        />
        <SendButton 
          onClick={handleSendMessage} 
          disabled={input.trim() === '' || isLoading}
        >
          Kirim
        </SendButton>
      </ChatFooter>
      
      <ChatStats>
        <StatsTitle>Statistik Percakapan</StatsTitle>
        {Object.entries(categoryStats)
          .filter(([_, count]) => count > 0)
          .sort(([_, countA], [__, countB]) => countB - countA)
          .map(([category, count]) => (
            <StatItem key={category}>
              <span>{category}:</span>
              <span>{count} pesan</span>
            </StatItem>
          ))}
      </ChatStats>
      
      {/* API Status indicator - no input needed */}
      <ApiKeyInput onApiKeyChange={() => {}} />
    </ChatbotContainer>
  );
};

export default Chatbot;
