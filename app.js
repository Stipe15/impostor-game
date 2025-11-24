const app = document.getElementById('app');

// Color palette for players (index-based) — expanded to support up to 10 players
const PLAYER_COLORS = [
    '#FF6B6B', // red
    '#4D96FF', // blue
    '#FFD166', // yellow
    '#6BCB77', // green
    '#9B5DE5', // purple
    '#FF8AB8', // pink
    '#00C2A8', // teal
    '#FFB86B', // orange
    '#6A5ACD', // slate
    '#2ECC71'  // emerald
];

// Load saved players from localStorage so restart remembers names
const savedPlayers = (() => {
    try {
        const raw = localStorage.getItem('impostor_players');
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        return null;
    }
})();

const state = {
    players: savedPlayers || ['', '', ''],
    questionPair: null,
    impostor: null,
    answers: [],
    currentPage: 'setup', // setup, cards, discussion, reveal
    currentPlayerIndex: 0,
};

function render() {
    // Show/hide chrome (theme toggle + footer) depending on current page
    updateChromeVisibility();

    app.innerHTML = '';
    switch (state.currentPage) {
        case 'setup':
            renderSetup();
            break;
        case 'cards':
            renderCards();
            break;
        case 'revealPrompt':
            renderRevealPrompt();
            break;
        case 'discussion':
            renderDiscussion();
            break;
        case 'reveal':
            renderReveal();
            break;
    }
}

function updateChromeVisibility() {
    const themeToggleEl = document.getElementById('theme-toggle');
    const footerEl = document.getElementById('footer');
    const showChrome = state.currentPage === 'setup';
    if (themeToggleEl) themeToggleEl.style.display = showChrome ? '' : 'none';
    if (footerEl) footerEl.style.display = showChrome ? '' : 'none';
}

function renderSetup() {
    const setupDiv = document.createElement('div');
    setupDiv.className = 'setup-screen';
    setupDiv.innerHTML = `
        <h1>Impostor Questions</h1>
        <div id="player-inputs"></div>
        <button id="add-player">Add Player</button>
        <button id="start-game">Start Game</button>
    `;
    app.appendChild(setupDiv);

    document.getElementById('add-player').addEventListener('click', addPlayer);
    document.getElementById('start-game').addEventListener('click', startGame);

    renderPlayerInputs();
}

function renderPlayerInputs() {
    const playerInputsDiv = document.getElementById('player-inputs');
    playerInputsDiv.innerHTML = '';
    state.players.forEach((player, i) => {
        const playerInputDiv = document.createElement('div');
        playerInputDiv.className = 'player-input';
        playerInputDiv.innerHTML = `
            <div class="player-swatch" title="Player ${i + 1}" style="background:${PLAYER_COLORS[i % PLAYER_COLORS.length]}"></div>
            <input type="text" placeholder="Player ${i + 1}" value="${player || ''}">
            <button class="remove-player" data-index="${i}">X</button>
        `;
        const inputEl = playerInputDiv.querySelector('input');
        const removeBtn = playerInputDiv.querySelector('.remove-player');
        inputEl.addEventListener('change', (e) => {
            state.players[i] = e.target.value;
            // persist players so restart remembers them
            try { localStorage.setItem('impostor_players', JSON.stringify(state.players)); } catch (err) {}
            updateStartButton();
        });
        // Disable remove when at minimum players
        removeBtn.disabled = state.players.length <= 3;
        removeBtn.addEventListener('click', (e) => {
            // Only allow removing if there will still be at least 3 player slots
            if (state.players.length <= 3) {
                // small protective UX: don't remove below minimum
                return;
            }
            removePlayer(parseInt(e.target.dataset.index));
        });
        playerInputsDiv.appendChild(playerInputDiv);
    });
    updateAddButton();
    updateStartButton();
}

function addPlayer() {
    if (state.players.length < 10) {
        state.players.push('');
        try { localStorage.setItem('impostor_players', JSON.stringify(state.players)); } catch (err) {}
        render();
    }
}

