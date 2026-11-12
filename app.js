// ============================================
// FICHIER app.js COMPLET CORRIGÉ
// ============================================
// Remplacer TOUT le contenu de app.js par ce code

import { getDocument, GlobalWorkerOptions } from './vendor/pdfjs/pdf.mjs';

GlobalWorkerOptions.workerSrc = new URL('./vendor/pdfjs/pdf.worker.mjs', import.meta.url).toString();

const STORAGE_KEY = 'correction-game-classes-v1';
const createId = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `id-${Math.random().toString(16).slice(2)}-${Date.now()}`);
const hasDesktopApi = Boolean(window.api && typeof window.api.openPdf === 'function');
const MAX_UNDO_STACK_SIZE = 50;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const DEFAULT_TEXT_SIZE = 12;

const elements = {
  openPdfBtn: document.getElementById('open-pdf-btn'),
  welcomePanel: document.getElementById('welcome-panel'),
  welcomeOpenPdfBtn: document.getElementById('welcome-open-pdf-btn'),
  welcomeHelpBtn: document.getElementById('welcome-help-btn'),
  reopenLastPdfBtn: document.getElementById('reopen-last-pdf-btn'),
  addOverlayBtn: document.getElementById('add-overlay-btn'),
  addTextBtn: document.getElementById('add-text-btn'),
  toggleHighlightToolBtn: document.getElementById('toggle-highlight-tool-btn'),
  toggleUnderlineToolBtn: document.getElementById('toggle-underline-tool-btn'),
  anchorBtn: document.getElementById('anchor-overlays-btn'),
  assignBtn: document.getElementById('assign-btn'),
  clearAssignmentsBtn: document.getElementById('clear-assignments-btn'),
  zoomInBtn: document.getElementById('zoom-in-btn'),
  zoomOutBtn: document.getElementById('zoom-out-btn'),
  zoomResetBtn: document.getElementById('zoom-reset-btn'),
  zoomLabel: document.getElementById('zoom-label'),
  overlayOpacityOutput: document.getElementById('overlay-opacity-output'),
  sessionStatus: document.getElementById('session-status'),
  sessionFeedback: document.getElementById('session-feedback'),
  toolSettingsBtn: document.getElementById('tool-settings-btn'),
  toolSettings: document.getElementById('tool-settings'),
  overlayOpacityInput: document.getElementById('overlay-opacity-input'),
  markupColorInput: document.getElementById('markup-color-input'),
  textStyleTools: document.getElementById('text-style-tools'),
  textSizeInput: document.getElementById('text-size-input'),
  textSizeAllBtn: document.getElementById('text-size-all-btn'),
  textColorInput: document.getElementById('text-color-input'),
  textOpacityInput: document.getElementById('text-opacity-input'),
  pdfInput: document.getElementById('pdf-file-input'),
  saveSessionBtn: document.getElementById('save-session-btn'),
  loadSessionBtn: document.getElementById('load-session-btn'),
  openHelpBtn: document.getElementById('open-help-btn'),
  sessionFileInput: document.getElementById('session-file-input'),
  pdfContainer: document.getElementById('pdf-container'),
  pdfScroll: document.getElementById('pdf-scroll'),
  viewer: document.getElementById('viewer-wrapper'),
  documentBar: document.getElementById('document-bar'),
  documentTabs: document.getElementById('document-tabs'),
  documentTabTemplate: document.getElementById('document-tab-template'),
  classSelect: document.getElementById('class-select'),
  classFolderHint: document.getElementById('class-folder-hint'),
  manageClassesBtn: document.getElementById('manage-classes-btn'),
  leaderboardBtn: document.getElementById('leaderboard-btn'),
  resetScoresBtn: document.getElementById('reset-scores-btn'),
  studentList: document.getElementById('student-list'),
  pageOverviewBtn: document.getElementById('page-overview-btn'),
  previousPageBtn: document.getElementById('prev-page-btn'),
  nextPageBtn: document.getElementById('next-page-btn'),
  singlePageBtn: document.getElementById('single-page-btn'),
  twoPageBtn: document.getElementById('two-page-btn'),
  fileToolbarRow: document.getElementById('file-toolbar-row'),
  toolsToolbarRow: document.querySelector('.toolbar-row-tools'),
  toggleFilebarBtn: document.getElementById('toggle-filebar-btn'),
  sidebar: document.getElementById('sidebar'),
  toggleSidebarBtn: document.getElementById('toggle-sidebar-btn'),
  sidebarResizer: document.getElementById('sidebar-resizer'),
  gradeLegend: document.getElementById('grade-legend'),
  pageOverviewModal: document.getElementById('page-overview-modal'),
  closeOverviewBtn: document.getElementById('close-overview-btn'),
  pageOverviewGrid: document.getElementById('page-overview-grid'),
  helpModal: document.getElementById('help-modal'),
  closeHelpBtn: document.getElementById('close-help-btn'),
  classModal: document.getElementById('class-modal'),
  classOptions: document.getElementById('class-options'),
  closeModalBtn: document.getElementById('close-modal-btn'),
  newClassBtn: document.getElementById('new-class-btn'),
  classList: document.getElementById('class-list'),
  classNameInput: document.getElementById('class-name-input'),
  classFolderInput: document.getElementById('class-folder-input'),
  chooseClassFolderBtn: document.getElementById('choose-class-folder-btn'),
  clearClassFolderBtn: document.getElementById('clear-class-folder-btn'),
  correctPointsInput: document.getElementById('class-correct-points-input'),
  incorrectPointsInput: document.getElementById('class-incorrect-points-input'),
  gradeApprenticeInput: document.getElementById('grade-apprentice-input'),
  gradeConfirmedInput: document.getElementById('grade-confirmed-input'),
  gradeExpertInput: document.getElementById('grade-expert-input'),
  gradeMasterInput: document.getElementById('grade-master-input'),
  studentNamesInput: document.getElementById('student-names-input'),
  saveClassBtn: document.getElementById('save-class-btn'),
  deleteClassBtn: document.getElementById('delete-class-btn'),
  modalFeedback: document.getElementById('modal-feedback'),
  leaderboardModal: document.getElementById('leaderboard-modal'),
  closeLeaderboardBtn: document.getElementById('close-leaderboard-btn'),
  leaderboardClassName: document.getElementById('leaderboard-class-name'),
  leaderboardPodium: document.getElementById('leaderboard-podium'),
  leaderboardRanking: document.getElementById('leaderboard-ranking'),
  leaderboardList: document.getElementById('leaderboard-list'),
  leaderboardCount: document.getElementById('leaderboard-count'),
};

const state = {
  currentPdfPath: null,
  lastOpenedPdfPath: null,
  standalonePdfPaths: [],
  browserDocuments: new Map(),
  lastBrowserDocuments: new Map(),
  browserDocument: null,
  changingDocument: false,
  pdfDoc: null,
  pdfInfo: { name: null, size: null, fingerprint: null },
  currentZoom: 1,
  currentPageNumber: 1,
  totalPages: 0,
  overlays: [],
  overlayElements: new Map(),
  markups: [],
  markupElements: new Map(),
  nativeShapes: [],
  nativeShapeElements: new Map(),
  textOverlays: [],
  textOverlayElements: new Map(),
  pageStates: new Map(),
  pageOffsets: [],
  classes: [],
  selectedClassId: null,
  modalEditingId: null,
  pointerHint: { pageNumber: 1, x: 0.5, y: 0.3, valid: false },
  lastVisiblePage: 1,
  zoomPreview: { active: false, baseZoom: 1, previewZoom: 1, anchor: null, commitTimeout: null },
  scrollAnimationFrame: null,
  hoverOverlayId: null,
  hoverMarkupId: null,
  hoverNativeShapeId: null,
  hoverTextId: null,
  lastActiveOverlayId: null,
  lastActiveMarkupId: null,
  lastActiveNativeShapeId: null,
  lastActiveTextId: null,
  lastActiveType: null, // 'overlay' | 'markup' | 'native-shape' | 'text'
  selectedOverlayId: null,
  selectedMarkupId: null,
  selectedNativeShapeId: null,
  selectedTextId: null,
  annotationGroup: new Set(),
  editingTextId: null,
  textOverlayClipboard: null,
  defaultTextFontSizePx: DEFAULT_TEXT_SIZE,
  activeMarkupTool: null, // 'highlight' | 'underline' | null
  markupColor: '#ffd54f',
  overlayOpacity: 0.85,
  pageViewMode: 'single',
  sidebarCollapsed: false,
  sidebarWidth: 320,
  filebarCollapsed: false,
  absentStudentIds: new Set(),
  renderRequestId: 0,
  recentScoreChange: null,
  studentListResizeObserver: null,
  undoStack: [],
  redoStack: [],
  nativeShapesRequestId: 0,
};

const overlayDefaults = {
  width: 0.32,
  height: 0.18,
  minWidthPx: 24,
  minHeightPx: 22,
};

const textOverlayDefaults = {
  width: 0.45,
  height: 0.12,
  minWidthPx: 60,
  minHeightPx: 32,
};

const textStyleDefaults = {
  fontSizePx: DEFAULT_TEXT_SIZE,
  autoFontSize: false,
  textColor: '#1976d2',
  backgroundOpacity: 1,
};

const markupDefaults = {
  highlightOpacity: 0.42,
  underlineBorderPx: 3,
  color: '#ffd54f',
};

const scoringDefaults = {
  correctPoints: 10,
  incorrectPoints: 0,
};

const defaultGradeThresholds = Object.freeze({
  apprentice: 20,
  confirmed: 50,
  expert: 100,
  master: 180,
});

const rewardGradeDefinitions = [
  { key: 'starter', label: 'Débutant' },
  { key: 'apprentice', label: 'Apprenti' },
  { key: 'confirmed', label: 'Confirmé' },
  { key: 'expert', label: 'Expert' },
  { key: 'master', label: 'Maître' },
];

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 12;
const MAX_CANVAS_PIXELS = 18_000_000;
const MIN_SIDEBAR_WIDTH = 220;
const MAX_SIDEBAR_WIDTH = 520;

const pdfjsEditorPrefix = 'pdfjs_internal_editor_';

const deletableNativeShapeTypes = new Set([
  4, // line
  5, // square
  6, // circle
  7, // polygon
  8, // polyline
  13, // stamp
  15, // ink
]);

const dragState = {
  active: false,
  overlayId: null,
  mode: 'move',
  pageNumber: null,
  startPointer: null,
  startRect: null,
  startClient: null,
  pointerOffset: null,
  moved: false,
  undoSnapshot: null,
};

const textDragState = {
  active: false,
  textId: null,
  mode: 'move',
  pageNumber: null,
  startPointer: null,
  startRect: null,
  startFontSizePx: null,
  startClient: null,
  pointerOffset: null,
  moved: false,
  undoSnapshot: null,
};

let cancelAnnotationGesture = null;
let pendingSessionSave = null;
let documentChangePromise = null;
let feedbackTimer = null;
let _cgHistoryApplying = false;
const undoGestureFlags = new Set();

function basenameFromPath(inputPath) {
  if (!inputPath) return null;
  const parts = inputPath.split(/[\\/]/);
  return parts[parts.length - 1] || null;
}

function parseIpcBytes(payload) {
  if (!payload) return null;
  if (payload instanceof Uint8Array) return payload;
  if (payload instanceof ArrayBuffer) return new Uint8Array(payload);
  if (ArrayBuffer.isView(payload)) {
    return new Uint8Array(payload.buffer, payload.byteOffset, payload.byteLength);
  }
  if (Array.isArray(payload)) return Uint8Array.from(payload);
  if (payload.type === 'Buffer' && Array.isArray(payload.data)) {
    return Uint8Array.from(payload.data);
  }
  return null;
}

function getSelectedRosterFolder() {
  const roster = getSelectedRoster();
  return roster?.folderPath || null;
}

function setSessionStatus(message, level = 'neutral', { notify = level === 'danger' } = {}) {
  elements.sessionStatus.textContent = message;
  if (!notify) return;
  clearTimeout(feedbackTimer);
  elements.sessionFeedback.textContent = message;
  elements.sessionFeedback.dataset.level = level;
  elements.sessionFeedback.hidden = false;
  feedbackTimer = setTimeout(() => { elements.sessionFeedback.hidden = true; }, 4400);
}

function animateControlPress(event) {
  if (reducedMotion.matches || !(event.target instanceof Element)) return;
  const button = event.target.closest('button:not(:disabled)');
  if (!button) return;
  button.animate([
    { scale: '.95', filter: 'brightness(1.05) saturate(1.26)' },
    { offset: .64, scale: '1.015', filter: 'brightness(1.035) saturate(1.14)' },
    { scale: '1', filter: 'none' },
  ], { duration: 220, easing: 'ease-out' });
}

function animateNewAnnotation(element) {
  if (!element || reducedMotion.matches) return;
  element.classList.add('annotation-entering');
  element.addEventListener('animationend', () => element.classList.remove('annotation-entering'), { once: true });
}

function normalizePointValue(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.round(parsed));
}

function normalizeGradeThresholds(rawThresholds = {}) {
  const keys = ['apprentice', 'confirmed', 'expert', 'master'];
  const normalized = {};
  let previous = 0;
  for (const key of keys) {
    const raw = Number(rawThresholds?.[key]);
    const fallback = defaultGradeThresholds[key];
    const candidate = Number.isFinite(raw) ? Math.round(raw) : fallback;
    normalized[key] = Math.max(previous + 1, candidate);
    previous = normalized[key];
  }
  return normalized;
}

function getRewardGrades(roster = getSelectedRoster()) {
  const thresholds = normalizeGradeThresholds(roster?.gradeThresholds);
  return rewardGradeDefinitions.map((definition) => ({
    ...definition,
    minScore: definition.key === 'starter' ? 0 : thresholds[definition.key],
  }));
}

function getStudentScoreValue(student) {
  const raw = Number(student?.score);
  if (!Number.isFinite(raw)) return 0;
  return raw;
}

function getRosterScoreSettings(roster = getSelectedRoster()) {
  return {
    correctPoints: normalizePointValue(roster?.correctPoints, scoringDefaults.correctPoints),
    incorrectPoints: normalizePointValue(roster?.incorrectPoints, scoringDefaults.incorrectPoints),
  };
}

function getScoreDeltaForResolution(isCorrect, roster = getSelectedRoster()) {
  const { correctPoints, incorrectPoints } = getRosterScoreSettings(roster);
  return isCorrect ? correctPoints : -incorrectPoints;
}

function getStudentGrade(score, roster = getSelectedRoster()) {
  const rewardGrades = getRewardGrades(roster);
  const safeScore = Math.max(0, Number(score) || 0);
  let gradeIndex = 0;
  for (let index = 0; index < rewardGrades.length; index += 1) {
    if (safeScore >= rewardGrades[index].minScore) gradeIndex = index;
  }
  const grade = rewardGrades[gradeIndex];
  return {
    ...grade,
    index: gradeIndex,
    next: rewardGrades[gradeIndex + 1] || null,
  };
}

// Ajoute un calque de lumière (dégradés définis dans le sprite SVG) au-dessus de chaque couche
// du badge, ainsi qu'un reflet spéculaire, pour obtenir un rendu en relief quelle que soit la couleur du grade.
function addBadgeRelief(svg) {
  const SVG_NS = 'http://www.w3.org/2000/svg';
  for (const shape of Array.from(svg.querySelectorAll('.badge-back, .badge-rim, .badge-core, .badge-gem'))) {
    const kind = Array.from(shape.classList).find((name) => name.startsWith('badge-'))?.slice(6);
    const shade = shape.cloneNode(false);
    shade.setAttribute('class', `badge-shade shade-${kind}`);
    shape.after(shade);
  }
  const specular = document.createElementNS(SVG_NS, 'ellipse');
  specular.setAttribute('class', 'badge-specular');
  specular.setAttribute('cx', '15');
  specular.setAttribute('cy', '11.5');
  specular.setAttribute('rx', '7');
  specular.setAttribute('ry', '3.2');
  specular.setAttribute('transform', 'rotate(-28 15 11.5)');
  svg.appendChild(specular);
}

function createGradeBadgeElement(grade, studentName, score) {
  const badge = document.createElement('span');
  badge.className = 'grade-badge';
  badge.dataset.grade = grade.key;
  const remaining = grade.next ? Math.max(0, grade.next.minScore - Math.max(0, Number(score) || 0)) : 0;
  const progression = grade.next
    ? `${remaining} point${remaining > 1 ? 's' : ''} avant le grade ${grade.next.label}`
    : 'Grade maximal atteint';
  badge.title = `${studentName} — ${grade.label}. ${progression}.`;
  badge.setAttribute('aria-label', `Grade ${grade.label}`);

  const badgeArtwork = {
    starter: '<polygon class="badge-back" points="20,2 34,10 34,28 20,38 6,28 6,10"/><polygon class="badge-rim" points="20,6 30,12 30,26 20,33 10,26 10,12"/><polygon class="badge-core" points="20,10 27,14 27,24 20,29 13,24 13,14"/><path class="badge-detail" d="M13 14 20 20 27 14M20 20v9"/>',
    apprentice: '<path class="badge-back" d="M14 12 3 7l4 10-5 5 12 5h12l12-5-5-5 4-10-11 5z"/><path class="badge-rim" d="M20 4 31 10v13c0 6-4.5 10.5-11 14-6.5-3.5-11-8-11-14V10z"/><path class="badge-core" d="M20 9 27 13v9c0 4-2.7 7-7 9.6C15.7 29 13 26 13 22v-9z"/><polygon class="badge-gem" points="20,12 24,18 20,25 16,18"/><path class="badge-detail" d="M7 15 13 18M33 15l-6 3"/>',
    confirmed: '<path class="badge-back" d="m13 11-9 4 6 6-6 6 12 1h8l12-1-6-6 6-6-9-4z"/><polygon class="badge-rim" points="20,2 33,11 30,29 20,38 10,29 7,11"/><polygon class="badge-core" points="20,7 28,13 26,26 20,32 14,26 12,13"/><polygon class="badge-gem" points="20,10 26,19 20,28 14,19"/><path class="badge-detail" d="m14 19 6-5 6 5M20 14v14"/>',
    expert: '<polygon class="badge-back" points="20,1 24,8 31,4 30,12 39,11 34,19 39,25 30,25 31,35 23,31 20,39 17,31 9,35 10,25 1,25 6,19 1,11 10,12 9,4 16,8"/><path class="badge-rim" d="m20 7 5 6 8-1-3 8 4 7-9 1-5 7-5-7-9-1 4-7-3-8 8 1z"/><polygon class="badge-core" points="20,11 24,17 31,18 26,23 28,30 20,26 12,30 14,23 9,18 16,17"/><polygon class="badge-gem" points="20,14 24,20 20,26 16,20"/><path class="badge-detail" d="M14 9 17 3l3 5 3-5 3 6"/>',
    master: '<polygon class="badge-back" points="20,0 24,7 29,2 30,10 38,7 34,15 40,18 33,22 38,29 29,28 28,38 21,32 15,40 13,31 3,34 7,25 0,21 8,17 3,10 12,12 13,3"/><circle class="badge-rim" cx="20" cy="20" r="13"/><circle class="badge-core" cx="20" cy="20" r="9"/><polygon class="badge-gem" points="20,10 27,17 24,27 16,27 13,17"/><path class="badge-detail" d="M12 10 14 3l6 5 6-5 2 7M15 20h10M20 13v14"/>',
  };

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 40 40');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = badgeArtwork[grade.key] || badgeArtwork.starter;
  addBadgeRelief(svg);
  badge.appendChild(svg);
  return badge;
}

function renderGradeLegend() {
  if (!elements.gradeLegend) return;
  elements.gradeLegend.innerHTML = '';
  const rewardGrades = getRewardGrades();
  for (const grade of rewardGrades) {
    const item = document.createElement('span');
    item.dataset.grade = grade.key;
    item.title = `${grade.label} — dès ${grade.minScore} point${grade.minScore > 1 ? 's' : ''}`;
    const badge = createGradeBadgeElement({ ...grade, index: rewardGrades.indexOf(grade), next: null }, grade.label, grade.minScore);
    const label = document.createElement('span');
    label.className = 'grade-label';
    label.textContent = grade.label;
    item.append(badge, label);
    elements.gradeLegend.appendChild(item);
  }
}

function getMaximumSidebarWidth() {
  return Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, window.innerWidth - 360));
}

function clampSidebarWidth(width) {
  const parsed = Number(width);
  const safeWidth = Number.isFinite(parsed) ? parsed : 320;
  return Math.round(Math.min(getMaximumSidebarWidth(), Math.max(MIN_SIDEBAR_WIDTH, safeWidth)));
}

function applySidebarWidth(width, { persist = false } = {}) {
  state.sidebarWidth = clampSidebarWidth(width);
  document.documentElement.style.setProperty('--sidebar-width', `${state.sidebarWidth}px`);
  if (elements.sidebarResizer) {
    elements.sidebarResizer.setAttribute('aria-valuenow', String(state.sidebarWidth));
    elements.sidebarResizer.setAttribute('aria-valuemax', String(getMaximumSidebarWidth()));
  }
  if (persist) saveClassesToStorage();
}

function applyLayoutPreferences() {
  const isSpread = state.pageViewMode === 'spread';
  document.body.classList.toggle('sidebar-collapsed', Boolean(state.sidebarCollapsed));
  document.body.classList.toggle('filebar-collapsed', Boolean(state.filebarCollapsed));
  elements.sidebar.inert = state.sidebarCollapsed || state.changingDocument;
  elements.fileToolbarRow.inert = state.filebarCollapsed || state.changingDocument;
  applySidebarWidth(state.sidebarWidth);
  elements.pdfContainer?.classList.toggle('spread-view', isSpread);
  elements.singlePageBtn?.classList.toggle('active', !isSpread);
  elements.twoPageBtn?.classList.toggle('active', isSpread);
  elements.singlePageBtn?.setAttribute('aria-pressed', String(!isSpread));
  elements.twoPageBtn?.setAttribute('aria-pressed', String(isSpread));
  if (elements.toggleSidebarBtn) {
    const expanded = !state.sidebarCollapsed;
    const label = expanded ? 'Masquer la liste des élèves' : 'Afficher la liste des élèves';
    elements.toggleSidebarBtn.setAttribute('aria-expanded', String(expanded));
    elements.toggleSidebarBtn.setAttribute('aria-label', label);
    elements.toggleSidebarBtn.title = label;
  }
  if (elements.toggleFilebarBtn) {
    const expanded = !state.filebarCollapsed;
    const label = expanded ? 'Replier la rangée des fichiers' : 'Afficher la rangée des fichiers';
    elements.toggleFilebarBtn.setAttribute('aria-expanded', String(expanded));
    elements.toggleFilebarBtn.setAttribute('aria-label', label);
    elements.toggleFilebarBtn.title = label;
  }
}

function toggleSidebar() {
  state.sidebarCollapsed = !state.sidebarCollapsed;
  applyLayoutPreferences();
  saveClassesToStorage();
  setSessionStatus(
    state.sidebarCollapsed ? 'Liste des élèves masquée.' : 'Liste des élèves affichée.',
    'neutral'
  );
}

function toggleFilebar() {
  state.filebarCollapsed = !state.filebarCollapsed;
  applyLayoutPreferences();
  saveClassesToStorage();
  setSessionStatus(
    state.filebarCollapsed ? 'Rangée des fichiers repliée.' : 'Rangée des fichiers affichée.',
    'neutral'
  );
}

