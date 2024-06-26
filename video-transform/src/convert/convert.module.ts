import { Module } from '@nestjs/common';
import { ConvertService } from './convert.service';
import { ConvertController } from './convert.controller';

@Module({
  providers: [ConvertService],
  exports: [ConvertService],
  controllers: [ConvertController],
})
export class ConvertModule {}
