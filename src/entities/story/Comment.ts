import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { Story, User } from '@entities/index';

@Entity()
export class StoryComment extends BaseEntity {
  @PrimaryGeneratedColumn()
  storyCommentIdx: number;

  @Column({ type: 'varchar', length: 500 })
  comment: string;

  @ManyToOne(() => Story, story => story.comments)
  @JoinColumn({ name: 'storyIdx' })
  story: Story;

  @Column()
  storyIdx: number;

  @ManyToOne(() => User, user => user.storyComments)
  @JoinColumn({ name: 'userIdx' })
  user: User;

  @Column()
  userIdx: number;

  @ManyToOne(() => StoryComment, { nullable: true })
  @JoinColumn({ name: 'parentCommentIdx' })
  parentComment: StoryComment;

  @Column({ type: 'number', nullable: true })
  parentCommentIdx: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp' })
  deletedAt: Date;
}
