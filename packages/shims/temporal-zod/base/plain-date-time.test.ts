/**
 * Verifies that zPlainDateTime can parse a JS Date that came from
 * node-oracledb fetching an Oracle DATE column.
 *
 * Oracle DATE is zoneless (7 bytes: y/m/d/h/m/s). node-oracledb constructs
 * a JS Date whose UTC components equal the wall clock Oracle stored
 * (assuming ORA_SDTZ defaults to UTC, or is set to UTC). We don't talk to
 * Oracle in this test — we synthesize the exact Date the driver would hand
 * us and assert that zPlainDateTime turns it into a PlainDateTime with the
 * same wall-clock fields, with no zone shift.
 */

import { expect } from "@std/expect";
import { zPlainDateTime } from "./plain-date-time.ts";

Deno.test("zPlainDateTime accepts a Date from node-oracledb (Oracle DATE)", async (t) => {
  await t.step("APPT_TIME 2025-10-14 17:00:00 round-trips", () => {
    // Synthesize what node-oracledb hands us for an Oracle DATE row
    // containing the wall clock 2025-10-14 17:00:00.
    const oracleDate = new Date(Date.UTC(2025, 9, 14, 17, 0, 0));

    const result = zPlainDateTime.parse(oracleDate);

    expect(result).toBeInstanceOf(Temporal.PlainDateTime);
    expect(result.year).toBe(2025);
    expect(result.month).toBe(10);
    expect(result.day).toBe(14);
    expect(result.hour).toBe(17);
    expect(result.minute).toBe(0);
    expect(result.second).toBe(0);
  });

  await t.step("CONTACT_DATE midnight 2025-10-14 round-trips", () => {
    const oracleDate = new Date(Date.UTC(2025, 9, 14, 0, 0, 0));

    const result = zPlainDateTime.parse(oracleDate);

    expect(result.year).toBe(2025);
    expect(result.month).toBe(10);
    expect(result.day).toBe(14);
    expect(result.hour).toBe(0);
  });

  await t.step("does not shift across calendar boundary at 23:59", () => {
    // The Date-as-zoneless-wall-clock convention must not shift the day
    // when local TZ is anything other than UTC. We verify by comparing
    // UTC components, not local components.
    const oracleDate = new Date(Date.UTC(2025, 11, 31, 23, 59, 0));

    const result = zPlainDateTime.parse(oracleDate);

    expect(result.year).toBe(2025);
    expect(result.month).toBe(12);
    expect(result.day).toBe(31);
    expect(result.hour).toBe(23);
    expect(result.minute).toBe(59);
  });
});
