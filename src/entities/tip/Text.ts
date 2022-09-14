import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, ManyToOne, JoinColumn } from 'typeorm';
import { Tip } from '@entities/index';

@Entity()
export class TipText extends BaseEntity {
  @PrimaryGeneratedColumn()
  tipTextIdx: number;

  @Column({ type: 'int' })
  order: number;

  @Column({ type: 'text' })
  content: string;

  @ManyToOne(() => Tip, tip => tip.contentTexts)
  @JoinColumn({ name: 'tipIdx' })
  tip: Tip;
}
