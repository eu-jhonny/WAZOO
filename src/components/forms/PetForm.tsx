import { useState, type FormEvent } from "react";
import type { Pet, PetSize } from "@/types";

interface PetFormProps {
  initial?: Pet;
  onSubmit: (data: Omit<Pet, "id">) => void;
  onCancel?: () => void;
  submitLabel?: string;
}

const sizes: { value: PetSize; label: string }[] = [
  { value: "pequeno", label: "Pequeno" },
  { value: "medio", label: "Médio" },
  { value: "grande", label: "Grande" },
];

export function PetForm({ initial, onSubmit, onCancel, submitLabel = "Salvar pet" }: PetFormProps) {
  const [form, setForm] = useState<Omit<Pet, "id">>({
    name: initial?.name ?? "",
    type: initial?.type ?? "cachorro",
    breed: initial?.breed ?? "",
    size: initial?.size ?? "medio",
    age: initial?.age ?? "Adulto",
    weight: initial?.weight ?? "",
    restrictions: initial?.restrictions ?? "",
    notes: initial?.notes ?? "",
  });

  const set = <K extends keyof Omit<Pet, "id">>(key: K, value: Omit<Pet, "id">[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="label" htmlFor="pet-name">Nome do pet</label>
        <input id="pet-name" required className="input" placeholder="Ex.: Banguela"
          value={form.name} onChange={(e) => set("name", e.target.value)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="pet-type">Tipo</label>
          <select id="pet-type" className="input" value={form.type}
            onChange={(e) => set("type", e.target.value as Pet["type"])}>
            <option value="cachorro">Cachorro</option>
            <option value="gato">Gato</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="pet-breed">Raça</label>
          <input id="pet-breed" className="input" placeholder="Ex.: Border Collie"
            value={form.breed} onChange={(e) => set("breed", e.target.value)} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="pet-size">Porte</label>
          <select id="pet-size" className="input" value={form.size}
            onChange={(e) => set("size", e.target.value as PetSize)}>
            {sizes.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="pet-age">Idade</label>
          <select id="pet-age" className="input" value={form.age}
            onChange={(e) => set("age", e.target.value)}>
            <option>Filhote</option>
            <option>Jovem</option>
            <option>Adulto</option>
            <option>Idoso</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="pet-weight">Peso</label>
          <input id="pet-weight" className="input" placeholder="Ex.: 8 kg"
            value={form.weight} onChange={(e) => set("weight", e.target.value)} />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="pet-restrictions">Restrições alimentares</label>
        <input id="pet-restrictions" className="input" placeholder="Ex.: Sensível a corantes"
          value={form.restrictions} onChange={(e) => set("restrictions", e.target.value)} />
      </div>

      <div>
        <label className="label" htmlFor="pet-notes">Observações</label>
        <textarea id="pet-notes" className="input" placeholder="Ex.: Gosta de brinquedos mordedores."
          value={form.notes} onChange={(e) => set("notes", e.target.value)} />
      </div>

      <div className="flex gap-3 pt-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-ghost flex-1">
            Cancelar
          </button>
        )}
        <button type="submit" className="btn-primary flex-1">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
