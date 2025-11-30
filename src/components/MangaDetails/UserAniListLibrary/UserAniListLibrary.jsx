import React, { useEffect, useState } from "react";
import MangaCategory from "../MangaCategory/MangaCategory";
import "./UserAniListLibrary.css";

const CATEGORIES = {
  favorites: { title: "Избранное", empty: "Нет избранного" },
  reading: { title: "Читаю", empty: "Вы ничего не читаете" },
  completed: { title: "Прочитано", empty: "Вы ничего не прочли" },
  planning: { title: "В планах", empty: "Нет планов" },
  dropped: { title: "Брошено", empty: "Нет брошенного" },
};

export default function UserAniListLibrary({ username, userId }) {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadLibrary();
  }, [username, userId]);

  async function loadLibrary() {
    setLoading(true);
    setError(null);

    try {
      // -----------------------------
      // 1. AniList GraphQL query
      // -----------------------------
      const aniListQuery = `
        query ($name: String) {
          User(name: $name) {
            id
            name
            favourites {
              manga {
                nodes {
                  id
                  title { romaji }
                  coverImage { large }
                }
              }
            }
          }
          MediaListCollection(userName: $name, type: MANGA) {
            lists {
              entries {
                status
                media {
                  id
                  title { romaji }
                  coverImage { large }
                }
              }
            }
          }
        }
      `;

      const aniRes = await fetch("https://graphql.anilist.co", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: aniListQuery, variables: { name: username } }),
      });

      if (!aniRes.ok) throw new Error(`AniList HTTP ${aniRes.status}`);
      const aniJSON = await aniRes.json();
      if (aniJSON.errors) throw new Error(aniJSON.errors[0]?.message);

      const aniUser = aniJSON.data?.User;
      const aniLists = aniJSON.data?.MediaListCollection?.lists || [];

      // --- Разделяем по статусам AniList ---
      const aniFavorites = aniUser?.favourites?.manga?.nodes || [];
      const aniReading = [];
      const aniCompleted = [];
      const aniPlanning = [];
      const aniDropped = [];

      aniLists.forEach(list => {
        list.entries.forEach(entry => {
          const m = entry.media;
          switch (entry.status) {
            case "CURRENT": aniReading.push(m); break;
            case "COMPLETED": aniCompleted.push(m); break;
            case "PLANNING": aniPlanning.push(m); break;
            case "DROPPED": aniDropped.push(m); break;
          }
        });
      });

      // -----------------------------
      // 2. Загрузка локальной библиотеки
      // -----------------------------
      const localRes = await fetch(`http://localhost:3001/api/users/${userId}/library`);
      if (!localRes.ok) throw new Error("Failed to load local library");
      const local = await localRes.json();

      // -----------------------------
      // 3. Объединяем AniList + локальные данные
      // -----------------------------
      const merged = {
        favorites: mergeArrays(aniFavorites, local.favorites),
        reading: mergeArrays(aniReading, local.reading),
        completed: mergeArrays(aniCompleted, local.completed),
        planning: mergeArrays(aniPlanning, local.planToRead),
        dropped: mergeArrays(aniDropped, local.dropped),
      };

      setData(merged);
    } catch (err) {
      console.error("Library load error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // --- Функция объединения массивов без дублей по id ---
  function mergeArrays(arr1 = [], arr2 = []) {
    const map = new Map();
    [...arr1, ...arr2].forEach(m => map.set(m.id, m));
    return Array.from(map.values());
  }

  function openManga(id) {
    window.location.href = `/manga/${id}`;
  }

  if (loading) return <div className="user-anilist-library">Загрузка библиотеки...</div>;
  if (error) return <div className="user-anilist-library">Ошибка: {error}</div>;

  const hasAnyData = Object.values(data).some(arr => arr.length > 0);

  return (
    <div className="user-anilist-library">
      <h1>Ваша библиотека манги</h1>

      {!hasAnyData && (
        <div className="user-anilist-library__empty">
          Ваша библиотека пуста. Добавьте мангу в AniList или локально!
        </div>
      )}

      {Object.keys(CATEGORIES).map(key => (
        <MangaCategory
          key={key}
          title={CATEGORIES[key].title}
          emptyMessage={CATEGORIES[key].empty}
          data={data[key] || []}
          onOpen={openManga}
        />
      ))}
    </div>
  );
}
