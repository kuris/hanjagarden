// garden.js — Three.js 기반 3D 동물의 숲 디오라마 정원 시스템

import { getState, placeGardenObject, getGardenStage, addCoins, save } from './game-state.js';
import { sound } from './sound.js';

// ─── 정원 아이템 카탈로그 (동물의 숲 테마) ──────────────────────

export const GARDEN_ITEMS = [
  // Stage 1 — 아늑한 시작
  { id: 'flower_tulip',     emoji: '🌷', name: '빨간 튤립 화단',   cost: 30,  stage: 1, category: 'plant',     type: 'flower_tulip' },
  { id: 'flower_dandelion', emoji: '🌼', name: '노란 민들레 화단', cost: 25,  stage: 1, category: 'plant',     type: 'flower_dandelion' },
  { id: 'flower_cosmos',    emoji: '🌸', name: '분홍 코스모스',    cost: 35,  stage: 1, category: 'plant',     type: 'flower_cosmos' },
  { id: 'wood_stump',       emoji: '🪵', name: '통나무 그루터기',  cost: 30,  stage: 1, category: 'furniture', type: 'stump' },
  { id: 'garden_stone',     emoji: '🪨', name: '이끼 낀 둥근 돌',  cost: 20,  stage: 1, category: 'deco',      type: 'stone' },

  // Stage 2 — 과수원 & 정원
  { id: 'apple_tree',       emoji: '🍎', name: '달콤한 사과나무',  cost: 80,  stage: 2, category: 'plant',     type: 'apple_tree' },
  { id: 'peach_tree',       emoji: '🍑', name: '향긋한 복숭아나무',cost: 90,  stage: 2, category: 'plant',     type: 'peach_tree' },
  { id: 'pine_tree',        emoji: '🌲', name: '피톤치드 침엽수',  cost: 75,  stage: 2, category: 'plant',     type: 'pine_tree' },
  { id: 'lantern_post',     emoji: '🏮', name: '따뜻한 가든 랜턴', cost: 70,  stage: 2, category: 'furniture', type: 'lantern' },
  { id: 'white_fence',      emoji: '🪵', name: '하얀 목재 울타리', cost: 45,  stage: 2, category: 'furniture', type: 'fence' },

  // Stage 3 — 피크닉 & 연못
  { id: 'picnic_bench',     emoji: '🪑', name: '통나무 가든 벤치', cost: 120, stage: 3, category: 'furniture', type: 'bench' },
  { id: 'picnic_set',       emoji: '🧺', name: '피크닉 바구니 세트',cost: 110,stage: 3, category: 'furniture', type: 'picnic' },
  { id: 'water_pond',       emoji: '🫧', name: '맑은 연못과 연꽃', cost: 160, stage: 3, category: 'nature',    type: 'pond' },
  { id: 'duck_statue',      emoji: '🦆', name: '귀여운 청둥오리',  cost: 100, stage: 3, category: 'deco',      type: 'duck' },

  // Stage 4 — 캠핑 & 오두막
  { id: 'cozy_cottage',     emoji: '🏡', name: '빨간 지붕 오두막', cost: 350, stage: 4, category: 'structure', type: 'cottage' },
  { id: 'camp_tent',        emoji: '⛺', name: '숲속 캠핑 텐트',   cost: 220, stage: 4, category: 'furniture', type: 'tent' },
  { id: 'campfire',         emoji: '🔥', name: '모닥불 세트',      cost: 150, stage: 4, category: 'furniture', type: 'campfire' },
  { id: 'wind_mill',        emoji: '🛖', name: '언덕 위 미니 풍차',cost: 380, stage: 4, category: 'structure', type: 'windmill' },

  // Stage 5 — 명소 & 힐링
  { id: 'grand_fountain',   emoji: '⛲', name: '대리석 물 분수대', cost: 450, stage: 5, category: 'furniture', type: 'fountain' },
  { id: 'parasol_table',    emoji: '⛱️', name: '비치 파라솔 세트', cost: 160, stage: 5, category: 'furniture', type: 'parasol' },
  { id: 'cherry_blossom',   emoji: '🌸', name: '만개한 벚꽃나무',  cost: 300, stage: 5, category: 'plant',     type: 'sakura' },
  { id: 'rainbow_arch',     emoji: '🌈', name: '무지개 아치 게이트',cost: 500, stage: 5, category: 'structure', type: 'rainbow' },
  { id: 'shrine_torii',     emoji: '⛩️', name: '신비로운 숲의 사당',cost: 700, stage: 5, category: 'structure', type: 'shrine' },
];

// ─── 3D 씬 전역 변수 ─────────────────────────────────────────

let scene, camera, renderer, controls;
let islandGroup, objectsGroup, gridGroup, villagersGroup, effectsGroup, cloudsGroup;
let isInitialized = false;
let animationFrameId = null;
let raycaster, mouse;
let clock = new THREE.Clock();

const GRID_SIZE = 6;
const TILE_SIZE = 1.35; // 3D 단위
const HALF_GRID = (GRID_SIZE * TILE_SIZE) / 2;

let villagers = [];
let butterflies = [];
let windmillBlades = [];
let clouds = [];
let balloonGift = null;
let campfireLight = null;

