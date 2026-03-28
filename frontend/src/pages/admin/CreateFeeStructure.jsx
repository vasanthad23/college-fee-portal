import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

export default function CreateFeeStructure() {
    const navigate = useNavigate();
    const [semesters, setSemesters] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        semesterId: '',
        totalAmount: ''
    });

    useEffect(() => {
        const fetchSemesters = async () => {
            try {
                const res = await api.get('/semesters');
                if (res.data.status === 'success') setSemesters(res.data.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchSemesters();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/fee-structures', formData);
            navigate('/admin/fees');
        } catch (err) {
            alert('Failed to create fee structure');
        }
    };

    return (
        <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-md mt-10">
            <h2 className="text-2xl font-bold mb-6">Create Fee Structure</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Semester</label>
                    <select
                        required
                        value={formData.semesterId}
                        onChange={(e) => setFormData({ ...formData, semesterId: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    >
                        <option value="">Select Semester</option>
                        {semesters.map(sem => (
                            <option key={sem._id} value={sem._id}>{sem.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Fee Name</label>
                    <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                        placeholder="e.g. B.Tech Tuition"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Total Amount</label>
                    <input
                        type="number"
                        required
                        value={formData.totalAmount}
                        onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    />
                </div>
                <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700">
                    Create Fee Structure
                </button>
            </form>
        </div>
    );
}
