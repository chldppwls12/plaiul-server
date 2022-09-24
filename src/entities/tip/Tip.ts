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
import { TipImage, TipText, User } from '@entities/index';

@Entity()
export class Tip extends BaseEntity {
  @PrimaryGeneratedColumn()
  tipIdx: number;

  @Column({ type: 'varchar', length: 100 })
  title: string;

  @Column({ type: 'text' })
  thumbnail: string;

  @OneToMany(() => TipImage, tipImage => tipImage.tip)
  contentImages!: TipImage[];

  @OneToMany(() => TipText, tipText => tipText.tip)
  contentTexts!: TipText[];

  @ManyToOne(() => User, user => user.tips)
  @JoinColumn({ name: 'userIdx' })
  user: User;

  @Column()
  userIdx: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp' })
  deletedAt: Date;
}
