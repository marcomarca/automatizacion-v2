import type { SourceReference } from "../../models/scenario";

export const physicalSourcesSeed: SourceReference[] = [
  {
    id: "src-eaglerise-fms-60-350-010-revb",
    sourceKind: "manufacturer_published",
    title: "Eaglerise FMS-60-350 0-10 LD-F Datasheet REV B",
    publisher: "Eaglerise Electric & Electronic (China) Co., Ltd.",
    url: "https://lighting.eaglerise.com/data/upload/main/20250423/FMS-60-350%200-10%20LD-F%20spec%20REV%20B.pdf",
    retrievedAt: "2026-09-16T12:00:00Z",
    notes:
      "Published specs: 0-10V dimming, 300mA setting, 70-200 VDC range, +/-8% current accuracy, 1-100% dimming range, 88% efficiency, <=0.5W standby. Does not publish point-by-point V->mA transfer curve.",
  },
  {
    id: "src-g7-pn-6060-48w-cc",
    sourceKind: "manufacturer_published",
    title: "G7-PN-6060-48W-CC 600x600 LED Panel Datasheet",
    publisher: "G7 Lighting Vietnam",
    url: "https://g7lighting.vn/den-panel-600x600-48w-chieu-thang-pd178334.html",
    retrievedAt: "2026-09-16T12:00:00Z",
    notes:
      "Published optical specs: 48W, 5280 lm. Center illuminance: 1600 lx @ 1m, 404 lx @ 2m, 182 lx @ 3m.",
  },
  {
    id: "src-rnd-linear-010v-reference",
    sourceKind: "third_party_datasheet",
    title: "RND 500-00072 / 500-00073 Linear 0-10V Reference Transfer Datasheet",
    publisher: "RND Components / Distrelec",
    url: "https://media.distrelec.com/Web/Downloads/_t/ds/RND_500-00072-RND_500-00073_eng_tds.pdf",
    retrievedAt: "2026-09-16T12:00:00Z",
    notes:
      "Generic linear 0-10V control mapping (0V=0%, 1V=10%, ..., 10V=100%). Used as generic simulation transfer profile.",
  },
  {
    id: "src-user-factory-driver-48w-300ma",
    sourceKind: "user_supplied",
    title: "Original Factory Driver Label Specification",
    publisher: "User Fixture Label",
    url: null,
    retrievedAt: "2026-09-16T12:00:00Z",
    notes:
      "User-supplied label facts: Rated power 48W, output voltage 72-160 VDC, constant output current 300 mA.",
  },
  {
    id: "src-legacy-linear-v1",
    sourceKind: "legacy_model",
    title: "Witmind MVP Legacy Linear Formula Model",
    publisher: "Witmind Project Core",
    url: null,
    retrievedAt: "2026-09-16T12:00:00Z",
    notes:
      "Legacy linear model: power = nominalPower * brightness / 100, lux = targetLux * brightness / 100.",
  },
];
