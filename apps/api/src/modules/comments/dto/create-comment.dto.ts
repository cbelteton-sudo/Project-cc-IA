import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
} from 'class-validator';

export enum CommentReferenceType {
  PROJECT = 'PROJECT',
  ACTIVITY = 'ACTIVITY',
  MATERIAL = 'MATERIAL',
  ISSUE = 'ISSUE',
}

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  text: string;

  @IsEnum(CommentReferenceType)
  @IsNotEmpty()
  referenceType: CommentReferenceType;

  @IsString()
  @IsNotEmpty()
  referenceId: string;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mentionedUserIds?: string[];
}