function deepClone(value) {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

function buildUndoSnapshot() {
  return {
    overlays: deepClone(state.overlays),
    markups: deepClone(state.markups),
    textOverlays: deepClone(state.textOverlays),
    classes: deepClone(state.classes),
    selectedClassId: state.selectedClassId ?? null,
    currentPageNumber: state.currentPageNumber ?? 1,
    selectedOverlayId: state.selectedOverlayId ?? null,
    selectedMarkupId: state.selectedMarkupId ?? null,
    selectedTextId: state.selectedTextId ?? null,
    annotationGroup: [...state.annotationGroup],
    defaultTextFontSizePx: getDefaultTextFontSizePx(),
    editingTextId: state.editingTextId ?? null,
    lastActiveOverlayId: state.lastActiveOverlayId ?? null,
    lastActiveMarkupId: state.lastActiveMarkupId ?? null,
    lastActiveTextId: state.lastActiveTextId ?? null,
    lastActiveType: state.lastActiveType ?? null,
    modalEditingId: state.modalEditingId ?? null,
    overlayOpacity: Number(state.overlayOpacity),
    markupColor: normalizeHexColor(state.markupColor, markupDefaults.color),
    activeMarkupTool: state.activeMarkupTool || null,
    absentStudentIds: [...state.absentStudentIds],
  };
}

function clearUndoHistory() {
  state.undoStack = [];
  state.redoStack = [];
  undoGestureFlags.clear();
}

function pushSnapshotToStack(stack, snapshot = null) {
  const next = snapshot || buildUndoSnapshot();
  if (!next) return;
  stack.push(next);
  if (stack.length > MAX_UNDO_STACK_SIZE) {
    stack.splice(0, stack.length - MAX_UNDO_STACK_SIZE);
  }
}

function pushUndoSnapshot(snapshot = null, options = {}) {
  const { clearRedo = true } = options;
  if (clearRedo) {
    state.redoStack = [];
  }
  pushSnapshotToStack(state.undoStack, snapshot);
}

function pushRedoSnapshot(snapshot = null) {
  pushSnapshotToStack(state.redoStack, snapshot);
}

function beginUndoGesture(key) {
  if (undoGestureFlags.has(key)) return;
  pushUndoSnapshot();
  undoGestureFlags.add(key);
}

function endUndoGesture(key) {
  undoGestureFlags.delete(key);
}

async function restoreFromUndoSnapshot(snapshot) {
  if (!snapshot) return;

  state.overlays = Array.isArray(snapshot.overlays) ? deepClone(snapshot.overlays) : [];
  state.markups = Array.isArray(snapshot.markups)
    ? deepClone(snapshot.markups).map((item) => normalizeMarkupItem(item))
    : [];
  state.textOverlays = Array.isArray(snapshot.textOverlays)
    ? deepClone(snapshot.textOverlays).map((item) => {
        const next = { ...item };
        ensureTextOverlayStyle(next);
        return next;
      })
    : [];

  const openByClass = new Map(state.classes.map((roster) => [roster.id, roster]));
  state.classes = normalizeClasses(Array.isArray(snapshot.classes) ? deepClone(snapshot.classes) : []);
  for (const roster of state.classes) {
    const current = openByClass.get(roster.id);
    if (!current) continue;
    roster.pdfPaths = current.pdfPaths;
    roster.lastPdfPath = current.lastPdfPath;
  }
  state.selectedClassId = snapshot.selectedClassId ?? null;
  const validStudentIds = new Set(getSelectedRoster()?.students.map((student) => student.id) || []);
  state.absentStudentIds = new Set(
    (Array.isArray(snapshot.absentStudentIds) ? snapshot.absentStudentIds : [])
      .filter((studentId) => validStudentIds.has(studentId))
  );
  rememberClassAttendance();
  state.currentPageNumber = Math.min(
    Math.max(1, Number(snapshot.currentPageNumber) || 1),
    state.totalPages || 1
  );
  state.selectedOverlayId = snapshot.selectedOverlayId ?? null;
  state.selectedMarkupId = snapshot.selectedMarkupId ?? null;
  state.selectedNativeShapeId = null;
  state.selectedTextId = snapshot.selectedTextId ?? null;
  state.annotationGroup = new Set(snapshot.annotationGroup || []);
  state.defaultTextFontSizePx = Math.max(1, Math.min(96, Number(snapshot.defaultTextFontSizePx) || textStyleDefaults.fontSizePx));
  state.editingTextId = snapshot.editingTextId ?? null;
  state.lastActiveOverlayId = snapshot.lastActiveOverlayId ?? null;
  state.lastActiveMarkupId = snapshot.lastActiveMarkupId ?? null;
  state.lastActiveTextId = snapshot.lastActiveTextId ?? null;
  state.lastActiveType = snapshot.lastActiveType ?? null;
  state.modalEditingId = snapshot.modalEditingId ?? null;
  state.activeMarkupTool = snapshot.activeMarkupTool === 'underline' ? 'underline' : snapshot.activeMarkupTool === 'highlight' ? 'highlight' : null;

  const savedOpacity = Number(snapshot.overlayOpacity);
  if (Number.isFinite(savedOpacity)) {
    state.overlayOpacity = Math.min(1, Math.max(0, savedOpacity));
    if (elements.overlayOpacityInput) {
      elements.overlayOpacityInput.value = String(Math.round(state.overlayOpacity * 100));
    }
  }
  state.markupColor = normalizeHexColor(snapshot.markupColor, markupDefaults.color);
  if (elements.markupColorInput) {
    elements.markupColorInput.value = state.markupColor;
  }
  if (elements.textSizeInput) {
    elements.textSizeInput.value = String(Math.round(getDefaultTextFontSizePx()));
  }

  closeStudentChooser();
  renderClassSelect();
  normalizeOverlayAssignments();
  renderStudentList();
  renderGradeLegend();
  renderClassFolderHint();
  saveClassesToStorage();

  if (state.pdfDoc) {
    await renderCurrentPage({ preserveScroll: true });
  } else {
    state.overlayElements.clear();
    state.markupElements.clear();
    state.textOverlayElements.clear();
    updateSelectionUi();
  }

  if (elements.classModal.open) {
    populateClassList();
    if (state.modalEditingId) {
      loadClassIntoEditor(state.modalEditingId);
    } else {
      prepareNewClass();
    }
  }

  updateUiStates();
}

async function undoLastAction() {
  if (_cgHistoryApplying) return;
  if (!state.undoStack.length) {
    setSessionStatus('Aucune modification à annuler.', 'neutral');
    return;
  }

  _cgHistoryApplying = true;
  try {
    undoGestureFlags.clear();
    pushRedoSnapshot(buildUndoSnapshot());
    const snapshot = state.undoStack.pop();
    await restoreFromUndoSnapshot(snapshot);
    setSessionStatus('Dernière modification annulée.', 'neutral');
  } finally {
    _cgHistoryApplying = false;
  }
}

async function redoLastAction() {
  if (_cgHistoryApplying) return;
  if (!state.redoStack.length) {
    setSessionStatus('Aucune modification à rétablir.', 'neutral');
    return;
  }

  _cgHistoryApplying = true;
  try {
    undoGestureFlags.clear();
    pushUndoSnapshot(buildUndoSnapshot(), { clearRedo: false });
    const snapshot = state.redoStack.pop();
    await restoreFromUndoSnapshot(snapshot);
    setSessionStatus('Modification rétablie.', 'neutral');
  } finally {
    _cgHistoryApplying = false;
  }
}

function renderClassFolderHint() {
  if (!elements.classFolderHint) return;
  const roster = getSelectedRoster();
  if (!roster) {
    elements.classFolderHint.textContent = 'Choisissez une classe pour activer le chargement rapide.';
    return;
  }
  const folder = roster.folderPath || null;
  if (!folder) {
    elements.classFolderHint.textContent = `Classe ${roster.name}: aucun dossier configuré.`;
    return;
  }
  elements.classFolderHint.textContent = `Classe ${roster.name}: ${folder}`;
}

function normalizeHexColor(value, fallback) {
  if (typeof value !== 'string') return fallback;
  const input = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(input)) return input.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(input)) {
    const r = input[1];
    const g = input[2];
    const b = input[3];
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return fallback;
}

function hexToRgba(value, alpha = 1) {
  const hex = normalizeHexColor(value, '#000000');
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  const a = Math.min(1, Math.max(0, Number(alpha)));
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function normalizeMarkupKind(value) {
  return value === 'underline' ? 'underline' : 'highlight';
}

function normalizeMarkupItem(item) {
  const kind = normalizeMarkupKind(item?.kind);
  const rect = {
    x: Number(item?.rect?.x) || 0,
    y: Number(item?.rect?.y) || 0,
    width: Number(item?.rect?.width) || 0,
    height: Number(item?.rect?.height) || 0,
  };
  if (kind === 'underline') {
    // Older sessions drew the line at the bottom of a rectangle.
    rect.y += Math.max(0, rect.height);
    rect.height = 0;
  }
  clampRectToPageBounds(rect);
  return {
    id: item?.id || createId(),
    pageNumber: Math.max(1, Number(item?.pageNumber) || 1),
    rect,
    kind,
    color: normalizeHexColor(item?.color, markupDefaults.color),
    opacity: kind === 'highlight'
      ? Math.min(1, Math.max(0.05, Number(item?.opacity ?? markupDefaults.highlightOpacity)))
      : 1,
  };
}

function ensureTextOverlayStyle(item) {
  if (!item) return;
  const parsedFont = Number(item.fontSizePx);
  item.fontSizePx = Number.isFinite(parsedFont) && parsedFont > 0 ? parsedFont : textStyleDefaults.fontSizePx;
  item.autoFontSize = false;
  item.textColor = normalizeHexColor(item.textColor, textStyleDefaults.textColor);
  const rawOpacity = Number(item.backgroundOpacity ?? item.opacity ?? textStyleDefaults.backgroundOpacity);
  item.backgroundOpacity = Math.min(1, Math.max(0, Number.isFinite(rawOpacity) ? rawOpacity : textStyleDefaults.backgroundOpacity));
}

function getTextOverlayById(textId) {
  if (!textId) return null;
  return state.textOverlays.find((item) => item.id === textId) || null;
}

function getSelectedTextOverlay() {
  return getTextOverlayById(state.selectedTextId);
}

function getDefaultTextFontSizePx() {
  const parsed = Number(state.defaultTextFontSizePx);
  if (Number.isFinite(parsed) && parsed >= 1) {
    return Math.min(96, Math.max(1, parsed));
  }
  return textStyleDefaults.fontSizePx;
}

function applyDefaultTextSize(rawSize, options = {}) {
  const {
    applyToAllExisting = false,
  } = options;
  const parsed = Number(rawSize);
  if (!Number.isFinite(parsed)) return;
  const nextSize = Math.max(1, Math.min(96, parsed));
  state.defaultTextFontSizePx = nextSize;
  if (applyToAllExisting) {
    for (const item of state.textOverlays) {
      ensureTextOverlayStyle(item);
      item.fontSizePx = nextSize;
      updateTextOverlayAppearance(item);
    }
  }
  if (elements.textSizeInput) {
    if (!state.selectedTextId || applyToAllExisting) {
      elements.textSizeInput.value = String(Math.round(nextSize));
    }
  }
  updateSelectionUi();
}

function getMarkupById(markupId) {
  if (!markupId) return null;
  return state.markups.find((item) => item.id === markupId) || null;
}

function getSelectedMarkup() {
  return getMarkupById(state.selectedMarkupId);
}

function focusTextEditorAtEnd(textId) {
  const el = state.textOverlayElements.get(textId);
  const content = el?.querySelector('.text-content');
  if (!content) return;
  content.focus();
  const selection = window.getSelection();
  if (!selection) return;
  const range = document.createRange();
  range.selectNodeContents(content);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
}

function blurActiveTextEditor() {
  const active = document.activeElement;
  if (active instanceof HTMLElement && active.classList.contains('text-content')) {
    active.blur();
  }
}

function getTypingElement(node = document.activeElement) {
  if (!node) return null;
  if (node instanceof Text) {
    return getTypingElement(node.parentElement);
  }
  if (!(node instanceof Element)) return null;
  if (node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement || node instanceof HTMLSelectElement) {
    return node;
  }
  if (node instanceof HTMLElement && node.isContentEditable) {
    return node;
  }
  return node.closest('input, textarea, select, [contenteditable="true"], .text-content');
}

function getTypingElementFromEvent(event) {
  if (event && typeof event.composedPath === 'function') {
    for (const node of event.composedPath()) {
      const match = getTypingElement(node);
      if (match) return match;
    }
  }
  const activeMatch = getTypingElement(document.activeElement);
  if (activeMatch) return activeMatch;
  const selection = typeof document.getSelection === 'function' ? document.getSelection() : null;
  const anchorMatch = getTypingElement(selection?.anchorNode || null);
  if (anchorMatch) return anchorMatch;
  if (state.editingTextId) {
    const editor = state.textOverlayElements.get(state.editingTextId)?.querySelector('.text-content');
    if (editor) return editor;
  }
  return null;
}

function isTypingEvent(event) {
  return Boolean(getTypingElementFromEvent(event));
}

function shouldKeepCaretNavigation(event) {
  if (!event) return false;
  if (!isTypingEvent(event)) return false;
  if (event.key === 'PageUp' || event.key === 'PageDown') {
    return true;
  }
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    return true;
  }
  return false;
}

function getDisplayedTextFontSizePx(item, pageState) {
  ensureTextOverlayStyle(item);
  const zoom = state.currentZoom || 1;
  return Math.max(1, Math.round(item.fontSizePx * zoom));
}

function setSelectedOverlay(overlayId) {
  state.selectedOverlayId = overlayId || null;
  if (overlayId) {
    state.annotationGroup.clear();
    state.selectedMarkupId = null;
    state.selectedNativeShapeId = null;
    state.selectedTextId = null;
    state.editingTextId = null;
    state.lastActiveOverlayId = overlayId;
    state.lastActiveType = 'overlay';
    blurActiveTextEditor();
  }
  updateSelectionUi();
}

function setSelectedTextOverlay(textId, options = {}) {
  const { editing = false, focusEditor = false } = options;
  state.selectedTextId = textId || null;
  if (textId) {
    state.annotationGroup.clear();
    state.selectedOverlayId = null;
    state.selectedMarkupId = null;
    state.selectedNativeShapeId = null;
    state.lastActiveTextId = textId;
    state.lastActiveType = 'text';
    if (editing) {
      state.editingTextId = textId;
    } else {
      state.editingTextId = null;
      blurActiveTextEditor();
    }
  } else {
    state.editingTextId = null;
    blurActiveTextEditor();
  }
  updateSelectionUi();
  if (editing && focusEditor && textId) {
    focusTextEditorAtEnd(textId);
  }
}

function setSelectedMarkup(markupId) {
  state.selectedMarkupId = markupId || null;
  if (markupId) {
    state.annotationGroup.clear();
    state.selectedOverlayId = null;
    state.selectedNativeShapeId = null;
    state.selectedTextId = null;
    state.editingTextId = null;
    state.lastActiveMarkupId = markupId;
    state.lastActiveType = 'markup';
    blurActiveTextEditor();
  }
  updateSelectionUi();
}

function setSelectedNativeShape(shapeKey) {
  state.selectedNativeShapeId = shapeKey || null;
  if (shapeKey) {
    state.annotationGroup.clear();
    state.selectedOverlayId = null;
    state.selectedMarkupId = null;
    state.selectedTextId = null;
    state.editingTextId = null;
    state.lastActiveNativeShapeId = shapeKey;
    state.lastActiveType = 'native-shape';
    blurActiveTextEditor();
  }
  updateSelectionUi();
}

function clearSelection() {
  if (state.annotationGroup.size) {
    state.annotationGroup.clear();
    state.lastActiveType = null;
    state.hoverOverlayId = null;
    state.hoverTextId = null;
  }
  state.selectedOverlayId = null;
  state.selectedMarkupId = null;
  state.selectedNativeShapeId = null;
  state.selectedTextId = null;
  state.editingTextId = null;
  blurActiveTextEditor();
  updateSelectionUi();
}

function updateTextStyleToolsUi() {
  const hasSelection = Boolean(state.selectedTextId);
  const hasPdf = Boolean(state.pdfDoc);
  const controls = [
    elements.textColorInput,
    elements.textOpacityInput,
  ];
  const tool = elements.textStyleTools;
  if (tool) {
    tool.classList.toggle('disabled', !hasPdf);
  }

  for (const control of controls) {
    if (!control) continue;
    control.disabled = !hasSelection;
  }
  if (elements.textSizeInput) {
    elements.textSizeInput.disabled = !hasPdf;
  }
  if (elements.textSizeAllBtn) {
    elements.textSizeAllBtn.disabled = !hasPdf;
  }

  if (!hasSelection) {
    if (elements.textSizeInput) {
      elements.textSizeInput.value = String(Math.round(getDefaultTextFontSizePx()));
    }
    return;
  }

  const item = getSelectedTextOverlay();
  if (!item) {
    state.selectedTextId = null;
    state.editingTextId = null;
    if (tool) tool.classList.add('disabled');
    for (const control of controls) {
      if (control) control.disabled = true;
    }
    if (elements.textSizeInput) {
      elements.textSizeInput.value = String(Math.round(getDefaultTextFontSizePx()));
    }
    return;
  }
  ensureTextOverlayStyle(item);
  if (elements.textSizeInput) elements.textSizeInput.value = String(Math.max(1, Math.round(item.fontSizePx)));
  if (elements.textColorInput) elements.textColorInput.value = normalizeHexColor(item.textColor, textStyleDefaults.textColor);
  if (elements.textOpacityInput) elements.textOpacityInput.value = String(Math.round(item.backgroundOpacity * 100));
}

function updateSelectionUi() {
  for (const [overlayId, el] of state.overlayElements.entries()) {
    el.classList.toggle('selected', overlayId === state.selectedOverlayId);
    el.classList.toggle('group-selected', state.annotationGroup.has(overlayId));
  }
  for (const [markupId, el] of state.markupElements.entries()) {
    el.classList.toggle('selected', markupId === state.selectedMarkupId);
  }
  for (const [shapeKey, el] of state.nativeShapeElements.entries()) {
    el.classList.toggle('selected', shapeKey === state.selectedNativeShapeId);
  }
  for (const [textId, el] of state.textOverlayElements.entries()) {
    const isSelected = textId === state.selectedTextId;
    const isEditing = textId === state.editingTextId;
    el.classList.toggle('selected', isSelected);
    el.classList.toggle('group-selected', state.annotationGroup.has(textId));
    el.classList.toggle('editing', isEditing);
    const content = el.querySelector('.text-content');
    if (content) {
      content.contentEditable = isEditing ? 'true' : 'false';
    }
  }
  const selectedMarkup = getSelectedMarkup();
  if (elements.markupColorInput) {
    const currentColor = normalizeHexColor(selectedMarkup?.color || state.markupColor, markupDefaults.color);
    if (elements.markupColorInput.value !== currentColor) {
      elements.markupColorInput.value = currentColor;
    }
  }
  updateTextStyleToolsUi();
}

function applyStyleToSelectedText(mutator) {
  const item = getSelectedTextOverlay();
  if (!item) return;
  ensureTextOverlayStyle(item);
  mutator(item);
  updateTextOverlayAppearance(item);
  updateSelectionUi();
}

function copySelectedTextOverlayToClipboard() {
  const item = getSelectedTextOverlay();
  if (!item) return false;
  ensureTextOverlayStyle(item);
  state.textOverlayClipboard = {
    rect: deepClone(item.rect),
    text: item.text || '',
    fontSizePx: Number(item.fontSizePx) || getDefaultTextFontSizePx(),
    textColor: normalizeHexColor(item.textColor, textStyleDefaults.textColor),
    backgroundOpacity: Math.min(1, Math.max(0, Number(item.backgroundOpacity ?? textStyleDefaults.backgroundOpacity))),
  };
  setSessionStatus('Zone texte copiée.', 'neutral');
  return true;
}

function pasteTextOverlayFromClipboard() {
  if (!state.pdfDoc || !state.textOverlayClipboard) return false;
  const pageNumber = state.currentPageNumber;
  const pageState = state.pageStates.get(pageNumber);
  if (!pageState) return false;

  pushUndoSnapshot();
  const sourceRect = {
    x: Number(state.textOverlayClipboard.rect?.x) || 0,
    y: Number(state.textOverlayClipboard.rect?.y) || 0,
    width: Number(state.textOverlayClipboard.rect?.width) || textOverlayDefaults.width,
    height: Number(state.textOverlayClipboard.rect?.height) || textOverlayDefaults.height,
  };
  const rect = { ...sourceRect };

  if (state.pointerHint.valid && state.pointerHint.pageNumber === pageNumber) {
    rect.x = state.pointerHint.x - rect.width / 2;
    rect.y = state.pointerHint.y - rect.height / 2;
  } else {
    rect.x += 0.02;
    rect.y += 0.02;
  }

  const minW = textOverlayDefaults.minWidthPx / pageState.width;
  const minH = textOverlayDefaults.minHeightPx / pageState.height;
  rect.width = Math.max(rect.width, minW);
  rect.height = Math.max(rect.height, minH);
  clampRectToPageBounds(rect);

  const item = {
    id: createId(),
    pageNumber,
    rect,
    text: state.textOverlayClipboard.text || '',
    fontSizePx: Number(state.textOverlayClipboard.fontSizePx) || getDefaultTextFontSizePx(),
    autoFontSize: false,
    textColor: normalizeHexColor(state.textOverlayClipboard.textColor, textStyleDefaults.textColor),
    backgroundOpacity: Math.min(1, Math.max(0, Number(state.textOverlayClipboard.backgroundOpacity ?? textStyleDefaults.backgroundOpacity))),
  };
  ensureTextOverlayStyle(item);
  state.textOverlays.push(item);
  renderTextOverlayElement(item);
  setSelectedTextOverlay(item.id, { editing: false });
  updateUiStates();
  setSessionStatus('Zone texte collée.', 'success');
  return true;
}


document.addEventListener('DOMContentLoaded', init, { once: true });

async function init() {
  loadClassesFromStorage();
  applyLayoutPreferences();
  renderClassSelect();
  restoreClassAttendance();
  renderStudentList();
  renderGradeLegend();
  renderClassFolderHint();
  if (elements.overlayOpacityInput) {
    elements.overlayOpacityInput.value = String(Math.round(state.overlayOpacity * 100));
  }
  if (elements.overlayOpacityOutput) {
    elements.overlayOpacityOutput.textContent = `${Math.round(state.overlayOpacity * 100)} %`;
  }
  if (elements.textSizeInput) {
    elements.textSizeInput.value = String(Math.round(getDefaultTextFontSizePx()));
  }
  bindEvents();
  setupStudentListResizeObserver();
  setupSidebarResizer();
  setSessionStatus('Prêt.', 'neutral');
  updateUiStates();
  await restoreLastPdfOnStartup();
}

