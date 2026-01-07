"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, Check, AlertCircle, FileText } from "lucide-react";
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
      } catch (e) {
        errorCount++;
      }
    }

    setIsProcessing(false);
    if (errorCount === 0 && successCount > 0) {
      setStatus("success");
      setMessage(`Successfully processed ${successCount} file(s).`);
      setTimeout(() => {
        onClose();
        setStatus("idle");
      }, 2000);
    } else {
      setStatus("error");
      setMessage(
        `Processed ${successCount} files. Failed: ${errorCount}. Check format.`
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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="glass-panel p-8 rounded-2xl w-full max-w-xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="text-2xl font-bold mb-6 text-center neon-text-blue">
              Upload Course Data
            </h2>

            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-300 ${
                isDragActive
                  ? "border-cyan-500 bg-cyan-500/10"
                  : "border-gray-600 hover:border-gray-400 hover:bg-white/5"
              }`}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center space-y-4">
                <div className="p-4 rounded-full bg-white/5">
                  <Upload className="w-8 h-8 text-cyan-400" />
                </div>
                {isDragActive ? (
                  <p className="text-cyan-400 font-medium">Drop files here...</p>
                ) : (
                  <div className="space-y-1">
                    <p className="text-lg font-medium text-white">
                      Drag & drop YAML files
                    </p>
                    <p className="text-sm text-gray-400">
                      or click to browse
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Status Display */}
            {isProcessing && (
              <div className="mt-6 flex items-center justify-center space-x-2 text-cyan-400">
                <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                <span>Processing...</span>
              </div>
            )}

            {!isProcessing && status !== "idle" && (
              <div
                className={`mt-6 p-4 rounded-lg flex items-center space-x-3 ${
                  status === "success"
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : "bg-red-500/20 text-red-400 border border-red-500/30"
                }`}
              >
                {status === "success" ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
                <span>{message}</span>
              </div>
            )}

            <div className="mt-8">
              <h4 className="text-sm font-medium text-gray-400 mb-2">
                Expected YAML Format:
              </h4>
              <pre className="bg-black/50 p-4 rounded-lg text-xs text-gray-300 overflow-x-auto border border-white/5 font-mono">
{`course: "CS 405"
assignments:
  - name: "Project 1"
    description: "Details..."
    due_date: "2026-02-15"
    due_time: "14:00"`}
              </pre>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

