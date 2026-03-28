import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, LogOut, Settings, Bell, FileText, Archive } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function AdminLayout() {
    const { logout, user } = useAuth();
    const location = useLocation();
    const [pendingCount, setPendingCount] = useState(0);
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);

    const fetchPendingCount = async () => {
        try {
            const res = await api.get('/requests/pending-count');
            console.log('Admin Notification Fetch:', res.data); // Debug log
            if (res.data.status === 'success') {
                setPendingCount(res.data.data.count);
            }
        } catch (err) {
            console.error('Failed to fetch pending requests count', err);
        }
    };

    useEffect(() => {
        fetchPendingCount();
        const interval = setInterval(fetchPendingCount, 5000); // Poll every 5 seconds for testing
        return () => clearInterval(interval);
    }, []);

    const navItems = [
        { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
        { name: 'Manage Students', path: '/admin/students', icon: Users },
        { name: 'Manage Fees', path: '/admin/fees', icon: CreditCard },
        { name: 'Payment History', path: '/admin/history', icon: FileText },
        { name: 'Requests', path: '/admin/requests', icon: Archive },
        { name: 'Settings', path: '/admin/settings', icon: Settings },
    ];

    const isActive = (path) => {
        if (path === '/admin') return location.pathname === '/admin';
        return location.pathname.startsWith(path);
    };

    return (
        <div style={{ display: 'flex', height: '100vh', background: '#f4f5f7' }}>
            {/* Sidebar */}
            <aside style={{
                width: '220px',
                background: '#1a1d2e',
                display: 'flex',
                flexDirection: 'column',
                flexShrink: 0,
                overflowY: 'auto',
            }}>
                {/* Logo */}
                <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid #2d3150' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: '32px', height: '32px', borderRadius: '8px',
                            background: '#7c3aed', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: '16px'
                        }}>🎓</div>
                        <div>
                            <div style={{ color: '#ffffff', fontSize: '10px', fontWeight: 500, lineHeight: 1.2, opacity: 0.7 }}>College Fee</div>
                            <div style={{ color: '#ffffff', fontSize: '12px', fontWeight: 700, lineHeight: 1.2 }}>Management Portal</div>
                        </div>
                    </div>
                </div>

                {/* Nav */}
                <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.path);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '10px 14px',
                                    borderRadius: '10px',
                                    textDecoration: 'none',
                                    fontSize: '13.5px',
                                    fontWeight: active ? 600 : 400,
                                    color: active ? '#ffffff' : '#a0a4b8',
                                    background: active ? '#252840' : 'transparent',
                                    borderLeft: active ? '3px solid #7c3aed' : '3px solid transparent',
                                    transition: 'all 0.15s',
                                }}
                                onMouseEnter={e => {
                                    if (!active) {
                                        e.currentTarget.style.background = '#252840';
                                        e.currentTarget.style.color = '#ffffff';
                                    }
                                }}
                                onMouseLeave={e => {
                                    if (!active) {
                                        e.currentTarget.style.background = 'transparent';
                                        e.currentTarget.style.color = '#a0a4b8';
                                    }
                                }}
                            >
                                <Icon size={17} style={{ color: active ? '#7c3aed' : 'inherit', flexShrink: 0 }} />
                                {item.name}
                                {item.name === 'Requests' && pendingCount > 0 && (
                                    <span style={{
                                        marginLeft: 'auto',
                                        background: '#ef4444',
                                        color: '#fff',
                                        fontSize: '10px',
                                        fontWeight: 700,
                                        padding: '2px 6px',
                                        borderRadius: '10px',
                                        minWidth: '18px',
                                        textAlign: 'center'
                                    }}>
                                        {pendingCount}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div style={{ padding: '16px 12px', borderTop: '1px solid #2d3150' }}>
                    <button
                        onClick={logout}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '12px',
                            width: '100%', padding: '10px 14px', borderRadius: '10px',
                            border: 'none', cursor: 'pointer',
                            fontSize: '13.5px', fontWeight: 500,
                            color: '#f87171', background: 'transparent',
                            transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#2d1515'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                        <LogOut size={17} />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Right side */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Top Header */}
                <header style={{
                    height: '64px', background: '#ffffff',
                    borderBottom: '1px solid #e5e7eb',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 28px', flexShrink: 0,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                }}>
                    <div style={{ position: 'relative', width: '320px' }}>
                        <svg style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        <input
                            type="text"
                            placeholder="Search for students, payments..."
                            style={{
                                width: '100%', paddingLeft: '38px', paddingRight: '16px',
                                paddingTop: '9px', paddingBottom: '9px',
                                border: '1px solid #e5e7eb', borderRadius: '12px',
                                fontSize: '13px', background: '#f9fafb',
                                outline: 'none', color: '#374151',
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <button style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '10px', color: '#6b7280' }}>
                            <Bell size={20} />
                            {pendingCount > 0 && (
                                <span style={{
                                    position: 'absolute',
                                    top: '6px',
                                    right: '6px',
                                    width: '8px',
                                    height: '8px',
                                    background: '#ef4444',
                                    borderRadius: '50%',
                                    border: '2px solid #fff'
                                }}></span>
                            )}
                        </button>
                        <div style={{ position: 'relative' }}>
                            <div 
                                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    padding: '6px 14px 6px 8px',
                                    background: '#f3f4f6', borderRadius: '50px',
                                    cursor: 'pointer',
                                }}
                            >
                                <div style={{
                                    width: '30px', height: '30px', borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'white', fontSize: '12px', fontWeight: 700,
                                }}>
                                    {(user?.name || 'A').charAt(0).toUpperCase()}
                                </div>
                                <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                                    {user?.name || 'Admin'}
                                </span>
                            </div>

                            {showProfileDropdown && (
                                <div style={{
                                    position: 'absolute', top: '100%', right: 0, marginTop: '8px',
                                    width: '240px', background: '#ffffff', borderRadius: '12px',
                                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
                                    border: '1px solid #e5e7eb', zIndex: 100, padding: '12px'
                                }}>
                                    <div style={{ paddingBottom: '12px', borderBottom: '1px solid #f3f4f6', marginBottom: '8px' }}>
                                        <p style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>Admin Profile</p>
                                        <p style={{ fontSize: '14px', fontWeight: 700, color: '#111827', margin: 0 }}>{user?.name}</p>
                                        <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0 0' }}>{user?.email}</p>
                                    </div>
                                    <button 
                                        onClick={logout}
                                        style={{
                                            width: '100%', padding: '10px', display: 'flex', alignItems: 'center', gap: '10px',
                                            background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '8px',
                                            fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
                                        onMouseLeave={e => e.currentTarget.style.background = '#fef2f2'}
                                    >
                                        <LogOut size={16} /> Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main style={{ flex: 1, overflowY: 'auto', padding: '28px' }}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
