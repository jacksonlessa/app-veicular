export interface VehicleDTO {
  id: string;
  name: string;
  plate: string | null;
  initOdometer: number;
  currentOdometer: number;
  createdAt: string; // ISO 8601
}