// ─── 3D 정원 렌더링 ──────────────────────────────────────────

export function renderGarden(container, opts = {}) {
  const { onCellClick, placingItem } = opts;
  const state = getState();
  const stage = getGardenStage();

  const containerEl = document.getElementById('garden-3d-container') || container;
  if (!containerEl) return;

  if (!isInitialized) {
    initThreeScene(containerEl);
  }

  resizeRenderer(containerEl);
  rebuildIsland(stage);
  rebuildObjects(state.garden.objects, stage);
  updateGridPlacementMode(placingItem, onCellClick);
}

function initThreeScene(container) {
  isInitialized = true;
  container.innerHTML = '';

  const w = container.clientWidth || 400;
  const h = container.clientHeight || 380;

  // 1) 씬 설정
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xbfe9fb); // 화사한 동물의 숲 스카이블루
  scene.fog = new THREE.FogExp2(0xbfe9fb, 0.02);

  // 2) 카메라 (가깝고 아기자기한 디오라마 뷰)
  camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 100);
  camera.position.set(0, 5.8, 7.6);

  // 3) WebGL 렌더러
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.22;
  container.appendChild(renderer.domElement);

  // 4) 궤도 조작 컨트롤 (OrbitControls)
  if (window.THREE.OrbitControls) {
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2.15;
    controls.minDistance = 4.5;
    controls.maxDistance = 14;
    controls.target.set(0, 0.5, 0);
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.3;
  }

  // 5) 조명 시스템
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x86efac, 0.95);
  scene.add(hemiLight);

  const sunLight = new THREE.DirectionalLight(0xfffaed, 1.35);
  sunLight.position.set(8, 14, 7);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 1024;
  sunLight.shadow.mapSize.height = 1024;
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 30;
  const d = 6;
  sunLight.shadow.camera.left = -d;
  sunLight.shadow.camera.right = d;
  sunLight.shadow.camera.top = d;
  sunLight.shadow.camera.bottom = -d;
  sunLight.shadow.bias = -0.0008;
  scene.add(sunLight);

  const ambLight = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambLight);

  // 6) 계층 그룹
  islandGroup = new THREE.Group();
  objectsGroup = new THREE.Group();
  gridGroup = new THREE.Group();
  villagersGroup = new THREE.Group();
  effectsGroup = new THREE.Group();
  cloudsGroup = new THREE.Group();

  scene.add(islandGroup);
  scene.add(objectsGroup);
  scene.add(gridGroup);
  scene.add(villagersGroup);
  scene.add(effectsGroup);
  scene.add(cloudsGroup);

  // 7) 레이캐스터
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();
  renderer.domElement.addEventListener('pointerdown', onPointerDown);

  // 8) 환경 & 생명체 초기화
  init3DClouds();
  initButterflies();
  initVillagers();
  initBalloonGift();

  // 9) 렌더링 루프
  if (!animationFrameId) {
    animate();
  }

  window.addEventListener('resize', () => resizeRenderer(container));
}

function resizeRenderer(container) {
  if (!renderer || !camera || !container) return;
  const w = container.clientWidth || 380;
  const h = container.clientHeight || 360;
  if (renderer.domElement.width !== w || renderer.domElement.height !== h) {
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
}

// ─── 3D 섬 베이스 생성 (동물의 숲 디오라마 지형) ───────────────

function rebuildIsland(stage) {
  islandGroup.clear();

  const islandW = GRID_SIZE * TILE_SIZE + 0.8;
  const islandD = GRID_SIZE * TILE_SIZE + 0.8;
  const grassH = 0.65;

  // 상단 잔디 재질 (동숲 라임그린)
  const grassMat = new THREE.MeshLambertMaterial({ color: 0x58c85a, flatShading: true });
  // 하단 흙 재질 (따뜻한 갈색)
  const dirtMat = new THREE.MeshLambertMaterial({ color: 0xbf854b, flatShading: true });

  // 1) 상단 잔디 플랫폼
  const grassGeo = new THREE.BoxGeometry(islandW, grassH, islandD);
  const grassMesh = new THREE.Mesh(grassGeo, grassMat);
  grassMesh.position.y = 0;
  grassMesh.receiveShadow = true;
  islandGroup.add(grassMesh);

  // 2) 하단 흙 단면
  const dirtGeo = new THREE.BoxGeometry(islandW - 0.25, 1.2, islandD - 0.25);
  const dirtMesh = new THREE.Mesh(dirtGeo, dirtMat);
  dirtMesh.position.y = -0.85;
  dirtMesh.receiveShadow = true;
  islandGroup.add(dirtMesh);

  // 3) 곡선 흙길 (Dirt Path)
  const pathMat = new THREE.MeshLambertMaterial({ color: 0xdeb887, flatShading: true });
  const pathSteps = [
    { x: -1.8, z: 2.2, r: 0.2 },
    { x: -1.0, z: 1.2, r: 0.1 },
    { x: 0.0,  z: 0.2, r: -0.15 },
    { x: 1.1,  z: -0.8, r: 0.25 },
    { x: 2.0,  z: -1.8, r: 0.1 },
  ];
  pathSteps.forEach(p => {
    const tile = new THREE.Mesh(new THREE.BoxGeometry(TILE_SIZE * 0.88, 0.03, TILE_SIZE * 0.88), pathMat);
    tile.position.set(p.x, grassH / 2 + 0.02, p.z);
    tile.rotation.y = p.r;
    tile.receiveShadow = true;
    islandGroup.add(tile);
  });

  // 4) 섬 가장자리 하얀 목재 울타리
  createIslandFences(islandW, islandD, grassH);
}

function createIslandFences(w, d, h) {
  const fenceMat = new THREE.MeshLambertMaterial({ color: 0xfafafa, flatShading: true });
  const postMat = new THREE.MeshLambertMaterial({ color: 0xe5e7eb, flatShading: true });

  const halfW = w / 2 - 0.25;
  const halfD = d / 2 - 0.25;

  for (let x = -halfW + 0.6; x <= halfW - 0.6; x += 1.1) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.45, 0.12), postMat);
    post.position.set(x, h / 2 + 0.22, -halfD);
    post.castShadow = true;
    islandGroup.add(post);

    const rail = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.08, 0.05), fenceMat);
    rail.position.set(x + 0.55, h / 2 + 0.22, -halfD);
    islandGroup.add(rail);
  }
}

