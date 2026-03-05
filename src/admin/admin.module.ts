import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { ProfilesModule } from '../profiles/profiles.module';

@Module({
  imports: [ProfilesModule],
  controllers: [AdminController],
})
export class AdminModule {}
