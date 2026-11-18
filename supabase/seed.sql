-- Voyage: import your existing data from the Google Sheet.
-- Run AFTER schema.sql and AFTER you have created your login (Authentication -> Users -> Add user).
-- 1) Change the email on the line marked  <<< CHANGE THIS  to the email you log in with.
-- 2) Run it once. It stops with a message if the account already has data.

do $seed$
declare
  v_email text := 'you@example.com';  -- <<< CHANGE THIS
  v_user  uuid;
begin
  select id into v_user from auth.users where lower(email) = lower(v_email);
  if v_user is null then
    raise exception 'No user found for %. Create the user first (Authentication -> Users -> Add user), then fix the email above.', v_email;
  end if;
  if exists (select 1 from public.chapters where user_id = v_user) or exists (select 1 from public.vocab where user_id = v_user) then
    raise exception 'This account already has data, so nothing was imported.';
  end if;

  insert into public.subjects (user_id, name) values
    (v_user, 'Verbal'),
    (v_user, 'Quant'),
    (v_user, 'LR'),
    (v_user, 'AR');

  insert into public.chapters (user_id, subject_id, book, name, done, done_on)
  select v_user, s.id, v.book, v.name, v.done, v.done_on::date
  from (values
    (1, 'Verbal', 'CET Prep Guide', 'Synonyms & Antonyms', true, '2026-11-15'),
    (2, 'Verbal', 'CET Prep Guide', 'One word Substitution', false, NULL),
    (3, 'Verbal', 'CET Prep Guide', 'Spotting Errors & Sentence Improvement', false, NULL),
    (4, 'Verbal', 'CET Prep Guide', 'Fill in the Blanks', false, NULL),
    (5, 'Verbal', 'CET Prep Guide', 'Parajumbles', false, NULL),
    (6, 'Verbal', 'CET Prep Guide', 'Idioms and Proverbs', false, NULL),
    (7, 'Verbal', 'CET Prep Guide', 'Reading comprehension', false, NULL),
    (8, 'Verbal', 'CET Prep Guide', 'Miscellaneous', false, NULL),
    (9, 'Quant', 'CET Prep Guide', 'Number System', false, NULL),
    (10, 'Quant', 'CET Prep Guide', 'Simplification and Approximation', false, NULL),
    (11, 'Quant', 'CET Prep Guide', 'Average', false, NULL),
    (12, 'Quant', 'CET Prep Guide', 'Algebraic Expressions & Inequalities', false, NULL),
    (13, 'Quant', 'CET Prep Guide', 'Percentage', false, NULL),
    (14, 'Quant', 'CET Prep Guide', 'Profit & Loss', false, NULL),
    (15, 'Quant', 'CET Prep Guide', 'Ratio and Proportion', false, NULL),
    (16, 'Quant', 'CET Prep Guide', 'Partnership', false, NULL),
    (17, 'Quant', 'CET Prep Guide', 'Mixtures and Aligations', false, NULL),
    (18, 'Quant', 'CET Prep Guide', 'Interest', false, NULL),
    (19, 'Quant', 'CET Prep Guide', 'Time and Work', false, NULL),
    (20, 'Quant', 'CET Prep Guide', 'Pipes and cistern', false, NULL),
    (21, 'Quant', 'CET Prep Guide', 'Time, speed & Distance', false, NULL),
    (22, 'Quant', 'CET Prep Guide', 'Boats & Streams', false, NULL),
    (23, 'Quant', 'CET Prep Guide', 'Geometry', false, NULL),
    (24, 'Quant', 'CET Prep Guide', 'Mensuration', false, NULL),
    (25, 'Quant', 'CET Prep Guide', 'Trignometry', false, NULL),
    (26, 'Quant', 'CET Prep Guide', 'Set Theory', false, NULL),
    (27, 'Quant', 'CET Prep Guide', 'Sequence, Series and Logarithm', false, NULL),
    (28, 'Quant', 'CET Prep Guide', 'Permutation and Combination', false, NULL),
    (29, 'Quant', 'CET Prep Guide', 'Probability & Statistics', false, NULL),
    (30, 'Quant', 'CET Prep Guide', 'Data Interpretation', false, NULL),
    (31, 'Quant', 'CET Prep Guide', 'Data Analysis and Sufficiency', false, NULL),
    (32, 'LR', 'CET Prep Guide', 'Analogy', true, NULL),
    (33, 'LR', 'CET Prep Guide', 'Classification', true, NULL),
    (34, 'LR', 'CET Prep Guide', 'Coding - Decoding', false, NULL),
    (35, 'LR', 'CET Prep Guide', 'Alphabet Test & Logical Word Arrangement', false, NULL),
    (36, 'LR', 'CET Prep Guide', 'Blood Relation', false, NULL),
    (37, 'LR', 'CET Prep Guide', 'Direction and Distance', false, NULL),
    (38, 'LR', 'CET Prep Guide', 'Ranking Test', false, NULL),
    (39, 'LR', 'CET Prep Guide', 'Series', false, NULL),
    (40, 'LR', 'CET Prep Guide', 'Input - Output', false, NULL),
    (41, 'LR', 'CET Prep Guide', 'Clock and Calender', false, NULL),
    (42, 'LR', 'CET Prep Guide', 'logical Venn diagram', false, NULL),
    (43, 'LR', 'CET Prep Guide', 'Syllogism', false, NULL),
    (44, 'LR', 'CET Prep Guide', 'Cube & Dice', false, NULL),
    (45, 'LR', 'CET Prep Guide', 'Number Puzzle & Diagrammetric Puzzle', false, NULL),
    (46, 'LR', 'CET Prep Guide', 'Coded Inequalities', false, NULL),
    (47, 'LR', 'CET Prep Guide', 'Analytical Reasoning', false, NULL),
    (48, 'LR', 'CET Prep Guide', 'Assertion and Reason', false, NULL),
    (49, 'LR', 'CET Prep Guide', 'Statement and Assumptions', false, NULL),
    (50, 'LR', 'CET Prep Guide', 'Statement and Arguments', false, NULL),
    (51, 'LR', 'CET Prep Guide', 'Statement and Course of Action', false, NULL),
    (52, 'LR', 'CET Prep Guide', 'Statement and Conclusion', false, NULL),
    (53, 'LR', 'CET Prep Guide', 'Logical Deduction', false, NULL),
    (54, 'LR', 'CET Prep Guide', 'Critical Reasoning', false, NULL),
    (55, 'LR', 'CET Prep Guide', 'Cause and effect', false, NULL),
    (56, 'LR', 'CET Prep Guide', 'Data Sufficiency', false, NULL),
    (57, 'AR', 'CET Prep Guide', 'Series', false, NULL),
    (58, 'AR', 'CET Prep Guide', 'Analogy', false, NULL),
    (59, 'AR', 'CET Prep Guide', 'Classification', false, NULL),
    (60, 'AR', 'CET Prep Guide', 'Paper Cutting - Folding', false, NULL),
    (61, 'AR', 'CET Prep Guide', 'Mirror and water Image', false, NULL),
    (62, 'AR', 'CET Prep Guide', 'Embedded Figure', false, NULL),
    (63, 'AR', 'CET Prep Guide', 'Figure Completion', false, NULL)
  ) as v(n, subject, book, name, done, done_on)
  join public.subjects s on s.user_id = v_user and s.name = v.subject
  order by v.n;

  insert into public.vocab (user_id, word, meaning, synonyms, example1, example2, status, added_on, box, next_review)
  select v_user, w.* from (values
    ('Voyage', 'A long journey involving travel by sea or in space.', 'Journey', 'The brave explorers embarked on a long voyage across the Pacific Ocean.', 'The chef designed the six-course tasting menu to take diners on an unexpected flavor voyage across South America.', 'Mastered', '2026-09-04'::date, 5, NULL::date),
    ('cantankerous', 'Bad-tempered, argumentative, and uncooperative.', 'Bad-tempered', 'The cantankerous old man refused to answer the door or talk to any of his neighbors.', 'After hours of troubleshooting, the developer realized the cantankerous legacy software refused to run without its outdated dependencies.', 'New', '2026-09-04'::date, 0, NULL::date),
    ('onus', 'A duty, responsibility, or obligation to do something.', 'Responsibility', 'The onus is on the team leader to ensure the project is completed on time.', 'The software update shifted the onus of data validation entirely onto the client-side application.', 'New', '2026-09-04'::date, 0, NULL::date),
    ('Derision', 'Contemptuous ridicule or mockery.', 'Mockery', 'His proposal was greeted with derision by the rest of the committee.', 'The avant-garde fashion designer wore the critics'' derision like a badge of honor, turning their harsh reviews into the main theme for his next runway show.', 'New', '2026-09-04'::date, 0, NULL::date),
    ('Condemnation', 'The expression of strong disapproval or criticism.', 'Criticism', 'The official''s actions drew widespread condemnation from the public.', 'The empty seats in the arena during the championship final were a silent condemnation of the team''s recent poor performance.', 'Learning', '2026-09-04'::date, 1, '2026-11-16'::date),
    ('Ridicule', 'Mocking or making fun of someone or something in an unkind way.', 'Mockery', 'His absurd proposal was met with widespread ridicule from the committee.', 'The futuristic defense system proved to be an absolute ridicule to incoming missile threats, rendering them completely ineffective before they reached the atmosphere.', 'New', '2026-09-04'::date, 0, NULL::date),
    ('Trite', 'Overused and lacking originality or freshness.', 'Overused', 'His speech was full of trite clichés that failed to impress the audience.', 'The architect rejected the proposal, feeling that adding another glass pyramid to the courtyard would be completely trite.', 'New', '2026-09-04'::date, 0, NULL::date),
    ('Impudent', 'Not showing due respect for another person; rude or impertinent.', 'Rude', 'The student received a detention for making an impudent remark to the teacher.', 'The modern skyscraper stood as an impudent glass spire directly amidst the city''s ancient stone architecture.', 'New', '2026-09-04'::date, 0, NULL::date),
    ('Debacle', 'A sudden and complete failure or disaster.', 'Fiasco', 'The product launch turned into a complete debacle after the servers crashed.', 'Our attempt to build a simple DIY cat tree ended in a chaotic debacle when the entire structure collapsed under the weight of a single kitten.', 'New', '2026-09-04'::date, 0, NULL::date),
    ('Discomfiture', 'A feeling of unease, embarrassment, or awkwardness.', 'Embarrassment', 'He tried to hide his discomfiture with a strained smile after flubbing the announcement.', 'The rookie chess player could not hide his discomfiture as the grandmaster dismantled his strategy in just ten moves.', 'New', '2026-09-04'::date, 0, NULL::date)
  ) as w(word, meaning, synonyms, example1, example2, status, added_on, box, next_review);

  insert into public.bucket_items (user_id, title, category, horizon, status, cost, why, with_friend, done_on, memory)
  select v_user, b.* from (values
    ('Buy latest PlayStation', 'Things', 'Someday', 'Dream', '100000', 'Boys Dream', false, NULL::date, '')
  ) as b(title, category, horizon, status, cost, why, with_friend, done_on, memory);

  insert into public.settings (user_id, key, value)
  select v_user, s.* from (values
    ('cet_date', '2027-01-28'),
    ('cet_tentative', 'false'),
    ('cat_date', '2026-11-25'),
    ('finish_by', '2027-01-28'),
    ('display_name', 'Varun')
  ) as s(key, value);

end $seed$;
