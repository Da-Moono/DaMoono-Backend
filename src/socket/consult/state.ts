import type { ConsultState } from './types.js';

export function createConsultState(): ConsultState {
  return {
    consultSessions: new Map(),
    sessionMessages: new Map(),
  };
}

export function getWaitingSessions(state: ConsultState) {
  const waiting = [];
  for (const [sessionId, session] of state.consultSessions.entries()) {
    if (session.status === 'waiting') {
      waiting.push({
        sessionId,
        userId: session.userId,
        createdAt: session.createdAt,
      });
    }
  }
  return waiting;
}

export function getSessionMessages(state: ConsultState, sessionId: string) {
  return state.sessionMessages.get(sessionId) || [];
}
