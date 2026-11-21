/**
 * Vedic-AI Unified Text-to-Speech (TTS) Client
 * Combines high-fidelity server TTS (/api/voice/speech) with Web Speech API browser fallback.
 * Enforces single-instance audio playback and robust lifecycle cleanup.
 */

export type TTSLanguageCode = "en" | "hi";

export interface UnifiedSpeechOptions {
  text: string;
  language: TTSLanguageCode;
  speed?: number;
  preferInstant?: boolean; // When true, starts speech playback instantly via Web Speech (<50ms latency)
  onStart?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
}

export interface ActiveSpeechHandle {
  id: string;
  pause: () => void;
  resume: () => Promise<void>;
  stop: () => void;
  isPlaying: () => boolean;
  isPaused: () => boolean;
}

// Global active audio and utterance trackers to prevent overlapping audio
let activeAudio: HTMLAudioElement | null = null;
let activeBlobUrl: string | null = null;
let activeUtterance: SpeechSynthesisUtterance | null = null;
let activeStatus: "idle" | "playing" | "paused" = "idle";
let activeHandleId: string | null = null;
let abortController: AbortController | null = null;

function cleanupAudio(preserveHandle: boolean = false) {
  if (abortController) {
    try {
      abortController.abort();
    } catch {}
    abortController = null;
  }
  if (activeAudio) {
    try {
      activeAudio.pause();
      activeAudio.currentTime = 0;
      activeAudio.src = "";
    } catch {}
    activeAudio = null;
  }
  if (activeBlobUrl) {
    try {
      URL.revokeObjectURL(activeBlobUrl);
    } catch {}
    activeBlobUrl = null;
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }
  if (activeUtterance) {
    activeUtterance.onstart = null;
    activeUtterance.onend = null;
    activeUtterance.onerror = null;
    activeUtterance = null;
  }
  activeStatus = "idle";
  if (!preserveHandle) {
    activeHandleId = null;
  }
}

/**
 * Stops any actively playing audio or speech synthesis across the entire application.
 */
export function stopAllSpeech() {
  cleanupAudio();
}

/**
 * Speaks text using server-side TTS (Gemini/ElevenLabs) with automatic Web Speech fallback.
 */
