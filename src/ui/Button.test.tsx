import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { Button } from './Button';

it('ignores presses while its action is still running', async () => {
  let finish: () => void = () => {};
  const onPress = jest.fn(() => new Promise<void>((resolve) => (finish = resolve)));
  await render(<Button title="Sign in" onPress={onPress} />);
  const button = screen.getByRole('button', { name: 'Sign in' });

  await fireEvent.press(button);
  await fireEvent.press(button);
  expect(onPress).toHaveBeenCalledTimes(1);
  expect(button).toBeBusy();

  await act(async () => finish());
  await fireEvent.press(button);
  expect(onPress).toHaveBeenCalledTimes(2);
});

it('never calls onPress when disabled', async () => {
  const onPress = jest.fn();
  await render(<Button title="Sign in" onPress={onPress} disabled />);
  await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));
  expect(onPress).not.toHaveBeenCalled();
});
