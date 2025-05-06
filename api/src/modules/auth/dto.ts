import { IsEmail, Length, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail() email: string;
  @MinLength(6) password: string;
  @Length(2, 50) name: string;
}

export class LoginDto {
  @IsEmail() email: string;
  @MinLength(6) password: string;
}
