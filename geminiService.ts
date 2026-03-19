import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Article, SearchResult, MiniBlogPost } from "../types";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Helper to get today's date for context
const getTodayDate = () => new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

// Initialize Gemini API Client safely – use environment variable via react-native-config or process.env if available
// For React Native, you might use react-native-dotenv or similar.
// We'll assume API_KEY is available via process.env (Metro with dotenv) or fallback.
const apiKey = process.env.API_KEY || 'MISSING_KEY'; // You must set this in your environment
const ai = new GoogleGenAI({ apiKey });

// Cache configuration (using AsyncStorage)
const CACHE_EXPIRY = 15 * 60 * 1000; // 15 minutes
const SEARCH_CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

const CACHE_KEYS = {
  FEED: 'see_search_feed_cache',
  BLOGS: 'see_search_blogs_cache',
  SEARCH_PREFIX: 'see_search_q_',
  ARTICLE_PREFIX: 'see_article_'
};

// Helper to generate a topic-specific image securely – using LoremFlickr (or any public image placeholder)
const getTopicImage = (title: string, category: string = 'news') => {
  const cleanCategory = category.replace(/[^a-zA-Z]/g, '').toLowerCase() || 'news';
  const titleWords = title.split(' ').filter(w => w.length > 4);
  const randomTitleWord = titleWords.length > 0 ? titleWords[Math.floor(Math.random() * titleWords.length)].replace(/[^a-zA-Z]/g, '') : 'world';
  // Use a unique lock per request to ensure different images for different items
  return `https://loremflickr.com/800/600/${cleanCategory},${randomTitleWord}?lock=${Math.floor(Math.random() * 100000)}`;
};

// AsyncStorage helpers with expiry
const getCachedData = async <T>(key: string, expiry = CACHE_EXPIRY): Promise<T | null> => {
  try {
    const cached = await AsyncStorage.getItem(key);
    if (!cached) return null;
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > expiry) {
      await AsyncStorage.removeItem(key);
      return null;
    }
    return data;
  } catch {
    return null;
  }
};

const setCachedData = async (key: string, data: any) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
  } catch (e) {
    console.warn("Failed to save to cache:", e);
  }
};

async function callWithRetry<T>(fn: () => Promise<T>, retries = 2, delay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const errorStr = JSON.stringify(error).toLowerCase();
    const isRateLimit = errorStr.includes('429') || 
                        errorStr.includes('resource_exhausted') || 
                        errorStr.includes('quota') ||
                        error?.status === 429 || 
                        error?.code === 429;

    if (isRateLimit) {
        console.warn("Quota limit detected.");
        throw new Error("QUOTA_EXCEEDED");
    }

    if (retries > 0) {
      const jitter = Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay + jitter));
      return callWithRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

/**
 * Validates user post content for spam or fake news
 */
export const validatePostContent = async (text: string): Promise<{ isValid: boolean; reason?: string }> => {
  try {
    const prompt = `Act as a content moderator. Analyze this post text for:
    1. Spam
    2. Fake News
    3. Hate speech.
    Text: "${text}"
    Return JSON: { "isValid": boolean, "reason": "string (only if invalid)" }`;

    const response: GenerateContentResponse = await callWithRetry(() => ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isValid: { type: Type.BOOLEAN },
            reason: { type: Type.STRING }
          },
          required: ["isValid"]
        }
      }
    }));

    return JSON.parse(response.text || '{"isValid": true}');
  } catch (error) {
    return { isValid: true };
  }
};

export const fetchTrendingFeed = async (page: number = 1): Promise<Article[]> => {
  const cacheKey = `${CACHE_KEYS.FEED}_page_${page}`;
  const cached = await getCachedData<Article[]>(cacheKey);
  if (cached) return cached;

  try {
    const prompt = `Find the top 10 trending real-world news stories for today, ${getTodayDate()}. 
    Focus on Global Technology, Business, Science, and major World Events. 
    USE GOOGLE SEARCH to ensure all data is REAL-TIME and accurate.
    
    CRITICAL: Try to find the actual lead image URL for each article from the source (e.g. from the meta tags of the page).
    
    Return a JSON array where each object has:
    - title: The actual news headline.
    - source: The publisher name.
    - timeAgo: Estimated time.
    - category: A short category tag.
    - imageUrl: The direct URL to the article's main image. Leave empty if not found.`;

    const response: GenerateContentResponse = await callWithRetry(() => ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              source: { type: Type.STRING },
              timeAgo: { type: Type.STRING },
              category: { type: Type.STRING },
              imageUrl: { type: Type.STRING }
            },
            required: ["title", "source", "timeAgo", "category", "imageUrl"]
          }
        }
      }
    }));

    const data = JSON.parse(response.text || "[]");
    const augmentedData = data.map((item: any, index: number) => ({
      ...item,
      id: `article-${page}-${index}-${Date.now()}`,
      // Use source image if found and valid, else generate one
      imageUrl: (item.imageUrl && item.imageUrl.startsWith('http')) 
        ? item.imageUrl 
        : getTopicImage(item.title, item.category)
    }));

    if (augmentedData.length > 0) {
        await setCachedData(cacheKey, augmentedData);
    }
    return augmentedData;

  } catch (error: any) {
    console.warn("Error fetching feed:", error.message);
    return [];
  }
};

