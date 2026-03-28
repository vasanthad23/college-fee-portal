import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { Plus } from 'lucide-react';

export default function ManageFees() {
    const [activeTab, setActiveTab] = useState('semesters');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => { fetchData(); }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const endpoints = { semesters: '/semesters', fees: '/fee-structures', installments: '/installment-plans' };
            const res = await api.get(endpoints[activeTab]);
            if (res.data.status === 'success') setData(res.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'semesters', label: 'Semesters', icon: '📅' },
        { id: 'fees', label: 'Fee Structures', icon: '💰' },
        { id: 'installments', label: 'Installment Plans', icon: '📋' },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', margin: 0 }}>Manage Fees & Academics</h1>
                    <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>Configure semesters, fee structures, and installment plans.</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <Link to="/admin/semesters/new" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 16px', background: '#fff', border: '1px solid #e5e7eb', color: '#374151', textDecoration: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: 600 }}>
                        <Plus size={14} /> Semester
                    </Link>
                    <Link to="/admin/fees/new" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 16px', background: '#fff', border: '1px solid #e5e7eb', color: '#374151', textDecoration: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: 600 }}>
                        <Plus size={14} /> Fee Structure
                    </Link>
                    <Link to="/admin/installments/new" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 16px', background: 'linear-gradient(135deg, #7c3aed, #a78bfa)', color: '#fff', textDecoration: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: 600 }}>
                        <Plus size={14} /> Installment Plan
                    </Link>
                </div>
            </div>

            {/* Pill Tabs */}
            <div style={{ display: 'flex', gap: '8px', background: '#f3f4f6', padding: '5px', borderRadius: '14px', width: 'fit-content' }}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '8px 18px', borderRadius: '10px', border: 'none',
                            fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                            transition: 'all 0.2s',
                            background: activeTab === tab.id ? '#fff' : 'transparent',
                            color: activeTab === tab.id ? '#7c3aed' : '#6b7280',
                            boxShadow: activeTab === tab.id ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                        }}
                    >
                        <span>{tab.icon}</span> {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #f0f0f0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: '#9ca3af' }}>Loading...</div>
                ) : data.length === 0 ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: '#9ca3af' }}>
                        <div style={{ fontSize: '32px', marginBottom: '8px' }}>📂</div>
                        No records found.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {data.map((item, idx) => (
                            <div key={item._id} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '16px 20px',
                                borderBottom: idx < data.length - 1 ? '1px solid #f9fafb' : 'none',
                                transition: 'background 0.15s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#faf8ff'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#faf5ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                                        {activeTab === 'semesters' ? '📅' : activeTab === 'fees' ? '💰' : '📋'}
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: 0 }}>{item.name || item.planName}</p>
                                        <p style={{ fontSize: '12px', color: '#9ca3af', margin: '3px 0 0' }}>
                                            {activeTab === 'semesters' &&
                                                `${new Date(item.startDate).toLocaleDateString('en-IN')} → ${new Date(item.endDate).toLocaleDateString('en-IN')}`}
                                            {activeTab === 'fees' &&
                                                `Total: ₹${Number(item.totalAmount).toLocaleString('en-IN')} · Semester: ${item.semesterId?.name || 'N/A'}`}
                                            {activeTab === 'installments' &&
                                                `Linked to: ${item.feeStructureId?.name || 'N/A'}`}
                                        </p>
                                    </div>
                                </div>
                                <span style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                                    padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
                                    background: (item.isArchived || item.isActive === false) ? '#fee2e2' : '#d1fae5',
                                    color: (item.isArchived || item.isActive === false) ? '#991b1b' : '#065f46',
                                }}>
                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: (item.isArchived || item.isActive === false) ? '#ef4444' : '#10b981', display: 'inline-block' }} />
                                    {(item.isArchived || item.isActive === false) ? 'Inactive' : 'Active'}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
