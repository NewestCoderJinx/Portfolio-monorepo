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

  /** Archived messages are kept but moved out of the inbox. */
  @Column({ default: false })
  archived: boolean;

  /** When the owner last opened a reply to this message; null if never. */
  @Column({ type: 'timestamptz', nullable: true })
  repliedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
