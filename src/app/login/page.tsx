"use client";

import { useActionState } from "react";
import { authenticate } from "./actions";
import { motion } from "framer-motion";

export default function LoginPage() {
  const [errorMessage, formAction, isPending] = useActionState(
    authenticate,
    undefined
  );

  return (
    <div className="flex min-h-screen items-center justify-center relative overflow-hidden">
      {/* Background Orbs */}
      <div className="bg-orb w-[500px] h-[500px] bg-blue-600 top-[-100px] left-[-100px]" />
      <div className="bg-orb w-[400px] h-[400px] bg-purple-600 bottom-[-50px] right-[-50px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-panel p-8 rounded-2xl w-full max-w-md mx-4 relative z-10"
      >
        <h1 className="text-3xl font-bold mb-6 text-center neon-text-blue">
          SYSTEM ACCESS
        </h1>
        
        <form action={formAction} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">
              Identity
            </label>
            <input
              type="text"
              name="username"
              required
              className="w-full bg-black/40 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
              placeholder="Admin ID"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">
              Passcode
            </label>
            <input
              type="password"
              name="password"
              required
              className="w-full bg-black/40 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <div
            className="flex h-8 items-end space-x-1"
            aria-live="polite"
            aria-atomic="true"
          >
            {errorMessage && (
              <p className="text-red-500 text-sm">{errorMessage}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-400 border border-cyan-500/50 font-bold py-3 px-4 rounded-lg transition-all duration-300 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] disabled:opacity-50"
          >
            {isPending ? "Authenticating..." : "Initialize Session"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

