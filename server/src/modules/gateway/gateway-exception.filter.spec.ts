import { ArgumentsHost, ForbiddenException } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { GatewayExceptionFilter } from './gateway-exception.filter';

describe('GatewayExceptionFilter', () => {
  const acknowledge = jest.fn();
  const emit = jest.fn();
  const host = (ack?: unknown) =>
    ({
      getArgByIndex: () => ack,
      switchToWs: () => ({ getClient: () => ({ emit }) }),
    }) as unknown as ArgumentsHost;
  beforeEach(() => jest.clearAllMocks());

  it('returns permission failures as negative acknowledgements instead of timing out', () => {
    new GatewayExceptionFilter().catch(
      new ForbiddenException('Membership required'),
      host(acknowledge),
    );
    expect(acknowledge).toHaveBeenCalledWith({
      ok: false,
      error: 'Membership required',
    });
    expect(emit).not.toHaveBeenCalled();
  });
  it('emits a websocket exception when no acknowledgement was supplied', () => {
    new GatewayExceptionFilter().catch(
      new WsException('Invalid payload'),
      host(),
    );
    expect(emit).toHaveBeenCalledWith('exception', {
      message: 'Invalid payload',
    });
  });
  it('does not disclose internal errors', () => {
    new GatewayExceptionFilter().catch(
      new Error('private connection details'),
      host(acknowledge),
    );
    expect(acknowledge).toHaveBeenCalledWith({
      ok: false,
      error: 'Could not complete the realtime request.',
    });
  });
});
