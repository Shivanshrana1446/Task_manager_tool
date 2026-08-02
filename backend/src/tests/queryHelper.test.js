const {
  parsePagination,
  parseSort,
  escapeRegex,
  buildSearchFilter,
  pickFilter,
  buildPaginationMeta,
  paginateQuery,
} = require('../utils/queryHelper');

describe('parsePagination', () => {
  it('defaults to page 1 and limit 20 when nothing is provided', () => {
    expect(parsePagination({})).toEqual({ page: 1, limit: 20, skip: 0 });
  });

  it('coerces string numbers and computes skip', () => {
    expect(parsePagination({ page: '3', limit: '10' })).toEqual({ page: 3, limit: 10, skip: 20 });
  });

  it('clamps page below 1 up to 1', () => {
    expect(parsePagination({ page: '-5' }).page).toBe(1);
  });

  it('clamps limit above the max down to 100', () => {
    expect(parsePagination({ limit: '999' }).limit).toBe(100);
  });

  it('clamps a negative limit up to 1', () => {
    expect(parsePagination({ limit: '-5' }).limit).toBe(1);
  });
});

describe('parseSort', () => {
  it('uses the default sort when no sort query is given', () => {
    expect(parseSort({})).toEqual({ createdAt: -1 });
  });

  it('honors a caller-supplied default sort', () => {
    expect(parseSort({}, 'name')).toEqual({ name: 1 });
  });

  it('parses an ascending field with no prefix', () => {
    expect(parseSort({ sort: 'name' })).toEqual({ name: 1 });
  });

  it('parses a descending field with a "-" prefix', () => {
    expect(parseSort({ sort: '-dueDate' })).toEqual({ dueDate: -1 });
  });

  it('parses multiple comma-separated fields', () => {
    expect(parseSort({ sort: '-priority,name' })).toEqual({ priority: -1, name: 1 });
  });
});

describe('escapeRegex', () => {
  it('escapes regex special characters', () => {
    expect(escapeRegex('a.b*c?')).toBe('a\\.b\\*c\\?');
  });
});

describe('buildSearchFilter', () => {
  it('returns an empty filter when there is no search term', () => {
    expect(buildSearchFilter({}, ['name'])).toEqual({});
  });

  it('returns an empty filter when no searchable fields are given', () => {
    expect(buildSearchFilter({ search: 'ada' })).toEqual({});
  });

  it('builds a case-insensitive $or regex filter across the given fields', () => {
    const filter = buildSearchFilter({ search: 'Ada' }, ['name', 'email']);
    expect(filter.$or).toHaveLength(2);
    expect(filter.$or[0].name.test('ada lovelace')).toBe(true);
    expect(filter.$or[1].email.test('ADA@EXAMPLE.COM')).toBe(true);
  });
});

describe('pickFilter', () => {
  it('includes only allowed fields with defined, non-empty values', () => {
    const result = pickFilter({ status: 'active', priority: '', extra: 'ignored' }, ['status', 'priority']);
    expect(result).toEqual({ status: 'active' });
  });

  it('returns an empty object when no allowed fields are given', () => {
    expect(pickFilter({ status: 'active' })).toEqual({});
  });
});

describe('buildPaginationMeta', () => {
  it('computes total pages and next/prev flags', () => {
    expect(buildPaginationMeta({ page: 2, limit: 10, total: 25 })).toEqual({
      page: 2,
      limit: 10,
      total: 25,
      totalPages: 3,
      hasNextPage: true,
      hasPrevPage: true,
    });
  });

  it('treats zero results as a single (empty) page', () => {
    const meta = buildPaginationMeta({ page: 1, limit: 10, total: 0 });
    expect(meta.totalPages).toBe(1);
    expect(meta.hasNextPage).toBe(false);
    expect(meta.hasPrevPage).toBe(false);
  });
});

const buildFakeModel = (docs) => {
  const query = {
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    then: (resolve) => resolve(docs),
  };
  return {
    find: jest.fn().mockReturnValue(query),
    countDocuments: jest.fn().mockResolvedValue(docs.length),
    __query: query,
  };
};

describe('paginateQuery', () => {
  it('paginates without populate or explicit searchFields/defaultSort', async () => {
    const Model = buildFakeModel([{ id: 1 }, { id: 2 }]);

    const { data, pagination } = await paginateQuery({ Model, filter: { active: true }, query: {} });

    expect(Model.find).toHaveBeenCalledWith({ active: true });
    expect(Model.__query.populate).not.toHaveBeenCalled();
    expect(data).toEqual([{ id: 1 }, { id: 2 }]);
    expect(pagination.total).toBe(2);
  });

  it('applies populate when provided', async () => {
    const Model = buildFakeModel([]);

    await paginateQuery({ Model, query: {}, populate: { path: 'owner' } });

    expect(Model.__query.populate).toHaveBeenCalledWith({ path: 'owner' });
  });

  it('merges the search filter into the base filter', async () => {
    const Model = buildFakeModel([]);

    await paginateQuery({
      Model,
      filter: { status: 'active' },
      query: { search: 'ada' },
      searchFields: ['name'],
    });

    expect(Model.find).toHaveBeenCalledWith({
      status: 'active',
      $or: [{ name: expect.any(RegExp) }],
    });
  });
});
