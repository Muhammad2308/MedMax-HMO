import axios, { type AxiosResponse } from 'axios';

/**
 * The new `Api\V1\HMO\*` controllers (Enrollee/CodeRequest/Provider/Marketing/Claims,
 * backed by the `ApiResponse` trait) wrap every response as
 * `{ success, message, data, meta }`. The older `hmo/org/*` user/role/permission
 * endpoints do NOT use this envelope (they return ad hoc shapes like
 * `{ users: [...] }`) — do not apply this to those.
 * Use in an api/*.ts module: `apiClient.get(url).then(unwrapEnvelope)`.
 */
export interface Envelope<T = unknown> {
    success: boolean;
    message: string;
    data: T;
    meta: unknown;
}

// Deliberately typed loosely (AxiosResponse<any> in, out) rather than generic —
// the rest of this API layer already treats response payloads as `any`
// (see the `params?: any`/`data: any` signatures throughout src/api/*.ts), and
// a strict generic here breaks TS inference back to `{}` at every call site
// instead of flowing through as `any` the way callers already expect.
export function unwrapEnvelope(response: AxiosResponse<Envelope>): AxiosResponse {
    // AxiosResponse's own type parameter defaults to `any`, so leaving it
    // unparameterized here (rather than writing `<any>` explicitly) gets the
    // same loose downstream typing the rest of this API layer relies on
    // without tripping @typescript-eslint/no-explicit-any.
    return { ...response, data: response.data?.data };
}

// NEXT_PUBLIC_API_BASE_URL points this at a real backend (e.g. your local
// `php artisan serve` at http://127.0.0.1:8000/api/v1). Falling back to the
// relative '/api/v1' only makes sense once an actual proxy/rewrite forwards
// it somewhere — none is configured in next.config.ts today, so without the
// env var every request resolves against the Next.js dev server itself and
// fails with a network error, not against any Laravel backend.
const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1',
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

        // A 401 only means "session expired" when we actually had a session. A 401 from the
        // login/activation calls (no token yet) is just bad credentials — let the form show it.
        if (error.response?.status === 401 && localStorage.getItem('hmo_token')) {
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
