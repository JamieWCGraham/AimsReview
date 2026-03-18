export type AnalyzeErrorCode =
  | "INVALID_INPUT"
  | "MODEL_ERROR"
  | "INVALID_MODEL_OUTPUT"
  | "RATE_LIMITED"
  | "UNKNOWN";

export class AnalyzeError extends Error {
  public readonly code: AnalyzeErrorCode;

  constructor(code: AnalyzeErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

