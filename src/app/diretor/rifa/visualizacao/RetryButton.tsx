"use client";

export default function RetryButton() {
  function handleRetry() {
    window.location.reload();
  }

  return (
    <button
      type="button"
      onClick={handleRetry}
      className="mt-0 inline-flex h-11 items-center cursor-pointer justify-center gap-2 rounded-xl bg-indigo-600 px-6 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-indigo-600/30 active:translate-y-0"
    >
      <svg
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 4v5h5"
        />

        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M20 20v-5h-5"
        />

        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5.5 9a7 7 0 0 1 11.9-3.9L20 9M4 15l2.6 3.9A7 7 0 0 0 18.5 15"
        />
      </svg>

      Tentar novamente
    </button>
  );
}