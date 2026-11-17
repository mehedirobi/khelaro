
import { Loader2 } from "lucide-react";

const LoadingState = ({
  message = "Loading...",
  description = "Please wait while we prepare everything for you.",
  fullScreen = false,
  showSpinner = true,
  className = "",
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={[
        "flex w-full flex-col items-center justify-center px-5 text-center",
        fullScreen ? "min-h-screen bg-gray-50" : "min-h-[300px]",
        className,
      ].join(" ")}
    >
      {showSpinner && (
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-green-100 bg-green-50">
          <Loader2
            size={28}
            strokeWidth={2.2}
            className="animate-spin text-green-600"
            aria-hidden="true"
          />
        </div>
      )}

      <h2 className="text-base font-semibold tracking-tight text-gray-900">
        {message}
      </h2>

      {description && (
        <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
          {description}
        </p>
      )}

      <span className="sr-only">Loading, please wait.</span>
    </div>
  );
};

export default LoadingState;
