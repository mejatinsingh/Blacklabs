import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
} from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Post()
  create(
    @CurrentUser('sub') auth0Id: string,
    @Body() createProfileDto: CreateProfileDto,
  ) {
    return this.profilesService.create(auth0Id, createProfileDto);
  }

  @Get('me')
  findMe(@CurrentUser('sub') auth0Id: string) {
    return this.profilesService.findByAuth0Id(auth0Id);
  }

  @Patch('me')
  updateMe(
    @CurrentUser('sub') auth0Id: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.profilesService.update(auth0Id, updateProfileDto);
  }

  @Delete('me')
  removeMe(@CurrentUser('sub') auth0Id: string) {
    return this.profilesService.remove(auth0Id);
  }
}
