"use client"

import {
  TextField as AriaTextField,
  Input as AriaInput,
  Label as AriaLabel,
  Text as AriaText,
  FieldError as AriaFieldError,
  type TextFieldProps as AriaTextFieldProps,
} from "react-aria-components"
import { type ReactNode } from "react"
import { cx } from "../../utils/cx"

const sizeStyles = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-3.5 text-sm",
} as const

export type InputSize = keyof typeof sizeStyles

export interface InputProps extends Omit<AriaTextFieldProps, "className"> {
  label?: string
  description?: string
  errorMessage?: string | ((validation: { isInvalid: boolean; validationErrors: string[] }) => string)
  size?: InputSize
  placeholder?: string
  className?: string
  inputClassName?: string
  leadingIcon?: ReactNode
}

export function Input({
  label,
  description,
  errorMessage,
  size = "md",
  placeholder,
  className,
  inputClassName,
  leadingIcon,
  ...props
}: InputProps) {
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
      <div className="relative">
        {leadingIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-quaternary">
            {leadingIcon}
          </span>
        )}
        <AriaInput
          placeholder={placeholder}
          className={cx(
            "w-full rounded-lg border bg-secondary text-primary placeholder:text-quaternary",
            "border-secondary transition-colors duration-150",
            "hover:border-primary",
            "focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "invalid:border-error-600 invalid:focus:ring-error-600",
            sizeStyles[size],
            leadingIcon ? "pl-10" : undefined,
            inputClassName
          )}
        />
      </div>
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
