import { MatchLevel } from '../generated/prisma/enums';
import { JobMatcherService } from './job-matcher.service';

describe('JobMatcherService', () => {
  const matcher = new JobMatcherService();

  it('marks a Baghdad React role as strong', () => {
    expect(
      matcher.classify('Junior React Frontend Developer - Baghdad'),
    ).toBe(MatchLevel.STRONG);
  });

  it('marks a general software engineer role as good', () => {
    expect(
      matcher.classify('Software Engineer opportunity in Erbil'),
    ).toBe(MatchLevel.GOOD);
  });

  it('marks a matching role requiring three years as stretch', () => {
    expect(
      matcher.classify('Backend Developer - Baghdad - 2-3 years experience'),
    ).toBe(MatchLevel.STRETCH);
  });

  it('rejects senior roles', () => {
    expect(
      matcher.classify('Senior Frontend React Developer - Baghdad'),
    ).toBe(MatchLevel.NOT_RELEVANT);
  });

  it('marks junior DevOps as stretch', () => {
    expect(
      matcher.classify('Junior DevOps Engineer needed in Baghdad'),
    ).toBe(MatchLevel.STRETCH);
  });

  it('rejects unrelated network engineering', () => {
    expect(
      matcher.classify('Network Engineer vacancy in Baghdad'),
    ).toBe(MatchLevel.NOT_RELEVANT);
  });

  it('accepts a remote Flutter role as strong', () => {
    expect(
      matcher.classify('Flutter Developer - Remote within Iraq'),
    ).toBe(MatchLevel.STRONG);
  });

  it('rejects a role in an unsupported location', () => {
    expect(
      matcher.classify('Frontend Developer required in Basra'),
    ).toBe(MatchLevel.NOT_RELEVANT);
  });

  it('supports Arabic software roles', () => {
    expect(
      matcher.classify('مطلوب مهندس برمجيات للعمل في بغداد'),
    ).toBe(MatchLevel.GOOD);
  });

  it('rejects unpaid internships', () => {
    expect(
      matcher.classify('Unpaid internship for a React developer'),
    ).toBe(MatchLevel.NOT_RELEVANT);
  });
});