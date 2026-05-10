import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const pluginRoot = path.resolve(__dirname, '..', '..')
export const dataDir = path.join(pluginRoot, 'data')

export function sqliteFilePath () {
  return path.join(dataDir, 'akasha.sqlite')
}

export function signInFile (groupId, userId) {
  return path.join(dataDir, 'signin', `${groupId || 'global'}_${userId}.json`)
}

export function workshopFile (groupId, userId) {
  return path.join(dataDir, 'workshop', `${groupId || 'global'}_${userId}.json`)
}

export function synthesisHistoryFile (groupId, userId) {
  return path.join(dataDir, 'synthesis', `${groupId || 'global'}_${userId}.json`)
}

export function relationshipFile (groupId, userId) {
  return path.join(dataDir, 'relationship', `${groupId || 'global'}_${userId}.json`)
}

export const shopDataPath = path.join(dataDir, 'shop_data.json')
export const questDataPath = path.join(dataDir, 'quest_data.json')
export const relationshipDataPath = path.join(dataDir, 'relationship_data.json')