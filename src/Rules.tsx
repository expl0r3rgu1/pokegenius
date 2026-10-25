import { Grid2X2, ScanLine, Users } from "lucide-react";
import { useText } from "./context";
import type { Game } from "./game";
export function Rules({ game }: { game?: Game }) {
  const t = useText();
  return (
    <div className="rules-content">
      {(!game || game === "shadow") && (
        <section>
          <div className="rule-heading">
            <ScanLine size={24} />
            <h3>Who's that Pokémon?</h3>
          </div>
          <p>
            {t(
              "Riconosci il Pokémon dalla sua sagoma. Cerca il nome, selezionalo e conferma la risposta.",
              "Identify the Pokémon from its silhouette. Search for a name, select it, then confirm your answer.",
            )}
          </p>
          <ul>
            <li>
              {t(
                "Da solo: una risposta per sagoma. Ogni risposta corretta vale 100 punti. Il numero di round scelto è il numero di sagome.",
                "Solo: one answer per silhouette. Each correct answer earns 100 points. Your round setting is the number of silhouettes.",
              )}
            </li>
            <li>
              {t(
                "In due: il lancio della moneta decide chi inizia. Un errore passa la stessa sagoma all’altro giocatore, per un solo tentativo di recupero.",
                "With a friend: a coin toss picks the first player. A wrong answer passes the same silhouette to the other player for one steal attempt.",
              )}
            </li>
            <li>
              {t(
                "Ogni round contiene al massimo 5 sagome e finisce anche quando qualcuno arriva a 3 punti. Chi indovina mantiene il turno; dopo due errori lo mantiene il secondo giocatore. Il primo giocatore del round si alterna. Vince chi totalizza più risposte corrette nella partita.",
                "Each round has up to 5 silhouettes and also ends when a player reaches 3 points. A correct answer keeps the turn; after two misses, the second player keeps it. The round starter alternates. Most correct answers across the match wins.",
              )}
            </li>
          </ul>
        </section>
      )}
      {(!game || game === "doku") && (
        <section>
          <div className="rule-heading">
            <Grid2X2 size={24} />
            <h3>Pokédoku</h3>
          </div>
          <p>
            {t(
              "Scegli una casella e trova un Pokémon che rispetti sia la categoria della riga sia quella della colonna. Tutte le caselle hanno almeno una soluzione nelle generazioni selezionate.",
              "Pick a cell and name a Pokémon matching both its row and column. Every cell has at least one answer within your selected generations.",
            )}
          </p>
          <ul>
            <li>
              {t(
                "Da solo: hai una risposta per casella. Una risposta corretta vale 10 punti; un errore blocca quella casella. Completa le 9 caselle e prova a fare 90 punti per griglia.",
                "Solo: one answer per cell. A correct answer earns 10 points; a miss locks that cell. Complete all 9 cells and aim for 90 points per board.",
              )}
            </li>
            <li>
              {t(
                "In due: 40 secondi per turno. Una risposta corretta conquista la casella; un errore o il tempo scaduto passano il turno. Il timer continua anche se cambi scheda. Fai tris per vincere il round. Griglia piena senza tris: pareggio.",
                "With a friend: 40 seconds per turn. A correct answer claims a cell; a miss or timeout passes the turn. The timer keeps running when you change tabs. Get three in a row to win the round. A full board without a line is a draw.",
              )}
            </li>
            <li>
              {t(
                "Il numero di round scelto è il numero di griglie. In due vince chi conquista più round. Puoi riutilizzare un Pokémon in più caselle. Sono incluse le forme base, con i tipi attuali, senza forme regionali o megaevoluzioni.",
                "Your round setting is the number of boards. In two-player mode, most round wins takes the match. Pokémon may be reused in different cells. Default forms and current types are used, without regional forms or Mega Evolutions.",
              )}
            </li>
          </ul>
        </section>
      )}
      {(!game || game === "pokedle") && (
        <section>
          <div className="rule-heading">
            <span>Aa</span>
            <h3>Pokédle</h3>
          </div>
          <p>
            {t(
              "Trova il nome del Pokémon in sei tentativi. La lunghezza cambia con il nome: una casella per carattere.",
              "Find the Pokémon name in six guesses. The length changes with the name: one tile per character.",
            )}
          </p>
          <ul>
            <li>
              {t(
                "Verde e ✓: carattere al posto giusto. Giallo e •: presente in un’altra posizione. Grigio e ×: assente. Le lettere ripetute vengono contate una sola volta per ogni occorrenza nel nome.",
                "Green and ✓: right character, right place. Yellow and •: present elsewhere. Grey and ×: absent. Repeated characters are counted only as many times as they appear in the answer.",
              )}
            </li>
            <li>
              {t(
                "Puoi provare qualsiasi sequenza della lunghezza indicata, anche se non è il nome di un Pokémon. Spazi, punteggiatura e accenti vengono rimossi; i nomi composti restano interi. Per Nidoran, usa f o m; per Porygon2, usa il tasto 2.",
                "Any sequence of the required length is accepted, even if it is not a Pokémon name. Spaces, punctuation and accents are removed; compound names stay complete. Use f or m for Nidoran and the 2 key for Porygon2.",
              )}
            </li>
            <li>
              {t(
                "Una partita contiene un solo nome. Puoi ricominciare subito con un nuovo Pokémon.",
                "Each game contains one name. Start again whenever you want a new Pokémon.",
              )}
            </li>
          </ul>
        </section>
      )}
      {(!game || game === "dex") && (
        <section>
          <div className="rule-heading">
            <span>#</span>
            <h3>DexCode</h3>
          </div>
          <p>
            {t(
              "Vedi un numero del Pokédex Nazionale e scegli il Pokémon corrispondente. Anche avvicinarsi al numero conta.",
              "See a National Pokédex number and choose its Pokémon. Getting close counts too.",
            )}
          </p>
          <ul>
            <li>
              {t(
                "Da solo: risposta esatta 150 punti; distanza da 1 a 10: 100; da 11 a 25: 70; da 26 a 50: 35; oltre 50: 0.",
                "Solo: exact answer 150 points; distance 1-10: 100; 11-25: 70; 26-50: 35; more than 50: 0.",
              )}
            </li>
            <li>
              {t(
                "Da 2 a 4 giocatori: ognuno risponde in segreto allo stesso numero. Le risposte si svelano solo alla fine del round. Un esatto vale sempre 150; le altre risposte valgono 100, 70, 50 e 20 secondo la posizione in classifica per distanza.",
                "With 2-4 players: everyone secretly guesses the same number. Answers are revealed only at the end of the round. An exact answer always earns 150; other answers earn 100, 70, 50 or 20 according to their distance ranking.",
              )}
            </li>
            <li>
              {t(
                "Distanze uguali ottengono gli stessi punti, saltando le posizioni successive. Vince il punteggio totale più alto. Un pari merito finale è un pareggio.",
                "Equal distances earn equal points, skipping subsequent ranks. Highest total score wins. Equal final scores are a draw.",
              )}
            </li>
          </ul>
        </section>
      )}
      {(!game || game === "stat") && (
        <section>
          <div className="rule-heading">
            <span>↕</span>
            <h3>Higher or Lower / Stat Match</h3>
          </div>
          <p>
            {t(
              "Confronta due Pokémon: il valore del secondo è più alto o più basso di quello mostrato per il primo?",
              "Compare two Pokémon: is the second Pokémon’s value higher or lower than the first?",
            )}
          </p>
          <ul>
            <li>
              {t(
                "Ogni round contiene 10 confronti su peso, altezza, PS, Attacco, Difesa, Attacco Speciale, Difesa Speciale, Velocità e somma delle statistiche base. Una risposta esatta vale 10 punti. In caso di valori uguali, sono valide entrambe le scelte.",
                "Every round contains 10 comparisons across weight, height, HP, Attack, Defense, Special Attack, Special Defense, Speed and base stat total. A correct answer earns 10 points. Equal values make either choice valid.",
              )}
            </li>
            <li>
              {t(
                "In due: un giocatore completa le 10 domande in segreto, poi passa il dispositivo. Il secondo riceve le stesse domande nello stesso ordine. Tenete lo schermo nascosto durante il turno.",
                "With a friend: one player completes all 10 questions privately, then passes the device. The second player gets the same questions in the same order. Keep the screen hidden during your turn.",
              )}
            </li>
            <li>
              {t(
                "Da solo sommi i punti di tutti i round. In due vince chi conquista più round; i round con punteggi uguali non assegnano vittorie. Le statistiche sono quelle base, senza livelli, allenamento o modificatori.",
                "Solo play adds points across every round. With two players, most round wins takes the match; tied rounds award no win. Stats are base values, without levels, training or modifiers.",
              )}
            </li>
          </ul>
        </section>
      )}
      <div className="rule-note">
        <Users size={20} />
        <p>
          {t(
            "Fino a quattro giocatori, un solo dispositivo. Le partite e le preferenze vengono salvate solo su questo browser.",
            "Up to four players, one device. Matches and preferences are saved only in this browser.",
          )}
        </p>
      </div>
    </div>
  );
}
