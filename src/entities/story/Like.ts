import {
  Entity,
  PrimaryGeneratedColumn,
  BaseEntity,
  CreateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { User, Story } from '@entities/index';

@Entity()
export class StoryLike extends BaseEntity {
  @PrimaryGeneratedColumn()
  storyLikeIdx: number;

  @ManyToOne(() => User, user => user.storyLikes)
  @JoinColumn({ name: 'userIdx' })
  user: User;

  @ManyToOne(() => Story, story => story.likes)
  story: Story;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
