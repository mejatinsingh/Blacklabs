export interface JwtPayload {
  sub: string;
  iss: string;
  aud: string | string[];
  iat: number;
  exp: number;
  scope?: string;
  'https://blacklabs.com/roles'?: string[];
}