function bindEvents() {
  if (elements.anchorBtn) {
    elements.anchorBtn.style.display = 'none';
  }
  
  elements.openPdfBtn.addEventListener('click', handleOpenPdfClick);
  document.addEventListener('click', animateControlPress, { capture: true });
  elements.welcomeOpenPdfBtn.addEventListener('click', handleOpenPdfClick);
  elements.welcomeHelpBtn.addEventListener('click', openHelpModal);
  if (elements.reopenLastPdfBtn) {
    elements.reopenLastPdfBtn.addEventListener('click', handleReopenLastPdfClick);
  }
  elements.pdfInput.addEventListener('change', handlePdfFileSelection);
  elements.sessionFileInput.addEventListener('change', handleSessionFileSelection);
  elements.addOverlayBtn.addEventListener('click', addOverlay);
  elements.assignBtn.addEventListener('click', assignStudentsToOverlays);
  elements.clearAssignmentsBtn.addEventListener('click', clearOverlayAssignments);
  elements.zoomInBtn.addEventListener('click', () => changeZoom(1.15));
  elements.zoomOutBtn.addEventListener('click', () => changeZoom(1 / 1.15));
  elements.zoomResetBtn?.addEventListener('click', () => changeZoom(1 / state.currentZoom));
  elements.singlePageBtn?.addEventListener('click', () => setPageViewMode('single'));
  elements.twoPageBtn?.addEventListener('click', () => setPageViewMode('spread'));
  elements.toggleFilebarBtn?.addEventListener('click', toggleFilebar);
  elements.toggleSidebarBtn?.addEventListener('click', toggleSidebar);
  elements.toolSettings.addEventListener('beforetoggle', (event) => {
    if (event.newState === 'open') positionToolSettings();
  });
  window.addEventListener('resize', () => {
    if (elements.toolSettings.matches(':popover-open')) positionToolSettings();
  });
  if (elements.addTextBtn) {
    elements.addTextBtn.addEventListener('click', addTextOverlay);
  }
  if (elements.toggleHighlightToolBtn) {
    elements.toggleHighlightToolBtn.addEventListener('click', () => {
      state.activeMarkupTool = state.activeMarkupTool === 'highlight' ? null : 'highlight';
      updateUiStates();
    });
  }
  if (elements.toggleUnderlineToolBtn) {
    elements.toggleUnderlineToolBtn.addEventListener('click', () => {
      state.activeMarkupTool = state.activeMarkupTool === 'underline' ? null : 'underline';
      updateUiStates();
    });
  }
  elements.classSelect.addEventListener('change', handleClassSelection);
  elements.manageClassesBtn.addEventListener('click', openClassModal);
  elements.leaderboardBtn?.addEventListener('click', openLeaderboard);
  elements.closeLeaderboardBtn?.addEventListener('click', closeLeaderboard);
  elements.leaderboardModal?.addEventListener('click', (event) => {
    if (event.target === elements.leaderboardModal) closeLeaderboard();
  });
  elements.closeModalBtn.addEventListener('click', closeClassModal);
  elements.classModal.addEventListener('click', (event) => {
    if (event.target === elements.classModal) {
      closeClassModal();
    }
  });
  elements.newClassBtn.addEventListener('click', prepareNewClass);
  if (elements.chooseClassFolderBtn) {
    elements.chooseClassFolderBtn.addEventListener('click', chooseClassFolderForEditor);
  }
  if (elements.clearClassFolderBtn) {
    elements.clearClassFolderBtn.addEventListener('click', () => {
      elements.classFolderInput.value = '';
      elements.modalFeedback.textContent = 'Dossier supprimé pour cette classe.';
    });
  }
  elements.saveClassBtn.addEventListener('click', saveClass);
  elements.deleteClassBtn.addEventListener('click', deleteEditingClass);
  elements.resetScoresBtn.addEventListener('click', resetScoresForCurrentClass);
  if (elements.pageOverviewBtn) {
    elements.pageOverviewBtn.addEventListener('click', openPageOverview);
  }
  if (elements.closeOverviewBtn) {
    elements.closeOverviewBtn.addEventListener('click', closePageOverview);
  }
  if (elements.pageOverviewModal) {
    elements.pageOverviewModal.addEventListener('click', (e) => {
      if (e.target === elements.pageOverviewModal) closePageOverview();
    });
  }
  elements.pdfScroll.addEventListener('scroll', handleImmediateScroll);
  elements.pdfScroll.addEventListener('scroll', debounce(updateCurrentPageIndicator, 120));
  elements.pdfScroll.addEventListener('pointermove', updatePointerHint);
  elements.pdfScroll.addEventListener('pointerdown', handleAnnotationPointerDown, { capture: true });
  elements.pdfScroll.addEventListener('pointerdown', updatePointerHint);
  elements.pdfScroll.addEventListener('pointerleave', () => { state.pointerHint.valid = false; });
  elements.pdfScroll.addEventListener('wheel', handleWheelZoom, { passive: false });

  if (elements.textSizeInput) {
    elements.textSizeInput.addEventListener('input', () => {
      const raw = Number(elements.textSizeInput.value);
      if (!Number.isFinite(raw)) return;
      const displaySize = Math.max(1, Math.min(96, raw));
      if (state.selectedTextId) {
        beginUndoGesture('text-size');
        applyStyleToSelectedText((item) => {
          item.fontSizePx = displaySize;
        });
      } else if (state.pdfDoc) {
        beginUndoGesture('text-size-default');
        applyDefaultTextSize(displaySize, { applyToAllExisting: true });
      }
    });
    elements.textSizeInput.addEventListener('change', () => endUndoGesture('text-size'));
    elements.textSizeInput.addEventListener('blur', () => endUndoGesture('text-size'));
    elements.textSizeInput.addEventListener('change', () => endUndoGesture('text-size-default'));
    elements.textSizeInput.addEventListener('blur', () => endUndoGesture('text-size-default'));
  }
  if (elements.textSizeAllBtn) {
    elements.textSizeAllBtn.addEventListener('click', () => {
      if (!state.pdfDoc) return;
      const raw = Number(elements.textSizeInput?.value);
      if (!Number.isFinite(raw)) return;
      pushUndoSnapshot();
      applyDefaultTextSize(raw, { applyToAllExisting: true });
      setSessionStatus('Taille appliquée à toutes les zones texte du document.', 'success');
    });
  }
  if (elements.textColorInput) {
    elements.textColorInput.addEventListener('input', () => {
      if (!state.selectedTextId) return;
      beginUndoGesture('text-color');
      applyStyleToSelectedText((item) => {
        item.textColor = normalizeHexColor(elements.textColorInput.value, textStyleDefaults.textColor);
      });
    });
    elements.textColorInput.addEventListener('change', () => endUndoGesture('text-color'));
    elements.textColorInput.addEventListener('blur', () => endUndoGesture('text-color'));
  }
  if (elements.textOpacityInput) {
    elements.textOpacityInput.addEventListener('input', () => {
      if (!state.selectedTextId) return;
      const value = Number(elements.textOpacityInput.value);
      if (!Number.isFinite(value)) return;
      beginUndoGesture('text-opacity');
      applyStyleToSelectedText((item) => {
        item.backgroundOpacity = Math.min(1, Math.max(0, value / 100));
      });
    });
    elements.textOpacityInput.addEventListener('change', () => endUndoGesture('text-opacity'));
    elements.textOpacityInput.addEventListener('blur', () => endUndoGesture('text-opacity'));
  }
  if (elements.overlayOpacityInput) {
    elements.overlayOpacityInput.addEventListener('input', () => {
      const value = Number(elements.overlayOpacityInput.value);
      if (!Number.isFinite(value)) return;
      beginUndoGesture('overlay-opacity');
      state.overlayOpacity = Math.min(1, Math.max(0, value / 100));
      if (elements.overlayOpacityOutput) {
        elements.overlayOpacityOutput.textContent = `${Math.round(value)} %`;
      }
      for (const overlay of state.overlays) {
        updateOverlayElementAppearance(overlay);
      }
    });
    elements.overlayOpacityInput.addEventListener('change', () => endUndoGesture('overlay-opacity'));
    elements.overlayOpacityInput.addEventListener('blur', () => endUndoGesture('overlay-opacity'));
  }
  if (elements.markupColorInput) {
    elements.markupColorInput.addEventListener('input', () => {
      const color = normalizeHexColor(elements.markupColorInput.value, markupDefaults.color);
      state.markupColor = color;
      if (!state.selectedMarkupId) return;
      beginUndoGesture('markup-color');
      const item = getSelectedMarkup();
      if (!item) return;
      item.color = color;
      updateMarkupAppearance(item);
    });
    elements.markupColorInput.addEventListener('change', () => endUndoGesture('markup-color'));
    elements.markupColorInput.addEventListener('blur', () => endUndoGesture('markup-color'));
  }

  if (elements.saveSessionBtn) {
    elements.saveSessionBtn.addEventListener('click', handleSaveSessionClick);
  }
  if (elements.loadSessionBtn) {
    elements.loadSessionBtn.addEventListener('click', handleLoadSessionClick);
  }
  if (elements.openHelpBtn) {
    elements.openHelpBtn.addEventListener('click', openHelpModal);
  }
  if (elements.closeHelpBtn) {
    elements.closeHelpBtn.addEventListener('click', closeHelpModal);
  }
  if (elements.helpModal) {
    elements.helpModal.addEventListener('click', (event) => {
      if (event.target === elements.helpModal) {
        closeHelpModal();
      }
    });
  }




  
  // NOUVEAUX event listeners pour la navigation
  if (elements.previousPageBtn) elements.previousPageBtn.addEventListener('click', goToPreviousPage);
  if (elements.nextPageBtn) elements.nextPageBtn.addEventListener('click', goToNextPage);
  
  // Raccourcis clavier
  document.addEventListener('keydown', (e) => {
    const isLeaderboardOpen = Boolean(elements.leaderboardModal && !elements.leaderboardModal.classList.contains('hidden'));
    if (isLeaderboardOpen) {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeLeaderboard();
      }
      return;
    }
    if (e.defaultPrevented || state.changingDocument || elements.helpModal.open || elements.classModal.open || elements.toolSettings.matches(':popover-open')) return;
    if (cancelAnnotationGesture) {
      if (e.key === 'Escape') cancelAnnotationGesture();
      e.preventDefault();
      return;
    }
    if (e.key === 'Escape' && state.annotationGroup.size) {
      clearSelection();
      e.preventDefault();
      return;
    }

    const quickDrawReady = Boolean(state.pdfDoc && (e.metaKey || e.altKey || state.activeMarkupTool));
    document.body.classList.toggle('quick-draw-ready', quickDrawReady);

    const isSaveShortcut = (e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 's';
    if (isSaveShortcut) {
      e.preventDefault();
      void saveCurrentSession({
        forcePrompt: !state.currentPdfPath,
        silent: false,
        reason: 'shortcut',
      });
      return;
    }

    const isRedoShortcut = (
      ((e.metaKey || e.ctrlKey) && e.shiftKey && !e.altKey && e.key.toLowerCase() === 'z')
      || (e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'y')
    );
    if (isRedoShortcut) {
      const isTyping = isTypingEvent(e);
      if (!isTyping) {
        e.preventDefault();
        void redoLastAction();
      }
      return;
    }

    const isUndoShortcut = (e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'z';
    if (isUndoShortcut) {
      const isTyping = isTypingEvent(e);
      if (!isTyping) {
        e.preventDefault();
        void undoLastAction();
      }
      return;
    }

    const isTyping = isTypingEvent(e);

    const isCopyShortcut = (e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'c';
    if (isCopyShortcut) {
      if (!isTyping && copySelectedTextOverlayToClipboard()) {
        e.preventDefault();
      }
      return;
    }

    const isPasteShortcut = (e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'v';
    if (isPasteShortcut) {
      if (!isTyping && pasteTextOverlayFromClipboard()) {
        e.preventDefault();
      }
      return;
    }

    if (!state.pdfDoc) return;
    if (shouldKeepCaretNavigation(e) || elements.documentBar.contains(e.target)) {
      return;
    }
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault();
      goToPreviousPage();
      return;
    }
    if (e.key === 'ArrowRight' || e.key === 'PageDown') {
      e.preventDefault();
      goToNextPage();
      return;
    }
    if (e.key !== 'Delete' && e.key !== 'Backspace') return;

    const activeDelete = document.activeElement;
    const isTypingInTextOverlay = activeDelete instanceof HTMLElement && activeDelete.classList.contains('text-content') && state.editingTextId;
    const isTypingInInput = activeDelete && (activeDelete.tagName === 'INPUT' || activeDelete.tagName === 'TEXTAREA');
    if (isTypingInTextOverlay || isTypingInInput) return;

    if (state.annotationGroup.size) {
      deleteAnnotationGroup();
      e.preventDefault();
      return;
    }
    if (state.selectedMarkupId) {
      deleteMarkup(state.selectedMarkupId);
      e.preventDefault();
      return;
    }
    if (state.selectedNativeShapeId) {
      e.preventDefault();
      void runDocumentChange(() => deleteNativeShape(state.selectedNativeShapeId));
      return;
    }
    if (state.selectedTextId) {
      deleteTextOverlay(state.selectedTextId);
      e.preventDefault();
      return;
    }
    if (state.selectedOverlayId) {
      deleteOverlayWithoutScoring(state.selectedOverlayId);
      e.preventDefault();
      return;
    }
    if (state.lastActiveType === 'markup' && state.lastActiveMarkupId) {
      deleteMarkup(state.lastActiveMarkupId);
      e.preventDefault();
      return;
    }
    if (state.lastActiveType === 'native-shape' && state.lastActiveNativeShapeId) {
      e.preventDefault();
      void runDocumentChange(() => deleteNativeShape(state.lastActiveNativeShapeId));
      return;
    }
    if (state.lastActiveType === 'text' && state.lastActiveTextId) {
      deleteTextOverlay(state.lastActiveTextId);
      e.preventDefault();
      return;
    }
    if (state.lastActiveType === 'overlay' && state.lastActiveOverlayId) {
      deleteOverlayWithoutScoring(state.lastActiveOverlayId);
      e.preventDefault();
      return;
    }
    if (state.hoverNativeShapeId) {
      e.preventDefault();
      void runDocumentChange(() => deleteNativeShape(state.hoverNativeShapeId));
      return;
    }
    if (state.hoverMarkupId) {
      deleteMarkup(state.hoverMarkupId);
      e.preventDefault();
      return;
    }
    if (state.hoverTextId) {
      deleteTextOverlay(state.hoverTextId);
      e.preventDefault();
      return;
    }
    if (state.hoverOverlayId) {
      deleteOverlayWithoutScoring(state.hoverOverlayId);
      e.preventDefault();
    }
  });

  document.addEventListener('keyup', (e) => {
    if (e.key === 'Meta' || e.key === 'Alt') {
      document.body.classList.remove('quick-draw-ready');
    }
  });

  window.addEventListener('blur', () => {
    document.body.classList.remove('quick-draw-ready');
    cancelAnnotationGesture?.();
  });

  document.addEventListener('pointerdown', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const clickedOverlay = target.closest('.overlay');
    const clickedMarkup = target.closest('.markup-annotation');
    const clickedNativeShape = target.closest('.native-shape');
    const clickedText = target.closest('.text-overlay');
    const clickedSettings = target.closest('#tool-settings, #tool-settings-btn, #document-bar');

    if (clickedOverlay || clickedMarkup || clickedNativeShape || clickedText || clickedSettings) return;

    if (state.selectedOverlayId || state.selectedMarkupId || state.selectedNativeShapeId || state.selectedTextId || state.annotationGroup.size) {
      clearSelection();
    }
  }, { capture: true });
}

function positionToolSettings() {
  const { left, bottom } = elements.toolSettingsBtn.getBoundingClientRect();
  elements.toolSettings.style.setProperty('--settings-left', left + 'px');
  elements.toolSettings.style.setProperty('--settings-top', (bottom + 9) + 'px');
}


function normalizePdfPaths(paths, lastPath) {
  const entries = Array.isArray(paths) ? paths : [];
  return [...new Set([...entries, lastPath].filter((item) => typeof item === 'string' && item.length))];
}

function getBrowserDocuments() {
  return state.browserDocuments.get(state.selectedClassId) || [];
}

function getOpenDocuments() {
  if (!hasDesktopApi) return getBrowserDocuments();
  const roster = getSelectedRoster();
  const paths = roster ? roster.pdfPaths : state.standalonePdfPaths;
  return (paths || []).map((pdfPath) => ({ key: pdfPath, name: basenameFromPath(pdfPath), pdfPath }));
}

function getActiveDocumentKey() {
  return state.currentPdfPath || state.browserDocument?.key || null;
}

function rememberDesktopDocuments(paths, activePath) {
  const roster = getSelectedRoster();
  const currentPaths = roster ? roster.pdfPaths : state.standalonePdfPaths;
  const nextPaths = normalizePdfPaths([...(currentPaths || []), ...paths], activePath);
  if (roster) {
    roster.pdfPaths = nextPaths;
    roster.lastPdfPath = activePath;
  } else {
    state.standalonePdfPaths = nextPaths;
    state.lastOpenedPdfPath = activePath;
  }
  saveClassesToStorage();
}

function rememberBrowserDocuments(documents, activeDocument) {
  state.browserDocuments.set(state.selectedClassId, documents);
  if (activeDocument) {
    state.lastBrowserDocuments.set(state.selectedClassId, activeDocument.key);
  } else {
    state.lastBrowserDocuments.delete(state.selectedClassId);
  }
}

function forgetDocument(documentKey) {
  const roster = getSelectedRoster();
  const documents = getOpenDocuments();
  const index = documents.findIndex((item) => item.key === documentKey);
  if (index < 0) return;
  const remaining = documents.filter((item) => item.key !== documentKey);
  const neighbor = documents[index + 1] || documents[index - 1];
  if (hasDesktopApi) {
    const lastPath = roster ? roster.lastPdfPath : state.lastOpenedPdfPath;
    rememberDesktopDocumentsAfterClose(remaining, lastPath === documentKey ? neighbor?.key ?? null : lastPath);
  } else {
    const lastKey = state.lastBrowserDocuments.get(state.selectedClassId);
    rememberBrowserDocuments(remaining, remaining.find((item) => item.key === lastKey) || neighbor);
  }
}

function rememberDesktopDocumentsAfterClose(remaining, lastPath) {
  const roster = getSelectedRoster();
  const paths = remaining.map((item) => item.pdfPath);
  if (roster) {
    roster.pdfPaths = paths;
    roster.lastPdfPath = lastPath;
  } else {
    state.standalonePdfPaths = paths;
    state.lastOpenedPdfPath = lastPath;
  }
  saveClassesToStorage();
}

function renderDocumentTabs({ restoreFocus = false } = {}) {
  const documents = getOpenDocuments();
  const activeKey = getActiveDocumentKey();
  elements.documentBar.hidden = documents.length < 2 && (!documents.length || documents[0].key === activeKey);

  let activeButton = null;
  const tabs = documents.map((entry) => {
    const tab = elements.documentTabTemplate.content.firstElementChild.cloneNode(true);
    const button = tab.querySelector('.document-tab-open');
    const closeButton = tab.querySelector('.document-tab-close');
    const isActive = entry.key === activeKey;
    button.querySelector('span').textContent = entry.name;
    button.title = entry.pdfPath || entry.name;
    button.setAttribute('aria-pressed', String(isActive));
    button.addEventListener('click', () => {
      if (entry.key !== getActiveDocumentKey()) void runDocumentChange(() => openKnownDocument(entry));
    });
    closeButton.title = 'Fermer ' + entry.name;
    closeButton.setAttribute('aria-label', closeButton.title);
    closeButton.addEventListener('click', () => { void closeDocument(entry.key); });
    if (isActive) activeButton = button;
    return tab;
  });
  elements.documentTabs.replaceChildren(...tabs);
  if (activeButton && !elements.documentBar.hidden) {
    activeButton.parentElement.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    if (restoreFocus) activeButton.focus({ preventScroll: true });
  } else if (restoreFocus) {
    const nextButton = elements.documentBar.hidden ? elements.openPdfBtn : tabs[0]?.querySelector('.document-tab-open');
    nextButton?.focus({ preventScroll: true });
  }
}

function setDocumentBusy(busy) {
  state.changingDocument = busy;
  elements.viewer.setAttribute('aria-busy', String(busy));
  elements.pdfScroll.inert = busy;
  elements.documentBar.inert = busy;
  elements.toolsToolbarRow.inert = busy;
  elements.classModal.inert = busy;
  applyLayoutPreferences();
}

function runDocumentChange(change) {
  if (documentChangePromise || _cgHistoryApplying) return Promise.resolve(false);
  cancelAnnotationGesture?.();
  const restoreFocus = elements.documentBar.contains(document.activeElement);
  setDocumentBusy(true);
  documentChangePromise = Promise.resolve()
    .then(change)
    .catch((error) => {
      console.error('Erreur pendant le changement de document', error);
      setSessionStatus('Impossible de charger ce document ou sa session.', 'danger');
      return false;
    })
    .finally(() => {
      documentChangePromise = null;
      setDocumentBusy(false);
      renderDocumentTabs({ restoreFocus });
      updateUiStates();
    });
  return documentChangePromise;
}

function sessionForActiveClass(session) {
  if (!session?.pdf?.fingerprint) return null;
  const classId = state.selectedClassId;
  if (!state.classes.length || !session.classes || (session.classes.selectedClassId ?? null) === classId) {
    return session;
  }
  return Array.isArray(session.documentViews)
    ? session.documentViews.find((entry) => entry?.classId === classId)?.snapshot ?? null
    : null;
}

async function preparePdf(bytes) {
  const task = getDocument({ data: bytes });
  try {
    const pdfDoc = await task.promise;
    await pdfDoc.getPage(1);
    return pdfDoc;
  } catch (error) {
    await task.destroy().catch(() => {});
    throw error;
  }
}

async function saveBeforeLeavingDocument() {
  if (!state.pdfDoc) return true;
  blurActiveTextEditor();
  if (pendingSessionSave) await pendingSessionSave;
  const result = await saveCurrentSession({ silent: true });
  return result.saved;
}

async function displayPreparedPdf(pdfDoc, { name, size, pdfPath = null, browserDocument = null, sessions = [] }) {
  if (!await saveBeforeLeavingDocument()) {
    await pdfDoc.destroy().catch(() => {});
    return false;
  }

  clearLoadedPdfView();
  state.pdfDoc = pdfDoc;
  state.currentPdfPath = pdfPath;
  state.browserDocument = browserDocument;
  state.pdfInfo = { name, size, fingerprint: pdfDoc.fingerprints?.[0] ?? null };
  state.totalPages = pdfDoc.numPages;
  const session = sessions
    .filter((candidate) => candidate?.pdf?.fingerprint === state.pdfInfo.fingerprint)
    .sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0))[0];

  if (session) {
    await applySession(session, {
      includeClassData: !state.classes.length,
      restoreLayout: false,
    });
  } else {
    if (state.pageViewMode === 'spread' && state.totalPages > 1) state.currentZoom = await getSpreadFitZoom();
    await renderCurrentPage();
  }
  setSessionStatus('PDF affiché (' + name + ').');
  return true;
}

async function loadPdfFromDesktopSelection(selection) {
  const pdfPath = selection?.pdfPath;
  if (!pdfPath) return false;
  const paths = normalizePdfPaths([pdfPath, ...(selection.additionalPaths || [])]);
  if (state.currentPdfPath === pdfPath && state.pdfDoc) {
    rememberDesktopDocuments(paths, pdfPath);
    return true;
  }
  const rawBytes = await window.api.readFileBytes(pdfPath);
  const bytes = parseIpcBytes(rawBytes);
  if (!bytes?.byteLength) {
    setSessionStatus('Impossible de lire ce PDF.', 'danger');
    return false;
  }
  const size = bytes.byteLength;
  const pdfDoc = await preparePdf(bytes);
  const opened = await displayPreparedPdf(pdfDoc, {
    pdfPath,
    name: selection.pdfName || basenameFromPath(pdfPath),
    size,
    sessions: [sessionForActiveClass(selection.associatedSession?.data), selection.localSession?.data],
  });
  if (opened) rememberDesktopDocuments(paths, pdfPath);
  return opened;
}

async function loadBrowserDocument(entry, documents = getBrowserDocuments()) {
  if (state.browserDocument === entry && state.pdfDoc) return true;
  const pdfDoc = await preparePdf(new Uint8Array(await entry.file.arrayBuffer()));
  const opened = await displayPreparedPdf(pdfDoc, {
    name: entry.name,
    size: entry.file.size,
    browserDocument: entry,
    sessions: [entry.snapshot],
  });
  if (opened) rememberBrowserDocuments(documents, entry);
  return opened;
}

async function openKnownDocument(entry) {
  if (!entry.pdfPath) return loadBrowserDocument(entry);
  const selection = await window.api.reopenLastClassPdf({
    lastPdfPath: entry.pdfPath,
    classId: state.selectedClassId,
  });
  if (!selection) {
    forgetDocument(entry.key);
    setSessionStatus('PDF introuvable. Utilisez « Ouvrir un PDF » pour le retrouver.', 'warning', { notify: true });
    return false;
  }
  return loadPdfFromDesktopSelection(selection);
}

async function openPreferredDocument() {
  const documents = getOpenDocuments();
  const roster = getSelectedRoster();
  const lastKey = hasDesktopApi
    ? (roster ? roster.lastPdfPath : state.lastOpenedPdfPath)
    : state.lastBrowserDocuments.get(state.selectedClassId);
  const ordered = documents.slice().sort((a, b) => Number(b.key === lastKey) - Number(a.key === lastKey));
  for (const entry of ordered) {
    if (await openKnownDocument(entry)) return true;
  }
  return false;
}

function handleOpenPdfClick() {
  if (!hasDesktopApi) {
    if (!state.changingDocument) elements.pdfInput.click();
    return;
  }
  return runDocumentChange(async () => {
    const selection = await window.api.openPdf({
      defaultDir: getSelectedRosterFolder(),
      currentPdfPath: state.currentPdfPath,
      classId: state.selectedClassId,
    });
    if (selection) return loadPdfFromDesktopSelection(selection);
    return false;
  });
}

function handleReopenLastPdfClick() {
  return runDocumentChange(openPreferredDocument);
}

function closeDocument(documentKey) {
  return runDocumentChange(async () => {
    const isActive = documentKey === getActiveDocumentKey();
    if (isActive && !await saveBeforeLeavingDocument()) return false;
    forgetDocument(documentKey);
    if (!isActive) return true;
    clearLoadedPdfView();
    return openPreferredDocument();
  });
}

function saveCurrentSession(options = {}) {
  if (pendingSessionSave) return pendingSessionSave;
  pendingSessionSave = writeCurrentSession(options).finally(() => { pendingSessionSave = null; });
  return pendingSessionSave;
}

