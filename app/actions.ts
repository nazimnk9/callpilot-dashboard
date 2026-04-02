"use server";

import axios from "axios";
import { headers } from "next/headers";
import geoip from "geoip-lite";

export async function getCountryCode() {
    const headersList = await headers();
    const vercelCountry = headersList.get("x-vercel-ip-country");

    if (vercelCountry) {
        return vercelCountry;
    }

    // Try geoip-lite for local environments (e.g. self-hosted Ubuntu server)
    try {
        const forwardedFor = headersList.get("x-forwarded-for");
        const userIp = forwardedFor ? forwardedFor.split(',')[0].trim() : "";

        if (userIp && userIp !== "127.0.0.1" && userIp !== "::1") {
            const lookup = geoip.lookup(userIp);
            if (lookup && lookup.country) {
                return lookup.country;
            }
        }
    } catch (error) {
        console.error("GeoIP-lite lookup failed:", error);
    }

    try {
        // Fallback to primary provider (ipapi.co)
        const response = await axios.get("https://ipapi.co/json/");
        if (response.data && response.data.country_code) {
            return response.data.country_code;
        }
    } catch (error) {
        console.error("Primary geo-IP service failed, trying fallback...", error);
    }

    try {
        // Final fallback provider (ipwho.is)
        const response = await axios.get("https://ipwho.is/");
        if (response.data && response.data.country_code) {
            return response.data.country_code;
        }
    } catch (error) {
        console.error("All geo-IP services failed:", error);
    }

    return null;
}
