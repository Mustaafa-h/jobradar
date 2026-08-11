import { Injectable } from '@nestjs/common';
import { MatchLevel } from '../generated/prisma/enums';

@Injectable()
export class JobMatcherService {
  private readonly strongTerms = [
    'full stack',
    'full-stack',
    'fullstack',
    'frontend',
    'front-end',
    'react',
    'next.js',
    'nextjs',
    'node.js',
    'nodejs',
    'nestjs',
    'flutter',
    'javascript developer',
    'مطور واجهات اماميه',
    'مطور فلاتر',
    'فل ستاك',
    'فرونت اند',
  ];

  private readonly goodTerms = [
    'software engineer',
    'software developer',
    'backend developer',
    'back-end developer',
    'web developer',
    'mobile developer',
    'application developer',
    'programmer',
    'express.js',
    'expressjs',
    'مهندس برمجيات',
    'مطور برمجيات',
    'مطور ويب',
    'مطور مواقع',
    'مطور تطبيقات',
    'مبرمج',
    'باك اند',
  ];

  private readonly adjacentTerms = [
    'qa automation',
    'automation tester',
    'automation engineer',
    'test automation',
    'sdet',
    'devops engineer',
    'junior devops',
    'cloud engineer',
    'مهندس اختبار الي',
    'اختبار برمجيات الي',
    'ديف اوبس',
    'مهندس سحابه',
  ];

  private readonly excludedRoles = [
    'network engineer',
    'network administrator',
    'it support',
    'help desk',
    'cybersecurity',
    'cyber security',
    'penetration tester',
    'data scientist',
    'data analyst',
    'machine learning',
    'artificial intelligence',
    'graphic designer',
    'ui/ux designer',
    'sales representative',
    'accountant',
    'مهندس شبكات',
    'دعم فني',
    'امن سيبراني',
    'محلل بيانات',
    'عالم بيانات',
    'ذكاء اصطناعي',
    'مصمم جرافيك',
    'محاسب',
    'مندوب مبيعات',
  ];

  private readonly seniorTerms = [
    'senior',
    'team lead',
    'tech lead',
    'technical lead',
    'principal',
    'engineering manager',
    'head of engineering',
    'architect',
    'سينيور',
    'قائد فريق',
    'مدير هندسي',
    'مهندس اقدم',
    'مطور اقدم',
  ];

  private readonly disallowedLocations = [
    'basra',
    'najaf',
    'karbala',
    'mosul',
    'kirkuk',
    'sulaymaniyah',
    'sulaimani',
    'duhok',
    'dubai',
    'abu dhabi',
    'saudi arabia',
    'riyadh',
    'jordan',
    'amman',
    'البصره',
    'النجف',
    'كربلاء',
    'الموصل',
    'كركوك',
    'السليمانيه',
    'دهوك',
    'دبي',
    'ابو ظبي',
    'السعوديه',
    'الرياض',
    'الاردن',
    'عمان',
  ];

  private readonly allowedLocations = [
    'baghdad',
    'erbil',
    'iraq',
    'remote',
    'work from home',
    'بغداد',
    'اربيل',
    'العراق',
    'عن بعد',
    'من المنزل',
  ];

  classify(originalText: string): MatchLevel {
    const text = this.normalize(originalText);

    if (text.length === 0) {
      return MatchLevel.NOT_RELEVANT;
    }

    if (
      this.hasAny(text, [
        'unpaid internship',
        'unpaid trainee',
        'volunteer position',
        'بدون راتب',
        'تدريب غير مدفوع',
        'عمل تطوعي',
      ])
    ) {
      return MatchLevel.NOT_RELEVANT;
    }

    if (this.hasAny(text, this.seniorTerms)) {
      return MatchLevel.NOT_RELEVANT;
    }

    const years = this.extractMaximumYears(text);

    if (years !== null && years >= 4) {
      return MatchLevel.NOT_RELEVANT;
    }

    const hasStrongMatch = this.hasAny(text, this.strongTerms);
    const hasGoodMatch = this.hasAny(text, this.goodTerms);
    const hasAdjacentMatch = this.hasAny(text, this.adjacentTerms);

    if (
      this.hasAny(text, this.excludedRoles) &&
      !hasStrongMatch &&
      !hasAdjacentMatch
    ) {
      return MatchLevel.NOT_RELEVANT;
    }

    if (!hasStrongMatch && !hasGoodMatch && !hasAdjacentMatch) {
      return MatchLevel.NOT_RELEVANT;
    }

    const hasDisallowedLocation = this.hasAny(
      text,
      this.disallowedLocations,
    );
    const hasAllowedLocation = this.hasAny(text, this.allowedLocations);

    if (hasDisallowedLocation && !hasAllowedLocation) {
      return MatchLevel.NOT_RELEVANT;
    }

    if (hasAdjacentMatch || (years !== null && years >= 2)) {
      return MatchLevel.STRETCH;
    }

    if (hasStrongMatch) {
      return MatchLevel.STRONG;
    }

    return MatchLevel.GOOD;
  }

  private normalize(text: string): string {
    const arabicDigits: Record<string, string> = {
      '٠': '0',
      '١': '1',
      '٢': '2',
      '٣': '3',
      '٤': '4',
      '٥': '5',
      '٦': '6',
      '٧': '7',
      '٨': '8',
      '٩': '9',
    };

    return text
      .toLowerCase()
      .replace(/[أإآ]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ة/g, 'ه')
      .replace(/[٠-٩]/g, (digit) => arabicDigits[digit])
      .replace(/[–—]/g, '-')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private hasAny(text: string, terms: string[]): boolean {
    return terms.some((term) => text.includes(term));
  }

  private extractMaximumYears(text: string): number | null {
    const pattern =
      /(\d+)\s*(?:\+|(?:-|to|الى)\s*(\d+))?\s*(?:years?|yrs?|سنوات|سنه|سنين)/g;

    let maximum: number | null = null;

    for (const match of text.matchAll(pattern)) {
      const first = Number(match[1]);
      const second = match[2] ? Number(match[2]) : first;
      const value = Math.max(first, second);

      maximum = maximum === null ? value : Math.max(maximum, value);
    }

    return maximum;
  }
}