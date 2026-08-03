import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
    // Host canonico: apex senza www (coerente con metadataBase e il redirect www->apex)
    const baseUrl = "https://rescuemanager.eu";
    const now = new Date();

    const page = (
        path: string,
        priority: number,
        changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]
    ): MetadataRoute.Sitemap[number] => ({
        url: `${baseUrl}${path}`,
        lastModified: now,
        changeFrequency,
        priority,
    });

    // Pagine prodotto (moduli) — esistono tutte come route e rispondono 200
    const moduli = [
        "trasporti",
        "rvfu",
        "rentri",
        "sdi",
        "ricambi",
        "contabilita",
        "clienti",
        "mezzi-autisti",
        "piazzale",
        "preventivi",
    ].map((m) => page(`/moduli/${m}`, 0.8, "monthly"));

    return [
        page("", 1.0, "weekly"),
        page("/chi-siamo", 0.8, "monthly"),
        page("/contatti", 0.7, "yearly"),
        page("/download", 0.7, "monthly"),
        page("/accessi", 0.6, "monthly"),
        ...moduli,
        // Legali
        page("/privacy-policy", 0.4, "yearly"),
        page("/cookie-policy", 0.4, "yearly"),
        page("/terms-of-use", 0.4, "yearly"),
        page("/dpa", 0.4, "yearly"),
    ];
}
