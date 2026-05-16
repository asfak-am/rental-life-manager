export const getExpenseFilterDate = (expense) => {
  const billMonth = String(expense?.billMonth || '').trim()
  if (/^\d{4}-\d{2}$/.test(billMonth)) {
    return new Date(`${billMonth}-01T00:00:00`)
  }

  return new Date(expense?.date)
}

export const isWithinDateRange = (value, from, to) => {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return false

  if (from) {
    const start = new Date(`${from}T00:00:00`)
    if (date < start) return false
  }

  if (to) {
    const end = new Date(`${to}T23:59:59.999`)
    if (date > end) return false
  }

  return true
}

export const filterByDateRange = (items = [], getDateValue, from = '', to = '') =>
  (items || []).filter(item => isWithinDateRange(getDateValue(item), from, to))

export const filterExpensesByDateRange = (expenses = [], from = '', to = '') =>
  filterByDateRange(expenses, getExpenseFilterDate, from, to)

export const filterRentHistoryByDateRange = (history = [], from = '', to = '') =>
  filterByDateRange(history, item => item?.paidAt, from, to)
