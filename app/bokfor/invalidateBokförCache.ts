"use server";

import { revalidatePath } from "next/cache";

export async function invalidateBokförCache() {
  revalidatePath("/historik");
  revalidatePath("/rapporter/huvudbok");
  revalidatePath("/rapporter/balansrapport");
  revalidatePath("/rapporter/resultatrapport");
  revalidatePath("/rapporter/momsrapport");
}
