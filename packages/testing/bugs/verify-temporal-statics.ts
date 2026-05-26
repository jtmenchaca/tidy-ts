import { Temporal } from "@tidy-ts/shims/temporal-polyfill";

const inst = Temporal.Instant.fromEpochMilliseconds(1700000000000);
const zdt = inst.toZonedDateTimeISO("America/New_York");

console.log("Instant.fromEpochMilliseconds exists?", typeof Temporal.Instant.fromEpochMilliseconds);
// deno-lint-ignore no-explicit-any
console.log("ZonedDateTime constructor has fromEpochMs?", typeof (zdt.constructor as any).fromEpochMilliseconds);

// Reconstruct from the value's own constructor
// deno-lint-ignore no-explicit-any
const reconstructed = (zdt.constructor as any).from?.({
  epochMilliseconds: 1700000000000,
  timeZone: zdt.timeZoneId,
});
console.log("Reconstructed via .from?():", reconstructed?.constructor?.name);

// Or: instant → zdt via toZonedDateTimeISO
const inst2 = Temporal.Instant.fromEpochMilliseconds(1700000000000);
const zdt2 = inst2.toZonedDateTimeISO(zdt.timeZoneId);
console.log("Reconstructed via Instant→ZDT:", zdt2.toString());

// The constructor of the sample itself
console.log("inst.constructor.name:", inst.constructor.name);
console.log("zdt.constructor.name:", zdt.constructor.name);

// Can we get to Instant from a ZonedDateTime sample? Yes — via .toInstant()
const inst3 = zdt.toInstant();
console.log("zdt.toInstant().constructor.name:", inst3.constructor.name);
// And from that Instant we have fromEpochMilliseconds:
const reconstructed2 = (inst3.constructor as typeof Temporal.Instant).fromEpochMilliseconds(1700000000000);
console.log("Reconstructed Instant:", reconstructed2.toString());