function removePlayer(index) {
    if (state.players.length <= 3) return;
    state.players.splice(index, 1);
    try { localStorage.setItem('impostor_players', JSON.stringify(state.players)); } catch (err) {}
    render();
}

function updateAddButton() {
    document.getElementById('add-player').disabled = state.players.length >= 10;
}

function updateStartButton() {
    const filledPlayers = state.players.filter(p => p.trim() !== '').length;
    document.getElementById('start-game').disabled = filledPlayers < 3 || filledPlayers > 10;
}

function startGame() {
    const questionPair = questionPairs[Math.floor(Math.random() * questionPairs.length)];
    const impostorIndex = Math.floor(Math.random() * state.players.length);
    const impostor = state.players[impostorIndex];
    const answers = state.players.map(() => '');

    state.questionPair = questionPair;
    state.impostor = impostor;
    state.answers = answers;
    state.currentPage = 'cards';
    state.currentPlayerIndex = 0;
    // ensure players persisted
    try { localStorage.setItem('impostor_players', JSON.stringify(state.players)); } catch (err) {}
    render();
}


function renderCards() {
    const cardContainer = document.createElement('div');
    cardContainer.className = 'card-container';

    const player = state.players[state.currentPlayerIndex];
    const isImpostor = player === state.impostor;
    const question = isImpostor ? state.questionPair.questionImposter : state.questionPair.question;

    cardContainer.innerHTML = `
        <p class="instruction">Pass the device to ${player}</p>
        <div class="card">
            <div class="card-inner">
                <div class="card-front">
                    <p>Tap to reveal your question</p>
                </div>
                <div class="card-back">
                    <p>${question}</p>
                    <textarea id="answer-input" rows="3"></textarea>
                    <button id="submit-answer" style="margin-top: 10px;" disabled>Submit</button>
                </div>
            </div>
        </div>
        <div class="card-actions">
            <button id="restart-turn" class="muted">Restart Round</button>
        </div>
    `;
    app.appendChild(cardContainer);

    // Scope queries to the newly created container to avoid selecting unrelated nodes
    const card = cardContainer.querySelector('.card');
    const cardInner = cardContainer.querySelector('.card-inner');
    const cardFront = cardContainer.querySelector('.card-front');
    const submitButton = cardContainer.querySelector('#submit-answer');
    const answerInput = cardContainer.querySelector('#answer-input');

    // Color the card border/background for this player
    const playerColor = PLAYER_COLORS[state.currentPlayerIndex % PLAYER_COLORS.length];
    if (card) {
        card.style.borderColor = playerColor;
        const front = card.querySelector('.card-front');
        const back = card.querySelector('.card-back');
        if (front) front.style.boxShadow = `0 6px 18px ${playerColor}33`;
        if (back) back.style.boxShadow = `0 6px 18px ${playerColor}33`;
    }

    // Attach click to the front face specifically so tapping reliably flips the card.
    cardFront.addEventListener('click', (e) => {
        // Ignore clicks that target input controls (defensive)
        if (e.target.closest('#submit-answer') || e.target.closest('#answer-input')) return;
        // Add flipped class to the card (CSS uses `.card.flipped .card-inner`)
        card.classList.add('flipped');
        setTimeout(() => {
            submitButton.disabled = false;
            answerInput.focus();
        }, 600); // Duration of the flip animation
    }, { once: true }); // Only allow flipping once per card view

    submitButton.addEventListener('click', () => {
        const answer = answerInput.value;
        state.answers[state.currentPlayerIndex] = answer;

        if (state.currentPlayerIndex < state.players.length - 1) {
            state.currentPlayerIndex++;
            render();
        } else {
            // All players answered — show a prompt screen with a single "Reveal answers" button
            state.currentPage = 'revealPrompt';
            render();
        }
    });

    // Allow restarting the round from the card view (keeps players)
    const restartTurn = cardContainer.querySelector('#restart-turn');
    if (restartTurn) {
        restartTurn.addEventListener('click', () => {
            const ok = confirm('Restart round and reshuffle question/impostor?');
            if (!ok) return;
            Object.assign(state, {
                questionPair: null,
                impostor: null,
                answers: [],
                currentPage: 'setup',
                currentPlayerIndex: 0,
            });
            render();
        });
    }
}

