import React, { useState } from 'react';
import './ChatBot.css';
import ReactMarkdown from 'react-markdown';

const RAPIDAPI_HOST = "chatgpt-best-price.p.rapidapi.com";
const RAPIDAPI_KEY = "acb9c70d4dmsh57b3a9137d0eab0p1e4132jsn6375289c8556";

// Получить информацию о манге с собственного backend, который работает как proxy к AniList
async function fetchMangaFromAniList(searchText) {
  try {
    const query = `
      query ($search: String) {
        manga: Media(search: $search, type: MANGA) {
          id
          title { romaji english native }
          chapters
          genres
          description
          coverImage { large }
          siteUrl
        }
        anime: Media(search: $search, type: ANIME) {
          id
          title { romaji english native }
          episodes
          genres
          description
          coverImage { large }
          siteUrl
        }
      }
    `;

    const response = await fetch("https://graphql.anilist.co", { // ⚠️ без слэша!
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ query, variables: { search: searchText } })
    });

    if (!response.ok) {
      console.error("AniList returned:", response.status);
      return null;
    }

    const data = await response.json();
    const result = data?.data?.manga || data?.data?.anime || null;
    return result;
  } catch (err) {
    console.error("AniList error:", err);
    return null;
  }
}




export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Привет! Я манга-бот, можешь спросить про любую мангу.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // 1. Получаем данные с вашего backend
      const manga = await fetchMangaFromAniList(input);

      let context = "";
      if (manga) {
        let info = `Название: ${manga.title?.english || manga.title?.romaji || manga.title?.native}`;
        if (manga.genres && manga.genres.length)
          info += `\nЖанры: ${manga.genres.join(', ')}`;
        if (manga.chapters)
          info += `\nГлав всего: ${manga.chapters}`;
        if (manga.siteUrl)
          info += `\nПодробнее: ${manga.siteUrl}`;
        if (manga.coverImage?.large)
          info += `\nКартинка: ${manga.coverImage.large}`;
        if (manga.description)
          info += `\nОписание: ${(manga.description.replace(/<br>/g, '\n')).replace(/<[^>]*>/g, '')}`;
        context = `Ты помощник по манге. Используй только эти свежие данные, отвечай кратко и по делу. Не придумывай лишнего. Если просят факты — опирайся только на то, что дано ниже.\n\n${info}`;
      } else {
        context = "Манга по этому запросу не найдена в нашей базе AniList. Сообщи пользователю, что ничего не удалось найти, и предложи уточнить название (на английском или японском).";
      }

      // 2. Запрос к ChatGPT
      const res = await fetch("https://chatgpt-best-price.p.rapidapi.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-rapidapi-host": RAPIDAPI_HOST,
          "x-rapidapi-key": RAPIDAPI_KEY
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: context },
            { role: "user", content: input }
          ]
        })
      });

      const data = await res.json();
      const botText = data?.choices?.[0]?.message?.content || "Нет ответа от ИИ.";
      setMessages(msgs => [...msgs, { sender: 'bot', text: botText }]);
    } catch (err) {
      setMessages(msgs => [
        ...msgs,
        { sender: 'bot', text: "Ошибка: не удалось получить ответ или мангу. Попробуйте позже!" }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button className="chatbot-btn" onClick={() => setOpen(true)}>
        💬
      </button>
      {open && (
        <div className="chatbot-modal">
          <div className="chatbot-header">
            <span>Чат-Бот</span>
            <button onClick={() => setOpen(false)} className="chatbot-close">×</button>
          </div>
          <div className="chatbot-body">
            {messages.map((msg, i) => (
              <div key={i} className={`chatbot-msg ${msg.sender}`}>
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
            ))}
            {loading && <div className="chatbot-msg bot">Получаю свежую информацию...</div>}
          </div>
          <div className="chatbot-footer">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Спроси что-нибудь!"
              disabled={loading}
            />
            <button onClick={sendMessage} disabled={loading || !input.trim()}>Отправить</button>
          </div>
        </div>
      )}
    </>
  );
}