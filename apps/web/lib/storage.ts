/**
 * Dosya Depolama Servisi — AWS S3 / Cloudflare R2 entegrasyonu
 * Ortam değişkenleri: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_S3_BUCKET
 */

export async function uploadFile(
  file: Buffer,
  key: string,
  contentType: string
): Promise<{ url: string; key: string }> {
  const bucket = process.env.AWS_S3_BUCKET;
  const region = process.env.AWS_REGION ?? "eu-central-1";
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!bucket || !accessKeyId || !secretAccessKey) {
    // Geliştirme ortamında simüle et
    console.warn("[STORAGE] AWS env değişkenleri eksik — yükleme simüle edildi:", key);
    const fakeUrl = `/uploads/${key}`;
    return { url: fakeUrl, key };
  }

  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
  const client = new S3Client({ region, credentials: { accessKeyId, secretAccessKey } });

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file,
      ContentType: contentType,
    })
  );

  const url = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
  return { url, key };
}

export async function deleteFile(key: string): Promise<void> {
  const bucket = process.env.AWS_S3_BUCKET;
  const region = process.env.AWS_REGION ?? "eu-central-1";
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!bucket || !accessKeyId || !secretAccessKey) {
    console.warn("[STORAGE] AWS env değişkenleri eksik — silme simüle edildi:", key);
    return;
  }

  const { S3Client, DeleteObjectCommand } = await import("@aws-sdk/client-s3");
  const client = new S3Client({ region, credentials: { accessKeyId, secretAccessKey } });

  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

export function getPublicUrl(key: string): string {
  const bucket = process.env.AWS_S3_BUCKET;
  const region = process.env.AWS_REGION ?? "eu-central-1";
  if (!bucket) return `/uploads/${key}`;
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

/**
 * S3 nesnesi için geçici imzalı (presigned) URL oluşturur.
 *
 * @param key        - S3 nesne anahtarı (örn. "invoices/tenant-id/2025-0001.pdf")
 * @param expiresIn  - Geçerlilik süresi saniye cinsinden (varsayılan: 3600 = 1 saat)
 * @returns Presigned URL string'i
 */
export async function getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
  const bucket = process.env.AWS_S3_BUCKET;
  const region = process.env.AWS_REGION ?? "eu-central-1";
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!bucket || !accessKeyId || !secretAccessKey) {
    // Geliştirme ortamında simüle et
    console.warn("[STORAGE] AWS env değişkenleri eksik — presigned URL simüle edildi:", key);
    return `/uploads/${key}`;
  }

  try {
    // @aws-sdk/s3-request-presigner dinamik olarak yüklenir
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { S3Client, GetObjectCommand } = await import("@aws-sdk/client-s3");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const presignerModule = await import("@aws-sdk/s3-request-presigner" as string);
    const awsGetSignedUrl = presignerModule.getSignedUrl as (
      client: InstanceType<typeof S3Client>,
      command: InstanceType<typeof GetObjectCommand>,
      options: { expiresIn: number }
    ) => Promise<string>;

    const client = new S3Client({ region, credentials: { accessKeyId, secretAccessKey } });
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });

    return awsGetSignedUrl(client, command, { expiresIn });
  } catch {
    // Presigner paketi yüklü değilse public URL döndür
    console.warn("[STORAGE] s3-request-presigner yüklenemedi — public URL kullanılıyor:", key);
    return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
  }
}
