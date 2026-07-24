import { useEffect } from "react";

export const useOutsideClick = ({
  enabled = true,
  onOutsideClick,
  ref,
} = {}) => {
  useEffect(() => {
    if (!enabled || !ref?.current || typeof onOutsideClick !== "function") {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (ref.current?.contains(event.target)) {
        return;
      }

      onOutsideClick(event);
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [enabled, onOutsideClick, ref]);
};

export default useOutsideClick;
