import { BusinessRuleError } from "@/domain/shared/errors/business-rule.error";
import { Odometer } from "@/domain/vehicle/value-objects/odometer.vo";
import { FuelAmount } from "../value-objects/fuel-amount.vo";
import { FuelDate } from "../value-objects/fuel-date.vo";
import { FuelPrice } from "../value-objects/fuel-price.vo";
import { Kml } from "../value-objects/kml.vo";

export interface FuelupProps {
  id: string;
  vehicleId: string;
  userId: string;
  date: FuelDate;
  odometer: Odometer;
  fuelType: string;
  fullTank: boolean;
  liters: FuelAmount;
  pricePerLiter: FuelPrice;
  totalPrice: FuelPrice;
  kmPerLiter: Kml | null;
  createdAt: Date;
}

export interface CreateFuelupInput {
  id: string;
  vehicleId: string;
  userId: string;
  date: FuelDate;
  odometer: Odometer;
  fuelType: string;
  fullTank: boolean;
  liters: FuelAmount;
  pricePerLiter: FuelPrice;
  totalPrice: FuelPrice;
  kmPerLiter: Kml | null;
  createdAt?: Date;
}

const TOTAL_PRICE_TOLERANCE = 0.01;

export class Fuelup {
  readonly id: string;
  readonly vehicleId: string;
  readonly userId: string;
  readonly date: FuelDate;
  readonly odometer: Odometer;
  readonly fuelType: string;
  readonly fullTank: boolean;
  readonly liters: FuelAmount;
  readonly pricePerLiter: FuelPrice;
  readonly totalPrice: FuelPrice;
  readonly kmPerLiter: Kml | null;
  readonly createdAt: Date;

  private constructor(props: FuelupProps) {
    this.id = props.id;
    this.vehicleId = props.vehicleId;
    this.userId = props.userId;
    this.date = props.date;
    this.odometer = props.odometer;
    this.fuelType = props.fuelType;
    this.fullTank = props.fullTank;
    this.liters = props.liters;
    this.pricePerLiter = props.pricePerLiter;
    this.totalPrice = props.totalPrice;
    this.kmPerLiter = props.kmPerLiter;
    this.createdAt = props.createdAt;
  }

  private static assertTotalPriceCoherence(
    liters: FuelAmount,
    pricePerLiter: FuelPrice,
    totalPrice: FuelPrice,
  ): void {
    const expected = liters.value * pricePerLiter.value;
    if (Math.abs(totalPrice.value - expected) > TOTAL_PRICE_TOLERANCE) {
      throw new BusinessRuleError(
        "fuelup.total_mismatch",
        "totalPrice does not match liters * pricePerLiter",
      );
    }
  }

  static create(input: CreateFuelupInput): Fuelup {
    Fuelup.assertTotalPriceCoherence(
      input.liters,
      input.pricePerLiter,
      input.totalPrice,
    );

    return new Fuelup({
      ...input,
      createdAt: input.createdAt ?? new Date(),
    });
  }

  static rehydrate(props: FuelupProps): Fuelup {
    return new Fuelup(props);
  }
}
