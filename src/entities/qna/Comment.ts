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
import { Qna, User, CommentReqReport } from '@entities/index';

@Entity()
export class QnaComment extends BaseEntity {
  @PrimaryGeneratedColumn()
  qnaCommentIdx: number;

  @Column({ type: 'varchar', length: 500 })
  comment: string;

  @ManyToOne(() => Qna, qna => qna.comments)
  @JoinColumn({ name: 'qnaIdx' })
  qna: Qna;

  @Column()
  qnaIdx: number;

  @ManyToOne(() => User, user => user.qnaComments)
  @JoinColumn({ name: 'userIdx' })
  user: User;

  @Column()
  userIdx: number;

  @ManyToOne(() => QnaComment, { nullable: true })
  @JoinColumn({ name: 'parentCommentIdx' })
  parentComment: QnaComment;

  @Column({ type: 'number', nullable: true })
  parentCommentIdx: number;

  @OneToMany(() => CommentReqReport, commentReqReport => commentReqReport.qnaComment)
  commentReqReports?: CommentReqReport[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp' })
  deletedAt: Date;
}
