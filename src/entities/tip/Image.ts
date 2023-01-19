import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, ManyToOne, JoinColumn } from 'typeorm';
import { Tip } from '@entities/index';

@Entity()
export class TipImage extends BaseEntity {
  @PrimaryGeneratedColumn()
  tipImageIdx: number;

  @Column({ type: 'int' })
  order: number;

  @Column({ type: 'text' })
  url: string;

  @ManyToOne(() => Tip, tip => tip.contentImages)
  @JoinColumn({ name: 'tipIdx' })
  tip: Tip;

  @Column()
  tipIdx: number;
}
