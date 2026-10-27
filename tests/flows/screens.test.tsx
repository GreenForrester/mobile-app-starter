import { screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { DEMO_ACCOUNTS } from '@/auth/fake/demo-accounts';
import { createTestBackend } from '@/test-utils/auth';
import { renderApp } from '@/test-utils/renderApp';

// A screen a Derived App pushes from Home lives in app/(app)/, inside the signed-in area.
const routes = { '(app)/details': () => <Text>Details</Text> };

it('keeps a screen added under (app) out of reach while signed out', async () => {
  const app = await renderApp({ routes, initialUrl: '/details' });
  expect(app.getPathname()).toBe('/sign-in');
  expect(screen.queryByText('Details')).toBeNull();
});

it('opens a screen added under (app) while signed in', async () => {
  const backend = createTestBackend();
  await backend.signInWithPassword(DEMO_ACCOUNTS.plain.email, DEMO_ACCOUNTS.plain.password);
  const app = await renderApp({ backend, routes, initialUrl: '/details' });
  expect(await screen.findByText('Details')).toBeVisible();
  expect(app.getPathname()).toBe('/details');
});
