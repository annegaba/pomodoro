# Bean Focus 💜

A cute pixel space-bean pomodoro timer, made for test-prep focus sessions.

- **25 min focus / 5 min break**
- Hype messages + self-care reminders (drink water!) after every focus session
- 7 color themes (purple is the default)
- Sound, vibration, and notifications when a timer ends
- Keeps the screen awake while the timer runs
- Works offline and installs to an Android home screen (PWA)

## Install on Android

1. Open the GitHub Pages link in **Chrome** on the phone.
2. Tap the **⋮** menu → **Add to Home screen** (or **Install app**).
3. Tap **Install**. The purple bean icon shows up on the home screen.

## Hosting with GitHub Pages

Repo **Settings → Pages → Build and deployment → Source: Deploy from a branch**,
pick the branch with these files and the `/ (root)` folder, then save.
The site will be at `https://<username>.github.io/pomodoro/`.

## Run locally

Any static server works, e.g. `python3 -m http.server 8000`, then open http://localhost:8000.

## Files

- `index.html`, `style.css`, `app.js`: the app
- `sw.js`: service worker for offline use
- `manifest.webmanifest`: install info for "Add to Home screen"
- `icons/`: pixel bean app icons
