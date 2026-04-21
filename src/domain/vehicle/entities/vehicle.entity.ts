import { BusinessRuleError } from "@/domain/shared/errors/business-rule.error";
import { Odometer } from "../value-objects/odometer.vo";
import { Plate } from "../value-objects/plate.vo";
import { VehicleName } from "../value-objects/vehicle-name.vo";

export interface VehicleProps {
  id: string;
  accountId: string;
  name: VehicleName;
  plate: Plate | null;
  brand: string;
  model: string;
  color: string;
  initOdometer: Odometer;
  currentOdometer: Odometer;
  createdAt: Date;
}

export interface CreateVehicleInput {
  id: string;
  accountId: string;
  name: VehicleName;
  plate: Plate | null;
  brand: string;
  model: string;
  color: string;
  initOdometer: Odometer;
  currentOdometer: Odometer;
  createdAt?: Date;
}

export class Vehicle {
  readonly id: string;
  readonly accountId: string;
  readonly name: VehicleName;
  readonly plate: Plate | null;
  readonly brand: string;
  readonly model: string;
  readonly color: string;
  readonly initOdometer: Odometer;
  readonly currentOdometer: Odometer;
  readonly createdAt: Date;

  private constructor(props: VehicleProps) {
    this.id = props.id;
    this.accountId = props.accountId;
    this.name = props.name;
    this.plate = props.plate;
    this.brand = props.brand;
    this.model = props.model;
    this.color = props.color;
    this.initOdometer = props.initOdometer;
    this.currentOdometer = props.currentOdometer;
    this.createdAt = props.createdAt;
  }

  private static assertOdometerInvariant(
    initOdometer: Odometer,
    currentOdometer: Odometer,
  ): void {
    if (currentOdometer.value < initOdometer.value) {
      throw new BusinessRuleError(
        "vehicle.odometer_invalid",
        "currentOdometer must be greater than or equal to initOdometer",
      );
    }
  }

  static create(input: CreateVehicleInput): Vehicle {
    Vehicle.assertOdometerInvariant(
      input.initOdometer,
      input.currentOdometer,
    );
    return new Vehicle({
      ...input,
      createdAt: input.createdAt ?? new Date(),
    });
  }

  static rehydrate(props: VehicleProps): Vehicle {
    Vehicle.assertOdometerInvariant(
      props.initOdometer,
      props.currentOdometer,
    );
    return new Vehicle(props);
  }
}
