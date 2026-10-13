import { DataSource } from 'typeorm';
import { Project } from './projects/entities/project.entity';
// Inside runSeed() after initializing AppDataSource:
const profileRepo = AppDataSource.getRepository(Profile);

const existingProfile = await profileRepo.findOne({ where: {} });
if (!existingProfile) {
  const defaultProfile = profileRepo.create({
    name: 'Alonnah',
    headline: 'Full-Stack Software Engineer & Systems Architect',
    bio: 'Passionate software engineer specializing in NestJS, React, and cloud-native infrastructure.',
    location: 'Remote / Available Worldwide',
    githubUrl: 'https://github.com/alonnah',
    linkedinUrl: 'https://linkedin.com/in/alonnah',
  });
  await profileRepo.save(defaultProfile);
  console.log('Default developer profile seeded successfully!');
}
const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  username: process.env.POSTGRES_USER || 'portfolio',
  password: process.env.POSTGRES_PASSWORD || 'development-password',
  database: process.env.POSTGRES_DB || 'portfolio',
  entities: [Project],
  synchronize: true,
});

async function runSeed() {
  try {
    console.log('Initializing database connection for seeding...');
    await AppDataSource.initialize();

    const projectRepo = AppDataSource.getRepository(Project);

    // Clear existing records to ensure clean state
    await projectRepo.clear();

    const sampleProjects: Partial<Project>[] = [
      {
        title: 'Microservices Order Processing Engine',
        description:
          'Distributed order processing system utilizing event-driven architecture and asynchronous message queues.',
        problem:
          'Monolithic transaction handling was experiencing tight coupling and failing under peak load during high-volume sales events.',
        solution:
          'Decoupled order placement into asynchronous microservices managed via RabbitMQ and NestJS event emitters with transactional outbox patterns.',
        challenges:
          'Ensuring data consistency across distributed database instances without implementing heavy distributed locking mechanisms.',
        decisions:
          'Selected NestJS for structured modular architecture and PostgreSQL with row-level locks for critical ledger states.',
        lessonsLearned:
          'Idempotency keys are mandatory for all event-driven consumers to prevent duplicate processing on retry failures.',
        tags: ['NestJS', 'PostgreSQL', 'Docker', 'Microservices', 'TypeScript'],
        githubUrl: 'https://github.com/example/order-processing-engine',
        demoUrl: 'https://order-engine-demo.example.com',
      },
      {
        title: 'Enterprise Evidence & Portfolio Platform',
        description:
          'Full-stack platform demonstrating developer competency through structured case studies and verifiable project evidence.',
        problem:
          'Static resume sites fail to provide actionable context regarding technical trade-offs, architecture, or problem-solving approaches.',
        solution:
          'Built a relational platform with NestJS, PostgreSQL, React, and Chakra UI to display real-time metrics, code links, and architectural decisions.',
        challenges:
          'Designing an adaptable database schema capable of handling modular case studies without over-complicating query execution.',
        decisions:
          'Utilized TypeORM simple-array columns for fast tag indexing and implemented isolated global exception filters for sanitized production responses.',
        lessonsLearned:
          'Separating presentation views into public showcase modals and authenticated admin workspaces provides clean architectural boundaries.',
        tags: ['React', 'NestJS', 'PostgreSQL', 'TypeORM', 'Chakra UI', 'Docker'],
        githubUrl: 'https://github.com/example/portfolio-monorepo',
        demoUrl: 'https://portfolio.example.com',
      },
      {
        title: 'Real-Time Health Monitoring Dashboard',
        description:
          'Operational metrics dashboard presenting service health, container uptime, and system logs in real time.',
        problem:
          'Operations teams lacked a unified view of Docker container statuses across internal staging environments.',
        solution:
          'Engineered a lightweight WebSocket ingestion service that streams container health stats directly to a React frontend.',
        challenges:
          'Handling continuous high-frequency telemetry streams without causing high CPU usage in client browser tabs.',
        decisions:
          'Implemented client-side data throttling and selective re-rendering via React state optimization.',
        lessonsLearned:
          'WebSockets require automatic reconnection algorithms and heartbeat signals to handle temporary network disconnections smoothly.',
        tags: ['TypeScript', 'React', 'WebSockets', 'Docker', 'Nginx'],
        githubUrl: 'https://github.com/example/health-monitor',
        demoUrl: 'https://health.example.com',
      },
    ];

    for (const projectData of sampleProjects) {
      const project = projectRepo.create(projectData);
      await projectRepo.save(project);
    }

    console.log('Database seeding completed successfully! 3 sample case studies created.');
  } catch (error) {
    console.error('Error during database seeding:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

runSeed();