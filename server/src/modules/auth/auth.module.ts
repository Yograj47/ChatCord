import { RoomActivityModule } from '../rooms/room-activity.module';
import { GuestLifecycleService } from './guest-lifecycle.service';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Room, RoomSchema } from '../rooms/schemas/room.schema';
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
    RoomActivityModule,
    UsersModule,

    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Room.name, schema: RoomSchema },
      {
        name: Session.name,
        schema: SessionSchema,
      },
    ]),
  ],

  controllers: [AuthController],
  providers: [
    GuestLifecycleService,
    AuthService,
    SessionService,
    GoogleStrategy,
    GoogleAuthGuard,
    SessionGuard,
  ],
  exports: [AuthService, SessionService, SessionGuard],
})
export class AuthModule {}
