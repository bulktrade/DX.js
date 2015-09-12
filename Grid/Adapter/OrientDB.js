/**
 *
 * @param $orientDBService
 * @param className
 * @param options
 * @param successFunction
 * @param errorFunction
 * @constructor
 */
DX.Grid.Adapter.OrientDB = function($orientDBService, className, options, successFunction, errorFunction) {
    var instance = this;

    $orientDBService.schema(className,
        function(orientDBClassSchema, status, headers, config) {
            /**
             * Get Kendo UI Grid columns from OrientDB Class schema.
             *
             * @param {Object} columns
             * @param {Object} $translate
             *
             * @returns {Array}
             */
            instance.getColumns = function(columns, $translate) {
                var result = [];
                var column = null;

                for (var i = 0; i < orientDBClassSchema.properties.length; i++) {
                    var item = orientDBClassSchema.properties[i];

                    if (typeof item.custom != 'undefined') {

                    }
                }

                if (columns['checkbox']) {
                    column = {
                        title: '&nbsp;',
                        field: 'checkbox',
                        width: 45,
                        editable: false,
                        sortable: false,
                        editor: function(container, options) {
                            container.prev().hide();
                            container.hide();
                        },
                        template: '<input type="checkbox" class="checkbox">',
                        filterable: {
                            mode: 'row',
                            cell: {
                                template: function (args) {
                                    var checkbox = $('<input type="checkbox" class="checkbox checkbox-all" style="position: relative; left: 8px; top: 8px;">');
                                    args.element.replaceWith(checkbox);
                                },
                                attributes: {
                                    style: 'text-align: center; white-space: nowrap;'
                                },
                                showOperators: false
                            }
                        }
                    };

                    result.push(
                        DX.mergeObjects(column, columns['commands'])
                    );
                }

                if (columns['commands']) {
                    column = {
                        field: 'commands',
                        width: 90,
                        title: '&nbsp;',
                        filterable: false,
                        sortable: false,
                        attributes: {
                            style: 'text-align: center; white-space: nowrap;'
                        },
                        template: function() {
                            var result = '';

                            result += '<div class="k-grid-edit btn btn-sm btn-primary" ng-click="editActionClick($event)"><i class="fa fa-pencil-square-o"></i></div>';
                            result += '&nbsp;'
                            result += '<div class="k-grid-destroy btn btn-sm btn-danger" ng-click="destroyActionClick($event)"><i class="fa fa-trash-o"></i></div>';

                            return result;
                        },
                        editable: true,
                        editor: function(container, options) {
                            container.prev().hide();
                            container.hide();
                        }
                    };

                    result.push(
                        DX.mergeObjects(column, columns['commands'])
                    );
                }

                for (var columnName in columns) {
                    for (var i = 0; i < orientDBClassSchema.properties.length; i++) {
                        var item = orientDBClassSchema.properties[i];

                        if (item.name == columnName) {
                            column = new (function() {
                                this.field = item.name;
                                this.sortable = true;
                                this.filterable = true;
                                this.editable = true;
                                this.sortable = true;
                                this.validation = {};
                                this.title = $translate ? $translate.instant(orientDBClassSchema.name + '.' + item.name) : item.name;

                                this.set = function(name, value) {
                                    this[name] = value;
                                };
                            });

                            if (item.custom.validation) {
                                try {
                                    column.set('validation', JSON.parse(item.custom.validation));
                                } catch (e) {
                                    console.log('JSON Parse Error: ', e);
                                }
                            }

                            switch (item.type) {
                                case 'LINKSET':
                                    (function(item, column, $orientDBService, $) {
                                        var editorCallback = new (function() {
                                            this.callback = null;

                                            this.exec = function() {
                                                if (this.callback) {
                                                    this.callback.apply(this, arguments);
                                                }
                                            };

                                            this.set = function(name, value) {
                                                this[name] = value;
                                            };
                                        });

                                        column.set('editor', function(container, options) {
                                            editorCallback.exec(container, options);
                                        });

                                        $orientDBService.schema(
                                            item.linkedClass,
                                            function(classSchema, status, headers, config) {
                                                var relationTitle = "['@rid']";
                                                var originalRelationTitle = relationTitle;

                                                // SQL: ALTER PROPERTY MyTable.name CUSTOM relationTitle=true
                                                for (var i = 0; i < classSchema.properties.length; i++) {
                                                    if (typeof classSchema.properties[i].custom != 'undefined' && classSchema.properties[i].custom.relationTitle) {
                                                        relationTitle = classSchema.properties[i].name;
                                                        originalRelationTitle = relationTitle;

                                                        // SQL: ALTER PROPERTY MyTable.name CUSTOM translateTitle=true
                                                        if (classSchema.properties[i].custom.translateTitle) {
                                                            relationTitle = 'translated_' + relationTitle;
                                                        }

                                                        break;
                                                    }
                                                }

                                                editorCallback.set('callback', function(container, options) {
                                                    console.log('LINKSET: ', options.model);

                                                    var value = [];
                                                    if (options.model[options.field]) {
                                                        for (var i = 0; i < options.model[options.field].length; i++) {
                                                            value.push(options.model[options.field][i]['@rid']);
                                                        }
                                                    }

                                                    $('<input/>')
                                                        .appendTo(container)
                                                        .kendoMultiSelect({
                                                            dataTextField: relationTitle,
                                                            dataValueField: "['@rid']",
                                                            value: value,
                                                            dataSource: {
                                                                serverFiltering: true,
                                                                schema: {
                                                                    data: 'result',
                                                                    model: {
                                                                        id: "['@rid']"
                                                                    }
                                                                },
                                                                transport: {
                                                                    read: function(options) {
                                                                        var filter = '';

                                                                        if (options.data.filter && options.data.filter.filters.length) {
                                                                            var addFilter = '';

                                                                            for (var i = 0; i < options.data.filter.filters.length; i++) {
                                                                                if (options.data.filter.filters[0].value) {
                                                                                    var operator = '=';
                                                                                    var value = options.data.filter.filters[0].value;

                                                                                    switch (options.data.filter.filters[0].operator) {
                                                                                        case 'contains':
                                                                                            operator = 'LIKE';
                                                                                            value = '%' + value + '%';
                                                                                            break;
                                                                                    }

                                                                                    addFilter += (i ? ' AND' : '') + DX.sprintf('%s %s "%s"', originalRelationTitle, operator, value)
                                                                                }
                                                                            }

                                                                            if (addFilter !== '') {
                                                                                filter += ' WHERE ' + addFilter;
                                                                            }
                                                                        }

                                                                        var query = DX.sprintf('SELECT * FROM %s%s', item.linkedClass, filter);

                                                                        $orientDBService.query(
                                                                            query,
                                                                            options.take ? options.take : this.defaultPageSize,
                                                                            '*:-1',
                                                                            function(result) {
                                                                                $orientDBService.schema(
                                                                                    item.linkedClass,
                                                                                    function(classSchema, status, headers, config) {
                                                                                        // SQL: ALTER PROPERTY Table.column CUSTOM translateTitle=true
                                                                                        for (var i = 0; i < classSchema.properties.length; i++) {
                                                                                            if (typeof classSchema.properties[i].custom != 'undefined' && classSchema.properties[i].custom.translateTitle) {
                                                                                                for (var j = 0; j < result.result.length; j++) {
                                                                                                    if (result.result[j][classSchema.properties[i].name]) {
                                                                                                        result.result[j]['translated_' + classSchema.properties[i].name] = $translate.instant(item.linkedClass + '.' + result.result[j][classSchema.properties[i].name]);
                                                                                                    }
                                                                                                }
                                                                                            }
                                                                                        }

                                                                                        options.success(result);
                                                                                    },
                                                                                    function(data, status, headers, config) {
                                                                                        /**
                                                                                         * @todo Alert?
                                                                                         */
                                                                                        console.log(data, status, headers, config);
                                                                                        options.success(result);
                                                                                    });
                                                                            },
                                                                            function (result) {
                                                                                options.error(result);
                                                                            });
                                                                    }
                                                                }
                                                            },
                                                            filter: "contains",
                                                            suggest: true,
                                                            change: function(e) {
                                                                var items = angular.copy(this.dataItems());

                                                                for (var key in items) {
                                                                    if (relationTitle != "['@rid']") {
                                                                        delete items[key][relationTitle];
                                                                    }
                                                                }

                                                                options.model.set(options.field, items);
                                                            }
                                                        });
                                                });
                                            },
                                            function(data, status, headers, config) {
                                                /**
                                                 * @todo Alert?
                                                 */
                                                console.log(data, status, headers, config);
                                            });
                                    }(item, column, $orientDBService, $));
                                    break;
                                case 'LINK':
                                    (function(item, column, $orientDBService, $) {
                                        var editorCallback = new (function() {
                                            this.callback = null;

                                            this.exec = function() {
                                                if (this.callback) {
                                                    this.callback.apply(this, arguments);
                                                }
                                            };

                                            this.set = function(name, value) {
                                                this[name] = value;
                                            };
                                        });

                                        column.set('editor', function(container, options) {
                                            editorCallback.exec(container, options);
                                        });

                                        $orientDBService.schema(
                                            item.linkedClass,
                                            function(classSchema, status, headers, config) {
                                                var relationTitle = "['@rid']";
                                                var originalRelationTitle = relationTitle;

                                                // SQL: ALTER PROPERTY MyTable.name CUSTOM relationTitle=true
                                                for (var i = 0; i < classSchema.properties.length; i++) {
                                                    if (typeof classSchema.properties[i].custom != 'undefined' && classSchema.properties[i].custom.relationTitle) {
                                                        relationTitle = classSchema.properties[i].name;
                                                        originalRelationTitle = relationTitle;

                                                        if (classSchema.properties[i].custom.translateTitle) {
                                                            relationTitle = 'translated_' + relationTitle;
                                                        }

                                                        break;
                                                    }
                                                }

                                                editorCallback.set('callback', function(container, options) {
                                                    $('<input/>')
                                                        .appendTo(container)
                                                        .kendoComboBox({
                                                            dataTextField: relationTitle,
                                                            dataValueField: "['@rid']",
                                                            value: options.model[options.field] ? options.model[options.field]['@rid'] : null,
                                                            dataSource: {
                                                                serverFiltering: true,
                                                                schema: {
                                                                    data: 'result',
                                                                    model: {
                                                                        id: "['@rid']"
                                                                    }
                                                                },
                                                                transport: {
                                                                    read: function(options) {
                                                                        var filter = '';

                                                                        if (options.data.filter && options.data.filter.filters.length) {
                                                                            var addFilter = '';

                                                                            for (var i = 0; i < options.data.filter.filters.length; i++) {
                                                                                if (options.data.filter.filters[0].value) {
                                                                                    var operator = '=';
                                                                                    var value = options.data.filter.filters[0].value;

                                                                                    switch (options.data.filter.filters[0].operator) {
                                                                                        case 'contains':
                                                                                            operator = 'LIKE';
                                                                                            value = '%' + value + '%';
                                                                                            break;
                                                                                    }

                                                                                    addFilter += (i ? ' AND' : '') + DX.sprintf('%s %s "%s"', originalRelationTitle, operator, value)
                                                                                }
                                                                            }

                                                                            if (addFilter !== '') {
                                                                                filter += ' WHERE ' + addFilter;
                                                                            }
                                                                        }

                                                                        var query = DX.sprintf('SELECT * FROM %s%s', item.linkedClass, filter);

                                                                        $orientDBService.query(
                                                                            query,
                                                                            options.take ? options.take : this.defaultPageSize,
                                                                            '*:-1',
                                                                            function(result) {
                                                                                $orientDBService.schema(
                                                                                    item.linkedClass,
                                                                                    function(classSchema, status, headers, config) {
                                                                                        // SQL: ALTER PROPERTY Table.column CUSTOM translateTitle=true
                                                                                        for (var i = 0; i < classSchema.properties.length; i++) {
                                                                                            if (typeof classSchema.properties[i].custom != 'undefined' && classSchema.properties[i].custom.translateTitle) {
                                                                                                for (var j = 0; j < result.result.length; j++) {
                                                                                                    if (result.result[j][classSchema.properties[i].name]) {
                                                                                                        result.result[j]['translated_' + classSchema.properties[i].name] = $translate.instant(item.linkedClass + '.' + result.result[j][classSchema.properties[i].name]);
                                                                                                    }
                                                                                                }
                                                                                            }
                                                                                        }

                                                                                        options.success(result);
                                                                                    },
                                                                                    function(data, status, headers, config) {
                                                                                        /**
                                                                                         * @todo Alert?
                                                                                         */
                                                                                        console.log(data, status, headers, config);
                                                                                        options.success(result);
                                                                                    });
                                                                            },
                                                                            function (result) {
                                                                                options.error(result);
                                                                            });
                                                                    }
                                                                }
                                                            },
                                                            filter: "contains",
                                                            suggest: true,
                                                            select: function(e) {
                                                                var item = angular.copy(this.dataItem(e.item.index()));

                                                                if (relationTitle != "['@rid']") {
                                                                    delete item[relationTitle];
                                                                }

                                                                options.model.set(options.field, item);
                                                            }
                                                        });
                                                });
                                            },
                                            function(data, status, headers, config) {
                                                /**
                                                 * @todo Alert?
                                                 */
                                                console.log(data, status, headers, config);
                                            });
                                    }(item, column, $orientDBService, $));
                                    break;
                                case 'DATE':
                                    column.template = function(item) {
                                        return kendo.toString(item.created, 'd');
                                    };

                                    column.filterable = {
                                        ui: "datepicker" // use Kendo UI DateTimePicker
                                    };

                                    column.editor = function(container, options) {
                                        $('<input data-text-field="' + options.field + '" data-value-field="' + options.field + '" data-bind="value:' + options.field + '"/>')
                                            .appendTo(container)
                                            .kendoDatePicker();
                                    };

                                    break;
                                case 'DATETIME':
                                    column.template = function(item) {
                                        return kendo.toString(item.created, 'G');
                                    };

                                    column.filterable = {
                                        ui: "datetimepicker" // use Kendo UI DateTimePicker
                                    };

                                    column.editor = function(container, options) {
                                        $('<input data-text-field="' + options.field + '" data-value-field="' + options.field + '" data-bind="value:' + options.field + '"/>')
                                            .appendTo(container)
                                            .kendoDateTimePicker();
                                    };

                                    break;
                            }

                            if (columns[item.name]) {
                                column = DX.mergeObjects(column, columns[item.name]);
                            }

                            result.push(column);
                            break;
                        }
                    }
                }

                //if (selectColumns) {
                //    var tmp = result;
                //    result = [];
                //
                //    for (var i = 0; i < selectColumns.length; i++) {
                //        for (var j = 0; j < tmp.length; j++) {
                //            if (tmp[j].field == selectColumns[i]) {
                //                result.push(tmp[j]);
                //                break;
                //            }
                //        }
                //    }
                //}

                return result;
            };

            /**
             * Get Kendo UI Grid schema from OrientDB Class schema.
             *
             * @param {Object} defaults
             *
             * @returns {{data: null, total: null, errors: string, model: {id: string, fields: {}}}}
             */
            instance.getSchema = function(defaults) {
                var schema = {
                    data: 'result',
                    total: 'total',
                    errors: 'error',
                    model: {
                        id: "rid",
                        fields: {

                        }
                    }
                };

                for (var i = 0; i < orientDBClassSchema.properties.length; i++) {
                    var item = orientDBClassSchema.properties[i];
                    var fieldType = 'string';

                    switch (item.type) {
                        case 'INTEGER':
                        case 'SHORT':
                        case 'LONG':
                        case 'FLOAT':
                        case 'DOUBLE':
                        case 'BYTE':
                        case 'DECIMAL':
                            fieldType = 'number';
                            break;
                        case 'BOOLEAN':
                            fieldType = 'boolean';
                            break;
                        case 'LINK':
                            fieldType = 'link';
                            break;
                        case 'LINKSET':
                            fieldType = 'linkset';
                            break;
                        case 'DATE':
                        case 'DATETIME':
                            fieldType = 'date';
                            break;
                    }

                    schema.model.fields[item.name] = {
                        type: fieldType,
                        editable: true,
                        validation: {
                            required: item.mandatory
                        },
                        nullable: !item.notNull
                    };

                    if (item.min !== null) {
                        schema.model.fields[item.name].validation.min = item.min;
                    }

                    if (item.max !== null) {
                        schema.model.fields[item.name].validation.max = item.max;
                    }

                    if (item.regexp !== null) {
                        schema.model.fields[item.name].validation.pattern = item.regexp;
                    }

                    if (typeof item.custom != 'undefined') {
                        if (item.custom.validation) {
                            schema.model.fields[item.name].validation = DX.mergeObjects(schema.model.fields[item.name].validation, item.custom.validation);
                        }
                    }

                    if (defaults) {
                        schema.model.fields[item.name] = DX.mergeObjects(schema.model.fields[item.name], defaults[item.name]);
                    }
                }

                return schema;
            };

            /**
             * Get Kendo UI Grid Data Source.
             *
             * @param className
             * @param defaults
             * @returns {kendo.data.DataSource}
             */
            instance.getDataSource = function(className, defaults) {
                var columns = [];

                var dataSourceOptions = {
                    transport: {
                        read: function(options) {
                            var query = DX.sprintf('SELECT %s FROM %s', columns, className);

                            if (options.take) {
                                query.skip();
                            }

                            $orientDBService.query(
                                query,
                                options.take ? options.take : this.defaultPageSize,
                                '*:-1',
                                function(result) {
                                    for (var j = 0; j < result.result.length; j++) {
                                        result.result[j]['rid'] = result.result[j]['@rid'];

                                        for (var i = 0; i < orientDBClassSchema.properties.length; i++) {
                                            var item = orientDBClassSchema.properties[i];
                                            if (typeof item.custom != 'undefined' && item.custom.SHA256 && result.result[j][item.name]) {
                                                result.result[j]['$' + item.name] = result.result[j][item.name];
                                                result.result[j][item.name] = '';
                                            }
                                        }
                                    }

                                    $orientDBService.query(
                                        DX.sprintf('SELECT COUNT(*) FROM %s', className),
                                        options.take ? options.take : this.defaultPageSize,
                                        '*:0',
                                        function(countResult) {
                                            result['total'] = countResult.result[0]['COUNT'];
                                            options.success(result);
                                        },
                                        function(result) {
                                            options.error(result);
                                        }
                                    );
                                },
                                function (result) {
                                    options.error(result);
                                });
                        },
                        update: function(options) {
                            var items = angular.copy(options.data.models);
                            for (var key = 0; key < items.length; key++) {
                                items[key]['@class'] = orientDBClassSchema.name;
                                delete items[key]['rid'];

                                for (var i = 0; i < orientDBClassSchema.properties.length; i++) {
                                    var item = orientDBClassSchema.properties[i];

                                    // ALTER PROPERTY MyTable.name CUSTOM notUpdateIfEmpty=true
                                    // ALTER PROPERTY MyTable.name CUSTOM notUpdate=true
                                    if (typeof item.custom != 'undefined') {
                                        if (item.custom.notUpdateIfEmpty && item.custom.notUpdateIfEmpty != 'false' && !items[key][item.name]) {
                                            delete items[key][item.name];
                                        } else if (item.custom.notUpdate && item.custom.notUpdate != 'false') {
                                            delete items[key][item.name];
                                        }

                                        if (item.custom.SHA256 && item.custom.SHA256 != 'false') {
                                            if (!items[key][item.name] && typeof items[key]['$' + item.name] !== 'undefined') {
                                                items[key][item.name] = items[key]['$' + item.name];
                                            } else if (typeof jsSHA !== 'undefined') {
                                                // SQL: ALTER PROPERTY OUser.password CUSTOM SHA256=true
                                                var shaObj = new jsSHA("SHA-256", "TEXT");
                                                shaObj.update(items[key][item.name]);
                                                items[key][item.name] = '{SHA-256}' + shaObj.getHash("HEX").toUpperCase();
                                            }

                                            if (typeof items[key]['$' + item.name] !== 'undefined') {
                                                delete items[key]['$' + item.name];
                                            }

                                            options.data.models[key]['$' + item.name] = items[key][item.name];
                                            options.data.models[key][item.name] = '';
                                        }
                                    }

                                    switch (item.type) {
                                        case 'LINK':
                                            if (items[key][item.name]) {
                                                items[key][item.name] = items[key][item.name]['@rid'];
                                            }

                                            break;
                                        case 'DATETIME':
                                            items[key][item.name] = kendo.toString(items[key][item.name], 'yyyy-MM-dd HH:mm:ss');
                                            break;
                                        case 'LINKSET':
                                            if (items[key][item.name]) {
                                                var value = [];
                                                for (var k in items[key][item.name]) {
                                                    value.push(items[key][item.name][k]['@rid']);
                                                }

                                                items[key][item.name] = value;
                                            }

                                            break;
                                    }
                                }
                            }

                            $orientDBService.batchUpdate(
                                items,
                                function(data, status, headers, config) {
                                    for (var i = 0; i < data.result.length; i++) {
                                        for (var j = 0; j < options.data.models.length; j++) {
                                            if (data.result[i]['@rid'] == options.data.models[j]['@rid']) {
                                                options.data.models[j]['@version'] = data.result[i]['@version'];
                                            }
                                        }
                                    }
                                    console.log(data);
                                    options.success(options.data.models);
                                }, function(data, status, headers, config) {
                                    options.error(data);
                                });
                        },
                        destroy: function(options) {
                            var items = [];
                            for (var i = 0; i < options.data.models.length; i++) {
                                items.push({
                                    '@rid': options.data.models[i]['@rid']
                                });
                            }

                            $orientDBService.batchDelete(
                                items,
                                function(data, status, headers, config) {
                                    options.success({
                                        result: data
                                    });
                                }, function(data, status, headers, config) {
                                    console.log(data, status, headers, config);

                                    options.error(data);
                                });
                        },
                        create: function(options) {
                            var items = angular.copy(options.data.models);

                            for (var key = 0; key < items.length; key++) {
                                if (typeof items[key]["['@rid']"] != 'undefined') {
                                    delete items[key]["['@rid']"];
                                }

                                if (typeof items[key]['rid'] != 'undefined') {
                                    delete items[key]['rid'];
                                }

                                items[key]['@class'] = orientDBClassSchema.name;

                                for (var i = 0; i < orientDBClassSchema.properties.length; i++) {
                                    var item = orientDBClassSchema.properties[i];

                                    // SQL: ALTER PROPERTY OUser.password CUSTOM SHA256=true
                                    if (typeof item.custom !== 'undefined' && item.custom.SHA256 && typeof jsSHA !== 'undefined' && items[key][item.name]) {
                                        var shaObj = new jsSHA("SHA-256", "TEXT");
                                        shaObj.update(items[key][item.name]);
                                        items[key][item.name] = '{SHA-256}' + shaObj.getHash("HEX").toUpperCase();

                                        options.data.models[key]['$' + item.name] = items[key][item.name];
                                        options.data.models[key][item.name] = '';
                                    }

                                    switch (item.type) {
                                        case 'LINK':
                                            if (items[key][item.name]) {
                                                items[key][item.name] = items[key][item.name]['@rid'];
                                            }

                                            break;
                                        case 'LINKSET':
                                            if (items[key][item.name]) {
                                                var value = [];
                                                for (var k in items[key][item.name]) {
                                                    value.push(items[key][item.name][k]['@rid']);
                                                }

                                                items[key][item.name] = value;
                                            }

                                            break;
                                    }
                                }
                            }

                            $orientDBService.batchCreate(
                                items,
                                function(data, status, headers, config) {
                                    var compare = function(o1, o2) {
                                        for (var key in o1) {
                                            if (
                                                typeof o2[key] === 'undefined' ||
                                                (
                                                    o1[key] != o2[key] &&
                                                    typeof o2[key] == 'string' &&
                                                    o2[key].search('{SHA-256}') === -1
                                                )
                                            ) {
                                                return false;
                                            }
                                        }

                                        return true;
                                    };

                                    for (var i = 0; i < data.result.length; i++) {
                                        for (var j = 0; j < items.length; j++) {
                                            if (compare(items[j], data.result[i])) {
                                                options.data.models[j]["['@rid']"] = data.result[i]['@rid'];
                                                break;
                                            }
                                        }
                                    }

                                    options.success({
                                        result: options.data.models
                                    });
                                }, function(data, status, headers, config) {
                                    console.log(data, status, headers, config);

                                    options.error(data);
                                });
                        },
                        parameterMap: function(options, operation) {
                            //if (operation !== "read" && options.models) {
                            //    return kendo.stringify(options.models);
                            //} else {
                            //    options.sort = kendo.stringify(options.sort);
                            //    options.filter = kendo.stringify(options.filter);
                            //    --options.page;
                            //
                            //    return options;
                            //}

                            return options;
                        }
                    },
                    serverSorting: true,
                    batch: true,
                    pageSize: 20,
                    serverPaging: true,
                    serverFiltering: true,
                    autoSync: false,
                    schema: instance.getSchema(options.schemaDefaults)
                };

                return new kendo.data.DataSource(
                    DX.mergeObjects(dataSourceOptions, defaults)
                );
            };

            /**
             * Get grid options by OrientDB class schema.
             *
             * @param className
             * @param options
             * @param successFunction
             * @param errorFunction
             *
             * @returns {null|Object}
             */
            instance.getGridOptions = function(className, options, successFunction, errorFunction) {
                if (!options) {
                    options = {
                        columnDefaults: null,
                        columnOrder: null,
                        schemaDefaults: null,
                        dataSourceOptions: null,
                        translate: null,
                        defaults: null
                    };
                }

                var grid = {
                    dataSource: instance.getDataSource(
                        className,
                        options.dataSourceOptions
                    ),
                    height: DX.Grid.KendoUI.defaultHeight,
                    pageable: {
                        refresh: true,
                        pageSizes: true,
                        buttonCount: DX.Grid.KendoUI.defaultPageSize
                    },
                    filterable: {
                        mode: DX.Grid.KendoUI.defaultFilterableMode,
                        extra: false
                    },
                    sortable: {
                        mode: DX.Grid.KendoUI.defaultSortableMode,
                        allowUnsort: true
                    },
                    //detailInit: null,
                    //detailTemplate: DX.Grid.KendoUI.defaultDetailTemplate,
                    //detailExpand: null,
                    //dataBound: null,
                    edit: function(e) {
                        var popupWindow = e.container.data("kendoWindow");

                        if (!e.model.get('id')) {
                            popupWindow.title(options.translate.instant(DX.Grid.KendoUI.defaultPopupWindowCreateTitle));
                        } else {
                            popupWindow.title(options.translate.instant(DX.Grid.KendoUI.defaultPopupWindowUpdateTitle));
                        }

                        popupWindow.element.find(".k-grid-update").
                            removeClass('k-button').
                            removeClass('k-button-icontext').
                            removeClass('k-primary').
                            addClass('btn btn-sm btn-success').
                            html("<i class=\"fa fa-check\"></i> " + (!e.model.get('id') ? options.translate.instant(DX.Grid.KendoUI.defaultPopupWindowCreateButton) : options.translate.instant(DX.Grid.KendoUI.defaultPopupWindowUpdateButton)));

                        popupWindow.element.find(".k-grid-cancel").
                            removeClass('k-button').
                            removeClass('k-button-icontext').
                            addClass('btn btn-sm btn-danger').
                            html("<i class=\"fa fa-times\"></i> " + options.translate.instant(DX.Grid.KendoUI.defaultPopupWindowCancelButton));
                    },
                    dataBound: function() {
                        var grid = this;
                        this.checkedIds = {};

                        this.table.on('click', '.checkbox' , function(e) {
                            var checked = this.checked,
                                row = $(this).closest('tr'),
                                dataItem = grid.dataItem(row);

                            if (checked) {
                                grid.checkedIds[dataItem.id] = checked;
                            } else {
                                delete grid.checkedIds[dataItem.id];
                            }

                            if (checked) {
                                //-select the row
                                row.addClass('k-state-selected');
                            } else {
                                //-remove selection
                                row.removeClass('k-state-selected');
                            }
                        });

                        this.thead.on('click', '.checkbox-all' , function(e) {
                            var checked = this.checked;
                            if (checked) {
                                var items = grid.dataItems();
                                for (var i = 0; i < items.length; i++) {
                                    grid.checkedIds[items[i]['@rid']] = true;
                                }
                            } else {
                                grid.checkedIds = {};
                            }

                            var checkbox = grid.table.find('.checkbox');
                            checkbox.prop('checked', checked);

                            if (checked) {
                                //-select the row
                                checkbox.closest('tr').addClass('k-state-selected');
                            } else {
                                //-remove selection
                                checkbox.closest('tr').removeClass('k-state-selected');
                            }
                        });
                    },
                    allowCopy: {
                        delimeter: ';'
                    },
                    editable: 'popup',
                    //selectable: "multiple, row",
                    columns: instance.getColumns(
                        options.columnDefaults,
                        options.translate
                    )
                };

                successFunction(grid);

                return DX.mergeObjects(grid, options.defaults);
            };

            instance.getGridOptions(className, options, successFunction, errorFunction);
        },
        function(data, status, headers, config) {
            errorFunction({
                data: data,
                status: status,
                headers: headers,
                config: config
            });
        });
};