// mini-game.js — 3×3 스와이프 & 탭 연결 과일 게임

const ALL_FRUITS = ['🍎', '🍊', '🍇', '🍓', '🍑', '🍋'];
// 한 판에 3종류의 과일만 사용 -> 9칸 그리드에서 3매칭 보장
let activeFruits = ['🍎', '🍊', '🍇'];

let grid = [];
let selectedCells = [];   // 현재 선택/드래그 중인 셀 인덱스 배열
let isPointerDown = false;
let pointerMoved = false;
let timeLeft = 30;
let timerInterval = null;
let score = 0;             // 제거한 매칭 횟수
let onGameEnd = null;      // 콜백

const MIN_MATCH = 3;       // 같은 과일 최소 3개

// ─── 공개 API ───────────────────────────────────────────────

export function initMiniGame(container, endCallback) {
  onGameEnd = endCallback;
  score = 0;
  timeLeft = 30;
  selectedCells = [];
  isPointerDown = false;
  pointerMoved = false;

  // 매 판마다 6개 중 3개의 과일을 랜덤 선택
  const shuffled = [...ALL_FRUITS].sort(() => Math.random() - 0.5);
  activeFruits = shuffled.slice(0, 3);

  grid = generateValidGrid();
  render(container);
  startTimer(container);

  const scoreEl = container.querySelector('#minigame-score-text');
  if (scoreEl) scoreEl.textContent = '0번';
}

export function destroyMiniGame() {
  if (timerInterval) clearInterval(timerInterval);
  selectedCells = [];
}

// ─── 그리드 생성 (최소 1개 이상의 3매칭 보장) ───────────────────

function generateValidGrid() {
  let attempts = 0;
  while (attempts < 50) {
    const candidate = [];
    // 3종류 과일을 각 3개씩 균등 배분하여 9칸 생성
    activeFruits.forEach(f => {
      candidate.push(f, f, f);
    });
    // 섞기
    candidate.sort(() => Math.random() - 0.5);

    if (hasAnyValidMatch(candidate)) {
      return candidate;
    }
    attempts++;
  }

  // fallback: 첫 번째 행에 같은 과일 3개 배치 보장
  const fb = [
    activeFruits[0], activeFruits[0], activeFruits[0],
    activeFruits[1], activeFruits[1], activeFruits[1],
    activeFruits[2], activeFruits[2], activeFruits[2]
  ];
  return fb;
}

// 인접한 3매칭이 존재하는지 검사 (8방향 인접 DFS)
function hasAnyValidMatch(board) {
  for (let i = 0; i < 9; i++) {
    const fruit = board[i];
    if (!fruit) continue;
    if (findMatchFrom(board, i, fruit, [i])) {
      return true;
    }
  }
  return false;
}

function findMatchFrom(board, currentIdx, fruit, path) {
  if (path.length >= MIN_MATCH) return true;
  const neighbors = getAdjacentIndices(currentIdx);
  for (const n of neighbors) {
    if (!path.includes(n) && board[n] === fruit) {
      if (findMatchFrom(board, n, fruit, [...path, n])) {
        return true;
      }
    }
  }
  return false;
}

function getAdjacentIndices(idx) {
  const r = Math.floor(idx / 3);
  const c = idx % 3;
  const list = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < 3 && nc >= 0 && nc < 3) {
        list.push(nr * 3 + nc);
      }
    }
  }
  return list;
}

// ─── 렌더링 ──────────────────────────────────────────────────

function render(container) {
  const gameEl = container.querySelector('#minigame-grid');
  if (!gameEl) return;

  gameEl.innerHTML = '';
  grid.forEach((fruit, idx) => {
    const cell = document.createElement('div');
    cell.className = 'mg-cell';
    cell.dataset.idx = idx;
    cell.textContent = fruit || '';
    if (!fruit) cell.classList.add('mg-cell--empty');
    gameEl.appendChild(cell);
  });

  attachEvents(gameEl);
}

function renderUpdate(container) {
  const gameEl = container.querySelector('#minigame-grid');
  if (!gameEl) return;

  grid.forEach((fruit, idx) => {
    const cell = gameEl.children[idx];
    if (!cell) return;
    if (fruit === null) {
      cell.classList.add('mg-cell--empty');
      cell.textContent = '';
    } else {
      cell.classList.remove('mg-cell--empty');
      cell.textContent = fruit;
    }
    cell.classList.remove('mg-cell--selected', 'mg-cell--match', 'mg-cell--wrong');
  });
}

