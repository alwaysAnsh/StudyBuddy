import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createTask, getBuddies, getMyTasks, getAssignedByMe } from '../redux/slices/taskSlice';
import { addCustomCategory, deleteCustomCategory } from '../redux/slices/authSlice';
import './AssignTask.css';
import { Link } from 'react-router-dom';

const AssignTask = ({ onClose }) => {
  const dispatch = useDispatch();
  const { buddies } = useSelector((state) => state.buddies);
  const { user } = useSelector((state) => state.auth);
  console.log("buddies",buddies)
  
  const [formData, setFormData] = useState({
    title: '',
    link: '',
    category: 'DSA',
    assignedTo: '',
    notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [managingCategories, setManagingCategories] = useState(false);

  useEffect(() => {
    dispatch(getBuddies());
  }, [dispatch]);

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
    
    if (!formData.assignedTo) {
      alert('Please select a buddy to assign the task to');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await dispatch(createTask(formData)).unwrap();
      dispatch(getMyTasks());
      dispatch(getAssignedByMe());
      onClose();
    } catch (error) {
      alert('Error creating task: ' + error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Assign New Task</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {buddies.length === 0 && (
          <div className="no-buddies-warning">
            <p>⚠️ You don't have any buddies yet!</p>
            <p className="warning-subtitle">
              Add buddies first to assign tasks. Go to the <Link to='/buddies'> Buddies</Link> page to connect with friends.
            </p>
          </div>
        )}

        


        <form onSubmit={handleSubmit} className="assign-form">
          <div className="form-group">
            <label htmlFor="title">Task Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Two Sum Problem"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="link">Link *</label>
            <input
              type="url"
              id="link"
              name="link"
              value={formData.link}
              onChange={handleChange}
              placeholder="https://leetcode.com/problems/..."
              required
            />
          </div>

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
            <label htmlFor="assignedTo">Assign To (Buddy) *</label>
            <select
              id="assignedTo"
              name="assignedTo"
              value={formData.assignedTo}
              onChange={handleChange}
              required
              disabled={buddies.length === 0}
            >
              <option value="">
                {buddies.length === 0 ? 'No buddies available' : 'Select a buddy'}
              </option>
              {buddies.map(buddy => (
                <option key={buddy._id} value={buddy._id}>
                  {buddy.name} (@{buddy.username})
                </option>
              ))}
            </select>
            {buddies.length === 0 && (
              <p className="field-hint">
                💡 You can only assign tasks to your buddies. Add buddies from the Buddies page.
              </p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notes (Optional)</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Add any additional notes or instructions..."
              rows="3"
            />
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-btn" 
              disabled={isSubmitting || buddies.length === 0}
            >
              {isSubmitting ? 'Assigning...' : 'Assign Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignTask;





// import React, { useState, useEffect } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { createTask, getAllUsers, getMyTasks, getAssignedByMe } from '../redux/slices/taskSlice';
// import { addCustomCategory, deleteCustomCategory } from '../redux/slices/authSlice';
// import './AssignTask.css';

// const AssignTask = ({ onClose }) => {
//   const dispatch = useDispatch();
//   const { users } = useSelector((state) => state.tasks);
//   const { user } = useSelector((state) => state.auth);
  
//   const [formData, setFormData] = useState({
//     title: '',
//     link: '',
//     category: 'DSA',
//     assignedTo: '',
//     notes: ''
//   });

//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [showAddCategory, setShowAddCategory] = useState(false);
//   const [newCategory, setNewCategory] = useState('');
//   const [managingCategories, setManagingCategories] = useState(false);

//   useEffect(() => {
//     dispatch(getAllUsers());
//   }, [dispatch]);

//   const defaultCategories = ['DSA', 'System Design', 'Web Dev', 'React', 'JavaScript', 'Other'];
//   const customCategories = user?.customCategories || [];
//   const allCategories = [...defaultCategories, ...customCategories];

//   const handleChange = (e) => {
//     setFormData({
//       ...formData,
//       [e.target.name]: e.target.value
//     });
//   };

//   const handleAddCategory = async () => {
//     if (!newCategory.trim()) {
//       alert('Please enter a category name');
//       return;
//     }

//     try {
//       await dispatch(addCustomCategory(newCategory.trim())).unwrap();
//       setNewCategory('');
//       setShowAddCategory(false);
//       alert('Category added successfully!');
//     } catch (error) {
//       alert(error || 'Failed to add category');
//     }
//   };

//   const handleDeleteCategory = async (category) => {
//     if (window.confirm(`Delete category "${category}"?`)) {
//       try {
//         await dispatch(deleteCustomCategory(category)).unwrap();
//         // If current selected category was deleted, reset to default
//         if (formData.category === category) {
//           setFormData({ ...formData, category: 'DSA' });
//         }
//         alert('Category deleted successfully!');
//       } catch (error) {
//         alert(error || 'Failed to delete category');
//       }
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
    
//     if (!formData.assignedTo) {
//       alert('Please select a user to assign the task to');
//       return;
//     }

//     setIsSubmitting(true);
    
//     try {
//       await dispatch(createTask(formData)).unwrap();
//       dispatch(getMyTasks());
//       dispatch(getAssignedByMe());
//       onClose();
//     } catch (error) {
//       alert('Error creating task: ' + error);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <div className="modal-overlay" onClick={onClose}>
//       <div className="modal-content" onClick={(e) => e.stopPropagation()}>
//         <div className="modal-header">
//           <h2>Assign New Task</h2>
//           <button className="modal-close" onClick={onClose}>×</button>
//         </div>

//         <form onSubmit={handleSubmit} className="assign-form">
//           <div className="form-group">
//             <label htmlFor="title">Task Title *</label>
//             <input
//               type="text"
//               id="title"
//               name="title"
//               value={formData.title}
//               onChange={handleChange}
//               placeholder="e.g., Two Sum Problem"
//               required
//             />
//           </div>

//           <div className="form-group">
//             <label htmlFor="link">Link *</label>
//             <input
//               type="url"
//               id="link"
//               name="link"
//               value={formData.link}
//               onChange={handleChange}
//               placeholder="https://leetcode.com/problems/..."
//               required
//             />
//           </div>

//           <div className="form-group">
//             <label htmlFor="category">Category *</label>
//             <div className="category-controls">
//               <select
//                 id="category"
//                 name="category"
//                 value={formData.category}
//                 onChange={handleChange}
//                 required
//               >
//                 {allCategories.map(cat => (
//                   <option key={cat} value={cat}>{cat}</option>
//                 ))}
//               </select>
//               <button 
//                 type="button" 
//                 className="manage-categories-btn"
//                 onClick={() => setManagingCategories(!managingCategories)}
//               >
//                 ⚙️ Manage
//               </button>
//             </div>

//             {managingCategories && (
//               <div className="category-manager">
//                 <h4>Your Custom Categories</h4>
//                 {customCategories.length === 0 ? (
//                   <p className="no-categories">No custom categories yet</p>
//                 ) : (
//                   <div className="custom-category-list">
//                     {customCategories.map(cat => (
//                       <div key={cat} className="custom-category-item">
//                         <span>{cat}</span>
//                         <button
//                           type="button"
//                           onClick={() => handleDeleteCategory(cat)}
//                           className="delete-category-btn"
//                         >
//                           ×
//                         </button>
//                       </div>
//                     ))}
//                   </div>
//                 )}
                
//                 {!showAddCategory ? (
//                   <button
//                     type="button"
//                     className="add-category-toggle-btn"
//                     onClick={() => setShowAddCategory(true)}
//                   >
//                     + Add New Category
//                   </button>
//                 ) : (
//                   <div className="add-category-form">
//                     <input
//                       type="text"
//                       value={newCategory}
//                       onChange={(e) => setNewCategory(e.target.value)}
//                       placeholder="Category name"
//                       maxLength="30"
//                     />
//                     <button type="button" onClick={handleAddCategory}>Add</button>
//                     <button type="button" onClick={() => { setShowAddCategory(false); setNewCategory(''); }}>Cancel</button>
//                   </div>
//                 )}
//               </div>
//             )}
//           </div>

//           <div className="form-group">
//             <label htmlFor="assignedTo">Assign To *</label>
//             <select
//               id="assignedTo"
//               name="assignedTo"
//               value={formData.assignedTo}
//               onChange={handleChange}
//               required
//             >
//               <option value="">Select a user</option>
//               {users.map(user => (
//                 <option key={user._id} value={user._id}>
//                   {user.name} (@{user.username})
//                 </option>
//               ))}
//             </select>
//           </div>

//           <div className="form-group">
//             <label htmlFor="notes">Notes (Optional)</label>
//             <textarea
//               id="notes"
//               name="notes"
//               value={formData.notes}
//               onChange={handleChange}
//               placeholder="Add any additional notes or instructions..."
//               rows="3"
//             />
//           </div>

//           <div className="form-actions">
//             <button type="button" className="cancel-btn" onClick={onClose}>
//               Cancel
//             </button>
//             <button type="submit" className="submit-btn" disabled={isSubmitting}>
//               {isSubmitting ? 'Assigning...' : 'Assign Task'}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default AssignTask;


