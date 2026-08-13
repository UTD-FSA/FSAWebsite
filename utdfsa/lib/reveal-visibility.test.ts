import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isPastRevealLine, revealRootMargin, REVEAL_LINE } from './reveal-visibility.ts'

test('isPastRevealLine: tall element straddling the fold reveals (membership pricing card bug)', () => {
  // 900px-tall viewport, element top at 700px (only 200px on screen) but the
  // element itself is 600px tall — the old threshold-of-height check (0.25)
  // would fail this; the new check only cares about the top edge vs. the line
  const viewportHeight = 900
  const rect = { top: 700 }
  assert.equal(isPastRevealLine(rect, viewportHeight), true)
})

test('isPastRevealLine: element fully below the fold does not reveal', () => {
  const viewportHeight = 900
  const rect = { top: 950 }
  assert.equal(isPastRevealLine(rect, viewportHeight), false)
})

test('isPastRevealLine: element entirely above the viewport reveals (anchor jump / scroll restore)', () => {
  const viewportHeight = 900
  const rect = { top: -400 }
  assert.equal(isPastRevealLine(rect, viewportHeight), true)
})

test('isPastRevealLine: line override fires later (smaller line = stricter)', () => {
  const viewportHeight = 900
  const rect = { top: 600 } // 66.7% down the viewport
  assert.equal(isPastRevealLine(rect, viewportHeight, REVEAL_LINE), true)  // 0.88 * 900 = 792, 600 < 792
  assert.equal(isPastRevealLine(rect, viewportHeight, 0.6), false)         // 0.6 * 900 = 540, 600 > 540
})

test('revealRootMargin: shrinks the root by (1 - line) at the bottom', () => {
  assert.equal(revealRootMargin(0.88), '0px 0px -12% 0px')
  assert.equal(revealRootMargin(0.6), '0px 0px -40% 0px')
})
