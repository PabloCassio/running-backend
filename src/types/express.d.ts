declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: {
        id: string;
        email: string;
        role: string;
        username: string;
      };
      requestId?: string;
    }
  }
}

export {};
