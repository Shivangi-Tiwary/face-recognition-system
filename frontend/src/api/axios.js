import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor for Token + FormData fix
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // CRITICAL: When sending FormData (file uploads), the browser must set
    // Content-Type to "multipart/form-data; boundary=..." automatically.
    // If we hardcode "application/json" it will override that and multer
    // on the backend will receive NO files ("No image file provided").
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    return config;
  },
  (error) => Promise.reject(error)
);


// Response Interceptor for Errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle specific errors globally
    if (error.response?.status === 401 && !error.config?._retry) {
      // Maybe handle token expiration here
    }
    return Promise.reject(error);
  }
);

export default api;
