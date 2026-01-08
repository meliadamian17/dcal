"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Check, AlertCircle, FileCode2, X } from "lucide-react";
import { processYamlUpload } from "@/actions/upload";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsProcessing(true);
    setStatus("idle");
    setMessage("");

    let successCount = 0;
    let errorCount = 0;

    for (const file of acceptedFiles) {
      try {
        const text = await file.text();
        const result = await processYamlUpload(text);
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch {
        errorCount++;
      }
    }

    setIsProcessing(false);
    if (errorCount === 0 && successCount > 0) {
      setStatus("success");
      setMessage(`Successfully imported ${successCount} file(s)`);
      setTimeout(() => {
        onClose();
        setStatus("idle");
        window.location.reload();
      }, 1500);
    } else {
      setStatus("error");
      setMessage(
        `Imported ${successCount} files. Failed: ${errorCount}. Check format.`
      );
    }
  }, [onClose]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/yaml": [".yaml", ".yml"],
      "application/x-yaml": [".yaml", ".yml"],
    },
  });

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setStatus("idle");
      setMessage("");
    }, 200);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(20px)'
          }}
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            style={{
              background: 'rgba(15, 15, 20, 0.98)',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '520px',
              position: 'relative',
              border: '1px solid rgba(255,255,255,0.1)',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Gradient top border */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: 'linear-gradient(to right, #22d3ee, transparent, #a855f7)'
            }} />
            
            <div style={{ padding: '24px' }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff', margin: 0 }}>Import Course Data</h2>
                  <p style={{ color: '#71717a', fontSize: '14px', marginTop: '4px' }}>Upload your YAML files to sync assignments</p>
                </div>
                <button
                  onClick={handleClose}
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    background: 'transparent',
                    border: 'none',
                    color: '#a1a1aa',
                    cursor: 'pointer'
                  }}
                >
                  <X style={{ width: '20px', height: '20px' }} />
                </button>
              </div>

              {/* Dropzone */}
              <div
                {...getRootProps()}
                style={{
                  border: `2px dashed ${isDragActive ? '#22d3ee' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: '16px',
                  padding: '40px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: isDragActive ? 'rgba(34,211,238,0.05)' : 'transparent',
                  transition: 'all 0.2s'
                }}
              >
                <input {...getInputProps()} />
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    padding: '16px',
                    borderRadius: '16px',
                    background: isDragActive ? 'rgba(34,211,238,0.2)' : 'rgba(255,255,255,0.05)'
                  }}>
                    <Upload style={{
                      width: '32px',
                      height: '32px',
                      color: isDragActive ? '#22d3ee' : '#a1a1aa'
                    }} />
                  </div>
                  
                  {isDragActive ? (
                    <p style={{ color: '#22d3ee', fontWeight: 600, margin: 0 }}>Drop files here...</p>
                  ) : (
                    <div>
                      <p style={{ fontSize: '18px', fontWeight: 600, color: '#fff', margin: 0 }}>
                        Drag & drop YAML files
                      </p>
                      <p style={{ fontSize: '14px', color: '#71717a', marginTop: '4px' }}>
                        or click to browse your files
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Display */}
              <AnimatePresence mode="wait">
                {isProcessing && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    style={{
                      marginTop: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '12px',
                      color: '#22d3ee',
                      padding: '12px'
                    }}
                  >
                    <div style={{
                      width: '20px',
                      height: '20px',
                      border: '2px solid #22d3ee',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    <span style={{ fontWeight: 500 }}>Processing files...</span>
                  </motion.div>
                )}

                {!isProcessing && status !== "idle" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    style={{
                      marginTop: '16px',
                      padding: '16px',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      background: status === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                      color: status === 'success' ? '#10b981' : '#ef4444',
                      border: `1px solid ${status === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`
                    }}
                  >
                    {status === "success" ? (
                      <Check style={{ width: '20px', height: '20px', flexShrink: 0 }} />
                    ) : (
                      <AlertCircle style={{ width: '20px', height: '20px', flexShrink: 0 }} />
                    )}
                    <span style={{ fontWeight: 500 }}>{message}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Format Guide */}
              <div style={{ marginTop: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#71717a', marginBottom: '12px' }}>
                  <FileCode2 style={{ width: '16px', height: '16px' }} />
                  <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Expected Format</span>
                </div>
                <div style={{
                  background: 'rgba(0,0,0,0.4)',
                  borderRadius: '12px',
                  padding: '16px',
                  border: '1px solid rgba(255,255,255,0.06)',
                  overflowX: 'auto'
                }}>
                  <pre style={{
                    fontSize: '12px',
                    color: '#a1a1aa',
                    fontFamily: 'monospace',
                    lineHeight: 1.6,
                    margin: 0
                  }}>
{`course: "CS 405"
assignments:
  - name: "Project 1"
    description: "Build a REST API"
    due_date: "2026-02-15"
    due_time: "14:00"`}
                  </pre>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={handleClose}
                style={{
                  marginTop: '24px',
                  width: '100%',
                  padding: '14px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
