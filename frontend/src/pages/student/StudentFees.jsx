import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { CheckCircle, Circle, Clock, CreditCard } from 'lucide-react';
import PaymentModal from '../../components/PaymentModal';

export default function StudentFees() {
    const [student, setStudent] = useState(null);
    const [payments, setPayments] = useState([]);
    
    // Payment Modal State
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedAmount, setSelectedAmount] = useState(0);
    const [selectedInstallment, setSelectedInstallment] = useState(null);

    const fetchData = async () => {
        try {
            const [profileRes, paymentRes] = await Promise.all([
                api.get('/students/me'),
                api.get('/payments/my-history')
            ]);
            console.log("Profile Res:", profileRes.data.data);
            if (profileRes.data.status === 'success') setStudent(profileRes.data.data);
            if (paymentRes.data.status === 'success') setPayments(paymentRes.data.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (!student) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
            <div style={{ textAlign: 'center', color: '#9ca3af' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>⏳</div>
                <p>Loading fee details...</p>
            </div>
        </div>
    );

    const baseFee = student.feeStructureId?.totalAmount || 0;
    const additionalFeesTotal = (student.additionalFees || []).reduce((sum, f) => sum + f.amount, 0);
    const totalFee = baseFee + additionalFeesTotal;

    const installments = student.installmentPlanId?.installments || [];
    
    // A function to check if an installment is fully paid based on the amounts paid towards it.
    const getInstallmentStatus = (inst) => {
        const requiredAmount = (totalFee * inst.amountPercentage) / 100;
        const paidTowardsInst = payments
            .filter(p => p.installmentId === inst._id)
            .reduce((sum, p) => sum + (p.amountPaid || 0), 0);
            
        return {
            isFullyPaid: paidTowardsInst >= requiredAmount,
            amountPaid: paidTowardsInst,
            requiredAmount,
            remaining: Math.max(0, requiredAmount - paidTowardsInst)
        };
    };

    // Calculate outstanding additional fees balance
    const getOutstandingAdditional = () => {
        const totalAddl = (student.additionalFees || []).reduce((sum, f) => sum + f.amount, 0);
        
        const paidSpecificallyForAdditional = payments
            .filter(p => p.paymentType === 'ADDITIONAL_FEE')
            .reduce((sum, p) => sum + p.amountPaid, 0);
        
        const paidThroughFull = payments
            .filter(p => !p.installmentId && p.paymentType !== 'INSTALLMENT')
            .reduce((sum, p) => sum + p.amountPaid, 0);
        
        const appliedFromFull = Math.max(0, paidThroughFull - baseFee);
        const totalAppliedToAdditional = paidSpecificallyForAdditional + appliedFromFull;
        
        return Math.max(0, totalAddl - totalAppliedToAdditional);
    };

    const outstandingAdditionalBalance = getOutstandingAdditional();
    
    // Logic to filter/display fees based on remaining balance
    // Since we don't track payments per specific fee ID, we distribute the balance.
    let remainingPool = outstandingAdditionalBalance;
    const unpaidAdditionalFees = (student.additionalFees || []).map(fee => {
        const amountUnpaid = Math.min(fee.amount, remainingPool);
        remainingPool -= amountUnpaid;
        return { ...fee, unpaidAmount: amountUnpaid };
    }).filter(fee => fee.unpaidAmount > 0);

    const isPaid = (instId) => payments.some(p => p.installmentId === instId);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
                <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', margin: 0 }}>My Fee Structure</h1>
                <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>View your fee structure and installment plan below.</p>
            </div>

            {/* Fee Overview Card */}
            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #f0f0f0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                {/* Header */}
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', margin: 0 }}>{student.feeStructureId?.name}</h2>
                        <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0' }}>Semester: <strong>{student.semesterId?.name}</strong></p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Fee</p>
                        <p style={{ fontSize: '24px', fontWeight: 800, color: '#7c3aed', margin: '2px 0 0' }}>₹{totalFee.toLocaleString('en-IN')}</p>
                    </div>
                </div>

                {/* Summary row */}
                <div style={{ display: 'flex', padding: '16px 24px', background: '#faf9ff', gap: '40px', borderBottom: '1px solid #f3f4f6' }}>
                    <div>
                        <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>PLAN</p>
                        <p style={{ fontSize: '13px', fontWeight: 600, color: '#374151', margin: '3px 0 0' }}>{student.installmentPlanId?.name || 'N/A'}</p>
                    </div>
                    <div>
                        <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>INSTALLMENTS</p>
                        <p style={{ fontSize: '13px', fontWeight: 600, color: '#374151', margin: '3px 0 0' }}>{installments.length} Total</p>
                    </div>
                    <div>
                        <p style={{ fontSize: '11px', color: '#9ca3af', margin: 0 }}>PAID</p>
                        <p style={{ fontSize: '13px', fontWeight: 600, color: '#059669', margin: '3px 0 0' }}>{installments.filter(i => isPaid(i._id)).length} of {installments.length}</p>
                    </div>
                </div>

                {/* Installments */}
                {installments.length > 0 && (
                    <div style={{ padding: '20px 24px' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#374151', margin: '0 0 16px' }}>Installment Schedule</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {installments.map((inst) => {
                                const { isFullyPaid, amountPaid, requiredAmount, remaining } = getInstallmentStatus(inst);
                                
                                return (
                                    <div key={inst._id || inst.sequence} style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '14px 18px', borderRadius: '12px',
                                        background: isFullyPaid ? '#f0fdf4' : '#f9fafb',
                                        border: `1px solid ${isFullyPaid ? '#bbf7d0' : '#f3f4f6'}`,
                                        transition: 'all 0.15s',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            {isFullyPaid
                                                ? <CheckCircle size={20} style={{ color: '#059669', flexShrink: 0 }} />
                                                : <Clock size={20} style={{ color: '#d1d5db', flexShrink: 0 }} />
                                            }
                                            <div>
                                                <p style={{ fontSize: '13px', fontWeight: 600, color: '#374151', margin: 0 }}>
                                                    Installment {inst.sequence}
                                                </p>
                                                <p style={{ fontSize: '11px', color: '#9ca3af', margin: '2px 0 0' }}>
                                                    Due: {new Date(inst.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </p>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '16px' }}>
                                            <div>
                                                <p style={{ fontSize: '15px', fontWeight: 700, color: isFullyPaid ? '#059669' : '#374151', margin: 0 }}>
                                                    ₹{requiredAmount.toLocaleString('en-IN')}
                                                </p>
                                                {!isFullyPaid ? (
                                                    <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 500 }}>
                                                        {amountPaid > 0 ? `₹${amountPaid.toLocaleString('en-IN')} paid` : 'Not paid'}
                                                    </span>
                                                ) : (
                                                    <span style={{
                                                        fontSize: '11px', fontWeight: 600, padding: '2px 10px', borderRadius: '20px',
                                                        background: '#d1fae5', color: '#065f46', display: 'inline-block', marginTop: '4px'
                                                    }}>
                                                        PAID
                                                    </span>
                                                )}
                                            </div>
                                            {!isFullyPaid && (
                                                <button
                                                    onClick={() => {
                                                        setSelectedAmount(remaining);
                                                        setSelectedInstallment(inst._id);
                                                        setShowPaymentModal(true);
                                                    }}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: '6px',
                                                        padding: '8px 14px', borderRadius: '10px',
                                                        border: 'none', cursor: 'pointer',
                                                        background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
                                                        color: '#fff', fontSize: '12px', fontWeight: 600,
                                                        boxShadow: '0 2px 8px rgba(124,58,237,0.25)',
                                                    }}
                                                >
                                                    <CreditCard size={14} /> Pay ₹{remaining.toLocaleString('en-IN')}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Additional Fees List */}
                {student.additionalFees && student.additionalFees.length > 0 && (
                    <div style={{ padding: '20px 24px', borderTop: '1px solid #f3f4f6' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#374151', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fee Details (Fines & Extra Charges)</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {(student.additionalFees || []).map((fee, idx) => {
                                // Calculate unpaid amount for this specific item from the pool
                                const poolBefore = Math.max(0, getOutstandingAdditional());
                                // We need a stable calculation, so we re-calc the pool distribution here
                                let currentPool = getOutstandingAdditional();
                                let itemUnpaid = 0;
                                for (let i = 0; i <= idx; i++) {
                                    const f = student.additionalFees[i];
                                    itemUnpaid = Math.min(f.amount, currentPool);
                                    currentPool -= itemUnpaid;
                                    if (i < idx) itemUnpaid = 0; // we only care about the current index's result
                                }
                                
                                const isPaid = itemUnpaid <= 0;

                                return (
                                    <div key={fee._id} style={{ 
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                                        padding: '14px 20px', background: isPaid ? '#f8fafc' : '#fafafa', borderRadius: '12px', 
                                        border: isPaid ? '1px solid #e2e8f0' : '1px solid #f3f4f6' 
                                    }}>
                                        <div>
                                            <p style={{ fontSize: '10px', color: '#9ca3af', margin: '0 0 2px', fontWeight: 600, textTransform: 'uppercase' }}>Reason / Description</p>
                                            <p style={{ fontSize: '14px', fontWeight: 600, color: isPaid ? '#64748b' : '#111827', margin: 0, textDecoration: isPaid ? 'line-through' : 'none' }}>{fee.name}</p>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                                            <div style={{ textAlign: 'right' }}>
                                                <p style={{ fontSize: '10px', color: '#9ca3af', margin: '0 0 2px', fontWeight: 600, textTransform: 'uppercase' }}>Amount</p>
                                                <p style={{ fontSize: '16px', fontWeight: 700, color: isPaid ? '#94a3b8' : '#111827', margin: 0 }}>
                                                    ₹{fee.amount.toLocaleString('en-IN')}
                                                </p>
                                            </div>
                                            {isPaid && (
                                                <span style={{
                                                    fontSize: '11px', fontWeight: 700, padding: '6px 14px', borderRadius: '20px',
                                                    background: '#e2e8f0', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px'
                                                }}>
                                                    ✅ PAID
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {showPaymentModal && (
                <PaymentModal
                    studentId={student?._id}
                    amount={selectedAmount}
                    paymentType={selectedInstallment ? "INSTALLMENT" : "ADDITIONAL_FEE"}
                    installmentId={selectedInstallment}
                    onClose={() => {
                        setShowPaymentModal(false);
                        setSelectedInstallment(null);
                    }}
                    onSuccess={() => {
                        fetchData();
                        setShowPaymentModal(false);
                    }}
                />
            )}
        </div>
    );
}
