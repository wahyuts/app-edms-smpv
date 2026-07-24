import { Check, ChevronDown } from "lucide-react";
import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import { useOutsideClick } from "@/shared/hooks/useOutsideClick";

const MAX_VISIBLE_OPTIONS = 5;
const OPTION_HEIGHT = 40;
const VIEWPORT_MARGIN = 12;

const getOptionText = (children) =>
  Children.toArray(children)
    .map((child) => (typeof child === "string" || typeof child === "number" ? child : ""))
    .join("")
    .trim();

const getOptionValue = (optionElement, label) =>
  optionElement.props.value === undefined ? label : String(optionElement.props.value);

const SelectDropdown = ({
  children,
  className = "",
  disabled = false,
  name,
  onBlur,
  onChange,
  value = "",
  ...props
}) => {
  const generatedId = useId();
  const listboxId = `${generatedId}-listbox`;
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [position, setPosition] = useState({
    left: 0,
    maxHeight: OPTION_HEIGHT * MAX_VISIBLE_OPTIONS,
    top: 0,
    width: 0,
  });
  const optionRefs = useRef([]);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const selectedValue = String(value ?? "");

  const options = useMemo(
    () =>
      Children.toArray(children)
        .filter(isValidElement)
        .map((optionElement) => {
          const label = getOptionText(optionElement.props.children);

          return {
            disabled: Boolean(optionElement.props.disabled),
            label,
            value: getOptionValue(optionElement, label),
          };
        }),
    [children],
  );

  const selectedIndex = options.findIndex((option) => option.value === selectedValue);
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : null;

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
  }, []);

  useOutsideClick({
    enabled: isOpen,
    onOutsideClick: closeDropdown,
    ref: rootRef,
  });

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const optionCount = Math.min(options.length, MAX_VISIBLE_OPTIONS);
    const menuHeight = Math.max(OPTION_HEIGHT, optionCount * OPTION_HEIGHT);
    const spaceBelow = window.innerHeight - rect.bottom - VIEWPORT_MARGIN;
    const spaceAbove = rect.top - VIEWPORT_MARGIN;
    const opensUp = spaceBelow < menuHeight && spaceAbove > spaceBelow;
    const maxHeight = Math.min(
      menuHeight,
      Math.max(OPTION_HEIGHT, opensUp ? spaceAbove : spaceBelow),
    );
    const top = opensUp
      ? Math.max(VIEWPORT_MARGIN, rect.top - maxHeight - 4)
      : Math.min(rect.bottom + 4, window.innerHeight - maxHeight - VIEWPORT_MARGIN);
    const maxLeft = Math.max(VIEWPORT_MARGIN, window.innerWidth - rect.width - VIEWPORT_MARGIN);

    setPosition({
      left: Math.min(Math.max(VIEWPORT_MARGIN, rect.left), maxLeft),
      maxHeight,
      top,
      width: rect.width,
    });
  }, [options.length]);

  const openDropdown = useCallback(() => {
    if (disabled) return;

    const nextHighlightedIndex = selectedIndex >= 0 ? selectedIndex : 0;

    setHighlightedIndex(nextHighlightedIndex);
    setIsOpen(true);
    updatePosition();
  }, [disabled, selectedIndex, updatePosition]);

  useEffect(() => {
    if (!isOpen) return undefined;

    updatePosition();

    const handleLayoutChange = () => updatePosition();

    window.addEventListener("resize", handleLayoutChange);
    window.addEventListener("scroll", handleLayoutChange, true);

    return () => {
      window.removeEventListener("resize", handleLayoutChange);
      window.removeEventListener("scroll", handleLayoutChange, true);
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;

    optionRefs.current[highlightedIndex]?.scrollIntoView({
      block: "nearest",
    });
  }, [highlightedIndex, isOpen]);

  const emitChange = (nextValue) => {
    onChange?.({
      currentTarget: {
        name,
        value: nextValue,
      },
      target: {
        name,
        value: nextValue,
      },
    });
  };

  const selectOption = (option) => {
    if (!option || option.disabled) return;

    emitChange(option.value);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const moveHighlight = (direction) => {
    if (options.length === 0) return;

    setHighlightedIndex((currentIndex) => {
      let nextIndex = currentIndex;

      for (let step = 0; step < options.length; step += 1) {
        nextIndex = (nextIndex + direction + options.length) % options.length;
        if (!options[nextIndex]?.disabled) return nextIndex;
      }

      return currentIndex;
    });
  };

  const handleKeyDown = (event) => {
    if (disabled) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!isOpen) {
        openDropdown();
        return;
      }
      moveHighlight(1);
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!isOpen) {
        openDropdown();
        return;
      }
      moveHighlight(-1);
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!isOpen) {
        openDropdown();
        return;
      }
      selectOption(options[highlightedIndex]);
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeDropdown();
    }
  };

  return (
    <div className="relative" ref={rootRef}>
      <input name={name} type="hidden" value={selectedValue} />
      <button
        {...props}
        aria-controls={isOpen ? listboxId : undefined}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={[
          className,
          "flex w-full items-center justify-between gap-2 text-left disabled:cursor-not-allowed disabled:text-[#64748B]",
        ].join(" ")}
        disabled={disabled}
        onBlur={onBlur}
        onClick={() => {
          if (isOpen) {
            closeDropdown();
            return;
          }

          openDropdown();
        }}
        onKeyDown={handleKeyDown}
        ref={triggerRef}
        role="combobox"
        type="button"
      >
        <span className="min-w-0 flex-1 truncate">
          {selectedOption?.label || options[0]?.label || ""}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-[#94A3B8]" />
      </button>

      {isOpen ? (
        <div
          className="fixed z-[8500] overflow-y-auto overflow-x-hidden rounded-md border border-[#123A5A] bg-[#061B2F] py-1 shadow-lg [scrollbar-color:#123A5A_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#123A5A] [&::-webkit-scrollbar-track]:bg-transparent"
          id={listboxId}
          role="listbox"
          style={{
            left: position.left,
            maxHeight: position.maxHeight,
            top: position.top,
            width: position.width,
          }}
        >
          {options.map((option, index) => {
            const isSelected = option.value === selectedValue;
            const isHighlighted = index === highlightedIndex;

            return (
              <button
                aria-selected={isSelected}
                className={[
                  "flex h-10 w-full items-center gap-2 px-3 text-left text-sm transition-colors",
                  isSelected
                    ? "bg-[#0F7BFF] text-white"
                    : "text-[#CBD5E1] hover:bg-[#0B2B47] hover:text-white",
                  isHighlighted && !isSelected ? "bg-[#0B2B47] text-white" : "",
                  option.disabled ? "cursor-not-allowed text-[#64748B]" : "",
                ].join(" ")}
                disabled={option.disabled}
                key={`${option.value}-${index}`}
                onClick={() => selectOption(option)}
                onMouseEnter={() => setHighlightedIndex(index)}
                ref={(element) => {
                  optionRefs.current[index] = element;
                }}
                role="option"
                type="button"
              >
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
                {isSelected ? <Check className="h-4 w-4 shrink-0" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};

export default SelectDropdown;
