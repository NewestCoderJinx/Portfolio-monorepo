import { Body, Controller, Delete, Get, Param, Post, Patch, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProjectsService } from '../services/projects.service.js';
import { Project } from '../entities/projects.entity.js';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  // PUBLIC ACCESS
  @Get()
  findAll() {
    return this.projectsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a project by ID' })
  @ApiResponse({ status: 200, description: 'Return single project.', type: Project })
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  // PROTECTED (Requires valid JWT)
  @UseGuards(AuthGuard('jwt'))
  @Post()
  @ApiOperation({ summary: 'Create a new project' })
  @ApiResponse({ status: 201, description: 'Project created successfully.', type: Project })
  create(@Body() dto: any) {
    return this.projectsService.create(dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.projectsService.update(id, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a project' })
  @ApiResponse({ status: 200, description: 'Project deleted successfully.' })
  remove(@Param('id') id: string) {
    return this.projectsService.remove(id);
  }
}