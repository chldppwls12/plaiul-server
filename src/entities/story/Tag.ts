import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, ManyToOne, JoinColumn } from 'typeorm';
import { Story } from '@entities/index';

@Entity()
export class StoryTag extends BaseEntity {
  @PrimaryGeneratedColumn()
  storyTagIdx: number;

  @Column({ type: 'varchar', length: 50 })
  name: string;

  @ManyToOne(() => Story, story => story.tags)
  @JoinColumn({ name: 'storyIdx' })
  story: Story;

  @Column()
  storyIdx: number;
}
