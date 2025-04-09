import axios from 'axios';
import config from '../config';

// Default API endpoint and key
const DEFAULT_API_URL = config.deepseek.apiUrl;
const DEFAULT_API_KEY = config.deepseek.apiKey;

// Maximum number of retries for API calls
const MAX_RETRIES = 20;

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

const getResponse = async (query, category, knowledgeBase, conversationHistory = []) => {
  if (!query) {
    return 'Silakan masukkan pertanyaan Anda.';
  }

  try {
    // Create messages array with system message and conversation history
    const messages = [
      {
        role: 'system',
        content: `Anda adalah asisten AI yang membantu pengguna dengan pertanyaan bisnis. Anda memiliki akses ke basis pengetahuan tentang ${category}.

BASIS PENGETAHUAN:
${knowledgeBase}

INSTRUKSI PENTING:
1. SELALU gunakan basis pengetahuan di atas sebagai sumber utama informasi Anda. Jika informasi tidak ada dalam basis pengetahuan, Anda dapat menggunakan pengetahuan umum Anda, tetapi prioritaskan basis pengetahuan.
2. Ketika mengutip informasi dari basis pengetahuan, sebutkan kategori sumber informasi tersebut (misalnya: "Menurut informasi dari kategori Marketing...").
3. Kembangkan jawaban yang KOMPREHENSIF dan MENDALAM berdasarkan basis pengetahuan, bukan jawaban yang umum atau dangkal.
4. Jawaban Anda harus TERSTRUKTUR dengan:
   - Judul utama dengan heading H2 (##)
   - Poin-poin utama dengan bullet points (•)
   - Penekanan pada kata kunci dengan bold (**)
5. Berikan maksimal 3-5 poin utama dalam jawaban Anda, tidak perlu lebih.
6. Hindari teks yang terlalu panjang dan bertele-tele. Fokus pada informasi penting saja.
7. Akhiri dengan kesimpulan singkat 1-2 kalimat dan rekomendasi praktis yang dapat langsung diterapkan.
8. Gunakan bahasa yang sederhana, personal, dan mudah dipahami. Hindari jargon teknis yang rumit.
9. Jika relevan, berikan 1 contoh konkret atau studi kasus singkat.
10. PENTING: Jawaban Anda harus berkaitan dengan pertanyaan terbaru pengguna, tetapi juga mempertimbangkan konteks dari percakapan sebelumnya.
11. Gunakan gaya komunikasi yang HUMANIS dan PERSONAL - seolah-olah Anda adalah seorang konsultan bisnis yang sedang berbicara langsung dengan pengguna. Gunakan kata "saya" dan "Anda" untuk menciptakan koneksi personal.
12. Jika pengguna bertanya tentang topik yang tidak ada dalam basis pengetahuan, JUJURLAH dan katakan bahwa Anda tidak memiliki informasi spesifik tentang hal tersebut dalam basis pengetahuan, tetapi Anda dapat memberikan informasi umum berdasarkan pengetahuan Anda.
13. ANALISIS KONTEKS PERCAKAPAN: Perhatikan riwayat percakapan untuk memahami konteks lengkap dari pertanyaan pengguna. Jika pengguna merujuk ke pertanyaan atau jawaban sebelumnya, pastikan Anda menghubungkannya dengan jawaban Anda saat ini.
14. PERSONALISASI: Jika pengguna telah menyebutkan nama atau bisnis mereka dalam percakapan sebelumnya, gunakan informasi tersebut untuk mempersonalisasi jawaban Anda.
15. KONSISTENSI: Pastikan jawaban Anda konsisten dengan informasi yang telah Anda berikan sebelumnya dalam percakapan.
16. PROGRESIF: Bangun pengetahuan secara bertahap. Jika ini adalah pertanyaan lanjutan tentang topik yang sama, berikan informasi yang lebih mendalam daripada jawaban sebelumnya.`
      }
    ];
    
    // Add conversation history (limit to last 5 exchanges to keep context manageable)
    const recentHistory = conversationHistory.slice(-10);
    messages.push(...recentHistory);
    
    // Add current user query
    messages.push({
      role: 'user',
      content: query
    });

    // Create the request body for DeepSeek API
    const requestBody = {
      model: config.deepseek.model || 'deepseek-chat',
      messages: messages,
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
