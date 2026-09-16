import SiteFooter from "@/components/SiteFooter";

// Le pagine di settore stanno fuori dal gruppo (main), che è l'unico a
// renderizzare il footer: lo aggiungiamo qui, così la landing ha link legali,
// contatti e i rimandi alle altre soluzioni. L'header arriva dal root layout.
export default function SectorLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <SiteFooter />
    </>
  );
}
