import * as Sentry from '@sentry/nextjs';

import { MonitoringService } from '@kit/monitoring-core';

/**
 * @class
 * @implements {MonitoringService}
 * ServerSentryMonitoringService is responsible for capturing exceptions and identifying users using the Sentry monitoring service.
 */
export class SentryMonitoringService implements MonitoringService {
  private readonly readyPromise: Promise<unknown>;
  private readyResolver?: (value?: unknown) => void;

  constructor() {
    this.readyPromise = new Promise(
      (resolve) => (this.readyResolver = resolve),
    );

    void this.initialize();
  }

  async ready() {
    return this.readyPromise;
  }

  captureException(error: Error | null) {
    return Sentry.captureException(error);
  }

  captureEvent<Extra extends Sentry.Event>(event: string, extra?: Extra) {
    return Sentry.captureEvent({
      message: event,
      ...(extra ?? {}),
    });
  }

  identifyUser(user: Sentry.User) {
    Sentry.setUser(user);
  }

  private async initialize() {
    if (typeof document !== 'undefined') {
      const { initializeSentryBrowserClient } = await import(
        '../sentry.client.config'
      );

      initializeSentryBrowserClient();
    } else {
      const { initializeSentryServerClient } = await import(
        '../sentry.server.config'
      );

      initializeSentryServerClient();
    }

    this.readyResolver?.();
  }
}
