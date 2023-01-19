import {
  Entity,
  PrimaryGeneratedColumn,
  BaseEntity,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Column
} from 'typeorm';
import { User, Qna } from '@entities/index';

@Entity()
export class QnaLike extends BaseEntity {
  @PrimaryGeneratedColumn()
  qnaLikeIdx: number;

  @ManyToOne(() => User, user => user.qna)
  @JoinColumn({ name: 'userIdx' })
  user: User;

  @Column()
  userIdx: number;

  @ManyToOne(() => Qna, qna => qna.likes)
  @JoinColumn({ name: 'qnaIdx' })
  qna: Qna;

  @Column()
  qnaIdx: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
