# CodingWallah — by Naveen Rathore

A Vite + React music page: hero banner, Spotify/YT Music links up top,
and a sticky bottom music bar that plays a YouTube playlist with
play/pause/next/prev/seek controls.

## Run it

```bash
npm install
npm run dev
```

Then open the printed local URL in your browser.

## Background image

`public/background.jpg` is used automatically behind the hero title,
with a dark gradient over it so the text stays readable. To swap the
photo, just replace that file (keep the same name), or change the
`url("/background.jpg")` in `src/App.css` under `.hero__backdrop` if
you rename it.

## Edit your playlist

Open `src/data/playlist.js` and paste your YouTube playlist link (or
just the playlist ID) into `PLAYLIST_SOURCE`:

```js
export const PLAYLIST_SOURCE =
  "https://www.youtube.com/playlist?list=YOUR_PLAYLIST_ID";
```

The whole playlist loads into the bar automatically — track titles,
channel names, and thumbnails are pulled live from YouTube, so there's
nothing else to type in by hand. Prev/Next move through the real
playlist order, and opening the ⌃ panel shows every track in it.

## About ads

The player embeds videos from `youtube-nocookie.com` (YouTube's
privacy-enhanced mode), which cuts down on tracking-based ads and
skips YouTube's own subscribe/watermark overlay. It can't remove
YouTube's built-in pre-roll/mid-roll ads entirely — that's controlled
by YouTube and the video owner, not by the embed. If you want a
guaranteed ad-free listen, host your own audio files instead of
embedding YouTube, or point the playlist at tracks you know are
ad-free on YouTube.

## Change the name/branding

`src/components/TopBar.jsx` and `src/components/Hero.jsx` hold the
"CodingWallah" and "Naveen Rathore" text — edit freely.
