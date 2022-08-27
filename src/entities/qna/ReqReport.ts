import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  CreateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { User, Qna } from '@entities/index';
import { ReportReason } from '../common/Enums';

@Entity()
export class QnaReqReport extends BaseEntity {
  @PrimaryGeneratedColumn()
  qnaReqReportIdx: number;

  @Column({ type: 'enum', enum: ReportReason })
  reason: ReportReason;

  @Column({ type: 'varchar', length: 500, nullable: true })
  etcReason!: string;

  @ManyToOne(() => User, user => user.qnaReqReports)
  @JoinColumn({ name: 'userIdx' })
  user: User;

  @ManyToOne(() => Qna, qna => qna.reqReports)
  @JoinColumn({ name: 'qnaIdx' })
  qna: Qna;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
