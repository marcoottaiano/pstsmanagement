import { describe, expect, it } from "vitest";

import { APP_CONFIG } from "./app.config";

describe("APP_CONFIG", () => {
  it("uses the product locale and timezone", () => {
    expect(APP_CONFIG.locale).toBe("it-IT");
    expect(APP_CONFIG.timezone).toBe("Europe/Rome");
  });
});
