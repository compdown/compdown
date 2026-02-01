import type { ValidationError } from "../schema/validation";

interface ErrorPanelProps {
  errors: ValidationError[];
  runtimeError: string | null;
  successMessage?: string | null;
}

export function ErrorPanel({ errors, runtimeError, successMessage }: ErrorPanelProps) {
  if (errors.length === 0 && !runtimeError && !successMessage) return null;

  return (
    <div className={`error-panel ${!runtimeError && errors.length === 0 ? "success" : ""}`}>
      {successMessage && !runtimeError && errors.length === 0 && (
        <div className="error-item success-message">{successMessage}</div>
      )}
      {runtimeError && (
        <div className="error-item error-runtime">{runtimeError}</div>
      )}
      {errors.map((error, i) => (
        <div key={i} className="error-item">
          {error.line !== null && (
            <span className="error-line">Line {error.line}</span>
          )}
          <span className="error-message">{error.message}</span>
          {error.path.length > 0 && (
            <span className="error-path">{error.path.join(".")}</span>
          )}
        </div>
      ))}
    </div>
  );
}
