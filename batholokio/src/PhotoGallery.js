// @FILE-INFO: PhotoGallery.js | src/components/PhotoGallery.js

import React, { useState, useEffect } from 'react';
import { ref, query, orderByChild, limitToLast, onValue, push, set, remove, get, endBefore } from 'firebase/database';

const PhotoGallery = ({ user, students, onBack, database }) => {
  const [galleryImages, setGalleryImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const IMAGES_PER_PAGE = 20;

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Your Cloudinary details
  const CLOUDINARY_CLOUD_NAME = "dlgfmjfuf";
  const CLOUDINARY_UPLOAD_PRESET = "cheimonides";

  const isTeacher = user && user.type === 'teacher';

  useEffect(() => {
    setIsLoading(true);
    const galleryRef = ref(database, 'gallery');
    const initialQuery = query(galleryRef, orderByChild('timestamp'), limitToLast(IMAGES_PER_PAGE));

    const unsubscribe = onValue(initialQuery, (snapshot) => {
      const data = snapshot.val() || {};
      const imageList = Object.keys(data).map(key => ({ id: key, ...data[key] })).sort((a, b) => b.timestamp - a.timestamp);
      setGalleryImages(imageList);
      setHasMore(imageList.length === IMAGES_PER_PAGE);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [database]);

  const loadMoreImages = async () => {
    if (!hasMore || isLoadingMore) return;

    setIsLoadingMore(true);
    const lastImage = galleryImages[galleryImages.length - 1];
    if (!lastImage) {
        setIsLoadingMore(false);
        setHasMore(false);
        return;
    }

    const galleryRef = ref(database, 'gallery');
    const nextQuery = query(
        galleryRef,
        orderByChild('timestamp'),
        endBefore(lastImage.timestamp),
        limitToLast(IMAGES_PER_PAGE)
    );

    const snapshot = await get(nextQuery);
    if (snapshot.exists()) {
        const data = snapshot.val();
        const newImages = Object.keys(data).map(key => ({ id: key, ...data[key] })).sort((a, b) => b.timestamp - a.timestamp);
        setGalleryImages(prev => [...prev, ...newImages]);
        setHasMore(newImages.length === IMAGES_PER_PAGE);
    } else {
        setHasMore(false);
    }
    setIsLoadingMore(false);
  };

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const resetUploader = () => {
      setSelectedFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setSelectedStudentId('');
      setIsUploading(false);
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedStudentId) { alert("Παρακαλώ επιλέξτε αρχείο και μαθητή."); return; }
    
    setIsUploading(true);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();

      if (data.secure_url) {
        const selectedStudent = students.find(s => s.id.toString() === selectedStudentId);
        if (!selectedStudent) { throw new Error("Student not found"); }

        const newImageRef = push(ref(database, 'gallery'));
        await set(newImageRef, {
          imageUrl: data.secure_url,
          studentId: selectedStudentId,
          studentName: `${selectedStudent.lastName} ${selectedStudent.firstName}`,
          timestamp: Date.now()
        });
        resetUploader();
      } else {
        throw new Error("Cloudinary upload failed.");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Σφάλμα κατά το ανέβασμα της εικόνας.");
      setIsUploading(false);
    }
  };

  const handleDelete = async (image) => {
    if (!window.confirm("Είστε σίγουρος ότι θέλετε να αφαιρέσετε αυτή την εργασία από τη gallery;")) return;
    try {
      // Delete the entry from Realtime Database
      const imageDbRef = ref(database, `gallery/${image.id}`);
      await remove(imageDbRef);
    } catch (error) {
      console.error("Delete error:", error);
      alert("Σφάλμα κατά τη διαγραφή.");
    }
  };
  
  const Uploader = () => (
    <div className="uploader-section">
      <h3>🎨 Ανέβασμα Νέας Εργασίας</h3>
      <div className="upload-form">
        <input type="file" onChange={handleFileSelect} accept="image/*" disabled={isUploading} />
        {previewUrl && <div className="upload-preview-container"><img src={previewUrl} alt="Προεπισκόπηση" className="upload-preview" /></div>}
        <select value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)} disabled={isUploading}>
          <option value="">-- Επιλέξτε Μαθητή --</option>
          {students.map(s => <option key={s.id} value={s.id}>{`${s.lastName} ${s.firstName}`}</option>)}
        </select>
        <button onClick={handleUpload} disabled={isUploading || !selectedFile || !selectedStudentId} className="upload-btn">
          {isUploading ? 'Ανέβασμα...' : '🚀 Ανέβασμα'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="teacher-view">
      <div className="header">
        <h2>🖼️ Gallery Έργων</h2>
        <button onClick={onBack} className="logout-btn" style={{backgroundColor: '#555'}}>⬅️ ΕΠΙΣΤΡΟΦΗ</button>
      </div>
      <div className="gallery-container">
        {isTeacher && <Uploader />}
        {isLoading ? <p>Φόρτωση gallery...</p> : (
          <div className="gallery-grid">
            {galleryImages.map(image => (
              <div key={image.id} className="gallery-item">
                {isTeacher && (
                  <button onClick={() => handleDelete(image)} className="delete-photo-btn" title="Διαγραφή Φωτογραφίας">🗑️</button>
                )}
                <img src={image.imageUrl} alt={`Εργασία από ${image.studentName}`} />
                <div className="gallery-item-info">
                  <strong>{image.studentName}</strong>
                </div>
              </div>
            ))}
            {hasMore && (
              <div className="gallery-load-more">
                <button onClick={loadMoreImages} disabled={isLoadingMore}>{isLoadingMore ? 'Φόρτωση...' : 'Φόρτωση Περισσότερων'}</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotoGallery;