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
import { User, QnaComment, QnaLike, QnaReqReport } from '@entities/index';

@Entity()
export class Qna extends BaseEntity {
  @PrimaryGeneratedColumn()
  qnaIdx: number;

  @Column({ type: 'varchar', length: 100 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @ManyToOne(() => User, user => user.qna)
  @JoinColumn({ name: 'userIdx' })
  user: User;

  @OneToMany(() => QnaLike, qnaLike => qnaLike.qna)
  likes!: QnaLike[];

  @OneToMany(() => QnaComment, qnaComment => qnaComment.qna)
  comments!: QnaComment[];

  @OneToMany(() => QnaReqReport, qnaReqReport => qnaReqReport.qna)
  reqReports!: QnaReqReport[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp' })
  deletedAt: Date;
}
