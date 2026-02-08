import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createActivity, getAllActivities } from '../redux/slices/activitySlice';
import './CreateActivity.css';

const CreateActivity = ({ onClose }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    link: '',
    category: 'General'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultCategories = ['General', 'DSA', 'System Design', 'Web Dev', 'React', 'JavaScript', 'Other'];
  const userCustomCategories = user?.customCategories || [];
  const allCategories = [...defaultCategories, ...userCustomCategories];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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
      alert('Error creating activity: ' + error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay-pro" onClick={onClose}>
      <div className="modal-content-pro post-activity-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-pro">
          <h2>Post New Activity</h2>
          <button className="modal-close-pro" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="post-activity-form-pro">
          <div className="form-group-pro">
            <label htmlFor="title">Activity Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Completed LeetCode Weekly Contest"
              required
            />
          </div>

          <div className="form-group-pro">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe what you accomplished..."
              rows="4"
              required
            />
          </div>

          <div className="form-group-pro">
            <label htmlFor="link">Link (Optional)</label>
            <input
              type="url"
              id="link"
              name="link"
              value={formData.link}
              onChange={handleChange}
              placeholder="https://..."
            />
            <small className="form-hint-pro">Add a link to your work, article, or achievement</small>
          </div>

          <div className="form-group-pro">
            <label htmlFor="category">Category *</label>
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
          </div>

          <div className="form-actions-pro">
            <button type="button" className="cancel-btn-pro" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="submit-btn-pro" disabled={isSubmitting}>
              {isSubmitting ? 'Posting...' : 'Post Activity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateActivity;