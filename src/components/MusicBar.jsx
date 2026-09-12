import { useEffect, useRef, useState } from "react";
import { PLAYLIST_SOURCE } from "../data/playlist";

// Accepts either a full playlist URL or a bare playlist ID.
function extractPlaylistId(source) {
  try {
    const url = new URL(source);
    const id = url.searchParams.get("list");
    if (id) return id;
  } catch {
    // not a full URL — assume the value is already just the ID
  }
  return source.trim();
}

const PLAYLIST_ID = extractPlaylistId(PLAYLIST_SOURCE);

let apiPromise = null;
function loadYouTubeAPI() {
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve) => {
    if (window.YT && window.YT.Player) {
      resolve(window.YT);
      return;
    }
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.body.appendChild(tag);
    window.onYouTubeIframeAPIReady = () => resolve(window.YT);
  });
  return apiPromise;
}

function fmt(t) {
  if (!t || Number.isNaN(t)) return "0:00";
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

// No API key needed — YouTube's public oEmbed endpoint returns a
// video's title/channel name for any watchable video.
async function fetchOEmbed(videoId) {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(
        `https://www.youtube.com/watch?v=${videoId}`
      )}&format=json`
    );
    if (!res.ok) return null;
    const data = await res.json();
    return { title: data.title, artist: data.author_name };
  } catch {
    return null;
  }
}

function PrevIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M7 6a1 1 0 0 1 2 0v12a1 1 0 0 1-2 0V6Zm3.7 6 8.6-6.2a1 1 0 0 1 1.6.8v11a1 1 0 0 1-1.6.8L10.7 12Z" />
    </svg>
  );
}
function NextIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M17 6a1 1 0 0 1 2 0v12a1 1 0 0 1-2 0V6ZM13.3 12l-8.6 6.2a1 1 0 0 1-1.6-.8v-11a1 1 0 0 1 1.6-.8L13.3 12Z" />
    </svg>
  );
}
function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M8 5.5v13a1 1 0 0 0 1.5.87l11-6.5a1 1 0 0 0 0-1.74l-11-6.5A1 1 0 0 0 8 5.5Z" />
    </svg>
  );
}
function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <rect x="6" y="5" width="4.5" height="14" rx="1" />
      <rect x="13.5" y="5" width="4.5" height="14" rx="1" />
    </svg>
  );
}
function ChevronIcon({ up }) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
      <path
        d={up ? "M6 15l6-6 6 6" : "M6 9l6 6 6-6"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function MusicBar() {
  const playerRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [videoIds, setVideoIds] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [meta, setMeta] = useState({}); // videoId -> { title, artist }

  useEffect(() => {
    let cancelled = false;
    loadYouTubeAPI().then((YT) => {
      if (cancelled) return;
      playerRef.current = new YT.Player("cw-audio-player", {
        height: "1",
        width: "1",
        host: "https://www.youtube-nocookie.com",
        playerVars: {
          listType: "playlist",
          list: PLAYLIST_ID,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
        },
        events: {
          onReady: () => {
            setReady(true);
            setVideoIds(playerRef.current.getPlaylist() || []);
          },
          onStateChange: (e) => {
            if (e.data === YT.PlayerState.PLAYING) setPlaying(true);
            if (e.data === YT.PlayerState.PAUSED) setPlaying(false);
            if (
              e.data === YT.PlayerState.PLAYING ||
              e.data === YT.PlayerState.CUED
            ) {
              const list = playerRef.current.getPlaylist();
              if (list) setVideoIds(list);
              setCurrentIndex(playerRef.current.getPlaylistIndex() || 0);
              const data = playerRef.current.getVideoData?.();
              if (data?.video_id) {
                setMeta((m) =>
                  m[data.video_id]
                    ? m
                    : { ...m, [data.video_id]: { title: data.title, artist: data.author } }
                );
              }
            }
          },
        },
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // poll playback progress
  useEffect(() => {
    const id = setInterval(() => {
      const p = playerRef.current;
      if (p && p.getCurrentTime) {
        setProgress(p.getCurrentTime() || 0);
        setDuration(p.getDuration() || 0);
      }
    }, 500);
    return () => clearInterval(id);
  }, []);

  // fetch nice titles for every track once the playlist panel is opened
  useEffect(() => {
    if (!expanded) return;
    videoIds.forEach((id) => {
      if (meta[id]) return;
      fetchOEmbed(id).then((info) => {
        if (info) setMeta((m) => (m[id] ? m : { ...m, [id]: info }));
      });
    });
  }, [expanded, videoIds, meta]);

  function togglePlay() {
    if (!ready) return;
    if (playing) playerRef.current.pauseVideo();
    else playerRef.current.playVideo();
  }

  function next() {
    playerRef.current?.nextVideo();
  }

  function prev() {
    playerRef.current?.previousVideo();
  }

  function playAt(i) {
    playerRef.current?.playVideoAt(i);
  }

  function seek(e) {
    const val = Number(e.target.value);
    setProgress(val);
    playerRef.current?.seekTo(val, true);
  }

  const currentId = videoIds[currentIndex];
  const current = (currentId && meta[currentId]) || {
    title: ready ? "Loading track…" : "Loading playlist…",
    artist: "",
  };
  const pct = duration ? Math.min(100, (progress / duration) * 100) : 0;

  return (
    <div className="musicbar">
      <div
        id="cw-audio-player"
        style={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
      />

      <div className="musicbar__row">
        <div className="musicbar__meta">
          {currentId && (
            <img
              className="musicbar__art"
              src={`https://i.ytimg.com/vi/${currentId}/mqdefault.jpg`}
              alt=""
              aria-hidden="true"
              onError={(e) => {
                e.currentTarget.style.visibility = "hidden";
              }}
            />
          )}
          <div className="musicbar__text">
            <p className="musicbar__title">{current.title}</p>
            <p className="musicbar__artist">{current.artist}</p>
          </div>
        </div>

        <div className="musicbar__controls">
          <button onClick={prev} aria-label="Previous song" className="musicbar__ctrl" disabled={!ready}>
            <PrevIcon />
          </button>
          <button
            onClick={togglePlay}
            aria-label={playing ? "Pause" : "Play"}
            className="musicbar__play"
            disabled={!ready}
          >
            {playing ? <PauseIcon /> : <PlayIcon />}
          </button>
          <button onClick={next} aria-label="Next song" className="musicbar__ctrl" disabled={!ready}>
            <NextIcon />
          </button>
        </div>

        <div className="musicbar__progress">
          <span className="musicbar__time">{fmt(progress)}</span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={progress}
            onChange={seek}
            className="musicbar__scrub"
            style={{ "--pct": `${pct}%` }}
            aria-label="Seek"
          />
          <span className="musicbar__time">{fmt(duration)}</span>
        </div>

        <button
          className="musicbar__expand"
          onClick={() => setExpanded((v) => !v)}
          aria-label={expanded ? "Hide playlist" : "Show playlist"}
          aria-expanded={expanded}
        >
          <ChevronIcon up={!expanded} />
        </button>
      </div>

      {expanded && (
        <ul className="musicbar__playlist">
          {videoIds.map((id, i) => {
            const info = meta[id] || { title: "Loading…", artist: "" };
            return (
              <li key={id + i}>
                <button
                  className={i === currentIndex ? "musicbar__playlistitem is-active" : "musicbar__playlistitem"}
                  onClick={() => playAt(i)}
                >
                  <img
                    className="musicbar__playlistart"
                    src={`https://i.ytimg.com/vi/${id}/mqdefault.jpg`}
                    alt=""
                    aria-hidden="true"
                    onError={(e) => {
                      e.currentTarget.style.visibility = "hidden";
                    }}
                  />
                  <span className="musicbar__playlisttitle">{info.title}</span>
                  <span className="musicbar__playlistartist">{info.artist}</span>
                  {i === currentIndex && playing && (
                    <span className="musicbar__nowplaying">Now playing</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
