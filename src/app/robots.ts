import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: [
                    "/dashboard/",
                    "/api/",
                    "/login",
                    "/logout",
                    "/register",
                    "/reset",
                    "/update-password",
                    "/accept-invite",
                    "/activate",
                    "/auth/",
                    "/maintenance",
                    "/staff/",
                ],
            },
        ],
        sitemap: "https://www.rescuemanager.eu/sitemap.xml",
    };
}
