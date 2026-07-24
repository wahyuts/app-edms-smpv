import { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const inputWrapperClassName =
  "flex h-11 items-center rounded-md border border-[#123A5A] bg-[#08233B] transition-colors focus-within:border-[#0F7BFF] focus-within:ring-2 focus-within:ring-[#0F7BFF]/20";
const inputClassName =
  "min-w-0 flex-1 bg-transparent px-4 text-sm text-[#F8FAFC] outline-none placeholder:text-[#94A3B8]";
const buttonClassName =
  "flex h-full w-11 cursor-pointer items-center justify-center rounded-r-md text-[#94A3B8] transition-colors hover:bg-[#0B2B47] hover:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#0F7BFF]/30";

export const PasswordInput = forwardRef(function PasswordInput(
  {
    autoComplete,
    className = "",
    hideLabel = "Hide password",
    name,
    onChange,
    placeholder,
    required,
    showLabel = "Show password",
    value,
  },
  ref,
) {
  const [isVisible, setIsVisible] = useState(false);
  const Icon = isVisible ? Eye : EyeOff;

  return (
    <div className={[inputWrapperClassName, className].filter(Boolean).join(" ")}>
      <input
        autoComplete={autoComplete}
        className={inputClassName}
        name={name}
        onChange={onChange}
        placeholder={placeholder}
        ref={ref}
        required={required}
        type={isVisible ? "text" : "password"}
        value={value}
      />
      <button
        aria-label={isVisible ? hideLabel : showLabel}
        className={buttonClassName}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => setIsVisible((currentValue) => !currentValue)}
        type="button"
      >
        <Icon aria-hidden="true" className="h-5 w-5" />
      </button>
    </div>
  );
});

export default PasswordInput;
