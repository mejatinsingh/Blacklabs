import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { ProfilesService } from '../profiles/profiles.service';
import { UpdateProfileDto } from '../profiles/dto/update-profile.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin')
@Roles('admin')
export class AdminController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('stats')
  getStats() {
    return this.profilesService.getStats();
  }

  @Get('users')
  findAllUsers() {
    return this.profilesService.findAll();
  }

  @Get('users/:id')
  findUser(@Param('id') id: string) {
    return this.profilesService.findById(id);
  }

  @Patch('users/:id')
  updateUser(
    @Param('id') id: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.profilesService.adminUpdate(id, updateProfileDto);
  }

  @Patch('users/:id/deactivate')
  deactivateUser(@Param('id') id: string) {
    return this.profilesService.deactivate(id);
  }

  @Patch('users/:id/activate')
  activateUser(@Param('id') id: string) {
    return this.profilesService.activate(id);
  }

  @Delete('users/:id')
  removeUser(@Param('id') id: string) {
    return this.profilesService.adminRemove(id);
  }
}
