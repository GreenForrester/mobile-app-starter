import { useAuth } from '@/auth/AuthProvider';
import { AppText } from '@/ui/AppText';
import { Screen } from '@/ui/Screen';

// The first screen a signed-in person sees: the placeholder for a Derived App's own content.
export default function HomeScreen() {
  const { state } = useAuth();
  const email = state.status === 'signed-in' ? state.session.account.email : '';
  return (
    <Screen>
      <AppText variant="heading">{`Signed in as ${email}`}</AppText>
      <AppText tone="muted">This is where your app starts.</AppText>
    </Screen>
  );
}
