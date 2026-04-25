type MethodHandler = () => void | Promise<void>;

export class MethodManager {
  private static instanceValue: MethodManager | null = null;
  private registry = new Map<string, MethodHandler>();

  private constructor() {}

  public static get instance(): MethodManager {
    if (!MethodManager.instanceValue) {
      MethodManager.instanceValue = new MethodManager();
    }
    return MethodManager.instanceValue;
  }

  public registerMethod(name: string, handler: MethodHandler) {
    this.registry.set(name, handler);
  }

  public invokeMethod(name: string) {
    const handler = this.registry.get(name);
    if (!handler) {
      throw new Error(`No method registered under name: ${name}`);
    }
    return handler();
  }

  public hasMethod(name: string) {
    return this.registry.has(name);
  }
}

export const methodManager = MethodManager.instance;
