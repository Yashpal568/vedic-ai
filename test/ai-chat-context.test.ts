import { describe, expect, it } from "vitest";
import { isChartContextAligned } from "../lib/ai-chat-context";

const profile = {
  name: "Test User",
  date: "1990-08-15",
  time: "05:45",
  place: "New Delhi, Delhi, India",
  latitude: 28.6139,
  longitude: 77.209,
  timezone: "Asia/Kolkata",
};
const chart = {
  engine: "Swiss Ephemeris",
  zodiac: "sidereal",
  houseSystem: "whole_sign",
  birth: {
    date: profile.date, time: profile.time, place: profile.place,
    latitude: profile.latitude, longitude: profile.longitude, timezone: profile.timezone,
  },
};

describe("AI chat birth-chart context integrity", () => {
  it("accepts the current Swiss Ephemeris chart for the active birth profile", () => {
    expect(isChartContextAligned(chart, profile)).toBe(true);
  });

  it.each([
    ["date", { ...chart, birth: { ...chart.birth, date: "1995-03-21" } }],
    ["time", { ...chart, birth: { ...chart.birth, time: "14:15" } }],
    ["place", { ...chart, birth: { ...chart.birth, place: "Mumbai, India" } }],
    ["latitude", { ...chart, birth: { ...chart.birth, latitude: 19.076 } }],
    ["longitude", { ...chart, birth: { ...chart.birth, longitude: 72.8777 } }],
    ["timezone", { ...chart, birth: { ...chart.birth, timezone: "Europe/London" } }],
    ["engine", { ...chart, engine: "Astronomy Engine" }],
    ["zodiac", { ...chart, zodiac: "tropical" }],
    ["house system", { ...chart, houseSystem: "placidus" }],
  ])("rejects stale or incompatible %s context", (_label, invalidChart) => {
    expect(isChartContextAligned(invalidChart, profile)).toBe(false);
  });

  it("rejects missing chart metadata and profiles without selected coordinates", () => {
    expect(isChartContextAligned({}, profile)).toBe(false);
    expect(isChartContextAligned(chart, { ...profile, latitude: undefined })).toBe(false);
  });
});
