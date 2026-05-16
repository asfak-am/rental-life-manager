export const createMemberMap = (members = []) =>
  Object.fromEntries(
    (members || [])
      .filter(Boolean)
      .map(member => [String(member?._id || member?.id || ''), member])
      .filter(([id]) => id),
  )

export const getMemberById = (memberMap = {}, memberId) => memberMap[String(memberId || '')] || null
