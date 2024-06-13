import {
  Controller,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { v4 as uuidv4 } from 'uuid';
import { ConvertService } from './convert.service';

@Controller('convert')
export class ConvertController {
  constructor(protected readonly convertService: ConvertService) {}

  @Post('/')
  @UseInterceptors(FileInterceptor('file'))
  async videoTransform(@UploadedFile() file: Express.Multer.File) {
    const UPLOAD_VIDEO_BUNDLE_ID = uuidv4();
    const outputFilePath: string = `/home/app/outputs/${UPLOAD_VIDEO_BUNDLE_ID}`;

    return this.convertService.videoTransform(outputFilePath, file);
  }
}
