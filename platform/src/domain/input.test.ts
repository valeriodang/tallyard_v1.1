import { describe, expect, it } from 'vitest'
import { amountFromText, shareFromPercentText } from './input'

describe('numbers as typed', () => {
  it('reads a percentage as a share, with or without the sign', () => {
    expect(shareFromPercentText('35')).toBe(0.35)
    expect(shareFromPercentText(' 12.5% ')).toBe(0.125)
    expect(shareFromPercentText('0')).toBe(0)
    expect(shareFromPercentText('')).toBeNull()
    expect(shareFromPercentText('  ')).toBeNull()
  })

  it('gives NaN for text that is not a number, for the store to refuse', () => {
    expect(shareFromPercentText('about half')).toBeNaN()
    expect(shareFromPercentText('-5')).toBeNaN()
    expect(amountFromText('1.2.3')).toBeNaN()
  })

  it('reads an amount with thousands commas', () => {
    expect(amountFromText('8,250')).toBe(8250)
    expect(amountFromText('2,049,860.5')).toBe(2049860.5)
    expect(amountFromText('')).toBeNull()
  })
})
