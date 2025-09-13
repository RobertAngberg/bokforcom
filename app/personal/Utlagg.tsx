import { redirect } from "next/navigation";

export default async function UtlaggPage() {
  redirect("/bokfor?utlagg=true");
}
