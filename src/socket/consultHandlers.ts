import type { Server, Socket } from 'socket.io';
import { prisma } from '../prisma.js';

type ConsultStatus = 'waiting' | 'connected';

type ConsultSessionMem = {
  userId: unknown;
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
const sessionMessages = new Map<string, MessageData[]>();

// ✅ 세션별 seq(시간 없이 순서 보장)
const sessionSeq = new Map<string, number>();

function getWaitingSessions() {
  const waiting: Array<{
    sessionId: string;
    userId: unknown;
    createdAt: Date;
  }> = [];
  for (const [sessionId, session] of consultSessions.entries()) {
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

// sender 문자열 -> Prisma enum 매핑
function mapSenderRole(sender: string): 'USER' | 'CONSULTANT' {
  const s = String(sender ?? '').toLowerCase();
  if (s === 'consultant' || s === 'admin') return 'CONSULTANT';
  // 기본값은 USER
  return 'USER';
}

// socket 인증에서 붙인 user 정보에서 id 뽑기
function getAuthedUserId(socket: Socket): number | null {
  const u = (socket.data as any)?.user;
  const id = u?.id;
  return typeof id === 'number' ? id : null;
}

export function registerConsultHandlers(io: Server, socket: Socket) {
  // ✅ 사용자가 상담 시작
  socket.on('start-consult', async (userId) => {
    const sessionId = `session-${Date.now()}`;

    consultSessions.set(sessionId, {
      userId,
      userSocket: socket.id,
      consultantSocket: null,
      status: 'waiting',
      createdAt: new Date(),
    });

    // ✅ DB: ConsultSession 생성
    const authedId = getAuthedUserId(socket);
    const dbUserId =
      typeof authedId === 'number'
        ? authedId
        : typeof userId === 'number'
          ? userId
          : Number(userId);

    try {
      await prisma.consultSession.create({
        data: {
          id: sessionId,
          userId: dbUserId,
          status: 'WAITING',
        },
      });
      sessionSeq.set(sessionId, 0);
    } catch (e) {
      console.error('[DB] ConsultSession create fail:', e);
      // DB 실패해도 기존 실시간 흐름 유지(emit 구조 변경 X)
    }

    socket.join(sessionId);
    socket.emit('session-created', sessionId);

    io.emit('sessions-updated', getWaitingSessions());
    console.log(`📞 상담 세션 생성: ${sessionId}`);
  });

  // ✅ 대기 중인 세션 목록 요청
  socket.on('get-waiting-sessions', () => {
    socket.emit('waiting-sessions', getWaitingSessions());
  });

  // ✅ 상담사가 세션에 참여
  socket.on('consultant-join', async (sessionId: string) => {
    const session = consultSessions.get(sessionId);
    if (!session) return;

    session.consultantSocket = socket.id;
    session.status = 'connected';

    // ✅ DB: consultantId 업데이트 + status CONNECTED
    const consultantId = getAuthedUserId(socket); // 소켓 인증이 붙어있으면 여기서 나옴

    try {
      await prisma.consultSession.update({
        where: { id: sessionId },
        data: {
          consultantId: consultantId ?? undefined,
          status: 'CONNECTED',
        },
      });
    } catch (e) {
      console.error('[DB] ConsultSession update fail:', e);
    }

    socket.join(sessionId);
    io.to(sessionId).emit('consultant-connected');

    io.emit('sessions-updated', getWaitingSessions());
    console.log(`👨‍💼 상담사 연결: ${sessionId}`);
  });

  // ✅ 메시지 전송
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
      console.log(`💬 메시지 전송 [${sessionId}] ${sender}: ${message}`);

      const messageData: MessageData = {
        message,
        sender,
        timestamp: new Date(),
      };

      // (기존) 메모리 저장 유지
      if (!sessionMessages.has(sessionId)) sessionMessages.set(sessionId, []);
      sessionMessages.get(sessionId)!.push(messageData);

      // ✅ DB: ConsultMessage 생성
      try {
        const nextSeq = (sessionSeq.get(sessionId) ?? 0) + 1;
        sessionSeq.set(sessionId, nextSeq);

        await prisma.consultMessage.create({
          data: {
            sessionId,
            seq: nextSeq,
            senderRole: mapSenderRole(sender),
            content: String(message ?? ''),
          },
        });
      } catch (e) {
        console.error('[DB] ConsultMessage create fail:', e);
        // seq 충돌 가능성: 운영에서는 트랜잭션/DB에서 max+1로 개선 가능
      }

      // (기존) 브로드캐스트 유지
      io.to(sessionId).emit('receive-message', messageData);
    },
  );

  // ✅ 상담 종료
  socket.on('end-consult', async (sessionId: string) => {
    const session = consultSessions.get(sessionId);
    if (!session) return;

    io.to(sessionId).emit('consult-ended');
    consultSessions.delete(sessionId);

    // ✅ DB: status ENDED
    try {
      await prisma.consultSession.update({
        where: { id: sessionId },
        data: { status: 'ENDED' },
      });
    } catch (e) {
      console.error('[DB] ConsultSession end fail:', e);
    }

    io.emit('sessions-updated', getWaitingSessions());
    console.log(`🔚 상담 종료: ${sessionId}`);

    setTimeout(
      () => {
        sessionMessages.delete(sessionId);
        sessionSeq.delete(sessionId);
        console.log(`🗑️ 세션 메시지 삭제: ${sessionId}`);
      },
      30 * 60 * 1000,
    );
  });
}

// ✅ (선택) 기존 조회 API 유지용: 메모리에서 가져오는 함수
export function getSessionMessages(sessionId: string) {
  return sessionMessages.get(sessionId) || [];
}
