import {
  ArgumentsHost,
  Catch,
  HttpException,
  WsExceptionFilter,
} from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Catch()
export class GatewayExceptionFilter implements WsExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    let error = 'Could not complete the realtime request.';
    if (exception instanceof WsException) {
      const detail = exception.getError();
      if (typeof detail === 'string') error = detail;
    } else if (exception instanceof HttpException) error = exception.message;
    const acknowledge = host.getArgByIndex<unknown>(2);
    if (typeof acknowledge === 'function')
      (acknowledge as (result: unknown) => void)({ ok: false, error });
    else
      host
        .switchToWs()
        .getClient<Socket>()
        .emit('exception', { message: error });
  }
}
