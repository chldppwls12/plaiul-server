import {
  Entity,
  BaseEntity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn
} from 'typeorm';
import { User } from '@entities/index';

@Entity()
export class Block extends BaseEntity {
  @PrimaryGeneratedColumn()
  blockIdx: number;

  @ManyToOne(() => User, user => user.blocks, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'userIdx' })
  user: User;

  @Column()
  userIdx: number;

  @ManyToOne(() => User, user => user.blocks, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'blockedUserIdx' })
  blocked: User;

  @Column()
  blockedUserIdx: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
