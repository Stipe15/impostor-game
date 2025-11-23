const app = document.getElementById('app');

const state = {
    players: ['', '', ''],
    questionPair: null,
    impostor: null,
    answers: [],
    currentPage: 'setup', // setup, cards, discussion, reveal
    currentPlayerIndex: 0,
};

function render() {
    app.innerHTML = '';
    switch (state.currentPage) {
        case 'setup':
            renderSetup();
            break;
        case 'cards':
            renderCards();
            break;
        case 'discussion':
            renderDiscussion();
            break;
        case 'reveal':
            renderReveal();
            break;
    }
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
            <input type="text" placeholder="Player ${i + 1}" value="${player || ''}">
            <button class="remove-player" data-index="${i}">X</button>
        `;
        playerInputDiv.querySelector('input').addEventListener('change', (e) => {
            state.players[i] = e.target.value;
            updateStartButton();
        });
        playerInputDiv.querySelector('.remove-player').addEventListener('click', (e) => {
            removePlayer(parseInt(e.target.dataset.index));
        });
        playerInputsDiv.appendChild(playerInputDiv);
    });
    updateAddButton();
    updateStartButton();
}

function addPlayer() {
    if (state.players.length < 5) {
        state.players.push('');
        render();
    }
}

function removePlayer(index) {
    state.players.splice(index, 1);
    render();
}

function updateAddButton() {
    document.getElementById('add-player').disabled = state.players.length >= 5;
}

function updateStartButton() {
    const filledPlayers = state.players.filter(p => p.trim() !== '').length;
    document.getElementById('start-game').disabled = filledPlayers < 3 || filledPlayers > 5;
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
                    <button id="submit-answer">Submit</button>
                </div>
            </div>
        </div>
    `;
    app.appendChild(cardContainer);

    const card = document.querySelector('.card');
    card.addEventListener('click', () => {
        card.classList.add('flipped');
    });

    document.getElementById('submit-answer').addEventListener('click', () => {
        const answer = document.getElementById('answer-input').value;
        state.answers[state.currentPlayerIndex] = answer;

        if (state.currentPlayerIndex < state.players.length - 1) {
            state.currentPlayerIndex++;
            render();
        } else {
            state.currentPage = 'discussion';
            render();
        }
    });
}

function renderDiscussion() {
    const discussionDiv = document.createElement('div');
    discussionDiv.className = 'discussion-screen';

    let playerAnswersHtml = '';
    for (let i = 0; i < state.players.length; i++) {
        playerAnswersHtml += `
            <div class="player-answer">
                <p><strong>${state.players[i]}:</strong></p>
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

function renderReveal() {
    const revealDiv = document.createElement('div');
    revealDiv.className = 'reveal-screen';

    const impostorIndex = state.players.indexOf(state.impostor);
    const impostorAnswer = state.answers[impostorIndex];

    revealDiv.innerHTML = `
        <h1>The Impostor was...</h1>
        <h2>${state.impostor}</h2>
        <div class="impostor-details">
            <p><strong>Impostor's Question:</strong> ${state.questionPair.questionImposter}</p>
            <p><strong>Impostor's Answer:</strong> ${impostorAnswer}</p>
        </div>
        <button id="restart-game">Restart Game</button>
    `;
    app.appendChild(revealDiv);

    document.getElementById('restart-game').addEventListener('click', () => {
        Object.assign(state, {
            players: [],
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
    render();
}

themeToggle.addEventListener('click', () => {
    if (body.dataset.theme === 'dark') {
        body.dataset.theme = 'light';
    } else {
        body.dataset.theme = 'dark';
    }
});

setInitialTheme();

