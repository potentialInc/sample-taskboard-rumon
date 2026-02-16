import {
    DeleteObjectCommand,
    DeleteObjectsCommand,
    GetObjectCommand,
    PutObjectCommand,
    S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Upload } from '@aws-sdk/lib-storage';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { envConfigService } from 'src/config/env-config.service';
import { s3Client } from 'src/config/s3.config';
import { v4 as uuidv4 } from 'uuid';

/**
 * Allowed MIME types for TaskBoard file uploads
 */
const ALLOWED_MIME_TYPES: ReadonlySet<string> = new Set([
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/gif',
    'image/webp',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/msword', // .doc
    'application/vnd.ms-excel', // .xls
    'text/plain',
    'text/csv',
]);

/**
 * Maximum file size in bytes (10 MB)
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Default presigned URL expiration in seconds (1 hour)
 */
const DEFAULT_PRESIGNED_EXPIRY = 3600;

@Injectable()
export class S3Service {
    private readonly logger = new Logger(S3Service.name);
    private s3: S3Client;
    private bucketName: string;
    private region: string;

    constructor() {
        this.s3 = s3Client;
        this.bucketName = envConfigService.getAwsConfig().AWS_S3_BUCKET;
        this.region = envConfigService.getAwsConfig().AWS_REGION;
    }

