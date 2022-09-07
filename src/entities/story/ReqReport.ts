import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  CreateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { User, Story } from '@entities/index';
import { ReportReason } from '../common/Enums';

@Entity()
export class StoryReqReport extends BaseEntity {
  @PrimaryGeneratedColumn()
  storyReqReportIdx: number;

  @Column({ type: 'enum', enum: ReportReason })
  reason: ReportReason;

  @Column({ type: 'varchar', length: 500, nullable: true })
  etcReason!: string;

  @ManyToOne(() => User, user => user.storyReqReports)
  @JoinColumn({ name: 'userIdx' })
  user: User;

  @ManyToOne(() => Story, story => story.reqReports)
  @JoinColumn({ name: 'storyIdx' })
  story: Story;

  @Column()
  storyIdx: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
