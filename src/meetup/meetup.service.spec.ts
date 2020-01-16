import { Test, TestingModule } from '@nestjs/testing';
import { MeetupService } from './meetup.service';

describe('MeetupService', () => {
  let service: MeetupService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MeetupService],
    }).compile();

    service = module.get<MeetupService>(MeetupService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
