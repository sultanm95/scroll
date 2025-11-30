import React, { useState, useEffect } from 'react';
import './ThemeToggle.css';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);

  // Загрузить сохраненную тему при монтировании
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    const isDarkTheme = savedTheme === 'dark';
    setIsDark(isDarkTheme);
    applyTheme(isDarkTheme);
  }, []);

  const applyTheme = (dark) => {
    const root = document.documentElement;
    if (dark) {
      root.style.setProperty('--bg-primary', '#060010');
      root.style.setProperty('--bg-secondary', '#0a0014');
      root.style.setProperty('--text-primary', '#ffffff');
      root.style.setProperty('--text-secondary', 'rgba(255, 255, 255, 0.7)');
      root.style.setProperty('--border-color', '#492020');
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.style.setProperty('--bg-primary', '#ffffff');
      root.style.setProperty('--bg-secondary', '#f5f5f5');
      root.style.setProperty('--text-primary', '#1a1a1a');
      root.style.setProperty('--text-secondary', 'rgba(26, 26, 26, 0.7)');
      root.style.setProperty('--border-color', '#e0e0e0');
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
    }
  };

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    applyTheme(newIsDark);
  };

  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      title={isDark ? 'Светлая тема' : 'Темная тема'}
      aria-label="Toggle theme"
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  );
}
