import { Gender } from '../entities/user.entity';

export class CreateUserDto {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    bio?: string;
    age: number;
    gender: Gender;
    interestedIn?: Gender;
    interests?: string[];
    photos?: string[];
    city?: string;
    latitude?: number;
    longitude?: number;
}