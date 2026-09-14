"use client";

import * as React from "react";
import { Button, type ButtonProps } from "./button";

export function ConfirmSubmitButton({
  confirmMessage,
  children,
  ...props
}: ButtonProps & { confirmMessage: string }) {
  return (
    <Button
      {...props}
      type="submit"
      onClick={(e) => {
        if (!window.confirm(confirmMessage)) {
          e.preventDefault();
        }
      }}
    >
      {children}
    </Button>
  );
}