async function writeCurrentSession({ forcePrompt = false, silent = false } = {}) {
  if (!state.pdfDoc) {
    if (!silent) setSessionStatus('Ouvrez un PDF avant d’enregistrer.', 'warning', { notify: true });
    return { saved: false, skipped: true };
  }

  try {
    const snapshot = buildSessionSnapshot();
    if (hasDesktopApi) {
      const result = await window.api.saveSession(snapshot, {
        pdfPath: state.currentPdfPath,
        classDir: getSelectedRosterFolder(),
        forcePrompt,
      });
      if (!result?.sessionPath) return { saved: false, skipped: true };
      if (result.localBackup) {
        setSessionStatus('Session gardée sur ce Mac. Le dossier du PDF est inaccessible.', 'warning', { notify: true });
      } else if (!silent) {
        setSessionStatus('Session enregistrée (' + basenameFromPath(result.sessionPath) + ').', 'success', { notify: true });
      }
      return { saved: true, sessionPath: result.sessionPath };
    }

    if (state.browserDocument) state.browserDocument.snapshot = deepClone(snapshot);
    if (silent) return { saved: Boolean(state.browserDocument) };

    const fileName = (state.pdfInfo.name || 'session').replace(/\.[^./\\]+$/, '') + '.cg.json';
    const url = URL.createObjectURL(new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.download = fileName;
    link.href = url;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    setSessionStatus('Session téléchargée (' + fileName + ').', 'success', { notify: true });
    return { saved: true, sessionPath: fileName };
  } catch (error) {
    console.error(error);
    setSessionStatus('Impossible d’enregistrer la session.', 'danger');
    return { saved: false };
  }
}

window.__cgAutoSaveBeforeClose = async () => {
  if (pendingSessionSave) await pendingSessionSave;
  const result = await saveCurrentSession({ silent: true });
  return { ok: Boolean(result.saved || result.skipped), ...result };
};

function handleSaveSessionClick() {
  return saveCurrentSession({ forcePrompt: !state.currentPdfPath });
}

async function applyExplicitSession(data, name) {
  const session = sessionForActiveClass(data) || data;
  if (!session?.pdf?.fingerprint || session.pdf.fingerprint !== state.pdfInfo.fingerprint) {
    setSessionStatus('Ouvrez le PDF correspondant avant de charger cette session.', 'warning', { notify: true });
    return false;
  }
  const nextClassId = session.classes?.selectedClassId;
  if (nextClassId && nextClassId !== state.selectedClassId && !await saveBeforeLeavingDocument()) return false;
  const applied = await applySession(session);
  if (!applied) return false;
  if (state.currentPdfPath) rememberDesktopDocuments([state.currentPdfPath], state.currentPdfPath);
  if (state.browserDocument) {
    const documents = getBrowserDocuments().filter((entry) => entry.key !== state.browserDocument.key);
    rememberBrowserDocuments([...documents, state.browserDocument], state.browserDocument);
  }
  setSessionStatus('Session chargée (' + name + ').', 'success', { notify: true });
  return true;
}

function handleLoadSessionClick() {
  if (!hasDesktopApi) {
    elements.sessionFileInput.click();
    return;
  }
  return runDocumentChange(async () => {
    const result = await window.api.loadSession({
      defaultDir: getSelectedRosterFolder(),
      currentPdfPath: state.currentPdfPath,
    });
    if (!result) return false;
    if (result.invalid || !result.data) {
      setSessionStatus('Le fichier de session est invalide.', 'danger');
      return false;
    }
    return applyExplicitSession(result.data, basenameFromPath(result.sessionPath));
  });
}

function handleSessionFileSelection(event) {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (!file) return;
  return runDocumentChange(async () => applyExplicitSession(JSON.parse(await file.text()), file.name));
}

function handlePdfFileSelection(event) {
  const files = Array.from(event.target.files || []);
  event.target.value = '';
  if (!files.length) return;
  return runDocumentChange(async () => {
    const documents = getBrowserDocuments().slice();
    const selected = files.map((file) => {
      const existing = documents.find((entry) => entry.name === file.name
        && entry.file.size === file.size && entry.file.lastModified === file.lastModified);
      if (existing) return existing;
      const entry = { key: createId(), name: file.name, file, snapshot: null };
      documents.push(entry);
      return entry;
    });
    if (state.browserDocument === selected[0] && state.pdfDoc) {
      rememberBrowserDocuments(documents, selected[0]);
      return true;
    }
    return loadBrowserDocument(selected[0], documents);
  });
}

function getPointerNormalizedPosition(event, pageNumber) {
  const pointer = getPointerPosition(event, pageNumber);
  if (!pointer || !pointer.width || !pointer.height) return null;
  return {
    x: Math.min(1, Math.max(0, pointer.x / pointer.width)),
    y: Math.min(1, Math.max(0, pointer.y / pointer.height)),
  };
}

function buildRectFromNormalizedPoints(startNorm, endNorm) {
  const x1 = Math.min(startNorm.x, endNorm.x);
  const y1 = Math.min(startNorm.y, endNorm.y);
  const x2 = Math.max(startNorm.x, endNorm.x);
  const y2 = Math.max(startNorm.y, endNorm.y);
  return {
    x: Math.min(1, Math.max(0, x1)),
    y: Math.min(1, Math.max(0, y1)),
    width: Math.min(1, Math.max(0, x2 - x1)),
    height: Math.min(1, Math.max(0, y2 - y1)),
  };
}

function clampRectToPageBounds(rect) {
  rect.width = Math.max(0, Math.min(1, Number(rect.width) || 0));
  rect.height = Math.max(0, Math.min(1, Number(rect.height) || 0));
  rect.x = Math.max(0, Math.min(1 - rect.width, Number(rect.x) || 0));
  rect.y = Math.max(0, Math.min(1 - rect.height, Number(rect.y) || 0));
}

function trackAnnotationGesture(event, { move, finish, cancel }) {
  const viewer = elements.pdfScroll;
  const { pointerId } = event;
  const controller = new AbortController();
  const options = { signal: controller.signal };
  function stop() {
    controller.abort();
    cancelAnnotationGesture = null;
    if (viewer.hasPointerCapture(pointerId)) viewer.releasePointerCapture(pointerId);
  }
  cancelAnnotationGesture = () => {
    stop();
    cancel();
  };
  const cancelPointer = (next) => {
    if (next.pointerId === pointerId) cancelAnnotationGesture?.();
  };

  event.preventDefault();
  event.stopPropagation();
  viewer.focus({ preventScroll: true });
  viewer.setPointerCapture(pointerId);
  window.addEventListener('pointermove', (next) => {
    if (next.pointerId === pointerId) move(next);
  }, options);
  window.addEventListener('pointerup', (next) => {
    if (next.pointerId !== pointerId) return;
    stop();
    finish(next);
  }, options);
  window.addEventListener('pointercancel', cancelPointer, options);
  viewer.addEventListener('lostpointercapture', cancelPointer, options);
}

function handleAnnotationPointerDown(event) {
  if (!state.pdfDoc) return;
  if (cancelAnnotationGesture) {
    event.preventDefault();
    event.stopPropagation();
    return;
  }
  if (event.button !== 0 || event.ctrlKey || !event.isPrimary) return;
  if (!(event.target instanceof Element)) return;
  const annotation = event.target.closest('.overlay, .markup-annotation, .native-shape, .text-overlay');
  if (annotation) {
    const id = annotation.dataset.overlayId || annotation.dataset.textId;
    if (!event.metaKey && !event.altKey && state.annotationGroup.has(id)) {
      startAnnotationGroupMove(event);
    }
    return;
  }
  if (event.target.closest('.handle')) return;

  const pageNumber = findPageNumberAtViewportPoint(event.clientX, event.clientY);
  if (!pageNumber) return;
  const mode = event.metaKey ? 'overlay' : event.altKey ? 'text' : !event.shiftKey ? state.activeMarkupTool : null;
  if (mode) startQuickDrawing(event, pageNumber, mode);
  else startAnnotationMarquee(event);
}

function startAnnotationMarquee(event) {
  // An empty marquee must not leave an unrelated annotation as the delete target.
  state.lastActiveType = null;
  const bounds = elements.pdfScroll.getBoundingClientRect();
  const start = { x: event.clientX, y: event.clientY };
  const marquee = document.createElement('div');
  marquee.className = 'annotation-marquee';
  marquee.setAttribute('aria-hidden', 'true');
  marquee.hidden = true;
  document.body.appendChild(marquee);

  function update(next) {
    const x = Math.max(bounds.left, Math.min(bounds.right, next.clientX));
    const y = Math.max(bounds.top, Math.min(bounds.bottom, next.clientY));
    const left = Math.min(start.x, x);
    const top = Math.min(start.y, y);
    const right = Math.max(start.x, x);
    const bottom = Math.max(start.y, y);
    marquee.hidden = Math.hypot(x - start.x, y - start.y) < 4;
    Object.assign(marquee.style, {
      left: `${left}px`, top: `${top}px`,
      width: `${right - left}px`, height: `${bottom - top}px`,
    });
    return { left, top, right, bottom };
  }

  trackAnnotationGesture(event, {
    move: update,
    finish(next) {
      const box = update(next);
      if (!marquee.hidden) {
        for (const entries of [state.overlayElements, state.textOverlayElements]) {
          for (const [id, el] of entries) {
            const rect = el.getBoundingClientRect();
            if (rect.left < box.right && rect.right > box.left && rect.top < box.bottom && rect.bottom > box.top) {
              state.annotationGroup.add(id);
            }
          }
        }
        updateSelectionUi();
      }
      marquee.remove();
    },
    cancel: () => marquee.remove(),
  });
}

function startAnnotationGroupMove(event) {
  const members = [];
  let minX = -Infinity, maxX = Infinity, minY = -Infinity, maxY = Infinity;
  for (const [items, update] of [[state.overlays, updateOverlayElementAppearance], [state.textOverlays, updateTextOverlayAppearance]]) {
    for (const item of items) {
      if (!state.annotationGroup.has(item.id)) continue;
      const page = state.pageStates.get(item.pageNumber);
      if (!page) continue;
      const rect = { ...item.rect };
      members.push({ item, rect, page, update });
      minX = Math.max(minX, -rect.x * page.width);
      maxX = Math.min(maxX, (1 - rect.x - rect.width) * page.width);
      minY = Math.max(minY, -rect.y * page.height);
      maxY = Math.min(maxY, (1 - rect.y - rect.height) * page.height);
    }
  }
  if (!members.length) return;
  const scroll = elements.pdfScroll;
  const start = { x: event.clientX + scroll.scrollLeft, y: event.clientY + scroll.scrollTop };
  let snapshot = null;

  function update(next) {
    const dx = next.clientX + scroll.scrollLeft - start.x;
    const dy = next.clientY + scroll.scrollTop - start.y;
    if (!snapshot && Math.hypot(dx, dy) < 3) return false;
    const x = Math.max(Math.min(0, minX), Math.min(Math.max(0, maxX), dx));
    const y = Math.max(Math.min(0, minY), Math.min(Math.max(0, maxY), dy));
    if (!snapshot && !x && !y) return false;
    snapshot ||= buildUndoSnapshot();
    for (const member of members) {
      const { item, rect, page, update: paint } = member;
      item.rect = { ...rect, x: rect.x + x / page.width, y: rect.y + y / page.height };
      paint(item);
    }
    return Boolean(x || y);
  }

  trackAnnotationGesture(event, {
    move: update,
    finish(next) {
      if (update(next)) pushUndoSnapshot(snapshot);
    },
    cancel() {
      if (!snapshot) return;
      for (const { item, rect, update: paint } of members) {
        item.rect = rect;
        paint(item);
      }
    },
  });
}

function paintAnnotationRect(element, rect, pageState) {
  element.style.left = `${rect.x * pageState.width}px`;
  element.style.top = `${rect.y * pageState.height}px`;
  element.style.width = `${rect.width * pageState.width}px`;
  element.style.height = `${rect.height * pageState.height}px`;
}

function startQuickDrawing(event, pageNumber, mode) {
  const pageState = state.pageStates.get(pageNumber);
  const overlayLayer = getPageOverlayLayer(pageNumber);
  if (!pageState || !overlayLayer) return;

  const startNorm = getPointerNormalizedPosition(event, pageNumber);
  if (!startNorm) return;
  const isMarkup = mode === 'highlight' || mode === 'underline';

  const preview = document.createElement('div');
  preview.className = `${isMarkup ? `markup-annotation ${mode}` : mode === 'text' ? 'text-overlay' : 'overlay'} quick-draw-preview`;
  preview.hidden = true;
  overlayLayer.appendChild(preview);

  function rectAt(next) {
    const end = getPointerNormalizedPosition(next, pageNumber);
    if (!end) return null;
    const rect = buildRectFromNormalizedPoints(startNorm, end);
    if (mode === 'underline') {
      rect.y = end.y;
      rect.height = 0;
    }
    return rect;
  }
  trackAnnotationGesture(event, {
    move(next) {
      const rect = rectAt(next);
      if (!rect) return;
      preview.hidden = !(rect.width > 0 || rect.height > 0);
      if (isMarkup) paintMarkup(preview, { kind: mode, rect, color: state.markupColor, opacity: 0.32 }, pageState);
      else paintAnnotationRect(preview, rect, pageState);
    },
    finish(next) {
      const rect = rectAt(next);
      preview.remove();
      if (rect) finishQuickDrawing(mode, pageNumber, pageState, rect);
    },
    cancel: () => preview.remove(),
  });
}

function finishQuickDrawing(mode, pageNumber, pageState, rect) {
  if (mode === 'highlight' || mode === 'underline') {
    const width = rect.width * pageState.width;
    const height = rect.height * pageState.height;
    if (mode === 'underline' ? width < 0.5 : width < 3 || height < 3) return;
    pushUndoSnapshot();

    const item = normalizeMarkupItem({
      id: createId(),
      pageNumber,
      rect,
      kind: mode,
      color: state.markupColor,
      opacity: markupDefaults.highlightOpacity,
    });
    state.markups.push(item);
    renderMarkupElement(item);
    animateNewAnnotation(state.markupElements.get(item.id));
    setSelectedMarkup(item.id);
    updateUiStates();
    return;
  }

  const minW = overlayDefaults.minWidthPx / pageState.width;
  const minH = overlayDefaults.minHeightPx / pageState.height;
  if (rect.width < minW * 0.4 || rect.height < minH * 0.4) return;

  rect.width = Math.max(rect.width, minW);
  rect.height = Math.max(rect.height, minH);
  clampRect(rect, pageState);
  pushUndoSnapshot();

  if (mode === 'text') {
    const textRect = { ...rect };
    const textMinW = textOverlayDefaults.minWidthPx / pageState.width;
    const textMinH = textOverlayDefaults.minHeightPx / pageState.height;
    textRect.width = Math.max(textRect.width, textMinW);
    textRect.height = Math.max(textRect.height, textMinH);
    clampRect(textRect, pageState);

    const item = {
      id: createId(),
      pageNumber,
      rect: textRect,
      text: '',
      fontSizePx: getDefaultTextFontSizePx(),
      autoFontSize: false,
      textColor: textStyleDefaults.textColor,
      backgroundOpacity: textStyleDefaults.backgroundOpacity,
    };
    state.textOverlays.push(item);
    renderTextOverlayElement(item);
    animateNewAnnotation(state.textOverlayElements.get(item.id));
    setSelectedTextOverlay(item.id, { editing: true, focusEditor: true });
    updateUiStates();
    return;
  }

  const overlay = {
    id: createId(),
    pageNumber,
    status: 'anchored',
    assignedStudentId: null,
    rect,
  };

  state.overlays.push(overlay);
  renderOverlayElement(overlay);
  animateNewAnnotation(state.overlayElements.get(overlay.id));
  assignOverlayToBalancedStudent(overlay, { flash: true });
  setSelectedOverlay(overlay.id);
  updateUiStates();
}

// ---------- Aperçu des pages (miniatures) ----------
const THUMB_MAX_WIDTH = 160;

function openPageOverview() {
  if (!state.pdfDoc || !elements.pageOverviewModal) return;
  elements.pageOverviewModal.classList.remove('hidden');
  buildPageOverviewGrid();
}

function closePageOverview() {
  if (!elements.pageOverviewModal) return;
  elements.pageOverviewModal.classList.add('hidden');
}

let pageOverviewBuildId = 0;

function clearPageOverviewGrid() {
  pageOverviewBuildId += 1;
  if (!elements.pageOverviewGrid) return;
  elements.pageOverviewGrid.innerHTML = '';
}

async function buildPageOverviewGrid() {
  if (!elements.pageOverviewGrid || !state.pdfDoc) return;
  const grid = elements.pageOverviewGrid;
  // si déjà rempli et correspond à ce doc, on peut juste rafraîchir les états
  if (grid.childElementCount === state.totalPages) {
    refreshOverviewCurrentState();
    return;
  }
  clearPageOverviewGrid();
  // Un second appel (double clic, changement de PDF) invalide la construction en cours
  const buildId = pageOverviewBuildId;
  // Construction et rendu séquentiel pour limiter la charge
  for (let i = 1; i <= state.totalPages; i++) {
    if (buildId !== pageOverviewBuildId) return;
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'page-thumb';
    if (i === state.currentPageNumber) item.classList.add('current');
    item.addEventListener('click', async () => {
      await goToPage(i);
      closePageOverview();
    });

    const canvas = document.createElement('canvas');
    canvas.width = THUMB_MAX_WIDTH;
    canvas.height = Math.floor(THUMB_MAX_WIDTH * 1.3); // placeholder; ajusté au rendu
    const label = document.createElement('div');
    label.className = 'thumb-label';
    label.textContent = `Page ${i}`;
    item.append(canvas, label);
    grid.appendChild(item);

    try {
      await renderThumbnailIntoCanvas(i, canvas);
    } catch (e) {
      // ignore erreur de vignettes, l’UI reste utilisable
    }
  }
}

function refreshOverviewCurrentState() {
  if (!elements.pageOverviewGrid) return;
  const visiblePages = new Set(getVisiblePageNumbers());
  const items = elements.pageOverviewGrid.querySelectorAll('.page-thumb');
  items.forEach((el, idx) => {
    const pageNum = idx + 1;
    el.classList.toggle('current', visiblePages.has(pageNum));
  });
}

async function renderThumbnailIntoCanvas(pageNumber, canvas) {
  const page = await state.pdfDoc.getPage(pageNumber);
  const viewport0 = page.getViewport({ scale: 1 });
  const scale = THUMB_MAX_WIDTH / viewport0.width;
  const viewport = page.getViewport({ scale });
  const ctx = canvas.getContext('2d');
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport }).promise;
}

function getVisiblePageNumbers() {
  if (!state.pdfDoc || state.totalPages < 1) return [];
  const firstPage = Math.min(Math.max(1, Number(state.currentPageNumber) || 1), state.totalPages);
  if (state.pageViewMode !== 'spread' || firstPage >= state.totalPages) return [firstPage];
  return [firstPage, firstPage + 1];
}

async function renderCurrentPage(options = {}) {
  if (!state.pdfDoc) return;
  cancelAnnotationGesture?.();
  const { preserveScroll = false, scrollPosition } = options;
  const pdfDoc = state.pdfDoc;
  const requestId = ++state.renderRequestId;
  const previousScrollTop = elements.pdfScroll?.scrollTop ?? 0;
  const previousScrollLeft = elements.pdfScroll?.scrollLeft ?? 0;
  
  elements.pdfContainer.innerHTML = '';
  applyLayoutPreferences();
  state.overlayElements.clear();
  state.markupElements.clear();
  state.nativeShapeElements.clear();
  state.textOverlayElements.clear();
  state.pageStates.clear();
  
  try {
    const pages = await Promise.all(getVisiblePageNumbers().map(async (pageNumber) => ({
      pageNumber,
      page: await pdfDoc.getPage(pageNumber),
    })));
    if (requestId !== state.renderRequestId) return;
    await Promise.all(pages.map(({ pageNumber, page }) => renderPage(pageNumber, page)));
  } catch (error) {
    if (requestId !== state.renderRequestId) return;
    throw error;
  }
  if (requestId !== state.renderRequestId) return;
  
  requestAnimationFrame(() => {
    if (requestId !== state.renderRequestId) return;
    elements.pdfScroll.scrollTop = scrollPosition?.top ?? (preserveScroll ? previousScrollTop : 0);
    elements.pdfScroll.scrollLeft = scrollPosition?.left ?? (preserveScroll ? previousScrollLeft : 0);
    
    renderMarkupsForCurrentPage();
    // Rendre les formes natives détectées du PDF
    const nativeShapesRequestId = ++state.nativeShapesRequestId;
    void renderNativeShapesForCurrentPage(nativeShapesRequestId);
    // Rendre les zones de texte AVANT les rectangles pour qu'elles soient dessous
    renderTextOverlaysForCurrentPage();
    // Rendre les overlays de la page courante
    renderOverlaysForCurrentPage();
  });
}

function renderOverlaysForCurrentPage() {
  state.overlayElements.clear();
  const visiblePages = new Set(getVisiblePageNumbers());
  const currentPageOverlays = state.overlays.filter(
    overlay => visiblePages.has(overlay.pageNumber)
  );
  
  for (const overlay of currentPageOverlays) {
    renderOverlayElement(overlay);
  }

  updateSelectionUi();
  updateUiStates();
}

function renderTextOverlaysForCurrentPage() {
  state.textOverlayElements.clear();
  const visiblePages = new Set(getVisiblePageNumbers());
  const current = state.textOverlays.filter(t => visiblePages.has(t.pageNumber));
  for (const t of current) {
    renderTextOverlayElement(t);
  }
  updateSelectionUi();
}

function renderMarkupsForCurrentPage() {
  state.markupElements.clear();
  const visiblePages = new Set(getVisiblePageNumbers());
  const current = state.markups.filter((item) => visiblePages.has(item.pageNumber));
  for (const item of current) {
    renderMarkupElement(item);
  }
  updateSelectionUi();
}

function renderMarkupElement(item) {
  const pageContainer = getPageContainer(item.pageNumber);
  if (!pageContainer) return;
  const overlayLayer = pageContainer.querySelector('.page-overlay-layer');
  if (!overlayLayer) return;

  const normalized = normalizeMarkupItem(item);
  item.kind = normalized.kind;
  item.color = normalized.color;
  item.opacity = normalized.opacity;
  item.rect = normalized.rect;

  const element = document.createElement('div');
  element.className = `markup-annotation ${item.kind}`;
  element.dataset.markupId = item.id;
  const handles = document.createElement('div');
  handles.className = 'handles';
  const positions = item.kind === 'underline' ? ['w', 'e'] : ['nw', 'ne', 'sw', 'se'];
  for (const position of positions) {
    const handle = document.createElement('div');
    handle.className = `handle ${position}`;
    handle.dataset.handle = position;
    handles.appendChild(handle);
  }
  element.appendChild(handles);
  overlayLayer.appendChild(element);
  state.markupElements.set(item.id, element);
  updateMarkupAppearance(item);

  element.addEventListener('pointerdown', (event) => startMarkupEdit(event, item, element));
  element.addEventListener('pointerenter', () => {
    state.hoverMarkupId = item.id;
  });
  element.addEventListener('pointerleave', () => {
    if (state.hoverMarkupId === item.id) {
      state.hoverMarkupId = null;
    }
  });
}

function updateMarkupAppearance(item) {
  const element = state.markupElements.get(item.id);
  const pageState = state.pageStates.get(item.pageNumber);
  if (!element || !pageState) return;
  paintMarkup(element, item, pageState);
}

function paintMarkup(element, item, pageState) {
  paintAnnotationRect(element, item.rect, pageState);
  if (item.kind === 'underline') {
    const stroke = Math.max(1, Math.round(markupDefaults.underlineBorderPx * state.currentZoom));
    element.style.removeProperty('height');
    element.style.setProperty('--underline-stroke', `${stroke}px`);
    element.style.setProperty('--markup-color', hexToRgba(item.color, 0.95));
  } else {
    element.style.backgroundColor = hexToRgba(item.color, item.opacity);
  }
}

function startMarkupEdit(event, item, element) {
  if (event.button !== 0 || event.ctrlKey || !event.isPrimary) return;
  const page = getPointerPosition(event, item.pageNumber);
  if (!page?.width || !page.height) return;
  const handle = event.target.closest('.handle')?.dataset.handle;
  const start = { ...item.rect };
  const minWidth = Math.min(start.width, (item.kind === 'underline' ? 0.5 : 3) / page.width);
  const minHeight = Math.min(start.height, 3 / page.height);
  setSelectedMarkup(item.id);
  element.classList.remove('annotation-entering');
  let snapshot = null;

  function update(next) {
    const pointer = getPointerPosition(next, item.pageNumber);
    if (!pointer) return false;
    const dx = (pointer.x - page.x) / page.width;
    const dy = (pointer.y - page.y) / page.height;
    const rect = { ...start };
    if (!handle) {
      rect.x += dx;
      rect.y += dy;
      clampRectToPageBounds(rect);
    } else {
      const right = start.x + start.width;
      const bottom = start.y + start.height;
      if (handle.includes('w') && dx) {
        rect.x = Math.max(0, Math.min(right - minWidth, start.x + dx));
        rect.width = right - rect.x;
      }
      if (handle.includes('e') && dx) rect.width = Math.max(minWidth, Math.min(1 - start.x, start.width + dx));
      if (handle.includes('n') && dy) {
        rect.y = Math.max(0, Math.min(bottom - minHeight, start.y + dy));
        rect.height = bottom - rect.y;
      }
      if (handle.includes('s') && dy) rect.height = Math.max(minHeight, Math.min(1 - start.y, start.height + dy));
    }
    const changed = Object.keys(rect).some((key) => Math.abs(rect[key] - start[key]) > 1e-9);
    if (!snapshot && !changed) return false;
    snapshot ||= buildUndoSnapshot();
    item.rect = rect;
    updateMarkupAppearance(item);
    return changed;
  }

  trackAnnotationGesture(event, {
    move: update,
    finish(next) {
      if (update(next)) pushUndoSnapshot(snapshot);
    },
    cancel() {
      if (!snapshot) return;
      item.rect = start;
      updateMarkupAppearance(item);
    },
  });
}

function makeNativeShapeKey(pageNumber, annotationId) {
  return `${pageNumber}::${annotationId}`;
}

function nativeShapeRectFromPdfRect(rect, pageWidth, pageHeight) {
  if (!Array.isArray(rect) || rect.length < 4) return null;
  if (!Number.isFinite(pageWidth) || !Number.isFinite(pageHeight) || pageWidth <= 0 || pageHeight <= 0) return null;
  const x1 = Number(rect[0]);
  const y1 = Number(rect[1]);
  const x2 = Number(rect[2]);
  const y2 = Number(rect[3]);
  if (![x1, y1, x2, y2].every(Number.isFinite)) return null;

  const left = Math.max(0, Math.min(x1, x2));
  const right = Math.min(pageWidth, Math.max(x1, x2));
  const bottom = Math.max(0, Math.min(y1, y2));
  const top = Math.min(pageHeight, Math.max(y1, y2));
  const width = Math.max(0, right - left);
  const height = Math.max(0, top - bottom);
  if (width <= 0 || height <= 0) return null;

  return {
    x: left / pageWidth,
    y: 1 - (top / pageHeight),
    width: width / pageWidth,
    height: height / pageHeight,
  };
}

async function collectNativeShapesForCurrentPage() {
  if (!state.pdfDoc) return [];
  const results = [];
  for (const pageNumber of getVisiblePageNumbers()) {
    const page = await state.pdfDoc.getPage(pageNumber);
    const viewportAtScale1 = page.getViewport({ scale: 1 });
    const annotations = await page.getAnnotations({ intent: 'display' });
    for (const item of annotations || []) {
      if (!item?.id) continue;
      if (!deletableNativeShapeTypes.has(item.annotationType)) continue;
      const normalizedRect = nativeShapeRectFromPdfRect(item.rect, viewportAtScale1.width, viewportAtScale1.height);
      if (!normalizedRect) continue;
      results.push({
        key: makeNativeShapeKey(pageNumber, item.id),
        id: item.id,
        pageNumber,
        annotationType: item.annotationType,
        rect: normalizedRect,
      });
    }
  }
  return results;
}

function getNativeShapeByKey(shapeKey) {
  if (!shapeKey) return null;
  return state.nativeShapes.find((item) => item.key === shapeKey) || null;
}

function updateNativeShapeAppearance(shape) {
  const element = state.nativeShapeElements.get(shape.key);
  const pageState = state.pageStates.get(shape.pageNumber);
  if (!element || !pageState) return;
  element.style.left = `${shape.rect.x * pageState.width}px`;
  element.style.top = `${shape.rect.y * pageState.height}px`;
  element.style.width = `${shape.rect.width * pageState.width}px`;
  element.style.height = `${shape.rect.height * pageState.height}px`;
}

function renderNativeShape(shape) {
  const pageContainer = getPageContainer(shape.pageNumber);
  if (!pageContainer) return;
  const overlayLayer = pageContainer.querySelector('.page-overlay-layer');
  if (!overlayLayer) return;

  const element = document.createElement('div');
  element.className = 'native-shape';
  element.dataset.shapeKey = shape.key;
  overlayLayer.appendChild(element);
  state.nativeShapeElements.set(shape.key, element);
  updateNativeShapeAppearance(shape);

  element.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    event.stopPropagation();
    setSelectedNativeShape(shape.key);
  });
  element.addEventListener('pointerenter', () => {
    state.hoverNativeShapeId = shape.key;
  });
  element.addEventListener('pointerleave', () => {
    if (state.hoverNativeShapeId === shape.key) {
      state.hoverNativeShapeId = null;
    }
  });
}

