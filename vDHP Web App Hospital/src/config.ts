// Global configuration for the application
// Configure the backend API URL based on environment

// Check for environment variable first, then use production URL
const getBackendUrl = (): string => {
    // For Vite, environment variables must be prefixed with VITE_
    const envUrl = import.meta.env.VITE_API_BASE_URL;

    if (envUrl) {
        return envUrl;
    }

    // Check if we're in production
    if (import.meta.env.PROD) {
        // Use Railway production URL
        // UPDATE THIS after deployment
        return 'https://your-hospital-backend.railway.app';
    }

    // Default to localhost for development
    return 'http://localhost:8000';
};

// The URL of the backend API
export const API_BASE_URL = getBackendUrl();
export const API_ENDPOINT = `${API_BASE_URL}/api`;

// Helper to get the full API path
export const getApiUrl = (path: string): string => {
    // Remove leading slash if present to avoid double slashes
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return `${API_BASE_URL}/${cleanPath}`;
};

// Export configuration for debugging
export const config = {
    apiBaseUrl: API_BASE_URL,
    apiEndpoint: API_ENDPOINT,
    isProduction: import.meta.env.PROD,
    isDevelopment: import.meta.env.DEV,
};

// Log configuration in development
if (import.meta.env.DEV) {
    console.log('[Config] API Base URL:', API_BASE_URL);
}
