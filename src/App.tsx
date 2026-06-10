import { useEffect, useMemo, useRef, useState } from 'react'
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
  pax: number | '' | 'NA'
  blh: string
}

type OwnBaseLineInput = {
  enabled: boolean
  applyToAllResults: boolean
  manualBlh: string
  manualBlhOverride: boolean
  flightNumber: string
  departureDate: string
  aircraft: '' | Exclude<AircraftType, 'SUB Narrowbody' | 'SUB Widebody'>
  leg: RouteLegInput
}

type SubBaseLineInput = {
  enabled: boolean
  applyToAllResults: boolean
  manualBlh: string
  manualBlhOverride: boolean
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
  acmiAircraft: '' | Exclude<AircraftType, 'SUB Narrowbody' | 'SUB Widebody'>
  adhocAircraft: '' | Exclude<AircraftType, 'SUB Narrowbody' | 'SUB Widebody'>
  acmiHotacNights: number
  acmiCrewPerDiemOperatingDays: number
  adhocCrewPerDiemOperatingDays: number
  adhocHotacNights: number
  acmiEmailRecipients: string
  adhocEmailRecipients: string
  adhocOfferSendInDanish: boolean
  acmiSafetyMarginPercent: number
  adhocSafetyMarginPercent: number
  adhocUseFuelCorrection: boolean
  adhocFuelPriceBasicRef: number
  adhocFuelPriceCurrent: number
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
  navblueFlightDate: string
  navblueFlightNumber: string
  navblueFetchLegIndex: number
  navblueInfantsByLeg: [number | '', number | '', number | '', number | '']
}

type ScenarioEu261Selection = {
  legSelections: boolean[]
  overnightSelected: boolean
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
  source: 'excel' | 'time' | 'city_pair' | 'city_pair_loading' | 'blh'
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
  overnightCostEur: number
  eu261ImpactedPax: number
  eu261BandEur: number
  eu261BandSource: 'excel_distance' | 'manual_fallback'
  crewCost: number
  conveniencePenalty: number
  overnightSelected: boolean
  details: string[]
}

type EnabledSubCharterLine = {
  enabled: boolean
  applyToAllResults: boolean
  manualBlh: string
  manualBlhOverride: boolean
  leg: RouteLegInput
  charter: 1 | 2 | 3
  subType: 'SUB Narrowbody' | 'SUB Widebody'
}

type AcmiBreakdown = {
  totalBlh: number
  baseCostDkk: number
  marginDkk: number
  totalCostDkk: number
  minimumBlhDkk: number
  minimumBlhEur: number
  details: string[]
}

type AdhocBreakdown = {
  totalBlh: number
  totalCostDkk: number
  marginDkk: number
  minimumTotalDkk: number
  minimumTotalEur: number
  minimumBlhDkk: number
  minimumBlhEur: number
  details: string[]
}

type ScenarioHistoryEntry = {
  id: string
  createdAt: string
  mode: 'main' | 'acmi' | 'adhoc'
  title: string
  summaryLines: string[]
}

type BaselineAircraftKey = 'A321' | 'A321N' | 'A339' | 'SUB Narrowbody' | 'SUB Widebody'
type BaselineComponentKey = keyof NonNullable<AircraftRouteData['docComponents']>
type BaselineAircraftParameters = {
  blh: number
  componentsPerBlh: Record<BaselineComponentKey, number>
  ownershipCostPerBlh: number
  maintenanceFixedPerBlh: number
  insurancePerFlight: number
}

type EcbFxResponse = {
  dataSets?: Array<{
    series?: Record<string, { observations?: Record<string, [number, ...unknown[]]> }>
  }>
}

