import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import PaymentModal from '../../components/PaymentModal';

export default function StudentDashboard() {
    const { user } = useAuth();
    const [studentData, setStudentData] = useState(null);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [profileRes, paymentRes] = await Promise.all([
                api.get('/students/me'),
                api.get('/payments/my-history'),
            ]);

            if (profileRes.data.status === 'success') {
                const student = profileRes.data.data;
                const baseFee = student.feeStructureId?.totalAmount || 0;
                const additionalFeesTotal = (student.additionalFees || []).reduce((sum, f) => sum + f.amount, 0);
                const totalFee = baseFee + additionalFeesTotal;
                
                const paidList = paymentRes.data.data || [];
                const totalPaid = paidList.reduce((sum, p) => sum + p.amountPaid, 0);
                
                // Logic: Any payment specifically for additional fees OR any FULL_FEE payment without 
                // an installment ID counts towards the additional fees first for the notification.
                const paidSpecificallyForAdditional = paidList
                    .filter(p => p.paymentType === 'ADDITIONAL_FEE')
                    .reduce((sum, p) => sum + p.amountPaid, 0);
                
                const paidThroughFull = paidList
                    .filter(p => !p.installmentId && p.paymentType !== 'INSTALLMENT')
                    .reduce((sum, p) => sum + p.amountPaid, 0);
                
                // totalAppliedToAdditional is the max we can credit towards the fines
                const totalAppliedToAdditional = paidSpecificallyForAdditional + (paidThroughFull - paidSpecificallyForAdditional);
                const outstandingAdditional = Math.max(0, additionalFeesTotal - totalAppliedToAdditional);

                const outstanding = totalFee - totalPaid;
                const nextDue = student.installmentPlanId?.installments?.find(i => !paidList.some(p => p.installmentId === i._id));

                setStudentData({
                    ...student,
                    baseFee,
                    additionalFeesTotal,
                    outstandingAdditional,
                    totalFee,
                    paid: totalPaid,
                    outstanding: Math.max(0, outstanding),
                    nextDueDate: nextDue?.dueDate ? new Date(nextDue.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'No Pending Due',
                    nextInstallmentAmount: nextDue ? (totalFee * nextDue.amountPercentage) / 100 : outstanding,
                });
                setPayments(paidList.slice(0, 5));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');

    const totalFee = studentData?.totalFee || 0;
    const paid = studentData?.paid || 0;
    const outstanding = studentData?.outstanding || 0;
    const paidPct = totalFee > 0 ? Math.round(paid / totalFee * 100) : 0;
    const outPct = totalFee > 0 ? Math.round(outstanding / totalFee * 100) : 0;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Greeting */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#111827', margin: 0 }}>
                        Hello, {user?.name?.split(' ')[0] || 'Student'}!
                    </h1>
                    <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
                        Here's a summary of your fees this month.
                    </p>
                </div>
                <button
                    onClick={() => studentData?.outstanding > 0 && setShowPaymentModal(true)}
                    disabled={!studentData || studentData.outstanding <= 0}
                    style={{
                        padding: '10px 22px',
                        background: studentData?.outstanding > 0 ? 'linear-gradient(135deg, #7c3aed, #a78bfa)' : '#e5e7eb',
                        color: studentData?.outstanding > 0 ? '#fff' : '#9ca3af',
                        border: 'none', borderRadius: '12px',
                        fontSize: '13px', fontWeight: 600, cursor: studentData?.outstanding > 0 ? 'pointer' : 'not-allowed',
                        boxShadow: studentData?.outstanding > 0 ? '0 4px 12px rgba(124,58,237,0.3)' : 'none',
                        transition: 'all 0.2s',
                    }}
                >
                    {studentData?.outstanding <= 0 ? '✅ Fully Paid' : '💳 PAY'}
                </button>
            </div>

            {/* Notification Banner for Additional Fees */}
            {studentData?.outstandingAdditional > 0 && (
                <div style={{
                    background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '16px 20px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    boxShadow: '0 2px 4px rgba(220, 38, 38, 0.05)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}>
                            🔔
                        </div>
                        <div>
                            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#991b1b', margin: 0 }}>You have Additional Fees Assigned</h3>
                            <p style={{ fontSize: '12px', color: '#b91c1c', margin: '2px 0 0' }}>
                                ₹{studentData.outstandingAdditional.toLocaleString('en-IN')} remaining of ₹{studentData.additionalFeesTotal.toLocaleString('en-IN')} extra fees/fines added to your account.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Stat Cards */}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                {[
                    { label: 'Total Fees', value: loading ? '—' : fmt(totalFee), icon: '📋', bg: '#eff6ff', color: '#1e3a8a' },
                    { label: 'Due Amount', value: loading ? '—' : fmt(outstanding), icon: '⚠️', bg: '#fef3c7', color: '#92400e' },
                    { label: 'Amount Paid', value: loading ? '—' : fmt(paid), icon: '✅', bg: '#f0fdf4', color: '#14532d' },
                    { label: 'Next Due Date', value: loading ? '—' : studentData?.nextDueDate || '—', icon: '📅', bg: '#faf5ff', color: '#6d28d9' },
                ].map((card) => (
                    <div key={card.label} style={{
                        flex: 1, minWidth: '160px',
                        background: '#fff', borderRadius: '16px',
                        padding: '18px', border: '1px solid #f0f0f0',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                        display: 'flex', flexDirection: 'column', gap: '10px',
                        transition: 'transform 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>{card.icon}</div>
                        <div>
                            <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{card.label}</p>
                            <p style={{ fontSize: '20px', fontWeight: 800, color: card.color, margin: '3px 0 0' }}>{card.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Bottom Row */}
            <div style={{ display: 'flex', gap: '20px' }}>
                {/* Fee Overview (dark card) */}
                <div style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)',
                    borderRadius: '20px', padding: '24px',
                    color: '#fff', position: 'relative', overflow: 'hidden',
                }}>
                    {/* bg decoration */}
                    <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
                    <div style={{ position: 'absolute', bottom: '-20px', left: '-20px', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />

                    <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 20px', position: 'relative' }}>Fee Overview</h2>

                    {/* Donut */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px', position: 'relative' }}>
                        <div style={{ position: 'relative', width: '130px', height: '130px', flexShrink: 0 }}>
                            <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)', width: '130px', height: '130px' }}>
                                <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                                <circle cx="18" cy="18" r="14" fill="none" stroke="#a78bfa" strokeWidth="4"
                                    strokeDasharray={`${paidPct} 100`} strokeLinecap="round" />
                                <circle cx="18" cy="18" r="14" fill="none" stroke="#f59e0b" strokeWidth="4"
                                    strokeDasharray={`${outPct} 100`}
                                    strokeDashoffset={-paidPct}
                                    strokeLinecap="round" />
                            </svg>
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ fontSize: '18px', fontWeight: 800 }}>{fmt(totalFee)}</span>
                                <span style={{ fontSize: '10px', opacity: 0.7 }}>Total</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#a78bfa' }} />
                                    <span style={{ fontSize: '11px', opacity: 0.8 }}>Pending Fees</span>
                                </div>
                                <span style={{ fontSize: '16px', fontWeight: 700 }}>{fmt(outstanding)}</span>
                            </div>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
                                    <span style={{ fontSize: '11px', opacity: 0.8 }}>Payable Fees</span>
                                </div>
                                <span style={{ fontSize: '16px', fontWeight: 700 }}>{fmt(paid)}</span>
                            </div>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#4ade80' }} />
                                    <span style={{ fontSize: '11px', opacity: 0.8 }}>Develop Fees</span>
                                </div>
                                <span style={{ fontSize: '16px', fontWeight: 700 }}>{fmt(totalFee)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Transactions */}
                <div style={{ flex: 1.2, background: '#fff', borderRadius: '20px', padding: '24px', border: '1px solid #f0f0f0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: 0 }}>Recent Transactions</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                            <span style={{ fontSize: '11px', color: '#6b7280' }}>New Transactions</span>
                        </div>
                    </div>

                    {loading ? (
                        <p style={{ color: '#9ca3af', fontSize: '13px', textAlign: 'center', padding: '20px' }}>Loading...</p>
                    ) : payments.length === 0 ? (
                        <p style={{ color: '#9ca3af', fontSize: '13px', textAlign: 'center', padding: '20px' }}>No transactions yet.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {payments.map((p) => (
                                <div key={p._id} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '10px 14px', borderRadius: '10px', background: '#f9fafb',
                                    transition: 'background 0.15s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = '#f3f0ff'}
                                onMouseLeave={e => e.currentTarget.style.background = '#f9fafb'}
                                >
                                    <div>
                                        <p style={{ fontSize: '12px', fontWeight: 600, color: '#374151', margin: 0 }}>#{p._id?.slice(-6).toUpperCase()}</p>
                                        <p style={{ fontSize: '11px', color: '#9ca3af', margin: '2px 0 0' }}>
                                            {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('en-IN') : '—'}
                                        </p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ fontSize: '13px', fontWeight: 700, color: '#111827', margin: 0 }}>₹{(p.amountPaid || 0).toLocaleString('en-IN')}</p>
                                        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', fontWeight: 600, background: '#d1fae5', color: '#065f46' }}>Paid</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {showPaymentModal && (
                <PaymentModal
                    studentId={studentData?._id}
                    amount={studentData?.outstanding}
                    paymentType="FULL_FEE"
                    onClose={() => setShowPaymentModal(false)}
                    onSuccess={() => {
                        fetchDashboardData();
                        setShowPaymentModal(false);
                    }}
                />
            )}
        </div>
    );
}
