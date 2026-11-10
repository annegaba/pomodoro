# I've Bean Focused 💜

**👉 [annegaba.github.io/pomodoro](https://annegaba.github.io/pomodoro/)**

A cute pixel space-bean pomodoro timer for study sessions. Focus for 25 minutes, take a 5 minute break, and get hyped up every time you finish. LET'S GO GIRLYPOP! 💅

## What it does

- **25 min focus / 5 min break**, with a progress ring and a floating pixel bean
- **Pick your own lengths:** Classic 25/5, Quick 15/3, Deep 50/10, or type your own minutes (in 🎨)
- **Long break 🌙** after every 4 focus sessions, with extra hype
- **Study streak 🔥:** counts the days in a row you finish at least one focus session
- **Hype after every focus session:** confetti, a happy chime and messages like *"SLAY QUEEN!"* and *"That test tomorrow? You're SO ready for it."*
- **Self-care nudges:** drink water 💧, stretch, rest your eyes, grab a snack
- **7 color themes:** purple (default), pink, cyan, lime, red, yellow, white
- **Sound, vibration and notifications** when a timer ends (toggle them in 🎨)
- **Keeps the screen on** while the timer runs, counts today's sessions (resets at midnight), and works offline

> 💡 Leave the app open with the screen on while studying. Phones pause web apps when they're locked, so the timer stays right but the chime waits until you open it again.

## Music with Spotify 🎧

I've Bean Focused can play a focus playlist and a break playlist from your Spotify account while the timer runs. It pauses when you pause and stops for the celebration. It needs **Spotify Premium**.

Connect it in **🎨 → Music**. On a phone, open the Spotify app once first so the app can find it.

<details>
<summary>Setup (one time, for the app owner)</summary>

1. Go to the [Spotify developer dashboard](https://developer.spotify.com/dashboard) and create an app.
2. Add these **Redirect URIs** exactly: `https://annegaba.github.io/pomodoro/` and `http://127.0.0.1:8000/` (for testing on your computer).
3. Tick **Web API**, then save.
4. In **User Management**, add each listener's name and Spotify email (new apps allow up to 25 people).
5. Put the app's **Client ID** in `CLIENT_ID` at the top of `spotify.js`. The Client ID is public; never put the Client Secret anywhere in this project.

Until `CLIENT_ID` is set, the Music section stays hidden.
</details>

## Install it 📲

Open **[annegaba.github.io/pomodoro](https://annegaba.github.io/pomodoro/)**, then:

### Android
1. Open the link in **Chrome**. In an app's browser (Messenger, TikTok)? Tap **⋮** → **Open in Chrome** first.
2. Tap the **⋮** menu in the top-right corner.
3. Tap **Add to Home screen** (or **Install app**).
4. Tap **Install**. The purple bean is now on your home screen! 🎀

### iPhone / iPad
1. Open the link in **Safari**. In an app's browser? Tap **•••** → **Open in browser** first.
2. Tap the **Share** button ⬆️ at the bottom. On newer iPhones, tap **•••** first, then **Share**.
3. Scroll down and tap **Add to Home Screen** ➕
4. Tap **Add**. That's it, girlie! 🎀

### PC / Mac
- **Chrome:** click the install icon at the right end of the address bar, or **⋮ → Cast, save, and share → Install page as app**.
- **Edge:** **•••** → **Apps** → **Install this site as an app**.
- **Mac Safari:** **File** → **Add to Dock**.

It then opens in its own window and shows up in your Start menu or Dock.

You can also tap **📲 Save I've Bean Focused to your phone or PC** at the bottom of the app for these steps (and a one-tap **Install now** button on Android and Chrome/Edge).

## Made by

Made with 💜 by **Anne Gaba** for her girlypop.
