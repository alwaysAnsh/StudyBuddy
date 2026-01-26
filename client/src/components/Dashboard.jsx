import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { logout, getCurrentUser } from '../redux/slices/authSlice';
import { getMyTasks, getAssignedByMe } from '../redux/slices/taskSlice';
import { getBuddies, getReceivedRequests } from '../redux/slices/buddySlice';
import TaskCard from './TaskCard';
import AssignTask from './AssignTask';
import Notes from './Notes';
import ActivityFeed from './ActivityFeed';
import UserSearch from './UserSearch';
import './Dashboard.css';
import axiosInstance from '../config/axios';

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { myTasks, assignedByMe, isLoading } = useSelector((state) => state.tasks);
  const { buddies, receivedRequests } = useSelector((state) => state.buddies);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [activeTab, setActiveTab] = useState('my-tasks');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [allUserCategories, setAllUserCategories] = useState([]);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showXPNotification, setShowXPNotification] = useState(false);
  const [xpGained, setXpGained] = useState(0);
  const userMenuRef = useRef(null);
  console.log("showusermenu: ",showUserMenu)

  useEffect(() => {
    dispatch(getMyTasks());
    dispatch(getAssignedByMe());
    dispatch(getCurrentUser());
    dispatch(getBuddies());
    dispatch(getReceivedRequests());
  }, [dispatch]);

  useEffect(() => {
    const fetchAllCategories = async () => {
      try {
        const response = await axiosInstance.get('/users/all-categories');
        setAllUserCategories(response.data.categories);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    
    fetchAllCategories();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // imporoved code - added escape key and used pointerdown

//   useEffect(() => {
//   const handlePointerOrKey = (event) => {
//     if (event.type === 'keydown') {
//       if (event.key === 'Escape') setShowUserMenu(false);
//       return;
//     }

//     // pointerdown / mousedown
//     const target = event.target;
//     const inside = userMenuRef.current && (
//       userMenuRef.current.contains(target) ||
//       (event.composedPath && event.composedPath().includes(userMenuRef.current))
//     );
//     if (!inside) setShowUserMenu(false);
//   };

//   document.addEventListener('pointerdown', handlePointerOrKey);
//   document.addEventListener('keydown', handlePointerOrKey);
//   return () => {
//     document.removeEventListener('pointerdown', handlePointerOrKey);
//     document.removeEventListener('keydown', handlePointerOrKey);
//   };
// }, []);

  const handleXPGained = (xp) => {
    if (xp > 0) {
      setXpGained(xp);
      setShowXPNotification(true);
      dispatch(getCurrentUser());
      setTimeout(() => {
        setShowXPNotification(false);
      }, 3000);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const handleProfileClick = () => {
    setShowUserMenu(false);
    navigate(`/profile/${user?.username}`);
  };

  const defaultCategories = ['DSA', 'System Design', 'Web Dev', 'React', 'JavaScript', 'Other'];

  const ALL_CATEGORIES = [
    ...new Set([
      ...defaultCategories,
      ...allUserCategories
    ])
  ];

  const pillCategories = ['all', ...ALL_CATEGORIES];

  const filterTasks = (tasks) => {
    if (filterCategory === 'all') return tasks;
    return tasks.filter(task => task.category === filterCategory);
  };

  const groupTasksByCategory = (tasks) => {
    const grouped = {};
    ALL_CATEGORIES.forEach(cat => {
      const catTasks = tasks.filter(task => task.category === cat);
      if (catTasks.length > 0) {
        grouped[cat] = catTasks;
      }
    });
    return grouped;
  };

  const currentTasks = activeTab === 'my-tasks' ? myTasks : assignedByMe;
  const filteredTasks = filterTasks(currentTasks);
  const groupedTasks = groupTasksByCategory(currentTasks);

  const getAvatarUrl = (avatarNum) => {
    return `/avatars/avatar-${avatarNum || 1}.png`;
  };

  const currentLevelXP = ((user?.level || 1) - 1) * 100;
  const nextLevelXP = (user?.level || 1) * 100;
  const xpInCurrentLevel = (user?.xp || 0) - currentLevelXP;
  const xpPercentage = (xpInCurrentLevel / 100) * 100;
  const xpNeededForNextLevel = nextLevelXP - (user?.xp || 0);

  return (
    <div className="professional-dashboard">
      {showXPNotification && (
        <div className="xp-notification-pro">
          <div className="xp-notification-content-pro">
            <span className="xp-icon-pro">+{xpGained} XP</span>
            {user?.level && (
              <span className="level-info-pro">Level {user.level}</span>
            )}
          </div>
        </div>
      )}

      <header className="professional-header">
        <div className="header-left">
          <Link to="/" className="logo-pro">
            <span className="logo-text-pro">KARYA</span>
          </Link>
        </div>

        <div className="header-center">
          <div className="search-bar-pro">
            <input 
              type="text" 
              placeholder="Search users..." 
              onClick={() => setShowSearchModal(true)}
              readOnly
            />
          </div>
        </div>

        <div className="header-right">
          <div className="user-menu-wrapper-pro" ref={userMenuRef}>
            <div 
              className="user-avatar-btn-pro"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <img 
                src={getAvatarUrl(user?.avatar)} 
                alt={user?.name}
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=4f46e5&color=fff&size=80`;
                }}
              />
            </div>
            
            {showUserMenu && (
              <div className="user-dropdown-pro">
                <div className="dropdown-item-pro" onClick={handleProfileClick}>
                  My Profile
                </div>
                <div className="dropdown-item-pro logout" onClick={handleLogout}>
                  Logout
                </div>
              </div>
            )}
          </div>
          <button className="header-btn-pro" onClick={() => navigate('/buddies')}>
            Buddies
          </button>
          <button className="header-btn-pro primary" onClick={() => setShowAssignModal(true)}>
            Assign Task
          </button>
          {/* <div className="user-menu-wrapper-pro" ref={userMenuRef}>
            <div 
              className="user-avatar-btn-pro"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <img 
                src={getAvatarUrl(user?.avatar)} 
                alt={user?.name}
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=4f46e5&color=fff&size=80`;
                }}
              />
            </div>
            
            {showUserMenu && (
              <div className="user-dropdown-pro">
                <div className="dropdown-item-pro" onClick={handleProfileClick}>
                  My Profile
                </div>
                <div className="dropdown-item-pro logout" onClick={handleLogout}>
                  Logout
                </div>
              </div>
            )}
          </div> */}
        </div>
      </header>

      <div className="dashboard-layout-pro">
        <aside className="left-sidebar-pro">
          <div className="user-profile-card-pro">
            <div className="profile-avatar-pro">
              <img 
                src={getAvatarUrl(user?.avatar)} 
                alt={user?.name}
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=4f46e5&color=fff&size=120`;
                }}
              />
            </div>

            <div className="profile-info-pro">
              <h2 className="profile-name-pro">{user?.name || 'User'}</h2>
              <p className="profile-username-pro">@{user?.username || 'username'}</p>
            </div>

            <div className="level-section-pro">
              <div className="level-title-pro">{user?.levelTitle || 'Initiate'}</div>
              <div className="level-number-pro">Level {user?.level || 1}</div>
              <div className="xp-progress-pro">
                <div className="xp-bar-pro">
                  <div className="xp-fill-pro" style={{ width: `${xpPercentage}%` }}></div>
                </div>
                <div className="xp-text-pro">
                  {xpInCurrentLevel} / 100 XP
                </div>
              </div>
            </div>

            <div className="stats-grid-pro">
              <div className="stat-box-pro">
                <div className="stat-value-pro">{user?.xp || 0}</div>
                <div className="stat-label-pro">Total XP</div>
              </div>
              <div className="stat-box-pro">
                <div className="stat-value-pro">{user?.stats?.tasksCompleted || 0}</div>
                <div className="stat-label-pro">Completed</div>
              </div>
              <div className="stat-box-pro">
                <div className="stat-value-pro">{user?.streak || 0}</div>
                <div className="stat-label-pro">Day Streak</div>
              </div>
              <div className="stat-box-pro">
                <div className="stat-value-pro">{myTasks.length}</div>
                <div className="stat-label-pro">Assigned</div>
              </div>
            </div>
          </div>
        </aside>

        <main className="main-content-pro">
          <div className="tabs-container-pro">
            <button
              className={`tab-pro ${activeTab === 'my-tasks' ? 'active' : ''}`}
              onClick={() => setActiveTab('my-tasks')}
            >
              My Tasks ({myTasks.length})
            </button>
            <button
              className={`tab-pro ${activeTab === 'assigned-by-me' ? 'active' : ''}`}
              onClick={() => setActiveTab('assigned-by-me')}
            >
              Assigned by Me ({assignedByMe.length})
            </button>
            <button
              className={`tab-pro ${activeTab === 'notes' ? 'active' : ''}`}
              onClick={() => setActiveTab('notes')}
            >
              Shared Notes
            </button>
            <button
              className={`tab-pro ${activeTab === 'activity' ? 'active' : ''}`}
              onClick={() => setActiveTab('activity')}
            >
              Activity Feed
            </button>
          </div>

          {activeTab !== 'notes' && activeTab !== 'activity' && (
            <>
              <div className="category-section-pro">
                <h3 className="section-heading-pro">Categories</h3>
                <div className="category-pills-pro">
                  {pillCategories.slice(0, 6).map(cat => (
                    <button
                      key={cat}
                      className={`category-pill-pro ${filterCategory === cat ? 'active' : ''}`}
                      onClick={() => setFilterCategory(cat)}
                    >
                      {cat === 'all' ? 'All Categories' : cat}
                    </button>
                  ))}
                  {pillCategories.length > 6 && (
                    <button 
                      className="category-pill-pro more"
                      onClick={() => setShowAllCategories(!showAllCategories)}
                    >
                      More Categories
                    </button>
                  )}
                </div>

                {showAllCategories && (
                  <div className="categories-modal-overlay-pro" onClick={() => setShowAllCategories(false)}>
                    <div className="categories-modal-pro" onClick={(e) => e.stopPropagation()}>
                      <div className="modal-header-pro">
                        <h3>All Categories</h3>
                        <button onClick={() => setShowAllCategories(false)}>&times;</button>
                      </div>
                      <div className="categories-grid-pro">
                        {pillCategories.map(cat => (
                          <button
                            key={cat}
                            className={`category-card-pro ${filterCategory === cat ? 'active' : ''}`}
                            onClick={() => {
                              setFilterCategory(cat);
                              setShowAllCategories(false);
                            }}
                          >
                            {cat === 'all' ? 'All Categories' : cat}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="tasks-section-pro">
                {isLoading ? (
                  <div className="loading-pro">Loading tasks...</div>
                ) : filteredTasks.length === 0 ? (
                  <div className="empty-state-pro">
                    <p>No tasks found</p>
                    {activeTab === 'my-tasks' && (
                      <p className="empty-subtitle-pro">Waiting for tasks to be assigned to you.</p>
                    )}
                  </div>
                ) : filterCategory === 'all' ? (
                  <div className="grouped-tasks-pro">
                    {Object.entries(groupedTasks).map(([category, tasks]) => 
                      tasks.length > 0 && (
                        <div key={category} className="category-group-pro">
                          <h4 className="category-title-pro">{category}</h4>
                          <div className="tasks-horizontal-scroll">
                            {tasks.map(task => (
                              <TaskCard 
                                key={task._id} 
                                task={task} 
                                showAssignedTo={activeTab === 'assigned-by-me'}
                                onXPGained={handleXPGained}
                              />
                            ))}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <div className="tasks-horizontal-scroll">
                    {filteredTasks.map(task => (
                      <TaskCard 
                        key={task._id} 
                        task={task} 
                        showAssignedTo={activeTab === 'assigned-by-me'}
                        onXPGained={handleXPGained}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'notes' && <Notes />}
          {activeTab === 'activity' && <ActivityFeed />}
        </main>
      </div>

      {showAssignModal && (
        <AssignTask onClose={() => setShowAssignModal(false)} />
      )}
      
      {showSearchModal && (
        <UserSearch onClose={() => setShowSearchModal(false)} />
      )}
    </div>
  );
};

export default Dashboard;








// import React, { useEffect, useState, useRef } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { Link, useNavigate } from 'react-router-dom';
// import { logout, getCurrentUser } from '../redux/slices/authSlice';
// import { getMyTasks, getAssignedByMe } from '../redux/slices/taskSlice';
// import { getBuddies, getReceivedRequests } from '../redux/slices/buddySlice';
// import TaskCard from './TaskCard';
// import AssignTask from './AssignTask';
// import Notes from './Notes';
// import ActivityFeed from './ActivityFeed';
// import UserSearch from './UserSearch';
// import './Dashboard.css';
// import axiosInstance from '../config/axios';

// const Dashboard = () => {
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const { user } = useSelector((state) => state.auth);
//   const { myTasks, assignedByMe, isLoading } = useSelector((state) => state.tasks);
//   const { buddies, receivedRequests } = useSelector((state) => state.buddies);
//   const [showAssignModal, setShowAssignModal] = useState(false);
//   const [showSearchModal, setShowSearchModal] = useState(false);
//   const [activeTab, setActiveTab] = useState('my-tasks');
//   const [filterCategory, setFilterCategory] = useState('all');
//   const [showAllCategories, setShowAllCategories] = useState(false);
//   const [allUserCategories, setAllUserCategories] = useState([]);
//   const [buddyTab, setBuddyTab] = useState('buddies');
//   const [showUserMenu, setShowUserMenu] = useState(false);
//   const [buddiesPanelCollapsed, setBuddiesPanelCollapsed] = useState(false);
//   const [showXPNotification, setShowXPNotification] = useState(false);
//   const [xpGained, setXpGained] = useState(0);
//   const userMenuRef = useRef(null);
//   // console.log("user: ",user)

//   useEffect(() => {
//     dispatch(getMyTasks());
//     dispatch(getAssignedByMe());
//     dispatch(getCurrentUser());
//     dispatch(getBuddies());
//     dispatch(getReceivedRequests());
//   }, [dispatch]);

//   useEffect(() => {
//     const fetchAllCategories = async () => {
//       try {
//         const response = await axiosInstance.get('/users/all-categories');
//         setAllUserCategories(response.data.categories);
//       } catch (error) {
//         console.error('Failed to fetch categories:', error);
//       }
//     };
    
//     fetchAllCategories();
//   }, []);

//   // Close user menu when clicking outside
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
//         setShowUserMenu(false);
//       }
//     };

//     document.addEventListener('mousedown', handleClickOutside);
//     return () => document.removeEventListener('mousedown', handleClickOutside);
//   }, []);

//   // Show XP notification
//   const handleXPGained = (xp) => {
//     if (xp > 0) {
//       setXpGained(xp);
//       setShowXPNotification(true);
      
//       // Refresh user data to get updated XP and level
//       dispatch(getCurrentUser());
      
//       setTimeout(() => {
//         setShowXPNotification(false);
//       }, 3000);
//     }
//   };

//   const handleLogout = () => {
//     dispatch(logout());
//     navigate('/');
//   };

//   const handleProfileClick = () => {
//     setShowUserMenu(false);
//     navigate(`/profile/${user?.username}`);
//   };

//   const defaultCategories = ['DSA', 'System Design', 'Web Dev', 'React', 'JavaScript', 'Other'];

//   const ALL_CATEGORIES = [
//     ...new Set([
//       ...defaultCategories,
//       ...allUserCategories
//     ])
//   ];

//   const pillCategories = ['all', ...ALL_CATEGORIES];

//   const filterTasks = (tasks) => {
//     if (filterCategory === 'all') return tasks;
//     return tasks.filter(task => task.category === filterCategory);
//   };

//   const groupTasksByCategory = (tasks) => {
//     const grouped = {};

//     ALL_CATEGORIES.forEach(cat => {
//       const catTasks = tasks.filter(task => task.category === cat);
//       if (catTasks.length > 0) {
//         grouped[cat] = catTasks;
//       }
//     });

//     return grouped;
//   };

//   const currentTasks = activeTab === 'my-tasks' ? myTasks : assignedByMe;
//   const filteredTasks = filterTasks(currentTasks);
//   const groupedTasks = groupTasksByCategory(currentTasks);

//   const getAvatarUrl = (avatarNum) => {
//     return `/avatars/avatar-${avatarNum || 1}.png`;
//   };

//   // Calculate XP progress for current level
//   const currentLevelXP = ((user?.level || 1) - 1) * 100;
//   const nextLevelXP = (user?.level || 1) * 100;
//   const xpInCurrentLevel = (user?.xp || 0) - currentLevelXP;
//   const xpPercentage = (xpInCurrentLevel / 100) * 100;
//   const xpNeededForNextLevel = nextLevelXP - (user?.xp || 0);

//   return (
//     <div className="modern-dashboard">
//       {/* XP Notification */}
//       {showXPNotification && (
//         <div className="xp-notification">
//           <div className="xp-notification-content">
//             <span className="xp-icon">⚡</span>
//             <span className="xp-text">+{xpGained} XP</span>
//             {user?.level && (
//               <span className="level-badge">Level {user.level}</span>
//             )}
//           </div>
//         </div>
//       )}

//       {/* Header */}
//       <header className="modern-header">
//         <div className="header-left">
//           <Link to="/" className="logo">
//             <div className="logo-icon">📚</div>
//             <span className="logo-text">KARYA</span>
//           </Link>
//         </div>

//         <div className="header-center">
//           <div className="search-bar">
//             <span className="search-icon">🔍</span>
//             <input 
//               type="text" 
//               placeholder="Search User" 
//               onClick={() => setShowSearchModal(true)}
//               readOnly
//             />
//           </div>
//         </div>

//         <div className="header-right">
//           <div className="user-menu-wrapper" ref={userMenuRef}>
//             <div 
//               className="user-avatar-btn"
//               onClick={() => setShowUserMenu(!showUserMenu)}
//             >
//               <img 
//                 src={getAvatarUrl(user?.avatar)} 
//                 alt={user?.name}
//                 onError={(e) => {
//                   e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=667eea&color=fff&size=80`;
//                 }}
//               />
//               <span className="dropdown-arrow">▼</span>
//             </div>
            
//             {showUserMenu && (
//               <div className="user-dropdown">
//                 <div className="dropdown-item" onClick={handleProfileClick}>
//                   👤 My Profile
//                 </div>
//                 <div className="dropdown-item" onClick={handleLogout}>
//                   🚪 Logout
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       </header>

//       <div className={`dashboard-layout ${buddiesPanelCollapsed ? 'buddies-collapsed' : ''}` }>
//         {/* Left Sidebar */}
//         <aside className="left-sidebar">
//           <div className="user-profile-card">
//             {/* <div className="profile-header">
//               <h2>Welcome back,</h2>
//               <h1>{user?.name?.split(' ')[0] || 'User'}!</h1>
//             </div> */}
            
//             <div className="profile-avatar">
//               <img 
//                 src={getAvatarUrl(user?.avatar)} 
//                 alt={user?.name}
//                 onError={(e) => {
//                   e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=667eea&color=fff&size=120`;
//                 }}
//               />
//               <p>{user.username}</p>
//             </div>

//             <div className="user-level">
//               <div className="level-title-badge">{user?.levelTitle || 'Initiate'}</div>
//               <h3>Level {user?.level || 1}</h3>
//               <div className="xp-info">
//                 <span className="xp-current">{xpInCurrentLevel} XP</span>
//                 <span className="xp-separator">/</span>
//                 <span className="xp-next">100 XP</span>
//               </div>
//               <div className="xp-bar">
//                 <div className="xp-fill" style={{ width: `${xpPercentage}%` }}></div>
//               </div>
//               <div className="xp-remaining">
//                 {xpNeededForNextLevel} XP to Level {(user?.level || 1) + 1}
//               </div>
//             </div>

//             <div className="user-stats-card">
//               <div className="stat-item">
//                 <span className="stat-label">Total XP:</span>
//                 <span className="stat-values">{user?.xp || 0}</span>
//               </div>
//               <div className="stat-item">
//                 <span className="stat-label">Completed:</span>
//                 <span className="stat-values">{user?.stats?.tasksCompleted || 0}</span>
//               </div>
//               <div className="stat-item streak">
//                 <span className="stat-label">Streak:</span>
//                 <span className="stat-values">{user?.streak || 0} Days 🔥</span>
//               </div>
//             </div>
//           </div>
//         </aside>

//         {/* Main Content */}
//         <main className="main-content">
//           {/* Featured Section */}
//           <section className="featured-section">
//             <h2 className="section-title-dashboard">Featured</h2>
//             <div className="featured-grid">
//               <div 
//                 className="feature-card tasks-card"
//                 onClick={() => setActiveTab('my-tasks')}
//               >
//                 <div className="feature-icon">📋</div>
//                 <div className="feature-info">
//                   <h3>My Tasks</h3>
//                   <p>{myTasks.length} tasks</p>
//                 </div>
//               </div>

//               <div 
//                 className="feature-card assigned-card"
//                 onClick={() => setActiveTab('assigned-by-me')}
//               >
//                 <div className="feature-icon">👥</div>
//                 <div className="feature-info">
//                   <h3>Assigned by Me</h3>
//                   <p>{assignedByMe.length} tasks</p>
//                 </div>
//               </div>

//               <div 
//                 className="feature-card notes-card"
//                 onClick={() => setActiveTab('notes')}
//               >
//                 <div className="feature-icon">📝</div>
//                 <div className="feature-info">
//                   <h3>Shared Notes</h3>
//                   <p>View notes</p>
//                 </div>
//               </div>

//               <div 
//                 className="feature-card activity-card"
//                 onClick={() => setActiveTab('activity')}
//               >
//                 <div className="feature-icon">🎯</div>
//                 <div className="feature-info">
//                   <h3>Activity Feed</h3>
//                   <p>Recent updates</p>
//                 </div>
//               </div>
//             </div>
//           </section>

//           {/* Categories Section - Only show for tasks */}
//           {activeTab !== 'notes' && activeTab !== 'activity' && (
//             <section className="categories-section">
//               <h2 className="section-title">Categories</h2>
//               <div className="category-pills-modern">
//                 {pillCategories.slice(0, 3).map(cat => (
//                   <button
//                     key={cat}
//                     className={`category-pill-modern ${filterCategory === cat ? 'active' : ''}`}
//                     onClick={() => setFilterCategory(cat)}
//                   >
//                     {cat === 'all' ? 'All' : cat}
//                   </button>
//                 ))}
//                 {pillCategories.length > 3 && (
//                   <button 
//                     className="category-pill-modern explore"
//                     onClick={() => setShowAllCategories(!showAllCategories)}
//                   >
//                     Explore More
//                   </button>
//                 )}
//               </div>

//               {showAllCategories && (
//                 <div className="categories-modal-overlay" onClick={() => setShowAllCategories(false)}>
//                   <div className="categories-modal" onClick={(e) => e.stopPropagation()}>
//                     <div className="modal-header">
//                       <h3>All Categories</h3>
//                       <button onClick={() => setShowAllCategories(false)}>×</button>
//                     </div>
//                     <div className="categories-grid">
//                       {pillCategories.map(cat => (
//                         <button
//                           key={cat}
//                           className={`category-card ${filterCategory === cat ? 'active' : ''}`}
//                           onClick={() => {
//                             setFilterCategory(cat);
//                             setShowAllCategories(false);
//                           }}
//                         >
//                           {cat === 'all' ? 'All' : cat}
//                         </button>
//                       ))}
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </section>
//           )}

//           {/* Tasks Content */}
//           {activeTab !== 'notes' && activeTab !== 'activity' && (
//             <section className="tasks-section">
//               <div className="tasks-header">
//                 <h2 className="section-title">
//                   {activeTab === 'my-tasks' ? 'My Tasks' : 'Assigned by Me'}
//                 </h2>
//                 <button className="assign-task-btn" onClick={() => setShowAssignModal(true)}>
//                   + Assign Task
//                 </button>
//               </div>

//               {isLoading ? (
//                 <div className="loading-modern">Loading tasks...</div>
//               ) : filteredTasks.length === 0 ? (
//                 <div className="empty-state-modern">
//                   <div className="empty-icon">📭</div>
//                   <p>No tasks found</p>
//                   {activeTab === 'my-tasks' && (
//                     <p className="empty-subtitle">Waiting for tasks to be assigned to you.</p>
//                   )}
//                 </div>
//               ) : filterCategory === 'all' ? (
//                 <div className="grouped-tasks-modern">
//                   {Object.entries(groupedTasks).map(([category, tasks]) => 
//                     tasks.length > 0 && (
//                       <div key={category} className="category-section-modern">
//                         <h3 className="category-heading">{category}</h3>
//                         <div className="tasks-grid-modern">
//                           {tasks.map(task => (
//                             <TaskCard 
//                               key={task._id} 
//                               task={task} 
//                               showAssignedTo={activeTab === 'assigned-by-me'}
//                               onXPGained={handleXPGained}
//                             />
//                           ))}
//                         </div>
//                       </div>
//                     )
//                   )}
//                 </div>
//               ) : (
//                 <div className="tasks-grid-modern">
//                   {filteredTasks.map(task => (
//                     <TaskCard 
//                       key={task._id} 
//                       task={task} 
//                       showAssignedTo={activeTab === 'assigned-by-me'}
//                       onXPGained={handleXPGained}
//                     />
//                   ))}
//                 </div>
//               )}
//             </section>
//           )}

//           {activeTab === 'notes' && <Notes />}
//           {activeTab === 'activity' && <ActivityFeed />}
//         </main>

//         {/* Right Sidebar - Buddies */}
//         <aside className={`right-sidebar ${buddiesPanelCollapsed ? 'collapsed' : ''}`}>
//           <button 
//             className="collapse-btn"
//             onClick={() => setBuddiesPanelCollapsed(!buddiesPanelCollapsed)}
//             title={buddiesPanelCollapsed ? 'Expand' : 'Collapse'}
//           >
//             {buddiesPanelCollapsed ? '◀' : '▶'}
//           </button>
          
//           {!buddiesPanelCollapsed && (
//             <div className="buddies-panel">
//               <div className="buddies-header">
//                 <button 
//                   className={`buddy-tab ${buddyTab === 'buddies' ? 'active' : ''}`}
//                   onClick={() => setBuddyTab('buddies')}
//                 >
//                   Buddies
//                 </button>
//                 <button 
//                   className={`buddy-tab ${buddyTab === 'requests' ? 'active' : ''}`}
//                   onClick={() => setBuddyTab('requests')}
//                 >
//                   Requests
//                   {receivedRequests.length > 0 && (
//                     <span className="badge">{receivedRequests.length}</span>
//                   )}
//                 </button>
//               </div>

//               {buddyTab === 'buddies' ? (
//                 <div className="buddies-list">
//                   {buddies.length === 0 ? (
//                     <div className="empty-buddies">
//                       <p>No buddies yet</p>
//                       <button 
//                         className="add-buddy-btn-small"
//                         onClick={() => navigate('/buddies')}
//                       >
//                         + Add Buddies
//                       </button>
//                     </div>
//                   ) : (
//                     <>
//                       {buddies.slice(0, 4).map(buddy => (
//                         <div key={buddy._id} className="buddy-item" title={buddy.name}>
//                           <img 
//                             src={getAvatarUrl(buddy.avatar)} 
//                             alt={buddy.name}
//                             onError={(e) => {
//                               e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(buddy.name)}&background=667eea&color=fff&size=80`;
//                             }}
//                           />
//                           <div className="buddy-status online"></div>
//                         </div>
//                       ))}
//                       {buddies.length > 4 && (
//                         <button 
//                           className="view-all-btn"
//                           onClick={() => navigate('/buddies')}
//                         >
//                           View All ({buddies.length})
//                         </button>
//                       )}
//                     </>
//                   )}
//                 </div>
//               ) : (
//                 <div className="requests-list">
//                   {receivedRequests.length === 0 ? (
//                     <p className="no-requests">No pending requests</p>
//                   ) : (
//                     <>
//                       {receivedRequests.slice(0, 3).map(request => (
//                         <div 
//                           key={request._id} 
//                           className="request-item"
//                           onClick={() => navigate('/buddies')}
//                         >
//                           <img 
//                             src={getAvatarUrl(request.sender.avatar)} 
//                             alt={request.sender.name}
//                             onError={(e) => {
//                               e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(request.sender.name)}&background=667eea&color=fff&size=40`;
//                             }}
//                           />
//                           <span>{request.sender.name}</span>
//                         </div>
//                       ))}
//                       {receivedRequests.length > 3 && (
//                         <button 
//                           className="view-all-requests-btn"
//                           onClick={() => navigate('/buddies')}
//                         >
//                           View All Requests
//                         </button>
//                       )}
//                     </>
//                   )}
//                 </div>
//               )}
//             </div>
//           )}
//         </aside>
//       </div>

//       {/* Modals */}
//       {showAssignModal && (
//         <AssignTask onClose={() => setShowAssignModal(false)} />
//       )}
      
//       {showSearchModal && (
//         <UserSearch onClose={() => setShowSearchModal(false)} />
//       )}
//     </div>
//   );
// };

// export default Dashboard;






// import React, { useEffect, useState } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { Link, useNavigate } from 'react-router-dom';
// import { logout, getCurrentUser } from '../redux/slices/authSlice';
// import { getMyTasks, getAssignedByMe } from '../redux/slices/taskSlice';
// import TaskCard from './TaskCard';
// import AssignTask from './AssignTask';
// import Notes from './Notes';
// import ActivityFeed from './ActivityFeed';
// import UserSearch from './UserSearch';
// import './Dashboard.css';
// import axiosInstance from '../config/axios';

// const Dashboard = () => {
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const { user } = useSelector((state) => state.auth);
//   const { myTasks, assignedByMe, isLoading } = useSelector((state) => state.tasks);
//   const [showAssignModal, setShowAssignModal] = useState(false);
//   const [showSearchModal, setShowSearchModal] = useState(false);
//   const [activeTab, setActiveTab] = useState('my-tasks');
//   const [filterCategory, setFilterCategory] = useState('all');
//   const [showAllCategories, setShowAllCategories] = useState(false);
// const [allUserCategories, setAllUserCategories] = useState([]);

// console.log("tasks:", myTasks)

//   useEffect(() => {
//     dispatch(getMyTasks());
//     dispatch(getAssignedByMe());
//     dispatch(getCurrentUser()); // Refresh user data for streak
//   }, [dispatch]);

//   useEffect(() => {
//   const fetchAllCategories = async () => {
//     try {
//       const response = await axiosInstance.get('/users/all-categories');
//       setAllUserCategories(response.data.categories);
//     } catch (error) {
//       console.error('Failed to fetch categories:', error);
//     }
//   };
  
//   fetchAllCategories();
// }, []);

//   const handleLogout = () => {
//     dispatch(logout());
//     navigate('/');
//   };

//   const handleProfileClick = () => {
//     navigate(`/profile/${user?.username}`);
//   };

//   // const categories = ['all', 'DSA', 'System Design', 'Web Dev', 'React', 'JavaScript', 'Other'];

//   const defaultCategories = ['DSA', 'System Design', 'Web Dev', 'React', 'JavaScript', 'Other'];
// const userCustomCategories = user?.customCategories || [];

// // 🔥 FINAL category source (used everywhere)
// const ALL_CATEGORIES = [
//   ...new Set([
//     ...defaultCategories,
//     ...allUserCategories
//   ])
// ];

// // Used only for pills (needs "all")
// const pillCategories = ['all', ...ALL_CATEGORIES];


//   const filterTasks = (tasks) => {
//     if (filterCategory === 'all') return tasks;
//     return tasks.filter(task => task.category === filterCategory);
//   };

//   const groupTasksByCategory = (tasks) => {
//   const grouped = {};

//   ALL_CATEGORIES.forEach(cat => {
//     const catTasks = tasks.filter(task => task.category === cat);
//     if (catTasks.length > 0) {
//       grouped[cat] = catTasks;
//     }
//   });

//   return grouped;
// };


//   const currentTasks = activeTab === 'my-tasks' ? myTasks : assignedByMe;
//   const filteredTasks = filterTasks(currentTasks);
//   const groupedTasks = groupTasksByCategory(currentTasks);

//   const getAvatarUrl = (avatarNum) => {
//     return `/avatars/avatar-${avatarNum || 1}.png`;
//   };

//   return (
//     <div className="dashboard-container">
      
//       {/* Header */}
//       <header className="dashboard-header">
//         <div className="header-content">
//           <div className="header-left">
//             <Link to='/'>
//             <h1>Task Assignment</h1>
//             </Link>
//             <p>Welcome, <strong>{user?.name}</strong></p>
//           </div>
//           <div className="header-center">
//             <div className="user-stat" title="Your Level">
//               <span className="stat-icon">🏆</span>
//               <span className="stat-value">Lvl {user?.level || 1}</span>
//             </div>
//             <div className="user-stat" title="Total XP">
//               <span className="stat-icon">⚡</span>
//               <span className="stat-value">{user?.xp || 0} XP</span>
//             </div>
//             <div className="user-stat" title="Login Streak">
//               <span className="stat-icon">🔥</span>
//               <span className="stat-value">{user?.streak || 0} days</span>
//             </div>
//           </div>
//           <div className="header-right">
//             <div 
//               className="user-avatar-header" 
//               onClick={handleProfileClick}
//               title="View Your Profile"
//             >
//               <img 
//                 src={getAvatarUrl(user?.avatar)}
//                 alt={user?.name}
//                 onError={(e) => {
//                   e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=667eea&color=fff&size=80`;
//                 }}
//               />
//             </div>
//             <button className="search-btn" onClick={() => setShowSearchModal(true)}>
//               🔍 Search Users
//             </button>
//             <button className="search-btn" onClick={() => navigate('/buddies')}>
//               Buddies
//             </button>
//             <button className="assign-btn" onClick={() => setShowAssignModal(true)}>
//               + Assign Task
//             </button>
//             <button className="logout-btn" onClick={handleLogout}>
//               Logout
//             </button>
//           </div>
//         </div>
//       </header>

//       {/* Tabs */}
//       <div className="tabs-container">
//         <button
//           className={`tab ${activeTab === 'my-tasks' ? 'active' : ''}`}
//           onClick={() => setActiveTab('my-tasks')}
//         >
//           My Tasks ({myTasks.length})
//         </button>
//         <button
//           className={`tab ${activeTab === 'assigned-by-me' ? 'active' : ''}`}
//           onClick={() => setActiveTab('assigned-by-me')}
//         >
//           Assigned by Me ({assignedByMe.length})
//         </button>
//         <button
//           className={`tab ${activeTab === 'notes' ? 'active' : ''}`}
//           onClick={() => setActiveTab('notes')}
//         >
//           📝 Shared Notes
//         </button>
//         <button
//           className={`tab ${activeTab === 'activity' ? 'active' : ''}`}
//           onClick={() => setActiveTab('activity')}
//         >
//           🎯 Activity Feed
//         </button>
//       </div>

//       {/* Content based on active tab */}
//       {activeTab === 'notes' ? (
//         <Notes />
//       ) : activeTab === 'activity' ? (
//         <ActivityFeed />
//       ) : (
//         <>
//           {/* Category Filter */}
//           <div className="filter-container">
//             <label>Filter by Category:</label>
//             {/* <div className="category-pills">
//               {categories.map(cat => (
//                 <button
//                   key={cat}
//                   className={`category-pill ${filterCategory === cat ? 'active' : ''}`}
//                   onClick={() => setFilterCategory(cat)}
//                 >
//                   {cat === 'all' ? 'All' : cat}
//                 </button>
//               ))}
//             </div> */}
//             <div className="category-pills">
//   {/* Show first 7 categories */}
//   {pillCategories.slice(0, 7).map(cat => (
//     <button
//       key={cat}
//       className={`category-pill ${filterCategory === cat ? 'active' : ''}`}
//       onClick={() => setFilterCategory(cat)}
//     >
//       {cat === 'all' ? 'All' : cat}
//     </button>
//   ))}
  
//   {/* Show "Explore More" if there are more categories */}
//   {(pillCategories.length > 7 || allUserCategories.length > 0) && (
//     <div className="explore-more-dropdown">
//       <button 
//         className="category-pill explore-more"
//         onClick={() => setShowAllCategories(!showAllCategories)}
//       >
//         🔍 Explore More ({allUserCategories.length})
//       </button>
      
//       {showAllCategories && (
//         <div className="categories-dropdown">
//           <div className="dropdown-header">
//             <span>All Custom Categories</span>
//             <button onClick={() => setShowAllCategories(false)}>×</button>
//           </div>
//           <div className="dropdown-content">
//             {allUserCategories.length === 0 ? (
//               <p className="no-categories">No custom categories yet</p>
//             ) : (
//               allUserCategories.map(cat => (
//                 <button
//                   key={cat}
//                   className={`dropdown-category-item ${filterCategory === cat ? 'active' : ''}`}
//                   onClick={() => {
//                     setFilterCategory(cat);
//                     setShowAllCategories(false);
//                   }}
//                 >
//                   {cat}
//                 </button>
//               ))
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   )}
// </div>
//           </div>

//           {/* Tasks Display */}
//           <div className="tasks-content">
//             {isLoading ? (
//               <div className="loading">Loading tasks...</div>
//             ) : filteredTasks.length === 0 ? (
//               <div className="empty-state">
//                 <p>No tasks found.</p>
//                 {activeTab === 'my-tasks' && (
//                   <p className="empty-subtitle">Waiting for tasks to be assigned to you.</p>
//                 )}
//               </div>
//             ) : filterCategory === 'all' ? (
//               // Show grouped by category when 'all' is selected
//               <div className="grouped-tasks">
//                 {Object.entries(groupedTasks).map(([category, tasks]) => 
//                   tasks.length > 0 && (
//                     <div key={category} className="category-section">
//                       <h2 className="category-title">{category}</h2>
//                       <div className="tasks-grid">
//                         {tasks.map(task => (
//                           <TaskCard 
//                             key={task._id} 
//                             task={task} 
//                             showAssignedTo={activeTab === 'assigned-by-me'}
//                           />
//                         ))}
//                       </div>
//                     </div>
//                   )
//                 )}
//               </div>
//             ) : (
//               // Show filtered tasks when specific category is selected
//               <div className="tasks-grid">
//                 {filteredTasks.map(task => (
//                   <TaskCard 
//                     key={task._id} 
//                     task={task} 
//                     showAssignedTo={activeTab === 'assigned-by-me'}
//                   />
//                 ))}
//               </div>
//             )}
//           </div>
//         </>
//       )}

//       {/* Modals */}
//       {showAssignModal && (
//         <AssignTask onClose={() => setShowAssignModal(false)} />
//       )}
      
//       {showSearchModal && (
//         <UserSearch onClose={() => setShowSearchModal(false)} />
//       )}
//       <div/>
//     </div>
//   );
// };

// export default Dashboard;


