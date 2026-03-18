export const MODEL_NAME = "gpt-4.1-mini";
export const TEMPERATURE = 0.1;

export const MIN_AIMS_LENGTH = 300;
export const MAX_AIMS_LENGTH = 20000;

export const PROMPT_VERSION = "aims-review-v1.0.0";

export const IS_DEV =
  process.env.NODE_ENV !== "production" ||
  process.env.VERCEL_ENV === "preview";

