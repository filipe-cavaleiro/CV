import { requireAdmin } from "@/lib/auth";
import { getPrivate } from "@/lib/store";
import { PrivateEditor } from "@/components/admin/PrivateEditor";

export default async function PrivatePage() {
  await requireAdmin();
  return <PrivateEditor initial={await getPrivate()} />;
}
