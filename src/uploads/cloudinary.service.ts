import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { cloudinary, configureCloudinary } from '../config/cloudinary.config';
import * as streamifier from 'streamifier';

export interface CloudinaryUploadResult {
  url: string;
  public_id: string;
}

@Injectable()
export class CloudinaryService {
  constructor() {
    configureCloudinary();
  }

  async uploadImage(
    buffer: Buffer,
    originalname: string,
    folder: string,
  ): Promise<CloudinaryUploadResult> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          use_filename: false,
          unique_filename: true,
        },
        (error, result) => {
          if (error || !result) {
            reject(
              new InternalServerErrorException(
                'Failed to upload image to Cloudinary',
              ),
            );
            return;
          }
          resolve({
            url: result.secure_url,
            public_id: result.public_id,
          });
        },
      );

      streamifier.createReadStream(buffer).pipe(uploadStream);
    });
  }

  async deleteImage(public_id: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(public_id);
    } catch {
      // Log but don't throw — deletion failures shouldn't break the main flow
    }
  }

  async uploadMany(
    files: Express.Multer.File[],
    folder: string,
  ): Promise<CloudinaryUploadResult[]> {
    return Promise.all(
      files.map((file) =>
        this.uploadImage(file.buffer, file.originalname, folder),
      ),
    );
  }
}
