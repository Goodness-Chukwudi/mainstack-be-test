const JoiValidatorOptions = {
    errors: {
      wrap: {
        label: ""
      }
    },
    stripUnknown: true,
    abortEarly: false
};

const PaginationCustomLabels = {
  totalDocs: 'items_count',
  docs: 'data',
  limit: 'items_per_page',
  page: 'current_page',
  nextPage: 'next_page',
  prevPage: 'previous_page',
  totalPages: 'page_count',
  pagingCounter: 'serial_number',
  meta: 'paginator'
};

const DbConfig = {
  dbName: "mainstack-test",
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 100
};

export {
  JoiValidatorOptions,
  PaginationCustomLabels,
  DbConfig
}