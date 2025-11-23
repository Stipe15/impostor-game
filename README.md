# Impostor Questions

> A small local multiplayer party game (single-device) built with HTML, CSS and vanilla JavaScript.

Features
- Mobile-first single-page app (SPA) game flow: Setup → Cards → Discussion → Reveal → Restart
- Dark mode with system-default and toggle
- Card flip animation, answer input per player, and impostor reveal
- Players persisted in `localStorage` so names are remembered across restarts
- Offline support via a basic service worker (`sw.js`) and `manifest.json` for PWA friendliness

Files
- `index.html` — main HTML file
- `style.css` — styles and responsive, touch-friendly UI
- `app.js` — game logic and state machine
- `questionPairs.js` — provided question pairs (game content)
- `sw.js` — simple service worker for offline caching
- `manifest.json` — minimal PWA manifest

Quick start
1. Open the project folder.
2. For the best experience (service worker + PWA), serve the folder over `http://localhost`.

PowerShell (from project folder):
```powershell
python -m http.server 8000;
# then open http://localhost:8000 in your browser
```

Or simply open `index.html` directly if you don't need the service worker.

How to play
1. Enter 3–5 player names on the setup screen.
2. Tap `Start Game` — one player will be randomly assigned as the impostor.
3. Pass the device to each player. Tap the face-down card to flip, enter your answer, and submit.
4. After all players submit, read the answers during discussion.
5. Tap `Reveal Impostor` to see who was the impostor, their special question, and their answer.
6. Tap `Restart Game` to reset the round — player names are preserved.

Notes
- Service worker requires serving over `http(s)` or `localhost` to register.
- To further polish: add icons to `manifest.json`, improve SW caching strategies, and tweak animations.

License
- See `LICENSE` (if included in this repository).

Enjoy!
