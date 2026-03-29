import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { Save, X, AlertCircle } from 'lucide-react';

export default function CreateStudent() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Data States
    const [semesters, setSemesters] = useState([]);
    const [feeStructures, setFeeStructures] = useState([]);
    const [installmentPlans, setInstallmentPlans] = useState([]);

    // Form States
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '', // Should be auto-generated or set by admin
        rollNumber: '',
        semesterId: '',
        feeStructureId: '',
        installmentPlanId: '',
        isInstallmentEnabled: false
    });

    // Fetch Semesters on Mount
    useEffect(() => {
        const fetchSemesters = async () => {
            try {
                const res = await api.get('/semesters');
                if (res.data.status === 'success') {
                    setSemesters(res.data.data);
                }
            } catch (err) {
                setError('Failed to load semesters');
            }
        };
        fetchSemesters();
    }, []);

    // Cascading Logic: Fetch Fee Structures when Semester changes
    useEffect(() => {
        if (!formData.semesterId) {
            setFeeStructures([]);
            return;
        }

        const fetchFees = async () => {
            try {
                // Clear downstream
                setInstallmentPlans([]);
                setFormData(prev => ({
                    ...prev,
                    feeStructureId: '',
                    installmentPlanId: ''
                }));

                const res = await api.get(`/fee-structures?semesterId=${formData.semesterId}`);
                if (res.data.status === 'success') {
                    setFeeStructures(res.data.data);
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchFees();
    }, [formData.semesterId]);

    // Cascading Logic: Fetch Installment Plans when Fee Structure changes
    useEffect(() => {
        if (!formData.feeStructureId) {
            setInstallmentPlans([]);
            return;
        }

        const fetchPlans = async () => {
            try {
                // Clear downstream
                setFormData(prev => ({ ...prev, installmentPlanId: '' }));

                const res = await api.get(`/installment-plans?feeStructureId=${formData.feeStructureId}`);
                if (res.data.status === 'success') {
                    setInstallmentPlans(res.data.data);
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchPlans();
    }, [formData.feeStructureId]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        if (name === 'installmentPlanId') {
            const isEnabled = value !== '' && value !== 'NOT_APPLICABLE' && value !== 'NO';
            setFormData(prev => ({
                ...prev,
                installmentPlanId: value,
                isInstallmentEnabled: isEnabled
            }));
            return;
        }

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Prepare data for submission
        const submitData = { ...formData };
        if (formData.installmentPlanId === 'NOT_APPLICABLE' || formData.installmentPlanId === 'NO' || !formData.installmentPlanId) {
            submitData.installmentPlanId = undefined; // Backend handles null/omitted if disabled
            submitData.isInstallmentEnabled = false;
        } else {
            submitData.isInstallmentEnabled = true;
        }

        try {
            await api.post('/students', submitData);
            navigate('/admin/students');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create student');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center">
                Create New Student
            </h2>

            {error && (
                <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Section 1: Basic Info */}
                <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
                    <h3 className="text-lg font-semibold mb-4 text-gray-700">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Full Name</label>
                            <input
                                type="text"
                                name="name"
                                required
                                value={formData.name}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email</label>
                            <input
                                type="email"
                                name="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Password</label>
                            <input
                                type="password"
                                name="password"
                                required
                                value={formData.password}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Roll Number</label>
                            <input
                                type="text"
                                name="rollNumber"
                                required
                                value={formData.rollNumber}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
                            />
                        </div>
                    </div>
                </div>

                {/* Section 2: Academic & Financial */}
                <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
                    <h3 className="text-lg font-semibold mb-4 text-gray-700">Academic & Financial Assignment</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Semester */}
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700">Semester</label>
                            <select
                                name="semesterId"
                                required
                                value={formData.semesterId}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
                            >
                                <option value="">Select Semester</option>
                                {semesters.map(sem => (
                                    <option key={sem._id} value={sem._id}>{sem.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Fee Structure - Cascading */}
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700">Fee Structure</label>
                            <select
                                name="feeStructureId"
                                required
                                value={formData.feeStructureId}
                                onChange={handleChange}
                                disabled={!formData.semesterId}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border disabled:bg-gray-100 disabled:text-gray-400"
                            >
                                <option value="">Select Fee Structure</option>
                                {feeStructures.map(fs => (
                                    <option key={fs._id} value={fs._id}>{fs.name} - ₹{fs.totalAmount}</option>
                                ))}
                            </select>
                        </div>

                        {/* Installment Plan - Cascading & Conditional */}
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700">Installment Plan</label>
                            <select
                                name="installmentPlanId"
                                required
                                value={formData.installmentPlanId}
                                onChange={handleChange}
                                disabled={!formData.feeStructureId}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border disabled:bg-gray-100 disabled:text-gray-400"
                            >
                                <option value="">Select Installment Plan</option>
                                <option value="NOT_APPLICABLE">Not Applicable</option>
                                <option value="NO">No (Full Payment)</option>
                                
                                {installmentPlans.length > 0 && <option disabled>────────── AVAILABLE PLANS ──────────</option>}
                                
                                {installmentPlans.map(plan => (
                                    <option key={plan._id} value={plan._id}>{plan.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3">
                    <button
                        type="button"
                        onClick={() => navigate('/admin/students')}
                        className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : 'Create Student'}
                    </button>
                </div>
            </form>
        </div>
    );
}
