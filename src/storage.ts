import { type BoardProject, importProject } from "./domain"

const DB_NAME = "roarcad"
const STORE_NAME = "projects"
const CURRENT_KEY = "current"
const LEGACY_KEY = "roarcad-project-v1"
const LEGACY_POCKETROAR_REVISION_IDS = new Set(["56147af9ff46a3ee", "fbfe09aae1d80347"])

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function loadStoredProject(): Promise<BoardProject | null> {
  const database = await openDatabase()
  const stored = await new Promise<string | undefined>((resolve, reject) => {
    const request = database.transaction(STORE_NAME).objectStore(STORE_NAME).get(CURRENT_KEY)
    request.onsuccess = () => resolve(request.result as string | undefined)
    request.onerror = () => reject(request.error)
  })
  database.close()
  if (stored) return importProject(stored)

  const legacy = localStorage.getItem(LEGACY_KEY)
  if (!legacy) return null
  const migrated = await importProject(legacy)
  await saveStoredProject(migrated)
  localStorage.removeItem(LEGACY_KEY)
  return migrated
}

export function chooseStartupProject(
  stored: BoardProject | null,
  starter: BoardProject,
  bundledPocketRoar: BoardProject,
): BoardProject {
  const isPristinePocketRoar =
    stored?.id === bundledPocketRoar.id &&
    stored.revisions.length === 1 &&
    stored.currentRevisionId === stored.revisions[0].id &&
    (stored.currentRevisionId === bundledPocketRoar.currentRevisionId ||
      LEGACY_POCKETROAR_REVISION_IDS.has(stored.currentRevisionId)) &&
    stored.revisions[0].summary === "Initial design"
  return isPristinePocketRoar ? starter : (stored ?? starter)
}

export async function saveStoredProject(project: BoardProject): Promise<void> {
  const database = await openDatabase()
  await new Promise<void>((resolve, reject) => {
    const request = database
      .transaction(STORE_NAME, "readwrite")
      .objectStore(STORE_NAME)
      .put(JSON.stringify(project), CURRENT_KEY)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
  database.close()
}
