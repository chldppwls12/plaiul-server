import {
  Entity,
  PrimaryGeneratedColumn,
  BaseEntity,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Column
} from 'typeorm';
import { User, Tip } from '@entities/index';

@Entity()
export class TipLike extends BaseEntity {
  @PrimaryGeneratedColumn()
  tipLikeIdx: number;

  @ManyToOne(() => User, user => user.storyLikes)
  @JoinColumn({ name: 'userIdx' })
  user: User;

  @Column()
  userIdx: number;

  @ManyToOne(() => Tip, tip => tip.likes)
  @JoinColumn({ name: 'tipIdx' })
  tip: Tip;

  @Column()
  tipIdx: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
