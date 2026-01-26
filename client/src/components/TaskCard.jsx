import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateTaskStatus, deleteTask } from '../redux/slices/taskSlice';
import './TaskCard.css';

const TaskCard = ({ task, showAssignedTo, onXPGained }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState(task.notes || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const statusOptions = [
    { value: 'not completed', label: 'Not Started' },
    { value: 'completed', label: 'Completed' },
    { value: 'mark as read', label: 'Mark as Read' },
    { value: 'need revision', label: 'Need Revision' }
  ];

  const statusColors = {
    'completed': { bg: '#10b981', text: '#ffffff' },
    'mark as read': { bg: '#3b82f6', text: '#ffffff' },
    'not completed': { bg: '#f59e0b', text: '#ffffff' },
    'need revision': { bg: '#ef4444', text: '#ffffff' }
  };

  const handleStatusChange = async (newStatus) => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    try {
      const result = await dispatch(updateTaskStatus({ 
        id: task._id, 
        status: newStatus, 
        notes 
      })).unwrap();
      
      if (result.xpEarned && result.xpEarned > 0 && onXPGained) {
        onXPGained(result.xpEarned);
      }
    } catch (error) {
      console.error('Failed to update task:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleNotesUpdate = async () => {
    try {
      await dispatch(updateTaskStatus({ 
        id: task._id, 
        status: task.status, 
        notes 
      })).unwrap();
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update notes:', error);
    }
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      dispatch(deleteTask(task._id));
    }
  };

  const isMyTask = task.assignedTo._id === user?._id;
  const currentStatus = statusOptions.find(s => s.value === task.status);
  const statusColor = statusColors[task.status];
  const canEarnXP = isMyTask && !task.xpAwarded && task.status !== 'completed';

  return (
    <div className="professional-task-card">
      <div className="task-header-pro">
        <div className="task-category-pro">{task.category}</div>
        <button className="task-delete-pro" onClick={handleDelete} title="Delete task">
          &times;
        </button>
      </div>

      {canEarnXP && (
        <div className="xp-badge-pro available">+10 XP Available</div>
      )}
      
      {task.xpAwarded && (
        <div className="xp-badge-pro earned">XP Earned</div>
      )}

      <h3 className="task-title-pro">{task.title}</h3>

      {/* <div 
        className="task-status-pro"
        style={{
          background: statusColor.bg,
          color: statusColor.text
        }}
      >
        {currentStatus?.label}
      </div> */}

      <div className="task-meta-pro">
        <div className="meta-row-pro">
          <span className="meta-label-pro">Assigned by:</span>
          <span className="meta-value-pro">
            {showAssignedTo ? task.assignedTo.name : task.assignedBy.name}
          </span>
        </div>
        <div className="meta-row-pro">
          <span className="meta-label-pro">Date:</span>
          <span className="meta-value-pro">
            {new Date(task.createdAt).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric',
              year: 'numeric'
            })}
          </span>
        </div>
      </div>

      {task.completionCount > 0 && (
        <div className="completion-badge-pro">
          Completed {task.completionCount} {task.completionCount === 1 ? 'time' : 'times'}
        </div>
      )}

      {isMyTask && (
        <div className="status-selector-pro">
          <label className="status-label-pro">Update Status:</label>
          <div className="status-options-pro">
            {statusOptions.map(status => (
              <button
                key={status.value}
                className={`status-btn-pro ${task.status === status.value ? 'active' : ''}`}
                onClick={() => handleStatusChange(status.value)}
                disabled={isUpdating}
                style={{
                  backgroundColor: task.status === status.value ? statusColors[status.value].bg : '#f3f4f6',
                  color: task.status === status.value ? '#ffffff' : '#374151',
                  borderColor: task.status === status.value ? statusColors[status.value].bg : '#d1d5db'
                }}
              >
                {status.label}
              </button>
            ))}
          </div>
          {isUpdating && <div className="updating-text-pro">Updating...</div>}
        </div>
      )}

      <div className="notes-section-pro">
        <button 
          className="notes-toggle-pro"
          onClick={() => setShowNotes(!showNotes)}
        >
          {showNotes ? '▼' : '▶'} Notes
        </button>

        {showNotes && (
          <div className="notes-content-pro">
            {isMyTask && isEditing ? (
              <div className="notes-editor-pro">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add your notes here..."
                  rows="4"
                  className="notes-textarea-pro"
                />
                <div className="notes-actions-pro">
                  <button className="btn-save-pro" onClick={handleNotesUpdate}>
                    Save Notes
                  </button>
                  <button 
                    className="btn-cancel-pro" 
                    onClick={() => {
                      setIsEditing(false);
                      setNotes(task.notes || '');
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="notes-display-pro">
                <p className="notes-text-pro">{notes || 'No notes added yet.'}</p>
                {isMyTask && (
                  <button 
                    className="btn-edit-pro" 
                    onClick={() => setIsEditing(true)}
                  >
                    Edit Notes
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <a 
        href={task.link} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="task-link-btn-pro"
      >
        Open Task
      </a>
    </div>
  );
};

export default TaskCard;








// import React, { useState } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { updateTaskStatus, deleteTask } from '../redux/slices/taskSlice';
// import './TaskCard.css';

// const TaskCard = ({ task, showAssignedTo, onXPGained }) => {
//   const dispatch = useDispatch();
//   const { user } = useSelector((state) => state.auth);
//   const [showNotes, setShowNotes] = useState(false);
//   const [notes, setNotes] = useState(task.notes || '');
//   const [isEditing, setIsEditing] = useState(false);
//   const [isUpdating, setIsUpdating] = useState(false);

//   const statusOptions = [
//     { value: 'not completed', label: 'Not Started', emoji: '⏳', color: '#ed8936' },
//     { value: 'completed', label: 'Completed', emoji: '✅', color: '#48bb78' },
//     { value: 'mark as read', label: 'Mark as Read', emoji: '👀', color: '#4299e1' },
//     { value: 'need revision', label: 'Need Revision', emoji: '🔄', color: '#f56565' }
//   ];

//   const statusColors = {
//     'completed': { bg: 'rgba(72, 187, 120, 0.2)', border: '#48bb78', text: '#48bb78' },
//     'mark as read': { bg: 'rgba(66, 153, 225, 0.2)', border: '#4299e1', text: '#4299e1' },
//     'not completed': { bg: 'rgba(237, 137, 54, 0.2)', border: '#ed8936', text: '#ed8936' },
//     'need revision': { bg: 'rgba(245, 101, 101, 0.2)', border: '#f56565', text: '#f56565' }
//   };

//   const handleStatusChange = async (newStatus) => {
//     if (isUpdating) return;
    
//     setIsUpdating(true);
//     try {
//       const result = await dispatch(updateTaskStatus({ 
//         id: task._id, 
//         status: newStatus, 
//         notes 
//       })).unwrap();
      
//       // Check if XP was earned
//       if (result.xpEarned && result.xpEarned > 0 && onXPGained) {
//         onXPGained(result.xpEarned);
//       }
//     } catch (error) {
//       console.error('Failed to update task:', error);
//     } finally {
//       setIsUpdating(false);
//     }
//   };

//   const handleNotesUpdate = async () => {
//     try {
//       await dispatch(updateTaskStatus({ 
//         id: task._id, 
//         status: task.status, 
//         notes 
//       })).unwrap();
//       setIsEditing(false);
//     } catch (error) {
//       console.error('Failed to update notes:', error);
//     }
//   };

//   const handleDelete = () => {
//     if (window.confirm('Are you sure you want to delete this task?')) {
//       dispatch(deleteTask(task._id));
//     }
//   };

//   const isMyTask = task.assignedTo._id === user?._id;
//   const currentStatus = statusOptions.find(s => s.value === task.status);
//   const statusColor = statusColors[task.status];
  
//   // Show XP indicator if task hasn't awarded XP yet
//   const canEarnXP = isMyTask && !task.xpAwarded && task.status !== 'completed';

//   return (
//     <div className="modern-task-card">
//       {/* XP Badge - Show if XP can be earned */}
//       {canEarnXP && (
//         <div className="xp-available-badge" title="Complete to earn 10 XP">
//           ⚡ +10 XP
//         </div>
//       )}
      
//       {/* Already Completed Badge */}
//       {task.xpAwarded && (
//         <div className="xp-earned-badge" title={`XP earned on ${new Date(task.firstCompletedAt).toLocaleDateString()}`}>
//           ✓ XP Earned
//         </div>
//       )}

//       {/* Header */}
//       <div className="task-card-header">
//         <div className="task-category-badge">{task.category}</div>
//         <button className="task-delete-btn" onClick={handleDelete} title="Delete task">
//           🗑️
//         </button>
//       </div>

//       {/* Title */}
//       <h3 className="task-card-title">{task.title}</h3>

//       {/* Status Badge */}
//       <div 
//         className="task-status-badge"
//         style={{
//           background: statusColor.bg,
//           border: `1px solid ${statusColor.border}`,
//           color: statusColor.text
//         }}
//       >
//         <span className="status-emoji">{currentStatus?.emoji}</span>
//         <span className="status-text">{currentStatus?.label}</span>
//       </div>

//       {/* Meta Info */}
//       <div className="task-meta-info">
//         <div className="meta-item">
//           <span className="meta-icon">👤</span>
//           <span className="meta-text">
//             {showAssignedTo ? task.assignedTo.name : task.assignedBy.name}
//           </span>
//         </div>
//         <div className="meta-item">
//           <span className="meta-icon">📅</span>
//           <span className="meta-text">
//             {new Date(task.createdAt).toLocaleDateString('en-US', { 
//               month: 'short', 
//               day: 'numeric' 
//             })}
//           </span>
//         </div>
//       </div>

//       {/* Completion Counter */}
//       {task.completionCount > 0 && (
//         <div className="completion-info">
//           <span className="completion-icon">🔄</span>
//           <span className="completion-text">
//             Completed {task.completionCount} {task.completionCount === 1 ? 'time' : 'times'}
//           </span>
//         </div>
//       )}

//       {/* Status Selector - Only for my tasks */}
//       {isMyTask && (
//         <div className="task-status-selector">
//           <label className="selector-label">
//             Update Status
//             {canEarnXP && <span className="xp-hint"> (Earn 10 XP on completion!)</span>}
//           </label>
//           <div className="status-options">
//             {statusOptions.map(status => (
//               <button
//                 key={status.value}
//                 className={`status-option-btn ${task.status === status.value ? 'active' : ''} ${isUpdating ? 'disabled' : ''}`}
//                 onClick={() => handleStatusChange(status.value)}
//                 title={status.label}
//                 disabled={isUpdating}
//                 style={{
//                   borderColor: task.status === status.value ? status.color : 'transparent'
//                 }}
//               >
//                 <span className="option-emoji">{status.emoji}</span>
//               </button>
//             ))}
//           </div>
//           {isUpdating && <div className="updating-indicator">Updating...</div>}
//         </div>
//       )}

//       {/* Notes Section */}
//       <div className="task-notes-section">
//         <button 
//           className="notes-toggle-btn"
//           onClick={() => setShowNotes(!showNotes)}
//         >
//           <span className="toggle-icon">{showNotes ? '▼' : '▶'}</span>
//           <span>Notes {notes && `(${notes.length} chars)`}</span>
//         </button>

//         {showNotes && (
//           <div className="notes-content-area">
//             {isMyTask && isEditing ? (
//               <div className="notes-editor">
//                 <textarea
//                   value={notes}
//                   onChange={(e) => setNotes(e.target.value)}
//                   placeholder="Add your notes here..."
//                   rows="4"
//                   className="notes-textarea"
//                 />
//                 <div className="notes-actions">
//                   <button className="notes-save-btn" onClick={handleNotesUpdate}>
//                     💾 Save
//                   </button>
//                   <button 
//                     className="notes-cancel-btn" 
//                     onClick={() => {
//                       setIsEditing(false);
//                       setNotes(task.notes || '');
//                     }}
//                   >
//                     ✕ Cancel
//                   </button>
//                 </div>
//               </div>
//             ) : (
//               <div className="notes-display">
//                 <p className="notes-text">{notes || 'No notes added yet.'}</p>
//                 {isMyTask && (
//                   <button 
//                     className="notes-edit-btn" 
//                     onClick={() => setIsEditing(true)}
//                   >
//                     ✏️ Edit Notes
//                   </button>
//                 )}
//               </div>
//             )}
//           </div>
//         )}
//       </div>

//       {/* Action Button */}
//       <a 
//         href={task.link} 
//         target="_blank" 
//         rel="noopener noreferrer" 
//         className="task-action-btn"
//       >
//         <span>Open Task</span>
//         <span className="action-arrow">→</span>
//       </a>
//     </div>
//   );
// };

// export default TaskCard;



// import React, { useState } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { updateTaskStatus, deleteTask } from '../redux/slices/taskSlice';
// import './TaskCard.css';

// const TaskCard = ({ task, showAssignedTo }) => {
//   const dispatch = useDispatch();
//   const { user } = useSelector((state) => state.auth);
//   const [showNotes, setShowNotes] = useState(false);
//   const [notes, setNotes] = useState(task.notes || '');
//   const [isEditing, setIsEditing] = useState(false);

//   const statusOptions = [
//     'not completed',
//     'completed',
//     'mark as read',
//     'need revision'
//   ];

//   const statusColors = {
//     'completed': '#48bb78',
//     'mark as read': '#4299e1',
//     'not completed': '#ed8936',
//     'need revision': '#f56565'
//   };

//   const handleStatusChange = (newStatus) => {
//     dispatch(updateTaskStatus({ id: task._id, status: newStatus, notes }));
//   };

//   const handleNotesUpdate = () => {
//     dispatch(updateTaskStatus({ id: task._id, status: task.status, notes }));
//     setIsEditing(false);
//   };

//   const handleDelete = () => {
//     if (window.confirm('Are you sure you want to delete this task?')) {
//       dispatch(deleteTask(task._id));
//     }
//   };

//   const isMyTask = task.assignedTo._id === user?._id;
//   const cardStyle = {
//     borderLeft: `4px solid ${statusColors[task.status]}`
//   };

//   return (
//     <div className="task-card" style={cardStyle}>
//       <div className="task-header">
//         <span className="task-category">{task.category}</span>
//         <button className="delete-btn" onClick={handleDelete} title="Delete task">
//           ×
//         </button>
//       </div>

//       <h3 className="task-title">{task.title}</h3>

//       <a 
//         href={task.link} 
//         target="_blank" 
//         rel="noopener noreferrer" 
//         className="task-link"
//       >
//         Open Link →
//       </a>

//       <div className="task-meta">
//         {showAssignedTo ? (
//           <p className="task-assignee">
//             <strong>Assigned to:</strong> {task.assignedTo.name}
//           </p>
//         ) : (
//           <p className="task-assignee">
//             <strong>Assigned by:</strong> {task.assignedBy.name}
//           </p>
//         )}
//         <p className="task-date">
//           {new Date(task.createdAt).toLocaleDateString()}
//         </p>
//       </div>

//       {isMyTask && (
//         <div className="task-status">
//           <label>Status:</label>
//           <div className="status-buttons">
//             {statusOptions.map(status => (
//               <button
//                 key={status}
//                 className={`status-btn ${task.status === status ? 'active' : ''}`}
//                 style={{
//                   backgroundColor: task.status === status ? statusColors[status] : '#e2e8f0',
//                   color: task.status === status ? 'white' : '#4a5568'
//                 }}
//                 onClick={() => handleStatusChange(status)}
//               >
//                 {status}
//               </button>
//             ))}
//           </div>
//         </div>
//       )}

//       {!isMyTask && (
//         <div className="readonly-status">
//           <span 
//             className="status-badge"
//             style={{ backgroundColor: statusColors[task.status] }}
//           >
//             {task.status}
//           </span>
//         </div>
//       )}

//       <div className="task-notes-section">
//         <button 
//           className="notes-toggle"
//           onClick={() => setShowNotes(!showNotes)}
//         >
//           {showNotes ? '▼' : '▶'} Notes
//         </button>

//         {showNotes && (
//           <div className="notes-content">
//             {isMyTask && isEditing ? (
//               <div className="notes-edit">
//                 <textarea
//                   value={notes}
//                   onChange={(e) => setNotes(e.target.value)}
//                   placeholder="Add your notes here..."
//                   rows="3"
//                 />
//                 <div className="notes-actions">
//                   <button className="save-btn" onClick={handleNotesUpdate}>
//                     Save
//                   </button>
//                   <button 
//                     className="cancel-btn" 
//                     onClick={() => {
//                       setIsEditing(false);
//                       setNotes(task.notes || '');
//                     }}
//                   >
//                     Cancel
//                   </button>
//                 </div>
//               </div>
//             ) : (
//               <div className="notes-display">
//                 <p>{notes || 'No notes added yet.'}</p>
//                 {isMyTask && (
//                   <button 
//                     className="edit-notes-btn" 
//                     onClick={() => setIsEditing(true)}
//                   >
//                     Edit
//                   </button>
//                 )}
//               </div>
//             )}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default TaskCard;