import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsIn,
  IsBoolean,
  IsUUID,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateUserDto {
  @IsNotEmpty({ message: i18nValidationMessage('validation.NOT_EMPTY') })
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @MinLength(2, { message: i18nValidationMessage('validation.MIN_LENGTH') })
  @MaxLength(100, { message: i18nValidationMessage('validation.MAX_LENGTH') })
  name: string;

  @IsNotEmpty({ message: i18nValidationMessage('validation.NOT_EMPTY') })
  @IsEmail({}, { message: i18nValidationMessage('validation.INVALID_EMAIL') })
  email: string;

  @IsNotEmpty({ message: i18nValidationMessage('validation.NOT_EMPTY') })
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @MinLength(8, { message: i18nValidationMessage('validation.MIN_LENGTH') })
  password: string;

  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @IsIn(['admin', 'user'], {
    message: i18nValidationMessage('validation.INVALID_ROLE'),
  })
  role?: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @MinLength(2, { message: i18nValidationMessage('validation.MIN_LENGTH') })
  @MaxLength(100, { message: i18nValidationMessage('validation.MAX_LENGTH') })
  name?: string;

  @IsOptional()
  @IsEmail({}, { message: i18nValidationMessage('validation.INVALID_EMAIL') })
  email?: string;

  @IsOptional()
  @IsBoolean({ message: i18nValidationMessage('validation.INVALID_BOOLEAN') })
  isActive?: boolean;

  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @IsIn(['admin', 'user'], {
    message: i18nValidationMessage('validation.INVALID_ROLE'),
  })
  role?: string;
}

export class FindUserByIdDto {
  @IsNotEmpty({ message: i18nValidationMessage('validation.NOT_EMPTY') })
  @IsUUID(4, { message: i18nValidationMessage('validation.INVALID_UUID') })
  id: string;
}

export class DeleteUserDto {
  @IsNotEmpty({ message: i18nValidationMessage('validation.NOT_EMPTY') })
  @IsUUID(4, { message: i18nValidationMessage('validation.INVALID_UUID') })
  id: string;
}
