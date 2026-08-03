import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    const disallow = [
        "/dashboard/",
        "/api/",
        "/login",
        "/logout",
        "/register",
        "/reset",
        "/set-password",
        "/update-password",
        "/accept-invite",
        "/activate",
        "/auth/",
        "/maintenance",
        "/no-access",
        "/onboarding",
        "/demo-login",
        "/staff/",
    ];
    return {
        rules: [
            { userAgent: "*", allow: "/", disallow },
            // Bot AI generativi: esclusi dallo scraping per addestramento
            {
                userAgent: ["GPTBot", "CCBot", "anthropic-ai", "ClaudeBot", "Google-Extended"],
                disallow: "/",
            },
        ],
        sitemap: "https://rescuemanager.eu/sitemap.xml",
        host: "https://rescuemanager.eu",
    };
}
