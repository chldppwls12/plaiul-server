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
import { Qna } from '@entities/index';

@Entity()
export class QnaComment extends BaseEntity {
  @PrimaryGeneratedColumn()
  qnaCommentIdx: number;

  @Column({ type: 'varchar', length: 500 })
  comment: string;

  @ManyToOne(() => Qna, qna => qna.comments)
  @JoinColumn({ name: 'qnaIdx' })
  qna: Qna;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp' })
  deletedAt: Date;
}
