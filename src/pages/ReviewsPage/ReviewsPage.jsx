import React from 'react';
import './ReviewsPage.css';

export function ReviewsPage() {
  return (
    <div className="reviews-page">
      <div className="reviews-header">
        <h1>Отзывы</h1>
        <p>Эта страница находится в разработке</p>
      </div>
      <div className="reviews-content">
        <div className="coming-soon">
          <span className="material-icons">construction</span>
          <h2>Скоро здесь появятся отзывы</h2>
          <p>Мы работаем над этим разделом. Возвращайтесь позже!</p>
        </div>
      </div>
    </div>
  );
}