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

export const interviewService = {
    async getInterviews(page: number = 1) {
        return api.get(`/interview/?page=${page}`);
    },

    async getInterviewById(id: number | string) {
        return api.get(`/interview/${id}/`);
    }
};
