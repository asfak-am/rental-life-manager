import { jsPDF } from 'jspdf'
import { formatCurrency } from './currency'

function formatDate(value) {
  if (!value) return '-'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function drawHeader(doc, { title, subtitle }) {
  doc.setFillColor(69, 30, 187)
  doc.rect(0, 0, 210, 32, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text(title, 14, 14)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(subtitle, 14, 21)
  doc.text(`Generated ${formatDate(new Date())}`, 14, 27)

  doc.setTextColor(31, 41, 55)
}

function drawStatCards(doc, stats) {
  const startY = 38
  const boxWidth = 58
  const gap = 6
  const colors = [
    [236, 235, 255],
    [233, 250, 247],
    [255, 244, 230],
  ]

  stats.forEach((stat, index) => {
    const x = 14 + index * (boxWidth + gap)
    const [r, g, b] = colors[index % colors.length]

    doc.setFillColor(r, g, b)
    doc.roundedRect(x, startY, boxWidth, 18, 2, 2, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(100, 116, 139)
    doc.text(stat.label.toUpperCase(), x + 3, startY + 6)

    doc.setFontSize(11)
    doc.setTextColor(15, 23, 42)
    doc.text(stat.value, x + 3, startY + 13)
  })

  doc.setTextColor(31, 41, 55)
  return startY + 24
}

function drawSectionTitle(doc, title, y) {
  doc.setFillColor(244, 245, 249)
  doc.roundedRect(14, y, 182, 8, 2, 2, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(51, 65, 85)
  doc.text(title, 17, y + 5.5)
  return y + 12
}

function formatFilterDate(value) {
  if (!value) return 'Any'
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return 'Any'
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function drawTable(doc, { y, headers, rows, widths }) {
  const pageHeight = 297
  const left = 14
  const baseRowHeight = 7

  const drawHeaderRow = (rowY) => {
    let x = left
    doc.setFillColor(248, 250, 252)
    doc.rect(left, rowY, widths.reduce((a, b) => a + b, 0), baseRowHeight, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(71, 85, 105)
    headers.forEach((header, i) => {
      doc.text(header, x + 2, rowY + 4.8)
      x += widths[i]
    })
  }

  drawHeaderRow(y)
  y += baseRowHeight

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(30, 41, 59)

  rows.forEach((row, idx) => {
    const cellLines = row.map((cell, i) => doc.splitTextToSize(String(cell ?? '-'), widths[i] - 4))
    const maxLines = Math.max(1, ...cellLines.map(lines => lines.length))
    const rowHeight = Math.max(baseRowHeight, maxLines * 4 + 3)

    if (y + rowHeight > pageHeight - 16) {
      doc.addPage()
      y = 16
      drawHeaderRow(y)
      y += baseRowHeight
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(30, 41, 59)
    }

    if (idx % 2 === 1) {
      doc.setFillColor(250, 250, 252)
      doc.rect(left, y, widths.reduce((a, b) => a + b, 0), rowHeight, 'F')
    }

    let x = left
    cellLines.forEach((lines, i) => {
      doc.text(lines, x + 2, y + 4)
      x += widths[i]
    })

    y += rowHeight
  })

  return y + 2
}

export function exportExpensesPdf({
  summaryData,
  expenses,
  rentHistory,
  currency,
  expenseFromDate,
  expenseToDate,
  rentFromDate,
  rentToDate,
}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })

  drawHeader(doc, {
    title: 'Expenses Report',
    subtitle: 'Household transactions and rent activity overview',
  })

  let y = drawStatCards(doc, [
    { label: 'Total Outflow', value: formatCurrency(summaryData?.totalExpenses || 0, currency) },
    { label: 'My Share', value: formatCurrency(summaryData?.myShare || 0, currency) },
  ])

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(71, 85, 105)
  doc.text(
    `Applied Filters  Expenses: ${formatFilterDate(expenseFromDate)} to ${formatFilterDate(expenseToDate)}   Rent: ${formatFilterDate(rentFromDate)} to ${formatFilterDate(rentToDate)}`,
    14,
    y,
  )
  y += 4

  y = drawSectionTitle(doc, 'Recent Expenses', y)
  const expenseRows = (expenses || []).slice(0, 14).map((expense) => [
    expense.billMonth || formatDate(expense.date),
    expense.title || '-',
    expense.category || 'Other',
    formatCurrency(expense.amount || 0, currency),
  ])

  y = drawTable(doc, {
    y,
    headers: ['Date', 'Title', 'Category', 'Amount'],
    rows: expenseRows.length ? expenseRows : [['-', 'No expenses recorded yet.', '-', '-']],
    widths: [34, 78, 36, 34],
  })

  y = drawSectionTitle(doc, 'Rent Paid History', y)
  const rentRows = (rentHistory || []).slice(0, 14).map((item) => [
    formatDate(item.paidAt),
    item.name || '-',
    item.month || '-',
    formatCurrency(item.amount || 0, currency),
  ])

  drawTable(doc, {
    y,
    headers: ['Paid On', 'Member', 'Month', 'Amount'],
    rows: rentRows.length ? rentRows : [['-', 'No rent payments recorded yet.', '-', '-']],
    widths: [34, 78, 36, 34],
  })

  doc.save(`expenses-report-${new Date().toISOString().slice(0, 10)}.pdf`)
}

export function exportAnalyticsPdf({
  summaryData,
  categoryData,
  monthlyData,
  utilityTrendData,
  contributions,
  currency,
}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })

  drawHeader(doc, {
    title: 'Analytics Summary',
    subtitle: 'Category, trend, utility, and contribution insights',
  })

  const totalExpenses = summaryData?.totalExpenses || 0
  const avgMonthly = monthlyData?.length
    ? totalExpenses / monthlyData.length
    : 0

  let y = drawStatCards(doc, [
    { label: 'Total Spent', value: formatCurrency(totalExpenses, currency) },
    { label: 'Avg Monthly', value: formatCurrency(avgMonthly, currency) },
    { label: 'Categories', value: String((categoryData || []).length) },
  ])

  y = drawSectionTitle(doc, 'Category Breakdown', y)
  const categoryRows = (categoryData || []).slice(0, 10).map((item) => {
    const all = (categoryData || []).reduce((sum, cat) => sum + Number(cat.value || 0), 0)
    const percent = all > 0 ? `${Math.round((Number(item.value || 0) / all) * 100)}%` : '0%'
    return [item.name || '-', formatCurrency(item.value || 0, currency), percent]
  })

  y = drawTable(doc, {
    y,
    headers: ['Category', 'Amount', 'Share'],
    rows: categoryRows.length ? categoryRows : [['-', '-', '-']],
    widths: [98, 50, 34],
  })

  y = drawSectionTitle(doc, 'Monthly Trends', y)
  const monthRows = (monthlyData || []).slice(0, 12).map((item) => [
    item.month || '-',
    formatCurrency(item.amount || 0, currency),
  ])

  y = drawTable(doc, {
    y,
    headers: ['Month', 'Shared Spent'],
    rows: monthRows.length ? monthRows : [['-', '-']],
    widths: [91, 91],
  })

  y = drawSectionTitle(doc, 'Utility Bills Trend', y)
  const utilityRows = (utilityTrendData || []).slice(0, 12).map((item) => [
    item.month || '-',
    formatCurrency(item.water || 0, currency),
    formatCurrency(item.electricity || 0, currency),
  ])

  y = drawTable(doc, {
    y,
    headers: ['Month', 'Water', 'Electricity'],
    rows: utilityRows.length ? utilityRows : [['-', '-', '-']],
    widths: [62, 60, 60],
  })

  y = drawSectionTitle(doc, 'Top Contributions', y)
  const contributionRows = (contributions || [])
    .slice()
    .sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0))
    .slice(0, 10)
    .map((item, index) => [
      `${index + 1}`,
      item.name || '-',
      formatCurrency(item.amount || 0, currency),
    ])

  drawTable(doc, {
    y,
    headers: ['Rank', 'Member', 'Contributed'],
    rows: contributionRows.length ? contributionRows : [['-', '-', '-']],
    widths: [24, 90, 68],
  })

  doc.save(`analytics-summary-${new Date().toISOString().slice(0, 10)}.pdf`)
}
