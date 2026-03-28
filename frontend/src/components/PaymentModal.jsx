import { useState, useRef } from 'react';
import { X, CreditCard, CheckCircle, Smartphone, Building2, ShieldCheck } from 'lucide-react';
import api from '../api/axios';

export default function PaymentModal({ studentId, amount, paymentType, installmentId, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [selectedMethod, setSelectedMethod] = useState('card');
    const [customAmount, setCustomAmount] = useState(amount || 0);

    // PIN State
    const [showPin, setShowPin] = useState(false);
    const [pin, setPin] = useState(['', '', '', '']);
    const [pinError, setPinError] = useState('');
    const pinRefs = [useRef(), useRef(), useRef(), useRef()];
    const audioRef = useRef(new Audio('https://www.myinstants.com/media/sounds/applepay.mp3'));

    // Preload audio and set initial volume
    useState(() => {
        audioRef.current.volume = 1.0;
        audioRef.current.preload = 'auto';
    });

    const handlePinChange = (index, value) => {
        if (value.length > 1) return;
        if (value && !/^\d$/.test(value)) return;

        const newPin = [...pin];
        newPin[index] = value;
        setPin(newPin);
        setPinError('');

        // Auto-focus next input
        if (value && index < 3) {
            pinRefs[index + 1].current?.focus();
        }
    };

    const handlePinKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !pin[index] && index > 0) {
            pinRefs[index - 1].current?.focus();
        }
    };

    const handlePayNowClick = () => {
        if (!customAmount || customAmount <= 0) {
            setError('Please enter a valid amount');
            return;
        }
        if (amount > 0 && customAmount > amount) {
            setError(`Amount cannot exceed the requested balance of ₹${amount.toLocaleString('en-IN')}`);
            return;
        }
        setError('');
        setShowPin(true);
    };

    const handlePinSubmit = async () => {
        const entered = pin.join('');
        if (entered.length < 4) {
            setPinError('Please enter all 4 digits');
            return;
        }

        // Any 4-digit PIN is accepted (showcase only)
        setLoading(true);
        setPinError('');
        await new Promise(resolve => setTimeout(resolve, 1500));
        try {
            const res = await api.post('/payments/pay', {
                amount: Number(customAmount),
                paymentType,
                installmentId,
                paymentMethod: 'ONLINE_MOCK'
            });
            if (res.data.status === 'success') {
                // Play preloaded audio at max volume
                audioRef.current.currentTime = 0;
                audioRef.current.play().catch(e => console.error("Sound play blocked or failed", e));
                
                setSuccess(true);
                setTimeout(() => { onSuccess(); onClose(); }, 2000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Payment failed. Please try again.');
            setShowPin(false);
            setPin(['', '', '', '']);
        } finally {
            setLoading(false);
        }
    };

    const methods = [
        { id: 'card', label: 'Credit / Debit Card', icon: CreditCard },
        { id: 'upi', label: 'UPI Payment', icon: Smartphone },
        { id: 'bank', label: 'Net Banking', icon: Building2 },
    ];

    return (
        <div style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px', zIndex: 9999,
            backdropFilter: 'blur(4px)',
        }}>
            <div style={{
                background: '#fff', borderRadius: '20px',
                width: '100%', maxWidth: '420px',
                boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
                overflow: 'hidden',
                animation: 'slideUp 0.3s ease',
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px 24px',
                    background: 'linear-gradient(135deg, #1e1b4b, #4c1d95)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                    <div>
                        <h3 style={{ color: '#fff', fontSize: '17px', fontWeight: 700, margin: 0 }}>
                            {showPin ? '🔐 Enter Payment PIN' : 'Secure Payment'}
                        </h3>
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', margin: '4px 0 0' }}>
                            {showPin ? 'Enter your 4-digit PIN to confirm' : 'Your payment is protected & encrypted'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}
                    >
                        <X size={16} />
                    </button>
                </div>

                <div style={{ padding: '24px' }}>
                    {success ? (
                        <div style={{ textAlign: 'center', padding: '24px 0' }}>
                            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                <CheckCircle size={40} style={{ color: '#059669' }} />
                            </div>
                            <h4 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', margin: 0 }}>Payment Successful!</h4>
                            <p style={{ color: '#6b7280', marginTop: '8px', fontSize: '14px' }}>Your receipt has been generated.</p>
                        </div>
                    ) : showPin ? (
                        /* PIN Entry Screen */
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                                    <ShieldCheck size={28} style={{ color: '#7c3aed' }} />
                                </div>
                                <p style={{ fontSize: '14px', color: '#374151', margin: 0, fontWeight: 600 }}>
                                    Paying ₹{Number(customAmount).toLocaleString('en-IN')}
                                </p>
                                <p style={{ fontSize: '12px', color: '#9ca3af', margin: '4px 0 0' }}>
                                    Enter any 4-digit PIN to authorize
                                </p>
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                {pin.map((digit, i) => (
                                    <input
                                        key={i}
                                        ref={pinRefs[i]}
                                        type="password"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={e => handlePinChange(i, e.target.value)}
                                        onKeyDown={e => handlePinKeyDown(i, e)}
                                        style={{
                                            width: '52px', height: '58px',
                                            textAlign: 'center', fontSize: '24px', fontWeight: 800,
                                            border: `2px solid ${digit ? '#7c3aed' : '#e5e7eb'}`,
                                            borderRadius: '14px', outline: 'none',
                                            background: digit ? '#faf5ff' : '#fff',
                                            color: '#4c1d95',
                                            transition: 'all 0.2s',
                                        }}
                                        onFocus={e => e.target.style.borderColor = '#7c3aed'}
                                        onBlur={e => { if (!digit) e.target.style.borderColor = '#e5e7eb'; }}
                                    />
                                ))}
                            </div>

                            {pinError && (
                                <p style={{ fontSize: '13px', color: '#dc2626', margin: 0 }}>⚠️ {pinError}</p>
                            )}

                            <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                                <button
                                    onClick={() => { setShowPin(false); setPin(['', '', '', '']); setPinError(''); }}
                                    style={{
                                        flex: 1, padding: '13px',
                                        background: '#f3f4f6', color: '#374151',
                                        border: 'none', borderRadius: '12px',
                                        fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                                    }}
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handlePinSubmit}
                                    disabled={loading}
                                    style={{
                                        flex: 2, padding: '13px',
                                        background: loading ? '#e5e7eb' : 'linear-gradient(135deg, #7c3aed, #a78bfa)',
                                        color: loading ? '#9ca3af' : '#fff',
                                        border: 'none', borderRadius: '12px',
                                        fontSize: '14px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                                        boxShadow: loading ? 'none' : '0 6px 20px rgba(124,58,237,0.35)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    }}
                                >
                                    {loading ? (
                                        <>
                                            <svg style={{ animation: 'spin 1s linear infinite' }} width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                <circle cx="12" cy="12" r="10" stroke="#9ca3af" strokeWidth="3" />
                                                <path d="M12 2a10 10 0 0 1 10 10" stroke="#7c3aed" strokeWidth="3" strokeLinecap="round" />
                                            </svg>
                                            Verifying...
                                        </>
                                    ) : '🔒 Confirm Payment'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {/* Amount Box */}
                            <div style={{
                                padding: '16px 20px', borderRadius: '14px',
                                background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)',
                                border: '1px solid #ddd6fe',
                                display: 'flex', flexDirection: 'column', gap: '8px',
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <p style={{ fontSize: '12px', color: '#7c3aed', fontWeight: 600, margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Amount to Pay</p>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <CreditCard size={16} style={{ color: '#fff' }} />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', background: '#fff', borderRadius: '10px', padding: '8px 12px', border: '1px solid #c4b5fd' }}>
                                    <span style={{ fontSize: '20px', fontWeight: 800, color: '#4c1d95', marginRight: '4px' }}>₹</span>
                                    <input 
                                        type="number" 
                                        value={customAmount} 
                                        onChange={(e) => setCustomAmount(e.target.value)}
                                        style={{ 
                                            width: '100%', border: 'none', outline: 'none', 
                                            fontSize: '24px', fontWeight: 800, color: '#4c1d95',
                                            background: 'transparent'
                                        }}
                                        min="1"
                                        max={amount > 0 ? amount : undefined}
                                    />
                                </div>
                                <p style={{ fontSize: '11px', color: '#6d28d9', margin: 0 }}>
                                    You can pay any partial amount up to ₹{amount?.toLocaleString('en-IN') || 0}.
                                </p>
                            </div>

                            {/* Payment Methods */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <p style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Payment Method</p>
                                {methods.map(({ id, label, icon: Icon }) => (
                                    <label
                                        key={id}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '12px',
                                            padding: '12px 16px', borderRadius: '12px',
                                            border: `2px solid ${selectedMethod === id ? '#7c3aed' : '#f3f4f6'}`,
                                            background: selectedMethod === id ? '#faf5ff' : '#fff',
                                            cursor: 'pointer', transition: 'all 0.15s',
                                        }}
                                    >
                                        <input type="radio" name="method" value={id} checked={selectedMethod === id} onChange={() => setSelectedMethod(id)} style={{ accentColor: '#7c3aed' }} />
                                        <Icon size={18} style={{ color: selectedMethod === id ? '#7c3aed' : '#9ca3af' }} />
                                        <span style={{ fontSize: '13px', fontWeight: 500, color: selectedMethod === id ? '#4c1d95' : '#374151' }}>{label}</span>
                                    </label>
                                ))}
                            </div>

                            {error && (
                                <div style={{ padding: '12px 16px', borderRadius: '10px', background: '#fef2f2', border: '1px solid #fecaca', fontSize: '13px', color: '#dc2626' }}>
                                    ⚠️ {error}
                                </div>
                            )}

                            <button
                                onClick={handlePayNowClick}
                                style={{
                                    width: '100%', padding: '14px',
                                    background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
                                    color: '#fff',
                                    border: 'none', borderRadius: '14px',
                                    fontSize: '15px', fontWeight: 700,
                                    cursor: 'pointer',
                                    boxShadow: '0 6px 20px rgba(124,58,237,0.35)',
                                    transition: 'all 0.2s',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                }}
                            >
                                🔒 Pay Now
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
