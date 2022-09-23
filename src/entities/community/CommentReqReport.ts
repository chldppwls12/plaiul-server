import { Entity, PrimaryGeneratedColumn, BaseEntity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User, StoryComment, QnaComment } from '@entities/index';
import { ReportReason } from '../common/Enums';

@Entity()
export class CommentReqReport extends BaseEntity {
  @PrimaryGeneratedColumn()
  commentReqReportIdx: number;

  @ManyToOne(() => StoryComment, storyComment => storyComment.commentReqReports, { nullable: true })
  @JoinColumn({ name: 'storyCommentIdx' })
  storyComment?: StoryComment;

  @Column({ nullable: true })
  storyCommentIdx?: number;

  @ManyToOne(() => QnaComment, qnaComment => qnaComment.commentReqReports, { nullable: true })
  @JoinColumn({ name: 'qnaCommentIdx' })
  qnaComment?: number;

  @Column({ nullable: true })
  qnaCommentIdx?: number;

  @ManyToOne(() => User, user => user.commentReqReports)
  @JoinColumn({ name: 'userIdx' })
  user: User;

  @Column()
  userIdx: number;

  @Column({ type: 'enum', enum: ReportReason })
  reason: ReportReason;

  @Column({ type: 'varchar', length: 500, nullable: true })
  etcReason!: string;
}
