/**
 * Terminal-bell OS notification policy.
 *
 * Why extracted: the live pane path and the parked byte watcher both raise BEL
 * notifications and must not drift (same reason agent-task-complete-policy.ts
 * exists). Dependency-light on purpose — no pane/xterm imports.
 */
import {
  isFreshNonDoneAgentStatus,
  type AgentStatusEntry
} from '../../../../shared/agent-status-types'

/**
 * Whether a BEL may raise its own "Attention requested" notification.
 *
 * Why: agent CLIs ring the bell as their own attention channel (Claude Code's
 * default notification channel is the terminal bell), so while a pane's agent is
 * mid-turn its hooks are the authoritative signal, not the byte. A real pause lands
 * as `waiting`/`blocked` and fires the richer "needs input" banner; under an
 * auto-approving permission mode (Claude's `auto`, the built-in default since
 * 2.1.228) the agent rings the bell and keeps going, so the raw BEL would announce
 * attention nothing is waiting on.
 */
export function shouldDispatchTerminalBellNotification(
  agentStatus: AgentStatusEntry | undefined,
  now = Date.now()
): boolean {
  return !isFreshNonDoneAgentStatus(agentStatus, now)
}
