import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { profilesAPI, authAPI } from '../../services/api';
import { useToast } from '../../components/common/Toast';
import Button from '../../components/common/Button';
import FileUpload from '../../components/common/FileUpload';
import { getInitials } from '../../utils/helpers';
import { FiUser, FiMail, FiBriefcase, FiLock, FiSave, FiCamera, FiEdit3, FiArrowLeft } from 'react-icons/fi';
import './Profile.css';

function Profile() {
    const { user, updateUser } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();
    
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isSavingPassword, setIsSavingPassword] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    
    const [profileData, setProfileData] = useState({
        name: user?.name || '',
        company: user?.company || '',
        bio: user?.bio || '',
        skills: Array.isArray(user?.skills) ? user.skills.join(', ') : (user?.skills || ''),
        experience: user?.experience || '',
    });

    const [passwordData, setPasswordData] = useState({
        newPassword: '',
        confirmPassword: '',
    });

    const [avatarFile, setAvatarFile] = useState([]);

    useEffect(() => {
        if (user) {
            setProfileData({
                name: user.name || '',
                company: user.company || '',
                bio: user.bio || '',
                skills: Array.isArray(user.skills) ? user.skills.join(', ') : (user.skills || ''),
                experience: user.experience || '',
            });
        }
    }, [user]);

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({ ...prev, [name]: value }));
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setIsSavingProfile(true);
        try {
            // Convert skills string back to array for the database
            const skillsArray = profileData.skills
                ? profileData.skills.split(',').map(s => s.trim()).filter(s => s !== '')
                : [];
            
            const submitData = {
                ...profileData,
                skills: skillsArray
            };

            const { user: updatedUser } = await profilesAPI.update(submitData);
            updateUser(updatedUser);
            toast.success('Profile Updated', 'Your personal information has been saved.');
            setIsEditing(false);
        } catch (err) {
            toast.error('Update Failed', err.message);
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleCancelEdit = () => {
        if (user) {
            setProfileData({
                name: user.name || '',
                company: user.company || '',
                bio: user.bio || '',
                skills: Array.isArray(user.skills) ? user.skills.join(', ') : (user.skills || ''),
                experience: user.experience || '',
            });
        }
        setIsEditing(false);
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('Validation Error', 'Passwords do not match.');
            return;
        }
        if (passwordData.newPassword.length < 8) {
            toast.error('Validation Error', 'Password must be at least 8 characters.');
            return;
        }

        setIsSavingPassword(true);
        try {
            await authAPI.updatePassword(passwordData.newPassword);
            setPasswordData({ newPassword: '', confirmPassword: '' });
            toast.success('Password Changed', 'Your account security has been updated.');
        } catch (err) {
            toast.error('Update Failed', err.message);
        } finally {
            setIsSavingPassword(false);
        }
    };

    const handleAvatarUpload = async (files) => {
        if (!files || files.length === 0) return;
        
        const file = files[0];
        setIsUploadingAvatar(true);
        try {
            const { publicUrl } = await profilesAPI.uploadAvatar(file);
            updateUser({ ...user, avatar_url: publicUrl });
            toast.success('Avatar Updated', 'Your profile picture has been changed.');
            setAvatarFile([]);
        } catch (err) {
            toast.error('Upload Failed', err.message);
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    return (
        <div className="profile-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">My Profile</h1>
                    <p className="page-subtitle">Manage your personal information and account settings.</p>
                </div>
                <Button 
                    variant="outline" 
                    icon={<FiArrowLeft />} 
                    onClick={() => navigate(-1)}
                >
                    Back
                </Button>
            </div>

            <div className="profile-content">
                <div className="profile-sidebar">
                    {/* Character Card */}
                    <div className="card profile-overview-card">
                        <div className="avatar-section">
                            <div className="avatar-wrapper">
                                <div className="avatar xl">
                                    {user?.avatar_url ? (
                                        <img src={user.avatar_url} alt={user.name} />
                                    ) : (
                                        getInitials(user?.name || 'U')
                                    )}
                                </div>
                                <div className="avatar-edit-overlay" onClick={() => document.getElementById('quick-avatar-input').click()}>
                                    <FiCamera />
                                </div>
                                <input 
                                    type="file" 
                                    id="quick-avatar-input" 
                                    style={{ display: 'none' }} 
                                    accept="image/*"
                                    onChange={(e) => handleAvatarUpload(e.target.files)}
                                />
                            </div>
                            {isUploadingAvatar ? (
                                <p className="uploading-text-sm">Uploading...</p>
                            ) : (
                                <h3 className="user-display-name">{user?.name}</h3>
                            )}
                            <p className="user-display-role">{user?.role?.toUpperCase()}</p>
                            <p className="user-display-email">{user?.email}</p>
                        </div>
                        
                        <div className="profile-stats">
                            <div className="stat-pill">
                                <span className="stat-label">Member Since</span>
                                <span className="stat-value">{new Date(user?.created_at).getFullYear()}</span>
                            </div>
                            {user?.role === 'tester' && (
                                <div className="stat-pill">
                                    <span className="stat-label">Tasks Done</span>
                                    <span className="stat-value">{user?.completed_tests || 0}</span>
                                </div>
                            )}
                        </div>
                    </div>

                </div>

                <div className="profile-main">
                    {/* Personal Info Form */}
                    <div className="card profile-form-card">
                        <div className="card-header profile-section-header">
                            <h3 className="card-title"><FiUser /> Personal Information</h3>
                            {!isEditing && (
                                <button className="edit-action-btn" onClick={() => setIsEditing(true)}>
                                    <FiEdit3 /> Edit
                                </button>
                            )}
                        </div>
                        <form onSubmit={handleUpdateProfile} className="profile-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Full Name</label>
                                    {isEditing ? (
                                        <div className="input-with-icon">
                                            <FiUser className="input-icon" />
                                            <input 
                                                type="text" 
                                                name="name"
                                                className="form-input" 
                                                value={profileData.name}
                                                onChange={handleProfileChange}
                                                required
                                            />
                                        </div>
                                    ) : (
                                        <p className="read-only-value">{profileData.name || 'Not specified'}</p>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Company / Organization</label>
                                    {isEditing ? (
                                        <div className="input-with-icon">
                                            <FiBriefcase className="input-icon" />
                                            <input 
                                                type="text" 
                                                name="company"
                                                className="form-input" 
                                                value={profileData.company}
                                                onChange={handleProfileChange}
                                            />
                                        </div>
                                    ) : (
                                        <p className="read-only-value">{profileData.company || 'Not specified'}</p>
                                    )}
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Bio</label>
                                {isEditing ? (
                                    <textarea 
                                        name="bio"
                                        className="form-input" 
                                        rows="3"
                                        placeholder="Tell us a bit about yourself..."
                                        value={profileData.bio}
                                        onChange={handleProfileChange}
                                    />
                                ) : (
                                    <p className="read-only-value bio-display">{profileData.bio || 'No bio provided yet.'}</p>
                                )}
                            </div>

                            {user?.role === 'tester' && (
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Skills</label>
                                        {isEditing ? (
                                            <input 
                                                type="text" 
                                                name="skills"
                                                className="form-input" 
                                                placeholder="React, Playwright, Manual Testing"
                                                value={profileData.skills}
                                                onChange={handleProfileChange}
                                            />
                                        ) : (
                                            <div className="read-only-skills">
                                                {profileData.skills ? profileData.skills.split(',').map((skill, i) => (
                                                    <span key={i} className="skill-badge">{skill.trim()}</span>
                                                )) : <p className="read-only-value">No skills listed</p>}
                                            </div>
                                        )}
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Experience (Years)</label>
                                        {isEditing ? (
                                            <input 
                                                type="text" 
                                                name="experience"
                                                className="form-input" 
                                                placeholder="e.g. 3 years"
                                                value={profileData.experience}
                                                onChange={handleProfileChange}
                                            />
                                        ) : (
                                            <p className="read-only-value">{profileData.experience || 'Not specified'}</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {isEditing && (
                                <div className="form-actions">
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        onClick={handleCancelEdit}
                                        style={{ marginRight: 'var(--space-3)' }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button 
                                        type="submit" 
                                        variant="primary" 
                                        loading={isSavingProfile}
                                        icon={<FiSave />}
                                    >
                                        Save Profile
                                    </Button>
                                </div>
                            )}
                        </form>
                    </div>

                    {/* Change Password Form */}
                    <div className="card profile-form-card security-card">
                        <div className="card-header">
                            <h3 className="card-title text-warning"><FiLock /> Account Security</h3>
                            <p className="card-subtitle-sm">Change your password to keep your account secure.</p>
                        </div>
                        <form onSubmit={handleUpdatePassword} className="profile-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">New Password</label>
                                    <div className="input-with-icon">
                                        <FiLock className="input-icon" />
                                        <input 
                                            type="password" 
                                            name="newPassword"
                                            className="form-input" 
                                            placeholder="Min 8 characters"
                                            value={passwordData.newPassword}
                                            onChange={handlePasswordChange}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Confirm New Password</label>
                                    <div className="input-with-icon">
                                        <FiLock className="input-icon" />
                                        <input 
                                            type="password" 
                                            name="confirmPassword"
                                            className="form-input" 
                                            placeholder="Repeat new password"
                                            value={passwordData.confirmPassword}
                                            onChange={handlePasswordChange}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="form-actions">
                                <Button 
                                    type="submit" 
                                    variant="warning" 
                                    loading={isSavingPassword}
                                    icon={<FiEdit3 />}
                                >
                                    Update Password
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Profile;
