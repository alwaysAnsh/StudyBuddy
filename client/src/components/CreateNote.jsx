import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createNote, getAllNotes } from '../redux/slices/noteSlice';
import './CreateNote.css';
import { addCustomCategory, deleteCustomCategory } from '../redux/slices/authSlice';

const CreateNote = ({ onClose }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'General'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [managingCategories, setManagingCategories] = useState(false);

  const defaultCategories = ['DSA', 'System Design', 'Web Dev', 'React', 'JavaScript', 'Other'];
  const customCategories = user?.customCategories || [];
  const allCategories = [...defaultCategories, ...customCategories];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAddCategory = async () => {
      if (!newCategory.trim()) {
        alert('Please enter a category name');
        return;
      }
  
      try {
        await dispatch(addCustomCategory(newCategory.trim())).unwrap();
        setNewCategory('');
        setShowAddCategory(false);
        alert('Category added successfully!');
      } catch (error) {
        alert(error || 'Failed to add category');
      }
    };
  
    const handleDeleteCategory = async (category) => {
      if (window.confirm(`Delete category "${category}"?`)) {
        try {
          await dispatch(deleteCustomCategory(category)).unwrap();
          if (formData.category === category) {
            setFormData({ ...formData, category: 'DSA' });
          }
          alert('Category deleted successfully!');
        } catch (error) {
          alert(error || 'Failed to delete category');
        }
      }
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

          {/* <div className="form-group">
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
          </div> */}

          <div className="form-group">
            <label htmlFor="category">Category *</label>
            <div className="category-controls">
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                {allCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <button 
                type="button" 
                className="manage-categories-btn"
                onClick={() => setManagingCategories(!managingCategories)}
              >
                ⚙️ Manage
              </button>
            </div>

            {managingCategories && (
              <div className="category-manager">
                <h4>Your Custom Categories</h4>
                {customCategories.length === 0 ? (
                  <p className="no-categories">No custom categories yet</p>
                ) : (
                  <div className="custom-category-list">
                    {customCategories.map(cat => (
                      <div key={cat} className="custom-category-item">
                        <span>{cat}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat)}
                          className="delete-category-btn"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {!showAddCategory ? (
                  <button
                    type="button"
                    className="add-category-toggle-btn"
                    onClick={() => setShowAddCategory(true)}
                  >
                    + Add New Category
                  </button>
                ) : (
                  <div className="add-category-form">
                    <input
                      type="text"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="Category name"
                      maxLength="30"
                    />
                    <button type="button" onClick={handleAddCategory}>Add</button>
                    <button type="button" onClick={() => { setShowAddCategory(false); setNewCategory(''); }}>Cancel</button>
                  </div>
                )}
              </div>
            )}
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