import * as subprocess from '@onerepo/subprocess';
import { Yarn as manager } from '../yarn';

describe('Yarn', () => {
	beforeEach(() => {
		vi.spyOn(subprocess, 'run').mockResolvedValue(['', '']);
		vi.spyOn(subprocess, 'batch').mockResolvedValue([['', '']]);
	});
	describe('add', () => {
		test('Adds single packages', async () => {
			await manager.add('tacos');

			expect(subprocess.run).toHaveBeenCalledWith(
				expect.objectContaining({
					cmd: 'yarn',
					args: ['add', 'tacos'],
				}),
			);
		});

		test('Adds multiple packages', async () => {
			await manager.add(['tacos', 'burritos']);

			expect(subprocess.run).toHaveBeenCalledWith(
				expect.objectContaining({
					cmd: 'yarn',
					args: ['add', 'tacos', 'burritos'],
				}),
			);
		});

		test('Adds as dev dependencies', async () => {
			await manager.add(['tacos', 'burritos'], { dev: true });

			expect(subprocess.run).toHaveBeenCalledWith(
				expect.objectContaining({
					cmd: 'yarn',
					args: ['add', 'tacos', 'burritos', '--dev'],
				}),
			);
		});
	});

	describe('install', () => {
		test('Runs install', async () => {
			await expect(manager.install()).resolves.toEqual('yarn.lock');
			expect(subprocess.run).toHaveBeenCalledWith(
				expect.objectContaining({
					cmd: 'yarn',
					args: ['install'],
				}),
			);
		});
	});

	describe('loggedIn', () => {
		test('returns false if cmd fails', async () => {
			vi.spyOn(subprocess, 'run').mockRejectedValue(new Error());
			await expect(manager.loggedIn()).resolves.toBe(false);
		});

		test('returns true if cmd succeeds', async () => {
			await expect(manager.loggedIn()).resolves.toBe(true);
		});

		test('passes scope', async () => {
			await expect(manager.loggedIn({ scope: 'foobar' })).resolves.toBe(true);
			expect(subprocess.run).toHaveBeenCalledWith(
				expect.objectContaining({
					cmd: 'yarn',
					args: ['npm', 'whoami', '--scope', 'foobar'],
				}),
			);
		});
	});

	describe('publish', () => {
		let dryRun = process.env.ONEREPO_DRY_RUN;
		beforeEach(() => {
			dryRun = process.env.ONEREPO_DRY_RUN;
		});

		afterEach(() => {
			process.env.ONEREPO_DRY_RUN = dryRun;
		});

		test('publishes', async () => {
			await manager.publish({
				workspaces: [{ name: 'tacos', version: '1.0.0', location: '/tacos' }],
			});

			expect(subprocess.batch).toHaveBeenCalledWith(
				[
					expect.objectContaining({
						cmd: 'yarn',
						args: ['npm', 'publish', '--tag', 'latest', '--tolerate-republish'],
						opts: { cwd: '/tacos' },
					}),
				],
				{ maxParallel: 40 },
			);
		});

		test('does not --dry-run', async () => {
			process.env.ONEREPO_DRY_RUN = 'true';

			await manager.publish({
				workspaces: [{ name: 'tacos', version: '1.0.0', location: '/tacos' }],
			});

			expect(subprocess.batch).toHaveBeenCalledWith(
				[
					expect.not.objectContaining({
						cmd: 'yarn',
						opts: { cwd: '/tacos' },
						runDry: true,
					}),
				],
				{ maxParallel: 40 },
			);
		});

		test('includes --access', async () => {
			await manager.publish({
				access: 'restricted',
				workspaces: [{ name: 'tacos', version: '1.0.0', location: '/tacos' }],
			});

			expect(subprocess.batch).toHaveBeenCalledWith(
				[
					expect.objectContaining({
						cmd: 'yarn',
						args: ['npm', 'publish', '--tag', 'latest', '--tolerate-republish', '--access', 'restricted'],
						opts: { cwd: '/tacos' },
					}),
				],
				{ maxParallel: 40 },
			);
		});

		test('includes --tag', async () => {
			await manager.publish({
				tag: 'tacos',
				workspaces: [{ name: 'tacos', version: '1.0.0', location: '/tacos' }],
			});

			expect(subprocess.batch).toHaveBeenCalledWith(
				[
					expect.objectContaining({
						cmd: 'yarn',
						args: ['npm', 'publish', '--tag', 'tacos', '--tolerate-republish'],
						opts: { cwd: '/tacos' },
					}),
				],
				{ maxParallel: 40 },
			);
		});

		test('version tag overrides --tag', async () => {
			await manager.publish({
				tag: 'tacos',
				workspaces: [
					{ name: 'tacos', version: '1.0.0', location: '/tacos' },
					{ name: 'burritos', version: '1.0.0-beta.1', location: '/burritos' },
				],
			});

			expect(subprocess.batch).toHaveBeenCalledWith(
				[
					expect.objectContaining({
						cmd: 'yarn',
						args: ['npm', 'publish', '--tag', 'tacos', '--tolerate-republish'],
						opts: { cwd: '/tacos' },
					}),
					expect.objectContaining({
						cmd: 'yarn',
						args: ['npm', 'publish', '--tag', 'beta', '--tolerate-republish'],
						opts: { cwd: '/burritos' },
					}),
				],
				{ maxParallel: 40 },
			);
		});

		test('includes --otp', async () => {
			await manager.publish({
				otp: 'tacos123',
				workspaces: [{ name: 'tacos', version: '1.0.0', location: '/tacos' }],
			});

			expect(subprocess.batch).toHaveBeenCalledWith(
				[
					expect.objectContaining({
						cmd: 'yarn',
						args: ['npm', 'publish', '--tag', 'latest', '--tolerate-republish', '--otp', 'tacos123'],
						opts: { cwd: '/tacos' },
					}),
				],
				{ maxParallel: 40 },
			);
		});

		test('can publish multiple workspaces', async () => {
			await manager.publish({
				workspaces: [
					{ name: 'tacos', version: '1.0.0', location: '/tacos' },
					{ name: 'burritos', version: '1.0.0-beta.1', location: '/burritos' },
				],
			});

			expect(subprocess.batch).toHaveBeenCalledWith(
				[
					expect.objectContaining({
						cmd: 'yarn',
						args: ['npm', 'publish', '--tag', 'latest', '--tolerate-republish'],
						opts: { cwd: '/tacos' },
					}),
					expect.objectContaining({
						cmd: 'yarn',
						args: ['npm', 'publish', '--tag', 'beta', '--tolerate-republish'],
						opts: { cwd: '/burritos' },
					}),
				],
				{ maxParallel: 40 },
			);
		});
	});

	describe('publishable', () => {
		test('filters Workspaces by the ones with a version not in the registry', async () => {
			vi.spyOn(subprocess, 'batch').mockImplementation((calls) => {
				return Promise.resolve(
					calls.map((spec) => {
						if (typeof spec === 'function') {
							return spec();
						}
						const { args } = spec;
						const versions: Array<string> = [];
						if (args?.includes('tacos')) {
							versions.push('1.2.3', '1.2.4');
						} else if (args?.includes('burritos')) {
							versions.push('4.5.6');
						}

						return [JSON.stringify({ name: args![2]!, versions }), ''];
					}) as Array<[string, string]>,
				);
			});

			const publishable = await manager.publishable([
				{ name: 'tacos', version: '1.2.5' },
				{ name: 'burritos', version: '4.5.6' },
			]);

			expect(publishable).toEqual([{ name: 'tacos', version: '1.2.5' }]);
		});

		test('ignores errors', async () => {
			vi.spyOn(subprocess, 'batch').mockImplementation((calls) => {
				return Promise.resolve(
					calls.map((spec) => {
						if (typeof spec === 'function') {
							return spec();
						}
						const { args } = spec;
						const versions: Array<string> = [];
						if (args?.includes('tacos')) {
							versions.push('1.2.3', '1.2.5');
						} else if (args?.includes('burritos')) {
							return new Error('i do not know');
						}

						return [JSON.stringify({ name: args![2]!, versions }), ''];
					}) as Array<[string, string]>,
				);
			});

			const publishable = await manager.publishable([
				{ name: 'tacos', version: '1.2.5' },
				{ name: 'burritos', version: '4.5.6' },
			]);

			expect(publishable).toEqual([{ name: 'burritos', version: '4.5.6' }]);
		});

		test('ignores when yarn npm info includes newlines', async () => {
			vi.spyOn(subprocess, 'batch').mockImplementation((calls) => {
				return Promise.resolve(
					calls.map((spec) => {
						if (typeof spec === 'function') {
							return spec();
						}
						const { args } = spec;
						const versions: Array<string> = [];
						if (args?.includes('tacos')) {
							versions.push('1.2.3', '1.2.5');
						} else if (args?.includes('burritos')) {
							return [
								'{"type":"error","name":35,"displayName":"YN0035","indent":"","data":"The remote server failed to provide the requested resource"}\n{"type":"error","name":35,"displayName":"YN0035","indent":"","data":"  Response Code: 404 (Not Found)"}\n{"type":"error","name":35,"displayName":"YN0035","indent":"","data":"  Request Method: GET"}',
								'',
							];
						}

						return [JSON.stringify({ name: args![2]!, versions }), ''];
					}) as Array<[string, string]>,
				);
			});

			const publishable = await manager.publishable([
				{ name: 'tacos', version: '1.2.5' },
				{ name: 'burritos', version: '4.5.6' },
			]);

			expect(publishable).toEqual([{ name: 'burritos', version: '4.5.6' }]);
		});

		test('does not fail for unparseable json', async () => {
			vi.spyOn(subprocess, 'batch').mockImplementation((calls) => {
				return Promise.resolve(
					calls.map((spec) => {
						if (typeof spec === 'function') {
							return spec();
						}
						const { args } = spec;
						const versions: Array<string> = [];
						if (args?.includes('tacos')) {
							return ['', ''];
						} else if (args?.includes('burritos')) {
							return ['LOL', ''];
						}

						return [JSON.stringify({ name: args![2]!, versions }), ''];
					}) as Array<[string, string]>,
				);
			});
			const publishable = await manager.publishable([
				{ name: 'tacos', version: '1.2.5' },
				{ name: 'burritos', version: '4.5.6' },
			]);

			expect(publishable).toEqual([
				{ name: 'tacos', version: '1.2.5' },
				{ name: 'burritos', version: '4.5.6' },
			]);
		});
	});

	describe('dedupe', () => {
		test('Runs dedupe', async () => {
			await manager.dedupe();

			expect(subprocess.run).toHaveBeenCalledWith(
				expect.objectContaining({
					cmd: 'yarn',
					args: ['dedupe'],
				}),
			);
		});
	});

	describe('remove', () => {
		test('Removes single packages', async () => {
			await manager.remove('tacos');

			expect(subprocess.run).toHaveBeenCalledWith(
				expect.objectContaining({
					cmd: 'yarn',
					args: ['remove', 'tacos'],
				}),
			);
		});

		test('Adds multiple packages', async () => {
			await manager.remove(['tacos', 'burritos']);

			expect(subprocess.run).toHaveBeenCalledWith(
				expect.objectContaining({
					cmd: 'yarn',
					args: ['remove', 'tacos', 'burritos'],
				}),
			);
		});
	});
});
