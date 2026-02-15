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

export const flowService = {
    async getFlows() {
        return api.get("/subscription/features/");
    },

    async subscribeToFeature(featureUid: string) {
        return api.post("/subscription/", {
            plan_feature_uid: featureUid
        });
    },

    async getPricingPlans(featureUid: string) {
        return api.get(`/subscription/plan/${featureUid}/`);
    },

    async getInterviewStatus() {
        return api.get("/interview/status/");
    },

    async getMyPlatforms() {
        return api.get("/organizations/platform/my_platforms");
    },

    async getPhoneNumbers() {
        return api.get("/phone_number/");
    },

    async getPrimaryQuestions() {
        return api.get("/interview/call/config/primary_questions");
    },

    async savePrimaryQuestion(question: string) {
        return api.post("/interview/call/config/primary_questions", { question });
    },

    async getCallConfig() {
        return api.get("/interview/call/config/details");
    },

    async createCallConfig(payload: any) {
        return api.post("/interview/call/config/", payload);
    },

    async updateCallConfig(payload: any) {
        return api.patch("/interview/call/config/details", payload);
    }
};
