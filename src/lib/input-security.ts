const SAFE_FILENAME_CHARACTERS = /[^a-z0-9.\-_]+/g;

type PlainTextOptions = {
  maxLength?: number;
  trim?: boolean;
};

function removeDisallowedControlCharacters(value: string) {
  return Array.from(value)
    .filter((character) => {
      const codePoint = character.codePointAt(0);

      if (codePoint === undefined) {
        return false;
      }

      if (codePoint === 9 || codePoint === 10 || codePoint === 13) {
        return true;
      }

      return !(
        (codePoint >= 0 && codePoint <= 8) ||
        (codePoint >= 11 && codePoint <= 12) ||
        (codePoint >= 14 && codePoint <= 31) ||
        codePoint === 127
      );
    })
    .join("");
}

export function sanitizePlainText(value: string, options: PlainTextOptions = {}) {
  const normalizedValue = removeDisallowedControlCharacters(value.normalize("NFKC"));
  const trimmedValue = options.trim === false ? normalizedValue : normalizedValue.trim();

  if (options.maxLength && trimmedValue.length > options.maxLength) {
    return trimmedValue.slice(0, options.maxLength);
  }

  return trimmedValue;
}

export function sanitizeMultilineText(value: string, options: PlainTextOptions = {}) {
  const normalizedValue = value
    .normalize("NFKC")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\u2028|\u2029/g, "\n");
  const safeValue = removeDisallowedControlCharacters(normalizedValue);
  const trimmedValue = options.trim === false ? safeValue : safeValue.trim();

  if (options.maxLength && trimmedValue.length > options.maxLength) {
    return trimmedValue.slice(0, options.maxLength);
  }

  return trimmedValue;
}

export function sanitizeEmailAddress(value: string) {
  return sanitizePlainText(value, { maxLength: 320 }).toLowerCase();
}

export function sanitizeFileName(fileName: string) {
  const sanitizedName = sanitizePlainText(fileName, { trim: false })
    .toLowerCase()
    .replace(SAFE_FILENAME_CHARACTERS, "-");

  return sanitizedName.replace(/-+/g, "-").replace(/^-|-$/g, "") || "upload";
}
