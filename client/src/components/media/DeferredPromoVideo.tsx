import { useEffect, useRef, useState } from "react";

export function shouldPlayPromo({
  visible,
  hidden,
  reducedMotion,
  saveData,
  userStarted,
  paused,
}: {
  visible: boolean;
  hidden: boolean;
  reducedMotion: boolean;
  saveData: boolean;
  userStarted: boolean;
  paused: boolean;
}) {
  return (
    visible &&
    !hidden &&
    !paused &&
    (userStarted || (!reducedMotion && !saveData))
  );
}

/** Decorative silent footage. The poster remains usable without loading the video. */
export function DeferredPromoVideo({
  src,
  poster,
}: {
  src: string;
  poster: string;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [hidden, setHidden] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [saveData, setSaveData] = useState(true);
  const [userStarted, setUserStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (
      navigator as Navigator & {
        connection?: EventTarget & { saveData?: boolean };
      }
    ).connection;
    const preferences = () => {
      setReducedMotion(motion.matches);
      setSaveData(!!connection?.saveData);
    };
    const visibility = () => setHidden(document.hidden);
    preferences();
    visibility();
    motion.addEventListener("change", preferences);
    connection?.addEventListener("change", preferences);
    document.addEventListener("visibilitychange", visibility);
    // Without an observer, require a deliberate click instead of eagerly fetching.
    const observer =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(
            ([entry]) => setVisible(entry.isIntersecting),
            { threshold: 0.1 },
          )
        : undefined;
    if (container.current) observer?.observe(container.current);
    return () => {
      observer?.disconnect();
      motion.removeEventListener("change", preferences);
      connection?.removeEventListener("change", preferences);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);
  const play = shouldPlayPromo({
    visible,
    hidden,
    reducedMotion,
    saveData,
    userStarted,
    paused,
  });
  useEffect(() => {
    if (play) setLoaded(true);
  }, [play]);
  useEffect(() => {
    const element = video.current;
    let current = true;
    if (element && loaded && play && !failed) {
      element.play().catch(() => {
        if (current) setPaused(true);
      });
    } else element?.pause();
    return () => {
      current = false;
      element?.pause();
    };
  }, [loaded, play, failed]);
  return (
    <div ref={container} className="absolute inset-0">
      <video
        ref={video}
        src={loaded ? src : undefined}
        poster={poster}
        preload="none"
        loop
        muted
        playsInline
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={() => setFailed(true)}
      />
      <button
        type="button"
        disabled={failed}
        className="absolute bottom-4 right-4 z-10 min-h-11 rounded-full bg-black/85 px-4 py-2 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        onClick={() => {
          if (playing) setPaused(true);
          else {
            setUserStarted(true);
            setPaused(false);
            setVisible(true);
          }
        }}
      >
        {failed
          ? "Video unavailable"
          : playing
            ? "Pause partner video"
            : "Play partner video"}
      </button>
      {failed && (
        <span role="status" className="sr-only">
          The partner video could not load. You can still explore the event hub.
        </span>
      )}
    </div>
  );
}
