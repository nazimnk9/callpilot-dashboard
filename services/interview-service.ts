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

    async getCallLogs(page: number = 1) {
        return api.get(`/flows/call_logs/?page=${page}`);
    },

    async getInterviewById(id: number | string) {
        return api.get(`/interview/${id}/`);
    },

    async deleteCallLog(uid: string) {
        return api.delete(`/flows/call_logs/${uid}`);
    },

    async retryInterviews(limit: number) {
        return api.post(`/interview/retry/`, { limit });
    },

    async retrySingleInterview(uid: string) {
        return api.post(`/interview/retry/${uid}`);
    }
};
