import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeamMember } from '../entities/team-member.entity';
import { TeamMemberService } from './team-member.service';

@Module({
  imports: [TypeOrmModule.forFeature([TeamMember])],
  providers: [TeamMemberService],
  exports: [TeamMemberService],
})
export class TeamMemberModule {}
