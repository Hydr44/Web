import SiteFooter from "@/components/SiteFooter";
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