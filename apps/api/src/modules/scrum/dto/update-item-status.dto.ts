import { IsEnum } from 'class-validator';

export enum BoardStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  IN_REVIEW = 'IN_REVIEW',
  DONE = 'DONE',
  BLOCKED = 'BLOCKED',
}

export class UpdateItemStatusDto {
  @IsEnum(BoardStatus)
  status: string;
}
