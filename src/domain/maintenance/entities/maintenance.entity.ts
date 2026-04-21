import { BusinessRuleError } from "@/domain/shared/errors/business-rule.error";
import { Odometer } from "@/domain/vehicle/value-objects/odometer.vo";
import { MaintenanceDate } from "@/domain/maintenance/value-objects/maintenance-date.vo";
import { MaintenanceItem } from "@/domain/maintenance/entities/maintenance-item.entity";

interface MaintenanceProps {
  id: string;
  vehicleId: string;
  userId: string;
  date: MaintenanceDate;
  odometer: Odometer;
  location: string;
  items: MaintenanceItem[];
  createdAt: Date;
}

export class Maintenance {
  private readonly props: Omit<MaintenanceProps, "items"> & { items: MaintenanceItem[] };

  private constructor(props: MaintenanceProps) {
    this.props = { ...props, items: [...props.items] };
  }

  static create(input: {
    id: string;
    vehicleId: string;
    userId: string;
    date: MaintenanceDate;
    odometer: Odometer;
    location: string;
    items: MaintenanceItem[];
    createdAt?: Date;
  }): Maintenance {
    if (!input.items || input.items.length < 1) {
      throw new BusinessRuleError("maintenance.no_items");
    }

    return new Maintenance({
      id: input.id,
      vehicleId: input.vehicleId,
      userId: input.userId,
      date: input.date,
      odometer: input.odometer,
      location: input.location,
      items: input.items,
      createdAt: input.createdAt ?? new Date(),
    });
  }

  static rehydrate(props: MaintenanceProps): Maintenance {
    return new Maintenance(props);
  }

  get id(): string {
    return this.props.id;
  }

  get vehicleId(): string {
    return this.props.vehicleId;
  }

  get userId(): string {
    return this.props.userId;
  }

  get date(): MaintenanceDate {
    return this.props.date;
  }

  get odometer(): Odometer {
    return this.props.odometer;
  }

  get location(): string {
    return this.props.location;
  }

  get items(): ReadonlyArray<MaintenanceItem> {
    return this.props.items;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get totalPrice(): number {
    return this.props.items.reduce((sum, item) => sum + item.subtotal, 0);
  }

  addItem(item: MaintenanceItem): void {
    this.props.items.push(item);
  }
}