async function renderNativeShapesForCurrentPage(requestId = null) {
  state.nativeShapeElements.clear();
  const shapes = await collectNativeShapesForCurrentPage();
  if (requestId !== null && requestId !== state.nativeShapesRequestId) return;
  state.nativeShapes = shapes;
  if (state.selectedNativeShapeId && !state.nativeShapes.some((item) => item.key === state.selectedNativeShapeId)) {
    state.selectedNativeShapeId = null;
  }
  if (state.hoverNativeShapeId && !state.nativeShapes.some((item) => item.key === state.hoverNativeShapeId)) {
    state.hoverNativeShapeId = null;
  }
  if (state.lastActiveNativeShapeId && !state.nativeShapes.some((item) => item.key === state.lastActiveNativeShapeId)) {
    state.lastActiveNativeShapeId = null;
    if (state.lastActiveType === 'native-shape') {
      state.lastActiveType = null;
    }
  }
  for (const shape of state.nativeShapes) {
    renderNativeShape(shape);
  }
  updateSelectionUi();
}


async function renderPage(pageNumber, page) {
  const viewport = page.getViewport({ scale: state.currentZoom });
  const container = document.createElement('div');
  container.className = 'page-container';
  container.dataset.pageNumber = String(pageNumber);
  container.style.width = `${viewport.width}px`;
  container.style.height = `${viewport.height}px`;

  const canvas = document.createElement('canvas');
  const deviceScale = Math.max(1, window.devicePixelRatio || 1);
  const logicalPixels = Math.max(1, viewport.width * viewport.height);
  const pixelBudgetScale = Math.sqrt(MAX_CANVAS_PIXELS / logicalPixels);
  const outputScale = Math.max(0.25, Math.min(deviceScale, pixelBudgetScale));
  canvas.width = Math.max(1, Math.floor(viewport.width * outputScale));
  canvas.height = Math.max(1, Math.floor(viewport.height * outputScale));
  canvas.style.width = `${viewport.width}px`;
  canvas.style.height = `${viewport.height}px`;
  canvas.dataset.renderScale = outputScale.toFixed(3);
  const context = canvas.getContext('2d', { alpha: false });

  const renderContext = { canvasContext: context, viewport };
  if (outputScale !== 1) {
    renderContext.transform = [outputScale, 0, 0, outputScale, 0, 0];
  }

  const overlayLayer = document.createElement('div');
  overlayLayer.className = 'page-overlay-layer';

  container.append(canvas, overlayLayer);
  elements.pdfContainer.appendChild(container);

  state.pageStates.set(pageNumber, { width: viewport.width, height: viewport.height });
  await page.render(renderContext).promise;
}

function renderAllOverlays() {
  state.overlayElements.clear();
  for (const overlay of state.overlays) {
    renderOverlayElement(overlay);
  }
  updateSelectionUi();
  updateUiStates();
}

function renderOverlayElement(overlay) {
  const pageContainer = getPageContainer(overlay.pageNumber);
  if (!pageContainer) return;
  const overlayLayer = pageContainer.querySelector('.page-overlay-layer');
  if (!overlayLayer) return;

  const element = document.createElement('div');
  element.className = 'overlay';
  element.dataset.overlayId = overlay.id;

  const label = document.createElement('div');
  label.className = 'label';
  element.appendChild(label);

  const handleWrapper = document.createElement('div');
  handleWrapper.className = 'handles';
  element.appendChild(handleWrapper);

  ['nw', 'ne', 'sw', 'se'].forEach((pos) => {
    const handle = document.createElement('div');
    handle.className = `handle ${pos}`;
    handle.dataset.handle = pos;
    handleWrapper.appendChild(handle);
  });

  overlayLayer.appendChild(element);
  state.overlayElements.set(overlay.id, element);
  updateOverlayElementAppearance(overlay);

  element.addEventListener('pointerdown', (event) => handlePointerDown(event, overlay));
  // Empêche le menu contextuel (utile pour Ctrl+clic sur Safari)
  element.addEventListener('contextmenu', (e) => e.preventDefault());
  // Survol pour suppression clavier
  element.addEventListener('pointerenter', () => { state.hoverOverlayId = overlay.id; });
  element.addEventListener('pointerleave', () => { if (state.hoverOverlayId === overlay.id) state.hoverOverlayId = null; });
}

function renderTextOverlayElement(item) {
  ensureTextOverlayStyle(item);
  const pageContainer = getPageContainer(item.pageNumber);
  if (!pageContainer) return;
  const overlayLayer = pageContainer.querySelector('.page-overlay-layer');
  if (!overlayLayer) return;

  const element = document.createElement('div');
  element.className = 'text-overlay';
  element.dataset.textId = item.id;

  // plus de barre de drag; toute la surface est draggable

  const content = document.createElement('div');
  content.className = 'text-content';
  content.contentEditable = state.editingTextId === item.id ? 'true' : 'false';
  content.spellcheck = false;
  content.textContent = item.text || '';
  let textEditInitialValue = item.text || '';
  let textEditUndoSnapshot = null;
  content.addEventListener('input', () => {
    const nextText = content.textContent || '';
    if (!textEditUndoSnapshot && nextText !== textEditInitialValue) {
      textEditUndoSnapshot = buildUndoSnapshot();
    }
    item.text = content.textContent || '';
  });
  content.addEventListener('focus', () => {
    textEditInitialValue = item.text || '';
    textEditUndoSnapshot = null;
    state.annotationGroup.clear();
    state.selectedTextId = item.id;
    state.selectedOverlayId = null;
    state.selectedMarkupId = null;
    state.selectedNativeShapeId = null;
    state.editingTextId = item.id;
    state.lastActiveTextId = item.id;
    state.lastActiveType = 'text';
    updateSelectionUi();
  });
  content.addEventListener('blur', () => {
    const finalText = item.text || '';
    if (textEditUndoSnapshot && finalText !== textEditInitialValue) {
      pushUndoSnapshot(textEditUndoSnapshot);
    }
    textEditUndoSnapshot = null;
    if (state.editingTextId === item.id) {
      state.editingTextId = null;
      updateSelectionUi();
    }
  });
  content.addEventListener('keydown', (event) => {
    if (shouldKeepCaretNavigation(event)) {
      event.stopPropagation();
    }
  });
  element.appendChild(content);

  const handleWrapper = document.createElement('div');
  handleWrapper.className = 'handles';
  element.appendChild(handleWrapper);
  ;['nw', 'ne', 'sw', 'se', 'e', 's'].forEach(pos => {
    const h = document.createElement('div');
    h.className = `handle ${pos}`;
    h.dataset.handle = pos;
    handleWrapper.appendChild(h);
  });

  overlayLayer.appendChild(element);
  state.textOverlayElements.set(item.id, element);
  updateTextOverlayAppearance(item);

  // Déplacement: toute la surface, sauf poignées. Si on est déjà en édition et que le clic est dans le contenu, ne pas drag.
  element.addEventListener('pointerdown', (e) => {
    const target = e.target;
    if (!(target instanceof Element)) return;
    if (target.classList.contains('handle')) return;
    if (e.detail >= 2) return;
    const isContent = !!target.closest('.text-content');
    const isEditingThis = state.editingTextId === item.id;
    if (isContent && isEditingThis) {
      setSelectedTextOverlay(item.id, { editing: true });
      return;
    }
    setSelectedTextOverlay(item.id, { editing: false });
    handleTextPointerDown(e, item, 'move', { preventDefault: false });
  });
  // Édition: double-clic dans le contenu
  content.addEventListener('dblclick', (e) => {
    e.stopPropagation();
    setSelectedTextOverlay(item.id, { editing: true, focusEditor: true });
  });
  element.addEventListener('dblclick', (e) => {
    if (!(e.target instanceof Element)) return;
    if (e.target.classList.contains('handle')) return;
    setSelectedTextOverlay(item.id, { editing: true, focusEditor: true });
  });
  handleWrapper.addEventListener('pointerdown', (e) => {
    const target = e.target;
    if (!(target instanceof Element)) return;
    if (target.classList.contains('handle')) {
      const pos = target.dataset.handle;
      setSelectedTextOverlay(item.id, { editing: false });
      handleTextPointerDown(e, item, `resize-${pos}`);
    }
  });
  // Surlignage sur survol (pour suppression clavier)
  element.addEventListener('pointerenter', () => { state.hoverTextId = item.id; });
  element.addEventListener('pointerleave', () => { if (state.hoverTextId === item.id) state.hoverTextId = null; });
}

function updateTextOverlayAppearance(item) {
  ensureTextOverlayStyle(item);
  const el = state.textOverlayElements.get(item.id);
  const pageState = state.pageStates.get(item.pageNumber);
  if (!el || !pageState) return;
  const left = item.rect.x * pageState.width;
  const top = item.rect.y * pageState.height;
  const width = item.rect.width * pageState.width;
  const height = item.rect.height * pageState.height;
  el.style.left = `${left}px`;
  el.style.top = `${top}px`;
  el.style.width = `${width}px`;
  el.style.height = `${height}px`;
  el.style.backgroundColor = `rgba(255, 255, 255, ${item.backgroundOpacity})`;

  const content = el.querySelector('.text-content');
  if (content) {
    const fontSizePx = getDisplayedTextFontSizePx(item, pageState);
    content.style.fontSize = `${fontSizePx}px`;
    content.style.color = item.textColor;
  }
  if (state.selectedTextId === item.id) {
    updateTextStyleToolsUi();
  }
}

function handleTextPointerDown(event, item, mode, options = {}) {
  const el = state.textOverlayElements.get(item.id);
  if (!el) return;
  state.selectedTextId = item.id;
  state.selectedOverlayId = null;
  state.selectedMarkupId = null;
  state.selectedNativeShapeId = null;
  state.lastActiveTextId = item.id;
  state.lastActiveType = 'text';
  textDragState.active = true;
  textDragState.textId = item.id;
  textDragState.pageNumber = item.pageNumber;
  textDragState.mode = mode;
  textDragState.startPointer = getPointerPosition(event, item.pageNumber);
  textDragState.startRect = { ...item.rect };
  textDragState.startFontSizePx = Number(item.fontSizePx) || textStyleDefaults.fontSizePx;
  textDragState.startClient = { x: event.clientX, y: event.clientY };
  if (mode === 'move') {
    const bounds = el.getBoundingClientRect();
    textDragState.pointerOffset = {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    };
  } else {
    textDragState.pointerOffset = null;
  }
  textDragState.moved = false;
  textDragState.undoSnapshot = buildUndoSnapshot();
  const shouldCapture = options.capture !== false;
  if (shouldCapture && el.setPointerCapture) el.setPointerCapture(event.pointerId);
  window.addEventListener('pointermove', handleTextPointerMove);
  window.addEventListener('pointerup', handleTextPointerUp, { once: true });
  if (options.preventDefault !== false) event.preventDefault();
}

function handleTextPointerMove(event) {
  if (!textDragState.active) return;
  const item = state.textOverlays.find(t => t.id === textDragState.textId);
  if (!item) return;
  const pageState = state.pageStates.get(item.pageNumber);
  if (!pageState) return;
  if (textDragState.mode === 'move') {
    const pageContainer = getPageContainer(item.pageNumber);
    const containerRect = pageContainer.getBoundingClientRect();
    const widthPx = item.rect.width * pageState.width;
    const heightPx = item.rect.height * pageState.height;
    const rawLeft = event.clientX - containerRect.left - textDragState.pointerOffset.x;
    const rawTop = event.clientY - containerRect.top - textDragState.pointerOffset.y;
    const { left, top } = clampPixels(rawLeft, rawTop, widthPx, heightPx, pageState);
    item.rect.x = left / pageState.width;
    item.rect.y = top / pageState.height;
    if (!textDragState.moved) {
      const movedX = Math.abs(event.clientX - textDragState.startClient.x);
      const movedY = Math.abs(event.clientY - textDragState.startClient.y);
      textDragState.moved = movedX > 2 || movedY > 2;
    }
  } else if (textDragState.mode.startsWith('resize')) {
    const pointer = getPointerPosition(event, item.pageNumber);
    const startPointer = textDragState.startPointer;
    if (!pointer || !startPointer) return;
    const deltaX = pointer.x - startPointer.x;
    const deltaY = pointer.y - startPointer.y;
    if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) textDragState.moved = true;
    const deltaNormX = deltaX / pageState.width;
    const deltaNormY = deltaY / pageState.height;
    const rect = { ...textDragState.startRect };
    const handle = textDragState.mode.split('-')[1];
    applyResize(rect, deltaNormX, deltaNormY, handle, pageState);
    // Enforce text-specific min size
    const minW = textOverlayDefaults.minWidthPx / pageState.width;
    const minH = textOverlayDefaults.minHeightPx / pageState.height;
    rect.width = Math.max(rect.width, minW);
    rect.height = Math.max(rect.height, minH);
    item.rect = rect;

    if (['nw', 'ne', 'sw', 'se'].includes(handle)) {
      const startRect = textDragState.startRect;
      const startFontSizePx = Math.max(1, Number(textDragState.startFontSizePx) || textStyleDefaults.fontSizePx);
      const wScale = rect.width / Math.max(startRect.width, 0.0001);
      const hScale = rect.height / Math.max(startRect.height, 0.0001);
      const scale = Math.sqrt(Math.max(0.01, wScale * hScale));
      item.fontSizePx = Math.max(1, Math.min(96, startFontSizePx * scale));
    }
  }
  updateTextOverlayAppearance(item);
}

function handleTextPointerUp(event) {
  if (!textDragState.active) return;
  const moved = textDragState.moved;
  const undoSnapshot = textDragState.undoSnapshot;
  const el = state.textOverlayElements.get(textDragState.textId);
  if (el && el.releasePointerCapture) el.releasePointerCapture(event.pointerId);
  textDragState.active = false;
  textDragState.textId = null;
  textDragState.pageNumber = null;
  textDragState.mode = 'move';
  textDragState.startPointer = null;
  textDragState.startRect = null;
  textDragState.startFontSizePx = null;
  textDragState.startClient = null;
  textDragState.pointerOffset = null;
  textDragState.moved = false;
  textDragState.undoSnapshot = null;
  window.removeEventListener('pointermove', handleTextPointerMove);
  if (moved && undoSnapshot) {
    pushUndoSnapshot(undoSnapshot);
  }
  updateSelectionUi();
}

function updateOverlayElementAppearance(overlay) {
  const element = state.overlayElements.get(overlay.id);
  const pageState = state.pageStates.get(overlay.pageNumber);
  if (!element || !pageState) return;

  const left = overlay.rect.x * pageState.width;
  const top = overlay.rect.y * pageState.height;
  const width = overlay.rect.width * pageState.width;
  const height = overlay.rect.height * pageState.height;

  element.style.left = `${left}px`;
  element.style.top = `${top}px`;
  element.style.width = `${width}px`;
  element.style.height = `${height}px`;
  element.style.padding = '4px';
  element.style.background = `rgba(0, 0, 0, ${state.overlayOpacity})`;

  const label = element.querySelector('.label');
  if (!label) return;
  const studentName = overlay.assignedStudentId ? getStudentNameById(overlay.assignedStudentId) : '';
  label.textContent = studentName || '';
  const fontSize = Math.max(7, Math.min(18 * (state.currentZoom || 1), height * 0.24, width * 0.13));
  label.style.fontSize = `${fontSize}px`;
  label.style.lineHeight = '1';
  label.style.padding = '0';
  label.style.whiteSpace = 'nowrap';
  label.style.wordBreak = 'normal';
  label.style.overflow = 'hidden';
  label.style.textOverflow = 'ellipsis';
  label.style.textAlign = 'center';
}

function handlePointerDown(event, overlay) {
  const element = state.overlayElements.get(overlay.id);
  if (!element) return;
  const target = event.target;
  const isHandle = target.classList.contains('handle');
  const handleType = isHandle ? target.dataset.handle : null;

  setSelectedOverlay(overlay.id);

  dragState.active = true;
  dragState.overlayId = overlay.id;
  dragState.pageNumber = overlay.pageNumber;
  dragState.mode = isHandle ? `resize-${handleType}` : 'move';
  dragState.startPointer = getPointerPosition(event, overlay.pageNumber);
  dragState.startRect = { ...overlay.rect };
  dragState.startClient = { x: event.clientX, y: event.clientY };
  dragState.pointerOffset = isHandle
    ? null
    : {
        x: event.clientX - element.getBoundingClientRect().left,
        y: event.clientY - element.getBoundingClientRect().top,
      };
  dragState.moved = false;
  dragState.undoSnapshot = buildUndoSnapshot();

  setPointerCapture(event, overlay.id);
  window.addEventListener('pointermove', handlePointerMove);
  window.addEventListener('pointerup', handlePointerUp, { once: true });
  event.preventDefault();
}

function setPointerCapture(event, overlayId) {
  const element = state.overlayElements.get(overlayId);
  if (element && element.setPointerCapture) {
    element.setPointerCapture(event.pointerId);
  }
}

function releasePointerCapture(event, overlayId) {
  const element = state.overlayElements.get(overlayId);
  if (element && element.releasePointerCapture) {
    element.releasePointerCapture(event.pointerId);
  }
}

function handlePointerMove(event) {
  if (!dragState.active) return;
  const overlay = state.overlays.find((item) => item.id === dragState.overlayId);
  if (!overlay) return;

  if (dragState.mode === 'move') {
    // Les overlays restent sur leur page d'origine
    const pageContainer = getPageContainer(overlay.pageNumber);
    const pageState = state.pageStates.get(overlay.pageNumber);
    const element = state.overlayElements.get(overlay.id);
    if (!pageContainer || !pageState || !element || !dragState.pointerOffset) return;

    const containerRect = pageContainer.getBoundingClientRect();
    const widthPx = overlay.rect.width * pageState.width;
    const heightPx = overlay.rect.height * pageState.height;
    const rawLeft = event.clientX - containerRect.left - dragState.pointerOffset.x;
    const rawTop = event.clientY - containerRect.top - dragState.pointerOffset.y;
    const { left, top } = clampPixels(rawLeft, rawTop, widthPx, heightPx, pageState);

    overlay.rect.x = left / pageState.width;
    overlay.rect.y = top / pageState.height;

    if (!dragState.moved) {
      const movedX = Math.abs(event.clientX - dragState.startClient.x);
      const movedY = Math.abs(event.clientY - dragState.startClient.y);
      dragState.moved = movedX > 2 || movedY > 2;
    }
  } else if (dragState.mode.startsWith('resize')) {
    const pointer = getPointerPosition(event, overlay.pageNumber);
    const startPointer = dragState.startPointer;
    const pageState = state.pageStates.get(overlay.pageNumber);
    if (!pointer || !startPointer || !pageState) return;

    const deltaX = pointer.x - startPointer.x;
    const deltaY = pointer.y - startPointer.y;
    if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
      dragState.moved = true;
    }

    const deltaNormX = deltaX / pageState.width;
    const deltaNormY = deltaY / pageState.height;
    const rect = { ...dragState.startRect };
    applyResize(rect, deltaNormX, deltaNormY, dragState.mode.split('-')[1], pageState);
    overlay.rect = rect;
  }

  updateOverlayElementAppearance(overlay);
}


function handlePointerUp(event) {
  if (!dragState.active) return;
  const overlay = state.overlays.find((item) => item.id === dragState.overlayId);
  if (!overlay) {
    resetDragState();
    return;
  }
  const moved = dragState.moved;
  const shouldResolve = !moved && dragState.mode === 'move';
  const undoSnapshot = dragState.undoSnapshot;
  releasePointerCapture(event, overlay.id);
  const overlayId = overlay.id;
  const overlayRef = overlay;
  resetDragState();
  if (moved && undoSnapshot) {
    pushUndoSnapshot(undoSnapshot);
  }
  if (!shouldResolve || (event.button !== 0 && event.button !== 2)) return;
  if (event.button === 2 || (event.ctrlKey && !event.metaKey && !event.altKey)) {
    openStudentChooser(overlayRef, { x: event.clientX, y: event.clientY });
  } else if (event.altKey) {
    reassignOverlayWithPenalty(overlayRef, getScoreDeltaForResolution(false));
  } else {
    resolveOverlay(overlayId, !event.metaKey);
  }
}

function resetDragState() {
  dragState.active = false;
  dragState.overlayId = null;
  dragState.pageNumber = null;
  dragState.mode = 'move';
  dragState.startPointer = null;
  dragState.startRect = null;
  dragState.startClient = null;
  dragState.pointerOffset = null;
  dragState.moved = false;
  dragState.undoSnapshot = null;
  window.removeEventListener('pointermove', handlePointerMove);
}

function reassignOverlayWithPenalty(overlay, penaltyDelta) {
  const roster = getSelectedRoster();
  if (!roster) return;
  pushUndoSnapshot();

  const prevId = overlay.assignedStudentId || null;
  if (prevId) {
    // assignmentDelta: l'élève a bien été interrogé, sa charge d'équité doit augmenter
    applyStudentScoreDelta(prevId, penaltyDelta, { assignmentDelta: 1, persist: false, render: false });
  }

  // Choisir un nouvel élève, différent de l'actuel si possible
  const chosen = chooseBalancedStudentExcluding(prevId, { excludeOverlayId: overlay.id });
  if (!chosen) {
    // Aucun autre élève disponible: on conserve l'assignation telle quelle
    updateOverlayElementAppearance(overlay);
    saveClassesToStorage();
    renderStudentList();
    updateUiStates();
    return;
  }

  overlay.assignedStudentId = chosen.id;
  updateOverlayElementAppearance(overlay);
  saveClassesToStorage();
  renderStudentList();
  flashStudentRow(chosen.id);
  updateUiStates();
}

function getStudentClickCount(student) {
  const raw = Number(student?.assignmentCount);
  if (!Number.isFinite(raw)) return 0;
  return Math.max(0, raw);
}

function getStudentAbsenceCredit(student) {
  const raw = Number(student?.absenceCredit);
  if (!Number.isFinite(raw)) return 0;
  return Math.max(0, raw);
}

function getStudentFairnessLoad(student) {
  return getStudentClickCount(student) + getStudentAbsenceCredit(student);
}

function isStudentAbsent(studentId) {
  return Boolean(studentId && state.absentStudentIds.has(studentId));
}

function accrueAbsenceCredits(roster, assignmentUnits = 1, excludeStudentId = null) {
  const units = Number(assignmentUnits);
  if (!roster || !Number.isFinite(units) || units <= 0) return;
  const presentCount = roster.students.filter((student) => !isStudentAbsent(student.id)).length;
  if (presentCount <= 0) return;
  const creditPerAbsentStudent = units / presentCount;
  for (const student of roster.students) {
    if (student.id === excludeStudentId || !isStudentAbsent(student.id)) continue;
    student.absenceCredit = getStudentAbsenceCredit(student) + creditPerAbsentStudent;
  }
}

function applyStudentScoreDelta(studentId, delta, options = {}) {
  const {
    assignmentDelta = 0,
    persist = true,
    render = true,
  } = options;
  const roster = getSelectedRoster();
  if (!roster) return null;
  const student = roster.students.find((item) => item.id === studentId);
  if (!student) return null;
  const numericDelta = Number(delta);
  if (!Number.isFinite(numericDelta)) return null;
  const previousGrade = getStudentGrade(student.score, roster);
  student.score = getStudentScoreValue(student) + numericDelta;
  const nextGrade = getStudentGrade(student.score, roster);
  state.recentScoreChange = {
    studentId: student.id,
    delta: numericDelta,
    direction: numericDelta > 0 ? 'gain' : 'loss',
    gradeAdvanced: nextGrade.index > previousGrade.index,
  };
  if (nextGrade.index > previousGrade.index) {
    setSessionStatus(`${student.name} atteint le grade ${nextGrade.label}.`, 'success');
  } else if (nextGrade.index < previousGrade.index) {
    setSessionStatus(`${student.name} redescend au grade ${nextGrade.label}.`, 'warning');
  }
  const numericAssignmentDelta = Number(assignmentDelta);
  if (Number.isFinite(numericAssignmentDelta) && numericAssignmentDelta !== 0) {
    student.assignmentCount = Math.max(0, getStudentClickCount(student) + numericAssignmentDelta);
    if (numericAssignmentDelta > 0) {
      accrueAbsenceCredits(roster, numericAssignmentDelta, student.id);
    }
  }
  if (persist) {
    saveClassesToStorage();
  }
  if (render) {
    renderStudentList();
  }
  return student;
}

function getAssignedOverlayLoadByStudent(excludeOverlayId = null) {
  const counts = new Map();
  for (const overlay of state.overlays) {
    if (excludeOverlayId && overlay.id === excludeOverlayId) continue;
    if (!overlay.assignedStudentId) continue;
    counts.set(overlay.assignedStudentId, (counts.get(overlay.assignedStudentId) || 0) + 1);
  }
  return counts;
}

