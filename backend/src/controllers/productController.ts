import { ProductInput } from "../models/Product";
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export const integer = (v: unknown, min = 0): v is number =>
  typeof v === "number" && Number.isSafeInteger(v) && v >= min && v <= 1000000;
export function validate(body: Record<string, unknown>): ProductInput {
  const p = {} as ProductInput;
  for (const key of ["name", "reference", "category"] as const) {
    if (
      typeof body[key] !== "string" ||
      !body[key].trim() ||
      body[key].trim().length > 100
    )
      throw new ApiError(
        400,
        `Le champ ${key} est obligatoire (100 caractères maximum).`,
      );
    p[key] = body[key].trim();
  }
  if (
    body.description !== undefined &&
    (typeof body.description !== "string" || body.description.length > 2000)
  )
    throw new ApiError(400, "Description invalide.");
  p.description = (body.description as string | undefined)?.trim() || "";
  for (const key of ["quantity", "threshold"] as const) {
    if (!integer(body[key]))
      throw new ApiError(400, "Quantité et seuil : entiers de 0 à 1 000 000.");
    p[key] = body[key];
  }
  return p;
}
