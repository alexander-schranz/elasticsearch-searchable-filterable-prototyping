# Reproducer searchable/filterable field mapping

## Mapping:

`PUT /my_index/`:

```json
{
    "mappings" : {
        "properties" : {
            "title" : {
                "type" : "text"
            },
            "tags" : {
                "fields" : {
                    "keyword" : {
                        "type" : "keyword"
                    }
                },
                "type" : "text"
            },
            "internalTags" : {
                "type" : "keyword"
            },
            "internalComment" : {
                "doc_values" : false,
                "index" : false,
                "type" : "keyword"
            },
            "created" : {
                "type" : "date"
            },
            "changed" : {
                "doc_values" : false,
                "index" : false,
                "type" : "date"
            },
            "published" : {
                "type" : "date"
            }
        }
    }
}
```

The mapping for `created` and `published` should not match as.
As created should not be searchable but published should.

Expected behaviours:

```json5
{
    title: { type: 'text', searchable: true, filterable: false },
    tags: { type: 'text', searchable: true, filterable: true },
    internalTags: { type: 'text', searchable: false, filterable: true },
    internalComment: { type: 'text', searchable: false, filterable: false },
    created: { type: 'date', searchable: false, filterable: true },
    changed: { type: 'date', searchable: false, filterable: false },
    published: { type: 'date', searchable: true, filterable: true },
}
```

## Documents:

`POST /my_index/_doc`:

```json
{
    "title": "Title",
    "tags": ["UI", "Tech"],
    "internalTags": ["Review", "Finished"],
    "internalComment": "Internal Comment",
    "created": "1999-01-01",
    "changed": "2000-01-01",
    "published": "2023-01-01"
}
```

## Test Cases

### Text Searchable & Not Filterable (title)

The `title` field should be searchable but not filterable.

**Is searchable ✅**

`POST /my_index/_search`

```json
{
    "query": {
        "query_string": {
            "query": "Title"
        }
    }
}
```

Expected: 1 Result

**Is not filterable ✅**

This works is no keyword and so not filterable:

`POST /my_index/_search`

```json
{
    "query": {
        "term": {
            "title": "Title"
        }
    }
}
```

Expected: 0 Result

### Text Searchable & Filterable (tags)

The `tags` field should be searchable and filterable.

**Is searchable ✅**

`POST /my_index/_search`

```json
{
    "query": {
        "query_string": {
            "query": "Tech"
        }
    }
}
```

Expected: 1 Result

**Is filterable ✅**

This works because of `fields.keyword` additional index `true` so its performant:

`POST /my_index/_search`

```json
{
    "query": {
        "term": {
            "tags.keyword": "Tech"
        }
    }
}
```

Expected: 1 Result

### Text Not Searchable but Filterable (internalTags)

The `internalTags` field should not be searchable but filterable.

**Is not searchable ❌**

This does not work because of a performant `index: true` filter  it seems also be searchable:

`POST /my_index/_search`

```json
{
    "query": {
        "query_string": {
            "query": "Review"
        }
    }
}
```

Expected: 0 Result

**Is filterable ✅**

This works `keyword` the `index: true` is for performance filters required but sadly make above
not searchable failing:

`POST /my_index/_search`

```json
{
    "query": {
        "term": {
            "internalTags": "Review"
        }
    }
}
```

Expected: 1 Result

### Text Not Searchable and not Filterable (internalComment)

The `internalComment` field should not be searchable and not be filterable.

**Is not searchable ✅**

This works because of `doc_values: false`:

`POST /my_index/_search`

```json
{
    "query": {
        "query_string": {
            "query": "Internal Comment"
        }
    }
}
```

Expected: 0 Result

**Is not searchable ✅**

This works because of `doc_values: false`:

`POST /my_index/_search`

```json
{
    "query": {
        "term": {
            "internalComment": "Internal Comment"
        }
    }
}
```

Expected: 0 Result (error)

### Date Searchable & Filterable (published)

The `published` date should be searchable and filterable.

**Is searchable ✅**

This works like expected the field is `index: true` and `doc_values: true`:

`POST /my_index/_search`

```json
{
    "query": {
        "query_string": {
            "query": "2023"
        }
    }
}
```

Expected: 1 Result

**Is filterable ✅**

This works like expected the field is `index: true` and `doc_values: true`:

`POST /my_index/_search`

```json
{
    "query": {
        "term": {
            "published": "2023-01-01"
        }
    }
}
```

Expected: 1 Result

### Date Not Searchable but Filterable (created)

The `created` date should not be searchable and filterable.

**Is not searchable ❌**

This does not work like expected not sure how to make `created`
not searchable but filterable:

`POST /my_index/_search`

```json
{
    "query": {
        "query_string": {
            "query": "1999"
        }
    }
}
```

Expected: 0 Result

**Is filterable ✅**

Filterable works because of `index: true` and `doc_values: true` but it
is sadly still searchable what should not be the case:

`POST /my_index/_search`

```json
{
    "query": {
        "term": {
            "created": "1999-01-01"
        }
    }
}
```

Expected: 1 Result

### Date Not Searchable and not Filterable (internalComment)

The `changed` date should not be searchable and not be filterable.

**Is not searchable ✅**

Works because of `index: false` and `doc_values: false`:

`POST /my_index/_search`

```json
{
    "query": {
        "query_string": {
            "query": "2000"
        }
    }
}
```

Expected: 0 Result

**Is not filterable ✅**

Works because of `index: false` and `doc_values: false`:

`POST /my_index/_search`

```json
{
    "query": {
        "term": {
            "changed": "2000-01-01"
        }
    }
}
```

Expected: 0 Result (error)

> Filterable false is not so important as that can be handled programmatically to avoid the term query that fields.
