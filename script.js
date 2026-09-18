/**
 * Memory Match — Pure Vanilla JavaScript Game Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- Constants & Config ---
  const CARD_PAIRS = [
    { id: 'rocket', symbol: '🚀', label: 'Rocket' },
    { id: 'planet', symbol: '🪐', label: 'Planet' },
    { id: 'gem', symbol: '💎', label: 'Gemstone' },
    { id: 'lightning', symbol: '⚡', label: 'Lightning' },
    { id: 'mushroom', symbol: '🍄', label: 'Mushroom' },
    { id: 'palette', symbol: '🎨', label: 'Artist Palette' },
    { id: 'fox', symbol: '🦊', label: 'Fox' },
    { id: 'clover', symbol: '🍀', label: 'Four Leaf Clover' }
  ];
  const TOTAL_PAIRS = CARD_PAIRS.length;

  // --- DOM Elements ---
  const gameGrid = document.getElementById('game-grid');
  const movesDisplay = document.getElementById('moves-count');
  const matchesDisplay = document.getElementById('matches-count');
  const timerDisplay = document.getElementById('timer-display');
  const restartButton = document.getElementById('btn-restart');
  const winModal = document.getElementById('win-modal');
  const playAgainButton = document.getElementById('btn-play-again');
  
  const finalTimeDisplay = document.getElementById('final-time');
  const finalMovesDisplay = document.getElementById('final-moves');
  const finalMatchesDisplay = document.getElementById('final-matches');

  // --- Game State Variables ---
  let cards = [];
  let firstCard = null;
  let secondCard = null;
  let isLocked = false;
  let moves = 0;
  let matches = 0;
  let timer = null;
  let secondsElapsed = 0;
  let isTimerRunning = false;
  let gameVersion = 0;

  /**
   * Initializes or resets the entire game board.
   */
  function initGame() {
    gameVersion += 1;
    resetGameState();
    createCards();
    renderCards();
    updateUI();
  }

  /**
   * Resets variables, timer, and modal state.
   */
  function resetGameState() {
    stopTimer();
    secondsElapsed = 0;
    isTimerRunning = false;
    moves = 0;
    matches = 0;
    firstCard = null;
    secondCard = null;
    isLocked = false;
    timerDisplay.textContent = '00:00';
    winModal.classList.add('hidden');
  }

  /**
   * Generates a duplicated and shuffled deck of 16 cards.
   */
  function createCards() {
    // Duplicate the 8 pair items to make 16 total cards
    const deck = [...CARD_PAIRS, ...CARD_PAIRS].map((card, index) => ({
      ...card,
      instanceId: `${card.id}-${index}`
    }));

    cards = shuffleArray(deck);
  }

  /**
   * Fisher-Yates shuffle algorithm.
   */
  function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /**
   * Renders the cards into the DOM with accessible markup.
   */
  function renderCards() {
    gameGrid.innerHTML = '';

    cards.forEach((cardData, index) => {
      const cardBtn = document.createElement('button');
      cardBtn.classList.add('card');
      cardBtn.setAttribute('type', 'button');
      cardBtn.setAttribute('role', 'gridcell');
      cardBtn.setAttribute('aria-label', `Card ${index + 1}: Face down`);
      cardBtn.setAttribute('data-id', cardData.id);
      cardBtn.setAttribute('data-symbol', cardData.symbol);
      cardBtn.setAttribute('data-name', cardData.label);

      cardBtn.innerHTML = `
        <div class="card-inner">
          <div class="card-face card-back">
            <svg class="card-back-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div class="card-face card-front" aria-hidden="true">
            ${cardData.symbol}
          </div>
        </div>
      `;

      cardBtn.addEventListener('click', () => handleCardClick(cardBtn));
      gameGrid.appendChild(cardBtn);
    });
  }

  /**
   * Handles user interaction when clicking or pressing Enter on a card.
   */
  function handleCardClick(cardBtn) {
    // Prevent interaction if locked, already flipped, or already matched
    if (
      isLocked ||
      cardBtn === firstCard ||
      cardBtn.classList.contains('is-flipped') ||
      cardBtn.classList.contains('is-matched')
    ) {
      return;
    }

    // Start timer on the first card interaction
    if (!isTimerRunning) {
      startTimer();
    }

    flipCard(cardBtn);

    // Track first or second selected card
    if (!firstCard) {
      firstCard = cardBtn;
    } else {
      secondCard = cardBtn;
      // Increment moves on selecting the second card of a pair
      moves += 1;
      updateUI();
      checkForMatch();
    }
  }

  /**
   * Flips a card visually and updates its ARIA label.
   */
  function flipCard(cardBtn) {
    cardBtn.classList.add('is-flipped');
    cardBtn.setAttribute('aria-label', `Card face up: ${cardBtn.dataset.name}`);
  }

  /**
   * Unflips non-matching cards.
   */
  function unflipCard(cardBtn) {
    cardBtn.classList.remove('is-flipped', 'is-mismatched');
    cardBtn.setAttribute('aria-label', `Card: Face down`);
  }

  /**
   * Compares the two flipped cards.
   */
  function checkForMatch() {
    isLocked = true;
    const isMatch = firstCard.dataset.id === secondCard.dataset.id;

    if (isMatch) {
      handleMatch();
    } else {
      handleMismatch();
    }
  }

  /**
   * Handles successful match logic.
   */
  function handleMatch() {
    const currentVersion = gameVersion;
    matches += 1;
    updateUI();

    setTimeout(() => {
      if (currentVersion !== gameVersion) return;
      firstCard.classList.add('is-matched');
      secondCard.classList.add('is-matched');
      
      firstCard.disabled = true;
      secondCard.disabled = true;
      
      firstCard.setAttribute('aria-label', `Matched pair: ${firstCard.dataset.name}`);
      secondCard.setAttribute('aria-label', `Matched pair: ${secondCard.dataset.name}`);

      resetTurn();

      // Check win condition
      if (matches === TOTAL_PAIRS) {
        handleWin();
      }
    }, 250);
  }

  /**
   * Handles mismatch logic and delayed card reset.
   */
  function handleMismatch() {
    const currentVersion = gameVersion;
    setTimeout(() => {
      if (currentVersion !== gameVersion) return;
      firstCard.classList.add('is-mismatched');
      secondCard.classList.add('is-mismatched');
    }, 200);

    setTimeout(() => {
      if (currentVersion !== gameVersion) return;
      unflipCard(firstCard);
      unflipCard(secondCard);
      resetTurn();
    }, 900);
  }

  /**
   * Resets selection state for the next turn.
   */
  function resetTurn() {
    firstCard = null;
    secondCard = null;
    isLocked = false;
  }

  /**
   * Timer methods.
   */
  function startTimer() {
    isTimerRunning = true;
    clearInterval(timer);
    timer = setInterval(() => {
      secondsElapsed += 1;
      timerDisplay.textContent = formatTime(secondsElapsed);
    }, 1000);
  }

  function stopTimer() {
    clearInterval(timer);
    timer = null;
    isTimerRunning = false;
  }

  function formatTime(totalSeconds) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  /**
   * Updates stat numbers in header.
   */
  function updateUI() {
    movesDisplay.textContent = moves;
    matchesDisplay.textContent = `${matches}/${TOTAL_PAIRS}`;
  }

  /**
   * Handles win state and modal presentation.
   */
  function handleWin() {
    stopTimer();

    finalTimeDisplay.textContent = formatTime(secondsElapsed);
    finalMovesDisplay.textContent = moves;
    finalMatchesDisplay.textContent = `${matches}/${TOTAL_PAIRS}`;

    setTimeout(() => {
      winModal.classList.remove('hidden');
      playAgainButton.focus();
    }, 500);
  }

  // --- Event Listeners ---
  restartButton.addEventListener('click', () => {
    initGame();
  });

  playAgainButton.addEventListener('click', () => {
    initGame();
  });

  // Close modal on Escape key if open
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !winModal.classList.contains('hidden')) {
      initGame();
    }
  });

  // Start the game on initial load
  initGame();
});