export async function speakUnified(options: UnifiedSpeechOptions): Promise<ActiveSpeechHandle> {
  // Stop any prior playback first
  cleanupAudio();

  const handleId = Math.random().toString(36).substring(2, 9);
  activeHandleId = handleId;
  const speed = options.speed ?? 1.0;
  const text = options.text.trim();
  const language = options.language;

  abortController = new AbortController();
  const signal = abortController.signal;

  // Web Speech fallback function
  const speakWithBrowserSpeech = (): boolean => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      options.onError?.(new Error("Web Speech API is not supported in this browser."));
      return false;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      // Gentle, thoughtful conversational pacing with emotional warmth & curiosity
      utterance.rate = Math.max(0.7, Math.min(1.5, (speed || 1.0) * 0.94));
      utterance.pitch = 1.05;
      utterance.lang = language === "hi" ? "hi-IN" : "en-US";

      // Select neural / natural Indian voices with priority to avoid flat robotic timbre
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        if (language === "hi") {
          const hiVoice =
            voices.find((v) => v.name.includes("Natural") && v.lang.toLowerCase().includes("hi")) ||
            voices.find((v) => v.name.includes("Google") && v.lang.toLowerCase().includes("hi")) ||
            voices.find((v) => v.lang.toLowerCase().startsWith("hi") || v.name.includes("Hindi")) ||
            voices.find((v) => v.lang.toLowerCase().includes("in"));
          if (hiVoice) utterance.voice = hiVoice;
        } else {
          const enVoice =
            voices.find((v) => v.name.includes("Natural") && (v.lang.toLowerCase() === "en-in" || v.name.includes("India"))) ||
            voices.find((v) => v.name.includes("Google") && (v.lang.toLowerCase() === "en-in" || v.name.includes("India"))) ||
            voices.find((v) => v.name.includes("Natural")) ||
            voices.find((v) => v.lang.toLowerCase() === "en-in") ||
            voices.find((v) => v.lang.toLowerCase().startsWith("en"));
          if (enVoice) utterance.voice = enVoice;
        }
      }

      utterance.onstart = () => {
        if (activeHandleId === handleId) {
          activeStatus = "playing";
          options.onStart?.();
        }
      };

      utterance.onpause = () => {
        if (activeHandleId === handleId) {
          activeStatus = "paused";
          options.onPause?.();
        }
      };

      utterance.onresume = () => {
        if (activeHandleId === handleId) {
          activeStatus = "playing";
          options.onResume?.();
        }
      };

      utterance.onend = () => {
        if (activeHandleId === handleId) {
          activeStatus = "idle";
          if (activeUtterance) {
    activeUtterance.onstart = null;
    activeUtterance.onend = null;
    activeUtterance.onerror = null;
    activeUtterance = null;
  }
          options.onEnd?.();
        }
      };

      utterance.onerror = (e) => {
        if (e.error !== "canceled" && e.error !== "interrupted") {
          if (activeHandleId === handleId) {
            activeStatus = "idle";
            options.onError?.(new Error(`Speech synthesis error: ${e.error}`));
          }
        }
      };

      activeUtterance = utterance;
      window.speechSynthesis.speak(utterance);
      return true;
    } catch (err) {
      options.onError?.(err instanceof Error ? err : new Error("Speech synthesis failed"));
      return false;
    }
  };

  // If preferInstant is requested and Web Speech is supported in this browser,
  // start speaking immediately with zero network latency (<50ms)!
  if (options.preferInstant && typeof window !== "undefined" && "speechSynthesis" in window) {
    const started = speakWithBrowserSpeech();
    if (started) {
      return {
        id: handleId,
        pause: () => {
          if (typeof window !== "undefined" && "speechSynthesis" in window && activeHandleId === handleId) {
            window.speechSynthesis.pause();
            activeStatus = "paused";
            options.onPause?.();
          }
        },
        resume: async () => {
          if (typeof window !== "undefined" && "speechSynthesis" in window && activeHandleId === handleId) {
            window.speechSynthesis.resume();
            activeStatus = "playing";
            options.onResume?.();
          }
        },
        stop: () => {
          if (activeHandleId === handleId) {
            cleanupAudio();
            options.onEnd?.();
          }
        },
        isPlaying: () => activeStatus === "playing" && activeHandleId === handleId,
        isPaused: () => activeStatus === "paused" && activeHandleId === handleId,
      };
    }
  }

  // Try server-side synthesis via /api/voice/speech with tight timeout
  try {
    const response = await fetch("/api/voice/speech", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        language,
        speed,
      }),
      signal: AbortSignal.timeout(5_000), // Max 5s timeout, never hangs for a minute!
    });

    if (response.ok && activeHandleId === handleId) {
      const data = await response.json();
      if (data?.audioBase64) {
        const binary = atob(data.audioBase64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: data.contentType || "audio/mpeg" });
        const objectUrl = URL.createObjectURL(blob);
        activeBlobUrl = objectUrl;

        const audio = new Audio();
        audio.src = objectUrl;
        audio.playbackRate = speed;
        activeAudio = audio;

        audio.onplay = () => {
          if (activeHandleId === handleId) {
            activeStatus = "playing";
            options.onStart?.();
          }
        };

        audio.onpause = () => {
          if (activeHandleId === handleId && activeStatus === "playing") {
            activeStatus = "paused";
            options.onPause?.();
          }
        };

        audio.onended = () => {
          if (activeHandleId === handleId) {
            activeStatus = "idle";
            cleanupAudio();
            options.onEnd?.();
          }
        };

        audio.onerror = () => {
          if (activeHandleId === handleId) {
            // Fallback to browser speech if audio decoding fails
            cleanupAudio();
            speakWithBrowserSpeech();
          }
        };

        try {
          await audio.play();
        } catch (playErr) {
          console.warn("[unified-tts] audio.play() was prevented by browser, switching to Web Speech:", playErr);
          cleanupAudio(true);
          activeHandleId = handleId;
          const fallbackStarted = speakWithBrowserSpeech();
          if (!fallbackStarted) {
            throw playErr;
          }
        }
        return {
          id: handleId,
          pause: () => {
            if (activeAudio && activeHandleId === handleId) {
              activeAudio.pause();
              activeStatus = "paused";
              options.onPause?.();
            } else if (typeof window !== "undefined" && "speechSynthesis" in window && activeHandleId === handleId) {
              window.speechSynthesis.pause();
              activeStatus = "paused";
              options.onPause?.();
            }
          },
          resume: async () => {
            if (activeAudio && activeHandleId === handleId) {
              await activeAudio.play();
              activeStatus = "playing";
              options.onResume?.();
            } else if (typeof window !== "undefined" && "speechSynthesis" in window && activeHandleId === handleId) {
              window.speechSynthesis.resume();
              activeStatus = "playing";
              options.onResume?.();
            }
          },
          stop: () => {
            if (activeHandleId === handleId) {
              cleanupAudio();
              options.onEnd?.();
            }
          },
          isPlaying: () => activeStatus === "playing" && activeHandleId === handleId,
          isPaused: () => activeStatus === "paused" && activeHandleId === handleId,
        };
      }
    }
  } catch (error) {
    // If request aborted, return immediately
    if (signal.aborted) {
      return {
        id: handleId,
        pause: () => {},
        resume: async () => {},
        stop: () => {},
        isPlaying: () => false,
        isPaused: () => false,
      };
    }
    console.warn("[unified-tts] Server TTS fetch failed, switching to browser speech:", error);
    activeHandleId = handleId;
  }

  // Fallback to Web Speech if server TTS was not returned
  if (activeHandleId === handleId) {
    speakWithBrowserSpeech();
  }

  return {
    id: handleId,
    pause: () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window && activeHandleId === handleId) {
        window.speechSynthesis.pause();
        activeStatus = "paused";
        options.onPause?.();
      }
    },
    resume: async () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window && activeHandleId === handleId) {
        window.speechSynthesis.resume();
        activeStatus = "playing";
        options.onResume?.();
      }
    },
    stop: () => {
      if (activeHandleId === handleId) {
        cleanupAudio();
        options.onEnd?.();
      }
    },
    isPlaying: () => activeStatus === "playing" && activeHandleId === handleId,
    isPaused: () => activeStatus === "paused" && activeHandleId === handleId,
  };
}
