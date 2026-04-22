import { NextResponse } from "next/server";
import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "MS Oto Servis API",
      version: "1.0.0",
      description: "MS Oto Servis SaaS platformu REST API dokümantasyonu",
      contact: {
        name: "BST Destek",
        email: "destek@bstoto.com",
      },
    },
    servers: [
      {
        url: process.env.NEXTAUTH_URL ?? "http://localhost:3000",
        description: "API Sunucusu",
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "NextAuth.js JWT token. Login sonrası session token'ı kullanın.",
        },
        SessionCookie: {
          type: "apiKey",
          in: "cookie",
          name: "next-auth.session-token",
          description: "NextAuth.js session cookie",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            error: { type: "string", description: "Hata mesajı" },
          },
        },
        HealthResponse: {
          type: "object",
          properties: {
            status: { type: "string", enum: ["ok", "error"] },
            db: { type: "string", enum: ["connected", "disconnected"] },
            version: { type: "string" },
            timestamp: { type: "string", format: "date-time" },
          },
        },
        SearchResults: {
          type: "object",
          properties: {
            results: {
              type: "object",
              properties: {
                customers: { type: "array", items: { type: "object" } },
                vehicles: { type: "array", items: { type: "object" } },
                serviceOrders: { type: "array", items: { type: "object" } },
                parts: { type: "array", items: { type: "object" } },
              },
            },
          },
        },
      },
    },
    security: [{ BearerAuth: [] }, { SessionCookie: [] }],
    tags: [
      { name: "System", description: "Sistem sağlık ve izleme endpoint'leri" },
      { name: "Search", description: "Full-text arama endpoint'leri" },
      { name: "Push", description: "Web Push bildirim endpoint'leri" },
      { name: "Events", description: "Server-Sent Events (SSE) endpoint'leri" },
      { name: "Auth", description: "Kimlik doğrulama endpoint'leri" },
      { name: "Upload", description: "Dosya yükleme endpoint'leri" },
      { name: "Stripe", description: "Ödeme ve abonelik endpoint'leri" },
    ],
    paths: {
      "/api/health": {
        get: {
          tags: ["System"],
          summary: "Sistem sağlık kontrolü",
          description: "Veritabanı bağlantısı ve servis durumunu kontrol eder",
          security: [],
          responses: {
            "200": {
              description: "Sistem sağlıklı",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/HealthResponse" },
                },
              },
            },
            "503": {
              description: "Servis kullanılamıyor",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/HealthResponse" },
                },
              },
            },
          },
        },
      },
      "/api/search": {
        get: {
          tags: ["Search"],
          summary: "Global arama",
          description: "Müşteri, araç, servis emri ve parça arama. Tenant izolasyonu uygulanır.",
          parameters: [
            {
              name: "q",
              in: "query",
              required: true,
              schema: { type: "string", minLength: 2 },
              description: "Arama sorgusu",
            },
            {
              name: "type",
              in: "query",
              schema: {
                type: "string",
                enum: ["all", "customers", "vehicles", "serviceOrders", "parts"],
                default: "all",
              },
              description: "Arama tipi",
            },
            {
              name: "limit",
              in: "query",
              schema: { type: "integer", minimum: 1, maximum: 50, default: 20 },
            },
          ],
          responses: {
            "200": {
              description: "Arama sonuçları",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/SearchResults" },
                },
              },
            },
            "401": { description: "Yetkisiz erişim" },
          },
        },
      },
      "/api/push/subscribe": {
        post: {
          tags: ["Push"],
          summary: "Push bildirim aboneliği",
          description: "Kullanıcının cihazını push bildirim için kaydeder",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["endpoint", "keys"],
                  properties: {
                    endpoint: { type: "string", format: "uri" },
                    keys: {
                      type: "object",
                      properties: {
                        p256dh: { type: "string" },
                        auth: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Abonelik kaydedildi" },
            "401": { description: "Yetkisiz erişim" },
          },
        },
      },
      "/api/push/unsubscribe": {
        post: {
          tags: ["Push"],
          summary: "Push bildirim aboneliğini iptal et",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["endpoint"],
                  properties: {
                    endpoint: { type: "string", format: "uri" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Abonelik iptal edildi" },
            "401": { description: "Yetkisiz erişim" },
          },
        },
      },
      "/api/events/{tenantId}": {
        get: {
          tags: ["Events"],
          summary: "Server-Sent Events bağlantısı",
          description: "Gerçek zamanlı servis emri ve randevu güncellemeleri için SSE stream",
          parameters: [
            {
              name: "tenantId",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          responses: {
            "200": {
              description: "SSE stream başladı",
              content: { "text/event-stream": { schema: { type: "string" } } },
            },
            "401": { description: "Yetkisiz erişim" },
            "403": { description: "Tenant erişim reddedildi" },
          },
        },
      },
      "/api/auth/2fa/setup": {
        post: {
          tags: ["Auth"],
          summary: "2FA kurulumu başlat",
          description: "TOTP secret ve QR kod üretir",
          responses: {
            "200": {
              description: "QR kod ve yedek kodlar",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      qrCode: { type: "string", description: "Base64 QR kod data URL" },
                      secret: { type: "string" },
                      backupCodes: { type: "array", items: { type: "string" } },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/auth/2fa/verify": {
        post: {
          tags: ["Auth"],
          summary: "TOTP kodunu doğrula ve 2FA'yı aktif et",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["token"],
                  properties: {
                    token: { type: "string", pattern: "^\\d{6}$" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "2FA aktif edildi" },
            "400": { description: "Geçersiz token" },
          },
        },
      },
      "/api/upload": {
        post: {
          tags: ["Upload"],
          summary: "Dosya yükle",
          description: "Servis emri fotoğrafı yükler (JPEG/PNG/WebP, max 10MB)",
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  properties: {
                    file: { type: "string", format: "binary" },
                    serviceOrderId: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Dosya yüklendi",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      url: { type: "string", format: "uri" },
                      key: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: [],
};

let cachedSpec: object | null = null;

export async function GET() {
  if (!cachedSpec) {
    cachedSpec = swaggerJsdoc(options);
  }
  return NextResponse.json(cachedSpec, {
    headers: { "Cache-Control": "public, max-age=3600" },
  });
}
