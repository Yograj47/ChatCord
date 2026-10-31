import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateRoomForm } from '@/features/rooms/components/CreateRoomForm';
import { MessageInput } from '@/features/messaging/components/MessageInput';
import { Modal } from '@/shared/ui/Modal';

describe('room form accessibility and validation', () => {
  it('announces and associates invalid room names without submitting', async () => {
    const submit = vi.fn();
    render(<CreateRoomForm onSubmit={submit} onCancel={vi.fn()} isLoading={false} />);
    await userEvent.click(screen.getByRole('button', { name: 'Create Room' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('at least 2');
    expect(screen.getByLabelText('Room Name')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Room Name')).toHaveAccessibleDescription(
      'Room name must be at least 2 characters',
    );
    expect(submit).not.toHaveBeenCalled();
  });
  it('submits public visibility and the text capability', async () => {
    const submit = vi.fn().mockResolvedValue(undefined);
    render(<CreateRoomForm onSubmit={submit} onCancel={vi.fn()} isLoading={false} />);
    await userEvent.type(screen.getByLabelText('Room Name'), 'Test room');
    await userEvent.click(screen.getByRole('button', { name: /Public/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Create Room' }));
    await waitFor(() =>
      expect(submit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test room',
          visibility: 'public',
          capabilities: ['text'],
        }),
      ),
    );
  });
  it('disables dismissal and fields while submitting', () => {
    render(<CreateRoomForm onSubmit={vi.fn()} onCancel={vi.fn()} isLoading />);
    expect(screen.getByLabelText('Room Name')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  });
});

describe('message composer delivery', () => {
  it.each([false, true])('retains draft unless delivery succeeds: %s', async (success) => {
    const send = vi.fn().mockResolvedValue(success);
    render(<MessageInput channelName="test" onSendMessage={send} />);
    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'hello{Enter}');
    await waitFor(() => expect(send).toHaveBeenCalled());
    await waitFor(() => expect(input).toHaveValue(success ? '' : 'hello'));
  });
  it('blocks sends when access is unavailable', async () => {
    const send = vi.fn();
    render(
      <MessageInput
        channelName="test"
        onSendMessage={send}
        disabled
        disabledReason="Access revoked"
      />,
    );
    expect(screen.getByRole('textbox')).toBeDisabled();
    expect(send).not.toHaveBeenCalled();
  });
});

describe('dialog cancellation contract', () => {
  it.each([false, true])('honors the pending dismissal policy: %s', (pending) => {
    const close = vi.fn();
    render(
      <Modal isOpen onClose={close} isPending={pending} title="Test dialog" description="Details">
        Content
      </Modal>,
    );
    const dialog = screen.getByRole('dialog', { name: 'Test dialog' });
    expect(dialog).toHaveAccessibleDescription('Details');
    const event = new Event('cancel', { cancelable: true });
    dialog.dispatchEvent(event);
    expect(close).toHaveBeenCalledTimes(pending ? 0 : 1);
    expect(event.defaultPrevented).toBe(true);
  });
});
