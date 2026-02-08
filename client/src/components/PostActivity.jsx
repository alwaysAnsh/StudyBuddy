import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createActivity, getAllActivities } from '../redux/slices/activitySlice';
import './PostActivity.css';
import { addCustomCategory, deleteCustomCategory } from '../redux/slices/authSlice';

const PostActivity = ({ onClose }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    link: '',
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
    
    if (!formData.title.trim() || !formData.description.trim()) {
      alert('Title and description are required');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await dispatch(createActivity(formData)).unwrap();
      dispatch(getAllActivities());
      onClose();
    } catch (error) {
      alert('Error posting activity: ' + error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content post-activity-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Post What You Did</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="post-activity-form">
          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Completed 100 LeetCode Problems!"
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
            <label htmlFor="description">What did you accomplish? *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe what you did, what you learned, or any insights..."
              rows="5"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="link">Link (Optional)</label>
            <input
              type="url"
              id="link"
              name="link"
              value={formData.link}
              onChange={handleChange}
              placeholder="https://github.com/yourproject or any reference link"
            />
          </div>

          <div className="form-info">
            <p>🎉 Share your achievements with everyone!</p>
            <p className="info-subtitle">Others can mark if they've done this too</p>
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Posting...' : 'Post Activity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostActivity;