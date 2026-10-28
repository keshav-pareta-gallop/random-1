import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TeamMember } from '../entities/team-member.entity';

@Injectable()
export class TeamMemberService {
  constructor(
    @InjectRepository(TeamMember)
    private readonly repo: Repository<TeamMember>,
  ) {}

  async findOrCreate(firebaseUid: string, name: string, email: string): Promise<TeamMember> {
    let member = await this.repo.findOne({ where: { firebaseUid } });
    if (!member) {
      member = this.repo.create({
        firebaseUid,
        name,
        email,
        role: 'member',
        isActive: true,
      });
      member = await this.repo.save(member);
    }
    return member;
  }
}
