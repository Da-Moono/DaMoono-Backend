import type { Server, Socket } from 'socket.io';
import { prisma } from '../prisma.js';

type ConsultStatus = 'waiting' | 'connected';

type ConsultSessionMem = {
  userName: string;
  userRole?: string;
  userSocket: string;
  consultantSocket: string | null;
  status: ConsultStatus;
  createdAt: Date;
};

type MessageData = {
  message: string;
  sender: string;
  timestamp: Date;
};

const consultSessions = new Map<string, ConsultSessionMem>();
const completedSessions = new Map<string, ConsultSessionMem>();
const sessionMessages = new Map<string, MessageData[]>();
const sessionSeq = new Map<string, number>();

function getWaitingSessions() {
  const waiting: Array<{
    sessionId: string;
    userName: string;
    status: ConsultStatus;
    createdAt: Date;
  }> = [];
  
  for (const [sessionId, session] of consultSessions.entries()) {
    if (session.userRole === 'ADMIN') {
      continue;
    }
    
    waiting.push({
      sessionId,
      userName: session.userName,
      status: session.status,
      createdAt: session.createdAt,
    });
  }
  
  return waiting;
}

export function registerConsultHandlers(io: Server, socket: Socket) {
  // 사용자가 상담 시작
  socket.on('start-consult', async (data: { userName?: string; userRole?: string } | unknown) => {
    let userName: string | undefined;
    let userRole: string | undefined;
    
    if (typeof data === 'object' && data !== null) {
      userName = (data as { userName?: string; userRole?: string }).userName;
      userRole = (data as { userName?: string; userRole?: string }).userRole;
    }

    if (!userName || userName.trim() === '') {
      socket.emit('session-error', { message: 'userName is required' });
      return;
    }

    const finalUserName = userName.trim();
    
    let existingSessionId: string | null = null;
    for (const [sessionId, session] of consultSessions.entries()) {
      if (
        session.userName === finalUserName && 
        session.userRole === userRole &&
        session.status === 'waiting'
      ) {
        existingSessionId = sessionId;
        break;
      }
    }
    
    if (existingSessionId) {
      socket.join(existingSessionId);
      socket.emit('session-created', existingSessionId);
      return;
    }
    
    const sessionId = `session-${Date.now()}`;

    consultSessions.set(sessionId, {
      userName: finalUserName,
      userRole,
      userSocket: socket.id,
      consultantSocket: null,
      status: 'waiting',
      createdAt: new Date(),
    });

    sessionSeq.set(sessionId, 0);
    socket.join(sessionId);
    socket.emit('session-created', sessionId);

    const waitingSessions = getWaitingSessions();
    io.emit('sessions-updated', waitingSessions);
  });

  // 대기 중인 세션 목록 요청
  socket.on('get-waiting-sessions', () => {
    socket.emit('waiting-sessions', getWaitingSessions());
  });

  socket.on('consultant-join', async (sessionId: string) => {
    const session = consultSessions.get(sessionId);
    if (!session) return;

    session.consultantSocket = socket.id;
    session.status = 'connected';

    socket.join(sessionId);
    io.to(sessionId).emit('consultant-connected');

    io.emit('sessions-updated', getWaitingSessions());
  });

  socket.on(
    'send-message',
    async ({
      sessionId,
      message,
      sender,
    }: {
      sessionId: string;
      message: string;
      sender: string;
    }) => {
      const messageData: MessageData = {
        message,
        sender,
        timestamp: new Date(),
      };

      if (!sessionMessages.has(sessionId)) sessionMessages.set(sessionId, []);
      sessionMessages.get(sessionId)!.push(messageData);

      const nextSeq = (sessionSeq.get(sessionId) ?? 0) + 1;
      sessionSeq.set(sessionId, nextSeq);

      io.to(sessionId).emit('receive-message', messageData);
    },
  );

  // 입력 중 상태 전송
  socket.on(
    'typing',
    ({
      sessionId,
      sender,
      isTyping,
    }: {
      sessionId: string;
      sender: string;
      isTyping: boolean;
    }) => {
      socket.to(sessionId).emit('typing', { sender, isTyping });
    },
  );

  socket.on('end-consult', async (sessionId: string) => {
    const session = consultSessions.get(sessionId);
    if (!session) return;

    completedSessions.set(sessionId, {
      ...session,
      status: 'connected',
    });

    const completedList = Array.from(completedSessions.entries()).map(([sid, s]) => ({
      sessionId: sid,
      userName: s.userName,
      completedAt: new Date(),
    }));

    io.to(sessionId).emit('consult-ended');
    consultSessions.delete(sessionId);

    io.emit('sessions-updated', getWaitingSessions());
    io.emit('completed-sessions-updated', completedList);

    setTimeout(
      () => {
        sessionMessages.delete(sessionId);
        sessionSeq.delete(sessionId);
      },
      30 * 60 * 1000,
    );
  });

  socket.on('get-completed-sessions', () => {
    const completed = Array.from(completedSessions.entries()).map(([sessionId, session]) => ({
      sessionId,
      userName: session.userName,
      completedAt: session.createdAt,
    }));
    socket.emit('completed-sessions', completed);
  });

  socket.on('disconnect', () => {
    // 연결 해제 처리
  });
}

export function getSessionMessages(sessionId: string) {
  return sessionMessages.get(sessionId) || [];
}
