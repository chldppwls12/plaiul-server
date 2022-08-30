import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany
} from 'typeorm';
import { Story, StoryReqReport, StoryLike, Qna, QnaLike, QnaReqReport, Tip } from '@entities/index';
import { LoginType } from './../common/Enums';

@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  userIdx: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  nickname: string;

  @Column({ type: 'text' })
  password: string;

  @Column({ type: 'text' })
  iv: string;

  @Column({ type: 'text' })
  salt: string;

  @Column({ type: 'enum', enum: LoginType, default: LoginType.LOCAL })
  loginType: LoginType;

  @Column({ type: 'varchar', length: 150, nullable: true })
  socialToken!: string;

  @OneToMany(() => Story, story => story.user)
  stories!: Story[];

  @OneToMany(() => StoryReqReport, storyReqReport => storyReqReport.user)
  storyReqReports!: StoryReqReport[];

  @OneToMany(() => StoryLike, storyLike => storyLike.user)
  storyLikes!: StoryLike[];

  @OneToMany(() => Qna, qna => qna.user)
  qna!: Qna[];

  @OneToMany(() => QnaReqReport, qnaReqReport => qnaReqReport.user)
  qnaReqReports!: QnaReqReport[];

  @OneToMany(() => QnaLike, qnaLike => qnaLike.user)
  qnaLikes!: QnaLike[];

  @OneToMany(() => Tip, tip => tip.user)
  tips!: Tip[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp' })
  deletedAt: Date;
}
