"use client";

import { useEffect } from "react";

interface ToastProps {
  message: string;
  type: "success" | "error" | "info";
  onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const getToastStyles = () => {
    switch (type) {
      case "success":
        return {
          gradient: "from-green-500 via-emerald-500 to-teal-500",
          border: "border-green-400/50",
          icon: (
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          ),
        };
      case "error":
        return {
          gradient: "from-red-500 via-rose-500 to-pink-500",
          border: "border-red-400/50",
          icon: (
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ),
        };
      case "info":
        return {
          gradient: "from-blue-500 via-indigo-500 to-purple-500",
          border: "border-blue-400/50",
          icon: (
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ),
        };
    }
  };

  const styles = getToastStyles();

  return (
    <div className="fixed top-6 right-6 z-50 animate-fade-in">
      <div className="relative group">
        {/* Glow effect */}
        <div
          className={`absolute -inset-1 bg-gradient-to-r ${styles.gradient} opacity-20 rounded-2xl blur group-hover:opacity-30 transition-all duration-300`}
        ></div>

        {/* Main toast container */}
        <div
          className={`relative bg-white/10 backdrop-blur-xl border ${styles.border} rounded-2xl shadow-2xl overflow-hidden max-w-sm`}
        >
          {/* Animated background gradient */}
          <div
            className={`absolute inset-0 bg-gradient-to-r ${styles.gradient} opacity-10`}
          ></div>

          {/* Content */}
          <div className="relative p-4">
            <div className="flex items-start space-x-4">
              {/* Icon */}
              <div
                className={`flex-shrink-0 w-10 h-10 bg-gradient-to-r ${styles.gradient} rounded-xl flex items-center justify-center shadow-lg`}
              >
                <div className="text-white">{styles.icon}</div>
              </div>

              {/* Message */}
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium leading-relaxed">
                  {message}
                </p>
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                className="flex-shrink-0 text-white/60 hover:text-white/90 transition-colors duration-200 p-1 hover:bg-white/10 rounded-lg"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
            <div
              className={`h-full bg-gradient-to-r ${styles.gradient} animate-shrink-width`}
              style={{
                animation: "shrinkWidth 4000ms linear forwards",
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
