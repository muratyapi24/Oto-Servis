"use client";

import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gray-900 text-white px-6 py-4 flex items-center gap-3">
        <span className="text-xl font-bold">MS Oto Servis</span>
        <span className="text-gray-400">|</span>
        <span className="text-gray-300 text-sm">API Dokümantasyonu</span>
      </div>
      <SwaggerUI
        url="/api/docs"
        docExpansion="list"
        defaultModelsExpandDepth={1}
        persistAuthorization
      />
    </div>
  );
}
