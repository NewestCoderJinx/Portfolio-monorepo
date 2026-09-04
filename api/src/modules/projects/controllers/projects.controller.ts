import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProjectsService } from '../services/projects.service.js';
import { ProjectsDto } from '../dtos/projects.dto.js';
import { Project } from '../entities/projects.entity.js';

@ApiTags('projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all portfolio projects' })
  @ApiResponse({ status: 200, description: 'Return all projects.', type: [Project] })
  findAll() {
    return this.projectsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a project by ID' })
  @ApiResponse({ status: 200, description: 'Return single project.', type: Project })
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new project' })
  @ApiResponse({ status: 201, description: 'Project created successfully.', type: Project })
  create(@Body() createProjectDto: ProjectsDto) {
    return this.projectsService.create(createProjectDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a project' })
  @ApiResponse({ status: 200, description: 'Project deleted successfully.' })
  remove(@Param('id') id: string) {
    return this.projectsService.remove(id);
  }
}