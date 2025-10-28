export function composeAbortSignal(signals: AbortSignal[]): AbortSignal {
  if (typeof (AbortSignal as any).any === 'function') {
    return (AbortSignal as any).any(signals);
  }

  const controller = new AbortController();
  const onAbort = () => controller.abort();
  for (const s of signals) {
    if (s.aborted) {
      controller.abort();
      break;
    }
    s.addEventListener('abort', onAbort, { once: true });
  }
  return controller.signal;
}

export function withTimeoutSignal(signal: AbortSignal, timeoutMs: number) {
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), timeoutMs);
  const combined = composeAbortSignal([signal, timeoutController.signal]);
  const cleanup = () => clearTimeout(timeoutId);
  return { signal: combined, cleanup };
}

