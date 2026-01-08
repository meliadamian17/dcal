"use client";

import { useActionState } from "react";
import { authenticate } from "./actions";
import { motion } from "framer-motion";
import { Lock, User, Zap, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [errorMessage, formAction, isPending] = useActionState(
    authenticate,
    undefined
  );

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      padding: '16px',
      backgroundColor: '#050508'
    }}>
      {/* Center Glow */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(34,211,238,0.15) 0%, transparent 70%)',
        filter: 'blur(60px)',
        pointerEvents: 'none'
      }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          background: 'rgba(20, 20, 28, 0.9)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '400px',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Gradient Border Top */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'linear-gradient(to right, #22d3ee, #a855f7, #ec4899)'
        }} />
        
        <div style={{ padding: '32px' }}>
          {/* Logo/Icon */}
          <div style={{
            width: '64px',
            height: '64px',
            margin: '0 auto 24px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(34,211,238,0.2), rgba(168,85,247,0.2))',
            border: '1px solid rgba(34,211,238,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Zap style={{ width: '32px', height: '32px', color: '#22d3ee' }} />
          </div>

          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#fff', margin: 0 }}>
              Welcome back
            </h1>
            <p style={{ color: '#71717a', fontSize: '14px', marginTop: '8px' }}>
              Sign in to access your dashboard
            </p>
          </div>
          
          <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 600,
                color: '#71717a',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: '8px',
                paddingLeft: '4px'
              }}>
                Username
              </label>
              <div style={{ position: 'relative' }}>
                <User style={{
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '16px',
                  height: '16px',
                  color: '#71717a',
                  zIndex: 1
                }} />
                <input
                  type="text"
                  name="username"
                  required
                  placeholder="Enter username"
                  style={{
                    width: '100%',
                    height: '48px',
                    paddingLeft: '44px',
                    paddingRight: '16px',
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    color: '#ffffff',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
            
            <div>
              <label style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 600,
                color: '#71717a',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: '8px',
                paddingLeft: '4px'
              }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock style={{
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '16px',
                  height: '16px',
                  color: '#71717a',
                  zIndex: 1
                }} />
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    height: '48px',
                    paddingLeft: '44px',
                    paddingRight: '16px',
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    color: '#ffffff',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Error Message */}
            <div style={{ minHeight: '40px' }} aria-live="polite" aria-atomic="true">
              {errorMessage && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    color: '#ef4444',
                    fontSize: '14px',
                    background: 'rgba(239,68,68,0.1)',
                    padding: '10px 16px',
                    borderRadius: '12px',
                    border: '1px solid rgba(239,68,68,0.2)',
                    textAlign: 'center',
                    margin: 0
                  }}
                >
                  {errorMessage}
                </motion.p>
              )}
            </div>

            <button
              type="submit"
              disabled={isPending}
              style={{
                width: '100%',
                height: '48px',
                borderRadius: '12px',
                fontWeight: 600,
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, rgba(34,211,238,0.2), rgba(168,85,247,0.2))',
                border: '1px solid rgba(34,211,238,0.3)',
                color: '#fff',
                cursor: isPending ? 'not-allowed' : 'pointer',
                opacity: isPending ? 0.5 : 1
              }}
            >
              {isPending ? (
                <>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight style={{ width: '16px', height: '16px' }} />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <p style={{ textAlign: 'center', color: '#52525b', fontSize: '12px', marginTop: '32px' }}>
            Secure authentication powered by NextAuth
          </p>
        </div>
      </motion.div>

      {/* Add keyframes for spinner */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        input::placeholder {
          color: #52525b;
        }
        input:focus {
          border-color: rgba(34,211,238,0.5) !important;
          background-color: rgba(0,0,0,0.4) !important;
        }
      `}</style>
    </div>
  );
}
