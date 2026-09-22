export class CreateProjectDto {
  title: string;
  description?: string;
  imageUrl?: string;
  tags?: string[];
  githubUrl?: string;
  demoUrl?: string;
}