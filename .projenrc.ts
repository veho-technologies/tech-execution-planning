import { GaiaCdkPgKyselyApp } from '@veho/gaia-projen'
import { NodePackageManager } from 'projen/lib/javascript'

const project = new GaiaCdkPgKyselyApp({
  workflowNodeVersion: '22.14.0',
  cdkVersion: '2.128.0',
  ciSlackChannel: '_circleci',
  defaultReleaseBranch: 'main',
  enableCIWorkflowSynthesis: true,
  enableLambdaLiveDebugger: false,
  enablePersonalStacks: true,
  name: 'tech-execution-planning',
  projenrcTs: true,

  deps: [
    '@veho/cdk@^14.18.5',
    'kysely@^0.28.11',
    'pg@^8.18.0',
    '@linear/sdk@^30.0.0',
    'next@14.1.0',
    'react@^18.2.0',
    'react-dom@^18.2.0',
    '@dnd-kit/core@^6.3.1',
    '@dnd-kit/sortable@^10.0.0',
    '@dnd-kit/utilities@^3.2.2',
    '@tanstack/react-query@^5.17.19',
    'date-fns@^3.2.0',
    'dotenv@^17.2.3',
    'lucide-react@^0.309.0',
    'recharts@^2.10.4',
    'zod@^3.22.4',
    'zustand@^4.5.0',
  ],

  devDeps: [
    '@veho/gaia-projen@^8.7.0',
    '@types/pg@^8.16.0',
    '@types/node@^20',
    '@types/react@^18',
    '@types/react-dom@^18',
    'autoprefixer@^10.0.1',
    'postcss@^8',
    'tailwindcss@^3.3.0',
    'tsx@^4.21.0',
    'kysely-codegen@^0.19.0',
    'eslint-config-next@14.1.0',
  ],

  packageManager: NodePackageManager.NPM,
  jest: false,

  codecovOptions: {
    config: {
      ignore: ['src/main.ts', 'src/stacks/**/*.ts'],
    },
  },
})

project.addTask('dev', {
  exec: 'next dev',
})

project.addTask('next:build', {
  exec: 'next build',
})

project.addTask('next:start', {
  exec: 'next start',
})

project.addTask('db-codegen:local', {
  steps: [
    {
      exec: 'export $(cat .env.local | grep -v "^#" | xargs) && npx kysely-codegen --config-file .kysely-codegenrc.json --out-file ./src/types/db.ts',
    },
  ],
})

project.addGitIgnore('.next')
project.addGitIgnore('.env.local')
project.addGitIgnore('.env')
project.addGitIgnore('cdk.out')
project.addGitIgnore('.claude/settings.local.json')

project.synth()
