// The shift's results as a spreadsheet: Summary (teams), Orders (every order and what was served), Students.
// The Excel library loads only when someone downloads.
export async function downloadResults(report) {
  const XLSX = await import('xlsx')
  const book = XLSX.utils.book_new()
  const add = (name, rows, widths) => {
    const sheet = XLSX.utils.json_to_sheet(rows.length ? rows : [{ Note: 'Nothing to show.' }])
    sheet['!cols'] = widths.map((wch) => ({ wch }))
    XLSX.utils.book_append_sheet(book, sheet, name)
  }
  const label = { perfect: 'Perfect', undercooked: 'Undercooked', burnt: 'Burnt (thrown out)', expired: 'Walked out', cooking: 'Not finished' }

  add('Summary', [...report.teams].sort((a, b) => b.score.points - a.score.points).map((t, i) => ({
    Place: i + 1, Team: t.name, Points: t.score.points, Stars: t.score.stars,
    Perfect: t.score.perfect, Undercooked: t.score.undercooked, Burnt: t.score.burnt, 'Walked out': t.score.expired,
  })), [6, 20, 8, 6, 8, 12, 7, 11])

  add('Orders', report.teams.flatMap((t) => t.orders.map((o) => ({
    Team: t.name, Order: o.order_no, Menu: o.level, Dish: o.title, Ticket: o.ticket, Result: label[o.status] ?? o.status,
    Tries: o.tries, Points: o.points, Tip: o.tip, 'Right answer': o.answer, 'Model chain': o.solution.join(' '),
    'What was served': o.dishes.map((d) => `${d.cook} (${d.result}): ${d.chain}`).join('\n'),
    'Why': o.dishes.map((d) => d.reason).join('\n'),
  }))), [16, 6, 10, 18, 60, 16, 6, 7, 5, 22, 60, 70, 60])

  add('Students', report.students, [22, 16, 13, 8, 12, 7])

  const today = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(book, `Beaker-Bakery-results-${today}.xlsx`)
}
