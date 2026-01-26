declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        name: string;
        role: 'USER' | 'ADMIN';
      };
    }
  }
}

export {};
