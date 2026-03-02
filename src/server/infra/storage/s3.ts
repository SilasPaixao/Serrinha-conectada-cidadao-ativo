import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import path from "path";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || "",
    secretAccessKey: process.env.S3_SECRET_KEY || "",
  },
  forcePathStyle: true,
});

export class S3Service {
  private bucket = process.env.S3_BUCKET || "serrinha-uploads";
  private publicBaseUrl = process.env.S3_PUBLIC_BASE_URL;

  async uploadFile(file: Express.Multer.File): Promise<string> {
    const fileExtension = path.extname(file.originalname);
    const fileName = `${crypto.randomUUID()}${fileExtension}`;
    const key = `issues/${fileName}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await s3Client.send(command);
    return key;
  }

  async getFileUrl(key: string | null | undefined): Promise<string | null> {
    if (!key) return null;
    
    // If it's already a full URL, return it (compatibility)
    if (key.startsWith('http')) return key;

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      // We'll default to signed URL for security/reliability.
      return await getSignedUrl(s3Client, command, { expiresIn: 3600 * 24 }); // 24 hours
    } catch (error) {
      console.error("Error generating signed URL:", error);
      if (this.publicBaseUrl) {
        return `${this.publicBaseUrl}/${key}`;
      }
      return key;
    }
  }
}
