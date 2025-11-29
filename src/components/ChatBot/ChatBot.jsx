import React, { useState, useEffect, useRef, useCallback } from 'react';
import './ChatBot.css';
import ReactMarkdown from 'react-markdown';
import triggerIcon from './chatbot-logo.png';
import botLogo from './chatbot-logo.png';
import iconTrash from './iconTrash.png';
import iconClose from './iconClose.png';
import iconCopy from './iconCopy.png';
import micIcon from './micIcon.png';
import micStopIcon from './micStopIcon.png';
import speakerIcon from './speakerIcon.png';
import speakerStopIcon from './speakerStopIcon.png';
import sendIcon from './sendIcon.png';

// API configuration - use environment variables in production
const AIMLAPI_BASE_URL = import.meta.env.VITE_AIMLAPI_BASE_URL || "https://api.aimlapi.com/v1";
const AIMLAPI_KEY = import.meta.env.VITE_AIMLAPI_KEY || "f59211da6a594bcdb5a4c694abd80a4b";

// ElevenLabs API configuration
const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY || "8d79efd5655e9843f7e34c5f0df361359913ca8321b9198d09cbd5abd605bf2b";
const ELEVENLABS_VOICE_ID = import.meta.env.VITE_ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM"; // Default: Rachel
const ELEVENLABS_API_URL = `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`;

const STORAGE_KEY = 'chatbot_messages';

const normalizeText = (value = "") =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const calcMatchScore = (search, media) => {
  const normalizedSearch = normalizeText(search);
  const titles = [
    media.title?.english,
    media.title?.romaji,
    media.title?.native
  ].filter(Boolean);

  if (titles.length === 0 || !normalizedSearch) return 0;

  let bestScore = 0;
  for (const title of titles) {
    const normalizedTitle = normalizeText(title);
    let score = 0;

    if (!normalizedTitle) continue;

    if (normalizedTitle === normalizedSearch) {
      score += 1000;
    } else if (
      normalizedTitle.includes(normalizedSearch) ||
      normalizedSearch.includes(normalizedTitle)
    ) {
      score += 600;
    } else {
      const searchWords = new Set(normalizedSearch.split(" "));
      const titleWords = new Set(normalizedTitle.split(" "));
      let overlap = 0;

      searchWords.forEach((word) => {
        if (word.length > 2 && titleWords.has(word)) {
          overlap += 1;
        }
      });

      if (overlap > 0) {
        score += overlap * 120;
      }
    }

    if (media.popularity) {
      score += media.popularity / 100;
    }

    bestScore = Math.max(bestScore, score);
  }

  return bestScore;
};

// Fetch manga by name - returns the most relevant match
async function fetchMangaFromAniList(searchText) {
  const normalized = searchText.toLowerCase().trim();

  const query = `
    query ($search: String) {
      Page(page: 1, perPage: 20) {
        media(search: $search, type: MANGA, sort: POPULARITY_DESC, isAdult: false) {
          id
          title { romaji english native }
          chapters
          genres
          description
          coverImage { large }
          siteUrl
          popularity
        }
      }
    }
  `;

  try {
    const response = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables: { search: searchText } })
    });

    if (!response.ok) return null;

    const data = await response.json();
    const results = data?.data?.Page?.media || [];

    if (results.length === 0) return null;

    const ranked = results
      .map((media) => ({
        media,
        score: calcMatchScore(normalized, media)
      }))
      .sort((a, b) => b.score - a.score || (b.media.popularity || 0) - (a.media.popularity || 0));

    return ranked[0]?.media || null;

  } catch (err) {
    console.error("AniList error:", err);
    return null;
  }
}

// Fetch top manga
async function fetchTopManga(sortType = "POPULARITY_DESC") {
  try {
    const query = `
      query {
        Page(page: 1, perPage: 10) {
          media(type: MANGA, sort: ${sortType}) {
            id
            title { romaji english }
            coverImage { large }
            siteUrl
          }
        }
      }
    `;

    const response = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ query })
    });

    const data = await response.json();
    return data?.data?.Page?.media || [];
  } catch (err) {
    console.error("AniList TOP error:", err);
    return [];
  }
}

