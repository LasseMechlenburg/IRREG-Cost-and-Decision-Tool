import { useEffect, useMemo, useState } from 'react'
import './App.css'
import docData from './data/docData.json'

type AircraftType = 'A321' | 'A321N' | 'A339' | 'SUB Narrowbody' | 'SUB Widebody'
type OriginalType = 'A321' | 'A339' | 'A321N'

type ScenarioOption = {
  id: string
  name: string
  legs: AircraftType[]
  forcedSubNarrowbodyOption?: 1 | 2
  forcedSubNarrowbodyOptions?: (1 | 2)[]
}

type RouteLegInput = {
  from: string
  depUtc: string
  arrUtc: string
  to: string
  pax: number | ''
}

type OwnBaseLineInput = {
  enabled: boolean
  aircraft: '' | Exclude<AircraftType, 'SUB Narrowbody' | 'SUB Widebody'>
  leg: RouteLegInput
}

type SubBaseLineInput = {
  enabled: boolean
  leg: RouteLegInput
}

type FormState = {
  originalType: '' | OriginalType
  enableOwnScaFlights: boolean
  ownAvailableA321: number
  ownAvailableA321N: number
  ownAvailableA339: number
  enableSubOption1: boolean
  enableSubOption2: boolean
  enableSubOption3: boolean
  enableAcmiModule: boolean
  enableAdhocModule: boolean
  leg1: RouteLegInput
  leg2: RouteLegInput
  leg3: RouteLegInput
  leg4: RouteLegInput
  ownBaseLines: OwnBaseLineInput[]
  acmiLines: OwnBaseLineInput[]
  adhocLines: OwnBaseLineInput[]
  acmiSafetyMarginPercent: number
  adhocSafetyMarginPercent: number
  subCharter1Lines: SubBaseLineInput[]
  subCharter2Lines: SubBaseLineInput[]
  subCharter3Lines: SubBaseLineInput[]
  subCharter1BlhCostEur: number | ''
  subCharter2BlhCostEur: number | ''
  subCharter3BlhCostEur: number | ''
  eurToDkkRate: number
  subCharter1Seats: number
  subCharter2Seats: number
  subCharter3Seats: number
  subCharter1IncludeHotac: boolean
  subCharter2IncludeHotac: boolean
  subCharter3IncludeHotac: boolean
  subCharter1HotacDkk: number
  subCharter2HotacDkk: number
  subCharter3HotacDkk: number
  subCharter1IncludeCrewPerDiem: boolean
  subCharter2IncludeCrewPerDiem: boolean
  subCharter3IncludeCrewPerDiem: boolean
  subCharter1CrewPerDiemEur: number
  subCharter2CrewPerDiemEur: number
  subCharter3CrewPerDiemEur: number
  ownIncludeScaExtraHotac: boolean
  ownScaExtraHotacDkk: number | ''
  ownIncludeScaExtraCrewPerDiem: boolean
  ownScaExtraCrewPerDiemEur: number | ''
  expectedOverflowCostPerPax: number
  crewCostFcDays: number
  crewCostFcDkkPerDay: number
  crewCostFoDays: number
  crewCostFoDkkPerDay: number
  crewCostCabinDays: number
  crewCostCabinDkkPerDay: number
  crewCostCabinSdDays: number
  crewCostCabinSdDkkPerDay: number
  eu261ImpactedPercent: number
  eu261ManualBandEur: 400 | 600
  npsDetractorPerPaxOnSubDkk: number
}

type ScenarioEu261Selection = {
  legSelections: boolean[]
}

type AircraftRouteData = {
  month: string
  seats: number
  blh: number
  pax: number
  doc: number
  docComponents?: {
    fuel: number
    uptake: number
    saf: number
    ets: number
    cycle: number
    fh: number
    enroute: number
    turnaroundPax: number
    turnaroundAircraft: number
    ghIn: number
    ghOut: number
    handling: number
  }
  acmiExcludedForMinimumPrice?: number
  acmiEligibleDoc?: number
}

type RouteEu261 = {
  distanceKm: number | null
  bandEur: number | null
  bandSource: 'excel_distance' | 'manual_fallback'
  fallbackOptionsEur: number[]
}

type RouteInfo = {
  from: string
  to: string
  byAircraft: Partial<Record<AircraftType, AircraftRouteData>>
  eu261: RouteEu261
}

type BlhLine = {
  label: string
  from: string
  to: string
  blh: number
  source: 'excel' | 'time' | 'fallback'
}

type CostBreakdown = {
  id: string
  name: string
  totalCostDkk: number
  evaluatedTotalDkk: number
  eu261IncludedInEvaluation: boolean
  eu261LegOptions: { index: number; label: string; checked: boolean }[]
  subNarrowbodyOptionLabel: string | null
  seatCapacity: number
  overflowPax: number
  overflowCost: number
  eu261CostEur: number
  eu261ImpactedPax: number
  eu261BandEur: number
  eu261BandSource: 'excel_distance' | 'manual_fallback'
  crewCost: number
  conveniencePenalty: number
  details: string[]
}

type EnabledSubCharterLine = {
  enabled: boolean
  leg: RouteLegInput
  charter: 1 | 2 | 3
  subType: 'SUB Narrowbody' | 'SUB Widebody'
}

type AcmiBreakdown = {
  totalBlh: number
  totalCostDkk: number
  minimumBlhDkk: number
  minimumBlhEur: number
  details: string[]
}

type AdhocBreakdown = {
  totalBlh: number
  totalCostDkk: number
  minimumTotalDkk: number
  minimumTotalEur: number
  minimumBlhDkk: number
  minimumBlhEur: number
  details: string[]
}

type RawRoute = {
  origin: string
  destination: string
  byAircraft: {
    A339?: AircraftRouteData
    A321?: AircraftRouteData
    A321N?: AircraftRouteData
    SUB_NARROWBODY?: AircraftRouteData
  }
  eu261?: RouteEu261
}

type DataShape = {
  eu261Defaults?: {
    impactedPaxRatio?: number
    standardBandsEur?: number[]
  }
  routes: Record<string, RawRoute>
}

const data = docData as DataShape
const OWN_AIRCRAFT_OPTIONS: Exclude<AircraftType, 'SUB Narrowbody' | 'SUB Widebody'>[] = ['A321', 'A321N', 'A339']
const OWN_AIRCRAFT: Exclude<AircraftType, 'SUB Narrowbody' | 'SUB Widebody'>[] = ['A321', 'A321N', 'A339']

const ROUTES: RouteInfo[] = Object.values(data.routes).map((route) => ({
  from: route.origin,
  to: route.destination,
  byAircraft: {
    A321: route.byAircraft.A321,
    A321N: route.byAircraft.A321N,
    A339: route.byAircraft.A339,
    'SUB Narrowbody': route.byAircraft.SUB_NARROWBODY,
  },
  eu261: {
    distanceKm: route.eu261?.distanceKm ?? null,
    bandEur: route.eu261?.bandEur ?? null,
    bandSource: route.eu261?.bandSource ?? 'manual_fallback',
    fallbackOptionsEur: route.eu261?.fallbackOptionsEur ?? [250, 400, 600],
  },
}))

const SCENARIOS: Record<OriginalType, ScenarioOption[]> = {
  A321: [
    { id: 'a321n', name: 'A321N', legs: ['A321N'] },
    { id: 'a339', name: 'A339', legs: ['A339'] },
    { id: 'sub', name: 'SUB Narrowbody', legs: ['SUB Narrowbody'] },
    { id: 'sub-wide', name: 'Subcharter Option 3 (Widebody)', legs: ['SUB Widebody'] },
  ],
  A339: [
    { id: 'a321', name: 'A321', legs: ['A321'] },
    { id: 'a321n', name: 'A321N', legs: ['A321N'] },
    { id: 'sub', name: 'SUB Narrowbody', legs: ['SUB Narrowbody'] },
    { id: 'sub-wide', name: 'Subcharter Option 3 (Widebody)', legs: ['SUB Widebody'] },
    { id: '2xa321', name: '2 x A321', legs: ['A321', 'A321'] },
    { id: '2xa321n', name: '2 x A321N', legs: ['A321N', 'A321N'] },
    { id: 'a321-a321n', name: 'A321 + A321N', legs: ['A321', 'A321N'] },
    { id: 'a321-sub', name: 'A321 + SUB Narrowbody', legs: ['A321', 'SUB Narrowbody'] },
    { id: 'a321n-sub', name: 'A321N + SUB Narrowbody', legs: ['A321N', 'SUB Narrowbody'] },
    {
      id: 'sub12',
      name: 'Subcharter Option 1 + Option 2 (Narrowbody)',
      legs: ['SUB Narrowbody', 'SUB Narrowbody'],
      forcedSubNarrowbodyOptions: [1, 2],
    },
    { id: 'a321-sub-wide', name: 'A321 + Subcharter Option 3 (Widebody)', legs: ['A321', 'SUB Widebody'] },
    { id: 'a321n-sub-wide', name: 'A321N + Subcharter Option 3 (Widebody)', legs: ['A321N', 'SUB Widebody'] },
    { id: 'sub-mix', name: 'SUB Narrowbody + Subcharter Option 3 (Widebody)', legs: ['SUB Narrowbody', 'SUB Widebody'] },
  ],
  A321N: [
    { id: 'a321', name: 'A321', legs: ['A321'] },
    { id: 'a339', name: 'A339', legs: ['A339'] },
    { id: 'sub', name: 'SUB Narrowbody', legs: ['SUB Narrowbody'] },
    { id: 'sub-wide', name: 'Subcharter Option 3 (Widebody)', legs: ['SUB Widebody'] },
  ],
}

const DEFAULTS_BY_AIRCRAFT = OWN_AIRCRAFT.reduce<
  Record<Exclude<AircraftType, 'SUB Narrowbody' | 'SUB Widebody'>, { blh: number; docPerBlh: number; seats: number }>
>(
  (acc, aircraft) => {
    const rows = ROUTES.map((route) => route.byAircraft[aircraft]).filter((item): item is AircraftRouteData => Boolean(item))

    const blhAvg = rows.length ? rows.reduce((sum, item) => sum + item.blh, 0) / rows.length : 0
    const docPerBlhAvg = rows.length
      ? rows.reduce((sum, item) => sum + (item.blh > 0 ? item.doc / item.blh : 0), 0) / rows.length
      : 0
    const seatsAvg = rows.length ? rows.reduce((sum, item) => sum + item.seats, 0) / rows.length : 0

    acc[aircraft] = {
      blh: blhAvg,
      docPerBlh: docPerBlhAvg,
      seats: aircraft === 'A321N' ? 218 : Math.round(seatsAvg),
    }

    return acc
  },
  {
    A321: { blh: 0, docPerBlh: 0, seats: 0 },
    A321N: { blh: 0, docPerBlh: 0, seats: 0 },
    A339: { blh: 0, docPerBlh: 0, seats: 0 },
  },
)

const ACMI_DEFAULT_DOC_PER_BLH_BY_AIRCRAFT = OWN_AIRCRAFT.reduce<
  Record<Exclude<AircraftType, 'SUB Narrowbody' | 'SUB Widebody'>, number>
>(
  (acc, aircraft) => {
    const rows = ROUTES.map((route) => route.byAircraft[aircraft]).filter((item): item is AircraftRouteData => Boolean(item))
    const acmiDocPerBlhAvg = rows.length
      ? rows.reduce((sum, item) => {
          if (item.blh <= 0) return sum
          const eligibleDoc = typeof item.acmiEligibleDoc === 'number' ? item.acmiEligibleDoc : item.doc
          return sum + eligibleDoc / item.blh
        }, 0) / rows.length
      : 0
    acc[aircraft] = acmiDocPerBlhAvg
    return acc
  },
  {
    A321: 0,
    A321N: 0,
    A339: 0,
  },
)

