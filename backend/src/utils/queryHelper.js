const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const parsePagination = (query) => {
  const page = Math.max(Number(query.page) || DEFAULT_PAGE, 1);
  const limit = Math.min(Math.max(Number(query.limit) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

const parseSort = (query, defaultSort = '-createdAt') => {
  const raw = query.sort || defaultSort;

  return raw
    .split(',')
    .filter(Boolean)
    .map((field) => field.trim())
    .reduce((sort, field) => {
      if (field.startsWith('-')) {
        sort[field.slice(1)] = -1;
      } else {
        sort[field] = 1;
      }
      return sort;
    }, {});
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildSearchFilter = (query, fields = []) => {
  if (!query.search || fields.length === 0) return {};

  const regex = new RegExp(escapeRegex(query.search.trim()), 'i');
  return { $or: fields.map((field) => ({ [field]: regex })) };
};

const pickFilter = (query, allowedFields = []) =>
  allowedFields.reduce((filter, field) => {
    if (query[field] !== undefined && query[field] !== '') {
      filter[field] = query[field];
    }
    return filter;
  }, {});

const buildPaginationMeta = ({ page, limit, total }) => {
  const totalPages = Math.max(Math.ceil(total / limit), 1);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

const paginateQuery = async ({
  Model,
  filter = {},
  query = {},
  searchFields = [],
  defaultSort = '-createdAt',
  populate,
}) => {
  const { page, limit, skip } = parsePagination(query);
  const sort = parseSort(query, defaultSort);
  const searchFilter = buildSearchFilter(query, searchFields);
  const finalFilter = { ...filter, ...searchFilter };

  let dataQuery = Model.find(finalFilter).sort(sort).skip(skip).limit(limit);
  if (populate) {
    dataQuery = dataQuery.populate(populate);
  }

  const [data, total] = await Promise.all([dataQuery, Model.countDocuments(finalFilter)]);

  return { data, pagination: buildPaginationMeta({ page, limit, total }) };
};

module.exports = {
  parsePagination,
  parseSort,
  buildSearchFilter,
  pickFilter,
  buildPaginationMeta,
  paginateQuery,
  escapeRegex,
};
