/** Prevent spreadsheet formula execution while retaining UTF-8 text and quotes. */
export function csvCell(value:unknown){const text=String(value??'');const safe=/^[\s]*[=+@-]/u.test(text)?`'${text}`:text;return `"${safe.replaceAll('"','""')}"`;}
export function csvRows(rows:unknown[][]){return '\uFEFF'+rows.map(r=>r.map(csvCell).join(';')).join('\r\n');}
