import React, { useState, useRef } from 'react';
import './PremiumProfile.css';

const PremiumProfile = () => {
  const [user, setUser] = useState({
    name: 'Alex Johnson',
    email: 'alex.johnson@example.com',
    dob: '1985-08-22',
    place: 'San Francisco, CA',
    profileImage: null,
    previewImage: 'https://via.placeholder.com/200'
  });

  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUser(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUser(prev => ({
          ...prev,
          profileImage: file,
          previewImage: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    // In a real app, you would send this data to your backend
    console.log('Saving user data:', user);
    setIsEditing(false);
    // Here you would typically make an API call to update the user profile
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="premium-profile-container">
      <div className="premium-profile-card">
        <div className="profile-header">
          <h2>Premium Profile</h2>
          <p>Manage your account details</p>
        </div>

        <div className="profile-content">
          <div className="image-section">
            <div className="profile-image-container" onClick={isEditing ? triggerFileInput : null}>
              <img 
                src={user.previewImage} 
                alt="Profile" 
                className={isEditing ? 'profile-image editable' : 'profile-image'}
              />
              {isEditing && (
                <div className="image-overlay">
                  <span>Change Photo</span>
                </div>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              style={{ display: 'none' }}
            />
          </div>

          <div className="details-section">
            <div className="form-group">
              <label>Full Name</label>
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={user.name}
                  onChange={handleInputChange}
                  className="form-input"
                />
              ) : (
                <div className="form-value">{user.name}</div>
              )}
            </div>

            <div className="form-group">
              <label>Email</label>
              <div className="form-value">{user.email}</div>
            </div>

            <div className="form-group">
              <label>Date of Birth</label>
              {isEditing ? (
                <input
                  type="date"
                  name="dob"
                  value={user.dob}
                  onChange={handleInputChange}
                  className="form-input"
                />
              ) : (
                <div className="form-value">{user.dob}</div>
              )}
            </div>

            <div className="form-group">
              <label>Location</label>
              {isEditing ? (
                <input
                  type="text"
                  name="place"
                  value={user.place}
                  onChange={handleInputChange}
                  className="form-input"
                />
              ) : (
                <div className="form-value">{user.place}</div>
              )}
            </div>
          </div>
        </div>

        <div className="profile-actions">
          {isEditing ? (
            <>
              <button className="save-btn" onClick={handleSave}>
                Save Changes
              </button>
              <button className="cancel-btn" onClick={() => setIsEditing(false)}>
                Cancel
              </button>
            </>
          ) : (
            <button className="edit-btn" onClick={() => setIsEditing(true)}>
              Edit Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PremiumProfile;