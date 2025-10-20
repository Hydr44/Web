// src/components/dashboard/categories/CategoriesClient.tsx
"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { Plus, Trash2, PencilLine, Check, X } from "lucide-react";

type Category = {
  id: string;
  user_id: string;
  name: string;
  color: string | null;
  created_at: string;
};

export default function CategoriesClient() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);

  // form add
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#0ea5e9"); // default tailwind sky-500
  const [pending, startTransition] = useTransition();

  // editing inline
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("#0ea5e9");

  const fetchAll = async () => {
    setError(null);
    setLoading(true);
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      setError(error.message);
    } else {
      setItems(data as Category[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
    // opzionale: realtime
    const channel = supabase
      .channel("categories-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "categories" },
        () => fetchAll()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setError(null);
    startTransition(async () => {
      // recupera user id per sicurezza
      const { data: sessionData } = await supabase.auth.getUser();
      const user_id = sessionData.user?.id;
      if (!user_id) {
        setError("Sessione non valida.");
        return;
      }

      const { error } = await supabase.from("categories").insert({
        name: newName.trim(),
        color: newColor,
        user_id,
      });

      if (error) setError(error.message);
      setNewName("");
    });
  };

  const startEdit = (c: Category) => {
    setEditingId(c.id);
    setEditName(c.name);
    setEditColor(c.color || "#0ea5e9");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditColor("#0ea5e9");
  };

  const saveEdit = async (id: string) => {
    if (!editName.trim()) return;
    setError(null);

    const { error } = await supabase
      .from("categories")
      .update({ name: editName.trim(), color: editColor })
      .eq("id", id);

    if (error) setError(error.message);
    cancelEdit();
  };

  const onDelete = async (id: string) => {
    setError(null);
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) setError(error.message);
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold">Categorie</h1>
      <p className="mt-2 text-gray-600">
        Definisci le categorie (es. “Soccorso leggero”, “Traino autostrada”, “Deposito”, …). Ogni utente
        vede solo le proprie grazie alle policy RLS.
      </p>

      {/* Add form */}
      <form onSubmit={onAdd} className="mt-6 flex gap-2 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700">Nome categoria</label>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Es. Soccorso leggero"
            className="mt-1 w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Colore</label>
          <input
            type="color"
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            className="mt-1 h-[42px] w-[56px] rounded border"
            title="Colore"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 h-[42px] px-3 rounded-lg bg-primary text-white hover:opacity-90 transition disabled:opacity-60"
        >
          <Plus className="h-4 w-4" />
          Aggiungi
        </button>
      </form>

      {/* List */}
      <div className="mt-6">
        {loading ? (
          <div className="text-sm text-gray-500">Caricamento…</div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-lg border px-4 py-6 text-sm text-gray-600">
            Nessuna categoria ancora. Aggiungine una sopra.
          </div>
        ) : (
          <ul className="divide-y rounded-lg border bg-white">
            {items.map((c) => (
              <li key={c.id} className="flex items-center gap-3 p-3">
                {/* colore */}
                <span
                  className="inline-block h-5 w-5 rounded"
                  style={{ backgroundColor: c.color || "#e5e7eb" }}
                  title={c.color || ""}
                />
                {/* nome / editor */}
                {editingId === c.id ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 rounded-lg border px-3 py-1.5 focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                    <input
                      type="color"
                      value={editColor}
                      onChange={(e) => setEditColor(e.target.value)}
                      className="h-8 w-10 rounded border"
                      title="Colore"
                    />
                  </div>
                ) : (
                  <div className="flex-1">
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-gray-500">
                      Creata il {new Date(c.created_at).toLocaleString()}
                    </div>
                  </div>
                )}

                {/* azioni */}
                {editingId === c.id ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => saveEdit(c.id)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-600 text-white text-xs"
                      type="button"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Salva
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-200 text-gray-800 text-xs"
                      type="button"
                    >
                      <X className="h-3.5 w-3.5" />
                      Annulla
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startEdit(c)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white ring-1 ring-gray-300 text-xs"
                      type="button"
                    >
                      <PencilLine className="h-3.5 w-3.5" />
                      Modifica
                    </button>
                    <button
                      onClick={() => onDelete(c.id)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-50 text-red-700 ring-1 ring-red-200 text-xs"
                      type="button"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Elimina
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
