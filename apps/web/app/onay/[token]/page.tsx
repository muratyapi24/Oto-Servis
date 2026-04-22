import { validateApprovalToken } from "@/lib/actions/approval.actions";
import ApprovalClient from "./ApprovalClient";

export const metadata = { title: "Servis Onayı | MS Oto Servis" };

export default async function ApprovalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const result = await validateApprovalToken(token);

  if (result.error || !result.serviceOrder) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <span className="text-3xl">⚠️</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Geçersiz Onay Linki</h1>
          <p className="text-gray-500 text-sm">{result.error ?? "Bu onay linki geçersiz veya süresi dolmuş."}</p>
          <p className="text-xs text-gray-400">Lütfen servis ile iletişime geçin.</p>
        </div>
      </div>
    );
  }

  return <ApprovalClient token={token} serviceOrder={result.serviceOrder} />;
}
