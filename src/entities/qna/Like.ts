import {
  Entity,
  PrimaryGeneratedColumn,
  BaseEntity,
  CreateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { User, Qna } from '@entities/index';

@Entity()
export class QnaLike extends BaseEntity {
  @PrimaryGeneratedColumn()
  qnaLikeIdx: number;

  @ManyToOne(() => User, user => user.qna)
  @JoinColumn({ name: 'userIdx' })
  user: User;

  @ManyToOne(() => Qna, qna => qna.likes)
  @JoinColumn({ name: 'qnaIdx' })
  qna: Qna;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
