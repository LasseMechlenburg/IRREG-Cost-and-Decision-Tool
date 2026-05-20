import fs from 'node:fs'
import path from 'node:path'
import xlsx from 'xlsx'

const workbookPath = path.resolve('..', 'References', 'COST CALCULATOR.xlsx')
const outputPath = path.resolve('src', 'data', 'docData.json')

const aircraftSheets = [
  { code: 'A339', sheet: 'a339' },
  { code: 'A321', sheet: 'a321' },
  { code: 'A321N', sheet: 'a321N' },
  { code: 'SUB_NARROWBODY', sheet: 'SUB' },
]

const COL = {
  month: 0,
  origin: 1,
  destination: 2,
  pax: 3,
  seats: 5,
  blh: 6,
  fuelCost: 9,
  uptakeCost: 10,
  safCost: 12,
  ets: 14,
  cycleCost: 15,
  fhCost: 16,
  enroute: 18,
  paxCharges: 21,
  airportCharges: 22,
  ghIn: 23,
  ghOut: 24,
  handling: 25,
}

const EU261_BANDS = [250, 400, 600]

const sumDoc = (row) => {
  const values = [
    row[COL.fuelCost],
    row[COL.uptakeCost],
    row[COL.safCost],
    row[COL.ets],
    row[COL.cycleCost],
    row[COL.fhCost],
    row[COL.enroute],
    row[COL.paxCharges],
    row[COL.airportCharges],
    row[COL.ghIn],
    row[COL.ghOut],
    row[COL.handling],
  ]

  return values.reduce((acc, current) => {
    const num = Number(current)
    return acc + (Number.isFinite(num) ? num : 0)
  }, 0)
}

const bandFromDistanceKm = (distanceKm) => {
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) {
    return null
  }

  if (distanceKm <= 1500) {
    return 250
  }

  if (distanceKm <= 3500) {
    return 400
  }

  return 600
}

const workbook = xlsx.readFile(workbookPath, { cellFormula: true })

const sheet2 = workbook.Sheets.Sheet2
const sheet2Rows = sheet2
  ? xlsx.utils.sheet_to_json(sheet2, { header: 1, defval: '' })
  : []

const inferredPotentialEu261 = Number(sheet2Rows[6]?.[2])

const routes = {}

for (const aircraft of aircraftSheets) {
  const sheet = workbook.Sheets[aircraft.sheet]

  if (!sheet) {
    continue
  }

  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' })

  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i]
    const month = String(row[COL.month] ?? '').trim()
    const origin = String(row[COL.origin] ?? '').trim()
    const destination = String(row[COL.destination] ?? '').trim()
    const pax = Number(row[COL.pax])

    const isValidMonth = /[A-Za-z]/.test(month)
    const isValidStation = /^[A-Za-z]{3}$/.test(origin) && /^[A-Za-z]{3}$/.test(destination)

    if (!month || !isValidMonth || !isValidStation || !Number.isFinite(pax) || pax <= 0) {
      continue
    }

    const routeKey = `${origin}-${destination}`

    if (!routes[routeKey]) {
      routes[routeKey] = {
        origin,
        destination,
        byAircraft: {},
        eu261: {
          distanceKm: null,
          bandEur: null,
          bandSource: 'manual_fallback',
          fallbackOptionsEur: EU261_BANDS,
        },
      }
    }

    routes[routeKey].byAircraft[aircraft.code] = {
      month,
      seats: Number(row[COL.seats]) || 0,
      blh: Number(row[COL.blh]) || 0,
      pax,
      doc: sumDoc(row),
    }
  }
}

for (const route of Object.values(routes)) {
  const from = route.origin
  const to = route.destination
  const distanceName = `${from}-${to}`

  // No explicit distance column was found in workbook; keep fallback metadata ready.
  route.eu261.distanceKm = null
  route.eu261.bandEur = bandFromDistanceKm(route.eu261.distanceKm)
  route.eu261.bandSource = route.eu261.bandEur ? 'excel_distance' : 'manual_fallback'
  route.eu261.routeLabel = distanceName
}

const output = {
  extractedFrom: 'References/COST CALCULATOR.xlsx',
  extractionNotes: {
    eu261DistanceColumnFound: false,
    eu261BandFromExcelAvailable: false,
    sheet2PotentialEu261Value: Number.isFinite(inferredPotentialEu261)
      ? inferredPotentialEu261
      : null,
  },
  aircraftTypes: aircraftSheets.map((item) => item.code),
  eu261Defaults: {
    impactedPaxRatio: 0.35,
    standardBandsEur: EU261_BANDS,
  },
  routes,
}

fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8')
console.log(`Wrote ${Object.keys(routes).length} routes with EU261 metadata to ${outputPath}`)
