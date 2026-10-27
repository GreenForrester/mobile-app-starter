import { render, screen } from '@testing-library/react-native';

import { TextField } from './TextField';

it('has a visible label that also names the input', async () => {
  await render(<TextField label="Email" value="" onChangeText={() => {}} />);
  expect(screen.getByText('Email')).toBeVisible();
  expect(screen.getByLabelText('Email')).toBeOnTheScreen();
});

it('shows its error', async () => {
  await render(<TextField label="Email" value="" onChangeText={() => {}} error="Enter your email." />);
  expect(screen.getByText('Enter your email.')).toBeVisible();
});

it('shows helper text when there is no error', async () => {
  await render(
    <TextField label="Password" value="" onChangeText={() => {}} error={null} helperText="At least 8 characters" />,
  );
  expect(screen.getByText('At least 8 characters')).toBeVisible();
  expect(screen.queryByText('Enter your password.')).toBeNull();
});
