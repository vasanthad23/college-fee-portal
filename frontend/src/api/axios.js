import axios from 'axios';

const resolveApiBaseUrl = () => {
    const envBaseUrl = import.meta.env.VITE_API_URL?.trim();
    const hasConfiguredEnvBaseUrl = envBaseUrl && !envBaseUrl.includes('your-backend-url');

    if (hasConfiguredEnvBaseUrl) {
        return envBaseUrl;
    }

    if (typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname)) {
        return 'http://localhost:5000/api';
    }

    return 'https://college-fee-portal.onrender.com/api';
};

const api = axios.create({
    baseURL: resolveApiBaseUrl(),
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
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
