export interface ValidationError {
  code: string;
  message: string;
  filename?: string;
  line?: number;
}

export interface ValidationWarning {
  code: string;
  message: string;
  filename?: string;
  suggestion?: string;
}

export interface GerberValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}
