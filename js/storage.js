// storage.js — LocalStorage 래퍼

const STORAGE_KEY = 'hanjaplace_save';

const DEFAULT_STATE = {
  player: {
    level: 1,
    xp: 0,
    coins: 100,  // 시작 코인 (첫 아이템 구매 가능하도록)
    hearts: 5,
    streak: 0,
    lastPlayedDate: '',
    totalGamesPlayed: 0,
  },
  kanji: {}, // { "水": { mastery: 0, correctCount: 0, wrongCount: 0, learned: false, lastSeen: 0 } }
  garden: {
    objects: [],   // [{ id, type, emoji, x, y, placed: true }]
    stage: 1,
    unlockedAreas: 1,
  },
  inventory: [], // [{ id, type, emoji, name, count }]
  recentKanji: [], // 최근 출제된 한자 ID (중복 방지용, 최대 5개)
};

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return JSON.parse(JSON.stringify(DEFAULT_STATE));
    const saved = JSON.parse(raw);
    // 기본값과 병합 (새 필드 누락 방지)
    return deepMerge(JSON.parse(JSON.stringify(DEFAULT_STATE)), saved);
  } catch (e) {
    console.warn('저장 데이터 로드 실패, 초기화합니다.', e);
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('저장 실패:', e);
  }
}

export function clearState() {
  localStorage.removeItem(STORAGE_KEY);
}

function deepMerge(target, source) {
  if (source === null || source === undefined) return target;
  if (typeof source !== 'object') return source;
  if (Array.isArray(source)) return source;
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (key in target && typeof target[key] === 'object' && !Array.isArray(target[key])) {
      result[key] = deepMerge(target[key], source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}
