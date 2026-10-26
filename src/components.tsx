import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ArrowRight, Check, Search, X } from "lucide-react";
import {
  byId,
  findPokemon,
  REGIONS,
  searchPokemon,
  type Category,
  type Pokemon,
} from "./game";
import { TYPE_LABELS, useText } from "./context";

export function Pokeball({ className = "" }: { className?: string }) {
  return (
    <span aria-hidden="true" className={`pokeball ${className}`}>
      <i />
    </span>
  );
}
export function Sprite({
  id,
  name = "",
  className = "",
}: {
  id: number;
  name?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <span className={`sprite-fallback ${className}`} aria-label={name}>
      ?
    </span>
  ) : (
    <img
      className={`sprite ${className}`}
      src={`/sprites/${id}.png`}
      alt={name}
      onError={() => setFailed(true)}
    />
  );
}
export function TypeBadge({ category }: { category: Category }) {
  const t = useText();
  return (
    <span
      className={`type-badge ${category.kind === "type" ? `type-${category.value}` : "type-gen"}`}
    >
      {category.kind === "gen" ? (
        <>
          {REGIONS[category.value - 1]}
          <small>Gen {category.value}</small>
        </>
      ) : (
        t(
          TYPE_LABELS[category.value] ?? category.value,
          category.value.charAt(0).toUpperCase() + category.value.slice(1),
        )
      )}
    </span>
  );
}
export function categoryName(
  cat: Category,
  t: (it: string, en: string) => string,
) {
  return cat.kind === "gen"
    ? REGIONS[cat.value - 1]
    : t(TYPE_LABELS[cat.value] ?? cat.value, cat.value);
}
export function Dialog({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const el = ref.current;
    el?.showModal();
    return () => el?.close();
  }, []);
  const t = useText();
  return (
    <dialog
      ref={ref}
      className={`dialog ${wide ? "dialog-wide" : ""}`}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) {
          const rect = ref.current.getBoundingClientRect();
          if (
            e.clientX < rect.left ||
            e.clientX > rect.right ||
            e.clientY < rect.top ||
            e.clientY > rect.bottom
          )
            onClose();
        }
      }}
    >
      <div className="dialog-heading">
        <h2 id={titleId}>{title}</h2>
        <button
          className="icon-button"
          aria-label={t("Chiudi", "Close")}
          onClick={onClose}
        >
          <X size={22} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function PokemonSearch({
  pool,
  onGuess,
  disabled = false,
  label,
  allowPass = false,
  onPass,
}: {
  pool: Pokemon[];
  onGuess: (id: number) => void;
  disabled?: boolean;
  label: string;
  allowPass?: boolean;
  onPass?: () => void;
}) {
  const t = useText();
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(true);
  const [active, setActive] = useState(-1);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();
  const matches = searchPokemon(value, pool);
  const visible =
    open && value.length > 0 && !disabled && !findPokemon(value, pool);
  const choose = (p: Pokemon) => {
    setValue(p.name);
    setOpen(false);
    setActive(-1);
    setError("");
    inputRef.current?.focus();
  };
  const submit = () => {
    if (disabled) return;
    const p = findPokemon(value, pool);
    if (!p) {
      setError(
        t(
          "Scegli un Pokémon delle generazioni selezionate.",
          "Choose a Pokémon from the selected generations.",
        ),
      );
      return;
    }
    setOpen(false);
    setError("");
    onGuess(p.id);
  };
  useEffect(() => {
    if (!disabled && window.matchMedia("(min-width: 700px)").matches)
      inputRef.current?.focus();
  }, [disabled]);
  return (
    <form
      className="guess-form"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <label htmlFor={id}>{label}</label>
      <div className="search-field">
        <Search size={20} aria-hidden="true" />
        <input
          id={id}
          ref={inputRef}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={visible}
          aria-controls={visible ? `${id}-list` : undefined}
          aria-activedescendant={
            visible && active >= 0 && matches[active]
              ? `${id}-option-${active}`
              : undefined
          }
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          value={value}
          disabled={disabled}
          placeholder={t("Cerca un Pokémon...", "Search for a Pokémon...")}
          onChange={(e) => {
            setValue(e.target.value);
            setActive(-1);
            setOpen(true);
            setError("");
          }}
          onFocus={() => setOpen(true)}
          onBlur={(event) => {
            if (!event.currentTarget.form?.contains(event.relatedTarget))
              setOpen(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
              e.preventDefault();
              setOpen(true);
              setActive((i) =>
                Math.max(
                  0,
                  Math.min(
                    matches.length - 1,
                    i + (e.key === "ArrowDown" ? 1 : -1),
                  ),
                ),
              );
            }
            if (e.key === "Escape") {
              e.preventDefault();
              e.stopPropagation();
              setOpen(false);
            }
            if (
              e.key === "Enter" &&
              visible &&
              active >= 0 &&
              matches[active]
            ) {
              e.preventDefault();
              choose(matches[active]);
            }
          }}
        />
      </div>
      <div className="suggestion-space">
        {visible && (
          <ul
            id={`${id}-list`}
            className="suggestions"
            role="listbox"
            aria-label={t("Pokémon suggeriti", "Suggested Pokémon")}
          >
            {matches.length ? (
              matches.map((p, i) => (
                <li
                  key={p.id}
                  id={`${id}-option-${i}`}
                  role="option"
                  aria-selected={active === i}
                  onPointerDown={(e) => e.preventDefault()}
                  onClick={() => choose(p)}
                  className={active === i ? "is-active" : ""}
                >
                  <span>{p.name}</span>
                  {active === i && <Check size={16} />}
                </li>
              ))
            ) : (
              <li className="no-match" role="option" aria-selected={false}>
                {t("Nessun Pokémon trovato.", "No Pokémon found.")}
              </li>
            )}
          </ul>
        )}
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button
        type="submit"
        className="button primary full"
        disabled={disabled || !value.trim()}
      >
        {t("Conferma risposta", "Confirm answer")}
        <ArrowRight size={19} />
      </button>
      {allowPass && (
        <button
          type="button"
          className="text-button pass-button"
          disabled={disabled}
          onClick={onPass}
        >
          {t("Non lo so, passo", "I don't know, pass")}
        </button>
      )}
    </form>
  );
}
export function PokemonName({ id }: { id: number }) {
  return <>{byId.get(id)?.name ?? "?"}</>;
}
