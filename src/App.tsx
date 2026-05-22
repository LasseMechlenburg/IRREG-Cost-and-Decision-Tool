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
  applyToAllResults: boolean
  aircraft: '' | Exclude<AircraftType, 'SUB Narrowbody' | 'SUB Widebody'>
  leg: RouteLegInput
}

type SubBaseLineInput = {
  enabled: boolean
  applyToAllResults: boolean
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
  applyToAllResults: boolean
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

type BaselineAircraftKey = 'A321' | 'A321N' | 'A339' | 'SUB Narrowbody' | 'SUB Widebody'
type BaselineComponentKey = keyof NonNullable<AircraftRouteData['docComponents']>
type BaselineAircraftParameters = {
  blh: number
  componentsPerBlh: Record<BaselineComponentKey, number>
}

const DOC_COMPONENT_KEYS: Array<keyof NonNullable<AircraftRouteData['docComponents']>> = [
  'fuel',
  'uptake',
  'saf',
  'ets',
  'cycle',
  'fh',
  'enroute',
  'turnaroundPax',
  'turnaroundAircraft',
  'ghIn',
  'ghOut',
  'handling',
]

const DOC_COMPONENT_LABELS: Record<keyof NonNullable<AircraftRouteData['docComponents']>, string> = {
  fuel: 'Fuel',
  uptake: 'Uptake',
  saf: 'SAF',
  ets: 'ETS',
  cycle: 'Maintenance reserve (Cycle)',
  fh: 'Maintenance reserve (FH)',
  enroute: 'Enroute',
  turnaroundPax: 'Turnaround pax',
  turnaroundAircraft: 'Turnaround aircraft',
  ghIn: 'Ground handling in',
  ghOut: 'Ground handling out',
  handling: 'Handling',
}

const BASELINE_AIRCRAFT_OPTIONS: BaselineAircraftKey[] = ['A321', 'A321N', 'A339', 'SUB Narrowbody', 'SUB Widebody']

function sumComponentsPerBlh(components: Record<BaselineComponentKey, number>): number {
  return DOC_COMPONENT_KEYS.reduce((sum, key) => sum + (components[key] ?? 0), 0)
}

function nonMaintComponentsPerBlh(components: Record<BaselineComponentKey, number>): number {
  const total = sumComponentsPerBlh(components)
  return Math.max(0, total - (components.cycle ?? 0) - (components.fh ?? 0))
}

function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100
}

type AuditComponentSummary = {
  blhTotal: number
  docTotal: number
  componentTotals: Record<keyof NonNullable<AircraftRouteData['docComponents']>, number>
  fallbackLegCount: number
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
  aircraftComponentDefaults?: Record<
    string,
    {
      avgBlh?: number
      avgDoc?: number
      componentAvg?: Partial<Record<keyof NonNullable<AircraftRouteData['docComponents']>, number>>
      componentPerBlh?: Partial<Record<keyof NonNullable<AircraftRouteData['docComponents']>, number>>
    }
  >
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
    { id: '2xa321', name: '2 x A321', legs: ['A321', 'A321'] },
    { id: '2xa321n', name: '2 x A321N', legs: ['A321N', 'A321N'] },
    { id: 'a321-a321n', name: 'A321 + A321N', legs: ['A321', 'A321N'] },
    { id: 'a321-sub', name: 'A321 + SUB Narrowbody', legs: ['A321', 'SUB Narrowbody'] },
    { id: 'a321n-sub', name: 'A321N + SUB Narrowbody', legs: ['A321N', 'SUB Narrowbody'] },
    { id: 'a321-sub-wide', name: 'A321 + Subcharter Option 3 (Widebody)', legs: ['A321', 'SUB Widebody'] },
    { id: 'a321n-sub-wide', name: 'A321N + Subcharter Option 3 (Widebody)', legs: ['A321N', 'SUB Widebody'] },
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
    { id: '2xa321', name: '2 x A321', legs: ['A321', 'A321'] },
    { id: '2xa321n', name: '2 x A321N', legs: ['A321N', 'A321N'] },
    { id: 'a321-a321n', name: 'A321 + A321N', legs: ['A321', 'A321N'] },
    { id: 'a321-sub', name: 'A321 + SUB Narrowbody', legs: ['A321', 'SUB Narrowbody'] },
    { id: 'a321n-sub', name: 'A321N + SUB Narrowbody', legs: ['A321N', 'SUB Narrowbody'] },
    { id: 'a321-sub-wide', name: 'A321 + Subcharter Option 3 (Widebody)', legs: ['A321', 'SUB Widebody'] },
    { id: 'a321n-sub-wide', name: 'A321N + Subcharter Option 3 (Widebody)', legs: ['A321N', 'SUB Widebody'] },
  ],
}

const DEFAULT_SEATS_BY_AIRCRAFT = OWN_AIRCRAFT.reduce<
  Record<Exclude<AircraftType, 'SUB Narrowbody' | 'SUB Widebody'>, number>
>(
  (acc, aircraft) => {
    const rows = ROUTES.map((route) => route.byAircraft[aircraft]).filter((item): item is AircraftRouteData => Boolean(item))
    const seatsAvg = rows.length ? rows.reduce((sum, item) => sum + item.seats, 0) / rows.length : 0
    acc[aircraft] = aircraft === 'A321N' ? 218 : Math.round(seatsAvg)
    return acc
  },
  {
    A321: 0,
    A321N: 0,
    A339: 0,
  },
)

function emptyLeg(): RouteLegInput {
  return { from: '', depUtc: '', arrUtc: '', to: '', pax: '' }
}

