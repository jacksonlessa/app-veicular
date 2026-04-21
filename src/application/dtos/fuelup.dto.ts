export type FuelupListItemDto = {
  id: string;
  date: string;
  odometer: number;
  fuelType: string;
  fullTank: boolean;
  liters: number;
  pricePerLiter: number;
  totalPrice: number;
  kmPerLiter: number | null;
};
