import { useState, useEffect, useRef, RefObject } from "react";

/**
 * Returns boolean true if the element/module is currently visible in the DOM,
 * and false when hidden via CSS (e.g. display: none in KeepAliveShell) or tab background.
 */
export function useModuleVisible(containerRef?: RefObject<HTMLElement>): boolean {
  const [isVisible, setIsVisible] = useState<boolean>(!document.hidden);
  const internalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const target = containerRef?.current || internalRef.current;

    const checkVisibility = () => {
      if (document.hidden) {
        setIsVisible(false);
        return;
      }

      if (target) {
        const style = window.getComputedStyle(target);
        const isCssVisible = style.display !== "none" && style.visibility !== "hidden" && target.offsetParent !== null;
        setIsVisible(isCssVisible);
      } else {
        setIsVisible(!document.hidden);
      }
    };

    checkVisibility();

    const handleVisibilityChange = () => {
      checkVisibility();
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    const observer = new MutationObserver(checkVisibility);

    if (target?.parentElement) {
      observer.observe(target.parentElement, { attributes: true, attributeFilter: ["style", "class"] });
    }

    return () => {
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      observer.disconnect();
    };
  }, [containerRef]);

  return isVisible;
}

export default useModuleVisible;
