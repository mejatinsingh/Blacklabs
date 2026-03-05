import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProfilesService } from '../profiles/profiles.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly domain: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly audience: string;

  constructor(
    private configService: ConfigService,
    private profilesService: ProfilesService,
  ) {
    this.domain = this.configService.get<string>('AUTH0_ISSUER_URL')!;
    this.clientId = this.configService.get<string>('AUTH0_CLIENT_ID')!;
    this.clientSecret = this.configService.get<string>('AUTH0_CLIENT_SECRET')!;
    this.audience = this.configService.get<string>('AUTH0_AUDIENCE')!;
  }

  async signup(signupDto: SignupDto) {
    const { email, password, firstName, lastName, phoneNumber, city } =
      signupDto;

    // 1. Create user in Auth0
    const auth0User = await this.createAuth0User(email, password, firstName, lastName);

    // 2. Create profile in our database linked to Auth0 user
    const profile = await this.profilesService.create(auth0User.auth0Id, {
      firstName,
      lastName,
      email,
      phoneNumber,
      city,
    });

    // 3. Log them in immediately and return token
    const tokens = await this.getAuth0Token(email, password);

    return {
      access_token: tokens.access_token,
      token_type: tokens.token_type,
      expires_in: tokens.expires_in,
      profile,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // 1. Authenticate with Auth0 and get token
    const tokens = await this.getAuth0Token(email, password);

    // 2. Find or return profile
    let profile: any = null;
    try {
      profile = await this.profilesService.findByAuth0Id(tokens.sub);
    } catch {
      // Profile might not exist yet (e.g., user created directly in Auth0 dashboard)
    }

    return {
      access_token: tokens.access_token,
      token_type: tokens.token_type,
      expires_in: tokens.expires_in,
      profile,
    };
  }

  private async createAuth0User(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ): Promise<{ auth0Id: string }> {
    const url = `${this.domain}dbconnections/signup`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: this.clientId,
        email,
        password,
        connection: 'Username-Password-Authentication',
        given_name: firstName,
        family_name: lastName,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      if (data.code === 'user_exists' || data.statusCode === 409) {
        throw new ConflictException('A user with this email already exists');
      }
      throw new InternalServerErrorException(
        data.description || data.message || 'Failed to create Auth0 user',
      );
    }

    return { auth0Id: `auth0|${data._id}` };
  }

  private async getAuth0Token(email: string, password: string) {
    const url = `${this.domain}oauth/token`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'password',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        audience: this.audience,
        username: email,
        password,
        scope: 'openid profile email',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      if (
        data.error === 'invalid_grant' ||
        data.error === 'invalid_user_password'
      ) {
        throw new UnauthorizedException('Invalid email or password');
      }
      throw new UnauthorizedException(
        data.error_description || 'Authentication failed',
      );
    }

    // Decode the access token to get the sub claim
    const tokenParts = data.access_token.split('.');
    const payload = JSON.parse(
      Buffer.from(tokenParts[1], 'base64url').toString(),
    );

    return {
      access_token: data.access_token,
      token_type: data.token_type,
      expires_in: data.expires_in,
      sub: payload.sub,
    };
  }
}
