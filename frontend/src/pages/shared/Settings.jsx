import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { Settings as SettingsIcon, Shield, CheckCircle, AlertCircle } from 'lucide-react';

export default function Settings() {
    const { user } = useAuth();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (newPassword !== confirmPassword) {
            return setError('New passwords do not match');
        }

        if (newPassword.length < 6) {
            return setError('New password must be at least 6 characters');
        }

        try {
            setLoading(true);
            await api.patch('/auth/updatePassword', {
                passwordCurrent: currentPassword,
                password: newPassword,
            });

            setSuccess('Password updated successfully');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>
                    Account Settings
                </h1>
                <p style={{ color: '#6b7280', fontSize: '14px' }}>
                    Manage your account security and preferences.
                </p>
            </div>

            <div style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                overflow: 'hidden'
            }}>
                <div style={{
                    padding: '24px',
                    borderBottom: '1px solid #e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <div style={{
                        width: '40px', height: '40px', borderRadius: '10px',
                        background: '#f3e8ff', color: '#7c3aed',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Shield size={20} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#111827' }}>Security</h2>
                        <p style={{ fontSize: '13px', color: '#6b7280' }}>Update your password.</p>
                    </div>
                </div>

                <div style={{ padding: '24px' }}>
                    {error && (
                        <div style={{
                            padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca',
                            borderRadius: '8px', color: '#dc2626', fontSize: '14px', marginBottom: '20px',
                            display: 'flex', alignItems: 'center', gap: '8px'
                        }}>
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    {success && (
                        <div style={{
                            padding: '12px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0',
                            borderRadius: '8px', color: '#16a34a', fontSize: '14px', marginBottom: '20px',
                            display: 'flex', alignItems: 'center', gap: '8px'
                        }}>
                            <CheckCircle size={16} />
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '400px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                                Current Password
                            </label>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                                style={{
                                    width: '100%', padding: '10px 12px', borderRadius: '8px',
                                    border: '1px solid #d1d5db', fontSize: '14px', outline: 'none',
                                    transition: 'border-color 0.2s'
                                }}
                                onFocus={e => e.target.style.borderColor = '#7c3aed'}
                                onBlur={e => e.target.style.borderColor = '#d1d5db'}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                                New Password
                            </label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                minLength="6"
                                style={{
                                    width: '100%', padding: '10px 12px', borderRadius: '8px',
                                    border: '1px solid #d1d5db', fontSize: '14px', outline: 'none',
                                    transition: 'border-color 0.2s'
                                }}
                                onFocus={e => e.target.style.borderColor = '#7c3aed'}
                                onBlur={e => e.target.style.borderColor = '#d1d5db'}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                minLength="6"
                                style={{
                                    width: '100%', padding: '10px 12px', borderRadius: '8px',
                                    border: '1px solid #d1d5db', fontSize: '14px', outline: 'none',
                                    transition: 'border-color 0.2s'
                                }}
                                onFocus={e => e.target.style.borderColor = '#7c3aed'}
                                onBlur={e => e.target.style.borderColor = '#d1d5db'}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !currentPassword || !newPassword || !confirmPassword}
                            style={{
                                padding: '10px 16px', background: '#7c3aed', color: '#ffffff',
                                border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 500,
                                cursor: (loading || !currentPassword || !newPassword || !confirmPassword) ? 'not-allowed' : 'pointer',
                                transition: 'background-color 0.2s', marginTop: '8px',
                                width: 'fit-content', opacity: (loading || !currentPassword || !newPassword || !confirmPassword) ? 0.7 : 1
                            }}
                            onMouseEnter={e => {
                                if (!(loading || !currentPassword || !newPassword || !confirmPassword)) e.target.style.backgroundColor = '#6d28d9';
                            }}
                            onMouseLeave={e => {
                                if (!(loading || !currentPassword || !newPassword || !confirmPassword)) e.target.style.backgroundColor = '#7c3aed';
                            }}
                        >
                            {loading ? 'Updating...' : 'Update Password'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
