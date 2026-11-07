import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

/** A message sent through the public contact form. */
@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 200 })
  email: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ default: false })
  read: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
