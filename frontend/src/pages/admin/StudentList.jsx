import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { Plus, Search, Eye, X, User, BookOpen, CreditCard, Calendar, Edit3, Save, ChevronDown } from 'lucide-react';

export default function StudentList() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [hasPayments, setHasPayments] = useState(false);
    const [checkingPayments, setCheckingPayments] = useState(false);

    // Edit mode state
    const [isEditing, setIsEditing] = useState(false);
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState('');
    const [editSuccess, setEditSuccess] = useState('');

    // Cascading dropdown data
    const [semesters, setSemesters] = useState([]);
    const [feeStructures, setFeeStructures] = useState([]);
    const [installmentPlans, setInstallmentPlans] = useState([]);

    // Edit form data
    const [editData, setEditData] = useState({
        semesterId: '',
        feeStructureId: '',
        installmentPlanId: '',
        isInstallmentEnabled: false,
    });

    useEffect(() => { fetchStudents(); }, []);

    const fetchStudents = async () => {
        try {
            const res = await api.get('/students');
            if (res.data.status === 'success') setStudents(res.data.data);
        } catch (err) {
            console.error('Failed to fetch students', err);
        } finally {
            setLoading(false);
        }
    };

    // Fetch semesters for dropdown
    const fetchSemesters = async () => {
        try {
            const res = await api.get('/semesters');
            if (res.data.status === 'success') setSemesters(res.data.data);
        } catch (err) {
            console.error(err);
        }
    };

    // Fetch fee structures for selected semester
    const fetchFeeStructures = async (semId) => {
        if (!semId) { setFeeStructures([]); return; }
        try {
            const res = await api.get(`/fee-structures?semesterId=${semId}`);
            if (res.data.status === 'success') setFeeStructures(res.data.data);
        } catch (err) {
            console.error(err);
        }
    };

    // Fetch installment plans for selected fee structure
    const fetchInstallmentPlans = async (feeId) => {
        if (!feeId) { setInstallmentPlans([]); return; }
        try {
            const res = await api.get(`/installment-plans?feeStructureId=${feeId}`);
            if (res.data.status === 'success') setInstallmentPlans(res.data.data);
        } catch (err) {
            console.error(err);
        }
    };

    // Start editing
    const handleStartEdit = async () => {
        setIsEditing(true);
        setEditError('');
        setEditSuccess('');
        setEditData({
            semesterId: selectedStudent.semesterId?._id || '',
            feeStructureId: selectedStudent.feeStructureId?._id || '',
            installmentPlanId: selectedStudent.installmentPlanId?._id || '',
            isInstallmentEnabled: selectedStudent.isInstallmentEnabled || false,
        });
        await fetchSemesters();
        if (selectedStudent.semesterId?._id) {
            await fetchFeeStructures(selectedStudent.semesterId._id);
        }
        if (selectedStudent.feeStructureId?._id) {
            await fetchInstallmentPlans(selectedStudent.feeStructureId._id);
        }
    };

    // Handle semester change (cascade)
    const handleSemesterChange = async (semId) => {
        setEditData(prev => ({ ...prev, semesterId: semId, feeStructureId: '', installmentPlanId: '', isInstallmentEnabled: false }));
        setInstallmentPlans([]);
        await fetchFeeStructures(semId);
    };

    // Handle fee structure change (cascade)
    const handleFeeStructureChange = async (feeId) => {
        setEditData(prev => ({ ...prev, feeStructureId: feeId, installmentPlanId: '', isInstallmentEnabled: false }));
        await fetchInstallmentPlans(feeId);
    };

    // Handle installment plan change
    const handleInstallmentChange = (value) => {
        if (value === '' || value === 'NONE') {
            setEditData(prev => ({ ...prev, installmentPlanId: '', isInstallmentEnabled: false }));
        } else {
            setEditData(prev => ({ ...prev, installmentPlanId: value, isInstallmentEnabled: true }));
        }
    };

    // Save edited fee
    const handleSaveFee = async () => {
        setEditLoading(true);
        setEditError('');
        setEditSuccess('');
        try {
            const res = await api.patch(`/students/${selectedStudent._id}/fee`, {
                semesterId: editData.semesterId,
                feeStructureId: editData.feeStructureId,
                installmentPlanId: editData.isInstallmentEnabled ? editData.installmentPlanId : null,
                isInstallmentEnabled: editData.isInstallmentEnabled,
            });
            if (res.data.status === 'success') {
                setEditSuccess('Fee assignment updated successfully!');
                setSelectedStudent(res.data.data);
                setIsEditing(false);
                // Refresh student list
                fetchStudents();
                setTimeout(() => setEditSuccess(''), 3000);
            }
        } catch (err) {
            setEditError(err.response?.data?.message || 'Failed to update fee assignment');
        } finally {
            setEditLoading(false);
        }
    };

    // New Additional Fee State
    const [newFeeData, setNewFeeData] = useState({ name: '', amount: '' });
    const [feeLoading, setFeeLoading] = useState(false);

    // Handle Add Additional Fee
    const handleAddFee = async () => {
        if (!newFeeData.name || !newFeeData.amount) return;
        setFeeLoading(true);
        setEditError('');
        setEditSuccess('');
        try {
            const res = await api.post(`/students/${selectedStudent._id}/additional-fee`, newFeeData);
            if (res.data.status === 'success') {
                setEditSuccess('Additional fee added successfully!');
                setSelectedStudent(res.data.data);
                setNewFeeData({ name: '', amount: '' });
                fetchStudents();
                setTimeout(() => setEditSuccess(''), 3000);
            }
        } catch (err) {
            setEditError(err.response?.data?.message || 'Failed to add fee');
        } finally {
            setFeeLoading(false);
        }
    };

    // Handle Remove Additional Fee
    const handleRemoveFee = async (feeId) => {
        if (!window.confirm('Are you sure you want to remove this fee?')) return;
        setEditError('');
        setEditSuccess('');
        try {
            const res = await api.delete(`/students/${selectedStudent._id}/additional-fee/${feeId}`);
            if (res.data.status === 'success') {
                setEditSuccess('Additional fee removed.');
                setSelectedStudent(res.data.data);
                fetchStudents();
                setTimeout(() => setEditSuccess(''), 3000);
            }
        } catch (err) {
            setEditError('Failed to remove fee');
        }
    };

    const cancelEdit = () => {
        setIsEditing(false);
        setEditError('');
    };

    const filtered = students.filter(s =>
        s.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectStyle = {
        width: '100%', padding: '10px 12px',
        border: '1px solid #e5e7eb', borderRadius: '10px',
        fontSize: '13px', color: '#374151', background: '#fff',
        outline: 'none', cursor: 'pointer',
        appearance: 'none', WebkitAppearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 12px center',
    };

    // Calculate total including additional fees
    const calcTotalAmount = (student) => {
        let base = student.feeStructureId?.totalAmount || 0;
        let additional = (student.additionalFees || []).reduce((sum, f) => sum + f.amount, 0);
        return base + additional;
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', margin: 0 }}>Manage Students</h1>
                    <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
                        {students.length} total student{students.length !== 1 ? 's' : ''} registered
                    </p>
                </div>
                <Link
                    to="/admin/students/new"
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        padding: '10px 20px',
                        background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
                        color: '#fff', textDecoration: 'none',
                        borderRadius: '12px', fontSize: '13px', fontWeight: 600,
                        boxShadow: '0 4px 12px rgba(124,58,237,0.3)',
                        transition: 'all 0.2s',
                    }}
                >
                    <Plus size={16} />
                    Add Student
                </Link>
            </div>

            {/* Search */}
            <div style={{ position: 'relative', maxWidth: '400px' }}>
                <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                    type="text"
                    placeholder="Search by name or roll number..."
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

            {/* Table */}
            <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #f0f0f0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: '#9ca3af' }}>Loading students...</div>
                ) : filtered.length === 0 ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: '#9ca3af' }}>
                        <div style={{ fontSize: '32px', marginBottom: '8px' }}>👥</div>
                        No students found.
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                                {['#', 'Student', 'Roll Number', 'Semester', 'Fee Structure', 'Action'].map(h => (
                                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((student, idx) => (
                                <tr key={student._id} style={{ borderBottom: '1px solid #f9fafb' }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#faf8ff'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#9ca3af', fontWeight: 500 }}>
                                        {String(idx + 1).padStart(2, '0')}
                                    </td>
                                    <td style={{ padding: '14px 16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{
                                                width: '36px', height: '36px', borderRadius: '50%',
                                                background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: '#fff', fontSize: '13px', fontWeight: 700, flexShrink: 0,
                                            }}>
                                                {student.user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p style={{ fontSize: '13px', fontWeight: 600, color: '#111827', margin: 0 }}>{student.user.name}</p>
                                                <p style={{ fontSize: '12px', color: '#9ca3af', margin: '2px 0 0' }}>{student.user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#374151', fontWeight: 500 }}>
                                        {student.rollNumber}
                                    </td>
                                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#374151' }}>
                                        {student.semesterId?.name || <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Pending</span>}
                                    </td>
                                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#374151' }}>
                                        {student.feeStructureId?.name || <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Not Assigned</span>}
                                    </td>
                                    <td style={{ padding: '14px 16px' }}>
                                        <button 
                                            onClick={async () => {
                                                setSelectedStudent(student);
                                                setIsModalOpen(true);
                                                setIsEditing(false);
                                                setEditError('');
                                                setEditSuccess('');
                                                
                                                // Check for payments
                                                setCheckingPayments(true);
                                                try {
                                                    const pRes = await api.get(`/payments/all?studentId=${student._id}`);
                                                    setHasPayments(pRes.data.results > 0);
                                                } catch (err) {
                                                    console.error('Failed to check payments', err);
                                                } finally {
                                                    setCheckingPayments(false);
                                                }
                                            }}
                                            style={{
                                            display: 'flex', alignItems: 'center', gap: '6px',
                                            padding: '6px 14px', borderRadius: '8px',
                                            border: '1px solid #e5e7eb', background: '#fff',
                                            fontSize: '12px', fontWeight: 500, color: '#7c3aed',
                                            cursor: 'pointer', transition: 'all 0.15s',
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.background = '#faf5ff'; e.currentTarget.style.borderColor = '#a78bfa'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e5e7eb'; }}>
                                            <Eye size={13} /> View
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Student Details Modal */}
            {isModalOpen && selectedStudent && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 50,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(17, 24, 39, 0.4)', backdropFilter: 'blur(4px)',
                    padding: '20px'
                }}>
                    <div style={{
                        width: '100%', maxWidth: '650px', background: '#ffffff',
                        borderRadius: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        overflow: 'hidden', display: 'flex', flexDirection: 'column',
                        maxHeight: '100%'
                    }}>
                        {/* Modal Header */}
                        <div style={{
                            padding: '24px', borderBottom: '1px solid #f3f4f6',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            background: '#fafafa', flexShrink: 0
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{
                                    width: '48px', height: '48px', borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#fff', fontSize: '20px', fontWeight: 700
                                }}>
                                    {selectedStudent.user.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', margin: 0 }}>
                                        {selectedStudent.user.name}
                                    </h2>
                                    <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0' }}>
                                        {selectedStudent.user.email}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => { setIsModalOpen(false); setIsEditing(false); }}
                                style={{
                                    background: '#f3f4f6', border: 'none',
                                    width: '36px', height: '36px', borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#6b7280', cursor: 'pointer', transition: 'all 0.2s'
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = '#e5e7eb'; e.currentTarget.style.color = '#111827'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.color = '#6b7280'; }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {/* Success/Error Messages */}
                            {editSuccess && (
                                <div style={{ padding: '12px 16px', borderRadius: '10px', background: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: '13px', color: '#15803d', fontWeight: 500 }}>
                                    ✅ {editSuccess}
                                </div>
                            )}
                            {editError && (
                                <div style={{ padding: '12px 16px', borderRadius: '10px', background: '#fef2f2', border: '1px solid #fecaca', fontSize: '13px', color: '#dc2626', fontWeight: 500 }}>
                                    ⚠️ {editError}
                                </div>
                            )}

                            {/* Academic Info Group */}
                            <div>
                                <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <BookOpen size={16} /> Academic Details
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '12px', border: '1px solid #f3f4f6' }}>
                                        <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 4px' }}>Roll Number</p>
                                        <p style={{ fontSize: '15px', fontWeight: 600, color: '#111827', margin: 0 }}>{selectedStudent.rollNumber}</p>
                                    </div>
                                    <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '12px', border: '1px solid #f3f4f6' }}>
                                        <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 4px' }}>Semester</p>
                                        <p style={{ fontSize: '15px', fontWeight: 600, color: '#111827', margin: 0 }}>{selectedStudent.semesterId?.name || 'Pending Assignment'}</p>
                                    </div>
                                    <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '12px', border: '1px solid #f3f4f6', gridColumn: 'span 2' }}>
                                        <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 4px' }}>Admission Date</p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Calendar size={16} color="#7c3aed" />
                                            <p style={{ fontSize: '15px', fontWeight: 600, color: '#111827', margin: 0 }}>
                                                {new Date(selectedStudent.admissionDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <hr style={{ border: 'none', borderTop: '1px solid #f3f4f6', margin: 0 }} />

                            {/* Fee Info Group */}
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <CreditCard size={16} /> Base Fee Structure
                                    </h3>
                                    {!isEditing && (
                                        <button
                                            onClick={handleStartEdit}
                                            disabled={hasPayments || checkingPayments}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '6px',
                                                padding: '6px 14px', borderRadius: '8px',
                                                border: (hasPayments || checkingPayments) ? '1px solid #d1d5db' : '1px solid #7c3aed',
                                                background: (hasPayments || checkingPayments) ? '#f3f4f6' : '#faf5ff',
                                                fontSize: '12px', fontWeight: 600, 
                                                color: (hasPayments || checkingPayments) ? '#9ca3af' : '#7c3aed',
                                                cursor: (hasPayments || checkingPayments) ? 'not-allowed' : 'pointer', transition: 'all 0.15s',
                                            }}
                                            onMouseEnter={e => { 
                                                if (!hasPayments && !checkingPayments) {
                                                    e.currentTarget.style.background = '#7c3aed'; e.currentTarget.style.color = '#fff';
                                                }
                                            }}
                                            onMouseLeave={e => { 
                                                if (!hasPayments && !checkingPayments) {
                                                    e.currentTarget.style.background = '#faf5ff'; e.currentTarget.style.color = '#7c3aed';
                                                }
                                            }}
                                        >
                                            <Edit3 size={12} /> {hasPayments ? 'Fees Locked' : 'Edit Base Fee'}
                                        </button>
                                    )}
                                </div>

                                {hasPayments && (
                                    <div style={{ padding: '10px 14px', background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '10px', display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
                                        <AlertCircle size={14} color="#d97706" />
                                        <p style={{ fontSize: '11px', color: '#92400e', margin: 0 }}>
                                            Fee structure cannot be changed because the student has already made payments.
                                        </p>
                                    </div>
                                )}

                                {isEditing ? (
                                    /* Edit Mode - Cascading Dropdowns */
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', background: '#fafafa', padding: '16px', borderRadius: '12px', border: '1px dashed #d1d5db' }}>
                                        {/* Semester */}
                                        <div>
                                            <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px', display: 'block' }}>Semester</label>
                                            <select
                                                value={editData.semesterId}
                                                onChange={e => handleSemesterChange(e.target.value)}
                                                style={selectStyle}
                                            >
                                                <option value="">Select Semester</option>
                                                {semesters.map(s => (
                                                    <option key={s._id} value={s._id}>{s.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Fee Structure */}
                                        <div>
                                            <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px', display: 'block' }}>Fee Structure (Department)</label>
                                            <select
                                                value={editData.feeStructureId}
                                                onChange={e => handleFeeStructureChange(e.target.value)}
                                                disabled={!editData.semesterId}
                                                style={{ ...selectStyle, opacity: !editData.semesterId ? 0.5 : 1 }}
                                            >
                                                <option value="">Select Fee Structure</option>
                                                {feeStructures.map(fs => (
                                                    <option key={fs._id} value={fs._id}>{fs.name} - ₹{Number(fs.totalAmount).toLocaleString('en-IN')}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Installment Plan */}
                                        <div>
                                            <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px', display: 'block' }}>Installment Plan</label>
                                            <select
                                                value={editData.isInstallmentEnabled ? editData.installmentPlanId : 'NONE'}
                                                onChange={e => handleInstallmentChange(e.target.value)}
                                                disabled={!editData.feeStructureId}
                                                style={{ ...selectStyle, opacity: !editData.feeStructureId ? 0.5 : 1 }}
                                            >
                                                <option value="NONE">No Installment (Full Payment)</option>
                                                {installmentPlans.map(p => (
                                                    <option key={p._id} value={p._id}>{p.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Action Buttons */}
                                        <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                                            <button
                                                onClick={cancelEdit}
                                                style={{
                                                    flex: 1, padding: '10px',
                                                    background: '#e5e7eb', color: '#374151',
                                                    border: 'none', borderRadius: '10px',
                                                    fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                                                }}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleSaveFee}
                                                disabled={editLoading || !editData.semesterId || !editData.feeStructureId}
                                                style={{
                                                    flex: 2, padding: '10px',
                                                    background: editLoading ? '#9ca3af' : 'linear-gradient(135deg, #7c3aed, #a78bfa)',
                                                    color: '#fff',
                                                    border: 'none', borderRadius: '10px',
                                                    fontSize: '13px', fontWeight: 700, cursor: editLoading ? 'not-allowed' : 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                                    boxShadow: editLoading ? 'none' : '0 4px 12px rgba(124,58,237,0.3)',
                                                }}
                                            >
                                                <Save size={14} />
                                                {editLoading ? 'Saving...' : 'Save Changes'}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    /* View Mode Base Fee */
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #f3f4f6' }}>
                                            <div>
                                                <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 4px' }}>Assigned Package</p>
                                                <p style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: 0 }}>{selectedStudent.feeStructureId?.name || 'Not Configured'}</p>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 4px' }}>Base Amount</p>
                                                <p style={{ fontSize: '16px', fontWeight: 700, color: '#374151', margin: 0 }}>
                                                    ₹{(selectedStudent.feeStructureId?.totalAmount || 0).toLocaleString('en-IN')}
                                                </p>
                                            </div>
                                        </div>

                                        {selectedStudent.isInstallmentEnabled && selectedStudent.installmentPlanId && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: '#faf5ff', borderRadius: '12px', border: '1px solid #e9d5ff' }}>
                                                <div>
                                                    <p style={{ fontSize: '12px', color: '#7c3aed', margin: '0 0 4px', fontWeight: 600 }}>Active Installment Plan</p>
                                                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#5b21b6', margin: 0 }}>{selectedStudent.installmentPlanId.name}</p>
                                                </div>
                                                <div style={{ padding: '4px 12px', background: '#7c3aed', color: '#fff', borderRadius: '20px', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                                                    Enabled
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <hr style={{ border: 'none', borderTop: '1px solid #f3f4f6', margin: 0 }} />

                            {/* Additional Fees Group */}
                            <div>
                                <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Plus size={16} /> Additional Fees & Fines
                                </h3>

                                {/* List of Additional Fees */}
                                {selectedStudent.additionalFees && selectedStudent.additionalFees.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                                        {selectedStudent.additionalFees.map(fee => (
                                            <div key={fee._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#fff', borderRadius: '10px', border: '1px solid #fecaca', boxShadow: '0 1px 2px rgba(220,38,38,0.05)' }}>
                                                <div>
                                                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#991b1b', margin: 0 }}>{fee.name}</p>
                                                    <p style={{ fontSize: '11px', color: '#dc2626', margin: '2px 0 0' }}>Added on {new Date(fee.addedDate).toLocaleDateString()}</p>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                    <p style={{ fontSize: '15px', fontWeight: 700, color: '#991b1b', margin: 0 }}>
                                                        + ₹{fee.amount.toLocaleString('en-IN')}
                                                    </p>
                                                    <button
                                                        onClick={() => handleRemoveFee(fee._id)}
                                                        style={{ background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '4px' }}
                                                        title="Remove Fee"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: 0, marginBottom: '20px', fontStyle: 'italic' }}>
                                        No additional fees assigned.
                                    </p>
                                )}

                                {/* Add New Fee Form */}
                                <div style={{ background: '#fef2f2', padding: '16px', borderRadius: '12px', border: '1px dashed #fca5a5' }}>
                                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#991b1b', margin: '0 0 12px' }}>+ Add Custom Fee (Fine, Extra, Accommodation, etc.)</p>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <div style={{ flex: 2 }}>
                                            <input
                                                type="text"
                                                placeholder="Fee Name (e.g. Late Fine)"
                                                value={newFeeData.name}
                                                onChange={e => setNewFeeData({ ...newFeeData, name: e.target.value })}
                                                style={{ width: '100%', padding: '10px', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '13px', outline: 'none' }}
                                            />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <input
                                                type="number"
                                                placeholder="Amount (₹)"
                                                value={newFeeData.amount}
                                                onChange={e => setNewFeeData({ ...newFeeData, amount: e.target.value })}
                                                min="0"
                                                style={{ width: '100%', padding: '10px', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '13px', outline: 'none' }}
                                            />
                                        </div>
                                        <button
                                            onClick={handleAddFee}
                                            disabled={feeLoading || !newFeeData.name || !newFeeData.amount}
                                            style={{
                                                padding: '0 16px', background: feeLoading || (!newFeeData.name || !newFeeData.amount) ? '#fca5a5' : '#ef4444',
                                                color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                                                cursor: (feeLoading || (!newFeeData.name || !newFeeData.amount)) ? 'not-allowed' : 'pointer',
                                                transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px'
                                            }}
                                        >
                                            <Plus size={14} /> Add
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Grand Total */}
                            <div style={{ padding: '16px', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                                <span style={{ fontSize: '14px', fontWeight: 600, color: '#166534' }}>Net Payable Total</span>
                                <span style={{ fontSize: '20px', fontWeight: 700, color: '#15803d' }}>
                                    ₹{calcTotalAmount(selectedStudent).toLocaleString('en-IN')}
                                </span>
                            </div>

                        </div>

                        {/* Modal Footer */}
                        <div style={{ padding: '20px 24px', background: '#f9fafb', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
                            <button
                                onClick={() => { setIsModalOpen(false); setIsEditing(false); }}
                                style={{
                                    padding: '10px 20px', background: '#111827', color: '#fff',
                                    border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 500,
                                    cursor: 'pointer', transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#374151'}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#111827'}
                            >
                                Close Details
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