function emptyOwnBaseLine(): OwnBaseLineInput {
  return { enabled: false, applyToAllResults: false, aircraft: '', leg: emptyLeg() }
}

function emptySubBaseLine(): SubBaseLineInput {
  return { enabled: false, applyToAllResults: false, leg: emptyLeg() }
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
  const [showBaselinePanel, setShowBaselinePanel] = useState(false)
  const [selectedBaselineAircraft, setSelectedBaselineAircraft] = useState<BaselineAircraftKey>('A321')
  const isToolMode = form.enableAcmiModule || form.enableAdhocModule
  const [baselineByAircraft, setBaselineByAircraft] = useState<Record<BaselineAircraftKey, BaselineAircraftParameters>>(() => {
    const fromDefault = (aircraftCode: 'A321' | 'A321N' | 'A339' | 'SUB_NARROWBODY'): BaselineAircraftParameters => {
      const componentPerBlhRaw = data.aircraftComponentDefaults?.[aircraftCode]?.componentPerBlh ?? {}
      const componentsPerBlh = DOC_COMPONENT_KEYS.reduce(
        (acc, key) => {
          acc[key] = roundToTwo(Number(componentPerBlhRaw[key] ?? 0))
          return acc
        },
        {} as Record<BaselineComponentKey, number>,
      )
      const blh = roundToTwo(Number(data.aircraftComponentDefaults?.[aircraftCode]?.avgBlh ?? 0) || 0)
      return { blh, componentsPerBlh }
    }

    const a321 = fromDefault('A321')
    const a321n = fromDefault('A321N')
    const a339 = fromDefault('A339')
    const subNarrow = fromDefault('SUB_NARROWBODY')
    const subWide = { ...a339, componentsPerBlh: { ...a339.componentsPerBlh } }

    return {
      A321: a321,
      A321N: a321n,
      A339: a339,
      'SUB Narrowbody': subNarrow,
      'SUB Widebody': subWide,
    }
  })
  const ownDocPerBlhByAircraft = useMemo(
    () => ({
      A321: sumComponentsPerBlh(baselineByAircraft.A321.componentsPerBlh),
      A321N: sumComponentsPerBlh(baselineByAircraft.A321N.componentsPerBlh),
      A339: sumComponentsPerBlh(baselineByAircraft.A339.componentsPerBlh),
    }),
    [baselineByAircraft],
  )
  const acmiDocPerBlhByAircraft = useMemo(
    () => ({
      A321: Math.max(
        0,
        sumComponentsPerBlh(baselineByAircraft.A321.componentsPerBlh) -
          (baselineByAircraft.A321.componentsPerBlh.fuel ?? 0) -
          (baselineByAircraft.A321.componentsPerBlh.handling ?? 0) -
          (baselineByAircraft.A321.componentsPerBlh.turnaroundAircraft ?? 0) -
          (baselineByAircraft.A321.componentsPerBlh.turnaroundPax ?? 0),
      ),
      A321N: Math.max(
        0,
        sumComponentsPerBlh(baselineByAircraft.A321N.componentsPerBlh) -
          (baselineByAircraft.A321N.componentsPerBlh.fuel ?? 0) -
          (baselineByAircraft.A321N.componentsPerBlh.handling ?? 0) -
          (baselineByAircraft.A321N.componentsPerBlh.turnaroundAircraft ?? 0) -
          (baselineByAircraft.A321N.componentsPerBlh.turnaroundPax ?? 0),
      ),
      A339: Math.max(
        0,
        sumComponentsPerBlh(baselineByAircraft.A339.componentsPerBlh) -
          (baselineByAircraft.A339.componentsPerBlh.fuel ?? 0) -
          (baselineByAircraft.A339.componentsPerBlh.handling ?? 0) -
          (baselineByAircraft.A339.componentsPerBlh.turnaroundAircraft ?? 0) -
          (baselineByAircraft.A339.componentsPerBlh.turnaroundPax ?? 0),
      ),
    }),
    [baselineByAircraft],
  )
  const subNonMaintDocPerBlh = useMemo(
    () => ({
      'SUB Narrowbody': nonMaintComponentsPerBlh(baselineByAircraft['SUB Narrowbody'].componentsPerBlh),
      'SUB Widebody': nonMaintComponentsPerBlh(baselineByAircraft['SUB Widebody'].componentsPerBlh),
    }),
    [baselineByAircraft],
  )
  const ownBlhDefaults = useMemo(
    () => ({
      A321: baselineByAircraft.A321.blh,
      A321N: baselineByAircraft.A321N.blh,
      A339: baselineByAircraft.A339.blh,
    }),
    [baselineByAircraft],
  )
  const ownSeatDefaults = useMemo(
    () => ({
      A321: DEFAULT_SEATS_BY_AIRCRAFT.A321,
      A321N: DEFAULT_SEATS_BY_AIRCRAFT.A321N,
      A339: DEFAULT_SEATS_BY_AIRCRAFT.A339,
    }),
    [],
  )
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
    const maxLegPax = activeLegs.reduce((max, leg) => Math.max(max, typeof leg.pax === 'number' ? leg.pax : 0), 0)
    const enabledSingleCapacities: number[] = []
    if (form.enableOwnScaFlights) {
      if (form.ownAvailableA321 > 0) enabledSingleCapacities.push(ownSeatDefaults.A321)
      if (form.ownAvailableA321N > 0) enabledSingleCapacities.push(ownSeatDefaults.A321N)
      if (form.ownAvailableA339 > 0) enabledSingleCapacities.push(ownSeatDefaults.A339)
    }
    if (form.enableSubOption1) enabledSingleCapacities.push(form.subCharter1Seats)
    if (form.enableSubOption2) enabledSingleCapacities.push(form.subCharter2Seats)
    if (form.enableSubOption3) enabledSingleCapacities.push(form.subCharter3Seats)
    const shouldHideComboScenarios =
      maxLegPax > 0 && enabledSingleCapacities.some((capacity) => capacity >= maxLegPax)

    return scenarioOptions.flatMap((option) => {
      const hasNarrow = option.legs.includes('SUB Narrowbody')
      const hasWide = option.legs.includes('SUB Widebody')
      const hasOwn = option.legs.some((leg) => leg !== 'SUB Narrowbody' && leg !== 'SUB Widebody')
      const isCombinationOption = option.legs.length > 1
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
      if (isCombinationOption && shouldHideComboScenarios) return []
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
    ownSeatDefaults,
    form.subCharter1Seats,
    form.subCharter2Seats,
    form.subCharter3Seats,
    form.enableSubOption1,
    form.enableSubOption2,
    form.enableSubOption3,
    activeLegs,
    scenarioOptions,
  ])

  const firstOrigin = activeLegs[0]?.from ?? ''
  const finalDestination = activeLegs[activeLegs.length - 1]?.to ?? ''
  const scenarioOptionById = useMemo(
    () => new Map(availableScenarioOptions.map((option) => [option.id, option])),
    [availableScenarioOptions],
  )

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
      const timeBlh = durationHoursFromUtcTimes(leg.depUtc, leg.arrUtc)

      if (timeBlh && timeBlh > 0) {
        return { label: `Leg ${idx + 1}`, from: leg.from, to: leg.to, blh: timeBlh, source: 'time' }
      }

      const fallback = ownBlhDefaults[selectedOriginalType]
      return { label: `Leg ${idx + 1}`, from: leg.from, to: leg.to, blh: fallback, source: 'fallback' }
    })
  }, [activeLegs, form.originalType, ownBlhDefaults, selectedOriginalType])

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
    const originalDocPerBlh = ownDocPerBlhByAircraft[selectedOriginalType]
    const originalMainBlhTotal = activeLegs.reduce((sum, leg) => {
      const timeBlh = durationHoursFromUtcTimes(leg.depUtc, leg.arrUtc)
      if (timeBlh && timeBlh > 0) return sum + timeBlh
      return sum + ownBlhDefaults[selectedOriginalType]
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
        const ownGlobalLinesByAircraft = {
          A321: enabledOwnLines.filter((candidate) => candidate.aircraft === 'A321' && candidate.applyToAllResults),
          A321N: enabledOwnLines.filter((candidate) => candidate.aircraft === 'A321N' && candidate.applyToAllResults),
          A339: enabledOwnLines.filter((candidate) => candidate.aircraft === 'A339' && candidate.applyToAllResults),
        }
        const subWideCounter = { count: 0 }
        const subNarrowCounters: Record<1 | 2, number> = { 1: 0, 2: 0 }
        let subNarrowLegCounter = 0
        const subNarrowLinesByOption: Record<1 | 2, EnabledSubCharterLine[]> = {
          1: enabledSubLines.filter((candidate) => candidate.subType === 'SUB Narrowbody' && candidate.charter === 1),
          2: enabledSubLines.filter((candidate) => candidate.subType === 'SUB Narrowbody' && candidate.charter === 2),
        }
        const subWideLines = enabledSubLines.filter((candidate) => candidate.subType === 'SUB Widebody')
        const subGlobalLinesByOption: Record<1 | 2 | 3, EnabledSubCharterLine[]> = {
          1: enabledSubLines.filter(
            (candidate) => candidate.subType === 'SUB Narrowbody' && candidate.charter === 1 && candidate.applyToAllResults,
          ),
          2: enabledSubLines.filter(
            (candidate) => candidate.subType === 'SUB Narrowbody' && candidate.charter === 2 && candidate.applyToAllResults,
          ),
          3: enabledSubLines.filter(
            (candidate) => candidate.subType === 'SUB Widebody' && candidate.charter === 3 && candidate.applyToAllResults,
          ),
        }
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

          const fallbackDefaults = !isSub ? { blh: ownBlhDefaults[aircraft], docPerBlh: ownDocPerBlhByAircraft[aircraft], seats: ownSeatDefaults[aircraft] } : undefined
          const forcedOptionByLeg =
            aircraft === 'SUB Narrowbody' && currentSubTypeLegIndex >= 0
              ? option.forcedSubNarrowbodyOptions?.[currentSubTypeLegIndex]
              : undefined
          const subFallbackBlh = aircraft === 'SUB Widebody' ? baselineByAircraft['SUB Widebody'].blh : baselineByAircraft['SUB Narrowbody'].blh
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
            const timeBlh = durationHoursFromUtcTimes(leg.depUtc, leg.arrUtc)
            if (timeBlh && timeBlh > 0) {
              return sum + timeBlh
            }
            return sum + fallbackBlh
          }, 0)

          let positioningBlhOneWay = line ? durationHoursFromUtcTimes(line.leg.depUtc, line.leg.arrUtc) ?? 0 : 0
          if (currentSubType && currentSubTypeLegIndex === 0) {
            const extraPositioningBlh = (() => {
              const extraLines =
                currentSubType === 'SUB Narrowbody'
                  ? subNarrowLinesByOption[
                      option.forcedSubNarrowbodyOptions?.[0] ?? option.forcedSubNarrowbodyOption ?? 1
                    ].slice(subScenarioLegCountByType[currentSubType])
                  : subWideLines.slice(subScenarioLegCountByType[currentSubType])
              return extraLines.reduce(
                (sum, extraLine) => sum + (durationHoursFromUtcTimes(extraLine.leg.depUtc, extraLine.leg.arrUtc) ?? 0),
                0,
              )
            })()
            positioningBlhOneWay += extraPositioningBlh
          } else if (!isSub && currentOwnTypeLegIndex === 0) {
            const ownAircraft = aircraft as Exclude<AircraftType, 'SUB Narrowbody' | 'SUB Widebody'>
            const extraOwnPositioningBlh = ownLinesByAircraft[ownAircraft]
              .slice(ownScenarioLegCountByAircraft[ownAircraft])
              .reduce((sum, extraLine) => sum + (durationHoursFromUtcTimes(extraLine.leg.depUtc, extraLine.leg.arrUtc) ?? 0), 0)
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
              const timeBlh = durationHoursFromUtcTimes(leg.depUtc, leg.arrUtc)
              const legHours = timeBlh && timeBlh > 0 ? timeBlh : fallbackBlh
              const nonMaintPerBlh = subNonMaintDocPerBlh[aircraft]
              return sum + legHours * nonMaintPerBlh
            }, 0)
            const positioningNonMaintDocCostDkk = positioningBlhOneWay * 2 * subNonMaintDocPerBlh[aircraft]
            cost = charterCostDkk + subNonMaintDocCostDkk + positioningNonMaintDocCostDkk
            if (aircraft === 'SUB Widebody') {
              usedSubAddOnCounts.opt3 += 1
            } else if (effectiveNarrowOption === 2) {
              usedSubAddOnCounts.opt2 += 1
            } else {
              usedSubAddOnCounts.opt1 += 1
            }
          } else {
            const docPerBlh = fallbackDefaults?.docPerBlh ?? 0
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

        const ownScenarioHasType = {
          A321: option.legs.includes('A321'),
          A321N: option.legs.includes('A321N'),
          A339: option.legs.includes('A339'),
        }
        const ownGlobalAppliedByAircraft: Record<'A321' | 'A321N' | 'A339', { blh: number; cost: number }> = {
          A321: { blh: 0, cost: 0 },
          A321N: { blh: 0, cost: 0 },
          A339: { blh: 0, cost: 0 },
        }
        ;(['A321', 'A321N', 'A339'] as const).forEach((aircraft) => {
          if (ownScenarioHasType[aircraft]) return
          ownGlobalLinesByAircraft[aircraft].forEach((line) => {
            const blh = durationHoursFromUtcTimes(line.leg.depUtc, line.leg.arrUtc) ?? 0
            if (blh <= 0) return
            const lineCost = blh * 2 * ownDocPerBlhByAircraft[aircraft]
            operatingCost += lineCost
            ownGlobalAppliedByAircraft[aircraft].blh += blh
            ownGlobalAppliedByAircraft[aircraft].cost += lineCost
          })
        })

        const narrowOptionsUsed = Array.from(subNarrowbodyOptionsUsed)
        const subScenarioUsesOption: Record<1 | 2 | 3, boolean> = {
          1: narrowOptionsUsed.includes(1),
          2: narrowOptionsUsed.includes(2),
          3: option.legs.includes('SUB Widebody'),
        }
        const subGlobalAppliedByOption: Record<1 | 2 | 3, { blh: number; cost: number }> = {
          1: { blh: 0, cost: 0 },
          2: { blh: 0, cost: 0 },
          3: { blh: 0, cost: 0 },
        }
        ;([1, 2, 3] as const).forEach((opt) => {
          if (subScenarioUsesOption[opt]) return
          subGlobalLinesByOption[opt].forEach((line) => {
            const blh = durationHoursFromUtcTimes(line.leg.depUtc, line.leg.arrUtc) ?? 0
            if (blh <= 0) return
            const subType = opt === 3 ? 'SUB Widebody' : 'SUB Narrowbody'
            const subBlhCostEur = opt === 3 ? sub3BlhCostEur : opt === 2 ? sub2BlhCostEur : sub1BlhCostEur
            const lineCost = blh * 2 * (subBlhCostEur * form.eurToDkkRate + subNonMaintDocPerBlh[subType])
            operatingCost += lineCost
            subGlobalAppliedByOption[opt].blh += blh
            subGlobalAppliedByOption[opt].cost += lineCost
          })
        })

        // Apply own "add to all" lines to sub scenarios as well.
        if (subLegCount > 0) {
          ;(['A321', 'A321N', 'A339'] as const).forEach((aircraft) => {
            ownGlobalLinesByAircraft[aircraft].forEach((line) => {
              const blh = durationHoursFromUtcTimes(line.leg.depUtc, line.leg.arrUtc) ?? 0
              if (blh <= 0) return
              const lineCost = blh * 2 * ownDocPerBlhByAircraft[aircraft]
              operatingCost += lineCost
              ownGlobalAppliedByAircraft[aircraft].blh += blh
              ownGlobalAppliedByAircraft[aircraft].cost += lineCost
            })
          })
        }

        // Apply sub "add to all" lines to own-only scenarios as well.
        if (hasOwnAircraftLeg && subLegCount === 0) {
          ;([1, 2, 3] as const).forEach((opt) => {
            subGlobalLinesByOption[opt].forEach((line) => {
              const blh = durationHoursFromUtcTimes(line.leg.depUtc, line.leg.arrUtc) ?? 0
              if (blh <= 0) return
              const subType = opt === 3 ? 'SUB Widebody' : 'SUB Narrowbody'
              const subBlhCostEur = opt === 3 ? sub3BlhCostEur : opt === 2 ? sub2BlhCostEur : sub1BlhCostEur
              const lineCost = blh * 2 * (subBlhCostEur * form.eurToDkkRate + subNonMaintDocPerBlh[subType])
              operatingCost += lineCost
              subGlobalAppliedByOption[opt].blh += blh
              subGlobalAppliedByOption[opt].cost += lineCost
            })
          })
        }

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
        const eu261BandSource: 'excel_distance' | 'manual_fallback' = 'manual_fallback'
        const eu261CostEur = eu261ImpactedPax * eu261BandEur
        const eu261CostDkk = eu261CostEur * form.eurToDkkRate

        const ownCrewCost =
          hasOwnAircraftLeg
            ? form.crewCostFcDays * form.crewCostFcDkkPerDay +
              form.crewCostFoDays * form.crewCostFoDkkPerDay +
              form.crewCostCabinDays * form.crewCostCabinDkkPerDay
            : 0
        const subCabinSdCost = subLegCount > 0 ? form.crewCostCabinSdDays * form.crewCostCabinSdDkkPerDay : 0
        const crewCost = ownCrewCost + subCabinSdCost
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

        if (crewCost > 0) {
          details.push(`Crew cost (once per solution): ${toCurrency(crewCost)}`)
          if (ownCrewCost > 0) {
            details.push(`Own crew cost (FC/FO/Cabin): ${toCurrency(ownCrewCost)}`)
          }
          if (subCabinSdCost > 0) {
            details.push(`Subcharter crew cost (Cabin SD): ${toCurrency(subCabinSdCost)}`)
          }
        }
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
        ;(['A321', 'A321N', 'A339'] as const).forEach((aircraft) => {
          const applied = ownGlobalAppliedByAircraft[aircraft]
          if (applied.blh > 0) {
            details.push(
              `Global own posi from ${aircraft}: ${applied.blh.toFixed(2)} BLH -> ${toCurrency(applied.cost)} (applied to other results only).`,
            )
          }
        })
        ;([1, 2, 3] as const).forEach((opt) => {
          const applied = subGlobalAppliedByOption[opt]
          if (applied.blh > 0) {
            const optionLabel = opt === 3 ? 'Option 3 (Widebody)' : `Option ${opt} (Narrowbody)`
            details.push(
              `Global sub posi from ${optionLabel}: ${applied.blh.toFixed(2)} BLH -> ${toCurrency(applied.cost)} (applied to other results only).`,
            )
          }
        })
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
    baselineByAircraft,
    ownBlhDefaults,
    ownDocPerBlhByAircraft,
    ownSeatDefaults,
    subNonMaintDocPerBlh,
    primaryRouteInfo,
    availableScenarioOptions,
  ])

  const cheapest = results[0]

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function toggleAcmiTool() {
    setForm((prev) => {
      const enable = !prev.enableAcmiModule
      return {
        ...prev,
        enableAcmiModule: enable,
        enableAdhocModule: enable ? false : prev.enableAdhocModule,
      }
    })
  }

  function toggleAdhocTool() {
    setForm((prev) => {
      const enable = !prev.enableAdhocModule
      return {
        ...prev,
        enableAdhocModule: enable,
        enableAcmiModule: enable ? false : prev.enableAcmiModule,
      }
    })
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

  function updateOwnBaseLine(
    index: number,
    updates: {
      enabled?: boolean
      applyToAllResults?: boolean
      aircraft?: '' | Exclude<AircraftType, 'SUB Narrowbody' | 'SUB Widebody'>
      leg?: Partial<RouteLegInput>
    },
  ) {
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

  function updateSubBaseLine(
    type: 'sub1' | 'sub2' | 'sub3',
    index: number,
    updates: { enabled?: boolean; applyToAllResults?: boolean; leg?: Partial<RouteLegInput> },
  ) {
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
      const blh = durationHoursFromUtcTimes(line.leg.depUtc, line.leg.arrUtc) ?? ownBlhDefaults[aircraft]
      const docPerBlh = acmiDocPerBlhByAircraft[aircraft]
      const lineCost = blh * docPerBlh
      const excludedPerBlh = 0

      totalBlh += blh
      operatingCost += lineCost
      details.push(
        `ACMI leg ${index + 1} (${aircraft}): ${blh.toFixed(2)} BLH * ${docPerBlh.toFixed(2)} = ${toCurrency(lineCost)}`,
      )
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
    acmiDocPerBlhByAircraft,
    ownBlhDefaults,
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
      const blh = durationHoursFromUtcTimes(line.leg.depUtc, line.leg.arrUtc) ?? ownBlhDefaults[aircraft]
      const docPerBlh = ownDocPerBlhByAircraft[aircraft]
      const lineCost = blh * docPerBlh

      totalBlh += blh
      operatingCost += lineCost
      details.push(
        `Adhoc leg ${index + 1} (${aircraft}): ${blh.toFixed(2)} BLH * ${docPerBlh.toFixed(2)} = ${toCurrency(lineCost)}`,
      )
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
    ownBlhDefaults,
    ownDocPerBlhByAircraft,
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

  function getFallbackAircraftForAudit(aircraft: AircraftType): Exclude<AircraftType, 'SUB Narrowbody' | 'SUB Widebody'> {
    if (aircraft === 'SUB Widebody') return 'A339'
    return 'A321'
  }

  function getDefaultComponentPerBlhForAudit(
    aircraft: AircraftType,
  ): Partial<Record<keyof NonNullable<AircraftRouteData['docComponents']>, number>> {
    if (aircraft === 'SUB Widebody') {
      return baselineByAircraft['SUB Widebody'].componentsPerBlh
    }
    if (aircraft === 'SUB Narrowbody') {
      return baselineByAircraft['SUB Narrowbody'].componentsPerBlh
    }
    return baselineByAircraft[aircraft].componentsPerBlh
  }

  function getAuditComponentSummary(
    aircraft: AircraftType,
    legs: Array<Pick<RouteLegInput, 'from' | 'to' | 'depUtc' | 'arrUtc'>>,
  ): AuditComponentSummary {
    const componentTotals = DOC_COMPONENT_KEYS.reduce(
      (acc, key) => {
        acc[key] = 0
        return acc
      },
      {} as Record<keyof NonNullable<AircraftRouteData['docComponents']>, number>,
    )

    let blhTotal = 0
    let docTotal = 0
    let fallbackLegCount = 0

    legs.forEach((leg) => {
      const fallbackAircraft = getFallbackAircraftForAudit(aircraft)
      const fallbackBlh =
        aircraft === 'SUB Narrowbody'
          ? baselineByAircraft['SUB Narrowbody'].blh
          : aircraft === 'SUB Widebody'
            ? baselineByAircraft['SUB Widebody'].blh
            : ownBlhDefaults[fallbackAircraft]
      const fallbackDocPerBlh =
        aircraft === 'SUB Narrowbody'
          ? sumComponentsPerBlh(baselineByAircraft['SUB Narrowbody'].componentsPerBlh)
          : aircraft === 'SUB Widebody'
            ? sumComponentsPerBlh(baselineByAircraft['SUB Widebody'].componentsPerBlh)
            : ownDocPerBlhByAircraft[fallbackAircraft]
      const blh = durationHoursFromUtcTimes(leg.depUtc, leg.arrUtc) ?? fallbackBlh
      const doc = blh * fallbackDocPerBlh

      blhTotal += blh
      docTotal += doc

      const defaultPerBlh = getDefaultComponentPerBlhForAudit(aircraft)
      DOC_COMPONENT_KEYS.forEach((key) => {
        const perBlh = defaultPerBlh[key] ?? 0
        componentTotals[key] += perBlh * blh
      })
      fallbackLegCount += 1
    })

    return { blhTotal, docTotal, componentTotals, fallbackLegCount }
  }

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
            <div className="admin-tools-box">
              <h3>Admin Tools</h3>
              <div className="admin-tools-row">
                <button
                  type="button"
                  className={form.enableAcmiModule ? 'tool-toggle-btn active' : 'tool-toggle-btn'}
                  onClick={(event) => {
                    event.currentTarget.blur()
                    toggleAcmiTool()
                  }}
                >
                  ACMI
                </button>
                <button
                  type="button"
                  className={form.enableAdhocModule ? 'tool-toggle-btn active' : 'tool-toggle-btn'}
                  onClick={(event) => {
                    event.currentTarget.blur()
                    toggleAdhocTool()
                  }}
                >
                  Adhoc
                </button>
                <button
                  type="button"
                  className={showBaselinePanel ? 'tool-toggle-btn active' : 'tool-toggle-btn'}
                  onClick={(event) => {
                    event.currentTarget.blur()
                    setShowBaselinePanel((prev) => !prev)
                  }}
                >
                  Baseline parameters
                </button>
              </div>
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

        {showBaselinePanel ? (
          <div className="settings-box section-card">
            <h3>Baseline parameters</h3>
            <div className="grid compact">
              <label>
                Aircraft
                <select
                  value={selectedBaselineAircraft}
                  onChange={(event) => setSelectedBaselineAircraft(event.target.value as BaselineAircraftKey)}
                >
                  {BASELINE_AIRCRAFT_OPTIONS.map((aircraft) => (
                    <option key={`baseline-air-${aircraft}`} value={aircraft}>
                      {aircraft}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                BLH default
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={baselineByAircraft[selectedBaselineAircraft].blh}
                  onChange={(event) =>
                    setBaselineByAircraft((prev) => ({
                      ...prev,
                      [selectedBaselineAircraft]: {
                        ...prev[selectedBaselineAircraft],
                        blh: roundToTwo(Number(event.target.value) || 0),
                      },
                    }))
                  }
                />
              </label>
            </div>
            <div className="baseline-params-grid">
              {DOC_COMPONENT_KEYS.map((key) => (
                <label key={`baseline-param-${selectedBaselineAircraft}-${key}`}>
                  {DOC_COMPONENT_LABELS[key]} (DKK/BLH)
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={baselineByAircraft[selectedBaselineAircraft].componentsPerBlh[key]}
                    onChange={(event) => {
                      const value = roundToTwo(Number(event.target.value) || 0)
                      setBaselineByAircraft((prev) => ({
                        ...prev,
                        [selectedBaselineAircraft]: {
                          ...prev[selectedBaselineAircraft],
                          componentsPerBlh: {
                            ...prev[selectedBaselineAircraft].componentsPerBlh,
                            [key]: value,
                          },
                        },
                      }))
                    }}
                  />
                </label>
              ))}
            </div>
          </div>
        ) : null}

        {!showBaselinePanel && !isToolMode ? (
          <>
            <div className="settings-box section-card">
              <details>
                <summary>How to use the main tool</summary>
                <p>
                  The main tool compares realistic recovery scenarios for one disrupted operation based on aircraft choice, route setup,
                  capacity, positioning needs, and selected commercial assumptions.
                </p>
                <ul>
                  <li>
                    Set <strong>Original aircraft type</strong>, then enter the disrupted operation in <strong>Route (UTC)</strong> with
                    From, STD, STA, To, and Pax per leg.
                  </li>
                  <li>
                    For each city pair, enter valid <strong>UTC times (STD/STA)</strong> to get relevant BLH calculations.
                  </li>
                  <li>
                    The entered original route (including BLH and operating cost components) is used as the common baseline in all scenarios,
                    and each result is shown as a difference versus that original baseline.
                  </li>
                  <li>
                    Under <strong>Enabled options</strong>, choose which solution groups should be considered in the result list.
                  </li>
                  <li>
                    In <strong>SCA extra positioning flights</strong>, add own-fleet positioning legs and set aircraft type per line. Use{' '}
                    <strong>Add to all results</strong> when that positioning impact should also be reflected in other scenarios.
                  </li>
                  <li>
                    In <strong>Subcharter Option 1/2/3</strong>, enter BLH rate, seats, positioning legs, and optional add-ons such as HOTAC
                    and crew per diem.
                  </li>
                  <li>
                    You can add <strong>Crew cost</strong> for own-aircraft solutions by entering purchased days and daily rates per crew role.
                    These settings allow you to model the operational impact of buying extra days.
                  </li>
                  <li>
                    <strong>Overflow</strong> is automatic: if scenario seat capacity is below requested Pax, overflow is created per leg and
                    valued with your <strong>Expected overflow cost per pax</strong>.
                  </li>
                  <li>
                    You can tune compensation exposure with <strong>Pax seeking compensation (%)</strong> and enable <strong>EU261</strong> per
                    scenario leg directly in result cards.
                  </li>
                  <li>
                    You can model sub-solution quality impact with <strong>NPS detractor per pax on sub (DKK)</strong>.
                  </li>
                  <li>
                    Result cards show difference versus original, capacity, overflow, and full trace in <strong>Cost details</strong>, making
                    scenario comparison transparent.
                  </li>
                  <li>
                    <strong>Best option</strong> highlights the lowest evaluated cost among currently enabled and valid scenarios.
                  </li>
                </ul>
                <p>
                  <strong>Example (full walkthrough):</strong> Choose original type <strong>A321N</strong>, enter Leg 1 ARN-PMI and Leg 2
                  PMI-ARN with pax demand. Enable spare SCA aircraft and set one available <strong>A321</strong> and one <strong>A339</strong>.
                  Add one active A321 positioning leg (for instance BLL-ARN) and mark <strong>Add to all results</strong> to test broader
                  operational impact. Then enable Subcharter Option 1 and add one active positioning leg plus HOTAC/crew per diem if relevant.
                  Finally, adjust <strong>Expected overflow cost per pax</strong>, <strong>Pax seeking compensation (%)</strong>, and{' '}
                  <strong>NPS detractor per pax on sub</strong>. Compare result cards to see how ranking changes when overflow pressure,
                  compensation exposure, and sub-penalty assumptions move.
                </p>
              </details>
            </div>

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

        {form.enableOwnScaFlights && !isToolMode && !showBaselinePanel ? (
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
                <label className="mini-check">
                  <input
                    type="checkbox"
                    checked={line.applyToAllResults}
                    onChange={(event) => updateOwnBaseLine(idx, { applyToAllResults: event.target.checked })}
                    disabled={!line.enabled}
                  />
                  Add to all results
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

        {form.enableSubOption1 && !isToolMode && !showBaselinePanel ? (
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
                <label className="mini-check">
                  <input
                    type="checkbox"
                    checked={line.applyToAllResults}
                    onChange={(event) => updateSubBaseLine('sub1', idx, { applyToAllResults: event.target.checked })}
                    disabled={!line.enabled}
                  />
                  Add to all results
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

        {form.enableSubOption2 && !isToolMode && !showBaselinePanel ? (
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
                <label className="mini-check">
                  <input
                    type="checkbox"
                    checked={line.applyToAllResults}
                    onChange={(event) => updateSubBaseLine('sub2', idx, { applyToAllResults: event.target.checked })}
                    disabled={!line.enabled}
                  />
                  Add to all results
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

        {form.enableSubOption3 && !isToolMode && !showBaselinePanel ? (
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
                <label className="mini-check">
                  <input
                    type="checkbox"
                    checked={line.applyToAllResults}
                    onChange={(event) => updateSubBaseLine('sub3', idx, { applyToAllResults: event.target.checked })}
                    disabled={!line.enabled}
                  />
                  Add to all results
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

        {form.enableAcmiModule && !showBaselinePanel ? (
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

        {form.enableAdhocModule && !showBaselinePanel ? (
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

        {!showBaselinePanel ? (
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
        ) : null}
      </section>

      {!showBaselinePanel ? (
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
      ) : null}
      </div>

      {!showBaselinePanel ? (
      <section className="panel audit-panel">
        <details>
          <summary>Audit - detailed calculation trace</summary>
          {!isToolMode ? (
            <div className="audit-body">
              {form.originalType && activeLegs.length > 0 ? (
                <div className="audit-block">
                  <h3>Original baseline ({form.originalType})</h3>
                  <p>EUR to DKK: {form.eurToDkkRate.toFixed(2)}</p>
                  {(() => {
                    const baselineSummary = getAuditComponentSummary(selectedOriginalType, activeLegs)
                    return (
                      <ul className="audit-kv-list">
                        <li>BLH total: {baselineSummary.blhTotal.toFixed(2)}</li>
                        <li>DOC total: {toCurrency(baselineSummary.docTotal)}</li>
                        {DOC_COMPONENT_KEYS.map((key) => (
                          <li key={`audit-baseline-${key}`}>
                            {DOC_COMPONENT_LABELS[key]}: {toCurrency(baselineSummary.componentTotals[key])}
                          </li>
                        ))}
                      </ul>
                    )
                  })()}
                  <ul>
                    {activeLegs.map((leg, idx) => {
                      const blh =
                        durationHoursFromUtcTimes(leg.depUtc, leg.arrUtc) ??
                        ownBlhDefaults[selectedOriginalType]
                      const doc = blh * ownDocPerBlhByAircraft[selectedOriginalType]
                      return (
                        <li key={`audit-original-leg-${idx}`}>
                          Leg {idx + 1} {leg.from}-{leg.to}: BLH {blh.toFixed(2)}, DOC {toCurrency(doc)}, Pax {leg.pax}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ) : null}

              {results.map((result) => {
                const option = scenarioOptionById.get(result.id)
                const optionLegs = option?.legs ?? []
                return (
                  <div className="audit-block" key={`audit-result-${result.id}`}>
                    <h3>{result.name}</h3>
                    <p>Difference vs original: {toSignedDkkDelta(result.evaluatedTotalDkk)}</p>
                    <p>Overflow cost: {toCurrency(result.overflowCost)}</p>
                    <p>EU261 (separate): {toEur(result.eu261CostEur)}</p>
                    <details>
                      <summary>Result formula details</summary>
                      <ul>
                        {result.details.map((line) => (
                          <li key={`${result.id}-${line}`}>{line}</li>
                        ))}
                      </ul>
                    </details>
                    {optionLegs.length > 0 ? (
                      <details>
                        <summary>Excel component reference (for scenario aircraft)</summary>
                        {Array.from(new Set(optionLegs)).map((aircraft) => (
                          <div key={`${result.id}-${aircraft}`} className="audit-mini-block">
                            <strong>{aircraft}</strong>
                            {(() => {
                              const aircraftSummary = getAuditComponentSummary(aircraft, activeLegs)
                              return (
                                <ul className="audit-kv-list">
                                  <li>BLH total: {aircraftSummary.blhTotal.toFixed(2)}</li>
                                  <li>DOC total: {toCurrency(aircraftSummary.docTotal)}</li>
                                  {DOC_COMPONENT_KEYS.map((key) => (
                                    <li key={`${result.id}-${aircraft}-sum-${key}`}>
                                      {DOC_COMPONENT_LABELS[key]}: {toCurrency(aircraftSummary.componentTotals[key])}
                                    </li>
                                  ))}
                                </ul>
                              )
                            })()}
                            <ul>
                              {activeLegs.map((leg, idx) => {
                                const fallbackAircraft = getFallbackAircraftForAudit(aircraft)
                                const blh =
                                  durationHoursFromUtcTimes(leg.depUtc, leg.arrUtc) ??
                                  (aircraft === 'SUB Narrowbody'
                                    ? baselineByAircraft['SUB Narrowbody'].blh
                                    : aircraft === 'SUB Widebody'
                                      ? baselineByAircraft['SUB Widebody'].blh
                                      : ownBlhDefaults[fallbackAircraft])
                                const defaultPerBlh = getDefaultComponentPerBlhForAudit(aircraft)
                                const components = DOC_COMPONENT_KEYS.reduce(
                                  (acc, key) => {
                                    acc[key] = (defaultPerBlh[key] ?? 0) * blh
                                    return acc
                                  },
                                  {} as Record<keyof NonNullable<AircraftRouteData['docComponents']>, number>,
                                )
                                const line = DOC_COMPONENT_KEYS.map((key) => `${DOC_COMPONENT_LABELS[key]} ${Math.round(components[key])}`).join(', ')
                                return (
                                  <li key={`${result.id}-${aircraft}-leg-${idx}`}>
                                    Leg {idx + 1} {leg.from}-{leg.to}: {line}
                                  </li>
                                )
                              })}
                            </ul>
                          </div>
                        ))}
                      </details>
                    ) : null}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="audit-body">
              {form.enableAcmiModule && acmiBreakdown ? (
                <div className="audit-block">
                  <h3>ACMI Audit</h3>
                  <p>Total BLH: {acmiBreakdown.totalBlh.toFixed(2)}</p>
                  <p>Total cost: {toCurrency(acmiBreakdown.totalCostDkk)}</p>
                  <p>Minimum BLH (DKK): {toCurrency(acmiBreakdown.minimumBlhDkk)}</p>
                  <p>Minimum BLH (EUR): {toEur(acmiBreakdown.minimumBlhEur)}</p>
                  <ul>
                    {acmiBreakdown.details.map((line) => (
                      <li key={`acmi-audit-${line}`}>{line}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {form.enableAdhocModule && adhocBreakdown ? (
                <div className="audit-block">
                  <h3>Adhoc Audit</h3>
                  <p>Total BLH: {adhocBreakdown.totalBlh.toFixed(2)}</p>
                  <p>Total cost before margin: {toCurrency(adhocBreakdown.totalCostDkk)}</p>
                  <p>Minimum total (DKK): {toCurrency(adhocBreakdown.minimumTotalDkk)}</p>
                  <p>Minimum total (EUR): {toEur(adhocBreakdown.minimumTotalEur)}</p>
                  <ul>
                    {adhocBreakdown.details.map((line) => (
                      <li key={`adhoc-audit-${line}`}>{line}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          )}
        </details>
      </section>
      ) : null}
    </main>
  )
}

export default App
