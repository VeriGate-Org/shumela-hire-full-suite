-- Fix invalid interview enum values seeded by V021.
-- The Java enums use FIRST_ROUND / SECOND_ROUND for InterviewRound
-- and HIRE (not STRONG_HIRE) for InterviewRecommendation,
-- but the seed data inserted invalid values causing deserialization errors.

UPDATE interviews SET round = 'FIRST_ROUND'  WHERE round = 'FIRST';
UPDATE interviews SET round = 'SECOND_ROUND' WHERE round = 'SECOND';
UPDATE interviews SET recommendation = 'HIRE' WHERE recommendation = 'STRONG_HIRE';
