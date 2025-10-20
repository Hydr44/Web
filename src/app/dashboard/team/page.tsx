export default function TeamPage() {
  const members = [
    { name: "Mario Rossi", role: "Admin" },
    { name: "Giulia Bianchi", role: "Dispatcher" },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Team & ruoli</h1>
        <p className="mt-2 text-gray-600">Invita collaboratori e assegna i permessi.</p>
      </header>

      <div className="p-4 rounded-xl border">
        <div className="flex justify-between items-center">
          <div className="text-sm font-medium">Membri</div>
          <button className="px-3 py-2 rounded-lg bg-primary text-white text-sm hover:opacity-90">
            Invita utente
          </button>
        </div>

        <ul className="mt-4 divide-y">
          {members.map((m) => (
            <li key={m.name} className="py-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">{m.name}</div>
                <div className="text-xs text-gray-500">{m.role}</div>
              </div>
              <button className="text-sm underline text-primary">Gestisci</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}