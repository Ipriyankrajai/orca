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
 * as `waiting`/`blocked` and fires the richer "needs input" banner; an end-of-turn
 * BEL beats the completion hook and would otherwise win the worktree cooldown with
 * a contextless banner; and under an auto-approving permission mode (Claude's
 * `auto`, Codex auto-approval) the agent bells and keeps going.
 */
export function shouldDispatchTerminalBellNotification(
  agentStatus: AgentStatusEntry | undefined,
  options: { agentTaskCompleteNotificationsEnabled: boolean; now?: number }
): boolean {
  // Why: with the agent channel switched off, the bell is the user's only agent
  // signal — yielding to a banner that will never fire would silence the pane.
  if (!options.agentTaskCompleteNotificationsEnabled) {
    return true
  }
  return !isFreshNonDoneAgentStatus(agentStatus, options.now ?? Date.now())
}
