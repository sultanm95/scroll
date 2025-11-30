import React from 'react';
import './ReviewElement.css';

const ReviewElement = ({ review, onNavigate }) => {
  if (!review) {
    return (
      <div className="review-element">
        <div className="review-empty">Нет отзывов</div>
      </div>
    );
  }

  const truncateText = (text, maxLength = 60) => {
    if (!text) return '';
    if (text.length > maxLength) {
      return text.substring(0, maxLength) + '...';
    }
    return text;
  };

  return (
    <div className="review-element">
      {review.mangaCover && (
        <div className="review-cover">
          <img 
            src={review.mangaCover} 
            alt={review.mangaTitle}
            className="review-cover-img"
          />
        </div>
      )}

      <div className="review-body">
        <div className="review-header">
          <div className="review-rating">
            ⭐ {review.rating}/10
          </div>
          <span className="review-status">Отзыв</span>
        </div>

        <h3 className="review-title">{review.mangaTitle}</h3>

        <p className="review-content">
          {truncateText(review.content, 80)}
        </p>
      </div>
    </div>
  );
};

export default ReviewElement;
