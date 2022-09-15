import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany
} from 'typeorm';
import { Story, User, CommentReqReport } from '@entities/index';

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

  @OneToMany(() => CommentReqReport, commentReqReport => commentReqReport.storyComment)
  commentReqReports?: CommentReqReport[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp' })
  deletedAt: Date;
}
