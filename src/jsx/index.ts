// @include './lib/json2.js'

import { ns } from "../shared/shared";

import * as aeft from "./aeft/aeft";

//@ts-ignore
const host = typeof $ !== "undefined" ? $ : window;

// Safe app name detection (BridgeTalk can be broken in AE 24-25)
const getAppNameSafely = (): string => {
  const compare = (a: string, b: string) => {
    return a.toLowerCase().indexOf(b.toLowerCase()) > -1;
  };
  const exists = (a: any) => typeof a !== "undefined";
  const isBridgeTalkWorking =
    typeof BridgeTalk !== "undefined" &&
    typeof BridgeTalk.appName !== "undefined";

  if (isBridgeTalkWorking) {
    return BridgeTalk.appName;
  } else if (app) {
    //@ts-ignore
    if (exists(app.appName)) {
      //@ts-ignore
      const appName: string = app.appName;
      if (compare(appName, "after effects")) return "aftereffects";
    }
  }
  return "unknown";
};

switch (getAppNameSafely()) {
  case "aftereffects":
  case "aftereffectsbeta":
    host[ns] = aeft;
    break;
}

const empty = {};
export type Scripts = typeof empty & typeof aeft;
