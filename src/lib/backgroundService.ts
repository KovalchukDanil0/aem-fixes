import { defineProxyService } from "@webext-core/proxy-service";

class BackgroundService {
  async fibonacci(number: number): Promise<number> {
    return Promise.resolve(number);
  }
}
export const [registerBackgroundService, getBackgroundService] =
  defineProxyService("BackgroundService", () => new BackgroundService());
