import { useEffect, useState } from "react";
import InstallPWAButton from "./InstallPWAButton";

function SpotifyGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M7 10.2c3-1 7-.6 9.4.9M7.6 13c2.4-.7 5.6-.4 7.6.9M8.2 15.6c1.8-.5 4.2-.3 5.6.7"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function YTMusicGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10.5 9.2v5.6l4.8-2.8-4.8-2.8Z" fill="currentColor" />
    </svg>
  );
}

// Indian Date & Time
function IndianDateTime() {
  const [dateTime, setDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const date = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(dateTime);

  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(dateTime);

  return (
    <div className="topbar__datetime">
      <span>{date}</span>
      <span>•</span>
      <span>{time} IST</span>
    </div>
  );
}

export default function TopBar() {
  return (
    <header className="topbar">
      <div className="topbar__brand">
        
        {/* Date & Time yaha dikhega */}
        <IndianDateTime />

        <div className="topbar__brandtext">
        </div>
      </div>

      <nav className="topbar__streams" aria-label="Listen elsewhere">
        {/* <a
          className="topbar__stream"
          href="https://open.spotify.com"
          target="_blank"
          rel="noreferrer"
        >
          <SpotifyGlyph />
          Spotify
        </a>

        <a
          className="topbar__stream"
          href="https://music.youtube.com"
          target="_blank"
          rel="noreferrer"
        >
          <YTMusicGlyph />
          <span>YT Music</span>
        </a> */}

        <InstallPWAButton />
      </nav>
    </header>
  );
}