// ─── 이벤트 (드래그 + 탭 듀얼 지원) ──────────────────────────────

function attachEvents(gameEl) {
  gameEl.addEventListener('pointerdown', (e) => onPointerDown(e, gameEl));
  gameEl.addEventListener('pointermove', (e) => onPointerMove(e, gameEl));
  window.addEventListener('pointerup', (e) => onPointerUp(e, gameEl));
  window.addEventListener('pointercancel', (e) => onPointerUp(e, gameEl));
}

function getCellAtPoint(gameEl, x, y) {
  const cells = gameEl.querySelectorAll('.mg-cell');
  for (const cell of cells) {
    const rect = cell.getBoundingClientRect();
    if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
      return parseInt(cell.dataset.idx, 10);
    }
  }
  return -1;
}

function onPointerDown(e, gameEl) {
  const idx = getCellAtPoint(gameEl, e.clientX, e.clientY);
  if (idx < 0 || grid[idx] === null) return;

  isPointerDown = true;
  pointerMoved = false;

  // 이미 선택된 셀 목록이 있고 탭 모드로 이어가는 경우
  if (selectedCells.length > 0) {
    const last = selectedCells[selectedCells.length - 1];
    const firstFruit = grid[selectedCells[0]];

    // 이미 선택한 셀을 다시 탭하면 선택 취소
    if (selectedCells.includes(idx)) {
      if (idx === last && selectedCells.length > 1) {
        selectedCells.pop();
        updateSelectionVisual(gameEl);
        return;
      }
    } else if (isAdjacent(last, idx) && grid[idx] === firstFruit) {
      // 인접한 같은 과일 탭 -> 추가
      selectedCells.push(idx);
      updateSelectionVisual(gameEl);
      if (navigator.vibrate) navigator.vibrate(15);

      // 3개 완성 시 자동 매칭
      if (selectedCells.length >= MIN_MATCH) {
        finishMatch(gameEl);
      }
      return;
    }
  }

  // 새로운 시작
  selectedCells = [idx];
  updateSelectionVisual(gameEl);
  if (navigator.vibrate) navigator.vibrate(10);
}

function onPointerMove(e, gameEl) {
  if (!isPointerDown) return;
  const idx = getCellAtPoint(gameEl, e.clientX, e.clientY);
  if (idx < 0 || grid[idx] === null) return;

  pointerMoved = true;

  if (selectedCells.includes(idx)) {
    // 이전 셀로 되돌아가는 제스처 지원
    if (selectedCells.length >= 2 && idx === selectedCells[selectedCells.length - 2]) {
      selectedCells.pop();
      updateSelectionVisual(gameEl);
    }
    return;
  }

  // 인접 여부 및 동일 과일 여부 검사
  const last = selectedCells[selectedCells.length - 1];
  if (last !== undefined && !isAdjacent(last, idx)) return;

  const firstFruit = grid[selectedCells[0]];
  if (grid[idx] !== firstFruit) return;

  selectedCells.push(idx);
  updateSelectionVisual(gameEl);
  if (navigator.vibrate) navigator.vibrate(20);
}

function onPointerUp(e, gameEl) {
  if (!isPointerDown) return;
  isPointerDown = false;

  if (pointerMoved) {
    // 드래그 제스처로 3개 이상 연결했으면 매칭 처리
    if (selectedCells.length >= MIN_MATCH) {
      finishMatch(gameEl);
    } else {
      // 드래그했지만 미완성인 경우 흔들기 후 초기화
      if (selectedCells.length > 1) {
        showMatchEffect(gameEl, selectedCells, false);
      }
      setTimeout(() => clearSelection(gameEl), 250);
      selectedCells = [];
    }
  } else {
    // 단순 탭인 경우: 3개 완성되었으면 매칭, 아니면 선택 상태 유지(다음 탭 기다림)
    if (selectedCells.length >= MIN_MATCH) {
      finishMatch(gameEl);
    }
  }
}

