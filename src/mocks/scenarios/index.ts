import type { DemoScenario } from "../../engine/scenario";
import { afterHoursScenario } from "./after-hours";
import { emptyOfficeScenario } from "./empty-office";
import { highDaylightScenario } from "./high-daylight";
import { meetingScenario } from "./meeting";
import { normalDayScenario } from "./normal-day";

export const allScenarios: Record<string, DemoScenario> = {
  "normal-day": normalDayScenario,
  "high-daylight": highDaylightScenario,
  "empty-office": emptyOfficeScenario,
  meeting: meetingScenario,
  "after-hours": afterHoursScenario,
};

export {
  normalDayScenario,
  highDaylightScenario,
  emptyOfficeScenario,
  meetingScenario,
  afterHoursScenario,
};
