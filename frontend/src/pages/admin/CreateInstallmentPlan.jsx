import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

export default function CreateInstallmentPlan() {
    const navigate = useNavigate();
    const [feeStructures, setFeeStructures] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        feeStructureId: '',
        totalAmount: '',
        installments: []
    });

    // Fetch all fee structures (or filter by semester if we added that step)
    useEffect(() => {
        const fetchFees = async () => {
            try {
                const res = await api.get('/fee-structures');
                if (res.data.status === 'success') setFeeStructures(res.data.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchFees();
    }, []);

    const handleFeeChange = (e) => {
        const feeId = e.target.value;
        const fee = feeStructures.find(f => f._id === feeId);
        setFormData({
            ...formData,
            feeStructureId: feeId,
            totalAmount: fee ? fee.totalAmount : ''
        });
    };

    const addInstallment = () => {
        setFormData({
            ...formData,
            installments: [
                ...formData.installments,
                { sequence: formData.installments.length + 1, amountPercentage: 0, dueDate: '' }
            ]
        });
    };

    const updateInstallment = (index, field, value) => {
        const newInstallments = [...formData.installments];
        newInstallments[index][field] = value;
        setFormData({ ...formData, installments: newInstallments });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/installment-plans', formData);
            navigate('/admin/fees');
        } catch (err) {
            alert('Failed to create installment plan');
        }
    };

    return (
        <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-md mt-10">
            <h2 className="text-2xl font-bold mb-6">Create Installment Plan</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Fee Structure</label>
                    <select
                        required
                        value={formData.feeStructureId}
                        onChange={handleFeeChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    >
                        <option value="">Select Fee Structure</option>
                        {feeStructures.map(fs => (
                            <option key={fs._id} value={fs._id}>{fs.name} - ₹{fs.totalAmount}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Plan Name</label>
                    <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        placeholder="e.g. 3-Part Payment Plan"
                    />
                </div>

                {/* Installments Wrapper */}
                <div className="border-t border-gray-200 pt-4">
                    <h3 className="text-lg font-medium text-gray-900">Installments</h3>
                    {formData.installments.map((inst, index) => (
                        <div key={index} className="flex space-x-2 mt-2">
                            <input
                                type="number"
                                placeholder="%"
                                className="w-20 border rounded p-1"
                                value={inst.amountPercentage}
                                onChange={(e) => updateInstallment(index, 'amountPercentage', e.target.value)}
                            />
                            <input
                                type="date"
                                className="flex-1 border rounded p-1"
                                value={inst.dueDate}
                                onChange={(e) => updateInstallment(index, 'dueDate', e.target.value)}
                            />
                        </div>
                    ))}
                    <button type="button" onClick={addInstallment} className="mt-2 text-sm text-primary-600 hover:text-primary-800">
                        + Add Installment
                    </button>
                </div>

                <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700">
                    Create Installment Plan
                </button>
            </form>
        </div>
    );
}
