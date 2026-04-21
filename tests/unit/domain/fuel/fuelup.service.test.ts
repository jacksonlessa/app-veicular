import { describe, expect, it } from "vitest";
import { FuelupService } from "@/domain/fuel/services/fuelup.service";
import { FuelAmount } from "@/domain/fuel/value-objects/fuel-amount.vo";
import { FuelPrice } from "@/domain/fuel/value-objects/fuel-price.vo";
import { Kml } from "@/domain/fuel/value-objects/kml.vo";
import { Odometer } from "@/domain/vehicle/value-objects/odometer.vo";
import { BusinessRuleError } from "@/domain/shared/errors/business-rule.error";
import { InvalidValueError } from "@/domain/shared/errors/invalid-value.error";

// Helpers
const liters = (v: number) => FuelAmount.create(v);
const price = (v: number) => FuelPrice.create(v);
const odometer = (v: number) => Odometer.create(v);

describe("FuelupService.compute", () => {
  describe("Regra dos 3 campos — validação de quantidade de campos", () => {
    it("0 campos preenchidos → BusinessRuleError('fuelup.three_fields')", () => {
      expect(() =>
        FuelupService.compute({
          currentOdometer: odometer(10000),
          currentFullTank: false,
        }),
      ).toThrow(BusinessRuleError);

      expect(() =>
        FuelupService.compute({
          currentOdometer: odometer(10000),
          currentFullTank: false,
        }),
      ).toThrowError("fuelup.three_fields");
    });

    it("1 campo preenchido (apenas liters) → BusinessRuleError('fuelup.three_fields')", () => {
      expect(() =>
        FuelupService.compute({
          liters: liters(40),
          currentOdometer: odometer(10000),
          currentFullTank: false,
        }),
      ).toThrow(BusinessRuleError);
    });

    it("1 campo preenchido (apenas pricePerLiter) → BusinessRuleError('fuelup.three_fields')", () => {
      expect(() =>
        FuelupService.compute({
          pricePerLiter: price(5.5),
          currentOdometer: odometer(10000),
          currentFullTank: false,
        }),
      ).toThrow(BusinessRuleError);
    });

    it("1 campo preenchido (apenas totalPrice) → BusinessRuleError('fuelup.three_fields')", () => {
      expect(() =>
        FuelupService.compute({
          totalPrice: price(200),
          currentOdometer: odometer(10000),
          currentFullTank: false,
        }),
      ).toThrow(BusinessRuleError);
    });

    it("3 campos preenchidos → BusinessRuleError('fuelup.three_fields')", () => {
      expect(() =>
        FuelupService.compute({
          liters: liters(40),
          pricePerLiter: price(5),
          totalPrice: price(200),
          currentOdometer: odometer(10000),
          currentFullTank: false,
        }),
      ).toThrow(BusinessRuleError);
    });
  });

  describe("Cálculo do terceiro campo", () => {
    it("liters + pricePerLiter → calcula totalPrice corretamente", () => {
      const result = FuelupService.compute({
        liters: liters(40),
        pricePerLiter: price(5),
        currentOdometer: odometer(10000),
        currentFullTank: false,
      });

      expect(result.liters.value).toBe(40);
      expect(result.pricePerLiter.value).toBe(5);
      expect(result.totalPrice.value).toBeCloseTo(200, 6);
    });

    it("liters + pricePerLiter com decimais → arredonda totalPrice corretamente", () => {
      const result = FuelupService.compute({
        liters: liters(33.5),
        pricePerLiter: price(5.79),
        currentOdometer: odometer(10000),
        currentFullTank: false,
      });

      // 33.5 * 5.79 = 193.965 → arredondado para 193.97
      expect(result.totalPrice.value).toBeCloseTo(33.5 * 5.79, 2);
    });

    it("liters + totalPrice → calcula pricePerLiter corretamente", () => {
      const result = FuelupService.compute({
        liters: liters(40),
        totalPrice: price(200),
        currentOdometer: odometer(10000),
        currentFullTank: false,
      });

      expect(result.liters.value).toBe(40);
      expect(result.totalPrice.value).toBe(200);
      expect(result.pricePerLiter.value).toBeCloseTo(5, 6);
    });

    it("liters + totalPrice com decimais → calcula pricePerLiter arredondado", () => {
      const result = FuelupService.compute({
        liters: liters(33),
        totalPrice: price(100),
        currentOdometer: odometer(10000),
        currentFullTank: false,
      });

      // 100 / 33 ≈ 3.0303...
      expect(result.pricePerLiter.value).toBeCloseTo(100 / 33, 2);
    });

    it("pricePerLiter + totalPrice → calcula liters corretamente", () => {
      const result = FuelupService.compute({
        pricePerLiter: price(5),
        totalPrice: price(200),
        currentOdometer: odometer(10000),
        currentFullTank: false,
      });

      expect(result.pricePerLiter.value).toBe(5);
      expect(result.totalPrice.value).toBe(200);
      expect(result.liters.value).toBeCloseTo(40, 6);
    });

    it("pricePerLiter + totalPrice com decimais → calcula liters arredondado a 3 casas", () => {
      const result = FuelupService.compute({
        pricePerLiter: price(5.79),
        totalPrice: price(193.97),
        currentOdometer: odometer(10000),
        currentFullTank: false,
      });

      // 193.97 / 5.79 ≈ 33.500...
      expect(result.liters.value).toBeCloseTo(193.97 / 5.79, 3);
    });
  });

  describe("Cálculo de kml — condicionais", () => {
    it("previous = null → kml = null (mesmo com currentFullTank = true)", () => {
      const result = FuelupService.compute({
        liters: liters(40),
        pricePerLiter: price(5),
        currentOdometer: odometer(10000),
        currentFullTank: true,
        previous: null,
      });

      expect(result.kml).toBeNull();
    });

    it("previous = undefined → kml = null (primeiro abastecimento)", () => {
      const result = FuelupService.compute({
        liters: liters(40),
        pricePerLiter: price(5),
        currentOdometer: odometer(10000),
        currentFullTank: true,
      });

      expect(result.kml).toBeNull();
    });

    it("previous.fullTank = false → kml = null (mesmo com currentFullTank = true)", () => {
      const result = FuelupService.compute({
        liters: liters(40),
        pricePerLiter: price(5),
        currentOdometer: odometer(10500),
        currentFullTank: true,
        previous: { odometer: odometer(10000), fullTank: false },
      });

      expect(result.kml).toBeNull();
    });

    it("currentFullTank = false → kml = null (mesmo com previous.fullTank = true)", () => {
      const result = FuelupService.compute({
        liters: liters(40),
        pricePerLiter: price(5),
        currentOdometer: odometer(10500),
        currentFullTank: false,
        previous: { odometer: odometer(10000), fullTank: true },
      });

      expect(result.kml).toBeNull();
    });

    it("ambos fullTank = false → kml = null", () => {
      const result = FuelupService.compute({
        liters: liters(40),
        pricePerLiter: price(5),
        currentOdometer: odometer(10500),
        currentFullTank: false,
        previous: { odometer: odometer(10000), fullTank: false },
      });

      expect(result.kml).toBeNull();
    });

    it("ambos tanque cheio, odômetro crescente → kml válido", () => {
      // 500km / 40L = 12.5 km/l
      const result = FuelupService.compute({
        liters: liters(40),
        pricePerLiter: price(5),
        currentOdometer: odometer(10500),
        currentFullTank: true,
        previous: { odometer: odometer(10000), fullTank: true },
      });

      expect(result.kml).not.toBeNull();
      expect(result.kml).toBeInstanceOf(Kml);
      expect(result.kml!.value).toBeCloseTo(12.5, 6);
    });

    it("odômetro decrescente → BusinessRuleError('odometer.not_increasing')", () => {
      expect(() =>
        FuelupService.compute({
          liters: liters(40),
          pricePerLiter: price(5),
          currentOdometer: odometer(9500),
          currentFullTank: true,
          previous: { odometer: odometer(10000), fullTank: true },
        }),
      ).toThrow(BusinessRuleError);

      expect(() =>
        FuelupService.compute({
          liters: liters(40),
          pricePerLiter: price(5),
          currentOdometer: odometer(9500),
          currentFullTank: true,
          previous: { odometer: odometer(10000), fullTank: true },
        }),
      ).toThrowError("odometer.not_increasing");
    });

    it("odômetro igual → BusinessRuleError('odometer.not_increasing')", () => {
      expect(() =>
        FuelupService.compute({
          liters: liters(40),
          pricePerLiter: price(5),
          currentOdometer: odometer(10000),
          currentFullTank: true,
          previous: { odometer: odometer(10000), fullTank: true },
        }),
      ).toThrow(BusinessRuleError);
    });

    it("odômetro decrescente com previous.fullTank = false → não lança erro (kml = null)", () => {
      // A guarda de odômetro só é verificada quando ambos são fullTank
      const result = FuelupService.compute({
        liters: liters(40),
        pricePerLiter: price(5),
        currentOdometer: odometer(9500),
        currentFullTank: true,
        previous: { odometer: odometer(10000), fullTank: false },
      });

      expect(result.kml).toBeNull();
    });
  });

  describe("Valores no limite", () => {
    it("kml = 50 (limite máximo do VO Kml) → válido", () => {
      // 50 km/l: 500km / 10L
      const result = FuelupService.compute({
        liters: liters(10),
        pricePerLiter: price(5),
        currentOdometer: odometer(10500),
        currentFullTank: true,
        previous: { odometer: odometer(10000), fullTank: true },
      });

      expect(result.kml).not.toBeNull();
      expect(result.kml!.value).toBeCloseTo(50, 6);
    });

    it("kml muito alto (> 50) → lança InvalidValueError do VO Kml", () => {
      // Exemplo: 5100km / 100L = 51 km/l → inválido
      expect(() =>
        FuelupService.compute({
          liters: liters(100),
          pricePerLiter: price(5),
          currentOdometer: odometer(15100),
          currentFullTank: true,
          previous: { odometer: odometer(10000), fullTank: true },
        }),
      ).toThrow(InvalidValueError);
    });

    it("liters mínimo (0.001) com pricePerLiter + totalPrice → calcula sem erros", () => {
      // Usando a rota pricePerLiter + totalPrice → calcula liters
      // totalPrice = 0.01, pricePerLiter = 10 → liters = 0.001
      const result = FuelupService.compute({
        pricePerLiter: price(10),
        totalPrice: price(0.01),
        currentOdometer: odometer(10000),
        currentFullTank: false,
      });

      expect(result.liters.value).toBeCloseTo(0.001, 6);
    });

    it("totalPrice = 0 → pricePerLiter válido", () => {
      // FuelPrice aceita 0
      const result = FuelupService.compute({
        liters: liters(40),
        totalPrice: price(0),
        currentOdometer: odometer(10000),
        currentFullTank: false,
      });

      expect(result.pricePerLiter.value).toBe(0);
    });

    it("kml mínimo possível → campo kml válido", () => {
      // kml = 1/999 ≈ 0.001 km/l (muito baixo — válido se > 0)
      // 1km / 999L (máximo de FuelAmount) ≈ 0.001001 km/l
      const result = FuelupService.compute({
        liters: liters(999),
        pricePerLiter: price(5),
        currentOdometer: odometer(10001),
        currentFullTank: true,
        previous: { odometer: odometer(10000), fullTank: true },
      });

      expect(result.kml).not.toBeNull();
      expect(result.kml!.value).toBeCloseTo(1 / 999, 6);
    });
  });

  describe("Retorno completo — campos não calculados passam direto", () => {
    it("resultado contém todos os 4 campos (liters, pricePerLiter, totalPrice, kml)", () => {
      const result = FuelupService.compute({
        liters: liters(50),
        pricePerLiter: price(6),
        currentOdometer: odometer(20000),
        currentFullTank: true,
        previous: { odometer: odometer(19400), fullTank: true },
      });

      expect(result).toHaveProperty("liters");
      expect(result).toHaveProperty("pricePerLiter");
      expect(result).toHaveProperty("totalPrice");
      expect(result).toHaveProperty("kml");
      // kml = 600 / 50 = 12
      expect(result.kml!.value).toBeCloseTo(12, 6);
      // totalPrice = 50 * 6 = 300
      expect(result.totalPrice.value).toBeCloseTo(300, 6);
    });
  });
});
