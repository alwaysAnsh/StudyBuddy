import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { createNote, getAllNotes } from '../redux/slices/noteSlice';
import './CreateNote.css';

const CreateNote = ({ onClose }) => {
  const dispatch = useDispatch();
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'General'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = ['General', 'DSA', 'System Design', 'Web Dev', 'React', 'JavaScript', 'Other'];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Title and content are required');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await dispatch(createNote(formData)).unwrap();
      dispatch(getAllNotes());
      onClose();
    } catch (error) {
      alert('Error creating note: ' + error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content create-note-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create Shared Note</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="create-note-form">
          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Important DSA Concepts"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">Category *</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="content">Content *</label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="Add your note content here..."
              rows="8"
              required
            />
          </div>

          <div className="form-info">
            <p>💡 This note will be visible to all users</p>
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateNote;