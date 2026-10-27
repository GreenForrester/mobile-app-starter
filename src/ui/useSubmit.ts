import { useRef, useState } from 'react';

// One submission at a time, whether it starts from a button or from the keyboard's Go key.
// Pass `busy` to the form's Button so it shows the spinner either way.
export function useSubmit(action: () => Promise<unknown>) {
  const running = useRef(false);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    try {
      await action();
    } finally {
      running.current = false;
      setBusy(false);
    }
  }

  return { submit, busy };
}
