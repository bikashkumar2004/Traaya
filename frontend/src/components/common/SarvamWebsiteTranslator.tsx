"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useAuth, INDIAN_LANGUAGES } from "@/lib/auth-context";
import { Globe, Check, Loader2, Sparkles, X } from "lucide-react";

// Tags that should NEVER be translated
const IGNORED_TAGS = new Set([
  "SCRIPT",
  "STYLE",
  "NOSCRIPT",
  "CODE",
  "PRE",
  "SVG",
  "PATH",
  "INPUT",
  "TEXTAREA",
  "IFRAME",
  "AUDIO",
  "VIDEO",
]);

// Helper to determine if a text snippet is meaningful to translate
function isTranslatableText(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 2 || trimmed.length > 300) return false;
  // Skip purely numbers, symbols, and dates/times
  if (/^[\d\s.,:;!?%°\-\/\(\)\$₹€#@*&+=<>_~|\\\[\]]+$/.test(trimmed)) return false;
  // Skip JSON or code-like patterns
  if (trimmed.startsWith("{") || trimmed.startsWith("function ") || trimmed.startsWith("var ")) return false;
  return true;
}

export function SarvamWebsiteTranslator() {
  const pathname = usePathname();
  const { language, role } = useAuth();
  const [isTranslating, setIsTranslating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<"translating" | "success" | "idle">("idle");
  const [dismissed, setDismissed] = useState(false);

  // WeakMap stores the original English string for each DOM text node
  const originalTexts = useRef(new WeakMap<Node, string>());
  // In-memory cache for translations: `langCode:originalText` -> `translatedText`
  const memoryCache = useRef(new Map<string, string>());
  const isUpdatingDOM = useRef(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const statusTimer = useRef<NodeJS.Timeout | null>(null);

  const activeLangObj = INDIAN_LANGUAGES.find((l) => l.code === language) || INDIAN_LANGUAGES[0];
  const isNurseOrDoctor =
    role === "nurse" ||
    role === "doctor" ||
    pathname.startsWith("/nurse") ||
    pathname.startsWith("/doctor");
  const isEnglish = language === "en" || !language || isNurseOrDoctor;

  // Restore DOM back to original English text
  const restoreEnglish = useCallback(() => {
    if (typeof document === "undefined") return;
    isUpdatingDOM.current = true;

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let currentNode: Node | null = walker.nextNode();

    while (currentNode) {
      if (originalTexts.current.has(currentNode)) {
        const orig = originalTexts.current.get(currentNode);
        if (orig !== undefined && currentNode.nodeValue !== orig) {
          currentNode.nodeValue = orig;
        }
      }
      currentNode = walker.nextNode();
    }

    isUpdatingDOM.current = false;
    setStatusMessage(null);
    setStatusType("idle");
  }, []);

  // Main translation scanner & updater
  const translateVisibleDOM = useCallback(async () => {
    if (typeof document === "undefined" || isEnglish) return;

    const targetBcp47 = activeLangObj.bcp47 || `${language}-IN`;
    const targetCode = language;

    // Collect all valid text nodes and their original English texts
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        if (IGNORED_TAGS.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
        if (parent.closest("[data-no-translate]")) return NodeFilter.FILTER_REJECT;
        if (parent.closest("#sarvam-translator-pill")) return NodeFilter.FILTER_REJECT;
        if (!isTranslatableText(node.nodeValue || "")) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    const candidateNodes: Node[] = [];
    let curr: Node | null = walker.nextNode();
    while (curr) {
      candidateNodes.push(curr);
      curr = walker.nextNode();
    }

    const uncachedOriginals = new Set<string>();

    // Register original texts and apply any already-cached translations
    isUpdatingDOM.current = true;
    for (const node of candidateNodes) {
      if (!originalTexts.current.has(node)) {
        originalTexts.current.set(node, node.nodeValue || "");
      }

      const original = originalTexts.current.get(node)?.trim();
      if (!original) continue;

      const cacheKey = `${targetCode}:${original}`;
      if (memoryCache.current.has(cacheKey)) {
        const translated = memoryCache.current.get(cacheKey)!;
        if (node.nodeValue !== translated) {
          node.nodeValue = translated;
        }
      } else {
        // Try sessionStorage cache
        try {
          const sessVal = sessionStorage.getItem(`st_${targetCode}_${original}`);
          if (sessVal) {
            memoryCache.current.set(cacheKey, sessVal);
            if (node.nodeValue !== sessVal) {
              node.nodeValue = sessVal;
            }
            continue;
          }
        } catch {}

        uncachedOriginals.add(original);
      }
    }
    isUpdatingDOM.current = false;

    // If all text was already cached, we're done
    if (uncachedOriginals.size === 0) {
      return;
    }

    // Translate uncached strings with Sarvam AI API
    const uncachedList = Array.from(uncachedOriginals).slice(0, 80); // Batch cap per cycle
    setIsTranslating(true);
    setStatusType("translating");
    setStatusMessage(`Translating to ${activeLangObj.nativeName} with Sarvam AI...`);

    try {
      const res = await fetch("/api/sarvam/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          texts: uncachedList,
          target_language_code: targetBcp47,
          source_language_code: "en-IN",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const translations: Record<string, string> = data.translations || {};

        isUpdatingDOM.current = true;
        for (const [orig, tr] of Object.entries(translations)) {
          if (!tr || tr === orig) continue;
          const cacheKey = `${targetCode}:${orig}`;
          memoryCache.current.set(cacheKey, tr);
          try {
            sessionStorage.setItem(`st_${targetCode}_${orig}`, tr);
          } catch {}
        }

        // Apply newly translated strings to matching DOM nodes
        for (const node of candidateNodes) {
          const orig = originalTexts.current.get(node)?.trim();
          if (orig && translations[orig]) {
            node.nodeValue = translations[orig];
          }
        }
        isUpdatingDOM.current = false;

        setStatusType("success");
        setStatusMessage(`Translated into ${activeLangObj.nativeName} via Sarvam AI`);
        if (statusTimer.current) clearTimeout(statusTimer.current);
        statusTimer.current = setTimeout(() => {
          setStatusType("idle");
          setStatusMessage(null);
        }, 3000);
      }
    } catch (err) {
      console.warn("Sarvam AI page translation notice:", err);
      setStatusType("idle");
      setStatusMessage(null);
    } finally {
      setIsTranslating(false);
      isUpdatingDOM.current = false;
    }
  }, [activeLangObj, isEnglish, language]);

  // Trigger translation or restoration whenever language changes
  useEffect(() => {
    if (isEnglish) {
      restoreEnglish();
      return;
    }

    setDismissed(false);
    translateVisibleDOM();

    // Observe DOM mutations to translate dynamically rendered elements
    const observer = new MutationObserver(() => {
      if (isUpdatingDOM.current) return;
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        translateVisibleDOM();
      }, 350);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      observer.disconnect();
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      if (statusTimer.current) clearTimeout(statusTimer.current);
    };
  }, [language, isEnglish, restoreEnglish, translateVisibleDOM]);

  // Don't render floating pill for English or if dismissed
  if (isEnglish || dismissed || (!isTranslating && !statusMessage)) {
    return null;
  }

  return (
    <aside
      id="sarvam-translator-pill"
      aria-label="Sarvam AI translation status"
      className="fixed bottom-4 right-4 z-50 flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white/95 backdrop-blur-md border border-teal-200 shadow-lg shadow-teal-900/10 text-xs font-semibold text-slate-800 transition-all animate-in fade-in slide-in-from-bottom-2 select-none"
    >
      <div className="w-6 h-6 rounded-lg bg-teal-800 text-white flex items-center justify-center shrink-0">
        {statusType === "translating" ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : statusType === "success" ? (
          <Check className="w-3.5 h-3.5 text-emerald-300" />
        ) : (
          <Globe className="w-3.5 h-3.5" />
        )}
      </div>

      <div className="flex flex-col">
        <span className="text-[10px] text-teal-800 font-extrabold uppercase tracking-wider leading-tight flex items-center gap-1">
          <Sparkles className="w-2.5 h-2.5 text-amber-500" />
          Sarvam AI Translation
        </span>
        <span className="text-slate-700 font-bold truncate max-w-[200px]">
          {statusMessage || `${activeLangObj.name} (${activeLangObj.nativeName})`}
        </span>
      </div>

      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="p-1 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-600 ml-1 transition-colors"
        title="Dismiss indicator"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </aside>
  );
}
