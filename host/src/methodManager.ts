type MethodHandler = () => void | Promise<void>;

const registry = new Map<string, MethodHandler>();

export const methodManager = {
  registerMethod(name: string, handler: MethodHandler) {
    registry.set(name, handler);
  },

  invokeMethod(name: string) {
    const handler = registry.get(name);
    if (!handler) {
      throw new Error(`No method registered under name: ${name}`);
    }
    return handler();
  },

  hasMethod(name: string) {
    return registry.has(name);
  },
};
