import { fireEvent, render } from '@testing-library/react';
import { expect, it } from 'vitest';
import { Avatar } from '@/shared/ui/Avatar';

it('shows photos, falls back on failure, and retries when the photo changes', () => {
  const { container, rerender } = render(
    <Avatar src="/first.png" initials="AB" className="size-8" />,
  );
  const photo = container.querySelector('img')!;
  expect(photo).toHaveAttribute('src', '/first.png');
  fireEvent.error(photo);
  expect(container.querySelector('img')).toBeNull();
  expect(container).toHaveTextContent('AB');
  rerender(<Avatar src="/second.png" initials="AB" className="size-8" />);
  expect(container.querySelector('img')).toHaveAttribute('src', '/second.png');
  rerender(<Avatar initials="AB" className="size-8" />);
  expect(container).toHaveTextContent('AB');
});
