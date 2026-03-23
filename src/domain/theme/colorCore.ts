import { CSS_NAMED_COLORS } from './namedColors'

export type ParsedColor = {
  r: number
  g: number
  b: number
  a: number
}

const HEX_3_COLOR_PATTERN = /^#[0-9a-f]{3}$/i
const HEX_4_COLOR_PATTERN = /^#[0-9a-f]{4}$/i
const HEX_6_COLOR_PATTERN = /^#[0-9a-f]{6}$/i
const HEX_8_COLOR_PATTERN = /^#[0-9a-f]{8}$/i
const TRANSPARENT_COLOR_PATTERN = /^(transparent|none)$/i

function expandShortHex(value: string) {
  return `#${value
    .slice(1)
    .split('')
    .map((character) => `${character}${character}`)
    .join('')}`
}

export function clampChannel(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)))
}

export function clampAlpha(value: number) {
  return Math.max(0, Math.min(1, value))
}

export function normalizeColorValue(value: string) {
  const trimmed = value.trim()
  const lowered = trimmed.toLowerCase()

  if (TRANSPARENT_COLOR_PATTERN.test(lowered)) {
    return 'transparent'
  }

  if (HEX_3_COLOR_PATTERN.test(lowered) || HEX_4_COLOR_PATTERN.test(lowered)) {
    return expandShortHex(lowered)
  }

  if (HEX_6_COLOR_PATTERN.test(lowered) || HEX_8_COLOR_PATTERN.test(lowered)) {
    return lowered
  }

  const namedColor = CSS_NAMED_COLORS[lowered as keyof typeof CSS_NAMED_COLORS]

  if (namedColor !== undefined) {
    return namedColor
  }

  return null
}

export function isColorValue(value: string) {
  return normalizeColorValue(value) !== null
}

export function parseColor(value: string): ParsedColor | null {
  const normalized = normalizeColorValue(value)

  if (!normalized) {
    return null
  }

  if (normalized === 'transparent') {
    return {
      r: 0,
      g: 0,
      b: 0,
      a: 0,
    }
  }

  if (normalized.length === 7) {
    const parsed = Number.parseInt(normalized.slice(1), 16)

    return {
      r: (parsed >> 16) & 0xff,
      g: (parsed >> 8) & 0xff,
      b: parsed & 0xff,
      a: 1,
    }
  }

  const parsed = Number.parseInt(normalized.slice(1), 16)

  return {
    r: (parsed >> 24) & 0xff,
    g: (parsed >> 16) & 0xff,
    b: (parsed >> 8) & 0xff,
    a: (parsed & 0xff) / 255,
  }
}

export function serializeColor(color: ParsedColor) {
  const r = clampChannel(color.r)
  const g = clampChannel(color.g)
  const b = clampChannel(color.b)
  const a = clampAlpha(color.a)

  if (a <= 0) {
    return 'transparent'
  }

  const rgbHex = [r, g, b].map((channel) => channel.toString(16).padStart(2, '0')).join('')

  if (a >= 1) {
    return `#${rgbHex}`
  }

  const alphaHex = Math.round(a * 255)
    .toString(16)
    .padStart(2, '0')

  return `#${rgbHex}${alphaHex}`
}

export function areColorValuesEqual(left: string, right: string) {
  return normalizeColorValue(left) === normalizeColorValue(right)
}

export function getColorInputValue(value: string) {
  const color = parseColor(value)

  if (!color) {
    return '#000000'
  }

  return serializeColor({
    ...color,
    a: 1,
  })
}

export function hasTransparency(value: string) {
  const color = parseColor(value)
  return color ? color.a < 1 : false
}
