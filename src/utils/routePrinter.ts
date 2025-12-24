import type { Application } from "express";

type AnyLayer = any;

function joinPaths(a: string, b: string) {
  if (!a) return b || "";
  if (!b) return a || "";
  return `${a.replace(/\/$/, "")}/${b.replace(/^\//, "")}`;
}

function extractPathFromLayer(layer: AnyLayer): string {
  // Express internal. Works for typical Router paths.
  if (layer?.route?.path) return layer.route.path;

  const regexp = layer?.regexp;
  const fastSlash = layer?.regexp?.fast_slash;
  if (fastSlash) return "";

  // Try to reconstruct from regexp (best-effort; may look messy for params).
  if (regexp && typeof regexp === "object" && regexp.toString) {
    const s = regexp.toString();
    // Common form: /^\/api\/?(?=\/|$)/i
    const m = s.match(/^\/\^\\\/(.+?)\\\/\?\(\?=\\\/\|\$\)\/[a-z]*$/i);
    if (m?.[1]) return `/${m[1].replace(/\\\//g, "/")}`;
  }
  return "";
}

function walk(stack: AnyLayer[], basePath: string, out: string[]) {
  for (const layer of stack) {
    if (layer?.route) {
      const routePath = joinPaths(basePath, layer.route.path || "");
      const methods = Object.keys(layer.route.methods || {})
        .filter((m) => layer.route.methods[m])
        .map((m) => m.toUpperCase())
        .sort();
      for (const method of methods) {
        out.push(`${method} ${routePath}`);
      }
      continue;
    }

    if (layer?.name === "router" && layer?.handle?.stack) {
      const subPath = extractPathFromLayer(layer);
      walk(layer.handle.stack, joinPaths(basePath, subPath), out);
    }
  }
}

export function printRegisteredRoutes(app: Application) {
  const stack: AnyLayer[] = (app as any)?._router?.stack || [];
  const out: string[] = [];
  walk(stack, "", out);

  const unique = Array.from(new Set(out)).sort();
  // eslint-disable-next-line no-console
  console.log(`[routes] registered routes (${unique.length})`);
  for (const r of unique) {
    // eslint-disable-next-line no-console
    console.log(`[routes] ${r}`);
  }
}