export const fetchRelatedArticles = async (query: string, page: number = 1): Promise<Article[]> => {
  try {
    const prompt = `Act as a search engine. Find 4 specific, REAL-WORLD articles using Google Search that DIRECTLY relate to: "${query}".
    
    Guidelines:
    1. Use Google Search to find actual, real-time content.
    2. Try to extract the lead image URL for each article.
    3. Return a JSON array.
    4. NO EMOJIS in title or source.
    
    Data Schema:
    - title: Actual headline.
    - source: Publisher name.
    - timeAgo: Relative time.
    - category: Relevant tag.
    - imageUrl: Direct URL to the article image if found.`;

    const response: GenerateContentResponse = await callWithRetry(() => ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              source: { type: Type.STRING },
              timeAgo: { type: Type.STRING },
              category: { type: Type.STRING },
              imageUrl: { type: Type.STRING }
            },
            required: ["title", "source", "timeAgo", "category", "imageUrl"]
          }
        }
      }
    }));

    const data = JSON.parse(response.text || "[]");
    return data.map((item: any, index: number) => ({
      ...item,
      id: `related-${page}-${index}-${Date.now()}`,
      imageUrl: (item.imageUrl && item.imageUrl.startsWith('http')) 
        ? item.imageUrl 
        : getTopicImage(item.title, item.category || 'news')
    }));
  } catch (error) {
    return [];
  }
};

export const fetchArticleContent = async (title: string, source: string): Promise<string> => {
  const cacheKey = CACHE_KEYS.ARTICLE_PREFIX + title.replace(/\s+/g, '_').toLowerCase();
  const cached = await getCachedData<string>(cacheKey);
  if (cached) return cached;

  try {
    const prompt = `You are a professional journalist.
    Task: Write a comprehensive, factual article about: "${title}".
    
    Instructions:
    1. STRICT RULE: DO NOT USE EMOJIS anywhere.
    2. Use Google Search to find the very latest facts, figures, and context.
    3. Ensure the information is UP-TO-DATE and REAL-TIME.
    4. Structure:
       - Use ## for Main Headings.
       - Use ### for Subheadings.
       - Use bullet points for key data.
    5. Tone: Objective, serious, and informative.
    6. Length: 400-600 words.
    
    Source Context: ${source}`;

    const response: GenerateContentResponse = await callWithRetry(() => ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }] 
      }
    }));

    const text = response.text || "Content currently unavailable.";
    await setCachedData(cacheKey, text);
    return text;
  } catch (error: any) {
    const isQuota = error.message === "QUOTA_EXCEEDED" || 
                    (error.message && error.message.includes("429")) || 
                    JSON.stringify(error).includes("429") ||
                    JSON.stringify(error).includes("quota");

    if (isQuota) {
        return `
## High Demand - System Busy

We are currently experiencing extremely high traffic volumes which has temporarily limited our ability to generate real-time deep dive content for this specific article.

### Quick Summary
*   **Topic:** ${title}
*   **Status:** System is cooling down.
*   **Action:** Please try again in a few minutes or check the original source.

You can still browse other cached articles and feeds.
        `;
    }

    return `
## Content Unavailable

We are currently unable to retrieve the full details for this story. 

### What you can do:
*   Check back in a few minutes.
*   Try searching for **"${title}"** in the main search bar.
*   Browse other trending articles in the Discovery feed.
    `;
  }
};

