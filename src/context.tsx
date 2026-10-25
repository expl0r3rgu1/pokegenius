import { createContext, useContext } from "react";
export type Lang = "it" | "en";
export const LanguageContext = createContext<Lang>("it");
export function useText() {
  const lang = useContext(LanguageContext);
  return (it: string, en: string) => (lang === "it" ? it : en);
}
export const TYPE_LABELS: Record<string, string> = {
  normal: "Normale",
  fire: "Fuoco",
  water: "Acqua",
  electric: "Elettro",
  grass: "Erba",
  ice: "Ghiaccio",
  fighting: "Lotta",
  poison: "Veleno",
  ground: "Terra",
  flying: "Volante",
  psychic: "Psico",
  bug: "Coleottero",
  rock: "Roccia",
  ghost: "Spettro",
  dragon: "Drago",
  dark: "Buio",
  steel: "Acciaio",
  fairy: "Folletto",
};
