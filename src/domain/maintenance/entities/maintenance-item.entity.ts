import { InvalidValueError } from "@/domain/shared/errors/invalid-value.error";
import { ItemPrice } from "@/domain/maintenance/value-objects/item-price.vo";
import { ItemQuantity } from "@/domain/maintenance/value-objects/item-quantity.vo";

interface MaintenanceItemProps {
  id: string;
  description: string;
  quantity: ItemQuantity;
  unitPrice: ItemPrice;
}

export class MaintenanceItem {
  private constructor(private readonly props: MaintenanceItemProps) {}

  static create(input: {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
  }): MaintenanceItem {
    const description = input.description?.trim();
    if (!description) {
      throw new InvalidValueError("MaintenanceItem.description", input.description);
    }

    return new MaintenanceItem({
      id: input.id,
      description,
      quantity: ItemQuantity.create(input.quantity),
      unitPrice: ItemPrice.create(input.unitPrice),
    });
  }

  static rehydrate(props: MaintenanceItemProps): MaintenanceItem {
    return new MaintenanceItem(props);
  }

  get id(): string {
    return this.props.id;
  }

  get description(): string {
    return this.props.description;
  }

  get quantity(): ItemQuantity {
    return this.props.quantity;
  }

  get unitPrice(): ItemPrice {
    return this.props.unitPrice;
  }

  get subtotal(): number {
    return this.props.quantity.value * this.props.unitPrice.value;
  }
}
