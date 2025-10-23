import { getImpersonationStatus } from "../admin/actions/impersonation";
import ImpersonationBanner from "../admin/components/ImpersonationBanner";

export default async function ImpersonationWrapper() {
  const impersonationStatus = await getImpersonationStatus();

  if (!impersonationStatus.isImpersonating || !impersonationStatus.targetUser) {
    return null;
  }

  return <ImpersonationBanner targetUser={impersonationStatus.targetUser} />;
}