// ─── 3D 오브젝트 렌더링 ───────────────────────────────────────

function rebuildObjects(objects, stage) {
  objectsGroup.clear();
  windmillBlades = [];

  // 기본 배치 (아이템이 아직 없을 때 예쁜 기본 정원 구성)
  if (objects.length === 0) {
    create3DObject('apple_tree', -1.4, -1.4);
    create3DObject('flower_tulip', 1.3, 1.3);
    create3DObject('flower_dandelion', 1.8, 0.4);
    create3DObject('wood_stump', -1.3, 1.4);
  }

  objects.forEach(obj => {
    const itemData = GARDEN_ITEMS.find(i => i.id === obj.type || i.emoji === obj.emoji);
    const type = itemData ? itemData.type : 'flower_tulip';
    const worldX = (obj.x - (GRID_SIZE - 1) / 2) * TILE_SIZE;
    const worldZ = (obj.y - (GRID_SIZE - 1) / 2) * TILE_SIZE;
    create3DObject(type, worldX, worldZ, obj);
  });
}

function create3DObject(type, x, z, data = {}) {
  const group = new THREE.Group();
  group.position.set(x, 0.32, z);
  group.userData = { ...data, type, isGardenObject: true };

  // 3D 모델 빌드
  switch (type) {
    case 'apple_tree':
    case 'peach_tree':
    case 'sakura':
    case 'cherry_blossom':
      buildFruitTree(group, type);
      break;
    case 'pine_tree':
    case 'cedar_tree':
      buildPineTree(group);
      break;
    case 'flower_tulip':
    case 'flower_dandelion':
    case 'flower_cosmos':
    case 'flower_red':
    case 'flower_yellow':
    case 'flower_pink':
      buildFlowerPatch(group, type);
      break;
    case 'stump':
    case 'wood_stump':
      buildLogStump(group);
      break;
    case 'stone':
    case 'garden_stone':
      buildGardenStone(group);
      break;
    case 'bench':
    case 'picnic_bench':
      buildWoodBench(group);
      break;
    case 'picnic':
    case 'picnic_set':
      buildPicnicSet(group);
      break;
    case 'pond':
    case 'water_pond':
      buildWaterPond(group);
      break;
    case 'duck':
    case 'duck_statue':
      buildCuteDuck(group);
      break;
    case 'cottage':
    case 'cozy_cottage':
      buildCozyCottage(group);
      break;
    case 'tent':
    case 'camp_tent':
      buildCampTent(group);
      break;
    case 'campfire':
      buildCampfire(group);
      break;
    case 'fountain':
    case 'grand_fountain':
      buildGrandFountain(group);
      break;
    case 'parasol':
    case 'parasol_table':
      buildParasolTable(group);
      break;
    case 'windmill':
    case 'wind_mill':
      buildWindmill(group);
      break;
    case 'lantern':
    case 'lantern_post':
      buildGardenLantern(group);
      break;
    case 'fence':
    case 'white_fence':
      buildWoodFence(group);
      break;
    case 'shrine':
    case 'shrine_torii':
      buildShrineTorii(group);
      break;
    case 'rainbow':
    case 'rainbow_arch':
      buildRainbowArch(group);
      break;
    default:
      buildFlowerPatch(group, 'flower_tulip');
      break;
  }

  objectsGroup.add(group);
}

// ─── 3D 에셋 모델러 (동물의 숲 디테일 구현) ───────────────────

