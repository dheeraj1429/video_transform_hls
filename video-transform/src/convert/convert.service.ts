import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { exec } from 'child_process';
import { promises as fsPromises } from 'fs';
import * as path from 'path';

@Injectable()
export class ConvertService {
  private readonly logger = new Logger(ConvertService.name);
  private readonly qualities: { resolution: string; bitrate: string }[];

  constructor() {
    this.qualities = [
      { resolution: '1280x720', bitrate: '1500k' },
      { resolution: '854x480', bitrate: '800k' },
      { resolution: '640x360', bitrate: '500k' },
    ];
  }

  private async createDirectory(dir: string): Promise<void> {
    try {
      await fsPromises.mkdir(dir, { recursive: true });
      this.logger.log(`Directory created: ${dir}`);
    } catch (error) {
      this.logger.error(`Failed to create directory: ${error.message}`);
      throw new InternalServerErrorException(
        `Failed to create directory: ${error.message}`,
      );
    }
  }

  private async removeDirectory(dir: string): Promise<void> {
    try {
      await fsPromises.rm(dir, { recursive: true });
      this.logger.log(`Directory removed: ${dir}`);
    } catch (error) {
      this.logger.error(`Failed to remove directory: ${error.message}`);
      throw new InternalServerErrorException(
        `Failed to remove directory: ${error.message}`,
      );
    }
  }

  async videoTransform(
    inputFilePath: string,
    destination: string,
    outputFilePath: string,
  ): Promise<void> {
    if (inputFilePath && destination && outputFilePath) {
      for (let item of this.qualities) {
        const outputPathWithResolution = path.join(
          outputFilePath,
          item.resolution,
        );

        await this.createDirectory(outputPathWithResolution);

        const command = `ffmpeg -i ${inputFilePath} -codec:v libx264 -codec:a aac -vf "scale=${item.resolution}" -b:v ${item.bitrate} -bufsize ${item.bitrate} -maxrate ${item.bitrate} -hls_time 10 -hls_playlist_type vod -hls_segment_filename ${outputPathWithResolution}/segment%03d.ts -start_number 0 ${outputPathWithResolution}/index.m3u8`;

        this.logger.log(`Executing command: ${command}`);

        try {
          exec(command, (error, stdout, stderr) => {
            if (error) {
              throw new InternalServerErrorException(
                `Execution error: ${error.message}`,
              );
            }

            if (stderr) {
              const errorMessages = stderr
                .split('\n')
                .filter((line) => line.toLowerCase().includes('error'));

              if (errorMessages.length > 0) {
                this.logger.error(`ffmpeg errors: ${errorMessages.join('\n')}`);
                throw new InternalServerErrorException(
                  `ffmpeg errors: ${errorMessages.join('\n')}`,
                );
              } else {
                this.logger.warn(`ffmpeg stderr: ${stderr}`);
              }
            }

            try {
              this.logger.log('Segment creation successful.');
              this.logger.log(`Segments output dir ${outputFilePath}`);
              this.logger.log('ready for uploading segments into the cloud');
            } catch (fileError) {
              this.logger.error(`Output files not found: ${fileError.message}`);
              throw new InternalServerErrorException(
                `Output files not found: ${fileError.message}`,
              );
            }

            this.logger.log(`ffmpeg stdout: ${stdout}`);
          });
        } catch (err) {
          throw new InternalServerErrorException(
            `Failed to execute command: ${command}`,
          );
        }
      }
    } else {
      throw new BadRequestException();
    }
  }
}
