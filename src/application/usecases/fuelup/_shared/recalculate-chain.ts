import { Fuelup } from "@/domain/fuel/entities/fuelup.entity";
import { Kml } from "@/domain/fuel/value-objects/kml.vo";

export function recalculateChain(fuelups: Fuelup[]): Fuelup[] {
  let lastFullTank: { odometer: number } | null = null;
  let litersAccumulated = 0;

  return fuelups.map((f) => {
    let kml: Kml | null = null;

    if (f.fullTank) {
      if (lastFullTank !== null) {
        const distance = f.odometer.value - lastFullTank.odometer;
        const denominator = litersAccumulated + f.liters.value;
        kml = Kml.create(distance / denominator);
      }
      lastFullTank = { odometer: f.odometer.value };
      litersAccumulated = 0;
    } else {
      litersAccumulated += f.liters.value;
    }

    return Fuelup.rehydrate({
      id: f.id,
      vehicleId: f.vehicleId,
      userId: f.userId,
      date: f.date,
      odometer: f.odometer,
      fuelType: f.fuelType,
      fullTank: f.fullTank,
      liters: f.liters,
      pricePerLiter: f.pricePerLiter,
      totalPrice: f.totalPrice,
      kmPerLiter: kml,
      createdAt: f.createdAt,
    });
  });
}
