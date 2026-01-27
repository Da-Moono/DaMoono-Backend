export type ConsultStatus = 'waiting' | 'connected';

export type ConsultSession = {
  userId: unknown;
  userSocket: string;
  consultantSocket: string | null;
  status: ConsultStatus;
  createdAt: Date;
};

export type MessageData = {
  message: string;
  sender: string;
  timestamp: Date;
};

export type ConsultState = {
  consultSessions: Map<string, ConsultSession>;
  sessionMessages: Map<string, MessageData[]>;
};