type OpenVanFuelResponse = {
  success?: boolean
  data?: Record<
    string,
    {
      currency?: string
      unit?: string
      fetched_at?: string
      prices?: {
        gasoline?: number | null
        diesel?: number | null
      }
    }
  >
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
const NAVBLUE_USERNAME = import.meta.env.VITE_NAVBLUE_USERNAME?.trim() ?? ''
const NAVBLUE_PASSWORD = import.meta.env.VITE_NAVBLUE_PASSWORD?.trim() ?? ''
const OCDC_API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim() || '/ocdc-api'
const OCDC_BASE_URL = (import.meta.env.VITE_OCDC_BASE_URL?.trim() ?? OCDC_API_BASE_URL).replace(/\/+$/, '')
const OCDC_API_KEY = import.meta.env.VITE_OCDC_API_KEY?.trim() ?? ''
const EUR_DKK_RATE_API_URL = 'https://data-api.ecb.europa.eu/service/data/EXR/D.DKK.EUR.SP00.A?lastNObservations=1&format=jsondata'
const OPENVAN_FUEL_PRICE_API_URL = 'https://openvan.camp/api/fuel/prices?source=sunclass-occ'
const ESTIMATED_USD_PER_EUR = 1.08
const ESTIMATED_LITERS_PER_MT = 1250
const ADHOC_FUEL_REFERENCE_MARCH_USD_PER_MT = 1072.08
const POWER_AUTOMATE_EMAIL_FLOW_URL =
  'https://default98f2d82cc0374c5fa381074c142838.1c.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/66890b78e126475c882a7aed3c774ed3/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=5LJJQYljOn2LEb6Bfi7NGoWZURzvnulkNJXVFDQbnbk'
const ADMIN_TOOLS_PASSWORD = import.meta.env.VITE_ADMIN_TOOLS_PASSWORD?.trim() || 'Sunclass'

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

function formatSourceFetchMeta(date: Date, source: string): string {
  const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
  const day = String(date.getDate()).padStart(2, '0')
  const month = monthNames[date.getMonth()] ?? 'UNK'
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${day}${month} ${hours}${minutes} ${source}`
}

function formatRateFetchMeta(date: Date): string {
  return formatSourceFetchMeta(date, 'ECB')
}

function estimateUsdPerMtFromDkkPerLiter(dkkPerLiter: number, dkkPerEur: number): number {
  if (!Number.isFinite(dkkPerLiter) || dkkPerLiter <= 0) return 0
  if (!Number.isFinite(dkkPerEur) || dkkPerEur <= 0) return 0
  return (dkkPerLiter * ESTIMATED_LITERS_PER_MT * ESTIMATED_USD_PER_EUR) / dkkPerEur
}

function estimateFuelConsumptionMt(
  totalBlh: number,
  fuelPerBlhDkk: number,
  fuelCorrectionFactor: number,
  fuelUsdPerMt: number,
  dkkPerEur: number,
): number {
  if (!Number.isFinite(totalBlh) || totalBlh <= 0) return 0
  if (!Number.isFinite(fuelPerBlhDkk) || fuelPerBlhDkk <= 0) return 0
  if (!Number.isFinite(fuelCorrectionFactor) || fuelCorrectionFactor <= 0) return 0
  if (!Number.isFinite(fuelUsdPerMt) || fuelUsdPerMt <= 0) return 0
  if (!Number.isFinite(dkkPerEur) || dkkPerEur <= 0) return 0
  const dkkPerUsd = dkkPerEur / ESTIMATED_USD_PER_EUR
  if (!Number.isFinite(dkkPerUsd) || dkkPerUsd <= 0) return 0
  const dkkPerMt = fuelUsdPerMt * dkkPerUsd
  if (!Number.isFinite(dkkPerMt) || dkkPerMt <= 0) return 0
  const adjustedFuelCostDkk = totalBlh * fuelPerBlhDkk * fuelCorrectionFactor
  return adjustedFuelCostDkk / dkkPerMt
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
    { id: 'a339', name: 'A339', legs: ['A339'] },
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
  return { from: '', depUtc: '', arrUtc: '', to: '', pax: '', blh: '' }
}

function emptyOwnBaseLine(): OwnBaseLineInput {
  return {
    enabled: false,
    applyToAllResults: false,
    manualBlh: '',
    manualBlhOverride: false,
    flightNumber: '',
    departureDate: '',
    aircraft: '',
    leg: emptyLeg(),
  }
}

function emptySubBaseLine(): SubBaseLineInput {
  return { enabled: false, applyToAllResults: false, manualBlh: '', manualBlhOverride: false, leg: emptyLeg() }
}

function normalizeBlhInput(input: string): string {
  const cleaned = input.replace(/[^0-9:]/g, '')
  if (!cleaned.includes(':') && /^\d{3,4}$/.test(cleaned)) {
    const hourDigits = cleaned.length === 4 ? cleaned.slice(0, 2) : cleaned.slice(0, 1)
    const minuteDigits = cleaned.slice(-2)
    return `${hourDigits.padStart(2, '0')}:${minuteDigits}`
  }
  return cleaned.slice(0, 5)
}

function parseBlhHours(input: string): number | null {
  const normalized = normalizeBlhInput(input)
  const match = /^(\d{1,2}):([0-5]\d)$/.exec(normalized)
  if (!match) return null
  return Number(match[1]) + Number(match[2]) / 60
}

function formatBlhFromHours(hours: number | null): string {
  if (hours === null || !Number.isFinite(hours) || hours < 0) return ''
  const whole = Math.floor(hours)
  const mins = Math.round((hours - whole) * 60)
  return `${String(whole).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

function hasPositioningBlhInput(line: { manualBlh: string; leg: RouteLegInput }): boolean {
  const manual = parseBlhHours(line.manualBlh)
  if (manual !== null && manual > 0) return true
  const legBlh = parseBlhHours(line.leg.blh)
  if (legBlh !== null && legBlh > 0) return true
  const timed = durationHoursFromUtcTimes(line.leg.depUtc, line.leg.arrUtc)
  return timed !== null && timed > 0
}

function hasTimedBlh(leg: RouteLegInput): boolean {
  const timed = durationHoursFromUtcTimes(leg.depUtc, leg.arrUtc)
  return timed !== null && timed > 0
}

function hasStationsAndTimes(leg: RouteLegInput): boolean {
  return hasStations(leg) && hasTimedBlh(leg)
}

function derivePositioningBlh(line: {
  manualBlh: string
  manualBlhOverride?: boolean
  leg: RouteLegInput
}): number {
  const manual = parseBlhHours(line.manualBlh)
  const timed = durationHoursFromUtcTimes(line.leg.depUtc, line.leg.arrUtc)
  if (line.manualBlhOverride && manual !== null) return manual
  if (timed !== null) return timed
  if (manual !== null) return manual
  return 0
}

function deriveMainRouteBlh(leg: RouteLegInput, cityPairBlh: string): { hours: number | null; source: 'time' | 'city_pair' | 'blh' } {
  const timeBlh = durationHoursFromUtcTimes(leg.depUtc, leg.arrUtc)
  if (timeBlh && timeBlh > 0) return { hours: timeBlh, source: 'time' }
  const cityPair = parseBlhHours(cityPairBlh)
  if (cityPair && cityPair > 0) return { hours: cityPair, source: 'city_pair' }
  const manual = parseBlhHours(leg.blh)
  if (manual && manual > 0) return { hours: manual, source: 'blh' }
  return { hours: null, source: 'time' }
}

function getLegHoursNoFallback(leg: RouteLegInput, cityPairBlh: string): number {
  const resolved = deriveMainRouteBlh(leg, cityPairBlh)
  return resolved.hours && resolved.hours > 0 ? resolved.hours : 0
}

async function fetchOcdcCityPairBlh(origin: string, destination: string): Promise<string | null> {
  const from = normalizeStation(origin)
  const to = normalizeStation(destination)
  if (from.length !== 3 || to.length !== 3) return null
  const url =
    `${OCDC_API_BASE_URL.replace(/\/$/, '')}/api/v1/flights/block-time?origin=${encodeURIComponent(from)}` +
    `&destination=${encodeURIComponent(to)}&method=median`
  const headers: Record<string, string> = {}
  if (OCDC_API_KEY) headers['X-API-Key'] = OCDC_API_KEY
  const response = await fetch(url, { headers })
  if (!response.ok) return null
  const payload = (await response.json()) as { data?: { estimateMinutesRounded?: number } }
  const minutes = Number(payload?.data?.estimateMinutesRounded ?? 0)
  if (!Number.isFinite(minutes) || minutes <= 0) return null
  const whole = Math.floor(minutes / 60)
  const mins = Math.round(minutes % 60)
  return `${String(whole).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

function getIataSeasonForDate(inputDate: string): 'S' | 'W' {
  const baseDate = (() => {
    const [year, month, day] = inputDate.split('-').map((part) => Number(part))
    if (Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day)) {
      return new Date(Date.UTC(year, month - 1, day))
    }
    return new Date()
  })()

  const year = baseDate.getUTCFullYear()
  const marchLastDay = new Date(Date.UTC(year, 3, 0))
  const marchOffset = marchLastDay.getUTCDay()
  const lastSundayMarch = new Date(Date.UTC(year, 2, marchLastDay.getUTCDate() - marchOffset))

  const octoberLastDay = new Date(Date.UTC(year, 10, 0))
  const octoberOffset = octoberLastDay.getUTCDay()
  const lastSundayOctober = new Date(Date.UTC(year, 9, octoberLastDay.getUTCDate() - octoberOffset))

  return baseDate >= lastSundayMarch && baseDate < lastSundayOctober ? 'S' : 'W'
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

function normalizeFlightNumber(input: string): string {
  const normalized = input.trim().toUpperCase().replace(/\s+/g, '')
  return normalized.startsWith('DK') ? normalized : `DK${normalized}`
}

function normalizeOptionalFlightNumber(input: string): string {
  const normalized = input.trim().toUpperCase().replace(/\s+/g, '')
  return normalized
}

function formatSubjectDate(input: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) return '[DATE]'
  const [, yearStr, monthStr, dayStr] = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input) ?? []
  if (!monthStr || !dayStr || !yearStr) return '[DATE]'
  const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
  const monthIdx = Number(monthStr) - 1
  if (monthIdx < 0 || monthIdx > 11) return '[DATE]'
  return `${dayStr}${monthNames[monthIdx]}${yearStr.slice(-2)}`
}

function parseRaidoBookedPax(booked: Record<string, unknown>): { pax: number; infants: number } | null {
  const adultsRaw = Number(booked.Adults ?? booked.Adult ?? booked.ADU)
  const childrenRaw = Number(booked.Children ?? booked.Child ?? booked.CHD)
  const hasBookedPax = Number.isFinite(adultsRaw) || Number.isFinite(childrenRaw)
  if (!hasBookedPax) {
    return null
  }

  const adults = Number.isFinite(adultsRaw) ? adultsRaw : 0
  const children = Number.isFinite(childrenRaw) ? childrenRaw : 0
  const infants = Number(booked.Infants ?? booked.Infant ?? booked.INF ?? 0) || 0
  return { pax: adults + children, infants }
}

function buildOcdcFlightKey(flightNumber: string, flightDate: string, from: string, to: string): string | null {
  const normalizedFlightNumber = normalizeFlightNumber(flightNumber)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(flightDate) || from.length !== 3 || to.length !== 3) {
    return null
  }
  return `${normalizedFlightNumber}_${flightDate}_${from}-${to}`
}

async function fetchPhoenixBookedPax(flightKey: string): Promise<{ pax: number; infants: number } | null> {
  if (!OCDC_BASE_URL || !OCDC_API_KEY) {
    return null
  }

  const response = await fetch(
    `${OCDC_BASE_URL}/api/v1/phoenix/flight-key/${encodeURIComponent(flightKey)}/passenger-services`,
    {
      headers: {
        'x-api-key': OCDC_API_KEY,
      },
    },
  )

  if (!response.ok) {
    return null
  }

  const payload = await response.json()
  const paxRaw = Number(payload?.data?.parsedPage?.pax?.totalPax)
  if (!Number.isFinite(paxRaw)) {
    return null
  }

  const infantsRaw = Number(payload?.data?.parsedPage?.pax?.infants)
  return {
    pax: paxRaw,
    infants: Number.isFinite(infantsRaw) ? infantsRaw : 0,
  }
}

function normalizeLegInput(input: RouteLegInput): RouteLegInput {
  return {
    from: normalizeStation(input.from),
    depUtc: normalizeUtcInput(input.depUtc),
    arrUtc: normalizeUtcInput(input.arrUtc),
    to: normalizeStation(input.to),
    pax: typeof input.pax === 'number' ? input.pax : input.pax === 'NA' ? 'NA' : '',
    blh: normalizeBlhInput(input.blh ?? ''),
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

function deriveArrivalUtcFromDepartureAndBlh(departureUtc: string, blh: string): string | null {
  const depMinutes = parseUtcTimeToMinutes(departureUtc)
  const blhHours = parseBlhHours(blh)
  if (depMinutes === null || blhHours === null || blhHours <= 0) return null
  const totalMinutes = Math.round(blhHours * 60)
  const arrMinutes = (depMinutes + totalMinutes) % (24 * 60)
  const hour = Math.floor(arrMinutes / 60)
  const minute = arrMinutes % 60
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
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

function roundUpToNearestHundred(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0
  return Math.ceil(value / 100) * 100
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
  adhocLines: [
    emptyOwnBaseLine(),
    emptyOwnBaseLine(),
    emptyOwnBaseLine(),
    emptyOwnBaseLine(),
    emptyOwnBaseLine(),
    emptyOwnBaseLine(),
    emptyOwnBaseLine(),
    emptyOwnBaseLine(),
  ],
  acmiAircraft: '',
  adhocAircraft: '',
  acmiHotacNights: 0,
  acmiCrewPerDiemOperatingDays: 0,
  adhocCrewPerDiemOperatingDays: 0,
  adhocHotacNights: 0,
  acmiEmailRecipients: '',
  adhocEmailRecipients: '',
  adhocOfferSendInDanish: false,
  acmiSafetyMarginPercent: 20,
  adhocSafetyMarginPercent: 20,
  adhocUseFuelCorrection: true,
  adhocFuelPriceBasicRef: ADHOC_FUEL_REFERENCE_MARCH_USD_PER_MT,
  adhocFuelPriceCurrent: 100,
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
  navblueFlightDate: '',
  navblueFlightNumber: '',
  navblueFetchLegIndex: 0,
  navblueInfantsByLeg: ['', '', '', ''],
}

function ensureLineCount<T>(lines: T[], target: number, makeEmpty: () => T): T[] {
  if (lines.length >= target) return lines
  return [...lines, ...Array.from({ length: target - lines.length }, () => makeEmpty())]
}

function App() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [eurRateFetchMeta, setEurRateFetchMeta] = useState('')
  const initialLoadedEurRate = useRef(INITIAL_FORM.eurToDkkRate)
  const [adhocFuelFetchMeta, setAdhocFuelFetchMeta] = useState('')
  const initialLoadedAdhocFuelBasic = useRef(INITIAL_FORM.adhocFuelPriceBasicRef)
  const initialLoadedAdhocFuelCurrent = useRef(INITIAL_FORM.adhocFuelPriceCurrent)
  const [eu261ByScenario, setEu261ByScenario] = useState<Record<string, ScenarioEu261Selection>>({})
  const [cityPairLoadingByLine, setCityPairLoadingByLine] = useState<Record<string, boolean>>({})
  const [cityPairFailedByLine, setCityPairFailedByLine] = useState<Record<string, boolean>>({})
  const [emailConfirmState, setEmailConfirmState] = useState<{
    type: 'acmi-internal' | 'acmi-client' | 'adhoc-internal' | 'adhoc-client'
    recipients: string
  } | null>(null)
  const [adminPromptTarget, setAdminPromptTarget] = useState<null | 'acmi' | 'adhoc' | 'baseline'>(null)
  const [adminPasswordInput, setAdminPasswordInput] = useState('')

  useEffect(() => {
    setForm((prev) => {
      const nextAdhocLines = ensureLineCount(prev.adhocLines, 8, emptyOwnBaseLine)
      return nextAdhocLines === prev.adhocLines ? prev : { ...prev, adhocLines: nextAdhocLines }
    })
  }, [])
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const response = await fetch(EUR_DKK_RATE_API_URL)
        if (!response.ok) return
        const payload = (await response.json()) as EcbFxResponse
        const series = payload.dataSets?.[0]?.series
        if (!series) return
        const firstSeries = Object.values(series)[0]
        const observations = firstSeries?.observations
        if (!observations) return
        const firstObservation = Object.values(observations)[0]
        const rawRate = Number(firstObservation?.[0] ?? NaN)
        if (!Number.isFinite(rawRate) || rawRate <= 0) return
        const roundedRate = roundToTwo(rawRate)
        if (cancelled) return
        initialLoadedEurRate.current = roundedRate
        setEurRateFetchMeta(formatRateFetchMeta(new Date()))
        setForm((prev) => (prev.eurToDkkRate === roundedRate ? prev : { ...prev, eurToDkkRate: roundedRate }))
      } catch {
        // Keep default/manual rate if API fetch fails.
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const response = await fetch(OPENVAN_FUEL_PRICE_API_URL)
        if (!response.ok) return
        const payload = (await response.json()) as OpenVanFuelResponse
        const dk = payload.data?.DK
        const rawDieselDkkPerLiter = Number(dk?.prices?.diesel ?? dk?.prices?.gasoline ?? NaN)
        if (!Number.isFinite(rawDieselDkkPerLiter) || rawDieselDkkPerLiter <= 0) return
        if (cancelled) return
        const roundedUsdPerMt = roundToTwo(estimateUsdPerMtFromDkkPerLiter(rawDieselDkkPerLiter, form.eurToDkkRate))
        if (!Number.isFinite(roundedUsdPerMt) || roundedUsdPerMt <= 0) return
        initialLoadedAdhocFuelCurrent.current = roundedUsdPerMt
        const fetchedAtCandidate = dk?.fetched_at ? new Date(dk.fetched_at) : new Date()
        const fetchedAt = Number.isNaN(fetchedAtCandidate.getTime()) ? new Date() : fetchedAtCandidate
        setAdhocFuelFetchMeta(formatSourceFetchMeta(fetchedAt, 'OPENVAN'))
        setForm((prev) => {
          if (prev.adhocFuelPriceCurrent === roundedUsdPerMt) return prev
          return {
            ...prev,
            adhocFuelPriceCurrent: roundedUsdPerMt,
          }
        })
      } catch {
        // Keep manual/default value if fuel API fetch fails.
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])
  useEffect(() => {
    if (form.acmiSafetyMarginPercent < 20) {
      setForm((prev) => ({ ...prev, acmiSafetyMarginPercent: 20 }))
    }
  }, [form.acmiSafetyMarginPercent])
  const [routeCityPairLoadingByLeg, setRouteCityPairLoadingByLeg] = useState<Record<'leg1' | 'leg2' | 'leg3' | 'leg4', boolean>>({
    leg1: false,
    leg2: false,
    leg3: false,
    leg4: false,
  })
  const [routeCityPairBlhByLeg, setRouteCityPairBlhByLeg] = useState<Record<'leg1' | 'leg2' | 'leg3' | 'leg4', string>>({
    leg1: '',
    leg2: '',
    leg3: '',
    leg4: '',
  })
  const [scenarioHistory, setScenarioHistory] = useState<ScenarioHistoryEntry[]>([])
  const [showBaselinePanel, setShowBaselinePanel] = useState(false)
  const [selectedBaselineAircraft, setSelectedBaselineAircraft] = useState<BaselineAircraftKey>('A321')
  const lastHistorySignatureByMode = useRef<Record<'main' | 'acmi' | 'adhoc', string>>({
    main: '',
    acmi: '',
    adhoc: '',
  })
  const historyDebounceTimers = useRef<{
    main: ReturnType<typeof setTimeout> | null
    acmi: ReturnType<typeof setTimeout> | null
    adhoc: ReturnType<typeof setTimeout> | null
  }>({
    main: null,
    acmi: null,
    adhoc: null,
  })
  const isToolMode = form.enableAcmiModule || form.enableAdhocModule
  const activeHistoryMode: 'main' | 'acmi' | 'adhoc' = form.enableAcmiModule ? 'acmi' : form.enableAdhocModule ? 'adhoc' : 'main'
  const visibleScenarioHistory = useMemo(
    () => scenarioHistory.filter((entry) => entry.mode === activeHistoryMode),
    [activeHistoryMode, scenarioHistory],
  )
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
      const ownershipCostPerBlh = aircraftCode === 'A321' || aircraftCode === 'A321N' ? 8283 : aircraftCode === 'A339' ? 13155 : 0
      const maintenanceFixedPerBlh = aircraftCode === 'A321' || aircraftCode === 'A321N' || aircraftCode === 'A339' ? 5260 : 0
      const insurancePerFlight = aircraftCode === 'A321' || aircraftCode === 'A321N' || aircraftCode === 'A339' ? 3000 : 0
      return { blh, componentsPerBlh, ownershipCostPerBlh, maintenanceFixedPerBlh, insurancePerFlight }
    }

    const a321 = fromDefault('A321')
    const a321n = fromDefault('A321N')
    const a339 = fromDefault('A339')
    const subNarrow = fromDefault('SUB_NARROWBODY')
    const subWide = {
      ...a339,
      componentsPerBlh: { ...a339.componentsPerBlh },
      ownershipCostPerBlh: 0,
      maintenanceFixedPerBlh: 0,
      insurancePerFlight: 0,
    }
    const subNarrowAdjusted = {
      ...subNarrow,
      ownershipCostPerBlh: 0,
      maintenanceFixedPerBlh: 0,
      insurancePerFlight: 0,
    }

    return {
      A321: a321,
      A321N: a321n,
      A339: a339,
      'SUB Narrowbody': subNarrowAdjusted,
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
    () => {
      const season = getIataSeasonForDate(form.navblueFlightDate)
      return {
        A321: DEFAULT_SEATS_BY_AIRCRAFT.A321,
        A321N: DEFAULT_SEATS_BY_AIRCRAFT.A321N,
        A339: season === 'S' ? 385 : 373,
      }
    },
    [form.navblueFlightDate],
  )
  const scenarioOptions = form.originalType ? SCENARIOS[form.originalType] : []
  const selectedOriginalType: OriginalType = form.originalType || 'A321'
  const routeLegEntries: Array<{ key: 'leg1' | 'leg2' | 'leg3' | 'leg4'; leg: RouteLegInput }> = [
    { key: 'leg1', leg: normalizeLegInput(form.leg1) },
    { key: 'leg2', leg: normalizeLegInput(form.leg2) },
    { key: 'leg3', leg: normalizeLegInput(form.leg3) },
    { key: 'leg4', leg: normalizeLegInput(form.leg4) },
  ]
  const routeLegsWithStations = routeLegEntries.filter(({ leg }) => hasStations(leg))

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

  const routeLegHoursByKey = useMemo(() => {
    const legKeys: Array<'leg1' | 'leg2' | 'leg3' | 'leg4'> = ['leg1', 'leg2', 'leg3', 'leg4']
    const result: Record<'leg1' | 'leg2' | 'leg3' | 'leg4', number | null> = {
      leg1: null,
      leg2: null,
      leg3: null,
      leg4: null,
    }
    legKeys.forEach((key) => {
      const leg = normalizeLegInput(form[key])
      result[key] = deriveMainRouteBlh(leg, routeCityPairBlhByLeg[key]).hours
    })
    return result
  }, [form.leg1, form.leg2, form.leg3, form.leg4, routeCityPairBlhByLeg])

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
    () => normalizedOwnLines.filter((line) => line.enabled && hasPositioningBlhInput(line)),
    [normalizedOwnLines],
  )
  const enabledAcmiLines = useMemo(
    () => normalizedAcmiLines.filter((line) => line.enabled && hasPositioningBlhInput(line)),
    [normalizedAcmiLines],
  )
  const enabledAdhocLines = useMemo(
    () => normalizedAdhocLines.filter((line) => line.enabled && hasPositioningBlhInput(line)),
    [normalizedAdhocLines],
  )
  const enabledSubLines = useMemo(
    () => [
      ...normalizedSub1Lines
        .filter((line) => line.enabled && hasPositioningBlhInput(line))
        .map((line) => ({ ...line, charter: 1 as const, subType: 'SUB Narrowbody' as const })),
      ...normalizedSub2Lines
        .filter((line) => line.enabled && hasPositioningBlhInput(line))
        .map((line) => ({ ...line, charter: 2 as const, subType: 'SUB Narrowbody' as const })),
      ...normalizedSub3Lines
        .filter((line) => line.enabled && hasPositioningBlhInput(line))
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

    const normalizedLegs: Array<{ key: 'leg1' | 'leg2' | 'leg3' | 'leg4'; leg: RouteLegInput }> = [
      { key: 'leg1', leg: normalizeLegInput(form.leg1) },
      { key: 'leg2', leg: normalizeLegInput(form.leg2) },
      { key: 'leg3', leg: normalizeLegInput(form.leg3) },
      { key: 'leg4', leg: normalizeLegInput(form.leg4) },
    ]

    return normalizedLegs.filter(({ leg }) => hasStations(leg)).map(({ key, leg }, idx) => {
      if (routeCityPairLoadingByLeg[key]) {
        return { label: `Leg ${idx + 1}`, from: leg.from, to: leg.to, blh: 0, source: 'city_pair_loading' as const }
      }
      const resolved = deriveMainRouteBlh(leg, routeCityPairBlhByLeg[key])
      return {
        label: `Leg ${idx + 1}`,
        from: leg.from,
        to: leg.to,
        blh: resolved.hours && resolved.hours > 0 ? resolved.hours : 0,
        source: resolved.source,
      }
    })
  }, [form.leg1, form.leg2, form.leg3, form.leg4, form.originalType, routeCityPairBlhByLeg, routeCityPairLoadingByLeg])

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
    const originalMainBlhTotal = routeLegsWithStations.reduce((sum, { key, leg }) => {
      return sum + getLegHoursNoFallback(leg, routeCityPairBlhByLeg[key])
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
        const eu261Selection = eu261ByScenario[option.id] ?? { legSelections: option.legs.map(() => false), overnightSelected: false }
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

          const legBlhTotal = routeLegsWithStations.reduce((sum, { key }) => {
            return sum + (routeLegHoursByKey[key] ?? 0)
          }, 0)

          let positioningBlhOneWay = line ? derivePositioningBlh(line) : 0
          if (currentSubType && currentSubTypeLegIndex === 0) {
            const extraPositioningBlh = (() => {
              const extraLines =
                currentSubType === 'SUB Narrowbody'
                  ? subNarrowLinesByOption[
                      option.forcedSubNarrowbodyOptions?.[0] ?? option.forcedSubNarrowbodyOption ?? 1
                    ].slice(subScenarioLegCountByType[currentSubType])
                  : subWideLines.slice(subScenarioLegCountByType[currentSubType])
              return extraLines.reduce(
                (sum, extraLine) => sum + derivePositioningBlh(extraLine),
                0,
              )
            })()
            positioningBlhOneWay += extraPositioningBlh
          } else if (!isSub && currentOwnTypeLegIndex === 0) {
            const ownAircraft = aircraft as Exclude<AircraftType, 'SUB Narrowbody' | 'SUB Widebody'>
            const extraOwnPositioningBlh = ownLinesByAircraft[ownAircraft]
              .slice(ownScenarioLegCountByAircraft[ownAircraft])
              .reduce(
                (sum, extraLine) => sum + derivePositioningBlh(extraLine),
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
            const subNonMaintDocCostDkk = routeLegsWithStations.reduce((sum, { key }) => {
              const legHours = routeLegHoursByKey[key] ?? 0
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
            const blh = derivePositioningBlh(line)
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
            const blh = derivePositioningBlh(line)
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
              const blh = derivePositioningBlh(line)
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
              const blh = derivePositioningBlh(line)
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
        const overnightImpactedPax = Math.min(totalSeats, scenarioRequestedPax)
        const overnightCostEur = eu261Selection.overnightSelected ? overnightImpactedPax * 205 : 0
        const overnightCostDkk = overnightCostEur * form.eurToDkkRate

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
        const ownLegCount = option.legs.filter((leg) => leg === 'A321' || leg === 'A321N' || leg === 'A339').length
        const ownershipAndFixedCostDkk = option.legs.reduce((sum, leg) => {
          if (leg === 'SUB Narrowbody' || leg === 'SUB Widebody') return sum
          const params = baselineByAircraft[leg]
          const legBlh = routeLegsWithStations.reduce((blhSum, { key }) => {
            return blhSum + (routeLegHoursByKey[key] ?? 0)
          }, 0)
          return sum + legBlh * params.ownershipCostPerBlh + legBlh * params.maintenanceFixedPerBlh
        }, 0)
        const insuranceCostDkk = option.legs.reduce((sum, leg) => {
          if (leg === 'SUB Narrowbody' || leg === 'SUB Widebody') return sum
          return sum + baselineByAircraft[leg].insurancePerFlight
        }, 0)
        const baselineOwnershipAndFixedCreditDkk =
          originalMainBlhTotal *
          (baselineByAircraft[selectedOriginalType].ownershipCostPerBlh + baselineByAircraft[selectedOriginalType].maintenanceFixedPerBlh)
        const baselineInsuranceCreditDkk = baselineByAircraft[selectedOriginalType].insurancePerFlight
        const totalCostDkk =
          operatingCost -
          baselineCreditDkk +
          overflowCost +
          crewCost +
          ownScaExtrasCostDkk +
          conveniencePenalty +
          subAddOnCostDkk +
          overnightCostDkk +
          ownershipAndFixedCostDkk +
          insuranceCostDkk -
          baselineOwnershipAndFixedCreditDkk -
          baselineInsuranceCreditDkk
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
        if (overnightCostEur > 0) {
          details.push(`Overnight: ${overnightImpactedPax} pax * 205 EUR = ${toEur(overnightCostEur)}`)
        }
        if (ownershipAndFixedCostDkk > 0) {
          details.push(
            `Ownership + Maintenance fixed (SCA): ${toCurrency(ownershipAndFixedCostDkk)} minus baseline ${toCurrency(baselineOwnershipAndFixedCreditDkk)}`,
          )
        }
        if (insuranceCostDkk > 0) {
          details.push(
            `Insurance (avg 3000 DKK per own flight): ${toCurrency(insuranceCostDkk)} (own legs: ${ownLegCount}) minus baseline ${toCurrency(baselineInsuranceCreditDkk)}`,
          )
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
          overnightCostEur,
          eu261ImpactedPax,
          eu261BandEur,
          eu261BandSource,
          crewCost,
          conveniencePenalty,
          overnightSelected: eu261Selection.overnightSelected ?? false,
          details,
        }
      })
      .sort((a, b) => a.evaluatedTotalDkk - b.evaluatedTotalDkk)
  }, [
    activeLegs,
    routeLegsWithStations,
    routeLegHoursByKey,
    routeCityPairBlhByLeg,
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

  function requestAdminAccess(target: 'acmi' | 'adhoc' | 'baseline') {
    setAdminPromptTarget(target)
    setAdminPasswordInput('')
  }

  function submitAdminAccess() {
    if (adminPasswordInput !== ADMIN_TOOLS_PASSWORD) {
      window.alert('Wrong password')
      return
    }
    const target = adminPromptTarget
    setAdminPromptTarget(null)
    setAdminPasswordInput('')
    if (target === 'acmi') {
      setForm((prev) => ({ ...prev, enableAcmiModule: true, enableAdhocModule: false }))
      return
    }
    if (target === 'adhoc') {
      setForm((prev) => ({ ...prev, enableAdhocModule: true, enableAcmiModule: false }))
      return
    }
    if (target === 'baseline') {
      setShowBaselinePanel(true)
    }
  }

  function toggleAcmiTool() {
    if (!form.enableAcmiModule) {
      requestAdminAccess('acmi')
      return
    }
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
    if (!form.enableAdhocModule) {
      requestAdminAccess('adhoc')
      return
    }
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
              ? value === 'NA'
                ? 'NA'
                : value === ''
                  ? ''
                  : Number(value) || 0
              : field === 'blh'
                ? normalizeBlhInput(String(value))
              : normalizeUtcInput(String(value)),
      },
    }))
  }

  function getRouteLegBlhDisplayValue(key: 'leg1' | 'leg2' | 'leg3' | 'leg4'): string {
    if (routeCityPairLoadingByLeg[key]) return 'Loading...'
    const leg = normalizeLegInput(form[key])
    const timed = durationHoursFromUtcTimes(leg.depUtc, leg.arrUtc)
    if (timed !== null && timed > 0) return formatBlhFromHours(timed)
    if (leg.blh.trim().length > 0) return leg.blh
    if (routeCityPairBlhByLeg[key].trim().length > 0) return routeCityPairBlhByLeg[key]
    return ''
  }

  function getModuleLegBlhDisplayValue(line: OwnBaseLineInput, loadingKey: string): string {
    if (cityPairLoadingByLine[loadingKey]) return 'Loading...'
    const timed = durationHoursFromUtcTimes(line.leg.depUtc, line.leg.arrUtc)
    if (timed !== null && timed > 0) return formatBlhFromHours(timed)
    return line.leg.blh
  }

  async function tryFetchRouteCityPairBlh(key: 'leg1' | 'leg2' | 'leg3' | 'leg4') {
    const leg = normalizeLegInput(form[key])
    if (!hasStations(leg)) return
    setRouteCityPairLoadingByLeg((prev) => ({ ...prev, [key]: true }))
    try {
      const blh = await fetchOcdcCityPairBlh(leg.from, leg.to)
      if (!blh) return
      setRouteCityPairBlhByLeg((prev) => ({ ...prev, [key]: blh }))
    } finally {
      setRouteCityPairLoadingByLeg((prev) => ({ ...prev, [key]: false }))
    }
  }

  function updateOwnBaseLine(
    index: number,
    updates: {
      enabled?: boolean
      applyToAllResults?: boolean
      manualBlh?: string
      manualBlhOverride?: boolean
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
        manualBlhOverride:
          typeof updates.manualBlhOverride === 'boolean'
            ? updates.manualBlhOverride
            : typeof updates.manualBlh === 'string'
              ? normalizeBlhInput(updates.manualBlh).length > 0
              : updates.leg
                ? false
                : current.manualBlhOverride,
        manualBlh:
          typeof updates.manualBlh === 'string'
            ? normalizeBlhInput(updates.manualBlh)
            : updates.leg
              ? formatBlhFromHours(durationHoursFromUtcTimes(nextLeg.depUtc, nextLeg.arrUtc))
              : current.manualBlh,
        leg: {
          from: normalizeStation(nextLeg.from),
          depUtc: normalizeUtcInput(nextLeg.depUtc),
          arrUtc: normalizeUtcInput(nextLeg.arrUtc),
          to: normalizeStation(nextLeg.to),
          pax: typeof nextLeg.pax === 'number' ? nextLeg.pax : '',
          blh: normalizeBlhInput(nextLeg.blh ?? ''),
        },
      }

      return { ...prev, ownBaseLines: next }
    })
  }

  function updateAcmiLine(
    index: number,
    updates: {
      enabled?: boolean
      aircraft?: '' | Exclude<AircraftType, 'SUB Narrowbody' | 'SUB Widebody'>
      flightNumber?: string
      departureDate?: string
      manualBlhOverride?: boolean
      leg?: Partial<RouteLegInput>
    },
  ) {
    setForm((prev) => {
      const next = [...prev.acmiLines]
      const current = next[index]
      const nextLeg = updates.leg ? { ...current.leg, ...updates.leg } : current.leg
      const normalizedBlh = normalizeBlhInput(nextLeg.blh ?? '')
      const hasBlhUpdate = Boolean(updates.leg && 'blh' in updates.leg)
      const hasManualBlhInput = hasBlhUpdate && normalizedBlh.length > 0
      const hasTimeUpdate = Boolean(updates.leg && ('depUtc' in updates.leg || 'arrUtc' in updates.leg))

      next[index] = {
        ...current,
        ...updates,
        flightNumber:
          typeof updates.flightNumber === 'string' ? normalizeOptionalFlightNumber(updates.flightNumber) : current.flightNumber,
        departureDate: typeof updates.departureDate === 'string' ? updates.departureDate.trim() : current.departureDate,
        manualBlhOverride:
          typeof updates.manualBlhOverride === 'boolean'
            ? updates.manualBlhOverride
            : hasBlhUpdate
              ? hasManualBlhInput
              : hasTimeUpdate
                ? current.manualBlhOverride
                : current.manualBlhOverride,
        manualBlh:
          hasBlhUpdate
            ? normalizedBlh
            : hasTimeUpdate
              ? current.manualBlh
              : current.manualBlh,
        leg: {
          from: normalizeStation(nextLeg.from),
          depUtc: normalizeUtcInput(nextLeg.depUtc),
          arrUtc: normalizeUtcInput(nextLeg.arrUtc),
          to: normalizeStation(nextLeg.to),
          pax: typeof nextLeg.pax === 'number' ? nextLeg.pax : '',
          blh: normalizedBlh,
        },
      }

      return { ...prev, acmiLines: next }
    })
  }

  function updateAdhocLine(
    index: number,
    updates: {
      enabled?: boolean
      aircraft?: '' | Exclude<AircraftType, 'SUB Narrowbody' | 'SUB Widebody'>
      flightNumber?: string
      departureDate?: string
      manualBlhOverride?: boolean
      leg?: Partial<RouteLegInput>
    },
  ) {
    setForm((prev) => {
      const next = [...prev.adhocLines]
      const current = next[index]
      const nextLeg = updates.leg ? { ...current.leg, ...updates.leg } : current.leg
      const normalizedBlh = normalizeBlhInput(nextLeg.blh ?? '')
      const hasBlhUpdate = Boolean(updates.leg && 'blh' in updates.leg)
      const hasManualBlhInput = hasBlhUpdate && normalizedBlh.length > 0
      const hasTimeUpdate = Boolean(updates.leg && ('depUtc' in updates.leg || 'arrUtc' in updates.leg))

      next[index] = {
        ...current,
        ...updates,
        flightNumber:
          typeof updates.flightNumber === 'string' ? normalizeOptionalFlightNumber(updates.flightNumber) : current.flightNumber,
        departureDate: typeof updates.departureDate === 'string' ? updates.departureDate.trim() : current.departureDate,
        manualBlhOverride:
          typeof updates.manualBlhOverride === 'boolean'
            ? updates.manualBlhOverride
            : hasBlhUpdate
              ? hasManualBlhInput
              : hasTimeUpdate
                ? current.manualBlhOverride
                : current.manualBlhOverride,
        manualBlh:
          hasBlhUpdate
            ? normalizedBlh
            : hasTimeUpdate
              ? current.manualBlh
              : current.manualBlh,
        leg: {
          from: normalizeStation(nextLeg.from),
          depUtc: normalizeUtcInput(nextLeg.depUtc),
          arrUtc: normalizeUtcInput(nextLeg.arrUtc),
          to: normalizeStation(nextLeg.to),
          pax: typeof nextLeg.pax === 'number' ? nextLeg.pax : '',
          blh: normalizedBlh,
        },
      }

      return { ...prev, adhocLines: next }
    })
  }

  function resetAcmiLine(index: number) {
    setCityPairFailedByLine((prev) => ({ ...prev, [`acmi-${index}`]: false }))
    setForm((prev) => {
      const next = [...prev.acmiLines]
      next[index] = emptyOwnBaseLine()
      return { ...prev, acmiLines: next }
    })
  }

  function resetAdhocLine(index: number) {
    setCityPairFailedByLine((prev) => ({ ...prev, [`adhoc-${index}`]: false }))
    setForm((prev) => {
      const next = [...prev.adhocLines]
      next[index] = emptyOwnBaseLine()
      return { ...prev, adhocLines: next }
    })
  }

  function updateSubBaseLine(
    type: 'sub1' | 'sub2' | 'sub3',
    index: number,
    updates: {
      enabled?: boolean
      applyToAllResults?: boolean
      manualBlh?: string
      manualBlhOverride?: boolean
      leg?: Partial<RouteLegInput>
    },
  ) {
    setForm((prev) => {
      const key = type === 'sub1' ? 'subCharter1Lines' : type === 'sub2' ? 'subCharter2Lines' : 'subCharter3Lines'
      const next = [...prev[key]]
      const current = next[index]
      const nextLeg = updates.leg ? { ...current.leg, ...updates.leg } : current.leg

      next[index] = {
        ...current,
        ...updates,
        manualBlhOverride:
          typeof updates.manualBlhOverride === 'boolean'
            ? updates.manualBlhOverride
            : typeof updates.manualBlh === 'string'
              ? normalizeBlhInput(updates.manualBlh).length > 0
              : updates.leg
                ? false
                : current.manualBlhOverride,
        manualBlh:
          typeof updates.manualBlh === 'string'
            ? normalizeBlhInput(updates.manualBlh)
            : updates.leg
              ? formatBlhFromHours(durationHoursFromUtcTimes(nextLeg.depUtc, nextLeg.arrUtc))
              : current.manualBlh,
        leg: {
          from: normalizeStation(nextLeg.from),
          depUtc: normalizeUtcInput(nextLeg.depUtc),
          arrUtc: normalizeUtcInput(nextLeg.arrUtc),
          to: normalizeStation(nextLeg.to),
          pax: typeof nextLeg.pax === 'number' ? nextLeg.pax : '',
          blh: normalizeBlhInput(nextLeg.blh ?? ''),
        },
      }

      return { ...prev, [key]: next }
    })
  }

  function resetOwnBaseLine(index: number) {
    setCityPairFailedByLine((prev) => ({ ...prev, [`own-${index}`]: false }))
    setForm((prev) => {
      const next = [...prev.ownBaseLines]
      next[index] = emptyOwnBaseLine()
      return { ...prev, ownBaseLines: next }
    })
  }

  function resetSubBaseLine(type: 'sub1' | 'sub2' | 'sub3', index: number) {
    setCityPairFailedByLine((prev) => ({ ...prev, [`${type}-${index}`]: false }))
    setForm((prev) => {
      const key = type === 'sub1' ? 'subCharter1Lines' : type === 'sub2' ? 'subCharter2Lines' : 'subCharter3Lines'
      const next = [...prev[key]]
      next[index] = emptySubBaseLine()
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
          overnightSelected: current.overnightSelected ?? false,
        },
      }
    })
  }

  function updateScenarioOvernightSelection(
    scenarioId: string,
    checked: boolean,
    defaults: ScenarioEu261Selection,
  ) {
    setEu261ByScenario((prev) => {
      const current = prev[scenarioId] ?? defaults
      return {
        ...prev,
        [scenarioId]: {
          legSelections: current.legSelections,
          overnightSelected: checked,
        },
      }
    })
  }

  function resetAll() {
    setForm({
      ...INITIAL_FORM,
      eurToDkkRate: initialLoadedEurRate.current,
      adhocFuelPriceBasicRef: initialLoadedAdhocFuelBasic.current,
      adhocFuelPriceCurrent: initialLoadedAdhocFuelCurrent.current,
    })
    setEu261ByScenario({})
    setCityPairLoadingByLine({})
    setCityPairFailedByLine({})
    setRouteCityPairLoadingByLeg({ leg1: false, leg2: false, leg3: false, leg4: false })
    setRouteCityPairBlhByLeg({ leg1: '', leg2: '', leg3: '', leg4: '' })
  }

  function withFallback(value: string, placeholder: string): string {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : `[${placeholder}]`
  }

  function buildModuleRoutingRows(lines: OwnBaseLineInput[], modulePrefix: 'ACMI' | 'Adhoc') {
    return lines
      .map((line, index) => ({ line, index }))
      .filter(({ line }) => line.enabled)
      .map(({ line, index }) => {
        const derivedBlh = derivePositioningBlh(line)
        const blhText = derivedBlh > 0 ? formatBlhFromHours(derivedBlh) : withFallback(line.leg.blh, 'BLH')
        const flightNumber = line.flightNumber.trim()
        return {
          lineLabel: `${modulePrefix} #${index + 1}`,
          flightNumber: flightNumber || (modulePrefix === 'ACMI' ? 'Pls Advise' : '[FlightNo]'),
          from: withFallback(line.leg.from, 'From'),
          to: withFallback(line.leg.to, 'To'),
          departureDate: line.departureDate.trim(),
          std: line.leg.depUtc.trim(),
          sta: line.leg.arrUtc.trim(),
          blh: blhText,
        }
      })
  }

  function buildModuleRoutingTableLines(lines: OwnBaseLineInput[], modulePrefix: 'ACMI' | 'Adhoc'): string[] {
    const rows = buildModuleRoutingRows(lines, modulePrefix).map((row) => [
      row.departureDate ? formatSubjectDate(row.departureDate) : '[DATE]',
      row.flightNumber,
      `${row.from}-${row.to}`,
      row.std || (modulePrefix === 'ACMI' ? 'TBD' : '[STD]'),
      row.sta || (modulePrefix === 'ACMI' ? 'TBD' : '[STA]'),
      row.blh,
    ])
    if (rows.length === 0) return ['No active legs yet']
    return buildAsciiTable(['Date', 'Flight no', 'Route', 'STD', 'STA', 'BLH'], rows)
  }

  function getModuleStartDateText(lines: OwnBaseLineInput[]): string {
    const firstDate = lines.find((line) => line.enabled && line.departureDate.trim().length > 0)?.departureDate ?? ''
    const formatted = formatSubjectDate(firstDate)
    return formatted === '[DATE]' ? '[Start date]' : formatted
  }

  function getModuleStartDateForSubject(lines: OwnBaseLineInput[]): string {
    const firstDate = lines.find((line) => line.enabled && line.departureDate.trim().length > 0)?.departureDate ?? ''
    const formatted = formatSubjectDate(firstDate)
    return formatted === '[DATE]' ? '[STARTDATE]' : formatted
  }

  function buildModuleRoutingOverview(lines: OwnBaseLineInput[], modulePrefix: 'ACMI' | 'Adhoc'): string[] {
    return buildModuleRoutingRows(lines, modulePrefix).map(
      (row) =>
        `${row.lineLabel}: FLT ${row.flightNumber} | ${row.from}-${row.to} | ${formatTimeForMail(row.std, 'STD')} | ${formatTimeForMail(row.sta, 'STA')} | BLH ${row.blh}`,
    )
  }

  function isModuleLineComplete(line: OwnBaseLineInput): boolean {
    if (!line.enabled) return true
    if (!line.flightNumber.trim()) return false
    if (!normalizeStation(line.leg.from) || !normalizeStation(line.leg.to)) return false
    if (!line.leg.depUtc.trim() || !line.leg.arrUtc.trim()) return false
    return hasPositioningBlhInput(line)
  }

  function clearHistoryDebounce(mode: 'main' | 'acmi' | 'adhoc') {
    const timer = historyDebounceTimers.current[mode]
    if (timer) {
      clearTimeout(timer)
      historyDebounceTimers.current[mode] = null
    }
  }

  function debounceHistoryPush(mode: 'main' | 'acmi' | 'adhoc', cb: () => void) {
    clearHistoryDebounce(mode)
    historyDebounceTimers.current[mode] = setTimeout(() => {
      historyDebounceTimers.current[mode] = null
      cb()
    }, 1200)
  }

  function pushScenarioHistory(mode: 'main' | 'acmi' | 'adhoc', signature: string, title: string, summaryLines: string[]) {
    if (!signature || lastHistorySignatureByMode.current[mode] === signature) return
    lastHistorySignatureByMode.current[mode] = signature
    const entry: ScenarioHistoryEntry = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      createdAt: new Date().toLocaleString(),
      mode,
      title,
      summaryLines,
    }
    setScenarioHistory((prev) => [entry, ...prev].slice(0, 60))
  }

  function buildAsciiTable(headers: string[], rows: string[][]): string[] {
    const widths = headers.map((header, idx) => {
      const rowMax = rows.reduce((max, row) => Math.max(max, (row[idx] ?? '').length), 0)
      return Math.max(header.length, rowMax)
    })
    const separator = `+${widths.map((width) => '-'.repeat(width + 2)).join('+')}+`
    const toLine = (cells: string[]) =>
      `| ${cells
        .map((cell, idx) => (cell ?? '').padEnd(widths[idx], ' '))
        .join(' | ')} |`
    return [separator, toLine(headers), separator, ...rows.map((row) => toLine(row)), separator]
  }

  function getCrewPerDiemRateEurPerDay(aircraft: Exclude<AircraftType, 'SUB Narrowbody' | 'SUB Widebody'>): number {
    return aircraft === 'A339' ? 10 * 120 : 7 * 120
  }

  function getHotacRateDkkPerNight(aircraft: Exclude<AircraftType, 'SUB Narrowbody' | 'SUB Widebody'>): number {
    return aircraft === 'A339' ? 10 * 1000 : 7 * 1000
  }

  function parseRecipientList(input: string): string {
    return input
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .join(',')
  }

  function requestEmailConfirm(
    type: 'acmi-internal' | 'acmi-client' | 'adhoc-internal' | 'adhoc-client',
    recipientsInput: string,
  ) {
    setEmailConfirmState({
      type,
      recipients: parseRecipientList(recipientsInput),
    })
  }

  function escapeHtml(input: string): string {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }

  function isAsciiTableBorder(line: string): boolean {
    return /^\+-[-+]+\+$/.test(line.trim())
  }

  function parseAsciiTableRow(line: string): string[] | null {
    const trimmed = line.trim()
    if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) return null
    return trimmed
      .slice(1, -1)
      .split('|')
      .map((cell) => cell.trim())
  }

  function buildHtmlTableFromAscii(lines: string[], startIdx: number): { html: string; nextIdx: number } | null {
    if (!isAsciiTableBorder(lines[startIdx] ?? '')) return null
    const headerCells = parseAsciiTableRow(lines[startIdx + 1] ?? '')
    if (!headerCells) return null
    const rows: string[][] = []
    let idx = startIdx + 3
    while (idx < lines.length) {
      const current = lines[idx] ?? ''
      if (isAsciiTableBorder(current)) {
        return {
          html: `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;width:100%;max-width:860px;margin:8px 0;border:1px solid #d1d5db;"><thead><tr>${headerCells
            .map(
              (cell) =>
                `<th align="left" valign="top" style="border:1px solid #d1d5db;padding:6px 8px;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:18px;color:#111827;font-weight:700;">${escapeHtml(cell)}</th>`,
            )
            .join('')}</tr></thead><tbody>${rows
            .map(
              (row) =>
                `<tr>${row
                  .map(
                    (cell) =>
                      `<td align="left" valign="top" style="border:1px solid #d1d5db;padding:6px 8px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:18px;color:#111827;">${escapeHtml(cell)}</td>`,
                  )
                  .join('')}</tr>`,
            )
            .join('')}</tbody></table>`,
          nextIdx: idx + 1,
        }
      }
      const row = parseAsciiTableRow(current)
      if (row) rows.push(row)
      idx += 1
    }
    return null
  }

  function buildHtmlEmailBody(bodyLines: string[]): string {
    const blocks: string[] = []
    let idx = 0
    while (idx < bodyLines.length) {
      const line = bodyLines[idx] ?? ''
      const trimmed = line.trim()
      if (trimmed === '__SIGNATURE_SPACER__') {
        blocks.push('<div style="height:12px;line-height:12px;">&nbsp;</div>')
        idx += 1
        continue
      }
      if (!trimmed) {
        idx += 1
        continue
      }
      const table = buildHtmlTableFromAscii(bodyLines, idx)
      if (table) {
        blocks.push(table.html)
        idx = table.nextIdx
        continue
      }
      if (/^[A-Z0-9 ()/%-]{3,}$/.test(trimmed) && !trimmed.startsWith('-')) {
        blocks.push(
          `<h3 style="margin:14px 0 6px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:20px;color:#1f2937;font-weight:700;">${escapeHtml(
            trimmed,
          )}</h3>`,
        )
      } else if (trimmed === 'Hello,' || trimmed === 'Hej,') {
        blocks.push(
          `<p style="margin:4px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:20px;color:#111827;">${escapeHtml(
            line,
          )}</p>`,
        )
        blocks.push('<div style="height:12px;line-height:12px;">&nbsp;</div>')
      } else if (trimmed.startsWith('- ')) {
        blocks.push(
          `<p style="margin:4px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:20px;color:#111827;">&bull; ${escapeHtml(
            trimmed.slice(2),
          )}</p>`,
        )
      } else {
        blocks.push(
          `<p style="margin:4px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:20px;color:#111827;">${escapeHtml(
            line,
          )}</p>`,
        )
      }
      idx += 1
    }

    return `<!doctype html><html><head><meta charset="utf-8" /></head><body style="margin:0;padding:16px;background:#ffffff;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;width:100%;"><tr><td align="left" valign="top" style="font-family:Arial,Helvetica,sans-serif;">${blocks.join(
      '',
    )}</td></tr></table></body></html>`
  }

  async function openEmailDraftToRecipients(
    subject: string,
    bodyLines: string[],
    recipientsInput: string,
    signatureOverride?: string[],
  ): Promise<{ channel: 'flow'; cancelled: boolean }> {
    const signatureLines =
      signatureOverride ??
      [
        '__SIGNATURE_SPACER__',
        'Kind regards,',
        '',
        'OCC Duty Officer',
        'Sunclass Airlines',
        'Phone: +45 3247 7385',
        'occ@sunclass.dk',
      ]
    const bodyHtml = buildHtmlEmailBody([...bodyLines, ...signatureLines])
    const recipients = parseRecipientList(recipientsInput)
    if (!recipients) {
      window.alert('Please enter at least one email recipient.')
      return { channel: 'flow', cancelled: true }
    }
    const payload = {
      emailTo: recipients,
      emailSubject: subject,
      emailBody: bodyHtml,
    }

    try {
      const response = await fetch(POWER_AUTOMATE_EMAIL_FLOW_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!response.ok) throw new Error(`Flow request failed with status ${response.status}`)
      return { channel: 'flow', cancelled: false }
    } catch (error) {
      console.error('Power Automate email flow failed.', error)
      window.alert('Email could not be sent via Power Automate. Please check flow setup/payload.')
      return { channel: 'flow', cancelled: true }
    }
  }

  function kvLine(label: string, value: string): string {
    return `${label.padEnd(22)} ${value}`
  }

  function formatTimeForMail(value: string, label: 'STD' | 'STA'): string {
    const trimmed = value.trim()
    return trimmed.length > 0 ? `${label} ${trimmed}` : `[${label}]`
  }

  function getFuelCorrectionFactor(currentFuelPrice: number, basicFuelPrice: number): number {
    if (!Number.isFinite(currentFuelPrice) || currentFuelPrice < 0) return 1
    if (!Number.isFinite(basicFuelPrice) || basicFuelPrice <= 0) return 1
    return Math.max(0, currentFuelPrice / basicFuelPrice)
  }

  const acmiBreakdown = useMemo<AcmiBreakdown | null>(() => {
    if (!form.enableAcmiModule) return null
    const lines = enabledAcmiLines
    if (lines.length === 0) return null

    const acmiAircraft = (form.acmiAircraft || selectedOriginalType) as Exclude<AircraftType, 'SUB Narrowbody' | 'SUB Widebody'>
    const acmiHotacDkk = form.acmiHotacNights * getHotacRateDkkPerNight(acmiAircraft)
    const ownScaExtraCrewPerDiemEur = form.acmiCrewPerDiemOperatingDays * getCrewPerDiemRateEurPerDay(acmiAircraft)

    let totalBlh = 0
    let operatingCost = 0
    const details: string[] = []

    lines.forEach((line, index) => {
      const blh = derivePositioningBlh(line) || ownBlhDefaults[acmiAircraft]
      const docPerBlh = acmiDocPerBlhByAircraft[acmiAircraft]
      const lineCost = blh * docPerBlh
      const excludedPerBlh = 0

      totalBlh += blh
      operatingCost += lineCost
      details.push(
        `ACMI leg ${index + 1} (${acmiAircraft}): ${blh.toFixed(2)} BLH * ${docPerBlh.toFixed(2)} = ${toCurrency(lineCost)}`,
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
      (form.ownIncludeScaExtraHotac ? acmiHotacDkk : 0) +
      (form.ownIncludeScaExtraCrewPerDiem ? ownScaExtraCrewPerDiemEur * form.eurToDkkRate : 0)
    const acmiProfitPercent = Math.max(20, form.acmiSafetyMarginPercent)
    const marginMultiplier = 1 + acmiProfitPercent / 100
    const baseCostDkk = operatingCost + crewCost + ownAddOns
    const totalCostDkk = baseCostDkk * marginMultiplier
    const marginDkk = totalCostDkk - baseCostDkk
    const minimumBlhDkk = totalBlh > 0 ? totalCostDkk / totalBlh : 0
    const minimumBlhEur = form.eurToDkkRate > 0 ? minimumBlhDkk / form.eurToDkkRate : 0

    details.push(`Crew cost contribution: ${toCurrency(crewCost)}`)
    details.push(`SCA add-ons contribution: ${toCurrency(ownAddOns)}`)
    details.push(`HOTAC setup: ${form.acmiHotacNights} nights * ${getHotacRateDkkPerNight(acmiAircraft)} DKK/night`)
    details.push(
      `Crew per Diem setup: ${form.acmiCrewPerDiemOperatingDays} days * ${getCrewPerDiemRateEurPerDay(acmiAircraft)} EUR/day`,
    )
    details.push(`ACMI profit: ${acmiProfitPercent.toFixed(0)}%`)
    details.push('Excluded from ACMI minimum price: Fuel, Handling, Turnaround aircraft, Turnaround pax.')

    return {
      totalBlh,
      baseCostDkk,
      marginDkk,
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
    form.acmiAircraft,
    form.acmiHotacNights,
    form.acmiCrewPerDiemOperatingDays,
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
    selectedOriginalType,
  ])

  const adhocBreakdown = useMemo<AdhocBreakdown | null>(() => {
    if (!form.enableAdhocModule) return null
    const lines = enabledAdhocLines
    if (lines.length === 0) return null

    const adhocAircraft = (form.adhocAircraft || selectedOriginalType) as Exclude<AircraftType, 'SUB Narrowbody' | 'SUB Widebody'>
    const ownScaExtraCrewPerDiemEur = form.adhocCrewPerDiemOperatingDays * getCrewPerDiemRateEurPerDay(adhocAircraft)
    const adhocHotacDkk = form.adhocHotacNights * getHotacRateDkkPerNight(adhocAircraft)
    const fuelPerBlh = baselineByAircraft[adhocAircraft].componentsPerBlh.fuel ?? 0
    const nonFuelPerBlh = Math.max(0, ownDocPerBlhByAircraft[adhocAircraft] - fuelPerBlh)
    const ownershipAndMaintPerBlh =
      baselineByAircraft[adhocAircraft].ownershipCostPerBlh + baselineByAircraft[adhocAircraft].maintenanceFixedPerBlh
    const insurancePerFlight = baselineByAircraft[adhocAircraft].insurancePerFlight
    const fuelCorrectionFactor = form.adhocUseFuelCorrection
      ? getFuelCorrectionFactor(form.adhocFuelPriceCurrent, form.adhocFuelPriceBasicRef)
      : 1
    const adjustedDocPerBlh = nonFuelPerBlh + fuelPerBlh * fuelCorrectionFactor

    let totalBlh = 0
    let operatingCost = 0
    const details: string[] = []

    lines.forEach((line, index) => {
      const blh = derivePositioningBlh(line) || ownBlhDefaults[adhocAircraft]
      const lineCost = blh * adjustedDocPerBlh + blh * ownershipAndMaintPerBlh + insurancePerFlight

      totalBlh += blh
      operatingCost += lineCost
      details.push(
        `Adhoc leg ${index + 1} (${adhocAircraft}): DOC ${blh.toFixed(2)} * ${adjustedDocPerBlh.toFixed(2)} + fixed ${blh.toFixed(
          2,
        )} * ${(ownershipAndMaintPerBlh).toFixed(2)} + insurance ${toCurrency(insurancePerFlight)} = ${toCurrency(lineCost)}`,
      )
    })

    const crewCost =
      form.crewCostFcDays * form.crewCostFcDkkPerDay +
      form.crewCostFoDays * form.crewCostFoDkkPerDay +
      form.crewCostCabinDays * form.crewCostCabinDkkPerDay +
      form.crewCostCabinSdDays * form.crewCostCabinSdDkkPerDay
    const ownAddOns =
      (form.ownIncludeScaExtraHotac ? adhocHotacDkk : 0) +
      (form.ownIncludeScaExtraCrewPerDiem ? ownScaExtraCrewPerDiemEur * form.eurToDkkRate : 0)
    const baseTotalDkk = operatingCost + crewCost + ownAddOns
    const marginMultiplier = 1 + Math.max(0, form.adhocSafetyMarginPercent) / 100
    const minimumTotalDkk = baseTotalDkk * marginMultiplier
    const marginDkk = minimumTotalDkk - baseTotalDkk
    const minimumTotalEur = form.eurToDkkRate > 0 ? minimumTotalDkk / form.eurToDkkRate : 0
    const minimumBlhDkk = totalBlh > 0 ? minimumTotalDkk / totalBlh : 0
    const minimumBlhEur = form.eurToDkkRate > 0 ? minimumBlhDkk / form.eurToDkkRate : 0

    details.push(`Operating cost (full DOC, all elements included): ${toCurrency(operatingCost)}`)
    details.push(
      form.adhocUseFuelCorrection
        ? `Fuel correction factor = current/reference (USD/MT): ${form.adhocFuelPriceCurrent.toFixed(2)} / ${form.adhocFuelPriceBasicRef.toFixed(2)} = ${fuelCorrectionFactor.toFixed(3)}`
        : 'Fuel correction disabled (factor = 1.000)',
    )
    details.push(
      `Adhoc variable DOC per BLH (fuel adjusted): non-fuel ${toCurrency(nonFuelPerBlh)} + fuel ${toCurrency(fuelPerBlh)} * factor ${fuelCorrectionFactor.toFixed(3)} = ${toCurrency(adjustedDocPerBlh)}`,
    )
    details.push(
      `Adhoc fixed baseline per BLH: ownership + maintenance = ${toCurrency(ownershipAndMaintPerBlh)}; insurance per flight: ${toCurrency(insurancePerFlight)}`,
    )
    details.push(`Crew cost contribution: ${toCurrency(crewCost)}`)
    details.push(`SCA add-ons contribution: ${toCurrency(ownAddOns)}`)
    details.push(
      `Crew per Diem setup: ${form.adhocCrewPerDiemOperatingDays} days * ${getCrewPerDiemRateEurPerDay(adhocAircraft)} EUR/day`,
    )
    details.push(`HOTAC setup: ${form.adhocHotacNights} nights * ${getHotacRateDkkPerNight(adhocAircraft)} DKK/night`)
    details.push(`Adhoc profit: ${form.adhocSafetyMarginPercent.toFixed(0)}%`)

    return {
      totalBlh,
      totalCostDkk: baseTotalDkk,
      marginDkk,
      minimumTotalDkk,
      minimumTotalEur,
      minimumBlhDkk,
      minimumBlhEur,
      details,
    }
  }, [
    baselineByAircraft,
    ownBlhDefaults,
    ownDocPerBlhByAircraft,
    enabledAdhocLines,
    form.adhocFuelPriceBasicRef,
    form.adhocFuelPriceCurrent,
    form.adhocSafetyMarginPercent,
    form.adhocAircraft,
    form.adhocCrewPerDiemOperatingDays,
    form.adhocHotacNights,
    form.adhocUseFuelCorrection,
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
    form.ownScaExtraHotacDkk,
    selectedOriginalType,
  ])

  async function sendAcmiInternalEmail() {
    if (!acmiBreakdown) return
    const aircraft = form.acmiAircraft || selectedOriginalType
    const flightNumbers = form.acmiLines
      .filter((line) => line.enabled && line.flightNumber.trim().length > 0)
      .map((line) => line.flightNumber.trim())
    const flightRef = flightNumbers.length > 0 ? flightNumbers.join('/') : ''
    const startDateRef = getModuleStartDateForSubject(form.acmiLines)
    const subject = flightRef ? `ACMI Offer ${flightRef} ${startDateRef}` : `ACMI Offer ${startDateRef}`
    const crewFcCost = form.crewCostFcDays * form.crewCostFcDkkPerDay
    const crewFoCost = form.crewCostFoDays * form.crewCostFoDkkPerDay
    const crewCabinCost = form.crewCostCabinDays * form.crewCostCabinDkkPerDay
    const crewCabinSdCost = form.crewCostCabinSdDays * form.crewCostCabinSdDkkPerDay
    const crewTotal = crewFcCost + crewFoCost + crewCabinCost + crewCabinSdCost
    const acmiAircraft = (form.acmiAircraft || selectedOriginalType) as Exclude<AircraftType, 'SUB Narrowbody' | 'SUB Widebody'>
    const acmiHotacDkkFromNights = form.acmiHotacNights * getHotacRateDkkPerNight(acmiAircraft)
    const acmiCrewPerDiemEur = form.acmiCrewPerDiemOperatingDays * getCrewPerDiemRateEurPerDay(acmiAircraft)
    const acmiOperatingCost = enabledAcmiLines.reduce((sum, line) => {
      const blh = derivePositioningBlh(line) || ownBlhDefaults[acmiAircraft]
      return sum + blh * acmiDocPerBlhByAircraft[acmiAircraft]
    }, 0)
    const acmiAddOns =
      (form.ownIncludeScaExtraHotac ? acmiHotacDkkFromNights : 0) +
      (form.ownIncludeScaExtraCrewPerDiem ? acmiCrewPerDiemEur * form.eurToDkkRate : 0)
    const acmiProfitPercent = Math.max(20, form.acmiSafetyMarginPercent)
    const acmiHotacDkk = form.ownIncludeScaExtraHotac ? acmiHotacDkkFromNights : 0
    const acmiCrewPerDiemDkk = form.ownIncludeScaExtraCrewPerDiem ? acmiCrewPerDiemEur * form.eurToDkkRate : 0
    const acmiTotalEur = form.eurToDkkRate > 0 ? acmiBreakdown.totalCostDkk / form.eurToDkkRate : 0
    const roundedBlhRateEur = Math.round(acmiBreakdown.totalBlh > 0 ? acmiTotalEur / acmiBreakdown.totalBlh : 0)
    const routingTable = buildModuleRoutingTableLines(form.acmiLines, 'ACMI')
    const startDateText = getModuleStartDateText(form.acmiLines)
    const delivery = await openEmailDraftToRecipients(subject, [
      'Hello,',
      '',
      'ACMI OFFER - PRICE DETAILS',
      kvLine('Start date:', startDateText),
      kvLine('Aircraft type:', aircraft),
      kvLine('EUR/DKK rate:', form.eurToDkkRate.toFixed(2)),
      '',
      'ROUTING',
      ...routingTable,
      '',
      'SCA CREW COSTS (DKK)',
      kvLine('FC:', `${form.crewCostFcDays} days * ${toCurrency(form.crewCostFcDkkPerDay)} = ${toCurrency(crewFcCost)}`),
      kvLine('FO:', `${form.crewCostFoDays} days * ${toCurrency(form.crewCostFoDkkPerDay)} = ${toCurrency(crewFoCost)}`),
      kvLine('Cabin:', `${form.crewCostCabinDays} days * ${toCurrency(form.crewCostCabinDkkPerDay)} = ${toCurrency(crewCabinCost)}`),
      kvLine(
        'Cabin SD:',
        `${form.crewCostCabinSdDays} days * ${toCurrency(form.crewCostCabinSdDkkPerDay)} = ${toCurrency(crewCabinSdCost)}`,
      ),
      kvLine('Total crew costs:', toCurrency(crewTotal)),
      '',
      'COST SUMMARY (DKK)',
      kvLine('Operating:', toCurrency(acmiOperatingCost)),
      kvLine('Crew:', toCurrency(crewTotal)),
      kvLine('HOTAC:', toCurrency(acmiHotacDkk)),
      kvLine('HOTAC setup:', `${form.acmiHotacNights} nights * ${toCurrency(getHotacRateDkkPerNight(acmiAircraft))}/night`),
      kvLine('Crew per diem:', toCurrency(acmiCrewPerDiemDkk)),
      kvLine('Add-ons total:', toCurrency(acmiAddOns)),
      kvLine('Subtotal before margin:', toCurrency(acmiBreakdown.baseCostDkk)),
      kvLine(`Margin (${acmiProfitPercent.toFixed(0)}%):`, toCurrency(acmiBreakdown.marginDkk)),
      kvLine('TOTAL:', toCurrency(acmiBreakdown.totalCostDkk)),
      '',
      'PRICE',
      kvLine('Total EUR:', toEur(acmiTotalEur)),
      kvLine('Minimum BLH:', `${acmiBreakdown.totalBlh.toFixed(2)} BLH`),
      kvLine('BLH rate (EUR/hour):', toEur(roundedBlhRateEur)),
      '',
      'CALCULATION TRACE',
      ...acmiBreakdown.details.map((line) => `- ${line}`),
    ], form.acmiEmailRecipients)
    if (delivery.cancelled) return
    window.alert('Mail sent.')
    setForm((prev) => ({ ...prev, acmiEmailRecipients: '' }))
  }

  async function sendAcmiCustomerEmail() {
    if (!acmiBreakdown) return
    const aircraft = form.acmiAircraft || selectedOriginalType
    const flightNumbers = form.acmiLines
      .filter((line) => line.enabled && line.flightNumber.trim().length > 0)
      .map((line) => line.flightNumber.trim())
    const flightRef = flightNumbers.length > 0 ? flightNumbers.join('/') : ''
    const startDateRef = getModuleStartDateForSubject(form.acmiLines)
    const subject = flightRef ? `ACMI Offer ${flightRef} ${startDateRef}` : `ACMI Offer ${startDateRef}`
    const roundedClientDkk = roundUpToNearestHundred(acmiBreakdown.totalCostDkk)
    const roundedClientEur = roundUpToNearestHundred(form.eurToDkkRate > 0 ? acmiBreakdown.totalCostDkk / form.eurToDkkRate : 0)
    const roundedBlhRateEur = Math.round(acmiBreakdown.totalBlh > 0 ? roundedClientEur / acmiBreakdown.totalBlh : 0)
    const routingTable = buildModuleRoutingTableLines(form.acmiLines, 'ACMI')
    const startDateText = getModuleStartDateText(form.acmiLines)
    const delivery = await openEmailDraftToRecipients(subject, [
      'Hello,',
      '',
      'Please find the ACMI proposal below.',
      '',
      kvLine('Start date:', startDateText),
      kvLine('Aircraft type:', aircraft),
      '',
      'ROUTING',
      ...routingTable,
      '',
      'PRICE',
      kvLine('Total DKK:', toCurrency(roundedClientDkk)),
      kvLine('Total EUR:', toEur(roundedClientEur)),
      kvLine('Minimum BLH:', `${acmiBreakdown.totalBlh.toFixed(2)} BLH`),
      kvLine('BLH rate (EUR/hour):', toEur(roundedBlhRateEur)),
    ], form.acmiEmailRecipients)
    if (delivery.cancelled) return
    window.alert('Mail sent.')
    setForm((prev) => ({ ...prev, acmiEmailRecipients: '' }))
  }

  async function sendAdhocInternalEmail() {
    if (!adhocBreakdown) return
    const aircraft = form.adhocAircraft || selectedOriginalType
    const flightNumbers = form.adhocLines
      .filter((line) => line.enabled && line.flightNumber.trim().length > 0)
      .map((line) => line.flightNumber.trim())
    const flightRef = flightNumbers.length > 0 ? flightNumbers.join('/') : '[FLTNO]'
    const startDateRef = getModuleStartDateForSubject(form.adhocLines)
    const subject = `Adhoc Offer ${flightRef} ${startDateRef}`
    const crewFcCost = form.crewCostFcDays * form.crewCostFcDkkPerDay
    const crewFoCost = form.crewCostFoDays * form.crewCostFoDkkPerDay
    const crewCabinCost = form.crewCostCabinDays * form.crewCostCabinDkkPerDay
    const crewCabinSdCost = form.crewCostCabinSdDays * form.crewCostCabinSdDkkPerDay
    const crewTotal = crewFcCost + crewFoCost + crewCabinCost + crewCabinSdCost
    const adhocAircraft = (form.adhocAircraft || selectedOriginalType) as Exclude<AircraftType, 'SUB Narrowbody' | 'SUB Widebody'>
    const adhocCrewPerDiemEur = form.adhocCrewPerDiemOperatingDays * getCrewPerDiemRateEurPerDay(adhocAircraft)
    const adhocHotacDkkFromNights = form.adhocHotacNights * getHotacRateDkkPerNight(adhocAircraft)
    const adhocFuelPerBlh = baselineByAircraft[adhocAircraft].componentsPerBlh.fuel ?? 0
    const adhocNonFuelPerBlh = Math.max(0, ownDocPerBlhByAircraft[adhocAircraft] - adhocFuelPerBlh)
    const adhocOwnershipAndMaintPerBlh =
      baselineByAircraft[adhocAircraft].ownershipCostPerBlh + baselineByAircraft[adhocAircraft].maintenanceFixedPerBlh
    const adhocInsurancePerFlight = baselineByAircraft[adhocAircraft].insurancePerFlight
    const adhocFuelCorrectionFactor = form.adhocUseFuelCorrection
      ? getFuelCorrectionFactor(form.adhocFuelPriceCurrent, form.adhocFuelPriceBasicRef)
      : 1
    const adhocAdjustedDocPerBlh = adhocNonFuelPerBlh + adhocFuelPerBlh * adhocFuelCorrectionFactor
    const adhocOperatingCost = enabledAdhocLines.reduce((sum, line) => {
      const blh = derivePositioningBlh(line) || ownBlhDefaults[adhocAircraft]
      return sum + blh * adhocAdjustedDocPerBlh + blh * adhocOwnershipAndMaintPerBlh + adhocInsurancePerFlight
    }, 0)
    const adhocAddOns =
      (form.ownIncludeScaExtraHotac ? adhocHotacDkkFromNights : 0) +
      (form.ownIncludeScaExtraCrewPerDiem ? adhocCrewPerDiemEur * form.eurToDkkRate : 0)
    const adhocHotacDkk = form.ownIncludeScaExtraHotac ? adhocHotacDkkFromNights : 0
    const adhocCrewPerDiemDkk = form.ownIncludeScaExtraCrewPerDiem ? adhocCrewPerDiemEur * form.eurToDkkRate : 0
    const routingTable = buildModuleRoutingTableLines(form.adhocLines, 'Adhoc')
    const startDateText = getModuleStartDateText(form.adhocLines)
    const adhocSignature = ['__SIGNATURE_SPACER__', 'Kind regards,', 'Jakob']
    const delivery = await openEmailDraftToRecipients(subject, [
      'Hello,',
      '',
      'ADHOC OFFER - PRICE DETAILS',
      kvLine('Start date:', startDateText),
      kvLine('Aircraft type:', aircraft),
      kvLine('EUR/DKK rate:', form.eurToDkkRate.toFixed(2)),
      '',
      'ROUTING',
      ...routingTable,
      '',
      'SCA CREW COSTS (DKK)',
      kvLine('FC:', `${form.crewCostFcDays} days * ${toCurrency(form.crewCostFcDkkPerDay)} = ${toCurrency(crewFcCost)}`),
      kvLine('FO:', `${form.crewCostFoDays} days * ${toCurrency(form.crewCostFoDkkPerDay)} = ${toCurrency(crewFoCost)}`),
      kvLine('Cabin:', `${form.crewCostCabinDays} days * ${toCurrency(form.crewCostCabinDkkPerDay)} = ${toCurrency(crewCabinCost)}`),
      kvLine(
        'Cabin SD:',
        `${form.crewCostCabinSdDays} days * ${toCurrency(form.crewCostCabinSdDkkPerDay)} = ${toCurrency(crewCabinSdCost)}`,
      ),
      kvLine('Total crew costs:', toCurrency(crewTotal)),
      '',
      'COST SUMMARY (DKK)',
      kvLine('Operating:', toCurrency(adhocOperatingCost)),
      kvLine(
        'Fuel correction factor:',
        form.adhocUseFuelCorrection
          ? `${form.adhocFuelPriceCurrent.toFixed(2)} / ${form.adhocFuelPriceBasicRef.toFixed(2)} = ${adhocFuelCorrectionFactor.toFixed(3)} (USD/MT)`
          : 'Disabled (1.000)',
      ),
      kvLine('Crew:', toCurrency(crewTotal)),
      kvLine('HOTAC:', toCurrency(adhocHotacDkk)),
      kvLine('HOTAC setup:', `${form.adhocHotacNights} nights * ${toCurrency(getHotacRateDkkPerNight(adhocAircraft))}/night`),
      kvLine('Crew per diem:', toCurrency(adhocCrewPerDiemDkk)),
      kvLine('Add-ons total:', toCurrency(adhocAddOns)),
      kvLine('Subtotal before margin:', toCurrency(adhocBreakdown.totalCostDkk)),
      kvLine(`Margin (${form.adhocSafetyMarginPercent.toFixed(0)}%):`, toCurrency(adhocBreakdown.marginDkk)),
      kvLine('TOTAL:', toCurrency(adhocBreakdown.minimumTotalDkk)),
      '',
      'PRICE',
      kvLine('Total EUR:', toEur(adhocBreakdown.minimumTotalEur)),
      kvLine('Min BLH DKK:', toCurrency(adhocBreakdown.minimumBlhDkk)),
      kvLine('Min BLH EUR:', toEur(adhocBreakdown.minimumBlhEur)),
      kvLine('Total BLH:', adhocBreakdown.totalBlh.toFixed(2)),
      '',
      'CALCULATION TRACE',
      ...adhocBreakdown.details.map((line) => `- ${line}`),
    ], form.adhocEmailRecipients, adhocSignature)
    if (delivery.cancelled) return
    window.alert('Mail sent.')
    setForm((prev) => ({ ...prev, adhocEmailRecipients: '' }))
  }

  async function sendAdhocCustomerEmail() {
    if (!adhocBreakdown) return
    const aircraft = form.adhocAircraft || selectedOriginalType
    const flightNumbers = form.adhocLines
      .filter((line) => line.enabled && line.flightNumber.trim().length > 0)
      .map((line) => line.flightNumber.trim())
    const flightRef = flightNumbers.length > 0 ? flightNumbers.join('/') : '[FLTNO]'
    const startDateRef = getModuleStartDateForSubject(form.adhocLines)
    const subject = `Adhoc Offer ${flightRef} ${startDateRef}`
    const roundedClientDkk = roundUpToNearestHundred(adhocBreakdown.minimumTotalDkk)
    const roundedClientEur = roundUpToNearestHundred(adhocBreakdown.minimumTotalEur)
    const routingTable = buildModuleRoutingTableLines(form.adhocLines, 'Adhoc')
    const startDateText = getModuleStartDateText(form.adhocLines)
    const seatTextByAircraft: Record<'A321' | 'A321N' | 'A339', string> = {
      A321: '212 seats',
      A321N: '218 seats',
      A339: '373 seats',
    }
    const paxTextByAircraft: Record<'A321' | 'A321N' | 'A339', string> = {
      A321: '212',
      A321N: '218',
      A339: '373',
    }
    const adhocAircraft = (form.adhocAircraft || selectedOriginalType) as Exclude<AircraftType, 'SUB Narrowbody' | 'SUB Widebody'>
    const aircraftSeatsText = seatTextByAircraft[adhocAircraft]
    const paxBasisText = paxTextByAircraft[adhocAircraft]
    const isDanishOffer = form.adhocOfferSendInDanish
    const fuelPriceUsdPerMt = Math.round(estimateUsdPerMtFromDkkPerLiter(form.adhocFuelPriceCurrent, form.eurToDkkRate))
    const adhocFuelPerBlhDkk = baselineByAircraft[adhocAircraft].componentsPerBlh.fuel ?? 0
    const adhocFuelCorrectionFactor = form.adhocUseFuelCorrection
      ? getFuelCorrectionFactor(form.adhocFuelPriceCurrent, form.adhocFuelPriceBasicRef)
      : 1
    const estimatedFuelConsumptionMt = estimateFuelConsumptionMt(
      adhocBreakdown.totalBlh,
      adhocFuelPerBlhDkk,
      adhocFuelCorrectionFactor,
      fuelPriceUsdPerMt,
      form.eurToDkkRate,
    )
    const estimatedFuelConsumptionMtText = estimatedFuelConsumptionMt > 0 ? estimatedFuelConsumptionMt.toFixed(2) : '0.00'
    const paxBasedPriceLine = isDanishOffer
      ? kvLine('Totalpris DKK:', `${toCurrency(roundedClientDkk)}, baseret på ${paxBasisText} pax`)
      : kvLine('Total Price EUR:', `${toEur(roundedClientEur)}, based on ${paxBasisText} pax`)
    const adhocSignature = ['__SIGNATURE_SPACER__', 'Kind regards,', 'Jakob']
    const delivery = await openEmailDraftToRecipients(subject, [
      isDanishOffer ? 'Hej,' : 'Hello,',
      '',
      isDanishOffer ? 'Nedenfor finder du Adhoc-tilbuddet.' : 'Please find the Adhoc proposal below.',
      '',
      kvLine(isDanishOffer ? 'Startdato:' : 'Start date:', startDateText),
      kvLine(isDanishOffer ? 'Aircraft type:' : 'Aircraft type:', `${aircraft} (${aircraftSeatsText})`),
      '',
      isDanishOffer ? 'Alle tider er UTC og med forbehold for slot tider.' : 'All times UTC and subject to slots.',
      '',
      'ROUTING',
      ...routingTable,
      '',
      isDanishOffer ? 'PRIS' : 'PRICE',
      paxBasedPriceLine,
      '',
      isDanishOffer
        ? `Fuelomkostningen i dette tilbud er fastsat ved en fuelpris på USD ${fuelPriceUsdPerMt}/MT og et samlet forbrug på ${estimatedFuelConsumptionMtText} MT, inklusive tomflyvninger. Afviger den faktiske fuelomkostning med mere end +/-5 % i forhold til det beregnede niveau, foretages en efterregulering.`
        : `The fuel cost in this offer is based on a fuel price of USD ${fuelPriceUsdPerMt}/MT and an estimated fuel consumption of ${estimatedFuelConsumptionMtText} MT, including ferry flights. If the actual fuel cost deviates by more than +/-5% from the estimate, a fuel cost reconciliation shall apply.`,
      '',
      isDanishOffer
        ? 'Efterreguleringen beregnes som forskellen mellem den i tilbuddet anvendte fuelomkostning og fuelomkostningen pr. dato for første liveflyvning, baseret på Platts Global Index samt det estimerede samlede forbrug. Reguleringen vil gælde for det fulde program, inkl. tomflyvninger.'
        : 'The reconciliation is calculated as the difference between the fuel cost applied in this offer and the fuel cost at the date of first live flight, based on the Platts Global Index and the estimated total consumption. The reconciliation applies to the full flight program, including ferry flights.',
      '',
      isDanishOffer ? 'Charterprisen inkluderer:' : 'The charter price includes:',
      isDanishOffer ? '- 10 % kommission.' : '- All known taxes and fees.',
      isDanishOffer ? '- Alle kendte skatter og afgifter.' : '- Standard catering served with coffee, tea, and soft drinks.',
      ...(isDanishOffer ? ['- Standard catering, serveret med kaffe, te og soft drinks.'] : []),
      '',
      isDanishOffer
        ? 'Vort tilbud er altid med forbehold for crew og kapacitet til endelig bekræftelse.'
        : 'This offer is subject to crew, capacity and prior sales until final confirmation.',
    ], form.adhocEmailRecipients, adhocSignature)
    if (delivery.cancelled) return
    window.alert('Mail sent.')
    setForm((prev) => ({ ...prev, adhocEmailRecipients: '' }))
  }

  function composeMainToolEmail() {
    if (!form.originalType || results.length === 0 || activeLegs.length === 0) return
    const dateRef = formatSubjectDate(form.navblueFlightDate)
    const subject = `IRREG Main Tool Options ${dateRef}`
    const routeRows = activeLegs.map((leg, idx) => {
      const key = (['leg1', 'leg2', 'leg3', 'leg4'] as const)[idx]
      const resolved = deriveMainRouteBlh(leg, routeCityPairBlhByLeg[key])
      const blh = resolved.hours && resolved.hours > 0 ? formatBlhFromHours(resolved.hours) : '[BLH]'
      const pax = Number.isFinite(leg.pax) ? String(leg.pax) : 'NA'
      return [`Leg ${idx + 1}`, withFallback(leg.from, 'From'), withFallback(leg.to, 'To'), withFallback(leg.depUtc, 'STD'), withFallback(leg.arrUtc, 'STA'), blh, pax]
    })
    const routeTable = buildAsciiTable(['Leg', 'From', 'To', 'STD', 'STA', 'BLH', 'Pax'], routeRows)
    const optionOverview = results.map(
      (result, idx) =>
        `${idx + 1}. ${result.name} | Delta ${toSignedDkkDelta(result.evaluatedTotalDkk)} | Capacity ${result.seatCapacity} | Overflow ${result.overflowPax}`,
    )
    const optionDetails = results.flatMap((result) => [
      '',
      `${result.name}`,
      `- Difference from original: ${toSignedDkkDelta(result.evaluatedTotalDkk)}`,
      `- EU261 (EUR): ${toEur(result.eu261CostEur)}`,
      `- Overnight (EUR): ${toEur(result.overnightCostEur)}`,
      `- Overflow cost: ${toCurrency(result.overflowCost)}`,
      `- Crew cost: ${toCurrency(result.crewCost)}`,
      '- Cost details:',
      ...result.details.map((line) => `  - ${line}`),
    ])

    openEmailDraftToRecipients(subject, [
      'Hello,',
      '',
      'Main tool scenario setup and option comparison.',
      '',
      `Flight date: ${withFallback(form.navblueFlightDate, 'Flight date')}`,
      `Original aircraft: ${form.originalType}`,
      `EUR/DKK rate: ${form.eurToDkkRate.toFixed(2)}`,
      '',
      'Route / BLH / Pax (table):',
      ...routeTable,
      '',
      'Enabled option inputs:',
      `- Own SCA flights: ${form.enableOwnScaFlights ? 'Yes' : 'No'} (A321 ${form.ownAvailableA321}, A321N ${form.ownAvailableA321N}, A339 ${form.ownAvailableA339})`,
      `- Subcharter Option 1: ${form.enableSubOption1 ? 'Yes' : 'No'}`,
      `- Subcharter Option 2: ${form.enableSubOption2 ? 'Yes' : 'No'}`,
      `- Subcharter Option 3: ${form.enableSubOption3 ? 'Yes' : 'No'}`,
      '',
      'RESULT OVERVIEW',
      ...optionOverview,
      '',
      'DETAILED RESULT SUGGESTIONS',
      ...optionDetails,
      '',
      'Fields marked with [] can be completed manually if missing.',
    ], '')
  }

  async function submitEmailConfirm() {
    if (!emailConfirmState) return
    const action = emailConfirmState.type
    setEmailConfirmState(null)
    if (action === 'acmi-internal') await sendAcmiInternalEmail()
    if (action === 'acmi-client') await sendAcmiCustomerEmail()
    if (action === 'adhoc-internal') await sendAdhocInternalEmail()
    if (action === 'adhoc-client') await sendAdhocCustomerEmail()
  }

  useEffect(() => {
    if (isToolMode || !form.originalType || results.length === 0 || routeLegsWithStations.length === 0) {
      clearHistoryDebounce('main')
      return
    }
    const routeSignature = routeLegsWithStations
      .map(({ key, leg }) => `${leg.from}-${leg.to}-${leg.depUtc}-${leg.arrUtc}-${routeLegHoursByKey[key] ?? 0}`)
      .join('|')
    const resultSignature = results
      .slice(0, 5)
      .map((result) => `${result.id}:${Math.round(result.evaluatedTotalDkk)}:${result.overflowPax}`)
      .join('|')
    const signature = `main:${form.originalType}:${routeSignature}:${resultSignature}`
    const topOptions = results.slice(0, 3).map((result) => `${result.name}: ${toSignedDkkDelta(result.evaluatedTotalDkk)}`)
    debounceHistoryPush('main', () =>
      pushScenarioHistory('main', signature, 'Main Tool', [
        `Original type: ${form.originalType}`,
        `Route legs: ${routeLegsWithStations.length}`,
        `Best option: ${results[0].name} (${toSignedDkkDelta(results[0].evaluatedTotalDkk)})`,
        ...topOptions,
      ]),
    )
  }, [form.originalType, isToolMode, results, routeLegHoursByKey, routeLegsWithStations])

  useEffect(() => {
    if (!form.enableAcmiModule || !acmiBreakdown) {
      clearHistoryDebounce('acmi')
      return
    }
    const enabledLines = form.acmiLines.filter((line) => line.enabled)
    if (enabledLines.length === 0) {
      clearHistoryDebounce('acmi')
      return
    }
    if (!enabledLines.every((line) => isModuleLineComplete(line))) {
      clearHistoryDebounce('acmi')
      return
    }
    const routing = buildModuleRoutingOverview(form.acmiLines, 'ACMI')
    const signature = `acmi:${form.acmiAircraft || selectedOriginalType}:${routing.join('|')}`
    debounceHistoryPush('acmi', () =>
      pushScenarioHistory('acmi', signature, 'ACMI Tool', [
        `Aircraft: ${form.acmiAircraft || selectedOriginalType}`,
        `Total BLH: ${acmiBreakdown.totalBlh.toFixed(2)}`,
        `Total price: ${toCurrency(acmiBreakdown.totalCostDkk)} / ${toEur(form.eurToDkkRate > 0 ? acmiBreakdown.totalCostDkk / form.eurToDkkRate : 0)}`,
        `Margin: ${toCurrency(acmiBreakdown.marginDkk)} (${form.acmiSafetyMarginPercent.toFixed(0)}%)`,
        ...routing,
      ]),
    )
  }, [acmiBreakdown, form.acmiAircraft, form.acmiLines, form.acmiSafetyMarginPercent, form.enableAcmiModule, form.eurToDkkRate, selectedOriginalType])

  useEffect(() => {
    if (!form.enableAdhocModule || !adhocBreakdown) {
      clearHistoryDebounce('adhoc')
      return
    }
    const enabledLines = form.adhocLines.filter((line) => line.enabled)
    if (enabledLines.length === 0) {
      clearHistoryDebounce('adhoc')
      return
    }
    if (!enabledLines.every((line) => isModuleLineComplete(line))) {
      clearHistoryDebounce('adhoc')
      return
    }
    const routing = buildModuleRoutingOverview(form.adhocLines, 'Adhoc')
    const signature = `adhoc:${form.adhocAircraft || selectedOriginalType}:${routing.join('|')}`
    debounceHistoryPush('adhoc', () =>
      pushScenarioHistory('adhoc', signature, 'Adhoc Tool', [
        `Aircraft: ${form.adhocAircraft || selectedOriginalType}`,
        `Total BLH: ${adhocBreakdown.totalBlh.toFixed(2)}`,
        `Total price: ${toCurrency(adhocBreakdown.minimumTotalDkk)} / ${toEur(adhocBreakdown.minimumTotalEur)}`,
        `Margin: ${toCurrency(adhocBreakdown.marginDkk)} (${form.adhocSafetyMarginPercent.toFixed(0)}%)`,
        ...routing,
      ]),
    )
  }, [
    adhocBreakdown,
    form.adhocAircraft,
    form.adhocLines,
    form.adhocSafetyMarginPercent,
    form.enableAdhocModule,
    selectedOriginalType,
  ])

  useEffect(
    () => () => {
      clearHistoryDebounce('main')
      clearHistoryDebounce('acmi')
      clearHistoryDebounce('adhoc')
    },
    [],
  )

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

  function getAuditComponentSummary(aircraft: AircraftType): AuditComponentSummary {
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

    routeLegsWithStations.forEach(({ key }) => {
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
      const blh = routeLegHoursByKey[key] ?? fallbackBlh
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
                    if (!showBaselinePanel) {
                      requestAdminAccess('baseline')
                      return
                    }
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
              {eurRateFetchMeta ? <span className="top-rate-meta">({eurRateFetchMeta})</span> : null}
            </label>
            <button type="button" className="reset-btn" onClick={resetAll}>
              Reset all fields
            </button>
          </div>
        </div>
        {adminPromptTarget ? (
          <div className="admin-modal-backdrop">
            <div className="admin-modal-card">
              <h4>Admin password required</h4>
              <input
                type="password"
                value={adminPasswordInput}
                onChange={(event) => setAdminPasswordInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    submitAdminAccess()
                  }
                }}
                placeholder="Enter admin password"
                autoFocus
              />
              <div className="admin-modal-actions">
                <button type="button" onClick={submitAdminAccess}>
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAdminPromptTarget(null)
                    setAdminPasswordInput('')
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : null}
        {emailConfirmState ? (
          <div className="admin-modal-backdrop">
            <div className="admin-modal-card">
              <h4>Confirm send</h4>
              <p>
                {emailConfirmState.type === 'acmi-internal' || emailConfirmState.type === 'adhoc-internal'
                  ? 'Are you sure you want to send price details (INTERNAL ONLY) to:'
                  : 'Are you sure you want to send offer to:'}
              </p>
              <p>
                <strong>{emailConfirmState.recipients || '[no recipients entered]'}</strong>
              </p>
              <div className="admin-modal-actions">
                <button type="button" onClick={submitEmailConfirm}>
                  Confirm
                </button>
                <button type="button" onClick={() => setEmailConfirmState(null)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : null}

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
              <label key={`baseline-param-${selectedBaselineAircraft}-ownership`}>
                Ownership cost (DKK/BLH)
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={baselineByAircraft[selectedBaselineAircraft].ownershipCostPerBlh}
                  onChange={(event) => {
                    const value = roundToTwo(Number(event.target.value) || 0)
                    setBaselineByAircraft((prev) => ({
                      ...prev,
                      [selectedBaselineAircraft]: {
                        ...prev[selectedBaselineAircraft],
                        ownershipCostPerBlh: value,
                      },
                    }))
                  }}
                />
              </label>
              <label key={`baseline-param-${selectedBaselineAircraft}-maintenance-fixed`}>
                Maintenance fixed (DKK/BLH)
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={baselineByAircraft[selectedBaselineAircraft].maintenanceFixedPerBlh}
                  onChange={(event) => {
                    const value = roundToTwo(Number(event.target.value) || 0)
                    setBaselineByAircraft((prev) => ({
                      ...prev,
                      [selectedBaselineAircraft]: {
                        ...prev[selectedBaselineAircraft],
                        maintenanceFixedPerBlh: value,
                      },
                    }))
                  }}
                />
              </label>
              <label key={`baseline-param-${selectedBaselineAircraft}-insurance`}>
                Insurance (DKK/flight)
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={baselineByAircraft[selectedBaselineAircraft].insurancePerFlight}
                  onChange={(event) => {
                    const value = roundToTwo(Number(event.target.value) || 0)
                    setBaselineByAircraft((prev) => ({
                      ...prev,
                      [selectedBaselineAircraft]: {
                        ...prev[selectedBaselineAircraft],
                        insurancePerFlight: value,
                      },
                    }))
                  }}
                />
              </label>
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
                  The main tool compares recovery scenarios for one disrupted operation based on route setup, available options, seat
                  capacity, positioning impact, and selected commercial assumptions.
                </p>
                <ul>
                  <li>
                    Set <strong>Original aircraft type</strong>, then define each route leg with <strong>From + To OR STD + STA OR BLH</strong>.
                    No hidden BLH fallback is used in route legs anymore.
                  </li>
                  <li>
                    BLH source priority in <strong>Route (UTC)</strong> is: <strong>1) STD/STA</strong>, <strong>2) CityPair</strong>,{' '}
                    <strong>3) manual BLH</strong>. If none are valid, route BLH is treated as 0.
                  </li>
                  <li>
                    CityPair lookup uses OCDC block-time data and fills BLH after you enter From/To. While it runs, you will see{' '}
                    <strong>Loading...</strong> in BLH/source areas.
                  </li>
                  <li>
                    Manual BLH accepts <strong>HH:MM</strong>. If you type <strong>0200</strong>, the tool auto-formats it to{' '}
                    <strong>02:00</strong>. Seconds are not required; BLH is handled in minutes.
                  </li>
                  <li>
                    The entered original route is the shared baseline for all scenarios. Results are shown as difference versus that same
                    baseline.
                  </li>
                  <li>
                    Under <strong>Enabled options</strong>, choose which solution groups are allowed in the result list (own aircraft and/or
                    subcharter options).
                  </li>
                  <li>
                    In <strong>SCA extra positioning flights</strong> and <strong>Subcharter positioning lines</strong>, use per-line{' '}
                    <strong>From+To OR STD+STA OR BLH</strong>. Fields are locked automatically when one method is active.
                  </li>
                  <li>
                    <strong>Add to all results</strong> on a positioning line applies that positioning impact to other relevant scenarios
                    without double-counting on its own matching scenario.
                  </li>
                  <li>
                    Use per-line <strong>Reset</strong> to clear one positioning line. Use <strong>Reset all fields</strong> to reset the whole tool.
                  </li>
                  <li>
                    In <strong>Subcharter Option 1/2/3</strong>, set BLH rate, seats, positioning, and optional HOTAC/crew per diem add-ons.
                  </li>
                  <li>
                    NAVBLUE fetch fills route legs sequentially (Leg 1 to Leg 4) and can also set aircraft type and infants. If NAVBLUE Loads
                    do not contain booked pax for a flight, pax is shown as <strong>NA</strong>.
                  </li>
                  <li>
                    <strong>Overflow</strong> is automatic from seat capacity versus requested pax (per leg), valued with{' '}
                    <strong>Expected overflow cost per pax</strong>.
                  </li>
                  <li>
                    Tune compensation exposure with <strong>Pax seeking compensation (%)</strong>, and enable <strong>EU261</strong> per scenario
                    leg in result cards.
                  </li>
                  <li>
                    You can model sub-solution quality impact with <strong>NPS detractor per pax on sub (DKK)</strong>.
                  </li>
                  <li>
                    Result cards show difference versus original, capacity, overflow, and detailed traces in <strong>Cost details</strong>.{' '}
                    <strong>Best option</strong> marks the currently lowest evaluated cost.
                  </li>
                </ul>
                <p>
                  <strong>Example (quick workflow):</strong> Set original type, fill Leg 1 and Leg 2 with From/To and either CityPair, times,
                  or BLH. Enable own/sub options and available aircraft counts, add needed positioning lines, then adjust overflow/EU261/NPS
                  assumptions. Compare result cards and open Cost details to understand why one solution is cheaper than another.
                </p>
              </details>
            </div>

            <div className="grid compact">
              <label>
                Flight date
                <input
                  type="date"
                  value={form.navblueFlightDate}
                  onChange={(event) => update('navblueFlightDate', event.target.value)}
                />
              </label>
              <label>
                Flight number
                <input
                  value={form.navblueFlightNumber}
                  onChange={(event) => update('navblueFlightNumber', event.target.value.toUpperCase())}
                  placeholder="eg. DK1784"
                />
              </label>
              <label>
                Fetch flight into Route
                <button
                  type="button"
                  onClick={async () => {
                    const flightDate = form.navblueFlightDate.trim()
                    const flightNo = form.navblueFlightNumber.trim().toUpperCase()
                    if (!flightDate || !flightNo) {
                      window.alert('Please set flight date and flight number first.')
                      return
                    }
                    if (!NAVBLUE_USERNAME || !NAVBLUE_PASSWORD) {
                      window.alert('Missing NAVBLUE credentials. Set VITE_NAVBLUE_USERNAME and VITE_NAVBLUE_PASSWORD in .env')
                      return
                    }
                    try {
                      const [year, month, day] = flightDate.split('-').map((part) => Number(part))
                      const toDate = (() => {
                        if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return flightDate
                        const nextUtcDate = new Date(Date.UTC(year, month - 1, day + 1))
                        return nextUtcDate.toISOString().slice(0, 10)
                      })()
                      const url =
                        `https://vkg.noc.vmc.navblue.cloud/RestAPI/nocrestapi/v1/flights?From=${encodeURIComponent(flightDate)}` +
                        `&To=${encodeURIComponent(toDate)}` +
                        `&FlightRequestFilter=Aircraft&FlightRequestFilter=Loads`
                      const response = await fetch(url, {
                        headers: {
                          Authorization: `Basic ${btoa(`${NAVBLUE_USERNAME}:${NAVBLUE_PASSWORD}`)}`,
                        },
                      })
                      if (!response.ok) {
                        throw new Error(`NAVBLUE request failed (${response.status})`)
                      }
                      const payload = await response.json()
                      const flights = Array.isArray(payload) ? payload : Array.isArray(payload?.flights) ? payload.flights : []
                      const flight = flights.find((item: unknown) => {
                        const record = item as Record<string, unknown>
                        const rawFlight = record.FlightNumber ?? record.flightNumber ?? record.flightNo ?? record.Number ?? ''
                        const normalized = String(rawFlight).toUpperCase().replace(/\s+/g, '')
                        const prefixed = normalized.startsWith('DK') ? normalized : `DK${normalized}`
                        return normalized === flightNo
                          || prefixed === flightNo
                      })
                      if (!flight) {
                        window.alert(`No flight found for ${flightNo} in selected date range.`)
                        return
                      }
                      const flightRecord = flight as Record<string, unknown>
                      const from = normalizeStation(
                        String(
                          flightRecord.DepartureAirportCode ??
                            flightRecord.departureAirportCode ??
                            flightRecord.from ??
                            flightRecord.depStation ??
                            flightRecord.origin ??
                            '',
                        ),
                      )
                      const to = normalizeStation(
                        String(
                          flightRecord.ArrivalAirportCode ??
                            flightRecord.arrivalAirportCode ??
                            flightRecord.to ??
                            flightRecord.arrStation ??
                            flightRecord.destination ??
                            '',
                        ),
                      )
                      const depUtcRaw = String(
                        flightRecord.STD ?? flightRecord.stdUtc ?? flightRecord.std ?? flightRecord.departureUtc ?? '',
                      )
                      const arrUtcRaw = String(
                        flightRecord.STA ?? flightRecord.staUtc ?? flightRecord.sta ?? flightRecord.arrivalUtc ?? '',
                      )
                      const depUtc = normalizeUtcInput(depUtcRaw.slice(11, 16) || depUtcRaw)
                      const arrUtc = normalizeUtcInput(arrUtcRaw.slice(11, 16) || arrUtcRaw)
                      const aircraftBlock = (flightRecord.Aircraft as Record<string, unknown> | undefined) ?? {}
                      const aircraftTypeRaw = String(aircraftBlock.Type ?? aircraftBlock.type ?? '').toUpperCase()
                      const mappedOriginalType: FormState['originalType'] =
                        aircraftTypeRaw === '32B'
                          ? 'A321'
                          : aircraftTypeRaw === '32Q'
                            ? 'A321N'
                            : aircraftTypeRaw === '339'
                              ? 'A339'
                              : ''
                      const loads = (flightRecord.Loads as Record<string, unknown> | undefined) ?? {}
                      const booked =
                        (loads.BookedPassengerPerWeight as Record<string, unknown> | undefined) ??
                        (loads.BookedPassenger as Record<string, unknown> | undefined) ??
                        (loads.BookedPax as Record<string, unknown> | undefined) ??
                        (loads.Passengers as Record<string, unknown> | undefined) ??
                        {}
                      const raidoPax = parseRaidoBookedPax(booked)
                      const legKey = (() => {
                        const idx = Math.max(0, Math.min(3, form.navblueFetchLegIndex))
                        return (['leg1', 'leg2', 'leg3', 'leg4'] as const)[idx]
                      })()
                      const legIndex = Math.max(0, Math.min(3, form.navblueFetchLegIndex))
                      const nextLegIndex = Math.min(3, form.navblueFetchLegIndex + 1)
                      if (!from || !to || !depUtc || !arrUtc) {
                        window.alert('Flight found, but mandatory route fields are missing in API response.')
                        return
                      }
                      const flightKey = buildOcdcFlightKey(flightNo, flightDate, from, to)
                      const phoenixPax = raidoPax ?? (flightKey ? await fetchPhoenixBookedPax(flightKey) : null)
                      const resolvedPax = phoenixPax?.pax ?? 'NA'
                      const infants = phoenixPax?.infants ?? 0
                      setForm((prev) => {
                        const nextInfants = [...prev.navblueInfantsByLeg] as [number | '', number | '', number | '', number | '']
                        nextInfants[legIndex] = infants > 0 ? infants : ''
                        return {
                          ...prev,
                          originalType: mappedOriginalType || prev.originalType,
                          [legKey]: {
                            ...prev[legKey],
                            from,
                            depUtc,
                            arrUtc,
                            to,
                            pax: resolvedPax,
                          },
                          navblueFetchLegIndex: nextLegIndex,
                          navblueInfantsByLeg: nextInfants,
                        }
                      })
                    } catch (error) {
                      const message = error instanceof Error ? error.message : 'Unknown NAVBLUE error'
                      window.alert(`Could not fetch NAVBLUE flight: ${message}`)
                    }
                  }}
                >
                  Fetch
                </button>
                <span>Next fetch goes to Leg {Math.max(1, Math.min(4, form.navblueFetchLegIndex + 1))}</span>
              </label>
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
            <p className="eu261-note">
              CityPair BLH lookup can take a short moment to load. Please be patient after entering From/To.
            </p>
            <p className="eu261-note">Fill From+To, or STD+STA, or BLH HH:MM.</p>
            <div className="route-grid">
              <div className="route-row">
                <span>Leg 1</span>
                <input
                  value={form.leg1.from}
                  onChange={(event) => {
                    updateLeg('leg1', 'from', event.target.value)
                    setRouteCityPairBlhByLeg((prev) => ({ ...prev, leg1: '' }))
                  }}
                  placeholder="From"
                  disabled={form.leg1.blh.trim().length > 0}
                />
                <input
                  value={form.leg1.to}
                  onBlur={() => void tryFetchRouteCityPairBlh('leg1')}
                  onChange={(event) => {
                    updateLeg('leg1', 'to', event.target.value)
                    setRouteCityPairBlhByLeg((prev) => ({ ...prev, leg1: '' }))
                  }}
                  placeholder="To"
                  disabled={form.leg1.blh.trim().length > 0}
                />
                <span>OR</span>
                <input
                  value={form.leg1.depUtc}
                  onChange={(event) => updateLeg('leg1', 'depUtc', event.target.value)}
                  placeholder="STD"
                  disabled={form.leg1.blh.trim().length > 0}
                />
                <input
                  value={form.leg1.arrUtc}
                  onChange={(event) => updateLeg('leg1', 'arrUtc', event.target.value)}
                  placeholder="STA"
                  disabled={form.leg1.blh.trim().length > 0}
                />
                <span>OR</span>
                <input
                  value={getRouteLegBlhDisplayValue('leg1')}
                  onChange={(event) => updateLeg('leg1', 'blh', event.target.value)}
                  placeholder={routeCityPairLoadingByLeg.leg1 ? 'Loading...' : 'BLH HH:MM'}
                  disabled={hasStationsAndTimes(form.leg1)}
                />
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.leg1.pax}
                  onChange={(event) =>
                    updateLeg(
                      'leg1',
                      'pax',
                      event.target.value === ''
                        ? ''
                        : event.target.value.toUpperCase() === 'NA'
                          ? 'NA'
                          : Number(event.target.value),
                    )
                  }
                  placeholder="Pax"
                />
                <span>{form.navblueInfantsByLeg[0] !== '' ? `Infants: ${form.navblueInfantsByLeg[0]}` : ''}</span>
              </div>

              <div className="route-row">
                <span>Leg 2</span>
                <input
                  value={form.leg2.from}
                  onChange={(event) => {
                    updateLeg('leg2', 'from', event.target.value)
                    setRouteCityPairBlhByLeg((prev) => ({ ...prev, leg2: '' }))
                  }}
                  placeholder="From"
                  disabled={form.leg2.blh.trim().length > 0}
                />
                <input
                  value={form.leg2.to}
                  onBlur={() => void tryFetchRouteCityPairBlh('leg2')}
                  onChange={(event) => {
                    updateLeg('leg2', 'to', event.target.value)
                    setRouteCityPairBlhByLeg((prev) => ({ ...prev, leg2: '' }))
                  }}
                  placeholder="To"
                  disabled={form.leg2.blh.trim().length > 0}
                />
                <span>OR</span>
                <input
                  value={form.leg2.depUtc}
                  onChange={(event) => updateLeg('leg2', 'depUtc', event.target.value)}
                  placeholder="STD"
                  disabled={form.leg2.blh.trim().length > 0}
                />
                <input
                  value={form.leg2.arrUtc}
                  onChange={(event) => updateLeg('leg2', 'arrUtc', event.target.value)}
                  placeholder="STA"
                  disabled={form.leg2.blh.trim().length > 0}
                />
                <span>OR</span>
                <input
                  value={getRouteLegBlhDisplayValue('leg2')}
                  onChange={(event) => updateLeg('leg2', 'blh', event.target.value)}
                  placeholder={routeCityPairLoadingByLeg.leg2 ? 'Loading...' : 'BLH HH:MM'}
                  disabled={hasStationsAndTimes(form.leg2)}
                />
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.leg2.pax}
                  onChange={(event) =>
                    updateLeg(
                      'leg2',
                      'pax',
                      event.target.value === ''
                        ? ''
                        : event.target.value.toUpperCase() === 'NA'
                          ? 'NA'
                          : Number(event.target.value),
                    )
                  }
                  placeholder="Pax"
                />
                <span>{form.navblueInfantsByLeg[1] !== '' ? `Infants: ${form.navblueInfantsByLeg[1]}` : ''}</span>
              </div>

              <div className="route-row">
                <span>Leg 3</span>
                <input
                  value={form.leg3.from}
                  onChange={(event) => {
                    updateLeg('leg3', 'from', event.target.value)
                    setRouteCityPairBlhByLeg((prev) => ({ ...prev, leg3: '' }))
                  }}
                  placeholder="From"
                  disabled={form.leg3.blh.trim().length > 0}
                />
                <input
                  value={form.leg3.to}
                  onBlur={() => void tryFetchRouteCityPairBlh('leg3')}
                  onChange={(event) => {
                    updateLeg('leg3', 'to', event.target.value)
                    setRouteCityPairBlhByLeg((prev) => ({ ...prev, leg3: '' }))
                  }}
                  placeholder="To"
                  disabled={form.leg3.blh.trim().length > 0}
                />
                <span>OR</span>
                <input
                  value={form.leg3.depUtc}
                  onChange={(event) => updateLeg('leg3', 'depUtc', event.target.value)}
                  placeholder="STD"
                  disabled={form.leg3.blh.trim().length > 0}
                />
                <input
                  value={form.leg3.arrUtc}
                  onChange={(event) => updateLeg('leg3', 'arrUtc', event.target.value)}
                  placeholder="STA"
                  disabled={form.leg3.blh.trim().length > 0}
                />
                <span>OR</span>
                <input
                  value={getRouteLegBlhDisplayValue('leg3')}
                  onChange={(event) => updateLeg('leg3', 'blh', event.target.value)}
                  placeholder={routeCityPairLoadingByLeg.leg3 ? 'Loading...' : 'BLH HH:MM'}
                  disabled={hasStationsAndTimes(form.leg3)}
                />
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.leg3.pax}
                  onChange={(event) =>
                    updateLeg(
                      'leg3',
                      'pax',
                      event.target.value === ''
                        ? ''
                        : event.target.value.toUpperCase() === 'NA'
                          ? 'NA'
                          : Number(event.target.value),
                    )
                  }
                  placeholder="Pax"
                />
                <span>{form.navblueInfantsByLeg[2] !== '' ? `Infants: ${form.navblueInfantsByLeg[2]}` : ''}</span>
              </div>

              <div className="route-row">
                <span>Leg 4</span>
                <input
                  value={form.leg4.from}
                  onChange={(event) => {
                    updateLeg('leg4', 'from', event.target.value)
                    setRouteCityPairBlhByLeg((prev) => ({ ...prev, leg4: '' }))
                  }}
                  placeholder="From"
                  disabled={form.leg4.blh.trim().length > 0}
                />
                <input
                  value={form.leg4.to}
                  onBlur={() => void tryFetchRouteCityPairBlh('leg4')}
                  onChange={(event) => {
                    updateLeg('leg4', 'to', event.target.value)
                    setRouteCityPairBlhByLeg((prev) => ({ ...prev, leg4: '' }))
                  }}
                  placeholder="To"
                  disabled={form.leg4.blh.trim().length > 0}
                />
                <span>OR</span>
                <input
                  value={form.leg4.depUtc}
                  onChange={(event) => updateLeg('leg4', 'depUtc', event.target.value)}
                  placeholder="STD"
                  disabled={form.leg4.blh.trim().length > 0}
                />
                <input
                  value={form.leg4.arrUtc}
                  onChange={(event) => updateLeg('leg4', 'arrUtc', event.target.value)}
                  placeholder="STA"
                  disabled={form.leg4.blh.trim().length > 0}
                />
                <span>OR</span>
                <input
                  value={getRouteLegBlhDisplayValue('leg4')}
                  onChange={(event) => updateLeg('leg4', 'blh', event.target.value)}
                  placeholder={routeCityPairLoadingByLeg.leg4 ? 'Loading...' : 'BLH HH:MM'}
                  disabled={hasStationsAndTimes(form.leg4)}
                />
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.leg4.pax}
                  onChange={(event) =>
                    updateLeg(
                      'leg4',
                      'pax',
                      event.target.value === ''
                        ? ''
                        : event.target.value.toUpperCase() === 'NA'
                          ? 'NA'
                          : Number(event.target.value),
                    )
                  }
                  placeholder="Pax"
                />
                <span>{form.navblueInfantsByLeg[3] !== '' ? `Infants: ${form.navblueInfantsByLeg[3]}` : ''}</span>
              </div>
            </div>

            <div className="blh-box">
              <strong>BLH source per route leg:</strong>
              {blhPreview.length === 0 ? <p>Select aircraft type and fill route to view BLH.</p> : null}
              {blhPreview.map((line) => (
                <p key={`${line.label}-${line.from}-${line.to}`}>
                  {line.label} {line.from}-{line.to}:{' '}
                  {line.source === 'city_pair_loading' ? 'Loading... (city_pair)' : `${formatBlhFromHours(line.blh)} (${line.source})`}
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
          <p className="eu261-note">
            CityPair BLH lookup can take a short moment to load. Please be patient after entering From/To.
          </p>
          <p className="eu261-note">BLH format: HH:MM (example 02:30). If BLH is filled, station/time fields are locked.</p>
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
                  disabled={!line.enabled || line.manualBlhOverride}
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
                  onChange={(event) => updateOwnBaseLine(idx, { leg: { from: event.target.value }, manualBlhOverride: false })}
                  placeholder="From"
                  disabled={!line.enabled || hasTimedBlh(line.leg) || line.manualBlhOverride}
                />
                <input
                  value={line.leg.to}
                  onBlur={async () => {
                    if (!line.enabled || line.manualBlhOverride) return
                    const loadingKey = `own-${idx}`
                    setCityPairLoadingByLine((prev) => ({ ...prev, [loadingKey]: true }))
                    setCityPairFailedByLine((prev) => ({ ...prev, [loadingKey]: false }))
                    try {
                      const blh = await fetchOcdcCityPairBlh(line.leg.from, line.leg.to)
                      if (blh) {
                        updateOwnBaseLine(idx, { manualBlh: blh, manualBlhOverride: false })
                        setCityPairFailedByLine((prev) => ({ ...prev, [loadingKey]: false }))
                      } else {
                        setCityPairFailedByLine((prev) => ({ ...prev, [loadingKey]: true }))
                      }
                    } finally {
                      setCityPairLoadingByLine((prev) => ({ ...prev, [loadingKey]: false }))
                    }
                  }}
                  onChange={(event) => updateOwnBaseLine(idx, { leg: { to: event.target.value }, manualBlhOverride: false })}
                  placeholder="To"
                  disabled={!line.enabled || hasTimedBlh(line.leg) || line.manualBlhOverride}
                />
                <span>OR</span>
                <input
                  value={line.leg.depUtc}
                  onChange={(event) => updateOwnBaseLine(idx, { leg: { depUtc: event.target.value }, manualBlhOverride: false })}
                  placeholder="STD"
                  disabled={!line.enabled || hasStations(line.leg) || line.manualBlhOverride}
                />
                <input
                  value={line.leg.arrUtc}
                  onChange={(event) => updateOwnBaseLine(idx, { leg: { arrUtc: event.target.value }, manualBlhOverride: false })}
                  placeholder="STA"
                  disabled={!line.enabled || hasStations(line.leg) || line.manualBlhOverride}
                />
                <span>OR</span>
                <input
                  value={cityPairLoadingByLine[`own-${idx}`] ? 'Loading...' : line.manualBlh}
                  onChange={(event) => updateOwnBaseLine(idx, { manualBlh: event.target.value, manualBlhOverride: true })}
                  placeholder={
                    cityPairLoadingByLine[`own-${idx}`]
                      ? 'Loading...'
                      : cityPairFailedByLine[`own-${idx}`]
                        ? 'Insert manually'
                        : 'BLH HH:MM'
                  }
                  disabled={!line.enabled || hasTimedBlh(line.leg)}
                />
                <button type="button" onClick={() => resetOwnBaseLine(idx)} disabled={!line.enabled && !line.manualBlh && !line.leg.from && !line.leg.depUtc && !line.leg.arrUtc && !line.leg.to}>
                  Reset
                </button>
                {cityPairFailedByLine[`own-${idx}`] ? <span className="citypair-inline-error">CityPair not found. Insert manually.</span> : null}
              </div>
            ))}
          </div>
          </div>
        ) : null}

        {form.enableSubOption1 && !isToolMode && !showBaselinePanel ? (
          <div className="settings-box section-card">
          <h3>Subcharter Option 1 (Narrowbody)</h3>
          <p className="eu261-note">
            CityPair BLH lookup can take a short moment to load. Please be patient after entering From/To.
          </p>
          <p className="eu261-note">BLH format: HH:MM (example 02:30). If BLH is filled, station/time fields are locked.</p>
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
                  onChange={(event) => updateSubBaseLine('sub1', idx, { leg: { from: event.target.value }, manualBlhOverride: false })}
                  placeholder="From"
                  disabled={!line.enabled || hasTimedBlh(line.leg) || line.manualBlhOverride}
                />
                <input
                  value={line.leg.to}
                  onBlur={async () => {
                    if (!line.enabled || line.manualBlhOverride) return
                    const loadingKey = `sub1-${idx}`
                    setCityPairLoadingByLine((prev) => ({ ...prev, [loadingKey]: true }))
                    setCityPairFailedByLine((prev) => ({ ...prev, [loadingKey]: false }))
                    try {
                      const blh = await fetchOcdcCityPairBlh(line.leg.from, line.leg.to)
                      if (blh) {
                        updateSubBaseLine('sub1', idx, { manualBlh: blh, manualBlhOverride: false })
                        setCityPairFailedByLine((prev) => ({ ...prev, [loadingKey]: false }))
                      } else {
                        setCityPairFailedByLine((prev) => ({ ...prev, [loadingKey]: true }))
                      }
                    } finally {
                      setCityPairLoadingByLine((prev) => ({ ...prev, [loadingKey]: false }))
                    }
                  }}
                  onChange={(event) => updateSubBaseLine('sub1', idx, { leg: { to: event.target.value }, manualBlhOverride: false })}
                  placeholder="To"
                  disabled={!line.enabled || hasTimedBlh(line.leg) || line.manualBlhOverride}
                />
                <span>OR</span>
                <input
                  value={line.leg.depUtc}
                  onChange={(event) => updateSubBaseLine('sub1', idx, { leg: { depUtc: event.target.value }, manualBlhOverride: false })}
                  placeholder="STD"
                  disabled={!line.enabled || hasStations(line.leg) || line.manualBlhOverride}
                />
                <input
                  value={line.leg.arrUtc}
                  onChange={(event) => updateSubBaseLine('sub1', idx, { leg: { arrUtc: event.target.value }, manualBlhOverride: false })}
                  placeholder="STA"
                  disabled={!line.enabled || hasStations(line.leg) || line.manualBlhOverride}
                />
                <span>OR</span>
                <input
                  value={cityPairLoadingByLine[`sub1-${idx}`] ? 'Loading...' : line.manualBlh}
                  onChange={(event) => updateSubBaseLine('sub1', idx, { manualBlh: event.target.value, manualBlhOverride: true })}
                  placeholder={
                    cityPairLoadingByLine[`sub1-${idx}`]
                      ? 'Loading...'
                      : cityPairFailedByLine[`sub1-${idx}`]
                        ? 'Insert manually'
                        : 'BLH HH:MM'
                  }
                  disabled={!line.enabled || hasTimedBlh(line.leg)}
                />
                <button type="button" onClick={() => resetSubBaseLine('sub1', idx)} disabled={!line.enabled && !line.manualBlh && !line.leg.from && !line.leg.depUtc && !line.leg.arrUtc && !line.leg.to}>
                  Reset
                </button>
                {cityPairFailedByLine[`sub1-${idx}`] ? <span className="citypair-inline-error">CityPair not found. Insert manually.</span> : null}
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
              HOTAC (Total in DKK)
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
              Crew per diem (Total in EUR)
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
          <p className="eu261-note">
            CityPair BLH lookup can take a short moment to load. Please be patient after entering From/To.
          </p>
          <p className="eu261-note">BLH format: HH:MM (example 02:30). If BLH is filled, station/time fields are locked.</p>
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
                  onChange={(event) => updateSubBaseLine('sub2', idx, { leg: { from: event.target.value }, manualBlhOverride: false })}
                  placeholder="From"
                  disabled={!line.enabled || hasTimedBlh(line.leg) || line.manualBlhOverride}
                />
                <input
                  value={line.leg.to}
                  onBlur={async () => {
                    if (!line.enabled || line.manualBlhOverride) return
                    const loadingKey = `sub2-${idx}`
                    setCityPairLoadingByLine((prev) => ({ ...prev, [loadingKey]: true }))
                    setCityPairFailedByLine((prev) => ({ ...prev, [loadingKey]: false }))
                    try {
                      const blh = await fetchOcdcCityPairBlh(line.leg.from, line.leg.to)
                      if (blh) {
                        updateSubBaseLine('sub2', idx, { manualBlh: blh, manualBlhOverride: false })
                        setCityPairFailedByLine((prev) => ({ ...prev, [loadingKey]: false }))
                      } else {
                        setCityPairFailedByLine((prev) => ({ ...prev, [loadingKey]: true }))
                      }
                    } finally {
                      setCityPairLoadingByLine((prev) => ({ ...prev, [loadingKey]: false }))
                    }
                  }}
                  onChange={(event) => updateSubBaseLine('sub2', idx, { leg: { to: event.target.value }, manualBlhOverride: false })}
                  placeholder="To"
                  disabled={!line.enabled || hasTimedBlh(line.leg) || line.manualBlhOverride}
                />
                <span>OR</span>
                <input
                  value={line.leg.depUtc}
                  onChange={(event) => updateSubBaseLine('sub2', idx, { leg: { depUtc: event.target.value }, manualBlhOverride: false })}
                  placeholder="STD"
                  disabled={!line.enabled || hasStations(line.leg) || line.manualBlhOverride}
                />
                <input
                  value={line.leg.arrUtc}
                  onChange={(event) => updateSubBaseLine('sub2', idx, { leg: { arrUtc: event.target.value }, manualBlhOverride: false })}
                  placeholder="STA"
                  disabled={!line.enabled || hasStations(line.leg) || line.manualBlhOverride}
                />
                <span>OR</span>
                <input
                  value={cityPairLoadingByLine[`sub2-${idx}`] ? 'Loading...' : line.manualBlh}
                  onChange={(event) => updateSubBaseLine('sub2', idx, { manualBlh: event.target.value, manualBlhOverride: true })}
                  placeholder={
                    cityPairLoadingByLine[`sub2-${idx}`]
                      ? 'Loading...'
                      : cityPairFailedByLine[`sub2-${idx}`]
                        ? 'Insert manually'
                        : 'BLH HH:MM'
                  }
                  disabled={!line.enabled || hasTimedBlh(line.leg)}
                />
                <button type="button" onClick={() => resetSubBaseLine('sub2', idx)} disabled={!line.enabled && !line.manualBlh && !line.leg.from && !line.leg.depUtc && !line.leg.arrUtc && !line.leg.to}>
                  Reset
                </button>
                {cityPairFailedByLine[`sub2-${idx}`] ? <span className="citypair-inline-error">CityPair not found. Insert manually.</span> : null}
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
              HOTAC (Total in DKK)
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
              Crew per diem (Total in EUR)
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
          <p className="eu261-note">
            CityPair BLH lookup can take a short moment to load. Please be patient after entering From/To.
          </p>
          <p className="eu261-note">BLH format: HH:MM (example 02:30). If BLH is filled, station/time fields are locked.</p>
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
                  onChange={(event) => updateSubBaseLine('sub3', idx, { leg: { from: event.target.value }, manualBlhOverride: false })}
                  placeholder="From"
                  disabled={!line.enabled || hasTimedBlh(line.leg) || line.manualBlhOverride}
                />
                <input
                  value={line.leg.to}
                  onBlur={async () => {
                    if (!line.enabled || line.manualBlhOverride) return
                    const loadingKey = `sub3-${idx}`
                    setCityPairLoadingByLine((prev) => ({ ...prev, [loadingKey]: true }))
                    setCityPairFailedByLine((prev) => ({ ...prev, [loadingKey]: false }))
                    try {
                      const blh = await fetchOcdcCityPairBlh(line.leg.from, line.leg.to)
                      if (blh) {
                        updateSubBaseLine('sub3', idx, { manualBlh: blh, manualBlhOverride: false })
                        setCityPairFailedByLine((prev) => ({ ...prev, [loadingKey]: false }))
                      } else {
                        setCityPairFailedByLine((prev) => ({ ...prev, [loadingKey]: true }))
                      }
                    } finally {
                      setCityPairLoadingByLine((prev) => ({ ...prev, [loadingKey]: false }))
                    }
                  }}
                  onChange={(event) => updateSubBaseLine('sub3', idx, { leg: { to: event.target.value }, manualBlhOverride: false })}
                  placeholder="To"
                  disabled={!line.enabled || hasTimedBlh(line.leg) || line.manualBlhOverride}
                />
                <span>OR</span>
                <input
                  value={line.leg.depUtc}
                  onChange={(event) => updateSubBaseLine('sub3', idx, { leg: { depUtc: event.target.value }, manualBlhOverride: false })}
                  placeholder="STD"
                  disabled={!line.enabled || hasStations(line.leg) || line.manualBlhOverride}
                />
                <input
                  value={line.leg.arrUtc}
                  onChange={(event) => updateSubBaseLine('sub3', idx, { leg: { arrUtc: event.target.value }, manualBlhOverride: false })}
                  placeholder="STA"
                  disabled={!line.enabled || hasStations(line.leg) || line.manualBlhOverride}
                />
                <span>OR</span>
                <input
                  value={cityPairLoadingByLine[`sub3-${idx}`] ? 'Loading...' : line.manualBlh}
                  onChange={(event) => updateSubBaseLine('sub3', idx, { manualBlh: event.target.value, manualBlhOverride: true })}
                  placeholder={
                    cityPairLoadingByLine[`sub3-${idx}`]
                      ? 'Loading...'
                      : cityPairFailedByLine[`sub3-${idx}`]
                        ? 'Insert manually'
                        : 'BLH HH:MM'
                  }
                  disabled={!line.enabled || hasTimedBlh(line.leg)}
                />
                <button type="button" onClick={() => resetSubBaseLine('sub3', idx)} disabled={!line.enabled && !line.manualBlh && !line.leg.from && !line.leg.depUtc && !line.leg.arrUtc && !line.leg.to}>
                  Reset
                </button>
                {cityPairFailedByLine[`sub3-${idx}`] ? <span className="citypair-inline-error">CityPair not found. Insert manually.</span> : null}
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
              HOTAC (Total in DKK)
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
              Crew per diem (Total in EUR)
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
            <p className="eu261-note">
              CityPair BLH lookup can take a short moment to load. Please be patient after entering From/To.
            </p>
            <div className="grid compact">
              <label>
                ACMI aircraft type (all lines)
                <select
                  value={form.acmiAircraft}
                  onChange={(event) => update('acmiAircraft', event.target.value as FormState['acmiAircraft'])}
                >
                  <option value="">Select</option>
                  {OWN_AIRCRAFT_OPTIONS.map((aircraft) => (
                    <option key={`acmi-global-air-${aircraft}`} value={aircraft}>
                      {aircraft}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="route-grid four-lines">
              {form.acmiLines.map((line, idx) => (
                <div className="route-row with-controls module-row" key={`acmi-${idx}`}>
                  <span>ACMI #{idx + 1}</span>
                  <label className="mini-check">
                    <input
                      type="checkbox"
                      checked={line.enabled}
                      onChange={(event) => updateAcmiLine(idx, { enabled: event.target.checked })}
                    />
                    Active
                  </label>
                  <input
                    value={line.flightNumber}
                    onChange={(event) => updateAcmiLine(idx, { flightNumber: event.target.value })}
                    placeholder="Flight no"
                    disabled={!line.enabled}
                  />
                  <input
                    value={line.leg.from}
                    onChange={(event) => updateAcmiLine(idx, { leg: { from: event.target.value, blh: '' } })}
                    placeholder="From"
                    disabled={!line.enabled || hasTimedBlh(line.leg) || line.manualBlhOverride}
                  />
                  <input
                    value={line.leg.to}
                    onBlur={async () => {
                      if (!line.enabled || line.manualBlhOverride) return
                      const from = normalizeStation(line.leg.from)
                      const to = normalizeStation(line.leg.to)
                      if (!from || !to) return
                      const loadingKey = `acmi-${idx}`
                      setCityPairLoadingByLine((prev) => ({ ...prev, [loadingKey]: true }))
                      setCityPairFailedByLine((prev) => ({ ...prev, [loadingKey]: false }))
                      try {
                        const blh = await fetchOcdcCityPairBlh(from, to)
                        if (blh) {
                          updateAcmiLine(idx, { leg: { blh }, manualBlhOverride: false })
                          setCityPairFailedByLine((prev) => ({ ...prev, [loadingKey]: false }))
                        } else {
                          setCityPairFailedByLine((prev) => ({ ...prev, [loadingKey]: true }))
                        }
                      } finally {
                        setCityPairLoadingByLine((prev) => ({ ...prev, [loadingKey]: false }))
                      }
                    }}
                    onChange={(event) => updateAcmiLine(idx, { leg: { to: event.target.value, blh: '' } })}
                    placeholder="To"
                    disabled={!line.enabled || hasTimedBlh(line.leg) || line.manualBlhOverride}
                  />
                  <span>OR</span>
                  <input
                    value={line.leg.depUtc}
                    onChange={(event) => updateAcmiLine(idx, { leg: { depUtc: event.target.value } })}
                    placeholder="STD"
                    disabled={!line.enabled || line.manualBlhOverride}
                  />
                  <input
                    value={line.leg.arrUtc}
                    onChange={(event) => updateAcmiLine(idx, { leg: { arrUtc: event.target.value } })}
                    placeholder="STA"
                    disabled={!line.enabled || line.manualBlhOverride}
                  />
                  <span>OR</span>
                  <input
                    value={getModuleLegBlhDisplayValue(line, `acmi-${idx}`)}
                    onChange={(event) => updateAcmiLine(idx, { leg: { blh: event.target.value } })}
                    placeholder={
                      cityPairLoadingByLine[`acmi-${idx}`]
                        ? 'Loading...'
                        : cityPairFailedByLine[`acmi-${idx}`]
                          ? 'Insert manually'
                          : 'BLH HH:MM'
                    }
                    disabled={!line.enabled || hasTimedBlh(line.leg)}
                  />
                  <input
                    type="date"
                    value={line.departureDate}
                    onChange={(event) => updateAcmiLine(idx, { departureDate: event.target.value })}
                    placeholder="Date"
                    disabled={!line.enabled}
                  />
                  <button
                    type="button"
                    onClick={() => resetAcmiLine(idx)}
                    disabled={
                      !line.enabled &&
                      !line.manualBlh &&
                      !line.departureDate &&
                      !line.leg.from &&
                      !line.leg.depUtc &&
                      !line.leg.arrUtc &&
                      !line.leg.to
                    }
                  >
                    Reset
                  </button>
                  {cityPairFailedByLine[`acmi-${idx}`] ? <span className="citypair-inline-error">CityPair not found. Insert manually.</span> : null}
                </div>
              ))}
            </div>
            <div className="grid compact">
              <label>
                ACMI profit (%)
                <input
                  type="number"
                  min={20}
                  value={form.acmiSafetyMarginPercent}
                  onChange={(event) => update('acmiSafetyMarginPercent', Math.max(20, Number(event.target.value) || 20))}
                />
              </label>
            </div>
            {acmiBreakdown ? (
              <div className="acmi-summary">
                <p>Total ACMI BLH: {acmiBreakdown.totalBlh.toFixed(2)}</p>
                <p>ACMI cost before margin: {toCurrency(acmiBreakdown.baseCostDkk)}</p>
                <p>ACMI profit amount: {toCurrency(acmiBreakdown.marginDkk)}</p>
                <p>ACMI profit (%): {Math.max(20, form.acmiSafetyMarginPercent).toFixed(0)}%</p>
                <p>Total ACMI cost: {toCurrency(acmiBreakdown.totalCostDkk)}</p>
                <p>Minimum ACMI BLH (DKK): {toCurrency(acmiBreakdown.minimumBlhDkk)}</p>
                <p>Minimum ACMI BLH (EUR): {toEur(acmiBreakdown.minimumBlhEur)}</p>
                <div className="module-email-layout">
                  <div className="module-email-actions">
                    <button type="button" onClick={() => requestEmailConfirm('acmi-internal', form.acmiEmailRecipients)}>
                      Email price details
                      <span className="internal-only-note">(INTERNAL ONLY)</span>
                    </button>
                    <button type="button" onClick={() => requestEmailConfirm('acmi-client', form.acmiEmailRecipients)}>
                      Email Offer to Client
                    </button>
                  </div>
                  <label className="module-email-recipients">
                    Email recipients (comma separated)
                    <input
                      type="text"
                      value={form.acmiEmailRecipients}
                      onChange={(event) => update('acmiEmailRecipients', event.target.value)}
                      placeholder="ops@sunclass.dk, crew@sunclass.dk"
                    />
                  </label>
                </div>
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
            <details>
              <summary>How to use Adhoc module</summary>
              <p>
                Adhoc module calculates a minimum Adhoc price from selected Adhoc legs, using one common aircraft type for the whole module.
              </p>
              <ul>
                <li>
                  Choose <strong>Adhoc aircraft type (all lines)</strong> once. All active Adhoc lines use this aircraft in the calculation.
                </li>
                <li>
                  Activate the lines you need, then set each line with <strong>From+To OR STD+STA OR BLH</strong>.
                </li>
                <li>
                  BLH source priority per Adhoc line is: <strong>1) STD/STA</strong>, <strong>2) CityPair</strong>, <strong>3) manual BLH</strong>.
                </li>
                <li>
                  CityPair lookup can take a moment; BLH shows <strong>Loading...</strong> while the lookup is running.
                </li>
                <li>
                  Adhoc includes <strong>all expenses</strong> in its operating part (full DOC), then adds crew costs and own SCA add-ons.
                </li>
                <li>
                  <strong>Adhoc profit (%)</strong> is applied on top of the base total to produce minimum total and minimum BLH prices.
                </li>
                <li>
                  If no active line has valid BLH input yet, no Adhoc price is calculated.
                </li>
              </ul>
            </details>
            <p className="eu261-note">
              CityPair BLH lookup can take a short moment to load. Please be patient after entering From/To.
            </p>
            <div className="grid compact">
              <label>
                Adhoc aircraft type (all lines)
                <select
                  value={form.adhocAircraft}
                  onChange={(event) => update('adhocAircraft', event.target.value as FormState['adhocAircraft'])}
                >
                  <option value="">Select</option>
                  {OWN_AIRCRAFT_OPTIONS.map((aircraft) => (
                    <option key={`adhoc-global-air-${aircraft}`} value={aircraft}>
                      {aircraft}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="route-grid four-lines">
              {form.adhocLines.map((line, idx) => (
                <div className="route-row with-controls module-row" key={`adhoc-${idx}`}>
                  <span>Adhoc #{idx + 1}</span>
                  <label className="mini-check">
                    <input
                      type="checkbox"
                      checked={line.enabled}
                      onChange={(event) => updateAdhocLine(idx, { enabled: event.target.checked })}
                    />
                    Active
                  </label>
                  <input
                    value={line.flightNumber}
                    onChange={(event) => updateAdhocLine(idx, { flightNumber: event.target.value })}
                    placeholder="Flight no"
                    disabled={!line.enabled}
                  />
                  <input
                    value={line.leg.from}
                    onChange={(event) => updateAdhocLine(idx, { leg: { from: event.target.value, blh: '' } })}
                    placeholder="From"
                    disabled={!line.enabled || hasTimedBlh(line.leg) || line.manualBlhOverride}
                  />
                  <input
                    value={line.leg.to}
                    onBlur={async () => {
                      if (!line.enabled || line.manualBlhOverride) return
                      const from = normalizeStation(line.leg.from)
                      const to = normalizeStation(line.leg.to)
                      if (!from || !to) return
                      const loadingKey = `adhoc-${idx}`
                      setCityPairLoadingByLine((prev) => ({ ...prev, [loadingKey]: true }))
                      setCityPairFailedByLine((prev) => ({ ...prev, [loadingKey]: false }))
                      try {
                        const blh = await fetchOcdcCityPairBlh(from, to)
                        if (blh) {
                          updateAdhocLine(idx, { leg: { blh }, manualBlhOverride: false })
                          setCityPairFailedByLine((prev) => ({ ...prev, [loadingKey]: false }))
                        } else {
                          setCityPairFailedByLine((prev) => ({ ...prev, [loadingKey]: true }))
                        }
                      } finally {
                        setCityPairLoadingByLine((prev) => ({ ...prev, [loadingKey]: false }))
                      }
                    }}
                    onChange={(event) => updateAdhocLine(idx, { leg: { to: event.target.value, blh: '' } })}
                    placeholder="To"
                    disabled={!line.enabled || hasTimedBlh(line.leg) || line.manualBlhOverride}
                  />
                  <span>OR</span>
                  <input
                    value={line.leg.depUtc}
                    onChange={(event) => {
                      const depUtc = normalizeUtcInput(event.target.value)
                      const autoArrUtc =
                        line.leg.arrUtc.trim().length === 0 ? deriveArrivalUtcFromDepartureAndBlh(depUtc, line.leg.blh) : null
                      updateAdhocLine(idx, { leg: { depUtc, ...(autoArrUtc ? { arrUtc: autoArrUtc } : {}) } })
                    }}
                    placeholder="STD"
                    disabled={!line.enabled || line.manualBlhOverride}
                  />
                  <input
                    value={line.leg.arrUtc}
                    onChange={(event) => updateAdhocLine(idx, { leg: { arrUtc: event.target.value } })}
                    placeholder="STA"
                    disabled={!line.enabled || line.manualBlhOverride}
                  />
                  <span>OR</span>
                  <input
                    value={getModuleLegBlhDisplayValue(line, `adhoc-${idx}`)}
                    onChange={(event) => updateAdhocLine(idx, { leg: { blh: event.target.value } })}
                    placeholder={
                      cityPairLoadingByLine[`adhoc-${idx}`]
                        ? 'Loading...'
                        : cityPairFailedByLine[`adhoc-${idx}`]
                          ? 'Insert manually'
                          : 'BLH HH:MM'
                    }
                    disabled={!line.enabled || hasTimedBlh(line.leg)}
                  />
                  <input
                    type="date"
                    value={line.departureDate}
                    onChange={(event) => updateAdhocLine(idx, { departureDate: event.target.value })}
                    placeholder="Date"
                    disabled={!line.enabled}
                  />
                  <button
                    type="button"
                    onClick={() => resetAdhocLine(idx)}
                    disabled={
                      !line.enabled &&
                      !line.manualBlh &&
                      !line.departureDate &&
                      !line.leg.from &&
                      !line.leg.depUtc &&
                      !line.leg.arrUtc &&
                      !line.leg.to
                    }
                  >
                    Reset
                  </button>
                  {cityPairFailedByLine[`adhoc-${idx}`] ? <span className="citypair-inline-error">CityPair not found. Insert manually.</span> : null}
                </div>
              ))}
            </div>
            <div className="grid compact">
              <label>
                Adhoc profit (%)
                <input
                  type="number"
                  min={0}
                  value={form.adhocSafetyMarginPercent}
                  onChange={(event) => update('adhocSafetyMarginPercent', Number(event.target.value) || 0)}
                />
              </label>
              <label className="mini-check">
                <input
                  type="checkbox"
                  checked={form.adhocUseFuelCorrection}
                  onChange={(event) => update('adhocUseFuelCorrection', event.target.checked)}
                />
                Use fuel correction factor
              </label>
              <label>
                Fuel price reference (USD/MT)
                <input
                  type="number"
                  min={0}
                  value={form.adhocFuelPriceBasicRef}
                  onChange={(event) => update('adhocFuelPriceBasicRef', Number(event.target.value) || 0)}
                />
                <span className="top-rate-meta">Baseline: (MAR26 1072.08 PLATTS GLOBAL)</span>
              </label>
              <label>
                Fuel price current (USD/MT)
                <input
                  type="number"
                  min={0}
                  value={form.adhocFuelPriceCurrent}
                  onChange={(event) => update('adhocFuelPriceCurrent', Number(event.target.value) || 0)}
                />
                {adhocFuelFetchMeta ? <span className="top-rate-meta">Source: ({adhocFuelFetchMeta})</span> : null}
              </label>
            </div>
            {adhocBreakdown ? (
              <div className="acmi-summary">
                <p>
                  Fuel correction factor = current/reference:{' '}
                  {form.adhocFuelPriceCurrent.toFixed(2)} / {form.adhocFuelPriceBasicRef.toFixed(2)} ={' '}
                  {(form.adhocUseFuelCorrection
                    ? getFuelCorrectionFactor(form.adhocFuelPriceCurrent, form.adhocFuelPriceBasicRef)
                    : 1
                  ).toFixed(3)}
                </p>
                <p>
                  {form.adhocUseFuelCorrection
                    ? 'Factor 1.000 means no fuel adjustment versus reference.'
                    : 'Fuel correction is disabled (factor fixed at 1.000).'}
                </p>
                <p>Total Adhoc BLH: {adhocBreakdown.totalBlh.toFixed(2)}</p>
                <p>Adhoc cost before profit (all expenses): {toCurrency(adhocBreakdown.totalCostDkk)}</p>
                <p>Adhoc profit amount: {toCurrency(adhocBreakdown.marginDkk)}</p>
                <p>
                  Minimum Adhoc total price (DKK): {toCurrency(adhocBreakdown.minimumTotalDkk)} (rounded to nearest 100 in email offer)
                </p>
                <p>
                  Minimum Adhoc total price (EUR): {toEur(adhocBreakdown.minimumTotalEur)} (rounded to nearest 100 in email offer)
                </p>
                <div className="module-email-layout">
                  <div className="module-email-actions">
                    <button type="button" onClick={() => requestEmailConfirm('adhoc-internal', form.adhocEmailRecipients)}>
                      Email price details
                      <span className="internal-only-note">(INTERNAL ONLY)</span>
                    </button>
                    <button type="button" onClick={() => requestEmailConfirm('adhoc-client', form.adhocEmailRecipients)}>
                      Email Offer to Client
                    </button>
                    <label className="mini-check">
                      <input
                        type="checkbox"
                        checked={form.adhocOfferSendInDanish}
                        onChange={(event) => update('adhocOfferSendInDanish', event.target.checked)}
                      />
                      Send Email Offer in Danish and in DKK
                    </label>
                  </div>
                  <label className="module-email-recipients">
                    Email recipients (comma separated)
                    <input
                      type="text"
                      value={form.adhocEmailRecipients}
                      onChange={(event) => update('adhocEmailRecipients', event.target.value)}
                      placeholder="ops@sunclass.dk, crew@sunclass.dk"
                    />
                  </label>
                </div>
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
              <div
                className={`sub-addons-row ${form.enableAcmiModule || form.enableAdhocModule ? 'sub-addons-row-tool' : 'sub-addons-row-main'}`}
              >
                <label className="mini-check">
                  <input
                    type="checkbox"
                    checked={form.ownIncludeScaExtraHotac}
                    onChange={(event) => update('ownIncludeScaExtraHotac', event.target.checked)}
                  />
                  {form.enableAcmiModule || form.enableAdhocModule
                    ? 'HOTAC (DKK): Choose total nights'
                    : 'HOTAC (DKK)'}
                </label>
                <input
                  type="number"
                  min={0}
                  value={
                    form.enableAcmiModule
                      ? form.acmiHotacNights
                      : form.enableAdhocModule
                        ? form.adhocHotacNights
                        : form.ownScaExtraHotacDkk
                  }
                  onFocus={(event) => event.target.select()}
                  onChange={(event) => {
                    const nextValue = event.target.value === '' ? 0 : Number(event.target.value) || 0
                    if (form.enableAcmiModule) {
                      update('acmiHotacNights', nextValue)
                      return
                    }
                    if (form.enableAdhocModule) {
                      update('adhocHotacNights', nextValue)
                      return
                    }
                    update('ownScaExtraHotacDkk', event.target.value === '' ? '' : nextValue)
                  }}
                  placeholder={form.enableAcmiModule || form.enableAdhocModule ? 'Choose total nights' : 'HOTAC DKK'}
                />
                {form.enableAcmiModule || form.enableAdhocModule ? (
                  <span className="addon-rate-note">
                    Auto rate:{' '}
                    {(
                      (form.enableAcmiModule ? form.acmiAircraft : form.adhocAircraft) || selectedOriginalType
                    ) === 'A339'
                      ? '10*1000 DKK/night'
                      : '7*1000 DKK/night'}
                  </span>
                ) : null}
                <label className="mini-check">
                  <input
                    type="checkbox"
                    checked={form.ownIncludeScaExtraCrewPerDiem}
                    onChange={(event) => update('ownIncludeScaExtraCrewPerDiem', event.target.checked)}
                  />
                  {form.enableAcmiModule || form.enableAdhocModule
                    ? 'Crew per Diem (EUR): Choose total operating days'
                    : 'Crew per diem (EUR)'}
                </label>
                <input
                  type="number"
                  min={0}
                  value={
                    form.enableAcmiModule
                      ? form.acmiCrewPerDiemOperatingDays
                      : form.enableAdhocModule
                        ? form.adhocCrewPerDiemOperatingDays
                        : form.ownScaExtraCrewPerDiemEur
                  }
                  onFocus={(event) => event.target.select()}
                  onChange={(event) => {
                    const nextValue = event.target.value === '' ? 0 : Number(event.target.value) || 0
                    if (form.enableAcmiModule) {
                      update('acmiCrewPerDiemOperatingDays', nextValue)
                      return
                    }
                    if (form.enableAdhocModule) {
                      update('adhocCrewPerDiemOperatingDays', nextValue)
                      return
                    }
                    update('ownScaExtraCrewPerDiemEur', event.target.value === '' ? '' : nextValue)
                  }}
                  placeholder={form.enableAcmiModule || form.enableAdhocModule ? 'Operating days' : 'Crew per diem EUR'}
                />
                {form.enableAcmiModule || form.enableAdhocModule ? (
                  <span className="addon-rate-note">
                    Auto rate:{' '}
                    {(
                      (form.enableAcmiModule ? form.acmiAircraft : form.adhocAircraft) || selectedOriginalType
                    ) === 'A339'
                      ? '10*120 EUR/day'
                      : '7*120 EUR/day'}
                  </span>
                ) : null}
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
            <div className="module-email-actions" style={{ marginBottom: 10 }}>
              <button type="button" onClick={composeMainToolEmail}>
                Email fra main tool
              </button>
            </div>
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
                  <p>Overnight (EUR, separat): {toEur(result.overnightCostEur)}</p>
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
                              { legSelections: result.eu261LegOptions.map(() => false), overnightSelected: false },
                            )
                          }
                        />
                        EU261 on {legOption.label}
                      </label>
                    ))}
                    <label key={`${result.id}-overnight`}>
                      <input
                        type="checkbox"
                        checked={result.overnightSelected}
                        onChange={(event) =>
                          updateScenarioOvernightSelection(
                            result.id,
                            event.target.checked,
                            { legSelections: result.eu261LegOptions.map(() => false), overnightSelected: false },
                          )
                        }
                      />
                      Overnight (205 EUR per pax)
                    </label>
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
                    const baselineSummary = getAuditComponentSummary(selectedOriginalType)
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
                    {routeLegsWithStations.map(({ key, leg }, idx) => {
                      const blh =
                        routeLegHoursByKey[key] ??
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
                              const aircraftSummary = getAuditComponentSummary(aircraft)
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
                              {routeLegsWithStations.map(({ key, leg }, idx) => {
                                const fallbackAircraft = getFallbackAircraftForAudit(aircraft)
                                const blh =
                                  routeLegHoursByKey[key] ??
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
                  <p>Base cost before margin: {toCurrency(acmiBreakdown.baseCostDkk)}</p>
                  <p>Margin amount: {toCurrency(acmiBreakdown.marginDkk)}</p>
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
                  <p>Margin amount: {toCurrency(adhocBreakdown.marginDkk)}</p>
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
          <details className="audit-history-details">
            <summary>Historik - tidligere scenarier ({visibleScenarioHistory.length})</summary>
            <p className="eu261-note">
              Historik vises kun for aktiv visning (Main, ACMI eller Adhoc). Main, ACMI og Adhoc gemmes efter kort input-pause.
            </p>
            {visibleScenarioHistory.length === 0 ? (
              <p className="result-placeholder">Ingen historik endnu. Beregn et scenarie for at gemme et historikpunkt.</p>
            ) : (
              <>
                <div className="audit-history-list">
                  {visibleScenarioHistory.map((entry) => (
                    <div key={entry.id} className="audit-history-item">
                      <p>
                        <strong>{entry.title}</strong> ({entry.mode.toUpperCase()}) - {entry.createdAt}
                      </p>
                      <ul>
                        {entry.summaryLines.map((line) => (
                          <li key={`${entry.id}-${line}`}>{line}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setScenarioHistory((prev) => prev.filter((entry) => entry.mode !== activeHistoryMode))
                  }
                >
                  Clear historik
                </button>
              </>
            )}
          </details>
        </details>
      </section>
      ) : null}
    </main>
  )
}

export default App
