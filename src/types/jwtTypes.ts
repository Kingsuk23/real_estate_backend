export interface JwtPayload {
  user: {
    id: string;
    role: 'ADMIN' | 'USER' | 'AGENT';
  };
  iat: number;
  exp: number;
}
