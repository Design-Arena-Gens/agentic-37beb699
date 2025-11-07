import { useState, type ChangeEvent, type KeyboardEvent } from "react";

interface ChipInputProps {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
}

export function ChipInput({
  label,
  items,
  onChange,
  placeholder
}: ChipInputProps) {
  const [draft, setDraft] = useState("");

  const commitDraft = () => {
    const cleaned = draft.trim();
    if (!cleaned) return;
    if (items.includes(cleaned)) {
      setDraft("");
      return;
    }
    onChange([...items, cleaned]);
    setDraft("");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      commitDraft();
    }

    if (event.key === "Backspace" && !draft && items.length) {
      event.preventDefault();
      onChange(items.slice(0, -1));
    }
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setDraft(event.target.value);
  };

  const removeItem = (index: number) => {
    const next = [...items];
    next.splice(index, 1);
    onChange(next);
  };

  return (
    <div className="input-group">
      <label>{label}</label>
      <div className="chip-list">
        {items.map((item, index) => (
          <span className="chip" key={item}>
            {item}
            <button
              type="button"
              aria-label={`Remove ${item}`}
              onClick={() => removeItem(index)}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="chip-input">
        <input
          value={draft}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? "Add phrase"}
        />
        <button
          type="button"
          className="primary"
          style={{ padding: "10px 18px" }}
          onClick={commitDraft}
        >
          Add
        </button>
      </div>
    </div>
  );
}
