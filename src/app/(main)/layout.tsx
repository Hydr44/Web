import SiteFooter from "@/components/SiteFooter";
import CookieBanner from "@/components/CookieBanner";
import ChatwootWidget from "@/components/ChatwootWidget";
import ImagePreloader from "@/components/ImagePreloader";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      
      {/* Footer e componenti per pagine principali */}
      <SiteFooter />
      <CookieBanner />
      <ChatwootWidget />
      <ImagePreloader 
        images={[
          "/mockups/dashboard-mockup.jpg",
          "/670shots_so.png"
        ]}
        preloadOnMount={false}
        preloadOnHover={true}
      />
    </>
  );
}