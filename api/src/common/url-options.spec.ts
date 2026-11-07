import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { UpdateProfileDto } from '../profile/dto/update-profile.dto';
import { CreateProjectDto, GALLERY_MAX } from '../projects/dto/create-project.dto';

const errorsFor = async <T extends object>(cls: new () => T, data: object) =>
  (await validate(plainToInstance(cls, data))).map((e) => e.property);

describe('URL validation for uploaded files', () => {
  it('accepts local dev upload URLs on the profile', async () => {
    expect(await errorsFor(UpdateProfileDto, { resumeUrl: 'http://localhost:3000/uploads/cv.pdf', avatarUrl: 'http://localhost:3000/uploads/me.png' })).toEqual([]);
  });

  it('still rejects links without a protocol or with spaces', async () => {
    expect(await errorsFor(UpdateProfileDto, { resumeUrl: 'example.com/cv.pdf' })).toEqual(['resumeUrl']);
    expect(await errorsFor(UpdateProfileDto, { githubUrl: 'https://not a url' })).toEqual(['githubUrl']);
  });

  it('validates project gallery entries and their count', async () => {
    expect(await errorsFor(CreateProjectDto, { title: 'x', gallery: ['http://localhost:3000/uploads/a.png'] })).toEqual([]);
    expect(await errorsFor(CreateProjectDto, { title: 'x', gallery: ['not-a-url'] })).toEqual(['gallery']);
    const tooMany = Array.from({ length: GALLERY_MAX + 1 }, (_, i) => `https://cdn.example.com/${i}.png`);
    expect(await errorsFor(CreateProjectDto, { title: 'x', gallery: tooMany })).toEqual(['gallery']);
  });
});