// 1) 둥근 과일 나무 (사과 / 복숭아 / 벚꽃)
function buildFruitTree(parent, type) {
  const trunkMat = new THREE.MeshLambertMaterial({ color: 0x8b5a2b, flatShading: true });
  let folColor = 0x48bb78; // 사과나무 초록
  let fruitColor = 0xef4444; // 사과 빨강

  if (type === 'peach_tree') {
    folColor = 0x38a169;
    fruitColor = 0xfb7185; // 복숭아 핑크
  } else if (type === 'sakura' || type === 'cherry_blossom') {
    folColor = 0xf472b6; // 벚꽃 분홍
    fruitColor = 0xffffff;
  }

  const folMat = new THREE.MeshLambertMaterial({ color: folColor, flatShading: true });
  const fruitMat = new THREE.MeshLambertMaterial({ color: fruitColor, flatShading: true });

  // 나무 기둥
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 1.1, 8), trunkMat);
  trunk.position.y = 0.55;
  trunk.castShadow = true;
  parent.add(trunk);

  // 풍성한 나뭇잎 3단 구체
  const fol1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.8, 1), folMat);
  fol1.position.y = 1.45;
  fol1.castShadow = true;
  parent.add(fol1);

  const fol2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.55, 1), folMat);
  fol2.position.set(0.38, 1.25, 0.3);
  fol2.castShadow = true;
  parent.add(fol2);

  const fol3 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.5, 1), folMat);
  fol3.position.set(-0.35, 1.3, -0.28);
  fol3.castShadow = true;
  parent.add(fol3);

  // 과일 알맹이
  if (type !== 'sakura' && type !== 'cherry_blossom') {
    [
      { x: 0.45, y: 1.5, z: 0.55 },
      { x: -0.48, y: 1.4, z: 0.45 },
      { x: 0.1, y: 1.8, z: 0.65 },
      { x: -0.55, y: 1.55, z: -0.35 },
    ].forEach(c => {
      const f = new THREE.Mesh(new THREE.SphereGeometry(0.13, 7, 7), fruitMat);
      f.position.set(c.x, c.y, c.z);
      f.castShadow = true;
      parent.add(f);
    });
  }
}

// 2) 침엽수 / 소나무
function buildPineTree(parent) {
  const trunkMat = new THREE.MeshLambertMaterial({ color: 0x6b4423, flatShading: true });
  const pineMat = new THREE.MeshLambertMaterial({ color: 0x276749, flatShading: true });

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.75, 7), trunkMat);
  trunk.position.y = 0.38;
  trunk.castShadow = true;
  parent.add(trunk);

  [
    { y: 0.85, r: 0.75, h: 0.75 },
    { y: 1.35, r: 0.6,  h: 0.65 },
    { y: 1.8,  r: 0.42, h: 0.55 },
  ].forEach(c => {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(c.r, c.h, 6), pineMat);
    cone.position.y = c.y;
    cone.castShadow = true;
    parent.add(cone);
  });
}

// 3) 들꽃 화단
function buildFlowerPatch(parent, type) {
  let petalCol = 0xef4444; // 튤립
  if (type === 'flower_dandelion' || type === 'flower_yellow') petalCol = 0xf59e0b;
  if (type === 'flower_cosmos' || type === 'flower_pink') petalCol = 0xec4899;

  const stemMat = new THREE.MeshLambertMaterial({ color: 0x22c55e, flatShading: true });
  const petalMat = new THREE.MeshLambertMaterial({ color: petalCol, flatShading: true });
  const centerMat = new THREE.MeshLambertMaterial({ color: 0xfef08a, flatShading: true });

  [
    { x: 0, z: 0, s: 1 },
    { x: -0.22, z: 0.18, s: 0.8 },
    { x: 0.24, z: -0.15, s: 0.85 },
  ].forEach(o => {
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.32 * o.s), stemMat);
    stem.position.set(o.x, 0.16 * o.s, o.z);
    parent.add(stem);

    const petals = new THREE.Mesh(new THREE.DodecahedronGeometry(0.14 * o.s, 0), petalMat);
    petals.position.set(o.x, 0.32 * o.s, o.z);
    petals.castShadow = true;
    parent.add(petals);

    const center = new THREE.Mesh(new THREE.SphereGeometry(0.05 * o.s, 6, 6), centerMat);
    center.position.set(o.x, 0.36 * o.s, o.z);
    parent.add(center);
  });
}

// 4) 통나무 그루터기 & 조약돌
function buildLogStump(parent) {
  const barkMat = new THREE.MeshLambertMaterial({ color: 0x78350f, flatShading: true });
  const ringMat = new THREE.MeshLambertMaterial({ color: 0xfde68a, flatShading: true });

  const stump = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.42, 0.32, 8), barkMat);
  stump.position.y = 0.16;
  stump.castShadow = true;
  parent.add(stump);

  const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.02, 8), ringMat);
  ring.position.y = 0.33;
  parent.add(ring);
}

function buildGardenStone(parent) {
  const stoneMat = new THREE.MeshLambertMaterial({ color: 0x9ca3af, flatShading: true });
  const mossMat = new THREE.MeshLambertMaterial({ color: 0x84cc16, flatShading: true });

  const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(0.35, 1), stoneMat);
  stone.position.y = 0.22;
  stone.castShadow = true;
  parent.add(stone);

  const moss = new THREE.Mesh(new THREE.SphereGeometry(0.16, 6, 6), mossMat);
  moss.position.set(0.1, 0.36, 0.08);
  parent.add(moss);
}

// 5) 통나무 벤치 & 피크닉 세트
function buildWoodBench(parent) {
  const woodMat = new THREE.MeshLambertMaterial({ color: 0xa16207, flatShading: true });

  const seat = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.08, 0.4), woodMat);
  seat.position.y = 0.3;
  seat.castShadow = true;
  parent.add(seat);

  const back = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.3, 0.06), woodMat);
  back.position.set(0, 0.52, -0.18);
  back.castShadow = true;
  parent.add(back);

  [-0.4, 0.4].forEach(x => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.3, 0.36), woodMat);
    leg.position.set(x, 0.15, 0);
    parent.add(leg);
  });
}

