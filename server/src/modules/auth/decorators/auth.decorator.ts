import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiUnauthorizedResponse } from '@nestjs/swagger';

import { COMMON_ERROR_RESPONSES } from 'src/common/constants/response.constants';
import { GoogleAuthGuard } from '../guards/google-auth.guard';
import { SessionGuard } from '../guards/session.guard';

export function GoogleLoginDecorator() {
  return applyDecorators(
    UseGuards(GoogleAuthGuard),
    ApiOperation({ summary: 'Authenticate with Google' }),
    ApiUnauthorizedResponse(COMMON_ERROR_RESPONSES.unauthorized),
  );
}

export function GoogleCallbackDecorator() {
  return applyDecorators(
    UseGuards(GoogleAuthGuard),
    ApiOperation({ summary: 'Handle Google authentication callback' }),
    ApiUnauthorizedResponse(COMMON_ERROR_RESPONSES.unauthorized),
  );
}

export function GuestSessionDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create a guest session',
    }),
  );
}

export function CurrentUserDecorator() {
  return applyDecorators(
    UseGuards(SessionGuard),
    ApiOperation({
      summary: 'Get the current authenticated user',
    }),
    ApiUnauthorizedResponse(COMMON_ERROR_RESPONSES.unauthorized),
  );
}

export function LogoutDecorator() {
  return applyDecorators(
    UseGuards(SessionGuard),
    ApiOperation({
      summary: 'End the current session',
    }),
    ApiUnauthorizedResponse(COMMON_ERROR_RESPONSES.unauthorized),
  );
}
