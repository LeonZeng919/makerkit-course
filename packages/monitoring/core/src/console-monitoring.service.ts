import { MonitoringService } from '@kit/monitoring-core';

export class ConsoleMonitoringService implements MonitoringService {
  identifyUser(data: { id: string }) {
    console.log(`[Console Monitoring] Identified user`, data);
  }

  captureException(error: Error) {
    console.error(
      `[Console Monitoring] Caught exception: ${JSON.stringify(error)}`,
    );
  }

  captureEvent(event: string) {
    console.log(`[Console Monitoring] Captured event: ${event}`);
  }

  ready() {
    return Promise.resolve();
  }
}
