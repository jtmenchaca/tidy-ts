import { expect } from "@std/expect";
import { percent } from "./percent.ts";

Deno.test("percent - basic percentage calculation", () => {
  expect(percent(25, 100)).toBe(25.0);
  expect(percent(50, 100)).toBe(50.0);
  expect(percent(75, 100)).toBe(75.0);
  expect(percent(100, 100)).toBe(100.0);
});

Deno.test("percent - default 1 decimal place", () => {
  expect(percent(1, 3)).toBe(33.3);
  expect(percent(2, 3)).toBe(66.7);
  expect(percent(1, 6)).toBe(16.7);
  expect(percent(5, 6)).toBe(83.3);
});

Deno.test("percent - custom decimal places", () => {
  expect(percent(1, 3, 0)).toBe(33);
  expect(percent(1, 3, 1)).toBe(33.3);
  expect(percent(1, 3, 2)).toBe(33.33);
  expect(percent(1, 3, 3)).toBe(33.333);
  expect(percent(1, 3, 4)).toBe(33.3333);
});

Deno.test("percent - zero numerator", () => {
  expect(percent(0, 100)).toBe(0.0);
  expect(percent(0, 50)).toBe(0.0);
  expect(percent(0, 1)).toBe(0.0);
});

Deno.test("percent - division by zero", () => {
  // Should return 0 instead of Infinity or NaN
  expect(percent(5, 0)).toBe(0);
  expect(percent(100, 0)).toBe(0);
  expect(percent(0, 0)).toBe(0);
});

Deno.test("percent - percentages over 100", () => {
  expect(percent(150, 100)).toBe(150.0);
  expect(percent(200, 100)).toBe(200.0);
  expect(percent(5, 2)).toBe(250.0);
});

Deno.test("percent - small percentages", () => {
  expect(percent(1, 1000)).toBe(0.1);
  expect(percent(1, 10000, 2)).toBe(0.01);
  expect(percent(1, 100000, 3)).toBe(0.001);
});

Deno.test("percent - fractional inputs", () => {
  expect(percent(0.5, 1)).toBe(50.0);
  expect(percent(0.25, 1)).toBe(25.0);
  expect(percent(1.5, 3)).toBe(50.0);
  expect(percent(2.7, 9, 2)).toBe(30.00);
});

Deno.test("percent - negative values", () => {
  // Negative percentages can be useful for changes/deltas
  expect(percent(-25, 100)).toBe(-25.0);
  expect(percent(25, -100)).toBe(-25.0);
  expect(percent(-25, -100)).toBe(25.0);
});

Deno.test("percent - real-world use case: conversion rates", () => {
  const clicks = 150;
  const impressions = 10000;

  expect(percent(clicks, impressions, 2)).toBe(1.5);
});

Deno.test("percent - real-world use case: behavioral health percentage", () => {
  const involves_Behavioral_Health = 45;
  const message_count = 200;

  expect(percent(involves_Behavioral_Health, message_count, 1)).toBe(22.5);
});

Deno.test("percent - real-world use case: completion rate", () => {
  const completed = 847;
  const total = 1000;

  expect(percent(completed, total, 1)).toBe(84.7);
});

Deno.test("percent - edge case: very small numbers", () => {
  expect(percent(0.0001, 1, 4)).toBe(0.01);
  expect(percent(0.00001, 1, 5)).toBe(0.001);
});

Deno.test("percent - edge case: very large numbers", () => {
  expect(percent(1000000, 10000000, 1)).toBe(10.0);
  expect(percent(5000000, 10000000, 2)).toBe(50.0);
});

Deno.test("percent - null/undefined numerator", () => {
  const nullValue: number | null = null;
  const undefinedValue: number | undefined = undefined;
  expect(percent(nullValue, 100)).toBe(null);
  expect(percent(undefinedValue, 100)).toBe(null);
});

Deno.test("percent - null/undefined denominator", () => {
  const nullValue: number | null = null;
  const undefinedValue: number | undefined = undefined;
  expect(percent(50, nullValue)).toBe(null);
  expect(percent(50, undefinedValue)).toBe(null);
});

Deno.test("percent - both null/undefined", () => {
  const nullValue: number | null = null;
  const undefinedValue: number | undefined = undefined;
  expect(percent(nullValue, nullValue)).toBe(null);
  expect(percent(undefinedValue, undefinedValue)).toBe(null);
  expect(percent(nullValue, undefinedValue)).toBe(null);
});
