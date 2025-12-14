import { execSync } from 'child_process';
import type { DeclastructChange } from 'declastruct';
import { existsSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { given, then, when } from 'test-fns';

/**
 * .what = acceptance tests for github apps via declastruct CLI workflow
 * .why = validates end-to-end usage of declastruct-github for app resources
 * .note = apps cannot be created via API; tests focus on plan generation
 */
describe('declastruct apps CLI workflow', () => {
  given('a declastruct resources file with app declarations', () => {
    const testDir = join(
      __dirname,
      '.test',
      '.temp',
      'acceptance-apps',
      `run.${new Date().toISOString()}`,
    );
    const resourcesFile = join(
      __dirname,
      '.test',
      'assets',
      'resources.apps.acceptance.ts',
    );
    const planFile = join(testDir, 'plan.json');

    beforeAll(() => {
      // ensure clean test directory
      mkdirSync(testDir, { recursive: true });
    });

    when('generating a plan via declastruct CLI', () => {
      beforeAll(() => {
        // generate plan once for all tests in this given block
        execSync(
          `npx declastruct plan --wish ${resourcesFile} --into ${planFile}`,
          { stdio: 'inherit', env: process.env },
        );
      });
      then('creates a valid plan file with app resources', async () => {
        /**
         * .what = validates declastruct plan command produces valid JSON output for apps
         * .why = ensures CLI can parse app resources file and generate plan
         */

        // verify plan file exists
        const planExists = existsSync(planFile);
        expect(planExists).toBe(true);

        // verify plan contains expected structure
        const plan = JSON.parse(readFileSync(planFile, 'utf-8'));
        expect(plan).toHaveProperty('changes');
        expect(Array.isArray(plan.changes)).toBe(true);
      });

      then('plan includes app and installation resources', async () => {
        /**
         * .what = validates plan includes all declared app resources
         * .why = ensures declastruct correctly processes app resource declarations
         */

        // parse plan
        const plan = JSON.parse(readFileSync(planFile, 'utf-8'));

        // verify app resource
        const appResource: DeclastructChange = plan.changes.find(
          (r: DeclastructChange) => r.forResource.class === 'DeclaredGithubApp',
        );
        expect(appResource).toBeDefined();
        expect(appResource.forResource.slug).toContain(
          'declastruct-github-demo-app',
        );

        // verify installation resource
        const installationResource: DeclastructChange = plan.changes.find(
          (r: DeclastructChange) =>
            r.forResource.class === 'DeclaredGithubAppInstallation',
        );
        expect(installationResource).toBeDefined();
      });
    });

    when('applying a plan via declastruct CLI', () => {
      then('applies changes successfully', async () => {
        /**
         * .what = validates declastruct apply works with app resources
         * .why = ensures end-to-end workflow from plan to reality
         */

        // apply plan
        execSync(`npx declastruct apply --plan ${planFile}`, {
          stdio: 'inherit',
          env: process.env,
        });
      });
    });

    when('running plan again after apply', () => {
      const replanFile = join(testDir, 'replan.json');

      beforeAll(() => {
        // generate plan again to verify no permadiffs
        execSync(
          `npx declastruct plan --wish ${resourcesFile} --into ${replanFile}`,
          { stdio: 'inherit', env: process.env },
        );
      });

      then('all planned actions should be KEEP', async () => {
        /**
         * .what = validates no permadiffs after apply
         * .why = proves the apply worked and state matches desired
         */

        // parse replan
        const replan = JSON.parse(readFileSync(replanFile, 'utf-8'));

        // verify all changes are KEEP
        const nonKeepChanges = replan.changes.filter(
          (c: { action: string }) => c.action !== 'KEEP',
        );
        expect(nonKeepChanges).toEqual([]);
      });
    });
  });
});
