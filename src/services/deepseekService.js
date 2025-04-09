import axios from 'axios';
import config from '../config';

// Default API endpoint and key
const DEFAULT_API_URL = config.deepseek.apiUrl;
const DEFAULT_API_KEY = config.deepseek.apiKey;

// Maximum number of retries for API calls
const MAX_RETRIES = 100;

// Function to generate fallback responses based on knowledge base
const generateFallbackResponse = (query, category, knowledgeBase) => {
  // Extract relevant content from the knowledge base
  const words = query.toLowerCase().split(' ').filter(word => word.length > 3);
  let relevantContent = '';
  
  // Find paragraphs in knowledge base that contain query keywords
  const paragraphs = knowledgeBase.split('\n\n');
  
  // First pass: Look for paragraphs with exact matches to important keywords
  for (const paragraph of paragraphs) {
    const paragraphLower = paragraph.toLowerCase();
    // Check if paragraph contains multiple keywords for better relevance
    const matchCount = words.filter(word => paragraphLower.includes(word)).length;
    
    if (matchCount >= 2 || (words.length === 1 && matchCount === 1)) {
      relevantContent += paragraph + '\n\n';
      if (relevantContent.length > 800) break;
    }
  }
  
  // Second pass: If not enough content, look for paragraphs with at least one keyword
  if (relevantContent.length < 300 && words.length > 0) {
    for (const paragraph of paragraphs) {
      if (relevantContent.includes(paragraph)) continue; // Skip already included paragraphs
      
      const paragraphLower = paragraph.toLowerCase();
      if (words.some(word => paragraphLower.includes(word))) {
        relevantContent += paragraph + '\n\n';
        if (relevantContent.length > 800) break;
      }
    }
  }
  
  // If no relevant content found, use the first part of the knowledge base
  if (!relevantContent && knowledgeBase.length > 0) {
    relevantContent = knowledgeBase.substring(0, Math.min(800, knowledgeBase.length));
  }
  
  // Extract key points from relevant content
  const lines = relevantContent.split('\n').filter(line => line.trim().length > 0);
  const keyPoints = lines
    .filter(line => line.length > 30 && !line.startsWith('#'))
    .slice(0, 3)
    .map(line => line.trim());
  
  // Create a structured response based on the knowledge base
  return `
## Rekomendasi ${category}

${keyPoints.map(point => `• ${point}`).join('\n\n')}

### Kesimpulan

Berdasarkan informasi dari basis pengetahuan kami, berikut rekomendasi untuk "${query}":

• ${keyPoints[0] || 'Terapkan prinsip-prinsip dasar ' + category + ' untuk hasil optimal.'}

*Catatan: Ini adalah respons alternatif karena terjadi kendala teknis saat menghubungi sistem AI kami.*
`;
};

// Function to make API request with retries
const makeApiRequestWithRetry = async (apiUrl, requestBody, requestConfig, retryCount = 0) => {
  try {
    console.log(`API request attempt ${retryCount + 1} of ${MAX_RETRIES + 1}`);
    return await axios.post(apiUrl, requestBody, requestConfig);
  } catch (error) {
    // If we've reached max retries or it's not a timeout error, throw the error
    if (retryCount >= MAX_RETRIES || 
        !(error.code === 'ECONNABORTED' || error.message.includes('timeout'))) {
      throw error;
    }
    
    // Exponential backoff - wait longer between each retry
    const waitTime = 1000 * Math.pow(2, retryCount);
    console.log(`API request timed out. Retrying in ${waitTime/1000} seconds...`);
    
    // Wait before retrying
    await new Promise(resolve => setTimeout(resolve, waitTime));
    
    // Retry with increased timeout
    const newConfig = {
      ...requestConfig,
      timeout: requestConfig.timeout + 10000 // Add 10 seconds for each retry
    };
    
    // Try again with incremented retry count
    return makeApiRequestWithRetry(apiUrl, requestBody, newConfig, retryCount + 1);
  }
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
          content: `Anda adalah asisten AI yang ahli dalam bidang bisnis, khususnya ${category}. Jawaban Anda harus SELALU berdasarkan informasi dari basis pengetahuan yang diberikan, kemudian kembangkan dengan pengetahuan umum Anda untuk memberikan jawaban yang komprehensif.

Basis pengetahuan: ${knowledgeBase}

Panduan format respons:
1. UTAMAKAN informasi dari basis pengetahuan sebagai sumber utama jawaban Anda. Jangan memberikan informasi yang bertentangan dengan basis pengetahuan.
2. Kembangkan jawaban dengan pengetahuan umum Anda tentang ${category} untuk membuat jawaban lebih komprehensif.
3. SANGAT PENTING: Buat jawaban RINGKAS dan PADAT, maksimal 3-4 paragraf saja.
4. Gunakan format yang mudah dibaca:
   - Judul utama dengan heading H2 (##)
   - Poin-poin utama dengan bullet points (•)
   - Penekanan pada kata kunci dengan bold (**)
5. Berikan maksimal 3-5 poin utama dalam jawaban Anda, tidak perlu lebih.
6. Hindari teks yang terlalu panjang dan bertele-tele. Fokus pada informasi penting saja.
7. Akhiri dengan kesimpulan singkat 1-2 kalimat dan rekomendasi praktis yang dapat langsung diterapkan.
8. Jangan gunakan jargon teknis yang rumit. Gunakan bahasa yang sederhana dan mudah dipahami.
9. Jika relevan, berikan 1 contoh konkret atau studi kasus singkat.`
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
      timeout: 45000 // Increased timeout to 45 seconds
    };

    console.log('Making API request to DeepSeek');
    console.log(`Using API URL: ${apiUrl}`);
    console.log(`Using API Key: ${apiKey.substring(0, 10)}...`);
    console.log(`Request body: ${JSON.stringify(requestBody, null, 2).substring(0, 300)}...`);
    
    // Make the API request with retry capability
    const response = await makeApiRequestWithRetry(apiUrl, requestBody, requestConfig);
    
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
