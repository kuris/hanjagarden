// storage.js — LocalStorage 래퍼

const STORAGE_KEY = 'hanjaplace_save';

const DEFAULT_OBJECTS = [
  { id: 'cottage_1', type: 'cozy_cottage', emoji: '🏡', name: '빨간 지붕 오두막', x: 1, y: 1 },
  { id: 'windmill_1', type: 'wind_mill', emoji: '🛖', name: '언덕 위 풍차', x: 4, y: 0 },
  { id: 'fountain_1', type: 'grand_fountain', emoji: '⛲', name: '대리석 물 분수대', x: 2, y: 2 },
  { id: 'apple_1', type: 'apple_tree', emoji: '🍎', name: '달콤한 사과나무', x: 0, y: 2 },
  { id: 'peach_1', type: 'peach_tree', emoji: '🍑', name: '향긋한 복숭아나무', x: 5, y: 1 },
  { id: 'sakura_1', type: 'cherry_blossom', emoji: '🌸', name: '만개한 벚꽃나무', x: 4, y: 4 },
  { id: 'pine_1', type: 'pine_tree', emoji: '🌲', name: '피톤치드 침엽수', x: 0, y: 0 },
  { id: 'pond_1', type: 'water_pond', emoji: '🫧', name: '맑은 연못과 연꽃', x: 4, y: 2 },
  { id: 'duck_1', type: 'duck_statue', emoji: '🦆', name: '귀여운 청둥오리', x: 5, y: 3 },
  { id: 'picnic_1', type: 'picnic_set', emoji: '🧺', name: '피크닉 세트', x: 2, y: 4 },
  { id: 'bench_1', type: 'picnic_bench', emoji: '🪑', name: '통나무 벤치', x: 1, y: 4 },
  { id: 'campfire_1', type: 'campfire', emoji: '🔥', name: '모닥불 세트', x: 3, y: 3 },
  { id: 'tent_1', type: 'camp_tent', emoji: '⛺', name: '숲속 캠핑 텐트', x: 0, y: 4 },
  { id: 'tulip_1', type: 'flower_tulip', emoji: '🌷', name: '빨간 튤립 화단', x: 2, y: 1 },
  { id: 'dandelion_1', type: 'flower_dandelion', emoji: '🌼', name: '노란 민들레 화단', x: 3, y: 1 },
  { id: 'cosmos_1', type: 'flower_cosmos', emoji: '🌸', name: '분홍 코스모스', x: 3, y: 4 },
  { id: 'lantern_1', type: 'lantern_post', emoji: '🏮', name: '따뜻한 가든 랜턴', x: 2, y: 0 },
  { id: 'rainbow_1', type: 'rainbow_arch', emoji: '🌈', name: '무지개 아치 게이트', x: 3, y: 0 },
];

const DEFAULT_STATE = {
  player: {
    level: 5,
    xp: 450,
    coins: 9999,  // 모든 아이템 자유롭게 테스트 가능한 넉넉한 코인
    hearts: 5,
    streak: 3,
    lastPlayedDate: '',
    totalGamesPlayed: 10,
  },
  kanji: {},
  garden: {
    objects: DEFAULT_OBJECTS,   // 풀세트 3D 아이템 배치
    stage: 5,
    unlockedAreas: 5,
  },
  inventory: [
    { id: 'apple_tree', emoji: '🍎', name: '달콤한 사과나무', count: 3 },
    { id: 'cherry_blossom', emoji: '🌸', name: '만개한 벚꽃나무', count: 2 },
    { id: 'grand_fountain', emoji: '⛲', name: '대리석 물 분수대', count: 1 },
    { id: 'cozy_cottage', emoji: '🏡', name: '빨간 지붕 오두막', count: 1 },
    { id: 'flower_tulip', emoji: '🌷', name: '빨간 튤립 화단', count: 5 },
    { id: 'camp_tent', emoji: '⛺', name: '숲속 캠핑 텐트', count: 2 },
    { id: 'wind_mill', emoji: '🛖', name: '언덕 위 미니 풍차', count: 1 },
    { id: 'shrine_torii', emoji: '⛩️', name: '신비로운 숲의 사당', count: 1 },
  ],
  recentKanji: [],
};

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return JSON.parse(JSON.stringify(DEFAULT_STATE));
    const saved = JSON.parse(raw);
    const merged = deepMerge(JSON.parse(JSON.stringify(DEFAULT_STATE)), saved);
    
    // 만약 기존 저장 데이터의 garden.objects가 비어있다면 풍성한 풀세트로 채워줌
    if (!merged.garden.objects || merged.garden.objects.length === 0) {
      merged.garden.objects = JSON.parse(JSON.stringify(DEFAULT_OBJECTS));
      merged.garden.stage = 5;
      merged.player.coins = Math.max(merged.player.coins, 1000);
    }
    return merged;
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