const SUB_NON_MAINT_DEFAULT_DOC_PER_BLH: Record<'SUB Narrowbody' | 'SUB Widebody', number> = {
  'SUB Narrowbody': (() => {
    const rows = ROUTES.map((route) => route.byAircraft['SUB Narrowbody']).filter((item): item is AircraftRouteData => Boolean(item))
    if (!rows.length) return DEFAULTS_BY_AIRCRAFT.A321.docPerBlh
    const total = rows.reduce((sum, row) => {
      if (row.blh <= 0) return sum
      return sum + getDocWithoutMaintenanceReserves(row) / row.blh
    }, 0)
    return total / rows.length
  })(),
  'SUB Widebody': (() => {
    const rows = ROUTES.map((route) => route.byAircraft.A339).filter((item): item is AircraftRouteData => Boolean(item))
    if (!rows.length) return DEFAULTS_BY_AIRCRAFT.A339.docPerBlh
    const total = rows.reduce((sum, row) => {
      if (row.blh <= 0) return sum
      return sum + getDocWithoutMaintenanceReserves(row) / row.blh
    }, 0)
    return total / rows.length
  })(),
}

function emptyLeg(): RouteLegInput {
  return { from: '', depUtc: '', arrUtc: '', to: '', pax: '' }
}

function emptyOwnBaseLine(): OwnBaseLineInput {
  return { enabled: false, aircraft: '', leg: emptyLeg() }
}

function emptySubBaseLine(): SubBaseLineInput {
  return { enabled: false, leg: emptyLeg() }
}

function normalizeStation(input: string): string {
  return input.trim().toUpperCase().slice(0, 3)
}

function normalizeUtcInput(input: string): string {
  const cleaned = input.replace(/[^0-9:]/g, '')
  if (/^\d{4}$/.test(cleaned)) {
    return `${cleaned.slice(0, 2)}:${cleaned.slice(2, 4)}`
  }
  return cleaned
}

function normalizeLegInput(input: RouteLegInput): RouteLegInput {
  return {
    from: normalizeStation(input.from),
    depUtc: normalizeUtcInput(input.depUtc),
    arrUtc: normalizeUtcInput(input.arrUtc),
    to: normalizeStation(input.to),
    pax: typeof input.pax === 'number' ? input.pax : '',
  }
}

function hasStations(leg: RouteLegInput): boolean {
  return normalizeStation(leg.from).length === 3 && normalizeStation(leg.to).length === 3
}

function getRoute(from: string, to: string): RouteInfo | undefined {
  return ROUTES.find((route) => route.from === from && route.to === to)
}

function getLegData(from: string, to: string, aircraft: AircraftType): AircraftRouteData | undefined {
  if (aircraft === 'SUB Widebody') {
    // SUB Widebody uses A339 BLH profile as agreed.
    return getRoute(from, to)?.byAircraft.A339
  }
  if (aircraft === 'SUB Narrowbody') {
    return getRoute(from, to)?.byAircraft['SUB Narrowbody']
  }
  return getRoute(from, to)?.byAircraft[aircraft]
}

function parseUtcTimeToMinutes(value: string): number | null {
  const normalized = normalizeUtcInput(value)
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(normalized)
  if (!match) {
    return null
  }

  return Number(match[1]) * 60 + Number(match[2])
}

function durationHoursFromUtcTimes(departureUtc: string, arrivalUtc: string): number | null {
  const dep = parseUtcTimeToMinutes(departureUtc)
  const arr = parseUtcTimeToMinutes(arrivalUtc)

  if (dep === null || arr === null) {
    return null
  }

  const durationMinutes = arr >= dep ? arr - dep : arr + 24 * 60 - dep
  return durationMinutes / 60
}

function toCurrency(value: number): string {
  return new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency: 'DKK',
    maximumFractionDigits: 0,
  }).format(value)
}

function toEur(value: number): string {
  return new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value)
}

function getDocWithoutMaintenanceReserves(routeData: AircraftRouteData): number {
  const components = routeData.docComponents
  if (!components) {
    return routeData.doc
  }
  return Math.max(0, routeData.doc - components.cycle - components.fh)
}

function toSignedDkkDelta(value: number): string {
  const abs = toCurrency(Math.abs(value))
  if (value > 0) return `+${abs}`
  if (value < 0) return `-${abs}`
  return abs
}

function asBand(value: number): 400 | 600 {
  if (value === 400 || value === 600) {
    return value
  }
  return 400
}

const EU261_BAND_STATION_HINTS: Record<number, string[]> = {
  600: ['HKT', 'KBV', 'SID', 'HRG'],
  400: [
    'PMI',
    'TFS',
    'LPA',
    'FUE',
    'ACE',
    'HER',
    'RHO',
    'CHQ',
    'FNC',
    'KGS',
    'PVK',
    'LCA',
    'AYT',
    'VAR',
    'GZP',
    'MJT',
    'JSI',
    'SPU',
  ],
  250: [],
}

const EU261_STATION_TO_BAND = (() => {
  const byStation: Record<string, 400 | 600> = {}
  ;([400, 600] as const).forEach((band) => {
    const stations = EU261_BAND_STATION_HINTS[band] ?? []
    stations.forEach((station) => {
      byStation[normalizeStation(station)] = band
    })
  })
  return byStation
})()

const EU261_BAND_DETAIL_LINES: Record<number, string[]> = {
  400: ['PMI, TFS, LPA, FUE, ACE, HER, RHO, CHQ, FNC,', 'KGS, PVK, LCA, AYT, VAR, GZP, MJT, JSI, SPU'],
  600: ['HKT, KBV, SID, HRG'],
}

const INITIAL_FORM: FormState = {
  originalType: '',
  enableOwnScaFlights: false,
  ownAvailableA321: 0,
  ownAvailableA321N: 0,
  ownAvailableA339: 0,
  enableSubOption1: false,
  enableSubOption2: false,
  enableSubOption3: false,
  enableAcmiModule: false,
  enableAdhocModule: false,
  leg1: emptyLeg(),
  leg2: emptyLeg(),
  leg3: emptyLeg(),
  leg4: emptyLeg(),
  ownBaseLines: [emptyOwnBaseLine(), emptyOwnBaseLine(), emptyOwnBaseLine(), emptyOwnBaseLine()],
  acmiLines: [emptyOwnBaseLine(), emptyOwnBaseLine(), emptyOwnBaseLine(), emptyOwnBaseLine()],
  adhocLines: [emptyOwnBaseLine(), emptyOwnBaseLine(), emptyOwnBaseLine(), emptyOwnBaseLine()],
  acmiSafetyMarginPercent: 0,
  adhocSafetyMarginPercent: 0,
  subCharter1Lines: [emptySubBaseLine(), emptySubBaseLine()],
  subCharter2Lines: [emptySubBaseLine(), emptySubBaseLine()],
  subCharter3Lines: [emptySubBaseLine(), emptySubBaseLine()],
  subCharter1BlhCostEur: 2200,
  subCharter2BlhCostEur: 3750,
  subCharter3BlhCostEur: 6000,
  eurToDkkRate: 7.45,
  subCharter1Seats: 189,
  subCharter2Seats: 220,
  subCharter3Seats: 373,
  subCharter1IncludeHotac: false,
  subCharter2IncludeHotac: false,
  subCharter3IncludeHotac: false,
  subCharter1HotacDkk: 7000,
  subCharter2HotacDkk: 7000,
  subCharter3HotacDkk: 10000,
  subCharter1IncludeCrewPerDiem: false,
  subCharter2IncludeCrewPerDiem: false,
  subCharter3IncludeCrewPerDiem: false,
  subCharter1CrewPerDiemEur: 1400,
  subCharter2CrewPerDiemEur: 1400,
  subCharter3CrewPerDiemEur: 2000,
  ownIncludeScaExtraHotac: false,
  ownScaExtraHotacDkk: 0,
  ownIncludeScaExtraCrewPerDiem: false,
  ownScaExtraCrewPerDiemEur: 0,
  expectedOverflowCostPerPax: 3000,
  crewCostFcDays: 0,
  crewCostFcDkkPerDay: 25000,
  crewCostFoDays: 0,
  crewCostFoDkkPerDay: 15000,
  crewCostCabinDays: 0,
  crewCostCabinDkkPerDay: 4000,
  crewCostCabinSdDays: 0,
  crewCostCabinSdDkkPerDay: 1200,
  eu261ImpactedPercent: (data.eu261Defaults?.impactedPaxRatio ?? 0.35) * 100,
  eu261ManualBandEur: 400,
  npsDetractorPerPaxOnSubDkk: 0,
}

