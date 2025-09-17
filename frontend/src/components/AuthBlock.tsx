"use client";

import { useState } from "react";
import { User } from "@/lib/types";

interface AuthBlockProps {
  user: User | null;
  onLogin: (username: string, password: string) => Promise<User>;
  onLogout: () => void;
  showToast: (message: string, type?: "success" | "error" | "info") => void;
}

export default function AuthBlock({
  user,
  onLogin,
  onLogout,
  showToast,
}: AuthBlockProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    setLoading(true);
    try {
      await onLogin(username, password);
      setUsername("");
      setPassword("");
      setShowLoginForm(false);
      showToast("Welcome back! 🎉", "success");
    } catch (error: any) {
      showToast(error.response?.data?.detail || "Login failed", "error");
      setPassword("");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    onLogout();
    setShowLoginForm(false);
    showToast("See you later! 👋", "info");
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="relative group">
        {/* Glassmorphism container */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/50 to-indigo-500/50 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
        <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl">
          {!user ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
                  <span className="text-white/80 font-medium">
                    Not authenticated
                  </span>
                </div>

                {!showLoginForm && (
                  <button
                    onClick={() => setShowLoginForm(true)}
                    className="group relative px-6 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    <span className="relative z-10">Sign In</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-indigo-400/20 rounded-xl blur group-hover:blur-lg transition-all duration-300"></div>
                  </button>
                )}
              </div>

              {showLoginForm && (
                <form
                  onSubmit={handleLogin}
                  className="space-y-4 animate-fade-in"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        className="w-full px-4 py-3 bg-white/10 backdrop-blur border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-300"
                        disabled={loading}
                      />
                    </div>
                    <div className="relative">
                      <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full px-4 py-3 bg-white/10 backdrop-blur border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-300"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 relative px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Signing in...</span>
                        </div>
                      ) : (
                        "Sign In"
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowLoginForm(false)}
                      className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white font-medium rounded-xl transition-all duration-300"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-white font-medium">
                    Welcome back,{" "}
                    <span className="text-purple-200 font-bold">
                      {user.username}
                    </span>
                  </span>
                </div>

                <div className="flex space-x-2">
                  {user.is_staff && (
                    <span className="px-3 py-1 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 border border-yellow-400/30 text-yellow-200 text-xs font-semibold rounded-full backdrop-blur">
                      ⭐ STAFF
                    </span>
                  )}
                  {user.is_superuser && (
                    <span className="px-3 py-1 bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-400/30 text-red-200 text-xs font-semibold rounded-full backdrop-blur">
                      👑 ADMIN
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="group relative px-6 py-2 bg-gradient-to-r from-gray-500/20 to-gray-600/20 hover:from-gray-500/30 hover:to-gray-600/30 border border-white/20 hover:border-white/30 text-white/80 hover:text-white font-medium rounded-xl transition-all duration-300 transform hover:scale-105"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
