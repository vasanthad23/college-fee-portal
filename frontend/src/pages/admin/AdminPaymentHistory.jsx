import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Search, CheckCircle, Clock } from 'lucide-react';

export default function AdminPaymentHistory() {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await api.get('/payments/all');
                if (res.data.status === 'success') setPayments(res.data.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    const filtered = payments.filter(p =>
        p.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.studentId?.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.studentId?.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', margin: 0 }}>All Payment History</h1>
                    <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
                        {payments.length} total transaction{payments.length !== 1 ? 's' : ''} recorded
                    </p>
                </div>
            </div>

            {/* Search */}
            <div style={{ position: 'relative', maxWidth: '400px' }}>
                <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                    type="text"
                    placeholder="Search by student name, email, or TXN ID..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{
                        width: '100%', paddingLeft: '40px', paddingRight: '16px',
                        paddingTop: '10px', paddingBottom: '10px',
                        border: '1px solid #e5e7eb', borderRadius: '12px',
                        fontSize: '13px', background: '#fff', outline: 'none', color: '#374151',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    }}
                />
            </div>

            {/* Content */}
            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #f0f0f0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: '#9ca3af' }}>Loading history...</div>
                ) : filtered.length === 0 ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: '#9ca3af' }}>
                        <div style={{ fontSize: '32px', marginBottom: '8px' }}>📭</div>
                        No records found.
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                                {['Student', 'Date', 'Transaction ID', 'Amount', 'Status'].map(h => (
                                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((p) => (
                                <tr key={p._id} style={{ borderBottom: '1px solid #f9fafb' }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#faf8ff'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    <td style={{ padding: '14px 16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{
                                                width: '36px', height: '36px', borderRadius: '50%',
                                                background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: '#fff', fontSize: '13px', fontWeight: 700, flexShrink: 0,
                                            }}>
                                                {(p.studentId?.user?.name || 'S').charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p style={{ fontSize: '13px', fontWeight: 600, color: '#111827', margin: 0 }}>{p.studentId?.user?.name || 'Unknown'}</p>
                                                <p style={{ fontSize: '12px', color: '#9ca3af', margin: '2px 0 0' }}>{p.studentId?.user?.email || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#374151', fontWeight: 500 }}>
                                        {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                                    </td>
                                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#7c3aed', fontWeight: 600 }}>
                                        #{p.transactionId || p._id?.slice(-6).toUpperCase()}
                                    </td>
                                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#111827', fontWeight: 700 }}>
                                        ₹{Number(p.amountPaid || 0).toLocaleString('en-IN')}
                                    </td>
                                    <td style={{ padding: '14px 16px' }}>
                                        {p.status === 'PAID' ? (
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: '#d1fae5', color: '#065f46' }}>
                                                <CheckCircle size={12} /> Paid
                                            </span>
                                        ) : (
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: '#fef3c7', color: '#92400e' }}>
                                                <Clock size={12} /> Pending
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
