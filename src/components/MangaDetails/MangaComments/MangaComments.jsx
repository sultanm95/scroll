import React, { useState, useEffect } from 'react';
import { useAuth } from '../../Auth/AuthContext';
import './MangaComments.css';

const MangaComments = ({ mangaId }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    loadComments();
  }, [mangaId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/api/comments?mangaId=${mangaId}`);
      const data = await response.json();
      setComments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading comments:', error);
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!user) {
      alert('Пожалуйста, войдите в аккаунт');
      return;
    }

    if (!newComment.trim()) {
      alert('Комментарий не может быть пустым');
      return;
    }

    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    
    setSubmitting(true);
    try {
      const response = await fetch('http://localhost:3001/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          mangaId,
          content: newComment.trim(),
          rating
        })
      });

      if (response.ok) {
        const comment = await response.json();
        setComments([comment, ...comments]);
        setNewComment('');
        setRating(5);
      } else {
        alert('Ошибка при добавлении комментария');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      alert('Ошибка при добавлении комментария');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddReply = async (parentId) => {
    if (!user) {
      alert('Пожалуйста, войдите в аккаунт');
      return;
    }

    if (!replyContent.trim()) {
      alert('Ответ не может быть пустым');
      return;
    }

    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    
    try {
      const response = await fetch('http://localhost:3001/api/comments/reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          mangaId,
          parentId,
          content: replyContent.trim()
        })
      });

      if (response.ok) {
        const updatedComment = await response.json();
        setComments(comments.map(c => c.id === parentId ? updatedComment : c));
        setReplyingTo(null);
        setReplyContent('');
      } else {
        alert('Ошибка при добавлении ответа');
      }
    } catch (error) {
      console.error('Error posting reply:', error);
      alert('Ошибка при добавлении ответа');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Вы уверены, что хотите удалить комментарий?')) return;

    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    
    try {
      await fetch(`http://localhost:3001/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setComments(comments.filter(c => c.id !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Ошибка при удалении комментария');
    }
  };

  const handleEditComment = async (commentId) => {
    if (!editContent.trim()) {
      alert('Комментарий не может быть пустым');
      return;
    }

    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    
    try {
      const response = await fetch(`http://localhost:3001/api/comments/${commentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: editContent.trim() })
      });

      if (response.ok) {
        const updated = await response.json();
        setComments(comments.map(c => c.id === commentId ? updated : c));
        setEditingId(null);
        setEditContent('');
      }
    } catch (error) {
      console.error('Error updating comment:', error);
    }
  };

  const handleDeleteReply = async (commentId, replyId) => {
    if (!confirm('Удалить ответ?')) return;

    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    
    try {
      const response = await fetch(`http://localhost:3001/api/comments/${commentId}/replies/${replyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const updatedComment = await response.json();
        setComments(comments.map(c => c.id === commentId ? updatedComment : c));
      }
    } catch (error) {
      console.error('Error deleting reply:', error);
    }
  };

  const startEditing = (comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const renderReplies = (replies, parentId) => {
    return (
      <div className="replies-list">
        {replies?.map(reply => (
          <div key={reply.id} className="reply-item">
            <div className="reply-header">
              <span className="reply-username">{reply.username}</span>
              <span className="reply-date">
                {new Date(reply.createdAt).toLocaleDateString('ru-RU')}
              </span>
            </div>
            <p className="reply-content">{reply.content}</p>
            {user?.id === reply.userId && (
              <button 
                className="delete-reply-btn"
                onClick={() => handleDeleteReply(parentId, reply.id)}
              >
                Удалить
              </button>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="manga-comments">
      <h3>Отзывы ({comments.length})</h3>

      {user ? (
        <form className="comment-form" onSubmit={handleSubmitComment}>
          <div className="form-group">
            <label htmlFor="rating">Рейтинг:</label>
            <select 
              id="rating"
              value={rating} 
              onChange={(e) => setRating(parseInt(e.target.value))}
              className="rating-select"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(r => (
                <option key={r} value={r}>{r} ★</option>
              ))}
            </select>
          </div>

          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Напишите ваш отзыв... (максимум 500 символов)"
            rows="4"
            maxLength="500"
            className="comment-textarea"
          />

          <div className="form-footer">
            <span className="char-count">{newComment.length}/500</span>
            <button 
              type="submit" 
              disabled={submitting || !newComment.trim()}
              className="submit-btn"
            >
              {submitting ? 'Отправка...' : 'Отправить отзыв'}
            </button>
          </div>
        </form>
      ) : (
        <div className="auth-required">
          <p>Войдите в аккаунт, чтобы оставить отзыв</p>
        </div>
      )}

      {loading ? (
        <div className="loading">Загрузка комментариев...</div>
      ) : comments.length === 0 ? (
        <div className="no-comments">Комментариев ещё нет. Будьте первым!</div>
      ) : (
        <div className="comments-list">
          {comments.map(comment => (
            <div key={comment.id} className="comment-item">
              {editingId === comment.id ? (
                <div className="edit-form">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    maxLength="500"
                    rows="3"
                  />
                  <div className="edit-buttons">
                    <button 
                      onClick={() => handleEditComment(comment.id)}
                      className="save-btn"
                    >
                      Сохранить
                    </button>
                    <button 
                      onClick={() => {
                        setEditingId(null);
                        setEditContent('');
                      }}
                      className="cancel-btn"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="comment-header">
                    <div className="user-info">
                      <span className="username">{comment.username}</span>
                      {comment.rating && (
                        <span className="rating">★ {comment.rating}/10</span>
                      )}
                    </div>
                    <span className="date">
                      {new Date(comment.createdAt).toLocaleDateString('ru-RU')}
                    </span>
                  </div>

                  <p className="comment-content">{comment.content}</p>

                  <div className="comment-actions">
                    {user && (
                      <button 
                        className="reply-btn"
                        onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                      >
                        {replyingTo === comment.id ? 'Отмена' : 'Ответить'}
                      </button>
                    )}
                    {user?.id === comment.userId && (
                      <>
                        <button 
                          className="edit-btn"
                          onClick={() => startEditing(comment)}
                        >
                          Редактировать
                        </button>
                        <button 
                          className="delete-btn"
                          onClick={() => handleDeleteComment(comment.id)}
                        >
                          Удалить
                        </button>
                      </>
                    )}
                  </div>

                  {replyingTo === comment.id && user && (
                    <div className="reply-form">
                      <textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Напишите ответ..."
                        rows="2"
                        maxLength="300"
                        className="reply-textarea"
                      />
                      <button 
                        onClick={() => handleAddReply(comment.id)}
                        className="reply-submit-btn"
                      >
                        Отправить ответ
                      </button>
                    </div>
                  )}

                  {comment.replies && comment.replies.length > 0 && (
                    renderReplies(comment.replies, comment.id)
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MangaComments;
