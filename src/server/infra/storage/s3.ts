import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import path from "path";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

let s3ClientInstance: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3ClientInstance) {
    const accessKeyId = process.env.S3_ACCESS_KEY;
    const secretAccessKey = process.env.S3_SECRET_KEY;

    if (!accessKeyId || !secretAccessKey) {
      throw new Error("S3 credentials (S3_ACCESS_KEY and S3_SECRET_KEY) are not configured. Please set them in the environment variables.");
    }

    s3ClientInstance = new S3Client({
      endpoint: process.env.S3_ENDPOINT,
      region: process.env.S3_REGION || "us-east-1",
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true,
    });
  }
  return s3ClientInstance;
}

export class S3Service {
  private defaultBucket = process.env.S3_BUCKET || "serrinha-uploads";
  private publicBaseUrl = process.env.S3_PUBLIC_BASE_URL;

  async uploadFile(file: Express.Multer.File, options?: { bucket?: string, prefix?: string }): Promise<string> {
    const bucket = options?.bucket || this.defaultBucket;
    const prefix = options?.prefix || "issues";
    const fileExtension = path.extname(file.originalname);
    const fileName = `${crypto.randomUUID()}${fileExtension}`;
    const key = `${prefix}/${fileName}`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await getS3Client().send(command);
    return key;
  }

  async getFileUrl(key: string | null | undefined, bucket?: string): Promise<string | null> {
    if (!key) return null;
    
    // If it's already a full URL, return it (compatibility)
    if (key.startsWith('http')) return key;

    try {
      const command = new GetObjectCommand({
        Bucket: bucket || this.defaultBucket,
        Key: key,
      });

      // We'll default to signed URL for security/reliability.
      return await getSignedUrl(getS3Client(), command, { expiresIn: 3600 * 24 }); // 24 hours
    } catch (error) {
      console.error("Error generating signed URL:", error);
      if (this.publicBaseUrl) {
        return `${this.publicBaseUrl}/${key}`;
      }
      return key;
    }
  }

  async deleteFile(key: string, bucket?: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: bucket || this.defaultBucket,
        Key: key,
      });
      await getS3Client().send(command);
    } catch (error) {
      console.error("Error deleting file from S3:", error);
    }
  }
}
