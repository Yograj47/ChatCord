import { MongooseModule } from '@nestjs/mongoose';
import { Session, SessionSchema } from './schemas/session.schema';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { GoogleStrategy } from './strategies/google.strategy';
import { SessionService } from './session.service';
import { UsersModule } from '../users/users.module';
import { SessionGuard } from './guards/session.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';

@Module({
  imports: [
    PassportModule,
    UsersModule,

    MongooseModule.forFeature([
      {
        name: Session.name,
        schema: SessionSchema,
      },
    ]),
  ],

  controllers: [AuthController],
  providers: [
    AuthService,
    SessionService,
    GoogleStrategy,
    GoogleAuthGuard,
    SessionGuard,
  ],
  exports: [AuthService, SessionService, SessionGuard],
})
export class AuthModule {}
