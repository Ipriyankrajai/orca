import { describe, expect, it } from 'vitest'
import type { AgentStatusEntry } from '../../../../shared/agent-status-types'
import { AGENT_STATUS_STALE_AFTER_MS } from '../../../../shared/agent-status-types'
import { shouldDispatchTerminalBellNotification } from './terminal-bell-notification-policy'

const NOW = 1_700_000_000_000

function makeStatus(overrides: Partial<AgentStatusEntry>): AgentStatusEntry {
  return {
    state: 'working',
    prompt: 'ship the notification fix',
    updatedAt: NOW,
    stateStartedAt: NOW,
    paneKey: 'tab-1:leaf-1',
    stateHistory: [],
    ...overrides
  }
}

describe('terminal bell notification policy', () => {
  it('dispatches when no agent owns the pane', () => {
    expect(shouldDispatchTerminalBellNotification(undefined, NOW)).toBe(true)
  })

  it('suppresses the bell while the agent is mid-turn', () => {
    // Why: auto-approving permission modes ring the bell and keep going, so the
    // BEL announces attention that nothing is actually waiting on.
    expect(shouldDispatchTerminalBellNotification(makeStatus({ state: 'working' }), NOW)).toBe(
      false
    )
  })

  it('suppresses the bell on a real pause, which the richer attention banner owns', () => {
    expect(shouldDispatchTerminalBellNotification(makeStatus({ state: 'waiting' }), NOW)).toBe(
      false
    )
    expect(shouldDispatchTerminalBellNotification(makeStatus({ state: 'blocked' }), NOW)).toBe(
      false
    )
  })

  it('dispatches once the turn is over', () => {
    expect(shouldDispatchTerminalBellNotification(makeStatus({ state: 'done' }), NOW)).toBe(true)
  })

  it('dispatches when the hook stream went silent long enough to be stale', () => {
    const status = makeStatus({ state: 'working' })
    expect(
      shouldDispatchTerminalBellNotification(status, NOW + AGENT_STATUS_STALE_AFTER_MS + 1)
    ).toBe(true)
  })

  it('dispatches for a hydrated row no live hook has confirmed', () => {
    // Why: restoredUnconfirmed rows may describe a turn that ended while no receiver was up.
    expect(
      shouldDispatchTerminalBellNotification(
        makeStatus({ state: 'working', restoredUnconfirmed: true }),
        NOW
      )
    ).toBe(true)
  })
})