function buildPicnicSet(parent) {
  const matCloth = new THREE.MeshLambertMaterial({ color: 0xf87171, flatShading: true });
  const basketMat = new THREE.MeshLambertMaterial({ color: 0xd97706, flatShading: true });

  // 돗자리
  const cloth = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.02, 0.9), matCloth);
  cloth.position.y = 0.02;
  parent.add(cloth);

  // 라탄 바구니
  const basket = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.22, 0.24), basketMat);
  basket.position.set(-0.15, 0.13, 0.1);
  basket.castShadow = true;
  parent.add(basket);

  // 음료수 컵
  const cupMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.12), cupMat);
  cup.position.set(0.18, 0.08, -0.1);
  parent.add(cup);
}

// 6) 맑은 연못 & 오리
function buildWaterPond(parent) {
  const waterMat = new THREE.MeshLambertMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.88 });
  const pond = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.04, 14), waterMat);
  pond.position.y = 0.03;
  parent.add(pond);

  const leafMat = new THREE.MeshLambertMaterial({ color: 0x22c55e });
  const lotus = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.02, 6), leafMat);
  lotus.position.set(0.18, 0.05, 0.12);
  parent.add(lotus);

  const flowerMat = new THREE.MeshLambertMaterial({ color: 0xf472b6 });
  const flower = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.1, 5), flowerMat);
  flower.position.set(0.18, 0.1, 0.12);
  parent.add(flower);
}

function buildCuteDuck(parent) {
  const bodyMat = new THREE.MeshLambertMaterial({ color: 0x059669, flatShading: true });
  const beakMat = new THREE.MeshLambertMaterial({ color: 0xf59e0b, flatShading: true });
  const wingMat = new THREE.MeshLambertMaterial({ color: 0x854d0e, flatShading: true });

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), bodyMat);
  body.position.y = 0.22;
  body.scale.set(1, 0.8, 1.2);
  body.castShadow = true;
  parent.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), bodyMat);
  head.position.set(0, 0.38, 0.18);
  parent.add(head);

  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.12, 4), beakMat);
  beak.position.set(0, 0.36, 0.32);
  beak.rotation.x = Math.PI / 2;
  parent.add(beak);

  const wing = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), wingMat);
  wing.position.set(0.2, 0.24, 0);
  parent.add(wing);
}

// 7) 빨간 지붕 오두막 (Cozy Cottage)
function buildCozyCottage(parent) {
  const wallMat = new THREE.MeshLambertMaterial({ color: 0xfef3c7, flatShading: true });
  const roofMat = new THREE.MeshLambertMaterial({ color: 0xd97706, flatShading: true });
  const doorMat = new THREE.MeshLambertMaterial({ color: 0x92400e, flatShading: true });
  const chimneyMat = new THREE.MeshLambertMaterial({ color: 0xb91c1c, flatShading: true });

  // 벽
  const wall = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.85, 1.0), wallMat);
  wall.position.y = 0.42;
  wall.castShadow = true;
  parent.add(wall);

  // 삼각 지붕
  const roof = new THREE.Mesh(new THREE.ConeGeometry(0.98, 0.65, 4), roofMat);
  roof.position.y = 1.18;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  parent.add(roof);

  // 문
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.45, 0.04), doorMat);
  door.position.set(0, 0.24, 0.52);
  parent.add(door);

  // 굴뚝
  const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.45, 0.18), chimneyMat);
  chimney.position.set(0.3, 1.25, -0.18);
  chimney.castShadow = true;
  parent.add(chimney);
}

// 8) 텐트 & 모닥불
function buildCampTent(parent) {
  const tentMat = new THREE.MeshLambertMaterial({ color: 0x0284c7, flatShading: true });
  const tent = new THREE.Mesh(new THREE.ConeGeometry(0.8, 1.0, 4), tentMat);
  tent.position.y = 0.5;
  tent.rotation.y = Math.PI / 4;
  tent.castShadow = true;
  parent.add(tent);
}

function buildCampfire(parent) {
  const logMat = new THREE.MeshLambertMaterial({ color: 0x78350f, flatShading: true });
  const fireMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });

  for (let i = 0; i < 4; i++) {
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.45), logMat);
    log.rotation.z = Math.PI / 4;
    log.rotation.y = (i * Math.PI) / 2;
    log.position.y = 0.06;
    parent.add(log);
  }

  const fire = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.4, 5), fireMat);
  fire.position.y = 0.22;
  parent.add(fire);

  if (!campfireLight) {
    campfireLight = new THREE.PointLight(0xf97316, 0.9, 3.5);
    campfireLight.position.y = 0.35;
    parent.add(campfireLight);
  }
}

