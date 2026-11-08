import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['dist', 'node_modules', '.worktrees'] },
  {
    extends: [...tseslint.configs.recommended],
    files: ['**/*.{js,ts,tsx}'],
  },
  prettier,
);
