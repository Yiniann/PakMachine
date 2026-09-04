import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  createClientBaseR2Client,
  getClientBaseStorageCredentials,
} from "./clientBaseStorageConfigService";

const DOWNLOAD_URL_TTL_SECONDS = 10 * 60;

export const createClientBaseArtifactDownloadUrl = async (objectKey: string, filename: string) => {
  const credentials = getClientBaseStorageCredentials();
  const client: S3Client = createClientBaseR2Client(credentials);
  return createSignedDownloadUrl(client, credentials.bucket, objectKey, filename);
};

export const createClientRuntimeArtifactDownloadUrl = createClientBaseArtifactDownloadUrl;

export const createStoredClientArtifactDownloadUrl = async (
  objectKey: string,
  filename: string,
  buildMode: string | null,
) => buildMode === "client-runtime-package"
  ? createClientRuntimeArtifactDownloadUrl(objectKey, filename)
  : createClientArtifactDownloadUrl(objectKey, filename);

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
  return createSignedDownloadUrl(client, bucket, objectKey, filename);
};

async function createSignedDownloadUrl(client: S3Client, bucket: string, objectKey: string, filename: string) {
  const dispositionName = encodeURIComponent(filename || "client-package");
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: objectKey,
    ResponseContentDisposition: `attachment; filename*=UTF-8''${dispositionName}`,
  });
  try {
    const url = await getSignedUrl(client, command, { expiresIn: DOWNLOAD_URL_TTL_SECONDS });
    return {
      url,
      expiresAt: new Date(Date.now() + DOWNLOAD_URL_TTL_SECONDS * 1000),
    };
  } finally {
    client.destroy();
  }
}

function requiredEnvironment(key: string) {
  const value = String(process.env[key] || "").trim();
  if (!value) {
    const error = new Error(`缺少 ${key} 配置`) as Error & { status?: number };
    error.status = 503;
    throw error;
  }
  return value;
}
