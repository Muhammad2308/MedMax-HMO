import axios from 'axios';

const apiClient = axios.create({
    baseURL: '/api/v1', // Proxied via Next.js or direct
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('hmo_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (typeof window === 'undefined') return Promise.reject(error);

        if (error.response?.status === 401) {
            localStorage.removeItem('hmo_token');
            localStorage.removeItem('hmo_user');
            window.location.href = '/landing';
        }

        if (error.response?.status === 403) {
            const message: string =
                error.response.data?.message ?? 'You do not have permission to perform this action.';
            window.dispatchEvent(new CustomEvent('hmo:forbidden', { detail: { message } }));
        }

        return Promise.reject(error);
    }
);

export default apiClient;
