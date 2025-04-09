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
    
    // Only set welcome message if messages is empty
    if (messages.length === 0) {
      const welcomeMessage = {
        text: 'Selamat datang di Chatbot Interaktif! Saya di sini untuk membantu Anda dengan rekomendasi bisnis yang personal.',
        isUser: false,
      };
      
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
        // If we have all user info
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
  }, []);

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
    // Personalize response with user's name and business if available
    let personalizedText = text;
    
    if (userName) {
      // Replace generic terms with personalized ones
      personalizedText = personalizedText.replace(/Anda dapat/g, `${userName} dapat`);
      personalizedText = personalizedText.replace(/Anda harus/g, `${userName} sebaiknya`);
      personalizedText = personalizedText.replace(/Anda perlu/g, `${userName} perlu`);
    }
    
    if (userBusiness) {
      // Add specific business context to recommendations
      personalizedText = personalizedText.replace(/bisnis Anda/g, `bisnis ${userBusiness} Anda`);
      personalizedText = personalizedText.replace(/perusahaan Anda/g, `${userBusiness} Anda`);
    }
    
    return personalizedText;
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
      
      // Use the new loadRelevantKnowledgeBase function
      const { content, categories } = await knowledgeBaseUtils.loadRelevantKnowledgeBase(query);
      
      console.log('Relevant categories detected:', categories);
      
      // Kirim riwayat percakapan ke API untuk konteks
      const aiResponse = await deepseekService.getResponse(
        query, 
        categories.join(', '), 
        content,
        conversationHistory // Mengirim riwayat percakapan ke API
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
