import axios from "axios";
import { BASE_URL } from "@/lib/baseUrl";
import { cookieUtils } from "@/services/auth-service";

const getAuthToken = () => cookieUtils.get("access");

const api = axios.create({
    baseURL: BASE_URL,
});

api.interceptors.request.use((config) => {
    const token = getAuthToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const profileService = {
    async getProfile() {
        return api.get("/organizations/me");
    },

    async updateProfile(data: any) {
        return api.patch("/organizations/me", data);
    },

    async updatePassword(data: any) {
        return api.post("/token/reset-password", data); // Adjusting based on common patterns, will check if user provided specific one
    }
};
