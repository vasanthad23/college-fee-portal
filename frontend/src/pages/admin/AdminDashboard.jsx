import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const statCardStyle = (bgColor) => ({
    background: '#ffffff',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    border: '1px solid #f0f0f0',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flex: 1,
    transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: 'default',
});

const iconBox = (bg) => ({
    width: '48px', height: '48px',
    borderRadius: '12px',
    background: bg,
    display: 'flex', alignItems: 'center',
    justifyContent: 'center',
    fontSize: '22px',
    flexShrink: 0,
});

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState({ students: 0, totalFees: 0, collected: 0, pending: 0 });
    const [recentPayments, setRecentPayments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [studentsRes, paymentsRes] = await Promise.all([
                api.get('/students'),
                api.get('/payments/all').catch(() => ({ data: { data: [] } })),
            ]);

            const students = studentsRes.data.data || [];
            const payments = paymentsRes.data.data || [];

            const totalFees = students.reduce((sum, s) => sum + (s.feeStructureId?.totalAmount || 0), 0);
            const collected = payments.reduce((sum, p) => sum + (p.amountPaid || 0), 0);
            const pending = totalFees - collected;

            setStats({
                students: students.length,
                totalFees,
                collected,
                pending: Math.max(0, pending),
            });

            setRecentPayments(payments.slice(0, 5));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Page Title */}
            <div>
                <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', margin: 0 }}>Admin Dashboard</h1>
                <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>Here's a summary of all the fees this month.</p>
            </div>

            {/* Stat Cards */}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div style={statCardStyle()}>
                    <div style={iconBox('#eff6ff')}>👥</div>
                    <div>
                        <p style={{ fontSize: '12px', color: '#6b7280', margin: 0, fontWeight: 500 }}>Total Students</p>
                        <p style={{ fontSize: '28px', fontWeight: 800, color: '#1e3a8a', margin: '2px 0 0' }}>{loading ? '—' : stats.students}</p>
                    </div>
                </div>

                <div style={statCardStyle()}>
                    <div style={iconBox('#fffbeb')}>💰</div>
                    <div>
                        <p style={{ fontSize: '12px', color: '#6b7280', margin: 0, fontWeight: 500 }}>Total Fees</p>
                        <p style={{ fontSize: '24px', fontWeight: 800, color: '#92400e', margin: '2px 0 0' }}>{loading ? '—' : fmt(stats.totalFees)}</p>
                    </div>
                </div>

                <div style={statCardStyle()}>
                    <div style={iconBox('#f0fdf4')}>✅</div>
                    <div>
                        <p style={{ fontSize: '12px', color: '#6b7280', margin: 0, fontWeight: 500 }}>Total Balance</p>
                        <p style={{ fontSize: '24px', fontWeight: 800, color: '#14532d', margin: '2px 0 0' }}>{loading ? '—' : fmt(stats.collected)}</p>
                    </div>
                </div>

                <div style={statCardStyle()}>
                    <div style={iconBox('#faf5ff')}>⚠️</div>
                    <div>
                        <p style={{ fontSize: '12px', color: '#6b7280', margin: 0, fontWeight: 500 }}>Pending Dues</p>
                        <p style={{ fontSize: '24px', fontWeight: 800, color: '#6d28d9', margin: '2px 0 0' }}>{loading ? '—' : fmt(stats.pending)}</p>
                    </div>
                </div>
            </div>

            {/* Bottom Row */}
            <div style={{ display: 'flex', gap: '20px' }}>
                {/* Recent Payments Table */}
                <div style={{ flex: 2, background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: 0 }}>Recent Payments</h2>
                        <span onClick={() => navigate('/admin/history')} style={{ fontSize: '12px', color: '#7c3aed', fontWeight: 600, cursor: 'pointer' }}>View All</span>
                    </div>
                    {loading ? (
                        <p style={{ color: '#9ca3af', fontSize: '13px', textAlign: 'center', padding: '24px' }}>Loading...</p>
                    ) : recentPayments.length === 0 ? (
                        <p style={{ color: '#9ca3af', fontSize: '13px', textAlign: 'center', padding: '24px' }}>No payments recorded yet.</p>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                                    {['Payment ID', 'Student Name', 'Date', 'Amount', 'Status'].map(h => (
                                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {recentPayments.map((p) => (
                                    <tr key={p._id} style={{ borderBottom: '1px solid #f9fafb' }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#faf8ff'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                        <td style={{ padding: '10px 12px', fontSize: '13px', color: '#7c3aed', fontWeight: 600 }}>#{p._id?.slice(-6).toUpperCase()}</td>
                                        <td style={{ padding: '10px 12px', fontSize: '13px', color: '#374151', fontWeight: 500 }}>{p.studentId?.user?.name || <span style={{ color: '#9ca3af' }}>Unknown Student</span>}</td>
                                        <td style={{ padding: '10px 12px', fontSize: '13px', color: '#6b7280' }}>{p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('en-IN') : '—'}</td>
                                        <td style={{ padding: '10px 12px', fontSize: '13px', color: '#111827', fontWeight: 600 }}>₹{(p.amountPaid || 0).toLocaleString('en-IN')}</td>
                                        <td style={{ padding: '10px 12px' }}>
                                            <span style={{
                                                display: 'inline-flex', alignItems: 'center', padding: '3px 10px',
                                                borderRadius: '20px', fontSize: '11px', fontWeight: 600,
                                                background: '#d1fae5', color: '#065f46'
                                            }}>Done</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pending Due Sidebar */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div
                        onClick={() => navigate('/admin/reminders')}
                        style={{
                            background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
                            borderRadius: '16px',
                            padding: '20px',
                            boxShadow: '0 10px 24px rgba(91,33,182,0.22)',
                            color: '#ffffff',
                            cursor: 'pointer'
                        }}
                    >
                        <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', margin: 0, opacity: 0.78 }}>
                            Smart Reminders
                        </p>
                        <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '8px 0 8px' }}>Run Fee Reminder Check</h2>
                        <p style={{ fontSize: '13px', lineHeight: 1.5, margin: 0, opacity: 0.92 }}>
                            Open the reminder page to trigger the backend reminder engine and review generated alerts.
                        </p>
                        <div style={{ marginTop: '16px', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.14)', fontSize: '12px', fontWeight: 700 }}>
                            Open Reminder Console
                        </div>
                    </div>

                    <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' }}>
                    <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>Pending Due Reminder</h2>
                    <p style={{ fontSize: '12px', color: '#7c3aed', fontWeight: 600, margin: '0 0 20px' }}>Today</p>

                    {/* Donut Chart Visual */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                        <div style={{ position: 'relative', width: '120px', height: '120px' }}>
                            <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)', width: '120px', height: '120px' }}>
                                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" strokeWidth="3.5" />
                                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#7c3aed" strokeWidth="3.5"
                                    strokeDasharray={stats.totalFees > 0 ? `${(stats.collected / stats.totalFees * 100).toFixed(0)} 100` : '0 100'}
                                    strokeLinecap="round" />
                                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#a78bfa" strokeWidth="3.5"
                                    strokeDasharray={stats.totalFees > 0 ? `${(stats.pending / stats.totalFees * 100).toFixed(0)} 100` : '0 100'}
                                    strokeDashoffset={stats.totalFees > 0 ? -(stats.collected / stats.totalFees * 100) : 0}
                                    strokeLinecap="round" />
                            </svg>
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                                <span style={{ fontSize: '11px', fontWeight: 700, color: '#374151' }}>{stats.totalFees > 0 ? Math.round(stats.collected / stats.totalFees * 100) : 0}%</span>
                                <span style={{ fontSize: '9px', color: '#9ca3af' }}>Collected</span>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#7c3aed' }}></div>
                                <span style={{ fontSize: '12px', color: '#6b7280' }}>Collected</span>
                            </div>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#111827' }}>{fmt(stats.collected)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#a78bfa' }}></div>
                                <span style={{ fontSize: '12px', color: '#6b7280' }}>Pending</span>
                            </div>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#111827' }}>{fmt(stats.pending)}</span>
                        </div>
                    </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
