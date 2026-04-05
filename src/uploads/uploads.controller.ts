import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
  ApiCookieAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { CloudinaryService } from './cloudinary.service';

const VALID_FOLDERS = ['profiles', 'stores', 'reviews'];

@ApiTags('Uploads')
@ApiBearerAuth()
@ApiCookieAuth()
@Controller('uploads')
export class UploadsController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post('image')
  @ApiOperation({ summary: 'Upload a single image to Cloudinary (utility endpoint)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'folder'],
      properties: {
        file: { type: 'string', format: 'binary' },
        folder: {
          type: 'string',
          enum: ['profiles', 'stores', 'reviews'],
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Image uploaded successfully' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowed.includes(file.mimetype)) {
          return cb(
            new BadRequestException('Only jpg, png, and webp images are allowed'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!VALID_FOLDERS.includes(folder)) {
      throw new BadRequestException(
        `folder must be one of: ${VALID_FOLDERS.join(', ')}`,
      );
    }

    const cloudinaryFolder = `street-food/${folder}`;
    const result = await this.cloudinaryService.uploadImage(
      file.buffer,
      file.originalname,
      cloudinaryFolder,
    );

    return {
      message: 'Image uploaded successfully',
      data: result,
    };
  }
}
