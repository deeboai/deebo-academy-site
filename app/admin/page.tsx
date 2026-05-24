import { requireAcademyAdminUser } from "@/lib/auth/academy-admin";
import { redirect } from "next/navigation";

export default async function AcademyAdminEntryPage() {
  await requireAcademyAdminUser();
  redirect("/admin/intake");
}
