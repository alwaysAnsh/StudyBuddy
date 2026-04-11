import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { createActivity } from '../redux/slices/activitySlice';
import { getCurrentUser } from '../redux/slices/authSlice';
import './PostActivity.css';
import { notify } from '../utils/notify';
import axiosInstance from '../config/axios';
import { collectHashtags } from '../utils/activityHashtags';

const uploadsOrigin = () => {
  const base = axiosInstance.defaults.baseURL || '';
  return base.replace(/\/api\/?$/i, '') || '';
};

const XP_ACTIVITY_POST = 7;

const PostActivity = ({ onClose, onXPGained }) => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    link: '',
    hashtagsExtra: '',
  });
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImage = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const token = localStorage.getItem('token');
      const res = await fetch(`${uploadsOrigin()}/api/uploads`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Upload failed');
      setImageUrl(data.url);
      notify({ type: 'success', message: 'Image attached.' });
    } catch (err) {
      notify({ type: 'error', message: err?.message || 'Upload failed' });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.description.trim()) {
      notify({ type: 'error', message: 'Title and description are required.' });
      return;
    }

    const hashtags = collectHashtags(
      formData.title,
      formData.description,
      formData.hashtagsExtra
    );

    setIsSubmitting(true);

    try {
      await dispatch(
        createActivity({
          title: formData.title.trim(),
          description: formData.description.trim(),
          link: formData.link.trim(),
          category: 'General',
          hashtags,
          imageUrl: imageUrl || '',
        })
      ).unwrap();
      await dispatch(getCurrentUser()).unwrap();
      onXPGained?.(XP_ACTIVITY_POST);
      notify({ type: 'success', message: 'Activity posted.' });
      onClose();
    } catch (error) {
      notify({ type: 'error', message: error || 'Could not post activity' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay pa-overlay" onClick={onClose}>
      <div className="modal-content post-activity-modal pa-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header pa-head">
          <h2>Post activity</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="post-activity-form pa-form">
          <div className="form-group">
            <label htmlFor="pa-title">Title *</label>
            <input
              type="text"
              id="pa-title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="What did you do?"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="pa-desc">Caption *</label>
            <textarea
              id="pa-desc"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Tell the story. Use #hashtags in text or add them below."
              rows={5}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="pa-tags">Hashtags (optional)</label>
            <input
              type="text"
              id="pa-tags"
              name="hashtagsExtra"
              value={formData.hashtagsExtra}
              onChange={handleChange}
              placeholder="leetcode, dailygrind (comma or space — # optional)"
            />
            <p className="pa-hint">These merge with any #tags in your title or caption for search.</p>
          </div>

          <div className="form-group">
            <label>Photo (optional)</label>
            <label className="pa-file-pick">
              <input type="file" accept="image/*" disabled={uploading} onChange={handleImage} />
              <span>{uploading ? 'Uploading…' : imageUrl ? 'Replace image' : 'Choose image'}</span>
            </label>
            {imageUrl && (
              <button type="button" className="pa-remove-img" onClick={() => setImageUrl('')}>
                Remove image
              </button>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="pa-link">Link (optional)</label>
            <input
              type="url"
              id="pa-link"
              name="link"
              value={formData.link}
              onChange={handleChange}
              placeholder="https://…"
            />
          </div>

          <div className="form-actions pa-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={isSubmitting || uploading}>
              {isSubmitting ? 'Posting…' : 'Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostActivity;
