import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProjectsDto {
  @ApiProperty({
    example: 'Portfolio Website',
    description: 'The title of the project',
  })
  title: string;

  @ApiPropertyOptional({
    example: 'Full-stack monorepo built with NestJS and React.',
    description: 'Detailed description of the project',
  })
  description?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/thumbnail.png',
    description: 'Thumbnail image URL',
  })
  imageUrl?: string;
}