import {
  Entity,
  PrimaryGeneratedColumn,
  BaseEntity,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Column
} from 'typeorm';
import { User, Story } from '@entities/index';

@Entity()
export class StoryLike extends BaseEntity {
  @PrimaryGeneratedColumn()
  storyLikeIdx: number;

  @ManyToOne(() => User, user => user.storyLikes)
  @JoinColumn({ name: 'userIdx' })
  user: User;

  @Column()
  userIdx: number;

  @ManyToOne(() => Story, story => story.likes)
  @JoinColumn({ name: 'storyIdx' })
  story: Story;

  @Column()
  storyIdx: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
