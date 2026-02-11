export default function InvoicesPage() {
  const invoices = [
    { id: "INV-2025-001", date: "2025-09-01", total: "€ 120,00", status: "Pagata" },
    { id: "INV-2025-002", date: "2025-10-01", total: "€ 120,00", status: "In attesa" },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Fatture</h1>
        <p className="mt-2 text-slate-400">Storico fatture e ricevute.</p>
      </header>

      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#141c27] text-slate-400">
            <tr>
              <th className="text-left px-4 py-2">Numero</th>
              <th className="text-left px-4 py-2">Data</th>
              <th className="text-left px-4 py-2">Totale</th>
              <th className="text-left px-4 py-2">Stato</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id} className="border-t">
                <td className="px-4 py-2">{inv.id}</td>
                <td className="px-4 py-2">{inv.date}</td>
                <td className="px-4 py-2">{inv.total}</td>
                <td className="px-4 py-2">{inv.status}</td>
                <td className="px-4 py-2 text-right">
                  <a className="text-primary hover:underline" href="#">
                    Scarica PDF
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}