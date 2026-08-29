"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

// Two sides of the market. Picked once, kept in the browser, switchable from the app nav.
export type Role = "employer" | "labeler";

const KEY = "verdikt.role";
const listeners = new Set<() => void>();

function read(): Role | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(KEY);
  return v === "employer" || v === "labeler" ? v : null;
}

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

let paramApplied = false;
function applyRoleParamOnce() {
  if (paramApplied) return;
  paramApplied = true;
  const param = new URLSearchParams(window.location.search).get("role");
  if ((param === "employer" || param === "labeler") && !read()) {
    window.localStorage.setItem(KEY, param);
  }
}

export function useRole() {
  const role = useSyncExternalStore(subscribe, read, () => null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    applyRoleParamOnce();
    emit();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReady(true);
  }, []);

  const setRole = useCallback((next: Role | null) => {
    if (next) window.localStorage.setItem(KEY, next);
    else window.localStorage.removeItem(KEY);
    emit();
  }, []);

  return { role, setRole, ready };
}
