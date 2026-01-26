import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAllNotes } from '../redux/slices/noteSlice';
import NoteCard from './NoteCard';
import CreateNote from './CreateNote';
import './Notes.css';

const Notes = () => {
  const dispatch = useDispatch();
  const { notes, isLoading } = useSelector((state) => state.notes);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedNote, setSelectedNote] = useState(null);

  useEffect(() => {
    dispatch(getAllNotes());
  }, [dispatch]);

  const categories = ['all', 'General', 'DSA', 'System Design', 'Web Dev', 'React', 'JavaScript', 'Other'];

  const filterNotes = (notes) => {
    if (filterCategory === 'all') return notes;
    return notes.filter(note => note.category === filterCategory);
  };

  const groupNotesByCategory = (notes) => {
    const grouped = {};
    categories.filter(c => c !== 'all').forEach(cat => {
      grouped[cat] = notes.filter(note => note.category === cat);
    });
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

  return (
    <div className="notes-container-pro">
      <div className="notes-header-pro">
        <div className="notes-header-content-pro">
          <h2>Shared Notes</h2>
          <p>Important information accessible to all users</p>
        </div>
        <button className="create-note-btn-pro" onClick={() => setShowCreateModal(true)}>
          Create Note
        </button>
      </div>

      <div className="notes-filter-pro">
        <label className="filter-label-pro">Filter by Category:</label>
        <div className="category-pills-notes">
          {categories.map(cat => (
            <button
              key={cat}
              className={`category-pill-note ${filterCategory === cat ? 'active' : ''}`}
              onClick={() => setFilterCategory(cat)}
            >
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </div>
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
            {Object.entries(groupedNotes).map(([category, categoryNotes]) => 
              categoryNotes.length > 0 && (
                <div key={category} className="category-section-notes">
                  <h3 className="category-title-notes">{category}</h3>
                  <div className="notes-horizontal-scroll">
                    {categoryNotes.map(note => (
                      <NoteCard 
                        key={note._id} 
                        note={note} 
                        onViewFull={handleViewNote}
                      />
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        ) : (
          <div className="notes-horizontal-scroll">
            {filteredNotes.map(note => (
              <NoteCard 
                key={note._id} 
                note={note} 
                onViewFull={handleViewNote}
              />
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateNote onClose={() => setShowCreateModal(false)} />
      )}

      {selectedNote && (
        <div className="note-modal-overlay" onClick={closeNoteModal}>
          <div className="note-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="note-modal-header">
              <div className="note-modal-category">{selectedNote.category}</div>
              <button className="note-modal-close" onClick={closeNoteModal}>
                &times;
              </button>
            </div>
            <h2 className="note-modal-title">{selectedNote.title}</h2>
            <div className="note-modal-meta">
              <span className="note-modal-author">
                By {selectedNote.createdBy.name}
              </span>
              <span className="note-modal-date">
                {new Date(selectedNote.updatedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
            <div className="note-modal-content-text">
              {selectedNote.content}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notes;