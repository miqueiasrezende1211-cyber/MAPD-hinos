import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";

export function useReadingPreference(
  key: "letra" | "cifra",
  steps: readonly number[],
  initialIndex: number,
) {
  const [fontIdx, setFontIdx] = useState(initialIndex);
  const touched = useRef(false);
  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(`reading-font:${key}`)
      .then((raw) => {
        const index = raw === null ? initialIndex : Number(raw);
        if (
          active &&
          !touched.current &&
          Number.isInteger(index) &&
          index >= 0 &&
          index < steps.length
        )
          setFontIdx(index);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [key, initialIndex, steps.length]);
  const stepFont = useCallback(
    (delta: number) => {
      touched.current = true;
      setFontIdx((previous) =>
        Math.max(0, Math.min(steps.length - 1, previous + delta)),
      );
    },
    [steps.length],
  );
  useEffect(() => {
    if (touched.current)
      void AsyncStorage.setItem(`reading-font:${key}`, String(fontIdx)).catch(
        () => {},
      );
  }, [key, fontIdx]);
  return { fontIdx, fontSize: steps[fontIdx] ?? steps[initialIndex], stepFont };
}
