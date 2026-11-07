/** Formats the API's nonnegative COP decimal without converting it to a JS number. */
export function formatCopTotal(value: string | undefined): string | null {
  if (typeof value !== "string" || !/^\d+(?:\.\d{1,2})?$/.test(value)) return null;

  const [integer, fraction = ""] = value.split(".");
  const grouped = integer.replace(/^0+(?=\d)/, "").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const cents = fraction.padEnd(2, "0");
  return `$ ${grouped}${cents === "00" ? "" : `,${cents}`} COP`;
}
