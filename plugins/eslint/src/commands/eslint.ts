import path from 'node:path';
import ignore from 'ignore';
import { git, file, builders } from 'onerepo';
import type { Builder, Handler } from 'onerepo';

export const command = ['eslint', 'lint'];

export const description = 'Run eslint across files and Workspaces.';

type Args = builders.WithAllInputs & {
	add?: boolean;
	cache: boolean;
	extensions?: Array<string>;
	fix: boolean;
	'github-annotate': boolean;
	pretty: boolean;
	warnings: boolean;
};

export const builder: Builder<Args> = (yargs) =>
	builders
		.withAllInputs(yargs)
		.option('add', {
			type: 'boolean',
			description: 'Add modified files after write to the git stage.',
			conflicts: ['all'],
		})
		.option('cache', {
			type: 'boolean',
			default: true,
			description: 'Use cache if available',
		})
		.option('fix', {
			type: 'boolean',
			default: true,
			description: 'Apply auto-fixes if possible',
		})
		.option('extensions', {
			description: 'Make ESLint check files given these extensions.',
			type: 'array',
			string: true,
		})
		.option('pretty', {
			type: 'boolean',
			default: true,
			description: 'Control ESLint’s `--color` flag.',
		})
		.option('warnings', {
			alias: ['warn'],
			type: 'boolean',
			description: 'Report warnings from ESLint.',
			default: true,
		})
		.option('github-annotate', {
			description: 'Annotate files in GitHub with errors when failing lint checks in GitHub Actions',
			type: 'boolean',
			default: true,
			hidden: true,
		})
		.middleware((argv) => {
			if (argv.add && !('staged' in argv)) {
				argv.staged = true;
			}
		});

export const handler: Handler<Args> = async function handler(argv, { getFilepaths, graph, logger }) {
	const {
		add,
		all,
		cache,
		'dry-run': isDry,
		extensions,
		fix,
		'github-annotate': github,
		pretty,
		warnings,
		'--': passthrough = [],
	} = argv;

	let filteredPaths: Array<string> = [];
	if (!all) {
		const ignoreStep = logger.createStep('Filtering ignored files');

		const paths = await getFilepaths({ step: ignoreStep });
		if (paths.includes('.')) {
			filteredPaths = ['.'];
		} else {
			const ignoreFile = graph.root.resolve('.eslintignore');
			const hasIgnores = await file.exists(ignoreFile, { step: ignoreStep });
			const rawIgnores = await (hasIgnores ? file.read(ignoreFile, 'r', { step: ignoreStep }) : '');
			const ignores = rawIgnores.split('\n').filter((line) => Boolean(line.trim()) && !line.trim().startsWith('#'));
			const matcher = ignore().add(ignores);
			filteredPaths = matcher.filter(paths.map((p) => (path.isAbsolute(p) ? graph.root.relative(p) : p)));

			if (extensions && extensions.length) {
				filteredPaths = filteredPaths.filter((filepath) => {
					const ext = path.extname(filepath);
					if (!ext) {
						return true;
					}

					return extensions.includes(ext.replace(/^\./, ''));
				});
			}
		}

		await ignoreStep.end();
	}

	if (!all && !filteredPaths.length) {
		logger.warn('No files have been selected to lint. Exiting early.');
		return;
	}

	const args = [pretty ? '--color' : '--no-color'];
	if (extensions && extensions.length) {
		args.push('--ext', extensions.join(','));
	}
	if (!(passthrough.includes('-f') || passthrough.includes('--format'))) {
		args.push('--format', 'onerepo');
	}
	if (cache) {
		args.push('--cache', '--cache-strategy=content');
	}
	if (!isDry && fix) {
		args.push('--fix');
	}
	if (!warnings) {
		args.push('--quiet');
	}

	const runStep = logger.createStep('Lint files');
	const [out, err] = await graph.packageManager.run({
		name: `Lint ${all ? '' : filteredPaths.join(', ').substring(0, 40)}…`,
		cmd: 'eslint',
		args: [...args, ...(all ? ['.'] : filteredPaths), ...passthrough],
		opts: {
			env: { ONEREPO_ESLINT_GITHUB_ANNOTATE: github ? 'true' : 'false' },
		},
		step: runStep,
		skipFailures: true,
	});

	if (out) {
		// GitHub needs to read these from the start of the line. The Logger will prefix with ERR by default, so we need to proxy directly to process.stdout instead
		const ghLines = out.match(/^::.*$/gm);
		if (ghLines) {
			process.stdout.write(ghLines.join('\n'));
			process.stdout.write('\n');
		}

		runStep.error(out.replace(/^::.*$/gm, ''));
	}

	// If eslint has an internal or config problem, it logs to stderr, not stdout
	if (err) {
		runStep.error(err);
	}

	await runStep.end();

	if (add && filteredPaths.length) {
		await git.updateIndex(filteredPaths);
	}
};
