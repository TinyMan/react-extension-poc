import type { MethodHandler } from "@host/host-types";
import { MethodManager } from "@host/host-types";

/**
 * A sample method handler that can be registered in the method manager.
 */
export const sampleMethod: MethodHandler = async () => {
  console.log("Sample method executed from extension library");
};

// You can also export a function that returns a handler
export const createCustomMethod = (message: string): MethodHandler => {
  return async () => {
    console.log(`Custom method: ${message}`);
  };
};

export function register() {
  MethodManager.instance.registerMethod("bootstrap.hello", sampleMethod);
}
