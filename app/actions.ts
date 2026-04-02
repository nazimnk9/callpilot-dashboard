// "use server";

// import axios from "axios";
// import { headers } from "next/headers";

// export async function getCountryCode() {
//     const headersList = await headers();
//     const vercelCountry = headersList.get("x-vercel-ip-country");

//     if (vercelCountry) {
//         return vercelCountry;
//     }

//     try {
//         // Try primary provider
//         const response = await axios.get("https://ipapi.co/json/");
//         if (response.data && response.data.country_code) {
//             return response.data.country_code;
//         }
//     } catch (error) {
//         console.error("Primary geo-IP service failed, trying fallback...", error);
//     }

//     try {
//         // Fallback provider
//         const response = await axios.get("https://ipwho.is/");
//         if (response.data && response.data.country_code) {
//             return response.data.country_code;
//         }
//     } catch (error) {
//         console.error("All geo-IP services failed:", error);
//     }

//     return null;
// }


"use server";

import axios from "axios";
import { headers } from "next/headers";

export async function getCountryCode() {
    const headersList = await headers();

    // 1️⃣ Vercel header (best & fastest)
    const vercelCountry = headersList.get("x-vercel-ip-country");
    if (vercelCountry) {
        return vercelCountry;
    }

    // 2️⃣ Try to get client IP (for Ubuntu / custom server)
    const forwardedFor = headersList.get("x-forwarded-for");
    const realIP = headersList.get("x-real-ip");

    const ip =
        forwardedFor?.split(",")[0]?.trim() ||
        realIP ||
        null;

    // 3️⃣ If IP exists → use Geo API with IP
    if (ip) {
        try {
            const response = await axios.get(`https://ipapi.co/${ip}/json/`);
            if (response.data?.country_code) {
                return response.data.country_code;
            }
        } catch (error) {
            console.error("IP-based geo lookup failed:", error);
        }
    }

    // 4️⃣ Fallback (no IP)
    try {
        const response = await axios.get("https://ipapi.co/json/");
        if (response.data?.country_code) {
            return response.data.country_code;
        }
    } catch (error) {
        console.error("Primary geo-IP failed:", error);
    }

    // 5️⃣ Final fallback
    try {
        const response = await axios.get("https://ipwho.is/");
        if (response.data?.country_code) {
            return response.data.country_code;
        }
    } catch (error) {
        console.error("All geo-IP services failed:", error);
    }

    return null;
}