// 9) 대리석 분수대
function buildGrandFountain(parent) {
  const stoneMat = new THREE.MeshLambertMaterial({ color: 0xe2e8f0, flatShading: true });
  const waterMat = new THREE.MeshLambertMaterial({ color: 0x38bdf8, flatShading: true });

  const basin = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.28, 12), stoneMat);
  basin.position.y = 0.14;
  basin.castShadow = true;
  parent.add(basin);

  const water = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.78, 0.05, 12), waterMat);
  water.position.y = 0.26;
  parent.add(water);

  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.55, 8), stoneMat);
  pillar.position.y = 0.52;
  pillar.castShadow = true;
  parent.add(pillar);

  const topWater = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), waterMat);
  topWater.position.y = 0.85;
  parent.add(topWater);
}

// 10) 파라솔 테이블 & 미니 풍차 & 가든 랜턴
function buildParasolTable(parent) {
  const poleMat = new THREE.MeshLambertMaterial({ color: 0xfafafa });
  const umbrellaMat = new THREE.MeshLambertMaterial({ color: 0xf43f5e, flatShading: true });
  const tableMat = new THREE.MeshLambertMaterial({ color: 0xa16207, flatShading: true });

  // 테이블
  const table = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.05), tableMat);
  table.position.y = 0.32;
  table.castShadow = true;
  parent.add(table);

  const tableLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.32), tableMat);
  tableLeg.position.y = 0.16;
  parent.add(tableLeg);

  // 파라솔
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.4), poleMat);
  pole.position.y = 0.7;
  parent.add(pole);

  const canopy = new THREE.Mesh(new THREE.ConeGeometry(0.78, 0.4, 8), umbrellaMat);
  canopy.position.y = 1.32;
  canopy.castShadow = true;
  parent.add(canopy);
}

function buildWindmill(parent) {
  const towerMat = new THREE.MeshLambertMaterial({ color: 0xfef08a, flatShading: true });
  const bladeMat = new THREE.MeshLambertMaterial({ color: 0x64748b, flatShading: true });

  const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.5, 1.3, 7), towerMat);
  tower.position.y = 0.65;
  tower.castShadow = true;
  parent.add(tower);

  const bladeGroup = new THREE.Group();
  bladeGroup.position.set(0, 1.15, 0.34);
  for (let i = 0; i < 4; i++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.6, 0.02), bladeMat);
    blade.position.y = 0.3;
    const holder = new THREE.Group();
    holder.rotation.z = (i * Math.PI) / 2;
    holder.add(blade);
    bladeGroup.add(holder);
  }
  parent.add(bladeGroup);
  windmillBlades.push(bladeGroup);
}

function buildGardenLantern(parent) {
  const postMat = new THREE.MeshLambertMaterial({ color: 0x27272a, flatShading: true });
  const lampMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 1.2), postMat);
  post.position.y = 0.6;
  post.castShadow = true;
  parent.add(post);

  const lamp = new THREE.Mesh(new THREE.DodecahedronGeometry(0.15, 0), lampMat);
  lamp.position.y = 1.15;
  parent.add(lamp);

  const light = new THREE.PointLight(0xfef08a, 0.7, 3);
  light.position.y = 1.15;
  parent.add(light);
}

function buildWoodFence(parent) {
  const fenceMat = new THREE.MeshLambertMaterial({ color: 0xfafafa, flatShading: true });
  const fence = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.45, 0.1), fenceMat);
  fence.position.y = 0.23;
  fence.castShadow = true;
  parent.add(fence);
}

function buildShrineTorii(parent) {
  const redMat = new THREE.MeshLambertMaterial({ color: 0xdc2626, flatShading: true });
  const blackMat = new THREE.MeshLambertMaterial({ color: 0x1e293b, flatShading: true });

  [-0.5, 0.5].forEach(x => {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 1.35, 6), redMat);
    col.position.set(x, 0.67, 0);
    col.castShadow = true;
    parent.add(col);
  });

  const beam = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.1, 0.15), redMat);
  beam.position.set(0, 1.2, 0);
  parent.add(beam);

  const topRoof = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.08, 0.18), blackMat);
  topRoof.position.set(0, 1.3, 0);
  parent.add(topRoof);
}

function buildRainbowArch(parent) {
  const colors = [0xef4444, 0xf97316, 0xfacc15, 0x22c55e, 0x3b82f6, 0x8b5cf6];
  colors.forEach((col, i) => {
    const archMat = new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide });
    const arch = new THREE.Mesh(new THREE.TorusGeometry(0.85 - i * 0.05, 0.03, 6, 16, Math.PI), archMat);
    arch.position.y = 0.1;
    parent.add(arch);
  });
}

// ─── 동물 주민 & 환경 요소 ─────────────────────────────────────

function initVillagers() {
  villagersGroup.clear();
  villagers = [];

  const raccoon = create3DVillager(0x854d0e, 0xfef08a, '🦝 너굴이');
  raccoon.position.set(-0.8, 0.32, 0.6);
  villagersGroup.add(raccoon);
  villagers.push({ mesh: raccoon, speed: 1.4, time: 0 });

  const dog = create3DVillager(0xf59e0b, 0xfffbeb, '🐶 여울이');
  dog.position.set(1.1, 0.32, -0.7);
  villagersGroup.add(dog);
  villagers.push({ mesh: dog, speed: 1.8, time: 1.5 });
}

