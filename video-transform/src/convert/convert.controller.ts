import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { promises as fsPromises } from 'fs';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ConvertService } from './convert.service';

@Controller('convert')
export class ConvertController {
  constructor(protected readonly convertService: ConvertService) {}

  @Post('/')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: async (req, file, cb) => {
          const uniqueId = uuidv4();
          const destinationPath = `/home/app/inputs/${uniqueId}`;
          await fsPromises.mkdir(destinationPath, { recursive: true });
          (file as Express.Multer.File & { file_uuid: string }).file_uuid =
            uniqueId;
          cb(null, destinationPath);
        },
        filename: (req, file, cb) => {
          cb(null, `input${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async videoTransform(
    @UploadedFile() file: Express.Multer.File & { file_uuid: string },
  ) {
    const { file_uuid } = file;
    const destination = file.destination;
    const inputFilePath = file.path;
    const outputFilePath: string = `/home/app/outputs/${file_uuid}/`;

    return this.convertService.videoTransform(
      inputFilePath,
      destination,
      outputFilePath,
    );
  }
}
