"use client";

import Link from "next/link";
import { Printer, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n/types";

export function ReceiptActions({ dict }: { dict: Dictionary }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <Link href="/pos">
        <Button variant="secondary" size="sm">
          <ArrowRight className="h-4 w-4" />
          {dict.common.back}
        </Button>
      </Link>
      <Button size="sm" onClick={() => window.print()}>
        <Printer className="h-4 w-4" />
        {dict.common.print}
      </Button>
    </div>
  );
}
