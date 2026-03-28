import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { AlertCircle, FileText, Send, Paperclip } from 'lucide-react';

export default function StudentRequests() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Form State
    const [type, setType] = useState('EXTENSION');
    const [reason, setReason] = useState('');
    const [incomeUrl, setIncomeUrl] = useState('');
    const [marksUrl, setMarksUrl] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [hasPayments, setHasPayments] = useState(false);
    const [checkingPayments, setCheckingPayments] = useState(true);

    const fetchRequests = async () => {
        try {
            const res = await api.get('/requests/me');
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
        checkPaymentStatus();
    }, []);

    const checkPaymentStatus = async () => {
        try {
            const res = await api.get('/payments/my-history');
            if (res.data.status === 'success') {
                setHasPayments(res.data.data.length > 0);
            }
        } catch (err) {
            console.error('Failed to check payments', err);
        } finally {
            setCheckingPayments(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        if (type === 'EXTENSION' && !reason.trim()) {
            return setError('Please provide a valid reason for the extension.');
        }
        if (type === 'INSTALLMENT' && (!incomeUrl.trim() || !marksUrl.trim())) {
            return setError('Please provide links to both documents.');
        }

        setSubmitting(true);
        try {
            await api.post('/requests', {
                type,
                reason: type === 'EXTENSION' ? reason : undefined,
                incomeCertificateUrl: type === 'INSTALLMENT' ? incomeUrl : undefined,
                previousMarksUrl: type === 'INSTALLMENT' ? marksUrl : undefined,
            });
            
            // Reset form
            setReason('');
            setIncomeUrl('');
            setMarksUrl('');
            fetchRequests();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit request');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div>
                <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', margin: 0 }}>Fee Assistance Requests</h1>
                <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>Submit and track your requests for fee extensions and installment plans.</p>
            </div>

            <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
                {/* Form Section */}
                <div style={{ flex: 1, background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #f0f0f0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText size={18} color="#7c3aed" /> New Request
                    </h2>
                    
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <label style={{
                                flex: 1, padding: '16px', border: `2px solid ${type === 'EXTENSION' ? '#7c3aed' : '#e5e7eb'}`,
                                borderRadius: '12px', background: type === 'EXTENSION' ? '#faf5ff' : '#fff',
                                cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', gap: '4px'
                            }}>
                                <input type="radio" name="reqType" checked={type === 'EXTENSION'} onChange={() => setType('EXTENSION')} style={{ display: 'none' }} />
                                <span style={{ fontSize: '14px', fontWeight: 600, color: type === 'EXTENSION' ? '#4c1d95' : '#374151' }}>Emergency Extension</span>
                                <span style={{ fontSize: '12px', color: '#6b7280' }}>Request more time to pay.</span>
                            </label>
                            
                            <label style={{
                                flex: 1, padding: '16px', border: `2px solid ${type === 'INSTALLMENT' ? '#7c3aed' : '#e5e7eb'}`,
                                borderRadius: '12px', background: type === 'INSTALLMENT' ? '#faf5ff' : '#fff',
                                cursor: hasPayments ? 'not-allowed' : 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', gap: '4px',
                                opacity: hasPayments ? 0.6 : 1
                            }}>
                                <input 
                                    type="radio" 
                                    name="reqType" 
                                    checked={type === 'INSTALLMENT'} 
                                    onChange={() => !hasPayments && setType('INSTALLMENT')} 
                                    disabled={hasPayments}
                                    style={{ display: 'none' }} 
                                />
                                <span style={{ fontSize: '14px', fontWeight: 600, color: type === 'INSTALLMENT' ? '#4c1d95' : '#374151' }}>Installment Plan</span>
                                <span style={{ fontSize: '12px', color: '#6b7280' }}>
                                    {hasPayments ? 'Unavailable after payment' : 'Request to split payments.'}
                                </span>
                            </label>
                        </div>

                        {hasPayments && type === 'EXTENSION' && (
                            <div style={{ padding: '12px', background: '#fffbeb', borderRadius: '10px', border: '1px solid #fef3c7', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <AlertCircle size={16} color="#d97706" />
                                <p style={{ fontSize: '12px', color: '#92400e', margin: 0 }}>
                                    Note: You can only request extensions now. Installment requests are locked because you have already made payments.
                                </p>
                            </div>
                        )}

                        {type === 'EXTENSION' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>Reason & Requested Extension Duration</label>
                                <textarea
                                    value={reason}
                                    onChange={e => setReason(e.target.value)}
                                    placeholder="Explain your situation and how much time you need (e.g., '14 days because...')"
                                    rows={5}
                                    style={{ padding: '12px 14px', borderRadius: '10px', border: '1px solid #d1d5db', fontSize: '14px', outline: 'none', resize: 'vertical' }}
                                />
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ padding: '12px', background: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                    <AlertCircle size={16} color="#3b82f6" style={{ marginTop: '2px', flexShrink: 0 }} />
                                    <p style={{ fontSize: '12px', color: '#1e3a8a', margin: 0 }}>Please upload your documents to Google Drive or DropBox and share the public links below.</p>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: '6px' }}><Paperclip size={14} /> Income Certificate URL</label>
                                    <input
                                        type="url"
                                        value={incomeUrl}
                                        onChange={e => setIncomeUrl(e.target.value)}
                                        placeholder="https://drive.google.com/..."
                                        style={{ padding: '12px 14px', borderRadius: '10px', border: '1px solid #d1d5db', fontSize: '14px', outline: 'none' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: '6px' }}><FileText size={14} /> Current UG CGPA</label>
                                    <input
                                        type="text"
                                        value={marksUrl}
                                        onChange={e => setMarksUrl(e.target.value)}
                                        placeholder="e.g. 8.5"
                                        style={{ padding: '12px 14px', borderRadius: '10px', border: '1px solid #d1d5db', fontSize: '14px', outline: 'none' }}
                                    />
                                </div>
                            </div>
                        )}

                        {error && <div style={{ padding: '10px', background: '#fef2f2', color: '#dc2626', fontSize: '13px', borderRadius: '8px' }}>{error}</div>}

                        <button
                            type="submit"
                            disabled={submitting}
                            style={{
                                padding: '14px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '10px',
                                fontSize: '14px', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: submitting ? 0.7 : 1
                            }}
                        >
                            <Send size={16} /> {submitting ? 'Submitting...' : 'Submit Request'}
                        </button>
                    </form>
                </div>

                {/* History Section */}
                <div style={{ flex: 1, background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #f0f0f0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 20px' }}>Your Previous Requests</h2>
                    
                    {loading ? (
                        <p style={{ fontSize: '13px', color: '#6b7280' }}>Loading...</p>
                    ) : requests.length === 0 ? (
                        <div style={{ padding: '32px', textAlign: 'center', background: '#f9fafb', borderRadius: '12px' }}>
                            <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>You haven't submitted any requests yet.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {requests.map(req => (
                                <div key={req._id} style={{ padding: '16px', border: '1px solid #e5e7eb', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{req.type.replace('_', ' ')}</span>
                                        <span style={{
                                            padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
                                            background: req.status === 'APPROVED' ? '#d1fae5' : req.status === 'REJECTED' ? '#fee2e2' : '#fef3c7',
                                            color: req.status === 'APPROVED' ? '#065f46' : req.status === 'REJECTED' ? '#991b1b' : '#92400e',
                                        }}>
                                            {req.status}
                                        </span>
                                    </div>
                                    <span style={{ fontSize: '11px', color: '#9ca3af' }}>Submitted on {new Date(req.createdAt).toLocaleDateString('en-IN')}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
