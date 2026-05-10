
export function makeKey (...parts) {
  return ['akasha', ...parts.filter(Boolean)].join(':')
}

export function userKey (groupId, userId, ...extra) {
  return makeKey('user', groupId || 'global', String(userId || 'unknown'), ...extra)
}

export function shopKey (...extra) {
  return makeKey('shop', ...extra)
}

export function questKey (...extra) {
  return makeKey('quest', ...extra)
}