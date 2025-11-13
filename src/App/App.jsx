import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "../components/Auth/AuthContext";
import Header from "../components/Header/Header";
import MangaList from "../components/MangaDetails/MangaList/MangaList";
import Catalog from "../components/Catalog/Catalog";
import MangaDetails from "../components/MangaDetails/MangaDetails";
import SearchPage from "../pages/SearchPage/SearchPage";
import ProfilePage from "../pages/ProfilePage/ProfilePage";
import MusicPage from "../pages/MusicPage/MusicPage";
import MangaReader from "../pages/MangaReader/MangaReader";
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
              <Route path="/catalog" element={<Catalog />} />
              <Route path="/manga/:id" element={<MangaDetails />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/music" element={<MusicPage />} />
              <Route path="/reader/:mangaId/:chapter?" element={<MangaReader />} />
              <Route path="/library" element={<LibraryPage />} />
              <Route path="/reviews" element={<ReviewsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
