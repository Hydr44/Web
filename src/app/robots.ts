import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    // /login e /dashboard NON sono qui apposta: sono esclusi dall'indice con
    // l'header `X-Robots-Tag: noindex, nofollow` (vedi next.config.ts). Se le
    // bloccassimo anche in robots.txt Google non potrebbe leggere quell'header
    // e le URL resterebbero in indice come "bloccate da robots.txt".
    const disallow = [
        "/api/",
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
