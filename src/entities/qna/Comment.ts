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
import { Qna, User } from '@entities/index';

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

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp' })
  deletedAt: Date;
}
