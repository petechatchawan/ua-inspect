import { labels } from '../../src/labels';

describe('stable ids', () => {
    it('matches the published id snapshot', () => {
        const ids = Object.fromEntries(
            Object.entries(labels)
                .map(([kind, table]) => [kind, Object.keys(table).sort()] as const)
                .sort(([left], [right]) => left.localeCompare(right)),
        );

        expect(ids).toMatchSnapshot(
            'Renaming or removing an id is a major release. Update this snapshot and the changelog deliberately.',
        );
    });
});
