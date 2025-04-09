import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import ChatBubble from './ChatBubble';
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

const UserInfoBadge = styled.div`
  display: inline-block;
  background-color: #f0f8ff;
  color: #4a90e2;
  padding: 0.3rem 0.6rem;
  border-radius: 15px;
  font-size: 0.9rem;
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
  border: 1px solid #c5dcf7;
`;

const UserInfoContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 0.5rem;
  padding: 0.5rem;
  background-color: #fafafa;
  border-radius: 5px;
`;

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('deepseek_api_key') || '');
  const [categoryStats, setCategoryStats] = useState(
    config.knowledgeBase.categories.reduce((acc, category) => {
      acc[category] = 0;
      return acc;
    }, {})
  );
  const [usedCategories, setUsedCategories] = useState([]);
  const [userName, setUserName] = useState('');
  const [userBusiness, setUserBusiness] = useState('');
  const [conversationStage, setConversationStage] = useState('welcome');
  const [conversationHistory, setConversationHistory] = useState([]);
  
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
    
    // Load user info from local storage if available
    const savedUserName = localStorage.getItem('user_name');
    const savedUserBusiness = localStorage.getItem('user_business');
    
    if (savedUserName) {
      setUserName(savedUserName);
    }
    
    if (savedUserBusiness) {
      setUserBusiness(savedUserBusiness);
    }
    
    // Check if we already have messages to prevent duplicate welcome messages
    if (messages.length === 0) {
      // Initialize messages array with welcome message
      const welcomeMessage = {
        text: 'Selamat datang di Chatbot Interaktif! Saya di sini untuk membantu Anda dengan rekomendasi bisnis yang personal.',
        isUser: false,
      };
      
      // Set initial messages and conversation history
      setMessages([welcomeMessage]);
      setConversationHistory([{ role: 'assistant', content: welcomeMessage.text }]);
      
      // If we don't have user's name, set conversation stage to ask for name
      if (!savedUserName) {
        setTimeout(() => {
          const nameQuestion = {
            text: 'Sebelum kita mulai, boleh saya tahu nama Anda?',
            isUser: false
          };
          setMessages(prev => [...prev, nameQuestion]);
          setConversationHistory(prev => [...prev, { role: 'assistant', content: nameQuestion.text }]);
          setConversationStage('asking_name');
        }, 1000);
      } else if (!savedUserBusiness) {
        // If we have name but no business info
        setTimeout(() => {
          const businessQuestion = {
            text: `Senang bertemu dengan Anda, ${savedUserName}! Boleh tahu Anda memiliki bisnis di bidang apa?`,
            isUser: false
          };
          setMessages(prev => [...prev, businessQuestion]);
          setConversationHistory(prev => [...prev, { role: 'assistant', content: businessQuestion.text }]);
          setConversationStage('asking_business');
        }, 1000);
      } else {
        // If we have all user info, only add one ready message
        setTimeout(() => {
          const readyMessage = {
            text: `Senang bertemu kembali, ${savedUserName}! Apa yang ingin Anda ketahui tentang bisnis ${savedUserBusiness} Anda hari ini?`,
            isUser: false
          };
          setMessages(prev => [...prev, readyMessage]);
          setConversationHistory(prev => [...prev, { role: 'assistant', content: readyMessage.text }]);
          setConversationStage('ready');
        }, 1000);
      }
    }
  }, []); // Empty dependency array ensures this only runs once

  // Extract just the name from user input
  const extractName = (input) => {
    // Remove common prefixes that users might include
    const cleanInput = input.trim()
      .replace(/^nama saya/i, '')
      .replace(/^saya/i, '')
      .replace(/^halo,?\s*/i, '')
      .replace(/^hai,?\s*/i, '')
      .replace(/^hi,?\s*/i, '')
      .replace(/^perkenalkan/i, '')
      .replace(/^kenalkan/i, '')
      .trim();
    
    // If the input contains multiple words, take only the first 2-3 words as the name
    const words = cleanInput.split(/\s+/);
    if (words.length > 3) {
      return words.slice(0, 2).join(' ');
    }
    
    return cleanInput;
  };

  // Extract business type from user input
  const extractBusiness = (input) => {
    // Remove common prefixes
    const cleanInput = input.trim()
      .replace(/^bisnis saya/i, '')
      .replace(/^usaha saya/i, '')
      .replace(/^saya punya bisnis/i, '')
      .replace(/^saya memiliki bisnis/i, '')
      .replace(/^saya bekerja di/i, '')
      .replace(/^saya di bidang/i, '')
      .trim();
    
    return cleanInput;
  };

  const handleSendMessage = async () => {
    if (input.trim() === '') return;

    // Add user message
    const userMessage = { text: input, isUser: true };
    setMessages((prev) => [...prev, userMessage]);
    setConversationHistory(prev => [...prev, { role: 'user', content: input }]);
    setInput('');
    setIsLoading(true);

    try {
      // Handle different conversation stages
      if (conversationStage === 'asking_name') {
        // Extract and save user name
        const name = extractName(input.trim());
        setUserName(name);
        localStorage.setItem('user_name', name);
        
        setTimeout(() => {
          const nameResponse = {
            text: `Senang bertemu dengan Anda, ${name}! Boleh tahu Anda memiliki bisnis di bidang apa?`,
            isUser: false
          };
          setMessages(prev => [...prev, nameResponse]);
          setConversationHistory(prev => [...prev, { role: 'assistant', content: nameResponse.text }]);
          setConversationStage('asking_business');
          setIsLoading(false);
        }, 1000);
        return;
      } 
      else if (conversationStage === 'asking_business') {
        // Extract and save user business
        const business = extractBusiness(input.trim());
        setUserBusiness(business);
        localStorage.setItem('user_business', business);
        
        setTimeout(() => {
          const businessResponse = {
            text: `Terima kasih! Sekarang saya dapat memberikan rekomendasi yang lebih personal untuk bisnis ${business} Anda. Apa yang ingin Anda ketahui?`,
            isUser: false
          };
          setMessages(prev => [...prev, businessResponse]);
          setConversationHistory(prev => [...prev, { role: 'assistant', content: businessResponse.text }]);
          setConversationStage('ready');
          setIsLoading(false);
        }, 1000);
        return;
      }
      
      // For normal conversation, use smart category detection
      let enhancedQuery = input;
      
      // Add context about user's business if available
      if (userBusiness) {
        enhancedQuery = `${input} (Konteks: Bisnis saya adalah di bidang ${userBusiness})`;
      }
      
      const response = await fetchResponseWithSmartCategoryDetection(enhancedQuery);
      
      // Check if response contains questions about user info
      const responseText = personalizeResponse(response.text);
      
      setConversationHistory(prev => [...prev, { role: 'assistant', content: responseText }]);
      
      setMessages((prev) => [...prev, { 
        text: responseText, 
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
      
      // Check if we should ask follow-up questions
      checkForFollowUpQuestions(input);
      
    } catch (error) {
      console.error('Error fetching response:', error);
      const errorMessage = { 
        text: 'Maaf, terjadi kesalahan. Silakan coba lagi.', 
        isUser: false 
      };
      setMessages((prev) => [...prev, errorMessage]);
      setConversationHistory(prev => [...prev, { role: 'assistant', content: errorMessage.text }]);
    } finally {
      setIsLoading(false);
    }
  };

  const personalizeResponse = (text) => {
    if (!text) return text;
    
    let personalized = text;
    
    // Replace generic terms with user's name if available
    if (userName) {
      personalized = personalized
        .replace(/pengguna/gi, userName)
        .replace(/pelanggan/gi, userName)
        .replace(/klien/gi, userName);
      
      // Add personalized greeting if the response starts with generic greetings
      if (
        personalized.match(/^(halo|hai|selamat|terima kasih)/i) && 
        !personalized.toLowerCase().includes(userName.toLowerCase())
      ) {
        personalized = personalized.replace(/^(halo|hai|selamat|terima kasih)/i, `$1 ${userName}`);
      }
    }
    
    // Add business context to recommendations if available
    if (userBusiness) {
      // Replace generic business terms with user's specific business
      personalized = personalized
        .replace(/bisnis anda/gi, `bisnis ${userBusiness} Anda`)
        .replace(/perusahaan anda/gi, `${userBusiness} Anda`)
        .replace(/usaha anda/gi, `usaha ${userBusiness} Anda`);
      
      // Look for recommendation patterns and add business context
      if (personalized.includes('rekomendasi') || personalized.includes('saran') || personalized.includes('tips')) {
        // Only add business type if not already mentioned in the same sentence
        const sentences = personalized.split(/[.!?]+/);
        personalized = sentences.map(sentence => {
          if ((sentence.includes('rekomendasi') || sentence.includes('saran') || sentence.includes('tips')) && 
              !sentence.toLowerCase().includes(userBusiness.toLowerCase())) {
            return sentence.replace(/(rekomendasi|saran|tips)/i, `$1 untuk bisnis ${userBusiness}`);
          }
          return sentence;
        }).join('. ');
      }
    }
    
    // Enhance contextual awareness by referencing previous conversation
    if (conversationHistory.length > 2) {
      // Get the last user message before the current one
      const previousUserMessages = conversationHistory
        .filter(msg => msg.role === 'user')
        .slice(-2, -1);
      
      // If there's a topic change, acknowledge it
      if (previousUserMessages.length > 0) {
        const prevTopic = previousUserMessages[0].content.toLowerCase();
        const currentTopic = conversationHistory[conversationHistory.length - 1].content.toLowerCase();
        
        // Simple topic change detection - if key terms don't overlap
        const prevTerms = prevTopic.split(' ').filter(word => word.length > 4);
        const currentTerms = currentTopic.split(' ').filter(word => word.length > 4);
        const hasCommonTerms = prevTerms.some(term => currentTerms.includes(term));
        
        // If it seems like a topic change and response doesn't already acknowledge it
        if (!hasCommonTerms && 
            !personalized.includes('Mengenai pertanyaan baru Anda') && 
            !personalized.includes('Beralih ke topik')) {
          // Add a transition phrase at the beginning if the response doesn't already have one
          if (!personalized.match(/^(mengenai|terkait|tentang|untuk)/i)) {
            personalized = `Mengenai pertanyaan Anda tentang ${currentTerms.slice(0, 3).join(' ')}... ${personalized}`;
          }
        }
      }
    }
    
    return personalized;
  };

  const checkForFollowUpQuestions = (userQuery) => {
    // Check if we should ask follow-up questions based on user query
    const query = userQuery.toLowerCase();
    
    // If user hasn't specified their business type in detail
    if (userBusiness && userBusiness.length < 10 && 
        (query.includes('bisnis') || query.includes('usaha') || query.includes('perusahaan'))) {
      setTimeout(() => {
        const followUpQuestion = {
          text: `Untuk memberikan rekomendasi yang lebih spesifik, boleh saya tahu lebih detail tentang bisnis ${userBusiness} Anda? Misalnya, skala bisnis, jumlah karyawan, atau target pasar Anda?`,
          isUser: false
        };
        setMessages(prev => [...prev, followUpQuestion]);
        setConversationHistory(prev => [...prev, { role: 'assistant', content: followUpQuestion.text }]);
      }, 2000);
    }
    
    // If query is about starting a business but we don't have details
    if ((query.includes('mulai') || query.includes('memulai') || query.includes('baru')) && 
        query.includes('bisnis') && (!userBusiness || userBusiness.length < 5)) {
      setTimeout(() => {
        const startupQuestion = {
          text: 'Bisnis apa yang ingin Anda mulai? Semakin spesifik informasi yang Anda berikan, semakin tepat rekomendasi yang dapat saya berikan.',
          isUser: false
        };
        setMessages(prev => [...prev, startupQuestion]);
        setConversationHistory(prev => [...prev, { role: 'assistant', content: startupQuestion.text }]);
      }, 2000);
    }
  };

  const fetchResponseWithSmartCategoryDetection = async (query) => {
    try {
      console.log('Using smart category detection for query:', query);
      
      // Enhance query with conversation context if available
      let enhancedQuery = query;
      
      // Add business context to the query if available
      if (userBusiness) {
        // Only add business context if not already mentioned in the query
        if (!query.toLowerCase().includes(userBusiness.toLowerCase())) {
          enhancedQuery = `${query} (Konteks: Bisnis saya adalah ${userBusiness})`;
        }
      }
      
      // Add context from recent conversation if it seems like a follow-up question
      const isLikelyFollowUp = query.length < 50 && 
        !query.includes('?') && 
        conversationHistory.length >= 2;
      
      if (isLikelyFollowUp) {
        // Get the last AI response to provide context
        const lastAIResponse = conversationHistory
          .filter(msg => msg.role === 'assistant')
          .pop();
        
        if (lastAIResponse) {
          // Extract a brief context from the last AI response (first 100 chars)
          const contextSnippet = lastAIResponse.content.substring(0, 100).replace(/\n/g, ' ');
          enhancedQuery = `${query} (Ini adalah pertanyaan lanjutan terkait respons terakhir Anda tentang: "${contextSnippet}...")`;
        }
      }
      
      console.log('Enhanced query with context:', enhancedQuery);
      
      // Use the new loadRelevantKnowledgeBase function
      const { content, categories } = await knowledgeBaseUtils.loadRelevantKnowledgeBase(enhancedQuery);
      
      console.log('Relevant categories detected:', categories);
      
      // Send conversation history to API for context
      const aiResponse = await deepseekService.getResponse(
        enhancedQuery, 
        categories.join(', '), 
        content,
        conversationHistory // Send conversation history to API
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

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const resetUserInfo = () => {
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_business');
    setUserName('');
    setUserBusiness('');
    setConversationStage('asking_name');
    
    const resetMessage = {
      text: 'Informasi pengguna telah direset. Boleh saya tahu nama Anda?',
      isUser: false,
    };
    
    setMessages([resetMessage]);
    setConversationHistory([{ role: 'assistant', content: resetMessage.text }]);
  };

  return (
    <ChatbotContainer>
      <ChatHeader>Chatbot Interaktif</ChatHeader>
      
      {(userName || userBusiness) && (
        <UserInfoContainer>
          {userName && <UserInfoBadge>Nama: {userName}</UserInfoBadge>}
          {userBusiness && <UserInfoBadge>Bisnis: {userBusiness}</UserInfoBadge>}
          <UserInfoBadge 
            onClick={resetUserInfo} 
            style={{cursor: 'pointer', backgroundColor: '#fff0f0', color: '#e57373', borderColor: '#ffcdd2'}}
          >
            Reset Info
          </UserInfoBadge>
        </UserInfoContainer>
      )}
      
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
          placeholder={
            conversationStage === 'asking_name' ? 'Ketik nama Anda di sini...' :
            conversationStage === 'asking_business' ? 'Ketik jenis bisnis Anda di sini...' :
            'Ketik pertanyaan bisnis Anda di sini...'
          }
        />
        <SendButton 
          onClick={handleSendMessage} 
          disabled={input.trim() === '' || isLoading}
        >
          Kirim
        </SendButton>
      </ChatFooter>
      
      <ChatStats>
        <StatsTitle>Statistik Kategori</StatsTitle>
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
