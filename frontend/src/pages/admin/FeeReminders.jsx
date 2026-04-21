import { useState } from 'react';
import { BellRing, Clock3, LoaderCircle, RefreshCw, TriangleAlert } from 'lucide-react';
import api from '../../api/axios';

const typeStyles = {
    NORMAL: { background: '#eff6ff', color: '#1d4ed8' },
    IMPORTANT: { background: '#fef3c7', color: '#92400e' },
    URGENT: { background: '#fee2e2', color: '#b91c1c' },
    OVERDUE: { background: '#ede9fe', color: '#6d28d9' }
};

export default function FeeReminders() {
    const [loading, setLoading] = useState(false);
    const [demoLoading, setDemoLoading] = useState(false);
    const [error, setError] = useState('');
    const [lastRunAt, setLastRunAt] = useState('');
    const [reminders, setReminders] = useState([]);
    const [demoAccounts, setDemoAccounts] = useState([]);
    const [message, setMessage] = useState('Run the reminder check to see which unpaid fees need attention.');

    const summary = reminders.reduce((counts, reminder) => {
        counts[reminder.reminderType] = (counts[reminder.reminderType] || 0) + 1;
        return counts;
    }, {});

    const handleRunCheck = async () => {
        setLoading(true);
        setError('');

        try {
            const res = await api.post('/reminders/run');
            const payload = res.data?.data || {};

            setReminders(payload.reminders || []);
            setLastRunAt(payload.runAt || new Date().toISOString());
            setMessage(res.data?.message || 'Reminder check completed.');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to run fee reminder check.');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateDemoData = async () => {
        setDemoLoading(true);
        setError('');

        try {
            const res = await api.post('/reminders/demo-data');
            setDemoAccounts(res.data?.data?.accounts || []);
            setMessage(res.data?.message || 'Demo reminder data created.');
            await handleRunCheck();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to generate demo reminder data.');
        } finally {
            setDemoLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', margin: 0 }}>Fee Reminders</h1>
                    <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
                        Run the smart reminder engine manually and review which students should receive notifications.
                    </p>
                </div>

                <button
                    onClick={handleRunCheck}
                    disabled={loading}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '12px 18px',
                        borderRadius: '12px',
                        border: 'none',
                        background: loading ? '#c4b5fd' : '#7c3aed',
                        color: '#ffffff',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: loading ? 'not-allowed' : 'pointer',
                        boxShadow: '0 10px 20px rgba(124,58,237,0.18)'
                    }}
                >
                    {loading ? <LoaderCircle size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <BellRing size={16} />}
                    {loading ? 'Running Check...' : 'Run Fee Reminder Check'}
                </button>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button
                    onClick={handleGenerateDemoData}
                    disabled={demoLoading}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '12px 18px',
                        borderRadius: '12px',
                        border: '1px solid #ddd6fe',
                        background: demoLoading ? '#f5f3ff' : '#ffffff',
                        color: '#6d28d9',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: demoLoading ? 'not-allowed' : 'pointer'
                    }}
                >
                    {demoLoading ? <LoaderCircle size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={16} />}
                    {demoLoading ? 'Preparing Demo Data...' : 'Generate Demo Reminder Data'}
                </button>
            </div>

            <div style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #faf5ff 100%)',
                border: '1px solid #ede9fe',
                borderRadius: '18px',
                padding: '20px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div>
                        <p style={{ fontSize: '11px', color: '#8b5cf6', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
                            Reminder Status
                        </p>
                        <p style={{ fontSize: '16px', color: '#111827', margin: '6px 0 0', fontWeight: 700 }}>{message}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280', fontSize: '12px', fontWeight: 600 }}>
                        <Clock3 size={14} />
                        {lastRunAt ? `Last run: ${new Date(lastRunAt).toLocaleString('en-IN')}` : 'Last run: not yet started'}
                    </div>
                </div>
            </div>

            {error && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: '#fef2f2',
                    color: '#b91c1c',
                    border: '1px solid #fecaca',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    fontSize: '13px',
                    fontWeight: 600
                }}>
                    <TriangleAlert size={16} />
                    {error}
                </div>
            )}

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                {['NORMAL', 'IMPORTANT', 'URGENT', 'OVERDUE'].map((type) => (
                    <div
                        key={type}
                        style={{
                            minWidth: '160px',
                            flex: 1,
                            background: '#ffffff',
                            borderRadius: '16px',
                            border: '1px solid #f0f0f0',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                            padding: '18px'
                        }}
                    >
                        <p style={{ fontSize: '11px', margin: 0, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                            {type}
                        </p>
                        <p style={{ fontSize: '28px', fontWeight: 800, color: '#111827', margin: '6px 0 0' }}>
                            {summary[type] || 0}
                        </p>
                    </div>
                ))}
            </div>

            {demoAccounts.length > 0 && (
                <div style={{ background: '#ffffff', borderRadius: '18px', border: '1px solid #f0f0f0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', padding: '20px' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', margin: 0 }}>Demo Reminder Accounts</h2>
                    <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 18px' }}>
                        These student accounts were prepared to guarantee visible reminder results in the app.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                        {demoAccounts.map((account) => (
                            <div key={account.email} style={{ border: '1px solid #ede9fe', borderRadius: '14px', padding: '16px', background: '#faf5ff' }}>
                                <p style={{ fontSize: '15px', fontWeight: 700, color: '#111827', margin: 0 }}>{account.name}</p>
                                <p style={{ fontSize: '12px', color: '#6b7280', margin: '6px 0 0' }}>{account.email}</p>
                                <p style={{ fontSize: '12px', color: '#6b7280', margin: '6px 0 0' }}>Password: {account.password}</p>
                                <p style={{ fontSize: '12px', color: '#6b7280', margin: '6px 0 0' }}>Roll No: {account.rollNumber}</p>
                                <div style={{ marginTop: '10px', display: 'inline-flex', padding: '4px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 700, ...typeStyles[account.reminderType] }}>
                                    {account.reminderType}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div style={{ background: '#ffffff', borderRadius: '18px', border: '1px solid #f0f0f0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', borderBottom: '1px solid #f3f4f6' }}>
                    <div>
                        <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', margin: 0 }}>Reminder Results</h2>
                        <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0' }}>
                            Each row below mirrors what the backend logs to the console during the reminder run.
                        </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#6b7280', fontWeight: 600 }}>
                        <RefreshCw size={14} />
                        {reminders.length} reminder{reminders.length === 1 ? '' : 's'}
                    </div>
                </div>

                {reminders.length === 0 ? (
                    <div style={{ padding: '48px 24px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
                        No reminder results yet. Run the check to populate this table.
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                                    {['Student', 'Student ID', 'Due Date', 'Days Left', 'Type', 'Message'].map((heading) => (
                                        <th
                                            key={heading}
                                            style={{
                                                padding: '12px 16px',
                                                textAlign: 'left',
                                                fontSize: '11px',
                                                fontWeight: 700,
                                                color: '#9ca3af',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.05em'
                                            }}
                                        >
                                            {heading}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {reminders.map((reminder) => (
                                    <tr key={reminder.installmentId} style={{ borderBottom: '1px solid #f9fafb' }}>
                                        <td style={{ padding: '14px 16px' }}>
                                            <p style={{ fontSize: '13px', fontWeight: 700, color: '#111827', margin: 0 }}>
                                                {reminder.studentName || 'Unknown Student'}
                                            </p>
                                            <p style={{ fontSize: '12px', color: '#6b7280', margin: '2px 0 0' }}>
                                                {reminder.studentEmail || 'No email'}
                                            </p>
                                        </td>
                                        <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: 700, color: '#111827' }}>
                                            {reminder.studentId}
                                        </td>
                                        <td style={{ padding: '14px 16px', fontSize: '13px', color: '#6b7280' }}>
                                            {new Date(reminder.dueDate).toLocaleDateString('en-IN')}
                                        </td>
                                        <td style={{ padding: '14px 16px', fontSize: '13px', color: '#374151', fontWeight: 600 }}>
                                            {reminder.daysLeft}
                                        </td>
                                        <td style={{ padding: '14px 16px' }}>
                                            <span
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    padding: '4px 10px',
                                                    borderRadius: '999px',
                                                    fontSize: '11px',
                                                    fontWeight: 700,
                                                    ...typeStyles[reminder.reminderType]
                                                }}
                                            >
                                                {reminder.reminderType}
                                            </span>
                                        </td>
                                        <td style={{ padding: '14px 16px', fontSize: '13px', color: '#374151' }}>
                                            {reminder.message}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <style>{'@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }'}</style>
        </div>
    );
}
