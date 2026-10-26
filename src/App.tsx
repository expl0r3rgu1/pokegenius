import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ArrowUpRight,
  BookOpen,
  Gamepad2,
  Music2,
  Volume2,
  Settings2,
  Vibrate,
  Download,
  WifiOff,
} from "lucide-react";
import { Dialog, Pokeball } from "./components";
import { LanguageContext, useText, type Lang } from "./context";
import {
  createMatch,
  DEFAULT_CONFIG,
  reducer,
  type Action,
  type Config,
  type Game,
} from "./game";
const GameView = lazy(() =>
  import("./GameView").then((module) => ({ default: module.GameView })),
);
const ExtraGameView = lazy(() =>
  import("./ExtraGameView").then((module) => ({
    default: module.ExtraGameView,
  })),
);
import { createExtraMatch, extraReducer, type ExtraAction } from "./extraGames";
import { Home } from "./Home";
import { Rules } from "./Rules";
import { makeMusicBuffer } from "./music";
import { Setup } from "./Setup";
import { useWebHaptics } from "web-haptics/react";
import { usePwa } from "./pwa";
import {
  KEYS,
  read,
  recordMatch,
  savedConfig,
  savedMatch,
  write,
} from "./storage";

export default function App() {
  const [lang, setLang] = useState<Lang>(() =>
    read(KEYS.lang) === "en" ? "en" : "it",
  );
  return (
    <LanguageContext value={lang}>
      <GameRoom
        lang={lang}
        setLang={(value) => {
          setLang(value);
          write(KEYS.lang, value);
        }}
      />
    </LanguageContext>
  );
}
function GameRoom({
  lang,
  setLang,
}: {
  lang: Lang;
  setLang: (lang: Lang) => void;
}) {
  const t = useText();
  const [match, setMatch] = useState(savedMatch);
  const [screen, setScreen] = useState<"home" | "game">(() =>
    savedMatch() && savedMatch()?.phase !== "finished" ? "game" : "home",
  );
  const [config, setConfig] = useState(() => savedConfig() ?? DEFAULT_CONFIG);
  const [setup, setSetup] = useState<Game | null>(null);
  const [modal, setModal] = useState<
    "rules" | "credits" | "settings" | "install" | null
  >(null);
  const pwa = usePwa();
  const { trigger, cancel } = useWebHaptics({ debug: false });
  const [haptics, setHaptics] = useState(() => read(KEYS.haptics) !== false);
  const pulse = useCallback(
    (pattern: string) => {
      if (haptics) void trigger(pattern)?.catch(() => {});
    },
    [haptics, trigger],
  );
  const [sound, setSound] = useState(() => read(KEYS.sound) === true);
  const [music, setMusic] = useState(() => read(KEYS.music) === true);
  const [audioReady, setAudioReady] = useState(0);
  const musicBuffer = useRef<AudioBuffer | null>(null);
  const [storageError, setStorageError] = useState(false);
  const audio = useRef<AudioContext | null>(null);
  const dispatch = useCallback(
    (action: Action) =>
      setMatch((current) =>
        current && !("extra" in current) ? reducer(current, action) : current,
      ),
    [],
  );
  const dispatchExtra = useCallback(
    (action: ExtraAction) =>
      setMatch((current) =>
        current && "extra" in current ? extraReducer(current, action) : current,
      ),
    [],
  );
  const home = () => {
    setScreen("home");
    window.scrollTo(0, 0);
  };
  const openGame = () => {
    setScreen("game");
    window.scrollTo(0, 0);
    window.history.pushState({ game: true }, "");
  };
  useEffect(() => {
    document.documentElement.lang = lang;
    document.title =
      lang === "it"
        ? "PokéGenius - Il tuo prossimo colpo di genio"
        : "PokéGenius - Your next genius move";
  }, [lang]);
  useEffect(() => {
    const viewport = window.visualViewport;
    const resize = () => {
      const height = viewport?.height ?? window.innerHeight;
      document.documentElement.style.setProperty(
        "--usable-height",
        `${Math.round(height)}px`,
      );
      document.documentElement.classList.toggle(
        "keyboard-open",
        height < window.innerHeight * 0.78 &&
          document.activeElement?.tagName === "INPUT",
      );
    };
    resize();
    viewport?.addEventListener("resize", resize);
    window.addEventListener("resize", resize);
    document.addEventListener("focusout", resize);
    return () => {
      viewport?.removeEventListener("resize", resize);
      window.removeEventListener("resize", resize);
      document.removeEventListener("focusout", resize);
      document.documentElement.classList.remove("keyboard-open");
    };
  }, []);
  useEffect(() => {
    const handler = () => setScreen("home");
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);
  useEffect(() => {
    if (!match) return;
    if (!write(KEYS.match, match)) setStorageError(true);
    if (match.phase === "finished") recordMatch(match);
  }, [match]);
  useEffect(() => {
    if (!sound || match?.phase !== "feedback") return;
    const ctx = audio.current;
    if (!ctx || ctx.state !== "running") return;
    const oscillator = ctx.createOscillator();
    const volume = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(
      match.feedback?.kind === "correct" ? 660 : 240,
      ctx.currentTime,
    );
    oscillator.frequency.exponentialRampToValueAtTime(
      match.feedback?.kind === "correct" ? 990 : 160,
      ctx.currentTime + 0.16,
    );
    volume.gain.setValueAtTime(0.045, ctx.currentTime);
    volume.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.24);
    oscillator.connect(volume);
    volume.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.25);
  }, [sound, match?.phase, match?.feedback?.kind]);
  const unlockAudio = () => {
    try {
      const created = !audio.current;
      audio.current ??= new AudioContext();
      void audio.current.resume().catch(() => {});
      if (created) setAudioReady((value) => value + 1);
    } catch {
      /* Audio is optional on unsupported browsers. */
    }
  };
  useEffect(() => {
    if (!music) return;
    const startOnGesture = () => unlockAudio();
    document.addEventListener("pointerdown", startOnGesture, { once: true });
    return () => document.removeEventListener("pointerdown", startOnGesture);
  }, [music]);
  useEffect(() => {
    const ctx = audio.current;
    if (!music || !ctx) return;
    musicBuffer.current ??= makeMusicBuffer(ctx);
    const source = ctx.createBufferSource();
    source.buffer = musicBuffer.current;
    source.loop = true;
    source.connect(ctx.destination);
    source.start();
    return () => {
      source.stop();
      source.disconnect();
    };
  }, [music, audioReady]);
  const lastHapticMatch = useRef(match);
  useEffect(() => {
    if (lastHapticMatch.current === match) return;
    lastHapticMatch.current = match;
    if (match?.phase === "feedback")
      pulse(match.feedback?.kind === "correct" ? "success" : "error");
    if (match?.phase === "finished")
      pulse(
        "extra" in match && match.config.game === "pokedle" && !match.scores[0]
          ? "error"
          : "success",
      );
  }, [match, pulse]);
  const install = async () => {
    if (!(await pwa.install())) setModal("install");
  };
  const start = (next: Config) => {
    if (sound) unlockAudio();
    setConfig(next);
    write(KEYS.config, next);
    setMatch(
      next.game === "shadow" || next.game === "doku"
        ? createMatch(next)
        : createExtraMatch(next),
    );
    setSetup(null);
    openGame();
  };
  return (
    <div
      className={`app-shell ${screen === "game" ? "is-playing" : "is-home"}`}
      onClickCapture={(event) => {
        if (
          event.target instanceof Element &&
          event.target.closest("button:not(:disabled)")
        )
          pulse("selection");
      }}
    >
      <a className="skip-link" href="#main">
        {t("Vai al contenuto", "Skip to content")}
      </a>
      <header className="site-header">
        <button
          className="brand"
          onClick={home}
          aria-label={t("PokéGenius, sala giochi", "PokéGenius, game room")}
        >
          <span className="brand-mark">
            <Pokeball />
          </span>
          <span>
            Poké<span>Genius</span>
            <small>
              {t("Un’idea. Tutti i Pokémon.", "Big brains. All the Pokémon.")}
            </small>
          </span>
        </button>
        <nav aria-label={t("Navigazione principale", "Main navigation")}>
          <button
            className={`nav-link ${screen === "home" ? "nav-active" : ""}`}
            onClick={home}
          >
            <Gamepad2 size={18} />
            <span>{t("Sala giochi", "Game room")}</span>
          </button>
          <button className="nav-link" onClick={() => setModal("rules")}>
            <BookOpen size={17} />
            <span>{t("Come si gioca", "How to play")}</span>
          </button>
        </nav>
        <div className="header-actions">
          <button
            className="language-button"
            aria-label={
              lang === "it" ? "Switch to English" : "Passa a italiano"
            }
            onClick={() => setLang(lang === "it" ? "en" : "it")}
          >
            {lang.toUpperCase()}
          </button>
          {!pwa.installed && (
            <button
              className="icon-button install-button"
              aria-label={t("Installa il gioco", "Install game")}
              onClick={() => {
                void install();
              }}
            >
              <Download size={19} />
            </button>
          )}
          <button
            className="icon-button"
            aria-label={t("Impostazioni", "Settings")}
            onClick={() => setModal("settings")}
          >
            <Settings2 size={19} />
          </button>
        </div>
      </header>
      {pwa.needRefresh && (
        <div className="update-notice" role="status">
          <span>{t("Un aggiornamento è pronto.", "An update is ready.")}</span>
          <button
            className="text-button"
            onClick={() => {
              void pwa.update();
            }}
          >
            {t("Aggiorna", "Update")}
          </button>
          <button className="text-button" onClick={pwa.dismissUpdate}>
            {t("Dopo", "Later")}
          </button>
        </div>
      )}
      {storageError && (
        <div className="storage-notice" role="status">
          {t(
            "Il browser non consente il salvataggio. Puoi giocare, ma i progressi andranno persi chiudendo la pagina.",
            "Your browser is blocking saves. You can play, but progress will be lost when you close this page.",
          )}
        </div>
      )}
      <main id="main">
        <Suspense
          fallback={
            <p className="game-loading" role="status">
              {t("Prepariamo il campo...", "Preparing the field...")}
            </p>
          }
        >
          {screen === "game" && match ? (
            "extra" in match ? (
              <ExtraGameView
                match={match}
                dispatch={dispatchExtra}
                onHome={home}
                onRules={() => setModal("rules")}
                onReplay={() => setSetup(match.config.game)}
              />
            ) : (
              <GameView
                match={match}
                dispatch={dispatch}
                onHome={home}
                onRules={() => setModal("rules")}
                onReplay={() => setSetup(match.config.game)}
              />
            )
          ) : (
            <Home
              onSetup={setSetup}
              onRules={() => setModal("rules")}
              saved={match}
              onResume={openGame}
            />
          )}
        </Suspense>
      </main>
      <footer className="site-footer">
        <div>
          <Pokeball />
          <span>
            {t(
              "Fatto per chi ha ancora un Pokémon preferito.",
              "For everyone who still has a favourite Pokémon.",
            )}
          </span>
        </div>
        <p>
          {t("Fan game non ufficiale.", "An unofficial fan game.")}
          <button onClick={() => setModal("credits")}>
            {t("Crediti e info", "Credits & info")}
            <ArrowUpRight size={13} />
          </button>
        </p>
      </footer>
      {setup && (
        <Setup
          key={setup}
          game={setup}
          initial={config}
          onClose={() => setSetup(null)}
          onStart={start}
        />
      )}
      {modal === "settings" && (
        <Dialog
          title={t("Impostazioni", "Settings")}
          onClose={() => setModal(null)}
        >
          <div className="settings-list">
            <button
              aria-pressed={sound}
              onClick={() => {
                const value = !sound;
                setSound(value);
                write(KEYS.sound, value);
                if (value) unlockAudio();
              }}
            >
              <Volume2 size={21} />
              <span>{t("Effetti sonori", "Sound effects")}</span>
              <strong>{sound ? "ON" : "OFF"}</strong>
            </button>
            <button
              aria-pressed={music}
              onClick={() => {
                const value = !music;
                setMusic(value);
                write(KEYS.music, value);
                if (value) unlockAudio();
              }}
            >
              <Music2 size={21} />
              <span>{t("Musica", "Music")}</span>
              <strong>{music ? "ON" : "OFF"}</strong>
            </button>
            <button
              aria-pressed={haptics}
              onClick={() => {
                const value = !haptics;
                setHaptics(value);
                write(KEYS.haptics, value);
                if (!value) cancel();
                if (value) void trigger("success")?.catch(() => {});
              }}
            >
              <Vibrate size={21} />
              <span>{t("Vibrazione", "Haptic feedback")}</span>
              <strong>{haptics ? "ON" : "OFF"}</strong>
            </button>
          </div>
          <p className="settings-note">
            {t(
              "La vibrazione dipende dal dispositivo e dal browser.",
              "Haptic feedback depends on your device and browser.",
            )}
          </p>
          <div className="offline-status">
            <WifiOff size={18} />
            <span>
              {pwa.ready
                ? t("Pronto a giocare anche offline.", "Ready to play offline.")
                : pwa.error
                  ? t(
                      "Salvataggio offline non disponibile. Riprova con una connessione attiva.",
                      "Offline setup is unavailable. Try again with a connection.",
                    )
                  : t(
                      "Prepariamo i giochi per l’uso offline...",
                      "Preparing the games for offline play...",
                    )}
            </span>
          </div>
          {!pwa.installed && (
            <button
              className="button primary full"
              onClick={() => {
                void install();
              }}
            >
              <Download size={18} />
              {t("Installa il gioco", "Install game")}
            </button>
          )}
        </Dialog>
      )}
      {modal === "install" && (
        <Dialog
          title={t("PokéGenius, sempre con te.", "Keep PokéGenius with you.")}
          onClose={() => setModal(null)}
        >
          <div className="install-intro">
            <img src="/icons/icon-192.png" alt="" width="72" height="72" />
            <div>
              <strong>PokéGenius</strong>
              <p>
                {t(
                  "Un tocco e si gioca. Anche offline.",
                  "One tap to play. Offline, too.",
                )}
              </p>
            </div>
          </div>
          <div className="install-instructions">
            <p>
              {t(
                "Su iPhone o iPad: apri il menu Condividi e scegli Aggiungi alla schermata Home.",
                "On iPhone or iPad: open the Share menu and choose Add to Home Screen.",
              )}
            </p>
            <p>
              {t(
                "Su Android o desktop: apri il menu del browser e scegli Installa app o Aggiungi alla schermata Home.",
                "On Android or desktop: open your browser menu and choose Install app or Add to Home Screen.",
              )}
            </p>
            <p>
              {t(
                "Per il primo avvio offline, attendi la conferma nelle impostazioni.",
                "For your first offline launch, wait for the ready message in settings.",
              )}
            </p>
          </div>
        </Dialog>
      )}
      {modal === "rules" && (
        <Dialog
          title={t(
            "Piccole regole, grandi sfide.",
            "Simple rules. Great challenges.",
          )}
          onClose={() => setModal(null)}
          wide
        >
          <Rules game={screen === "game" ? match?.config.game : undefined} />
        </Dialog>
      )}
      {modal === "credits" && (
        <Dialog
          title={t("Un gioco tra appassionati.", "Made by fans, for fans.")}
          onClose={() => setModal(null)}
        >
          <div className="credits-content">
            <p>
              {t(
                "PokéGenius è un fan game gratuito e non ufficiale, senza affiliazione a Nintendo, Game Freak o The Pokémon Company. Pokémon e i relativi personaggi appartengono ai rispettivi titolari.",
                "PokéGenius is a free, unofficial fan game, unaffiliated with Nintendo, Game Freak or The Pokémon Company. Pokémon and related characters belong to their respective owners.",
              )}
            </p>
            <p>
              {t(
                "Dati e immagini provengono da PokéAPI. I tipi sono quelli attuali delle forme base. I Pokémon disponibili sono i numeri 001-1025 del Pokédex Nazionale.",
                "Data and images are sourced from PokéAPI. Types use current default forms. The available Pokémon are National Pokédex numbers 001-1025.",
              )}
            </p>
            <a href="https://pokeapi.co" target="_blank" rel="noreferrer">
              PokéAPI <ArrowUpRight size={15} />
            </a>
            <p>
              {t(
                "Nessun account, nessun tracciamento. Impostazioni, partita in corso e risultati restano nel salvataggio locale del browser. Cancellando i dati del sito, li rimuovi.",
                "No accounts or tracking. Settings, your current match and results stay in local browser storage. Clearing site data removes them.",
              )}
            </p>
            <a
              href="https://github.com/expl0r3rgu1/pokegenius"
              target="_blank"
              rel="noreferrer"
            >
              {t("Codice sorgente su GitHub", "Source code on GitHub")}{" "}
              <ArrowUpRight size={15} />
            </a>
          </div>
        </Dialog>
      )}
    </div>
  );
}