function chooseBalancedStudentExcluding(excludeId, options = {}) {
  const { excludeOverlayId = null } = options;
  const roster = getSelectedRoster();
  if (!roster || roster.students.length === 0) return null;
  const pool = roster.students.filter((student) => student.id !== excludeId && !isStudentAbsent(student.id));
  if (pool.length === 0) return null;
  const assignedLoadByStudent = getAssignedOverlayLoadByStudent(excludeOverlayId);
  const minAssignments = Math.min(...pool.map((student) => {
    return getStudentFairnessLoad(student) + (assignedLoadByStudent.get(student.id) || 0);
  }));
  const candidates = pool.filter((student) => {
    const load = getStudentFairnessLoad(student) + (assignedLoadByStudent.get(student.id) || 0);
    return Math.abs(load - minAssignments) < 0.000001;
  });
  if (candidates.length === 0) return pool[Math.floor(Math.random() * pool.length)];
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function toggleStudentAbsence(studentId) {
  const roster = getSelectedRoster();
  const student = roster?.students.find((item) => item.id === studentId);
  if (!roster || !student) return;
  pushUndoSnapshot();

  const willBeAbsent = !isStudentAbsent(studentId);
  let reassignedCount = 0;
  if (willBeAbsent) {
    state.absentStudentIds.add(studentId);
    for (const overlay of state.overlays) {
      if (overlay.assignedStudentId !== studentId) continue;
      overlay.assignedStudentId = null;
      assignOverlayToBalancedStudent(overlay, { flash: false, persist: false });
      if (overlay.assignedStudentId) reassignedCount += 1;
    }
  } else {
    state.absentStudentIds.delete(studentId);
  }

  rememberClassAttendance();
  saveClassesToStorage();
  renderStudentList();
  updateUiStates();
  const assignmentMessage = reassignedCount > 0
    ? ` ${reassignedCount} attribution${reassignedCount > 1 ? 's ont' : ' a'} été redistribuée${reassignedCount > 1 ? 's' : ''}.`
    : '';
  setSessionStatus(
    willBeAbsent
      ? `${student.name} est absent pour ce cours.${assignmentMessage}`
      : `${student.name} est de nouveau présent pour ce cours.`,
    willBeAbsent ? 'warning' : 'success'
  );
  if (state.pdfDoc) {
    void saveCurrentSession({ forcePrompt: false, silent: true, reason: 'attendance-change' });
  }
}

// Panneau de sélection d'élève (Ctrl+clic)
let studentChooserEl = null;

function openStudentChooser(overlay, anchor) {
  closeStudentChooser();
  const roster = getSelectedRoster();
  if (!roster) return;

  const sorted = roster.students
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }));

  const backdrop = document.createElement('div');
  backdrop.className = 'chooser-backdrop';
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeStudentChooser();
  });

  const panel = document.createElement('div');
  panel.className = 'chooser-panel';
  panel.tabIndex = -1;

  const header = document.createElement('div');
  header.className = 'chooser-header';
  header.textContent = 'Réattribuer à…';

  const list = document.createElement('div');
  list.className = 'chooser-list';

  const currentId = overlay.assignedStudentId || null;

  const noneItem = document.createElement('button');
  noneItem.type = 'button';
  noneItem.className = 'chooser-item';
  noneItem.textContent = `Personne (cache seul)${!currentId ? ' •' : ''}`;
  if (!currentId) noneItem.classList.add('current');
  noneItem.addEventListener('click', () => {
    setOverlayAsPlainMask(overlay);
    closeStudentChooser();
  });
  list.appendChild(noneItem);

  for (const s of sorted) {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'chooser-item';
    const absent = isStudentAbsent(s.id);
    item.textContent = `${s.name}${absent ? ' — absent' : ''}${s.id === currentId ? ' •' : ''}`;
    item.disabled = absent;
    if (absent) item.title = 'Élève absent pour ce cours';
    if (s.id === currentId) item.classList.add('current');
    item.addEventListener('click', () => {
      reassignOverlayToSpecificStudentWithPenalty(overlay, s.id, 0);
      closeStudentChooser();
    });
    list.appendChild(item);
  }

  const actions = document.createElement('div');
  actions.className = 'chooser-actions';
  const cancel = document.createElement('button');
  cancel.type = 'button';
  cancel.textContent = 'Annuler';
  cancel.addEventListener('click', closeStudentChooser);
  actions.appendChild(cancel);

  panel.append(header, list, actions);
  backdrop.appendChild(panel);
  document.body.appendChild(backdrop);
  studentChooserEl = backdrop;

  // Positionner le panneau près du pointeur
  requestAnimationFrame(() => {
    const rect = panel.getBoundingClientRect();
    const margin = 8;
    let left = anchor.x + margin;
    let top = anchor.y + margin;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (left + rect.width > vw) left = Math.max(margin, anchor.x - rect.width - margin);
    if (top + rect.height > vh) top = Math.max(margin, anchor.y - rect.height - margin);
    panel.style.left = left + 'px';
    panel.style.top = top + 'px';
    panel.focus();
  });

  const onKey = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeStudentChooser();
    }
  };
  backdrop._onKeyHandler = onKey;
  document.addEventListener('keydown', onKey);
}

function closeStudentChooser() {
  if (!studentChooserEl) return;
  document.removeEventListener('keydown', studentChooserEl._onKeyHandler);
  if (studentChooserEl.parentElement) studentChooserEl.parentElement.removeChild(studentChooserEl);
  studentChooserEl = null;
}

function setOverlayAsPlainMask(overlay) {
  const roster = getSelectedRoster();
  if (!roster || !overlay) return;
  const prevId = overlay.assignedStudentId || null;
  if (!prevId) {
    overlay.assignedStudentId = null;
    updateOverlayElementAppearance(overlay);
    updateUiStates();
    return;
  }
  pushUndoSnapshot();
  overlay.assignedStudentId = null;
  updateOverlayElementAppearance(overlay);
  saveClassesToStorage();
  renderStudentList();
  updateUiStates();
}

function reassignOverlayToSpecificStudentWithPenalty(overlay, studentId, penaltyDelta = 0) {
  const roster = getSelectedRoster();
  if (!roster) return;
  const next = roster.students.find((student) => student.id === studentId);
  if (!next || isStudentAbsent(next.id)) return;
  pushUndoSnapshot();
  const prevId = overlay.assignedStudentId || null;
  if (prevId && penaltyDelta !== 0) {
    applyStudentScoreDelta(prevId, penaltyDelta, { assignmentDelta: 1, persist: false, render: false });
    flashStudentRow(prevId);
  }
  overlay.assignedStudentId = next.id;
  updateOverlayElementAppearance(overlay);
  saveClassesToStorage();
  renderStudentList();
  updateUiStates();
}

function applyResize(rect, deltaX, deltaY, handle, pageState) {
  switch (handle) {
    case 'e':
      rect.width += deltaX;
      break;
    case 's':
      rect.height += deltaY;
      break;
    case 'nw':
      rect.x += deltaX;
      rect.y += deltaY;
      rect.width -= deltaX;
      rect.height -= deltaY;
      break;
    case 'ne':
      rect.y += deltaY;
      rect.width += deltaX;
      rect.height -= deltaY;
      break;
    case 'sw':
      rect.x += deltaX;
      rect.width -= deltaX;
      rect.height += deltaY;
      break;
    case 'se':
      rect.width += deltaX;
      rect.height += deltaY;
      break;
    default:
      break;
  }
  clampRect(rect, pageState);
}

function clampRect(rect, pageState) {
  const width = pageState ? pageState.width : 1000;
  const height = pageState ? pageState.height : 1400;
  const minWidth = overlayDefaults.minWidthPx / width;
  const minHeight = overlayDefaults.minHeightPx / height;
  rect.width = Math.max(rect.width, minWidth);
  rect.height = Math.max(rect.height, minHeight);

  rect.x = Math.max(0, Math.min(rect.x, 1 - rect.width));
  rect.y = Math.max(0, Math.min(rect.y, 1 - rect.height));
}

function clampPixels(left, top, widthPx, heightPx, pageState) {
  const maxLeft = Math.max(0, pageState.width - widthPx);
  const maxTop = Math.max(0, pageState.height - heightPx);
  return {
    left: Math.max(0, Math.min(left, maxLeft)),
    top: Math.max(0, Math.min(top, maxTop)),
  };
}

function resolveOverlay(overlayId, isCorrect) {
  const index = state.overlays.findIndex((item) => item.id === overlayId);
  if (index === -1) return;
  pushUndoSnapshot();

  const [overlay] = state.overlays.splice(index, 1);
  const element = state.overlayElements.get(overlayId);
  state.overlayElements.delete(overlayId);
  if (state.selectedOverlayId === overlayId) {
    state.selectedOverlayId = null;
  }
  revealMask(element);

  if (overlay.assignedStudentId) {
    const roster = getSelectedRoster();
    const scoreDelta = getScoreDeltaForResolution(isCorrect, roster);
    const student = applyStudentScoreDelta(overlay.assignedStudentId, scoreDelta, {
      assignmentDelta: 1,
      persist: false,
      render: false,
    });
    if (student) {
      saveClassesToStorage();
      renderStudentList();
      flashStudentRow(student.id);
    }
  }
  updateSelectionUi();
  updateUiStates();
}

function revealMask(element) {
  if (!element) return;
  if (reducedMotion.matches) {
    element.remove();
    return;
  }
  element.inert = true;
  element.classList.remove('selected', 'annotation-entering');
  element.classList.add('revealing');
  const animation = element.animate([
    { opacity: 1, transform: 'perspective(450px) translateY(0) rotateX(0deg) scale(1)' },
    { opacity: 0, transform: 'perspective(450px) translateY(-12px) rotateX(22deg) scale(.98)' },
  ], { duration: 240, easing: 'ease-out', fill: 'forwards' });
  const remove = () => element.remove();
  animation.finished.then(remove, remove);
}

function deleteOverlayWithoutScoring(overlayId) {
  const index = state.overlays.findIndex((item) => item.id === overlayId);
  if (index === -1) return;
  pushUndoSnapshot();
  const [overlay] = state.overlays.splice(index, 1);
  const element = state.overlayElements.get(overlayId);
  if (element?.parentElement) element.parentElement.removeChild(element);
  state.overlayElements.delete(overlayId);
  state.annotationGroup.delete(overlayId);
  if (state.lastActiveOverlayId === overlayId) {
    state.lastActiveOverlayId = null;
    if (state.lastActiveType === 'overlay') state.lastActiveType = null;
  }
  if (state.selectedOverlayId === overlayId) {
    state.selectedOverlayId = null;
  }
  updateSelectionUi();
  updateUiStates();
}

function deleteMarkup(markupId) {
  const index = state.markups.findIndex((item) => item.id === markupId);
  if (index === -1) return;
  pushUndoSnapshot();
  const [item] = state.markups.splice(index, 1);
  const element = state.markupElements.get(item.id);
  if (element?.parentElement) {
    element.parentElement.removeChild(element);
  }
  state.markupElements.delete(item.id);
  if (state.hoverMarkupId === markupId) {
    state.hoverMarkupId = null;
  }
  if (state.selectedMarkupId === markupId) {
    state.selectedMarkupId = null;
  }
  if (state.lastActiveMarkupId === markupId) {
    state.lastActiveMarkupId = null;
    if (state.lastActiveType === 'markup') {
      state.lastActiveType = null;
    }
  }
  updateSelectionUi();
  updateUiStates();
}

function deleteTextOverlay(textId) {
  const index = state.textOverlays.findIndex(t => t.id === textId);
  if (index === -1) return;
  pushUndoSnapshot();
  const [item] = state.textOverlays.splice(index, 1);
  const el = state.textOverlayElements.get(item.id);
  if (el?.parentElement) el.parentElement.removeChild(el);
  state.textOverlayElements.delete(item.id);
  state.annotationGroup.delete(textId);
  if (state.lastActiveTextId === textId) {
    state.lastActiveTextId = null;
    if (state.lastActiveType === 'text') state.lastActiveType = null;
  }
  if (state.selectedTextId === textId) {
    state.selectedTextId = null;
  }
  if (state.editingTextId === textId) {
    state.editingTextId = null;
  }
  updateSelectionUi();
  updateUiStates();
}

function deleteAnnotationGroup() {
  pushUndoSnapshot();
  for (const id of state.annotationGroup) {
    state.overlayElements.get(id)?.remove();
    state.textOverlayElements.get(id)?.remove();
    state.overlayElements.delete(id);
    state.textOverlayElements.delete(id);
  }
  state.overlays = state.overlays.filter((item) => !state.annotationGroup.has(item.id));
  state.textOverlays = state.textOverlays.filter((item) => !state.annotationGroup.has(item.id));
  clearSelection();
  updateUiStates();
}

async function replaceLoadedPdfAfterNativeEdit(savedBytes) {
  const previousDoc = state.pdfDoc;
  const preservedPage = Math.max(1, Number(state.currentPageNumber) || 1);
  const preservedZoom = Number.isFinite(state.currentZoom) ? state.currentZoom : 1;

  const nextDoc = await getDocument({ data: savedBytes }).promise;
  state.pdfDoc = nextDoc;
  state.pdfInfo.fingerprint = Array.isArray(nextDoc.fingerprints) ? nextDoc.fingerprints[0] : null;
  state.totalPages = nextDoc.numPages || 1;
  state.currentPageNumber = Math.min(preservedPage, state.totalPages || 1);
  state.currentZoom = preservedZoom;
  state.pageStates.clear();
  state.lastVisiblePage = state.currentPageNumber;
  state.pointerHint = { pageNumber: state.currentPageNumber, x: 0.5, y: 0.3, valid: false };
  state.nativeShapes = [];
  state.nativeShapeElements.clear();
  state.nativeShapesRequestId += 1;
  state.hoverNativeShapeId = null;

  await renderCurrentPage({ preserveScroll: true });
  updateUiStates();

  if (previousDoc && previousDoc !== nextDoc && typeof previousDoc.destroy === 'function') {
    previousDoc.destroy().catch(() => {});
  }
}

async function deleteNativeShape(shapeKey) {
  const shape = getNativeShapeByKey(shapeKey);
  if (!shape) return;
  if (!state.pdfDoc || !state.currentPdfPath || !hasDesktopApi || !window.api?.writeFileBytes) {
    setSessionStatus("Suppression impossible pour cette forme PDF.", 'warning');
    return;
  }
  if (!state.pdfDoc.annotationStorage || typeof state.pdfDoc.saveDocument !== 'function') {
    setSessionStatus("Ce PDF ne permet pas la suppression directe de cette forme.", 'warning');
    return;
  }

  try {
    const deleteStorageKey = `${pdfjsEditorPrefix}${createId()}`;
    state.pdfDoc.annotationStorage.setValue(deleteStorageKey, {
      id: shape.id,
      deleted: true,
      pageIndex: shape.pageNumber - 1,
    });
    const savedPayload = await state.pdfDoc.saveDocument();
    const savedBytes = parseIpcBytes(savedPayload);
    if (!savedBytes) {
      setSessionStatus("Échec de suppression: données PDF invalides.", 'danger');
      return;
    }
    const writeResult = await window.api.writeFileBytes(state.currentPdfPath, savedBytes);
    if (!writeResult?.ok) {
      setSessionStatus("Échec de suppression: écriture du PDF impossible.", 'danger');
      return;
    }

    state.pdfInfo.size = Number.isFinite(writeResult.size) ? writeResult.size : state.pdfInfo.size;

    await replaceLoadedPdfAfterNativeEdit(savedBytes);
    const currentShapes = await collectNativeShapesForCurrentPage();
    const stillExists = currentShapes.some((item) => item.id === shape.id);
    if (stillExists) {
      setSelectedNativeShape(shape.key);
      setSessionStatus("La forme n'a pas pu être supprimée sur ce PDF.", 'warning');
      return;
    }

    if (state.selectedNativeShapeId === shapeKey) {
      state.selectedNativeShapeId = null;
    }
    if (state.hoverNativeShapeId === shapeKey) {
      state.hoverNativeShapeId = null;
    }
    if (state.lastActiveNativeShapeId === shapeKey) {
      state.lastActiveNativeShapeId = null;
      if (state.lastActiveType === 'native-shape') {
        state.lastActiveType = null;
      }
    }
    updateSelectionUi();
    setSessionStatus('Forme PDF supprimée.', 'success');
  } catch (error) {
    console.error(error);
    setSessionStatus("Impossible de supprimer cette forme PDF.", 'danger');
  }
}

function adjustStudentScore(studentId, delta) {
  applyStudentScoreDelta(studentId, delta);
}

function flashStudentRow(studentId) {
  const row = elements.studentList.querySelector(`[data-student-id="${studentId}"]`);
  if (!row) return;
  row.classList.add('highlight');
  setTimeout(() => row.classList.remove('highlight'), 1000);
}

function clearAllOverlays() {
  clearUndoHistory();
  state.annotationGroup.clear();
  state.overlays = [];
  state.overlayElements.clear();
  state.selectedOverlayId = null;
  state.selectedNativeShapeId = null;
  if (state.lastActiveType === 'overlay') state.lastActiveType = null;
  state.pointerHint = { pageNumber: state.lastVisiblePage || 1, x: 0.5, y: 0.4, valid: false };
  elements.clearAssignmentsBtn.disabled = true;
  elements.assignBtn.disabled = true;
  if (elements.anchorBtn) {
    elements.anchorBtn.disabled = true;
  }
  updateSelectionUi();
}

function clearAllMarkups() {
  state.markups = [];
  state.markupElements.clear();
  state.selectedMarkupId = null;
  state.hoverMarkupId = null;
  state.lastActiveMarkupId = null;
  if (state.lastActiveType === 'markup') state.lastActiveType = null;
  updateSelectionUi();
}

function clearAllTextOverlays() {
  state.annotationGroup.clear();
  state.textOverlays = [];
  state.textOverlayElements.clear();
  state.selectedTextId = null;
  state.selectedNativeShapeId = null;
  state.editingTextId = null;
  if (state.lastActiveType === 'text') state.lastActiveType = null;
  updateSelectionUi();
}

// FONCTION CRITIQUE : Doit être AVANT addOverlay
function detectVisiblePageNumber() {
  const containers = Array.from(elements.pdfContainer.querySelectorAll('.page-container'));
  if (!containers.length) return state.lastVisiblePage || 1;
  
  const viewport = elements.pdfScroll.getBoundingClientRect();
  const viewportTop = viewport.top;
  const viewportBottom = viewport.bottom;
  
  let bestPage = state.lastVisiblePage || 1;
  let maxVisibleArea = 0;
  
  for (const container of containers) {
    const rect = container.getBoundingClientRect();
    const pageNumber = Number(container.dataset.pageNumber) || 1;
    
    const visibleTop = Math.max(rect.top, viewportTop);
    const visibleBottom = Math.min(rect.bottom, viewportBottom);
    const visibleHeight = Math.max(0, visibleBottom - visibleTop);
    const visibleArea = visibleHeight * rect.width;
    
    if (visibleArea > maxVisibleArea) {
      maxVisibleArea = visibleArea;
      bestPage = pageNumber;
    }
  }
  
  state.lastVisiblePage = bestPage;
  return bestPage;
}

// FONCTION CRITIQUE : Doit être AVANT addOverlay
function getVisibleViewportCenter() {
  const scrollRect = elements.pdfScroll.getBoundingClientRect();
  const viewportCenterY = scrollRect.top + scrollRect.height / 2;
  const viewportCenterX = scrollRect.left + scrollRect.width / 2;
  
  let targetPage = null;
  let targetContainer = null;
  
  const containers = elements.pdfContainer.querySelectorAll('.page-container');
  for (const container of containers) {
    const rect = container.getBoundingClientRect();
    
    if (rect.top <= viewportCenterY && rect.bottom >= viewportCenterY &&
        rect.left <= viewportCenterX && rect.right >= viewportCenterX) {
      targetPage = Number(container.dataset.pageNumber);
      targetContainer = container;
      break;
    }
  }
  
  if (!targetPage) {
    targetPage = detectVisiblePageNumber();
    targetContainer = getPageContainer(targetPage);
  }
  
  const pageState = state.pageStates.get(targetPage);
  
  if (!targetContainer || !pageState) {
    return { pageNumber: targetPage || 1, x: 0.5, y: 0.3 };
  }
  
  const containerRect = targetContainer.getBoundingClientRect();
  
  let relativeY = (viewportCenterY - containerRect.top) / containerRect.height;
  relativeY = Math.max(0.15, Math.min(0.85, relativeY));
  
  let relativeX = (viewportCenterX - containerRect.left) / containerRect.width;
  relativeX = Math.max(0.1, Math.min(0.9, relativeX));
  
  return {
    pageNumber: targetPage,
    x: relativeX,
    y: relativeY
  };
}

function getActivePageForInsertion() {
  const visiblePages = getVisiblePageNumbers();
  if (state.pointerHint.valid && visiblePages.includes(state.pointerHint.pageNumber)) {
    return state.pointerHint.pageNumber;
  }
  const detectedPage = detectVisiblePageNumber();
  return visiblePages.includes(detectedPage) ? detectedPage : (visiblePages[0] || state.currentPageNumber);
}

function addOverlay() {
  const targetPageNumber = getActivePageForInsertion();
  const pageState = state.pageStates.get(targetPageNumber);
  if (!pageState) return;
  pushUndoSnapshot();

  const width = overlayDefaults.width;
  const height = overlayDefaults.height;
  
  // Toujours placer au centre de la page visible
  const centerX = 0.5;
  const centerY = 0.4;
  
  const x = Math.min(Math.max(centerX - width / 2, 0), 1 - width);
  const y = Math.min(Math.max(centerY - height / 2, 0), 1 - height);

  const overlay = {
    id: createId(),
    pageNumber: targetPageNumber,
    status: 'anchored',
    assignedStudentId: null,
    rect: { x, y, width, height },
  };

  state.overlays.push(overlay);
  renderOverlayElement(overlay);
  animateNewAnnotation(state.overlayElements.get(overlay.id));
  assignOverlayToBalancedStudent(overlay, { flash: true });
  setSelectedOverlay(overlay.id);
  updateUiStates();
}

function addTextOverlay() {
  const targetPageNumber = getActivePageForInsertion();
  const pageState = state.pageStates.get(targetPageNumber);
  if (!pageState) return;
  pushUndoSnapshot();
  const width = textOverlayDefaults.width;
  const height = textOverlayDefaults.height;
  const centerX = 0.5;
  const centerY = 0.65; // plus bas que les rectangles (qui se créent vers 0.4)
  const x = Math.min(Math.max(centerX - width / 2, 0), 1 - width);
  const y = Math.min(Math.max(centerY - height / 2, 0), 1 - height);
  const item = {
    id: createId(),
    pageNumber: targetPageNumber,
    rect: { x, y, width, height },
    text: '',
    fontSizePx: getDefaultTextFontSizePx(),
    autoFontSize: false,
    textColor: textStyleDefaults.textColor,
    backgroundOpacity: textStyleDefaults.backgroundOpacity,
  };
  state.textOverlays.push(item);
  renderTextOverlayElement(item);
  animateNewAnnotation(state.textOverlayElements.get(item.id));
  setSelectedTextOverlay(item.id, { editing: true, focusEditor: true });
  updateUiStates();
}

async function getSpreadFitZoom() {
  if (!state.pdfDoc || !elements.pdfScroll) return state.currentZoom;
  const pageNumbers = getVisiblePageNumbers();
  if (pageNumbers.length < 2) return state.currentZoom;
  const pages = await Promise.all(pageNumbers.map((pageNumber) => state.pdfDoc.getPage(pageNumber)));
  const totalWidthAtScaleOne = pages.reduce((sum, page) => sum + page.getViewport({ scale: 1 }).width, 0);
  if (!totalWidthAtScaleOne) return state.currentZoom;
  const horizontalPadding = 74;
  const availableWidth = Math.max(240, elements.pdfScroll.clientWidth - horizontalPadding);
  return clampZoom(availableWidth / totalWidthAtScaleOne);
}

async function setPageViewMode(mode) {
  const nextMode = mode === 'spread' ? 'spread' : 'single';
  if (state.pageViewMode === nextMode) return;
  cancelAnnotationGesture?.();
  if (state.annotationGroup.size) clearSelection();
  state.pageViewMode = nextMode;
  applyLayoutPreferences();

  if (state.pdfDoc && nextMode === 'spread') {
    const fitZoom = await getSpreadFitZoom();
    if (state.currentZoom > fitZoom) state.currentZoom = fitZoom;
  }

  saveClassesToStorage();
  if (state.pdfDoc) {
    await renderCurrentPage();
  }
  updateUiStates();
  setSessionStatus(
    nextMode === 'spread' ? 'Affichage de deux pages côte à côte.' : 'Affichage d’une page.',
    'neutral'
  );
}

async function goToNextPage() {
  const step = state.pageViewMode === 'spread' ? 2 : 1;
  const lastVisible = getVisiblePageNumbers().at(-1) || state.currentPageNumber;
  if (lastVisible < state.totalPages) {
    await goToPage(Math.min(state.totalPages, state.currentPageNumber + step));
  }
}

async function goToPreviousPage() {
  const step = state.pageViewMode === 'spread' ? 2 : 1;
  if (state.currentPageNumber > 1) {
    await goToPage(Math.max(1, state.currentPageNumber - step));
  }
}

async function goToPage(pageNumber) {
  if (pageNumber >= 1 && pageNumber <= state.totalPages) {
    cancelAnnotationGesture?.();
    if (state.annotationGroup.size) clearSelection();
    state.currentPageNumber = pageNumber;
    await renderCurrentPage();
  }
}



function findPageNumberAtViewportPoint(clientX, clientY) {
  const containers = elements.pdfContainer.querySelectorAll('.page-container');
  for (const container of containers) {
    const bounds = container.getBoundingClientRect();
    if (clientX >= bounds.left && clientX <= bounds.right && clientY >= bounds.top && clientY <= bounds.bottom) {
      return Number(container.dataset.pageNumber) || null;
    }
  }
  return null;
}

function anchorFloatingOverlays() {
  let changed = false;
  for (const overlay of state.overlays) {
    if (overlay.status === 'floating') {
      overlay.status = 'anchored';
      changed = true;
      updateOverlayElementAppearance(overlay);
    }
  }
  if (changed) {
    updateUiStates();
  }
}

function assignStudentsToOverlays() {
  const roster = getSelectedRoster();
  if (!roster || roster.students.length === 0) return;

  const eligibleOverlays = state.overlays.filter((overlay) => overlay.status === 'anchored');
  if (!eligibleOverlays.length) return;
  pushUndoSnapshot();

  for (const overlay of eligibleOverlays) {
    overlay.assignedStudentId = null;
    assignOverlayToBalancedStudent(overlay, { flash: true, persist: false });
  }
  saveClassesToStorage();
  renderStudentList();
  updateUiStates();
}

