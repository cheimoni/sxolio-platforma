import React, { useState, useEffect, useRef } from 'react';
import './StickyNotes.css';
import { saveData, getData, deleteData, listenToData } from '../firebase/database';

const StickyNotes = ({ onClose }) => {
  const [notes, setNotes] = useState([]);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState(new Set());

  // Περισσότερα χρώματα - 12 συνολικά
  const colors = [
    { name: 'Κίτρινο', color: '#FFE66D' },
    { name: 'Ροζ', color: '#FF6B9D' },
    { name: 'Μπλε', color: '#6BCFFF' },
    { name: 'Πράσινο', color: '#6BFF9D' },
    { name: 'Πορτοκαλί', color: '#FFA06B' },
    { name: 'Μωβ', color: '#B66BFF' },
    { name: 'Κόκκινο', color: '#FF6B6B' },
    { name: 'Τυρκουάζ', color: '#15AABF' },
    { name: 'Λαχανί', color: '#82C91E' },
    { name: 'Καφέ', color: '#D4A574' },
    { name: 'Γκρι', color: '#868E96' },
    { name: 'Μαύρο', color: '#212529' }
  ];

  // Load notes from localStorage and server
  useEffect(() => {
    loadNotes();
    
    // Listen to server updates
    const unsubscribe = listenToData('stickyNotes', (serverData) => {
      if (serverData) {
        // Merge server data with local
        const serverNotes = Object.entries(serverData).map(([id, note]) => ({
          ...note,
          id,
          fromServer: true
        }));
        
        // Load local notes
        try {
          const localData = localStorage.getItem('stickyNotes');
          const localNotes = localData ? JSON.parse(localData) : [];
          
          // Combine: server notes first, then local ones that aren't on server
          const localOnly = localNotes.filter(local => 
            !serverNotes.some(server => server.id === local.id)
          );
          
          setNotes([...serverNotes, ...localOnly]);
        } catch (err) {
          console.error('Error loading local notes:', err);
          setNotes(serverNotes);
        }
      } else {
        // No server data, load only local
        try {
          const localData = localStorage.getItem('stickyNotes');
          setNotes(localData ? JSON.parse(localData) : []);
        } catch (err) {
          console.error('Error loading local notes:', err);
          setNotes([]);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const loadNotes = async () => {
    try {
      // Load from server
      const serverResult = await getData('stickyNotes');
      const serverNotes = serverResult.success && serverResult.data
        ? Object.entries(serverResult.data).map(([id, note]) => ({
            ...note,
            id,
            fromServer: true
          }))
        : [];

      // Load from localStorage
      const localData = localStorage.getItem('stickyNotes');
      const localNotes = localData ? JSON.parse(localData) : [];

      // Combine: server first, then local that aren't on server
      const localOnly = localNotes.filter(local =>
        !serverNotes.some(server => server.id === local.id)
      );

      setNotes([...serverNotes, ...localOnly]);
    } catch (err) {
      console.error('Error loading notes:', err);
    }
  };

  // Save notes to localStorage
  useEffect(() => {
    try {
      const localOnly = notes.filter(n => !n.fromServer);
      if (localOnly.length > 0) {
        localStorage.setItem('stickyNotes', JSON.stringify(localOnly));
      } else {
        localStorage.removeItem('stickyNotes');
      }
    } catch (err) {
      console.error('Error saving notes:', err);
    }
  }, [notes]);

  const addNote = (color) => {
    const newNote = {
      id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text: '',
      color: color,
      x: Math.random() * (window.innerWidth - 300) + 50,
      y: Math.random() * (window.innerHeight - 300) + 50,
      fromServer: false
    };
    setNotes([...notes, newNote]);
    setShowColorPicker(false);
  };

  const updateNote = async (id, text) => {
    const note = notes.find(n => n.id === id);
    if (!note) return;

    // Update locally
    setNotes(notes.map(note =>
      note.id === id ? { ...note, text } : note
    ));

    // Αν είναι στον server, ενημέρωσε και εκεί
    if (note.fromServer) {
      try {
        await saveData(`stickyNotes/${id}`, {
          text: text,
          color: note.color,
          x: note.x,
          y: note.y,
          timestamp: note.timestamp || Date.now()
        });
      } catch (err) {
        console.error('Error updating note on server:', err);
      }
    }
  };

  const toggleSelection = (id) => {
    setSelectedNotes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const deleteNote = async (id, isSelected = false) => {
    const note = notes.find(n => n.id === id);
    if (!note) return;

    // Warning message
    const confirmMessage = note.fromServer
      ? 'Αν διαγράψετε αυτή τη σημείωση, θα διαγραφεί μόνιμα από τον server και θα χάσετε όλα τα δεδομένα. Είστε σίγουροι;'
      : 'Αν διαγράψετε αυτή τη σημείωση, θα αποθηκευτεί στον server ως διαγραμμένη. Είστε σίγουροι;';

    if (!window.confirm(confirmMessage)) {
      return;
    }

    if (note.fromServer) {
      // Delete from server
      try {
        await deleteData(`stickyNotes/${id}`);
        setNotes(prev => prev.filter(n => n.id !== id));
        if (isSelected) {
          setSelectedNotes(prev => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
          });
        }
      } catch (err) {
        console.error('Error deleting from server:', err);
        alert('Σφάλμα κατά τη διαγραφή από τον server');
      }
    } else {
      // Save to server as deleted, then remove locally
      try {
        await saveData(`stickyNotes/deleted/${id}`, {
          ...note,
          deletedAt: Date.now(),
          deleted: true
        });
        setNotes(prev => prev.filter(n => n.id !== id));
        if (isSelected) {
          setSelectedNotes(prev => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
          });
        }
      } catch (err) {
        console.error('Error saving deleted note:', err);
        // Still remove locally even if server save fails
        setNotes(prev => prev.filter(n => n.id !== id));
        if (isSelected) {
          setSelectedNotes(prev => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
          });
        }
      }
    }
  };

  const deleteSelected = async () => {
    if (selectedNotes.size === 0) return;

    const confirmMessage = `Είστε σίγουροι ότι θέλετε να διαγράψετε ${selectedNotes.size} επιλεγμένες σημειώσεις;`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    const selectedArray = Array.from(selectedNotes);
    const toDelete = notes.filter(n => selectedArray.includes(n.id));

    // Separate server and local notes
    const serverNotes = toDelete.filter(n => n.fromServer);
    const localNotes = toDelete.filter(n => !n.fromServer);

    // Delete server notes
    for (const note of serverNotes) {
      try {
        await deleteData(`stickyNotes/${note.id}`);
      } catch (err) {
        console.error(`Error deleting ${note.id} from server:`, err);
      }
    }

    // Save local notes as deleted
    for (const note of localNotes) {
      try {
        await saveData(`stickyNotes/deleted/${note.id}`, {
          ...note,
          deletedAt: Date.now(),
          deleted: true
        });
      } catch (err) {
        console.error(`Error saving deleted ${note.id}:`, err);
      }
    }

    // Remove from state
    setNotes(prev => prev.filter(n => !selectedArray.includes(n.id)));
    setSelectedNotes(new Set());
  };

  const saveToServer = async (id) => {
    const note = notes.find(n => n.id === id);
    if (!note || note.fromServer) return;

    try {
      await saveData(`stickyNotes/${id}`, {
        text: note.text,
        color: note.color,
        x: note.x,
        y: note.y,
        timestamp: note.timestamp || Date.now()
      });

      // Update to mark as from server
      setNotes(prev =>
        prev.map(n =>
          n.id === id ? { ...n, fromServer: true } : n
        )
      );
    } catch (err) {
      console.error('Error saving to server:', err);
      alert('Σφάλμα κατά την αποθήκευση στον server');
    }
  };

  // Debounce για αποθήκευση θέσης στον server
  const moveNoteDebounceRef = useRef({});

  const moveNote = async (id, x, y) => {
    const note = notes.find(n => n.id === id);
    if (!note) return;

    // Update locally
    setNotes(prevNotes => prevNotes.map(note =>
      note.id === id ? { ...note, x, y } : note
    ));

    // Αν είναι στον server, ενημέρωσε και εκεί (με debounce)
    if (note.fromServer) {
      // Clear previous timeout
      if (moveNoteDebounceRef.current[id]) {
        clearTimeout(moveNoteDebounceRef.current[id]);
      }

      // Set new timeout για debounce (500ms)
      moveNoteDebounceRef.current[id] = setTimeout(async () => {
        try {
          // Χρησιμοποιούμε functional update για να πάρουμε το latest state
          setNotes(currentNotes => {
            const currentNote = currentNotes.find(n => n.id === id);
            if (currentNote) {
              // Ασύγχρονη αποθήκευση στον server
              saveData(`stickyNotes/${id}`, {
                text: currentNote.text,
                color: currentNote.color,
                x: currentNote.x,
                y: currentNote.y,
                timestamp: currentNote.timestamp || Date.now()
              }).catch(err => {
                console.error('Error updating note position on server:', err);
              });
            }
            return currentNotes; // Δεν αλλάζουμε το state
          });
        } catch (err) {
          console.error('Error updating note position on server:', err);
        }
        delete moveNoteDebounceRef.current[id];
      }, 500);
    }
  };

  return (
    <div className="sticky-notes-container">
      {/* Add Note Button */}
      <button
        className="add-note-btn"
        onClick={() => setShowColorPicker(!showColorPicker)}
        title="Προσθήκη Σημείωσης"
      >
        📝 +
      </button>

      {/* Delete Selected Button */}
      {selectedNotes.size > 0 && (
        <button
          className="delete-selected-btn"
          onClick={deleteSelected}
          title={`Διαγραφή ${selectedNotes.size} επιλεγμένων`}
        >
          🗑️ Διαγραφή ({selectedNotes.size})
        </button>
      )}

      {/* Color Picker */}
      {showColorPicker && (
        <div className="color-picker">
          <div className="color-picker-title">Επιλέξτε Χρώμα:</div>
          {colors.map(c => (
            <button
              key={c.color}
              className="color-option"
              style={{ backgroundColor: c.color }}
              onClick={() => addNote(c.color)}
              title={c.name}
            />
          ))}
        </div>
      )}

      {/* Render all notes */}
      {notes.map(note => (
        <StickyNote
          key={note.id}
          note={note}
          isSelected={selectedNotes.has(note.id)}
          onToggleSelection={() => toggleSelection(note.id)}
          onUpdate={(text) => updateNote(note.id, text)}
          onDelete={() => deleteNote(note.id, true)}
          onMove={(x, y) => moveNote(note.id, x, y)}
          onSaveToServer={() => saveToServer(note.id)}
        />
      ))}
    </div>
  );
};

const StickyNote = ({ note, isSelected, onToggleSelection, onUpdate, onDelete, onMove, onSaveToServer }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e) => {
    // Αποκλείουμε drag μόνο από interactive elements
    if (
      e.target.tagName === 'TEXTAREA' || 
      e.target.tagName === 'INPUT' || 
      e.target.tagName === 'BUTTON' ||
      e.target.closest('button') ||
      e.target.closest('.sticky-note-actions')
    ) {
      return;
    }

    // Επιτρέπουμε drag από οπουδήποτε αλλού (header, footer, κενά μέρη)
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - note.x,
      y: e.clientY - note.y
    });
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      onMove(e.clientX - dragOffset.x, e.clientY - dragOffset.y);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, onMove]);

  return (
    <div
      className={`sticky-note ${isDragging ? 'dragging' : ''} ${isSelected ? 'selected' : ''}`}
      style={{
        left: `${note.x}px`,
        top: `${note.y}px`,
        backgroundColor: note.color
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="sticky-note-header">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelection}
          className="sticky-note-checkbox"
          onClick={(e) => e.stopPropagation()}
        />
        <div className="sticky-note-handle">⋮⋮</div>
        <div className="sticky-note-actions">
          {!note.fromServer && (
            <button
              className="save-server-btn"
              onClick={(e) => {
                e.stopPropagation();
                onSaveToServer();
              }}
              title="Αποθήκευση στον server"
            >
              💾
            </button>
          )}
          <button
            className="sticky-note-delete"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Διαγραφή"
          >
            ✕
          </button>
        </div>
      </div>
      <textarea
        className="sticky-note-text"
        value={note.text}
        onChange={(e) => onUpdate(e.target.value)}
        placeholder="Γράψτε τη σημείωσή σας..."
        onMouseDown={(e) => e.stopPropagation()}
      />
      {note.fromServer && (
        <div className="sticky-note-footer">
          <span className="server-badge">🌐 Server</span>
        </div>
      )}
    </div>
  );
};

export default StickyNotes;
