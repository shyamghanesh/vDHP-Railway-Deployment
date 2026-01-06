// Global configuration for the application

// The URL of the backend API
// Use the production URL when deployed, or localhost for local development
export const API_BASE_URL = 'https://doctor-s-side-production.up.railway.app';
export const API_ENDPOINT = `${API_BASE_URL}/api`;

// Helper to get the full API path
export const getApiUrl = (path: string) => {
    // Remove leading slash if present to avoid double slashes
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return `${API_BASE_URL}/${cleanPath}`;
};
