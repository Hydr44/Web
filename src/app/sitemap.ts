import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
    // Usa rescuemanager.eu (senza www) come canonical
    const baseUrl = "https://rescuemanager.eu";

    return [
        // Homepage
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 1.0,
        },
        // Pagine principali
        {
            url: `${baseUrl}/chi-siamo`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.8,
        },
        {
            url: `${baseUrl}/contatti`,
            lastModified: new Date(),
            changeFrequency: "yearly",
            priority: 0.8,
        },
        // NOTA: /demo, /features, /pricing rimossi — non esistono come route.
        // Vanno aggiunti qui SOLO quando viene creata la rispettiva page.tsx,
        // altrimenti Google segnala 404 in Search Console.
        {
            url: `${baseUrl}/download`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.7,
        },
        {
            url: `${baseUrl}/accessi`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.7,
        },
        // Pagine legali
        {
            url: `${baseUrl}/privacy-policy`,
            lastModified: new Date(),
            changeFrequency: "yearly",
            priority: 0.5,
        },
        {
            url: `${baseUrl}/cookie-policy`,
            lastModified: new Date(),
            changeFrequency: "yearly",
            priority: 0.5,
        },
        {
            url: `${baseUrl}/terms-of-use`,
            lastModified: new Date(),
            changeFrequency: "yearly",
            priority: 0.5,
        },
        {
            url: `${baseUrl}/dpa`,
            lastModified: new Date(),
            changeFrequency: "yearly",
            priority: 0.5,
        },
    ];
}
