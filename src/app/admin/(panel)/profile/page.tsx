import { requireAdmin } from "@/lib/auth";
import { getContent } from "@/lib/store";
import { ProfileEditor } from "@/components/admin/ProfileEditor";

export default async function ProfilePage() {
  await requireAdmin();
  const { profile } = await getContent();
  return <ProfileEditor initial={profile} />;
}
