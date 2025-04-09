import axios from 'axios';
import config from '../config';

// Default API endpoint and key
const DEFAULT_API_URL = config.deepseek.apiUrl;
const DEFAULT_API_KEY = config.deepseek.apiKey;

// Function to generate fallback responses based on knowledge base
const generateFallbackResponse = (query, category, knowledgeBase) => {
  // Extract relevant content from the knowledge base
  const words = query.toLowerCase().split(' ').filter(word => word.length > 3);
  let relevantContent = '';
  
  // Find paragraphs in knowledge base that contain query keywords
  const paragraphs = knowledgeBase.split('\n\n');
  
  for (const paragraph of paragraphs) {
    const paragraphLower = paragraph.toLowerCase();
    if (words.some(word => paragraphLower.includes(word))) {
      relevantContent += paragraph + '\n\n';
      if (relevantContent.length > 500) break;
    }
  }
  
  // If no relevant content found, use the first part of the knowledge base
  if (!relevantContent && knowledgeBase.length > 0) {
    relevantContent = knowledgeBase.substring(0, Math.min(500, knowledgeBase.length));
  }
  
  // Create a structured response based on the knowledge base
  return `
## Informasi ${category}

${relevantContent}

### Kesimpulan

Berdasarkan informasi di atas, kami dapat menyimpulkan beberapa poin penting terkait pertanyaan Anda tentang "${query}":

1. ${category} memiliki aspek penting yang perlu diperhatikan sesuai konteks pertanyaan Anda.
2. Informasi dari basis pengetahuan kami memberikan panduan awal untuk memahami topik ini.
3. Untuk informasi lebih detail, kami sarankan untuk melihat sumber referensi terkait ${category}.

*Catatan: Ini adalah respons alternatif karena terjadi kendala teknis saat menghubungi sistem AI kami.*
`;
};

const getResponse = async (query, category, knowledgeBase) => {
  if (!query) {
    return 'Silakan masukkan pertanyaan Anda.';
  }

  try {
    // Create the request body for DeepSeek API
    const requestBody = {
      model: config.deepseek.model || 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: `Anda adalah asisten AI yang ahli dalam bidang ${category}. Jawaban Anda harus SELALU berdasarkan informasi dari basis pengetahuan yang diberikan, kemudian kembangkan dengan pengetahuan umum Anda untuk memberikan jawaban yang komprehensif.

Basis pengetahuan: ${knowledgeBase}

Panduan:
1. UTAMAKAN informasi dari basis pengetahuan sebagai sumber utama jawaban Anda.
2. Kembangkan jawaban dengan pengetahuan umum Anda tentang ${category} untuk membuat jawaban lebih komprehensif.
3. Berikan contoh praktis, studi kasus, dan statistik yang relevan untuk mendukung jawaban.
4. Strukturkan jawaban dengan heading, sub-heading, poin-poin, dan paragraf yang jelas.
5. Gunakan format yang mudah dibaca seperti bullet points, numbering, dan penekanan pada kata kunci.
6. Berikan minimal 3-5 poin utama dalam jawaban Anda.
7. Berikan kesimpulan dan rekomendasi praktis di akhir jawaban.
8. Jawaban harus detail, informatif, dan bermanfaat bagi pengguna.`
        },
        {
          role: 'user',
          content: query
        }
      ],
      max_tokens: 800
    };

    // Get API URL and key
    const apiUrl = DEFAULT_API_URL;
    const apiKey = DEFAULT_API_KEY;
    
    // API request configuration
    const requestConfig = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      timeout: 30000 // Increased timeout to 30 seconds
    };

    console.log('Making API request to DeepSeek');
    console.log(`Using API URL: ${apiUrl}`);
    console.log(`Using API Key: ${apiKey.substring(0, 10)}...`);
    console.log(`Request body: ${JSON.stringify(requestBody, null, 2).substring(0, 300)}...`);
    
    // Make the API request
    const response = await axios.post(apiUrl, requestBody, requestConfig);
    
    console.log('Response received from DeepSeek API');
    console.log(`Status: ${response.status}`);
    console.log(`Response data: ${JSON.stringify(response.data, null, 2).substring(0, 300)}...`);
    
    // Extract and return the AI response
    if (response.data && response.data.choices && response.data.choices.length > 0) {
      const aiResponse = response.data.choices[0].message.content;
      console.log(`AI response length: ${aiResponse.length} characters`);
      return aiResponse;
    } else {
      console.error('Unexpected API response format:', response.data);
      // Use fallback response if API response format is unexpected
      return generateFallbackResponse(query, category, knowledgeBase);
    }
  } catch (error) {
    console.error('Error in DeepSeek service:', error);
    
    // Check if it's a network error or timeout
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      console.log('API request timed out, using fallback response');
    } else if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API error response:', error.response.status, error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from API');
    }
    
    // Generate a fallback response based on the knowledge base
    return generateFallbackResponse(query, category, knowledgeBase);
  }
};

export default {
  getResponse,
  DEEPSEEK_API_KEY: DEFAULT_API_KEY,
  DEEPSEEK_API_URL: DEFAULT_API_URL
};
