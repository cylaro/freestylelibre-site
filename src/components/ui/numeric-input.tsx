import React from "react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

type NumericInputProps = Omit<React.ComponentProps<typeof Input>, "type" | "value" | "onChange"> & {
  value: number;
  onValueChange: (value: number) => void;
  allowEmpty?: boolean;
};

const sanitizeNumericText = (value: string) => value.replace(/[^\d.,-]/g, "").replace(",", ".");

function NumericInput({
  value,
  onValueChange,
  allowEmpty = true,
  className,
  onBlur,
  onFocus,
  ...props
}: NumericInputProps) {
  const [text, setText] = React.useState<string>(value === 0 && allowEmpty ? "" : String(value));
  const [focused, setFocused] = React.useState(false);

  React.useEffect(() => {
    if (focused) return;
    setText(value === 0 && allowEmpty ? "" : String(value));
  }, [value, allowEmpty, focused]);

  const commitValue = React.useCallback(
    (raw: string) => {
      const normalized = sanitizeNumericText(raw);
      if (!normalized || normalized === "-" || normalized === ".") {
        onValueChange(0);
        return;
      }
      const next = Number(normalized);
      if (!Number.isNaN(next)) {
        onValueChange(next);
      }
    },
    [onValueChange]
  );

  return (
    <Input
      {...props}
      type="text"
      inputMode="numeric"
      className={cn("tabular-nums", className)}
      value={text}
      onFocus={(event) => {
        setFocused(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocused(false);
        commitValue(text);
        onBlur?.(event);
      }}
      onChange={(event) => {
        const normalized = sanitizeNumericText(event.target.value);
        setText(normalized);
        if (!normalized || normalized === "-" || normalized === ".") return;
        const next = Number(normalized);
        if (!Number.isNaN(next)) onValueChange(next);
      }}
    />
  );
}

export { NumericInput };
