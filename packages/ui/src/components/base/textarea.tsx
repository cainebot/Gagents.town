"use client"

import {
  TextField as AriaTextField,
  TextArea as AriaTextArea,
  Label as AriaLabel,
  Text as AriaText,
  FieldError as AriaFieldError,
  type TextFieldProps as AriaTextFieldProps,
} from "react-aria-components"
import { cx } from "../../utils/cx"

const sizeStyles = {
  sm: "px-3 py-2 text-sm min-h-[80px]",
  md: "px-3.5 py-2.5 text-sm min-h-[120px]",
} as const

export type TextAreaSize = keyof typeof sizeStyles

export interface TextAreaProps extends Omit<AriaTextFieldProps, "className"> {
  label?: string
  description?: string
  errorMessage?: string | ((validation: { isInvalid: boolean; validationErrors: string[] }) => string)
  size?: TextAreaSize
  placeholder?: string
  className?: string
  textAreaClassName?: string
  rows?: number
}

export function TextArea({
  label,
  description,
  errorMessage,
  size = "md",
  placeholder,
  className,
  textAreaClassName,
  rows,
  ...props
}: TextAreaProps) {
  return (
    <AriaTextField
      className={cx("flex flex-col gap-1.5", className)}
      {...props}
    >
      {label && (
        <AriaLabel className="text-sm font-medium text-secondary">
          {label}
        </AriaLabel>
      )}
      <AriaTextArea
        placeholder={placeholder}
        rows={rows}
        className={cx(
          "w-full rounded-lg border bg-secondary text-primary placeholder:text-quaternary",
          "border-secondary transition-colors duration-150 resize-y",
          "hover:border-primary",
          "focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "invalid:border-error-600 invalid:focus:ring-error-600",
          sizeStyles[size],
          textAreaClassName
        )}
      />
      {description && (
        <AriaText slot="description" className="text-xs text-quaternary">
          {description}
        </AriaText>
      )}
      <AriaFieldError className="text-xs text-error-600">
        {errorMessage}
      </AriaFieldError>
    </AriaTextField>
  )
}
