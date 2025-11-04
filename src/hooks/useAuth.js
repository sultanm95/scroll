import { useState, useEffect } from 'react';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = () => {
    const savedUser = localStorage.getItem('user');
    const authToken = localStorage.getItem('authToken');
    
    if (savedUser && authToken) {
      try {
        const userObj = JSON.parse(savedUser);
        if (userObj && userObj.id && userObj.token === authToken) {
          // Verify token expiration
          const payload = JSON.parse(atob(authToken.split('.')[1]));
          if (payload.exp * 1000 > Date.now()) {
            setUser(userObj);
            setIsAuthenticated(true);
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
    
    // If we reach here, user is not authenticated
    setUser(null);
    setIsAuthenticated(false);
    setLoading(false);
    
    // Clear any existing auth data
    if (savedUser || authToken) {
      signOut();
    }
  };

  const signOut = () => {
    const keysToRemove = [
      'user',
      'authToken',
      'profileAvatar',
      'avatarPath',
      'signedInUser',
      'mangaList',
      'favorites',
      'theme',
      'library'
    ];
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    sessionStorage.clear();
    
    setUser(null);
    setIsAuthenticated(false);
    
    // Redirect to home page and force reload
    if (window.location.pathname !== '/index.html' && window.location.pathname !== '/') {
      window.location.href = 'index.html';
    } else {
      window.location.reload();
    }
  };

  return {
    isAuthenticated,
    user,
    loading,
    checkAuthState,
    signOut
  };
};