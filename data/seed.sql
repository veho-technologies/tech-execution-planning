-- Seed data for tech-execution-planning
-- Generated from local dev database

-- Quarters
INSERT INTO public.quarters VALUES ('q1-2026', 'Q1 2026', '2026-01-01', '2026-03-31', 5, 0.25, 5, '2026-02-05 16:14:58.124+00', '2026-02-05 16:14:58.124+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.quarters VALUES ('q2-2026', 'Q2 2026', '2026-04-01', '2026-06-30', 5, 0.25, 5, '2026-02-05 16:15:31.661+00', '2026-02-05 16:15:31.661+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.quarters VALUES ('q3-2026', 'Q3 2026', '2026-07-01', '2026-09-30', 5, 0.25, 5, '2026-02-05 16:15:31.663+00', '2026-02-05 16:15:31.663+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.quarters VALUES ('q4-2026', 'Q4 2026', '2026-10-01', '2026-12-31', 5, 0.25, 5, '2026-02-05 16:15:31.665+00', '2026-02-05 16:15:31.665+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.quarters VALUES ('q1-2027', 'Q1 2027', '2027-01-01', '2027-03-31', 5, 0.25, 5, '2026-02-05 16:15:31.668+00', '2026-02-05 16:15:31.668+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.quarters VALUES ('q2-2027', 'Q2 2027', '2027-04-01', '2027-06-30', 5, 0.25, 5, '2026-02-05 16:15:31.671+00', '2026-02-05 16:15:31.671+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.quarters VALUES ('q3-2027', 'Q3 2027', '2027-07-01', '2027-09-30', 5, 0.25, 5, '2026-02-05 16:15:31.672+00', '2026-02-05 16:15:31.672+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.quarters VALUES ('q4-2027', 'Q4 2027', '2027-10-01', '2027-12-31', 5, 0.25, 5, '2026-02-05 16:15:31.674+00', '2026-02-05 16:15:31.674+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.quarters VALUES ('q1-2028', 'Q1 2028', '2028-01-01', '2028-03-31', 5, 0.25, 5, '2026-02-05 16:15:31.677+00', '2026-02-05 16:15:31.677+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.quarters VALUES ('q2-2028', 'Q2 2028', '2028-04-01', '2028-06-30', 5, 0.25, 5, '2026-02-05 16:15:31.68+00', '2026-02-05 16:15:31.68+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.quarters VALUES ('q3-2028', 'Q3 2028', '2028-07-01', '2028-09-30', 5, 0.25, 5, '2026-02-05 16:15:31.681+00', '2026-02-05 16:15:31.681+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.quarters VALUES ('q4-2028', 'Q4 2028', '2028-10-01', '2028-12-31', 5, 0.25, 5, '2026-02-05 16:15:31.683+00', '2026-02-05 16:15:31.683+00') ON CONFLICT (id) DO NOTHING;

-- Teams
INSERT INTO public.teams VALUES ('team-1770308519880', 'Facilities Tech', '91e461b7-ddb5-4da6-8e86-734c63aef221', 4, 1, '2026-02-05 16:22:14.781+00', '2026-02-05 17:09:30.215+00') ON CONFLICT (id) DO NOTHING;

-- Sprints
INSERT INTO public.sprints VALUES ('sprint-q2-2026-f53d5f1f-5387-4cf6-a6bf-746a9a5e1b55', 'q2-2026', 'Cycle 99', '2026-05-25', '2026-06-08', 99, '2026-02-05 21:32:34.194+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.sprints VALUES ('sprint-q2-2026-eefc4f44-c2b5-4a61-baad-8637076ee7e3', 'q2-2026', 'Cycle 98', '2026-05-11', '2026-05-25', 98, '2026-02-05 21:32:34.204+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.sprints VALUES ('sprint-q2-2026-e2170471-aa56-49cb-995a-a1958f984a0f', 'q2-2026', 'Cycle 97', '2026-04-27', '2026-05-11', 97, '2026-02-05 21:32:34.212+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.sprints VALUES ('sprint-q2-2026-c5a586cd-9555-414c-ac1b-27a65da5647f', 'q2-2026', 'Cycle 100', '2026-06-08', '2026-06-22', 100, '2026-02-05 21:32:34.219+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.sprints VALUES ('sprint-q2-2026-88b390f5-c3d6-47f1-9cc2-8533f3b3afe3', 'q2-2026', 'Cycle 95', '2026-03-30', '2026-04-13', 95, '2026-02-05 21:32:34.227+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.sprints VALUES ('sprint-q2-2026-6e010e1d-828a-4e35-bcb3-9e4714a9916e', 'q2-2026', 'Cycle 96', '2026-04-13', '2026-04-27', 96, '2026-02-05 21:32:34.235+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.sprints VALUES ('sprint-q2-2026-4ef3ab5a-2a39-4f0b-9a26-06b53835c510', 'q2-2026', 'Cycle 101', '2026-06-22', '2026-07-06', 101, '2026-02-05 21:32:34.243+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.sprints VALUES ('sprint-q1-2026-c83b2969-2eb2-42b7-8f02-bf0178a7b02b', 'q1-2026', 'Cycle 94', '2026-03-16', '2026-03-30', 94, '2026-02-05 20:26:45.882+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.sprints VALUES ('sprint-q1-2026-4f835690-a9a9-4702-a923-dc2f6a865ef9', 'q1-2026', 'Cycle 93', '2026-03-02', '2026-03-16', 93, '2026-02-05 20:26:45.897+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.sprints VALUES ('sprint-q1-2026-08389057-0be7-4e71-a6a9-c3b4a187c856', 'q1-2026', 'Cycle 92', '2026-02-16', '2026-03-02', 92, '2026-02-05 20:26:45.912+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.sprints VALUES ('sprint-q1-2026-4d0ab2e1-434c-4af2-94ae-982070752fb8', 'q1-2026', 'Cycle 91', '2026-02-02', '2026-02-16', 91, '2026-02-05 20:26:45.923+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.sprints VALUES ('sprint-q1-2026-1ffb2b3f-af70-4c57-94ec-771e49bedb34', 'q1-2026', 'Cycle 90', '2026-01-19', '2026-02-02', 90, '2026-02-05 20:26:45.934+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.sprints VALUES ('sprint-q1-2026-599fd242-2419-4fad-9c84-6a6499c973ff', 'q1-2026', 'Cycle 89', '2026-01-11', '2026-01-19', 89, '2026-02-05 20:26:45.946+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.sprints VALUES ('sprint-q1-2026-f8e96904-d9c4-4536-ba46-ecf3870dbe74', 'q1-2026', 'Cycle 88', '2025-12-28', '2026-01-11', 88, '2026-02-05 20:26:45.956+00') ON CONFLICT (id) DO NOTHING;

-- Holidays
INSERT INTO public.holidays VALUES (74, 'q1-2026', '2026-02-16', 'Presidents'' Day') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.holidays VALUES (75, 'q1-2026', '2026-02-16', 'Presidents'' Day') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.holidays VALUES (1, 'q1-2026', '2026-01-01', 'New Year''s Day') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.holidays VALUES (2, 'q1-2026', '2026-01-19', 'Martin Luther King Jr. Day') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.holidays VALUES (5, 'q2-2026', '2026-05-25', 'Memorial Day') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.holidays VALUES (6, 'q3-2026', '2026-07-04', 'Independence Day') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.holidays VALUES (7, 'q3-2026', '2026-09-07', 'Labor Day') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.holidays VALUES (9, 'q4-2026', '2026-12-25', 'Christmas Day') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.holidays VALUES (10, 'q4-2026', '2026-11-26', 'Thanksgiving Day') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.holidays VALUES (12, 'q1-2027', '2027-01-01', 'New Year''s Day') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.holidays VALUES (13, 'q1-2027', '2027-01-18', 'Martin Luther King Jr. Day') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.holidays VALUES (16, 'q2-2027', '2027-05-31', 'Memorial Day') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.holidays VALUES (17, 'q3-2027', '2027-07-04', 'Independence Day') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.holidays VALUES (18, 'q3-2027', '2027-09-06', 'Labor Day') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.holidays VALUES (20, 'q4-2027', '2027-12-25', 'Christmas Day') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.holidays VALUES (21, 'q4-2027', '2027-11-25', 'Thanksgiving Day') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.holidays VALUES (23, 'q1-2028', '2028-01-01', 'New Year''s Day') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.holidays VALUES (24, 'q1-2028', '2028-01-17', 'Martin Luther King Jr. Day') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.holidays VALUES (27, 'q2-2028', '2028-05-29', 'Memorial Day') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.holidays VALUES (28, 'q3-2028', '2028-07-04', 'Independence Day') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.holidays VALUES (29, 'q3-2028', '2028-09-04', 'Labor Day') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.holidays VALUES (31, 'q4-2028', '2028-12-25', 'Christmas Day') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.holidays VALUES (32, 'q4-2028', '2028-11-23', 'Thanksgiving Day') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.holidays VALUES (53, 'q2-2026', '2026-06-19', 'Juneteenth') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.holidays VALUES (54, 'q2-2026', '2026-06-19', 'Juneteenth') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.holidays VALUES (55, 'q4-2026', '2026-11-11', 'Veterans Day') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.holidays VALUES (56, 'q4-2026', '2026-11-11', 'Veterans Day') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.holidays VALUES (57, 'q4-2026', '2026-11-27', 'Day after Thanksgiving') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.holidays VALUES (58, 'q4-2026', '2026-11-27', 'Day after Thanksgiving') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.holidays VALUES (59, 'q1-2027', '2027-02-15', 'Presidents'' Day') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.holidays VALUES (60, 'q1-2027', '2027-02-15', 'Presidents'' Day') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.holidays VALUES (61, 'q2-2027', '2027-06-19', 'Juneteenth') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.holidays VALUES (62, 'q2-2027', '2027-06-19', 'Juneteenth') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.holidays VALUES (63, 'q4-2027', '2027-11-11', 'Veterans Day') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.holidays VALUES (64, 'q4-2027', '2027-11-11', 'Veterans Day') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.holidays VALUES (65, 'q4-2027', '2027-11-26', 'Day after Thanksgiving') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.holidays VALUES (66, 'q4-2027', '2027-11-26', 'Day after Thanksgiving') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.holidays VALUES (67, 'q1-2028', '2028-02-21', 'Presidents'' Day') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.holidays VALUES (68, 'q1-2028', '2028-02-21', 'Presidents'' Day') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.holidays VALUES (69, 'q2-2028', '2028-06-19', 'Juneteenth') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.holidays VALUES (70, 'q4-2028', '2028-11-11', 'Veterans Day') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.holidays VALUES (71, 'q4-2028', '2028-11-11', 'Veterans Day') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.holidays VALUES (72, 'q4-2028', '2028-11-24', 'Day after Thanksgiving') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.holidays VALUES (73, 'q4-2028', '2028-11-24', 'Day after Thanksgiving') ON CONFLICT (id) DO NOTHING;

-- Projects
INSERT INTO public.projects VALUES ('proj-q1-2026-a4cbe087-3964-4e6e-97fb-52c74820f49b', 'a4cbe087-3964-4e6e-97fb-52c74820f49b', 'team-1770308519880', 'q1-2026', 2, NULL, false, NULL, NULL, '2026-02-05 19:04:37.024+00', '2026-02-10 17:26:08.110931+00', 6) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.projects VALUES ('proj-q1-2026-ba49153c-a70a-40c7-8595-2a252aeda90d', 'ba49153c-a70a-40c7-8595-2a252aeda90d', 'team-1770308519880', 'q1-2026', 2, NULL, false, NULL, NULL, '2026-02-05 19:19:58.336+00', '2026-02-10 17:26:08.111429+00', 7) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.projects VALUES ('proj-q1-2026-f1597472-7b27-4dc3-93f1-89d4b35643d1', 'f1597472-7b27-4dc3-93f1-89d4b35643d1', 'team-1770308519880', 'q1-2026', 7, NULL, false, NULL, NULL, '2026-02-05 19:11:33.698+00', '2026-02-10 17:26:08.112001+00', 8) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.projects VALUES ('proj-q1-2026-48faeb15-9d0f-45a4-a69a-46ab88ea7879', '48faeb15-9d0f-45a4-a69a-46ab88ea7879', 'team-1770308519880', 'q1-2026', 4, NULL, false, NULL, NULL, '2026-02-05 19:21:49.698+00', '2026-02-10 17:26:08.112621+00', 9) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.projects VALUES ('proj-q1-2026-7168f968-bbc4-4402-aecf-28bb7b767a3c', '7168f968-bbc4-4402-aecf-28bb7b767a3c', 'team-1770308519880', 'q1-2026', 13, NULL, false, NULL, NULL, '2026-02-10 16:36:09.556714+00', '2026-02-10 17:26:08.113099+00', 10) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.projects VALUES ('proj-q2-2026-48faeb15-9d0f-45a4-a69a-46ab88ea7879', '48faeb15-9d0f-45a4-a69a-46ab88ea7879', 'team-1770308519880', 'q2-2026', 0, NULL, false, NULL, NULL, '2026-02-10 20:28:57.616409+00', '2026-02-10 20:30:06.239592+00', 0) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.projects VALUES ('proj-q2-2026-ccf88bc7-e849-4d9b-9b07-e09f0e979dc5', 'ccf88bc7-e849-4d9b-9b07-e09f0e979dc5', 'team-1770308519880', 'q2-2026', 2, NULL, false, NULL, NULL, '2026-02-05 21:32:32.093+00', '2026-02-10 20:30:06.24282+00', 1) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.projects VALUES ('proj-q1-2026-ccf88bc7-e849-4d9b-9b07-e09f0e979dc5', 'ccf88bc7-e849-4d9b-9b07-e09f0e979dc5', 'team-1770308519880', 'q1-2026', 10, NULL, false, NULL, NULL, '2026-02-10 17:09:40.552773+00', '2026-02-10 17:26:08.113599+00', 11) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.projects VALUES ('proj-q2-2026-7168f968-bbc4-4402-aecf-28bb7b767a3c', '7168f968-bbc4-4402-aecf-28bb7b767a3c', 'team-1770308519880', 'q2-2026', 2, NULL, false, NULL, NULL, '2026-02-05 21:32:32.084+00', '2026-02-10 20:30:06.244669+00', 2) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.projects VALUES ('proj-q1-2026-9fcbbce9-3d0f-431f-a6fb-fcd5a8edd9e9', '9fcbbce9-3d0f-431f-a6fb-fcd5a8edd9e9', 'team-1770308519880', 'q1-2026', 3, NULL, false, NULL, NULL, '2026-02-05 17:45:54.224+00', '2026-02-10 17:26:08.114508+00', 13) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.projects VALUES ('proj-q1-2026-dddfb28a-d95e-4901-bced-fc794b61beb4', 'dddfb28a-d95e-4901-bced-fc794b61beb4', 'team-1770308519880', 'q1-2026', 4, NULL, false, NULL, NULL, '2026-02-10 17:25:54.57312+00', '2026-02-10 17:51:28.461424+00', 12) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.projects VALUES ('proj-q2-2026-9fcbbce9-3d0f-431f-a6fb-fcd5a8edd9e9', '9fcbbce9-3d0f-431f-a6fb-fcd5a8edd9e9', 'team-1770308519880', 'q2-2026', 0, NULL, false, NULL, NULL, '2026-02-10 20:29:55.941986+00', '2026-02-10 20:30:06.247103+00', 3) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.projects VALUES ('proj-q2-2026-355bf483-34f7-4796-9953-857063243ec0', '355bf483-34f7-4796-9953-857063243ec0', 'team-1770308519880', 'q2-2026', 6, NULL, false, NULL, NULL, '2026-02-05 21:32:32.071+00', '2026-02-10 20:30:06.24982+00', 4) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.projects VALUES ('proj-q1-2026-2a6178df-71e9-422e-887a-fcefcfe8499e', '2a6178df-71e9-422e-887a-fcefcfe8499e', 'team-1770308519880', 'q1-2026', 2, NULL, false, NULL, NULL, '2026-02-05 17:45:54.251+00', '2026-02-10 17:26:08.103705+00', 0) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.projects VALUES ('proj-q1-2026-f3828aba-755a-4d43-8456-80c0a2a671ae', 'f3828aba-755a-4d43-8456-80c0a2a671ae', 'team-1770308519880', 'q1-2026', 2, NULL, false, NULL, NULL, '2026-02-05 19:11:33.688+00', '2026-02-10 17:26:08.107819+00', 1) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.projects VALUES ('proj-q1-2026-96f42338-8b1c-4bee-a354-62ce36d56d3d', '96f42338-8b1c-4bee-a354-62ce36d56d3d', 'team-1770308519880', 'q1-2026', 3, NULL, false, NULL, NULL, '2026-02-05 19:21:49.723+00', '2026-02-10 17:26:08.10859+00', 2) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.projects VALUES ('proj-q1-2026-1f16c781-b8b0-442a-b399-8d835336d9ef', '1f16c781-b8b0-442a-b399-8d835336d9ef', 'team-1770308519880', 'q1-2026', 2, NULL, false, NULL, NULL, '2026-02-05 17:44:04.814+00', '2026-02-10 17:26:08.109164+00', 3) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.projects VALUES ('proj-q1-2026-a5f5887d-7cfe-42fe-8ce7-dcaa9a5976c2', 'a5f5887d-7cfe-42fe-8ce7-dcaa9a5976c2', 'team-1770308519880', 'q1-2026', 2, NULL, false, NULL, NULL, '2026-02-05 19:11:33.675+00', '2026-02-10 17:26:08.109767+00', 4) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.projects VALUES ('proj-q1-2026-61cdce06-f0f6-4b18-a185-81d39acf8403', '61cdce06-f0f6-4b18-a185-81d39acf8403', 'team-1770308519880', 'q1-2026', 3, NULL, false, NULL, NULL, '2026-02-05 17:45:54.238+00', '2026-02-10 17:26:08.110377+00', 5) ON CONFLICT (id) DO NOTHING;

-- Sprint Allocations
INSERT INTO public.sprint_allocations VALUES (107, 'proj-q1-2026-61cdce06-f0f6-4b18-a185-81d39acf8403', 'sprint-q1-2026-599fd242-2419-4fad-9c84-6a6499c973ff', 0, 2.25, NULL, NULL, 'Execution', NULL, 0, false, '2026-02-09 15:10:26.694+00', '2026-02-09 22:08:47.937+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.sprint_allocations VALUES (80, 'proj-q1-2026-f3828aba-755a-4d43-8456-80c0a2a671ae', 'sprint-q1-2026-1ffb2b3f-af70-4c57-94ec-771e49bedb34', 3.7285714, 0, NULL, 'Gary', 'Execution', NULL, 0.5, false, '2026-02-05 21:45:00.327+00', '2026-02-09 22:08:47.939+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.sprint_allocations VALUES (76, 'proj-q1-2026-2a6178df-71e9-422e-887a-fcefcfe8499e', 'sprint-q1-2026-1ffb2b3f-af70-4c57-94ec-771e49bedb34', 3.7285714, 0.75, NULL, 'Itamar', 'Rollout', NULL, 0.5, false, '2026-02-05 20:29:59.698+00', '2026-02-09 22:08:47.939+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.sprint_allocations VALUES (84, 'proj-q1-2026-61cdce06-f0f6-4b18-a185-81d39acf8403', 'sprint-q1-2026-1ffb2b3f-af70-4c57-94ec-771e49bedb34', 11.185715, 1.5, NULL, 'Gary, James', 'Execution', NULL, 1.5, false, '2026-02-05 21:48:08.165+00', '2026-02-09 22:08:47.94+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.sprint_allocations VALUES (108, 'proj-q1-2026-f1597472-7b27-4dc3-93f1-89d4b35643d1', 'sprint-q1-2026-f8e96904-d9c4-4536-ba46-ecf3870dbe74', 0, 6, NULL, NULL, 'Execution', NULL, 0, false, '2026-02-09 15:10:50.006+00', '2026-02-09 22:08:47.93+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.sprint_allocations VALUES (112, 'proj-q1-2026-96f42338-8b1c-4bee-a354-62ce36d56d3d', 'sprint-q1-2026-1ffb2b3f-af70-4c57-94ec-771e49bedb34', 3.7285714, 0, NULL, 'Itamar', 'Execution', NULL, 0.5, false, '2026-02-09 22:02:35.408+00', '2026-02-09 22:08:47.94+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.sprint_allocations VALUES (79, 'proj-q1-2026-f3828aba-755a-4d43-8456-80c0a2a671ae', 'sprint-q1-2026-4d0ab2e1-434c-4af2-94ae-982070752fb8', 0, 0, NULL, NULL, 'UAT', NULL, 0, false, '2026-02-05 21:44:40.229+00', '2026-02-09 22:08:47.941+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.sprint_allocations VALUES (87, 'proj-q1-2026-a5f5887d-7cfe-42fe-8ce7-dcaa9a5976c2', 'sprint-q1-2026-4d0ab2e1-434c-4af2-94ae-982070752fb8', 6.214286, 0, NULL, 'Itamar', 'UAT', NULL, 0.75, false, '2026-02-05 21:52:10.178+00', '2026-02-09 22:08:47.942+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.sprint_allocations VALUES (88, 'proj-q1-2026-a4cbe087-3964-4e6e-97fb-52c74820f49b', 'sprint-q1-2026-4d0ab2e1-434c-4af2-94ae-982070752fb8', 2.0714285, 0, NULL, 'Itamar', 'Execution', NULL, 0.25, false, '2026-02-05 21:52:20.397+00', '2026-02-09 22:08:47.942+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.sprint_allocations VALUES (109, 'proj-q1-2026-9fcbbce9-3d0f-431f-a6fb-fcd5a8edd9e9', 'sprint-q1-2026-4d0ab2e1-434c-4af2-94ae-982070752fb8', 0, 2.5, NULL, NULL, 'Execution', NULL, 0, false, '2026-02-09 15:11:02.028+00', '2026-02-09 22:08:47.942+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.sprint_allocations VALUES (110, 'proj-q1-2026-f1597472-7b27-4dc3-93f1-89d4b35643d1', 'sprint-q1-2026-4d0ab2e1-434c-4af2-94ae-982070752fb8', 0, 4.75, NULL, NULL, 'Execution', NULL, 0, false, '2026-02-09 15:11:02.033+00', '2026-02-09 22:08:47.943+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.sprint_allocations VALUES (82, 'proj-q1-2026-1f16c781-b8b0-442a-b399-8d835336d9ef', 'sprint-q1-2026-4d0ab2e1-434c-4af2-94ae-982070752fb8', 6.214286, 2.25, 'Address validation and bug fix', 'James', 'Rollout', NULL, 0.75, false, '2026-02-05 21:46:38.154+00', '2026-02-09 22:08:47.943+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.sprint_allocations VALUES (85, 'proj-q1-2026-61cdce06-f0f6-4b18-a185-81d39acf8403', 'sprint-q1-2026-4d0ab2e1-434c-4af2-94ae-982070752fb8', 6.214286, 1.5, NULL, 'Gary, James', 'Execution', NULL, 0.75, false, '2026-02-05 21:50:55.404+00', '2026-02-09 22:08:47.944+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.sprint_allocations VALUES (135, 'proj-q1-2026-ccf88bc7-e849-4d9b-9b07-e09f0e979dc5', 'sprint-q1-2026-4f835690-a9a9-4702-a923-dc2f6a865ef9', 14.6025, 0, NULL, 'Itamar, Gary', 'Execution', NULL, 1.6, false, '2026-02-10 17:23:21.631135+00', '2026-02-10 19:58:35.690433+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.sprint_allocations VALUES (153, 'proj-q1-2026-dddfb28a-d95e-4901-bced-fc794b61beb4', 'sprint-q1-2026-c83b2969-2eb2-42b7-8f02-bf0178a7b02b', 0, 0, NULL, NULL, 'Execution', NULL, 0, false, '2026-02-10 17:52:35.731576+00', '2026-02-10 18:14:18.41236+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.sprint_allocations VALUES (93, 'proj-q1-2026-f1597472-7b27-4dc3-93f1-89d4b35643d1', 'sprint-q1-2026-c83b2969-2eb2-42b7-8f02-bf0178a7b02b', 0, 0, NULL, NULL, 'Execution', NULL, 0, false, '2026-02-05 21:59:19.483+00', '2026-02-10 16:29:49.76793+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.sprint_allocations VALUES (90, 'proj-q1-2026-9fcbbce9-3d0f-431f-a6fb-fcd5a8edd9e9', 'sprint-q1-2026-08389057-0be7-4e71-a6a9-c3b4a187c856', 0, 0, NULL, NULL, 'Execution', NULL, 0, false, '2026-02-05 21:53:12.147+00', '2026-02-10 17:06:00.659473+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.sprint_allocations VALUES (83, 'proj-q1-2026-1f16c781-b8b0-442a-b399-8d835336d9ef', 'sprint-q1-2026-599fd242-2419-4fad-9c84-6a6499c973ff', 2.0714285, 0, NULL, 'Gary', 'Execution', 'Bug fixes', 0.5, false, '2026-02-05 21:47:35.777+00', '2026-02-09 22:08:47.935+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.sprint_allocations VALUES (77, 'proj-q1-2026-2a6178df-71e9-422e-887a-fcefcfe8499e', 'sprint-q1-2026-599fd242-2419-4fad-9c84-6a6499c973ff', 4.142857, 0, NULL, 'Itamar', 'Execution', NULL, 1, false, '2026-02-05 20:30:09.636+00', '2026-02-09 22:08:47.936+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.sprint_allocations VALUES (119, 'proj-q1-2026-ba49153c-a70a-40c7-8595-2a252aeda90d', 'sprint-q1-2026-4f835690-a9a9-4702-a923-dc2f6a865ef9', 0, 0, NULL, NULL, 'UAT', NULL, 0, false, '2026-02-10 16:34:42.119222+00', '2026-02-10 20:15:21.367911+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.sprint_allocations VALUES (134, 'proj-q1-2026-ccf88bc7-e849-4d9b-9b07-e09f0e979dc5', 'sprint-q1-2026-08389057-0be7-4e71-a6a9-c3b4a187c856', 3.31875, 0, NULL, 'Itamar', 'Tech Spec', NULL, 0.4, false, '2026-02-10 17:23:12.091297+00', '2026-02-13 16:40:12.63222+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.sprint_allocations VALUES (121, 'proj-q1-2026-7168f968-bbc4-4402-aecf-28bb7b767a3c', 'sprint-q1-2026-4f835690-a9a9-4702-a923-dc2f6a865ef9', 27.379688, 0, NULL, 'Verto, Eduardo, New Engineer 2', 'Execution', NULL, 3, false, '2026-02-10 16:36:50.716971+00', '2026-02-10 20:25:28.815068+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.sprint_allocations VALUES (152, 'proj-q1-2026-ccf88bc7-e849-4d9b-9b07-e09f0e979dc5', 'sprint-q1-2026-c83b2969-2eb2-42b7-8f02-bf0178a7b02b', 23.729063, 0, NULL, 'Itamar, Gary, New Engineer 1', 'Execution', NULL, 2.6, false, '2026-02-10 17:52:04.340818+00', '2026-02-10 20:27:11.382764+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.sprint_allocations VALUES (95, 'proj-q1-2026-f1597472-7b27-4dc3-93f1-89d4b35643d1', 'sprint-q1-2026-4f835690-a9a9-4702-a923-dc2f6a865ef9', 0, 0, 'No additional work can be done', 'James', 'Rollout', NULL, 0, false, '2026-02-05 22:02:51.747+00', '2026-02-10 20:26:14.263791+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.sprint_allocations VALUES (130, 'proj-q1-2026-48faeb15-9d0f-45a4-a69a-46ab88ea7879', 'sprint-q1-2026-4f835690-a9a9-4702-a923-dc2f6a865ef9', 7.30125, 0, '0.2 for KTLO', 'James', 'Tech Spec,Execution', 'Tech spec + Execute', 0.8, false, '2026-02-10 17:20:51.529555+00', '2026-02-13 14:54:03.361906+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.sprint_allocations VALUES (91, 'proj-q1-2026-9fcbbce9-3d0f-431f-a6fb-fcd5a8edd9e9', 'sprint-q1-2026-c83b2969-2eb2-42b7-8f02-bf0178a7b02b', 0, 0, NULL, 'Gary', 'Execution', 'Mark all events deprecated and give end of H1 timeline to move off', 0, false, '2026-02-05 21:53:26.88+00', '2026-02-10 20:27:24.627798+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.sprint_allocations VALUES (92, 'proj-q1-2026-61cdce06-f0f6-4b18-a185-81d39acf8403', 'sprint-q1-2026-08389057-0be7-4e71-a6a9-c3b4a187c856', 4.1484375, 0, NULL, 'Gary', 'Execution,Rollout', NULL, 0.5, false, '2026-02-05 21:56:35.494+00', '2026-02-13 14:52:56.430091+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.sprint_allocations VALUES (169, 'proj-q1-2026-48faeb15-9d0f-45a4-a69a-46ab88ea7879', 'sprint-q1-2026-08389057-0be7-4e71-a6a9-c3b4a187c856', 0, 0, NULL, 'James', 'Tech Spec', NULL, 0, false, '2026-02-10 18:12:48.007453+00', '2026-02-13 14:39:53.139414+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.sprint_allocations VALUES (122, 'proj-q1-2026-7168f968-bbc4-4402-aecf-28bb7b767a3c', 'sprint-q1-2026-c83b2969-2eb2-42b7-8f02-bf0178a7b02b', 27.379688, 0, NULL, 'Verto, Eduardo, New Engineer 2', 'Execution', NULL, 3, false, '2026-02-10 16:37:10.885855+00', '2026-02-10 20:25:34.499206+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.sprint_allocations VALUES (164, 'proj-q2-2026-ccf88bc7-e849-4d9b-9b07-e09f0e979dc5', 'sprint-q2-2026-6e010e1d-828a-4e35-bcb3-9e4714a9916e', 2.1576922, 0, NULL, 'Itamar', 'Rollout', 'Support', 0.25, false, '2026-02-10 18:00:28.233334+00', '2026-02-10 18:00:28.233334+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.sprint_allocations VALUES (166, 'proj-q2-2026-7168f968-bbc4-4402-aecf-28bb7b767a3c', 'sprint-q2-2026-6e010e1d-828a-4e35-bcb3-9e4714a9916e', 8.630769, 0, NULL, 'Verto', 'Rollout', 'Support', 1, false, '2026-02-10 18:01:55.980467+00', '2026-02-10 18:01:55.980467+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.sprint_allocations VALUES (163, 'proj-q2-2026-ccf88bc7-e849-4d9b-9b07-e09f0e979dc5', 'sprint-q2-2026-88b390f5-c3d6-47f1-9cc2-8533f3b3afe3', 8.630769, 0, NULL, 'Itamar', 'UAT,Developer Testing', 'Onsite testing  + Bugfixes', 1, false, '2026-02-10 18:00:07.899781+00', '2026-02-13 14:54:27.687594+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.sprint_allocations VALUES (114, 'proj-q1-2026-f1597472-7b27-4dc3-93f1-89d4b35643d1', 'sprint-q1-2026-08389057-0be7-4e71-a6a9-c3b4a187c856', 14.519531, 0, '0.25 of James to help with KTLO', 'James, Eduardo', 'Execution,Tech Spec', NULL, 1.75, false, '2026-02-10 16:28:15.954472+00', '2026-02-13 14:53:10.192079+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.sprint_allocations VALUES (118, 'proj-q1-2026-ba49153c-a70a-40c7-8595-2a252aeda90d', 'sprint-q1-2026-08389057-0be7-4e71-a6a9-c3b4a187c856', 0, 0, NULL, 'New Engineer 2', 'Execution', 'Decima + other monitoring', 0, false, '2026-02-10 16:34:11.075405+00', '2026-02-13 14:38:05.741681+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.sprint_allocations VALUES (165, 'proj-q2-2026-7168f968-bbc4-4402-aecf-28bb7b767a3c', 'sprint-q2-2026-88b390f5-c3d6-47f1-9cc2-8533f3b3afe3', 17.261538, 0, NULL, 'Verto, Eduardo', 'UAT,Developer Testing', 'Onsite Testing + Bug fixes', 2, false, '2026-02-10 18:01:32.64995+00', '2026-02-13 14:54:32.244258+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.sprint_allocations VALUES (89, 'proj-q1-2026-a4cbe087-3964-4e6e-97fb-52c74820f49b', 'sprint-q1-2026-08389057-0be7-4e71-a6a9-c3b4a187c856', 0.8296875, 0, NULL, 'Itamar', 'Rollout', NULL, 0.1, false, '2026-02-05 21:52:34.077+00', '2026-02-13 16:39:51.92557+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.sprint_allocations VALUES (197, 'proj-q1-2026-48faeb15-9d0f-45a4-a69a-46ab88ea7879', 'sprint-q1-2026-c83b2969-2eb2-42b7-8f02-bf0178a7b02b', 7.30125, 0, '0.2 for KTLO', 'James', 'Execution', NULL, 0.8, false, '2026-02-10 20:17:52.402063+00', '2026-02-10 20:22:24.460949+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.sprint_allocations VALUES (220, 'proj-q1-2026-dddfb28a-d95e-4901-bced-fc794b61beb4', 'sprint-q1-2026-4d0ab2e1-434c-4af2-94ae-982070752fb8', 0.8296875, 0, NULL, 'Gary', 'Tech Spec', NULL, 0.1, false, '2026-02-13 14:41:34.30968+00', '2026-02-13 14:41:34.30968+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.sprint_allocations VALUES (149, 'proj-q1-2026-dddfb28a-d95e-4901-bced-fc794b61beb4', 'sprint-q1-2026-4f835690-a9a9-4702-a923-dc2f6a865ef9', 9.126562, 0, 'James(0.25) is just getting the work aligned while the new engineer will execute', 'New Engineer 1', 'Rollout,Execution,UAT', 'Onsite and fix bugs', 1, false, '2026-02-10 17:49:30.759441+00', '2026-02-13 14:53:48.486148+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.sprint_allocations VALUES (170, 'proj-q1-2026-dddfb28a-d95e-4901-bced-fc794b61beb4', 'sprint-q1-2026-08389057-0be7-4e71-a6a9-c3b4a187c856', 14.104688, 0, E'Focus on the UI pieces on week 1 - Gary has only 0.2 capacity to help with KTLO \n\nNew engineer 18th - 23rd project doing\nAll 2 engineers on it\nMarch 6th pilot mode ', 'Gary, New Engineer 1 and 2', 'Execution', NULL, 1.7, false, '2026-02-10 18:13:50.705421+00', '2026-02-13 17:21:10.719746+00') ON CONFLICT (id) DO NOTHING;
INSERT INTO public.sprint_allocations VALUES (120, 'proj-q1-2026-7168f968-bbc4-4402-aecf-28bb7b767a3c', 'sprint-q1-2026-08389057-0be7-4e71-a6a9-c3b4a187c856', 12.4453125, 0, 'Mustafa to give on perspective on Monday', 'Verto, New Engineer 2', 'Tech Spec,Execution', 'Think about what needs to happen and infra setup', 1.5, false, '2026-02-10 16:36:37.414383+00', '2026-02-13 17:29:33.276775+00') ON CONFLICT (id) DO NOTHING;

-- Team Quarter Settings
INSERT INTO public.team_quarter_settings VALUES (1, 'team-1770308519880', 'q1-2026', 3, 0.5, '2026-02-05 17:40:31.191+00', '2026-02-06 15:06:01.982+00', 0.1, 5) ON CONFLICT (id) DO NOTHING;
INSERT INTO public.team_quarter_settings VALUES (4, 'team-1770308519880', 'q2-2026', 6, 1, '2026-02-05 21:32:48.262+00', '2026-02-10 16:17:52.514181+00', 0.15, 5) ON CONFLICT (id) DO NOTHING;

-- Reset sequences
SELECT pg_catalog.setval('public.capacity_snapshots_id_seq', 1, false);
SELECT pg_catalog.setval('public.holidays_id_seq', 75, true);
SELECT pg_catalog.setval('public.pto_entries_id_seq', 1, false);
SELECT pg_catalog.setval('public.sprint_allocations_id_seq', 233, true);
SELECT pg_catalog.setval('public.sprint_snapshots_id_seq', 1, false);
SELECT pg_catalog.setval('public.team_quarter_settings_id_seq', 9, true);