function assignOverlayToBalancedStudent(overlay, options = {}) {
  const { flash = false, persist = true } = options;
  const roster = getSelectedRoster();
  if (!roster || roster.students.length === 0) {
    overlay.status = 'anchored';
    updateOverlayElementAppearance(overlay);
    return;
  }

  const chosen = chooseBalancedStudentExcluding(null, { excludeOverlayId: overlay.id });
  if (!chosen) {
    overlay.status = 'anchored';
    updateOverlayElementAppearance(overlay);
    return;
  }

  overlay.status = 'anchored';
  overlay.assignedStudentId = chosen.id;
  updateOverlayElementAppearance(overlay);
  if (flash) {
    flashStudentRow(chosen.id);
  }
  if (persist) {
    saveClassesToStorage();
    renderStudentList();
  }
}

function clearOverlayAssignments() {
  const hasAssignments = state.overlays.some((overlay) => Boolean(overlay.assignedStudentId));
  if (!hasAssignments) return;
  pushUndoSnapshot();

  let changed = false;
  for (const overlay of state.overlays) {
    if (overlay.assignedStudentId) {
      overlay.assignedStudentId = null;
      updateOverlayElementAppearance(overlay);
      changed = true;
    }
  }
  if (changed) {
    saveClassesToStorage();
    renderStudentList();
    updateUiStates();
  }
}

async function changeZoom(multiplier, anchor = null) {
  if (!state.pdfDoc) return;
  
  const previousZoom = state.currentZoom;
  const nextZoom = clampZoom(previousZoom * multiplier);
  
  if (Math.abs(nextZoom - previousZoom) < 0.01) return;

  const anchorToUse = anchor || getViewportAnchorFromCenter() || computeCurrentAnchor();
  state.currentZoom = nextZoom;
  if (elements.zoomLabel) {
    elements.zoomLabel.textContent = `${Math.round(nextZoom * 100)} %`;
  }

  // Re-rendre sans casser la position de lecture, puis restaurer l'ancre de zoom.
  await renderCurrentPage({ preserveScroll: true });
  restoreAnchor(anchorToUse);
}




function handleWheelZoom(event) {
  if (!state.pdfDoc) return;
  if (!(event.ctrlKey || event.metaKey)) return;
  event.preventDefault();
  if (cancelAnnotationGesture) return;
  const preview = state.zoomPreview;
  const anchorInfo = getViewportAnchorFromPoint(event.clientX, event.clientY) || getViewportAnchorFromCenter();
  if (!preview.active) {
    preview.active = true;
    preview.baseZoom = state.currentZoom;
    preview.previewZoom = state.currentZoom;
  }
  preview.anchor = anchorInfo;
  const scaleStep = Math.exp(-event.deltaY * 0.0025);
  const targetZoom = clampZoom(preview.previewZoom * scaleStep);
  preview.previewZoom = targetZoom;

  const scale = preview.previewZoom / preview.baseZoom;
  elements.pdfContainer.classList.add('is-zoom-previewing');
  elements.pdfContainer.style.transformOrigin = `${anchorInfo.originX}px ${anchorInfo.originY}px`;
  elements.pdfContainer.style.transform = `scale(${scale})`;
  if (elements.zoomLabel) {
    elements.zoomLabel.textContent = `${Math.round(preview.previewZoom * 100)} %`;
  }

  if (preview.commitTimeout) {
    clearTimeout(preview.commitTimeout);
  }
  preview.commitTimeout = setTimeout(() => commitWheelZoom(), 120);
}

function commitWheelZoom() {
  const preview = state.zoomPreview;
  if (!preview.active) return;
  preview.active = false;
  elements.pdfContainer.classList.remove('is-zoom-previewing');
  elements.pdfContainer.style.transform = '';
  elements.pdfContainer.style.transformOrigin = '';
  if (preview.commitTimeout) {
    clearTimeout(preview.commitTimeout);
    preview.commitTimeout = null;
  }
  const multiplier = preview.previewZoom / state.currentZoom;
  const anchor = preview.anchor || getViewportAnchorFromCenter();
  preview.anchor = null;
  preview.baseZoom = state.currentZoom;
  changeZoom(multiplier, anchor)
    .then(() => {
      preview.previewZoom = state.currentZoom;
      preview.baseZoom = state.currentZoom;
    })
    .catch((error) => console.error('Zoom commit failed', error));
}

function getPageContainer(pageNumber) {
  return elements.pdfContainer.querySelector(`.page-container[data-page-number="${pageNumber}"]`);
}

function getPageOverlayLayer(pageNumber) {
  return getPageContainer(pageNumber)?.querySelector('.page-overlay-layer') || null;
}

function clampZoom(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return 1;
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, numericValue));
}

function computeCurrentAnchor() {
  return getViewportAnchorFromCenter();
}

function restoreAnchor(anchor) {
  const scroll = elements.pdfScroll;
  if (!anchor) {
    detectVisiblePageNumber();
    return;
  }
  
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const info = getPageLayoutInfo(anchor.pageNumber);
      if (!info) {
        detectVisiblePageNumber();
        return;
      }
      const desired = info.offset + info.height * (anchor.pageRatioY ?? 0.5) - (anchor.viewportOffset ?? scroll.clientHeight / 2);
      const maxTop = Math.max(0, scroll.scrollHeight - scroll.clientHeight);
      scroll.scrollTop = Math.min(maxTop, Math.max(0, desired));
      const ratioX = Number.isFinite(anchor.pageRatioX) ? anchor.pageRatioX : 0.5;
      const viewportOffsetX = Number.isFinite(anchor.viewportOffsetX) ? anchor.viewportOffsetX : scroll.clientWidth / 2;
      const desiredLeft = info.offsetLeft + info.width * ratioX - viewportOffsetX;
      const maxLeft = Math.max(0, scroll.scrollWidth - scroll.clientWidth);
      scroll.scrollLeft = Math.min(maxLeft, Math.max(0, desiredLeft));
      state.lastVisiblePage = anchor.pageNumber;
      detectVisiblePageNumber();
    });
  });
}

function getViewportAnchorFromPoint(clientX, clientY) {
  const scrollRect = elements.pdfScroll.getBoundingClientRect();
  const originX = clientX - scrollRect.left + elements.pdfScroll.scrollLeft;
  const originY = clientY - scrollRect.top + elements.pdfScroll.scrollTop;
  const pageNumber = findPageNumberAtViewportPoint(clientX, clientY) || detectVisiblePageNumber();
  const pageState = state.pageStates.get(pageNumber);
  const pageContainer = getPageContainer(pageNumber);
  let pageRatioY = 0.5;
  let pageRatioX = 0.5;
  if (pageState && pageContainer) {
    const rect = pageContainer.getBoundingClientRect();
    const rectWidth = rect.width || pageState.width || 1;
    const rectHeight = rect.height || pageState.height || 1;
    pageRatioY = Math.min(1, Math.max(0, (clientY - rect.top) / rectHeight));
    pageRatioX = Math.min(1, Math.max(0, (clientX - rect.left) / rectWidth));
  }
  const viewportOffset = clientY - scrollRect.top;
  const viewportOffsetX = clientX - scrollRect.left;
  return { originX, originY, clientX, clientY, pageNumber, pageRatioY, pageRatioX, viewportOffset, viewportOffsetX };
}

function getViewportAnchorFromCenter() {
  const rect = elements.pdfScroll.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  return getViewportAnchorFromPoint(centerX, centerY);
}

function getPageLayoutInfo(pageNumber) {
  const scroll = elements.pdfScroll;
  const container = getPageContainer(pageNumber);
  if (!scroll || !container) return null;
  const scrollRect = scroll.getBoundingClientRect();
  const pageRect = container.getBoundingClientRect();
  return {
    pageNumber,
    offset: pageRect.top - scrollRect.top + scroll.scrollTop,
    offsetLeft: pageRect.left - scrollRect.left + scroll.scrollLeft,
    width: pageRect.width || container.clientWidth || 1,
    height: pageRect.height || container.clientHeight || 1,
  };
}

function getPointerPosition(event, pageNumber) {
  const pageContainer = getPageContainer(pageNumber);
  if (!pageContainer) return null;
  const bounds = pageContainer.getBoundingClientRect();
  return {
    x: event.clientX - bounds.left,
    y: event.clientY - bounds.top,
    width: bounds.width,
    height: bounds.height,
  };
}

function handleImmediateScroll() {
  state.pointerHint.valid = false;
  if (state.scrollAnimationFrame) {
    cancelAnimationFrame(state.scrollAnimationFrame);
  }
  state.scrollAnimationFrame = requestAnimationFrame(() => {
    state.scrollAnimationFrame = null;
    detectVisiblePageNumber();
  });
}

function updatePointerHint(event) {
  if (!state.pdfDoc) return;
  const pageNumber = findPageNumberAtViewportPoint(event.clientX, event.clientY);
  if (!pageNumber) {
    state.pointerHint.valid = false;
    return;
  }
  const pageState = state.pageStates.get(pageNumber);
  const pageContainer = getPageContainer(pageNumber);
  if (!pageState || !pageContainer) return;
  const bounds = pageContainer.getBoundingClientRect();
  const x = (event.clientX - bounds.left) / pageState.width;
  const y = (event.clientY - bounds.top) / pageState.height;
  if (Number.isFinite(x) && Number.isFinite(y)) {
    state.pointerHint = {
      pageNumber,
      x: Math.min(Math.max(x, 0), 1),
      y: Math.min(Math.max(y, 0), 1),
      valid: true,
    };
  }
}

function getStudentNameById(studentId) {
  const roster = getSelectedRoster();
  if (!roster) return null;
  const student = roster.students.find((item) => item.id === studentId);
  return student ? student.name : null;
}

function updateCurrentPageIndicator() {
  const page = detectVisiblePageNumber();
  state.pointerHint.valid = false;
  state.pointerHint.pageNumber = page;
  state.pointerHint.x = 0.5;
  state.pointerHint.y = 0.4;
}

function restoreClassAttendance() {
  const roster = getSelectedRoster();
  const studentIds = new Set(roster?.students.map((student) => student.id) || []);
  const absentIds = Array.isArray(roster?.absentStudentIds) ? roster.absentStudentIds : [];
  state.absentStudentIds = new Set(absentIds.filter((id) => studentIds.has(id)));
}

function rememberClassAttendance() {
  const roster = getSelectedRoster();
  if (roster) roster.absentStudentIds = [...state.absentStudentIds];
}

async function showClassDocuments(classId, { adoptDocument = false } = {}) {
  state.selectedClassId = classId;
  restoreClassAttendance();
  clearUndoHistory();
  if (adoptDocument) {
    if (state.currentPdfPath) rememberDesktopDocuments([state.currentPdfPath], state.currentPdfPath);
    if (state.browserDocument) {
      state.browserDocument = { ...state.browserDocument, snapshot: null };
      rememberBrowserDocuments([state.browserDocument], state.browserDocument);
    }
  } else {
    clearLoadedPdfView();
  }
  normalizeOverlayAssignments();
  renderClassSelect();
  renderStudentList();
  renderGradeLegend();
  renderClassFolderHint();
  saveClassesToStorage();
  if (!adoptDocument) await openPreferredDocument();
}

function handleClassSelection(event) {
  const classId = event.target.value || null;
  if (classId === state.selectedClassId) return;
  return runDocumentChange(async () => {
    if (!await saveBeforeLeavingDocument()) {
      renderClassSelect();
      return;
    }
    await showClassDocuments(classId);
  });
}

function normalizeOverlayAssignments() {
  const roster = getSelectedRoster();
  const validIds = new Set(roster ? roster.students.map((student) => student.id) : []);
  for (const overlay of state.overlays) {
    if (overlay.assignedStudentId && (!validIds.has(overlay.assignedStudentId) || isStudentAbsent(overlay.assignedStudentId))) {
      overlay.assignedStudentId = null;
      updateOverlayElementAppearance(overlay);
    }
  }
}

function getSelectedRoster() {
  if (!state.selectedClassId) return null;
  return state.classes.find((item) => item.id === state.selectedClassId) || null;
}

function renderClassSelect() {
  const select = elements.classSelect;
  select.innerHTML = '';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Aucune classe';
  select.appendChild(placeholder);

  for (const roster of state.classes) {
    const option = document.createElement('option');
    option.value = roster.id;
    option.textContent = roster.name;
    if (roster.id === state.selectedClassId) option.selected = true;
    select.appendChild(option);
  }

  if (!state.classes.find((item) => item.id === state.selectedClassId)) {
    state.selectedClassId = null;
  }
  renderClassFolderHint();
}

function appendScoreChangeEffect(row, effect) {
  if (effect.delta === 0 || reducedMotion.matches) return;
  if (effect.gradeAdvanced) row.classList.add('grade-up');
  const delta = document.createElement('span');
  delta.classList.add('score-delta', effect.direction);
  delta.textContent = `${effect.delta > 0 ? '+' : '−'}${Math.abs(effect.delta)}`;
  delta.setAttribute('aria-hidden', 'true');
  delta.addEventListener('animationend', () => delta.remove(), { once: true });
  row.appendChild(delta);
}

function renderStudentList() {
  const roster = getSelectedRoster();
  elements.studentList.innerHTML = '';
  if (!roster || roster.students.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'student-empty';
    const hint = document.createElement('p');
    hint.textContent = state.classes.length
      ? 'Choisissez une classe dans la liste ou créez-en une.'
      : 'Ajoutez les prénoms de vos élèves pour répartir les questions.';
    const createButton = document.createElement('button');
    createButton.type = 'button';
    createButton.textContent = 'Créer une classe';
    createButton.setAttribute('aria-haspopup', 'dialog');
    createButton.addEventListener('click', () => openClassModal({ createNew: true }));
    empty.append(hint, createButton);
    elements.studentList.appendChild(empty);
    elements.studentList.style.setProperty('--student-count', '1');
    elements.studentList.dataset.density = 'normal';
    return;
  }

  const sortedStudents = roster.students
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }));
  const { correctPoints, incorrectPoints } = getRosterScoreSettings(roster);
  elements.studentList.style.setProperty('--student-count', String(sortedStudents.length));

  for (const student of sortedStudents) {
    const grade = getStudentGrade(student.score, roster);
    const absent = isStudentAbsent(student.id);
    const row = document.createElement('div');
    row.className = 'student-row';
    row.dataset.studentId = student.id;
    row.dataset.grade = grade.key;
    row.classList.toggle('absent', absent);
    row.setAttribute('aria-label', `${student.name}, ${absent ? 'absent' : 'présent'}, ${student.score ?? 0} points`);
    const scoreEffect = state.recentScoreChange?.studentId === student.id
      ? state.recentScoreChange
      : null;

    const badge = createGradeBadgeElement(grade, student.name, student.score);

    const info = document.createElement('div');
    info.className = 'student-info';
    const name = document.createElement('div');
    name.className = 'student-name';
    name.textContent = student.name;
    name.title = `${student.name} — clic droit pour ${absent ? 'indiquer sa présence' : 'le déclarer absent'}`;
    name.addEventListener('contextmenu', (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleStudentAbsence(student.id);
    });
    const nameLine = document.createElement('div');
    nameLine.className = 'student-name-line';
    nameLine.appendChild(name);
    if (absent) {
      const absentTag = document.createElement('span');
      absentTag.className = 'absent-tag';
      absentTag.textContent = 'Absent';
      absentTag.title = 'Absent pour ce cours';
      nameLine.appendChild(absentTag);
    }
    const meta = document.createElement('div');
    meta.className = 'student-meta';
    const count = getStudentClickCount(student);
    const absenceCredit = getStudentAbsenceCredit(student);
    meta.textContent = count > 0 ? `${count} interrogation${count > 1 ? 's' : ''}` : '0 interrogation';
    meta.title = absenceCredit > 0
      ? `Charge d’attribution équitable: ${getStudentFairnessLoad(student).toFixed(2)} (${absenceCredit.toFixed(2)} crédit d’absence)`
      : `Charge d’attribution: ${count}`;
    info.append(nameLine, meta);

    const controls = document.createElement('div');
    controls.className = 'score-controls';
    const minus = document.createElement('button');
    minus.textContent = '−';
    minus.disabled = incorrectPoints === 0;
    minus.title = minus.disabled ? 'Le barème retire 0 point' : `Retirer ${incorrectPoints} points`;
    minus.setAttribute('aria-label', `Retirer ${incorrectPoints} points à ${student.name}`);
    minus.addEventListener('click', () => changeStudentScore(student.id, -incorrectPoints));
    const value = document.createElement('div');
    value.className = 'score-value';
    value.textContent = student.score ?? 0;
    const plus = document.createElement('button');
    plus.textContent = '+';
    plus.title = `Ajouter ${correctPoints} points`;
    plus.setAttribute('aria-label', `Ajouter ${correctPoints} points à ${student.name}`);
    plus.addEventListener('click', () => changeStudentScore(student.id, correctPoints));
    controls.append(minus, value, plus);

    row.append(badge, info, controls);
    if (scoreEffect) appendScoreChangeEffect(row, scoreEffect);
    elements.studentList.appendChild(row);
  }

  state.recentScoreChange = null;
  requestAnimationFrame(updateStudentListDensity);
}

function updateStudentListDensity() {
  const list = elements.studentList;
  if (!list) return;
  const studentCount = list.querySelectorAll('.student-row').length;
  if (!studentCount || list.clientHeight <= 0) return;

  const availableHeight = Math.max(0, list.clientHeight - 10);
  const rawHeightPerStudent = availableHeight / studentCount;
  const gap = rawHeightPerStudent >= 32 ? 3 : rawHeightPerStudent >= 21 ? 2 : 1;
  const rowHeight = Math.max(6, (availableHeight - gap * Math.max(0, studentCount - 1)) / studentCount);
  const fontSize = Math.max(8, Math.min(13.5, rowHeight * 0.56));
  const metaSize = Math.max(7, Math.min(9.5, fontSize * 0.72));
  const controlSize = Math.max(11, Math.min(23, rowHeight - 3));
  const controlFontSize = Math.max(9, Math.min(15, controlSize * 0.66));
  const badgeSize = Math.max(12, Math.min(27, rowHeight - 1));
  const scoreWidth = Math.max(17, Math.min(30, fontSize * 2.1));
  const innerGap = rowHeight < 18 ? 2 : rowHeight < 28 ? 4 : 6;
  const density = rowHeight < 17 ? 'ultra' : rowHeight < 32 ? 'dense' : 'normal';

  list.dataset.density = density;
  list.style.setProperty('--student-gap', `${gap}px`);
  list.style.setProperty('--student-font-size', `${fontSize.toFixed(2)}px`);
  list.style.setProperty('--student-meta-size', `${metaSize.toFixed(2)}px`);
  list.style.setProperty('--student-control-size', `${controlSize.toFixed(2)}px`);
  list.style.setProperty('--student-control-font-size', `${controlFontSize.toFixed(2)}px`);
  list.style.setProperty('--student-badge-size', `${badgeSize.toFixed(2)}px`);
  list.style.setProperty('--student-score-width', `${scoreWidth.toFixed(2)}px`);
  list.style.setProperty('--student-inner-gap', `${innerGap}px`);
}

function setupStudentListResizeObserver() {
  if (!elements.studentList || state.studentListResizeObserver) return;
  if (typeof ResizeObserver === 'function') {
    state.studentListResizeObserver = new ResizeObserver(() => updateStudentListDensity());
    state.studentListResizeObserver.observe(elements.studentList);
  } else {
    window.addEventListener('resize', updateStudentListDensity);
  }
  requestAnimationFrame(updateStudentListDensity);
}

function setupSidebarResizer() {
  const handle = elements.sidebarResizer;
  if (!handle) return;

  handle.addEventListener('pointerdown', (event) => {
    if (state.sidebarCollapsed || event.button !== 0) return;
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = state.sidebarWidth;
    document.body.classList.add('sidebar-resizing');
    handle.setPointerCapture?.(event.pointerId);

    const onMove = (moveEvent) => {
      applySidebarWidth(startWidth + startX - moveEvent.clientX);
    };
    const onEnd = () => {
      document.body.classList.remove('sidebar-resizing');
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onEnd);
      window.removeEventListener('pointercancel', onEnd);
      saveClassesToStorage();
      setSessionStatus(`Largeur de la liste: ${state.sidebarWidth} px.`, 'neutral');
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onEnd, { once: true });
    window.addEventListener('pointercancel', onEnd, { once: true });
  });

  handle.addEventListener('keydown', (event) => {
    let nextWidth = state.sidebarWidth;
    if (event.key === 'ArrowLeft') nextWidth += event.shiftKey ? 40 : 12;
    else if (event.key === 'ArrowRight') nextWidth -= event.shiftKey ? 40 : 12;
    else if (event.key === 'Home') nextWidth = MIN_SIDEBAR_WIDTH;
    else if (event.key === 'End') nextWidth = getMaximumSidebarWidth();
    else return;
    event.preventDefault();
    applySidebarWidth(nextWidth, { persist: true });
    setSessionStatus(`Largeur de la liste: ${state.sidebarWidth} px.`, 'neutral');
  });

  window.addEventListener('resize', debounce(() => applySidebarWidth(state.sidebarWidth), 100));
}

function changeStudentScore(studentId, delta) {
  const roster = getSelectedRoster();
  if (!roster) return;
  const student = roster.students.find((item) => item.id === studentId);
  if (!student) return;
  const numericDelta = Number(delta);
  if (!Number.isFinite(numericDelta) || numericDelta === 0) return;
  pushUndoSnapshot();
  applyStudentScoreDelta(studentId, numericDelta);
}

function openHelpModal() {
  if (!elements.helpModal.open) elements.helpModal.showModal();
}

function closeHelpModal() {
  elements.helpModal.close();
}

function getRankedStudents(roster = getSelectedRoster()) {
  if (!roster) return [];
  let previousScore = null;
  let displayedRank = 0;
  return roster.students
    .slice()
    .sort((a, b) => {
      const scoreDifference = getStudentScoreValue(b) - getStudentScoreValue(a);
      if (scoreDifference !== 0) return scoreDifference;
      return a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' });
    })
    .map((student, index) => {
      const score = getStudentScoreValue(student);
      if (previousScore === null || score !== previousScore) displayedRank = index + 1;
      previousScore = score;
      return { student, score, rank: displayedRank };
    });
}

function renderLeaderboard() {
  const roster = getSelectedRoster();
  if (!roster || !elements.leaderboardPodium || !elements.leaderboardList) return;
  const ranked = getRankedStudents(roster);
  elements.leaderboardClassName.textContent = roster.name;
  const absentCount = roster.students.filter((student) => isStudentAbsent(student.id)).length;
  elements.leaderboardCount.textContent = `${ranked.length} élève${ranked.length > 1 ? 's' : ''}${absentCount ? ` • ${absentCount} absent${absentCount > 1 ? 's' : ''}` : ''}`;
  elements.leaderboardPodium.innerHTML = '';
  elements.leaderboardList.innerHTML = '';
  elements.leaderboardPodium.dataset.places = String(Math.min(ranked.length, 3));
  elements.leaderboardRanking.hidden = ranked.length <= 3;

  const podiumOrder = [1, 0, 2];
  for (const rankedIndex of podiumOrder) {
    const rankedStudent = ranked[rankedIndex];
    if (!rankedStudent) continue;
    const { student, score, rank } = rankedStudent;
    const place = rankedIndex + 1;
    const grade = getStudentGrade(score, roster);
    const entry = document.createElement('article');
    entry.className = `podium-entry place-${place}`;
    entry.dataset.grade = grade.key;
    entry.dataset.rank = String(rank);

    const studentBlock = document.createElement('div');
    studentBlock.className = 'podium-student';
    const badge = createGradeBadgeElement(grade, student.name, score);
    const name = document.createElement('div');
    name.className = 'podium-name';
    name.textContent = student.name;
    name.title = student.name;
    const scoreLabel = document.createElement('div');
    scoreLabel.className = 'podium-score';
    scoreLabel.textContent = `${score} pt${Math.abs(score) > 1 ? 's' : ''}`;
    const gradeLabel = document.createElement('div');
    gradeLabel.className = 'podium-grade';
    gradeLabel.textContent = grade.label + (isStudentAbsent(student.id) ? ' • absent aujourd’hui' : '');
    studentBlock.append(badge, name, scoreLabel, gradeLabel);

    const step = document.createElement('div');
    step.className = 'podium-step';
    step.textContent = String(rank);
    entry.append(studentBlock, step);
    elements.leaderboardPodium.appendChild(entry);
  }

  for (const rankedStudent of ranked.slice(3)) {
    const { student, score, rank } = rankedStudent;
    const grade = getStudentGrade(score, roster);
    const row = document.createElement('article');
    row.className = 'leaderboard-row';
    row.dataset.grade = grade.key;
    const rankLabel = document.createElement('div');
    rankLabel.className = 'leaderboard-rank';
    rankLabel.textContent = String(rank);
    const badge = createGradeBadgeElement(grade, student.name, score);
    const copy = document.createElement('div');
    copy.className = 'leaderboard-student-copy';
    const name = document.createElement('div');
    name.className = 'leaderboard-student-name';
    name.textContent = student.name;
    if (isStudentAbsent(student.id)) {
      const absent = document.createElement('span');
      absent.className = 'leaderboard-absent-note';
      absent.textContent = 'Absent';
      name.appendChild(absent);
    }
    const gradeLabel = document.createElement('div');
    gradeLabel.className = 'leaderboard-student-grade';
    gradeLabel.textContent = grade.label;
    copy.append(name, gradeLabel);
    const scoreLabel = document.createElement('div');
    scoreLabel.className = 'leaderboard-row-score';
    scoreLabel.textContent = `${score} pt${Math.abs(score) > 1 ? 's' : ''}`;
    row.append(rankLabel, badge, copy, scoreLabel);
    elements.leaderboardList.appendChild(row);
  }

}

function openLeaderboard() {
  if (!getSelectedRoster() || !elements.leaderboardModal) return;
  renderLeaderboard();
  elements.leaderboardModal.classList.remove('hidden');
  elements.closeLeaderboardBtn?.focus();
}

