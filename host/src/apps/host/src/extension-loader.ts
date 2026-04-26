export async function loadExtension() {
  try {
    const manifestResponse = await fetch("/extension/manifest.json", {
      cache: "no-cache",
    });
    if (manifestResponse.status === 404) {
      console.warn("Extension manifest not found at /extension/manifest.json");
      return;
    }
    const manifest = await manifestResponse.json();
    const entry = (
      Object.values(manifest) as { name: string; file: string }[]
    ).find((e) => e.name === "index");
    if (!entry) {
      console.error("No entry point found in extension manifest:", manifest);
      return;
    }
    const mod = await import(/* @vite-ignore */ `/extension/${entry.file}`);
    mod.register();
  } catch (err) {
    console.error("Failed to load extension:", err);
  }
}