function create3DVillager(bodyColor, bellyColor, name) {
  const group = new THREE.Group();
  group.userData = { name, isVillager: true };

  const bodyMat = new THREE.MeshLambertMaterial({ color: bodyColor, flatShading: true });
  const bellyMat = new THREE.MeshLambertMaterial({ color: bellyColor, flatShading: true });
  const earMat = new THREE.MeshLambertMaterial({ color: 0x3f3f46, flatShading: true });

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), bodyMat);
  body.position.y = 0.32;
  body.castShadow = true;
  group.add(body);

  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.22, 7, 7), bellyMat);
  belly.position.set(0, 0.3, 0.14);
  group.add(belly);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 8), bodyMat);
  head.position.y = 0.68;
  head.castShadow = true;
  group.add(head);

  [-0.18, 0.18].forEach(x => {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.2, 5), earMat);
    ear.position.set(x, 0.94, 0);
    group.add(ear);
  });

  return group;
}

function init3DClouds() {
  cloudsGroup.clear();
  clouds = [];

  const cloudMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 });

  for (let i = 0; i < 3; i++) {
    const cg = new THREE.Group();
    for (let j = 0; j < 4; j++) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(0.4 + Math.random() * 0.25, 7, 7), cloudMat);
      puff.position.set((j - 1.5) * 0.4, (Math.random() - 0.5) * 0.15, (Math.random() - 0.5) * 0.2);
      cg.add(puff);
    }
    cg.position.set((i - 1) * 5, 4.5 + i * 0.4, (Math.random() - 0.5) * 4);
    cloudsGroup.add(cg);
    clouds.push({ group: cg, speed: 0.25 + Math.random() * 0.2 });
  }
}

function initButterflies() {
  butterflies = [];
  const colors = [0x38bdf8, 0xf472b6, 0xfbbf24];

  for (let i = 0; i < 3; i++) {
    const bGroup = new THREE.Group();
    const wingMat = new THREE.MeshBasicMaterial({ color: colors[i], side: THREE.DoubleSide });

    const leftWing = new THREE.Mesh(new THREE.CircleGeometry(0.09, 5), wingMat);
    leftWing.position.x = -0.07;
    bGroup.add(leftWing);

    const rightWing = new THREE.Mesh(new THREE.CircleGeometry(0.09, 5), wingMat);
    rightWing.position.x = 0.07;
    bGroup.add(rightWing);

    bGroup.position.set((Math.random() - 0.5) * 3.5, 1.2 + Math.random() * 0.8, (Math.random() - 0.5) * 3.5);
    effectsGroup.add(bGroup);

    butterflies.push({
      group: bGroup,
      leftWing,
      rightWing,
      speed: 0.7 + Math.random() * 0.5,
      angle: Math.random() * Math.PI * 2,
    });
  }
}

function initBalloonGift() {
  const group = new THREE.Group();
  group.userData = { isBalloon: true };

  const balloonMat = new THREE.MeshLambertMaterial({ color: 0xef4444, flatShading: true });
  const balloon = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 8), balloonMat);
  balloon.position.y = 0.45;
  balloon.castShadow = true;
  group.add(balloon);

  const boxMat = new THREE.MeshLambertMaterial({ color: 0xfef08a, flatShading: true });
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.22), boxMat);
  box.position.y = -0.15;
  box.castShadow = true;
  group.add(box);

  const lineGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0.15, 0),
    new THREE.Vector3(0, -0.05, 0),
  ]);
  group.add(new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0xffffff })));

  group.position.set(-6, 3.6, -1.5);
  effectsGroup.add(group);
  balloonGift = group;
}

// ─── 배치 모드 3D 그리드 타일 ─────────────────────────────────

function updateGridPlacementMode(placingItem, onCellClick) {
  gridGroup.clear();
  if (!placingItem) return;

  const tileGeo = new THREE.BoxGeometry(TILE_SIZE * 0.92, 0.05, TILE_SIZE * 0.92);
  const tileMat = new THREE.MeshBasicMaterial({
    color: 0xfef08a,
    transparent: true,
    opacity: 0.5,
  });

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const tile = new THREE.Mesh(tileGeo, tileMat.clone());
      const wx = (c - (GRID_SIZE - 1) / 2) * TILE_SIZE;
      const wz = (r - (GRID_SIZE - 1) / 2) * TILE_SIZE;
      tile.position.set(wx, 0.33, wz);
      tile.userData = { gridX: c, gridY: r, isPlacementTile: true, onCellClick };
      gridGroup.add(tile);
    }
  }
}

// ─── 레이캐스팅 & 클릭 인터랙션 ───────────────────────────────