function closeLeaderboard() {
  elements.leaderboardModal?.classList.add('hidden');
  elements.leaderboardBtn?.focus();
}

function openClassModal({ createNew = false } = {}) {
  if (elements.classModal.open) return;
  const roster = getSelectedRoster();
  const classToEdit = roster || state.classes[0];
  if (!createNew && classToEdit) {
    loadClassIntoEditor(classToEdit.id);
  } else {
    prepareNewClass();
  }
  elements.classOptions.open = false;
  elements.classModal.showModal();
  elements.classModal.querySelector('.modal-body').scrollTop = 0;
}

function closeClassModal() {
  elements.classModal.close();
}

function populateClassList() {
  elements.classList.innerHTML = '';
  for (const roster of state.classes) {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'class-option-btn';
    const title = document.createElement('strong');
    title.textContent = roster.name;
    const meta = document.createElement('span');
    const hasFolder = Boolean(roster.folderPath);
    const scoreSettings = getRosterScoreSettings(roster);
    meta.textContent = `${roster.students.length} élèves${hasFolder ? ' • dossier lié' : ''} • +${scoreSettings.correctPoints} / -${scoreSettings.incorrectPoints}`;
    button.append(title, meta);
    if (roster.id === state.modalEditingId) {
      button.setAttribute('aria-current', 'true');
    }
    button.addEventListener('click', () => {
      loadClassIntoEditor(roster.id);
      elements.classNameInput.focus();
    });
    item.appendChild(button);
    elements.classList.appendChild(item);
  }
}

function setGradeThresholdEditorValues(rawThresholds) {
  const thresholds = normalizeGradeThresholds(rawThresholds);
  if (elements.gradeApprenticeInput) elements.gradeApprenticeInput.value = String(thresholds.apprentice);
  if (elements.gradeConfirmedInput) elements.gradeConfirmedInput.value = String(thresholds.confirmed);
  if (elements.gradeExpertInput) elements.gradeExpertInput.value = String(thresholds.expert);
  if (elements.gradeMasterInput) elements.gradeMasterInput.value = String(thresholds.master);
}

function readGradeThresholdsFromEditor() {
  const values = {
    apprentice: Number(elements.gradeApprenticeInput?.value),
    confirmed: Number(elements.gradeConfirmedInput?.value),
    expert: Number(elements.gradeExpertInput?.value),
    master: Number(elements.gradeMasterInput?.value),
  };
  const ordered = ['apprentice', 'confirmed', 'expert', 'master'];
  let previous = 0;
  for (const key of ordered) {
    const rawValue = values[key];
    const value = Math.round(rawValue);
    if (!Number.isFinite(rawValue) || value <= previous) {
      elements.modalFeedback.textContent = 'Les seuils de grades doivent être des nombres entiers strictement croissants.';
      return null;
    }
    values[key] = value;
    previous = value;
  }
  setGradeThresholdEditorValues(values);
  return values;
}

function loadClassIntoEditor(classId) {
  const roster = state.classes.find((item) => item.id === classId);
  if (!roster) return;
  const scoreSettings = getRosterScoreSettings(roster);
  state.modalEditingId = roster.id;
  elements.classNameInput.value = roster.name;
  elements.classFolderInput.value = roster.folderPath || '';
  if (elements.correctPointsInput) elements.correctPointsInput.value = String(scoreSettings.correctPoints);
  if (elements.incorrectPointsInput) elements.incorrectPointsInput.value = String(scoreSettings.incorrectPoints);
  setGradeThresholdEditorValues(roster.gradeThresholds);
  elements.studentNamesInput.value = roster.students.map((student) => student.name).join('\n');
  elements.deleteClassBtn.disabled = false;
  elements.modalFeedback.textContent = '';
  populateClassList();
}

function prepareNewClass() {
  state.modalEditingId = null;
  elements.classOptions.open = false;
  elements.classNameInput.value = '';
  elements.classFolderInput.value = '';
  if (elements.correctPointsInput) elements.correctPointsInput.value = String(scoringDefaults.correctPoints);
  if (elements.incorrectPointsInput) elements.incorrectPointsInput.value = String(scoringDefaults.incorrectPoints);
  setGradeThresholdEditorValues(defaultGradeThresholds);
  elements.studentNamesInput.value = '';
  elements.deleteClassBtn.disabled = true;
  elements.modalFeedback.textContent = '';
  populateClassList();
  if (elements.classModal.open) elements.classNameInput.focus();
}

async function chooseClassFolderForEditor() {
  if (!hasDesktopApi || !window.api?.pickClassFolder) {
    elements.modalFeedback.textContent = 'Sélection de dossier indisponible sur cette plateforme.';
    return;
  }
  try {
    const result = await window.api.pickClassFolder({ defaultDir: elements.classFolderInput.value || getSelectedRosterFolder() });
    if (!result?.folderPath) return;
    elements.classFolderInput.value = result.folderPath;
    if (state.modalEditingId) {
      const roster = state.classes.find((item) => item.id === state.modalEditingId);
      if (roster) {
        pushUndoSnapshot();
        roster.folderPath = result.folderPath;
        saveClassesToStorage();
        renderClassSelect();
        renderClassFolderHint();
        populateClassList();
        updateUiStates();
      }
    }
    elements.modalFeedback.textContent = 'Dossier de classe mis à jour et enregistré.';
  } catch (error) {
    console.error(error);
    elements.modalFeedback.textContent = 'Impossible de sélectionner le dossier.';
  }
}

function saveClass() {
  return runDocumentChange(saveClassFromEditor);
}

async function saveClassFromEditor() {
  const name = elements.classNameInput.value.trim() || 'Nouvelle classe';
  const folderPath = elements.classFolderInput.value.trim() || null;
  const correctPoints = normalizePointValue(elements.correctPointsInput.value, scoringDefaults.correctPoints);
  const incorrectPoints = normalizePointValue(elements.incorrectPointsInput.value, scoringDefaults.incorrectPoints);
  const gradeThresholds = readGradeThresholdsFromEditor();
  if (!gradeThresholds) return;
  elements.correctPointsInput.value = String(correctPoints);
  elements.incorrectPointsInput.value = String(incorrectPoints);
  const parsedNames = parseStudentNames(elements.studentNamesInput.value);
  if (!parsedNames.length) {
    elements.modalFeedback.textContent = 'Ajoutez au moins un prénom.';
    return;
  }

  const existing = state.classes.find((item) => item.id === state.modalEditingId);
  const changesClass = !existing || existing.id !== state.selectedClassId;
  const adoptDocument = !existing && !state.selectedClassId && Boolean(state.pdfDoc);
  if (changesClass && !await saveBeforeLeavingDocument()) return;
  pushUndoSnapshot();

  const existingStudents = new Map((existing?.students || []).map((student) => [student.name.toLowerCase(), student]));
  const students = parsedNames.map((studentName) => {
    const previous = existingStudents.get(studentName.toLowerCase());
    return previous
      ? { ...previous, name: studentName }
      : { id: createId(), name: studentName, score: 0, assignmentCount: 0, absenceCredit: 0 };
  });
  const fields = { name, folderPath, correctPoints, incorrectPoints, gradeThresholds, students };
  const roster = existing || { id: createId(), lastPdfPath: null, pdfPaths: [], absentStudentIds: [] };
  Object.assign(roster, fields);
  const validIds = new Set(students.map((student) => student.id));
  if (Array.isArray(roster.absentStudentIds)) {
    roster.absentStudentIds = roster.absentStudentIds.filter((studentId) => validIds.has(studentId));
  }
  if (!existing) state.classes.push(roster);

  state.modalEditingId = roster.id;
  elements.deleteClassBtn.disabled = false;
  elements.modalFeedback.textContent = existing ? 'Classe mise à jour.' : 'Classe ajoutée.';
  populateClassList();
  if (changesClass) {
    await showClassDocuments(roster.id, { adoptDocument });
  } else {
    restoreClassAttendance();
    normalizeOverlayAssignments();
    saveClassesToStorage();
    renderClassSelect();
    renderStudentList();
    renderGradeLegend();
    renderClassFolderHint();
  }
}

function deleteEditingClass() {
  return runDocumentChange(async () => {
    const index = state.classes.findIndex((item) => item.id === state.modalEditingId);
    if (index === -1) return;
    const wasActive = state.classes[index].id === state.selectedClassId;
    if (wasActive && !await saveBeforeLeavingDocument()) return;
    pushUndoSnapshot();
    state.classes.splice(index, 1);
    prepareNewClass();
    if (wasActive) {
      await showClassDocuments(state.classes[0]?.id ?? null);
    } else {
      renderClassSelect();
      saveClassesToStorage();
    }
  });
}

function parseStudentNames(raw) {
  return raw
    .replace(/[\t;]/g, '\n')
    .split('\n')
    .map((name) => name.trim())
    .filter((name, index, arr) => name && arr.indexOf(name) === index);
}

function resetScoresForCurrentClass() {
  const roster = getSelectedRoster();
  if (!roster) return;
  const hasAnyScore = roster.students.some((student) => (
    (student.score || 0) !== 0
    || getStudentClickCount(student) !== 0
    || getStudentAbsenceCredit(student) !== 0
  ));
  if (!hasAnyScore) return;
  pushUndoSnapshot();
  for (const student of roster.students) {
    student.score = 0;
    student.assignmentCount = 0;
    student.absenceCredit = 0;
  }
  saveClassesToStorage();
  renderStudentList();
}

function buildSessionSnapshot() {
  return {
    version: 1,
    createdAt: new Date().toISOString(),
    pdf: {
      name: state.pdfInfo?.name ?? null,
      size: state.pdfInfo?.size ?? null,
      fingerprint: state.pdfInfo?.fingerprint ?? null,
    },
    view: {
      zoom: state.currentZoom,
      currentPage: state.currentPageNumber,
      pageViewMode: state.pageViewMode,
      scrollTop: elements.pdfScroll.scrollTop,
      scrollLeft: elements.pdfScroll.scrollLeft,
      sidebarCollapsed: state.sidebarCollapsed,
      sidebarWidth: state.sidebarWidth,
      filebarCollapsed: state.filebarCollapsed,
    },
    attendance: {
      absentStudentIds: [...state.absentStudentIds],
    },
    overlays: state.overlays.map(o => ({
      id: o.id,
      pageNumber: o.pageNumber,
      rect: o.rect, // {x,y,width,height} normalisés [0..1]
      status: o.status ?? 'anchored',
      assignedStudentId: o.assignedStudentId ?? null,
    })),
    markups: state.markups.map((item) => ({
      id: item.id,
      pageNumber: item.pageNumber,
      rect: item.rect,
      kind: normalizeMarkupKind(item.kind),
      color: normalizeHexColor(item.color, markupDefaults.color),
      opacity: Math.min(1, Math.max(0.05, Number(item.opacity ?? markupDefaults.highlightOpacity))),
    })),
    textOverlays: state.textOverlays.map(t => ({
      id: t.id,
      pageNumber: t.pageNumber,
      rect: t.rect,
      text: t.text ?? '',
      fontSizePx: Number.isFinite(Number(t.fontSizePx)) ? Number(t.fontSizePx) : textStyleDefaults.fontSizePx,
      autoFontSize: false,
      textColor: normalizeHexColor(t.textColor, textStyleDefaults.textColor),
      backgroundOpacity: Math.min(1, Math.max(0, Number(t.backgroundOpacity ?? textStyleDefaults.backgroundOpacity))),
    })),
    settings: {
      overlayOpacity: Math.min(1, Math.max(0, Number(state.overlayOpacity))),
      markupColor: normalizeHexColor(state.markupColor, markupDefaults.color),
      defaultTextFontSizePx: getDefaultTextFontSizePx(),
    },
    classes: {
      selectedClassId: state.selectedClassId ?? null,
      all: state.classes.map(({ pdfPaths, ...roster }) => roster),
    },
  };
}

async function applySession(session, { includeClassData = true, restoreLayout = true } = {}) {
  if (!session?.pdf?.fingerprint || state.pdfInfo.fingerprint !== session.pdf.fingerprint) return false;

  // Vue
  if (typeof session.view?.zoom === 'number') {
    state.currentZoom = clampZoom(session.view.zoom);
    elements.zoomLabel.textContent = `${Math.round(state.currentZoom * 100)} %`;
  }
  if (typeof session.view?.currentPage === 'number') {
    state.currentPageNumber = Math.min(Math.max(1, session.view.currentPage), state.totalPages || 1);
  }
  if (session.view?.pageViewMode === 'spread' || session.view?.pageViewMode === 'single') {
    state.pageViewMode = session.view.pageViewMode;
  }
  if (restoreLayout) {
    if (typeof session.view?.sidebarCollapsed === 'boolean') state.sidebarCollapsed = session.view.sidebarCollapsed;
    if (Number.isFinite(Number(session.view?.sidebarWidth))) state.sidebarWidth = clampSidebarWidth(session.view.sidebarWidth);
    if (typeof session.view?.filebarCollapsed === 'boolean') state.filebarCollapsed = session.view.filebarCollapsed;
  }
  applyLayoutPreferences();

  // Overlays + classes
  clearUndoHistory();
  state.overlays = Array.isArray(session.overlays) ? session.overlays.slice() : [];
  state.markups = Array.isArray(session.markups)
    ? session.markups.map((item) => normalizeMarkupItem(item))
    : [];
  state.textOverlays = Array.isArray(session.textOverlays)
    ? session.textOverlays.map((item) => {
        const next = { ...item };
        ensureTextOverlayStyle(next);
        return next;
      })
    : [];
  state.selectedOverlayId = null;
  state.selectedMarkupId = null;
  state.selectedNativeShapeId = null;
  state.selectedTextId = null;
  state.annotationGroup.clear();
  state.editingTextId = null;
  state.hoverMarkupId = null;
  state.lastActiveMarkupId = null;
  state.activeMarkupTool = null;
  const savedOpacity = Number(session?.settings?.overlayOpacity);
  if (Number.isFinite(savedOpacity)) {
    state.overlayOpacity = Math.min(1, Math.max(0, savedOpacity));
  }
  if (elements.overlayOpacityInput) {
    elements.overlayOpacityInput.value = String(Math.round(state.overlayOpacity * 100));
  }
  state.defaultTextFontSizePx = Math.max(1, Math.min(96, Number(session?.settings?.defaultTextFontSizePx) || textStyleDefaults.fontSizePx));
  if (elements.textSizeInput) {
    elements.textSizeInput.value = String(Math.round(getDefaultTextFontSizePx()));
  }
  state.markupColor = normalizeHexColor(session?.settings?.markupColor, markupDefaults.color);
  if (elements.markupColorInput) {
    elements.markupColorInput.value = state.markupColor;
  }
  if (includeClassData && session.classes) {
    state.classes = mergeSessionClassesWithLocal(session.classes.all ?? [], state.classes);
    const targetId = session.classes.selectedClassId ?? state.selectedClassId;
    state.selectedClassId = state.classes.some((item) => item.id === targetId)
      ? targetId
      : state.classes[0]?.id ?? null;
  }

  const roster = getSelectedRoster();
  if (roster && Array.isArray(session.attendance?.absentStudentIds)
    && ((includeClassData && session.classes) || !Array.isArray(roster.absentStudentIds))) {
    roster.absentStudentIds = session.attendance.absentStudentIds;
  }
  restoreClassAttendance();

  renderClassSelect();
  normalizeOverlayAssignments();
  renderStudentList();
  renderGradeLegend();
  renderClassFolderHint();
  saveClassesToStorage();

  await renderCurrentPage({ scrollPosition: {
    top: Number(session.view?.scrollTop) || 0,
    left: Number(session.view?.scrollLeft) || 0,
  } });
  updateUiStates();
  return true;
}



function updateUiStates() {
  const hasPdf = Boolean(state.pdfDoc);
  elements.welcomePanel.hidden = hasPdf;
  if (!hasPdf) {
    document.body.classList.remove('quick-draw-ready');
    document.body.classList.remove('markup-draw-ready');
    state.activeMarkupTool = null;
  }
  elements.addOverlayBtn.disabled = !hasPdf;
  if (elements.toggleHighlightToolBtn) {
    elements.toggleHighlightToolBtn.disabled = !hasPdf;
    elements.toggleHighlightToolBtn.classList.toggle('active', hasPdf && state.activeMarkupTool === 'highlight');
    elements.toggleHighlightToolBtn.setAttribute('aria-pressed', String(state.activeMarkupTool === 'highlight'));
  }
  if (elements.toggleUnderlineToolBtn) {
    elements.toggleUnderlineToolBtn.disabled = !hasPdf;
    elements.toggleUnderlineToolBtn.classList.toggle('active', hasPdf && state.activeMarkupTool === 'underline');
    elements.toggleUnderlineToolBtn.setAttribute('aria-pressed', String(state.activeMarkupTool === 'underline'));
  }
  if (elements.markupColorInput) {
    elements.markupColorInput.disabled = !hasPdf;
  }
  document.body.classList.toggle('markup-draw-ready', Boolean(hasPdf && state.activeMarkupTool));
  
  if (elements.anchorBtn) {
    elements.anchorBtn.disabled = true;
  }
  
  elements.assignBtn.disabled = !state.overlays.some((overlay) => overlay.status === 'anchored');
  elements.clearAssignmentsBtn.disabled = !state.overlays.some((overlay) => overlay.assignedStudentId);
  elements.zoomInBtn.disabled = !hasPdf || state.currentZoom >= MAX_ZOOM - 0.001;
  elements.zoomOutBtn.disabled = !hasPdf || state.currentZoom <= MIN_ZOOM + 0.001;
  if (elements.zoomResetBtn) elements.zoomResetBtn.disabled = !hasPdf;
  if (elements.saveSessionBtn) elements.saveSessionBtn.disabled = !hasPdf;
  if (elements.addTextBtn) elements.addTextBtn.disabled = !hasPdf;
  elements.resetScoresBtn.disabled = !getSelectedRoster();
  if (elements.leaderboardBtn) elements.leaderboardBtn.disabled = !getSelectedRoster()?.students.length;
  if (elements.reopenLastPdfBtn) {
    elements.reopenLastPdfBtn.disabled = !getOpenDocuments().length;
  }
  elements.zoomLabel.textContent = `${Math.round(state.currentZoom * 100)} %`;
  if (elements.overlayOpacityOutput) {
    elements.overlayOpacityOutput.textContent = `${Math.round(state.overlayOpacity * 100)} %`;
  }
  if (elements.singlePageBtn) elements.singlePageBtn.disabled = !hasPdf;
  if (elements.twoPageBtn) elements.twoPageBtn.disabled = !hasPdf || state.totalPages < 2;
  applyLayoutPreferences();
  
  // Mettre à jour les boutons de navigation
  const prevBtn = elements.previousPageBtn;
  const nextBtn = elements.nextPageBtn;
  const pageIndicator = document.getElementById('page-indicator');
  const overviewBtn = elements.pageOverviewBtn;
  const visiblePages = getVisiblePageNumbers();
  const lastVisiblePage = visiblePages.at(-1) || state.currentPageNumber;
  
  if (prevBtn) prevBtn.disabled = !hasPdf || state.currentPageNumber <= 1;
  if (nextBtn) nextBtn.disabled = !hasPdf || lastVisiblePage >= state.totalPages;
  if (overviewBtn) overviewBtn.disabled = !hasPdf;
  if (pageIndicator && hasPdf) {
    pageIndicator.textContent = visiblePages.length > 1
      ? `Pages ${visiblePages[0]}–${visiblePages[1]} / ${state.totalPages}`
      : `Page ${state.currentPageNumber} / ${state.totalPages}`;
  } else if (pageIndicator) {
    pageIndicator.textContent = '';
  }
  updateSelectionUi();
}


function normalizeClasses(rawClasses) {
  if (!Array.isArray(rawClasses)) return [];
  return rawClasses
    .map((item) => ({
      ...item,
      folderPath: item?.folderPath || null,
      lastPdfPath: typeof item?.lastPdfPath === 'string' ? item.lastPdfPath : null,
      pdfPaths: normalizePdfPaths(item?.pdfPaths, item?.lastPdfPath),
      correctPoints: normalizePointValue(item?.correctPoints, scoringDefaults.correctPoints),
      incorrectPoints: normalizePointValue(item?.incorrectPoints, scoringDefaults.incorrectPoints),
      gradeThresholds: normalizeGradeThresholds(item?.gradeThresholds),
      students: Array.isArray(item?.students)
        ? item.students
          .map((student) => ({
            ...student,
            id: student?.id || createId(),
            name: typeof student?.name === 'string' ? student.name.trim() : '',
            score: getStudentScoreValue(student),
            assignmentCount: getStudentClickCount(student),
            absenceCredit: getStudentAbsenceCredit(student),
          }))
          .filter((student) => student.name)
        : [],
    }))
    .filter((item) => item && item.id && item.name);
}

function mergeSessionClassesWithLocal(sessionClassesRaw, localClassesRaw) {
  const sessionClasses = normalizeClasses(sessionClassesRaw);
  const localClasses = normalizeClasses(localClassesRaw);
  if (!sessionClasses.length) return localClasses;
  if (!localClasses.length) return sessionClasses;

  const merged = [];
  const usedLocalIds = new Set();

  const findLocalMatch = (sessionClass) => {
    const byId = localClasses.find((item) => item.id === sessionClass.id);
    if (byId) return byId;
    const sessionName = String(sessionClass.name || '').trim().toLowerCase();
    if (!sessionName) return null;
    return localClasses.find((item) => String(item.name || '').trim().toLowerCase() === sessionName) || null;
  };

  for (const sessionClass of sessionClasses) {
    const local = findLocalMatch(sessionClass);
    if (local?.id) usedLocalIds.add(local.id);
    merged.push({
      ...sessionClass,
      folderPath: local?.folderPath || sessionClass.folderPath || null,
      lastPdfPath: local ? local.lastPdfPath : sessionClass.lastPdfPath,
      pdfPaths: local ? local.pdfPaths : sessionClass.pdfPaths,
    });
  }

  for (const local of localClasses) {
    if (usedLocalIds.has(local.id)) continue;
    if (merged.some((item) => item.id === local.id)) continue;
    merged.push(local);
  }

  return merged;
}

function clearLoadedPdfView() {
  const previousDoc = state.pdfDoc;
  state.currentPdfPath = null;
  state.browserDocument = null;
  state.pdfDoc = null;
  state.renderRequestId += 1;
  state.pdfInfo = { name: null, size: null, fingerprint: null };
  state.currentZoom = 1;
  state.currentPageNumber = 1;
  state.totalPages = 0;
  state.defaultTextFontSizePx = textStyleDefaults.fontSizePx;
  state.textOverlayClipboard = null;
  elements.textSizeInput.value = String(getDefaultTextFontSizePx());
  state.pageStates.clear();
  state.pageOffsets = [];
  state.lastVisiblePage = 1;
  state.activeMarkupTool = null;
  state.hoverOverlayId = null;
  state.hoverTextId = null;
  state.hoverNativeShapeId = null;
  state.lastActiveNativeShapeId = null;
  state.nativeShapes = [];
  state.nativeShapeElements.clear();
  state.nativeShapesRequestId += 1;
  state.lastActiveType = null;
  clearAllOverlays();
  clearAllMarkups();
  clearAllTextOverlays();
  closeStudentChooser();
  clearPageOverviewGrid();
  clearTimeout(state.zoomPreview.commitTimeout);
  state.zoomPreview = { active: false, baseZoom: 1, previewZoom: 1, anchor: null, commitTimeout: null };
  elements.pdfContainer.classList.remove('is-zoom-previewing');
  elements.pdfContainer.style.transform = '';
  elements.pdfContainer.style.transformOrigin = '';
  elements.pdfContainer.replaceChildren();
  elements.pdfScroll.scrollTop = 0;
  elements.pdfScroll.scrollLeft = 0;
  if (previousDoc) void previousDoc.destroy().catch(() => {});
}

function restoreLastPdfOnStartup() {
  return runDocumentChange(openPreferredDocument);
}

function loadClassesFromStorage() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    if (stored && typeof stored === 'object') {
      if (Array.isArray(stored.classes)) {
        state.classes = normalizeClasses(stored.classes);
      }
      state.selectedClassId = stored.selectedClassId || null;
      if (Array.isArray(stored.standalonePdfPaths) || !state.selectedClassId) {
        state.lastOpenedPdfPath = typeof stored.lastOpenedPdfPath === 'string' && stored.lastOpenedPdfPath
          ? stored.lastOpenedPdfPath
          : null;
      }
      state.standalonePdfPaths = normalizePdfPaths(stored.standalonePdfPaths, state.lastOpenedPdfPath);
      if (stored.preferences?.pageViewMode === 'spread' || stored.preferences?.pageViewMode === 'single') {
        state.pageViewMode = stored.preferences.pageViewMode;
      }
      if (typeof stored.preferences?.sidebarCollapsed === 'boolean') {
        state.sidebarCollapsed = stored.preferences.sidebarCollapsed;
      }
      if (Number.isFinite(Number(stored.preferences?.sidebarWidth))) {
        state.sidebarWidth = clampSidebarWidth(stored.preferences.sidebarWidth);
      }
      if (typeof stored.preferences?.filebarCollapsed === 'boolean') {
        state.filebarCollapsed = stored.preferences.filebarCollapsed;
      }
    }
  } catch (error) {
    console.warn('Impossible de charger les classes', error);
  }
}

function saveClassesToStorage() {
  const payload = {
    classes: state.classes,
    selectedClassId: state.selectedClassId,
    lastOpenedPdfPath: state.lastOpenedPdfPath,
    standalonePdfPaths: state.standalonePdfPaths,
    preferences: {
      pageViewMode: state.pageViewMode,
      sidebarCollapsed: state.sidebarCollapsed,
      sidebarWidth: state.sidebarWidth,
      filebarCollapsed: state.filebarCollapsed,
    },
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function debounce(fn, delay) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}
