import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { AlertCircle, CheckCircle, XCircle, Search, Eye, X } from 'lucide-react';

export default function AdminRequests() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [processingId, setProcessingId] = useState(null);

    const fetchRequests = async () => {
        try {
            const res = await api.get('/requests');
            if (res.data.status === 'success') {
                setRequests(res.data.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleUpdateStatus = async (id, status, installmentType = null) => {
        setProcessingId(id);
        try {
            await api.patch(`/requests/${id}`, { status, installmentType });
            fetchRequests();
            if (selectedRequest?._id === id) setSelectedRequest(null);
        } catch (err) {
            alert('Failed to update request');
        } finally {
            setProcessingId(null);
        }
    };

    const filtered = requests.filter(r => 
        r.studentId?.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
                <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', margin: 0 }}>Student Requests</h1>
                <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>Review emergency extensions and installment plan requests.</p>
            </div>

            <div style={{ position: 'relative', maxWidth: '400px' }}>
                <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                    type="text"
                    placeholder="Search by student name or request type..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{
                        width: '100%', paddingLeft: '40px', paddingRight: '16px',
                        paddingTop: '10px', paddingBottom: '10px',
                        border: '1px solid #e5e7eb', borderRadius: '12px',
                        fontSize: '13px', background: '#fff', outline: 'none', color: '#374151',
                    }}
                />
            </div>

            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #f0f0f0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: '#9ca3af' }}>Loading requests...</div>
                ) : filtered.length === 0 ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: '#9ca3af' }}>No requests found.</div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                                {['Student', 'Type', 'Date', 'Status', 'Actions'].map(h => (
                                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(req => (
                                <tr key={req._id} style={{ borderBottom: '1px solid #f9fafb' }}>
                                    <td style={{ padding: '14px 16px' }}>
                                        <p style={{ fontSize: '13px', fontWeight: 600, color: '#111827', margin: 0 }}>{req.studentId?.user?.name}</p>
                                        <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>{req.studentId?.user?.email}</p>
                                    </td>
                                    <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: 600, color: req.type === 'EXTENSION' ? '#eab308' : '#3b82f6' }}>
                                        {req.type.replace('_', ' ')}
                                    </td>
                                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#6b7280' }}>
                                        {new Date(req.createdAt).toLocaleDateString('en-IN')}
                                    </td>
                                    <td style={{ padding: '14px 16px' }}>
                                        <span style={{
                                            padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
                                            background: req.status === 'APPROVED' ? '#d1fae5' : req.status === 'REJECTED' ? '#fee2e2' : '#fef3c7',
                                            color: req.status === 'APPROVED' ? '#065f46' : req.status === 'REJECTED' ? '#991b1b' : '#92400e',
                                        }}>
                                            {req.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '14px 16px' }}>
                                        <button
                                            onClick={() => setSelectedRequest(req)}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px',
                                                background: '#f3f4f6', border: 'none', borderRadius: '8px',
                                                fontSize: '12px', fontWeight: 600, color: '#374151', cursor: 'pointer'
                                            }}
                                        >
                                            <Eye size={14} /> View Details
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Request Details Modal */}
            {selectedRequest && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
                    <div style={{ background: '#fff', width: '100%', maxWidth: '500px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                        <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Review Request</h3>
                            <button onClick={() => setSelectedRequest(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                                <X size={20} />
                            </button>
                        </div>
                        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 4px' }}>Student</p>
                                    <p style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>{selectedRequest.studentId?.user?.name}</p>
                                </div>
                                <div>
                                    <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 4px' }}>Type</p>
                                    <p style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>{selectedRequest.type}</p>
                                </div>
                            </div>

                            {selectedRequest.type === 'EXTENSION' ? (
                                <div>
                                    <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 8px' }}>Emergency Reason Letter</p>
                                    <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', color: '#374151', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                                        {selectedRequest.reason || 'No reason provided.'}
                                    </div>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>Provided Documents</p>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                                        <span style={{ fontSize: '14px', fontWeight: 500 }}>Income Certificate</span>
                                        <a href={selectedRequest.incomeCertificateUrl} target="_blank" rel="noreferrer" style={{ fontSize: '13px', color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>View Link</a>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                                        <span style={{ fontSize: '14px', fontWeight: 500 }}>Current UG CGPA</span>
                                        <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{selectedRequest.previousMarksUrl}</span>
                                    </div>
                                </div>
                            )}

                            {selectedRequest.status === 'PENDING' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                                    {selectedRequest.type === 'INSTALLMENT' ? (
                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            <button
                                                onClick={() => handleUpdateStatus(selectedRequest._id, 'APPROVED', '2-Part')}
                                                disabled={processingId === selectedRequest._id}
                                                style={{ flex: 1, padding: '12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', fontSize: '13px' }}
                                            >
                                                <CheckCircle size={18} /> Approve (2-Part)
                                            </button>
                                            <button
                                                onClick={() => handleUpdateStatus(selectedRequest._id, 'APPROVED', '3-Part')}
                                                disabled={processingId === selectedRequest._id}
                                                style={{ flex: 1, padding: '12px', background: '#059669', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', fontSize: '13px' }}
                                            >
                                                <CheckCircle size={18} /> Approve (3-Part)
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleUpdateStatus(selectedRequest._id, 'APPROVED')}
                                            disabled={processingId === selectedRequest._id}
                                            style={{ width: '100%', padding: '12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                                        >
                                            <CheckCircle size={18} /> Approve Request
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleUpdateStatus(selectedRequest._id, 'REJECTED')}
                                        disabled={processingId === selectedRequest._id}
                                        style={{ width: '100%', padding: '12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                                    >
                                        <XCircle size={18} /> Reject Request
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
