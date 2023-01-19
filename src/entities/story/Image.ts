import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, ManyToOne, JoinColumn } from 'typeorm';
import { Story } from '@entities/index';

@Entity()
export class StoryImage extends BaseEntity {
  @PrimaryGeneratedColumn()
  storyImageIdx: number;

  @Column({ type: 'text' })
  url: string;

  @ManyToOne(() => Story, story => story.images)
  @JoinColumn({ name: 'storyIdx' })
  story: Story;

  @Column()
  storyIdx: number;
}
