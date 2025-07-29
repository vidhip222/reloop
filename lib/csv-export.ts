interface ExportField {
  key: string
  header: string
}

export function exportToCsv<T extends Record<string, any>>(data: T[], fields: ExportField[], filename = "export") {
  if (!data || data.length === 0) {
    console.warn("No data to export.")
    return
  }

  // Create CSV header row
  const header = fields.map((field) => `"${field.header.replace(/"/g, '""')}"`).join(",")

  // Create CSV data rows
  const rows = data.map((row) => {
    return fields
      .map((field) => {
        let value = row[field.key]
        if (value === null || value === undefined) {
          value = ""
        } else if (typeof value === "object" && value !== null) {
          // Handle nested objects, e.g., supplier.name
          if (field.key.includes(".")) {
            const path = field.key.split(".")
            let nestedValue = row
            for (const p of path) {
              nestedValue = nestedValue ? nestedValue[p] : undefined
            }
            value = nestedValue || ""
          } else {
            value = JSON.stringify(value) // Stringify complex objects
          }
        } else if (typeof value === "string") {
          value = value.replace(/"/g, '""') // Escape double quotes
        }
        return `"${value}"`
      })
      .join(",")
  })

  const csvContent = [header, ...rows].join("\n")
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")

  if (link.download !== undefined) {
    // Browsers that support HTML5 download attribute
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } else {
    // Fallback for older browsers
    alert("Your browser does not support HTML5 download attribute. Please save the file manually.")
  }
}
