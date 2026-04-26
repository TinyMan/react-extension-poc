import type { MethodHandler } from "@host/host-types";
import { MethodManager } from "@host/host-types";

import React from "react";
import { Button } from "@mui/material";
import { shuffle } from "lodash-es";
import ELK from "elkjs/lib/elk.bundled.js";

type HostSharedDepsInfo = {
  react: typeof React;
  Button: typeof Button;
  shuffle: typeof shuffle;
  ELK: typeof ELK;
};

interface SharedPackageResult {
  packageName: string;
  actualVersion: string;
  sharedWithHost: boolean;
  details: string;
}

interface SharedDepsCheckResult {
  results: SharedPackageResult[];
  message: string;
}

function getHostSharedDepsInfo(): HostSharedDepsInfo | null {
  try {
    return MethodManager.instance.invokeMethod(
      "host.sharedDeps.info",
    ) as HostSharedDepsInfo;
  } catch (error) {
    console.warn("Host shared dependency info not available:", error);
    return null;
  }
}

function checkSharedPackages(): SharedDepsCheckResult {
  const hostInfo = getHostSharedDepsInfo();

  if (!hostInfo) {
    return {
      results: [],
      message:
        "Host shared dependency info not available. Host method must be registered before checking.",
    };
  }

  const results: SharedPackageResult[] = [
    {
      packageName: "react",
      actualVersion: React.version ?? "unknown",
      sharedWithHost: React === hostInfo.react,
      details: `React is ${React === hostInfo.react ? "shared" : "separate"}`,
    },
    {
      packageName: "lodash-es",
      actualVersion: "runtime",
      sharedWithHost: shuffle === hostInfo.shuffle,
      details: `lodash shuffle is ${
        shuffle === hostInfo.shuffle ? "shared" : "separate"
      }`,
    },
    {
      packageName: "@mui/material",
      actualVersion: "runtime",
      sharedWithHost: Button === hostInfo.Button,
      details: `MUI Button is ${
        Button === hostInfo.Button ? "shared" : "separate"
      }`,
    },
    {
      packageName: "elkjs",
      actualVersion: "runtime",
      sharedWithHost: ELK === hostInfo.ELK,
      details: `ELK is ${ELK === hostInfo.ELK ? "shared" : "separate"}`,
    },
  ];

  const summary = results.map((result) => {
    return `${result.packageName}: ${result.details}; actualVersion=${result.actualVersion}; sharedWithHost=${result.sharedWithHost}`;
  });

  console.group("Extension shared dependency POC");
  console.log("React runtime available:", React.version ?? "unknown");
  console.log("MUI Button imported:", Boolean(Button));
  console.log("Lodash shuffle sample:", shuffle([3, 1, 2]));
  console.log(
    "ELK import status:",
    typeof ELK === "function" ? "ELK available" : "ELK imported",
  );
  console.table(results);
  console.groupEnd();

  return {
    results,
    message: summary.join(" | "),
  };
}

export const sampleMethod: MethodHandler = async () => {
  console.log("Sample method executed from extension library");
};

export const sharedDepsCheckMethod: MethodHandler = async () => {
  return checkSharedPackages();
};

export function register() {
  MethodManager.instance.registerMethod("bootstrap.hello", sampleMethod);
  MethodManager.instance.registerMethod(
    "extension.sharedDeps.check",
    sharedDepsCheckMethod,
  );
}
