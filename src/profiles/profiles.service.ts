import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Profile, ProfileDocument } from './schemas/profile.schema';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectModel(Profile.name)
    private profileModel: Model<ProfileDocument>,
  ) {}

  async create(
    auth0Id: string,
    createProfileDto: CreateProfileDto,
  ): Promise<ProfileDocument> {
    const existing = await this.profileModel.findOne({ auth0Id });
    if (existing) {
      throw new ConflictException('Profile already exists for this user');
    }
    return await this.profileModel.create({ ...createProfileDto, auth0Id });
  }

  async findByAuth0Id(auth0Id: string): Promise<ProfileDocument> {
    const profile = await this.profileModel.findOne({ auth0Id });
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    return profile;
  }

  async findById(id: string): Promise<ProfileDocument> {
    const profile = await this.profileModel.findById(id);
    if (!profile) {
      throw new NotFoundException(`Profile with ID ${id} not found`);
    }
    return profile;
  }

  async update(
    auth0Id: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<ProfileDocument> {
    const profile = await this.profileModel.findOneAndUpdate(
      { auth0Id },
      { $set: updateProfileDto },
      { new: true },
    );
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    return profile;
  }

  async remove(auth0Id: string): Promise<void> {
    const result = await this.profileModel.findOneAndDelete({ auth0Id });
    if (!result) {
      throw new NotFoundException('Profile not found');
    }
  }

  // --- Admin methods ---

  async findAll(): Promise<ProfileDocument[]> {
    return await this.profileModel.find();
  }

  async adminUpdate(
    id: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<ProfileDocument> {
    const profile = await this.profileModel.findByIdAndUpdate(
      id,
      { $set: updateProfileDto },
      { new: true },
    );
    if (!profile) {
      throw new NotFoundException(`Profile with ID ${id} not found`);
    }
    return profile;
  }

  async deactivate(id: string): Promise<ProfileDocument> {
    const profile = await this.profileModel.findByIdAndUpdate(
      id,
      { $set: { isActive: false } },
      { new: true },
    );
    if (!profile) {
      throw new NotFoundException(`Profile with ID ${id} not found`);
    }
    return profile;
  }

  async activate(id: string): Promise<ProfileDocument> {
    const profile = await this.profileModel.findByIdAndUpdate(
      id,
      { $set: { isActive: true } },
      { new: true },
    );
    if (!profile) {
      throw new NotFoundException(`Profile with ID ${id} not found`);
    }
    return profile;
  }

  async adminRemove(id: string): Promise<void> {
    const result = await this.profileModel.findByIdAndDelete(id);
    if (!result) {
      throw new NotFoundException(`Profile with ID ${id} not found`);
    }
  }

  async getStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
  }> {
    const [totalUsers, activeUsers, inactiveUsers] = await Promise.all([
      this.profileModel.countDocuments(),
      this.profileModel.countDocuments({ isActive: true }),
      this.profileModel.countDocuments({ isActive: false }),
    ]);
    return { totalUsers, activeUsers, inactiveUsers };
  }
}