function onPointerDown(e) {
  if (!renderer || !camera) return;

  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  // 1) 풍선 선물 클릭 검사
  if (balloonGift) {
    const hits = raycaster.intersectObjects(balloonGift.children, true);
    if (hits.length > 0) {
      sound.playSuperSpawn();
      const reward = 30 + Math.floor(Math.random() * 30);
      addCoins(reward);
      save();

      show3DTextEffect(`🎁 선물 발견! +🪙${reward}`);
      balloonGift.position.x = 8;
      return;
    }
  }

  // 2) 배치 타일 클릭 검사
  const gridHits = raycaster.intersectObjects(gridGroup.children);
  if (gridHits.length > 0) {
    const tile = gridHits[0].object;
    if (tile.userData.onCellClick) {
      tile.userData.onCellClick(tile.userData.gridX, tile.userData.gridY);
      return;
    }
  }

  // 3) 동물 주민 또는 오브젝트 클릭 시 뿅 튀는 리액션
  const objHits = raycaster.intersectObjects([...objectsGroup.children, ...villagersGroup.children], true);
  if (objHits.length > 0) {
    let topParent = objHits[0].object;
    while (topParent.parent && topParent.parent !== objectsGroup && topParent.parent !== villagersGroup) {
      topParent = topParent.parent;
    }

    sound.playSelect();
    animateBounce(topParent);

    if (topParent.userData.isVillager) {
      const messages = ['오늘도 반가워구리~ 🍃', '정원이 정말 근사해!', '노래 한 곡 불러줄까? 🎵'];
      const msg = messages[Math.floor(Math.random() * messages.length)];
      show3DTextEffect(`${topParent.userData.name}: "${msg}"`);
    } else {
      show3DTextEffect('✨💖');
    }
  }
}

function animateBounce(obj) {
  const startY = obj.position.y;
  let elapsed = 0;
  const bounceInterval = setInterval(() => {
    elapsed += 0.05;
    obj.position.y = startY + Math.sin(elapsed * Math.PI * 4) * 0.35;
    obj.rotation.y += 0.15;
    if (elapsed >= 0.5) {
      clearInterval(bounceInterval);
      obj.position.y = startY;
    }
  }, 16);
}

function show3DTextEffect(text) {
  const bubble = document.createElement('div');
  bubble.className = 'ac-villager-bubble';
  bubble.textContent = text;
  bubble.style.position = 'absolute';
  bubble.style.top = '22%';
  bubble.style.left = '50%';
  bubble.style.transform = 'translate(-50%, -50%)';

  const container = document.getElementById('garden-viewport');
  if (container) {
    container.appendChild(bubble);
    setTimeout(() => bubble.remove(), 2400);
  }
}

// ─── 3D 애니메이션 루프 ───────────────────────────────────────

function animate() {
  animationFrameId = requestAnimationFrame(animate);
  const delta = clock.getDelta();
  const time = clock.getElapsedTime();

  if (controls) controls.update();

  // 동물 주민들 깡총깡총 산책
  villagers.forEach(v => {
    v.time += delta * v.speed;
    v.mesh.position.y = 0.32 + Math.abs(Math.sin(v.time * 3)) * 0.14;
    v.mesh.rotation.y = Math.sin(v.time * 0.8) * 0.4;
  });

  // 풍차 날개 회전
  windmillBlades.forEach(b => {
    b.rotation.z += delta * 1.5;
  });

  // 나비 비행
  butterflies.forEach(b => {
    b.angle += delta * b.speed;
    b.group.position.x += Math.cos(b.angle) * 0.02;
    b.group.position.z += Math.sin(b.angle) * 0.02;
    b.group.position.y = 1.3 + Math.sin(time * 3 + b.angle) * 0.18;

    const wingAngle = Math.sin(time * 18) * 0.6;
    b.leftWing.rotation.y = wingAngle;
    b.rightWing.rotation.y = -wingAngle;
  });

  // 하늘 구름 이동
  clouds.forEach(c => {
    c.group.position.x += delta * c.speed;
    if (c.group.position.x > 8) {
      c.group.position.x = -8;
    }
  });

  // 풍선 선물 이동
  if (balloonGift) {
    balloonGift.position.x += delta * 0.6;
    balloonGift.position.y = 3.6 + Math.sin(time * 2) * 0.15;
    if (balloonGift.position.x > 7.5) {
      balloonGift.position.x = -7.5;
    }
  }

  // 바람에 나뭇가지 살랑살랑
  objectsGroup.children.forEach(obj => {
    obj.rotation.z = Math.sin(time * 2 + obj.position.x) * 0.02;
  });

  renderer.render(scene, camera);
}

// ─── 상점 UI ─────────────────────────────────────────────────

export function renderShop(container) {
  const state = getState();
  const stage = getGardenStage();
  const coins = state.player.coins;

  container.innerHTML = `
    <div class="shop-header-bar ac-shop-header">
      <span class="shop-title">🍃 3D 동물의 숲 상점</span>
      <span class="shop-coin-display">🪙 ${coins} 벨</span>
    </div>
    <div class="ac-shop-sub">나만의 3D 디오라마 정원을 예쁘게 꾸며보세요!</div>
    <div class="shop-grid ac-shop-grid">
      ${GARDEN_ITEMS.map(item => {
        const locked = item.stage > stage;
        const canAfford = coins >= item.cost;
        return `
          <div class="shop-item ac-shop-item ${locked ? 'shop-item--locked' : ''} ${!canAfford && !locked ? 'shop-item--poor' : ''}"
               data-item-id="${item.id}" ${locked ? '' : 'role="button" tabindex="0"'}>
            <div class="si-emoji">${locked ? '🔒' : item.emoji}</div>
            <div class="si-name">${item.name}</div>
            <div class="si-cost">${locked ? `🌱 Lv.${item.stage}` : `🪙 ${item.cost}`}</div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

export function getItemById(id) {
  return GARDEN_ITEMS.find(i => i.id === id);
}
