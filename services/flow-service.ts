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
    }
};
