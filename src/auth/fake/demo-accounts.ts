// Shown on the sign-in screen while the Fake Auth Backend is active, and listed in docs/building-on-the-starter.md.
export const DEMO_ACCOUNTS = {
  plain: { email: 'demo@example.com', password: 'Password123!' },
  secondFactor: { email: 'demo-2fa@example.com', password: 'Password123!', code: '123456' },
};

export type DemoAccounts = typeof DEMO_ACCOUNTS;
