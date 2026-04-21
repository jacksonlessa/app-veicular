"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export interface MaintenanceItemRowState {
  description: string;
  quantity: string;
  unitPrice: string;
}

interface MaintenanceItemRowProps {
  index: number;
  item: MaintenanceItemRowState;
  canRemove: boolean;
  errors?: {
    description?: string;
    quantity?: string;
    unitPrice?: string;
  };
  onChange: (index: number, field: keyof MaintenanceItemRowState, value: string) => void;
  onRemove: (index: number) => void;
}

export function MaintenanceItemRow({
  index,
  item,
  canRemove,
  errors = {},
  onChange,
  onRemove,
}: MaintenanceItemRowProps) {
  const qty = parseFloat(item.quantity) || 0;
  const price = parseFloat(item.unitPrice) || 0;
  const subtotal = (qty * price).toFixed(2);
  const hasSubtotal = qty > 0 && price > 0;

  return (
    <div
      className={`grid grid-cols-[1fr_60px_80px_80px] gap-1.5 items-start py-3 ${
        index > 0 ? "border-t border-[#E5E2DA]" : ""
      }`}
    >
      {/* Descrição */}
      <div className="flex flex-col gap-1">
        <Input
          type="text"
          placeholder="Item…"
          value={item.description}
          onChange={(e) => onChange(index, "description", e.target.value)}
          className={`h-10 text-sm ${errors.description ? "border-red-500" : ""}`}
          aria-label={`Descrição do item ${index + 1}`}
        />
        {errors.description && (
          <p className="text-red-600 text-[10px] leading-tight" role="alert">
            {errors.description}
          </p>
        )}
      </div>

      {/* Quantidade */}
      <div className="flex flex-col gap-1">
        <Input
          type="number"
          placeholder="1"
          value={item.quantity}
          onChange={(e) => onChange(index, "quantity", e.target.value)}
          min="0"
          step="0.01"
          className={`h-10 text-sm ${errors.quantity ? "border-red-500" : ""}`}
          aria-label={`Quantidade do item ${index + 1}`}
        />
        {errors.quantity && (
          <p className="text-red-600 text-[10px] leading-tight" role="alert">
            {errors.quantity}
          </p>
        )}
      </div>

      {/* Valor unitário */}
      <div className="flex flex-col gap-1">
        <Input
          type="number"
          placeholder="0,00"
          value={item.unitPrice}
          onChange={(e) => onChange(index, "unitPrice", e.target.value)}
          min="0"
          step="0.01"
          className={`h-10 text-sm ${errors.unitPrice ? "border-red-500" : ""}`}
          aria-label={`Valor unitário do item ${index + 1}`}
        />
        {errors.unitPrice && (
          <p className="text-red-600 text-[10px] leading-tight" role="alert">
            {errors.unitPrice}
          </p>
        )}
      </div>

      {/* Subtotal (somente leitura) */}
      <div className="flex items-center justify-between h-10 px-2.5 bg-amber-50 border border-amber-200 rounded-md">
        <span className="text-[13px] font-semibold text-amber-700 truncate">
          {hasSubtotal ? `R$ ${subtotal}` : "—"}
        </span>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onRemove(index)}
            className="h-5 w-5 p-0 text-[#6B6760] hover:text-red-500 hover:bg-transparent ml-1 shrink-0"
            aria-label={`Remover item ${index + 1}`}
          >
            <Trash2 size={13} />
          </Button>
        )}
      </div>
    </div>
  );
}