function renderDiscussion() {
    const discussionDiv = document.createElement('div');
    discussionDiv.className = 'discussion-screen';

    let playerAnswersHtml = '';
    for (let i = 0; i < state.players.length; i++) {
        const color = PLAYER_COLORS[i % PLAYER_COLORS.length];
        playerAnswersHtml += `
            <div class="player-answer" style="border-left:6px solid ${color}; padding-left:0.75rem;">
                <p><strong style="color:${color}">${state.players[i]}:</strong></p>
                <p>${state.answers[i]}</p>
            </div>
        `;
    }

    discussionDiv.innerHTML = `
        <h1>Discussion</h1>
        <h2>${state.questionPair.question}</h2>
        <div class="player-answers-container">
            ${playerAnswersHtml}
        </div>
        <button id="reveal-impostor">Reveal Impostor</button>
    `;
    app.appendChild(discussionDiv);

    document.getElementById('reveal-impostor').addEventListener('click', () => {
        state.currentPage = 'reveal';
        render();
    });
}

function renderRevealPrompt() {
    const promptDiv = document.createElement('div');
    promptDiv.className = 'reveal-prompt-screen';
    promptDiv.innerHTML = `
        <button id="reveal-answers">Reveal Answers</button>
    `;
    app.appendChild(promptDiv);

    document.getElementById('reveal-answers').addEventListener('click', () => {
        state.currentPage = 'discussion';
        render();
    });
}

function renderReveal() {
    const revealDiv = document.createElement('div');
    revealDiv.className = 'reveal-screen';

    const impostorIndex = state.players.indexOf(state.impostor);
    const impostorAnswer = state.answers[impostorIndex];

    revealDiv.innerHTML = `
        <h1>The Impostor was...</h1>
        <h2 style="color:${PLAYER_COLORS[impostorIndex % PLAYER_COLORS.length]}">${state.impostor}</h2>
        <div class="impostor-details">
            <p><strong>Impostor's Question:</strong> ${state.questionPair.questionImposter}</p>
            <p><strong>Impostor's Answer:</strong> ${impostorAnswer}</p>
        </div>
        <button id="restart-game">Restart Game</button>
    `;
    app.appendChild(revealDiv);

    document.getElementById('restart-game').addEventListener('click', () => {
        // Keep players (so restart remembers names), reset game-specific state
        Object.assign(state, {
            // keep `players` as-is (persisted in localStorage)
            questionPair: null,
            impostor: null,
            answers: [],
            currentPage: 'setup',
            currentPlayerIndex: 0,
        });
        render();
    });
}




const themeToggle = document.getElementById('theme-toggle');
const body = document.body;

function setInitialTheme() {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
        body.dataset.theme = 'dark';
    } else {
        body.dataset.theme = 'light';
    }
    // Ensure the toggle shows the correct emoji and ARIA state.
    if (themeToggle) {
        themeToggle.setAttribute('role', 'switch');
        themeToggle.setAttribute('aria-checked', body.dataset.theme === 'dark' ? 'true' : 'false');
        // Per design: show sun emoji when in dark mode, moon when in light mode
        themeToggle.textContent = body.dataset.theme === 'dark' ? '☀️' : '🌙';
        themeToggle.title = body.dataset.theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
    }
    render();
}

if (themeToggle) {
    // Clicking toggles theme and updates emoji/ARIA/title
    themeToggle.addEventListener('click', () => {
        if (body.dataset.theme === 'dark') {
            body.dataset.theme = 'light';
            themeToggle.setAttribute('aria-checked', 'false');
            themeToggle.textContent = '🌙';
            themeToggle.title = 'Switch to dark theme';
        } else {
            body.dataset.theme = 'dark';
            themeToggle.setAttribute('aria-checked', 'true');
            themeToggle.textContent = '☀️';
            themeToggle.title = 'Switch to light theme';
        }
    });
}

// Register a simple service worker for offline capability
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch((err) => {
            // registration failed — ignore silently
            console.warn('SW registration failed:', err);
        });
    });
}

setInitialTheme();

