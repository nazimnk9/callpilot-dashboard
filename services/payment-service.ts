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

export const paymentService = {
    async requestCustomSubscription() {
        return api.post("/payment/custom_subscription/request");
    },
    async activatePlatform(paymentMethodId: string) {
        return api.post("/payment/initial", {
            payment_method_id: paymentMethodId
        });
    }
};