// Extract manga name from commands like "open [name]", "show [name]", "find [name]"
function extractMangaName(text) {
  // Look for explicit commands: open, show, find, search, get
  const commandPattern = /(?:^|\b)(open|show|find|search|get|view)\s+(.+)/i;
  const match = text.match(commandPattern);

  if (match && match[2]) {
    let name = match[2].trim();
    // Cut trailing punctuation or filler words but keep multi-word titles
    name = name.replace(/[\.,!?]+$/, '');
    name = name.replace(/\b(please|pls|thanks?)$/i, '').trim();
    return name || null;
  }
  return null;
}

// Check if it's a "top 10" request
function isTop10Request(text) {
  return /top\s*10/i.test(text) || /top\s*ten/i.test(text);
}

export default function ChatBot() {
  const initialMessage = { 
    sender: 'bot', 
    text: 'Hi! I\'m a manga expert chatbot. You can:\n- Ask me about any manga\n- Type "top 10" to see the top 10 most popular manga\n- Type "open [manga name]" to find and view a specific manga\n- Or just chat with me about manga!' 
  };
  
  // Load messages from localStorage
  const loadMessages = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) && parsed.length > 0 ? parsed : [initialMessage];
      }
    } catch (err) {
      console.error("Error loading messages:", err);
    }
    return [initialMessage];
  };

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(loadMessages);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState(null);

  const messagesEndRef = useRef(null);
  const bodyRef = useRef(null);
  const recognitionRef = useRef(null);
  const audioRef = useRef(null);
  const audioUrlRef = useRef(null);

  // Save messages to localStorage
  const saveMessages = useCallback((newMessages) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newMessages));
    } catch (err) {
      console.error("Error saving messages:", err);
    }
  }, []);

  // Auto-scroll to last message
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, listening, scrollToBottom]);

  // SpeechRecognition setup
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = "en-US";
        recognition.interimResults = false;
        recognition.continuous = false;

        recognition.onstart = () => setListening(true);
        recognition.onend = () => setListening(false);
        recognition.onerror = (event) => {
          console.error("Speech recognition error:", event.error);
          setListening(false);
          if (event.error === 'not-allowed') {
            setError("Please allow microphone access in your browser settings");
          }
        };

        recognition.onresult = (event) => {
          const text = event.results[0][0].transcript;
          setInput(text);
          sendMessage(text);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const startVoice = () => {
    if (recognitionRef.current && !listening) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error("Error starting speech recognition:", err);
        setError("Failed to start speech recognition");
      }
    }
  };

  const stopVoice = () => {
    if (recognitionRef.current && listening) {
      recognitionRef.current.stop();
      setListening(false);
    }
  };

  const speak = async (text) => {
  if (!ELEVENLABS_API_KEY) {
    console.error("ElevenLabs API key is not configured");
    setError("Voice feature is not configured. Please set VITE_ELEVENLABS_API_KEY.");
    return;
  }

  // Stop any currently playing audio
  stopSpeaking();

  try {
    // Clean text from markdown
    const cleanText = text.replace(/[*#`\[\]()]/g, '').replace(/\n/g, ' ').trim();
    
    if (!cleanText) {
      return;
    }

    setSpeaking(true);

    // Call ElevenLabs API — НОВЫЙ MODEL_ID ДЛЯ FREE TIER
    const response = await fetch(ELEVENLABS_API_URL, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        text: cleanText,
        model_id: 'eleven_multilingual_v2',  // ← ЭТО ИСПРАВЛЕНИЕ! Бесплатная модель 2025
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorData.detail?.message || response.statusText}`);
    }

    // Get audio blob
    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    audioUrlRef.current = audioUrl;

    // Create audio element and play
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.onended = () => {
      setSpeaking(false);
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
    };

    audio.onerror = (error) => {
      console.error('Audio playback error:', error);
      setSpeaking(false);
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
      setError('Error playing audio');
    };

    await audio.play();

  } catch (err) {
    console.error('Speak error:', err);
    setSpeaking(false);
    // Clean up audio URL if it was created
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    setError(err.message || 'Error generating speech');
  }
};

  const stopSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      // Clean up the audio element
      audioRef.current.src = '';
      audioRef.current = null;
      setSpeaking(false);
    }
    // Clean up the audio URL
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      const notification = document.createElement('div');
      notification.textContent = 'Copied!';
      notification.className = 'copy-notification';
      document.body.appendChild(notification);
      setTimeout(() => {
        notification.remove();
      }, 2000);
    }).catch(err => {
      console.error('Error copying:', err);
    });
  };

  const clearHistory = () => {
    if (window.confirm('Are you sure you want to clear the message history?')) {
      const newMessages = [initialMessage];
      setMessages(newMessages);
      saveMessages(newMessages);
      stopSpeaking();
      stopVoice();
    }
  };

  // Send message
  const sendMessage = async (forcedInput = null) => {
    const userText = forcedInput || input;

    if (!userText.trim()) return;

    setError(null);
    const newUserMessage = { sender: "user", text: userText };
    setMessages(prev => {
      const updated = [...prev, newUserMessage];
      saveMessages(updated);
      return updated;
    });
    setInput('');
    setLoading(true);

    try {
      const textLower = userText.toLowerCase();
      let mangaData = null;
      let topMangaList = null;
      let isTop10 = false;
      let isOpenCommand = false;

      // Check for "top 10" command
      if (isTop10Request(userText)) {
        isTop10 = true;
        topMangaList = await fetchTopManga("POPULARITY_DESC");
      }
      // Check for manga search commands like "open one piece", "show naruto", etc.
      else {
        const mangaName = extractMangaName(userText);
        if (mangaName && !isTop10Request(userText)) {
          isOpenCommand = true;
          mangaData = await fetchMangaFromAniList(mangaName);
        }
      }

      // Prepare context for GPT
      let context = "";
      let systemMessage = "You are a friendly and knowledgeable manga expert chatbot. Help users with manga recommendations, information, and discussions. Keep responses conversational and helpful.";

      if (isTop10 && topMangaList && topMangaList.length > 0) {
        context = `### Top 10 Most Popular Manga:\n\n`;
        topMangaList.forEach((m, i) => {
          const title = m.title.english || m.title.romaji;
          context += `${i + 1}. **${title}**\n   [View Manga](http://127.0.0.1:5173/manga/${m.id})\n\n`;
        });
        systemMessage = "You are a manga expert. Present the top 10 manga list to the user in a friendly and engaging way. Format the response nicely using markdown.";
      } else if (isOpenCommand) {
        if (mangaData) {
          context = `Manga Found:\n\n`;
          context += `**Title:** ${mangaData.title?.english || mangaData.title?.romaji || mangaData.title?.native}\n\n`;
          
          if (mangaData.genres && mangaData.genres.length > 0) {
            context += `**Genres:** ${mangaData.genres.join(', ')}\n\n`;
          }
          if (mangaData.chapters) {
            context += `**Chapters:** ${mangaData.chapters}\n\n`;
          }
          if (mangaData.coverImage?.large) {
            context += `**Cover:** ${mangaData.coverImage.large}\n\n`;
          }
          if (mangaData.description) {
            context += `**Description:**\n${mangaData.description.replace(/<[^>]*>/g, '')}\n\n`;
          }
          if (mangaData.id) {
            context += `[View this manga](http://127.0.0.1:5173/manga/${mangaData.id})`;
          }
          
          systemMessage = "You are a manga expert. Present the manga information to the user in a friendly and engaging way. Make sure to include the link to view the manga. Format the response nicely using markdown.";
        } else {
          context = `No manga found with that name.`;
          systemMessage = "Inform the user politely that the manga was not found and suggest they try a different search term or check the spelling.";
        }
      }

      // Prepare conversation history (last 8 messages for context)
      const recentMessages = messages.slice(-8);
      const conversationHistory = recentMessages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      }));

      // Build GPT messages
      const gptMessages = [
        { role: "system", content: systemMessage },
        ...conversationHistory
      ];

      // Add context if we have manga data
      if (context) {
        gptMessages.push({
          role: "user",
          content: context + (isTop10 || isOpenCommand ? '' : `\n\nUser question: ${userText}`)
        });
      } else {
        // Regular chat - no manga data
        gptMessages.push({
          role: "user",
          content: userText
        });
      }

      // Call GPT API
      const res = await fetch(`${AIMLAPI_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${AIMLAPI_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: gptMessages,
          temperature: 0.7
        })
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`API error: ${res.status} - ${errorText}`);
      }

      const data = await res.json();
      const botText = data?.choices?.[0]?.message?.content || "Sorry, I couldn't process your request. Please try again.";

      setMessages(prev => {
        const updated = [...prev, { sender: 'bot', text: botText }];
        saveMessages(updated);
        return updated;
      });

    } catch (err) {
      console.error("Send message error:", err);
      const errorMessage = err.message?.includes('API error') 
        ? "API error. Please check your internet connection or try again later." 
        : "Error processing request. Please try again.";
      
      setMessages(prev => {
        const updated = [...prev, { sender: 'bot', text: errorMessage }];
        saveMessages(updated);
        return updated;
      });
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Cleanup on close
  useEffect(() => {
    if (!open) {
      stopSpeaking();
      stopVoice();
      setError(null);
    }
  }, [open]);

  return (
    <>
      <button 
        className="chatbot-btn" 
        onClick={() => setOpen(true)}
        aria-label="Open chat bot"
        title="Open chat bot"
      >
        <img src={triggerIcon} alt="Open chat bot" />
        {messages.length > 1 && (
          <span className="chatbot-badge">{messages.length - 1}</span>
        )}
      </button>

      {open && (
        <div className="chatbot-modal">
          <div className="chatbot-header">
            <div className="chatbot-brand">
              <img src={botLogo} alt="Bot logo" className="chatbot-logo" />
              <span>Ваш помощник</span>
            </div>
            <div className="chatbot-header-actions">
              <button 
                onClick={clearHistory} 
                className="chatbot-action-btn"
                title="Clear history"
                aria-label="Clear history"
              >
                <img src={iconTrash} alt="Clear chat history" />
              </button>
              <button 
                onClick={() => setOpen(false)} 
                className="chatbot-close"
                aria-label="Close"
              >
                <img src={iconClose} alt="Close chat" />
              </button>
            </div>
          </div>

          {error && (
            <div className="chatbot-error">
              {error}
              <button onClick={() => setError(null)}>×</button>
            </div>
          )}

          <div className="chatbot-body" ref={bodyRef}>
            {messages.map((msg, i) => (
              <div key={i} className={`chatbot-msg ${msg.sender}`}>
                <div className="chatbot-msg-content">
                  <ReactMarkdown 
                    components={{
                      a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" />
                    }}
                  >
                    {msg.text}
                  </ReactMarkdown>
                </div>
                <button 
                  className="chatbot-copy-btn"
                  onClick={() => copyToClipboard(msg.text)}
                  title="Copy"
                  aria-label="Copy message"
                >
                  <img src={iconCopy} alt="Copy message" />
                </button>
              </div>
            ))}

            {listening && (
              <div className="chatbot-msg bot">
                <div className="chatbot-msg-content">
                  🎙 Listening... 
                  <button 
                    className="chatbot-stop-btn"
                    onClick={stopVoice}
                    title="Stop recording"
                  >
                    <img src={micStopIcon} alt="Stop recording" />
                  </button>
                </div>
              </div>
            )}

            {loading && (
              <div className="chatbot-msg bot">
                <div className="chatbot-msg-content chatbot-loading">
                  <span className="chatbot-dots">
                    <span>.</span>
                    <span>.</span>
                    <span>.</span>
                  </span>
                  Processing
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="chatbot-footer">
            <button
              className={`voice-btn ${listening ? "listening" : ""}`}
              onClick={listening ? stopVoice : startVoice}
              disabled={loading}
              title={listening ? "Stop recording" : "Start voice input"}
              aria-label={listening ? "Stop recording" : "Start voice input"}
            >
              <img 
                src={listening ? micStopIcon : micIcon} 
                alt={listening ? "Stop recording" : "Start voice input"} 
              />
            </button>

            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Type or say..."
              disabled={loading || listening}
              aria-label="Enter message"
            />

            <button 
              className="send-btn" 
              onClick={() => sendMessage()} 
              disabled={loading || !input.trim() || listening}
              title="Send"
              aria-label="Send message"
            >
              <img src={sendIcon} alt="Send message" />
            </button>

            <button 
              className={`voice-btn playback-btn ${speaking ? "speaking" : ""}`}
              onClick={speaking ? stopSpeaking : () => {
                const lastBotMsg = messages.filter(m => m.sender === 'bot').pop();
                if (lastBotMsg) {
                  speak(lastBotMsg.text);
                }
              }}
              disabled={messages.length === 0 || !messages.filter(m => m.sender === 'bot').length}
              title={speaking ? "Stop playback" : "Play last response"}
              aria-label={speaking ? "Stop playback" : "Play last response"}
            >
              <img 
                src={speaking ? speakerStopIcon : speakerIcon} 
                alt={speaking ? "Stop playback" : "Play last response"} 
              />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
