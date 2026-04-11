import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAllNotes } from '../redux/slices/noteSlice';
import NoteCard from './NoteCard';
import CreateNote from './CreateNote';
import './Notes.css';

const DEFAULT_NOTE_CATEGORIES = [
  'General',
  'DSA',
  'System Design',
  'Web Dev',
  'React',
  'JavaScript',
  'Other',
];

const sortCategoryKeys = (keys) => {
  const order = DEFAULT_NOTE_CATEGORIES;
  return [...keys].sort((a, b) => {
    const ia = order.indexOf(a);
    const ib = order.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
};

const Notes = ({ onXPGained }) => {
  const dispatch = useDispatch();
  const { notes, isLoading } = useSelector((state) => state.notes);
  const { user } = useSelector((state) => state.auth);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedNote, setSelectedNote] = useState(null);
  const [showAllCategories, setShowAllCategories] = useState(false);

  useEffect(() => {
    dispatch(getAllNotes());
  }, [dispatch]);

  const pillCategories = useMemo(() => {
    const seen = new Set();
    const out = [];
    for (const c of DEFAULT_NOTE_CATEGORIES) {
      if (c && !seen.has(c)) {
        seen.add(c);
        out.push(c);
      }
    }
    for (const c of user?.customCategories || []) {
      if (c && !seen.has(c)) {
        seen.add(c);
        out.push(c);
      }
    }
    return ['all', ...out];
  }, [user?.customCategories]);

  useEffect(() => {
    if (filterCategory !== 'all' && !pillCategories.includes(filterCategory)) {
      setFilterCategory('all');
    }
  }, [pillCategories, filterCategory]);

  const filterNotes = (list) => {
    if (filterCategory === 'all') return list;
    return list.filter((note) => note.category === filterCategory);
  };

  const groupNotesByCategory = (list) => {
    const grouped = {};
    for (const note of list) {
      const cat = note.category || 'General';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(note);
    }
    return grouped;
  };

  const filteredNotes = filterNotes(notes);
  const groupedNotes = groupNotesByCategory(notes);

  const handleViewNote = (note) => {
    setSelectedNote(note);
  };

  const closeNoteModal = () => {
    setSelectedNote(null);
  };

  const visiblePills = pillCategories.slice(0, 6);
  const hasMorePills = pillCategories.length > 6;

  return (
    <div className="notes-container-pro">
      <div className="notes-header-pro">
        <div className="notes-header-content-pro">
          <h2>Shared Notes</h2>
          <p>Important information accessible to all users</p>
        </div>
        <button type="button" className="create-note-btn-pro" onClick={() => setShowCreateModal(true)}>
          Create Note
        </button>
      </div>

      <div className="notes-filter-pro">
        <h3 className="section-heading-pro notes-categories-heading-pro">Categories</h3>
        <div className="category-pills-pro category-pills-notes">
          {visiblePills.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`category-pill-pro category-pill-note ${filterCategory === cat ? 'active' : ''}`}
              onClick={() => setFilterCategory(cat)}
            >
              {cat === 'all' ? 'All Categories' : cat}
            </button>
          ))}
          {hasMorePills && (
            <button type="button" className="category-pill-pro category-pill-note more" onClick={() => setShowAllCategories(true)}>
              More Categories
            </button>
          )}
        </div>

        {showAllCategories && (
          <div className="categories-modal-overlay-pro" onClick={() => setShowAllCategories(false)}>
            <div className="categories-modal-pro" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header-pro">
                <h3>All Categories</h3>
                <button type="button" onClick={() => setShowAllCategories(false)} aria-label="Close">
                  &times;
                </button>
              </div>
              <div className="categories-grid-pro">
                {pillCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
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

      <div className="notes-content-pro">
        {isLoading ? (
          <div className="loading-pro">Loading notes...</div>
        ) : filteredNotes.length === 0 ? (
          <div className="empty-state-pro">
            <p>No notes found.</p>
            <p className="empty-subtitle-pro">Create your first shared note!</p>
          </div>
        ) : filterCategory === 'all' ? (
          <div className="grouped-notes-pro">
            {sortCategoryKeys(Object.keys(groupedNotes)).map((category) => {
              const categoryNotes = groupedNotes[category];
              if (!categoryNotes?.length) return null;
              return (
                <div key={category} className="category-section-notes">
                  <h3 className="category-title-notes">{category}</h3>
                  <div className="category-cards-scroll-pro category-cards-scroll-pro--notes">
                    <div className="notes-cards-grid">
                      {categoryNotes.map((note) => (
                        <NoteCard key={note._id} note={note} onViewFull={handleViewNote} />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="category-cards-scroll-pro category-cards-scroll-pro--notes">
            <div className="notes-cards-grid">
              {filteredNotes.map((note) => (
                <NoteCard key={note._id} note={note} onViewFull={handleViewNote} />
              ))}
            </div>
          </div>
        )}
      </div>

      {showCreateModal && <CreateNote onClose={() => setShowCreateModal(false)} onXPGained={onXPGained} />}

      {selectedNote && (
        <div className="note-modal-overlay" onClick={closeNoteModal}>
          <div className="note-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="note-modal-header">
              <div className="note-modal-category">{selectedNote.category}</div>
              <button type="button" className="note-modal-close" onClick={closeNoteModal}>
                &times;
              </button>
            </div>
            <h2 className="note-modal-title">{selectedNote.title}</h2>
            <div className="note-modal-meta">
              <span className="note-modal-author">By {selectedNote.createdBy.name}</span>
              <span className="note-modal-date">
                {new Date(selectedNote.updatedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <div className="note-modal-content-text">{selectedNote.content}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notes;
