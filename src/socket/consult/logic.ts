import type { Server, Socket } from 'socket.io';
import { getWaitingSessions } from './state.js';
import type { ConsultState, MessageData } from './types.js';

export function startConsult(
  state: ConsultState,
  io: Server,
  socket: Socket,
  userId: unknown,
) {
  const sessionId = `session-${Date.now()}`;

  state.consultSessions.set(sessionId, {
    userId,
    userSocket: socket.id,
    consultantSocket: null,
    status: 'waiting',
    createdAt: new Date(),
  });

  socket.join(sessionId);
  socket.emit('session-created', sessionId);
  io.emit('sessions-updated', getWaitingSessions(state));

  console.log(`📞 상담 세션 생성: ${sessionId}`);
}

export function consultantJoin(
  state: ConsultState,
  io: Server,
  socket: Socket,
  sessionId: string,
) {
  const session = state.consultSessions.get(sessionId);
  if (!session) return;

  session.consultantSocket = socket.id;
  session.status = 'connected';

  socket.join(sessionId);
  io.to(sessionId).emit('consultant-connected');
  io.emit('sessions-updated', getWaitingSessions(state));

  console.log(`👨‍💼 상담사 연결: ${sessionId}`);
}

export function sendMessage(
  state: ConsultState,
  io: Server,
  payload: { sessionId: string; message: string; sender: string },
) {
  const { sessionId, message, sender } = payload;

  const messageData: MessageData = {
    message,
    sender,
    timestamp: new Date(),
  };

  if (!state.sessionMessages.has(sessionId))
    state.sessionMessages.set(sessionId, []);
  state.sessionMessages.get(sessionId)!.push(messageData);

  io.to(sessionId).emit('receive-message', messageData);
}

export function endConsult(state: ConsultState, io: Server, sessionId: string) {
  const session = state.consultSessions.get(sessionId);
  if (!session) return;

  io.to(sessionId).emit('consult-ended');
  state.consultSessions.delete(sessionId);

  io.emit('sessions-updated', getWaitingSessions(state));
  console.log(`🔚 상담 종료: ${sessionId}`);

  setTimeout(
    () => {
      state.sessionMessages.delete(sessionId);
      console.log(`🗑️ 세션 메시지 삭제: ${sessionId}`);
    },
    30 * 60 * 1000,
  );
}
