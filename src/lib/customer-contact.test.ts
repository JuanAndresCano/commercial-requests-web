import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/client";
import {
  CONTACTABILITY_ERROR,
  PHONE_ERROR,
  customerContactErrors,
  customerContactServerMessage,
  hasValidContactChannel,
  isValidPhone,
  pendingValue,
  phoneError,
  phoneValue,
} from "./customer-contact";

describe("Colombian phone: exactly 10 digits, optional +57 or 57", () => {
  it("states the rule in Spanish", () => {
    expect(PHONE_ERROR).toBe("El teléfono debe tener 10 dígitos (puede iniciar con +57)");
    expect(CONTACTABILITY_ERROR).toBe("Deja al menos un teléfono o correo válido");
  });

  it.each([
    "3001234567",
    "300 123 4567",
    "300-123-4567",
    "300.123.4567",
    "(602) 555 1234",
    "+57 3001234567",
    "+57 (300) 123-4567",
    "573001234567",
    "57 300 123 4567",
    "  3001234567  ",
  ])("accepts «%s»", (value) => {
    expect(isValidPhone(value)).toBe(true);
    expect(phoneError(value)).toBeUndefined();
  });

  it.each([
    ["seven digits", "5551234"],
    ["nine digits", "300123456"],
    ["eleven digits", "30012345678"],
    ["fifteen digits", "300123456789012"],
    ["letters", "llamar3001234567"],
    ["a plus in the middle", "300+1234567"],
    ["a double plus", "++573001234567"],
    ["only parentheses", "((((((("],
  ])("rejects %s", (_name, value) => {
    expect(isValidPhone(value)).toBe(false);
    expect(phoneError(value)).toBe(PHONE_ERROR);
  });

  it.each(["Pendiente", " pendiente ", "", "   ", null, undefined])(
    "treats «%s» as absence, not as an error",
    (value) => {
      expect(isValidPhone(value)).toBe(false);
      expect(phoneError(value)).toBeUndefined();
      expect(phoneValue(value)).toBeUndefined();
    },
  );

  it("phoneValue returns the trimmed phone only when it is valid", () => {
    expect(phoneValue(" 300 123 4567 ")).toBe("300 123 4567");
    expect(phoneValue("5551234")).toBeUndefined();
  });
});

describe("customerContactServerMessage", () => {
  it("translates the contactability and phone messages of a 400", () => {
    expect(
      customerContactServerMessage(new ApiError(400, "At least one valid customer phone or email is required")),
    ).toBe(CONTACTABILITY_ERROR);
    expect(customerContactServerMessage(new ApiError(400, "contactPhone must be a valid phone number"))).toBe(
      PHONE_ERROR,
    );
  });

  it("returns undefined for anything it does not know", () => {
    expect(customerContactServerMessage(new ApiError(400, "title must be a string"))).toBeUndefined();
    expect(customerContactServerMessage(new ApiError(500, "phone exploded"))).toBeUndefined();
    expect(customerContactServerMessage(new Error("phone"))).toBeUndefined();
  });
});

describe("customer contactability agreed with Diana", () => {
  it("requires a usable channel instead of counting pending or whitespace", () => {
    expect(customerContactErrors({ companyPhone: " Pendiente ", contactEmail: "  " })).toEqual({
      contactability: CONTACTABILITY_ERROR,
    });
  });

  it.each([
    { companyPhone: "+57 (315) 555-1234" },
    { companyEmail: "contacto@empresa.co" },
    { contactPhone: "6025551234" },
    { contactEmail: "persona@empresa.co" },
  ])("accepts either company or proposal contact channel: %o", (channels) => {
    expect(customerContactErrors(channels)).toEqual({});
  });

  it("still rejects a malformed supplied email when another channel is usable", () => {
    expect(customerContactErrors({ companyPhone: "3155551234", contactEmail: "mal-correo" })).toEqual({
      contactEmail: "Ingresa un correo válido o marca el dato como Pendiente.",
    });
  });

  it("rejects a supplied phone that does not have ten digits", () => {
    expect(customerContactErrors({ companyEmail: "persona@empresa.co", contactPhone: "5551234" })).toEqual({
      contactPhone: PHONE_ERROR,
    });
  });

  it("does not accept letters or a double leading plus in a phone", () => {
    expect(customerContactErrors({ companyPhone: "++573155551234" }).companyPhone).toBeDefined();
    expect(customerContactErrors({ companyPhone: "llamar3155551234" }).companyPhone).toBeDefined();
  });

  it("normalizes pending secondary values without inventing client data", () => {
    expect(pendingValue(" Pendiente ")).toBeUndefined();
    expect(pendingValue("PENDIENTE")).toBeUndefined();
    expect(pendingValue("  ")).toBeUndefined();
    expect(pendingValue(" Calle 1 ")).toBe("Calle 1");
  });
});

describe("hasValidContactChannel", () => {
  it("is true when any principal channel is valid", () => {
    expect(hasValidContactChannel({ contactEmail: "ana@cliente.co" })).toBe(true);
    expect(hasValidContactChannel({ companyPhone: "3155551234" })).toBe(true);
  });

  it("ignores pending, blank, malformed and secondary-only channels", () => {
    expect(hasValidContactChannel({})).toBe(false);
    expect(hasValidContactChannel({ companyPhone: "Pendiente", contactEmail: " " })).toBe(false);
    expect(hasValidContactChannel({ contactEmail: "mal-correo", contactPhone: "5551234" })).toBe(false);
    expect(hasValidContactChannel({ contactSecondaryPhone: "3155551234" })).toBe(false);
  });
});
