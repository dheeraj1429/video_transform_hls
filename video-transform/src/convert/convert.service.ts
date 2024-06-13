import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { spawn } from 'child_process';
import { promises as fsPromises } from 'fs';
import * as path from 'path';

@Injectable()
export class ConvertService {
  private readonly logger = new Logger(ConvertService.name);
  private readonly qualities: { resolution: string; bitrate: string }[];

  constructor() {
    this.qualities = [
      { resolution: '1280x720', bitrate: '1500k' },
      // { resolution: '854x480', bitrate: '800k' },
      // { resolution: '640x360', bitrate: '500k' },
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

  async videoTransform(
    outputFilePath: string,
    file: Express.Multer.File,
  ): Promise<void> {
    for (let item of this.qualities) {
      const outputPathWithResolution = path.join(
        outputFilePath,
        item.resolution,
      );

      await this.createDirectory(outputPathWithResolution);

      const args = [
        '-i',
        'pipe:0',
        '-codec:v',
        'libx264',
        '-codec:a',
        'aac',
        '-vf',
        `scale=${item.resolution}`,
        '-b:v',
        item.bitrate,
        '-bufsize',
        item.bitrate,
        '-maxrate',
        item.bitrate,
        '-hls_time',
        '10',
        '-hls_playlist_type',
        'vod',
        `-hls_segment_filename`,
        path.join(outputPathWithResolution, 'segment%03d.ts'),
        '-start_number',
        '0',
        path.join(outputPathWithResolution, 'index.m3u8'),
      ];

      const ffmpeg = spawn('ffmpeg', args);
      let ffmpegStderr = '';

      ffmpeg.stdout.on('data', (data) => {
        this.logger.log(`stdout: ${data}`);
      });

      ffmpeg.stderr.on('data', (data) => {
        ffmpegStderr += data.toString();
        this.logger.log(`stderr: ${data}`);
      });

      ffmpeg.on('close', (code: number) => {
        if (code === 0) {
          this.logger.log('Video segment ended successfully');
        } else {
          throw new InternalServerErrorException(
            `ffmpeg process exited with code ${code}. Errors: ${ffmpegStderr}`,
          );
        }
      });

      ffmpeg.on('error', (err) => {
        this.logger.error(err);
      });

      ffmpeg.stdin.write(file.buffer);
      ffmpeg.stdin.end();
    }
  }
}