function finishMatch(gameEl) {
  if (selectedCells.length < MIN_MATCH) return;

  score += 1;
  const matched = [...selectedCells];
  selectedCells = [];

  // 매칭 성공 효과
  showMatchEffect(gameEl, matched, true);
  if (navigator.vibrate) navigator.vibrate([30, 50, 30]);

  // 그리드에서 제거
  matched.forEach(idx => { grid[idx] = null; });

  setTimeout(() => {
    refillGrid();
    const screenEl = document.getElementById('screen-minigame');
    if (screenEl) renderUpdate(screenEl);

    const scoreEl = document.getElementById('minigame-score-text');
    if (scoreEl) scoreEl.textContent = `${score}번`;

    checkWin();
  }, 350);
}

function isAdjacent(a, b) {
  const ax = a % 3, ay = Math.floor(a / 3);
  const bx = b % 3, by = Math.floor(b / 3);
  return Math.abs(ax - bx) <= 1 && Math.abs(ay - by) <= 1;
}

function updateSelectionVisual(gameEl) {
  const cells = gameEl.querySelectorAll('.mg-cell');
  cells.forEach((cell, i) => {
    if (selectedCells.includes(i)) {
      cell.classList.add('mg-cell--selected');
    } else {
      cell.classList.remove('mg-cell--selected');
    }
  });
}

function showMatchEffect(gameEl, indices, success) {
  const cells = gameEl.querySelectorAll('.mg-cell');
  indices.forEach(i => {
    const cell = cells[i];
    if (!cell) return;
    cell.classList.remove('mg-cell--selected');
    cell.classList.add(success ? 'mg-cell--match' : 'mg-cell--wrong');
  });
}

function clearSelection(gameEl) {
  const cells = gameEl.querySelectorAll('.mg-cell');
  cells.forEach(c => c.classList.remove('mg-cell--selected', 'mg-cell--wrong'));
}

// ─── 그리드 보충 ─────────────────────────────────────────────

function refillGrid() {
  for (let i = 0; i < 9; i++) {
    if (grid[i] === null) {
      grid[i] = activeFruits[Math.floor(Math.random() * activeFruits.length)];
    }
  }

  // 만약 보충 후 매칭이 아예 없는 교착상태면 유효한 그리드로 재생성
  if (!hasAnyValidMatch(grid)) {
    grid = generateValidGrid();
  }
}

// ─── 승리 체크 ───────────────────────────────────────────────

function checkWin() {
  // 3번 이상 매칭 시 성공으로 바로 한자 퀴즈 전환 가능 (빠른 템포)
  if (score >= 3) {
    endGame('excellent');
  }
}

// ─── 타이머 ──────────────────────────────────────────────────

function startTimer(container) {
  const timerEl = container.querySelector('#minigame-timer');
  const timerBarEl = container.querySelector('#minigame-timer-bar');

  updateTimerDisplay(timerEl, timerBarEl);

  timerInterval = setInterval(() => {
    timeLeft -= 1;
    updateTimerDisplay(timerEl, timerBarEl);

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      endGame(score >= 2 ? 'excellent' : score >= 1 ? 'good' : 'normal');
    }
  }, 1000);
}

function updateTimerDisplay(timerEl, timerBarEl) {
  if (timerEl) timerEl.textContent = timeLeft;
  if (timerBarEl) {
    const pct = (timeLeft / 30) * 100;
    timerBarEl.style.width = pct + '%';
    timerBarEl.style.background = timeLeft > 10
      ? 'var(--primary)'
      : timeLeft > 5 ? '#f59e0b' : '#ef4444';
  }
}

// ─── 게임 종료 ───────────────────────────────────────────────

function endGame(grade) {
  if (timerInterval) clearInterval(timerInterval);
  if (onGameEnd) onGameEnd(grade, score);
}

export function getGradeLabel(grade) {
  return { excellent: 'EXCELLENT!', good: 'GOOD!', normal: 'NICE!' }[grade] || 'NICE!';
}

export function getGradeRewards(grade) {
  return {
    excellent: { xp: 30, coins: 70 },
    good:      { xp: 20, coins: 50 },
    normal:    { xp: 10, coins: 30 },
  }[grade] || { xp: 10, coins: 30 };
}
