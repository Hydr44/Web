export default function Contatti() {
  return (
    <main>
      <section className="mx-auto max-w-2xl px-4 py-16">
        <h1 className="text-3xl font-semibold">Richiedi demo</h1>
        <p className="mt-3 text-gray-600">
          Lascia i tuoi riferimenti: ti contattiamo per una demo personalizzata.
        </p>

        <form className="mt-8 space-y-4">
          <div>
            <label className="text-sm">Nome</label>
            <input className="mt-1 w-full rounded-lg border px-3 py-2" placeholder="Il tuo nome" />
          </div>
          <div>
            <label className="text-sm">Email</label>
            <input type="email" className="mt-1 w-full rounded-lg border px-3 py-2" placeholder="you@example.com" />
          </div>
          <div>
            <label className="text-sm">Messaggio</label>
            <textarea rows={5} className="mt-1 w-full rounded-lg border px-3 py-2" placeholder="Es: flotta, numero mezzi, esigenze…" />
          </div>
          <button className="px-5 py-3 rounded-lg bg-black text-white">Invia</button>
        </form>
      </section>
    </main>
  );
}
