import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./components/Auth/AuthContext";
import Header from "./components/Header/Header";
import MangaList from "./components/MangaList/MangaList";
import Catalog from "./components/Catalog/Catalog";
import MangaDetails from "./components/MangaDetails/MangaDetails";
import SearchPage from "./pages/SearchPage";
import ProfilePage from "./pages/ProfilePage";
import MusicPage from "./pages/MusicPage";
import MangaReader from "./pages/MangaReader";
import { LibraryPage } from "./pages/LibraryPage";
import { ReviewsPage } from "./pages/ReviewsPage";
import { SettingsPage } from "./pages/SettingsPage";
import Galaxy from "./components/Galaxy/Galaxy";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app">
          <Galaxy
            density={0.3}
            glowIntensity={0.4}
            saturation={0.0}
            hueShift={180}
            starSpeed={0.3}
            rotationSpeed={0.05}
            mouseRepulsion={false}
            repulsionStrength={1.5}
            twinkleIntensity={0.4}
            transparent={true}
            className="background-galaxy"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              zIndex: -1,
              pointerEvents: 'none'
            }}
          />
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
