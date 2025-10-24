import SiteFooter from "@/components/SiteFooter";
import CookieBanner from "@/components/CookieBanner";
import SiteHeader from "@/components/SiteHeader";
import ChatwootWidget from "@/components/ChatwootWidget";
import ImagePreloader from "@/components/ImagePreloader";
import { SpeedInsights } from "@vercel/speed-insights/next";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Header sempre visibile */}
      <SiteHeader />

      {/* Contenuto pagina */}
      {children}

      <SiteFooter />
      <CookieBanner />

      {/* Chatwoot web widget (caricato una volta qui) */}
      <ChatwootWidget />
      
      {/* Precaricamento intelligente delle immagini */}
      <ImagePreloader 
        images={[
          "/mockups/dashboard-mockup.jpg",
          "/670shots_so.png"
        ]}
        preloadOnMount={false}
        preloadOnHover={true}
      />
      
      {/* Vercel Speed Insights per monitoraggio performance */}
      <SpeedInsights />
    </>
  );
}