function App() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [eu261ByScenario, setEu261ByScenario] = useState<Record<string, ScenarioEu261Selection>>({})
  const isToolMode = form.enableAcmiModule || form.enableAdhocModule
  const scenarioOptions = form.originalType ? SCENARIOS[form.originalType] : []
  const selectedOriginalType: OriginalType = form.originalType || 'A321'

  useEffect(() => {
    setEu261ByScenario({})
  }, [form.originalType])

  const activeLegs = useMemo(() => {
    const normalized = [normalizeLegInput(form.leg1), normalizeLegInput(form.leg2), normalizeLegInput(form.leg3), normalizeLegInput(form.leg4)]
    return normalized
      .filter((leg) => hasStations(leg))
      .map((leg) => ({
        ...leg,
        pax: typeof leg.pax === 'number' ? leg.pax : 0,
      }))
  }, [form.leg1, form.leg2, form.leg3, form.leg4])

  useEffect(() => {
    const inferredBand = (() => {
      for (const leg of activeLegs) {
        const toBand = EU261_STATION_TO_BAND[normalizeStation(leg.to)]
        if (toBand) return toBand
        const fromBand = EU261_STATION_TO_BAND[normalizeStation(leg.from)]
        if (fromBand) return fromBand
      }
      return null
    })()

    if (!inferredBand) return
    setForm((prev) => (prev.eu261ManualBandEur === inferredBand ? prev : { ...prev, eu261ManualBandEur: inferredBand }))
  }, [activeLegs])

  const normalizedOwnLines = useMemo(
    () => form.ownBaseLines.map((line) => ({ ...line, leg: normalizeLegInput(line.leg) })),
    [form.ownBaseLines],
  )
  const normalizedAcmiLines = useMemo(
    () => form.acmiLines.map((line) => ({ ...line, leg: normalizeLegInput(line.leg) })),
    [form.acmiLines],
  )
  const normalizedAdhocLines = useMemo(
    () => form.adhocLines.map((line) => ({ ...line, leg: normalizeLegInput(line.leg) })),
    [form.adhocLines],
  )
  const normalizedSub1Lines = useMemo(
    () => form.subCharter1Lines.map((line) => ({ ...line, leg: normalizeLegInput(line.leg) })),
    [form.subCharter1Lines],
  )
  const normalizedSub2Lines = useMemo(
    () => form.subCharter2Lines.map((line) => ({ ...line, leg: normalizeLegInput(line.leg) })),
    [form.subCharter2Lines],
  )
  const normalizedSub3Lines = useMemo(
    () => form.subCharter3Lines.map((line) => ({ ...line, leg: normalizeLegInput(line.leg) })),
    [form.subCharter3Lines],
  )

  const enabledOwnLines = useMemo(
    () => normalizedOwnLines.filter((line) => line.enabled && hasStations(line.leg)),
    [normalizedOwnLines],
  )
  const enabledAcmiLines = useMemo(
    () => normalizedAcmiLines.filter((line) => line.enabled && hasStations(line.leg)),
    [normalizedAcmiLines],
  )
  const enabledAdhocLines = useMemo(
    () => normalizedAdhocLines.filter((line) => line.enabled && hasStations(line.leg)),
    [normalizedAdhocLines],
  )
  const enabledSubLines = useMemo(
    () => [
      ...normalizedSub1Lines
        .filter((line) => line.enabled && hasStations(line.leg))
        .map((line) => ({ ...line, charter: 1 as const, subType: 'SUB Narrowbody' as const })),
      ...normalizedSub2Lines
        .filter((line) => line.enabled && hasStations(line.leg))
        .map((line) => ({ ...line, charter: 2 as const, subType: 'SUB Narrowbody' as const })),
      ...normalizedSub3Lines
        .filter((line) => line.enabled && hasStations(line.leg))
        .map((line) => ({ ...line, charter: 3 as const, subType: 'SUB Widebody' as const })),
    ],
    [normalizedSub1Lines, normalizedSub2Lines, normalizedSub3Lines],
  )
  const availableScenarioOptions = useMemo(() => {
    const enabledNarrowOptions: (1 | 2)[] = []
    if (form.enableSubOption1) enabledNarrowOptions.push(1)
    if (form.enableSubOption2) enabledNarrowOptions.push(2)

    return scenarioOptions.flatMap((option) => {
      const hasNarrow = option.legs.includes('SUB Narrowbody')
      const hasWide = option.legs.includes('SUB Widebody')
      const hasOwn = option.legs.some((leg) => leg !== 'SUB Narrowbody' && leg !== 'SUB Widebody')
      const ownLegDemand = option.legs.reduce(
        (acc, leg) => {
          if (leg === 'A321') acc.A321 += 1
          if (leg === 'A321N') acc.A321N += 1
          if (leg === 'A339') acc.A339 += 1
          return acc
        },
        { A321: 0, A321N: 0, A339: 0 },
      )

      if (hasWide && !form.enableSubOption3) return []
      if (hasOwn && !form.enableOwnScaFlights) return []
      if (ownLegDemand.A321 > form.ownAvailableA321) return []
      if (ownLegDemand.A321N > form.ownAvailableA321N) return []
      if (ownLegDemand.A339 > form.ownAvailableA339) return []
      if (hasNarrow && enabledNarrowOptions.length === 0) return []

      if (option.forcedSubNarrowbodyOptions?.length) {
        const requiredEnabled = option.forcedSubNarrowbodyOptions.every((opt) => enabledNarrowOptions.includes(opt))
        return requiredEnabled ? [option] : []
      }

      if (!hasNarrow) return [option]

      return enabledNarrowOptions.map((narrowOption) => ({
        ...option,
        id: `${option.id}-nb${narrowOption}`,
        name: `${option.name} (Option ${narrowOption})`,
        forcedSubNarrowbodyOption: narrowOption,
      }))
    })
  }, [
    form.enableOwnScaFlights,
    form.ownAvailableA321,
    form.ownAvailableA321N,
    form.ownAvailableA339,
    form.enableSubOption1,
    form.enableSubOption2,
    form.enableSubOption3,
    scenarioOptions,
  ])

  const firstOrigin = activeLegs[0]?.from ?? ''
  const finalDestination = activeLegs[activeLegs.length - 1]?.to ?? ''

  const primaryRouteInfo = firstOrigin && finalDestination ? getRoute(firstOrigin, finalDestination) : undefined
  const eu261Bands = primaryRouteInfo?.eu261.fallbackOptionsEur?.length
    ? primaryRouteInfo.eu261.fallbackOptionsEur
    : data.eu261Defaults?.standardBandsEur ?? [250, 400, 600]
  const eu261SelectableBands = eu261Bands.filter((band) => band === 400 || band === 600)
  const blhPreview = useMemo<BlhLine[]>(() => {
    if (!form.originalType) {
      return []
    }

    return activeLegs.map((leg, idx) => {
      const excelBlh = getLegData(leg.from, leg.to, selectedOriginalType)?.blh
      const timeBlh = durationHoursFromUtcTimes(leg.depUtc, leg.arrUtc)

      if (excelBlh && excelBlh > 0) {
        return { label: `Leg ${idx + 1}`, from: leg.from, to: leg.to, blh: excelBlh, source: 'excel' }
      }

      if (timeBlh && timeBlh > 0) {
        return { label: `Leg ${idx + 1}`, from: leg.from, to: leg.to, blh: timeBlh, source: 'time' }
      }

      const fallback = DEFAULTS_BY_AIRCRAFT[selectedOriginalType].blh
      return { label: `Leg ${idx + 1}`, from: leg.from, to: leg.to, blh: fallback, source: 'fallback' }
    })
  }, [activeLegs, form.originalType, selectedOriginalType])

  const results = useMemo<CostBreakdown[]>(() => {
    if (!form.originalType) {
      return []
    }
    const sub1BlhCostEur = typeof form.subCharter1BlhCostEur === 'number' ? form.subCharter1BlhCostEur : 0
    const sub2BlhCostEur = typeof form.subCharter2BlhCostEur === 'number' ? form.subCharter2BlhCostEur : 0
    const sub3BlhCostEur = typeof form.subCharter3BlhCostEur === 'number' ? form.subCharter3BlhCostEur : 0
    const ownScaExtraHotacDkk = typeof form.ownScaExtraHotacDkk === 'number' ? form.ownScaExtraHotacDkk : 0
    const ownScaExtraCrewPerDiemEur =
      typeof form.ownScaExtraCrewPerDiemEur === 'number' ? form.ownScaExtraCrewPerDiemEur : 0
    const originalSampleRoute =
      firstOrigin && finalDestination ? getLegData(firstOrigin, finalDestination, selectedOriginalType) : undefined
    const originalDocPerBlh = originalSampleRoute
      ? (originalSampleRoute.blh > 0 ? originalSampleRoute.doc / originalSampleRoute.blh : 0)
      : DEFAULTS_BY_AIRCRAFT[selectedOriginalType].docPerBlh
    const originalMainBlhTotal = activeLegs.reduce((sum, leg) => {
      const excelBlh = getLegData(leg.from, leg.to, selectedOriginalType)?.blh
      const timeBlh = durationHoursFromUtcTimes(leg.depUtc, leg.arrUtc)
      if (excelBlh && excelBlh > 0) return sum + excelBlh
      if (timeBlh && timeBlh > 0) return sum + timeBlh
      return sum + DEFAULTS_BY_AIRCRAFT[selectedOriginalType].blh
    }, 0)

    return availableScenarioOptions
      .map((option): CostBreakdown => {
        const details: string[] = []
        const subNarrowbodyOptionsUsed = new Set<1 | 2>()
        const usedSubAddOnCounts = { opt1: 0, opt2: 0, opt3: 0 }
        let operatingCost = 0
        let totalSeats = 0
        let ownSeatCapacity = 0
        let subSeatCapacity = 0
        const subLegCount = option.legs.filter((x) => x === 'SUB Narrowbody' || x === 'SUB Widebody').length
        const eu261Selection = eu261ByScenario[option.id] ?? { legSelections: option.legs.map(() => false) }
        const scenarioLegInfos: { index: number; isSub: boolean; seats: number; includeEu261: boolean; label: string }[] = []
        const eu261LegOptions: { index: number; label: string; checked: boolean }[] = []
        const eu261IncludedInEvaluation = eu261Selection.legSelections.some(Boolean)
        let hasOwnAircraftLeg = false

        const ownTypeCounters: Record<Exclude<AircraftType, 'SUB Narrowbody' | 'SUB Widebody'>, number> = {
          A321: 0,
          A321N: 0,
          A339: 0,
        }
        const ownScenarioCounters: Record<Exclude<AircraftType, 'SUB Narrowbody' | 'SUB Widebody'>, number> = {
          A321: 0,
          A321N: 0,
          A339: 0,
        }
        const ownLinesByAircraft: Record<
          Exclude<AircraftType, 'SUB Narrowbody' | 'SUB Widebody'>,
          typeof enabledOwnLines
        > = {
          A321: enabledOwnLines.filter((candidate) => candidate.aircraft === 'A321'),
          A321N: enabledOwnLines.filter((candidate) => candidate.aircraft === 'A321N'),
          A339: enabledOwnLines.filter((candidate) => candidate.aircraft === 'A339'),
        }
        const subWideCounter = { count: 0 }
        const subNarrowCounters: Record<1 | 2, number> = { 1: 0, 2: 0 }
        let subNarrowLegCounter = 0
        const subNarrowLinesByOption: Record<1 | 2, EnabledSubCharterLine[]> = {
          1: enabledSubLines.filter((candidate) => candidate.subType === 'SUB Narrowbody' && candidate.charter === 1),
          2: enabledSubLines.filter((candidate) => candidate.subType === 'SUB Narrowbody' && candidate.charter === 2),
        }
        const subWideLines = enabledSubLines.filter((candidate) => candidate.subType === 'SUB Widebody')
        const subScenarioLegCountByType: Record<'SUB Narrowbody' | 'SUB Widebody', number> = {
          'SUB Narrowbody': option.legs.filter((leg) => leg === 'SUB Narrowbody').length,
          'SUB Widebody': option.legs.filter((leg) => leg === 'SUB Widebody').length,
        }
        const ownScenarioLegCountByAircraft: Record<Exclude<AircraftType, 'SUB Narrowbody' | 'SUB Widebody'>, number> = {
          A321: option.legs.filter((leg) => leg === 'A321').length,
          A321N: option.legs.filter((leg) => leg === 'A321N').length,
          A339: option.legs.filter((leg) => leg === 'A339').length,
        }

        option.legs.forEach((defaultAircraft, index) => {
          const defaultIsSub = defaultAircraft === 'SUB Narrowbody' || defaultAircraft === 'SUB Widebody'
          const currentSubType = defaultIsSub ? (defaultAircraft as 'SUB Narrowbody' | 'SUB Widebody') : null
          let currentOwnTypeLegIndex = -1
          const currentSubTypeLegIndex =
            currentSubType === 'SUB Narrowbody'
              ? subNarrowLegCounter
              : currentSubType === 'SUB Widebody'
                ? subWideCounter.count
                : -1
          const line = (() => {
            if (defaultIsSub) {
              if (defaultAircraft === 'SUB Narrowbody') {
                const forcedOptionByLeg = option.forcedSubNarrowbodyOptions?.[subNarrowLegCounter]
                const narrowOption = forcedOptionByLeg ?? option.forcedSubNarrowbodyOption ?? 1
                subNarrowLegCounter += 1
                const narrowIndex = subNarrowCounters[narrowOption]
                const narrowMatch = subNarrowLinesByOption[narrowOption][narrowIndex]
                if (narrowMatch) {
                  subNarrowCounters[narrowOption] += 1
                  return narrowMatch
                }
                subNarrowCounters[narrowOption] += 1
                return undefined
              }
              const wideIndex = subWideCounter.count
              const wideMatch = subWideLines[wideIndex]
              if (wideMatch) {
                subWideCounter.count += 1
                return wideMatch
              }
              subWideCounter.count += 1
              return undefined
            }
            const ownAircraft = defaultAircraft as Exclude<AircraftType, 'SUB Narrowbody' | 'SUB Widebody'>
            currentOwnTypeLegIndex = ownScenarioCounters[ownAircraft]
            ownScenarioCounters[ownAircraft] += 1
            const typedIndex = ownTypeCounters[ownAircraft]
            const typedMatch = ownLinesByAircraft[ownAircraft][typedIndex]
            if (typedMatch) {
              ownTypeCounters[ownAircraft] += 1
              return typedMatch
            }
            return undefined
          })()
          const subLine = defaultIsSub ? (line as EnabledSubCharterLine | undefined) : undefined

          const selectedAircraft = defaultIsSub
            ? (line && 'subType' in line ? line.subType : defaultAircraft)
            : ((line && 'aircraft' in line ? line.aircraft : '') || defaultAircraft)

          const aircraft = selectedAircraft as AircraftType
          const isSub = aircraft === 'SUB Narrowbody' || aircraft === 'SUB Widebody'
          if (!isSub) {
            hasOwnAircraftLeg = true
          }

          const fallbackDefaults = !isSub ? DEFAULTS_BY_AIRCRAFT[aircraft] : undefined
          const forcedOptionByLeg =
            aircraft === 'SUB Narrowbody' && currentSubTypeLegIndex >= 0
              ? option.forcedSubNarrowbodyOptions?.[currentSubTypeLegIndex]
              : undefined
          const subFallbackBlh =
            aircraft === 'SUB Widebody' ? DEFAULTS_BY_AIRCRAFT.A339.blh : DEFAULTS_BY_AIRCRAFT.A321.blh
          const fallbackBlh = isSub ? subFallbackBlh : (fallbackDefaults?.blh ?? 0)
          const effectiveNarrowOption: 1 | 2 =
            subLine?.charter === 2 ? 2 : forcedOptionByLeg ?? (option.forcedSubNarrowbodyOption === 2 ? 2 : 1)
          const subSeats =
            aircraft === 'SUB Widebody' ? form.subCharter3Seats : effectiveNarrowOption === 2 ? form.subCharter2Seats : form.subCharter1Seats
          const seats = isSub ? subSeats : (fallbackDefaults?.seats ?? 0)
          totalSeats += seats
          if (isSub) {
            subSeatCapacity += seats
          } else {
            ownSeatCapacity += seats
          }
          const eu261LegLabel =
            aircraft === 'SUB Narrowbody'
              ? `Subcharter Option ${effectiveNarrowOption} (Narrowbody)`
              : aircraft === 'SUB Widebody'
                ? 'Subcharter Option 3 (Widebody)'
                : `${aircraft} ${index + 1}`
          const includeEu261ForLeg = Boolean(eu261Selection.legSelections[index])
          scenarioLegInfos.push({
            index,
            isSub,
            seats,
            includeEu261: includeEu261ForLeg,
            label: eu261LegLabel,
          })
          eu261LegOptions.push({ index, label: eu261LegLabel, checked: includeEu261ForLeg })

          const legBlhTotal = activeLegs.reduce((sum, leg) => {
            const excelBlh = getLegData(leg.from, leg.to, aircraft)?.blh
            const timeBlh = durationHoursFromUtcTimes(leg.depUtc, leg.arrUtc)
            if (excelBlh && excelBlh > 0) {
              return sum + excelBlh
            }
            if (timeBlh && timeBlh > 0) {
              return sum + timeBlh
            }
            return sum + fallbackBlh
          }, 0)

          let positioningBlhOneWay = line ? durationHoursFromUtcTimes(line.leg.depUtc, line.leg.arrUtc) ?? 0 : 0
          if (currentSubType && currentSubTypeLegIndex === 0) {
            const extraLines =
              currentSubType === 'SUB Narrowbody'
                ? subNarrowLinesByOption[
                    option.forcedSubNarrowbodyOptions?.[0] ?? option.forcedSubNarrowbodyOption ?? 1
                  ].slice(subScenarioLegCountByType[currentSubType])
                : subWideLines.slice(subScenarioLegCountByType[currentSubType])
            const extraPositioningBlh = extraLines.reduce(
              (sum, extraLine) => sum + (durationHoursFromUtcTimes(extraLine.leg.depUtc, extraLine.leg.arrUtc) ?? 0),
              0,
            )
            positioningBlhOneWay += extraPositioningBlh
          } else if (!isSub && currentOwnTypeLegIndex === 0) {
            const ownAircraft = aircraft as Exclude<AircraftType, 'SUB Narrowbody' | 'SUB Widebody'>
            const extraOwnLines = ownLinesByAircraft[ownAircraft].slice(ownScenarioLegCountByAircraft[ownAircraft])
            const extraOwnPositioningBlh = extraOwnLines.reduce(
              (sum, extraLine) => sum + (durationHoursFromUtcTimes(extraLine.leg.depUtc, extraLine.leg.arrUtc) ?? 0),
              0,
            )
            positioningBlhOneWay += extraOwnPositioningBlh
          }
          const totalBlh = legBlhTotal + positioningBlhOneWay * 2

          let cost = 0
          if (isSub) {
            if (aircraft === 'SUB Narrowbody') {
              subNarrowbodyOptionsUsed.add(effectiveNarrowOption)
            }
            const subBlhCostEur =
              aircraft === 'SUB Widebody'
                ? sub3BlhCostEur
                : effectiveNarrowOption === 2
                  ? sub2BlhCostEur
                  : sub1BlhCostEur
            const subRate = form.eurToDkkRate
            const charterCostDkk = totalBlh * subBlhCostEur * subRate
            const subNonMaintDocCostDkk = activeLegs.reduce((sum, leg) => {
              const routeData = getLegData(leg.from, leg.to, aircraft)
              const excelBlh = routeData?.blh
              const timeBlh = durationHoursFromUtcTimes(leg.depUtc, leg.arrUtc)
              const legHours =
                excelBlh && excelBlh > 0 ? excelBlh : timeBlh && timeBlh > 0 ? timeBlh : fallbackBlh
              const nonMaintPerBlh =
                routeData && routeData.blh > 0
                  ? getDocWithoutMaintenanceReserves(routeData) / routeData.blh
                  : SUB_NON_MAINT_DEFAULT_DOC_PER_BLH[aircraft]
              return sum + legHours * nonMaintPerBlh
            }, 0)
            const positioningNonMaintDocCostDkk = positioningBlhOneWay * 2 * SUB_NON_MAINT_DEFAULT_DOC_PER_BLH[aircraft]
            cost = charterCostDkk + subNonMaintDocCostDkk + positioningNonMaintDocCostDkk
            if (aircraft === 'SUB Widebody') {
              usedSubAddOnCounts.opt3 += 1
            } else if (effectiveNarrowOption === 2) {
              usedSubAddOnCounts.opt2 += 1
            } else {
              usedSubAddOnCounts.opt1 += 1
            }
          } else {
            const sampleRoute =
              firstOrigin && finalDestination ? getLegData(firstOrigin, finalDestination, aircraft) : undefined
            const docPerBlh = sampleRoute
              ? (sampleRoute.blh > 0 ? sampleRoute.doc / sampleRoute.blh : 0)
              : (fallbackDefaults?.docPerBlh ?? 0)
            const mainCost = legBlhTotal * docPerBlh
            const positioningCost = positioningBlhOneWay * 2 * docPerBlh
            cost = mainCost + positioningCost
          }

          operatingCost += cost
          if (isSub) {
            const sourceLabel =
              aircraft === 'SUB Widebody'
                ? 'Subcharter Option 3'
                : effectiveNarrowOption === 2
                  ? 'Subcharter Option 2'
                  : 'Subcharter Option 1'
            details.push(`${sourceLabel} seats in use: ${subSeats}`)
            details.push(`${sourceLabel} includes fuel/enroute/etc and excludes maintenance reserves.`)
          }
          details.push(
            `${aircraft} ${index + 1}: main BLH ${legBlhTotal.toFixed(2)} + positioning ${positioningBlhOneWay.toFixed(2)}*2 = ${totalBlh.toFixed(2)} -> ${toCurrency(cost)}`,
          )
        })

        const requestedPaxByRouteLeg = activeLegs.map((leg, legIdx) => ({
          index: legIdx,
          pax: typeof leg.pax === 'number' ? leg.pax : 0,
        }))
        const scenarioRequestedPax = requestedPaxByRouteLeg.reduce((sum, leg) => sum + leg.pax, 0)
        const overflowByRouteLeg = requestedPaxByRouteLeg.map((leg) => ({
          index: leg.index,
          overflow: Math.max(0, leg.pax - totalSeats),
        }))
        const overflowPax = overflowByRouteLeg.reduce((sum, leg) => sum + leg.overflow, 0)
        const overflowCost = overflowPax * form.expectedOverflowCostPerPax
        const subAddOnCostDkk = (['opt1', 'opt2', 'opt3'] as const).reduce((sum, opt) => {
          const useCount = usedSubAddOnCounts[opt]
          if (useCount === 0) return sum
          const hotacEnabled =
            opt === 'opt3'
              ? form.subCharter3IncludeHotac
              : opt === 'opt2'
                ? form.subCharter2IncludeHotac
                : form.subCharter1IncludeHotac
          const hotacDkk =
            opt === 'opt3' ? form.subCharter3HotacDkk : opt === 'opt2' ? form.subCharter2HotacDkk : form.subCharter1HotacDkk

          const perDiemEnabled =
            opt === 'opt3'
              ? form.subCharter3IncludeCrewPerDiem
              : opt === 'opt2'
                ? form.subCharter2IncludeCrewPerDiem
                : form.subCharter1IncludeCrewPerDiem
          const perDiemEur =
            opt === 'opt3'
              ? form.subCharter3CrewPerDiemEur
              : opt === 'opt2'
                ? form.subCharter2CrewPerDiemEur
                : form.subCharter1CrewPerDiemEur

          return sum + useCount * ((hotacEnabled ? hotacDkk : 0) + (perDiemEnabled ? perDiemEur * form.eurToDkkRate : 0))
        }, 0)

        const eu261ImpactRatio = Math.max(0, form.eu261ImpactedPercent) / 100
        const totalCarriedPax = requestedPaxByRouteLeg.reduce((sum, leg) => sum + Math.max(0, Math.min(leg.pax, totalSeats)), 0)
        const unaffectedLegs = scenarioLegInfos.filter((leg) => !leg.includeEu261)
        const affectedLegs = scenarioLegInfos.filter((leg) => leg.includeEu261)
        const allocationOrder = [...unaffectedLegs, ...affectedLegs]
        const carriedByLeg = new Map<number, number>()
        let remainingPax = totalCarriedPax
        allocationOrder.forEach((leg) => {
          const carried = Math.min(leg.seats, remainingPax)
          carriedByLeg.set(leg.index, carried)
          remainingPax -= carried
        })

        const impactedByLeg = new Map<number, number>()
        scenarioLegInfos.forEach((leg) => {
          const carried = carriedByLeg.get(leg.index) ?? 0
          const impacted = leg.includeEu261 ? Math.ceil(carried * eu261ImpactRatio) : 0
          impactedByLeg.set(leg.index, impacted)
        })
        const eu261ImpactedPax = scenarioLegInfos.reduce((sum, leg) => sum + (impactedByLeg.get(leg.index) ?? 0), 0)
        const excelBand = primaryRouteInfo?.eu261.bandEur
        const eu261BandEur = excelBand ?? form.eu261ManualBandEur
        const eu261BandSource: 'excel_distance' | 'manual_fallback' =
          excelBand !== null && excelBand !== undefined ? 'excel_distance' : 'manual_fallback'
        const eu261CostEur = eu261ImpactedPax * eu261BandEur
        const eu261CostDkk = eu261CostEur * form.eurToDkkRate

        const crewCost =
          hasOwnAircraftLeg
            ? form.crewCostFcDays * form.crewCostFcDkkPerDay +
              form.crewCostFoDays * form.crewCostFoDkkPerDay +
              form.crewCostCabinDays * form.crewCostCabinDkkPerDay +
              form.crewCostCabinSdDays * form.crewCostCabinSdDkkPerDay
            : 0
        const ownScaExtrasCostDkk =
          hasOwnAircraftLeg
            ? (form.ownIncludeScaExtraHotac ? ownScaExtraHotacDkk : 0) +
              (form.ownIncludeScaExtraCrewPerDiem ? ownScaExtraCrewPerDiemEur * form.eurToDkkRate : 0)
            : 0
        const subPaxEstimate = Math.min(scenarioRequestedPax, totalSeats) * (subLegCount / Math.max(option.legs.length, 1))
        const conveniencePenalty = Math.round(subPaxEstimate) * form.npsDetractorPerPaxOnSubDkk
        const baselineCreditDkk = originalMainBlhTotal * originalDocPerBlh
        const totalCostDkk =
          operatingCost - baselineCreditDkk + overflowCost + crewCost + ownScaExtrasCostDkk + conveniencePenalty + subAddOnCostDkk
        const evaluatedTotalDkk = totalCostDkk + eu261CostDkk

        if (crewCost > 0) details.push(`Crew cost (once per solution): ${toCurrency(crewCost)}`)
        if (ownScaExtrasCostDkk > 0) {
          details.push(`SCA extra own add-ons (HOTAC/Crew per diem): ${toCurrency(ownScaExtrasCostDkk)}.`)
        }
        details.push(
          `Baseline credit (once): original ${selectedOriginalType} ${originalMainBlhTotal.toFixed(2)} BLH * ${originalDocPerBlh.toFixed(2)} DKK/BLH = ${toCurrency(baselineCreditDkk)}.`,
        )
        if (eu261CostEur > 0) {
          const sourceParts = scenarioLegInfos
            .filter((leg) => leg.includeEu261)
            .map((leg) => `${leg.label} ${(impactedByLeg.get(leg.index) ?? 0)} pax`)
          details.push(
            `EU261: ceil(${scenarioRequestedPax} * ${(eu261ImpactRatio * 100).toFixed(0)}%) = ${eu261ImpactedPax} pax (${sourceParts.join(' + ')}) * ${eu261BandEur} EUR = ${toEur(eu261CostEur)} (${eu261BandSource})`,
          )
          const carriedParts = scenarioLegInfos.map(
            (leg) => `${leg.label} carried ${carriedByLeg.get(leg.index) ?? 0}`,
          )
          details.push(`EU261 load split: ${carriedParts.join(', ')}. Non-affected capacity fills first.`)
        } else {
          details.push('EU261: not included for this solution (checkbox not selected)')
        }
        if (subLegCount > 0) {
          details.push(
            `NPS detractor: ${Math.round(subPaxEstimate)} sub-pax * ${toCurrency(form.npsDetractorPerPaxOnSubDkk)} = ${toCurrency(conveniencePenalty)}`,
          )
          if (subAddOnCostDkk > 0) {
            if (usedSubAddOnCounts.opt1 > 0) {
              details.push(`Sub add-ons Option 1 x${usedSubAddOnCounts.opt1}: included in total.`)
            }
            if (usedSubAddOnCounts.opt2 > 0) {
              details.push(`Sub add-ons Option 2 x${usedSubAddOnCounts.opt2}: included in total.`)
            }
            if (usedSubAddOnCounts.opt3 > 0) {
              details.push(`Sub add-ons Option 3 x${usedSubAddOnCounts.opt3}: included in total.`)
            }
            details.push(`Sub add-ons (HOTAC/Crew per diem): ${toCurrency(subAddOnCostDkk)}.`)
          }
        }
        if (overflowPax > 0) {
          const overflowLegDetail = overflowByRouteLeg
            .filter((leg) => leg.overflow > 0)
            .map((leg) => `Leg ${leg.index + 1}: ${leg.overflow}`)
            .join(', ')
          details.push(`Overflow by route leg: ${overflowLegDetail}`)
        }
        details.push(
          `SUB params: Opt1 ${sub1BlhCostEur.toFixed(2)} EUR/BLH, seats ${form.subCharter1Seats}. Opt2 ${sub2BlhCostEur.toFixed(2)} EUR/BLH, seats ${form.subCharter2Seats}. Opt3 ${sub3BlhCostEur.toFixed(2)} EUR/BLH, seats ${form.subCharter3Seats}. Shared rate ${form.eurToDkkRate.toFixed(2)} DKK/EUR.`,
        )
        const subNarrowbodyOptionLabel =
          subNarrowbodyOptionsUsed.size === 0
            ? null
            : Array.from(subNarrowbodyOptionsUsed)
                .sort((a, b) => a - b)
                .map((opt) => `Option ${opt}`)
                .join(' + ')

        return {
          id: option.id,
          name: option.name,
          totalCostDkk,
          evaluatedTotalDkk,
          eu261IncludedInEvaluation,
          eu261LegOptions,
          subNarrowbodyOptionLabel,
          seatCapacity: totalSeats,
          overflowPax,
          overflowCost,
          eu261CostEur,
          eu261ImpactedPax,
          eu261BandEur,
          eu261BandSource,
          crewCost,
          conveniencePenalty,
          details,
        }
      })
      .sort((a, b) => a.evaluatedTotalDkk - b.evaluatedTotalDkk)
  }, [
    activeLegs,
    enabledOwnLines,
    enabledSubLines,
    eu261ByScenario,
    finalDestination,
    firstOrigin,
    form,
    primaryRouteInfo,
    availableScenarioOptions,
  ])

  const cheapest = results[0]

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function updateLeg(key: 'leg1' | 'leg2' | 'leg3' | 'leg4', field: keyof RouteLegInput, value: string | number | '') {
    setForm((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]:
          field === 'from' || field === 'to'
            ? normalizeStation(String(value))
            : field === 'pax'
              ? value === '' ? '' : Number(value) || 0
              : normalizeUtcInput(String(value)),
      },
    }))
  }

  function updateOwnBaseLine(index: number, updates: { enabled?: boolean; aircraft?: '' | Exclude<AircraftType, 'SUB Narrowbody' | 'SUB Widebody'>; leg?: Partial<RouteLegInput> }) {
    setForm((prev) => {
      const next = [...prev.ownBaseLines]
      const current = next[index]
      const nextLeg = updates.leg ? { ...current.leg, ...updates.leg } : current.leg

      next[index] = {
        ...current,
        ...updates,
        leg: {
          from: normalizeStation(nextLeg.from),
          depUtc: normalizeUtcInput(nextLeg.depUtc),
          arrUtc: normalizeUtcInput(nextLeg.arrUtc),
          to: normalizeStation(nextLeg.to),
          pax: typeof nextLeg.pax === 'number' ? nextLeg.pax : '',
        },
      }

      return { ...prev, ownBaseLines: next }
    })
  }

  function updateAcmiLine(index: number, updates: { enabled?: boolean; aircraft?: '' | Exclude<AircraftType, 'SUB Narrowbody' | 'SUB Widebody'>; leg?: Partial<RouteLegInput> }) {
    setForm((prev) => {
      const next = [...prev.acmiLines]
      const current = next[index]
      const nextLeg = updates.leg ? { ...current.leg, ...updates.leg } : current.leg

      next[index] = {
        ...current,
        ...updates,
        leg: {
          from: normalizeStation(nextLeg.from),
          depUtc: normalizeUtcInput(nextLeg.depUtc),
          arrUtc: normalizeUtcInput(nextLeg.arrUtc),
          to: normalizeStation(nextLeg.to),
          pax: typeof nextLeg.pax === 'number' ? nextLeg.pax : '',
        },
      }

      return { ...prev, acmiLines: next }
    })
  }

  function updateAdhocLine(index: number, updates: { enabled?: boolean; aircraft?: '' | Exclude<AircraftType, 'SUB Narrowbody' | 'SUB Widebody'>; leg?: Partial<RouteLegInput> }) {
    setForm((prev) => {
      const next = [...prev.adhocLines]
      const current = next[index]
      const nextLeg = updates.leg ? { ...current.leg, ...updates.leg } : current.leg

      next[index] = {
        ...current,
        ...updates,
        leg: {
          from: normalizeStation(nextLeg.from),
          depUtc: normalizeUtcInput(nextLeg.depUtc),
          arrUtc: normalizeUtcInput(nextLeg.arrUtc),
          to: normalizeStation(nextLeg.to),
          pax: typeof nextLeg.pax === 'number' ? nextLeg.pax : '',
        },
      }

      return { ...prev, adhocLines: next }
    })
  }

  function updateSubBaseLine(type: 'sub1' | 'sub2' | 'sub3', index: number, updates: { enabled?: boolean; leg?: Partial<RouteLegInput> }) {
    setForm((prev) => {
      const key = type === 'sub1' ? 'subCharter1Lines' : type === 'sub2' ? 'subCharter2Lines' : 'subCharter3Lines'
      const next = [...prev[key]]
      const current = next[index]
      const nextLeg = updates.leg ? { ...current.leg, ...updates.leg } : current.leg

      next[index] = {
        ...current,
        ...updates,
        leg: {
          from: normalizeStation(nextLeg.from),
          depUtc: normalizeUtcInput(nextLeg.depUtc),
          arrUtc: normalizeUtcInput(nextLeg.arrUtc),
          to: normalizeStation(nextLeg.to),
          pax: typeof nextLeg.pax === 'number' ? nextLeg.pax : '',
        },
      }

      return { ...prev, [key]: next }
    })
  }

  function updateScenarioEu261LegSelection(
    scenarioId: string,
    legIndex: number,
    checked: boolean,
    defaults: ScenarioEu261Selection,
  ) {
    setEu261ByScenario((prev) => {
      const current = prev[scenarioId] ?? defaults
      const nextLegSelections = [...current.legSelections]
      while (nextLegSelections.length <= legIndex) {
        nextLegSelections.push(false)
      }
      nextLegSelections[legIndex] = checked
      return {
        ...prev,
        [scenarioId]: {
          legSelections: nextLegSelections,
        },
      }
    })
  }

  function resetAll() {
    setForm(INITIAL_FORM)
    setEu261ByScenario({})
  }

  const acmiBreakdown = useMemo<AcmiBreakdown | null>(() => {
    if (!form.enableAcmiModule) return null
    const lines = enabledAcmiLines
    if (lines.length === 0) return null

    const ownScaExtraHotacDkk = typeof form.ownScaExtraHotacDkk === 'number' ? form.ownScaExtraHotacDkk : 0
    const ownScaExtraCrewPerDiemEur =
      typeof form.ownScaExtraCrewPerDiemEur === 'number' ? form.ownScaExtraCrewPerDiemEur : 0

    let totalBlh = 0
    let operatingCost = 0
    const details: string[] = []

    lines.forEach((line, index) => {
      const aircraft = (line.aircraft || selectedOriginalType) as Exclude<AircraftType, 'SUB Narrowbody' | 'SUB Widebody'>
      const fallback = DEFAULTS_BY_AIRCRAFT[aircraft]
      const routeData = getLegData(line.leg.from, line.leg.to, aircraft)
      const blh = routeData?.blh ?? durationHoursFromUtcTimes(line.leg.depUtc, line.leg.arrUtc) ?? fallback.blh
      const acmiEligibleDoc =
        routeData && typeof routeData.acmiEligibleDoc === 'number' ? routeData.acmiEligibleDoc : routeData?.doc ?? 0
      const docPerBlh =
        routeData && routeData.blh > 0 ? acmiEligibleDoc / routeData.blh : ACMI_DEFAULT_DOC_PER_BLH_BY_AIRCRAFT[aircraft]
      const lineCost = blh * docPerBlh
      const excludedPerBlh =
        routeData && routeData.blh > 0 && typeof routeData.acmiExcludedForMinimumPrice === 'number'
          ? routeData.acmiExcludedForMinimumPrice / routeData.blh
          : 0

      totalBlh += blh
      operatingCost += lineCost
      details.push(`ACMI leg ${index + 1} (${aircraft}): ${blh.toFixed(2)} BLH * ${docPerBlh.toFixed(2)} = ${toCurrency(lineCost)}`)
      if (!routeData) {
        details.push(
          `ACMI leg ${index + 1} route not in table: using ACMI fallback rate ${ACMI_DEFAULT_DOC_PER_BLH_BY_AIRCRAFT[aircraft].toFixed(2)} DKK/BLH (excludes Fuel/Handling/Turnaround).`,
        )
      }
      if (excludedPerBlh > 0) {
        details.push(
          `ACMI leg ${index + 1} excluded from minimum price: Fuel + Handling + Turnaround aircraft + Turnaround pax = ${toCurrency(
            excludedPerBlh * blh,
          )}`,
        )
      }
    })

    const crewCost =
      form.crewCostFcDays * form.crewCostFcDkkPerDay +
      form.crewCostFoDays * form.crewCostFoDkkPerDay +
      form.crewCostCabinDays * form.crewCostCabinDkkPerDay +
      form.crewCostCabinSdDays * form.crewCostCabinSdDkkPerDay
    const ownAddOns =
      (form.ownIncludeScaExtraHotac ? ownScaExtraHotacDkk : 0) +
      (form.ownIncludeScaExtraCrewPerDiem ? ownScaExtraCrewPerDiemEur * form.eurToDkkRate : 0)
    const marginMultiplier = 1 + Math.max(0, form.acmiSafetyMarginPercent) / 100
    const totalCostDkk = (operatingCost + crewCost + ownAddOns) * marginMultiplier
    const minimumBlhDkk = totalBlh > 0 ? totalCostDkk / totalBlh : 0
    const minimumBlhEur = form.eurToDkkRate > 0 ? minimumBlhDkk / form.eurToDkkRate : 0

    details.push(`Crew cost contribution: ${toCurrency(crewCost)}`)
    details.push(`SCA add-ons contribution: ${toCurrency(ownAddOns)}`)
    details.push(`Safety margin: ${form.acmiSafetyMarginPercent.toFixed(0)}%`)
    details.push('Excluded from ACMI minimum price: Fuel, Handling, Turnaround aircraft, Turnaround pax.')

    return {
      totalBlh,
      totalCostDkk,
      minimumBlhDkk,
      minimumBlhEur,
      details,
    }
  }, [
    enabledAcmiLines,
    form.acmiSafetyMarginPercent,
    form.crewCostCabinDays,
    form.crewCostCabinDkkPerDay,
    form.crewCostCabinSdDays,
    form.crewCostCabinSdDkkPerDay,
    form.crewCostFcDays,
    form.crewCostFcDkkPerDay,
    form.crewCostFoDays,
    form.crewCostFoDkkPerDay,
    form.enableAcmiModule,
    form.eurToDkkRate,
    form.ownIncludeScaExtraCrewPerDiem,
    form.ownIncludeScaExtraHotac,
    form.ownScaExtraCrewPerDiemEur,
    form.ownScaExtraHotacDkk,
    selectedOriginalType,
  ])

  const adhocBreakdown = useMemo<AdhocBreakdown | null>(() => {
    if (!form.enableAdhocModule) return null
    const lines = enabledAdhocLines
    if (lines.length === 0) return null

    const ownScaExtraHotacDkk = typeof form.ownScaExtraHotacDkk === 'number' ? form.ownScaExtraHotacDkk : 0
    const ownScaExtraCrewPerDiemEur =
      typeof form.ownScaExtraCrewPerDiemEur === 'number' ? form.ownScaExtraCrewPerDiemEur : 0

    let totalBlh = 0
    let operatingCost = 0
    const details: string[] = []

    lines.forEach((line, index) => {
      const aircraft = (line.aircraft || selectedOriginalType) as Exclude<AircraftType, 'SUB Narrowbody' | 'SUB Widebody'>
      const fallback = DEFAULTS_BY_AIRCRAFT[aircraft]
      const routeData = getLegData(line.leg.from, line.leg.to, aircraft)
      const blh = routeData?.blh ?? durationHoursFromUtcTimes(line.leg.depUtc, line.leg.arrUtc) ?? fallback.blh
      const docPerBlh = routeData && routeData.blh > 0 ? routeData.doc / routeData.blh : fallback.docPerBlh
      const lineCost = blh * docPerBlh

      totalBlh += blh
      operatingCost += lineCost
      details.push(`Adhoc leg ${index + 1} (${aircraft}): ${blh.toFixed(2)} BLH * ${docPerBlh.toFixed(2)} = ${toCurrency(lineCost)}`)
      if (!routeData) {
        details.push(
          `Adhoc leg ${index + 1} route not in table: using default full DOC fallback ${fallback.docPerBlh.toFixed(2)} DKK/BLH.`,
        )
      }
    })

    const crewCost =
      form.crewCostFcDays * form.crewCostFcDkkPerDay +
      form.crewCostFoDays * form.crewCostFoDkkPerDay +
      form.crewCostCabinDays * form.crewCostCabinDkkPerDay +
      form.crewCostCabinSdDays * form.crewCostCabinSdDkkPerDay
    const ownAddOns =
      (form.ownIncludeScaExtraHotac ? ownScaExtraHotacDkk : 0) +
      (form.ownIncludeScaExtraCrewPerDiem ? ownScaExtraCrewPerDiemEur * form.eurToDkkRate : 0)
    const baseTotalDkk = operatingCost + crewCost + ownAddOns
    const marginMultiplier = 1 + Math.max(0, form.adhocSafetyMarginPercent) / 100
    const minimumTotalDkk = baseTotalDkk * marginMultiplier
    const minimumTotalEur = form.eurToDkkRate > 0 ? minimumTotalDkk / form.eurToDkkRate : 0
    const minimumBlhDkk = totalBlh > 0 ? minimumTotalDkk / totalBlh : 0
    const minimumBlhEur = form.eurToDkkRate > 0 ? minimumBlhDkk / form.eurToDkkRate : 0

    details.push(`Operating cost (full DOC, all elements included): ${toCurrency(operatingCost)}`)
    details.push(`Crew cost contribution: ${toCurrency(crewCost)}`)
    details.push(`SCA add-ons contribution: ${toCurrency(ownAddOns)}`)
    details.push(`Safety margin: ${form.adhocSafetyMarginPercent.toFixed(0)}%`)

    return {
      totalBlh,
      totalCostDkk: baseTotalDkk,
      minimumTotalDkk,
      minimumTotalEur,
      minimumBlhDkk,
      minimumBlhEur,
      details,
    }
  }, [
    enabledAdhocLines,
    form.adhocSafetyMarginPercent,
    form.crewCostCabinDays,
    form.crewCostCabinDkkPerDay,
    form.crewCostCabinSdDays,
    form.crewCostCabinSdDkkPerDay,
    form.crewCostFcDays,
    form.crewCostFcDkkPerDay,
    form.crewCostFoDays,
    form.crewCostFoDkkPerDay,
    form.enableAdhocModule,
    form.eurToDkkRate,
    form.ownIncludeScaExtraCrewPerDiem,
    form.ownIncludeScaExtraHotac,
    form.ownScaExtraCrewPerDiemEur,
    form.ownScaExtraHotacDkk,
    selectedOriginalType,
  ])

  return (
    <main className="app">
      <header>
        <h1>Irreg Cost and Decision Tool</h1>
      </header>

      <div className="workspace-layout">
      <section className="panel input-panel">
        <div className="section-top">
          <h2>Input</h2>
          <div className="top-controls">
            <div className="tool-toggle-row top-tool-row">
              <button
                type="button"
                className={form.enableAcmiModule ? 'tool-toggle-btn active' : 'tool-toggle-btn'}
                onClick={() => update('enableAcmiModule', !form.enableAcmiModule)}
              >
                ACMI tool
              </button>
              <button
                type="button"
                className={form.enableAdhocModule ? 'tool-toggle-btn active' : 'tool-toggle-btn'}
                onClick={() => update('enableAdhocModule', !form.enableAdhocModule)}
              >
                Adhoc tool
              </button>
            </div>
            <label className="top-rate-label">
              EUR to DKK rate
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.eurToDkkRate}
                onChange={(event) => update('eurToDkkRate', Number(event.target.value) || 0)}
              />
            </label>
            <button type="button" className="reset-btn" onClick={resetAll}>
              Reset all fields
            </button>
          </div>
        </div>

        {!isToolMode ? (
          <>
            <div className="grid compact">
              <label>
                Original aircraft type
                <select
                  value={form.originalType}
                  onChange={(event) => update('originalType', event.target.value as FormState['originalType'])}
                >
                  <option value="">Select aircraft type</option>
                  <option value="A321">A321</option>
                  <option value="A339">A339</option>
                  <option value="A321N">A321N</option>
                </select>
              </label>
            </div>

            <h3>Route (UTC)</h3>
            <div className="route-grid">
              <div className="route-row">
                <span>Leg 1</span>
                <input value={form.leg1.from} onChange={(event) => updateLeg('leg1', 'from', event.target.value)} placeholder="From" />
                <input value={form.leg1.depUtc} onChange={(event) => updateLeg('leg1', 'depUtc', event.target.value)} placeholder="STD" />
                <input value={form.leg1.arrUtc} onChange={(event) => updateLeg('leg1', 'arrUtc', event.target.value)} placeholder="STA" />
                <input value={form.leg1.to} onChange={(event) => updateLeg('leg1', 'to', event.target.value)} placeholder="To" />
                <input
                  type="number"
                  min={0}
                  value={form.leg1.pax}
                  onChange={(event) => updateLeg('leg1', 'pax', event.target.value === '' ? '' : Number(event.target.value))}
                  placeholder="Pax"
                />
              </div>

              <div className="route-row">
                <span>Leg 2</span>
                <input value={form.leg2.from} onChange={(event) => updateLeg('leg2', 'from', event.target.value)} placeholder="From" />
                <input value={form.leg2.depUtc} onChange={(event) => updateLeg('leg2', 'depUtc', event.target.value)} placeholder="STD" />
                <input value={form.leg2.arrUtc} onChange={(event) => updateLeg('leg2', 'arrUtc', event.target.value)} placeholder="STA" />
                <input value={form.leg2.to} onChange={(event) => updateLeg('leg2', 'to', event.target.value)} placeholder="To" />
                <input
                  type="number"
                  min={0}
                  value={form.leg2.pax}
                  onChange={(event) => updateLeg('leg2', 'pax', event.target.value === '' ? '' : Number(event.target.value))}
                  placeholder="Pax"
                />
              </div>

              <div className="route-row">
                <span>Leg 3</span>
                <input value={form.leg3.from} onChange={(event) => updateLeg('leg3', 'from', event.target.value)} placeholder="From" />
                <input value={form.leg3.depUtc} onChange={(event) => updateLeg('leg3', 'depUtc', event.target.value)} placeholder="STD" />
                <input value={form.leg3.arrUtc} onChange={(event) => updateLeg('leg3', 'arrUtc', event.target.value)} placeholder="STA" />
                <input value={form.leg3.to} onChange={(event) => updateLeg('leg3', 'to', event.target.value)} placeholder="To" />
                <input
                  type="number"
                  min={0}
                  value={form.leg3.pax}
                  onChange={(event) => updateLeg('leg3', 'pax', event.target.value === '' ? '' : Number(event.target.value))}
                  placeholder="Pax"
                />
              </div>

              <div className="route-row">
                <span>Leg 4</span>
                <input value={form.leg4.from} onChange={(event) => updateLeg('leg4', 'from', event.target.value)} placeholder="From" />
                <input value={form.leg4.depUtc} onChange={(event) => updateLeg('leg4', 'depUtc', event.target.value)} placeholder="STD" />
                <input value={form.leg4.arrUtc} onChange={(event) => updateLeg('leg4', 'arrUtc', event.target.value)} placeholder="STA" />
                <input value={form.leg4.to} onChange={(event) => updateLeg('leg4', 'to', event.target.value)} placeholder="To" />
                <input
                  type="number"
                  min={0}
                  value={form.leg4.pax}
                  onChange={(event) => updateLeg('leg4', 'pax', event.target.value === '' ? '' : Number(event.target.value))}
                  placeholder="Pax"
                />
              </div>
            </div>

            <div className="blh-box">
              <strong>BLH source per route leg:</strong>
              {blhPreview.length === 0 ? <p>Select aircraft type and fill route to view BLH.</p> : null}
              {blhPreview.map((line) => (
                <p key={`${line.label}-${line.from}-${line.to}`}>
                  {line.label} {line.from}-{line.to}: {line.blh.toFixed(2)} ({line.source})
                </p>
              ))}
            </div>

            <div className="settings-box section-card">
              <h3>Enabled options</h3>
              <div className="enabled-options-layout">
                <div className="toggle-grid">
                  <label className="mini-check">
                    <input
                      type="checkbox"
                      checked={form.enableOwnScaFlights}
                      onChange={(event) => update('enableOwnScaFlights', event.target.checked)}
                    />
                    Do we have spare SCA aircraft available?
                  </label>
                  {form.enableOwnScaFlights ? (
                    <div className="own-availability-under-owntoggle">
                      <div className="own-availability-inline">
                        <label>
                          Available A321
                          <input
                            type="number"
                            min={0}
                            step={1}
                            value={form.ownAvailableA321}
                            onChange={(event) => update('ownAvailableA321', Number(event.target.value) || 0)}
                          />
                        </label>
                        <label>
                          Available A321N
                          <input
                            type="number"
                            min={0}
                            step={1}
                            value={form.ownAvailableA321N}
                            onChange={(event) => update('ownAvailableA321N', Number(event.target.value) || 0)}
                          />
                        </label>
                        <label>
                          Available A339
                          <input
                            type="number"
                            min={0}
                            step={1}
                            value={form.ownAvailableA339}
                            onChange={(event) => update('ownAvailableA339', Number(event.target.value) || 0)}
                          />
                        </label>
                      </div>
                    </div>
                  ) : null}
                  <label className="mini-check">
                    <input
                      type="checkbox"
                      checked={form.enableSubOption1}
                      onChange={(event) => update('enableSubOption1', event.target.checked)}
                    />
                    Enable Subcharter Option 1 (Narrowbody)
                  </label>
                  <label className="mini-check">
                    <input
                      type="checkbox"
                      checked={form.enableSubOption2}
                      onChange={(event) => update('enableSubOption2', event.target.checked)}
                    />
                    Enable Subcharter Option 2 (Narrowbody)
                  </label>
                  <label className="mini-check">
                    <input
                      type="checkbox"
                      checked={form.enableSubOption3}
                      onChange={(event) => update('enableSubOption3', event.target.checked)}
                    />
                    Enable Subcharter Option 3 (Widebody)
                  </label>
                </div>
              </div>
            </div>
          </>
        ) : null}

        {form.enableOwnScaFlights ? (
          <div className="settings-box section-card">
          <h3>SCA extra positioning flights</h3>
          <div className="route-grid four-lines">
            {form.ownBaseLines.map((line, idx) => (
              <div className="route-row with-controls" key={`own-${idx}`}>
                <span>Posi #{idx + 1}</span>
                <label className="mini-check">
                  <input
                    type="checkbox"
                    checked={line.enabled}
                    onChange={(event) => updateOwnBaseLine(idx, { enabled: event.target.checked })}
                  />
                  Active
                </label>
                <select
                  value={line.aircraft}
                  onChange={(event) => updateOwnBaseLine(idx, { aircraft: event.target.value as OwnBaseLineInput['aircraft'] })}
                  disabled={!line.enabled}
                >
                  <option value="">Select</option>
                  {OWN_AIRCRAFT_OPTIONS.map((aircraft) => (
                    <option key={`own-air-${idx}-${aircraft}`} value={aircraft}>
                      {aircraft}
                    </option>
                  ))}
                </select>
                <input
                  value={line.leg.from}
                  onChange={(event) => updateOwnBaseLine(idx, { leg: { from: event.target.value } })}
                  placeholder="From"
                />
                <input
                  value={line.leg.depUtc}
                  onChange={(event) => updateOwnBaseLine(idx, { leg: { depUtc: event.target.value } })}
                  placeholder="STD"
                />
                <input
                  value={line.leg.arrUtc}
                  onChange={(event) => updateOwnBaseLine(idx, { leg: { arrUtc: event.target.value } })}
                  placeholder="STA"
                />
                <input
                  value={line.leg.to}
                  onChange={(event) => updateOwnBaseLine(idx, { leg: { to: event.target.value } })}
                  placeholder="To"
                />
              </div>
            ))}
          </div>
          </div>
        ) : null}

        {form.enableSubOption1 ? (
          <div className="settings-box section-card">
          <h3>Subcharter Option 1 (Narrowbody)</h3>
          <div className="grid compact">
            <label>
              BLH cost (EUR)
              <input
                type="number"
                min={0}
                value={form.subCharter1BlhCostEur}
                onFocus={(event) => event.target.select()}
                onChange={(event) =>
                  update(
                    'subCharter1BlhCostEur',
                    event.target.value === '' ? '' : Number(event.target.value) || 0,
                  )
                }
              />
            </label>
            <label>
              Seats available
              <input
                type="number"
                min={0}
                value={form.subCharter1Seats}
                onChange={(event) => update('subCharter1Seats', Number(event.target.value) || 0)}
              />
            </label>
          </div>

          <div className="route-grid four-lines">
            {form.subCharter1Lines.map((line, idx) => (
              <div className="route-row with-controls sub-row" key={`sub1-${idx}`}>
                <span>Posi #{idx + 1}</span>
                <label className="mini-check">
                  <input
                    type="checkbox"
                    checked={line.enabled}
                    onChange={(event) => updateSubBaseLine('sub1', idx, { enabled: event.target.checked })}
                  />
                  Active
                </label>
                <input
                  value={line.leg.from}
                  onChange={(event) => updateSubBaseLine('sub1', idx, { leg: { from: event.target.value } })}
                  placeholder="From"
                />
                <input
                  value={line.leg.depUtc}
                  onChange={(event) => updateSubBaseLine('sub1', idx, { leg: { depUtc: event.target.value } })}
                  placeholder="STD"
                />
                <input
                  value={line.leg.arrUtc}
                  onChange={(event) => updateSubBaseLine('sub1', idx, { leg: { arrUtc: event.target.value } })}
                  placeholder="STA"
                />
                <input
                  value={line.leg.to}
                  onChange={(event) => updateSubBaseLine('sub1', idx, { leg: { to: event.target.value } })}
                  placeholder="To"
                />
              </div>
            ))}
          </div>
          <div className="sub-addons-row">
            <label className="mini-check">
              <input
                type="checkbox"
                checked={form.subCharter1IncludeHotac}
                onChange={(event) => update('subCharter1IncludeHotac', event.target.checked)}
              />
              HOTAC
            </label>
            <input
              type="number"
              min={0}
              value={form.subCharter1HotacDkk}
              onChange={(event) => update('subCharter1HotacDkk', Number(event.target.value) || 0)}
              placeholder="HOTAC DKK"
            />
            <label className="mini-check">
              <input
                type="checkbox"
                checked={form.subCharter1IncludeCrewPerDiem}
                onChange={(event) => update('subCharter1IncludeCrewPerDiem', event.target.checked)}
              />
              Crew per diem
            </label>
            <input
              type="number"
              min={0}
              value={form.subCharter1CrewPerDiemEur}
              onChange={(event) => update('subCharter1CrewPerDiemEur', Number(event.target.value) || 0)}
              placeholder="Crew per diem EUR"
            />
          </div>
          </div>
        ) : null}

        {form.enableSubOption2 ? (
          <div className="settings-box section-card">
          <h3>Subcharter Option 2 (Narrowbody)</h3>
          <div className="grid compact">
            <label>
              BLH cost (EUR)
              <input
                type="number"
                min={0}
                value={form.subCharter2BlhCostEur}
                onFocus={(event) => event.target.select()}
                onChange={(event) =>
                  update(
                    'subCharter2BlhCostEur',
                    event.target.value === '' ? '' : Number(event.target.value) || 0,
                  )
                }
              />
            </label>
            <label>
              Seats available
              <input
                type="number"
                min={0}
                value={form.subCharter2Seats}
                onChange={(event) => update('subCharter2Seats', Number(event.target.value) || 0)}
              />
            </label>
          </div>

          <div className="route-grid four-lines">
            {form.subCharter2Lines.map((line, idx) => (
              <div className="route-row with-controls sub-row" key={`sub2-${idx}`}>
                <span>Posi #{idx + 1}</span>
                <label className="mini-check">
                  <input
                    type="checkbox"
                    checked={line.enabled}
                    onChange={(event) => updateSubBaseLine('sub2', idx, { enabled: event.target.checked })}
                  />
                  Active
                </label>
                <input
                  value={line.leg.from}
                  onChange={(event) => updateSubBaseLine('sub2', idx, { leg: { from: event.target.value } })}
                  placeholder="From"
                />
                <input
                  value={line.leg.depUtc}
                  onChange={(event) => updateSubBaseLine('sub2', idx, { leg: { depUtc: event.target.value } })}
                  placeholder="STD"
                />
                <input
                  value={line.leg.arrUtc}
                  onChange={(event) => updateSubBaseLine('sub2', idx, { leg: { arrUtc: event.target.value } })}
                  placeholder="STA"
                />
                <input
                  value={line.leg.to}
                  onChange={(event) => updateSubBaseLine('sub2', idx, { leg: { to: event.target.value } })}
                  placeholder="To"
                />
              </div>
            ))}
          </div>
          <div className="sub-addons-row">
            <label className="mini-check">
              <input
                type="checkbox"
                checked={form.subCharter2IncludeHotac}
                onChange={(event) => update('subCharter2IncludeHotac', event.target.checked)}
              />
              HOTAC
            </label>
            <input
              type="number"
              min={0}
              value={form.subCharter2HotacDkk}
              onChange={(event) => update('subCharter2HotacDkk', Number(event.target.value) || 0)}
              placeholder="HOTAC DKK"
            />
            <label className="mini-check">
              <input
                type="checkbox"
                checked={form.subCharter2IncludeCrewPerDiem}
                onChange={(event) => update('subCharter2IncludeCrewPerDiem', event.target.checked)}
              />
              Crew per diem
            </label>
            <input
              type="number"
              min={0}
              value={form.subCharter2CrewPerDiemEur}
              onChange={(event) => update('subCharter2CrewPerDiemEur', Number(event.target.value) || 0)}
              placeholder="Crew per diem EUR"
            />
          </div>
          </div>
        ) : null}

        {form.enableSubOption3 ? (
          <div className="settings-box section-card">
          <h3>Subcharter Option 3 (Widebody)</h3>
          <div className="grid compact">
            <label>
              BLH cost (EUR)
              <input
                type="number"
                min={0}
                value={form.subCharter3BlhCostEur}
                onFocus={(event) => event.target.select()}
                onChange={(event) =>
                  update(
                    'subCharter3BlhCostEur',
                    event.target.value === '' ? '' : Number(event.target.value) || 0,
                  )
                }
              />
            </label>
            <label>
              Seats available
              <input
                type="number"
                min={0}
                value={form.subCharter3Seats}
                onChange={(event) => update('subCharter3Seats', Number(event.target.value) || 0)}
              />
            </label>
          </div>

          <div className="route-grid four-lines">
            {form.subCharter3Lines.map((line, idx) => (
              <div className="route-row with-controls sub-row" key={`sub3-${idx}`}>
                <span>Posi #{idx + 1}</span>
                <label className="mini-check">
                  <input
                    type="checkbox"
                    checked={line.enabled}
                    onChange={(event) => updateSubBaseLine('sub3', idx, { enabled: event.target.checked })}
                  />
                  Active
                </label>
                <input
                  value={line.leg.from}
                  onChange={(event) => updateSubBaseLine('sub3', idx, { leg: { from: event.target.value } })}
                  placeholder="From"
                />
                <input
                  value={line.leg.depUtc}
                  onChange={(event) => updateSubBaseLine('sub3', idx, { leg: { depUtc: event.target.value } })}
                  placeholder="STD"
                />
                <input
                  value={line.leg.arrUtc}
                  onChange={(event) => updateSubBaseLine('sub3', idx, { leg: { arrUtc: event.target.value } })}
                  placeholder="STA"
                />
                <input
                  value={line.leg.to}
                  onChange={(event) => updateSubBaseLine('sub3', idx, { leg: { to: event.target.value } })}
                  placeholder="To"
                />
              </div>
            ))}
          </div>
          <div className="sub-addons-row">
            <label className="mini-check">
              <input
                type="checkbox"
                checked={form.subCharter3IncludeHotac}
                onChange={(event) => update('subCharter3IncludeHotac', event.target.checked)}
              />
              HOTAC
            </label>
            <input
              type="number"
              min={0}
              value={form.subCharter3HotacDkk}
              onChange={(event) => update('subCharter3HotacDkk', Number(event.target.value) || 0)}
              placeholder="HOTAC DKK"
            />
            <label className="mini-check">
              <input
                type="checkbox"
                checked={form.subCharter3IncludeCrewPerDiem}
                onChange={(event) => update('subCharter3IncludeCrewPerDiem', event.target.checked)}
              />
              Crew per diem
            </label>
            <input
              type="number"
              min={0}
              value={form.subCharter3CrewPerDiemEur}
              onChange={(event) => update('subCharter3CrewPerDiemEur', Number(event.target.value) || 0)}
              placeholder="Crew per diem EUR"
            />
          </div>
          </div>
        ) : null}

        {form.enableAcmiModule ? (
          <div className="tool-module-panel section-card">
            <h3>ACMI module</h3>
            <div className="route-grid four-lines">
              {form.acmiLines.map((line, idx) => (
                <div className="route-row with-controls" key={`acmi-${idx}`}>
                  <span>ACMI #{idx + 1}</span>
                  <label className="mini-check">
                    <input
                      type="checkbox"
                      checked={line.enabled}
                      onChange={(event) => updateAcmiLine(idx, { enabled: event.target.checked })}
                    />
                    Active
                  </label>
                  <select
                    value={line.aircraft}
                    onChange={(event) => updateAcmiLine(idx, { aircraft: event.target.value as OwnBaseLineInput['aircraft'] })}
                    disabled={!line.enabled}
                  >
                    <option value="">Select</option>
                    {OWN_AIRCRAFT_OPTIONS.map((aircraft) => (
                      <option key={`acmi-air-${idx}-${aircraft}`} value={aircraft}>
                        {aircraft}
                      </option>
                    ))}
                  </select>
                  <input
                    value={line.leg.from}
                    onChange={(event) => updateAcmiLine(idx, { leg: { from: event.target.value } })}
                    placeholder="From"
                  />
                  <input
                    value={line.leg.depUtc}
                    onChange={(event) => updateAcmiLine(idx, { leg: { depUtc: event.target.value } })}
                    placeholder="STD"
                  />
                  <input
                    value={line.leg.arrUtc}
                    onChange={(event) => updateAcmiLine(idx, { leg: { arrUtc: event.target.value } })}
                    placeholder="STA"
                  />
                  <input
                    value={line.leg.to}
                    onChange={(event) => updateAcmiLine(idx, { leg: { to: event.target.value } })}
                    placeholder="To"
                  />
                </div>
              ))}
            </div>
            <div className="grid compact">
              <label>
                ACMI safety margin (%)
                <input
                  type="number"
                  min={0}
                  value={form.acmiSafetyMarginPercent}
                  onChange={(event) => update('acmiSafetyMarginPercent', Number(event.target.value) || 0)}
                />
              </label>
            </div>
            {acmiBreakdown ? (
              <div className="acmi-summary">
                <p>Total ACMI BLH: {acmiBreakdown.totalBlh.toFixed(2)}</p>
                <p>Total ACMI cost: {toCurrency(acmiBreakdown.totalCostDkk)}</p>
                <p>Minimum ACMI BLH (DKK): {toCurrency(acmiBreakdown.minimumBlhDkk)}</p>
                <p>Minimum ACMI BLH (EUR): {toEur(acmiBreakdown.minimumBlhEur)}</p>
                <details className="acmi-breakdown-details">
                  <summary>Show ACMI calculation setup</summary>
                  <ul>
                    {acmiBreakdown.details.map((detail) => (
                      <li key={detail}>{detail}</li>
                    ))}
                  </ul>
                </details>
              </div>
            ) : (
              <p className="result-placeholder">Activate at least one ACMI line to calculate minimum ACMI BLH price.</p>
            )}
          </div>
        ) : null}

        {form.enableAdhocModule ? (
          <div className="tool-module-panel section-card">
            <h3>Adhoc module</h3>
            <div className="route-grid four-lines">
              {form.adhocLines.map((line, idx) => (
                <div className="route-row with-controls" key={`adhoc-${idx}`}>
                  <span>Adhoc #{idx + 1}</span>
                  <label className="mini-check">
                    <input
                      type="checkbox"
                      checked={line.enabled}
                      onChange={(event) => updateAdhocLine(idx, { enabled: event.target.checked })}
                    />
                    Active
                  </label>
                  <select
                    value={line.aircraft}
                    onChange={(event) => updateAdhocLine(idx, { aircraft: event.target.value as OwnBaseLineInput['aircraft'] })}
                    disabled={!line.enabled}
                  >
                    <option value="">Select</option>
                    {OWN_AIRCRAFT_OPTIONS.map((aircraft) => (
                      <option key={`adhoc-air-${idx}-${aircraft}`} value={aircraft}>
                        {aircraft}
                      </option>
                    ))}
                  </select>
                  <input
                    value={line.leg.from}
                    onChange={(event) => updateAdhocLine(idx, { leg: { from: event.target.value } })}
                    placeholder="From"
                  />
                  <input
                    value={line.leg.depUtc}
                    onChange={(event) => updateAdhocLine(idx, { leg: { depUtc: event.target.value } })}
                    placeholder="STD"
                  />
                  <input
                    value={line.leg.arrUtc}
                    onChange={(event) => updateAdhocLine(idx, { leg: { arrUtc: event.target.value } })}
                    placeholder="STA"
                  />
                  <input
                    value={line.leg.to}
                    onChange={(event) => updateAdhocLine(idx, { leg: { to: event.target.value } })}
                    placeholder="To"
                  />
                </div>
              ))}
            </div>
            <div className="grid compact">
              <label>
                Adhoc safety margin (%)
                <input
                  type="number"
                  min={0}
                  value={form.adhocSafetyMarginPercent}
                  onChange={(event) => update('adhocSafetyMarginPercent', Number(event.target.value) || 0)}
                />
              </label>
            </div>
            {adhocBreakdown ? (
              <div className="acmi-summary">
                <p>Total Adhoc BLH: {adhocBreakdown.totalBlh.toFixed(2)}</p>
                <p>Adhoc cost before margin (all expenses): {toCurrency(adhocBreakdown.totalCostDkk)}</p>
                <p>Minimum Adhoc total price (DKK): {toCurrency(adhocBreakdown.minimumTotalDkk)}</p>
                <p>Minimum Adhoc total price (EUR): {toEur(adhocBreakdown.minimumTotalEur)}</p>
                <p>Minimum Adhoc BLH (DKK): {toCurrency(adhocBreakdown.minimumBlhDkk)}</p>
                <p>Minimum Adhoc BLH (EUR): {toEur(adhocBreakdown.minimumBlhEur)}</p>
                <details className="acmi-breakdown-details">
                  <summary>Show Adhoc calculation setup</summary>
                  <ul>
                    {adhocBreakdown.details.map((detail) => (
                      <li key={detail}>{detail}</li>
                    ))}
                  </ul>
                </details>
              </div>
            ) : (
              <p className="result-placeholder">Activate at least one Adhoc line to calculate minimum Adhoc price.</p>
            )}
          </div>
        ) : null}

        <div className="post-sub-section">
          <div className="post-sub-groups">
            {!(form.enableAcmiModule || form.enableAdhocModule) ? (
              <div className="settings-box">
                <h4>Other assumptions</h4>
                <div className="grid">
                  <label>
                    Expected cost per overflow pax
                    <input
                      type="number"
                      min={0}
                      value={form.expectedOverflowCostPerPax}
                      onChange={(event) => update('expectedOverflowCostPerPax', Number(event.target.value) || 0)}
                    />
                  </label>

                  <label>
                    NPS detractor pr pax on Sub (DKK)
                    <input
                      type="range"
                      min={0}
                      max={20000}
                      step={500}
                      value={form.npsDetractorPerPaxOnSubDkk}
                      onChange={(event) => update('npsDetractorPerPaxOnSubDkk', Number(event.target.value) || 0)}
                    />
                    <span>{toCurrency(form.npsDetractorPerPaxOnSubDkk)}</span>
                  </label>
                </div>
              </div>
            ) : null}

            <div className="settings-box">
              <h4>SCA Crew cost</h4>
              <div className="grid">
                <label>
                  FC days
                  <input
                    type="number"
                    min={0}
                    value={form.crewCostFcDays}
                    onChange={(event) => update('crewCostFcDays', Number(event.target.value) || 0)}
                  />
                </label>

                <label>
                  FC rate per day (DKK)
                  <input
                    type="number"
                    min={0}
                    value={form.crewCostFcDkkPerDay}
                    onChange={(event) => update('crewCostFcDkkPerDay', Number(event.target.value) || 0)}
                  />
                </label>

                <label>
                  FO days
                  <input
                    type="number"
                    min={0}
                    value={form.crewCostFoDays}
                    onChange={(event) => update('crewCostFoDays', Number(event.target.value) || 0)}
                  />
                </label>

                <label>
                  FO rate per day (DKK)
                  <input
                    type="number"
                    min={0}
                    value={form.crewCostFoDkkPerDay}
                    onChange={(event) => update('crewCostFoDkkPerDay', Number(event.target.value) || 0)}
                  />
                </label>

                <label>
                  Cabin days
                  <input
                    type="number"
                    min={0}
                    value={form.crewCostCabinDays}
                    onChange={(event) => update('crewCostCabinDays', Number(event.target.value) || 0)}
                  />
                </label>

                <label>
                  Cabin rate per day (DKK)
                  <input
                    type="number"
                    min={0}
                    value={form.crewCostCabinDkkPerDay}
                    onChange={(event) => update('crewCostCabinDkkPerDay', Number(event.target.value) || 0)}
                  />
                </label>

                <label>
                  Cabin SD days
                  <input
                    type="number"
                    min={0}
                    value={form.crewCostCabinSdDays}
                    onChange={(event) => update('crewCostCabinSdDays', Number(event.target.value) || 0)}
                  />
                </label>

                <label>
                  Cabin SD rate per day (DKK)
                  <input
                    type="number"
                    min={0}
                    value={form.crewCostCabinSdDkkPerDay}
                    onChange={(event) => update('crewCostCabinSdDkkPerDay', Number(event.target.value) || 0)}
                  />
                </label>
              </div>
              <div className="sub-addons-row">
                <label className="mini-check">
                  <input
                    type="checkbox"
                    checked={form.ownIncludeScaExtraHotac}
                    onChange={(event) => update('ownIncludeScaExtraHotac', event.target.checked)}
                  />
                  HOTAC (DKK)
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.ownScaExtraHotacDkk}
                  onFocus={(event) => event.target.select()}
                  onChange={(event) =>
                    update('ownScaExtraHotacDkk', event.target.value === '' ? '' : Number(event.target.value) || 0)
                  }
                  placeholder="HOTAC DKK"
                />
                <label className="mini-check">
                  <input
                    type="checkbox"
                    checked={form.ownIncludeScaExtraCrewPerDiem}
                    onChange={(event) => update('ownIncludeScaExtraCrewPerDiem', event.target.checked)}
                  />
                  Crew per diem (EUR)
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.ownScaExtraCrewPerDiemEur}
                  onFocus={(event) => event.target.select()}
                  onChange={(event) =>
                    update(
                      'ownScaExtraCrewPerDiemEur',
                      event.target.value === '' ? '' : Number(event.target.value) || 0,
                    )
                  }
                  placeholder="Crew per diem EUR"
                />
              </div>
            </div>

            {!(form.enableAcmiModule || form.enableAdhocModule) ? (
              <div className="settings-box">
                <h4>EU261 settings</h4>
                <div className="grid">
                  <label>
                    Pax Seeking compensation (%)
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={form.eu261ImpactedPercent}
                      onChange={(event) => update('eu261ImpactedPercent', Number(event.target.value) || 0)}
                    />
                    <span>{form.eu261ImpactedPercent.toFixed(0)}%</span>
                  </label>

                  <label>
                    EU261 band (EUR)
                    <select
                      value={form.eu261ManualBandEur}
                      onChange={(event) => update('eu261ManualBandEur', asBand(Number(event.target.value)))}
                    >
                      {eu261SelectableBands.map((band) => (
                        <option key={band} value={band}>
                        {`${band} EUR`}
                        </option>
                      ))}
                    </select>
                    {EU261_BAND_DETAIL_LINES[form.eu261ManualBandEur]?.length ? (
                      <span className="eu261-band-detail">
                        {EU261_BAND_DETAIL_LINES[form.eu261ManualBandEur].map((line) => (
                          <span key={`${form.eu261ManualBandEur}-${line}`}>{line}</span>
                        ))}
                      </span>
                    ) : null}
                  </label>
                </div>
              </div>
            ) : null}
          </div>

          <p className="eu261-note">All times are UTC. The first active lines are used in scenario calculation.</p>
        </div>
      </section>

      <section className="panel result-panel">
        <h2>Result</h2>
        {activeLegs.length === 0 ? (
          <p className="result-placeholder">Fill in at least one route leg to show results.</p>
        ) : results.length === 0 ? (
          <p className="result-placeholder">No scenarios available for the currently enabled options.</p>
        ) : (
          <>
            {cheapest ? (
              <div className="cheapest">
                Lowest difference from original (DKK, {cheapest.eu261IncludedInEvaluation ? 'incl. EU261' : 'excl. EU261'}):{' '}
                <strong>{cheapest.name}</strong>: {toSignedDkkDelta(cheapest.evaluatedTotalDkk)}
              </div>
            ) : null}

            <div className="results">
              {results.map((result) => (
                <article key={result.id} className={result.id === cheapest?.id ? 'resultCard best' : 'resultCard'}>
                  {result.id === cheapest?.id ? <span className="best-badge">Best option</span> : null}
                  <h3>{result.name}</h3>
                  <p>
                    Difference from original (DKK, {result.eu261IncludedInEvaluation ? 'incl. EU261' : 'excl. EU261'}):{' '}
                    {toSignedDkkDelta(result.evaluatedTotalDkk)}
                  </p>
                  <p>EU261 (EUR, separat): {toEur(result.eu261CostEur)}</p>
                  <p>Pax Seeking compensation (%) ({form.eu261ImpactedPercent.toFixed(0)}%): {result.eu261ImpactedPax}</p>
                  <div className="result-eu261-controls">
                    {result.eu261LegOptions.map((legOption) => (
                      <label key={`${result.id}-eu261-${legOption.index}`}>
                        <input
                          type="checkbox"
                          checked={legOption.checked}
                          onChange={(event) =>
                            updateScenarioEu261LegSelection(
                              result.id,
                              legOption.index,
                              event.target.checked,
                              { legSelections: result.eu261LegOptions.map(() => false) },
                            )
                          }
                        />
                        EU261 on {legOption.label}
                      </label>
                    ))}
                  </div>
                  {result.subNarrowbodyOptionLabel ? (
                    <p>SUB Narrowbody calculated as: {result.subNarrowbodyOptionLabel}</p>
                  ) : null}
                  <p>Capacity: {result.seatCapacity}</p>
                  <p>Overflow pax: {result.overflowPax}</p>
                  <p>Overflow cost: {toCurrency(result.overflowCost)}</p>
                  <p>Crew cost (once): {toCurrency(result.crewCost)}</p>
                  <details>
                    <summary>Cost details</summary>
                    <ul>
                      {result.details.map((detail) => (
                        <li key={detail}>{detail}</li>
                      ))}
                    </ul>
                  </details>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
      </div>
    </main>
  )
}

export default App
