import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import {
  User,
  StoryComment,
  StoryTag,
  StoryImage,
  StoryLike,
  StoryReqReport
} from '@entities/index';

@Entity()
export class Story extends BaseEntity {
  @PrimaryGeneratedColumn()
  storyIdx: number;

  @Column({ type: 'varchar', length: 100 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @ManyToOne(() => User, user => user.stories)
  @JoinColumn({ name: 'userIdx' })
  user: User;

  @Column()
  userIdx: number;

  @OneToMany(() => StoryImage, storyImage => storyImage.story)
  images: StoryImage[];

  @OneToMany(() => StoryTag, storyTag => storyTag.story)
  tags!: StoryTag[];

  @OneToMany(() => StoryComment, storyComment => storyComment.story)
  comments!: StoryComment[];

  @OneToMany(() => StoryLike, storyLike => storyLike.story)
  likes!: StoryLike[];

  @OneToMany(() => StoryReqReport, storyReqReport => storyReqReport.story)
  reqReports!: StoryReqReport[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp' })
  deletedAt: Date;
}
