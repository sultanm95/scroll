import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "../components/Auth/AuthContext";
import Header from "../components/Header/Header";
import MangaList from "../components/MangaDetails/MangaList/MangaList";
import Catalog from "../components/Catalog/Catalog";
import MangaDetails from "../components/MangaDetails/MangaDetails.jsx";
import SearchPage from "../pages/SearchPage/SearchPage";
import ProfilePage from "../pages/ProfilePage/ProfilePage";
import MusicPage from "../pages/MusicPage/MusicPage";
import MusicProfilePage from "../pages/MusicProfilePage/MusicProfilePage";
import ReaderPage from "../pages/ReaderPage/ReaderPage";
import ChatBot from "../components/ChatBot/ChatBot";
import { LibraryPage } from "../pages/LibraryPage/LibraryPage";
import { ReviewsPage } from "../pages/ReviewsPage/ReviewsPage";
import { SettingsPage } from "../pages/SettingsPage/SettingsPage";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app">
          <Header />
          <main className="content">
            <Routes>
              <Route path="/" element={<MangaList />} />
              <Route path="/index.html" element={<MangaList />} />
              <Route path="/catalog" element={<Catalog />} />
              <Route path="/manga/:id" element={<MangaDetails />} />
              <Route path="/music/:id" element={<MusicProfilePage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/reader-search" element={<ReaderPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/music" element={<MusicPage />} />
              <Route path="/playlist" element={<MusicPage />} />
              <Route path="/charts" element={<MusicPage />} />
              <Route path="/library" element={<LibraryPage />} />
              <Route path="/reviews" element={<ReviewsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </main>
          <ChatBot />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
