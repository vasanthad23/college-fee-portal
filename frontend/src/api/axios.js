import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "https://college-fee-portal.onrender.com/api",
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Check if error is 401 (Unauthorized) and redirect to login if needed
        // For now just reject
        return Promise.reject(error);
    }
);

export default api;
