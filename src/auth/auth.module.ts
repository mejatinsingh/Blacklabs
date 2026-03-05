import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ProfilesModule } from '../profiles/profiles.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    ProfilesModule,
  ],
  controllers: [AuthController],
  providers: [JwtStrategy, AuthService],
  exports: [PassportModule],
})
export class AuthModule {}