export const fetchMiniBlogs = async (page: number = 1): Promise<MiniBlogPost[]> => {
  if (page === 1) {
    const cached = await getCachedData<MiniBlogPost[]>(CACHE_KEYS.BLOGS);
    if (cached) return cached;
  }

  try {
    const prompt = `Use Google Search to find the REAL-TIME trending discussions in AI, Space, Tech, and Science for today, ${getTodayDate()}.
    Generate 10 engaging social media posts based on these ACTUAL current events and trends.
    Content MUST be professional and factual.
    DO NOT use emojis in the content.
    Return JSON array.`;

    const response: GenerateContentResponse = await callWithRetry(() => ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              authorName: { type: Type.STRING },
              authorHandle: { type: Type.STRING },
              content: { type: Type.STRING },
              timestamp: { type: Type.STRING },
              likes: { type: Type.STRING },
              replies: { type: Type.STRING },
              reposts: { type: Type.STRING },
              views: { type: Type.STRING },
              isVerified: { type: Type.BOOLEAN },
              user_id: { type: Type.STRING }
            },
            required: ["authorName", "authorHandle", "content", "timestamp", "likes", "replies", "reposts", "views", "isVerified", "user_id"]
          }
        }
      }
    }));

    const data = JSON.parse(response.text || "[]");
    const augmentedData = data.map((item: any, index: number) => ({
      ...item,
      id: `post-${page}-${index}-${Date.now()}`,
      authorAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(item.authorName)}&background=random`,
      imageUrl: Math.random() > 0.7 ? getTopicImage(item.content.substring(0, 30), 'social') : undefined
    }));

    if (page === 1) await setCachedData(CACHE_KEYS.BLOGS, augmentedData);
    return augmentedData;

  } catch (error) {
    return [];
  }
};

export const performSearch = async (query: string): Promise<SearchResult> => {
  const cacheKey = CACHE_KEYS.SEARCH_PREFIX + query.trim().toLowerCase();
  const cached = await getCachedData<SearchResult>(cacheKey, SEARCH_CACHE_EXPIRY);
  if (cached) return cached;

  try {
    const prompt = `
    Role: Intelligent, Culturally Aware Search Engine.
    Query: "${query}"

    Instructions:
    1. **Nickname Detection**: If the user searches for "Gini", "Ginni", "Gini Karke", or "Sonu", check if they are referring to the popular Indian social media influencer **Nandini Nayal** (often called Ginni). PRIORITIZE this profile over economic definitions (Gini Coefficient) unless the query explicitly asks for economics/math.
    2. **Disambiguation**: If ambiguous, show the Influencer/Person first (e.g., "Nandini Nayal (Ginni)"), then the secondary meaning (Economic Index) briefly.
    3. **Real-Time Data**: Use Google Search to find the latest updates on this person.
    4. **Direct Answer**: Start with the Identity. "Ginni usually refers to..."
    5. **Formatting**: Markdown. Use ## for main sections. Use bullet points for facts. 
    6. **STRICT PROHIBITION**: DO NOT USE EMOJIS.
    
    Structure:
    - Identity/Direct Answer (Who is this person? / What is this?)
    - Key Facts/Trends (Bullet points)
    - Context (Why are they trending or relevant?)
    `;

    const [summaryResp, relatedArticles] = await Promise.all([
      callWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }] 
        }
      })),
      fetchRelatedArticles(query, 1)
    ]);

    let text = summaryResp.text || "No results found.";
    
    // Clean citation numbers from text
    text = text.replace(/\[\s*\d+(?:,\s*\d+)*\s*\]/g, '');

    const chunks = summaryResp.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = chunks
      .map(chunk => chunk.web ? { uri: chunk.web.uri, title: chunk.web.title } : undefined)
      .filter((s): s is { uri: string; title: string } => !!s);

    const result = { text, sources, relatedArticles };
    await setCachedData(cacheKey, result);
    return result;

  } catch (error: any) {
    return {
      text: `### High Traffic - Limited Results\n\nWe are currently experiencing very high search volume. Here are some general updates while we cooldown:\n\n*   Please try your specific search again in a few moments.\n*   Check the trending articles below for general news.\n\nWe apologize for the inconvenience.`,
      sources: [],
      relatedArticles: []
    };
  }
};

export const translateContent = async (text: string, targetLanguage: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Translate the following markdown text to ${targetLanguage}. 
      IMPORTANT:
      1. Maintain all original markdown formatting (bolding, headers, lists).
      2. Do not translate code blocks or URLs.
      3. Output ONLY the translated text.
      4. DO NOT USE EMOJIS.
      
      Text:
      ${text}`
    });
    return response.text || text;
  } catch (error) {
    return text;
  }
};