    /**
     * Validate file before upload
     * @throws BadRequestException if file is invalid
     */
    private validateFile(file: Express.Multer.File): void {
        if (!file || !file.buffer) {
            throw new BadRequestException('Invalid file: file buffer is empty');
        }

        if (file.size > MAX_FILE_SIZE) {
            throw new BadRequestException(
                `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB. Received: ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
            );
        }

        if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
            throw new BadRequestException(
                `Invalid file type: ${file.mimetype}. Allowed types: PDF, PNG, JPG, GIF, WebP, DOCX, XLSX, DOC, XLS, TXT, CSV`,
            );
        }
    }

    /**
     * Sanitize filename by removing special characters
     */
    private sanitizeFilename(originalname: string): string {
        return originalname
            .replace(/[^a-zA-Z0-9._-]/g, '_')
            .replace(/_{2,}/g, '_');
    }

    /**
     * Upload a single file to S3 with validation
     * @param file - Multer file object
     * @param folder - S3 subfolder (e.g., 'attachments', 'profile-photos')
     * @returns S3 key (not full URL, for security)
     */
    async uploadFile(
        file: Express.Multer.File,
        folder: string = 'uploads',
    ): Promise<string> {
        this.validateFile(file);

        const sanitizedName = this.sanitizeFilename(file.originalname);
        const key = `taskboard/${folder}/${Date.now()}-${uuidv4()}-${sanitizedName}`;

        try {
            const upload = new Upload({
                client: this.s3,
                params: {
                    Bucket: this.bucketName,
                    Key: key,
                    Body: file.buffer,
                    ContentType: file.mimetype,
                    // Server-side encryption
                    ServerSideEncryption: 'AES256',
                },
            });

            await upload.done();

            this.logger.log(
                `File uploaded successfully: ${key} (${(file.size / 1024).toFixed(1)}KB)`,
            );

            return key;
        } catch (error) {
            this.logger.error(`Failed to upload file to S3: ${error.message}`);
            throw new BadRequestException(
                `Failed to upload file: ${error.message}`,
            );
        }
    }

    /**
     * Upload multiple files to S3
     * @param files - Array of Multer file objects
     * @param folder - S3 subfolder
     * @returns Array of S3 keys
     */
    async uploadMultipleFiles(
        files: Express.Multer.File[],
        folder: string = 'uploads',
    ): Promise<string[]> {
        if (!files || files.length === 0) {
            throw new BadRequestException('No files provided for upload');
        }

        // Validate all files first before uploading any
        for (const file of files) {
            this.validateFile(file);
        }

        const uploadPromises = files.map((file) =>
            this.uploadFile(file, folder),
        );
        return Promise.all(uploadPromises);
    }

    /**
     * Generate a presigned URL for secure file download
     * @param key - S3 object key
     * @param expiresIn - URL expiration in seconds (default: 1 hour)
     * @returns Presigned download URL
     */
    async getPresignedUrl(
        key: string,
        expiresIn: number = DEFAULT_PRESIGNED_EXPIRY,
    ): Promise<string> {
        try {
            const command = new GetObjectCommand({
                Bucket: this.bucketName,
                Key: key,
            });

            const url = await getSignedUrl(this.s3, command, { expiresIn });

            this.logger.debug(
                `Presigned URL generated for key: ${key} (expires in ${expiresIn}s)`,
            );

            return url;
        } catch (error) {
            this.logger.error(
                `Failed to generate presigned URL for key ${key}: ${error.message}`,
            );
            throw new BadRequestException(
                `Failed to generate download URL: ${error.message}`,
            );
        }
    }

    /**
     * Generate a presigned URL for secure file upload (direct-to-S3)
     * Allows frontend to upload directly to S3 without passing through backend
     * @param key - Desired S3 object key
     * @param contentType - Expected content type
     * @param expiresIn - URL expiration in seconds (default: 15 minutes)
     * @returns Presigned upload URL
     */
    async getPresignedUploadUrl(
        key: string,
        contentType: string,
        expiresIn: number = 900,
    ): Promise<string> {
        try {
            const command = new PutObjectCommand({
                Bucket: this.bucketName,
                Key: key,
                ContentType: contentType,
                ServerSideEncryption: 'AES256',
            });

            const url = await getSignedUrl(this.s3, command, { expiresIn });

            this.logger.debug(`Presigned upload URL generated for key: ${key}`);

            return url;
        } catch (error) {
            this.logger.error(
                `Failed to generate presigned upload URL: ${error.message}`,
            );
            throw new BadRequestException(
                `Failed to generate upload URL: ${error.message}`,
            );
        }
    }

    /**
     * Delete a single file from S3
     * @param key - S3 object key (or full URL, which will be parsed)
     */
    async deleteFile(key: string): Promise<void> {
        const resolvedKey = this.resolveKey(key);

        try {
            const command = new DeleteObjectCommand({
                Bucket: this.bucketName,
                Key: resolvedKey,
            });

            await this.s3.send(command);

            this.logger.log(`File deleted from S3: ${resolvedKey}`);
        } catch (error) {
            this.logger.error(
                `Failed to delete file from S3: ${error.message}`,
            );
            throw new BadRequestException(
                `Failed to delete file: ${error.message}`,
            );
        }
    }

    /**
     * Delete multiple files from S3
     * @param keys - Array of S3 object keys (or full URLs)
     */
    async deleteMultipleFiles(keys: string[]): Promise<void> {
        if (!keys || keys.length === 0) {
            throw new BadRequestException('No files provided for deletion');
        }

        try {
            const command = new DeleteObjectsCommand({
                Bucket: this.bucketName,
                Delete: {
                    Objects: keys.map((key) => ({
                        Key: this.resolveKey(key),
                    })),
                },
            });

            await this.s3.send(command);

            this.logger.log(`${keys.length} files deleted from S3`);
        } catch (error) {
            this.logger.error(
                `Failed to delete multiple files from S3: ${error.message}`,
            );
            throw new BadRequestException(
                `Failed to delete files: ${error.message}`,
            );
        }
    }

    /**
     * Get the full public URL for an S3 object
     * Note: Only use this if the bucket has public read access configured
     * For private files, use getPresignedUrl() instead
     */
    getPublicUrl(key: string): string {
        return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
    }

    /**
     * Resolve a key from either a full URL or a plain key
     * Supports both formats for backward compatibility
     */
    private resolveKey(keyOrUrl: string): string {
        if (keyOrUrl.includes('.amazonaws.com/')) {
            return keyOrUrl.split('.amazonaws.com/')[1];
        }
        return keyOrUrl;
    }
}
