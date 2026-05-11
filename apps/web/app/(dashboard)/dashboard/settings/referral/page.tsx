import { getReferralInfo } from "@/lib/actions/referral.actions";
import { ReferralWidget } from "./ReferralWidget";

export default async function ReferralPage() {
  const data = await getReferralInfo();
  if ("error" in data) return <p className="p-6 text-error">{data.error}</p>;
  return <ReferralWidget {...data} />;
}
