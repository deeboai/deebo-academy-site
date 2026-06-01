import { access } from "node:fs/promises";

const FILE_CHECK_FLAGS = 0;

async function canRead(url) {
  try {
    await access(new URL(url), FILE_CHECK_FLAGS);
    return true;
  } catch {
    return false;
  }
}

export async function resolve(specifier, context, defaultResolve) {
  try {
    return await defaultResolve(specifier, context, defaultResolve);
  } catch (error) {
    const isRelativeSpecifier =
      specifier.startsWith("./") || specifier.startsWith("../") || specifier.startsWith("/");
    const hasKnownExtension = /\.[a-z0-9]+$/i.test(specifier);

    if (!isRelativeSpecifier || hasKnownExtension) {
      throw error;
    }

    const resolvedUrl = new URL(`${specifier}.ts`, context.parentURL).href;

    if (!(await canRead(resolvedUrl))) {
      throw error;
    }

    return defaultResolve(`${specifier}.ts`, context, defaultResolve);
  }
}
