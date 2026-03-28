import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { FileText, Download, CheckCircle, Clock } from 'lucide-react';
import jsPDF from 'jspdf';

export default function StudentPaymentHistory() {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await api.get('/payments/my-history');
                if (res.data.status === 'success') setPayments(res.data.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    const handleDownloadReceipt = (payment) => {
        const doc = new jsPDF();
        
        doc.setFontSize(22);
        doc.setTextColor(124, 58, 237); // #7c3aed
        doc.text('College Fee Receipt', 105, 20, { align: 'center' });
        
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text('Secure College Payment Portal', 105, 30, { align: 'center' });
        
        doc.setLineWidth(0.5);
        doc.setDrawColor(200, 200, 200);
        doc.line(20, 35, 190, 35);
        
        doc.setFontSize(12);
        doc.setTextColor(20, 20, 20);
        doc.text('Payment Details:', 20, 50);
        
        doc.setFontSize(11);
        doc.setTextColor(80, 80, 80);
        doc.text(`Transaction ID: #${payment.transactionId || payment._id?.slice(-6).toUpperCase()}`, 30, 60);
        doc.text(`Date: ${payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString('en-IN') : 'N/A'}`, 30, 70);
        doc.text(`Status: ${payment.status}`, 30, 80);
        doc.text(`Method: ${payment.method || 'Online'}`, 30, 90);
        
        doc.setFontSize(16);
        doc.setTextColor(5, 150, 105);
        doc.text(`Amount Paid: INR ${Number(payment.amountPaid || 0).toLocaleString('en-IN')}`, 30, 110);
        
        doc.setLineWidth(0.5);
        doc.setDrawColor(220, 220, 220);
        doc.line(20, 130, 190, 130);
        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.text('This is an auto-generated receipt. Thank you for your payment.', 105, 140, { align: 'center' });
        
        doc.save(`Receipt-${payment.transactionId || payment._id?.slice(-6)}.pdf`);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Header */}
            <div>
                <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', margin: 0 }}>Payment History</h1>
                <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>View all your past transactions and download receipts.</p>
            </div>

            {/* Content */}
            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #f0f0f0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: '#9ca3af' }}>Loading history...</div>
                ) : payments.length === 0 ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: '#9ca3af' }}>
                        <div style={{ fontSize: '32px', marginBottom: '8px' }}>📭</div>
                        No payment history found.
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                                {['Date', 'Transaction ID', 'Amount', 'Status', 'Receipt'].map(h => (
                                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map((p) => (
                                <tr key={p._id} style={{ borderBottom: '1px solid #f9fafb' }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#faf8ff'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
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
                                    <td style={{ padding: '14px 16px' }}>
                                        <button
                                            onClick={() => handleDownloadReceipt(p)}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '6px',
                                                padding: '6px 14px', borderRadius: '8px',
                                                border: '1px solid #e5e7eb', background: '#fff',
                                                fontSize: '12px', fontWeight: 500, color: '#374151',
                                                cursor: 'pointer', transition: 'all 0.15s',
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.background = '#f3f4f6'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
                                        >
                                            <Download size={13} /> Receipt
                                        </button>
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
