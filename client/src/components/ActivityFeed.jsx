// import React, { useEffect, useState } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { getAllActivities } from '../redux/slices/activitySlice';
// import ActivityCard from './ActivityCard';
// import PostActivity from './PostActivity';
// import './ActivityFeed.css';

// const ActivityFeed = () => {
//   const dispatch = useDispatch();
//   const { activities, isLoading } = useSelector((state) => state.activities);
//   const [showPostModal, setShowPostModal] = useState(false);
//   const [filterCategory, setFilterCategory] = useState('all');

//   useEffect(() => {
//     dispatch(getAllActivities());
//   }, [dispatch]);

//   const categories = ['all', 'General', 'DSA', 'System Design', 'Web Dev', 'React', 'JavaScript', 'Other'];

//   const filterActivities = (activities) => {
//     if (filterCategory === 'all') return activities;
//     return activities.filter(activity => activity.category === filterCategory);
//   };

//   const filteredActivities = filterActivities(activities);

//   return (
//     <div className="activity-feed-container">
//       <div className="activity-feed-header">
//         <div className="activity-header-content">
//           <h2>🎯 Activity Feed</h2>
//           <p>Share what you've accomplished and see what others are doing</p>
//         </div>
//         <button className="post-activity-btn" onClick={() => setShowPostModal(true)}>
//           + Post Activity
//         </button>
//       </div>

//       {/* Category Filter */}
//       <div className="activity-filter">
//         <label>Filter by Category:</label>
//         <div className="category-pills">
//           {categories.map(cat => (
//             <button
//               key={cat}
//               className={`category-pill ${filterCategory === cat ? 'active' : ''}`}
//               onClick={() => setFilterCategory(cat)}
//             >
//               {cat === 'all' ? 'All' : cat}
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* Activities Display */}
//       <div className="activity-feed-content">
//         {isLoading ? (
//           <div className="loading">Loading activities...</div>
//         ) : filteredActivities.length === 0 ? (
//           <div className="empty-state">
//             <p>No activities yet.</p>
//             <p className="empty-subtitle">Be the first to share what you've accomplished!</p>
//           </div>
//         ) : (
//           <div className="activities-list">
//             {filteredActivities.map(activity => (
//               <ActivityCard key={activity._id} activity={activity} />
//             ))}
//           </div>
//         )}
//       </div>

//       {/* Post Activity Modal */}
//       {showPostModal && (
//         <PostActivity onClose={() => setShowPostModal(false)} />
//       )}
//     </div>
//   );
// };

// export default ActivityFeed;


import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAllActivities } from '../redux/slices/activitySlice';
import ActivityCard from './ActivityCard';
import PostActivity from './PostActivity';
import './ActivityFeed.css';

const ActivityFeed = () => {
  const dispatch = useDispatch();
  const { activities, isLoading } = useSelector((state) => state.activities);
  const { user } = useSelector((state) => state.auth);
  const [showPostModal, setShowPostModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');
  const [showAllCategories, setShowAllCategories] = useState(false);

  useEffect(() => {
    dispatch(getAllActivities());
  }, [dispatch]);

  const defaultCategories = ['General', 'DSA', 'System Design', 'Web Dev', 'React', 'JavaScript', 'Other'];
  const userCustomCategories = user?.customCategories || [];
  
  const ALL_CATEGORIES = [
    ...new Set([
      ...defaultCategories,
      ...userCustomCategories
    ])
  ];

  const categories = ['all', ...ALL_CATEGORIES];

  const filterActivities = (activities) => {
    if (filterCategory === 'all') return activities;
    return activities.filter(activity => activity.category === filterCategory);
  };

  const groupActivitiesByCategory = (activities) => {
    const grouped = {};
    ALL_CATEGORIES.forEach(cat => {
      const catActivities = activities.filter(activity => activity.category === cat);
      if (catActivities.length > 0) {
        grouped[cat] = catActivities;
      }
    });
    return grouped;
  };

  const filteredActivities = filterActivities(activities);
  const groupedActivities = groupActivitiesByCategory(activities);

  return (
    <div className="activity-feed-container-pro">
      <div className="activity-feed-header-pro">
        <div className="activity-header-content-pro">
          <h2>Activity Feed</h2>
          <p>Share what you've accomplished and see what others are doing</p>
        </div>
        <button className="create-note-btn-pro" onClick={() => setShowPostModal(true)}>
          Post Activity
        </button>
      </div>

      <div className="activity-filter-pro">
        <label className="filter-label-pro">Filter by Category:</label>
        <div className="category-pills-activity">
          {categories.slice(0, 7).map(cat => (
            <button
              key={cat}
              className={`category-pill-activity ${filterCategory === cat ? 'active' : ''}`}
              onClick={() => setFilterCategory(cat)}
            >
              {cat === 'all' ? 'All Categories' : cat}
            </button>
          ))}
          {categories.length > 7 && (
            <button 
              className="category-pill-activity more"
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
                {categories.map(cat => (
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

      <div className="activity-feed-content-pro">
        {isLoading ? (
          <div className="loading-pro">Loading activities...</div>
        ) : filteredActivities.length === 0 ? (
          <div className="empty-state-pro">
            <p>No activities yet.</p>
            <p className="empty-subtitle-pro">Be the first to share what you've accomplished!</p>
          </div>
        ) : filterCategory === 'all' ? (
          <div className="grouped-activities-pro">
            {Object.entries(groupedActivities).map(([category, categoryActivities]) => 
              categoryActivities.length > 0 && (
                <div key={category} className="category-section-activity">
                  <h3 className="category-title-activity">{category}</h3>
                  <div className="activities-horizontal-scroll">
                    {categoryActivities.map(activity => (
                      <ActivityCard key={activity._id} activity={activity} />
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        ) : (
          <div className="activities-horizontal-scroll">
            {filteredActivities.map(activity => (
              <ActivityCard key={activity._id} activity={activity} />
            ))}
          </div>
        )}
      </div>

      {showPostModal && (
        <PostActivity onClose={() => setShowPostModal(false)} />
      )}
    </div>
  );
};

export default ActivityFeed;