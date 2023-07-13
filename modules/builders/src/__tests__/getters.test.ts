import path from 'node:path';
import { getGraph } from '@onerepo/graph';
import * as git from '@onerepo/git';
import { affected, filepaths, workspaces } from '../getters';

jest.mock('@onerepo/git');

const graph = getGraph(path.join(__dirname, '__fixtures__', 'repo'));

describe('affected', () => {
	beforeEach(() => {
		jest.spyOn(git, 'getModifiedFiles').mockResolvedValue([]);
	});

	test('returns all workspaces if the root is affected', async () => {
		jest.spyOn(git, 'getModifiedFiles').mockResolvedValue(['not/in/a/module.json']);

		const workspaces = await affected(graph);

		expect(workspaces).toEqual(graph.workspaces);
	});

	test('only returns affected list', async () => {
		jest.spyOn(git, 'getModifiedFiles').mockResolvedValue(['modules/tacos/package.json']);

		const workspaces = await affected(graph);

		expect(workspaces).toEqual([graph.getByName('tacos'), graph.getByName('menu')]);
	});
});

describe('filepaths', () => {
	beforeEach(() => {
		jest.spyOn(git, 'getModifiedFiles').mockResolvedValue([]);
	});

	test('returns "." if --all', async () => {
		const paths = await filepaths(graph, { all: true });

		expect(paths).toEqual(['.']);
	});

	test('returns "." if --all and any other valid arg', async () => {
		const pathFiles = await filepaths(graph, { all: true, files: ['foo'] });
		expect(pathFiles).toEqual(['.']);

		const pathWorkspaces = await filepaths(graph, { all: true, workspaces: ['foo'] });
		expect(pathWorkspaces).toEqual(['.']);

		const pathAffected = await filepaths(graph, { all: true, affected: true });
		expect(pathAffected).toEqual(['.']);
	});

	test('returns workspace locations if threshold is hit', async () => {
		jest
			.spyOn(git, 'getModifiedFiles')
			.mockResolvedValue(['modules/burritos/package.json', 'modules/burritos/bar', 'modules/burritos/baz']);

		const paths = await filepaths(graph, { affected: true }, { affectedThreshold: 2 });
		expect(paths).toEqual(['modules/burritos']);
	});

	test('if threshold is zero, returns all files', async () => {
		jest
			.spyOn(git, 'getModifiedFiles')
			.mockResolvedValue(['modules/burritos/foo', 'modules/burritos/bar', 'modules/burritos/baz']);

		const paths = await filepaths(graph, { affected: true }, { affectedThreshold: 0 });
		expect(paths).toEqual(['modules/burritos/foo', 'modules/burritos/bar', 'modules/burritos/baz']);
	});

	test('if root is affected and over threshold, only returns root filepath', async () => {
		jest.spyOn(git, 'getModifiedFiles').mockResolvedValue(['foo', 'modules/burritos/bar', 'modules/burritos/baz']);

		const paths = await filepaths(graph, { affected: true }, { affectedThreshold: 2 });
		expect(paths).toEqual(['.']);
	});
});

describe('workspaces', () => {
	beforeEach(() => {
		jest.spyOn(git, 'getModifiedFiles').mockResolvedValue([]);
	});

	test('returns all workspaces if root is affected', async () => {
		jest.spyOn(git, 'getModifiedFiles').mockResolvedValue(['not/in/a/module.json']);

		const wss = await workspaces(graph, { affected: true });
		expect(wss).toEqual(graph.workspaces);
	});

	test('returns all workspaces if --all', async () => {
		const wss = await workspaces(graph, { all: true });
		expect(wss).toEqual(graph.workspaces);
	});
});
