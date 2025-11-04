import React from 'react';
import './Pagination.css';

const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange 
}) => {
  const showFirstLast = totalPages > 3;

  const renderPageNumbers = () => {
    const pages = [];
    let startPage, endPage;

    if (totalPages <= 5) {
      startPage = 1;
      endPage = totalPages;
    } else {
      if (currentPage <= 3) {
        startPage = 1;
        endPage = 5;
      } else if (currentPage + 2 >= totalPages) {
        startPage = totalPages - 4;
        endPage = totalPages;
      } else {
        startPage = currentPage - 2;
        endPage = currentPage + 2;
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          className={`pagination-button ${currentPage === i ? 'active' : ''}`}
          onClick={() => onPageChange(i)}
        >
          {i}
        </button>
      );
    }

    if (startPage > 1) {
      pages.unshift(
        <span key="ellipsis-start" className="pagination-ellipsis">
          ...
        </span>
      );
    }

    if (endPage < totalPages) {
      pages.push(
        <span key="ellipsis-end" className="pagination-ellipsis">
          ...
        </span>
      );
    }

    return pages;
  };

  return (
    <div className="pagination">
      {showFirstLast && (
        <button
          className="pagination-button nav-button"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          title="Первая страница"
        >
          ⟪
        </button>
      )}
      
      <button
        className="pagination-button nav-button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        title="Предыдущая страница"
      >
        ⟨
      </button>

      {renderPageNumbers()}

      <button
        className="pagination-button nav-button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        title="Следующая страница"
      >
        ⟩
      </button>

      {showFirstLast && (
        <button
          className="pagination-button nav-button"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          title="Последняя страница"
        >
          ⟫
        </button>
      )}
    </div>
  );
};

export default Pagination;