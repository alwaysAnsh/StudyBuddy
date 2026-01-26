import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { deleteNote, updateNote } from '../redux/slices/noteSlice';
import './NoteCard.css';

const NoteCard = ({ note, onViewFull }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(note.title);
  const [editContent, setEditContent] = useState(note.content);
  const [editCategory, setEditCategory] = useState(note.category);

  const categories = ['General', 'DSA', 'System Design', 'Web Dev', 'React', 'JavaScript', 'Other'];
  const isCreator = note.createdBy._id === user?._id;

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      dispatch(deleteNote(note._id));
    }
  };

  const handleUpdate = () => {
    if (!editTitle.trim() || !editContent.trim()) {
      alert('Title and content are required');
      return;
    }
    dispatch(updateNote({
      id: note._id,
      title: editTitle,
      content: editContent,
      category: editCategory
    }));
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditCategory(note.category);
    setIsEditing(false);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="note-card-pro">
      <div className="note-card-header-pro">
        <span className="note-category-pro">{note.category}</span>
        {isCreator && !isEditing && (
          <div className="note-actions-pro">
            <button 
              className="note-action-btn-pro edit" 
              onClick={() => setIsEditing(true)}
              title="Edit note"
            >
              Edit
            </button>
            <button 
              className="note-action-btn-pro delete" 
              onClick={handleDelete}
              title="Delete note"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="note-edit-form-pro">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="note-edit-title-pro"
            placeholder="Note title"
          />
          <select
            value={editCategory}
            onChange={(e) => setEditCategory(e.target.value)}
            className="note-edit-category-pro"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="note-edit-content-pro"
            placeholder="Note content"
            rows="6"
          />
          <div className="note-edit-actions-pro">
            <button className="note-save-btn-pro" onClick={handleUpdate}>
              Save Changes
            </button>
            <button className="note-cancel-btn-pro" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <h3 className="note-title-pro">{note.title}</h3>
          <p className="note-content-preview-pro">{note.content}</p>
          
          <div className="note-footer-pro">
            <div className="note-meta-pro">
              <span className="note-author-pro">{note.createdBy.name}</span>
              <span className="note-date-pro">{formatDate(note.updatedAt)}</span>
            </div>
            <button 
              className="view-full-btn-pro"
              onClick={() => onViewFull(note)}
            >
              See Full
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default NoteCard;