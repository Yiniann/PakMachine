import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const DOWNLOAD_URL_TTL_SECONDS = 10 * 60;

const requiredEnvironment = (key: string) => {
  const value = String(process.env[key] || "").trim();
  if (!value) throw new Error(`缺少 ${key} 配置`);
  return value;
};

export const createClientArtifactDownloadUrl = async (objectKey: string, filename: string) => {
  const accountId = requiredEnvironment("CLIENT_R2_ACCOUNT_ID");
  const accessKeyId = requiredEnvironment("CLIENT_R2_ACCESS_KEY_ID");
  const secretAccessKey = requiredEnvironment("CLIENT_R2_SECRET_ACCESS_KEY");
  const bucket = requiredEnvironment("CLIENT_R2_BUCKET");
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  const dispositionName = encodeURIComponent(filename || "client-package");
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: objectKey,
    ResponseContentDisposition: `attachment; filename*=UTF-8''${dispositionName}`,
  });
  const url = await getSignedUrl(client, command, { expiresIn: DOWNLOAD_URL_TTL_SECONDS });
  return {
    url,
    expiresAt: new Date(Date.now() + DOWNLOAD_URL_TTL_SECONDS * 1000),
  };
};
