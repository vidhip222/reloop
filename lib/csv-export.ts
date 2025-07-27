export function exportToCsv<T extends Record<string, any>>(
  data: T[],
  filenamePrefix: string,
  fields: (keyof T | { key: keyof T; header: string })[],
) {
  if (!data || data.length === 0) {
    console.warn("No data to export.")
    return
  }

  // Determine headers and keys
  const headers = fields.map((field) => (typeof field === "object" ? field.header : String(field)))
  const keys = fields.map((field) => (typeof field === "object" ? field.key : field))

  // Create CSV header row
  const csvRows = [headers.join(",")]

  // Create CSV data rows
  for (const row of data) {
    const values = keys.map((key) => {
      let value = row[key]
      if (value === null || value === undefined) {
        value = ""
      } else if (Array.isArray(value)) {
        value = `"${value.join(";")}"` // Handle arrays by joining with semicolon and quoting
      } else if (typeof value === "object" && value !== null) {
        value = `"${JSON.stringify(value).replace(/"/g, '""')}"` // Stringify objects and escape quotes
      } else if (typeof value === "string") {
        value = `"${value.replace(/"/g, '""')}"` // Escape double quotes in strings
      }
      return value
    })
    csvRows.push(values.join(","))
  }

  // Create Blob and download
  const csvString = csvRows.join("\n")
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.setAttribute("href", url)
  const date = new Date().toISOString().split("T")[0] // YYYY-MM-DD
  link.setAttribute("download", `${filenamePrefix}_${date}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
