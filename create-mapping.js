var documents = [{
    "title": "Title",
    "tags": ["UI", "Tech"],
    "internalTags": ["Review", "Finished"],
    "internalComment": "Internal Comment",
    "created": "1999-01-01",
    "published": "2023-01-01",
}];

var customMapping = {
    title: { type: 'text', searchable: true, filterable: false },
    tags: { type: 'text', searchable: true, filterable: true },
    internalTags: { type: 'text', searchable: false, filterable: true },
    internalComment: { type: 'text', searchable: false, filterable: false },
    created: { type: 'date', searchable: false, filterable: true },
    published: { type: 'date', searchable: true, filterable: true },
}

var properties = {};

Object.keys(customMapping).forEach(function (key) {
    const field = customMapping[key];
    let fieldMapping = {};

    if (field.type === 'text') {
        if (field.searchable && !field.filterable) {
            fieldMapping = {
                "type": "text",
                "index": true,
            };
        } else if (field.searchable && field.filterable) {
            fieldMapping = {
                "type": "text",
                "index": true,
                "fields": {
                    "keyword": {
                        "type": 'keyword',
                        "index": true,
                        "doc_values": true,
                    }
                }
            };
        } else if (!field.searchable && field.filterable) {
            fieldMapping = {
                "type": "keyword",
                "index": true,
                "doc_values": true,
            };
        } else if (!field.searchable && !field.filterable) {
            fieldMapping = {
                "type": "keyword",
                "index": false,
                "doc_values": false,
            };
        } else {
            throw new Error('Invalid field mapping');
        }
    }

    if (field.type === 'date') {
        if (field.searchable && !field.filterable) {
            fieldMapping = {
                "type": "date",
                "index": true,
                "doc_values": false,
            };
        } else if (field.searchable && field.filterable) {
            fieldMapping = {
                "type": "date",
                "index": true,
                "doc_values": true,
            };
        } else if (!field.searchable && field.filterable) {
            fieldMapping = {
                "type": "date",
                "index": true,
                "doc_values": true,
            };
        } else if (!field.searchable && !field.filterable) {
            fieldMapping = {
                "type": "date",
                "index": false,
                "doc_values": false,
            };
        } else {
            throw new Error('Invalid field mapping');
        }
    }

    properties[key] = fieldMapping;
});

console.log(JSON.stringify({
    mappings: {
        properties: properties,
    }
}));
